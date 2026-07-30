/**
 * Blossom OS — Intake role identity.
 *
 * Intake supports exactly two experiences:
 *   - Director of Intake   (canonical key `director_of_intake`, legacy alias `intake_lead`)
 *   - Intake Coordinator   (`intake_coordinator`, legacy aliases `intake`, `intake_team`)
 *
 * `intake_lead` remains the stored OS role key so existing assignments,
 * RLS policies, and route allow-lists keep working untouched.
 */

export const DIRECTOR_OF_INTAKE_ROLE_KEYS = [
  "director_of_intake",
  "intake_lead",
  "intake_director",
  "intake_leadership",
  "intake_manager",
] as const;

export const INTAKE_COORDINATOR_ROLE_KEYS = [
  "intake_coordinator",
  "intake",
  "intake_team",
] as const;

/** Every role key that grants any Intake experience. */
export const ALL_INTAKE_ROLE_KEYS: string[] = [
  ...DIRECTOR_OF_INTAKE_ROLE_KEYS,
  ...INTAKE_COORDINATOR_ROLE_KEYS,
];

/** Canonical OS role key stored/checked for the Director experience. */
export const DIRECTOR_OF_INTAKE_OS_ROLE = "intake_lead";
export const DIRECTOR_OF_INTAKE_LABEL = "Director of Intake";
export const INTAKE_COORDINATOR_LABEL = "Intake Coordinator";

/** Normalize any intake identifier to its canonical OS role key. */
export function normalizeIntakeRole(role: string | null | undefined): string | null {
  const r = (role ?? "").trim().toLowerCase();
  if (!r) return null;
  if ((DIRECTOR_OF_INTAKE_ROLE_KEYS as readonly string[]).includes(r)) return DIRECTOR_OF_INTAKE_OS_ROLE;
  if ((INTAKE_COORDINATOR_ROLE_KEYS as readonly string[]).includes(r)) return "intake_coordinator";
  return null;
}

const ELEVATED = new Set(["admin", "super_admin", "systems_admin", "operations_leadership", "coo"]);

/** True when the actor holds the Director of Intake experience. */
export function isDirectorOfIntake(roles: (string | null | undefined)[]): boolean {
  return roles.some((r) => {
    const v = (r ?? "").trim().toLowerCase();
    return normalizeIntakeRole(v) === DIRECTOR_OF_INTAKE_OS_ROLE || ELEVATED.has(v);
  });
}

export function isIntakeCoordinator(roles: (string | null | undefined)[]): boolean {
  return roles.some((r) => normalizeIntakeRole(r) === "intake_coordinator");
}

export function hasIntakeAccess(roles: (string | null | undefined)[]): boolean {
  return isDirectorOfIntake(roles) || isIntakeCoordinator(roles);
}

/** Display label for any intake role identifier. */
export function intakeRoleLabel(role: string | null | undefined): string | null {
  const c = normalizeIntakeRole(role);
  if (c === DIRECTOR_OF_INTAKE_OS_ROLE) return DIRECTOR_OF_INTAKE_LABEL;
  if (c === "intake_coordinator") return INTAKE_COORDINATOR_LABEL;
  return null;
}

/** Director-only capabilities (everything a coordinator can do, plus these). */
export const DIRECTOR_ONLY_CAPABILITIES = [
  "assign_leads",
  "reassign_leads",
  "approve_exception",
  "ctm_review",
  "ctm_health",
  "intake_reporting",
  "manage_templates",
  "manage_configuration",
  "approve_admission",
] as const;

export type IntakeCapability = (typeof DIRECTOR_ONLY_CAPABILITIES)[number];

export function canUseIntakeCapability(
  roles: (string | null | undefined)[],
  capability: IntakeCapability,
): boolean {
  return DIRECTOR_ONLY_CAPABILITIES.includes(capability) ? isDirectorOfIntake(roles) : hasIntakeAccess(roles);
}
