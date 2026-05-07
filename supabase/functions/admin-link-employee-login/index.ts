// Admin/HR-only: link an existing auth user (by email or user_id) to an
// employee record and notify the user via email that their login is now
// connected to Blossom OS.
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

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
  const callerId = userData.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: callerId, _role: "admin" });
  const { data: isHrAdmin } = await admin.rpc("has_role", { _user_id: callerId, _role: "hr_admin" });
  if (!isAdmin && !isHrAdmin) return json({ error: "Admin or HR Admin access required" }, 403);

  const body = await req.json().catch(() => ({}));
  const employeeId: string | undefined = body.employeeId;
  const targetEmailRaw: string | undefined = body.email;
  const targetUserId: string | undefined = body.userId;
  const notify: boolean = body.notify !== false;
  const siteUrl: string = typeof body.siteUrl === "string" && body.siteUrl.startsWith("http")
    ? body.siteUrl.replace(/\/$/, "")
    : "https://blossom-os.lovable.app";

  if (!employeeId) return json({ error: "employeeId is required" }, 400);
  if (!targetEmailRaw && !targetUserId) return json({ error: "Provide either email or userId" }, 400);

  const { data: employee, error: empErr } = await admin
    .from("employees")
    .select("id, email, first_name, last_name, user_id")
    .eq("id", employeeId)
    .maybeSingle();
  if (empErr || !employee) return json({ error: empErr?.message ?? "Employee not found" }, 404);

  // Resolve the target auth user.
  let resolvedUserId: string | null = null;
  let resolvedEmail: string | null = null;

  if (targetUserId) {
    const { data: u, error: uErr } = await admin.auth.admin.getUserById(targetUserId);
    if (uErr || !u.user) return json({ error: uErr?.message ?? "User not found" }, 404);
    resolvedUserId = u.user.id;
    resolvedEmail = (u.user.email ?? "").toLowerCase();
  } else {
    const email = targetEmailRaw!.trim().toLowerCase();
    if (!email) return json({ error: "Email is empty" }, 400);
    // Page through auth users to find a match.
    let found: { id: string; email?: string | null } | null = null;
    for (let page = 1; page <= 10 && !found; page++) {
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (listErr) return json({ error: listErr.message }, 400);
      const users = list?.users ?? [];
      found = users.find((u) => (u.email ?? "").toLowerCase() === email) ?? null;
      if (users.length < 200) break;
    }
    if (!found) return json({ error: `No Blossom OS login found for ${email}. Send them a sign-in link instead.` }, 404);
    resolvedUserId = found.id;
    resolvedEmail = (found.email ?? "").toLowerCase();
  }

  // Make sure this auth user isn't already linked to a different employee.
  const { data: conflict } = await admin
    .from("employees")
    .select("id, first_name, last_name")
    .eq("user_id", resolvedUserId!)
    .neq("id", employee.id)
    .maybeSingle();
  if (conflict) {
    return json({
      error: `That login is already linked to ${conflict.first_name ?? ""} ${conflict.last_name ?? ""}. Unlink them first.`.trim(),
    }, 409);
  }

  const { error: updErr } = await admin
    .from("employees")
    .update({ user_id: resolvedUserId, email: resolvedEmail ?? employee.email })
    .eq("id", employee.id);
  if (updErr) return json({ error: updErr.message }, 400);

  // Notify the user that their login is now linked.
  let emailSent = false;
  let emailError: string | null = null;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const notifyEmail = resolvedEmail ?? "";

  if (notify && notifyEmail && LOVABLE_API_KEY && RESEND_API_KEY) {
    const firstName = employee.first_name?.split(" ")[0] ?? "";
    const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,";
    const safeUrl = escapeHtml(`${siteUrl}/auth`);
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Your Blossom OS account is linked</title></head>
<body style="margin:0;padding:0;background:#f4f7fb;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);border:1px solid #e6edf5;">
      <tr><td style="padding:32px 36px 0;">
        <div style="font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#2B7BD5;">Blossom ABA Therapy</div>
      </td></tr>
      <tr><td style="padding:18px 36px 8px;">
        <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">Your account is linked</h1>
        <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:#475569;">${greeting} HR has connected your Blossom OS login to your employee record. You now have access to Operations Academy, the Resource Hub, and your personal dashboard.</p>
      </td></tr>
      <tr><td align="center" style="padding:24px 36px 8px;">
        <a href="${safeUrl}" style="display:inline-block;background:#2B7BD5;color:#ffffff;text-decoration:none;border-radius:10px;padding:13px 24px;font-size:15px;font-weight:600;box-shadow:0 6px 18px rgba(43,123,213,0.28);">Open Blossom OS</a>
      </td></tr>
      <tr><td style="padding:24px 36px 32px;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">If you weren't expecting this, please reach out to HR right away.</p>
        <hr style="border:none;border-top:1px solid #e6edf5;margin:18px 0;" />
        <p style="margin:0;font-size:14px;line-height:1.6;color:#0f172a;">— The Blossom Team</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
    const text = [
      greeting,
      "",
      "HR has linked your Blossom OS login to your employee record. You now have access to Operations Academy, the Resource Hub, and your personal dashboard.",
      "",
      `Open Blossom OS: ${siteUrl}/auth`,
      "",
      "If you weren't expecting this, please contact HR.",
      "",
      "— The Blossom Team",
    ].join("\n");

    try {
      const resp = await fetch(`${RESEND_GATEWAY_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [notifyEmail],
          subject: "Your Blossom OS account is linked",
          html,
          text,
        }),
      });
      const t = await resp.text();
      if (!resp.ok) {
        let parsed: { message?: string; error?: string } | null = null;
        try { parsed = t ? JSON.parse(t) : null; } catch { /* noop */ }
        emailError = parsed?.message ?? parsed?.error ?? t ?? `Resend ${resp.status}`;
      } else {
        emailSent = true;
      }
    } catch (e) {
      emailError = (e as Error).message;
    }
  } else if (notify && (!LOVABLE_API_KEY || !RESEND_API_KEY)) {
    emailError = "Email service is not configured";
  }

  return json({
    ok: true,
    userId: resolvedUserId,
    email: resolvedEmail,
    emailSent,
    emailError,
  });
});