import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

/** Go Integrate Nava — kept as backend-ready placeholder; reuses
 * eligibility adapter shape until vendor docs are confirmed. */
export const goIntegrateNavaAdapter: ProviderAdapter = {
  id: "go-integrate-nava",
  classification: "eligibility_pending",
  requiredSecrets: ["GO_INTEGRATE_NAVA_API_KEY", "GO_INTEGRATE_NAVA_WEBHOOK_SECRET"],
  optionalSecrets: ["GO_INTEGRATE_NAVA_API_BASE_URL", "GO_INTEGRATE_NAVA_PROBE_PATH"],

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "not_configured", message: `Missing: ${need.missing.join(", ")}` };
    const baseUrl = getEnv("GO_INTEGRATE_NAVA_API_BASE_URL");
    const probePath = getEnv("GO_INTEGRATE_NAVA_PROBE_PATH");
    if (!baseUrl || !probePath) {
      return {
        ok: true,
        status: "configured_pending_vendor_endpoint",
        message: "Go Integrate Nava creds present; vendor endpoint docs pending.",
      };
    }
    const res = await fetchJson(`${baseUrl.replace(/\/$/, "")}${probePath}`, {
      headers: { Authorization: `Bearer ${getEnv("GO_INTEGRATE_NAVA_API_KEY")}` },
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return { ok: true, status: "connected", message: "Go Integrate Nava probe ok" };
  },

  async sync() {
    return {
      ok: false,
      status: "failed",
      message: "configured_pending_vendor_endpoint: Go Integrate Nava vendor endpoint docs unavailable.",
    };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    return {
      eventType: p.event ?? p.type ?? "unknown",
      providerEventId: p.id ?? null,
      normalizedKind: "eligibility",
      metadata: { raw: p },
    };
  },
};