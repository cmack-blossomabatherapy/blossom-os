import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

/**
 * Resend is ALREADY in production for invites/welcome/MFA/evaluation emails.
 * Pass 4 must NOT rebuild that delivery path. Probe and sync are
 * report-only health checks against /domains.
 */
export const resendAdapter: ProviderAdapter = {
  id: "resend",
  classification: "transactional_email_preserved",
  requiredSecrets: ["RESEND_API_KEY"],

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "not_configured", message: `Missing: ${need.missing.join(", ")}` };
    const res = await fetchJson(`https://api.resend.com/domains`, {
      headers: { Authorization: `Bearer ${getEnv("RESEND_API_KEY")}` },
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return { ok: true, status: "connected", message: "Resend /domains reachable", details: { httpStatus: res.status } };
  },

  async sync(_ctx, _options) {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "failed", message: `Missing: ${need.missing.join(", ")}` };
    return {
      ok: true,
      status: "success",
      message: "Resend is in production for invites/welcome/MFA. Sync is report-only.",
    };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    return {
      eventType: p.type ?? null,
      providerEventId: p.data?.email_id ?? p.id ?? null,
      normalizedKind: "email_activity",
      metadata: { raw: p },
    };
  },
};