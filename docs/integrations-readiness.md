# Blossom OS — Integrations Readiness Matrix

Slice 4 of the integration-readiness pass. Single source of truth for every
active and retired provider adapter. Mirrors:

- `supabase/functions/_shared/integrations/providerRegistry.ts` (adapter contracts)
- `src/lib/os/integrations/readinessManifest.ts` (browser-safe mirror + parity test)
- `src/pages/admin/IntegrationsReadiness.tsx` (Super Admin UI)

**Invariants enforced across every adapter** (see `src/test/providerAdapterAudit.test.ts` and `providerReadinessManifest.test.ts`):

- INGEST_ONLY: no writebacks to third-party systems.
- No notifications, no automations, no auto-created webhook subscriptions.
- Sync from the UI is hardcoded `dryRun: true` (`IntegrationsReadiness.tsx`).
- Only credential *names* appear anywhere — never values.
- CTM live sync path is preserved (`ctm-webhook`, `ctm-test-connection`, `ctm-historical-import`).
- Training Academy, Reports, and Resource Library are not modified in this slice.
- Resend keeps `outboundDisabled: false` intentionally for transactional email already shipped; no *new* outbound is added by this pass.

## Readiness labels

| Label | Meaning |
| --- | --- |
| Connected | Credentials present, probe succeeded, ingest running. |
| Ingest-only | Read-only pull/webhook path is live; no outbound. |
| Ready to configure | Adapter shipped; credentials not yet supplied. |
| Needs credentials | Required secret names known to be missing. |
| Needs vendor docs | Vendor endpoint/auth contract not published; adapter reports honestly instead of faking success. |
| Manual local | Desktop-only integration; no cloud probe applies. |
| Retired | Removed from active registry; kept for history only. |

## Active provider matrix

