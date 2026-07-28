import type { AdapterContext, ProviderAdapter, ProviderSyncResult, SyncOptions } from "../types.ts";
import { getEnv, hasAll } from "../secrets.ts";
import { upsertNormalizedRecord } from "../normalizers.ts";

/**
 * Apploi — recruiting ATS (Partner API). READ-ONLY / INGEST_ONLY.
 *
 * Auth: `x-api-key: <APPLOI_API_KEY>` against https://partners.apploi.com.
 * The key is team-scoped (APPLOI_TEAM_ID); requests for other team ids are
 * rejected upstream with 403.
 *
 * Endpoints actually used (verified live against team 50104):
 *   GET /jobs/search?teams=<team>&include_private=1&size=&page=   → postings
 *   GET /applicants?team_id=<team>&limit=&offset=                 → applicants
 *   GET /applicants/applicant-statuses?team_id=<team>             → status set
 *
 * No endpoint is invented. Nothing is ever written back to Apploi.
 * Upstream bodies are never returned to the client — see `sanitize()`.
 */

const DEFAULT_BASE = "https://partners.apploi.com";
const PAGE_SIZE = 100;
const MAX_PAGES = 60;
const TIMEOUT_MS = 25_000;

function baseUrl() {
  return (getEnv("APPLOI_API_BASE_URL") ?? DEFAULT_BASE).replace(/\/$/, "");
}
function teamId() {
  return getEnv("APPLOI_TEAM_ID") ?? "";
}

/** Strip secrets / upstream payloads out of any operator-visible string. */
function sanitize(msg: string): string {
  const key = getEnv("APPLOI_API_KEY");
  let out = msg.replace(/\s+/g, " ").slice(0, 300);
  if (key) out = out.split(key).join("***");
  return out;
}

interface ApiResult<T> { ok: boolean; status: number; data?: T; error?: string }

async function apploiGet<T>(path: string, params: Record<string, string | number>): Promise<ApiResult<T>> {
  const key = getEnv("APPLOI_API_KEY");
  if (!key) return { ok: false, status: 0, error: "APPLOI_API_KEY missing" };
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const url = `${baseUrl()}${path}?${qs.toString()}`;

  // Retry with exponential backoff on 429 / 5xx / network errors.
  let lastError = "unknown_error";
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { "x-api-key": key, Accept: "application/json" },
        signal: controller.signal,
      });
      const text = await res.text();
      if (res.ok) {
        try {
          return { ok: true, status: res.status, data: JSON.parse(text) as T };
        } catch {
          return { ok: false, status: res.status, error: "invalid_json_from_provider" };
        }
      }
      lastError = `HTTP ${res.status}`;
      if (res.status === 429 || res.status >= 500) continue;
      return { ok: false, status: res.status, error: lastError };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, status: 0, error: sanitize(lastError) };
}

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function splitName(full: string | null): { first: string | null; last: string | null } {
  if (!full) return { first: null, last: null };
  const parts = full.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: null };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

async function syncJobs(ctx: AdapterContext, limitPages: number) {
  let received = 0;
  let created = 0;
  let failed = 0;
  const debug: unknown[] = [];
  for (let page = 0; page < limitPages; page++) {
    const res = await apploiGet<{ data?: any[] }>("/jobs/search", {
      teams: teamId(),
      include_private: 1,
      size: PAGE_SIZE,
      page: page + 1,
    });
    if (!res.ok) return { received, created, failed, error: res.error, debug };
    const rows = res.data?.data ?? [];
    debug.push({ page: page + 1, http: res.status, rows: rows.length, keys: Object.keys(res.data ?? {}) });
    if (rows.length === 0) break;
    for (const j of rows) {
      received += 1;
      const up = await upsertNormalizedRecord(ctx, "apploi", {
        providerRecordId: str(j.id),
        recordKind: "job",
        recordStatus: j.published ? "published" : "unpublished",
        displayTitle: str(j.name) ?? "Job posting",
        occurredAt: str(j.published_date),
        sourceLabel: "Apploi",
        externalUrl: str(j.redirect_apply_url_v2) ?? str(j.external_url),
        metadata: {
          job_id: j.id,
          team_id: j.team_id,
          title: j.name,
          city: j.city,
          state: j.state,
          job_type: j.job_type,
          open_positions: j.open_positions_count,
          filled_positions: j.filled_positions_count,
          owner_email: j.job_owner_email,
          raw: j,
        },
      });
      if (up.ok) created += 1;
      else failed += 1;
    }
    if (rows.length < PAGE_SIZE) break;
  }
  return { received, created, failed, error: undefined as string | undefined, debug };
}

