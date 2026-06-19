import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

/**
 * Solom / Solum — canonical id `solum`. Accepts SOLOM_API_KEY alias via
 * shared secrets helper.
 */
export const solumAdapter: ProviderAdapter = {
  id: "solum",
  classification: "eligibility_vob",
  requiredSecrets: ["SOLUM_API_KEY"],
  optionalSecrets: ["SOLUM_API_BASE_URL", "SOLUM_PROBE_PATH", "SOLOM_API_KEY"],

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "not_configured", message: `Missing: ${need.missing.join(", ")} (SOLOM_API_KEY alias accepted)` };
    const baseUrl = getEnv("SOLUM_API_BASE_URL");
    const probePath = getEnv("SOLUM_PROBE_PATH");
    if (!baseUrl || !probePath) {
      return {
        ok: true,
        status: "configured_pending_vendor_endpoint",
        message: "Solom/Solum key present; vendor endpoint unconfirmed. Set SOLUM_API_BASE_URL and SOLUM_PROBE_PATH.",
      };
    }
    const res = await fetchJson(`${baseUrl.replace(/\/$/, "")}${probePath}`, {
      headers: { Authorization: `Bearer ${getEnv("SOLUM_API_KEY")}` },
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return { ok: true, status: "connected", message: "Solom/Solum probe ok" };
  },

  async sync() {
    const baseUrl = getEnv("SOLUM_API_BASE_URL");
    if (!baseUrl) {
      return {
        ok: false,
        status: "failed",
        message: "configured_pending_vendor_endpoint: SOLUM_API_BASE_URL required to pull eligibility.",
      };
    }
    return { ok: true, status: "success", message: "Solom/Solum sync stub ready; eligibility events flow via webhook." };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    return {
      eventType: p.event ?? p.type ?? "eligibility",
      providerEventId: p.id ?? p.verification_id ?? null,
      normalizedKind: "eligibility",
      metadata: { raw: p },
      record: p.id || p.verification_id
        ? {
            providerRecordId: String(p.id ?? p.verification_id),
            recordKind: "eligibility",
            recordStatus: p.eligibility_status ?? p.vob_status ?? p.status ?? null,
            displayTitle: `Solom/Solum VOB ${p.payer ?? ""}`.trim(),
            occurredAt: p.verified_at ?? p.created_at ?? null,
            personName: p.patient_name ?? p.member_name ?? null,
            sourceLabel: "Solom/Solum",
            metadata: { payer: p.payer, member_id: p.member_id, oon: p.oon ?? p.out_of_network },
          }
        : null,
    };
  },
};