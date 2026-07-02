
# HR Team Functionality Pass — Execution Plan

This is a large multi-phase request. Rather than pretend to ship all 10 phases in one turn (which would produce shallow, half-real code across a dozen pages, tests, and migrations), I want to sequence the work honestly.

The redirect infrastructure and route mounts you referenced already exist:
- `/hr/reports` and `/admin/hr/reports` already `<Navigate to="/reports?category=hr" replace />`
- `/user-logins-vault`, `/nfc-badges`, `/admin/login-vault` already redirect to `/user-management`
- All 11 HR page routes are already mounted in `App.tsx`

So the actual delta breaks into two ships.

---

## Ship 1 (this turn) — Menu, live paths, and HR AI cleanup

Small enough to land cleanly with build validation in one pass.

### 1. HR menu rewrite (`src/lib/os/roleMenus.ts`)
Rewrite `hr_team` and `hr_lead` menus into the four sections you specified:
- **HR Command**: Dashboard, Workspace, New Hires, Orientation Queue, Training & Certifications, Compliance, Employee Support, HR Requests, Evaluations, Messages & Announcements, HR Resources
- **People & Access**: User Management, Device Requests, Device Inventory
- **Communications**: Phone System
- **Training & Resources**: Training Academy, Resource Library, Reports

Rules honored:
- Reports label = "Reports" (not "HR Reports")
- No `/hr/reports`, `/user-logins-vault`, `/admin/login-vault`, `/nfc-badges`, `/hr/nfc-badge-support` items
- Canonical evaluations path = `/hr/evaluations` (route exists, keeps HR context)

### 2. Live paths (`src/pages/os/OSShell.tsx`)
Expand `ROLE_SPECIFIC_LIVE_PATHS` for `hr_team` and `hr_lead` so every HR menu path is clickable (not gated as "coming soon"): all `/hr/*` paths above, `/user-management`, `/device-requests`, `/device-inventory`, `/phone`, `/academy`, `/resource-library`, `/reports`.

### 3. Remove visible AI CTAs from HR pages
Files to edit (identified via ripgrep): `OSHRTeam`, `OSHRWorkspace`, `OSHRNewHires`, `OSHRCompliance`, `OSHRTrainingCerts`, `OSHRTrainingAcademy`, `OSHROrientationQueue`, `OSHRRequests`, `OSHRMessages`, `OSHREmployeeSupport`, `OSHRResources`.

Per-file edits:
- Remove `<Link to="/ai/assistant">Operational Insights</Link>` header buttons
- Rename right-rail "Operational Insights" sections to "Priority Actions" / "Next Best Actions" / "Workflow Guidance" (per page context)
- Replace `/ai/assistant?q=...` prompt links with plain, non-navigating text bullets ("Next best actions") so no AI route is exposed from HR
- Global AI infrastructure elsewhere (`/ai/assistant` route, ask-blossom, etc.) is left untouched

### 4. Tests
Add `src/test/hrRoleMenuPass.test.ts`:
- `hr_team` and `hr_lead` home to `/hr-team`
- Menu contains every required path
- Menu does NOT contain `/hr/reports`, `/user-logins-vault`, `/admin/login-vault`, `/nfc-badges`, `/ai/assistant`
- No menu label is exactly "HR Reports"
- All HR menu paths are in `ROLE_SPECIFIC_LIVE_PATHS`
- HR page source files contain no visible `/ai/assistant` links or "Operational Insights" section titles

Run existing suite to confirm no regressions.

---

## Ship 2 (follow-up turn, explicitly not this turn) — Data-backed workflows + integrations

Phases 3, 4, 5, 7, 8, 9 (data-backed CRUD, CentralReach/Viventium/Stellar readiness, RLS, full test coverage) are real multi-hour work: schema deltas for readiness columns on `employee_onboarding` + new `stellar_checks` catalog row, wiring 11 pages off real Supabase reads/writes with loading/empty/error/toast, and a corresponding test tier. Doing that inside the same turn as the UI cleanup would produce untested SQL and half-real page rewrites.

I'll break Ship 2 into three separate follow-up turns when you're ready:
- **2a**: Migration — add `viventium_status`, `stellar_status`, `centralreach_status` (+ external ids, timestamps, notes) to `employee_onboarding`; ensure `integration_catalog` rows exist for centralreach/viventium/stellar_checks with honest "not connected" statuses; RLS updates keyed to `hr_team`/`hr_lead`/`super_admin`.
- **2b**: Wire New Hires, Orientation Queue, Training & Certs, Compliance, Employee Support, HR Requests, Messages to real reads/mutations against existing tables (`employee_onboarding`, `employee_trainings`, `employee_documents_hr`, `employee_cases`, `hr_announcements`, etc.), including readiness panel that reads the new columns and shows honest "integration not connected yet" copy.
- **2c**: RLS/permission tests + HR page functional tests + build validation.

---

## Out of scope for both ships (per your rules)
- No new Login Vault or NFC pages
- No `/hr/reports` page
- No AI sections added anywhere in HR
- No fake "synced" statuses for CR/Viventium/Stellar
- No touching Super Admin, User Management internals, BCBA Productivity V3, or the shared `/reports` catalog beyond confirming the HR-category tiles still exist

---

## Acceptance for Ship 1
- `bun run build` clean; existing tests pass
- New `hrRoleMenuPass.test.ts` passes
- Manual: signing in as `hr_team` shows the 4-section menu, every item routes to a live page, no "Operational Insights" button or `/ai/assistant` link visible on any HR page

Reply "go" to ship 1, or tell me to re-scope (e.g. "do menu only", "include migration this turn", "swap evaluations path to `/evaluations`").
