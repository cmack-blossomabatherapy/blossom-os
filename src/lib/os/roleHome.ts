import type { OSRole } from "./permissions";

/** Role → first working landing page. Used for login/root redirects. */
const ROLE_HOME_MAP: Partial<Record<OSRole, string>> = {
  super_admin: "/",
  systems_admin: "/admin",
  executive: "/ws/executive",
  executive_leadership: "/ws/executive",
  coo: "/ws/executive",
  director_of_operations: "/ws/operations",
  operations_manager: "/ws/operations",
  operations_leadership: "/ws/operations",
  state_director: "/ws/state-command",
  assistant_state_director: "/ws/state-command",

  marketing_growth_lead: "/ws/marketing",
  marketing_team: "/ws/marketing",

  intake_lead: "/ws/intake",
  intake_coordinator: "/ws/intake",
  finance_benefits_lead: "/ws/finance",
  finance_benefits_team: "/ws/finance",
  authorization_manager: "/ws/authorizations",
  authorization_coordinator: "/ws/authorizations",

  qa_director: "/ws/qa",
  qa_specialist: "/ws/qa",
  qa_team: "/ws/qa",
  clinical_lead: "/bcba",
  bcba: "/training/journeys/bcba",
  rbt: "/rbt/my-day",
  behavioral_support: "/reports",

  scheduling_lead: "/ws/scheduling",
  scheduling_coordinator: "/ws/scheduling",
  scheduling_team: "/ws/scheduling",
  staffing_lead: "/ws/scheduling",
  staffing_coordinator: "/ws/scheduling",

  recruiting_lead: "/ws/recruiting",
  recruiting_coordinator: "/ws/recruiting",
  recruiting_team: "/ws/recruiting",
  hr_lead: "/ws/hr",
  hr_team: "/ws/hr",
  payroll_lead: "/ws/hr",
  payroll_coordinator: "/ws/hr",

  billing_lead: "/ws/billing-credentialing",
  credentialing_lead: "/ws/billing-credentialing",
  rcm_team: "/ws/billing-credentialing",
  billing_finance: "/ws/finance",

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
