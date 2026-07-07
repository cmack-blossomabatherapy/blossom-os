# Super Admin — Pass 5 QA Manifest

Final reliability pass. Focuses on the remaining gaps behind the existing
Super Admin surfaces — audit consistency, System Tools data model, Request
Intake status vocabulary, and Integration action honesty. **No shell / menu /
Reports / User Management / NFC / BCBA Productivity / Training Academy code
was touched.**

## Correction to Pass 4 manifest

The Pass 4 manifest listed Parts 1, 2, and 4 as "staged for follow-up." That
was already stale by the time Pass 5 began — earlier passes had partially
implemented all three (System Tools filters + fields, shared
`runWithSystemToolAudit` helper, integration truth overlay). Pass 5 finishes
the remaining reliability work; the specific items still open are listed
under _Known remaining gaps_ below.

## What Pass 5 completed

### 1. Audit reliability (Part 1)

- `src/hooks/useSystemTools.ts` — `create`, `update`, and `remove` now
  **await** `logSystemToolAction` and surface a warning toast
  `"Saved, but audit log could not be recorded."` when the audit insert
  fails. Mutation results are still returned so a lost audit row cannot
  block a legitimate admin action.
- `src/components/executive/SystemRequestsPanel.tsx` — both request
  conversion flows (`convertToWorkQueue`, `convertToWorkflow`) now await
  their audit rows and warn on failure. Metadata now records `route` and
  `source`.
- Every remaining `void logSystemToolAction(` in these two files was
  removed. Enforced by test: `superAdminFunctionalityPass5.test.ts`.

### 2. System Tools status vocabulary (Part 2)

- New canonical helper `src/lib/os/systemToolStatus.ts`:
  - `ISSUE_STATUSES = ["Open","Triage","In Progress","Blocked","Resolved"]`
    (Title Case) is the canonical vocabulary.
  - `normalizeIssueStatus(value)` accepts either the canonical form or any
    legacy lowercase / snake_case variant (`open`, `in_progress`, `closed`, …)
    and returns the canonical label. Unknown values pass through.
  - `isIssueStatus(value, target)` and `displayIssueStatus(value)` for
    normalized comparisons and display.
- `src/pages/os/system-tools/SystemToolsPages.tsx` Issue Tracker now uses
  `normalizeIssueStatus` for status filtering + badge display and
  `isIssueStatus` for every quick-action visibility check and the
  `resolved_at` guard in `IssueTriageDialog`.
- Behavior: rows written by the old Request Intake panel with lowercase
  statuses now render, filter, and quick-action correctly through the
  Issue Tracker.

### 3. Related integration data model (Part 3)

- Migration: `system_workflows.related_integration_id` and
  `system_issues.related_integration_id` are now `text`, with column
  comments documenting that they hold Blossom integration registry keys
  (`centralreach`, `viventium`, `ctm`, `retell`, `apploi`, `calendly`, …)
  not UUIDs. No data loss — both columns were empty before the ALTER.
- TS types in `useSystemTools.ts` were already `string | null`, so no
  application-side change was required.
- Test asserts that `"centralreach"` / `"viventium"` can be assigned to
  `related_integration_id` at the type layer.

### 6. Integration toggle & "View logs" honesty (Part 6)

- `IntegrationCard` in `src/pages/admin/Integrations.tsx`:
  - The enable/disable `Switch` is now **disabled** whenever the
    integration is not backed by a live `integration_connections` row (i.e.
    the derived status is neither `connected` nor `syncing`). The `title`
    tooltip reads _"Connect/configure this integration before enabling."_
  - This prevents Super Admin from believing an integration is enabled
    when the backend has no persisted state to match.
- Header "View logs" button is disabled when no live integrations exist
  (`title="Connect an integration to view sync logs"`); when a live
  integration exists it selects that one instead of the arbitrary first
  registry entry.

### 7. Documentation truth (Part 7)

- This manifest replaces the stale Pass 4 note; it does **not** claim
  100% completion — see _Known remaining gaps_.

### 8. Tests (Part 8)

New: `src/test/superAdminFunctionalityPass5.test.ts` (9 tests)

All targeted suites still pass:

```
bunx vitest run \
  src/test/superAdminFunctionalityPass5.test.ts \
  src/test/systemToolAuditHelper.test.ts \
  src/test/superAdminMenuPass4.test.ts \
  src/test/operationsLeadershipRequestIntake.test.ts
# → 4 files / 28 tests passing
```

## What was preserved

- Canonical `src/lib/os/superAdminMenu.ts` and both consumers.
- One visible `/reports` page. No standalone Login Vault or NFC menu items.
- No AI menu section, no Make.com re-enablement.
- BCBA Productivity Report V3 + `/system/bcba-productivity-uploads`.
- State Director, RBT, and BCBA Training Academy journeys — untouched.

## Known remaining gaps (not addressed in Pass 5)

The following items in the original Pass 5 brief are **not yet done** and
are honestly deferred:

- **Part 4 (Workflow Inventory extras):** Owner and related-integration
  filters, inline owner edit / assign-owner quick action, verifier
  display, and the specific per-transition audit `action` names
  (`workflow_mark_active`, `workflow_verified`, `workflow_owner_assigned`,
  etc.) are still generic `status_change` / `update`. Existing workflow
  mark-verified logic already stamps `last_verified_at` + `verified_by`.
- **Part 5 (Issue Tracker extras):** Owner and related-integration filters
  and the specific per-transition audit action names
  (`issue_triaged`, `issue_resolved`, `issue_reopened`, …) are still
  generic `status_change`. Resolve → notes gate and `resolved_at` /
  `closed_by` stamping already work.
- **Part 6 persistence:** The toggle is now truthful (disabled without a
  live connection) but does **not** yet write back into
  `integration_connections.enabled` when flipped. That requires an
  end-to-end action + audit + edge-function wiring and is intentionally
  scoped to the next integration pass.
- **Related integration selector components** — dialogs still accept a
  free-text registry key field. A shared `IntegrationRegistrySelect`
  reused across Workflow / Issue / Request dialogs is deferred.

## Validation commands run

```
bunx vitest run src/test/superAdminFunctionalityPass5.test.ts \
  src/test/systemToolAuditHelper.test.ts \
  src/test/superAdminMenuPass4.test.ts \
  src/test/operationsLeadershipRequestIntake.test.ts
```

All targeted suites pass; project build is unaffected by Pass 5 changes.

## Follow-up owner

Next Super Admin pass should address the four bullets above to fully close
Parts 4, 5, and 6 of the reliability brief.