# Authorizations Team — Pass 7 QA Manifest

## Summary
Pass 7 tightens Authorizations operational surfaces without rebuilding the
module. Deep links, filter propagation, urgency triage, right-rail honesty,
and PR tracking empty-state behavior were the focus.

CentralReach is **not** connected. Import/API integration points are stubbed
for future connection. Where no live data exists, honest empty states are
shown ("Connect CentralReach or import authorization data…").

## What Changed

### 1. `/auth-workspace` deep links resolve outside the visible queue
- Drawer record is now resolved from the **full** `AUTHS` list, not from the
  `visible` (filtered) list.
- Both `authId` and `overlayId` query params are honored on initial load and
  on subsequent search-param changes.
- Out-of-view banner (`Opened from link. This authorization is outside your
  current queue or filters.`) with **Clear filters** and **Show in all
  authorizations** actions.
- Closing the drawer removes both `authId` and `overlayId` from the URL.

### 2. Legacy `/os/authorizations` links removed
- `src/components/reports/AuthorizationReportViews.tsx` migrated to
  `/authorizations` for all row and card actions.
- Full `src/` scan (see `authorizationsPass7.test.ts`) enforces no `/os/authorizations`
  strings remain outside test fixtures / intentional legacy redirect files.

### 3. Payer Requirements → filtered Authorizations
- New row action **View Matching Auths** links to
  `/authorizations?payor=<payer>&state=<state>`.
- `OSAuthorizations` accepts `payer` as an alias for `payor` and reapplies
  filters when `state`, `payor`, `payer`, or `coordinator` params change.

### 4. Missing Docs urgency + real action feedback
- Added `urgencyOf(row)` → `past_due | due_today | due_this_week | later |
  no_date | completed`, rendered as a badge next to the due date.
- Quick-filter buckets: Past due, Due today, Due this week, No due date.
- Received / Waive / Delete actions now show success toasts on completion
  and error toasts on failure — no silent swallowing.
- Open Auth continues to send both `authId` and `overlayId`.

### 5. `/auth-workspace` right-rail is derived, not fake
- Removed hardcoded strings ("3 auths need PR follow-up", etc.).
- Introduced **Operational Signals** derived from the live `auths` list:
  expiring in 30 days, missing docs, PR follow-up needed, waiting on QA,
  open denials, unassigned.
- Honest empty state when no auths are available or nothing is flagged.
- Replaced the inert "Operational Insights" input with an **Ask Blossom**
  card that links to `/ai-assistant?context=authorizations`.
- SOP & Workflow links now route to
  `/resource-library?department=Authorizations&topic=…` instead of `/training`.

### 6. PR Tracking empty state
- Drawer PR tracking now shows the empty state whenever there is no PR
  request and no escalation, even if a `liveAuth` overlay row exists.
  Previously an empty overlay could render `—`-filled rows.

### 7. Reports remain unified
- No new Authorizations reports route added; Authorizations report views
  remain inside the shared `/reports` page.

## Files Touched
- `src/pages/os/OSAuthWorkspace.tsx`
- `src/pages/os/OSAuthorizations.tsx`
- `src/pages/os/operations/OpsRecordsWorkspace.tsx`
- `src/pages/os/operations/PayerRequirements.tsx`
- `src/pages/os/operations/MissingDocs.tsx`
- `src/components/reports/AuthorizationReportViews.tsx`
- `src/test/authorizationsPass7.test.ts` (new)
- `docs/authorizations-team-pass-7-qa-manifest.md` (this file)

## Test Results
```
bunx vitest run \
  src/test/authorizationsPass3.test.ts \
  src/test/authorizationsPass4.test.ts \
  src/test/authorizationsPass5.test.ts \
  src/test/authorizationsPass6.test.ts \
  src/test/authorizationsPass7.test.ts

Test Files  5 passed (5)
     Tests  61 passed (61)
```
Typecheck (`bunx tsgo --noEmit`) passes clean.

## Remaining Gaps / Follow-Ups
- CentralReach import/API not yet wired — insight panels currently derive
  from local overlay + demo auth data. When CR is connected, the same
  derived logic will scale up automatically.
- Ask Blossom assistant route (`/ai-assistant?context=authorizations`) is
  reused; a dedicated authorizations-scoped agent could be added later.
- Resource Library topic deep-links assume matching document titles;
  content team should confirm topic slugs exist for each SOP.