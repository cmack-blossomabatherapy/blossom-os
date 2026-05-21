## Goal
Make "Active Clients" on the KPI Scorecard page match the Command Center so both screens always show the same number for a given state and week.

## Root cause
- Command Center reads from `useStateOps(activeState, "4w")` → `quickStats()` → unique clients in real BCBA session data (`src/lib/analytics/stateOps.ts`).
- KPI Scorecard reads from `generateScorecards(state, 12)` in `src/lib/scorecards/mockScorecards.ts`, which fabricates `active_clients` from a `STATE_BASE` constant plus hash jitter — totally disconnected from sessions.

## Fix

**1. Add a weekly active-clients aggregator** in `src/lib/analytics/stateOps.ts`
- Export `activeClientsByWeek(sessions, weeks = 12)` returning `{ weekOf: "YYYY-MM-DD", clients: number }[]`, built from `weeklySeries()` so the math is identical to Command Center's `clientsThisWeek`.

**2. Update the scorecard generator** in `src/lib/scorecards/mockScorecards.ts`
- Add an optional `activeClientsByWeek?: Record<string, number>` parameter to `generateScorecards()`.
- When provided, overwrite `values.active_clients` for each week with the real number; recompute the derived fields that depend on it (`total_hours`, `total_potential_hours`, `avg_client_hours`, `ongoing_ias`, `restaffing_needed`, `tx_auth_received`) using the real client count so trends stay coherent.
- When not provided, keep current behavior (so other callers don't break).

**3. Wire the page** in `src/pages/os/OSKpiScorecards.tsx`
- Call `useStateOps(state, "12w")` (extend the hook's window if it's capped at 4w — pass through to `weeklySeries`).
- Build the `activeClientsByWeek` map from the returned series and pass it into `generateScorecards(state, 12, { activeClientsByWeek })`.
- Fallback: if `hasAnyData` is false for that state, render today's behavior unchanged.

**4. Sanity check**
- After change, switch state in the Command Center and KPI Scorecard for VA/NC/GA/TN/MD; the "Active Clients" tile and the "Active clients" MiniStat should always match for the latest week.

## Out of scope
- Other KPI tiles (hours, BCBA %, hires) stay mock for now.
- No backend / Supabase changes.
- No visual changes.
