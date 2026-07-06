# Executive Leadership Completion — Pass B (Persistent workflows on key pages)

Wires the highest-value Executive pages to the Pass A persistence
foundation without rebuilding any page shell.

## New shared code

- `src/hooks/useExecutiveWorkItems.ts` — React Query hooks for work
  items, decisions, risks, updates, activity.
- `src/components/executive/ActionItemsPanel.tsx` — reusable card that
  lets leadership create + complete `executive_work_items`, filterable
  by department/state and always tagged with `sourcePage`.
- `src/components/executive/LogRiskCard.tsx` — inline form + list for
  `executive_risks`.
- `src/components/executive/LogDecisionCard.tsx` — inline form + list
  for `executive_decisions`.
- `src/components/executive/PublishUpdateCard.tsx` — draft/publish
  form + list for `executive_updates`.

## Pages wired in this pass

| Page | Change |
| --- | --- |
| `ExecutiveOverview` (`/executive`) | Adds `ActionItemsPanel` at bottom — real create/complete of leadership action items. |
| `StrategicRisks` (`/executive/strategic-risks`) | Adds `LogRiskCard` + related `ActionItemsPanel`; risks now persist. |
| `LeadershipAccountability` | Adds `LogDecisionCard` + related `ActionItemsPanel`; decisions now persist. |
| `ExecutiveUpdates` | Replaces toast-only "Quick executive actions" with `PublishUpdateCard` that drafts/publishes to `executive_updates`. |
| `/reports` (`ReportDetail`) | Opening a report now calls `markReportOpened` in addition to legacy localStorage `pushRecent`. |

## Not yet in this pass (Pass C)

- Migrating `/reports` saved-views/favorites in each report shell (7 files
  still use localStorage-only) to `useSharedSavedViews`.
- `/operations/escalations` and `/system/request-intake` persistence,
  activity trail, and integration-request categories.
- Integration readiness widgets driven by
  `integration_catalog` / `integration_connections`.
- Wiring the remaining executive pages (`CompanyPulse`,
  `OrganizationalHealth`, `GrowthReadiness`, `OperationalConsistency`,
  `StaffingExpansion`, `ExecutiveBriefing`) to use the same
  ActionItemsPanel + page-specific cards.

All Pass B additions are additive — no existing page shell, menu, or
report route was modified.