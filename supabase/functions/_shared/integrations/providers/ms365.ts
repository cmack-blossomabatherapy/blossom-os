import type { ProviderAdapter } from "../types.ts";
import { hasAll } from "../secrets.ts";

/**
 * Microsoft 365 — per-user OAuth (Outlook mail + calendar).
 *
 * This adapter validates app-level config presence only. Per-user token
 * refresh + Graph paging live in dedicated edge functions:
 *   - microsoft-graph-probe        (token vault probe)
 *   - microsoft-calendar-sync      (uses `@odata.nextLink` + `@odata.deltaLink`)
 *   - microsoft-mail-activity-sync (uses `@odata.nextLink` + `@odata.deltaLink`)
 *
 * Graph pagination contract (delta):
 *   1. First call: `/me/messages/delta` (or `/me/events/delta`).
 *   2. Follow `@odata.nextLink` until it is absent.
 *   3. Persist the final `@odata.deltaLink` and use it as the next run's start.
 * See: https://learn.microsoft.com/graph/delta-query-overview
 */
export const ms365Adapter: ProviderAdapter = {
  id: "ms365",
  classification: "per_user_oauth",
  requiredSecrets: [
    "MICROSOFT_CLIENT_ID",
    "MICROSOFT_CLIENT_SECRET",
    "MICROSOFT_TENANT_ID",
    "MICROSOFT_REDIRECT_URI",
    "OAUTH_TOKEN_ENCRYPTION_KEY",
  ],
  capabilities: {
    probe: true,
    pullSync: true,
    webhook: false,
    oauth: true,
    outboundDisabled: true,
    documentationUrl: "https://learn.microsoft.com/graph/api/overview",
    operationalState: "per_user_oauth",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "needs_credentials", message: `Missing: ${need.missing.join(", ")}` };
    return {
      ok: true,
      status: "configured",
      message:
        "Microsoft 365 app config present. Each user connects via /microsoft-oauth-start and is tested via /microsoft-graph-probe. Sync uses @odata.nextLink and @odata.deltaLink.",
    };
  },

  async sync() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "failed", message: `Missing: ${need.missing.join(", ")}` };
    return {
      ok: true,
      status: "success",
      message:
        "MS365 is per-user. Invoke microsoft-calendar-sync or microsoft-mail-activity-sync per user; they walk @odata.nextLink and persist @odata.deltaLink.",
    };
  },

  normalizeWebhook(payload) {
    return {
      eventType: "ms365_notification",
      providerEventId: null,
      normalizedKind: "calendar_event",
      metadata: { raw: payload as Record<string, unknown> },
    };
  },
};
