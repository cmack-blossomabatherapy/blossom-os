# Jotform + Go Integrator Nava Readiness Manifest

**Guardrails:** INGEST_ONLY. No outbound. No touch on Training Academy, Reports, or Resource Library.

## 1. Jotform (canonical forms / intake / document provider)

Replaces LeadTrap and PandaDoc across the active integration surface.

**Required secrets**
- `JOTFORM_API_KEY` — provisioned in Jotform Account → API.
- `JOTFORM_API_BASE_URL` — one of `https://api.jotform.com`, `https://eu-api.jotform.com`, or `https://hipaa-api.jotform.com` (recommended for PHI).
- `JOTFORM_WEBHOOK_TOKEN` — shared secret. Configure Jotform to POST to
  `.../functions/v1/integration-webhook?integration=jotform&token=<JOTFORM_WEBHOOK_TOKEN>`.

**Optional secrets**
- `JOTFORM_FORM_IDS` — comma-separated list to constrain pull sync.
- `JOTFORM_FORM_PURPOSES_JSON` — JSON `{ formId: "intake" | "recruiting" | "hr" | "clinical_document" }`.
- `JOTFORM_FIELD_MAP_JSON` — JSON `{ formId: { emailField, phoneField, nameField, ... } }`.

**Adapter behavior**
- Auth via `APIKEY` header.
- Base URL is validated against an allowlist (`api`, `eu-api`, `hipaa-api`).
- Pull sync is read-only, paginates by `offset`/`limit` (page cap 5) and orders by `created_at` DESC.
- Webhook posts arrive as multipart/form-data with a `rawRequest` JSON blob — the webhook handler now parses both multipart and form-encoded bodies.
- Signature verification is token-based (query param `token` or header `x-jotform-token`). Missing/mismatched tokens **reject** instead of falling through to `unverified`.
- Capabilities: `{ probe: true, pullSync: true, webhook: true, outboundDisabled: true }`.

**Retired providers**
- `leadtrap` and `pandadoc` are marked `disabled` in `integration_catalog` and their live connections are disabled. Historical rows are preserved.

## 2. Go Integrator Nava (desktop CTI companion)

Reclassified from `eligibility_pending` to `communications_desktop_cti`.

- Local UNITE client, licensed per user; **not cloud-testable**.
- Adapter reports `status: "manual_local_setup"` and does not attempt cloud probes or pull sync.
- `capabilities: { probe: false, pullSync: false, webhook: false, localOnly: true }`.
- Setup path: install UNITE, point it at the Blossom NetSapiens/Jivetel host, and pair with Jivetel credentials at the desktop.
- Blossom OS treats Nava as a companion for Jivetel telemetry, not a separate data source.