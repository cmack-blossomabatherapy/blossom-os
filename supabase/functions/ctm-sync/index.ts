// On-demand + scheduled CTM backfill.
// Auth: signed-in user. Pulls calls from CTM's API since the last run and
// upserts them into ctm_call_events using the same shape as the webhook.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

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
  let page = 1;
  const perPage = 100;
  let err: string | null = null;

  try {
    while (true) {
      const u = new URL(`https://api.calltrackingmetrics.com/api/v1/accounts/${CTM_ACCOUNT_ID}/calls.json`);
      u.searchParams.set("start_date", sinceIso);
      u.searchParams.set("page", String(page));
      u.searchParams.set("per_page", String(perPage));
      const resp = await fetch(u.toString(), { headers: { Authorization: auth(), Accept: "application/json" } });
      if (!resp.ok) {
        err = `CTM ${resp.status}: ${await resp.text()}`;
        break;
      }
      const body = await resp.json() as { calls?: Array<Record<string, unknown>>, next_page?: number | null };
      const calls = body.calls ?? [];
      fetched += calls.length;
      if (calls.length === 0) break;

      const rows = calls.map((c) => ({
        ctm_call_id: String(c.id ?? c.call_id ?? ""),
        ctm_account_id: String(c.account_id ?? CTM_ACCOUNT_ID),
        direction: (c.direction as string) ?? null,
        status: (c.call_status as string) ?? (c.status as string) ?? null,
        from_number: (c.caller_number as string) ?? null,
        to_number: (c.called_number as string) ?? null,
        tracking_number: (c.tracking_number as string) ?? null,
        caller_name: (c.caller_name as string) ?? null,
        duration_seconds: Number(c.duration ?? 0) || null,
        talk_time_seconds: Number(c.talk_time ?? 0) || null,
        recording_url: (c.audio as string) ?? (c.recording as string) ?? null,
        transcript: (c.transcription as string) ?? null,
        tags: Array.isArray(c.tags) ? (c.tags as unknown[]).map(String) : [],
        source_name: (c.source_name as string) ?? (c.source as string) ?? null,
        campaign_name: (c.campaign_name as string) ?? (c.campaign as string) ?? null,
        called_at: (c.called_at as string) ?? (c.start_time as string) ?? null,
        raw: c,
      })).filter((r) => r.ctm_call_id);

      if (rows.length) {
        const { error: upErr, count } = await supabase
          .from("ctm_call_events")
          .upsert(rows, { onConflict: "ctm_call_id", count: "exact" });
        if (upErr) { err = upErr.message; break; }
        upserted += count ?? rows.length;
      }
      if (!body.next_page) break;
      page = body.next_page;
      if (page > 50) break; // hard cap per run
    }
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
  }

  if (runId) {
    await supabase.from("ctm_sync_runs").update({
      status: err ? "error" : "ok",
      finished_at: new Date().toISOString(),
      calls_fetched: fetched,
      calls_upserted: upserted,
      error: err,
    }).eq("id", runId);
  }

  return new Response(JSON.stringify({ ok: !err, fetched, upserted, error: err }), {
    status: err ? 500 : 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});