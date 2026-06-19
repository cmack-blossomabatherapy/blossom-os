import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

/** LeadTrap is webhook-first. Pull-sync only if base URL is configured. */
export const leadtrapAdapter: ProviderAdapter = {
  id: "leadtrap",
  classification: "lead_capture_webhook",
  requiredSecrets: ["LEADTRAP_WEBHOOK_SECRET"],
  optionalSecrets: ["LEADTRAP_API_KEY", "LEADTRAP_API_BASE_URL", "LEADTRAP_PROBE_PATH"],
  webhookOnly: true,

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "not_configured", message: `Missing: ${need.missing.join(", ")}` };
    const baseUrl = getEnv("LEADTRAP_API_BASE_URL");
    const probePath = getEnv("LEADTRAP_PROBE_PATH");
    const apiKey = getEnv("LEADTRAP_API_KEY");
    if (!baseUrl || !probePath || !apiKey) {
      return { ok: true, status: "webhook_ready", message: "LeadTrap webhook secret present; ready to receive leads." };
    }
    const res = await fetchJson(`${baseUrl.replace(/\/$/, "")}${probePath}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return { ok: true, status: "connected", message: "LeadTrap probe ok" };
  },

  async sync() {
    return { ok: true, status: "success", message: "LeadTrap is webhook-first; no pull sync." };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    const id = p.id ?? p.lead_id ?? null;
    return {
      eventType: "lead_received",
      providerEventId: id ? String(id) : null,
      normalizedKind: "lead",
      metadata: { raw: p },
      record: id
        ? {
            providerRecordId: String(id),
            recordKind: "lead",
            recordStatus: p.status ?? "new",
            displayTitle: p.parent_name ?? p.contact_name ?? "LeadTrap lead",
            occurredAt: p.submitted_at ?? p.created_at ?? new Date().toISOString(),
            personName: p.parent_name ?? p.contact_name ?? null,
            personEmail: p.email ?? null,
            personPhone: p.phone ?? null,
            sourceLabel: p.source ?? p.campaign ?? "LeadTrap",
            metadata: { child_name: p.child_name, child_age: p.child_age, state: p.state },
          }
        : null,
    };
  },
};