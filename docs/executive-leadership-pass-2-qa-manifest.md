# Executive Leadership — Pass 2 QA Manifest

Pass 2 focuses on trust, correctness, and canonical wiring for the
Executive Leadership experience. It does NOT rebuild the shell,
redesign pages, touch Training Academy / Resource Library / Phone
System / BCBA Productivity Report / User Management / Login Vault /
NFC Badges / Reports architecture, or introduce new AI menu sections.

## 1. RLS / permissions tightened

Migration `Executive Leadership Pass 2` updated read policies:

| Table | Before | After |
| --- | --- | --- |
| `executive_decisions` | authenticated `USING (true)` | `is_leadership(auth.uid())` |
| `executive_briefings` | authenticated `USING (true)` | `is_leadership(auth.uid())` |
| `executive_risks` | authenticated `USING (true)` | `is_leadership(auth.uid())` |
| `executive_kpi_snapshots` | authenticated `USING (true)` | `is_leadership(auth.uid())` |
| `executive_updates` | authenticated `USING (true)` | leadership OR `published_at IS NOT NULL` (published updates broadcast company-wide) |
| `executive_work_items` | authenticated `USING (true)` | leadership OR `created_by = auth.uid()` (users see rows they submitted) |

Write / update / delete policies on all six tables remain gated by
`public.is_leadership(auth.uid())`, which resolves through `user_roles`
for `admin`, `super_admin`, `executive_leadership`, and
`operations_leadership`. CEO/COO/DOO are represented via those existing
aliases in Blossom OS today.

## 2. Auto-managed completion timestamps

Added `public.executive_work_items_set_completed_at()` BEFORE INSERT/UPDATE
trigger:

- Status `completed` / `resolved` / `done` → `completed_at = now()` if not
  already set.
- Any other status → `completed_at = NULL` (reopen safely clears it).

Same behavior added to `executive_risks.resolved_at` for statuses
`resolved` / `mitigated` / `closed`. Reopening a risk clears the
timestamp.

Service-layer duplication of this logic in
`updateExecutiveWorkItem` was removed — the trigger is now the single
source of truth.

## 3. Service layer additions

`src/lib/os/executive/executiveService.ts`:

- `resolveExecutiveWorkItem(id, note?)` / `reopenExecutiveWorkItem(id)`
- `updateExecutiveDecision(id, patch)`
- `updateExecutiveRisk(id, patch)` / `resolveExecutiveRisk(id, status?)`
- `updateExecutiveUpdate(id, patch)` / `publishExecutiveUpdate(id)`

Each mutation writes to `executive_activity_log` via
`logExecutiveActivity(...)`, so the leadership feed stays truthful.

## 4. Canonical system-request path

`SystemRequestsPanel` (used on `/system/request-intake`, Ops Command
Center, and Executive surfaces) was migrated off
`executive_work_items` with `category="system_request"` and now writes
to the canonical `public.system_issues` table via `useSystemIssues`.
Impact:

- Any authenticated user can submit a request (RLS on `system_issues`
  allows authenticated INSERT; admin/super_admin triage). Previously the
  panel was silently blocked for non-leadership users because
  `executive_work_items` insert requires `is_leadership`.
- Executive follow-up remains a separate concern: leadership can still
  create an `executive_work_items` row (with `related_record_type =
  'system_issue'` / `related_record_id` set) to represent leadership
  action on the issue. That is now a follow-up record, not a duplicate
  intake path.
- Status vocabulary aligned: `open`, `triage`, `in_progress`, `blocked`,
  `resolved` (mirrors `system_issues` triage flow).

## 5. Indexes

Added indexes for common Executive filters so the pages stay snappy as
data grows:

- `executive_work_items(status, priority, department, state_code, owner_user_id, due_date, category, created_at DESC)`
- `executive_decisions(created_at DESC)`
- `executive_risks(status, created_at DESC)`
- `executive_updates(published_at DESC)`
- `executive_activity_log(created_at DESC)`

## 6. Preserved (verified untouched by this pass)

- `/reports` is still the only visible Reports menu entry (Super Admin +
  Executive both point there); legacy report URLs still redirect. Deep
  runtime routes (`/reports/bcba-productivity-report-v3`,
  `/reports/cancellation-command-center`, `/reports/progress-reports`)
  remain reachable from `/reports` and unchanged.
- BCBA Productivity Report V3 still works and remains available.
- Phone System (`/phone`) access unchanged — Super Admin, Executive
  Leadership, HR, Marketing continue to have access; no AI After-Hours
  entry was added to the Executive menu.
- Training Academy, Resource Library, User Management, Login Vault, NFC
  Badge Management, State Director / RBT / BCBA training journeys — no
  changes in this pass.
- No new AI menu sections, no Make.com / Monday migration UI added.

## 7. Build result

- `bunx tsgo --noEmit` — clean.
- `npm run build` — passes locally on the Pass 2 diff.

## 8. Known limitations / deferred to Executive Pass 3

The following were called out in the Pass 2 spec but not landed in this
pass. They are tracked, not silently skipped:

- Full page-by-page action-wiring audit of every Executive page
  (`/executive`, `/command-center`, `/operations/command-center`,
  `/operations/department-health`, `/operations/escalations`,
  `/state-operations`, `/marketing/state-growth`). The persistence layer
  and mutations they need now exist; wiring individual buttons through
  the UIs is Pass 3.
- Department Health per-department follow-up / concern / note affordances.
- State Operations state-scoped executive-view enrichment (director /
  BD / VA data joins).
- Reports favorites / recents / saved-views migration off
  localStorage into `executive_saved_views` + `shared_report_recents`
  (tables already exist; UI is next pass).
- Integration readiness expanded catalog card on the Executive dashboard
  with per-integration follow-up creation.
- `ExecResourceLibrary` deprecation — the Executive menu already routes
  to canonical `/resource-library`; the vestigial page still exists and
  should be removed or redirected in Pass 3.
- Removal of any remaining toast-only actions across Executive pages
  (systematic sweep). New service helpers added in Pass 2 make the fix
  mechanical.

## 9. Manual QA checklist

- [ ] Sign in as `executive_leadership` → `/executive` loads; recent
      activity and action items visible.
- [ ] Sign in as a plain `authenticated` user (e.g. `bcba`) →
      `/system/request-intake` accepts a submission; the row appears in
      `system_issues` (visible to admin).
- [ ] Non-leadership user cannot list `executive_decisions`,
      `executive_briefings`, `executive_risks`, or draft
      `executive_updates`.
- [ ] Published `executive_updates` are visible to every authenticated
      user.
- [ ] Marking a work item `resolved` sets `completed_at`; changing back
      to `open` clears it (trigger).
- [ ] Marking a risk `resolved` sets `resolved_at`; reopening clears it.
- [ ] `/reports` still opens the canonical Reports view; BCBA
      Productivity Report V3 still opens from Reports.
- [ ] `/phone` still opens the Phone System for Executive Leadership.
- [ ] Executive sidebar does NOT show AI After-Hours Calls.