import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_EMAIL = "Blossom ABA Therapy <welcome@blossom.abacommandcenter.com>";

type Role =
  | "admin" | "exec" | "ops_manager" | "intake" | "auth_team" | "qa" | "scheduling"
  | "staffing" | "clinic" | "finance" | "hr" | "phone_support" | "hr_admin" | "hr_manager"
  | "recruiting_assistant" | "payroll_admin" | "state_director" | "clinic_director"
  | "dept_manager" | "staff" | "viewer";

const VALID_ROLES: readonly Role[] = [
  "admin", "exec", "ops_manager", "intake", "auth_team", "qa", "scheduling", "staffing", "clinic", "finance",
  "hr", "phone_support", "hr_admin", "hr_manager", "recruiting_assistant", "payroll_admin",
  "state_director", "clinic_director", "dept_manager", "staff", "viewer",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing bearer token" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Invalid session" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: isAdminData, error: roleErr } = await admin.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (roleErr || !isAdminData) return json({ error: "Admin access required" }, 403);

  const body = await req.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : undefined;
  const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() : undefined;
  const responsibilities = typeof body.responsibilities === "string" ? body.responsibilities.trim() : undefined;
  const siteUrl = typeof body.siteUrl === "string" && body.siteUrl.startsWith("http")
    ? body.siteUrl.replace(/\/$/, "")
    : "https://blossom-os.lovable.app";
  const roles = (Array.isArray(body.roles) ? body.roles : [])
    .filter((role): role is Role => typeof role === "string" && (VALID_ROLES as readonly string[]).includes(role));

  if (!userId || !email) return json({ error: "User and email are required" }, 400);

  const welcomeEmailResult = await sendWelcomeEmail({
    email,
    displayName,
    roles,
    loginUrl: `${siteUrl}/auth`,
    jobTitle,
    responsibilities,
  });

  await admin.from("invite_email_logs").insert({
    recipient_email: email,
    status: welcomeEmailResult.status,
    resend_message_id: welcomeEmailResult.resendMessageId,
    error_message: welcomeEmailResult.errorMessage,
    roles,
    invited_user_id: userId,
    created_by: userData.user.id,
  });

  if (welcomeEmailResult.status !== "sent") {
    return json({
      ok: false,
      error: welcomeEmailResult.errorMessage ?? "Resend did not confirm delivery",
      welcomeEmailStatus: welcomeEmailResult.status,
      resendMessageId: welcomeEmailResult.resendMessageId,
    }, 502);
  }

  const welcomeSentAt = new Date().toISOString();
  await admin.from("profiles").update({
    welcome_sent_at: welcomeSentAt,
    welcome_sent_by: userData.user.id,
  }).eq("user_id", userId);

  return json({ ok: true, welcomeSentAt, resendMessageId: welcomeEmailResult.resendMessageId });
});

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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
  loginUrl,
  jobTitle,
  responsibilities,
}: {
  email: string;
  displayName?: string;
  roles: Role[];
  loginUrl: string;
  jobTitle?: string;
  responsibilities?: string;
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
  const roleList = roles.length ? roles.map((role) => role.replace(/_/g, " ")).join(", ") : "team member";
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
            <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#31505a;">Use the details below to sign in to your Blossom workspace.</p>
            <div style="border:1px solid #dcebed;border-radius:14px;background:#f8fcfd;padding:18px;margin:0 0 22px;">
              <div style="margin-bottom:12px;"><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#667f87;">Email</div><div style="font-size:15px;font-weight:650;color:#18313a;">${escapeHtml(email)}</div></div>
              <div style="margin-bottom:${jobTitle || responsibilities ? "12px" : "0"};"><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#667f87;">Role access</div><div style="font-size:14px;text-transform:capitalize;color:#31505a;">${escapeHtml(roleList)}</div></div>
              ${jobTitle ? `<div style="margin-bottom:${responsibilities ? "12px" : "0"};"><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#667f87;">Title</div><div style="font-size:14px;color:#31505a;">${escapeHtml(jobTitle)}</div></div>` : ""}
              ${responsibilities ? `<div><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#667f87;">Focus area</div><div style="font-size:14px;color:#31505a;">${escapeHtml(responsibilities)}</div></div>` : ""}
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
    console.error("Failed to resend welcome email", response.status, errorMessage);
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