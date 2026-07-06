# Executive Leadership Completion — Pass C

Pass C finishes the wiring started in Passes A (foundation) and B (top
executive pages) by covering the remaining pages, adding operational
persistence, and surfacing integration health at the leadership layer.

## New shared components
- `src/components/executive/IntegrationReadinessCard.tsx` — reads `integration_catalog` + `integration_connections` (no secrets); shows healthy/errored/disabled counts + top connections needing attention.
- `src/components/executive/SystemRequestsPanel.tsx` — persistent submit + triage backed by `executive_work_items` (`category="system_request"`).
- `src/components/executive/LeadershipEscalationsPanel.tsx` — persistent leadership escalations backed by `executive_work_items` (`category="escalation"`).

## Pages wired
- `ActionItemsPanel` added to `/executive/pulse`, `/executive/briefing`, `/executive/growth-readiness`, `/executive/operational-consistency`, `/executive/organizational-health`, `/executive/staffing-expansion`.
- `IntegrationReadinessCard` added to `/executive`.
- `LeadershipEscalationsPanel` added to `/operations/escalations` (existing derived view kept intact).
- `/system/request-intake` renders `SystemRequestsPanel` in place of the previous static demo table.
- `/reports` merges Supabase `shared_report_recents` into the "Recently viewed" list so it survives across devices for signed-in users.

## Notes
- No new tables. All persistence reuses tables from Pass A.
- RLS unchanged: leadership can write to `executive_work_items`; every authenticated user can read.
- Reports saved views/favorites remain in localStorage via `reportsCatalog`; migrating those end-to-end to `useSharedSavedViews` is a small follow-up needing no schema changes.
