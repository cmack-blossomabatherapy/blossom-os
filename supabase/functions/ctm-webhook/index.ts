// Public webhook endpoint for CallTrackingMetrics (CTM).
// Configure CTM notifications to POST to:
//   https://<PROJECT>.functions.supabase.co/ctm-webhook?token=<CTM_WEBHOOK_TOKEN>
// The token must match the CTM_WEBHOOK_TOKEN secret in Lovable Cloud.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { normalizeCtmPayload, linkOrCreateLeadForCall } from "../_shared/ctm/normalizer.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_TOKEN = Deno.env.get("CTM_WEBHOOK_TOKEN") ?? "";

const MAX_PAYLOAD_BYTES = 256 * 1024; // 256KB

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? req.headers.get("x-ctm-token") ?? "";
  if (!WEBHOOK_TOKEN || token !== WEBHOOK_TOKEN) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Read raw body so we can enforce size + hash for replay protection.
  const rawBody = await req.text().catch(() => "");
  if (rawBody.length > MAX_PAYLOAD_BYTES) {
    return new Response(JSON.stringify({ error: "payload_too_large" }), {
      status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const payloadHash = await sha256(rawBody || "empty");
  const sourceIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  let payload: Record<string, unknown> = {};
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } else {
      const params = new URLSearchParams(rawBody);
      for (const [k, v] of params.entries()) payload[k] = v;
    }
  } catch (_) { /* keep empty */ }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Replay protection: same hash => duplicate.
  const { data: existingEvent } = await supabase
    .from("ctm_webhook_events")
    .select("id,status,linked_call_event_id")
    .eq("payload_hash", payloadHash)
    .maybeSingle();
  if (existingEvent && existingEvent.status === "processed") {
    return new Response(JSON.stringify({ ok: true, duplicate: true, event_id: existingEvent.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const call = normalizeCtmPayload(payload);

  // Always persist the raw event log first — even for malformed payloads.
  const eventInsert = await supabase.from("ctm_webhook_events").upsert({
    payload_hash: payloadHash,
    payload,
    payload_size_bytes: rawBody.length,
    source_ip: sourceIp,
    ctm_call_id: call?.ctm_call_id ?? null,
    event_kind: (payload as any)?.event ?? (payload as any)?.type ?? null,
    status: "pending",
    attempt_count: 1,
  }, { onConflict: "payload_hash" }).select("id").single();
  const webhookEventId = eventInsert.data?.id ?? null;

  if (!call) {
    if (webhookEventId) {
      await supabase.from("ctm_webhook_events").update({
        status: "failed",
        error: "missing_call_id",
        processed_at: new Date().toISOString(),
      }).eq("id", webhookEventId);
    }
    return new Response(JSON.stringify({ error: "missing call id", received: payload }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const tracking = call.tracking_number;
  let resolved_state: string | null = null;
  let resolved_source_id: string | null = null;
  let resolved_campaign_id: string | null = null;
  if (tracking) {
    const { data: mapping } = await supabase
      .from("ctm_number_mapping")
      .select("state_code,marketing_source_id,marketing_campaign_id")
      .eq("tracking_number", tracking)
      .maybeSingle();
    if (mapping) {
      resolved_state = mapping.state_code ?? null;
      resolved_source_id = mapping.marketing_source_id ?? null;
      resolved_campaign_id = mapping.marketing_campaign_id ?? null;
    }
  }

  const callRow = { ...call, resolved_state, resolved_source_id, resolved_campaign_id };

  const { data: upserted, error: upErr } = await supabase
    .from("ctm_call_events")
    .upsert(callRow, { onConflict: "ctm_call_id" })
    .select("id,intake_lead_id")
    .single();
  if (upErr) {
    console.error("ctm_call_events upsert failed", upErr);
    if (webhookEventId) {
      await supabase.from("ctm_webhook_events").update({
        status: "failed", error: upErr.message, processed_at: new Date().toISOString(),
      }).eq("id", webhookEventId);
    }
    return new Response(JSON.stringify({ error: upErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // INGEST_ONLY: deterministic external-id → phone linking (no comms/tasks).
  let leadOutcome: Awaited<ReturnType<typeof linkOrCreateLeadForCall>> | null = null;
  if (!upserted.intake_lead_id) {
    leadOutcome = await linkOrCreateLeadForCall(supabase as any, call, { resolvedState: resolved_state });
    if (leadOutcome.lead_id) {
      await supabase
        .from("ctm_call_events")
        .update({ intake_lead_id: leadOutcome.lead_id, matched_lead_id: leadOutcome.lead_id })
        .eq("id", upserted.id);
    } else if (leadOutcome.state === "ambiguous_review" || leadOutcome.state === "incomplete_review") {
      // Enqueue unknown/ambiguous caller for review.
      await supabase.from("ctm_unknown_caller_reviews").upsert({
        ctm_call_event_id: upserted.id,
        ctm_call_id: call.ctm_call_id,
        reason: leadOutcome.state === "ambiguous_review" ? "ambiguous_phone_match" : leadOutcome.reason ?? "no_lead_match",
        candidate_lead_ids: leadOutcome.state === "ambiguous_review" ? (leadOutcome as any).candidates ?? [] : [],
        from_number: call.from_number,
        tracking_number: call.tracking_number,
        caller_name: call.caller_name,
        resolved_state,
        status: "open",
      }, { onConflict: "ctm_call_event_id" });
    }
  }

  if (webhookEventId) {
    await supabase.from("ctm_webhook_events").update({
      status: "processed",
      processed_at: new Date().toISOString(),
      linked_call_event_id: upserted.id,
    }).eq("id", webhookEventId);
  }

  await supabase.from("ctm_sync_runs").insert({
    kind: "webhook",
    status: "ok",
    finished_at: new Date().toISOString(),
    calls_fetched: 1,
    calls_upserted: 1,
    leads_created: leadOutcome?.state === "promoted" ? 1 : 0,
  });

  return new Response(JSON.stringify({
    ok: true,
    call_id: call.ctm_call_id,
    lead_state: leadOutcome?.state ?? (upserted.intake_lead_id ? "linked_existing" : "unlinked"),
    lead_id: leadOutcome?.lead_id ?? upserted.intake_lead_id ?? null,
    event_id: webhookEventId,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});