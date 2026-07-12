import { TRAINING_PATHS } from "@/lib/academy/trainingPaths";

/**
 * Default role -> Training Academy wireframe path mapping.
 * HR can override any of these via the "Role Journeys" tab in the
 * Training Management Center; overrides live in
 * `training_role_journey_assignments`.
 */
export const DEFAULT_ROLE_TO_SLUG: Record<string, string> = {
  rbt: "rbt",
  bcba: "bcba",
  case_manager: "case-manager",
  behavioral_support: "behavioral-support",
  clinical_director: "clinical-director",
  clinical_lead: "clinical-director",
  state_director: "state-director",
  assistant_state_director: "state-director",
  intake: "intake",
  intake_coordinator: "intake",
  intake_lead: "intake",
  intake_team: "intake",
  marketing: "marketing",
  marketing_team: "marketing",
  marketing_growth_lead: "marketing",
  bd: "business-development",
  business_development: "business-development",
  recruiting: "recruiting",
  recruiting_team: "recruiting",
  recruiting_lead: "recruiting",
  recruiting_coordinator: "recruiting",
  recruiting_assistant: "recruiting",
  auths: "authorizations",
  authorizations: "authorizations",
  authorization_coordinator: "authorizations",
  authorization_manager: "authorizations",
  authorizations_team: "authorizations",
  auth_team: "authorizations",
  scheduling: "scheduling",
  scheduling_team: "scheduling",
  scheduling_lead: "scheduling",
  scheduling_coordinator: "scheduling",
  staffing: "staffing",
  staffing_team: "staffing",
  staffing_lead: "staffing",
  staffing_coordinator: "staffing",
  hr_admin: "hr",
  hr_admin_assistant: "hr",
  hr_manager: "hr",
  hr_team: "hr",
  hr_lead: "hr",
  hr: "hr",
  credentialing: "credentialing",
  credentialing_team: "credentialing",
  credentialing_lead: "credentialing",
  credentialing_coordinator: "credentialing",
  qa: "qa",
  qa_team: "qa",
  qa_director: "qa",
  qa_specialist: "qa",
  // Leadership / cross-functional roles → Blossom OS Basics fallback.
  admin: "blossom-os-basics",
  super_admin: "blossom-os-basics",
  systems_admin: "blossom-os-basics",
  exec: "blossom-os-basics",
  executive: "blossom-os-basics",
  executive_leadership: "blossom-os-basics",
  operations_leadership: "blossom-os-basics",
  ceo: "blossom-os-basics",
  coo: "blossom-os-basics",
  director_of_operations: "blossom-os-basics",
  ops_manager: "blossom-os-basics",
  operations_manager: "blossom-os-basics",
  dept_manager: "blossom-os-basics",
  training_admin: "blossom-os-basics",
  // Finance / billing / payroll
  finance: "blossom-os-basics",
  finance_benefits_lead: "blossom-os-basics",
  finance_benefits_team: "blossom-os-basics",
  payroll_admin: "blossom-os-basics",
  payroll_lead: "blossom-os-basics",
  billing_lead: "blossom-os-basics",
  rcm_team: "blossom-os-basics",
  // Support / clinic / generic
  phone_support: "blossom-os-basics",
  clinic: "blossom-os-basics",
  clinic_director: "clinical-director",
  staff: "blossom-os-basics",
  viewer: "blossom-os-basics",
};

export const FALLBACK_PATH_SLUG = "blossom-os-basics";

/** Every role slug the picker offers, sorted alphabetically. */
export const ALL_ROLE_SLUGS: string[] = Object.keys(DEFAULT_ROLE_TO_SLUG).sort();

/** Human-friendly label for a role slug (Title Case). */
export function humanizeRoleSlug(slug: string): string {
  return slug
    .split("_")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export type RoleJourneyOverrides = Record<string, string>;

/**
 * Resolve which Training Academy path a learner should see.
 * Overrides take precedence over defaults; falls back to Blossom OS Basics
 * when the learner has no matching role.
 */
export function resolveRoleJourney(
  roles: readonly string[] | undefined,
  overrides: RoleJourneyOverrides = {},
): string {
  const rs = roles ?? [];
  for (const r of rs) {
    if (overrides[r]) return overrides[r];
  }
  for (const r of rs) {
    if (DEFAULT_ROLE_TO_SLUG[r]) return DEFAULT_ROLE_TO_SLUG[r];
  }
  return FALLBACK_PATH_SLUG;
}

/** Validation helper — does this slug exist in TRAINING_PATHS? */
export function isKnownPathSlug(slug: string): boolean {
  return TRAINING_PATHS.some((p) => p.slug === slug);
}