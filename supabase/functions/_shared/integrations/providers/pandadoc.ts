import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";
import { upsertNormalizedRecord } from "../normalizers.ts";

/**
 * PandaDoc — e-signature / document execution ONLY. Not a source of truth
 * for patients, HR, or clinical data.
 */
export const pandadocAdapter: ProviderAdapter = {
  id: "pandadoc",
  classification: "esignature_only",
  requiredSecrets: ["PANDADOC_API_KEY", "PANDADOC_WEBHOOK_SECRET"],

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "not_configured", message: `Missing: ${need.missing.join(", ")}` };
    const res = await fetchJson(`https://api.pandadoc.com/public/v1/templates?count=1`, {
      headers: { Authorization: `API-Key ${getEnv("PANDADOC_API_KEY")}` },
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return { ok: true, status: "connected", message: "PandaDoc templates probe ok", details: { classification: "esignature_only" } };
  },

  async sync(ctx, options) {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "failed", message: `Missing: ${need.missing.join(", ")}` };
    const limit = Math.min(options.limit ?? 10, 50);
    const res = await fetchJson<any>(`https://api.pandadoc.com/public/v1/documents?count=${limit}&order_by=-date_modified`, {
      headers: { Authorization: `API-Key ${getEnv("PANDADOC_API_KEY")}` },
    });
    if (!res.ok) return { ok: false, status: "failed", message: res.error ?? `HTTP ${res.status}` };
    const docs: any[] = (res.data as any)?.results ?? [];
    let created = 0;
    for (const d of docs) {
      const up = await upsertNormalizedRecord(ctx, this.id, {
        providerRecordId: d.id,
        recordKind: "document",
        recordStatus: d.status,
        displayTitle: d.name,
        occurredAt: d.date_modified ?? d.date_created,
        sourceLabel: "PandaDoc",
        metadata: { template_id: d.template_id, expiration_date: d.expiration_date },
      });
      if (up.ok) created += 1;
    }
    return { ok: true, status: "success", message: `Synced ${created} documents`, received: docs.length, created };
  },

  normalizeWebhook(payload) {
    const events = Array.isArray(payload) ? payload : [payload];
    const first = (events[0] ?? {}) as any;
    const d = first.data ?? {};
    return {
      eventType: first.event ?? null,
      providerEventId: d.id ?? null,
      normalizedKind: "document",
      metadata: { raw: events },
      record: d.id
        ? {
            providerRecordId: d.id,
            recordKind: "document",
            recordStatus: d.status,
            displayTitle: d.name,
            occurredAt: d.date_modified ?? d.date_completed ?? null,
            sourceLabel: "PandaDoc",
            externalUrl: d.metadata?.signed_pdf_url ?? null,
            metadata: { template_id: d.template_id, recipients: d.recipients },
          }
        : null,
    };
  },
};