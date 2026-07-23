import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

/**
 * Jivetel / NetSapiens — hosted phone system. Read-only, INGEST_ONLY.
 *
 * NetSapiens does not publish a single canonical public API base — each
 * tenant is issued a hostname + credentials. No endpoint is assumed:
 * probe/sync require explicit `JIVETEL_API_BASE_URL` + `JIVETEL_PROBE_PATH`
 * from vendor documentation.
 * Docs: https://docs.netsapiens.com/
 */
export const jivetelAdapter: ProviderAdapter = {
  id: "jivetel",
  classification: "phone_system",
  requiredSecrets: ["JIVETEL_API_KEY"],
  optionalSecrets: ["JIVETEL_API_BASE_URL", "JIVETEL_PROBE_PATH"],
  capabilities: {
    probe: true,
    pullSync: false,
    webhook: true,
    outboundDisabled: true,
    documentationUrl: "https://docs.netsapiens.com/",
    operationalState: "ingest_only",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "needs_credentials", message: `Missing: ${need.missing.join(", ")}` };
    const baseUrl = getEnv("JIVETEL_API_BASE_URL");
    const probePath = getEnv("JIVETEL_PROBE_PATH");
    if (!baseUrl || !probePath) {
      return {
        ok: true,
        status: "vendor_docs_required",
        message:
          "Jivetel/NetSapiens key present; tenant-specific base URL + probe path required (JIVETEL_API_BASE_URL, JIVETEL_PROBE_PATH). No endpoint is assumed.",
      };
    }
    const res = await fetchJson(`${baseUrl.replace(/\/$/, "")}${probePath}`, {
      headers: { Authorization: `Bearer ${getEnv("JIVETEL_API_KEY")}`, Accept: "application/json" },
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return { ok: true, status: "connected", message: "Jivetel probe ok" };
  },

  async sync() {
    return {
      ok: false,
      status: "failed",
      message:
        "vendor_docs_required: Jivetel/NetSapiens exposes call events per tenant; no default pull endpoint. Configure webhook flow instead.",
    };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    return {
      eventType: p.event ?? p.type ?? null,
      providerEventId: p.id ?? null,
      normalizedKind: "phone",
      metadata: { raw: p },
    };
  },
};
