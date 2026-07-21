// Re-links a CTM call event to the matching intake lead, client, employee,
// and dial-intent (agent). Idempotent — safe to invoke multiple times.
// INGEST_ONLY-safe: never creates outbound communications or follow-up tasks;
// lead creation/linking is delegated to the shared normalizer/linker
// (external-id first, then unique E.164, ambiguous => review queue).
// Callable from ctm-webhook (fire-and-forget) or admin backfill.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { normalizePhoneE164, linkOrCreateLeadForCall } from "../_shared/ctm/normalizer.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let body: { call_event_id?: string; ctm_call_id?: string; limit?: number } = {};
  try { body = await req.json(); } catch (_) { /* ignore */ }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  let query = supabase
    .from("ctm_call_events")
    .select("id,ctm_call_id,ctm_account_id,direction,from_number,to_number,tracking_number,caller_name,called_at,matched_lead_id,matched_client_id,matched_employee_id,matched_agent_user_id,intake_lead_id,status,source_name,resolved_state");
  if (body.call_event_id) query = query.eq("id", body.call_event_id);
  else if (body.ctm_call_id) query = query.eq("ctm_call_id", body.ctm_call_id);
  else query = query.is("linked_at", null).order("called_at", { ascending: false, nullsFirst: false }).limit(body.limit ?? 100);

  const { data: events, error } = await query;
  if (error) {
    console.error("ctm-link-call load failed", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let linked = 0;
  let ambiguous = 0;
  let incomplete = 0;
  for (const ev of events ?? []) {
    const isOutbound = ev.direction?.toLowerCase().startsWith("out");
    const externalNumber = isOutbound ? ev.to_number : ev.from_number;
    const phone = normalizePhoneE164(externalNumber);

    const update: Record<string, unknown> = { linked_at: new Date().toISOString() };

    // Delegate lead resolution to the shared linker (external-id first,
    // then unique E.164 phone; ambiguous => review queue). Only run for
    // inbound calls — outbound calls are placed by employees.
    if (!ev.matched_lead_id && !isOutbound && phone) {
      const outcome = await linkOrCreateLeadForCall(supabase as any, {
        ctm_call_id: ev.ctm_call_id,
        ctm_account_id: ev.ctm_account_id ?? null,
        direction: ev.direction ?? null,
        status: ev.status ?? null,
        from_number: ev.from_number ?? null,
        to_number: ev.to_number ?? null,
        tracking_number: ev.tracking_number ?? null,
        caller_name: ev.caller_name ?? null,
        caller_city: null, caller_state: null, caller_zip: null,
        duration_seconds: null, talk_time_seconds: null,
        recording_url: null, transcript: null,
        tags: [], source_name: ev.source_name ?? null, campaign_name: null,
        called_at: ev.called_at ?? null, ended_at: null, raw: {},
      }, { resolvedState: ev.resolved_state ?? null });
      if (outcome.state === "ambiguous_review") ambiguous++;
      else if (outcome.state === "incomplete_review") incomplete++;
      else if (outcome.lead_id) update.matched_lead_id = outcome.lead_id;
    }

    const nums = phone ? [phone] : [];

    if (!ev.matched_client_id && nums.length) {
      const or = nums.map((n) => `phone.eq.${n}`).join(",");
      const { data: client } = await supabase.from("clients").select("id").or(or).limit(1).maybeSingle();
      if (client?.id) update.matched_client_id = client.id;
    }

    if (!ev.matched_employee_id && nums.length) {
      const or = nums.map((n) => `phone.eq.${n}`).join(",");
      const { data: emp } = await supabase.from("employees").select("id,user_id").or(or).limit(1).maybeSingle();
      if (emp?.id) update.matched_employee_id = emp.id;
    }

    if (isOutbound && !ev.matched_agent_user_id && nums.length) {
      const windowStart = ev.called_at ? new Date(new Date(ev.called_at).getTime() - 120_000).toISOString() : null;
      const windowEnd = ev.called_at ? new Date(new Date(ev.called_at).getTime() + 60_000).toISOString() : null;
      let dq = supabase
        .from("phone_dial_events")
        .select("id,user_id,dialed_at")
        .in("target_number_e164", nums)
        .order("dialed_at", { ascending: false })
        .limit(1);
      if (windowStart) dq = dq.gte("dialed_at", windowStart);
      if (windowEnd) dq = dq.lte("dialed_at", windowEnd);
      const { data: dial } = await dq.maybeSingle();
      if (dial?.id) {
        update.linked_dial_event_id = dial.id;
        update.matched_agent_user_id = dial.user_id;
      }
    }

    await supabase.from("ctm_call_events").update(update).eq("id", ev.id);
    // INGEST_ONLY: this handler never writes to Intake outbound tables.
    // Provenance is captured by the shared linker via
    // intake_lead_source_events; missed-call follow-ups are surfaced in
    // the Review Queues UI, not auto-created here.

    linked++;
  }

  return new Response(JSON.stringify({
    ok: true,
    processed: events?.length ?? 0,
    linked,
    ambiguous,
    incomplete,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
