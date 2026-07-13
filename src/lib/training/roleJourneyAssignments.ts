import { TRAINING_PATHS } from "@/lib/academy/trainingPaths";
import { ROLE_META } from "@/lib/roles";

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
  // Systems / super admin
  admin: "systems",
  super_admin: "systems",
  systems_admin: "systems",
  training_admin: "systems",
  // Executive leadership
  exec: "executive",
  executive: "executive",
  executive_leadership: "executive",
  ceo: "executive",
  // Operations leadership
  coo: "operations",
  director_of_operations: "operations",
  operations_leadership: "operations",
  ops_manager: "operations",
  operations_manager: "operations",
  dept_manager: "operations",
  // Finance / billing / payroll
  finance: "finance",
  finance_benefits_lead: "finance",
  finance_benefits_team: "finance",
  payroll_admin: "finance",
  payroll_lead: "finance",
  billing_lead: "finance",
  rcm_team: "finance",
  // Clinic
  clinic: "clinic-operations",
  clinic_director: "clinical-director",
  // True generic fallbacks (kept on Blossom OS Basics)
  phone_support: "blossom-os-basics",
  staff: "blossom-os-basics",
  viewer: "blossom-os-basics",
};

export const FALLBACK_PATH_SLUG = "blossom-os-basics";

/**
 * Slugs treated as generic fallbacks. Anything mapped to one of these
 * is only used when no specific department/role journey applies.
 */
const GENERIC_FALLBACK_SLUGS = new Set<string>(["blossom-os-basics"]);

/**
 * Every role slug the HR "Role Journeys" picker offers, sorted alphabetically.
 * Restricted to canonical AppRole values so HR only sees rows they can
 * actually assign. `DEFAULT_ROLE_TO_SLUG` still contains extra legacy
 * aliases so the runtime resolver tolerates any historical role string.
 */
export const ALL_ROLE_SLUGS: string[] = ROLE_META.map((r) => r.key as string).sort();

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
  // 1. HR overrides always win.
  for (const r of rs) {
    if (overrides[r]) return overrides[r];
  }
  // 2. Prefer any specific (non-generic) journey, regardless of role order.
  let genericMatch: string | null = null;
  for (const r of rs) {
    const slug = DEFAULT_ROLE_TO_SLUG[r];
    if (!slug) continue;
    if (GENERIC_FALLBACK_SLUGS.has(slug)) {
      if (!genericMatch) genericMatch = slug;
      continue;
    }
    return slug;
  }
  // 3. Otherwise use the first generic match, else the universal fallback.
  return genericMatch ?? FALLBACK_PATH_SLUG;
}

/** Validation helper — does this slug exist in TRAINING_PATHS? */
export function isKnownPathSlug(slug: string): boolean {
  return TRAINING_PATHS.some((p) => p.slug === slug);
}