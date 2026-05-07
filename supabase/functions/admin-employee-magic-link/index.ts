// Admin-only: ensure an auth user exists for an employee and email them a
// magic link. On first sign-in the user is forced to set a password
// (must_change_password=true is set when we create the user).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_EMAIL = "Blossom ABA Therapy <welcome@blossom.abacommandcenter.com>";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing bearer token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const callerId = userData.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: callerId, _role: "admin" });
  const { data: hasHrAdmin } = await admin.rpc("has_role", { _user_id: callerId, _role: "hr_admin" });
  if (!isAdmin && !hasHrAdmin) {
    return new Response(JSON.stringify({ error: "Admin or HR Admin access required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const employeeId: string | undefined = body.employeeId;
  const skipEmail: boolean = body.skipEmail === true;
  const siteUrl: string = typeof body.siteUrl === "string" && body.siteUrl.startsWith("http")
    ? body.siteUrl.replace(/\/$/, "")
    : "https://blossom-os.lovable.app";

  if (!employeeId) {
    return new Response(JSON.stringify({ error: "employeeId is required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: employee, error: empErr } = await admin
    .from("employees")
    .select("id, email, first_name, last_name, user_id")
    .eq("id", employeeId)
    .maybeSingle();
  if (empErr || !employee) {
    return new Response(JSON.stringify({ error: empErr?.message ?? "Employee not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const email = (employee.email ?? "").trim().toLowerCase();
  if (!email) {
    return new Response(JSON.stringify({ error: "This employee has no email on file." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let userId: string | null = employee.user_id ?? null;
  let createdAccount = false;

  if (!userId) {
    // Try to find an existing auth user with that email first.
    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = existing?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
    if (found) {
      userId = found.id;
    } else {
      const tempBytes = new Uint8Array(16);
      crypto.getRandomValues(tempBytes);
      const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
      const tempPassword = Array.from(tempBytes).map((b) => alphabet[b % alphabet.length]).join("");

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          display_name: `${employee.first_name} ${employee.last_name}`.trim(),
          invited_role: "staff",
          must_change_password: "true",
        },
      });
      if (createErr || !created.user) {
        return new Response(JSON.stringify({ error: createErr?.message ?? "Failed to create auth user" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = created.user.id;
      createdAccount = true;
    }

    await admin.from("employees").update({ user_id: userId }).eq("id", employee.id);
  }

  if (skipEmail) {
    return new Response(JSON.stringify({ ok: true, userId, createdAccount, emailSent: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Generate a magic link the user can click to sign in.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${siteUrl}/auth` },
  });
  if (linkErr || !linkData?.properties?.action_link) {
    return new Response(JSON.stringify({ error: linkErr?.message ?? "Failed to generate magic link" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const magicLink = linkData.properties.action_link;

  // Always require password set on next sign-in.
  await admin.from("profiles").update({ must_change_password: true }).eq("user_id", userId);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return new Response(JSON.stringify({
      ok: true, userId, createdAccount, magicLink,
      emailSent: false, emailError: "Email service is not configured",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const firstName = employee.first_name?.split(" ")[0] ?? "";
  const greeting = firstName ? `Welcome, ${escapeHtml(firstName)}!` : "Welcome to Blossom!";
  const safeLink = escapeHtml(magicLink);
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Activate your Blossom account</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Activate your Blossom account and set your password.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);border:1px solid #e6edf5;">
      <tr><td style="padding:32px 36px 0;">
        <div style="font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#2B7BD5;">Blossom ABA Therapy</div>
      </td></tr>
      <tr><td style="padding:18px 36px 8px;">
        <h1 style="margin:0;font-size:26px;line-height:1.25;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">${greeting}</h1>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#475569;">Your Blossom OS account is ready. Use the secure link below to sign in for the first time and finish setting up your account.</p>
      </td></tr>
      <tr><td align="center" style="padding:28px 36px 8px;">
        <a href="${safeLink}" style="display:inline-block;background:#2B7BD5;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 26px;font-size:15px;font-weight:600;box-shadow:0 6px 18px rgba(43,123,213,0.28);">Activate my account</a>
      </td></tr>
      <tr><td style="padding:8px 36px 0;">
        <p style="margin:16px 0 0;font-size:13px;line-height:1.55;color:#64748b;">Or paste this link into your browser:<br />
          <a href="${safeLink}" style="color:#2B7BD5;word-break:break-all;">${safeLink}</a>
        </p>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="background:#f8fafc;border:1px solid #e6edf5;border-radius:14px;padding:20px 22px;">
          <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0f172a;">What happens next</div>
          <ol style="margin:12px 0 0;padding-left:20px;color:#334155;font-size:14px;line-height:1.7;">
            <li><strong>Click “Activate my account”</strong> above to sign in securely.</li>
            <li><strong>Create your password</strong> — you'll be prompted to set one on first sign-in.</li>
            <li><strong>Complete your profile</strong> and review your dashboard in Blossom OS.</li>
            <li><strong>Reach out to HR</strong> if anything looks off or you need help.</li>
          </ol>
        </div>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
          🔒 This link expires in 1 hour and can only be used once. If it expires, ask your admin to send a new one. If you weren't expecting this email, you can safely ignore it.
        </p>
      </td></tr>
      <tr><td style="padding:28px 36px 32px;">
        <hr style="border:none;border-top:1px solid #e6edf5;margin:0 0 20px;" />
        <p style="margin:0;font-size:14px;line-height:1.6;color:#0f172a;">Welcome aboard,<br /><strong>The Blossom Team</strong></p>
        <p style="margin:14px 0 0;font-size:12px;color:#94a3b8;">Blossom ABA Therapy · This is an automated message from Blossom OS.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
  const textBody = [
    greeting.replace(/!$/, ""),
    "",
    "Your Blossom OS account is ready. Use the link below to sign in and finish setting up your account.",
    "",
    `Activate your account: ${magicLink}`,
    "",
    "What happens next:",
    "1. Click the link above to sign in securely.",
    "2. Create your password — you'll be prompted to set one on first sign-in.",
    "3. Complete your profile and review your Blossom OS dashboard.",
    "4. Reach out to HR if anything looks off or you need help.",
    "",
    "This link expires in 1 hour and can only be used once.",
    "",
    "Welcome aboard,",
    "The Blossom Team",
  ].join("\n");

  const response = await fetch(`${RESEND_GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: FROM_EMAIL, to: [email],
      subject: "Activate your Blossom OS account",
      html,
      text: textBody,
    }),
  });
  const text = await response.text();
  let json: { id?: string; message?: string; error?: string } | null = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) { json = null; }

  if (!response.ok) {
    return new Response(JSON.stringify({
      ok: true, userId, createdAccount, magicLink,
      emailSent: false, emailError: json?.message ?? json?.error ?? text ?? `Resend ${response.status}`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({
    ok: true, userId, createdAccount, magicLink,
    emailSent: true, resendMessageId: json?.id ?? null,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});