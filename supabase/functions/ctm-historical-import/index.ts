// ctm-historical-import — safe, checkpointed, resumable read-only import
// of historical CTM calls into ctm_call_events.
//
// Actions (POST body):
//   { action: "start", start_date, end_date, dry_run?: boolean }
//     - Creates a new ctm_import_jobs row and immediately processes up to
//       WORK_BUDGET pages. If more remain, status is left "paused" so the
//       caller can resume.
//   { action: "resume", job_id }
//     - Resumes an existing paused/failed job at cursor_page.
//   { action: "status", job_id }
//     - Read-only status/summary lookup.
//   { action: "cancel", job_id }
//
// INGEST_ONLY:
//   - Never writes back to CTM.
//   - dry_run=true fetches CTM pages and returns counts WITHOUT upserting
//     into ctm_call_events or creating leads.
//   - Explicit user confirmation is enforced by the client (POST is only
//     issued after the confirm-click); the function itself requires an
//     authenticated Blossom user with an admin/intake-ops role.
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
const WORK_BUDGET_PAGES = 20; // ~2000 calls per invocation; keeps under fn timeout.

const ALLOWED_ROLES = [
  "super_admin","admin","operations_leadership","intake_lead","intake_coordinator",
];

function ctmAuth() { return "Basic " + btoa(`${CTM_KEY}:${CTM_SECRET}`); }
function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function requireAllowedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { error: jsonResp({ error: "Unauthorized" }, 401) };
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) return { error: jsonResp({ error: "Unauthorized" }, 401) };
  const userId = userRes.user.id;
  const service = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: roles } = await service.from("user_roles").select("role").eq("user_id", userId);
  const has = (roles ?? []).some((r: { role: string }) => ALLOWED_ROLES.includes(r.role));
  if (!has) return { error: jsonResp({ error: "forbidden" }, 403) };
  return { userId, service };
}

async function fetchPage(startIso: string, endIso: string, page: number) {
  const u = new URL(`https://api.calltrackingmetrics.com/api/v1/accounts/${CTM_ACCOUNT_ID}/calls.json`);
  u.searchParams.set("start_date", startIso);
  u.searchParams.set("end_date", endIso);
  u.searchParams.set("page", String(page));
  u.searchParams.set("per_page", String(PER_PAGE));
  const resp = await fetch(u.toString(), {
    headers: { Authorization: ctmAuth(), Accept: "application/json" },
  });
  return resp;
}

