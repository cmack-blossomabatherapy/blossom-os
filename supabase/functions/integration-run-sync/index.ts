// Generic integration sync runner.
// Admin-only. Records every attempt to `integration_sync_runs`.
// For most providers this returns a `not_implemented` run; Retell is wired
// to share logic with the existing retell-sync function via direct invoke.
import { createClient } from "npm:@supabase/supabase-js@2";

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

  // Retell: delegate to existing retell-sync function.
  if (integrationId === "retell") {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/retell-sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await finish("failed", {}, data?.error ?? `HTTP ${res.status}`);
        return json({ ok: false, runId, message: data?.error });
      }
      await finish("success", {
        received: data?.fetched ?? 0,
        created: data?.inserted ?? 0,
      });
      return json({ ok: true, runId, delegated: "retell-sync", data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await finish("failed", {}, msg);
      return json({ ok: false, runId, message: msg }, 500);
    }
  }

  // Resend: report-only. Do not rebuild — surface existing health signal.
  if (integrationId === "resend") {
    const ok = Boolean(Deno.env.get("RESEND_API_KEY"));
    await finish(ok ? "success" : "failed", {}, ok ? undefined : "RESEND_API_KEY missing");
    return json({
      ok,
      runId,
      message: ok
        ? "Resend is in production for invites/welcome/MFA. No incremental sync required."
        : "RESEND_API_KEY not configured",
    });
  }

  // Default: not yet implemented.
  await finish("failed", {}, "Provider sync adapter not implemented in Pass 1");
  return json({
    ok: false,
    runId,
    status: "not_implemented",
    message: `Sync adapter for ${integrationId} is not implemented in Pass 1.`,
  });
});