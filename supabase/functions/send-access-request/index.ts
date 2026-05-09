import { corsHeaders } from "@supabase/supabase-js/cors";

const ADMIN_RECIPIENTS = [
  "hr@blossomabatherapy.com",
  "cmack@blossomabatherapy.com",
];
const FROM_ADDRESS = "Blossom Academy <noreply@blossom.abacommandcenter.com>";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = String(body.name ?? "").trim();
    const role = String(body.role ?? "").trim();
    const clinic = String(body.clinic ?? "").trim();
    const email = String(body.email ?? "").trim();
    const note = String(body.note ?? "").trim();

    if (!name || !role || !clinic || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (name.length > 200 || role.length > 200 || clinic.length > 200 || email.length > 320 || note.length > 2000) {
      return new Response(JSON.stringify({ error: "Field too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif; background:#ffffff; padding:24px; color:#0f172a;">
        <div style="max-width:560px; margin:0 auto; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
          <div style="background:linear-gradient(135deg,#2B7BD5,#5BA9F2); padding:20px 24px; color:#ffffff;">
            <div style="font-size:12px; letter-spacing:.08em; text-transform:uppercase; opacity:.85;">Blossom Academy</div>
            <div style="font-size:20px; font-weight:600; margin-top:4px;">New access request</div>
          </div>
          <div style="padding:24px;">
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              <tr><td style="padding:8px 0; color:#64748b; width:120px;">Name</td><td style="padding:8px 0; font-weight:500;">${escapeHtml(name)}</td></tr>
              <tr><td style="padding:8px 0; color:#64748b;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(email)}" style="color:#2B7BD5; text-decoration:none;">${escapeHtml(email)}</a></td></tr>
              <tr><td style="padding:8px 0; color:#64748b;">Role</td><td style="padding:8px 0;">${escapeHtml(role)}</td></tr>
              <tr><td style="padding:8px 0; color:#64748b;">Clinic</td><td style="padding:8px 0;">${escapeHtml(clinic)}</td></tr>
              ${note ? `<tr><td style="padding:8px 0; color:#64748b; vertical-align:top;">Note</td><td style="padding:8px 0; white-space:pre-wrap;">${escapeHtml(note)}</td></tr>` : ""}
            </table>
            <p style="margin-top:24px; font-size:12px; color:#94a3b8;">Reply directly to this email to reach the requester.</p>
          </div>
        </div>
      </div>
    `;

    const text = `New Blossom Academy access request\n\nName: ${name}\nEmail: ${email}\nRole: ${role}\nClinic: ${clinic}${note ? `\nNote: ${note}` : ""}`;

    const resendRes = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: ADMIN_RECIPIENTS,
        reply_to: email,
        subject: `Access request — ${name} (${clinic})`,
        html,
        text,
      }),
    });

    const data = await resendRes.json().catch(() => ({}));
    if (!resendRes.ok) {
      console.error("Resend error", resendRes.status, data);
      return new Response(JSON.stringify({ error: "Failed to send", details: data }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data?.id ?? null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-access-request error", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});