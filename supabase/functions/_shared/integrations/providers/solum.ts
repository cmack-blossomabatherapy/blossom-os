import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";

/**
 * Solom / Solum — payer eligibility / VOB. Canonical id `solum`; accepts
 * `SOLOM_API_KEY` alias via the shared secrets helper.
 *
 * Solum does not publish a public API base URL. Probe/sync report
 * `vendor_docs_required` until endpoint + auth are documented — the
 * adapter NEVER fakes success.
 */
export const solumAdapter: ProviderAdapter = {
  id: "solum",
  classification: "eligibility_vob",
  requiredSecrets: ["SOLUM_API_KEY"],
  optionalSecrets: ["SOLUM_API_BASE_URL", "SOLUM_PROBE_PATH", "SOLOM_API_KEY"],
  capabilities: {
    probe: true,
    pullSync: false,
    webhook: true,
    outboundDisabled: true,
    documentationUrl: "https://solumhealth.com/",
    operationalState: "vendor_docs_required",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) {
      return {
        ok: false,
        status: "needs_credentials",
        message: `Missing: ${need.missing.join(", ")} (SOLOM_API_KEY alias accepted)`,
      };
    }
    const baseUrl = getEnv("SOLUM_API_BASE_URL");
    const probePath = getEnv("SOLUM_PROBE_PATH");
    if (!baseUrl || !probePath) {
      return {
        ok: true,
        status: "vendor_docs_required",
        message:
          "Solom/Solum key present; vendor has not published an official API base. Supply SOLUM_API_BASE_URL and SOLUM_PROBE_PATH when documented.",
      };
    }
    // With explicit vendor-provided path, attempt a probe.
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}${probePath}`, {
      headers: { Authorization: `Bearer ${getEnv("SOLUM_API_KEY")}` },
    }).catch((e) => ({ ok: false, status: 0, statusText: e instanceof Error ? e.message : String(e) } as Response));
    if (!res.ok) return { ok: false, status: "error", message: `HTTP ${res.status}` };
    return { ok: true, status: "connected", message: "Solom/Solum probe ok" };
  },

  async sync() {
    // Never returns success without a real API call.
    return {
      ok: false,
      status: "failed",
      message:
        "vendor_docs_required: Solom/Solum has no published pull endpoint. Eligibility flows via webhook once vendor confirms.",
    };
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
