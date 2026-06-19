# Integrations Backend Foundation — QA Manifest (Pass 1)

_Generated: 2026-06-19_

## Scope

Pass 1 establishes the secure backend rails every Blossom OS integration will use. It does not implement any vendor's full business workflow. Per-vendor adapters are deferred to later passes.

## Migration

- File: `supabase/migrations/<timestamp>_integrations_backend_foundation.sql` (auto-named by Supabase)
- Tables created (all in `public` schema, RLS enabled, `GRANT`s in same migration):
  - `integration_catalog`
  - `integration_connections`
  - `integration_sync_runs`
  - `integration_webhook_events`
  - `integration_oauth_connections`
  - `external_identity_links`
  - `integration_events`
- `updated_at` trigger function: `public.tg_integrations_set_updated_at()` (sets `search_path = public`).

## RLS summary

| Table | Read | Write |
| --- | --- | --- |
| `integration_catalog` | any authenticated user (display metadata only) | `super_admin` / `admin` / `systems_admin` |
| `integration_connections` | admins only | admins only (no raw secrets stored) |
| `integration_sync_runs` | admins only | service role only |
| `integration_webhook_events` | admins only | service role only |
| `integration_oauth_connections` | own user **OR** admins | service role only |
| `external_identity_links` | admins only | service role only |
| `integration_events` | admins only | service role only |

`anon` is **not** granted on any of these tables. Service-role access (used by Edge Functions) bypasses RLS by design.

## Seeded integration_catalog ids

`centralreach`, `viventium`, `apploi`, `ms365`, `jivetel`, `ctm`, `retell`, `leadtrap`, `mailchimp`, `resend`, `google-ads`, `meta-ads`, `solum`, `eligipro`, `pandadoc`, `calendly`, `fathom`, `bloomgrowth`, `make` — **19 integrations**, all required IDs present.

## Edge Functions

- `supabase/functions/integration-test-connection/index.ts` — admin-only; returns structured `{ ok, status, message, details }`; checks required Supabase secret names per provider; performs a real Retell ping; returns `not_implemented` for providers without a probe (no fake success).
- `supabase/functions/integration-run-sync/index.ts` — admin-only; always inserts an `integration_sync_runs` row; delegates `retell` to existing `retell-sync` function; reports Resend as in-production (no rebuild); returns `not_implemented` for the rest.
- `supabase/functions/integration-webhook/index.ts` — generic provider receiver; signature verification when a secret is configured (CTM, LeadTrap, PandaDoc, Calendly, Make, Retell); writes raw envelope to `integration_webhook_events` and normalizes recognizable events into `integration_events`.
- `supabase/functions/microsoft-oauth-start/index.ts` — per-user OAuth start; requires authenticated user; builds Microsoft authorize URL with `offline_access`, `User.Read`, `Mail.ReadWrite`, `Calendars.ReadWrite`.
- `supabase/functions/microsoft-oauth-callback/index.ts` — exchanges code, probes `/me`, upserts `integration_oauth_connections` for the user; **does not persist raw tokens** (see "Microsoft per-user OAuth" below).

## Retell changes

- `supabase/functions/retell-sync/index.ts`
  - Removed hardcoded `AGENT_ID = 'agent_fb8aaca447d2a6c6703d40d77a'`. Agent id now reads from `RETELL_AGENT_ID` env or optional request body `agent_id`; if neither is set, no agent filter is applied.
  - `MAX_CALLS_PER_SYNC` is now configurable via `RETELL_MAX_CALLS_PER_SYNC` or request body `limit`.
  - Every invocation opens an `integration_sync_runs` row and closes it with `success` / `partial` / `failed` plus counts and error message.
  - Existing `phone_ai_calls` upsert + after-hours flow preserved.

## Resend preservation

- Existing functions untouched: `_shared/welcome-email.ts`, `admin-invite-user/index.ts`, `admin-resend-welcome-email/index.ts`, `admin-check-welcome-email/index.ts`, `email-mfa/index.ts`.
- `resend` added to both the seeded catalog and `BLOSSOM_INTEGRATIONS` so it appears as a first-class, "already in production" integration.
- `integration-run-sync` returns a report-only success for Resend rather than rebuilding email delivery.

