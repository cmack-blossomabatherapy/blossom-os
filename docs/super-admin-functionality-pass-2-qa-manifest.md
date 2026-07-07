# Super Admin Functionality — Pass 2 QA Manifest

Pass 2 tightens the Super Admin experience for trust: no duplicate visible
menu paths, honest integration statuses, cleaner Integrations copy, and a
truthful record of what is actually DB-backed today.

Preserved from Pass 1 (unchanged): `/reports` canonical + one visible
Reports link, Login Vault + NFC inside `/user-management`, BCBA
Productivity Uploads admin-only, System Tools DB-backed workspaces,
Integrations control center wired to backend tables.

## 1. Duplicate menu path audit (Super Admin branch of `AppSidebar.tsx`)

Removed duplicates:

| Path | Was appearing in | Kept in | Removed from |
| --- | --- | --- | --- |
| `/device-inventory` | People & Access + HR | People & Access | HR |
| `/device-requests`  | People & Access + HR | People & Access | HR |
| `/authorizations`   | Operations + State Operations | Operations | State Operations (only the query-string filters `?stage=approved` and `?stage=denied` remain there) |
| `/ops/staffing`     | Operations + State Operations (twice) | Operations (bare) + State Operations `?tab=preferences` | State Operations bare entry |

Relabelled generic entries in State Operations so it is clear each one
opens a state-scoped surface (not a duplicate of the global Operations
page):

- `Scheduling` → `State Scheduling` (`/ops/scheduling`)
- `QA Dashboard` → `State QA Dashboard` (`/ops/qa`)
- Kept: State Escalations, Operational Tasks, Case Management, No OON
  Benefits, Family Staffing Preferences (query-string variant).

Result: no visible path appears twice in the Super Admin sidebar except
the approved query-string variants under `/authorizations` and
`/ops/staffing?tab=preferences`.

## 2. Reports (unchanged from Pass 1)

- Exactly one visible Reports item: `Live Now → Reports → /reports`.
- Legacy report URLs still redirect to `/reports` (see Pass 1 manifest).
- BCBA Productivity Report V3 remains available at
  `/reports/bcba-productivity-v3`.
- BCBA Productivity Uploads remain admin-only at
  `/system/bcba-productivity-uploads` and append data.

## 3. Honest integration statuses

`src/lib/os/integrations/integrationRegistry.ts` no longer marks static
entries as `connected`. All previously-hardcoded `status: "connected"`
values were downgraded to `status: "configured"` (intended/desired state),
which the UI treats as **Not connected** until a live
`integration_connections` row overlays it.

Effect in the UI (`src/pages/admin/Integrations.tsx`):

- `mapRegistryStatus`: static `"configured"` now returns `"disconnected"`
  (label: "Not connected") instead of `"connected"`.
- The backend overlay in `list` still promotes a card to `Connected`,
  `Reauth required`, `Syncing`, `Error`, or `Not connected` based on the
  live `integration_connections.status` for that integration.
- Result: no integration card shows "Connected" without a real backend
  connection row. CentralReach, Viventium, Apploi, Microsoft 365, CTM,
  Retell, Resend, Google Ads, Meta Ads, Eligipro, Calendly, LeadTrap,
  Mailchimp, Jivetel, Make, BloomGrowth, PandaDoc, Solum, Fathom, Go
  Integrate Nava are all honest.

Registry header comment now explicitly documents that the static `status`
field describes intent, not proof of connectivity.

## 4. Integration page copy cleanup

`/admin/integrations` copy tightened:

- "Types & mock data" comment → "Types & registry-backed catalog".
- Search placeholder "Search 200+ integrations..." → "Search
  integrations...".
- Empty-state under the header stats: "No webhook events received yet —
  static cards below show registry metadata only" → "No webhook events
  received yet — cards below reflect registered integrations and any live
  backend connections."
- Status pill "Coming soon" label → "Credential required" (used only for
  `planned` / `maybe` registry entries).

No prototype-flavored language remains on the page.

## 5. Integration command center actions (Pass 1C — preserved)

`/admin/integrations` continues to read live from `integration_catalog`,
`integration_connections`, `integration_sync_runs`,
`integration_webhook_events`, and `integration_oauth_connections`. Test
Connection and Run Sync buttons remain wired to the
`integration-test-connection` and `integration-run-sync` Edge Functions,
which delegate to the provider adapter registry
(`supabase/functions/_shared/integrations/providerRegistry.ts`). Adapters
return honest `not_configured` / `configured_pending_probe` / `error` /
`success` outcomes; no adapter fakes a probe.

## 6. System Tools DB-backed status (truthful)

| Surface | Status |
| --- | --- |
| Workflow Inventory (`/system/workflow-inventory`) | DB-backed via `public.system_workflows` (Pass 1B) |
| Issue Tracker (`/system/issue-tracker`) | DB-backed via `public.system_issues` (Pass 1B) |
| Request Intake (`/system/request-intake`) | DB-backed via `executive_work_items` with `category="system_request"` (Executive Leadership Pass C) |
| BCBA Productivity Uploads (`/system/bcba-productivity-uploads`) | DB-backed, admin-only via `AdminRoute` |
| Integrations (`/admin/integrations`) | Backend-aware; Test Connection + Run Sync wired; still requires provider credentials for live connections |

## 7. People & Access verification (preserved)

- User Management (`/user-management`) still contains Login Vault + NFC
  Badge tabs. Vault access/copy/open events continue to be logged via
  `src/lib/security/vaultAudit.ts` (`login_access_logs` /
  `secure_unlock_events`).
- No standalone Login Vault or NFC sidebar links exist.
- Redirects preserved: `/user-logins-vault`, `/nfc-badges`,
  `/hr/nfc-badge-support`, `/admin/login-vault` → `/user-management`.
- Role Management, Employee Directory, Permissions unchanged.

## 8. Build result

- `npm run build` — passes locally on the Pass 2 diff.
- Types clean (no new `any`, no new eslint rule violations introduced
  by this pass).

## 9. Known limitations / deferred to a future pass

The following items from the Pass 2 spec are intentionally deferred and
are NOT claimed as complete:

- **`system_tool_audit_logs` table + audit panel.** Not yet added. The
  existing `system_workflows` / `system_issues` rows already carry
  `created_at` / `updated_at` and (for issues) `resolved_at`, but a
  dedicated per-action audit trail with `previous_value` / `new_value` /
  `actor_user_id` is still pending.
- **Expanded filter/quick-action UX on Workflow Inventory and Issue
  Tracker** (status/priority/department/owner filters, one-click status
  transitions, severity, related route, related integration,
  reproduction/resolution notes).
- **Convert-a-request-to-issue/workflow shortcut on Request Intake.**
- **New `IntegrationStatus` enum values** (`webhook_ready`,
  `configured_pending_probe`, `legacy`). Not added to
  `src/lib/os/integrations/types.ts` in this pass to avoid a wide ripple
  through consumers; the same intent is conveyed today by the honest
  fallback to "Not connected" plus the live backend overlay.

These are tracked for Super Admin Pass 3.