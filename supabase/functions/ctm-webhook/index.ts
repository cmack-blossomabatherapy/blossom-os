// Public webhook endpoint for CallTrackingMetrics (CTM).
// Configure CTM notifications to POST to:
//   https://<PROJECT>.functions.supabase.co/ctm-webhook?token=<CTM_WEBHOOK_TOKEN>
// The token must match the CTM_WEBHOOK_TOKEN secret in Lovable Cloud.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_TOKEN = Deno.env.get("CTM_WEBHOOK_TOKEN") ?? "";

function pickString(...vals: unknown[]): string | null {
  for (const v of vals) if (typeof v === "string" && v.length) return v;
  return null;
}
function pickNumber(...vals: unknown[]): number | null {
  for (const v of vals) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
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

  const call = (payload.call as Record<string, unknown>) ?? payload;
  const callId = pickString(call.id, call.call_id, payload.id);
  if (!callId) {
    return new Response(JSON.stringify({ error: "missing call id", received: payload }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const tracking = pickString(call.tracking_number, call.tracking, payload.tracking_number);
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

  const fromNumber = pickString(call.caller_number, call.from_number, call.from, payload.caller_number);
  const toNumber = pickString(call.called_number, call.to_number, call.to, payload.called_number);
  const callRow = {
    ctm_call_id: callId,
    ctm_account_id: pickString(call.account_id, payload.account_id),
    direction: pickString(call.direction),
    status: pickString(call.status, call.call_status),
    from_number: fromNumber,
    to_number: toNumber,
    tracking_number: tracking,
    caller_name: pickString(call.caller_name, (call.caller as Record<string, unknown> | null)?.name),
    caller_city: pickString(call.caller_city),
    caller_state: pickString(call.caller_state),
    caller_zip: pickString(call.caller_zip),
    duration_seconds: pickNumber(call.duration, call.duration_seconds),
    talk_time_seconds: pickNumber(call.talk_time, call.talk_time_seconds),
    recording_url: pickString(call.audio, call.recording, call.recording_url),
    transcript: pickString(call.transcription, call.transcript),
    tags: Array.isArray(call.tags)
      ? (call.tags as unknown[]).map(String)
      : typeof call.tags === "string" ? String(call.tags).split(",").map((s) => s.trim()).filter(Boolean) : [],
    source_name: pickString(call.source_name, call.source),
    campaign_name: pickString(call.campaign_name, call.campaign),
    called_at: pickString(call.called_at, call.start_time, call.created_at),
    ended_at: pickString(call.ended_at, call.end_time),
    resolved_state,
    resolved_source_id,
    resolved_campaign_id,
    raw: payload,
  };

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

  // Enrich intake lead: match by caller number.
  let leadCreated = false;
  if (fromNumber && !upserted.intake_lead_id) {
    const { data: existingLead } = await supabase
      .from("intake_leads")
      .select("id")
      .or(`phone.eq.${fromNumber},parent_cell_phone.eq.${fromNumber},home_phone.eq.${fromNumber}`)
      .maybeSingle();

    let leadId: string | null = existingLead?.id ?? null;
    if (!leadId) {
      const { data: newLead, error: leadErr } = await supabase
        .from("intake_leads")
        .insert({
          phone: fromNumber,
          parent_name: callRow.caller_name ?? "Unknown caller",
          lead_source: callRow.source_name ?? "CTM",
          state: resolved_state,
          pipeline_stage: "new_lead",
          ctm_call_id: callId,
        })
        .select("id")
        .single();
      if (!leadErr && newLead) {
        leadId = newLead.id;
        leadCreated = true;
      } else if (leadErr) {
        console.warn("intake_lead create failed", leadErr.message);
      }
    }
    if (leadId) {
      await supabase.from("ctm_call_events").update({ intake_lead_id: leadId }).eq("id", upserted.id);
      await supabase.from("intake_communications").insert({
        lead_id: leadId,
        communication_type: "phone",
        direction: callRow.direction ?? "inbound",
        subject: `CTM call · ${callRow.source_name ?? "unknown source"}`,
        preview: `Inbound call to ${tracking ?? "tracking number"} · ${callRow.duration_seconds ?? 0}s`,
        duration_seconds: callRow.duration_seconds ?? null,
      });
    }
  }

  await supabase.from("ctm_sync_runs").insert({
    kind: "webhook",
    status: "ok",
    finished_at: new Date().toISOString(),
    calls_fetched: 1,
    calls_upserted: 1,
    leads_created: leadCreated ? 1 : 0,
  });

  return new Response(JSON.stringify({ ok: true, call_id: callId, lead_created: leadCreated }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});