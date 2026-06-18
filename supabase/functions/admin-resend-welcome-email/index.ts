import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendBlossomWelcomeEmail } from "../_shared/welcome-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    : "https://blossom.abacommandcenter.com";
  const roles = (Array.isArray(body.roles) ? body.roles : [])
    .filter((role): role is Role => typeof role === "string" && (VALID_ROLES as readonly string[]).includes(role));

  if (!userId || !email) return json({ error: "User and email are required" }, 400);

  // Pre-check: if the most recent welcome to this address bounced or was marked
  // as spam, Resend (and most ESPs) will silently drop further sends until the
  // address is removed from the suppression list. Detect this and refuse with a
  // clear message instead of logging another "sent" row that never arrives.
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (LOVABLE_API_KEY && RESEND_API_KEY) {
    const { data: lastLog } = await admin
      .from("invite_email_logs")
      .select("resend_message_id")
      .eq("recipient_email", email)
      .not("resend_message_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastId = lastLog?.resend_message_id;
    if (lastId) {
      try {
        const r = await fetch(`https://connector-gateway.lovable.dev/resend/emails/${lastId}`, {
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
          },
        });
        const text = await r.text();
        const parsed = text ? JSON.parse(text) as { last_event?: string } : null;
        const lastEvent = parsed?.last_event;
        if (lastEvent === "bounced" || lastEvent === "complained") {
          return json({
            ok: false,
            suppressed: true,
            lastEvent,
            error: lastEvent === "bounced"
              ? `Resend reports the previous welcome email to ${email} hard-bounced. Verify the address is spelled correctly and remove it from the Resend Suppressions list before re-sending.`
              : `Resend reports the previous welcome email to ${email} was marked as spam. Confirm the recipient still wants the invite and remove the address from the Resend Suppressions list before re-sending.`,
          }, 409);
        }
      } catch (e) {
        console.error("Suppression pre-check failed (continuing)", (e as Error).message);
      }
    }
  }

  // Ensure first sign-in forces a password reset.
  await admin.from("profiles").update({ must_change_password: true }).eq("user_id", userId);

  // Send recipients straight to the sign-in page with their email pre-filled.
  // They use the temporary password from this email to sign in, then are
  // forced to create their own password. We avoid one-time magic links
  // because Microsoft 365 / Outlook Safe Links scanners consume them before
  // the recipient can click, causing "invalid or expired" errors.
  const signInUrl = `${siteUrl}/auth?email=${encodeURIComponent(email)}&welcome=1`;

  const welcomeEmailResult = await sendBlossomWelcomeEmail({
    email,
    displayName,
    roles,
    loginUrl: signInUrl,
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

