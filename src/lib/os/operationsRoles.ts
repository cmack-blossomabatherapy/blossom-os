/**
 * Canonical role strings that resolve to Operations Leadership scope.
 *
 * Historically several places in App.tsx duplicated role arrays for the
 * ops leadership tier and drifted apart (some included the canonical
 * `operations_leadership` alias, others didn't). Use this constant in
 * PermissionRoute `allowedRoles` for any surface owned by Operations
 * Leadership so guards stay aligned as new aliases land.
 */
export const OPERATIONS_LEADERSHIP_ROUTE_ROLES = [
  "admin",
  "super_admin",
  "systems_admin",
  "exec",
  "executive",
  "executive_leadership",
  "ceo",
  "coo",
  "ops_manager",
  "director_of_operations",
  "operations_manager",
  "operations_leadership",
] as const;

/** Ops Leadership + State Directors (used by state-scoped ops surfaces). */
export const OPERATIONS_AND_STATE_ROUTE_ROLES = [
  ...OPERATIONS_LEADERSHIP_ROUTE_ROLES,
  "state_director",
  "assistant_state_director",
] as const;

/**
 * Executive Leadership tier — roles allowed to reach `/executive/*` surfaces
 * (company-wide KPIs, strategic risks, growth readiness, org health).
 * Anything more sensitive than this should escalate to an explicit AdminRoute.
 */
export const EXECUTIVE_ROUTE_ROLES = [
  "admin",
  "super_admin",
  "systems_admin",
  "exec",
  "executive",
  "executive_leadership",
  "ceo",
  "coo",
  "ops_manager",
  "director_of_operations",
  "operations_manager",
  "operations_leadership",
  // Clinic Growth-to-Launch shares `/executive/growth-readiness`.
  "clinic_growth",
] as const;

/**
 * State Director tier — leadership + state directors (all variants) + the
 * assistant/VA roles that report into them. Used to guard `/state-director`
 * and other state-scoped landing pages.
 */
export const STATE_DIRECTOR_ROUTE_ROLES = [
  ...OPERATIONS_AND_STATE_ROUTE_ROLES,
  "regional_state_director",
  "state_va",
] as const;

/**
 * Finance visibility tier — roles allowed to reach `/billing-finance` and
 * related revenue/RCM surfaces. Payroll admins are intentionally excluded;
 * they use `/hr/payroll` instead. Kept narrow because finance surfaces expose
 * revenue, collections, and write-off data.
 */
export const FINANCE_ROUTE_ROLES = [
  "admin",
  "super_admin",
  "systems_admin",
  "exec",
  "executive",
  "executive_leadership",
  "ceo",
  "coo",
  "ops_manager",
  "director_of_operations",
  "operations_manager",
  "operations_leadership",
  "finance",
  "billing_finance",
  "billing",
  "rcm_director",
  "controller",
  // Canonical assignable finance roles from the app_role enum. These map
  // to the `billing_finance` OS role in OSRoleContext and render the
  // Finance Visibility sidebar, so they must be permitted to reach
  // /billing-finance and its tabbed sub-routes.
  "billing_lead",
  "rcm_team",
  "finance_benefits_lead",
  "finance_benefits_team",
] as const;