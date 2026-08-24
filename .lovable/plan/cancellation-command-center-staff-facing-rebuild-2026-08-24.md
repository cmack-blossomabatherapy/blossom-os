# Cancellation Command Center — staff-facing rebuild

Today this page is the last upload-driven report: it asks the user to upload three CentralReach exports (Scheduling / Billing / Authorization), restores a "last session" from local storage, shows requirements and source-coverage banners, and only builds the dashboard after a "Build Dashboard" click. Every other primary report already reads normalized CentralReach Data Hub data.

Goal: make it work exactly like BCBA Productivity Report V3 — open it and it just shows real numbers from the Data Hub, with no upload or export-file language anywhere for normal staff.

## What changes

1. **Data comes from the Data Hub, automatically**
   - The page loads normalized cancellation data (schedule events, plus billing for lost-revenue math) on mount, with a Refresh button.
   - No file pickers, no upload chips, no "Build Dashboard" step, no restored-session banner, no requirements/coverage cards, no links telling staff to upload exports.
   - If the Data Hub has no data yet, show the standard calm empty state (same wording pattern as the other reports) instead of fabricated numbers.

2. **Staff-facing layout (BCBA V3 pattern)**
   - Header: title, one-line subtitle, Refresh + Export CSV, Blossom AI button.
   - KPI row: Cancellation rate, Total cancellations, Lost hours, Lost revenue (when billing rate data is available), Clients affected, Providers affected — each clickable into a drilldown.
   - Primary visual: cancellation trend by week.
   - Supporting visual: lost hours by reason.
   - Tabs for the actionable breakdowns already computed today: Reason, Provider, Client, State, Payor.
   - Row/KPI click opens the source-row drilldown dialog.

3. **Filters that persist**
   - State, Client, Provider, Payor, Status, plus date range and search — all stored in the URL like BCBA V3, so filters survive tab switches, reloads, and shared links.

4. **Diagnostics restricted**
   - The CentralReach freshness strip (latest upload, coverage window, row counts, "Open CentralReach Data Hub") is only rendered for Super Admin. Staff never see import/export plumbing.

## Technical notes

- Rewrite `src/pages/os/reports/CancellationCommandCenter.tsx` on top of `useCrPrimaryReport(["schedule", "billing"])` and the existing `computeCancellationMetrics` in `src/lib/os/reports/crPrimary/metrics/cancellation.ts` (reason normalization, per-dimension groups, weekly trend already exist — no new metric logic).
- Reuse the shared primary-report building blocks: `KpiScorecards`, `PrimaryChart`, `PrimaryFilterBar` / `FilterCombobox` + `DateRangeFilter`, `PrimaryTable`, `DrilldownDrawer`, and `useUrlFilterState`.
- Gate the freshness strip inside `PrimaryReportShell` (or via a `showDataSourceStrip` prop) on the current effective role being `super_admin`, so all primary reports behave consistently.
- Delete the page's upload/parse paths (`parseAnyFile`, admin-upload auto-load, IndexedDB session persistence, `CentralReachRequirementsCard`, `SourceCoverageBanner`, `UploadChip`) from this page only; the Data Hub keeps its own upload UI.
- Update the catalog copy for `cancellation-command-center` in `src/lib/os/reportsCatalog.ts` (currently "Upload CR Scheduling, Billing and Authorization exports…") to Data-Hub-backed wording, and `lastUpdated` off "On upload".
- Route stays `/reports/cancellation-command-center`; existing `/reports/qa-cancellation` redirect unchanged.
- Add a test asserting the page has no upload controls and reads from the Data Hub loader, alongside the existing primary-report tests.
