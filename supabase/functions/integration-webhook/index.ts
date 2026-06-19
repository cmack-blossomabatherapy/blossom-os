// Generic provider webhook receiver.
// Logs every inbound webhook to `integration_webhook_events`, performs
// signature verification when a secret is configured, and never silently
// drops events. Designed for CTM, LeadTrap, Mailchimp, PandaDoc, Calendly,
// Make.com, Apploi, Jivetel, Eligipro, Solum.
//
// Routing: POST /integration-webhook?integration=<id>  OR  body.integration_id
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, *",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Map integration_id -> env var name holding shared webhook secret.
const WEBHOOK_SECRET_ENV: Record<string, string> = {
  ctm: "CTM_WEBHOOK_SECRET",
  leadtrap: "LEADTRAP_WEBHOOK_SECRET",
  pandadoc: "PANDADOC_WEBHOOK_SECRET",
  calendly: "CALENDLY_WEBHOOK_SIGNING_KEY",
  make: "MAKE_WEBHOOK_SECRET",
  retell: "RETELL_WEBHOOK_SECRET",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyHmac(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
    const hex = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return signature.toLowerCase().includes(hex);
  } catch (_) {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = new URL(req.url);
  const rawBody = await req.text();
  let parsed: any = {};
  try {
    parsed = JSON.parse(rawBody);
  } catch (_) {
    parsed = { _raw: rawBody };
  }
  const integrationId: string =
    url.searchParams.get("integration") ??
    parsed?.integration_id ??
    parsed?.integrationId ??
    "unknown";

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Signature verification (best-effort, provider-specific headers).
  let verification: "verified" | "unverified" | "failed" = "unverified";
  const secretEnv = WEBHOOK_SECRET_ENV[integrationId];
  const secret = secretEnv ? Deno.env.get(secretEnv) : undefined;
  if (secret) {
    const sig =
      req.headers.get("x-signature") ??
      req.headers.get("x-hub-signature-256") ??
      req.headers.get("calendly-webhook-signature") ??
      req.headers.get("x-pandadoc-signature") ??
      null;
    verification = (await verifyHmac(rawBody, sig, secret)) ? "verified" : "failed";
  }

  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    if (!/authorization|cookie|apikey/i.test(k)) headers[k] = v;
  });

  const providerEventId: string | null =
    parsed?.id ?? parsed?.event_id ?? parsed?.eventId ?? null;
  const eventType: string | null =
    parsed?.event ?? parsed?.type ?? parsed?.event_type ?? null;

  const { data: inserted, error } = await supabase
    .from("integration_webhook_events")
    .insert({
      integration_id: integrationId,
      provider_event_id: providerEventId,
      event_type: eventType,
      verification_status: verification,
      processing_status: "received",
      payload: parsed,
      headers,
      source_ip: req.headers.get("x-forwarded-for") ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[integration-webhook] insert failed", error);
    return json({ ok: false, error: error.message }, 500);
  }

  // Normalize to integration_events when there's a recognizable shape.
  if (eventType) {
    await supabase.from("integration_events").insert({
      integration_id: integrationId,
      source_event_id: inserted.id,
      event_type: eventType,
      title: `${integrationId}: ${eventType}`,
      description: providerEventId ? `Provider event ${providerEventId}` : null,
      metadata: parsed,
    });
  }

  return json({ ok: true, id: inserted.id, verification });
});