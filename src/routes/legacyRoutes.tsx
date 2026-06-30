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
    <Route path="/staffing-dashboard" element={<Navigate to="/ops/staffing?tab=open-cases" replace />} />
    <Route path="/qa-dashboard" element={<Navigate to="/qa-workspace" replace />} />
    <Route path="/finance-dashboard" element={<Navigate to="/billing-finance" replace />} />
    <Route path="/recruiting-dashboard" element={<Navigate to="/recruiting/workspace" replace />} />
    <Route path="/phone-calls" element={<Navigate to="/phone" replace />} />
    {/* Sprint 27 — legacy static link redirects.
        These keep older inline links inside components from landing on
        404/blank pages while the components themselves are gradually
        updated to the canonical routes. Do NOT remove without auditing
        every callsite. */}
    <Route path="/os/authorizations" element={<Navigate to="/ops/authorizations" replace />} />
    <Route path="/hr/training-management" element={<Navigate to="/hr/training-center" replace />} />
    <Route path="/hr/training-assign" element={<Navigate to="/hr/training-center" replace />} />
    <Route path="/supervision" element={<Navigate to="/bcba/supervision" replace />} />
    <Route path="/parent-training" element={<Navigate to="/bcba/parent-training" replace />} />
    <Route path="/ask" element={<Navigate to="/help" replace />} />
    {/* /ai is intentionally NOT a visible AI menu — fall back to the role
        dashboard so legacy "Operational Insights" buttons resolve. */}
    <Route path="/ai" element={<Navigate to="/dashboard" replace />} />
    <Route path="/payroll/employees" element={<Navigate to="/user-management" replace />} />
    <Route path="/admin/permissions" element={<Navigate to="/user-management" replace />} />
  </>
);
