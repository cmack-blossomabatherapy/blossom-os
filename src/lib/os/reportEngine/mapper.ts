import type { CanonicalField, ColumnMapping } from "./types";

/**
 * Synonym dictionary used to auto-map raw CSV headers into canonical fields.
 * Match is normalized: lowercase, strip non-alphanumerics, collapse whitespace.
 * First match wins, and a header already mapped to a stronger field is not
 * overwritten by a weaker pattern.
 */
const SYNONYMS: Array<{ canonical: CanonicalField; patterns: RegExp[] }> = [
  // Most specific first
  { canonical: "authorization_number", patterns: [/^(auth(?:orization)?)( ?#| ?number| ?no| ?id)?$/i, /^auth(?:orization)?( |_)?(#|number|no|id)$/i] },
  // CentralReach exports use concatenated headers like "AuthorizedHoursMonth",
  // "AuthorizedHoursAll", "WorkedHours", "TimeWorkedInHours", "ClientName",
  // "DateOfService", "ProcedureCode" — normalize() lowercases them into
  // "authorizedhoursmonth" / "workedhours" etc. Patterns below must match the
  // real live headers as well as the historical space/underscore variants.
  { canonical: "authorized_hours", patterns: [
      /^auth(?:orized)?( |_)?(hours?|units?|hrs?)(month|week|year|all|total|remaining)?$/i,
      /^authorized(hours?|units?|hrs?)(month|week|year|all|total|remaining)?$/i,
      /^authorized$/i,
  ] },
  { canonical: "pending_hours", patterns: [/^pending( |_)?(hours?|units?|hrs?)?$/i, /^pendinghours?$/i] },
  { canonical: "remaining_hours", patterns: [
      /^remaining( |_)?(hours?|units?|hrs?)?$/i,
      /^remaininghours?$/i,
      /^auth( |_)?remaining$/i,
  ] },
  { canonical: "worked_hours", patterns: [
      /^(worked|billed|rendered|delivered)( |_)?(hours?|units?|hrs?)?$/i,
      /^(worked|billed|rendered|delivered)hours?$/i,
      /^timeworkedin(hours?|mins?|minutes?)$/i,
      /^time( |_)?worked( |_)?in( |_)?(hours?|mins?|minutes?)$/i,
      /^units?$/i, /^hours?$/i, /^duration$/i,
  ] },
  { canonical: "procedure_code", patterns: [
      /^cpt( ?code)?$/i,
      /^(service|procedure|billing)( |_)?code$/i,
      /^procedurecode$/i, /^servicecode$/i, /^billingcode$/i,
      /^code$/i,
  ] },
  { canonical: "service_date", patterns: [
      /^(service|appointment|session|appt)( |_)?date$/i,
      /^(service|appointment|session|appt)date$/i,
      /^dos$/i,
      /^date( |_)?of( |_)?service$/i,
      /^dateofservice$/i,
      /^date$/i,
  ] },
  { canonical: "cancellation_reason", patterns: [/^(cancellation|cancel)( |_)?reason$/i, /^reason$/i, /^status( |_)?reason$/i] },
  { canonical: "session_status", patterns: [/^(appointment|session)( |_)?status$/i, /^status$/i] },
  { canonical: "provider_name", patterns: [
      /^(provider|principal|staff|therapist|rbt|bcba|clinician|rendering( |_)?provider)( ?name)?$/i,
      /^(provider|staff|therapist|clinician|rendering)name$/i,
      /^provider$/i,
  ] },
  { canonical: "client_name", patterns: [
      /^(client|patient|learner|member|child)( ?name)?$/i,
      /^(client|patient|learner|member|child)name$/i,
      /^(client|patient|learner|member|child)( |_)?(full|display|legal)( ?name)?$/i,
  ] },
  { canonical: "client_id", patterns: [
      /^(client|patient|learner|member)( |_)?(id|#|number)$/i,
      /^(client|patient|learner|member)id$/i,
  ] },
  { canonical: "payor", patterns: [/^(payor|payer|funder|insurance)( ?name)?$/i] },
  { canonical: "state", patterns: [/^state$/i] },
];

function norm(s: string) {
  return s.trim().toLowerCase().replace(/[_\-./]+/g, " ").replace(/\s+/g, " ");
}

export function suggestColumnMappings(headers: string[]): ColumnMapping {
  const out: ColumnMapping = {};
  const used = new Set<CanonicalField>();
  for (const h of headers) {
    const n = norm(h);
    let chosen: CanonicalField | "" = "";
    for (const { canonical, patterns } of SYNONYMS) {
      if (used.has(canonical)) continue; // a given canonical maps to first matching header only
      if (patterns.some(p => p.test(n))) { chosen = canonical; used.add(canonical); break; }
    }
    out[h] = chosen;
  }
  return out;
}

/** Invert mapping: canonical → original header (first wins). */
export function inverseMapping(mapping: ColumnMapping): Partial<Record<CanonicalField, string>> {
  const inv: Partial<Record<CanonicalField, string>> = {};
  for (const [header, canonical] of Object.entries(mapping)) {
    if (canonical && !inv[canonical]) inv[canonical] = header;
  }
  return inv;
}

export function validateRequiredFields(
  mapping: ColumnMapping,
  required: CanonicalField[],
): { missing: CanonicalField[]; ok: boolean } {
  const inv = inverseMapping(mapping);
  const missing = required.filter(f => !inv[f]);
  return { missing, ok: missing.length === 0 };
}