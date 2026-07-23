import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

/**
 * Bloom Growth — L10 meetings, rocks, scorecards. Read-only.
 *
 * Docs:    https://help.bloomgrowth.com/en/all-about-the-bloom-growth-api
 * Swagger: https://app.bloomgrowth.com/swagger/index.html
 * Auth:    bearer access token issued from
 *          POST https://app.bloomgrowth.com/token
 *
 * Blossom OS does NOT perform password-grant exchange. The operator is
 * expected to mint a token via Bloom Growth's own flow and paste it
 * server-side into `BLOOMGROWTH_ACCESS_TOKEN`. The optional legacy
 * `BLOOMGROWTH_API_KEY` alias is honored if present but is not
 * requested; the access-token form is the canonical secret.
 */

const DEFAULT_BASE = "https://app.bloomgrowth.com";
const DEFAULT_PROBE_PATH = "/api/v1/scorecard/items/";

function getBaseUrl(): string {
  return (getEnv("BLOOMGROWTH_API_BASE_URL") ?? DEFAULT_BASE).replace(/\/+$/, "");
}

function getToken(): string | null {
  return getEnv("BLOOMGROWTH_ACCESS_TOKEN") ?? getEnv("BLOOMGROWTH_API_KEY") ?? null;
}

export const bloomgrowthAdapter: ProviderAdapter = {
  id: "bloomgrowth",
  classification: "operations_l10",
  requiredSecrets: ["BLOOMGROWTH_ACCESS_TOKEN"],
  optionalSecrets: [
    "BLOOMGROWTH_API_KEY", // legacy alias, still accepted at runtime
    "BLOOMGROWTH_ORG_ID",
    "BLOOMGROWTH_API_BASE_URL",
  ],
  capabilities: {
    probe: true,
    pullSync: true,
    webhook: false,
    outboundDisabled: true,
    documentationUrl: "https://help.bloomgrowth.com/en/all-about-the-bloom-growth-api",
    operationalState: "ingest_only",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    const token = getToken();
    if (!need.ok && !token) {
      return {
        ok: false,
        status: "needs_credentials",
        message:
          "Missing BLOOMGROWTH_ACCESS_TOKEN (bearer access token from POST https://app.bloomgrowth.com/token).",
      };
    }
    const url = `${getBaseUrl()}${DEFAULT_PROBE_PATH}`;
    const res = await fetchJson<any>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      timeoutMs: 8_000,
    });
    if (!res.ok) {
      return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    }
    return {
      ok: true,
      status: "connected",
      message: "Bloom Growth /api/v1/scorecard/items/ ok",
      details: { base: getBaseUrl() },
    };
  },

  async sync(_ctx, options) {
    const token = getToken();
    if (!token) {
      return {
        ok: false,
        status: "failed",
        message: "needs_credentials: BLOOMGROWTH_ACCESS_TOKEN required.",
      };
    }
    const dryRun = options.dryRun === true;
    // Read-only sample from scorecard items; no pagination cursor is
    // documented publicly, so we ask for a bounded page only.
    const res = await fetchJson<any>(`${getBaseUrl()}${DEFAULT_PROBE_PATH}?pageSize=25`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      timeoutMs: 10_000,
    });
    if (!res.ok) {
      return { ok: false, status: "failed", message: res.error ?? `HTTP ${res.status}` };
    }
    const items = (res.data as any)?.items ?? (res.data as any)?.data ?? [];
    return {
      ok: true,
      status: dryRun ? "success" : "partial",
      message: dryRun
        ? `Bloom Growth dry-run: read ${Array.isArray(items) ? items.length : 0} scorecard item(s) read-only.`
        : "Bloom Growth read-only pull scaffold complete.",
      details: { sampled: Array.isArray(items) ? items.length : 0 },
    };
  },

  normalizeWebhook() {
    return { metadata: { note: "bloomgrowth_no_public_webhook" } };
  },
};
