# Integrations Backend Pass 4 — QA Manifest

## What changed

- Introduced a real **provider adapter layer** under `supabase/functions/_shared/integrations/`.
- Removed per-provider hardcoded branches from `integration-test-connection`, `integration-run-sync`, and `integration-webhook`. All three entrypoints now delegate to provider adapters.
- Added `integration_normalized_records` staging table + admin-gated RLS so syncs and webhooks land in a provider-neutral surface.
- Added two new Microsoft 365 per-user functions: `microsoft-calendar-sync`, `microsoft-mail-activity-sync`. Both reuse `_shared/microsoftTokenVault.refreshUserToken`; tokens are never returned to the client.
- Resend delivery flows (welcome / invite / MFA / evaluation emails) are explicitly preserved and untouched.
- Retell observability improved: explicit `console.error` on probe/sync failures, structured `fetchJson` envelope, no hardcoded agent IDs.
- The `SOLOM_API_KEY` alias is honored centrally in `_shared/integrations/secrets.ts`.

## New files

- `supabase/functions/_shared/integrations/types.ts` — adapter contract
- `supabase/functions/_shared/integrations/secrets.ts` — typed env + aliases
- `supabase/functions/_shared/integrations/http.ts` — `fetchJson` wrapper
- `supabase/functions/_shared/integrations/normalizers.ts` — `upsertNormalizedRecord`, `recordIntegrationEvent`
- `supabase/functions/_shared/integrations/providerRegistry.ts`
- `supabase/functions/_shared/integrations/providers/{mailchimp,resend,retell,ctm,apploi,centralreach,solum,eligipro,ms365,jivetel,make,pandadoc,leadtrap,calendly,goIntegrateNava}.ts`
- `supabase/functions/microsoft-calendar-sync/index.ts`
- `supabase/functions/microsoft-mail-activity-sync/index.ts`
- `src/test/integrationsBackendPass4.test.ts`

## New migration

`integration_normalized_records` with:

- Partial unique index on `(integration_id, provider_record_id, record_kind) where provider_record_id is not null` so re-syncs and replayed webhooks upsert.
- Indexes: `(integration_id, record_kind, occurred_at desc)`, `(raw_event_id)`, `(sync_run_id)`.
- Extra index on `integration_webhook_events (integration_id, processing_status, received_at desc)`.
- RLS: only `admin / super_admin / systems_admin` can read from the app; service role does all writes.

## Per-provider status

| Integration | Status policy | Live probe? | Sync? | Webhook | Class |
|---|---|---|---|---|---|
| mailchimp | `connected` when /ping ok | yes | recent campaigns | yes | marketing_email |
| resend | `connected` when /domains ok | yes | report-only | yes | transactional_email_preserved |
| retell | `connected` when /list-agents ok | yes | /v2/list-calls | yes | ai_voice |
| ctm | `configured_pending_probe_path` until `CTM_API_BASE_URL` + `CTM_PROBE_PATH` set | conditional | webhook-driven | yes | call_tracking |
| apploi | `configured_pending_probe_path` until base+probe paths set | conditional | candidates page | yes | recruiting_ats |
| centralreach | `configured_pending_probe_path` until token or probe url set | conditional | modes: clients/schedules/authorizations/sessions/billing_export; file_import handoff preserved | yes | emr |
| solum | `configured_pending_vendor_endpoint` until vendor URL set | conditional | webhook-first | yes | eligibility_vob |
| eligipro | `configured_pending_probe_path` until base+probe paths set | conditional | webhook-first | yes | eligibility |
| ms365 | `configured` for app creds; per-user via `microsoft-graph-probe` | yes (per-user) | calendar + mail activity (per-user) | n/a | per_user_oauth |
| jivetel | `configured_pending_probe_path` until base+probe paths set | conditional | phone users/ext | yes | phone_system |
| make | `webhook_ready` when secret + outbound url present | n/a | dryRun outbound ping | yes | migration_bridge |
| pandadoc | `connected` on templates probe | yes | recent documents | yes | esignature_only |
| leadtrap | `webhook_ready` when secret present | webhook | webhook-first | yes | lead_capture_webhook |
| calendly | `connected` if `CALENDLY_ACCESS_TOKEN`; else `configured_pending_probe_path` | conditional | webhook-first | yes | scheduling |
| go-integrate-nava | `configured_pending_vendor_endpoint` until docs | conditional | none yet | yes | eligibility_pending |

## Environment variables (required + optional)

Set these as Lovable Cloud secrets via the secrets manager. Anything ending in `_API_BASE_URL` / `_PROBE_PATH` / `_PATH` is optional and only flips probe/sync from `configured_pending_*` to a real call.

