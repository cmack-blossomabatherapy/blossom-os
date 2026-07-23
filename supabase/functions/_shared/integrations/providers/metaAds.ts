import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

/**
 * Meta Ads (Marketing API) — read-only. INGEST_ONLY.
 * Auth: long-lived system-user access token.
 * Docs: https://developers.facebook.com/docs/marketing-api/
 */
export const metaAdsAdapter: ProviderAdapter = {
  id: "meta-ads",
  classification: "marketing_ads",
  requiredSecrets: ["META_ADS_ACCESS_TOKEN", "META_ADS_AD_ACCOUNT_ID"],
  optionalSecrets: ["META_ADS_API_VERSION"],
  capabilities: {
    probe: true,
    pullSync: true,
    webhook: false,
    oauth: true,
    outboundDisabled: true,
    documentationUrl: "https://developers.facebook.com/docs/marketing-api/",
    operationalState: "ingest_only",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "needs_credentials", message: `Missing: ${need.missing.join(", ")}` };
    const version = getEnv("META_ADS_API_VERSION") ?? "v20.0";
    const accountId = getEnv("META_ADS_AD_ACCOUNT_ID")!;
    const token = getEnv("META_ADS_ACCESS_TOKEN")!;
    const url = `https://graph.facebook.com/${version}/${encodeURIComponent(
      accountId,
    )}?fields=id,name,account_status&access_token=${encodeURIComponent(token)}`;
    const res = await fetchJson<any>(url);
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return {
      ok: true,
      status: "connected",
      message: "Meta Ads ad-account probe ok",
      accountLabel: (res.data as any)?.name ?? accountId,
    };
  },

  async sync(_ctx, options) {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "failed", message: `Missing: ${need.missing.join(", ")}` };
    // Read-only insights pull is scaffolded but returns `partial` until an
    // insights window + level are supplied by ops.
    const dryRun = options.dryRun === true;
    return {
      ok: true,
      status: "partial",
      message: dryRun
        ? "Meta Ads dry-run: probe-only check succeeded; insights window not yet configured."
        : "Meta Ads sync scaffold ready; supply level/time window (campaign/adset/ad + since) to pull insights.",
      details: { dryRun, requires: ["level", "time_range"] },
    };
  },

  normalizeWebhook() {
    return { metadata: { note: "meta_ads_uses_webhooks_only_for_lead_ads_not_configured_here" } };
  },
};
