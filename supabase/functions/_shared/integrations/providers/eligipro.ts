import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

export const eligiproAdapter: ProviderAdapter = {
  id: "eligipro",
  classification: "eligibility",
  requiredSecrets: ["ELIGIPRO_API_KEY"],
  optionalSecrets: ["ELIGIPRO_API_BASE_URL", "ELIGIPRO_PROBE_PATH"],

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "not_configured", message: `Missing: ${need.missing.join(", ")}` };
    const baseUrl = getEnv("ELIGIPRO_API_BASE_URL");
    const probePath = getEnv("ELIGIPRO_PROBE_PATH");
    if (!baseUrl || !probePath) {
      return { ok: true, status: "configured_pending_probe_path", message: "Eligipro key present; set ELIGIPRO_API_BASE_URL and ELIGIPRO_PROBE_PATH." };
    }
    const res = await fetchJson(`${baseUrl.replace(/\/$/, "")}${probePath}`, {
      headers: { Authorization: `Bearer ${getEnv("ELIGIPRO_API_KEY")}` },
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return { ok: true, status: "connected", message: "Eligipro probe ok" };
  },

  async sync() {
    const baseUrl = getEnv("ELIGIPRO_API_BASE_URL");
    if (!baseUrl) return { ok: false, status: "failed", message: "configured_pending_probe_path: ELIGIPRO_API_BASE_URL required." };
    return { ok: true, status: "success", message: "Eligipro pull sync is a no-op; eligibility events flow via webhook." };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    return {
      eventType: p.event ?? "eligibility",
      providerEventId: p.id ?? p.check_id ?? null,
      normalizedKind: "eligibility",
      metadata: { raw: p },
      record: p.id || p.check_id
        ? {
            providerRecordId: String(p.id ?? p.check_id),
            recordKind: "eligibility",
            recordStatus: p.eligibility ?? p.status ?? null,
            displayTitle: `Eligipro ${p.payer ?? ""}`.trim(),
            occurredAt: p.verified_at ?? p.timestamp ?? null,
            sourceLabel: "Eligipro",
            metadata: { payer: p.payer, member_id: p.member_id, oon: p.oon },
          }
        : null,
    };
  },
};