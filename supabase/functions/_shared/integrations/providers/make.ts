import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";

/**
 * Make.com is a MIGRATION BRIDGE only. Blossom OS must not depend on
 * Make as long-term source of truth. This adapter labels itself
 * `migration_bridge` and is webhook-first.
 */
export const makeAdapter: ProviderAdapter = {
  id: "make",
  classification: "migration_bridge",
  requiredSecrets: ["MAKE_WEBHOOK_SECRET", "MAKE_OUTBOUND_WEBHOOK_URL"],
  webhookOnly: false,
  capabilities: {
    probe: true,
    pullSync: false,
    webhook: true,
    outboundDisabled: false,
    documentationUrl: "https://www.make.com/en/api-documentation",
    operationalState: "migration_bridge",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "not_configured", message: `Missing: ${need.missing.join(", ")}` };
    return {
      ok: true,
      status: "webhook_ready",
      message: "Make.com configured as migration bridge (webhook secret + outbound URL).",
      details: { classification: "migration_bridge" },
    };
  },

  async sync(_ctx, options) {
    const url = getEnv("MAKE_OUTBOUND_WEBHOOK_URL");
    if (!url) return { ok: false, status: "failed", message: "MAKE_OUTBOUND_WEBHOOK_URL missing." };
    if (options.dryRun) {
      const res = await fetchJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true, source: "blossom-os", timestamp: new Date().toISOString() }),
      });
      return res.ok
        ? { ok: true, status: "success", message: "Make outbound dry-run ping accepted." }
        : { ok: false, status: "failed", message: res.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, status: "success", message: "Make.com is webhook-first; no pull sync." };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    return {
      eventType: p.event ?? p.type ?? "automation",
      providerEventId: p.id ?? p.scenario_id ?? null,
      normalizedKind: "automation_event",
      metadata: { raw: p, classification: "migration_bridge" },
      record: {
        providerRecordId: p.id ? String(p.id) : null,
        recordKind: "automation_event",
        displayTitle: p.scenario ?? p.event ?? "Make automation",
        occurredAt: p.timestamp ?? new Date().toISOString(),
        sourceLabel: "Make.com (migration bridge)",
        metadata: { scenario: p.scenario, raw: p },
      },
    };
  },
};