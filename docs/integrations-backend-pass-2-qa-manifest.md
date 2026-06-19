# Integrations Backend Pass 2 — Honest Admin Wiring, Outlook Tokens, Provider Readiness

## Files changed / added

### Database
- **New migration** (`supabase/migrations/<ts>_pass2_oauth_vault_and_seed.sql`):
  - Creates `public.integration_oauth_token_vault` (service-role only).
  - Seeds one production `integration_connections` row per required vendor
    with the canonical secret names. No secret *values* are stored.

### Edge Functions
- `supabase/functions/_shared/oauthTokenCrypto.ts` — AES-GCM encrypt/decrypt
  helpers keyed off `OAUTH_TOKEN_ENCRYPTION_KEY`.
- `supabase/functions/microsoft-oauth-callback/index.ts` — now encrypts access
  + refresh tokens, writes them to `integration_oauth_token_vault`, and only
  marks the connection `connected` when the vault write succeeds. If the
  encryption key is missing or the vault write fails, the connection is left
  in `needs_attention` and tokens are NOT persisted.
- `supabase/functions/microsoft-refresh-token/index.ts` (new) — decrypts the
  stored refresh token server-side, exchanges it with Microsoft, re-encrypts,
  updates the vault + connection rows. Never returns raw tokens.
- `supabase/functions/microsoft-graph-probe/index.ts` (new) — authenticated
  user proof-of-life: decrypts access token, refreshes if expired, calls
  Graph `/me`, returns only safe metadata (provider email, name, scopes,
  expiry, status).
- `supabase/functions/integration-webhook/index.ts` — hardened: requires an
  integration id, validates it against `integration_catalog`, returns 400 on
  unknown ids, returns 401 on signature failure, never normalizes a failed
  event into `integration_events`, records `processing_status='rejected'` for
  failed signatures, no `Authorization`/`Cookie`/`apikey` headers stored,
  includes `details.requiresSecret` in responses.
- `supabase/functions/integration-test-connection/index.ts` — admin-only,
  performs real probes for `retell`, `resend`, `mailchimp`; reports
  `configured` for `ms365` (per-user test via Graph probe); updates the
  matching `integration_connections` row with `last_tested_at`,
  `last_success_at`, `last_error_at`, `last_error`, `status`. Accepts
  `SOLOM_API_KEY` as alias for `SOLUM_API_KEY`.
- `supabase/functions/retell-webhook/index.ts` — replaced the invalid
  `npm:@supabase/supabase-js@2/cors` import with a local `corsHeaders`
  constant. No agent id is hardcoded.

### Frontend
- `src/pages/admin/Integrations.tsx` — now overlays real backend state from
  `integration_catalog`, `integration_connections`, `integration_sync_runs`,
  `integration_webhook_events`, `integration_oauth_connections` using
  helpers from `src/lib/os/integrations/backend.ts`. Fake health stats
  ("All systems operational", "118 background jobs", "2.3k/hr webhook
  activity", "42% API usage", "Last full sync · 4 min ago") removed. Retell
  drawer now generates the function URL from `VITE_SUPABASE_URL` and offers
  both the dedicated and the generic webhook endpoints. Hardcoded
  `agent_fb8aaca447d2a6c6703d40d77a` removed. Test connection and Run sync
  buttons wired to the corresponding edge functions with toast feedback.
- `src/lib/os/integrations/backend.ts` — added `probeOutlookConnection` and
  `startOutlookOAuth` helpers.
- `src/components/profile/OutlookConnectionCard.tsx` (new) — per-user surface
  for connecting and testing Outlook. Rendered in `SettingsSection` (Profile
  → Settings tab).

### Tests
- `src/test/integrationsBackendPass2.test.ts` (new) — guards against the
  exact regressions found in the audit (hardcoded Retell agent, hardcoded
  Supabase URL, fake static health stats, missing backend helper usage,
  vault migration, callback writes to the vault, generic webhook rejects
  unknown integrations and 401s on signature failures, retell-webhook uses
  local cors).

## Outlook token vault design

- **Table**: `public.integration_oauth_token_vault`
- **Columns**: `oauth_connection_id`, `integration_id`, `user_id`,
  `provider_user_id`, `access_token_ciphertext`, `refresh_token_ciphertext`,
  `token_type`, `scopes`, `expires_at`, `last_refresh_at`, `key_version`,
  `metadata`.
- **Encryption**: AES-GCM with a key derived (SHA-256) from
  `OAUTH_TOKEN_ENCRYPTION_KEY`. Each ciphertext is a JSON envelope with the
  IV + version stamp so the key can be rotated.
- **Required secret**: `OAUTH_TOKEN_ENCRYPTION_KEY` (24+ random bytes,
  base64 or raw). If unset, the callback marks the connection
  `needs_attention` and does NOT persist tokens.

## RLS summary

| Table                                | anon | authenticated | service_role |
|--------------------------------------|------|---------------|--------------|
| `integration_oauth_token_vault`      | ❌   | ❌            | ✅           |
| `integration_catalog`                | ❌   | read          | full         |
| `integration_connections`            | ❌   | read (admin)  | full         |
| `integration_sync_runs`              | ❌   | read (admin)  | full         |
| `integration_webhook_events`         | ❌   | read (admin)  | full         |
| `integration_oauth_connections`      | ❌   | read own row  | full         |

A deny-by-default RLS policy `vault_no_client_access` is added to the vault
as a belt-and-braces protection on top of the missing GRANTs.

## Webhook verification behavior

- Unknown `integration` → HTTP 400 (`Unknown integration`).
- No secret configured → `verification_status='unverified'`, event stored,
  response includes `details.requiresSecret: false`. Event spine row IS
  written (provider is in setup phase).
- Secret configured + signature mismatch → `verification_status='failed'`,
  `processing_status='rejected'`, **no** row in `integration_events`,
  HTTP 401.
- Secret configured + signature matches → `verification_status='verified'`,
  event spine row is written.
- Sensitive headers (`Authorization`, `Cookie`, `apikey`) are stripped before
  persistence.

## What is live now

- Admin Integrations reads real backend tables and shows honest status,
  connection counts, recent sync runs, recent webhook events, and OAuth
  user counts.
- Retell drawer is no longer locked to one agent ID or one project URL.
- Outlook OAuth round-trip is implementable end-to-end once the
  `MICROSOFT_*` + `OAUTH_TOKEN_ENCRYPTION_KEY` secrets are added.
- Each user can connect their Outlook from Profile → Settings.
- Generic webhook ingest validates integration ids and rejects bad
  signatures without polluting the event spine.
- Resend / Mailchimp / Retell test-connection probes are real.

## What is intentionally NOT implemented yet

- Provider-specific sync adapters beyond Retell (most providers report
  `configured_pending_probe` or `not_implemented` until Pass 3+).
- Outlook mail/calendar UI surfaces — only connection proof exists.
- Per-provider event normalization beyond the generic spine.
- Marketplace dialog still shows placeholder catalog items (not in scope).

## Build / test status

- TypeScript build runs in Lovable automatically after edits.
- `src/test/integrationsBackendPass2.test.ts` covers each acceptance
  criterion listed in the prompt.
- `src/test/integrationsBackendFoundationPass1.test.ts` continues to pass;
  Pass 2's source-wide scan supersedes its narrower Retell-sync scan.