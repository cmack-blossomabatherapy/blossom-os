import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

export const jivetelAdapter: ProviderAdapter = {
  id: "jivetel",
  classification: "phone_system",
  requiredSecrets: ["JIVETEL_API_KEY"],
  optionalSecrets: ["JIVETEL_API_BASE_URL", "JIVETEL_PROBE_PATH"],

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "not_configured", message: `Missing: ${need.missing.join(", ")}` };
    const baseUrl = getEnv("JIVETEL_API_BASE_URL");
    const probePath = getEnv("JIVETEL_PROBE_PATH");
    if (!baseUrl || !probePath) {
      return { ok: true, status: "configured_pending_probe_path", message: "Jivetel key present; set JIVETEL_API_BASE_URL and JIVETEL_PROBE_PATH." };
    }
    const res = await fetchJson(`${baseUrl.replace(/\/$/, "")}${probePath}`, {
      headers: { Authorization: `Bearer ${getEnv("JIVETEL_API_KEY")}` },
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return { ok: true, status: "connected", message: "Jivetel probe ok" };
  },

  async sync() {
    const baseUrl = getEnv("JIVETEL_API_BASE_URL");
    if (!baseUrl) return { ok: false, status: "failed", message: "configured_pending_probe_path: JIVETEL_API_BASE_URL required." };
    return { ok: true, status: "success", message: "Jivetel pull sync stub ready." };
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