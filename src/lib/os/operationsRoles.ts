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