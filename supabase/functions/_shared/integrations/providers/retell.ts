import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";
import { upsertNormalizedRecord } from "../normalizers.ts";

const BASE = "https://api.retellai.com";

export const retellAdapter: ProviderAdapter = {
  id: "retell",
  classification: "ai_voice",
  requiredSecrets: ["RETELL_API_KEY"],
  optionalSecrets: ["RETELL_WEBHOOK_SECRET"],
  capabilities: {
    probe: true,
    pullSync: true,
    webhook: true,
    outboundDisabled: true,
    documentationUrl: "https://docs.retellai.com/",
    operationalState: "ingest_only",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "not_configured", message: `Missing: ${need.missing.join(", ")}` };
    const res = await fetchJson<any>(`${BASE}/list-agents`, {
      headers: { Authorization: `Bearer ${getEnv("RETELL_API_KEY")}` },
    });
    if (!res.ok) {
      console.error("[retell.probe] failed", { httpStatus: res.status, error: res.error });
      return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    }
    const agents = Array.isArray(res.data) ? res.data : (res.data as any)?.data ?? [];
    return {
      ok: true,
      status: "connected",
      message: `Retell reachable (${agents.length} agents)`,
      accountLabel: `${agents.length} agents`,
      details: { agentCount: agents.length },
    };
  },

  async sync(ctx, options) {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "failed", message: `Missing: ${need.missing.join(", ")}` };
    const key = getEnv("RETELL_API_KEY")!;
    const limit = Math.min(options.limit ?? 50, 200);
    const res = await fetchJson<any>(`${BASE}/v2/list-calls`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ limit }),
    });
    if (!res.ok) {
      console.error("[retell.sync] failed", { httpStatus: res.status, error: res.error });
      return { ok: false, status: "failed", message: res.error ?? `HTTP ${res.status}` };
    }
    const calls: any[] = Array.isArray(res.data) ? res.data : (res.data as any)?.data ?? [];
    let created = 0;
    for (const c of calls) {
      const up = await upsertNormalizedRecord(ctx, this.id, {
        providerRecordId: c.call_id ?? c.id,
        recordKind: "call",
        recordStatus: c.call_status ?? c.status ?? null,
        displayTitle: c.from_number ? `Retell call from ${c.from_number}` : "Retell call",
        occurredAt: c.start_timestamp ? new Date(c.start_timestamp).toISOString() : null,
        personPhone: c.from_number ?? null,
        sourceLabel: "Retell AI / After Hours",
        metadata: {
          to_number: c.to_number,
          end_timestamp: c.end_timestamp,
          duration_ms: c.duration_ms,
          transcript: c.transcript ? String(c.transcript).slice(0, 4000) : undefined,
          call_analysis: c.call_analysis,
          agent_id: c.agent_id,
        },
      });
      if (up.ok) created += 1;
    }
    return { ok: true, status: "success", message: `Retell sync ok`, received: calls.length, created };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    const call = p.call ?? p;
    return {
      eventType: p.event ?? p.type ?? null,
      providerEventId: call?.call_id ?? p.id ?? null,
      normalizedKind: "call",
      metadata: { raw: p },
      record: call?.call_id
        ? {
            providerRecordId: call.call_id,
            recordKind: "call",
            recordStatus: call.call_status ?? null,
            displayTitle: call.from_number ? `Retell call from ${call.from_number}` : "Retell call",
            occurredAt: call.start_timestamp ? new Date(call.start_timestamp).toISOString() : null,
            personPhone: call.from_number ?? null,
            sourceLabel: "Retell AI / After Hours",
            metadata: {
              to_number: call.to_number,
              duration_ms: call.duration_ms,
              agent_id: call.agent_id,
              call_analysis: call.call_analysis,
            },
          }
        : null,
    };
  },
};