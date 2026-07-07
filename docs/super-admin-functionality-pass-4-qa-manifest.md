# Super Admin — Pass 4 QA Manifest

Scope of this pass: hardening + canonical-menu lockdown. Parts 1, 2, and 4 (System Tools filters/actions, shared audit helper with warning toast, full Integrations "truth" overlay) are staged for follow-up passes and are called out under _Known remaining gaps_.

## What changed

- **Database hardening (Part 3)** — Added a follow-up migration that explicitly `REVOKE`s execute on `public.user_is_leadership()` and `public.is_leadership(uuid)` from `PUBLIC`/`anon` and re-`GRANT`s only to `authenticated` and `service_role`. The previous grant migration ran against an older function signature; the July 2026 re-`CREATE OR REPLACE` re-set defaults, so grants had drifted.
- **Menu integrity tests (Part 5)** — New `src/test/superAdminMenuPass4.test.ts` asserts:
  - `AppSidebar` and `OSShell` both import `SUPER_ADMIN_MENU`.
  - No duplicate menu paths.
  - Exactly one `Reports` menu item → `/reports`.
  - No standalone `Login Vault` or `NFC Badges` menu items.
  - No `AI` menu section.
  - Every menu path (query-string stripped) is present in `src/App.tsx` as a `<Route path>` or redirect.
  - `/reports/bcba-productivity-report-v3` remains a hidden runtime route, not a sidebar Reports page.

## What was preserved

- Canonical `src/lib/os/superAdminMenu.ts` and both consumers.
- `/user-logins-vault` and `/nfc-badges` redirects to `/user-management`.
- Redirects: `/marketing/reports`, `/credentialing/reports`, `/staffing/reports`, `/ops/staffing/reports` → `/reports`.
- BCBA Productivity Report V3 route + `/system/bcba-productivity-uploads` admin surface.
- Training Academy content and journeys (State Director, RBT, BCBA) — untouched.
- Make.com is not restored as an active integration.

## Database migrations added

- `REVOKE`/`GRANT` follow-up on `public.user_is_leadership()` and `public.is_leadership(uuid)`.

## Tests run

- `bunx vitest run src/test/superAdminMenuPass4.test.ts` → 8/8 passing.

## Known remaining gaps (targeted for the next Super Admin passes)

- **Part 1 — System Tools functionality**
  - `/system/workflow-inventory`: filters (department, status, priority, owner, risk level, related integration/route), quick actions (mark active/needs review/deprecated/verified, assign owner), "Open related route" / "Open integration" affordances, columns `related_route`, `related_integration_id`, `risk_level`, `last_verified_at`, `verified_by`.
  - `/system/issue-tracker`: filters + quick actions (triage / start work / blocked / resolve / reopen / assign owner), fields `severity`, `reproduction_steps`, `resolution_notes`, `related_route`, `related_integration_id`, `due_date`, `resolved_at`, `closed_by`. Resolution should prompt for notes.
  - `/system/request-intake`: wire Submit; conversion into System Issue or Workflow Inventory item carrying title/description/area/priority/related route/integration, with dual audit logs.
- **Part 2 — Audit reliability**
  - Shared mutation-with-audit helper: run main action, await audit write, surface "Saved, but audit log could not be recorded" toast on audit failure without rolling back. Metadata should include page/route, tool area, action type, and changed fields.
  - Extend audit logging to integration admin actions (test connection, save credentials/config, run sync, enable/disable, status change) and to BCBA productivity admin uploads (append/skip-duplicate/void/rollback).
- **Part 4 — Integration truth overlay**
  - Enforce the full status vocabulary end-to-end: Connected only when live `integration_connections` row proves it; Configured / Probe pending / Coming soon / Legacy or Internal for everything else. Make.com stays Legacy/Internal. Add a test that a static-registry entry never renders as Connected without a live row, and update the older QA manifest that still claims the overlay is missing.

## Follow-up owner

Continue in the next Super Admin pass — Parts 1, 2, and 4 above are the remaining work to reach 100% functionality.