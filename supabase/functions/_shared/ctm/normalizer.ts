// Shared CTM normalizer + deterministic lead linker used by ctm-webhook,
// ctm-sync, ctm-link-call and the generic integration-webhook CTM adapter.
// Single source of truth for:
//   - E.164 phone normalization
//   - CTM payload → ctm_call_events row
//   - external-id first, then unique-phone/email lead linking (never guess)
//   - idempotent provenance write into intake_lead_source_events
// INGEST_ONLY: inbound may create/update a Lead Captured row and its call
// link + provenance. It must NOT create tasks, owner assignments, stage
// changes beyond Lead Captured, or outbound integration events.

export type SupaLike = {
  from: (t: string) => any;
  rpc?: (fn: string, args?: Record<string, unknown>) => any;
};

export function digitsOnly(v: unknown): string {
  if (v == null) return "";
  return String(v).replace(/\D/g, "");
}

export function normalizePhoneE164(v: unknown): string | null {
  const d = digitsOnly(v);
  if (!d) return null;
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (d.length >= 8) return `+${d}`;
  return null;
}

export function pickString(...vals: unknown[]): string | null {
  for (const v of vals) if (typeof v === "string" && v.length) return v;
  return null;
}

export function pickNumber(...vals: unknown[]): number | null {
  for (const v of vals) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
}

export interface CtmNormalizedCall {
  ctm_call_id: string;
  ctm_account_id: string | null;
  direction: string | null;
  status: string | null;
  from_number: string | null;
  to_number: string | null;
  tracking_number: string | null;
  caller_name: string | null;
  caller_city: string | null;
  caller_state: string | null;
  caller_zip: string | null;
  duration_seconds: number | null;
  talk_time_seconds: number | null;
  recording_url: string | null;
  transcript: string | null;
  tags: string[];
  source_name: string | null;
  campaign_name: string | null;
  called_at: string | null;
  ended_at: string | null;
  raw: Record<string, unknown>;
}

export function normalizeCtmPayload(payload: Record<string, unknown>): CtmNormalizedCall | null {
  const call = (payload.call as Record<string, unknown>) ?? payload;
  const callId = pickString((call as any).id, (call as any).call_id, (payload as any).id);
  if (!callId) return null;
  return {
    ctm_call_id: callId,
    ctm_account_id: pickString((call as any).account_id, (payload as any).account_id),
    direction: pickString((call as any).direction),
    status: pickString((call as any).status, (call as any).call_status),
    from_number: pickString((call as any).caller_number, (call as any).from_number, (call as any).from, (payload as any).caller_number),
    to_number: pickString((call as any).called_number, (call as any).to_number, (call as any).to, (payload as any).called_number),
    tracking_number: pickString((call as any).tracking_number, (call as any).tracking, (payload as any).tracking_number),
    caller_name: pickString((call as any).caller_name, ((call as any).caller as any)?.name),
    caller_city: pickString((call as any).caller_city),
    caller_state: pickString((call as any).caller_state),
    caller_zip: pickString((call as any).caller_zip),
    duration_seconds: pickNumber((call as any).duration, (call as any).duration_seconds),
    talk_time_seconds: pickNumber((call as any).talk_time, (call as any).talk_time_seconds),
    recording_url: pickString((call as any).audio, (call as any).recording, (call as any).recording_url),
    transcript: pickString((call as any).transcription, (call as any).transcript),
    tags: Array.isArray((call as any).tags)
      ? ((call as any).tags as unknown[]).map(String)
      : typeof (call as any).tags === "string"
        ? String((call as any).tags).split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    source_name: pickString((call as any).source_name, (call as any).source),
    campaign_name: pickString((call as any).campaign_name, (call as any).campaign),
    called_at: pickString((call as any).called_at, (call as any).start_time, (call as any).created_at),
    ended_at: pickString((call as any).ended_at, (call as any).end_time),
    raw: payload,
  };
}

