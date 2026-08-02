## 1. Unassigned hours — what the data actually says

I queried the live CentralReach Data Hub billing table (`cr_billing_sessions`) directly:

- 56,936 rows, 179,835.9 total hours, 976 unique clients
- Client identity is clean: every row has a CentralReach client id, no name/id mismatches, no rows missing a rendering provider
- Rows carrying a BCBA provider label: 17,758 (only 1 row has empty labels)
- Clients with **no** BCBA ownership anchor at all (no non-97153 row with a BCBA-labelled provider): **5 clients, 54.7 hours**

Conclusion: only ~55 hours (0.03%) genuinely have no BCBA derivable from the data. Because inferred ownership runs from each client's earliest service date through an open-ended last assignment, coverage should be continuous — so if the report currently shows materially more than ~55 unassigned hours, that is a defect, not a data gap. That comparison has not been made yet against the rendered report (the preview is behind two-factor verification, so I could not read the live numbers), so step 1 below measures it instead of guessing.

## 2. Filters — confirmed defects and what needs verifying

Confirmed by reading the code:

- `src/components/reports/crPrimary/PrimaryFilterBar.tsx` truncates every dropdown to the first 400 options (`f.options.slice(0, 400)`). With 976 clients, more than half of them can never be selected in the 7 shared CentralReach reports. This alone reads as "filters don't work".
- `BcbaProductivityReportV3.tsx` filters on the sentinel `"— Unassigned —"` for the BCBA filter, but `bcbaOptions` only ever contains real owner names, so there is no way to filter to unassigned rows.
- All filter dropdowns render every option as a plain `SelectItem` with no search field — a 976-item list is effectively unusable even where it is complete.

Not yet confirmed (step 1 will settle it): whether BCBA V3 filter changes also feel non-functional because recomputing 57k rows through the ownership + KPI + table memo chain on every keystroke/selection blocks the UI.

## 3. Plan

**Step 1 — Measure before changing anything**
Add a focused harness test that loads a realistic fixture (including the real shapes seen in `cr_billing_sessions`) through the actual ownership inference and filter code, and asserts: total unassigned hours stay in the expected sub-1% band, and each filter (BCBA, client, RBT, state, payor, code, date range, search) actually changes the resulting row set and KPIs. Whatever this test reveals about unassigned hours gets reported back with real numbers.

**Step 2 — Fix the shared primary filter bar**
Replace the truncating `Select` in `PrimaryFilterBar.tsx` with a searchable combobox that can address the full option list (no 400-item cap), keeps the existing `FilterFieldConfig` API, and shows selected/clear state. This fixes all 7 shared CentralReach reports at once (Authorization Analysis, Authorization Utilization, BCBA Performance, BCBA Supervision, Parent Training, Progress Reports, Cancellations).

**Step 3 — Fix BCBA Productivity V3 filters**
- Add the `— Unassigned —` entry to `bcbaOptions` so the sentinel comparison is reachable.
- Swap `FilterSelect` for the same searchable combobox.
- Debounce the free-text search and keep the heavy memo chain off the input path so selections apply without a visible freeze.
- Leave ownership inference math, layout, KPI definitions, drilldowns, and the Data Hub source path untouched.

**Step 4 — Audit the remaining report filters**
Walk the dashboard-style reports that own their own filter UI (HR, QA, and Cancellation command centers) and confirm each declared filter state is actually applied to the rendered dataset; fix any that are declared but unused. No visual redesign.

**Step 5 — Verification**
Run the focused report/filter tests, then the full suite, typecheck, and production build; report the measured unassigned-hours number from step 1 alongside the fixes.

### Technical notes

- Filtering stays client-side over the already-paginated Data Hub dataset; no change to the 5,000-row page size or 250,000-row safety cap.
- No database migrations, no route/role changes, no ownership-inference changes.
- Files expected to change: `src/components/reports/crPrimary/PrimaryFilterBar.tsx`, `src/pages/os/reports/BcbaProductivityReportV3.tsx`, possibly the HR/QA dashboard report pages, plus new tests under `src/test/`.
