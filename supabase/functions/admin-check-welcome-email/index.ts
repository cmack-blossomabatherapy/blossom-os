import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: isAdminData, error: roleErr } = await admin.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (roleErr || !isAdminData) return json({ error: "Admin access required" }, 403);

  const body = await req.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!userId && !email) return json({ error: "User or email is required" }, 400);

  let query = admin
    .from("invite_email_logs")
    .select("created_at, status, resend_message_id, error_message, recipient_email")
    .order("created_at", { ascending: false })
    .limit(1);
  query = userId ? query.eq("invited_user_id", userId) : query.eq("recipient_email", email);
  const { data: logs, error: logErr } = await query;
  if (logErr) return json({ error: logErr.message }, 500);
  const log = logs?.[0] ?? null;

  let provider = null;
  let providerError: string | null = null;
  if (log?.resend_message_id) {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      providerError = "Resend connector credentials are not configured";
    } else {
      const response = await fetch(`https://connector-gateway.lovable.dev/resend/emails/${log.resend_message_id}`, {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
      });
      const text = await response.text();
      let parsed: Record<string, unknown> | null = null;
      try { parsed = text ? JSON.parse(text) : null; } catch { parsed = null; }
      if (!response.ok) {
        providerError = String(parsed?.message ?? parsed?.error ?? text ?? `Provider returned ${response.status}`);
      } else if (parsed) {
        provider = {
          id: parsed.id,
          from: parsed.from,
          to: parsed.to,
          subject: parsed.subject,
          created_at: parsed.created_at,
          last_event: parsed.last_event,
        };
      }
    }
  }

  return json({ ok: true, log, provider, providerError });
});

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}