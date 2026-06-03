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
    : "https://blossom.abacommandcenter.com";
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

  // Ensure the profile flag is set so first sign-in forces a password reset.
  await admin.from("profiles").update({ must_change_password: true }).eq("user_id", created.user.id);

  // Generate a one-click magic link so the recipient is signed in automatically
  // when they click "Sign in to Blossom" in the welcome email. The
  // ForcePasswordChange modal then prompts them to set their own password.
  let signInUrl = `${siteUrl}/auth`;
  try {
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${siteUrl}/` },
    });
    if (linkErr) {
      console.error("Failed to generate magic link for invite", linkErr.message);
    } else if (linkData?.properties?.action_link) {
      signInUrl = linkData.properties.action_link;
    }
  } catch (e) {
    console.error("generateLink threw for invite", (e as Error).message);
  }

  const welcomeEmailResult = await sendBlossomWelcomeEmail({
    email,
    displayName,
    roles,
    tempPassword,
    loginUrl: signInUrl,
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

