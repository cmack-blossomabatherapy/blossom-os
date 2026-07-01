/**
 * Canonical call disposition + direction + category constants for
 * marketing_call_events. Free-text disposition values are normalized
 * against this list so filters and reporting stay stable.
 */

export const CANONICAL_CALL_DISPOSITIONS = [
  "new",
  "needs_review",
  "missed_after_hours",
  "attached_to_lead",
  "converted_to_lead",
  "duplicate",
  "not_qualified",
  "no_answer",
  "resolved",
  // Legacy / operational values still accepted from CTM / JiveTel feeds.
  "connected",
  "missed",
  "voicemail",
  "callback_needed",
  "spam",
] as const;

export type CanonicalCallDisposition = (typeof CANONICAL_CALL_DISPOSITIONS)[number];

export const CANONICAL_CALL_DIRECTIONS = ["inbound", "outbound", "unknown"] as const;
export type CanonicalCallDirection = (typeof CANONICAL_CALL_DIRECTIONS)[number];

export const CANONICAL_CALL_CATEGORIES = [
  "intake",
  "recruiting",
  "referral",
  "existing_patient",
  "billing",
  "unknown",
] as const;
export type CanonicalCallCategory = (typeof CANONICAL_CALL_CATEGORIES)[number];

const DISPOSITION_SET = new Set<string>(CANONICAL_CALL_DISPOSITIONS);
const DIRECTION_SET = new Set<string>(CANONICAL_CALL_DIRECTIONS);
const CATEGORY_SET = new Set<string>(CANONICAL_CALL_CATEGORIES);

const DISPOSITION_ALIASES: Record<string, CanonicalCallDisposition> = {
  answered: "connected",
  completed: "connected",
  vm: "voicemail",
  "left-voicemail": "voicemail",
  "no-answer": "no_answer",
  noanswer: "no_answer",
  dupe: "duplicate",
  qualified: "converted_to_lead",
  spammy: "spam",
  junk: "spam",
  after_hours: "missed_after_hours",
};

export function normalizeDisposition(raw: string | null | undefined): CanonicalCallDisposition | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (DISPOSITION_SET.has(key)) return key as CanonicalCallDisposition;
  if (DISPOSITION_ALIASES[key]) return DISPOSITION_ALIASES[key];
  return null;
}

export function normalizeDirection(raw: string | null | undefined): CanonicalCallDirection {
  if (!raw) return "unknown";
  const key = raw.trim().toLowerCase();
  if (DIRECTION_SET.has(key)) return key as CanonicalCallDirection;
  if (key === "in" || key === "incoming") return "inbound";
  if (key === "out" || key === "outgoing") return "outbound";
  return "unknown";
}

export function normalizeCategory(raw: string | null | undefined): CanonicalCallCategory {
  if (!raw) return "unknown";
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (CATEGORY_SET.has(key)) return key as CanonicalCallCategory;
  return "unknown";
}

export interface CallImportValidationResult<T> {
  value: T | null;
  ok: boolean;
  error?: string;
}

export function validateDisposition(raw: string | null | undefined): CallImportValidationResult<CanonicalCallDisposition> {
  if (!raw) return { value: null, ok: true };
  const v = normalizeDisposition(raw);
  return v
    ? { value: v, ok: true }
    : { value: null, ok: false, error: `Unknown disposition "${raw}"` };
}

export function validateDirection(raw: string | null | undefined): CallImportValidationResult<CanonicalCallDirection> {
  if (!raw) return { value: "unknown", ok: true };
  const key = raw.trim().toLowerCase();
  if (DIRECTION_SET.has(key)) return { value: key as CanonicalCallDirection, ok: true };
  if (key === "in" || key === "incoming") return { value: "inbound", ok: true };
  if (key === "out" || key === "outgoing") return { value: "outbound", ok: true };
  return { value: "unknown", ok: false, error: `Unknown direction "${raw}"` };
}

export function validateCategory(raw: string | null | undefined): CallImportValidationResult<CanonicalCallCategory> {
  if (!raw) return { value: "unknown", ok: true };
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (CATEGORY_SET.has(key)) return { value: key as CanonicalCallCategory, ok: true };
  return { value: "unknown", ok: false, error: `Unknown call_category "${raw}"` };
}