| Provider | Purpose / Owner | Docs | Source of truth | Capabilities (probe/pullSync/webhook/oauth) | Required secrets | Optional secrets | Read-only ops | Webhook verification | Readiness | Blocker | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CentralReach (Enhanced API) | Clinical EMR / billing — Clinical Ops | https://developers.centralreach.com/ | CentralReach tenant | Y/Y/N/N (client-credentials) | CENTRALREACH_CLIENT_ID, CENTRALREACH_CLIENT_SECRET, CENTRALREACH_API_BASE_URL | CENTRALREACH_TOKEN_URL, CENTRALREACH_PROBE_PATH, CENTRALREACH_SCOPE | Token exchange probe, paged clients/staff/sessions read | n/a | Needs credentials | Awaiting Enhanced API client credentials | Add CENTRALREACH_* secrets, then Test Connection |
| CTM (CallTrackingMetrics) | Inbound call tracking — Growth/Intake | https://developers.calltrackingmetrics.com/ | CTM account | Y/Y/Y/N | CTM_API_KEY, CTM_WEBHOOK_SECRET | CTM_API_BASE_URL, CTM_ACCOUNT_ID, CTM_PROBE_PATH | Historical import, live webhook ingest, unknown-caller review | HMAC via `CTM_WEBHOOK_SECRET` | Ingest-only (live) | None — production live | Monitor `ctm_operations` panel |
| Viventium | HRIS / payroll — HR | https://www.viventium.com/ | Viventium tenant | Y/Y/N/N | VIVENTIUM_USERNAME, VIVENTIUM_PASSWORD, VIVENTIUM_COMPANY_CODE, VIVENTIUM_DIVISION_CODE | VIVENTIUM_BASE_URL | Employee roster paged read | n/a | Ingest-only (live) | None | Monitor daily sync |
| Apploi | Recruiting ATS — Recruiting | https://developers.apploi.com/ | Apploi tenant | Y/Y/Y/N | APPLOI_API_KEY | APPLOI_API_BASE_URL, APPLOI_PROBE_PATH, APPLOI_CANDIDATES_PATH | Paged candidates read via `X-Api-Key` | Vendor-signed webhook (shared secret) | Needs credentials | API key not yet issued | Add APPLOI_API_KEY, then Test Connection |
| Microsoft 365 (Graph) | Mail / calendar — per-user | https://learn.microsoft.com/graph/api/overview | User mailbox | Y/Y/N/Y | MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID, MICROSOFT_REDIRECT_URI, OAUTH_TOKEN_ENCRYPTION_KEY | — | Per-user OAuth, delta-paged mail/events | n/a | Ready to configure | Tenant admin consent required | Complete tenant admin consent, then per-user connect |
| Calendly | Scheduling — Intake | https://developer.calendly.com/api-docs/ | Calendly org | Y/Y/Y/Y | CALENDLY_CLIENT_ID, CALENDLY_CLIENT_SECRET, CALENDLY_WEBHOOK_SIGNING_KEY | CALENDLY_ACCESS_TOKEN, CALENDLY_API_BASE_URL, CALENDLY_PROBE_PATH, CALENDLY_ORGANIZATION_URI | Paged events read | HMAC-SHA256 `Calendly-Webhook-Signature` (t=, v1=) | Needs credentials | Webhook subscription must be created in Calendly UI | Add CALENDLY_* secrets; create subscription in Calendly dashboard |
| Jotform | Forms / intake / documents — Intake / Onboarding | https://api.jotform.com/docs/ | Jotform account | Y/Y/Y/N | JOTFORM_API_KEY, JOTFORM_API_BASE_URL, JOTFORM_WEBHOOK_TOKEN | JOTFORM_FORM_IDS, JOTFORM_FORM_PURPOSES_JSON, JOTFORM_FIELD_MAP_JSON | Paged submissions read; idempotent staging (`jotform:<formId>:<submissionID>`) | Bearer `JOTFORM_WEBHOOK_TOKEN` on `integration-webhook` | Ready to configure | Live form IDs + webhook URL pasted into Jotform | Add secrets + form IDs, then run pullSync `dryRun` |
| Mailchimp | Email marketing — Marketing | https://mailchimp.com/developer/marketing/api/ | Mailchimp account | Y/Y/Y/N | MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX | — | Paged audiences/campaigns read | HMAC via signing secret (vendor UI) | Needs credentials | — | Add MAILCHIMP_* secrets |
| Resend | Transactional email (preserved) — Ops | https://resend.com/docs/api-reference/introduction | Resend account | Y/N/Y/N | RESEND_API_KEY | RESEND_WEBHOOK_SIGNING_SECRET | Health probe, delivery-event webhook | Svix (`svix-id`, `svix-timestamp`, `svix-signature`) | Connected (existing) | — | No action; report-only |
| Retell AI | AI voice — Growth | https://docs.retellai.com/ | Retell account | Y/Y/Y/N | RETELL_API_KEY | RETELL_WEBHOOK_SECRET | Paged agents/calls read | HMAC signature | Ingest-only (live) | — | Monitor |
| Jivetel / NetSapiens | Phone system CDR — Ops | https://docs.netsapiens.com/ | Jivetel tenant | Y/N/Y/N | JIVETEL_API_KEY | JIVETEL_API_BASE_URL, JIVETEL_PROBE_PATH | Probe only; CDR delivered via webhook | Vendor-signed webhook | Needs credentials | Vendor to enable API tenant | Add JIVETEL_API_KEY once vendor provisions |
| Solom / Solum (VOB) | Eligibility / VOB — Auth team | https://solumhealth.com/ | Solum tenant | Y/N/Y/N | SOLUM_API_KEY | SOLUM_API_BASE_URL, SOLUM_PROBE_PATH, SOLOM_API_KEY | Probe only until docs published | Vendor-signed webhook | Needs vendor docs | Vendor API contract not published | Obtain endpoint + auth docs from Solum |
| Eligipro | Eligibility — Auth team | https://www.eligipro.com/ | Eligipro tenant | Y/N/Y/N | ELIGIPRO_API_KEY | ELIGIPRO_API_BASE_URL, ELIGIPRO_PROBE_PATH | Probe only | Vendor-signed webhook | Needs vendor docs | Vendor API contract not published | Obtain endpoint + auth docs from Eligipro |
| Bloom Growth (L10) | Operations meetings / scorecards — Leadership | https://www.bloomgrowth.com/ | Bloom Growth org | Y/N/N/N | BLOOMGROWTH_API_KEY | BLOOMGROWTH_ORG_ID, BLOOMGROWTH_API_BASE_URL | Probe only until docs published | n/a | Needs vendor docs | Vendor API contract not published | Obtain API docs from Bloom Growth |
| Google Ads | Marketing spend / conversions — Marketing | https://developers.google.com/google-ads/api/docs/start | Google Ads MCC | Y/Y/N/Y | GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN | GOOGLE_ADS_LOGIN_CUSTOMER_ID, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_ACCESS_LEVEL | GAQL paged report read | n/a | Needs vendor docs | Developer token requires basic-access approval | Apply for basic access; then add secrets |
| Meta Ads | Marketing spend / conversions — Marketing | https://developers.facebook.com/docs/marketing-api/ | Meta ad account | Y/Y/N/Y | META_ADS_ACCESS_TOKEN, META_ADS_AD_ACCOUNT_ID | META_ADS_API_VERSION | Paged insights read | n/a | Needs credentials | System-user long-lived token pending | Generate system-user token, add secrets |
| Fathom Analytics | Web analytics — Marketing | https://usefathom.com/api | Fathom site | Y/Y/N/N | FATHOM_API_KEY | FATHOM_SITE_ID | Aggregated pageviews read | n/a | Needs credentials | — | Add FATHOM_API_KEY, FATHOM_SITE_ID |
| Make.com (bridge) | Migration automation bridge — Ops | https://www.make.com/en/api-documentation | Make scenario | Y/N/Y/N | MAKE_WEBHOOK_SECRET, MAKE_OUTBOUND_WEBHOOK_URL | — | Inbound webhook receipt (bridge), dry-run ping | Bearer `MAKE_WEBHOOK_SECRET` | Ready to configure | Temporary during migration only | Retire once native adapters cover all flows |
| Go Integrator Nava | Desktop CTI screen-pop — Front-desk | https://help.nava.gointegrator.com/help?item=2505&lang=us&version=4.2 | Local workstation | N/N/N/N (localOnly) | — | — | n/a — installer only | n/a | Manual local | Requires per-workstation install | Ship desktop install guide to admins |

