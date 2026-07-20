import type { OSRole } from "./permissions";

/**
 * Role → first working landing page in the live Blossom OS shell.
 * Used by login/root redirects and the home link in OSShell.
 *
 * IMPORTANT: No legacy /ws/* entries here. Executive Leadership must NOT
 * land in the legacy WorkspaceShell — that's a separate UI system.
 */
const ROLE_HOME_MAP: Partial<Record<OSRole, string>> = {
  super_admin:                "/dashboard/legacy",
  systems_admin:              "/admin",

  executive:                  "/executive",
  executive_leadership:       "/executive",
  coo:                        "/executive",

  director_of_operations:     "/operations/command-center",
  operations_manager:         "/operations/command-center",
  operations_leadership:      "/operations/command-center",

  state_director:             "/state-operations",
  assistant_state_director:   "/state-operations",
  regional_state_director:    "/state-operations?tab=regional",

  marketing_growth_lead:      "/marketing",
  marketing_team:             "/marketing",

  business_development:       "/business-development",

  intake_lead:                "/intake/dashboard",
  intake_coordinator:         "/intake/dashboard",

  finance_benefits_lead:      "/reports",
  finance_benefits_team:      "/reports",

  authorization_manager:      "/authorizations",
  authorization_coordinator:  "/authorizations",

  qa_director:                "/qa-team",
  qa_specialist:              "/qa-team",
  qa_team:                    "/qa-team",

  clinical_director:          "/clinical-director",
  clinical_lead:              "/clinical-director",
  bcba:                       "/bcba",
  rbt:                        "/rbt/app/home",
  behavioral_support:         "/behavioral-support",

  scheduling_lead:            "/scheduling",
  scheduling_coordinator:     "/scheduling",
  scheduling_team:            "/scheduling",
  staffing_lead:              "/ops/staffing",
  staffing_coordinator:       "/ops/staffing",
  staffing_team:              "/ops/staffing",

  recruiting_lead:            "/recruiting-team",
  recruiting_coordinator:     "/recruiting-team",
  recruiting_team:            "/recruiting-team",

  hr_lead:                    "/hr-team",
  hr_team:                    "/hr-team",

  training_manager:           "/hr/training-center",
  office_manager:             "/work-queue?scope=office",
  state_va:                   "/state-operations",
  clinic_growth:              "/executive/growth-readiness?scope=clinic",

  credentialing_team:         "/credentialing",
  credentialing_lead:         "/credentialing",

  payroll_lead:               "/payroll/workspace",
  payroll_coordinator:        "/payroll/workspace",

  billing_lead:               "/billing-finance",
  rcm_team:                   "/billing-finance",
  billing_finance:            "/billing-finance",

  case_manager:               "/case-manager",
  viewer:                     "/reports",
};

/** Always returns a valid path; falls back to "/" for unknown roles. */
export const ROLE_HOME: Record<OSRole, string> = new Proxy({} as Record<OSRole, string>, {
  get: (_t, prop: string) => ROLE_HOME_MAP[prop as OSRole] ?? "/",
});

/** All role-specific dashboard routes (for super_admin overview). */
export const ALL_ROLE_DASHBOARDS: { to: string; label: string }[] = [
  { to: "/executive", label: "Executive" },
  { to: "/operations", label: "Operations" },
  { to: "/state-director", label: "State Director" },
  { to: "/intake-coordinator", label: "Intake Coordinator" },
  { to: "/auth-coordinator", label: "Auth Coordinator" },
  { to: "/scheduling", label: "Scheduling Team" },
  { to: "/recruiting-team", label: "Recruiting Team" },
  { to: "/hr-team", label: "HR Team" },
  { to: "/billing-finance", label: "Billing & Finance" },
  { to: "/qa-team", label: "QA / Compliance" },
  { to: "/payroll-coordinator", label: "Payroll Coordinator" },
  { to: "/bcba", label: "BCBA" },
  { to: "/rbt", label: "RBT" },
  { to: "/marketing", label: "Marketing Team" },
  { to: "/case-manager", label: "Case Manager" },
];
