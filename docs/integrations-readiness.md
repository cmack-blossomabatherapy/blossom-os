# Blossom OS — Integrations Readiness Matrix

Slice 4 (revised) — corrections from independent audit. Single source of
truth for every active and retired provider adapter. Mirrors:

- `supabase/functions/_shared/integrations/providerRegistry.ts` (adapter contracts)
- `src/lib/os/integrations/readinessManifest.ts` (browser-safe mirror + parity test)
- `src/pages/admin/IntegrationsReadiness.tsx` (Super Admin UI)

**Invariants enforced across every adapter** (see `src/test/providerAdapterAudit.test.ts` and `providerReadinessManifest.test.ts`):

- INGEST_ONLY: no writebacks to third-party systems.
- No notifications, no automations, no programmatically created webhook subscriptions.
- Sync from the UI is hardcoded `dryRun: true` (`IntegrationsReadiness.tsx`).
- Only credential *names* appear anywhere — never values.
- CTM live sync path is preserved (`ctm-webhook`, `ctm-test-connection`, `ctm-historical-import`).
- Training Academy, Reports, and Resource Library are not modified.
- Resend keeps `outboundDisabled: false` intentionally for transactional email already shipped; no *new* outbound is added.

## Readiness labels

| Label | Meaning |
| --- | --- |
| Connected | Credentials present, probe succeeded, ingest running. |
| Ingest-only | Read-only pull/webhook path is live; no outbound. |
| Ready to configure | Adapter shipped; credentials not yet supplied. |
| Needs credentials | Required secret names known to be missing (or credential/approval blocker). |
| Needs vendor docs | Vendor endpoint/auth contract not published; adapter reports honestly instead of faking success. |
| Manual local | Desktop-only integration; no cloud probe applies. |
| Retired | Removed from active registry; kept for history only. |

## Active provider matrix

