## What I found

The BCBA Productivity Report V3 file (`src/pages/os/reports/BcbaProductivityReportV3.tsx`, ~2,024 lines) already contains all the previously-requested enhancements:

- Tabs: Overview, BCBA Summary, Supervision, Clients & RBTs, Upload Details
- Supervision hours from `97155` codes and Supervision % = 97155 ÷ 97153
- BCBA Summary table includes Supervision Hours and Supervision %
- Dedicated Supervision tab with low-supervision highlighting + legend
- Charts (97153 vs Direct vs Supervision stacked bar, Supervision % by BCBA)
- Validation/debug panel moved into the Upload Details tab (no longer on the main screen)
- Number formatting helpers (`fmt0`, `fmt1`, `fmtPct`) with comma separators
- Ownership / BCBA inference / 97153 / hours logic untouched

So the code is in place — the preview just isn't reflecting it (stale HMR module or cached build).

## Plan

1. Re-open `BcbaProductivityReportV3.tsx` and spot-check the 5 tab triggers, Supervision tab, charts, and that the validation block is rendered only inside the Upload Details tab.
2. Flush the HMR gate (`curl -sf -X POST http://localhost:8080/__hmr_flush`) so the buffered module reloads in the preview.
3. Open the preview at the BCBA Productivity Report V3 route and confirm:
   - Default view shows KPIs + Overview only (no debug pills)
   - Tabs render: Overview, BCBA Summary, Supervision, Clients & RBTs, Upload Details
   - Supervision tab shows chart, legend, and low-supervision highlights
   - Upload Details tab contains all validation/debug pills and drop-reason tables
   - Numbers use commas (e.g. `1,234.5`)
4. If anything is actually missing or regressed, patch only the presentation layer to restore it — no changes to ownership, BCBA inference, 97153/RBT assignment, or hours math.

## Technical notes

- No new dependencies.
- No backend/schema changes.
- Edits, if needed, are scoped to `src/pages/os/reports/BcbaProductivityReportV3.tsx` only.
- Calculation functions (`computeAssignments`, supervision aggregation in the BCBA reducer, hours sums) will not be touched.

Approve this and I'll flush the preview and verify, then make any small UI-only fixes required.