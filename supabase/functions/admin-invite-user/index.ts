// Admin-only: create a new team member with a temporary password and pre-assigned role.
// The created user is flagged `must_change_password=true` so they're forced to set a new
// password on first sign-in.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendBlossomWelcomeEmail } from "../_shared/welcome-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role =
  | "admin"
  | "exec"
  | "ops_manager"
  | "intake"
  | "auth_team"
  | "qa"
  | "scheduling"
  | "staffing"
  | "clinic"
  | "finance"
  | "hr"
  | "phone_support"
  | "hr_admin"
  | "hr_manager"
  | "recruiting_assistant"
  | "payroll_admin"
  | "state_director"
  | "clinic_director"
  | "dept_manager"
  | "staff"
  | "viewer";

const VALID_ROLES: readonly Role[] = [
  "admin","exec","ops_manager","intake","auth_team","qa","scheduling",
  "staffing","clinic","finance","hr","phone_support",
  "hr_admin","hr_manager","recruiting_assistant","payroll_admin",
  "state_director","clinic_director","dept_manager",
  "staff","viewer",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing bearer token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify caller and check admin role using the anon client + user JWT
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const callerId = userData.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: isAdminData, error: roleErr } = await admin.rpc("has_role", {
    _user_id: callerId,
    _role: "admin",
  });
  if (roleErr || !isAdminData) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const email: string | undefined = body.email?.trim().toLowerCase();
  const displayName: string | undefined = body.displayName?.trim() || undefined;
  const siteUrl: string = typeof body.siteUrl === "string" && body.siteUrl.startsWith("http")
    ? body.siteUrl.replace(/\/$/, "")
    : "https://blossom-os.lovable.app";
  // Accept either `roles: string[]` (preferred, multi-role) or legacy single `role`.
  const incoming: unknown[] = Array.isArray(body.roles)
    ? body.roles
    : body.role
      ? [body.role]
      : ["staff"];
  const roles = incoming.filter((r): r is Role => typeof r === "string" && (VALID_ROLES as readonly string[]).includes(r));
  if (roles.length === 0) roles.push("staff");
  const primaryRole = roles[0];
  let tempPassword: string = body.tempPassword?.trim() || "";

  if (!email) {
    return new Response(JSON.stringify({ error: "Email is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!tempPassword) {
    // Generate a reasonable temp password (12 chars, letters/numbers/symbols)
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    tempPassword = Array.from(bytes).map((b) => alphabet[b % alphabet.length]).join("");
  }
  if (tempPassword.length < 8) {
    return new Response(JSON.stringify({ error: "Temporary password must be 8+ characters" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      invited_role: primaryRole,
      must_change_password: "true",
    },
  });

  if (createErr || !created.user) {
    return new Response(
      JSON.stringify({ error: createErr?.message ?? "Failed to create user" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const welcomeEmailResult = await sendWelcomeEmail({
    email,
    displayName,
    roles,
    tempPassword,
    loginUrl: `${siteUrl}/auth`,
  });

  const { error: logErr } = await admin.from("invite_email_logs").insert({
    recipient_email: email,
    status: welcomeEmailResult.status,
    resend_message_id: welcomeEmailResult.resendMessageId,
    error_message: welcomeEmailResult.errorMessage,
    roles,
    invited_user_id: created.user.id,
    created_by: callerId,
  });
  if (logErr) console.error("Failed to log invite email result", logErr.message);

  // Insert any additional roles beyond the primary one (which the trigger inserted).
  const extraRoles = roles.slice(1);
  if (extraRoles.length > 0) {
    await admin.from("user_roles").insert(
      extraRoles.map((r) => ({ user_id: created.user!.id, role: r })),
    );
  }

  // Best-effort: create a matching `employees` row so the new member appears in the
  // Team Directory, Org Chart, and any module that pulls from the live employee list.
  // We only insert when nothing exists yet for this user_id or email — admins can
  // edit clinic / state / department afterwards from the Team Admin panel.
  try {
    const { data: existingEmp } = await admin
      .from("employees")
      .select("id")
      .or(`user_id.eq.${created.user.id},email.eq.${email}`)
      .maybeSingle();
    if (!existingEmp) {
      const nameParts = (displayName ?? email.split("@")[0] ?? "Team Member")
        .split(/\s+/)
        .filter(Boolean);
      const firstName = nameParts[0] ?? "Team";
      const lastName = nameParts.slice(1).join(" ") || "Member";
      const jobTitle = roles
        .map((r) => r.replace(/_/g, " "))
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(", ") || "Team Member";
      const { error: empErr } = await admin.from("employees").insert({
        user_id: created.user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        job_title: jobTitle,
        state: "GA",
        status: "active",
        employment_type: "full_time",
        pay_type: "salaried",
        work_setting: "admin",
        hire_date: new Date().toISOString().slice(0, 10),
        start_date: new Date().toISOString().slice(0, 10),
      });
      if (empErr) console.error("Failed to seed employees row for invite", empErr.message);
    } else {
      // Link existing employee record (e.g. created earlier) to this auth user.
      await admin.from("employees").update({ user_id: created.user.id }).eq("id", existingEmp.id);
    }
  } catch (e) {
    console.error("employees seed/link threw", (e as Error).message);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      userId: created.user.id,
      email,
      roles,
      tempPassword,
      welcomeEmailSent: welcomeEmailResult.status === "sent",
      welcomeEmailStatus: welcomeEmailResult.status,
      welcomeEmailError: welcomeEmailResult.errorMessage,
      resendMessageId: welcomeEmailResult.resendMessageId,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendWelcomeEmail({
  email,
  displayName,
  roles,
  tempPassword,
  loginUrl,
}: {
  email: string;
  displayName?: string;
  roles: Role[];
  tempPassword: string;
  loginUrl: string;
}) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return {
      status: "skipped" as const,
      resendMessageId: null,
      errorMessage: "Resend connector credentials are not configured",
    };
  }

  const firstName = displayName?.split(" ").filter(Boolean)[0];
  const greeting = firstName ? `Welcome to Blossom, ${escapeHtml(firstName)}!` : "Welcome to Blossom!";
  const roleList = roles.map((role) => role.replace(/_/g, " ")).join(", ");
  const html = `
    <div style="margin:0;padding:0;background:#f6fbfc;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#18313a;">
      <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
        <div style="background:#ffffff;border:1px solid #dcebed;border-radius:18px;overflow:hidden;box-shadow:0 18px 44px rgba(57,153,170,0.14);">
          <div style="background:linear-gradient(135deg,#3999AA,#5bb7c6);padding:28px 30px;color:#ffffff;">
            <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.86;">Blossom ABA Therapy</div>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;font-weight:750;">${greeting}</h1>
            <p style="margin:10px 0 0;font-size:15px;line-height:1.55;opacity:0.92;">Your Blossom workspace is ready. We’re so glad to have you on the team.</p>
          </div>
          <div style="padding:28px 30px;">
            <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#31505a;">Use the details below to sign in for the first time. For security, you’ll be asked to create your own password right away.</p>
            <div style="border:1px solid #dcebed;border-radius:14px;background:#f8fcfd;padding:18px;margin:0 0 22px;">
              <div style="margin-bottom:12px;"><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#667f87;">Email</div><div style="font-size:15px;font-weight:650;color:#18313a;">${escapeHtml(email)}</div></div>
              <div style="margin-bottom:12px;"><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#667f87;">Temporary password</div><div style="font-family:'SFMono-Regular',Consolas,monospace;font-size:16px;font-weight:700;color:#18313a;">${escapeHtml(tempPassword)}</div></div>
              <div><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#667f87;">Role access</div><div style="font-size:14px;text-transform:capitalize;color:#31505a;">${escapeHtml(roleList)}</div></div>
            </div>
            <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#3999AA;color:#ffffff;text-decoration:none;border-radius:10px;padding:13px 18px;font-size:14px;font-weight:750;box-shadow:0 12px 26px rgba(57,153,170,0.25);">Sign in to Blossom</a>
            <p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#667f87;">Once you’re in, you’ll see your training, resources, and the tools connected to your role.</p>
            <p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#31505a;">Welcome aboard,<br /><strong>The Blossom team</strong></p>
          </div>
        </div>
      </div>
    </div>`;

  const response = await fetch(`${RESEND_GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [email],
      subject: "Welcome to Blossom — your workspace is ready",
      html,
    }),
  });

  const responseText = await response.text();
  let responseJson: { id?: string; message?: string; error?: string } | null = null;
  try {
    responseJson = responseText ? JSON.parse(responseText) : null;
  } catch (_) {
    responseJson = null;
  }

  if (!response.ok) {
    const errorMessage = responseJson?.message || responseJson?.error || responseText || `Resend returned ${response.status}`;
    console.error("Failed to send welcome email", response.status, errorMessage);
    return {
      status: "failed" as const,
      resendMessageId: responseJson?.id ?? null,
      errorMessage,
    };
  }

  return {
    status: "sent" as const,
    resendMessageId: responseJson?.id ?? null,
    errorMessage: null,
  };
}