| Provider | Purpose / Owner | Docs | Source of truth | Capabilities (probe/pullSync/webhook/oauth) | Required secrets | Optional secrets | Read-only ops | Webhook verification | Readiness | Blocker | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CentralReach (Enhanced API) | Clinical EMR / billing — Clinical Ops | https://centralreach.com/resources/api/requests/ (Enhanced API base: https://partners-api.centralreach.com/enterprise/v1/) | CentralReach tenant | Y/Y/N/N (client-credentials) | CENTRALREACH_CLIENT_ID, CENTRALREACH_CLIENT_SECRET, CENTRALREACH_API_BASE_URL | CENTRALREACH_TOKEN_URL, CENTRALREACH_PROBE_PATH, CENTRALREACH_SCOPE | Token exchange probe, paged clients/staff/sessions read | n/a | Needs credentials | Awaiting Enhanced API client credentials | Add CENTRALREACH_* secrets, then Test Connection |
| CTM (CallTrackingMetrics) | Inbound call tracking — Growth/Intake | https://developers.calltrackingmetrics.com/ | CTM account | Y/Y/Y/N | CTM_API_KEY, CTM_WEBHOOK_SECRET | CTM_API_BASE_URL, CTM_ACCOUNT_ID, CTM_PROBE_PATH | Historical import, live webhook ingest, unknown-caller review | HMAC via `CTM_WEBHOOK_SECRET` | Ingest-only (live) | None — production live | Monitor `ctm_operations` panel |
| Viventium | HRIS / payroll — HR | https://www.viventium.com/ | Viventium tenant | Y/Y/N/N | VIVENTIUM_USERNAME, VIVENTIUM_PASSWORD, VIVENTIUM_COMPANY_CODE, VIVENTIUM_DIVISION_CODE | VIVENTIUM_BASE_URL | Employee roster paged read | n/a | Ingest-only (live) | None | Monitor daily sync |
| Apploi | Recruiting ATS — Recruiting | https://integrate.apploi.com/ | Apploi tenant | Y/Y/Y/N | APPLOI_API_KEY | APPLOI_API_BASE_URL, APPLOI_PROBE_PATH, APPLOI_CANDIDATES_PATH | Paged candidates read via `X-Api-Key` | Vendor-signed webhook (shared secret) | Needs credentials | API key not yet issued | Add APPLOI_API_KEY, then Test Connection |
| Microsoft 365 (Graph) | Mail / calendar — per-user | https://learn.microsoft.com/graph/api/overview | User mailbox | Y/Y/N/Y | MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID, MICROSOFT_REDIRECT_URI, OAUTH_TOKEN_ENCRYPTION_KEY | — | Per-user OAuth, delta-paged mail/events | n/a | Ready to configure | Tenant admin consent required | Complete tenant admin consent, then per-user connect |
| Calendly | Scheduling — Intake | https://developer.calendly.com/api-docs/ | Calendly org | Y/Y/Y/Y | CALENDLY_CLIENT_ID, CALENDLY_CLIENT_SECRET, CALENDLY_WEBHOOK_SIGNING_KEY | CALENDLY_ACCESS_TOKEN, CALENDLY_API_BASE_URL, CALENDLY_PROBE_PATH, CALENDLY_ORGANIZATION_URI | Paged events read | HMAC-SHA256 `Calendly-Webhook-Signature` (t=, v1=) | Needs credentials | Webhook subscription must be created in Calendly UI | Add CALENDLY_* secrets; create subscription in Calendly dashboard |
| Jotform | Forms / intake / documents — Intake / Onboarding | https://api.jotform.com/docs/ | Jotform account | Y/Y/Y/N | JOTFORM_API_KEY, JOTFORM_API_BASE_URL, JOTFORM_WEBHOOK_TOKEN | JOTFORM_FORM_IDS, JOTFORM_FORM_PURPOSES_JSON, JOTFORM_FIELD_MAP_JSON | Paged submissions read; idempotent staging (`jotform:<formId>:<submissionID>`) | Constant-time token compare on `?token=<JOTFORM_WEBHOOK_TOKEN>` (also `x-jotform-token` / `x-webhook-token` header) | Ready to configure | Live form IDs + webhook URL pasted into Jotform | Add secrets + form IDs, then run pullSync `dryRun` |
| Mailchimp | Email marketing — Marketing | https://mailchimp.com/developer/marketing/api/ | Mailchimp account | Y/Y/Y/N | MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX | — | Paged audiences/campaigns read | HMAC via signing secret (vendor UI) | Needs credentials | — | Add MAILCHIMP_* secrets |
| Resend | Transactional email (preserved) — Ops | https://resend.com/docs/api-reference/introduction | Resend account | Y/N/Y/N | RESEND_API_KEY | RESEND_WEBHOOK_SIGNING_SECRET | Health probe, delivery-event webhook | Svix (`svix-id`, `svix-timestamp`, `svix-signature`) | Connected (existing) | — | No action; report-only |
| Retell AI | AI voice — Growth | https://docs.retellai.com/ | Retell account | Y/Y/Y/N | RETELL_API_KEY | RETELL_WEBHOOK_SECRET | Paged agents/calls read | HMAC signature | Ingest-only (live) | — | Monitor |
| Jivetel / NetSapiens | Phone system CDR — Ops | https://docs.netsapiens.com/ | Jivetel tenant | Y/N/Y/N | JIVETEL_API_KEY | JIVETEL_API_BASE_URL, JIVETEL_PROBE_PATH | Probe only; CDR delivered via webhook | Vendor-signed webhook | Needs credentials | Vendor to enable API tenant | Add JIVETEL_API_KEY once vendor provisions |
| Solom / Solum (VOB) | Eligibility / VOB — Auth team | https://solumhealth.com/ | Solum tenant | Y/N/Y/N | SOLUM_API_KEY | SOLUM_API_BASE_URL, SOLUM_PROBE_PATH, SOLOM_API_KEY | Probe only until docs published | Vendor-signed webhook | Needs vendor docs | Vendor API contract not published | Obtain endpoint + auth docs from Solum |
| Eligipro | Eligibility — Auth team | https://www.eligipro.com/ | Eligipro tenant | Y/N/Y/N | ELIGIPRO_API_KEY | ELIGIPRO_API_BASE_URL, ELIGIPRO_PROBE_PATH | Probe only | Vendor-signed webhook | Needs vendor docs | Vendor API contract not published | Obtain endpoint + auth docs from Eligipro |
| Bloom Growth (L10) | Operations meetings / scorecards — Leadership | https://help.bloomgrowth.com/en/all-about-the-bloom-growth-api (Swagger: https://app.bloomgrowth.com/swagger/index.html) | Bloom Growth org | Y/Y/N/N | BLOOMGROWTH_ACCESS_TOKEN | BLOOMGROWTH_API_KEY (legacy alias), BLOOMGROWTH_ORG_ID, BLOOMGROWTH_API_BASE_URL | Bearer probe against `GET /api/v1/scorecard/items/`; paged scorecard read | n/a | Needs credentials | Operator must mint access token via `POST https://app.bloomgrowth.com/token` (Blossom does **not** perform password-grant) | Paste token into `BLOOMGROWTH_ACCESS_TOKEN`, then Test Connection |
| Google Ads | Marketing spend / conversions — Marketing | https://developers.google.com/google-ads/api/docs/start | Google Ads MCC | Y/Y/N/Y | GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN | GOOGLE_ADS_LOGIN_CUSTOMER_ID, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_ACCESS_LEVEL | GAQL paged report read (adapter refuses to claim `connected` until a real read succeeds) | n/a | Needs credentials | Developer-token basic/standard approval + refresh token (credential/approval blocker, not docs) | Apply for basic access; then add all `GOOGLE_ADS_*` secrets |
| Meta Ads | Marketing spend / conversions — Marketing | https://developers.facebook.com/docs/marketing-api/ | Meta ad account | Y/Y/N/Y | META_ADS_ACCESS_TOKEN, META_ADS_AD_ACCOUNT_ID | META_ADS_API_VERSION | Paged insights read | n/a | Needs credentials | System-user long-lived token pending | Generate system-user token, add secrets |
| Fathom AI | Meeting intelligence (meetings + inline summaries + inline action items) — Leadership / Operations | https://developers.fathom.ai/ (base https://api.fathom.ai/external/v1) | Fathom workspace | Y/Y/N/N | FATHOM_API_KEY | — | Probe `GET /meetings?limit=1`; cursor-paginated read of `GET /meetings?limit=…&include_summary=true&include_action_items=true&include_transcript=false` (dry-run reads exactly one page; non-dry-run follows `response.next_cursor` up to a bounded page cap with an inter-page delay). No separate `/summaries` or `/action-items` endpoints exist. Transcripts are never requested. Normalization is not yet persisted. | webhook = false — shared inbound handler does not yet verify Fathom's documented signature; setup gap is external, not code-side | Needs credentials | API key not yet issued | Provide `FATHOM_API_KEY` via `X-Api-Key` header |
| Make.com (bridge) | Migration automation bridge — Ops | https://www.make.com/en/api-documentation | Make scenario | Y/N/Y/N | MAKE_WEBHOOK_SECRET, MAKE_OUTBOUND_WEBHOOK_URL | — | Inbound webhook receipt (bridge), dry-run ping | Bearer `MAKE_WEBHOOK_SECRET` | Ready to configure | Temporary during migration only | Retire once native adapters cover all flows |
| Go Integrator Nava | Desktop CTI screen-pop — Front-desk | https://help.nava.gointegrator.com/help?item=2505&lang=us&version=4.2 | Local workstation | N/N/N/N (localOnly) | — | — | n/a — installer only | n/a | Manual local | Requires per-workstation install | Ship desktop install guide to admins |

