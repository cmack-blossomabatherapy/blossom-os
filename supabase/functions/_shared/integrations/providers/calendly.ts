import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

export const calendlyAdapter: ProviderAdapter = {
  id: "calendly",
  classification: "scheduling",
  requiredSecrets: ["CALENDLY_CLIENT_ID", "CALENDLY_CLIENT_SECRET", "CALENDLY_WEBHOOK_SIGNING_KEY"],
  optionalSecrets: ["CALENDLY_ACCESS_TOKEN", "CALENDLY_API_BASE_URL", "CALENDLY_PROBE_PATH"],

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "not_configured", message: `Missing: ${need.missing.join(", ")}` };
    const token = getEnv("CALENDLY_ACCESS_TOKEN");
    if (!token) {
      return {
        ok: true,
        status: "configured_pending_probe_path",
        message: "Calendly OAuth config present; provide CALENDLY_ACCESS_TOKEN to enable live probe (or run OAuth flow).",
      };
    }
    const base = (getEnv("CALENDLY_API_BASE_URL") ?? "https://api.calendly.com").replace(/\/$/, "");
    const probePath = getEnv("CALENDLY_PROBE_PATH") ?? "/users/me";
    const res = await fetchJson(`${base}${probePath}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return { ok: true, status: "connected", message: "Calendly /users/me ok" };
  },

  async sync() {
    if (!getEnv("CALENDLY_ACCESS_TOKEN")) {
      return { ok: false, status: "failed", message: "configured_pending_probe_path: CALENDLY_ACCESS_TOKEN required." };
    }
    return { ok: true, status: "success", message: "Calendly is webhook-first; pull sync stub ready." };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    const inv = p.payload ?? p;
    return {
      eventType: p.event ?? null,
      providerEventId: inv?.uri ?? inv?.uuid ?? null,
      normalizedKind: "calendar_event",
      metadata: { raw: p },
      record: inv?.uri || inv?.uuid
        ? {
            providerRecordId: String(inv.uri ?? inv.uuid),
            recordKind: "calendar_event",
            recordStatus: inv.status ?? p.event ?? null,
            displayTitle: inv.event_type?.name ?? inv.name ?? "Calendly event",
            occurredAt: inv.scheduled_event?.start_time ?? inv.start_time ?? null,
            personName: inv.name ?? null,
            personEmail: inv.email ?? null,
            personPhone: inv.text_reminder_number ?? null,
            sourceLabel: "Calendly",
            metadata: { event_type_uri: inv.event_type?.uri, scheduled_event: inv.scheduled_event },
          }
        : null,
    };
  },
};