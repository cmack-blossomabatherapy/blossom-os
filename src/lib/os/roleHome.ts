import type { OSRole } from "./permissions";

/** Role → primary dashboard route. Used for nav distribution and `/os` redirect. */
export const ROLE_HOME: Record<OSRole, string> = {
  super_admin: "/",
  executive_leadership: "/executive",
  operations_leadership: "/operations",
  state_director: "/state-director",
  intake_coordinator: "/intake-coordinator",
  authorization_coordinator: "/auth-coordinator",
  scheduling_team: "/scheduling-team",
  recruiting_team: "/recruiting-team",
  hr_team: "/hr-team",
  billing_finance: "/billing-finance",
  qa_team: "/qa-team",
  payroll_coordinator: "/payroll-coordinator",
  bcba: "/bcba",
  rbt: "/rbt",
  marketing_team: "/marketing",
  case_manager: "/case-manager",
};

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
  { to: "/qa-team", label: "QA Team" },
  { to: "/payroll-coordinator", label: "Payroll Coordinator" },
  { to: "/bcba", label: "BCBA" },
  { to: "/rbt", label: "RBT" },
  { to: "/marketing", label: "Marketing Team" },
  { to: "/case-manager", label: "Case Manager" },
];