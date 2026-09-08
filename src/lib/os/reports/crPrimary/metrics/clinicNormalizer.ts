/**
 * Shared, pure clinic normalization for the staff-facing CentralReach reports.
 *
 * CentralReach location text is free-form (organization names, clinic labels,
 * and sometimes a street address). Reports must never print a full street
 * address as a clinic label, and two reports must never disagree about which
 * clinic a row belongs to. The mapping is deliberately tiny and deterministic:
 *
 *   - "riverdale" anywhere in the normalized text  → Riverdale
 *   - "georgia clinic" without "riverdale"         → Peachtree Corners
 *     (this includes the 3850 Holcomb Bridge organization location)
 *   - anything else, including blank               → Other / Unmapped
 *
 * Nothing here infers capacity, staffing, or census — the exports carry none of
 * those facts.
 */

export const CLINIC_RIVERDALE = "Riverdale";
export const CLINIC_PEACHTREE = "Peachtree Corners";
export const CLINIC_OTHER = "Other / Unmapped";

export type ClinicKey = "riverdale" | "peachtree_corners" | "other";

export interface ClinicScopeOption {
  key: ClinicKey | "all";
  label: string;
}

/** URL-addressable clinic scope options shared by every clinic-aware report. */
export const CLINIC_SCOPE_OPTIONS: ClinicScopeOption[] = [
  { key: "all", label: "All Clinics" },
  { key: "riverdale", label: CLINIC_RIVERDALE },
  { key: "peachtree_corners", label: CLINIC_PEACHTREE },
  { key: "other", label: CLINIC_OTHER },
];

const HOLCOMB_BRIDGE = /3850\s+holcomb\s+bridge/;

/** Lowercased, whitespace-collapsed location text. */
export function normalizeLocationText(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** Deterministic clinic key for a raw CentralReach location string. */
export function clinicKeyOf(location: string | null | undefined): ClinicKey {
  const text = normalizeLocationText(location);
  if (!text) return "other";
  if (text.includes("riverdale")) return "riverdale";
  if (text.includes("georgia clinic")) return "peachtree_corners";
  if (HOLCOMB_BRIDGE.test(text)) return "peachtree_corners";
  return "other";
}

/** Safe, staff-facing clinic label — never a street address. */
export function clinicLabelOf(location: string | null | undefined): string {
  const key = clinicKeyOf(location);
  if (key === "riverdale") return CLINIC_RIVERDALE;
  if (key === "peachtree_corners") return CLINIC_PEACHTREE;
  return CLINIC_OTHER;
}

/** True when a row's location belongs to the selected scope. */
export function matchesClinicScope(
  location: string | null | undefined,
  scope: ClinicKey | "all" | null | undefined,
): boolean {
  if (!scope || scope === "all") return true;
  return clinicKeyOf(location) === scope;
}

/** Label for a scope key, for headings, provenance, and export file names. */
export function clinicScopeLabel(scope: ClinicKey | "all" | null | undefined): string {
  return CLINIC_SCOPE_OPTIONS.find((o) => o.key === (scope ?? "all"))?.label ?? "All Clinics";
}