## Retired providers

| Provider | Retired reason | Replaced by |
| --- | --- | --- |
| LeadTrap | Replaced by Jotform for forms/intake/documents. History kept in `integration_events` for audit. | Jotform |
| PandaDoc | Replaced by Jotform for e-sign / document capture at intake. History kept for audit. | Jotform |

## Jotform migration notes (aligned to code)

- **Purpose module:** `supabase/functions/_shared/integrations/jotformPurpose.ts` (imported by both the Deno adapter and the Node/vitest suite).
- **Canonical purposes:** `intake`, `recruiting`, `hr`, `clinical_document`.
- **Legacy aliases (still accepted):**
  - `lead`, `inquiry`, `form_submission` → `intake`
  - `candidate`, `applicant` → `recruiting`
  - `employee`, `hr_document` → `hr`
  - `document`, `clinical`, `assessment` → `clinical_document`
- **Record-kind mapping:** `intake` → `lead`; `recruiting` → `candidate`; `clinical_document` and `hr` → `document`; unknown → `unknown`.
- **Field map direction:** `JOTFORM_FIELD_MAP_JSON` is `{ canonicalName: "jotform question name or text" }` — canonical name is the KEY, the Jotform field identifier is the VALUE. `flattenAnswers` keys Jotform answers by question `name` (fallback `text`) so the adapter can then look up canonical fields via this map.
- **Idempotency:** submissions stage on the deterministic key `jotform:<formId>:<submissionID>` so replays never double-post.
- **Webhook URL:** `POST https://<edge-host>/integration-webhook?integration=jotform&token=<JOTFORM_WEBHOOK_TOKEN>` — the handler in `supabase/functions/integration-webhook/index.ts` reads the integration id from the query string (`?integration=`) and calls `verifyJotformToken` against the `token` query param (fallback headers: `x-jotform-token`, `x-webhook-token`). A missing/wrong token is rejected with 401.
- **PHI region:** `JOTFORM_API_BASE_URL` must be one of `https://api.jotform.com`, `https://eu-api.jotform.com`, `https://hipaa-api.jotform.com` — the HIPAA endpoint is required when PHI is captured. No silent fallback.
- **LeadTrap / PandaDoc** rows in `integrations` are disabled but preserved for audit history.

