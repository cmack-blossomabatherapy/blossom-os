// Scheduled Apploi refresh (pg_cron → pg_net → this function).
//
// Public entrypoint by necessity (cron cannot hold a user JWT), so it is
// deliberately narrow: it only ever runs the read-only Apploi pull, never
// accepts parameters, and is throttled so it cannot be used to hammer the
// provider. The Apploi API key stays server-side; it is never echoed back.
import { createClient } from "npm:@supabase/supabase-js@2";
import { getAdapter } from "../_shared/integrations/providerRegistry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MIN_INTERVAL_MINUTES = 30;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Throttle: refuse if a run started within the last MIN_INTERVAL_MINUTES.
  const cutoff = new Date(Date.now() - MIN_INTERVAL_MINUTES * 60_000).toISOString();
  const { data: recent } = await supabase
    .from("integration_sync_runs")
    .select("id,started_at")
    .eq("integration_id", "apploi")
    .eq("run_type", "scheduled")
    .gte("started_at", cutoff)
    .limit(1);
  if ((recent ?? []).length > 0) {
    return json({ ok: true, skipped: true, reason: "throttled" });
  }

  const { data: conn } = await supabase
    .from("integration_connections")
    .select("id,status,enabled")
    .eq("integration_id", "apploi")
    .eq("environment", "production")
    .maybeSingle();
  if (!conn || conn.status !== "connected" || conn.enabled === false) {
    return json({ ok: false, skipped: true, reason: "not_connected" });
  }

  const { data: runRow } = await supabase
    .from("integration_sync_runs")
    .insert({
      integration_id: "apploi",
      connection_id: conn.id,
      run_type: "scheduled",
      direction: "inbound",
      status: "running",
    })
    .select("id")
    .single();
  const runId = runRow?.id ?? null;

  const adapter = getAdapter("apploi")!;
  try {
    const result = await adapter.sync({ supabase, runId }, {});
    await supabase
      .from("integration_sync_runs")
      .update({
        status: result.status,
        completed_at: new Date().toISOString(),
        records_received: result.received ?? 0,
        records_created: result.created ?? 0,
        records_updated: result.updated ?? 0,
        records_failed: result.failed ?? 0,
        error_message: result.ok ? null : result.message,
        metadata: (result.details ?? {}) as Record<string, unknown>,
      })
      .eq("id", runId);
    return json({ ok: result.ok, runId, status: result.status, message: result.message });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase
      .from("integration_sync_runs")
      .update({ status: "failed", completed_at: new Date().toISOString(), error_message: msg.slice(0, 300) })
      .eq("id", runId);
    return json({ ok: false, runId, status: "failed", message: "Apploi scheduled sync failed." }, 500);
  }
});