## Retired providers

| Provider | Retired reason | Replaced by |
| --- | --- | --- |
| LeadTrap | Replaced by Jotform for forms/intake/documents. History kept in `integration_events` for audit. | Jotform |
| PandaDoc | Replaced by Jotform for e-sign / document capture at intake. History kept for audit. | Jotform |

## Jotform migration notes

- Purpose mapping: `src/lib/os/integrations/jotformPurpose.ts` maps each configured `formId` to one of `intake_lead`, `client_onboarding`, `staff_onboarding`, `hr_document`, `qa_incident`, `general_form` (extend via `JOTFORM_FORM_PURPOSES_JSON`).
- Idempotency: submissions stage on the deterministic key `jotform:<formId>:<submissionID>` so replays never double-post.
- Field maps: `JOTFORM_FIELD_MAP_JSON` translates `qid#` to canonical field names before normalization.
- Webhook: Jotform posts to `integration-webhook?provider=jotform`; verified against bearer `JOTFORM_WEBHOOK_TOKEN`.
- LeadTrap / PandaDoc rows in `integrations` are disabled but preserved for audit history.

## Outbound / secrets audit

Enforced by `src/test/providerAdapterAudit.test.ts` + `providerReadinessManifest.test.ts`:

- Every adapter except `resend` (preserved transactional) and `make` (migration bridge, dry-run only) declares `outboundDisabled: true`.
- No adapter creates webhook subscriptions programmatically — subscriptions are established in the vendor UI by an admin.
- No adapter emits notifications, calendar invites, or CRM writebacks.
- The Sync button in `IntegrationsReadiness.tsx` invokes pullSync with `dryRun: true`, and is only rendered when `capabilities.pullSync === true`.
- Manifest carries only secret *names*. `IntegrationsReadiness.tsx` renders names, not values. `fetch_secrets` is never called from the readiness UI.

## Recommended rollout order

1. **CentralReach Enhanced API** — largest downstream dependency (reports, RBT/BCBA lifecycle).
2. **Jotform** — unblocks intake + onboarding flows previously on LeadTrap/PandaDoc.
3. **Calendly** — closes intake scheduling loop with signature-verified webhook.
4. **Apploi** — recruiting pipeline visibility.
5. **Microsoft 365 Graph** — per-user mail/calendar; requires tenant admin consent.
6. **Mailchimp / Fathom / Meta Ads** — marketing analytics rollup.
7. **Google Ads** — waits on developer-token basic-access approval.
8. **Jivetel** — waits on vendor tenant enablement.
9. **Solum, Eligipro, Bloom Growth** — waits on vendor API documentation.
10. **Go Integrator Nava** — desktop rollout after CentralReach + Jivetel land.
11. Retire **Make.com bridge** once every flow above is native.

## External-setup checklist (owner action required)

- [ ] CentralReach: request Enhanced API client credentials; provide `CENTRALREACH_CLIENT_ID`, `CLIENT_SECRET`, `API_BASE_URL`.
- [ ] Jotform: paste `integration-webhook?provider=jotform` URL into each form's webhook settings; provide `JOTFORM_API_KEY`, `JOTFORM_WEBHOOK_TOKEN`, `JOTFORM_FORM_IDS`.
- [ ] Calendly: create org-level webhook subscription pointing at `integration-webhook?provider=calendly`; provide OAuth client + signing key.
- [ ] Apploi: provide `APPLOI_API_KEY` once vendor issues.
- [ ] Microsoft 365: complete tenant admin consent; publish `MICROSOFT_*` secrets.
- [ ] Mailchimp: provide API key + server prefix.
- [ ] Google Ads: submit basic-access application for developer token; then supply OAuth refresh token + customer IDs.
- [ ] Meta Ads: issue long-lived system-user token; provide `META_ADS_ACCESS_TOKEN`, `META_ADS_AD_ACCOUNT_ID`.
- [ ] Fathom: provide `FATHOM_API_KEY`, `FATHOM_SITE_ID`.
- [ ] Jivetel: vendor to enable API tenant; provide `JIVETEL_API_KEY`.
- [ ] Solum / Eligipro / Bloom Growth: obtain endpoint + auth documentation before adapters can leave `vendor_docs_required`.
- [ ] Go Nava: distribute desktop installer + config to front-desk workstations.
