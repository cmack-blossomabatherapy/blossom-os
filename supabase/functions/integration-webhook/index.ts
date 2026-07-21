// Generic provider webhook receiver.
// Logs every inbound webhook to `integration_webhook_events`, performs
// signature verification when a secret is configured, and never silently
// drops events. Designed for CTM, LeadTrap, Mailchimp, PandaDoc, Calendly,
// Make.com, Apploi, Jivetel, Eligipro, Solum.
//
// Routing: POST /integration-webhook?integration=<id>  OR  body.integration_id
import { createClient } from "npm:@supabase/supabase-js@2";
import { getAdapter } from "../_shared/integrations/providerRegistry.ts";
import { upsertNormalizedRecord, recordIntegrationEvent } from "../_shared/integrations/normalizers.ts";

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
  const integrationId: string | null =
    url.searchParams.get("integration") ??
    parsed?.integration_id ??
    parsed?.integrationId ??
    null;

  if (!integrationId) {
    return json({ ok: false, error: "Missing integration id" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Reject unknown integration ids before we touch FK-bound tables.
  const { data: catalogRow } = await supabase
    .from("integration_catalog")
    .select("id")
    .eq("id", integrationId)
    .maybeSingle();
  if (!catalogRow) {
    return json({ ok: false, error: "Unknown integration", integrationId }, 400);
  }

  // Signature verification (best-effort, provider-specific headers).
  let verification: "verified" | "unverified" | "failed" = "unverified";
  const secretEnv = WEBHOOK_SECRET_ENV[integrationId];
  const secret = secretEnv ? Deno.env.get(secretEnv) : undefined;
  const requiresSecret = !!secretEnv;
  if (secret) {
    const sig =
      req.headers.get("x-signature") ??
      req.headers.get("x-hub-signature-256") ??
      req.headers.get("calendly-webhook-signature") ??
      req.headers.get("x-pandadoc-signature") ??
      req.headers.get("x-retell-signature") ??
      req.headers.get("x-ctm-signature") ??
      req.headers.get("x-leadtrap-signature") ??
      req.headers.get("x-make-signature") ??
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
      processing_status: verification === "failed" ? "rejected" : "received",
      payload: parsed,
      headers,
      source_ip: req.headers.get("x-forwarded-for") ?? null,
      error_message: verification === "failed" ? "signature_verification_failed" : null,
    })
    .select("id")
    .single();

  if (error) {
    // Duplicate delivery — providers legitimately retry the same event id.
    // Return 200 with the existing row so they stop retrying instead of
    // hammering us with 500s.
    if ((error as { code?: string }).code === "23505" && providerEventId) {
      const { data: existing } = await supabase
        .from("integration_webhook_events")
        .select("id")
        .eq("integration_id", integrationId)
        .eq("provider_event_id", providerEventId)
        .maybeSingle();
      return json(
        { ok: true, id: existing?.id ?? null, duplicate: true, verification },
        200,
      );
    }
    console.error("[integration-webhook] insert failed", error);
    return json({ ok: false, error: error.message }, 500);
  }

  // If signature verification was REQUIRED and FAILED, do not normalize the
  // event into the business event spine — return 401 so the provider retries.
  if (verification === "failed") {
    return json(
      { ok: false, id: inserted.id, verification, error: "signature_verification_failed", details: { requiresSecret } },
      401,
    );
  }

  // Pass 4: hand the (verified or unverified-when-no-secret-configured)
  // payload to the provider adapter for normalization. Adapter failures must
  // not lose the raw event — we mark processing_status accordingly.
  const adapter = getAdapter(integrationId);
  let processingStatus = "received";
  let normalizationError: string | null = null;
  try {
    if (adapter) {
      const headerMap: Record<string, string> = {};
      req.headers.forEach((v, k) => { headerMap[k] = v; });
      const norm = adapter.normalizeWebhook(parsed, headerMap);
      const ctx = { supabase, rawEventId: inserted.id };
      await recordIntegrationEvent(ctx, integrationId, {
        eventType: norm.eventType ?? eventType ?? "unknown",
        title: norm.title ?? `${integrationId}: ${norm.eventType ?? eventType ?? "unknown"}`,
        description: norm.description ?? (providerEventId ? `Provider event ${providerEventId}` : null),
        metadata: norm.metadata,
      });
      if (norm.record) {
        const up = await upsertNormalizedRecord(ctx, integrationId, norm.record);
        if (!up.ok) {
          processingStatus = "failed";
          normalizationError = up.error ?? "normalize_failed";
        } else {
          processingStatus = "normalized";
          // Post-normalization: promote provider-neutral inbound lead-shaped
          // records into Lead Captured via the shared RPC. Only eligible
          // kinds are promoted; non-lead events (assessment_completed,
          // benefits_returned, etc.) never mint a lead.
          const eligible = new Set([
            "lead", "inquiry", "form_submission", "inbound_call", "call",
          ]);
          if (up.id && eligible.has(norm.record.recordKind)) {
            const { data: prom, error: promErr } = await supabase
              .rpc("promote_normalized_record", { _record_id: up.id });
            if (promErr) {
              // Do not lose the normalized record on promotion errors —
              // surface via processing_status so ops can retry.
              processingStatus = "promotion_error";
              normalizationError = promErr.message;
            } else if (Array.isArray(prom) && prom.length) {
              const row = prom[0] as { state?: string };
              processingStatus = `promoted:${row.state ?? "unknown"}`;
            }
          }
        }
      } else {
        processingStatus = "normalized_unknown";
      }
    }
  } catch (e) {
    processingStatus = "failed";
    normalizationError = e instanceof Error ? e.message : String(e);
  }

  await supabase
    .from("integration_webhook_events")
    .update({
      processing_status: processingStatus,
      processed_at: new Date().toISOString(),
      error_message: normalizationError,
    })
    .eq("id", inserted.id);

  return json({ ok: true, id: inserted.id, verification, processingStatus, details: { requiresSecret } });
});