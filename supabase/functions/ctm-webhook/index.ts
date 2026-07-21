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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? req.headers.get("x-ctm-token") ?? "";
  if (!WEBHOOK_TOKEN || token !== WEBHOOK_TOKEN) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: Record<string, unknown> = {};
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const form = await req.formData();
      form.forEach((v, k) => { (payload as Record<string, unknown>)[k] = typeof v === "string" ? v : ""; });
    }
  } catch (_) { /* keep empty */ }

  const call = normalizeCtmPayload(payload);
  if (!call) {
    return new Response(JSON.stringify({ error: "missing call id", received: payload }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

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
    }
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
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});