## Outbound / secrets audit

Enforced by `src/test/providerAdapterAudit.test.ts` + `providerReadinessManifest.test.ts`:

- All adapters except `resend` (preserved transactional) and `make` (migration bridge, dry-run only) declare `outboundDisabled: true`.
- No adapter creates webhook subscriptions programmatically — subscriptions are established in the vendor UI by an admin.
- No adapter emits notifications, calendar invites, or CRM writebacks.
- The Sync button in `IntegrationsReadiness.tsx` invokes pullSync with `dryRun: true`, and is only rendered when `capabilities.pullSync === true`.
- Manifest carries only secret *names*. `IntegrationsReadiness.tsx` renders names, not values. `fetch_secrets` is never called from the readiness UI.
- Fathom adapter reads only the documented `GET /meetings` endpoint with `include_summary=true` and `include_action_items=true`; `include_transcript` is always false/omitted. It does not call any `/summaries` or `/action-items` endpoints (those do not exist in the Fathom AI External API). Normalized records are not persisted yet — only the pull/normalization scaffold runs.
- Bloom Growth adapter does not implement password-grant token exchange; the operator supplies a bearer access token server-side.

## Recommended rollout order

1. **CentralReach Enhanced API** — largest downstream dependency (reports, RBT/BCBA lifecycle).
2. **Jotform** — unblocks intake + onboarding flows previously on LeadTrap/PandaDoc.
3. **Calendly** — closes intake scheduling loop with signature-verified webhook.
4. **Apploi** — recruiting pipeline visibility.
5. **Microsoft 365 Graph** — per-user mail/calendar; requires tenant admin consent.
6. **Bloom Growth** — bearer token from operator; leadership scorecards.
7. **Fathom AI** — meeting summaries + action items for leadership.
8. **Mailchimp / Meta Ads** — marketing rollup.
9. **Google Ads** — waits on developer-token basic-access approval.
10. **Jivetel** — waits on vendor tenant enablement.
11. **Solum, Eligipro** — waits on vendor API documentation.
12. **Go Integrator Nava** — desktop rollout after CentralReach + Jivetel land.
13. Retire **Make.com bridge** once every flow above is native.

## External-setup checklist (owner action required)

- [ ] CentralReach: request Enhanced API client credentials; provide `CENTRALREACH_CLIENT_ID`, `CLIENT_SECRET`, `API_BASE_URL` (base `https://partners-api.centralreach.com/enterprise/v1/`).
- [ ] Jotform: paste `https://<edge-host>/integration-webhook?integration=jotform&token=<JOTFORM_WEBHOOK_TOKEN>` into each form's webhook settings; provide `JOTFORM_API_KEY`, `JOTFORM_API_BASE_URL` (HIPAA if PHI), `JOTFORM_WEBHOOK_TOKEN`, `JOTFORM_FORM_IDS`.
- [ ] Calendly: create org webhook subscription; supply OAuth client + `CALENDLY_WEBHOOK_SIGNING_KEY`.
- [ ] Apploi: supply `APPLOI_API_KEY` (see https://integrate.apploi.com/).
- [ ] Microsoft 365: tenant admin consent + `MICROSOFT_*` secrets.
- [ ] Bloom Growth: mint access token via `POST https://app.bloomgrowth.com/token`; paste into `BLOOMGROWTH_ACCESS_TOKEN`.
- [ ] Fathom AI: provide `FATHOM_API_KEY` (used as `X-Api-Key` against `https://api.fathom.ai/external/v1`).
- [ ] Mailchimp: provide API key + server prefix.
- [ ] Google Ads: submit basic/standard developer-token application (credential/approval blocker, not docs); then supply OAuth refresh token + customer IDs.
- [ ] Meta Ads: issue long-lived system-user token; provide `META_ADS_ACCESS_TOKEN`, `META_ADS_AD_ACCOUNT_ID`.
- [ ] Jivetel: vendor to enable API tenant; provide `JIVETEL_API_KEY`.
- [ ] Solum / Eligipro: obtain endpoint + auth documentation before adapters can leave `vendor_docs_required`.
- [ ] Go Nava: distribute desktop installer + config to front-desk workstations.
