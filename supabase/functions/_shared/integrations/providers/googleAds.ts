import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";

/**
 * Google Ads — read-only marketing metrics. INGEST_ONLY.
 *
 * Auth: OAuth2 refresh token + Developer Token (server-side only).
 * Requests are POSTed to `googleads.googleapis.com/v18/customers/{customerId}/googleAds:searchStream`.
 *
 * Google Ads publishes full public docs, so this adapter's operational
 * state is `ingest_only` — the outstanding blocker is credential/approval
 * (developer-token access level + refresh token), not documentation. Live
 * sync still refuses to claim `connected` until a real read-only API call
 * against `googleAds:searchStream` succeeds.
 *
 * Docs:
 *   - https://developers.google.com/google-ads/api/docs/start
 *   - https://developers.google.com/google-ads/api/docs/oauth/service-accounts
 */
export const googleAdsAdapter: ProviderAdapter = {
  id: "google-ads",
  classification: "marketing_ads",
  requiredSecrets: [
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
  ],
  optionalSecrets: [
    "GOOGLE_ADS_LOGIN_CUSTOMER_ID",
    "GOOGLE_ADS_CUSTOMER_ID",
    "GOOGLE_ADS_ACCESS_LEVEL", // "test" | "basic" | "standard"
  ],
  capabilities: {
    probe: true,
    pullSync: true,
    webhook: false,
    oauth: true,
    outboundDisabled: true,
    documentationUrl: "https://developers.google.com/google-ads/api/docs/start",
    operationalState: "ingest_only",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) {
      return { ok: false, status: "needs_credentials", message: `Missing: ${need.missing.join(", ")}` };
    }
    const level = (getEnv("GOOGLE_ADS_ACCESS_LEVEL") ?? "").toLowerCase();
    const customer = getEnv("GOOGLE_ADS_CUSTOMER_ID");
    if (!customer || level !== "basic" && level !== "standard") {
      return {
        ok: true,
        status: "needs_credentials",
        message:
          "Google Ads credentials present but developer-token access level is not proven `basic`/`standard` and/or GOOGLE_ADS_CUSTOMER_ID is missing. Refusing to claim `connected` without a real read-only API call.",
        details: { developerTokenAccessLevel: level || "unknown" },
      };
    }
    return {
      ok: true,
      status: "configured_pending_probe",
      message:
        "Google Ads config ready. Live probe against googleAds:searchStream is executed by the read-only sync path once enabled.",
    };
  },

  async sync() {
    return {
      ok: false,
      status: "failed",
      message:
        "needs_credentials: Google Ads pull sync requires proven `basic`/`standard` developer-token access + customer id. Read-only until confirmed.",
    };
  },

  normalizeWebhook() {
    // Google Ads has no webhook; conversions arrive via Enhanced Conversions upload (outbound-only, disabled).
    return { metadata: { note: "google_ads_has_no_inbound_webhook" } };
  },
};
