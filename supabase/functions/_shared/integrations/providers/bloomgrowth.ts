import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";

/**
 * Bloom Growth (formerly Traction Tools) — L10 meetings, rocks, scorecards.
 * Public developer API access is provided per organization on request.
 * Until an official base URL + auth scheme is documented for this tenant,
 * the adapter reports `vendor_docs_required` honestly.
 * Docs: https://www.bloomgrowth.com/
 */
export const bloomgrowthAdapter: ProviderAdapter = {
  id: "bloomgrowth",
  classification: "operations_l10",
  requiredSecrets: ["BLOOMGROWTH_API_KEY"],
  optionalSecrets: ["BLOOMGROWTH_ORG_ID", "BLOOMGROWTH_API_BASE_URL"],
  capabilities: {
    probe: true,
    pullSync: false,
    webhook: false,
    outboundDisabled: true,
    documentationUrl: "https://www.bloomgrowth.com/",
    operationalState: "vendor_docs_required",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "needs_credentials", message: `Missing: ${need.missing.join(", ")}` };
    const baseUrl = getEnv("BLOOMGROWTH_API_BASE_URL");
    if (!baseUrl) {
      return {
        ok: true,
        status: "vendor_docs_required",
        message:
          "Bloom Growth API key present. Vendor-issued base URL required (BLOOMGROWTH_API_BASE_URL). No endpoint is assumed.",
      };
    }
    return {
      ok: true,
      status: "configured_pending_probe",
      message: "Bloom Growth config present; live probe runs once the tenant confirms endpoints.",
    };
  },

  async sync() {
    return {
      ok: false,
      status: "failed",
      message: "vendor_docs_required: Bloom Growth has no public pull endpoint documented for Blossom OS.",
    };
  },

  normalizeWebhook() {
    return { metadata: { note: "bloomgrowth_no_public_webhook" } };
  },
};
