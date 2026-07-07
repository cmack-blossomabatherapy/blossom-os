# Super Admin Functionality — Pass 1 QA Manifest

Pass 1A (this pass): sidebar consolidation, route/redirect consistency,
one-Reports enforcement, and this manifest scaffold. Passes 1B and 1C
extend it with system-tools persistence and the integrations control
center.

## Sidebar map (Super Admin — `AppSidebar.tsx` `effectiveIsAdmin` branch)

| Section | Item | Route | Status |
| --- | --- | --- | --- |
| Core | Dashboard | `/` | live |
| Core | Command Center | `/command-center` | live |
| Live Now | Training Academy | `/academy` | live |
| Live Now | Resource Library | `/resources` | live |
| Live Now | **Reports** (only visible Reports link) | `/reports` | live |
| People & Access | User Management | `/user-management` | live (contains Login Vault + NFC Badge tabs) |
| People & Access | Role Management | `/role-management` | live |
| People & Access | Employee Directory | `/employee-directory` | live |
| People & Access | Permissions | `/permissions` | live |
| People & Access | Device Inventory | `/device-inventory` | live |
| People & Access | Device Requests | `/device-requests` | live |
| Operations | Intake | `/intake` | live |
| Operations | Clients | `/clients` | live |
| Operations | Authorizations | `/authorizations` | live |
| Operations | Scheduling | `/scheduling` | live |
| Operations | Staffing | `/ops/staffing` | live |
| Operations | QA | `/qa` | live |
| Operations | Evaluations | `/evaluations` | live |
| State Operations (extra, collapsed) | multiple | `/state-operations`, `/ops/*` | live |
| Growth & Admissions | Marketing Dashboard | `/marketing` | live |
| Growth & Admissions | Business Development | `/business-development` | live |
| Growth & Admissions | Referral CRM | `/marketing/referral-crm` | live |
| Growth & Admissions | Lead Sources | `/marketing/lead-sources` | live |
| Growth & Admissions | Campaigns | `/marketing/campaigns` | live |
| Growth & Admissions | CTM / Call Tracking | `/marketing/call-tracking` | live |
| Growth & Admissions | LeadTrap | `/marketing/leadtrap` | live |
| Growth & Admissions | Facebook Ads | `/marketing/facebook-ads` | live |
| Growth & Admissions | Google Ads | `/marketing/google-ads` | live |
| Growth & Admissions | Patient Lifetime Journey | `/patient-journey` | live |
| Growth & Admissions | Intake Dashboard | `/intake/dashboard` | live |
| Growth & Admissions | Lead → Ready-to-Start Pipeline | `/intake/lead-to-active` | live |
| Growth & Admissions | Referral Queue | `/intake/referral-queue` | live |
| Growth & Admissions | Intake Tasks | `/intake/tasks` | live |
| Growth & Admissions | Lead Benefits Cheat Sheets | `/intake/benefits-cheat-sheets` | live |
| Finance | Billing | `/billing-finance` | live |
| Finance | Payroll | `/payroll/workspace` | live |
| Finance | Revenue | `/revenue` | live |
| HR (collapsed) | HR Dashboard | `/hr/dashboard` | live |
| HR (collapsed) | Employee Records | `/hr/employee-records` | redirect → `/user-management` |
| HR (collapsed) | HR Requests | `/hr/requests` | live |
| HR (collapsed) | Compliance Items | `/hr/compliance-items` | live |
| Credentialing (collapsed) | Credentialing Dashboard | `/credentialing` | live |
| Credentialing (collapsed) | Provider Credentialing | `/credentialing/providers` | live |
| Credentialing (collapsed) | Insurance Credentialing | `/credentialing/insurance` | live |
| Credentialing (collapsed) | BCBA Credentials | `/credentialing/bcba` | live |
| Credentialing (collapsed) | Uncredentialed BCBAs | `/credentialing/uncredentialed-bcbas` | live |
| Credentialing (collapsed) | Expiring Credentials | `/credentialing/expiring` | live |
| Communications | Phone System | `/phone` | live |
| Communications | Call Logs | `/communications/call-logs` | live |
| Communications | Shared Lines | `/phone/shared` | live |
| Communications | Phone Requests | `/communications/phone-requests` | live |
| Communications | Directory | `/communications/directory` | live |
| Communications | After-Hours Calls | `/phone/ai-calls` | live |
| Communications | Call Email Audit | `/phone/ai-calls/audit` | live |
| Communications | User Activity Log | `/communications/user-activity` | live |
| Communications | Patient Activity Log | `/communications/patient-activity` | live |
| Systems | Integrations | `/admin/integrations` | live — Pass 1C hardens |
| Systems | Automated Emails | `/admin/automated-emails` | live |
| Systems | System Settings | `/settings` | live |
| System Tools (collapsed) | BCBA Productivity Uploads | `/system/bcba-productivity-uploads` | live, admin-only |
| System Tools (collapsed) | Workflow Inventory | `/system/workflow-inventory` | DB-backed (Pass 1B) |
| System Tools (collapsed) | Request Intake | `/system/request-intake` | DB-backed (see Executive Leadership Pass C) |
| System Tools (collapsed) | Issue Tracker | `/system/issue-tracker` | DB-backed (Pass 1B) |

## Reports consolidation

