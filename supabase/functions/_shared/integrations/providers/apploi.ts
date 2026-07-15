import type { ProviderAdapter } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { fetchJson } from "../http.ts";
import { upsertNormalizedRecord } from "../normalizers.ts";

export const apploiAdapter: ProviderAdapter = {
  id: "apploi",
  classification: "recruiting_ats",
  requiredSecrets: ["APPLOI_API_KEY"],
  optionalSecrets: ["APPLOI_API_BASE_URL", "APPLOI_PROBE_PATH"],

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) return { ok: false, status: "not_configured", message: `Missing: ${need.missing.join(", ")}` };
    const baseUrl = getEnv("APPLOI_API_BASE_URL");
    const probePath = getEnv("APPLOI_PROBE_PATH");
    if (!baseUrl || !probePath) {
      return { ok: true, status: "configured_pending_probe_path", message: "Apploi key present; set APPLOI_API_BASE_URL and APPLOI_PROBE_PATH for live probe." };
    }
    const res = await fetchJson(`${baseUrl.replace(/\/$/, "")}${probePath}`, {
      headers: { Authorization: `Bearer ${getEnv("APPLOI_API_KEY")}` },
    });
    if (!res.ok) return { ok: false, status: "error", message: res.error ?? `HTTP ${res.status}` };
    return { ok: true, status: "connected", message: "Apploi probe ok" };
  },

  async sync(ctx, options) {
    const baseUrl = getEnv("APPLOI_API_BASE_URL");
    if (!baseUrl) {
      return { ok: false, status: "failed", message: "configured_pending_probe_path: set APPLOI_API_BASE_URL to enable sync." };
    }
    const candidatesPath = getEnv("APPLOI_CANDIDATES_PATH") ?? "/v1/candidates";
    const limit = Math.min(options.limit ?? 25, 100);
    const res = await fetchJson<any>(`${baseUrl.replace(/\/$/, "")}${candidatesPath}?limit=${limit}`, {
      headers: { Authorization: `Bearer ${getEnv("APPLOI_API_KEY")}` },
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