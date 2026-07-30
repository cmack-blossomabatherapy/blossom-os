// Apploi applicant-scope diagnostic — SUPER ADMIN ONLY.
//
// Answers one question truthfully: does the Apploi partner API key currently
// expose applicant records, and if not, exactly why. Runs live, read-only
// probes against the Apploi Partner API. The API key never leaves the server
// and is never echoed back; upstream errors are redacted.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DEFAULT_BASE = "https://partners.apploi.com";
const TIMEOUT_MS = 15000;

const ALLOWED_ROLES = ["super_admin", "systems_admin"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function apiKey() { return Deno.env.get("APPLOI_API_KEY") ?? ""; }
function teamId() { return Deno.env.get("APPLOI_TEAM_ID") ?? ""; }
function baseUrl() { return (Deno.env.get("APPLOI_API_BASE_URL") ?? DEFAULT_BASE).replace(/\/$/, ""); }

function redact(msg: string): string {
  const key = apiKey();
  let out = String(msg).replace(/\s+/g, " ").slice(0, 400);
  if (key) out = out.split(key).join("***");
  return out;
}

interface Probe {
  endpoint: string;
  httpStatus: number | null;
  ok: boolean;
  recordCount: number | null;
  reportedTotal: number | null;
  error: string | null;
  bodySnippet: string | null;
}

async function probe(path: string, params: Record<string, string | number>): Promise<Probe> {
  const key = apiKey();
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const endpoint = `${path}?${qs.toString()}`;
  if (!key) {
    return { endpoint, httpStatus: null, ok: false, recordCount: null, reportedTotal: null, error: "APPLOI_API_KEY missing", bodySnippet: null };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl()}${endpoint}`, {
      headers: { "x-api-key": key, Accept: "application/json" },
      signal: controller.signal,
    });
    const text = await res.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* non-JSON upstream */ }
    const rows = Array.isArray(parsed?.data) ? parsed.data : Array.isArray(parsed) ? parsed : null;
    return {
      endpoint,
      httpStatus: res.status,
      ok: res.ok,
      recordCount: rows ? rows.length : null,
      reportedTotal: typeof parsed?.total === "number" ? parsed.total : null,
      error: res.ok ? null : `HTTP ${res.status}`,
      bodySnippet: res.ok ? null : redact(text).slice(0, 240),
    };
  } catch (e) {
    return {
      endpoint, httpStatus: null, ok: false, recordCount: null, reportedTotal: null,
      error: redact(e instanceof Error ? e.message : String(e)), bodySnippet: null,
    };
  } finally {
    clearTimeout(timer);
  }
}

type Scope = "granted" | "blocked" | "unknown";

function diagnose(statuses: Probe, applicants: Probe, jobs: Probe): {
  scope: Scope; reasonCode: string; reason: string; nextStep: string;
} {
  if (!apiKey() || !teamId()) {
    return {
      scope: "blocked",
      reasonCode: "missing_credentials",
      reason: `Apploi credentials are not fully configured (${!apiKey() ? "APPLOI_API_KEY" : "APPLOI_TEAM_ID"} is missing).`,
      nextStep: "Add the missing Apploi credential in project secrets, then re-run this check.",
    };
  }
  if (applicants.httpStatus === 401) {
    return {
      scope: "blocked",
      reasonCode: "unauthorized",
      reason: "Apploi rejected the partner key on the /applicants endpoint (HTTP 401 Unauthorized). The key is invalid, expired, or revoked.",
      nextStep: "Ask Apploi to reissue the partner key, then update APPLOI_API_KEY.",
    };
  }
  if (applicants.httpStatus === 403) {
    return {
      scope: "blocked",
      reasonCode: "forbidden_scope",
      reason: "Apploi returned HTTP 403 Forbidden on /applicants. The partner key authenticates successfully but has not been granted applicant (candidate) scope for this team.",
      nextStep: `Ask your Apploi partner contact to enable applicant read scope for team ${teamId()} on this partner key.`,
    };
  }
  if (applicants.httpStatus === 404) {
    return {
      scope: "blocked",
      reasonCode: "endpoint_not_available",
      reason: "Apploi returned HTTP 404 for /applicants. The applicant endpoint is not enabled on this partner account.",
      nextStep: "Ask Apploi to enable the applicants endpoint for this partner integration.",
    };
  }
  if (applicants.httpStatus === 429) {
    return {
      scope: "unknown",
      reasonCode: "rate_limited",
      reason: "Apploi rate-limited the check (HTTP 429), so applicant scope could not be confirmed right now.",
      nextStep: "Wait a few minutes and re-run this check.",
    };
  }
  if (!applicants.ok) {
    return {
      scope: "unknown",
      reasonCode: "upstream_error",
      reason: `The /applicants probe did not complete (${applicants.error ?? "unknown error"}).`,
      nextStep: "Re-run the check. If it keeps failing, share the diagnostic below with Apploi support.",
    };
  }
  if ((applicants.recordCount ?? 0) > 0) {
    return {
      scope: "granted",
      reasonCode: "applicants_exposed",
      reason: `Apploi returned applicant records for team ${teamId()} — the partner key has applicant scope.`,
      nextStep: "No action needed. Applicant sync will import these records.",
    };
  }
  // 200 OK but empty.
  const statusesWork = statuses.ok && (statuses.recordCount ?? 0) > 0;
  return {
    scope: "blocked",
    reasonCode: statusesWork ? "silently_empty_scope" : "empty_no_metadata",
    reason: statusesWork
      ? `Apploi accepted the request (HTTP 200) but returned 0 applicants for team ${teamId()}, while applicant status metadata is readable. This is Apploi's signature for a partner key that is authenticated but not provisioned to return applicant records — no error is raised upstream.`
      : `Apploi returned HTTP 200 with 0 applicants and no applicant status metadata for team ${teamId()}. Applicant data is not exposed to this partner key.`,
    nextStep: `Ask Apploi to provision applicant record access for team ${teamId()} on this partner key. Job postings (${jobs.ok ? `${jobs.recordCount ?? 0} reachable` : "unreachable"}) are unaffected.`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }
  const { data: claims } = await supabase.auth.getClaims(authHeader.slice(7));
  const uid = claims?.claims?.sub as string | undefined;
  if (!uid) return json({ ok: false, error: "Unauthorized" }, 401);

  const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", uid);
  const allowed = (roleRows ?? []).some((r: { role: string }) => ALLOWED_ROLES.includes(r.role));
  if (!allowed) return json({ ok: false, error: "Forbidden" }, 403);

  const credentials = {
    apiKeyConfigured: !!apiKey(),
    teamIdConfigured: !!teamId(),
    teamId: teamId() || null,
    baseUrl: baseUrl(),
  };

  const [statuses, applicants, jobs] = await Promise.all([
    probe("/applicants/applicant-statuses", { team_id: teamId() }),
    probe("/applicants", { team_id: teamId(), limit: 1, offset: 0 }),
    probe("/jobs/search", { teams: teamId(), include_private: 1, size: 1 }),
  ]);

  const verdict = diagnose(statuses, applicants, jobs);

  return json({
    ok: true,
    checkedAt: new Date().toISOString(),
    credentials,
    ...verdict,
    probes: { applicantStatuses: statuses, applicants, jobs },
  });
});
