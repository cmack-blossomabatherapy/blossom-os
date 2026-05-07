// TEMP: one-off test sender for the activation email template.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(v: string) {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

Deno.serve(async (_req) => {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
  const magicLink = "https://blossom-os.lovable.app/auth?token=PREVIEW_ONLY";
  const greeting = "Welcome, Corey!";
  const safeLink = escapeHtml(magicLink);
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Activate your Blossom account</title></head>
<body style="margin:0;padding:0;background:#f4f7fb;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Activate your Blossom account and set your password.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);border:1px solid #e6edf5;">
      <tr><td style="padding:32px 36px 0;"><div style="font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#2B7BD5;">Blossom ABA Therapy</div></td></tr>
      <tr><td style="padding:18px 36px 8px;">
        <h1 style="margin:0;font-size:26px;line-height:1.25;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">${greeting}</h1>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#475569;">Your Blossom OS account is ready. Use the secure link below to sign in for the first time and finish setting up your account.</p>
      </td></tr>
      <tr><td align="center" style="padding:28px 36px 8px;">
        <a href="${safeLink}" style="display:inline-block;background:#2B7BD5;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 26px;font-size:15px;font-weight:600;box-shadow:0 6px 18px rgba(43,123,213,0.28);">Activate my account</a>
      </td></tr>
      <tr><td style="padding:8px 36px 0;"><p style="margin:16px 0 0;font-size:13px;line-height:1.55;color:#64748b;">Or paste this link into your browser:<br /><a href="${safeLink}" style="color:#2B7BD5;word-break:break-all;">${safeLink}</a></p></td></tr>
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
      <tr><td style="padding:24px 36px 0;"><p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">🔒 This link expires in 1 hour and can only be used once. If it expires, ask your admin to send a new one. If you weren't expecting this email, you can safely ignore it.</p></td></tr>
      <tr><td style="padding:28px 36px 32px;"><hr style="border:none;border-top:1px solid #e6edf5;margin:0 0 20px;" /><p style="margin:0;font-size:14px;line-height:1.6;color:#0f172a;">Welcome aboard,<br /><strong>The Blossom Team</strong></p><p style="margin:14px 0 0;font-size:12px;color:#94a3b8;">Blossom ABA Therapy · This is an automated message from Blossom OS.</p></td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const r = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "Blossom ABA Therapy <welcome@blossom.abacommandcenter.com>",
      to: ["cmack@blossomabatherapy.com"],
      subject: "[TEST] Activate your Blossom OS account",
      html,
    }),
  });
  const text = await r.text();
  return new Response(JSON.stringify({ status: r.status, body: text }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});