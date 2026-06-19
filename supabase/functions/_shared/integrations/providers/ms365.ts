import type { ProviderAdapter } from "../types.ts";
import { hasAll } from "../secrets.ts";

/**
 * Microsoft 365 — per-user OAuth (Outlook email + calendar).
 * Test/sync via this adapter only validate config presence. Real per-user
 * token refresh happens in microsoft-graph-probe / microsoft-calendar-sync /
 * microsoft-mail-activity-sync via the shared token vault.
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

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "not_configured", message: `Missing: ${need.missing.join(", ")}` };
    return {
      ok: true,
      status: "configured",
      message: "Microsoft 365 app config present. Each user connects via /microsoft-oauth-start and is tested via /microsoft-graph-probe.",
    };
  },

  async sync() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "failed", message: `Missing: ${need.missing.join(", ")}` };
    return {
      ok: true,
      status: "success",
      message: "MS365 is per-user. Invoke microsoft-calendar-sync or microsoft-mail-activity-sync for the signed-in user.",
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