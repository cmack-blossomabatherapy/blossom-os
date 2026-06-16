import type { OSRole } from "./permissions";

/** Role → first working landing page. Used for login/root redirects. */
const ROLE_HOME_MAP: Partial<Record<OSRole, string>> = {
  super_admin: "/",
  systems_admin: "/admin",
  executive: "/executive",
  executive_leadership: "/executive",
  coo: "/executive",
  director_of_operations: "/operations",
  operations_manager: "/operations",
  operations_leadership: "/operations",
  state_director: "/state-director",
  assistant_state_director: "/state-director",

  marketing_growth_lead: "/marketing",
  marketing_team: "/marketing",

  intake_lead: "/intake-coordinator",
  intake_coordinator: "/intake-coordinator",
  finance_benefits_lead: "/billing-finance",
  finance_benefits_team: "/billing-finance",
  authorization_manager: "/auth-workspace",
  authorization_coordinator: "/auth-workspace",

  qa_director: "/qa-team",
  qa_specialist: "/qa-team",
  qa_team: "/qa-team",
  clinical_lead: "/bcba",
  bcba: "/training/journeys/bcba",
  rbt: "/rbt/my-day",
  behavioral_support: "/reports",

  scheduling_lead: "/scheduling-workspace",
  scheduling_coordinator: "/scheduling-workspace",
  scheduling_team: "/scheduling-workspace",
  staffing_lead: "/scheduling-workspace",
  staffing_coordinator: "/scheduling-workspace",

  recruiting_lead: "/recruiting/workspace",
  recruiting_coordinator: "/recruiting/workspace",
  recruiting_team: "/recruiting/workspace",
  hr_lead: "/hr-team",
  hr_team: "/hr-team",
  payroll_lead: "/billing-finance",
  payroll_coordinator: "/billing-finance",

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
