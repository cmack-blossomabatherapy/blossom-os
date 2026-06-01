// Shared, brand-polished Blossom welcome email used by both
// `admin-invite-user` and `admin-resend-welcome-email`.
//
// Renders the official Blossom ABA Therapy logo at the top, a soft
// gradient header, a clean credentials card, and a single CTA.

const LOGO_URL =
  "https://uvkhjfjknnndunxcdbel.supabase.co/storage/v1/object/public/email-assets/blossom-logo.png";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface WelcomeEmailInput {
  email: string;
  displayName?: string;
  roles: string[];
  loginUrl: string;
  /** When provided, includes a Temporary password row in the credentials card. */
  tempPassword?: string;
  jobTitle?: string;
  responsibilities?: string;
}

export function renderWelcomeEmail(input: WelcomeEmailInput): { subject: string; html: string; text: string } {
  const { email, displayName, roles, loginUrl, tempPassword, jobTitle, responsibilities } = input;
  const firstName = displayName?.split(/\s+/).filter(Boolean)[0];
  const greetingName = firstName ? `, ${escapeHtml(firstName)}` : "";
  const roleList = roles.length
    ? roles.map((r) => r.replace(/_/g, " ")).map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(", ")
    : "Team Member";

  const subject = "Welcome to Blossom — your workspace is ready";

  const credentialsRows = [
    row("Email", escapeHtml(email)),
    tempPassword ? row("Temporary password", `<span style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:15px;letter-spacing:0.4px;">${escapeHtml(tempPassword)}</span>`) : "",
    row("Role access", `<span style="text-transform:capitalize;">${escapeHtml(roleList)}</span>`),
    jobTitle ? row("Title", escapeHtml(jobTitle)) : "",
    responsibilities ? row("Focus area", escapeHtml(responsibilities)) : "",
  ].filter(Boolean).join("");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f7f8;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#18313a;-webkit-font-smoothing:antialiased;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:1px;line-height:1px;mso-hide:all;">Your Blossom workspace is ready${greetingName}. Sign in to get started.</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f7f8;">
      <tr><td align="center" style="padding:36px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 24px 60px rgba(57,153,170,0.18);">
          <!-- Logo header -->
          <tr><td align="center" style="padding:40px 30px 16px;background:#ffffff;">
            <img src="${LOGO_URL}" alt="Blossom ABA Therapy" width="240" style="display:block;width:240px;max-width:65%;height:auto;border:0;outline:none;text-decoration:none;" />
          </td></tr>
          <!-- Solid teal hero (bulletproof across light/dark mode + Outlook) -->
          <tr><td bgcolor="#3999AA" style="padding:28px 36px 32px;background-color:#3999AA;background-image:linear-gradient(135deg,#3999AA 0%,#5bb7c6 60%,#7cd0d8 100%);color:#ffffff;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#ffffff;opacity:0.92;mso-line-height-rule:exactly;">Welcome to the team</div>
            <h1 style="margin:10px 0 0;font-size:30px;line-height:1.2;font-weight:750;color:#ffffff;letter-spacing:-0.3px;mso-line-height-rule:exactly;">Welcome to Blossom OS${greetingName}!</h1>
            <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#ffffff;mso-line-height-rule:exactly;">Your operational home for everything Blossom — training, workflows, schedules, and the people who'll help you thrive.</p>
          </td></tr>
          <!-- Body -->
          <tr><td style="padding:32px 36px 12px;">
            <h2 style="margin:0 0 6px;font-size:18px;font-weight:700;color:#18313a;letter-spacing:-0.2px;">Your sign-in details</h2>
            <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#5b757e;">Use the details below to access your Blossom OS workspace${tempPassword ? ". For security, you'll create your own password and set up two-factor authentication the first time you sign in." : "."}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #dcebed;border-radius:14px;background:#f8fcfd;margin:0 0 26px;">
              <tr><td style="padding:18px 20px;">${credentialsRows}</td></tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:12px;background:#3999AA;box-shadow:0 14px 30px rgba(57,153,170,0.32);">
              <a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;letter-spacing:0.2px;">Sign in to Blossom OS →</a>
            </td></tr></table>
          </td></tr>
          <!-- What to expect -->
          <tr><td style="padding:8px 36px 4px;">
            <div style="height:1px;background:#e3eef0;margin:18px 0 22px;"></div>
            <h2 style="margin:0 0 14px;font-size:18px;font-weight:700;color:#18313a;letter-spacing:-0.2px;">What happens next</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${step("1", "Sign in & secure your account", "Create your password and turn on two-factor authentication.")}
              ${step("2", "Start with Week 1, Day 1 onboarding", "A short welcome from leadership and a tour of who we are.")}
              ${step("3", "Explore your role workspace", "Your menu, tools, and reports are tailored to your role.")}
            </table>
          </td></tr>
          <!-- Support -->
          <tr><td style="padding:18px 36px 4px;">
            <div style="border:1px solid #dcebed;border-radius:14px;background:#f8fcfd;padding:18px 20px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#7a949c;margin-bottom:6px;">Need a hand?</div>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#31505a;">Reply to this email and a real person on the Blossom team will help — usually within a few hours during business days.</p>
            </div>
          </td></tr>
          <!-- Sign-off -->
          <tr><td style="padding:8px 36px 36px;">
            <p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#31505a;">Welcome aboard,<br/><strong style="color:#18313a;">The Blossom Team</strong></p>
          </td></tr>
          <!-- Footer -->
          <tr><td style="padding:22px 36px 30px;background:#f8fcfd;border-top:1px solid #e3eef0;">
            <p style="margin:0;font-size:11px;line-height:1.6;color:#8aa2aa;text-align:center;letter-spacing:0.2px;">
              Blossom ABA Therapy · Helping every child blossom.<br/>
              Serving Georgia, North Carolina, Tennessee, Virginia & Maryland.<br/>
              You received this email because an account was created for you in Blossom OS. This message may contain confidential information.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const textLines = [
    `Welcome to Blossom${firstName ? `, ${firstName}` : ""}!`,
    "",
    "Your Blossom workspace is ready. Sign in below to get started.",
    "",
    `Email: ${email}`,
    tempPassword ? `Temporary password: ${tempPassword}` : "",
    `Role access: ${roleList}`,
    jobTitle ? `Title: ${jobTitle}` : "",
    responsibilities ? `Focus area: ${responsibilities}` : "",
    "",
    `Sign in: ${loginUrl}`,
    tempPassword ? "You'll be asked to create your own password the first time you sign in." : "",
    "",
    "Welcome aboard,",
    "The Blossom team",
  ].filter(Boolean).join("\n");

  return { subject, html, text: textLines };
}