export type LeadLinkOutcome =
  | { state: "linked_existing"; lead_id: string; reason: string }
  | { state: "promoted"; lead_id: string; reason: string }
  | { state: "ambiguous_review"; lead_id: null; reason: string; candidates: string[] }
  | { state: "incomplete_review"; lead_id: null; reason: string }
  | { state: "error"; lead_id: null; reason: string };

/**
 * Deterministic linker: external CTM call id first (via
 * intake_lead_source_events), then unique phone match on normalized E.164.
 * Multiple matches => ambiguous_review, never guess.
 * When no candidate exists and we have a phone, a single Lead Captured
 * row is created (idempotent by CTM call id via source-event uniqueness).
 */
export async function linkOrCreateLeadForCall(
  supabase: SupaLike,
  call: CtmNormalizedCall,
  opts: { resolvedState?: string | null } = {},
): Promise<LeadLinkOutcome> {
  try {
    // 1. External id precedence via provenance table.
    const { data: existingLink } = await supabase
      .from("intake_lead_source_events")
      .select("lead_id")
      .eq("integration_id", "ctm")
      .eq("provider_event_id", call.ctm_call_id)
      .maybeSingle();
    if (existingLink?.lead_id) {
      return { state: "linked_existing", lead_id: existingLink.lead_id, reason: "existing_source_event" };
    }

    const phone = normalizePhoneE164(call.from_number);
    if (!phone) {
      return { state: "incomplete_review", lead_id: null, reason: "missing_from_number" };
    }

    // 2. Unique phone match on normalized column (never or/maybeSingle-guess).
    const { data: matches, error: matchErr } = await supabase
      .from("intake_leads")
      .select("id")
      .or(`phone_e164.eq.${phone},parent_cell_phone_e164.eq.${phone},home_phone_e164.eq.${phone}`);
    if (matchErr) return { state: "error", lead_id: null, reason: matchErr.message };

    const ids: string[] = Array.from(new Set(((matches ?? []) as Array<{ id: string }>).map((r) => r.id)));
    if (ids.length > 1) {
      return { state: "ambiguous_review", lead_id: null, reason: "multiple_phone_matches", candidates: ids };
    }

    let leadId: string;
    let state: "linked_existing" | "promoted";
    if (ids.length === 1) {
      leadId = ids[0];
      state = "linked_existing";
    } else {
      const insert = {
        parent_name: call.caller_name ?? "Unknown caller",
        child_name: "Unknown",
        phone,
        email: "",
        state: opts.resolvedState ?? call.caller_state ?? "Unknown",
        lead_source: call.source_name ?? "CTM",
        pipeline_stage: "Lead Captured",
        ctm_call_id: call.ctm_call_id,
        source_metadata: {
          integration_id: "ctm",
          provider_record_id: call.ctm_call_id,
          tracking_number: call.tracking_number,
          created_via: "ctm_webhook",
        },
      };
      const { data: created, error: insertErr } = await supabase
        .from("intake_leads")
        .insert(insert)
        .select("id")
        .single();
      if (insertErr || !created) {
        return { state: "error", lead_id: null, reason: insertErr?.message ?? "insert_failed" };
      }
      leadId = created.id;
      state = "promoted";
    }

    // 3. Idempotent provenance link.
    await supabase
      .from("intake_lead_source_events")
      .upsert(
        {
          lead_id: leadId,
          integration_id: "ctm",
          provider_event_id: call.ctm_call_id,
          event_kind: "inbound_call",
          metadata: { tracking_number: call.tracking_number, source: call.source_name },
        },
        { onConflict: "integration_id,provider_event_id" },
      );

    return { state, lead_id: leadId, reason: state === "promoted" ? "created_lead_captured" : "phone_match" };
  } catch (e) {
    return { state: "error", lead_id: null, reason: e instanceof Error ? e.message : String(e) };
  }
}