# Super Admin Functionality — Pass 6 Closeout QA Manifest

## Scope
Reliability closeout of Super Admin surfaces. No rebuild of shell, menu,
Reports page, User Management, Login Vault, NFC Badges, BCBA Productivity
Report V3, Training Academy, or the integrations foundation.

## What Pass 6 fixed

### 1. UUID actor columns
- `system_workflows.verified_by` and `system_issues.closed_by` are now
  written with `auth.users.id` (via `useAuth().user?.id`), not the
  display name.
- Added `system_workflows.verified_by_name` and
  `system_issues.closed_by_name` (nullable `text`) migrations so the UI
  can still show a friendly label alongside the audit id.
- Files: `src/pages/os/system-tools/SystemToolsPages.tsx`
  (`quickVerify`, `confirmResolve`), `src/hooks/useSystemTools.ts`
  (extended row types).

### 2. Specific audit action names — Workflow Inventory
Quick actions now emit dedicated audit action names instead of generic
`update`/`status_change`:
- `workflow_created`, `workflow_updated`, `workflow_deleted`
- `workflow_mark_active`, `workflow_mark_needs_review`,
  `workflow_mark_deprecated`
- `workflow_verified`
- `workflow_owner_assigned`

Metadata includes `route`, `source`, `changed_fields`, `previous_status`
and `previous_owner` when relevant. Generic `update` remains only for
the plain edit-dialog save path.

### 3. Specific audit action names — Issue Tracker
- `issue_created`, `issue_updated`, `issue_deleted`
- `issue_triaged`, `issue_started`, `issue_blocked`
- `issue_resolved` (requires resolution notes, stores `resolved_at` +
  `closed_by` (uuid) + `closed_by_name` (display))
- `issue_reopened` (clears `resolved_at`, `closed_by`, `closed_by_name`)
- `issue_owner_assigned`
- `request_converted_to_tracked_issue`

### 4. Related Integration is now a registry select
New reusable component
`src/components/system-tools/IntegrationRegistrySelect.tsx` sourced from
`BLOSSOM_INTEGRATIONS`. Options exclude `internalOnly` (Make.com).
Values stored in `related_integration_id` are always registry keys
(`centralreach`, `viventium`, `ctm`, `retell`, `apploi`, `calendly`,
`leadtrap`, `google-ads`, `meta-ads`, `eligipro`, `pandadoc`,
`bloomgrowth`, `go-integrate-nava`, plus the rest). None option is
represented by a `__none__` sentinel.

Free-text “Related integration ID” inputs replaced in:
- Workflow add/edit dialog
- Issue submit dialog
- Issue triage/edit dialog
- Request Intake submit/edit dialog (`SystemRequestsPanel`)

### 5. Filter closeout
- Workflow Inventory: added Owner + Integration filters (in addition to
  existing Status/Priority/Risk/Dept).
- Issue Tracker: added Owner + Integration filters (in addition to
  existing Status/Priority/Severity/Area).
- Filters use `related_integration_id` text keys and are populated from
  the current row set.

### 6. Persistent integration toggles
- New backend helper
  `updateIntegrationConnectionEnabled(connectionId, enabled)` in
  `src/lib/os/integrations/backend.ts`.
- New `handleToggleIntegration` in `src/pages/admin/Integrations.tsx`:
  - Only flips a live `integration_connections` row when one exists.
  - Optimistic update; reverts + destructive toast on save failure.
  - Calls `loadBackend()` after save to refresh overlay.
  - Writes `integration_enabled` / `integration_disabled` to
    `system_tool_audit_logs`; warning toast if audit fails but save
    succeeded.
- The Switch is still hard-disabled (Pass 5) unless a live connection
  exists, so the local-only fallback is defensive.

## Migrations
- `add_verified_by_name_and_closed_by_name` — adds nullable text
  display-name columns and column comments clarifying id vs name.

## Validation

### Type check
```
bunx tsgo --noEmit    # 0 errors
```

### Targeted tests
```
bunx vitest run \
  src/test/superAdminFunctionalityPass5.test.ts \
  src/test/superAdminFunctionalityPass6.test.ts \
  src/test/superAdminMenuPass4.test.ts \
  src/test/systemToolAuditHelper.test.ts \
  src/test/operationsLeadershipRequestIntake.test.ts \
  src/test/integrationStatusOverlay.test.ts \
  src/test/integrationsBackendPass2.test.ts \
  src/test/integrationsBackendPass3.test.ts \
  src/test/integrationsBackendPass4.test.ts \
  src/test/bcbaProductivityAdminUploads.test.ts \
  src/test/reportsCanonicalNavigationPass2.test.ts
```
Result: **174 tests passed, 0 failed** (17 Pass 5+6 + 157 acceptance).

## Preserved (not touched)
- `/reports` remains the single visible Reports page.
- Login Vault + NFC Badges stay inside User Management.
- BCBA Productivity Report V3 + admin daily upload untouched.
- No AI menu sections added.
- Make.com stays internal-only and hidden.
- Super Admin menu (79 paths) unchanged.

## Remaining gaps
None from the Pass 6 checklist. Follow-up polish that is intentionally
out of scope for this pass:
- No admin-facing “edit historical audit row” UI (never wanted).
- Integration toggle currently only enables/disables — pause/resume of
  actively running syncs still goes through the drawer’s test/run
  buttons.