function row(label: string, value: string) {
  return `<div style="display:flex;flex-direction:column;padding:8px 0;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7a949c;margin-bottom:4px;">${label}</div>
    <div style="font-size:15px;font-weight:600;color:#18313a;line-height:1.4;">${value}</div>
  </div>`;
}

function step(num: string, title: string, body: string) {
  return `<tr><td style="padding:0 0 14px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td width="36" valign="top" style="width:36px;">
        <div style="width:28px;height:28px;border-radius:14px;background:#e6f4f6;color:#2f7d8c;font-size:13px;font-weight:700;line-height:28px;text-align:center;">${num}</div>
      </td>
      <td valign="top" style="padding-left:4px;">
        <div style="font-size:15px;font-weight:650;color:#18313a;line-height:1.35;">${title}</div>
        <div style="font-size:13px;color:#5b757e;line-height:1.55;margin-top:2px;">${body}</div>
      </td>
    </tr></table>
  </td></tr>`;
}

export const FROM_EMAIL = "Blossom ABA Therapy <welcome@blossom.abacommandcenter.com>";
export const RESEND_GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

export interface SendResult {
  status: "sent" | "failed" | "skipped";
  resendMessageId: string | null;
  errorMessage: string | null;
}

export async function sendBlossomWelcomeEmail(input: WelcomeEmailInput): Promise<SendResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return { status: "skipped", resendMessageId: null, errorMessage: "Resend connector credentials are not configured" };
  }
  const { subject, html, text } = renderWelcomeEmail(input);
  const response = await fetch(`${RESEND_GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [input.email], subject, html, text }),
  });
  const responseText = await response.text();
  let body: { id?: string; message?: string; error?: string } | null = null;
  try { body = responseText ? JSON.parse(responseText) : null; } catch { body = null; }
  if (!response.ok) {
    const errorMessage = body?.message || body?.error || responseText || `Resend returned ${response.status}`;
    console.error("Welcome email send failed", response.status, errorMessage);
    return { status: "failed", resendMessageId: body?.id ?? null, errorMessage };
  }
  return { status: "sent", resendMessageId: body?.id ?? null, errorMessage: null };
}