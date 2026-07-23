import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";

/**
 * Google Ads — read-only marketing metrics. INGEST_ONLY.
 *
 * Auth: OAuth2 refresh token + Developer Token (server-side only).
 * Requests are POSTed to `googleads.googleapis.com/v18/customers/{customerId}/googleAds:searchStream`.
 *
 * Live sync is disabled until a `basic` or `standard` developer-token
 * access level is proven for this account — a test-account token cannot
 * query production customer resources. Until then, the adapter reports
 * `vendor_docs_required` honestly and NEVER `connected`.
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
    operationalState: "vendor_docs_required",
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
        status: "vendor_docs_required",
        message:
          "Google Ads credentials present but developer-token access level is not proven `basic`/`standard` and/or GOOGLE_ADS_CUSTOMER_ID is missing. Refusing to claim `connected` without a real API call.",
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
        "vendor_docs_required: Google Ads pull sync requires proven `basic`/`standard` developer-token access + customer id. Report-only until confirmed.",
    };
  },

  normalizeWebhook() {
    // Google Ads has no webhook; conversions arrive via Enhanced Conversions upload (outbound-only, disabled).
    return { metadata: { note: "google_ads_has_no_inbound_webhook" } };
  },
};