- Exactly **one** visible Reports menu item for Super Admin (`Live Now → Reports → /reports`).
- Removed duplicate Reports entries from the HR and Credentialing sections of the admin sidebar (were pointing at the same `/reports` route and violated the one-Reports rule).
- Legacy Reports paths still redirect to `/reports` (verified in `src/App.tsx`):
  - `/analytics` → `/reports`
  - `/marketing/reports` → `/reports?category=marketing`
  - `/hr/reports` → `/reports?category=hr`
  - `/admin/hr/reports` → `/reports?category=hr`
  - `/credentialing/reports` → `/reports?category=credentialing`
  - `/staffing/reports` → `/reports`
  - `/ops/staffing/reports` → `/reports`
  - `/blossom/reports` → `/reports`
  - `/intelligence/reports` → `/reports`
  - `/rbt/reports` → `/reports?audience=rbt`
  - `/reports/catalog`, `/reports/landing`, `/reports/ai/new` → `/reports`

## Login Vault / NFC

- No standalone Login Vault or NFC Badge sidebar links exist.
- Both live inside `/user-management`.
- Redirects preserved:
  - `/user-logins-vault` → `/user-management`
  - `/nfc-badges` → `/user-management`
  - `/hr/nfc-badge-support` → `/user-management`
  - `/admin/login-vault` → `/user-management`

## Preserved features (confirmed)

- Training Academy (`/academy`), State Director / RBT / BCBA training journeys
- Resource Library (`/resources`)
- Reports and BCBA Productivity Report V3 (`/reports/bcba-productivity-v3`)
- Super Admin BCBA Productivity Uploads (`/system/bcba-productivity-uploads`, guarded by `AdminRoute`)
- User Management with Login Vault + NFC Badge tabs
- Device Inventory / Device Requests
- Phone System + Communications suite
- Evaluations, Integrations, Role Management, Employee Directory, Permissions

## Systems consolidation

- Systems section now contains: Integrations, Automated Emails, System Settings (single source per item).
- System Tools no longer duplicates Integrations or System Settings; added BCBA Productivity Uploads and kept Workflow Inventory, Request Intake, Issue Tracker.

## Pass 1B — System Tools DB-backed (DONE)

- Migration created `public.system_workflows` and `public.system_issues` with
  grants, RLS, triggers, and indexes.
  - `system_workflows`: authenticated read; admin/super_admin write.
  - `system_issues`: any authenticated user may submit; admin/super_admin
    triage/edit/delete.
- `src/hooks/useSystemTools.ts` provides `useSystemWorkflows()` and
  `useSystemIssues()` CRUD hooks.
- `WorkflowInventoryPage` and `IssueTrackerPage` rewritten in
  `src/pages/os/system-tools/SystemToolsPages.tsx` as real DB-backed workspaces
  with search, add/edit/delete dialogs, admin gating, and a "Report issue"
  submit dialog available to all authenticated users.
- `RequestIntakePage` unchanged — already persists via `executive_work_items`
  with `category="system_request"`.

## Pass 1C — Integrations control center (DONE)

- `/admin/integrations` reads live from `integration_catalog`,
  `integration_connections`, `integration_sync_runs`,
  `integration_webhook_events`, and `integration_oauth_connections` via
  `src/lib/os/integrations/backend.ts`.
- Header status bar shows honest live counts (configured / connected /
  needs attention / recent sync failures / webhook events / M365 users) with
  a Refresh button and calm empty states — "Integration backend ready — no
  live connections yet" when nothing is configured.
- Per-integration cards now overlay live `integration_connections.status`
  onto the static registry entry, so "connected / reauth / error / syncing /
  disconnected" reflects reality; static status only fills in when no live
  connection row exists. `enabled` also mirrors the live connection row when
  present.
- Read-only admin view (Pass 1 scope). No credential entry, no OAuth
  connect/disconnect from this page in this pass — those flows remain in
  their existing dedicated surfaces and the underlying Edge Functions.

### Manual QA checklist (Pass 1C)

- [ ] Sign in as Super Admin → `/admin/integrations` header shows
      "Integration backend ready — no live connections yet" **or** the real
      "N of M connected" count.
- [ ] Refresh button reloads catalog / connections / sync runs / webhook
      events without page reload.
- [ ] When a live `integration_connections` row exists, the matching card's
      status pill reflects the live status (not the static registry value).
- [ ] When no live row exists, the card falls back to the static registry
      status — no fake "connected" states.
- [ ] "Needs attention" and "Recent sync failures" tiles are non-zero only
      when the underlying tables actually contain matching rows.

## Manual QA checklist (Pass 1A)

- [ ] Sign in as Super Admin → sidebar shows only one `Reports` link (Live Now section).
- [ ] Confirm HR and Credentialing sections no longer show `Reports`.
- [ ] Systems section shows: Integrations, Automated Emails, System Settings.
- [ ] System Tools shows: BCBA Productivity Uploads, Workflow Inventory, Request Intake, Issue Tracker (no Integrations/Settings duplicates).
- [ ] Every admin sidebar link navigates without hitting a 404 or old shell.
- [ ] `/user-logins-vault`, `/nfc-badges`, `/hr/nfc-badge-support` all land on `/user-management`.
- [ ] `/rbt/reports`, `/analytics`, `/hr/reports`, `/credentialing/reports`, `/marketing/reports`, `/blossom/reports`, `/intelligence/reports` all resolve to the canonical `/reports` view (with correct `?category=` / `?audience=` when applicable).
- [ ] `View as Role` from Super Admin shows the target role's exact menu; exiting restores the full Super Admin menu.
- [ ] `/reports/bcba-productivity-v3` still renders and reads uploaded data.
- [ ] `/system/bcba-productivity-uploads` is reachable and gated behind `AdminRoute`.