async function processJob(service: ReturnType<typeof createClient>, jobId: string) {
  const { data: job } = await service.from("ctm_import_jobs").select("*").eq("id", jobId).maybeSingle();
  if (!job) return { error: "job_not_found" };
  if (job.status === "completed" || job.status === "cancelled") return { done: true, job };

  const startIso = new Date(job.start_date).toISOString();
  const endIso = new Date(job.end_date).toISOString();

  let page = job.cursor_page || 1;
  let fetched = job.calls_fetched || 0;
  let upserted = job.calls_upserted || 0;
  let duplicate = job.calls_duplicate || 0;
  let linked = job.leads_linked || 0;
  let created = job.leads_created || 0;
  let review = job.review_queued || 0;
  let rateHits = job.rate_limit_hits || 0;
  let lastErr: string | null = null;
  let pagesInThisRun = 0;
  let exhausted = false;

  await service.from("ctm_import_jobs").update({
    status: "running",
    started_at: job.started_at ?? new Date().toISOString(),
  }).eq("id", jobId);

  try {
    while (pagesInThisRun < WORK_BUDGET_PAGES) {
      const resp = await fetchPage(startIso, endIso, page);
      if (resp.status === 429) {
        rateHits += 1;
        // Exponential backoff (max ~8s).
        const wait = Math.min(8000, 500 * Math.pow(2, Math.min(4, rateHits)));
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (!resp.ok) {
        lastErr = `CTM ${resp.status}: ${(await resp.text()).slice(0, 500)}`;
        break;
      }
      const body = await resp.json() as { calls?: Array<Record<string, unknown>>; next_page?: number | null };
      const calls = body.calls ?? [];
      fetched += calls.length;
      pagesInThisRun += 1;

      if (calls.length === 0) { exhausted = true; break; }

      const normalized = calls.map((c) => normalizeCtmPayload(c)).filter((n): n is NonNullable<typeof n> => !!n);

      if (!job.dry_run && normalized.length) {
        const rows = normalized.map((n) => ({
          ctm_call_id: n.ctm_call_id,
          ctm_account_id: n.ctm_account_id ?? CTM_ACCOUNT_ID,
          direction: n.direction, status: n.status,
          from_number: n.from_number, to_number: n.to_number,
          tracking_number: n.tracking_number, caller_name: n.caller_name,
          duration_seconds: n.duration_seconds, talk_time_seconds: n.talk_time_seconds,
          recording_url: n.recording_url, transcript: n.transcript,
          tags: n.tags, source_name: n.source_name, campaign_name: n.campaign_name,
          called_at: n.called_at, raw: n.raw,
        }));
        const { error: upErr } = await service.from("ctm_call_events")
          .upsert(rows, { onConflict: "ctm_call_id" });
        if (upErr) { lastErr = upErr.message; break; }
        upserted += rows.length;

        for (const n of normalized) {
          try {
            const outcome = await linkOrCreateLeadForCall(service as any, n, { resolvedState: null });
            if (outcome.state === "linked_existing") linked += 1;
            else if (outcome.state === "promoted") { created += 1; linked += 1; }
            else if (outcome.state === "ambiguous_review" || outcome.state === "incomplete_review") {
              review += 1;
              const { data: ev } = await service.from("ctm_call_events")
                .select("id").eq("ctm_call_id", n.ctm_call_id).maybeSingle();
              if (ev?.id) {
                await service.from("ctm_unknown_caller_reviews").upsert({
                  ctm_call_event_id: ev.id,
                  ctm_call_id: n.ctm_call_id,
                  reason: outcome.state === "ambiguous_review" ? "ambiguous_phone_match" : outcome.reason ?? "no_lead_match",
                  candidate_lead_ids: outcome.state === "ambiguous_review" ? (outcome as any).candidates ?? [] : [],
                  from_number: n.from_number, tracking_number: n.tracking_number,
                  caller_name: n.caller_name, resolved_state: null, status: "open",
                }, { onConflict: "ctm_call_event_id" });
              }
            }
          } catch (_) { /* per-call errors do not fail the job */ }
        }
      } else if (job.dry_run) {
        // Count would-be dedupes.
        const ids = normalized.map((n) => n.ctm_call_id);
        if (ids.length) {
          const { data: existing } = await service.from("ctm_call_events")
            .select("ctm_call_id").in("ctm_call_id", ids);
          duplicate += (existing ?? []).length;
        }
      }

      // Persist checkpoint every page.
      await service.from("ctm_import_jobs").update({
        cursor_page: (body.next_page ?? page + 1),
        pages_processed: (job.pages_processed || 0) + pagesInThisRun,
        calls_fetched: fetched, calls_upserted: upserted,
        calls_duplicate: duplicate, leads_linked: linked,
        leads_created: created, review_queued: review,
        rate_limit_hits: rateHits,
      }).eq("id", jobId);

      if (!body.next_page) { exhausted = true; break; }
      page = body.next_page;
    }
  } catch (e) {
    lastErr = e instanceof Error ? e.message : String(e);
  }

  const finalStatus = lastErr ? "failed" : exhausted ? "completed" : "paused";
  const { data: updated } = await service.from("ctm_import_jobs").update({
    status: finalStatus,
    cursor_page: page,
    calls_fetched: fetched, calls_upserted: upserted, calls_duplicate: duplicate,
    leads_linked: linked, leads_created: created, review_queued: review,
    rate_limit_hits: rateHits, last_error: lastErr,
    finished_at: (exhausted || lastErr) ? new Date().toISOString() : null,
    summary: {
      dry_run: job.dry_run, pages_in_last_run: pagesInThisRun,
      exhausted, error: lastErr,
    },
  }).eq("id", jobId).select("*").single();

  return { done: exhausted || !!lastErr, job: updated };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const gate = await requireAllowedUser(req);
  if ("error" in gate) return gate.error;
  const { userId, service } = gate;

  if (!CTM_KEY || !CTM_SECRET || !CTM_ACCOUNT_ID) {
    return jsonResp({ error: "CTM credentials not configured" }, 400);
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty */ }
  const action = String(body.action ?? "start");

  if (action === "status") {
    const jobId = String(body.job_id ?? "");
    const { data } = await service.from("ctm_import_jobs").select("*").eq("id", jobId).maybeSingle();
    return jsonResp({ job: data ?? null });
  }

  if (action === "cancel") {
    const jobId = String(body.job_id ?? "");
    await service.from("ctm_import_jobs").update({
      status: "cancelled", finished_at: new Date().toISOString(),
    }).eq("id", jobId);
    return jsonResp({ ok: true });
  }

  if (action === "resume") {
    const jobId = String(body.job_id ?? "");
    const res = await processJob(service, jobId);
    return jsonResp(res);
  }

  // start
  const start_date = String(body.start_date ?? "");
  const end_date = String(body.end_date ?? "");
  const dry_run = Boolean(body.dry_run);
  if (!start_date || !end_date) return jsonResp({ error: "start_date and end_date required" }, 400);
  if (new Date(end_date) < new Date(start_date)) return jsonResp({ error: "end_date must be >= start_date" }, 400);

  const { data: created, error: createErr } = await service.from("ctm_import_jobs").insert({
    requested_by: userId,
    start_date, end_date, dry_run,
    status: "pending", cursor_page: 1,
  }).select("id").single();
  if (createErr) return jsonResp({ error: createErr.message }, 500);

  const res = await processJob(service, created.id);
  return jsonResp({ job_id: created.id, ...res });
});