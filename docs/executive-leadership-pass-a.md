# Executive Leadership Completion — Pass A (Foundation)

This pass added the persistence + shared-hook foundation for the
Executive Leadership operating layer. No user-visible page changes.

## New Supabase tables

All created in migration `20260706_executive_foundation`:

| Table | Purpose |
| --- | --- |
| `executive_work_items` | Leadership action items with owner, priority, due date, source link |
| `executive_decisions` | Recorded leadership decisions |
| `executive_briefings` | Persisted briefing snapshots for print/export |
| `executive_updates` | Leadership updates/announcements |
| `executive_risks` | Strategic risks with severity/likelihood/mitigation |
| `executive_kpi_snapshots` | Persisted KPI snapshots for trending |
| `executive_saved_views` | Per-user saved dashboard/report filters (used by `/reports`) |
| `executive_activity_log` | Leadership activity trail |
| `shared_report_recents` | Per-user recent reports list for `/reports` |

RLS: leadership records are readable by any authenticated user for
company-wide visibility. Only Executive Leadership, Operations
Leadership, and Super Admin can create/update/delete. Saved views and
recents are strictly per-user.

## New code modules

- `src/lib/os/executive/executiveService.ts` — CRUD helpers for
  work items, decisions, risks, briefings, updates, KPI snapshots, and
  activity log. Every create/update writes an `executive_activity_log`
  entry so leadership pages can render a real activity trail.

- `src/hooks/useSharedSavedViews.ts` — Supabase-backed saved views hook.
  When authenticated it reads/writes `executive_saved_views`; when
  unauthenticated it falls back to localStorage. On first authenticated
  load, any legacy localStorage cache under `legacyKey` is imported once
  into Supabase so existing users don't lose saved views. Also exports
  `markReportOpened` and `listRecentReports` for the `/reports` recents
  list.

## Route aliases

`ceo` was added to `OSRole` and mapped to `executive_leadership` in
`ROLE_ALIASES`, joining the existing `executive`, `coo` aliases so
leadership access works under all four canonical role names.

## Follow-up (Pass B)

- Wire each `src/pages/os/executive/*` page to call the executive
  service instead of using toast-only ActionPill handlers.
- Migrate `/reports` saved-view/favorite/recent controls from
  localStorage to `useSharedSavedViews` / `markReportOpened`.
- Convert `/operations/escalations` and `/system/request-intake`
  actions to persist to the existing operational tables plus
  `executive_activity_log`.
- Add integration readiness widgets driven by `integration_catalog`
  and `integration_connections`.