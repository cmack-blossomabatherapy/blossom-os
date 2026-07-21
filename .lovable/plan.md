## Goal
Get the BCBA Productivity Report V3 actually loading the live CentralReach rows into the report table, not just showing source coverage as ready.

## Verified current issue
- The page successfully calls `canonical_report_totals` and gets `47,533` rows.
- The browser never calls `canonical_report_billing_rows`, so the detailed rows are not being fetched.
- In `BcbaProductivityReportV3.tsx`, the mount-time auto-load is gated by legacy upload dataset status before loading canonical rows. This lets the coverage banner show “ready” while the report body remains empty.
- The canonical-to-V3 bridge also sends blank `providerLabels`, but the V3 ownership inference requires non-97153 BCBA anchor rows to have a BCBA label. Without this, even loaded rows cannot infer BCBA ownership correctly.

## Implementation plan
1. **Fix the auto-load gate**
   - Update `src/pages/os/reports/BcbaProductivityReportV3.tsx` so mount-time loading calls `loadSharedDataset({ silent: true })` directly when there is no saved report param.
   - Keep legacy upload status as diagnostics only; it must not block canonical row loading.

2. **Make refresh resilient**
   - In `loadSharedDataset`, fetch canonical totals first.
   - Wrap `getBcbaProductivityDatasetStatus()` in a non-blocking `try/catch` so a legacy upload-status failure cannot stop the canonical detail-row fetch.
   - Preserve the visible error only for actual canonical load failures.

3. **Restore V3 BCBA ownership inference from canonical rows**
   - Update `src/lib/os/reporting/canonicalReports.ts` so `toBcbaSharedShape()` reconstructs `providerLabels: "BCBA"` for non-97153 rows with a provider.
   - Keep 97153 rows labeled as RBT rows and set `rbt` from the rendering provider.
   - Leave state/payor blank for now because the canonical RPC does not expose those columns yet.

4. **Add regression coverage**
   - Update `src/test/canonicalReportsEngines.test.ts` to verify the canonical-to-V3 bridge labels 97155/non-97153 rows as BCBA anchors and 97153 rows as RBT rows.
   - Update the BCBA productivity route/dataset test to assert the page auto-loads canonical rows directly instead of only checking legacy upload status.

5. **Verify**
   - Run focused tests for canonical report engines and BCBA productivity uploads.
   - Run a browser check on `/reports/bcba-productivity-report-v3` and confirm network requests include both:
     - `canonical_report_totals`
     - `canonical_report_billing_rows`
   - Confirm the report renders non-zero rows/KPIs after load.

## Out of scope
- No publishing.
- No outbound actions or automation changes.
- No CentralReach write-back.
- No broad redesign of the report UI.