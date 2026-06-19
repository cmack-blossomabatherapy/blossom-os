# Integrations Backend Pass 3 — QA Manifest

## Audit findings fixed

1. **Go Integrate Nava** is now a first-class required integration: present in `BLOSSOM_INTEGRATIONS`, seeded into `integration_catalog`, seeded into `integration_connections` (planned/not_configured), and tracked by `integration-test-connection` with placeholder secret names `GO_INTEGRATE_NAVA_API_KEY` and `GO_INTEGRATE_NAVA_WEBHOOK_SECRET`.
2. **Microsoft OAuth state** is no longer a base64 JSON blob carrying the user id. We generate a 32-byte random nonce, store only its SHA-256 hash in `integration_oauth_states`, and validate that row on callback.
3. **Microsoft callback** now requires token exchange + Graph `/me` + encrypted vault write to all succeed before status flips to `connected`. Any earlier failure sets `needs_attention` with a safe `last_error` and stores no tokens.
4. **No Edge Function imports another Edge Function entrypoint.** Shared Microsoft token refresh + OAuth state helpers live in `supabase/functions/_shared/microsoftTokenVault.ts`. `microsoft-refresh-token` and `microsoft-graph-probe` both import the shared module and own their own `Deno.serve(...)`.
5. **`integration_connections` seed idempotency**: a unique index `(integration_id, connection_type, environment)` was added (after deduping any duplicates), and the seed upsert now uses `ON CONFLICT (integration_id, connection_type, environment) DO UPDATE`.
6. **Required secret map** in `integration-test-connection` now covers every integration Blossom OS tracks (mailchimp, resend, retell, ctm, apploi, centralreach, solum/solom alias, eligipro, ms365, jivetel, make, pandadoc, leadtrap, calendly, viventium, google-ads, meta-ads, fathom, bloomgrowth, go-integrate-nava). Providers without a real probe yet honestly report `configured_pending_probe` or `not_configured`; we never return fake `connected`.

## Files changed

- `src/lib/os/integrations/types.ts` — adds `"not_configured"` to `IntegrationStatus`.
- `src/lib/os/integrations/integrationRegistry.ts` — adds `go-integrate-nava` entry.
- `supabase/functions/_shared/microsoftTokenVault.ts` — new shared module: `refreshUserToken`, `hashOauthState`, `generateOauthStateNonce`.
- `supabase/functions/microsoft-refresh-token/index.ts` — slimmed; imports shared helper.
- `supabase/functions/microsoft-graph-probe/index.ts` — imports shared helper (no longer imports `microsoft-refresh-token/index.ts`).
- `supabase/functions/microsoft-oauth-start/index.ts` — random nonce + hashed state row.
- `supabase/functions/microsoft-oauth-callback/index.ts` — server-side state validation; Graph `/me` is mandatory; status flips to `connected` only after vault write.
- `supabase/functions/integration-test-connection/index.ts` — required-secret map for every tracked integration.
- `src/test/integrationsBackendPass3.test.ts` — new tests covering all items above.
- `docs/integrations-backend-pass-3-qa-manifest.md` — this file.
- `docs/integrations-backend-foundation-qa-manifest.md` — masked stale Retell agent literal so scans don't false-positive.
- `docs/integrations-backend-pass-2-qa-manifest.md` — same masking.

## Migration

- `20260619_pass3_oauth_states_and_seed_idempotency.sql` (single approved migration):
  - Inserts `go-integrate-nava` row into `integration_catalog`.
  - Dedupes `integration_connections` by `(integration_id, connection_type, environment)`.
  - Adds `UNIQUE INDEX uq_integration_connections_natural`.
  - Upserts all required connection rows including `go-integrate-nava`.
  - Creates `integration_oauth_states` with RLS + deny-all client policy + `service_role` grants.

## RLS — `integration_oauth_states`

- RLS enabled.
- No grants to `anon` or `authenticated`.
- Explicit deny policy (`USING (false) WITH CHECK (false)`) for `anon` and `authenticated`.
- `service_role` has full access; all writes happen from Edge Functions using the service-role client.
- Only a SHA-256 hash of the OAuth state nonce is stored — the raw value never lives in the database.
- Rows expire after 10 minutes and are single-use (`used_at` is set on callback).

## OAuth state lifecycle

1. **Generate** — `microsoft-oauth-start` calls `generateOauthStateNonce(32)` and `hashOauthState(nonce)`.
2. **Store** — inserts `{ integration_id: 'ms365', user_id, state_hash, expires_at: now+10m }`.
3. **Send** — the raw nonce is sent to Microsoft as `state`.
4. **Validate** — `microsoft-oauth-callback` re-hashes the returned state, looks up the row, and rejects when missing/expired/already-used.
5. **Consume** — sets `used_at = now()` so the state cannot be replayed.
6. **Trust** — the authenticated `user_id` comes from the validated row, never from the browser redirect.

## Graph `/me` gating

`microsoft-oauth-callback` flow:

1. Validate state row.
2. Exchange code for tokens; on failure → `needs_attention`, no vault write.
3. Call Graph `/me`; non-2xx → `needs_attention` with `graph_me_failed:<status>`, no vault write.
4. Encrypt tokens.
5. Upsert `integration_oauth_connections` as `pending`.
6. Upsert encrypted ciphertext into `integration_oauth_token_vault`.
7. Only now flip `integration_oauth_connections.status` → `connected`.

## Shared module pattern

`supabase/functions/_shared/microsoftTokenVault.ts` is the only place that knows how to refresh and re-encrypt Microsoft tokens. Both Edge Functions import from `_shared/...`, never from `../<other-function>/index.ts`. A test asserts this for every `functions/*/index.ts`.

## Build / test

- `npm run build` — passes (TypeScript compiles, no errors).
- `vitest src/test/integrationsBackendFoundationPass1.test.ts` — passes (unchanged).
- `vitest src/test/integrationsBackendPass2.test.ts` — passes (unchanged).
- `vitest src/test/integrationsBackendPass3.test.ts` — passes (new).

## Intentional remaining limitations

- Deep provider probes are still only implemented for Retell, Resend, Mailchimp, and the MS365 config check. Every other integration honestly reports `configured_pending_probe` after secrets are present.
- Go Integrate Nava has no API workflow yet — only catalog + connection row + secret placeholders. To be activated when vendor docs are confirmed.
- The encrypted token vault still relies on `OAUTH_TOKEN_ENCRYPTION_KEY`; rotating it requires a future re-encryption migration.