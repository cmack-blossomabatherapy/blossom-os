import type { OSRole } from "./permissions";

/** Role → first working landing page. Used for login/root redirects. */
const ROLE_HOME_MAP: Partial<Record<OSRole, string>> = {
  super_admin: "/",
  systems_admin: "/admin",
  executive: "/ws/executive",
  executive_leadership: "/ws/executive",
  coo: "/ws/executive",
  director_of_operations: "/operations/command-center",
  operations_manager: "/operations/command-center",
  operations_leadership: "/operations/command-center",
  state_director: "/state-director",
  assistant_state_director: "/state-director",

  marketing_growth_lead: "/marketing",
  marketing_team: "/marketing",

  intake_lead: "/intake",
  intake_coordinator: "/intake",
  finance_benefits_lead: "/ws/finance",
  finance_benefits_team: "/ws/finance",
  authorization_manager: "/authorizations",
  authorization_coordinator: "/authorizations",

  qa_director: "/qa",
  qa_specialist: "/qa",
  qa_team: "/qa",
  clinical_lead: "/bcba",
  bcba: "/training/journeys/bcba",
  rbt: "/rbt/my-day",
  behavioral_support: "/reports",

  scheduling_lead: "/scheduling",
  scheduling_coordinator: "/scheduling",
  scheduling_team: "/scheduling",
  staffing_lead: "/scheduling",
  staffing_coordinator: "/scheduling",

  recruiting_lead: "/recruiting/workspace",
  recruiting_coordinator: "/recruiting/workspace",
  recruiting_team: "/recruiting/workspace",
  hr_lead: "/hr-team",
  hr_team: "/hr-team",
  payroll_lead: "/payroll/workspace",
  payroll_coordinator: "/payroll/workspace",

  billing_lead: "/billing-finance",
  credentialing_lead: "/billing-finance",
  rcm_team: "/billing-finance",
  billing_finance: "/billing-finance",

  case_manager: "/reports",
  viewer: "/reports",
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
  { to: "/scheduling-team", label: "Scheduling Team" },
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
