import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_EMAIL = "Blossom Evaluations <evaluations@blossom.abacommandcenter.com>";
const REPLY_TO = "hr@blossom.abacommandcenter.com";

type Body = { id?: string; ids?: string[]; limit?: number };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return json({ error: "Resend connector is not configured" }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const body = (await req.json().catch(() => ({}))) as Body;

  // Pick targets: explicit ids or queued + due
  let query = supabase
    .from("evaluation_emails")
    .select("id, recipient_email, subject, body, email_type, status, scheduled_send_at")
    .in("status", ["Queued", "Draft"]);

  if (body.id) query = query.eq("id", body.id);
  else if (body.ids?.length) query = query.in("id", body.ids);
  else query = query.or(`scheduled_send_at.is.null,scheduled_send_at.lte.${new Date().toISOString()}`).limit(body.limit ?? 25);

  const { data: rows, error } = await query;
  if (error) return json({ error: error.message }, 500);
  if (!rows?.length) return json({ ok: true, processed: 0 });

  let sent = 0, failed = 0;
  for (const row of rows) {
    const recipient = row.recipient_email?.trim().toLowerCase();
    if (!recipient || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)) {
      await supabase.from("evaluation_emails").update({
        status: "Failed", failed_reason: "Invalid recipient email",
      }).eq("id", row.id);
      failed++; continue;
    }
    try {
      const res = await fetch(`${RESEND_GATEWAY_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [recipient],
          reply_to: REPLY_TO,
          subject: row.subject || "Blossom Evaluations",
          html: renderEmail(row.subject || "Blossom Evaluations", row.body || ""),
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        await supabase.from("evaluation_emails").update({
          status: "Failed", failed_reason: `Resend ${res.status}: ${detail.slice(0, 400)}`,
        }).eq("id", row.id);
        failed++;
      } else {
        await supabase.from("evaluation_emails").update({
          status: "Sent", sent_at: new Date().toISOString(), failed_reason: null,
        }).eq("id", row.id);
        sent++;
      }
    } catch (e) {
      await supabase.from("evaluation_emails").update({
        status: "Failed", failed_reason: String((e as Error).message ?? e).slice(0, 400),
      }).eq("id", row.id);
      failed++;
    }
  }

  return json({ ok: true, processed: rows.length, sent, failed });
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(v = "") {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function renderEmail(subject: string, body: string) {
  // body is plain text (with {{vars}} already substituted by the queueing code).
  // Preserve line breaks, convert URLs to links.
  const escaped = escapeHtml(body).replace(/\r?\n/g, "<br/>");
  const linked = escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#2B7BD5;text-decoration:none;font-weight:600;">$1</a>');
  return `
  <div style="margin:0;padding:0;background:#f6fbfc;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#18313a;">
    <div style="max-width:660px;margin:0 auto;padding:34px 18px;">
      <div style="background:#ffffff;border:1px solid #dcebed;border-radius:20px;overflow:hidden;box-shadow:0 20px 52px rgba(43,123,213,0.12);">
        <div style="padding:26px 30px 18px;text-align:center;background:#ffffff;">
          <div style="font-size:18px;font-weight:800;color:#2B7BD5;letter-spacing:-0.01em;">Blossom ABA Therapy</div>
        </div>
        <div style="background:linear-gradient(135deg,#2B7BD5,#5DA8E8);padding:26px 30px;color:#ffffff;">
          <div style="display:inline-block;border-radius:999px;background:rgba(255,255,255,0.18);padding:5px 10px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;">Evaluations</div>
          <h1 style="margin:14px 0 0;font-size:24px;line-height:1.2;font-weight:800;">${escapeHtml(subject)}</h1>
        </div>
        <div style="padding:28px 30px;font-size:15px;line-height:1.7;color:#31505a;">
          ${linked}
        </div>
        <div style="padding:18px 30px 26px;border-top:1px solid #eef4f6;font-size:12px;color:#8aa0a8;text-align:center;">
          Blossom ABA Therapy · Operations Command Center<br/>
          Replies go to <a href="mailto:hr@blossom.abacommandcenter.com" style="color:#2B7BD5;text-decoration:none;">hr@blossom.abacommandcenter.com</a>
        </div>
      </div>
    </div>
  </div>`;
}