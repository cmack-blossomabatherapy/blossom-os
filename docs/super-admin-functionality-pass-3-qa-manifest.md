# Super Admin Functionality — Pass 3 QA Manifest

## Summary

This pass converged the Super Admin shell/menu on a single canonical source,
added an admin audit trail for System Tools, corrected integration-catalog
seed truth, and cleaned up BCBA Productivity report/upload copy.

## Canonical Super Admin menu

- **Source of truth:** `src/lib/os/superAdminMenu.ts` (`SUPER_ADMIN_MENU`).
- **Consumers:** `src/pages/os/OSShell.tsx` (`SUPER_ADMIN_SECTIONS = SUPER_ADMIN_MENU.map(...)`)
  and `src/components/layout/AppSidebar.tsx` (`if (effectiveIsAdmin) return SUPER_ADMIN_MENU.map(...)`).
  Both shells now derive from the same array — divergence between AppSidebar
  and OSShell is no longer possible.
- **Counts:** 9 sections, 79 items, 79 unique paths, 1 visible Reports link
  (`/reports`).
- **Sections:** Command Center, People & Access, Training & Resources,
  Growth & Admissions, Clinical & Quality, Operations, HR & Finance,
  Communications, System Tools.

### Preservation checks

- Exactly one visible Reports item (`/reports`).
- **No** standalone Login Vault menu item — Login Vault lives inside
  `/user-management`.
- **No** standalone NFC Badge menu item — NFC Badge Management lives inside
  `/user-management`.
- **No** AI menu section.
- **No** Monday Migration Map entry.
- **No** Make.com surfaced as a user-facing readiness item.
- BCBA Productivity Report V3 remains at `/reports/bcba-productivity-report-v3`.
- BCBA Productivity Uploads remains at `/system/bcba-productivity-uploads` and
  is `AdminRoute` protected.
- State Director, RBT and BCBA training routes are untouched.

### Redirects preserved (in App.tsx, hidden from menus)

- `/user-logins-vault` → `/user-management`
- `/nfc-badges` → `/user-management`
- `/hr/nfc-badge-support` → `/user-management`
- `/admin/login-vault` → `/user-management`
- `/resources` → `/resource-library`
- `/marketing/reports` → `/reports?category=marketing`
- `/credentialing/reports` → `/reports?category=credentialing`
- `/staffing/reports` → `/reports`
- `/ops/staffing/reports` → `/reports`

## System Tools auditability

### New table `public.system_tool_audit_logs`

Columns: `id`, `tool_area`, `entity_table`, `entity_id`, `action`,
`actor_user_id`, `actor_email`, `previous_value` (jsonb), `new_value` (jsonb),
`metadata` (jsonb), `created_at`.

Indexes on `(tool_area, created_at DESC)`, `(entity_table, entity_id)`,
`(actor_user_id, created_at DESC)`.

### RLS

- `TO authenticated`. No `auth.role()`, no `user_metadata`.
- **Select:** only `has_role(auth.uid(), 'admin')` or `'super_admin'`.
- **Insert:** only admin / super_admin.
- **Delete:** not exposed to any client role (service role only).

### Helper API — `src/hooks/useSystemTools.ts`

- `logSystemToolAction({ tool_area, action, entity_table, entity_id, previous_value, new_value, metadata })`
  — best-effort audit writer, populates actor from the current session, and
  swallows errors so a failed audit row never blocks a legitimate action
  (warning is logged for ops visibility).
- `useSystemToolAuditLogs({ toolArea?, entityId?, limit? })` — admin-visible
  history hook backed by the new table.
- `useSystemWorkflows` and `useSystemIssues` now emit `create`, `update`,
  `status_change`, and `delete` audit records automatically. Status changes
  are detected by comparing the previous row snapshot to the patch.

## Integration catalog honesty

`integration_catalog.status` is now scoped to **intended / readiness state
only**. Live connection state must come from `integration_connections`.

Migration (`supabase/migrations/*_system_tool_audit_logs*.sql`):

- Reset previously-seeded `status = 'connected'` rows to `'configured'`
  (`apploi`, `ctm`, `retell`, `resend`, `google-ads`, `meta-ads`, `eligipro`,
  `calendly`).
- Explicit belt-and-suspenders for `centralreach`, `viventium`, `ctm`,
  `retell`, `eligipro`, `calendly` if any drifted back to connected.
- `make` / `makecom` / `make_com` forced to `disabled` — legacy internal
  migration bridge, not a user-facing readiness item.

**Rule for the UI:** the Integrations page must never display "Connected"
from `integration_catalog.status` alone. Connected requires a live
`integration_connections` row (status `connected` / successful OAuth probe).

## BCBA Productivity copy polish

`src/pages/os/reports/BcbaProductivityReportV3.tsx`

- New empty-state copy: **"No admin-uploaded BCBA productivity dataset
  found. Ask an admin to upload the CentralReach billing export."**
- Users continue to see "Refresh dataset" and "Manage uploads" actions but
  never a manual billing-file upload control.

`src/pages/os/system/BcbaProductivityUploads.tsx`

- Primary button copy standardized to **"Append Upload"** (previously
  "Append & Save"). The parsed-only warning and toast wording match.
- Header copy retained:
  - "Upload CentralReach billing exports here so the BCBA Productivity
    Report runs from one shared admin-fed dataset."
  - "Daily uploads append new rows and skip duplicates so team members do
    not need to upload this file themselves."
- Upload history, duplicate detection, void batch, download current
  dataset, and View Report links unchanged.

## Validation

- `bun run build` — **passed** (38.86s).
- `bunx tsgo --noEmit` — **passed**.
- Targeted vitest suites — **all passing**:
  - `src/test/reportsCanonicalNavigationPass2.test.ts`
  - `src/test/bcbaProductivityAdminUploads.test.ts` (updated to assert
    canonical menu source + no standalone Login Vault / NFC menu items,
    while still verifying the App.tsx redirects)
  - `src/test/integrationsBackendPass2.test.ts`
  - `src/test/integrationsBackendPass3.test.ts`
  - `src/test/integrationsBackendPass4.test.ts`

## Known limitations (deferred to next pass)

- **System Tools UI enhancements** — filter chips (department, status,
  priority, owner), quick status transitions, "Open related route" and
  "Open integration" quick actions, and dedicated audit-log panels inside
  Workflow Inventory / Issue Tracker / Request Intake / Integrations were
  **not** built in this pass. The audit table and helper hook exist and
  are already writing rows; wiring UI panels is a follow-up.
- **Issue Tracker schema extensions** (`severity`, `reproduction_steps`,
  `resolution_notes`, `related_route`, `related_integration_id`) and
  Workflow Inventory schema extensions (`related_route`,
  `related_integration_id`, `risk_level`) were not added.
- **Integrations page truth overlay** — the recommended "Not connected /
  Credentials required / Probe pending" copy overlay based on
  `integration_connections` is not yet in the UI. Catalog seed truth was
  corrected, so no stale "Connected" chips will originate from the seed;
  further UI hardening is deferred.
- **Request Intake → convert-to-issue / convert-to-workflow admin action**
  is not wired in this pass.