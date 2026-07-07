# Operations Leadership — Completion Pass QA Manifest

Scope: finish the remaining Operations Leadership gaps behind the already-
working Request Intake, Work Queue conversion, Reports, BCBA Productivity
Report V3, admin upload, Training Academy, User Management, and Phone
System surfaces. **No shell / menu / Reports / User Management / NFC /
BCBA Productivity / Training Academy code was rebuilt.**

## What this pass completed

### Task 1 — Reports persistence (partial → durable)

- **`report_requests` table** created (`title`, `department`, `purpose`,
  `metrics`, `data_sources[]`, `frequency`, `priority`, `visualization`,
  `ai_assist`, `attachment_name`, `status`, `requested_by_user_id`,
  `requested_by_name`). RLS: any signed-in user can read + submit their
  own; admins update/delete. Standard `updated_at` trigger + grants.
- `src/lib/os/reportsCatalog.ts`:
  - `saveReportRequest(r)` now mirrors every new request into
    `public.report_requests` (fire-and-forget; localStorage remains as a
    synchronous offline fallback).
  - `pushRecent(id)` now mirrors into `public.shared_report_recents`
    via upsert on `(user_id, report_key)`, so recents follow the user
    across devices for every report page (BCBA Productivity V3,
    Cancellation Command Center, generic ReportDetail).
- `useReportFavorites` and `markReportOpened` / `listRecentReports`
  (from `useSharedSavedViews`) were already Supabase-backed; this pass
  just closes the fire-and-forget gap on the legacy `pushRecent` +
  `saveReportRequest` helpers so no code path silently stays local.

### Task 2 — Reports navigation cleanup (verified clean)

Verified via test: `src/lib/os/workspaces.ts`, `src/lib/os/roleMenus.ts`,
and `src/pages/os/clinical/ClinicalDirectorDashboard.tsx` no longer
contain user-facing links to `/reports/progress-reports`. `App.tsx`
keeps `/progress-reports` → `/reports/progress-reports` as a
backwards-compatible redirect only.

### Task 3 — Operations Integration Readiness Matrix

- New component `src/components/operations/OperationsIntegrationReadinessMatrix.tsx`.
- Columns: Integration • Owner • Criticality • Status • Method •
  Dependent Modules • Next action • Last checked • Open-in-Admin link.
- Overlays live `integration_connections` rows on the static registry
  so `Connected` only appears when a real backend row confirms it; any
  `last_error` bubbles up as an inline warning under the status pill.
- Filters: search (name/owner/module/notes), status
  (Connected/Configured/Needs attention/Error/Planned/Not configured),
  and criticality (Critical/Standard/Optional).
- Sorted by urgency (error → needs_attention → connected → configured
  → planned).
- Registry coverage confirmed for the full required list — CentralReach,
  Viventium, Apploi, MS365, Jivetel, CTM, Retell, LeadTrap, Mailchimp,
  Google Ads, Meta Ads, Solum, Eligipro, PandaDoc, Calendly, Fathom AI,
  Bloom Growth, Go Integrate Nava, Resend.
- **Make.com** is `internalOnly: true` in the registry and is filtered
  out of the matrix (enforced by test).
- Wired into `/operations/command-center` in place of the old summary
  `IntegrationReadinessCard`.

### Task 4 — Work Queue deep link (verified working)

`src/pages/os/work-queue/WorkQueuePage.tsx` already reads
`?selected=<id>` from `useSearchParams` and auto-selects the matching
item once items load. Enforced by test.

### Task 5 — Operations Command Center polish

New "Quick actions" card near the top of `/operations/command-center`
with six one-click entry points:

- Work Queue → `/work-queue`
- Escalations → `/work-queue/escalations`
- Reports → `/reports`
- Phone System → `/phone-calls`
- Integrations → `/admin/integrations`
- Submit request → `/system/request-intake`

Existing sections preserved: WorkQueueSignalsCard, Live Operations
Pulse, coordination grid, SystemRequestsPanel, and now the readiness
matrix.

### Task 6 — Validation

```
bunx tsgo --noEmit                   # clean
bunx vitest run \
  src/test/operationsLeadershipCompletion.test.ts \
  src/test/operationsLeadershipRequestIntake.test.ts \
  src/test/superAdminFunctionalityPass5.test.ts \
  src/test/superAdminMenuPass4.test.ts
# → 4 files / 33 tests passing
```

New test file `src/test/operationsLeadershipCompletion.test.ts` (8 tests)
asserts:
- Supabase mirroring for `saveReportRequest` and `pushRecent`.
- OpsCommandCenter uses the matrix, not the summary card.
- All six quick actions render.
- Work Queue reads the `selected` param.
- Matrix filters out `internalOnly` integrations and Make.com is
  correctly flagged internal.
- Registry covers every required Operations integration.
- No user-facing `/reports/progress-reports` links remain.

## Known remaining gaps (deferred)

- **Saved-report metadata migration.** `bcbaSavedReports.ts`,
  `cancellationSavedReports.ts`, and `bcbaProductivityV3/store.ts` still
  persist saved-report metadata in localStorage. These blobs are tightly
  coupled to the local IndexedDB row store used by the V3 report and
  Cancellation Command Center, and migrating them requires a matching
  Supabase schema for saved snapshots + Sync-aware readers. Preserved
  exactly per the "do not regress" constraint; scoped to a dedicated
  reports-backend pass.
- **Integration matrix write-back.** The matrix reads truth from
  `integration_connections`; enabling / disabling / running sync from
  the matrix itself is not wired yet — those actions still live in
  `/admin/integrations` (Pass 5 already made those flows honest).

## Preserved

- Request Intake full form + Work Queue conversion + `linked_work_item_id`
  + `system_request_converted_to_work_item` event.
- BCBA Productivity Report V3 + admin daily upload — untouched.
- User Management / Login Vault / NFC Badges — untouched.
- Phone System — untouched.
- Training Academy content and journeys — untouched.
- Reports hub remains one page: `/reports`.