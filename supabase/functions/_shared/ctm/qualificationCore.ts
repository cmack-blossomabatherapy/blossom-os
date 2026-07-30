/**
 * Blossom OS — CTM call qualification (pure core).
 *
 * THE single source of truth for Intake CTM qualification rules. Imported by
 * both the Supabase edge functions (`_shared/ctm/qualification.ts`) and the
 * browser bundle (`src/lib/intake/ctmQualification.ts`). Never duplicate these
 * rules anywhere else.
 *
 * Deliberately pure — no Supabase, no Deno, no browser globals — so fixtures
 * can exercise it in plain unit tests.
 */

export type CtmQualificationState =
  | "eligible"
  | "excluded"
  | "ambiguous_review"
  | "incomplete_review"
  | "error";

export interface CtmQualificationResult {
  state: CtmQualificationState;
  /** Stable machine reason, safe to persist for review/health surfaces. */
  reason: string;
  /** Operator-facing explanation, no technical jargon. */
  detail: string;
}

export interface CtmQualificationConfig {
  /** Intake tracking numbers (any format — compared on digits). */
  trackingNumbers?: string[];
  /** Intake campaign / source names (case-insensitive). */
  campaigns?: string[];
  /** Tags that mark a call as internal or spam. */
  excludedTags?: string[];
  /** Caller numbers that are always excluded (internal staff, known spam). */
  excludedNumbers?: string[];
  /** Calls shorter than this are treated as non-actionable. Default 15s. */
  minDurationSeconds?: number;
}

/** Where each part of the effective config came from. */
export interface CtmQualificationSettings {
  config: CtmQualificationConfig;
  /** True when an Intake configuration row was found in the backend. */
  configured: boolean;
  /** Config fields that fell back to built-in safe defaults. */
  defaultsApplied: string[];
  /** Backend tables that contributed to the effective config. */
  sources: string[];
}

export interface CtmQualifiableCall {
  ctm_call_id?: string | null;
  direction?: string | null;
  from_number?: string | null;
  to_number?: string | null;
  tracking_number?: string | null;
  duration_seconds?: number | null;
  talk_time_seconds?: number | null;
  tags?: string[] | null;
  campaign_name?: string | null;
  source_name?: string | null;
  caller_email?: string | null;
}

export const DEFAULT_EXCLUDED_TAGS = ["spam", "internal", "test", "robocall", "wrong number"];
export const DEFAULT_MIN_DURATION_SECONDS = 15;

/** Safe defaults used when no Intake configuration row exists yet. */
export const DEFAULT_CTM_QUALIFICATION_SETTINGS: CtmQualificationSettings = {
  config: {
    trackingNumbers: [],
    campaigns: [],
    excludedTags: DEFAULT_EXCLUDED_TAGS,
    excludedNumbers: [],
    minDurationSeconds: DEFAULT_MIN_DURATION_SECONDS,
  },
  configured: false,
  defaultsApplied: ["trackingNumbers", "campaigns", "excludedTags", "excludedNumbers", "minDurationSeconds"],
  sources: ["defaults"],
};

const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "");
/** Compare numbers on their national (last 10) digits so +1 prefixes match. */
const numberKey = (v: unknown) => {
  const d = digits(v);
  return d.length > 10 ? d.slice(-10) : d;
};
const lower = (v: unknown) => String(v ?? "").trim().toLowerCase();

