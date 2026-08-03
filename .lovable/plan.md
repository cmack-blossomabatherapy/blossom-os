# Authorization Analysis — make the 14 weekly rows show real numbers

## What is actually happening

The weekly tracking matrix is empty because it is fed from **only two sources**, and both are empty:

- `authorization_weekly_events` (the team-logged table) has **0 rows** — nobody has logged an event yet.
- The derived "Services Paused — No RA" detector currently produces nothing for the loaded scope.

The CentralReach authorization data itself is fine and is *not* being used by the matrix at all. All 3,283 rows now carry labels, service codes, statuses and dates:

- statuses: 3,036 Approved, 228 Active, 15 Denied, 4 Expired
- every row has a service code and a start date
- weekly volume is real, e.g. week of 2026-06-29: 258 authorizations (86 Initial Assessment, 129 Initial Treatment, 105 Reassessment/Concurrent)

So the report has the data to fill 9 of the 14 rows automatically and simply isn't reading it.

## The fix

### 1. Derive the IA / IT / RA rows from CentralReach

Build a CR-derived tracker contribution alongside the logged events:

- Each authorization is classified into exactly one work type using the existing label-first `classifyAuthKind` (Initial Assessment, Initial Treatment, Reauthorization) — no double counting when a row carries several labels.
- Week = ISO week of `actual_start_date` (falling back to `start_date`).
- Submitted = every classified row in that week.
- Approved = rows whose status/label resolves to approved.
- Denied = rows whose status/label resolves to denied.

That fills: IA Submitted / Approved / Denial, IT Submitted / Approved / Denial, RA Submitted / Approved / Denial.

### 2. Keep Progress Report and pause rows honest

CentralReach exports carry no progress-report events and no pause reasons, so those 5 rows stay team-logged:

- Progress Report Submitted / Approved / PR Denial, Services Paused — No RA, Services Paused — PR Late/Missing.
- Derived no-RA pauses continue to merge in where coverage gaps exist.
- Instead of a blank dash, these cells render as "Log" (a click target that opens the Log event dialog for permitted roles) so it is obvious the number is awaiting entry rather than broken. A short note under the table names which rows come from CentralReach and which require logging.

### 3. Merge without double counting

Logged events always win for a given week + metric: if the Authorization team logs "RA Approved" for a week, the logged count replaces the CR-derived count for that cell rather than adding to it, and the cell is marked as team-logged. Cells with no logged entry use the CR-derived number.

### 4. Drilldowns and export

- CR-derived cells drill into the underlying authorization rows for that week and work type (client, payor, state, service code, labels, dates, status).
- Logged cells keep their current event drilldown.
- Weekly workflow chart and the tracker CSV pick up the merged numbers, so both stop rendering flat zero.

### 5. Verification

- Confirm the matrix renders non-zero weeks across Dec 2025 – Nov 2026 and that IA + IT + RA submitted per week reconciles to the authorization row count for that week.
- Tests pinning: single-kind classification (no double counting), logged-overrides-derived, PR/pause rows staying zero from CentralReach alone, and week bucketing off the actual start date.

## Technical notes

- `src/lib/os/reports/crPrimary/metrics/authorizationTracker.ts` — add `deriveTrackerWeeksFromAuthorizations(rows)` and extend `computeAuthTrackerWeeks` to take derived weeks plus a per-cell source marker (`logged` | `centralreach` | `derived`).
- `src/pages/os/reports/AuthorizationAnalysisPage.tsx` — pass filtered rows into the tracker, route CR-derived cell clicks to an authorization-row drilldown, render the "Log" affordance for logged-only metrics, and add the source legend.
- `src/test/authorizationAnalysisTracker.test.ts` — new cases for derivation, precedence, and week bucketing.
- No schema changes; no other report touched.