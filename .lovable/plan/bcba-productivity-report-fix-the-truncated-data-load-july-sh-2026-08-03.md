# BCBA Productivity Report — fix the truncated data load (July shows nothing)

## What is actually wrong

The date filters are correct. The data never arrives.

Confirmed by querying the backend directly:

- `cr_billing_sessions` holds **56,936 rows spanning 2026-01-01 → 2026-08**
  (Jan 6,161 / Feb 6,646 / Mar 8,096 / Apr 8,881 / May 8,537 / Jun 9,252 / Jul 9,346 / Aug 17).
- The Data API caps every response at **1,000 rows** (`content-range: 0-999/*` even when
  5,000 are requested).
- The report's loader pages in blocks of 5,000 and stops as soon as a page returns fewer
  rows than the page size. Page one returns 1,000 rows, which is "less than 5,000", so the
  loop exits after a single page — ordered by service date ascending, that is
  **2026-01-01 through 2026-01-07 only**.

So the report is working off ~1,000 January rows. Selecting 7/1/26–7/31/26 correctly
filters that set down to zero rows, which is exactly what you see.

## Fix

1. **Page correctly in the billing loader** (`readAllCrDataHubBillingRows`): request pages
   of 1,000, and keep going until a page comes back empty (or the safety cap is hit)
   instead of stopping on a short page. Keep the existing progress callback so the loading
   bar stays honest across the full ~57k rows.
2. **Apply the same correction to the two other truncated reads used by this report**:
   the authorization audit/fallback context (`cr_authorizations`, currently `.limit(5000)`
   → 1,000 rows) and the ownership-context read, so ownership inference and the
   Ownership Audit tab see the whole history, not just January.
3. **Guard against silent truncation** by asserting the loaded row count against the
   authoritative `count(*)`; if fewer rows land than the store reports, surface a visible
   warning in the report header instead of quietly under-reporting hours.
4. **Data freshness strip**: show latest billing upload, latest authorization upload,
   billing date range, loaded row count, and unassigned hours — so a truncated or stale
   load is obvious at a glance.

## Verification

- Regression test that a paged reader whose backend caps responses at 1,000 rows still
  loads every row (this is the exact failure being fixed).
- Date-filter tests: 7/1–7/31 returns July hours; month-by-month totals match the
  per-month sums measured above.
- Existing canaries stay green: Areeb Hasan March → Brandy Roden only, April 1–9 →
  Brandy Roden, April 10 onward → Zestine Roberts; assigned + unassigned = filtered
  total; BCBA summary total = code breakdown total = filtered total; supervision
  97155/97153 bands (<5% urgent, 5–9.9% monitor, 10%+ healthy, no 97153 → "—").

## Scope note

Only the BCBA Productivity Report and the loaders it uses are in scope. The shared
CentralReach primary-report source (`crPrimary/source.ts`) pages with the same
5,000-row assumption and is very likely truncating the other reports the same way — I
will leave it untouched here and can fix it in a follow-up pass on your word.

## Technical detail

- `src/lib/os/bcbaProductivityV3/adminUploadStore.ts` — `CR_PAGE` 5000 → 1000; loop
  termination on empty page rather than short page; row-count assertion; ownership-context
  read paged the same way.
- `src/pages/os/reports/BcbaProductivityReportV3.tsx` — paged authorization context load,
  truncation warning, freshness strip.
- Tests in `src/test/` covering capped-page pagination, July date filtering, and the
  existing aggregation/ownership canaries.