## Microsoft per-user OAuth status

- Start / callback / metadata persistence: **implemented**.
- Raw access/refresh token persistence: **pending**. Tokens are exchanged in the callback but stored only as metadata (`token_persistence: "pending"`) plus connection status, scopes, expiry, and provider email. Reason: Lovable Cloud cannot create per-user Supabase secrets dynamically, and there is no existing per-user encryption pattern in this project. Pass 2 will choose between (a) a per-user encrypted token table with a project-level KMS-style secret or (b) re-running OAuth on demand.
- Connection status in `integration_oauth_connections` is honestly set to `connected` only after the Graph `/me` probe succeeds; otherwise the row remains in `pending`.

## Frontend wiring

- `src/lib/os/integrations/integrationRegistry.ts` — added `resend` (Email Delivery) and `make` (Automation Bridge); existing integrations preserved.
- `src/lib/os/integrations/backend.ts` — new file. Exposes `listIntegrationCatalog`, `listIntegrationConnections`, `listIntegrationSyncRuns`, `listIntegrationWebhookEvents`, `listUserOAuthConnections`, `testIntegrationConnection`, `runIntegrationSync`. Reads through the supabase client; mutations route through Edge Functions. **No raw secrets are read or returned to the browser.**
- `src/pages/admin/Integrations.tsx` — continues to render from `BLOSSOM_INTEGRATIONS.map(...)` for display metadata. Backend rows are surfaced through the new helper when present; UI degrades gracefully when backend tables are empty. Mock sync-timeline data inside the drawer is now labeled "Sample data — backend wiring in Pass 1" rather than presented as truth.

## Required Supabase secret names (reference)

`MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`, `RESEND_API_KEY`, `RETELL_API_KEY`, `RETELL_WEBHOOK_SECRET`, `RETELL_AGENT_ID`, `CTM_API_KEY`, `CTM_WEBHOOK_SECRET`, `APPLOI_API_KEY`, `CENTRALREACH_CLIENT_ID`, `CENTRALREACH_CLIENT_SECRET`, `CENTRALREACH_API_BASE_URL`, `SOLUM_API_KEY` (alias: `SOLOM_API_KEY`), `ELIGIPRO_API_KEY`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`, `MICROSOFT_REDIRECT_URI`, `JIVETEL_API_KEY`, `MAKE_WEBHOOK_SECRET`, `MAKE_OUTBOUND_WEBHOOK_URL`, `PANDADOC_API_KEY`, `PANDADOC_WEBHOOK_SECRET`, `LEADTRAP_WEBHOOK_SECRET`, `CALENDLY_CLIENT_ID`, `CALENDLY_CLIENT_SECRET`, `CALENDLY_WEBHOOK_SIGNING_KEY`.

## Search QA

- No raw API keys, OAuth client secrets, or service-role keys appear in frontend code (`src/`). Verified by grep: only `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` style references exist.
- No hardcoded Retell agent id remains in code (`rg "agent_fb8aaca447d2a6c6703d40d77a" src supabase/functions` returns 0 matches).
- Admin Integrations page no longer presents fabricated "all systems operational" rollups — backend status is shown when present, otherwise the registry status is shown with the registry as the labeled source.

## Tests

- `src/test/integrationsBackendFoundationPass1.test.ts` (new) asserts:
  - Registry contains all required integration ids, including new `resend` and `make`.
  - `BLOSSOM_INTEGRATIONS.map(` is still consumed by `src/pages/admin/Integrations.tsx`.
  - `src/lib/os/integrations/backend.ts` exists and references the new tables.
  - Edge function files exist for `integration-test-connection`, `integration-run-sync`, `integration-webhook`, `microsoft-oauth-start`, `microsoft-oauth-callback`.
  - Retell sync no longer hardcodes the historical agent id.
- Existing Sprint 05 integration backbone tests continue to pass.

## Build

- TypeScript: pass (no new errors introduced by Pass 1 changes).
- `npm run build`: pass (run by the Lovable harness on commit).

## Final status

**PASS** — schema, RLS, generic Edge Functions, Retell observability, Resend preservation, Microsoft per-user OAuth scaffolding, and admin page backend wiring are all in place. Per-vendor business logic deliberately deferred to Pass 2.