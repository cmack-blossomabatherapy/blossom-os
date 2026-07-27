/**
 * Recruiting job-family classification.
 *
 * Blossom OS runs first-class recruiting pipelines per hiring family:
 *   RBT · BCBA · Office Staff · Clinic Staff
 *
 * `recruiting_candidates.role` is the canonical (persisted) family. Older
 * rows were imported before Office Staff / Clinic Staff existed, so they
 * still carry `Other` (or a clinical role) plus a job title in
 * `applied_title`, `tags`, or `notes`. This module derives the effective
 * family for those rows WITHOUT mutating data and without inventing
 * candidates: it only reads what the recruiting backend already stores.
 *
 * Backward compatibility rules:
 *  - An explicit `Office Staff` / `Clinic Staff` role always wins.
 *  - `RBT` / `BT` / `BCBA` rows are NOT pulled into the clinic-staff board
 *    unless the applied title explicitly names clinic leadership/support
 *    (e.g. "Lead RBT", "Clinic Director", "BCBA Clinic Director").
 *  - Everything unmatched stays `Other`, exactly as before.
 */

export type RecruitingJobFamily =
  | "RBT"
  | "BCBA"
  | "BT"
  | "Office Staff"
  | "Clinic Staff"
  | "Other";

export interface JobFamilyInput {
  role?: string | null;
  applied_title?: string | null;
  tags?: string[] | null;
  notes?: string | null;
}

/** Titles/aliases that classify as Office Staff (admin / operations hires). */
export const OFFICE_STAFF_TITLE_PATTERNS: RegExp[] = [
  /\bintake\b/i,
  /\bschedul(er|ing)\b/i,
  /\bauthoriz(ation|ations)\b/i,
  /\bauth\s+specialist\b/i,
  /\bbilling\b/i,
  /\brcm\b/i,
  /\brevenue\s+cycle\b/i,
  /\bclaims\b/i,
  /\bcredential(ing|er)\b/i,
  /\bverification\s+of\s+benefits\b/i,
  /\bvob\b/i,
  /\bhuman\s+resources\b/i,
  /\bhr\b/i,
  /\brecruit(er|ing)\b/i,
  /\bpayroll\b/i,
  /\bfinance\b|\baccount(ing|ant|s\s+payable|s\s+receivable)\b/i,
  /\badmin(istrative|istrator)?\s+(assistant|support|coordinator|specialist)\b/i,
  /\bfront\s+desk\b/i,
  /\breceptionist\b/i,
  /\boffice\s+(manager|coordinator|administrator|assistant|support)\b/i,
  /\bexecutive\s+assistant\b/i,
  /\bdata\s+(entry|analyst)\b/i,
  /\bstate\s+(support|coordinator|administrator)\b/i,
  /\bregional\s+(support|coordinator|administrator)\b/i,
  /\boperations\s+(assistant|coordinator|specialist|support|analyst)\b/i,
  /\bcustomer\s+(service|support)\b/i,
  /\bmarketing\b/i,
  /\bcase\s+manager\b/i,
];

/** Titles/aliases that classify as Clinic Staff (clinic leadership / support). */
export const CLINIC_STAFF_TITLE_PATTERNS: RegExp[] = [
  /\bclinic\s+director\b/i,
  /\bassistant\s+clinic\s+director\b/i,
  /\bclinical\s+director\b/i,
  /\bassistant\s+clinical\s+director\b/i,
  /\bclinic\s+(manager|coordinator|lead|supervisor)\b/i,
  /\bclinic\s+operations\b/i,
  /\bcenter\s+(director|manager|coordinator)\b/i,
  /\bclinical\s+(support|training|trainer|coordinator|specialist)\b/i,
  /\btraining\s+(support|specialist|coordinator|manager)\b/i,
  /\blead\s+(rbt|bt|technician)\b/i,
  /\bsenior\s+rbt\b/i,
  /\brbt\s+(lead|supervisor|mentor|trainer)\b/i,
  /\bclinical\s+operations\b/i,
  /\bquality\s+assurance\b|\bqa\s+(specialist|reviewer|coordinator)\b/i,
];

/** Free-text haystack we are willing to classify from. */
export function jobTitleHaystack(input: JobFamilyInput): string {
  return [input.applied_title ?? "", ...(input.tags ?? []), input.notes ?? ""]
    .filter(Boolean)
    .join(" · ");
}

export function matchesOfficeStaffTitle(text: string): boolean {
  return OFFICE_STAFF_TITLE_PATTERNS.some((re) => re.test(text));
}

export function matchesClinicStaffTitle(text: string): boolean {
  return CLINIC_STAFF_TITLE_PATTERNS.some((re) => re.test(text));
}

const CLINICAL_ROLES = new Set(["RBT", "BT", "BCBA"]);

/**
 * Resolve the effective job family for a candidate row.
 * Never returns Office/Clinic Staff for a clinical role unless the applied
 * title explicitly indicates clinic leadership/support.
 */
export function classifyJobFamily(input: JobFamilyInput): RecruitingJobFamily {
  const role = (input.role ?? "").trim();

  if (role === "Office Staff" || role === "Clinic Staff") return role;

  const hay = jobTitleHaystack(input);

  if (CLINICAL_ROLES.has(role)) {
    // Only clinic leadership/support titles may reclassify a clinical row.
    if (hay && matchesClinicStaffTitle(hay)) return "Clinic Staff";
    return role as RecruitingJobFamily;
  }

  if (hay) {
    // Clinic wins over office when a title mentions both (e.g. "Clinic
    // Director of Operations") because clinic leadership is the narrower,
    // more operationally specific family.
    if (matchesClinicStaffTitle(hay)) return "Clinic Staff";
    if (matchesOfficeStaffTitle(hay)) return "Office Staff";
  }

  return "Other";
}

export function isOfficeStaffCandidate(input: JobFamilyInput): boolean {
  return classifyJobFamily(input) === "Office Staff";
}

export function isClinicStaffCandidate(input: JobFamilyInput): boolean {
  return classifyJobFamily(input) === "Clinic Staff";
}

/** Role options shown in the generic Applicant Pipeline taxonomy. */
export const RECRUITING_ROLE_OPTIONS: RecruitingJobFamily[] = [
  "RBT",
  "BCBA",
  "BT",
  "Office Staff",
  "Clinic Staff",
  "Other",
];