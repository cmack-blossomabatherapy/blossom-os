// On-demand + scheduled CTM backfill.
// Auth: signed-in user. Pulls calls from CTM's API since the last run and
// upserts them into ctm_call_events using the same shape as the webhook.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { normalizeCtmPayload, linkOrCreateLeadForCall } from "../_shared/ctm/normalizer.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CTM_KEY = Deno.env.get("CTM_API_KEY") ?? "";
const CTM_SECRET = Deno.env.get("CTM_API_SECRET") ?? "";
const CTM_ACCOUNT_ID = Deno.env.get("CTM_ACCOUNT_ID") ?? "";

function auth(): string {
  return "Basic " + btoa(`${CTM_KEY}:${CTM_SECRET}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(authHeader.slice(7));
  if (claimsErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!CTM_KEY || !CTM_SECRET || !CTM_ACCOUNT_ID) {
    return new Response(JSON.stringify({ error: "CTM credentials not configured" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const runInsert = await supabase.from("ctm_sync_runs")
    .insert({ kind: "backfill", status: "running" })
    .select("id,started_at")
    .single();
  const runId = runInsert.data?.id;

  // Since = last successful sync, or 30 days.
  const { data: lastRun } = await supabase
    .from("ctm_sync_runs")
    .select("finished_at")
    .eq("status", "ok")
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const since = new Date(lastRun?.finished_at ?? Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();

  let fetched = 0;
  let upserted = 0;
  let linked = 0;
  let page = 1;
  const perPage = 100;
  const PAGE_BUDGET = 5; // cap pages per invocation to stay under CPU limit
  const FETCH_TIMEOUT_MS = 15_000;
  let pagesProcessed = 0;
  let drained = false;
  let err: string | null = null;

  try {
    while (true) {
      if (pagesProcessed >= PAGE_BUDGET) break;
      const u = new URL(`https://api.calltrackingmetrics.com/api/v1/accounts/${CTM_ACCOUNT_ID}/calls.json`);
      u.searchParams.set("start_date", sinceIso);
      u.searchParams.set("page", String(page));
      u.searchParams.set("per_page", String(perPage));
      const ac = new AbortController();
      const to = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
      let resp: Response;
      try {
        resp = await fetch(u.toString(), {
          headers: { Authorization: auth(), Accept: "application/json" },
          signal: ac.signal,
        });
      } finally {
        clearTimeout(to);
      }
      if (!resp.ok) {
        err = `CTM ${resp.status}: ${await resp.text()}`;
        break;
      }
      const body = await resp.json() as { calls?: Array<Record<string, unknown>>, next_page?: number | null };
      const calls = body.calls ?? [];
      fetched += calls.length;
      pagesProcessed++;
      if (calls.length === 0) { drained = true; break; }

      // Shared normalizer — identical shape to ctm-webhook. Never re-derive
      // fields locally; single source of truth.
      const normalized = calls
        .map((c) => normalizeCtmPayload(c))
        .filter((n): n is NonNullable<typeof n> => n !== null);
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
        raw: n.raw,
      }));

      if (rows.length) {
        const { error: upErr, count } = await supabase
          .from("ctm_call_events")
          .upsert(rows, { onConflict: "ctm_call_id", count: "exact" });
        if (upErr) { err = upErr.message; break; }
        upserted += count ?? rows.length;

        // INGEST_ONLY-safe linking: shared linker uses provenance table
        // (external CTM id first) then unique E.164 phone match; never
        // creates tasks or communications. Ambiguous => review queue.
        for (const n of normalized) {
          try {
            const outcome = await linkOrCreateLeadForCall(supabase as any, n, {
              resolvedState: null,
            });
            if (outcome.lead_id) linked++;
          } catch (_) {
            // Never fail the sync run on a single-call link error.
          }
        }
      }
      if (!body.next_page) { drained = true; break; }
      page = body.next_page;
    }
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
  }

  if (runId) {
    await supabase.from("ctm_sync_runs").update({
      status: err ? "error" : (drained ? "ok" : "partial"),
      finished_at: new Date().toISOString(),
      calls_fetched: fetched,
      calls_upserted: upserted,
      error: err,
    }).eq("id", runId);
  }

  return new Response(JSON.stringify({ ok: !err, fetched, upserted, linked, pagesProcessed, drained, error: err }), {
    status: err ? 500 : 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});