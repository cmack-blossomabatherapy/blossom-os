import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";
import { upsertNormalizedRecord } from "../normalizers.ts";

export const ctmAdapter: ProviderAdapter = {
  id: "ctm",
  classification: "call_tracking",
  requiredSecrets: ["CTM_API_KEY", "CTM_WEBHOOK_SECRET"],
  optionalSecrets: ["CTM_API_BASE_URL", "CTM_ACCOUNT_ID", "CTM_PROBE_PATH"],
  capabilities: {
    probe: true,
    pullSync: true,
    webhook: true,
    outboundDisabled: true,
    documentationUrl: "https://developers.calltrackingmetrics.com/",
    // CTM stays INGEST_ONLY — live inbound calls flow via ctm-webhook.
    operationalState: "ingest_only",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "not_configured", message: `Missing: ${need.missing.join(", ")}` };
    const baseUrl = getEnv("CTM_API_BASE_URL");
    const probePath = getEnv("CTM_PROBE_PATH");
    if (!baseUrl || !probePath) {
      return {
        ok: true,
        status: "configured_pending_probe_path",
        message: "CTM creds present; set CTM_API_BASE_URL and CTM_PROBE_PATH to enable live probe.",
      };
    }
    const res = await fetchJson(`${baseUrl.replace(/\/$/, "")}${probePath}`, {
      headers: { Authorization: `Bearer ${getEnv("CTM_API_KEY")}` },
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return { ok: true, status: "connected", message: "CTM probe ok", details: { httpStatus: res.status } };
  },

  async sync() {
    const baseUrl = getEnv("CTM_API_BASE_URL");
    if (!baseUrl) {
      return {
        ok: false,
        status: "failed",
        message: "configured_pending_probe_path: set CTM_API_BASE_URL to enable pull sync. Inbound calls are captured via webhook.",
      };
    }
    return { ok: true, status: "success", message: "CTM is primarily webhook-driven; pull sync is a no-op when base URL set." };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    const callId = p.call_id ?? p.id ?? null;
    return {
      eventType: p.type ?? p.event ?? "call",
      providerEventId: callId,
      normalizedKind: "call",
      metadata: { raw: p },
      record: callId
        ? {
            providerRecordId: String(callId),
            recordKind: "call",
            recordStatus: p.call_status ?? p.status ?? null,
            displayTitle: p.caller_name ?? p.caller_number ?? p.tracking_number ?? "CTM call",
            occurredAt: p.called_at ?? p.start_time ?? null,
            personName: p.caller_name ?? null,
            personPhone: p.caller_number ?? null,
            externalUrl: p.recording_url ?? null,
            sourceLabel: p.source ?? p.campaign ?? "CTM",
            metadata: {
              tracking_number: p.tracking_number,
              duration: p.duration,
              campaign: p.campaign,
              source: p.source,
            },
          }
        : null,
    };
  },
};