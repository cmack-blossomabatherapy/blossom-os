import { Navigate, Route } from "react-router-dom";

/**
 * Legacy dashboard redirects — old "*-dashboard" paths that now redirect
 * to their canonical OS workspace pages. These remain inside the
 * AppLayout-protected route group, so they are spread into that parent.
 *
 * /clinic-dashboard is intentionally NOT included here because the canonical
 * OS clinic route is not yet finalized (held in App.tsx).
 */
export const LegacyDashboardRedirects = (
  <>
    <Route path="/intake-dashboard" element={<Navigate to="/intake" replace />} />
    <Route path="/authorizations-dashboard" element={<Navigate to="/authorizations" replace />} />
    <Route path="/scheduling-dashboard" element={<Navigate to="/scheduling" replace />} />
    <Route path="/staffing-dashboard" element={<Navigate to="/staffing" replace />} />
    <Route path="/qa-dashboard" element={<Navigate to="/qa-workspace" replace />} />
    <Route path="/finance-dashboard" element={<Navigate to="/billing-finance" replace />} />
    <Route path="/recruiting-dashboard" element={<Navigate to="/recruiting/workspace" replace />} />
    <Route path="/phone-calls" element={<Navigate to="/phone" replace />} />
  </>
);
