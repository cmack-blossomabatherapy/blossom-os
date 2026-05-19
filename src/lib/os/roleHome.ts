import type { OSRole } from "./permissions";

/** Role → primary dashboard route. Used for nav distribution and `/os` redirect. */
export const ROLE_HOME: Record<OSRole, string> = {
  super_admin: "/os",
  executive_leadership: "/os/executive",
  operations_leadership: "/os/operations",
  state_director: "/os/state-director",
  intake_coordinator: "/os/intake-coordinator",
  authorization_coordinator: "/os/auth-coordinator",
  scheduling_team: "/os/scheduling-team",
  recruiting_team: "/os/recruiting-team",
  hr_team: "/os/hr-team",
  billing_finance: "/os/billing-finance",
  qa_team: "/os/qa-team",
  payroll_coordinator: "/os/payroll-coordinator",
  bcba: "/os/bcba",
  rbt: "/os/rbt",
};

/** All role-specific dashboard routes (for super_admin overview). */
export const ALL_ROLE_DASHBOARDS: { to: string; label: string }[] = [
  { to: "/os/executive", label: "Executive" },
  { to: "/os/operations", label: "Operations" },
  { to: "/os/state-director", label: "State Director" },
  { to: "/os/intake-coordinator", label: "Intake Coordinator" },
  { to: "/os/auth-coordinator", label: "Auth Coordinator" },
  { to: "/os/scheduling-team", label: "Scheduling Team" },
  { to: "/os/recruiting-team", label: "Recruiting Team" },
  { to: "/os/hr-team", label: "HR Team" },
  { to: "/os/billing-finance", label: "Billing & Finance" },
  { to: "/os/qa-team", label: "QA Team" },
  { to: "/os/bcba", label: "BCBA" },
  { to: "/os/rbt", label: "RBT" },
];