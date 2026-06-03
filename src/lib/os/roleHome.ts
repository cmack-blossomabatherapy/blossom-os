import type { OSRole } from "./permissions";

/** Role → first working landing page. Used for login/root redirects. */
export const ROLE_HOME: Record<OSRole, string> = {
  super_admin: "/",
  executive_leadership: "/bcba-performance-dashboard",
  operations_leadership: "/operations/command-center",
  state_director: "/training",
  intake_coordinator: "/intake",
  authorization_coordinator: "/auth-workspace",
  scheduling_team: "/scheduling-workspace",
  recruiting_team: "/recruiting/workspace",
  hr_team: "/evaluations",
  billing_finance: "/finance-dashboard",
  qa_team: "/reports",
  payroll_coordinator: "/reports",
  bcba: "/training/journeys/bcba",
  rbt: "/rbt/my-day",
  marketing_team: "/marketing",
  case_manager: "/reports",
  behavioral_support: "/reports",
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
  { to: "/qa-team", label: "QA / Compliance" },
  { to: "/payroll-coordinator", label: "Payroll Coordinator" },
  { to: "/bcba", label: "BCBA" },
  { to: "/rbt", label: "RBT" },
  { to: "/marketing", label: "Marketing Team" },
  { to: "/case-manager", label: "Case Manager" },
];