## Problem

The Evaluations → Reports tab shows "Self Pending: 101" while there are only ~10 active staff in scope. Cause: the seed/data generator creates ~10 future evaluation cycles per staff (8 quarterly + 2 annual), and `ReportsTab.tsx` counts every row in `evaluations` for the pending KPIs. So a QA-scoped view of ~10 staff × ~10 future cycles ≈ 101 "self pending" — technically correct row counts, but operationally meaningless.

Confirmed via DB: 63 active staff, 631 evaluations total, 631 "self_status != Completed AND final_status != Complete", 63 distinct staff. Sample shows each staff has cycles scheduled out to 2028.

## Fix

In `src/pages/os/evaluations/tabs/ReportsTab.tsx`, restrict the "pending" KPIs and the Status Breakdown chart to the **current open cycle per staff** — i.e. for each staff, only the single earliest non-complete evaluation whose `next_review_date` is in the past or within the current quarter window. Future-scheduled cycles should not count as "pending" yet because the cycle hasn't opened.

Concretely:

1. Derive `currentCycleEvals`: for each `staff_id`, pick the evaluation with the earliest `next_review_date` where `final_status !== "Complete"`. Optionally only include those where `next_review_date <= end of current quarter` so far-future cycles are excluded.
2. Use `currentCycleEvals` (instead of `filteredEvals`) for these KPIs and the breakdown:
   - Self Pending
   - Leadership Pending
   - Meetings Pending
   - Overdue (already date-bounded but should also be per-staff to avoid double-counting)
   - Status Breakdown card
   - Completion Rate (numerator/denominator both on current cycle)
3. Leave alone (already cycle/date-bounded):
   - Active Staff
   - Due This Quarter
   - Completed This Quarter
   - Upcoming Evaluations (next 90 days)
   - Overdue list (date-bounded by `next_review_date < today`)
   - By Role / By State / By Reviewer aggregates → also switch to `currentCycleEvals` so percentages reflect the active cycle and aren't inflated by future cycles.

No schema or data changes. No changes outside `ReportsTab.tsx`. After the fix, with ~10 staff in QA scope, "Self Pending" should be at most ~10, matching the staff count.

## Verification

- Reload Evaluations → Reports as QA. Self Pending, Leadership Pending, Meetings Pending should each be ≤ Active Staff in scope.
- Completion Rate should reflect the current cycle, not all historical/future cycles.
- Upcoming and Overdue lists should remain unchanged.
