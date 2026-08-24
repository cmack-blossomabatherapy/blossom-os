# Keep report filters when returning to the tab

## What's happening

Confirmed root cause: the app's `ProtectedRoute` wrapper unmounts every page whenever the browser tab regains focus.

- Supabase silently rotates the access token when a tab becomes visible again, firing a `TOKEN_REFRESHED` event.
- `AuthContext` handles that event by calling `setUser(...)` with a brand-new user object (same person, new object identity).
- `ProtectedRoute`'s MFA check effect depends on that `user` object, so it re-runs, sets its status back to `loading`, and renders a full-screen spinner.
- While the spinner is up, the report page is unmounted. When it comes back it is a fresh mount: filters, date range, search, drilldown and scroll position are all gone, and the CentralReach data reloads.

This affects every authenticated page, but it's most painful on the reports (BCBA Productivity Report V3, Authorization Analysis, and the other CentralReach reports) because their filters take real effort to set.

## The fix

### 1. Stop the focus-triggered unmount (the actual bug)

In `src/components/auth/ProtectedRoute.tsx`:

- Key the MFA check on `user?.id` instead of the whole `user` object, so a token rotation for the same signed-in user does not re-run it.
- Never fall back to the full-screen spinner once MFA has been resolved for that user. Re-checks happen quietly in the background and only change the outcome if the status actually changed (e.g. session truly expired, which still redirects).
- Keep the current behavior for real transitions: no session, needs enroll, needs challenge, and expired 30-day window all still redirect exactly as today.

### 2. Make report filters durable anyway

Even with the unmount fixed, filters should survive a reload or a shared link. Persist them in the URL query string:

- `BcbaProductivityReportV3` — filters, search text, and date range read from and write to the URL.
- The shared CentralReach primary report shell (`CentralReachPrimaryReport` + `PrimaryFilterBar`) — same treatment, so all 7 reports that share it inherit it.
- Defaults stay out of the URL so links stay clean; "Clear all" empties the params.
- Drilldown state stays in-memory (transient by nature).

### 3. Avoid the needless data refetch

Report pages load on mount only, so with the unmount fixed there is no repeat fetch. The shared CentralReach row cache stays as-is, and Refresh remains the explicit way to re-pull.

## Verification

- New test asserting `ProtectedRoute` does not re-enter its loading state when the user object identity changes but the user id does not.
- New test asserting the report filter state round-trips through URL params (set filter -> params updated -> reading params restores the same filter set).
- Manual check on BCBA Productivity Report V3: set several filters + a date range, switch to another tab for ~30 seconds, come back, and confirm the filters, rows and scroll position are unchanged with no loading flash.

## Technical notes

Files expected to change:
- `src/components/auth/ProtectedRoute.tsx` (unmount fix)
- `src/pages/os/reports/BcbaProductivityReportV3.tsx`
- `src/pages/os/reports/CentralReachPrimaryReport.tsx`, `src/components/reports/crPrimary/PrimaryFilterBar.tsx`
- Small URL-state helper reuse from `src/hooks/useUrlState.ts`
- New tests under `src/test/`

No backend, schema, or RLS changes.
