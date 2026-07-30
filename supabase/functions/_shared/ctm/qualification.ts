/**
 * Blossom OS — CTM qualification, edge entry point.
 *
 * Pure rules are re-exported from ./qualificationCore.ts (shared with the
 * browser bundle). This module adds the backend-only pieces: loading the
 * Intake configuration and persisting/auditing every outcome.
 */
export * from "./qualificationCore.ts";

import {
  CtmQualificationConfig,
  CtmQualificationResult,
  CtmQualificationSettings,
  DEFAULT_CTM_QUALIFICATION_SETTINGS,
  DEFAULT_EXCLUDED_TAGS,
  DEFAULT_MIN_DURATION_SECONDS,
} from "./qualificationCore.ts";

type Supa = { from: (t: string) => any };

export type CtmQualificationSource =
  | "webhook"
  | "sync"
  | "historical_import"
  | "integration_webhook"
  | "link_call"
  | "retry"
  | "manual_review";

/**
 * Load the effective Intake qualification configuration.
 *
 * Sources, merged in this order:
 *   1. intake_ctm_qualification_config (the Director-managed row)
 *   2. ctm_number_mapping tracking numbers (legacy routing config)
 *   3. built-in safe defaults for anything still absent
 *
 * Never throws — ingestion must not stop because config could not be read.
 */
export async function loadCtmQualificationSettings(supabase: Supa): Promise<CtmQualificationSettings> {
  const sources: string[] = [];
  const defaultsApplied: string[] = [];
  let configured = false;
  const config: CtmQualificationConfig = {
    trackingNumbers: [],
    campaigns: [],
    excludedTags: [],
    excludedNumbers: [],
  };

  try {
    const { data } = await supabase
      .from("intake_ctm_qualification_config")
      .select("tracking_numbers,campaigns,excluded_tags,excluded_numbers,min_duration_seconds")
      .limit(1)
      .maybeSingle();
    if (data) {
      configured = true;
      sources.push("intake_ctm_qualification_config");
      config.trackingNumbers = (data.tracking_numbers ?? []) as string[];
      config.campaigns = (data.campaigns ?? []) as string[];
      config.excludedTags = (data.excluded_tags ?? []) as string[];
      config.excludedNumbers = (data.excluded_numbers ?? []) as string[];
      if (typeof data.min_duration_seconds === "number") {
        config.minDurationSeconds = data.min_duration_seconds;
      }
    }
  } catch (_e) { /* fall through to defaults */ }

  // Legacy/companion routing config: mapped tracking numbers count as Intake.
  try {
    const { data: mapped } = await supabase
      .from("ctm_number_mapping")
      .select("tracking_number")
      .limit(500);
    const extra = ((mapped ?? []) as Array<{ tracking_number: string | null }>)
      .map((r) => r.tracking_number)
      .filter((n): n is string => !!n);
    if (extra.length) {
      sources.push("ctm_number_mapping");
      config.trackingNumbers = Array.from(new Set([...(config.trackingNumbers ?? []), ...extra]));
    }
  } catch (_e) { /* optional source */ }

  if (!config.excludedTags?.length) {
    config.excludedTags = [...DEFAULT_EXCLUDED_TAGS];
    defaultsApplied.push("excludedTags");
  }
  if (config.minDurationSeconds == null) {
    config.minDurationSeconds = DEFAULT_MIN_DURATION_SECONDS;
    defaultsApplied.push("minDurationSeconds");
  }
  if (!config.trackingNumbers?.length) defaultsApplied.push("trackingNumbers");
  if (!config.campaigns?.length) defaultsApplied.push("campaigns");
  if (!config.excludedNumbers?.length) defaultsApplied.push("excludedNumbers");

  if (!sources.length) {
    return { ...DEFAULT_CTM_QUALIFICATION_SETTINGS, config: { ...config } };
  }
  return { config, configured, defaultsApplied, sources };
}

/** Backwards-compatible helper returning just the effective config object. */
export async function loadCtmQualificationConfig(supabase: Supa): Promise<CtmQualificationConfig> {
  return (await loadCtmQualificationSettings(supabase)).config;
}

export interface RecordQualificationInput {
  ctmCallId: string;
  ctmCallEventId?: string | null;
  source: CtmQualificationSource;
  result: CtmQualificationResult;
  leadId?: string | null;
  candidateLeadIds?: string[];
  metadata?: Record<string, unknown>;
  settings?: CtmQualificationSettings;
}

/**
 * Persist the qualification outcome on the call row and append an audit event.
 * Every outcome — including `eligible` — is audited with the integration id and
 * the provider event id. Idempotent: replays of the same call/source/outcome
 * do not duplicate rows.
 */
export async function recordCtmQualification(
  supabase: Supa,
  input: RecordQualificationInput,
): Promise<void> {
  const { result } = input;
  try {
    await supabase
      .from("ctm_call_events")
      .update({
        qualification_state: result.state,
        qualification_reason: result.reason,
        qualification_detail: result.detail,
        qualified_at: new Date().toISOString(),
      })
      .eq("ctm_call_id", input.ctmCallId);
  } catch (_e) { /* never fail ingest on audit write */ }

  try {
    await supabase.from("intake_ctm_qualification_events").upsert(
      {
        ctm_call_id: input.ctmCallId,
        ctm_call_event_id: input.ctmCallEventId ?? null,
        source: input.source,
        state: result.state,
        reason: result.reason,
        detail: result.detail,
        lead_id: input.leadId ?? null,
        candidate_lead_ids: input.candidateLeadIds ?? [],
        metadata: {
          integration_id: "ctm",
          provider_event_id: input.ctmCallId,
          config_configured: input.settings?.configured ?? null,
          config_sources: input.settings?.sources ?? null,
          config_defaults_applied: input.settings?.defaultsApplied ?? null,
          ...(input.metadata ?? {}),
        },
      },
      { onConflict: "ctm_call_id,source,state,reason", ignoreDuplicates: true },
    );
  } catch (_e) { /* never fail ingest on audit write */ }
}