/** Qualify a normalized CTM call against backend-driven Intake configuration. */
export function qualifyCtmCall(
  call: CtmQualifiableCall | null | undefined,
  config: CtmQualificationConfig = {},
): CtmQualificationResult {
  if (!call || typeof call !== "object") {
    return { state: "error", reason: "malformed_payload", detail: "The call record could not be read." };
  }
  if (!call.ctm_call_id) {
    return { state: "error", reason: "missing_call_id", detail: "The call is missing its unique call identifier." };
  }

  const direction = lower(call.direction);
  if (direction && direction !== "inbound") {
    return { state: "excluded", reason: "not_inbound", detail: "Outbound calls are not Intake leads." };
  }

  const tags = (call.tags ?? []).map(lower);
  const excludedTags = (config.excludedTags?.length ? config.excludedTags : DEFAULT_EXCLUDED_TAGS).map(lower);
  const hitTag = tags.find((t) => excludedTags.some((e) => t.includes(e)));
  if (hitTag) {
    return { state: "excluded", reason: "excluded_tag", detail: `Call tagged "${hitTag}" and is not an Intake lead.` };
  }

  const from = digits(call.from_number);
  const fromKey = numberKey(call.from_number);
  if (fromKey && (config.excludedNumbers ?? []).some((n) => numberKey(n) && numberKey(n) === fromKey)) {
    return { state: "excluded", reason: "excluded_number", detail: "Caller is on the internal / blocked number list." };
  }

  const campaigns = (config.campaigns ?? []).map(lower).filter(Boolean);
  const callCampaign = lower(call.campaign_name) || lower(call.source_name);
  const trackingNumbers = (config.trackingNumbers ?? []).map(numberKey).filter(Boolean);
  const callTracking = numberKey(call.tracking_number) || numberKey(call.to_number);

  const hasRouting = trackingNumbers.length > 0 || campaigns.length > 0;
  if (hasRouting) {
    const trackingMatch = trackingNumbers.length > 0 && !!callTracking && trackingNumbers.includes(callTracking);
    const campaignMatch = campaigns.length > 0 && !!callCampaign && campaigns.some((c) => callCampaign.includes(c));
    if (!trackingMatch && !campaignMatch) {
      return {
        state: "excluded",
        reason: "not_intake_routing",
        detail: "Call did not arrive on a configured Intake tracking number or campaign.",
      };
    }
  }

  const minDuration = config.minDurationSeconds ?? DEFAULT_MIN_DURATION_SECONDS;
  const duration = call.talk_time_seconds ?? call.duration_seconds ?? null;
  if (duration != null && duration < minDuration) {
    return {
      state: "excluded",
      reason: "too_short",
      detail: `Call lasted ${duration}s, below the ${minDuration}s Intake threshold.`,
    };
  }

  if (!from && !lower(call.caller_email)) {
    return {
      state: "incomplete_review",
      reason: "missing_identifier",
      detail: "No caller phone number or email — needs manual review before a lead can be created.",
    };
  }

  return { state: "eligible", reason: "qualified", detail: "Qualified inbound Intake call." };
}

/** Match candidates → resolution decision. Never guesses between matches. */
export type CtmMatchResolution =
  | { action: "link_existing"; leadId: string; via: "provenance" | "identifier" }
  | { action: "create_lead" }
  | { action: "review"; state: CtmQualificationState; reason: string; detail: string };

export function resolveCtmLeadMatch(input: {
  provenanceLeadId?: string | null;
  identifierMatches?: string[];
}): CtmMatchResolution {
  if (input.provenanceLeadId) {
    return { action: "link_existing", leadId: input.provenanceLeadId, via: "provenance" };
  }
  const matches = Array.from(new Set((input.identifierMatches ?? []).filter(Boolean)));
  if (matches.length === 1) {
    return { action: "link_existing", leadId: matches[0], via: "identifier" };
  }
  if (matches.length > 1) {
    return {
      action: "review",
      state: "ambiguous_review",
      reason: "multiple_matches",
      detail: `${matches.length} existing leads share this phone or email — a person must pick the right one.`,
    };
  }
  return { action: "create_lead" };
}

/** Human labels for the Director CTM health surface. */
export const CTM_QUALIFICATION_LABELS: Record<CtmQualificationState, string> = {
  eligible: "Eligible",
  excluded: "Excluded",
  ambiguous_review: "Needs review — multiple matches",
  incomplete_review: "Needs review — incomplete",
  error: "Mapping error",
};

export const CTM_QUALIFICATION_STATES: CtmQualificationState[] = [
  "eligible",
  "excluded",
  "ambiguous_review",
  "incomplete_review",
  "error",
];
