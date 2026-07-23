import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

/**
 * Fathom Analytics — read-only site analytics. INGEST_ONLY.
 * Auth: Bearer API key.
 * Docs: https://usefathom.com/api
 */
export const fathomAdapter: ProviderAdapter = {
  id: "fathom",
  classification: "web_analytics",
  requiredSecrets: ["FATHOM_API_KEY"],
  optionalSecrets: ["FATHOM_SITE_ID"],
  capabilities: {
    probe: true,
    pullSync: true,
    webhook: false,
    outboundDisabled: true,
    documentationUrl: "https://usefathom.com/api",
    operationalState: "ingest_only",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "needs_credentials", message: `Missing: ${need.missing.join(", ")}` };
    const res = await fetchJson<any>("https://api.usefathom.com/v1/account", {
      headers: { Authorization: `Bearer ${getEnv("FATHOM_API_KEY")}` },
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return {
      ok: true,
      status: "connected",
      message: "Fathom /v1/account ok",
      accountLabel: (res.data as any)?.email ?? null,
    };
  },

  async sync(_ctx, options) {
    const siteId = getEnv("FATHOM_SITE_ID");
    if (!siteId) {
      return {
        ok: false,
        status: "failed",
        message: "needs_credentials: FATHOM_SITE_ID required to pull aggregations.",
      };
    }
    const dryRun = options.dryRun === true;
    return {
      ok: true,
      status: dryRun ? "success" : "partial",
      message: dryRun
        ? "Fathom dry-run: probe-only; aggregation window not configured."
        : "Fathom sync scaffold ready; supply metric + date window to pull aggregations.",
    };
  },

  normalizeWebhook() {
    return { metadata: { note: "fathom_has_no_webhooks" } };
  },
};
