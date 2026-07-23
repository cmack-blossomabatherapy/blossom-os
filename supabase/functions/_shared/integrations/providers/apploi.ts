import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";
import { upsertNormalizedRecord } from "../normalizers.ts";

/**
 * Apploi — recruiting ATS. Read-only.
 *
 * Auth: Apploi's public API uses the `X-Api-Key: <key>` header. There is
 * no documented Bearer form; do not send an `Authorization` header.
 * Docs: https://developers.apploi.com/
 *
 * INGEST_ONLY: never posts back to Apploi. No candidate endpoint is
 * invented — vendor-confirmed paths must be supplied through
 * `APPLOI_API_BASE_URL` + `APPLOI_CANDIDATES_PATH` / `APPLOI_PROBE_PATH`
 * or probe/sync report `vendor_docs_required` honestly.
 */
export const apploiAdapter: ProviderAdapter = {
  id: "apploi",
  classification: "recruiting_ats",
  requiredSecrets: ["APPLOI_API_KEY"],
  optionalSecrets: [
    "APPLOI_API_BASE_URL",
    "APPLOI_PROBE_PATH",
    "APPLOI_CANDIDATES_PATH",
  ],
  capabilities: {
    probe: true,
    pullSync: true,
    webhook: true,
    outboundDisabled: true,
    documentationUrl: "https://integrate.apploi.com/",
    operationalState: "read_only",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "needs_credentials", message: `Missing: ${need.missing.join(", ")}` };
    const baseUrl = getEnv("APPLOI_API_BASE_URL");
    const probePath = getEnv("APPLOI_PROBE_PATH");
    if (!baseUrl || !probePath) {
      return {
        ok: true,
        status: "vendor_docs_required",
        message:
          "Apploi key present. Vendor-confirmed API base + probe path required (APPLOI_API_BASE_URL, APPLOI_PROBE_PATH). No endpoint is assumed.",
      };
    }
    const res = await fetchJson(`${baseUrl.replace(/\/$/, "")}${probePath}`, {
      headers: { "X-Api-Key": getEnv("APPLOI_API_KEY") ?? "", Accept: "application/json" },
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return { ok: true, status: "connected", message: "Apploi probe ok" };
  },

  async sync(ctx, options) {
    const baseUrl = getEnv("APPLOI_API_BASE_URL");
    const candidatesPath = getEnv("APPLOI_CANDIDATES_PATH");
    if (!baseUrl || !candidatesPath) {
      return {
        ok: false,
        status: "failed",
        message:
          "vendor_docs_required: Apploi has no default candidate endpoint. Supply APPLOI_API_BASE_URL and APPLOI_CANDIDATES_PATH from vendor documentation.",
      };
    }
    const limit = Math.min(options.limit ?? 25, 100);
    const res = await fetchJson<any>(`${baseUrl.replace(/\/$/, "")}${candidatesPath}?limit=${limit}`, {
      headers: { "X-Api-Key": getEnv("APPLOI_API_KEY") ?? "", Accept: "application/json" },
    });
    if (!res.ok) return { ok: false, status: "failed", message: res.error ?? `HTTP ${res.status}` };
    const list: any[] = (res.data as any)?.data ?? (res.data as any)?.candidates ?? [];
    let created = 0;
    for (const c of list) {
      const up = await upsertNormalizedRecord(ctx, this.id, {
        providerRecordId: String(c.id ?? c.candidate_id),
        recordKind: "candidate",
        recordStatus: c.status ?? c.application_status ?? null,
        displayTitle: (c.name ?? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()) || "Candidate",
        occurredAt: c.applied_at ?? c.created_at ?? null,
        personName: c.name ?? null,
        personEmail: c.email ?? null,
        personPhone: c.phone ?? null,
        sourceLabel: c.source ?? "Apploi",
        metadata: { role: c.job_title ?? c.role, interview_status: c.interview_status, offer_status: c.offer_status },
      });
      if (up.ok) created += 1;
    }
    return { ok: true, status: "success", message: `Synced ${created} candidates`, received: list.length, created };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    return {
      eventType: p.event ?? p.type ?? null,
      providerEventId: p.candidate_id ?? p.id ?? null,
      normalizedKind: "candidate",
      metadata: { raw: p },
    };
  },
};