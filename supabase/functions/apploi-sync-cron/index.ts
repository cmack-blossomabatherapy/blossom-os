// Scheduled + manual Apploi refresh (pg_cron → pg_net → this function).
//
// Authorization (no anonymous access):
//   1. Scheduled callers must present the server-only APPLOI_CRON_SECRET in
//      the `x-cron-secret` header (pg_cron cannot hold a user JWT).
//   2. Manual "Sync now" callers must present a valid user JWT AND hold a
//      recruiting / HR / admin role, checked server-side.
// Anything else is rejected. The Apploi API key stays server-side and is
// never echoed back; upstream errors are redacted before returning.
import { createClient } from "npm:@supabase/supabase-js@2";
import { getAdapter } from "../_shared/integrations/providerRegistry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("APPLOI_CRON_SECRET") ?? "";
const MIN_INTERVAL_MINUTES = 30;
const MANUAL_INTERVAL_MINUTES = 5;

// Roles allowed to trigger a manual Apploi refresh.
const SYNC_ROLES = [
  "super_admin",
  "admin",
  "systems_admin",
  "hr_admin",
  "hr_team",
  "recruiting_lead",
  "recruiting_coordinator",
  "recruiting_team",
  "recruiting_assistant",
];

/** Constant-time-ish comparison so the secret can't be probed byte-by-byte. */
function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // ---- Authorization -------------------------------------------------
  const presented = req.headers.get("x-cron-secret") ?? "";
  const scheduled = CRON_SECRET.length > 0 && safeEqual(presented, CRON_SECRET);
  let runType: "scheduled" | "manual" = "scheduled";
  let actorId: string | null = null;

  if (!scheduled) {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }
    const token = authHeader.slice(7);
    const { data: claims } = await supabase.auth.getClaims(token);
    const uid = claims?.claims?.sub as string | undefined;
    if (!uid) return json({ ok: false, error: "Unauthorized" }, 401);
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid);
    const allowed = (roleRows ?? []).some((r: { role: string }) => SYNC_ROLES.includes(r.role));
    if (!allowed) return json({ ok: false, error: "Forbidden" }, 403);
    runType = "manual";
    actorId = uid;
  }

  // Throttle: refuse if a run of the same type started too recently.
  const windowMinutes = runType === "manual" ? MANUAL_INTERVAL_MINUTES : MIN_INTERVAL_MINUTES;
  const cutoff = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { data: recent } = await supabase
    .from("integration_sync_runs")
    .select("id,started_at")
    .eq("integration_id", "apploi")
    .eq("run_type", runType)
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
      run_type: runType,
      direction: "inbound",
      status: "running",
      created_by: actorId,
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
