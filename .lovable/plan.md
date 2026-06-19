## Integrations Backend Pass 4 — Plan

Build provider adapter layer, normalized sync staging, and webhook normalization on top of the existing Pass 1–3 foundation. No fake success; honest statuses everywhere.

### 1. Shared adapter framework (`supabase/functions/_shared/integrations/`)
- `types.ts` — `ProviderProbeResult`, `ProviderSyncResult`, `ProviderWebhookNormalizeResult`, `ProviderAdapter` interface (`probe`, `sync`, `normalizeWebhook`, optional `verifySignature`).
- `secrets.ts` — typed `getEnv()` / `requireEnv()` helpers with masked logging.
- `http.ts` — `fetchJson()` wrapper with timeout, status handling, structured error envelope.
- `normalizers.ts` — helpers to upsert into `integration_normalized_records` (service role), build `integration_events` rows.
- `providerRegistry.ts` — maps integration id → adapter for all 15 required providers.

### 2. Provider adapters (`_shared/integrations/providers/*.ts`)
One module per: mailchimp, resend, retell, ctm, apploi, centralreach, solum, eligipro, ms365, jivetel, make, pandadoc, leadtrap, calendly, goIntegrateNava.

Status policy per adapter:
- Real probe when endpoint is documented and creds present → `connected`.
- Webhook-only providers → `webhook_ready` when secret present.
- Missing base URL/probe path env → `configured_pending_probe_path`.
- Missing vendor docs/endpoint → `configured_pending_vendor_endpoint`.
- Missing required secret → `not_configured`.

Highlights:
- **mailchimp** — keep `/ping`, add small recent-campaigns sync → `email_marketing` records.
- **resend** — preserve current `/domains` probe; sync is report-only; do not touch invite/MFA flows.
- **retell** — real probe (list-agents endpoint), recent calls sync → normalized `call` records + `integration_events`; structured error logging.
- **ctm** — env-driven base URL/account; webhook normalizer for inbound call → `call`/`lead`.
- **apploi** — env-driven; candidate sync → `candidate`.
- **centralreach** — OAuth client-credentials probe; sync modes (`clients|schedules|authorizations|sessions|billing_export`); honest pending status; never touches BCBA Productivity uploads.
- **solum** — accept `SOLOM_API_KEY` alias; eligibility/VOB normalization.
- **eligipro** — eligibility events.
- **ms365** — reuses `microsoftTokenVault.refreshUserToken`; calendar list + safe mail-activity metadata only; per-user.
- **jivetel** — phone extensions/routing.
- **make** — verifies `MAKE_WEBHOOK_SECRET` + outbound URL; labeled `migration_bridge`; webhook → `automation_event`.
- **pandadoc** — labeled `esignature_only`; templates probe; webhook → `document`.
- **leadtrap** — webhook-first; `webhook_ready`; lead normalization.
- **calendly** — OAuth/token probe; webhook → `calendar_event`.
- **goIntegrateNava** — keep registered; `configured_pending_vendor_endpoint` until docs.

Plus two new MS365 functions: `microsoft-calendar-sync`, `microsoft-mail-activity-sync` (admin-callable, per-user, token via vault).

### 3. Refactor existing edge functions
- `integration-test-connection` → look up adapter in `providerRegistry`, call `probe()`. Keep admin-only auth.
- `integration-run-sync` → call adapter `sync()` with body `{mode, since, limit, dryRun}`; update sync run counts; insert normalized records with `sync_run_id`; no more `not_implemented` for required providers.
- `integration-webhook` → after raw insert + signature verify, call adapter `normalizeWebhook()`, upsert normalized record, insert `integration_events`, set `processing_status` ∈ {`received`,`normalized`,`normalized_unknown`,`rejected`,`failed`} and `processed_at` / `error_message`.
- `retell-webhook` — keep, but route normalization through the new retell adapter for consistency.

### 4. Migration (new file)
`integration_normalized_records` with columns specified, partial unique index on `(integration_id, provider_record_id, record_kind) where provider_record_id is not null`, FK to catalog/webhook_events/sync_runs, `updated_at` trigger.

GRANTs: `service_role` ALL; `authenticated` SELECT gated by admin role via RLS (`has_role(auth.uid(),'admin')`); no anon.

Also extend `integration_webhook_events.processing_status` allowed values if currently constrained; add index on `(integration_id, processing_status, created_at desc)`.

### 5. Admin UI (`src/pages/admin/Integrations.tsx` + small additions in `src/lib/os/integrations/backend.ts`)
- Add helpers: `listNormalizedRecords(integrationId, limit)`, counts by `record_kind`.
- Per-integration detail surfaces: live connection status, last tested/success/error, recent sync runs, recent webhook events w/ processing_status, normalized records count by kind.
- Webhook-only providers show "Webhook ready" badge instead of pull-sync controls.
- No secret editor, no secret values shown.

### 6. Tests
`src/test/integrationsBackendPass4.test.ts` — assertions per spec (adapter registry coverage, no hardcoded provider branching in `integration-test-connection`/`integration-run-sync`, no `not_implemented` literal for required ids, webhook calls normalizer, migration creates table + RLS + index, Retell probe/sync path exists, Resend untouched, MS365 uses `refreshUserToken`, Solum accepts `SOLOM_API_KEY`, Make labeled bridge, PandaDoc labeled esign, CentralReach labeled EMR).

Re-run existing Pass 1–3 tests.

### 7. QA doc
`docs/integrations-backend-pass-4-qa-manifest.md` — change log, adapter list, migration, per-provider status table (live probe / webhook-only / pending), env var matrix, admin test steps, known limitations, preservation confirmations (Resend, BCBA Productivity, MS user OAuth, Retell improvement).

### Out of scope
- No new operational UI modules consuming normalized records (staging only).
- No PHI-heavy MS mail body storage.
- No new OAuth providers beyond MS365 / Calendly / CentralReach client-creds.
- No rebuild of Resend delivery, MFA, welcome emails, or BCBA Productivity upload pipeline.

### File count estimate
~21 new files (16 adapters + registry + 2 MS365 functions + migration + test + QA doc), ~5 edited (3 edge functions, backend.ts, Integrations.tsx).
