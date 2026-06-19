// Generic integration sync runner.
// Admin-only. Delegates to provider adapters. No required provider returns
// `not_implemented` anymore — adapters report honest pending/failed status
// when a vendor endpoint or extra env var is required.
import { createClient } from "npm:@supabase/supabase-js@2";
import { getAdapter } from "../_shared/integrations/providerRegistry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return (data ?? []).some((r: any) =>
    ["super_admin", "admin", "systems_admin"].includes(r.role),
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ error: "Unauthorized" }, 401);
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data: userData } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (!user) return json({ error: "Unauthorized" }, 401);
  if (!(await isAdmin(supabase, user.id))) return json({ error: "Forbidden" }, 403);

  let body: any = {};
  try {
    body = await req.json();
  } catch (_) {
    /* allow empty */
  }
  const integrationId: string | undefined = body?.integrationId;
  const connectionId: string | undefined = body?.connectionId;
  if (!integrationId) return json({ error: "integrationId required" }, 400);

  // Open a run row.
  const { data: runRow, error: runErr } = await supabase
    .from("integration_sync_runs")
    .insert({
      integration_id: integrationId,
      connection_id: connectionId ?? null,
      run_type: "manual",
      direction: "inbound",
      status: "running",
      created_by: user.id,
    })
    .select("id")
    .single();
  if (runErr) return json({ error: runErr.message }, 500);
  const runId = runRow.id;

  const finish = async (
    status: "success" | "partial" | "failed",
    counts: { received?: number; created?: number; updated?: number; failed?: number },
    error?: string,
  ) => {
    await supabase
      .from("integration_sync_runs")
      .update({
        status,
        completed_at: new Date().toISOString(),
        records_received: counts.received ?? 0,
        records_created: counts.created ?? 0,
        records_updated: counts.updated ?? 0,
        records_failed: counts.failed ?? 0,
        error_message: error ?? null,
      })
      .eq("id", runId);
  };

  const adapter = getAdapter(integrationId);
  if (!adapter) {
    await finish("failed", {}, "no_adapter_registered");
    return json({ ok: false, runId, status: "failed", message: `No provider adapter registered for ${integrationId}.` });
  }

  try {
    const result = await adapter.sync(
      { supabase, runId },
      {
        mode: body?.mode,
        since: body?.since,
        limit: body?.limit,
        dryRun: Boolean(body?.dryRun),
      },
    );
    await finish(result.status, {
      received: result.received,
      created: result.created,
      updated: result.updated,
      failed: result.failed,
    }, result.ok ? undefined : result.message);
    return json({ ok: result.ok, runId, status: result.status, message: result.message, details: result.details ?? null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await finish("failed", {}, msg);
    return json({ ok: false, runId, status: "failed", message: msg }, 500);
  }
});