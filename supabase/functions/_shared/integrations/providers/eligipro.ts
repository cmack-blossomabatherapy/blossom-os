import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";

/**
 * Eligipro — payer eligibility. Vendor endpoint requires configuration
 * per tenant; the adapter reports `vendor_docs_required` honestly until
 * a documented base URL + probe path are supplied. Never fakes success.
 */
export const eligiproAdapter: ProviderAdapter = {
  id: "eligipro",
  classification: "eligibility",
  requiredSecrets: ["ELIGIPRO_API_KEY"],
  optionalSecrets: ["ELIGIPRO_API_BASE_URL", "ELIGIPRO_PROBE_PATH"],
  capabilities: {
    probe: true,
    pullSync: false,
    webhook: true,
    outboundDisabled: true,
    documentationUrl: "https://www.eligipro.com/",
    operationalState: "vendor_docs_required",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "needs_credentials", message: `Missing: ${need.missing.join(", ")}` };
    const baseUrl = getEnv("ELIGIPRO_API_BASE_URL");
    const probePath = getEnv("ELIGIPRO_PROBE_PATH");
    if (!baseUrl || !probePath) {
      return {
        ok: true,
        status: "vendor_docs_required",
        message: "Eligipro key present; vendor endpoint unconfirmed. Set ELIGIPRO_API_BASE_URL and ELIGIPRO_PROBE_PATH.",
      };
    }
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}${probePath}`, {
      headers: { Authorization: `Bearer ${getEnv("ELIGIPRO_API_KEY")}` },
    }).catch((e) => ({ ok: false, status: 0, statusText: e instanceof Error ? e.message : String(e) } as Response));
    if (!res.ok) return { ok: false, status: "error", message: `HTTP ${res.status}` };
    return { ok: true, status: "connected", message: "Eligipro probe ok" };
  },

  async sync() {
    // Never returns success without a real API call.
    return {
      ok: false,
      status: "failed",
      message:
        "vendor_docs_required: Eligipro has no published pull endpoint for Blossom OS. Eligibility events flow via webhook once vendor confirms.",
    };
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