- Mailchimp: `MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`
- Resend: `RESEND_API_KEY`
- Retell: `RETELL_API_KEY`, optional `RETELL_WEBHOOK_SECRET`
- CTM: `CTM_API_KEY`, `CTM_WEBHOOK_SECRET`, optional `CTM_API_BASE_URL`, `CTM_ACCOUNT_ID`, `CTM_PROBE_PATH`
- Apploi: `APPLOI_API_KEY`, optional `APPLOI_API_BASE_URL`, `APPLOI_PROBE_PATH`, `APPLOI_CANDIDATES_PATH`
- CentralReach: `CENTRALREACH_CLIENT_ID`, `CENTRALREACH_CLIENT_SECRET`, `CENTRALREACH_API_BASE_URL`, optional `CENTRALREACH_TOKEN_URL`, `CENTRALREACH_PROBE_PATH`
- Solom / Solum: `SOLUM_API_KEY` (alias `SOLOM_API_KEY` accepted), optional `SOLUM_API_BASE_URL`, `SOLUM_PROBE_PATH`
- Eligipro: `ELIGIPRO_API_KEY`, optional `ELIGIPRO_API_BASE_URL`, `ELIGIPRO_PROBE_PATH`
- MS365: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`, `MICROSOFT_REDIRECT_URI`, `OAUTH_TOKEN_ENCRYPTION_KEY`
- Jivetel: `JIVETEL_API_KEY`, optional `JIVETEL_API_BASE_URL`, `JIVETEL_PROBE_PATH`
- Make.com: `MAKE_WEBHOOK_SECRET`, `MAKE_OUTBOUND_WEBHOOK_URL`
- PandaDoc: `PANDADOC_API_KEY`, `PANDADOC_WEBHOOK_SECRET`
- LeadTrap: `LEADTRAP_WEBHOOK_SECRET`, optional `LEADTRAP_API_KEY`, `LEADTRAP_API_BASE_URL`, `LEADTRAP_PROBE_PATH`
- Calendly: `CALENDLY_CLIENT_ID`, `CALENDLY_CLIENT_SECRET`, `CALENDLY_WEBHOOK_SIGNING_KEY`, optional `CALENDLY_ACCESS_TOKEN`, `CALENDLY_API_BASE_URL`, `CALENDLY_PROBE_PATH`
- Go Integrate Nava: `GO_INTEGRATE_NAVA_API_KEY`, `GO_INTEGRATE_NAVA_WEBHOOK_SECRET`, optional `GO_INTEGRATE_NAVA_API_BASE_URL`, `GO_INTEGRATE_NAVA_PROBE_PATH`

## How to test from Admin → Integrations

1. Open Admin → Integrations.
2. Click **Test connection** on any integration. Expect one of:
   - `connected` (live probe succeeded)
   - `webhook_ready` (webhook-first; secret present)
   - `configured_pending_probe_path` (creds present, base/probe url missing)
   - `configured_pending_vendor_endpoint` (vendor docs unconfirmed)
   - `not_configured` (missing required secret)
   - `error` (probe ran and provider rejected — see `last_error`)
3. Click **Run sync** to invoke the adapter sync. Counts land on the new sync run row and normalized records appear in `integration_normalized_records`.
4. For Outlook: each user runs `/microsoft-oauth-start`, then can run `microsoft-calendar-sync` / `microsoft-mail-activity-sync` to populate their own normalized records.

## Known limitations

- CTM, Apploi, Solom/Solum, Eligipro, Jivetel, Go Integrate Nava: live probes require base URL + probe path env vars; status honestly reports `configured_pending_*` until those are set.
- CentralReach: pull sync intentionally returns `partial / file_import_ready` until vendor endpoints are wired. **BCBA Productivity admin upload flow is untouched.**
- Microsoft mail activity sync stores only metadata (id, subject, from/to, conversationId, date). No message body is persisted by design.
- Make.com is treated as **migration bridge only**; never source-of-truth.
- PandaDoc is treated as **e-signature only**; never patient/HR/clinical source-of-truth.

## Preservation confirmations

- ✅ Resend delivery (invites, welcome, MFA, evaluation emails) is unchanged.
- ✅ Retell observability improved (structured error logging, real probe/sync); no hardcoded agent IDs.
- ✅ Microsoft Outlook remains per-user OAuth via `microsoft-oauth-start` / `microsoft-graph-probe`; tokens never exposed to client.
- ✅ CentralReach is treated as the EMR; BCBA Productivity upload flow untouched.
- ✅ No required provider returns generic `not_implemented` from `integration-run-sync`.