# Super Admin Functionality — Pass 7 Final Closeout QA Manifest

## Scope
Final polish pass on Super Admin. Intentionally small: one UI display
fix, one focused test file, and a manifest correction. No new routes,
menus, or pages. No changes to Training Academy, State Director / RBT /
BCBA journeys, BCBA Productivity Report V3, admin daily CentralReach
billing upload, User Management (Login Vault, NFC Badges), or the
Reports catalog architecture.

## What Pass 7 changed

### 1. Workflow verification display
`src/pages/os/system-tools/SystemToolsPages.tsx` — the "Last verified"
cell now renders `verified_by_name ?? verified_by`. Display name is
preferred; the raw UUID appears only when no display name is available.
Date rendering and DB write logic are unchanged.

### 2. Focused test
`src/test/superAdminFunctionalityPass7.test.ts` asserts:
- Workflow verifier cell uses `verified_by_name` first, falls back to
  `verified_by`.
- `verified_by` / `closed_by` still save `user?.id`.
- `verified_by_name` / `closed_by_name` still save `displayName`.
- Pass 6 specific workflow/issue audit action names remain.
- `IntegrationRegistrySelect` remains used in workflow, issue, and
  request intake dialogs.
- Make.com / internal-only integrations remain excluded from the
  selector.

### 3. QA manifest command accuracy
Earlier passes referenced `bunx tsgo --noEmit`, which is not available
in this environment. This manifest uses the real command:
`pnpm exec tsc --noEmit`.

## Validation

### Build
```
pnpm run build
```

### Typecheck
```
pnpm exec tsc --noEmit
```

### Targeted tests
```
pnpm exec vitest run \
  src/test/superAdminFunctionalityPass5.test.ts \
  src/test/superAdminFunctionalityPass6.test.ts \
  src/test/superAdminFunctionalityPass7.test.ts \
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

## Manual QA checklist — Super Admin
- [ ] System Tools > Workflows: "Last verified" shows the verifier's
      display name (e.g. "7/8/2026 by Corey Mack"), not a raw UUID.
- [ ] System Tools > Issues: resolve then reopen an issue — no UUID vs
      text type errors; `closed_by` clears on reopen.
- [ ] Workflow add/edit, Issue submit/triage, and Request Intake
      submit/edit all use the Related Integration registry dropdown
      (no free-text integration field).
- [ ] Integrations page toggle persists after a full refresh when a
      live `integration_connections` row exists.
- [ ] Toggling an integration writes `integration_enabled` /
      `integration_disabled` audit rows visible in the Audit Log
      Viewer.
- [ ] Left nav shows exactly one Reports entry.
- [ ] Reports catalog still lists BCBA Productivity Report V3 and it
      opens correctly.
- [ ] Login Vault and NFC Badge Management appear inside User
      Management, not as standalone Super Admin pages.
- [ ] Training Academy, State Director, RBT, and BCBA journey content
      is unchanged.

## Preservation guards
- No new routes, menu entries, or pages.
- No duplicate Reports page.
- No standalone Login Vault or NFC page.
- No AI menu sections added.
- No user-facing Make.com dependency.