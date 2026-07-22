import { Navigate, useLocation } from "react-router-dom";

/**
 * Phase 4 — safe legacy-report redirect.
 *
 * React Router's `<Navigate to="/x" />` does NOT preserve `search` or `hash`,
 * so any legacy bookmark like
 *   /reports/bcba-productivity-report?state=NC&start=2026-06-01
 * would land on the new route with all filters/saved-view refs stripped.
 *
 * This wrapper preserves both, so filters, saved-view ids, drilldown keys,
 * and shared-report tokens survive the redirect.
 */
export function NavigateWithSearch({ to, replace = true }: { to: string; replace?: boolean }) {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: to, search, hash }} replace={replace} />;
}

export default NavigateWithSearch;