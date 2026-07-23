// On-demand + scheduled CTM backfill.
// Auth: signed-in admin/intake-ops user. Pulls bounded pages from CTM's API,
// persists every invocation in ctm_sync_runs, checkpoints partial windows, and
// upserts calls using the same normalizer as the webhook.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { normalizeCtmPayload, linkOrCreateLeadForCall } from "../_shared/ctm/normalizer.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CTM_KEY = Deno.env.get("CTM_API_KEY") ?? "";
const CTM_SECRET = Deno.env.get("CTM_API_SECRET") ?? "";
const CTM_ACCOUNT_ID = Deno.env.get("CTM_ACCOUNT_ID") ?? "";

const PER_PAGE = 100;
const PAGE_BUDGET = 3;
const FETCH_TIMEOUT_MS = 10_000;
const LINK_BUDGET = 40;
const RUN_BUDGET_MS = 24_000;
const DEFAULT_WINDOW_DAYS = 30;
const ALLOWED_ROLES = new Set([
  "super_admin",
  "admin",
  "operations_leadership",
  "intake",
  "intake_lead",
  "intake_coordinator",
  "marketing",
  "marketing_growth_lead",
  "marketing_team",
]);

function auth(): string {
  return "Basic " + btoa(`${CTM_KEY}:${CTM_SECRET}`);
}

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function safeMessage(value: unknown): string {
  return String(value instanceof Error ? value.message : value ?? "unknown_error").replace(/[\r\n]+/g, " ").slice(0, 700);
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function getNested(obj: any, path: string): unknown {
  return path.split(".").reduce((acc, key) => (acc && typeof acc === "object" ? acc[key] : undefined), obj);
}

function extractCtmCallsPage(body: unknown, currentPage: number, perPage: number) {
  const raw = (body ?? {}) as any;
  const calls = Array.isArray(raw)
    ? raw
    : Array.isArray(raw.calls)
      ? raw.calls
      : Array.isArray(raw.data)
        ? raw.data
        : Array.isArray(raw.results)
          ? raw.results
          : Array.isArray(raw.records)
            ? raw.records
            : [];

  const explicitNext =
    toNumber(raw.next_page) ??
    toNumber(raw.nextPage) ??
    toNumber(getNested(raw, "pagination.next_page")) ??
    toNumber(getNested(raw, "pagination.nextPage")) ??
    toNumber(getNested(raw, "meta.next_page")) ??
    toNumber(getNested(raw, "meta.nextPage"));
  const totalPages =
    toNumber(raw.total_pages) ??
    toNumber(raw.totalPages) ??
    toNumber(getNested(raw, "pagination.total_pages")) ??
    toNumber(getNested(raw, "pagination.totalPages")) ??
    toNumber(getNested(raw, "meta.total_pages")) ??
    toNumber(getNested(raw, "meta.totalPages"));
  const page =
    toNumber(raw.page) ??
    toNumber(raw.current_page) ??
    toNumber(getNested(raw, "pagination.page")) ??
    toNumber(getNested(raw, "pagination.current_page")) ??
    currentPage;
  const nextPage = explicitNext ?? (totalPages && page < totalPages ? page + 1 : Array.isArray(raw) && calls.length === perPage ? page + 1 : null);
  const shape = Array.isArray(raw)
    ? "array"
    : Array.isArray(raw.calls)
      ? "object.calls"
      : Array.isArray(raw.data)
        ? "object.data"
        : Array.isArray(raw.results)
          ? "object.results"
          : Array.isArray(raw.records)
            ? "object.records"
            : "unknown";
  return { calls: calls as Array<Record<string, unknown>>, nextPage, totalPages, page, shape };
}

async function requireAllowedUser(req: Request, userClient: ReturnType<typeof createClient>, service: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { error: jsonResp({ error: "Unauthorized" }, 401) };
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(authHeader.slice(7));
  if (claimsErr || !claims?.claims?.sub) return { error: jsonResp({ error: "Unauthorized" }, 401) };
  const userId = String(claims.claims.sub);
  const { data: roles } = await service.from("user_roles").select("role").eq("user_id", userId);
  const allowed = (roles ?? []).some((r: { role: string }) => ALLOWED_ROLES.has(r.role));
  if (!allowed) return { error: jsonResp({ error: "forbidden" }, 403) };
  return { userId };
}

async function updateReadiness(service: ReturnType<typeof createClient>, status: "ok" | "partial" | "error", error: string | null, detail: Record<string, unknown>) {
  const now = new Date().toISOString();
  const row = {
    integration_id: "ctm",
    connection_type: "api",
    environment: "production",
    enabled: true,
    status: status === "error" ? "error" : "connected",
    credential_mode: "supabase_secret",
    secret_names: ["CTM_API_KEY", "CTM_API_SECRET", "CTM_ACCOUNT_ID", "CTM_WEBHOOK_TOKEN"],
    last_tested_at: now,
    last_success_at: status === "error" ? undefined : now,
    last_error_at: status === "error" ? now : null,
    last_error: status === "error" ? error : null,
    config: { ingest_only: true, last_sync: detail },
  };
  const { data: updated } = await service
    .from("integration_connections")
    .update(row)
    .eq("integration_id", "ctm")
    .eq("environment", "production")
    .select("id")
    .maybeSingle();
  if (!updated?.id) {
    await service.from("integration_connections").insert(row);
  }
}

async function fetchPage(startIso: string, endIso: string, page: number) {
  const u = new URL(`https://api.calltrackingmetrics.com/api/v1/accounts/${CTM_ACCOUNT_ID}/calls.json`);
  u.searchParams.set("start_date", startIso);
  u.searchParams.set("end_date", endIso);
  u.searchParams.set("page", String(page));
  u.searchParams.set("per_page", String(PER_PAGE));
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(u.toString(), {
      method: "GET",
      headers: { Authorization: auth(), Accept: "application/json" },
      signal: ac.signal,
    });
  } finally {
    clearTimeout(to);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResp({ error: "Unauthorized" }, 401);
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const gate = await requireAllowedUser(req, userClient, supabase);
  if ("error" in gate) return gate.error;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty body ok */ }
  const startedAt = Date.now();

  const runInsert = await supabase.from("ctm_sync_runs")
    .insert({ kind: String(body.kind ?? "backfill"), status: "running", detail: { ingest_only: true } })
    .select("id,started_at")
    .single();
  const runId = runInsert.data?.id as string | undefined;

  let fetched = 0;
  let normalizedCount = 0;
  let upserted = 0;
  let duplicates = 0;
  let linked = 0;
  let reviewQueued = 0;
  let linkErrors = 0;
  let pagesProcessed = 0;
  let drained = false;
  let page = 1;
  let err: string | null = runInsert.error ? safeMessage(runInsert.error.message) : null;
  let startIso = new Date(Date.now() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  let endIso = new Date().toISOString();
  let source = "default_window";
  const pageShapes: string[] = [];

  try {
    if (!runId) throw new Error(err ?? "failed_to_create_sync_run");
    if (!CTM_KEY || !CTM_SECRET || !CTM_ACCOUNT_ID) throw new Error("CTM credentials not configured");

    if (typeof body.start_date === "string" && body.start_date) startIso = new Date(body.start_date).toISOString();
    if (typeof body.end_date === "string" && body.end_date) endIso = new Date(body.end_date).toISOString();

    if (!body.start_date) {
      const { data: partial } = await supabase
        .from("ctm_sync_runs")
        .select("detail,started_at")
        .eq("status", "partial")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const d = (partial?.detail ?? {}) as Record<string, unknown>;
      const nextPage = toNumber(d.next_page);
      if (typeof d.start_date === "string" && nextPage && nextPage > 1 && d.drained === false) {
        startIso = new Date(d.start_date).toISOString();
        endIso = typeof d.end_date === "string" ? new Date(d.end_date).toISOString() : endIso;
        page = nextPage;
        source = "partial_checkpoint";
      } else {
        const { data: lastRun } = await supabase
          .from("ctm_sync_runs")
          .select("finished_at")
          .eq("status", "ok")
          .order("finished_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lastRun?.finished_at) {
          startIso = new Date(lastRun.finished_at).toISOString();
          source = "last_success";
        }
      }
    }

    while (pagesProcessed < PAGE_BUDGET && Date.now() - startedAt < RUN_BUDGET_MS) {
      const resp = await fetchPage(startIso, endIso, page);
      if (!resp.ok) {
        err = `CTM ${resp.status}: ${safeMessage(await resp.text())}`;
        break;
      }
      const raw = await resp.json().catch(() => ({}));
      const parsed = extractCtmCallsPage(raw, page, PER_PAGE);
      const calls = parsed.calls;
      pageShapes.push(parsed.shape);
      fetched += calls.length;
      pagesProcessed++;
      if (calls.length === 0) { drained = true; break; }

      const normalized = calls
        .map((c) => normalizeCtmPayload(c))
        .filter((n): n is NonNullable<typeof n> => n !== null);
      normalizedCount += normalized.length;
      const rows = normalized.map((n) => ({
        ctm_call_id: n.ctm_call_id,
        ctm_account_id: n.ctm_account_id ?? CTM_ACCOUNT_ID,
        direction: n.direction,
        status: n.status,
        from_number: n.from_number,
        to_number: n.to_number,
        tracking_number: n.tracking_number,
        caller_name: n.caller_name,
        duration_seconds: n.duration_seconds,
        talk_time_seconds: n.talk_time_seconds,
        recording_url: n.recording_url,
        transcript: n.transcript,
        tags: n.tags,
        source_name: n.source_name,
        campaign_name: n.campaign_name,
        called_at: n.called_at,
        ended_at: n.ended_at,
        caller_city: n.caller_city,
        caller_state: n.caller_state,
        caller_zip: n.caller_zip,
        raw: n.raw,
      }));

      if (rows.length) {
        const ids = rows.map((r) => r.ctm_call_id);
        const { data: existing } = await supabase
          .from("ctm_call_events")
          .select("ctm_call_id")
          .in("ctm_call_id", ids);
        duplicates += (existing ?? []).length;

        const { error: upErr } = await supabase
          .from("ctm_call_events")
          .upsert(rows, { onConflict: "ctm_call_id" });
        if (upErr) { err = upErr.message; break; }
        upserted += rows.length;

        // INGEST_ONLY-safe linking: shared linker uses provenance table
        // (external CTM id first) then unique E.164 phone match; never
        // creates tasks or communications. Ambiguous => review queue.
        for (const n of normalized) {
          if (linked + reviewQueued + linkErrors >= LINK_BUDGET) break;
          try {
            const outcome = await linkOrCreateLeadForCall(supabase as any, n, {
              resolvedState: null,
            });
            if (outcome.lead_id) linked++;
            else if (outcome.state === "ambiguous_review" || outcome.state === "incomplete_review") reviewQueued++;
            else if (outcome.state === "error") linkErrors++;
          } catch (_e) {
            // Never fail the sync run on a single-call link error.
            linkErrors++;
          }
        }
      }
      if (!parsed.nextPage) { drained = true; break; }
      page = parsed.nextPage;
    }
  } catch (e) {
    err = safeMessage(e);
  }

  const status: "ok" | "partial" | "error" = err ? "error" : (drained ? "ok" : "partial");
  const detail = {
    ingest_only: true,
    source,
    start_date: startIso,
    end_date: endIso,
    next_page: drained ? null : page,
    pages_processed: pagesProcessed,
    page_budget: PAGE_BUDGET,
    fetched,
    normalized: normalizedCount,
    upserted,
    duplicates,
    linked,
    review_queued: reviewQueued,
    link_errors: linkErrors,
    drained,
    response_shapes: Array.from(new Set(pageShapes)),
    duration_ms: Date.now() - startedAt,
  };

  if (runId) {
    await supabase.from("ctm_sync_runs").update({
      status,
      finished_at: new Date().toISOString(),
      calls_fetched: fetched,
      calls_upserted: upserted,
      leads_created: linked,
      error: err,
      detail,
    }).eq("id", runId);
    await updateReadiness(supabase, status, err, { ...detail, run_id: runId });
  }

  return jsonResp({
    ok: !err,
    status,
    run_id: runId ?? null,
    http_status: 200,
    pages: pagesProcessed,
    fetched,
    normalized: normalizedCount,
    upserted,
    duplicates,
    linked,
    review_queued: reviewQueued,
    errors: err ? 1 : 0,
    next_page: drained ? null : page,
    drained,
    error: err,
    detail,
  }, err ? 500 : 200);
});