async function syncApplicants(ctx: AdapterContext, maxPages: number) {
  let received = 0;
  let created = 0;
  let failed = 0;
  let total = 0;
  for (let page = 0; page < maxPages; page++) {
    const res = await apploiGet<{ data?: any[]; total?: number }>("/applicants", {
      team_id: teamId(),
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });
    if (!res.ok) return { received, created, failed, total, error: res.error };
    total = res.data?.total ?? total;
    const rows = res.data?.data ?? [];
    if (rows.length === 0) break;
    for (const a of rows) {
      received += 1;
      const fullName = str(a.name) ?? str(a.full_name);
      const parts = splitName(fullName);
      const up = await upsertNormalizedRecord(ctx, "apploi", {
        providerRecordId: str(a.id) ?? str(a.applicant_id),
        recordKind: "candidate",
        recordStatus: str(a.status) ?? str(a.applicant_status) ?? null,
        displayTitle: fullName ?? "Applicant",
        occurredAt: str(a.applied_at) ?? str(a.created_at) ?? str(a.date_applied),
        personName: fullName,
        personEmail: str(a.email),
        personPhone: str(a.phone) ?? str(a.phone_number),
        sourceLabel: str(a.source) ?? "Apploi",
        externalUrl: str(a.profile_url),
        metadata: {
          first_name: str(a.first_name) ?? parts.first,
          last_name: str(a.last_name) ?? parts.last,
          email: str(a.email),
          phone: str(a.phone) ?? str(a.phone_number),
          role: str(a.job_title) ?? str(a.job_name),
          job_id: a.job_id ?? null,
          city: str(a.city),
          state: str(a.state),
          applied_date: str(a.applied_at) ?? str(a.created_at) ?? str(a.date_applied),
          external_status: str(a.status) ?? str(a.applicant_status),
          recruiter: str(a.owner_name) ?? str(a.recruiter),
          profile_url: str(a.profile_url),
          raw: a,
        },
      });
      if (up.ok) created += 1;
      else failed += 1;
    }
    if (rows.length < PAGE_SIZE) break;
  }
  return { received, created, failed, total, error: undefined as string | undefined };
}

export const apploiAdapter: ProviderAdapter = {
  id: "apploi",
  classification: "recruiting_ats",
  requiredSecrets: ["APPLOI_API_KEY", "APPLOI_TEAM_ID"],
  optionalSecrets: ["APPLOI_API_BASE_URL"],
  capabilities: {
    probe: true,
    pullSync: true,
    webhook: true,
    outboundDisabled: true,
    documentationUrl: "https://integrate.apploi.com/reference",
    operationalState: "read_only",
  },

  async probe() {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) {
      return { ok: false, status: "needs_credentials", message: `Missing: ${need.missing.join(", ")}` };
    }
    // Team-scoped authenticated call. A wrong/absent key returns 401/403.
    const statuses = await apploiGet<{ data?: any[] }>("/applicants/applicant-statuses", { team_id: teamId() });
    if (!statuses.ok) {
      return { ok: false, status: "error", message: sanitize(`Apploi auth check failed (${statuses.error})`) };
    }
    const jobs = await apploiGet<{ data?: any[] }>("/jobs/search", {
      teams: teamId(),
      include_private: 1,
      size: 1,
    });
    const statusCount = statuses.data?.data?.length ?? 0;
    return {
      ok: true,
      status: "connected",
      message: `Apploi authenticated for team ${teamId()} — ${statusCount} applicant statuses, jobs endpoint ${jobs.ok ? "reachable" : "unavailable"}.`,
      accountLabel: `Apploi team ${teamId()}`,
      details: { applicant_statuses: statusCount, jobs_reachable: jobs.ok },
    };
  },

  async sync(ctx: AdapterContext, options: SyncOptions): Promise<ProviderSyncResult> {
    const need = hasAll(this.requiredSecrets);
    if (!need.ok) {
      return { ok: false, status: "failed", message: `Missing: ${need.missing.join(", ")}` };
    }
    const pages = options.dryRun ? 1 : MAX_PAGES;

    const jobs = await syncJobs(ctx, pages);
    if (jobs.error) {
      return {
        ok: false,
        status: "failed",
        message: sanitize(`Apploi job sync failed (${jobs.error})`),
        received: jobs.received,
        created: jobs.created,
        failed: jobs.failed,
      };
    }

    const applicants = await syncApplicants(ctx, pages);
    const received = jobs.received + applicants.received;
    const created = jobs.created + applicants.created;
    const failed = jobs.failed + applicants.failed;

    if (applicants.error) {
      return {
        ok: false,
        status: "partial",
        message: sanitize(
          `Synced ${jobs.created} job postings. Applicant sync failed (${applicants.error}).`,
        ),
        received,
        created,
        failed,
        details: { jobs: jobs.created, applicants: 0 },
      };
    }

    // Honest reporting: the partner key may not expose applicant records.
    const applicantNote =
      applicants.received === 0
        ? " Applicants endpoint returned 0 records for this team — the partner API key does not currently expose applicant data (no error returned upstream)."
        : "";

    return {
      ok: true,
      status: applicants.received === 0 ? "partial" : "success",
      message: `Apploi sync complete: ${jobs.created} job postings, ${applicants.created} applicants.${applicantNote}`,
      received,
      created,
      failed,
      details: {
        team_id_configured: Boolean(teamId()),
        jobs_debug: jobs.debug,
        jobs: jobs.created,
        applicants: applicants.created,
        applicants_reported_total: applicants.total,
        applicants_exposed: applicants.received > 0,
      },
    };
  },

  normalizeWebhook(payload) {
    const p = (payload ?? {}) as any;
    return {
      eventType: p.event ?? p.type ?? null,
      providerEventId: p.applicant_id ?? p.candidate_id ?? p.id ?? null,
      normalizedKind: "candidate",
      metadata: { raw: p },
    };
  },
};
