import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * Apploi outbound status push.
 *
 * Drains `apploi_outbound_status_queue`: every recruiting candidate stage
 * change for an Apploi-sourced candidate is queued by a database trigger.
 *
 * Write-back is only attempted when BOTH secrets are present:
 *   APPLOI_WRITE_ENABLED = "true"
 *   APPLOI_APPLICANT_STATUS_PATH  e.g. "/applicants/{id}/status"
 *
 * Until Apploi grants applicant write scope, queued items are marked
 * `blocked_scope` with an explicit reason — nothing is invented or faked.
 */

const BASE = (Deno.env.get("APPLOI_API_BASE_URL") ?? "https://partners.apploi.com").replace(/\/$/, "");
const KEY = Deno.env.get("APPLOI_API_KEY") ?? "";
const TEAM = Deno.env.get("APPLOI_TEAM_ID") ?? "";
const WRITE_ENABLED = (Deno.env.get("APPLOI_WRITE_ENABLED") ?? "").toLowerCase() === "true";
const STATUS_PATH = Deno.env.get("APPLOI_APPLICANT_STATUS_PATH") ?? "";
const BATCH = 50;

function sanitize(msg: string): string {
  let out = msg.replace(/\s+/g, " ").slice(0, 300);
  if (KEY) out = out.split(KEY).join("***");
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    const { data: queued, error } = await supabase
      .from("apploi_outbound_status_queue")
      .select("id, external_candidate_id, to_stage, attempts")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(BATCH);

    if (error) throw new Error(error.message);

    const rows = queued ?? [];
    let sent = 0;
    let blocked = 0;
    let failed = 0;

    for (const row of rows) {
      if (!WRITE_ENABLED || !STATUS_PATH || !KEY) {
        await supabase
          .from("apploi_outbound_status_queue")
          .update({
            status: "blocked_scope",
            last_error:
              "Apploi applicant write scope is not enabled for this partner key. The stage change is recorded and will be pushed once Apploi grants write access.",
            processed_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        blocked += 1;
        continue;
      }

      const path = STATUS_PATH.replace("{id}", encodeURIComponent(row.external_candidate_id));
      let ok = false;
      let detail = "unknown_error";
      try {
        const res = await fetch(`${BASE}${path}`, {
          method: "PATCH",
          headers: { "x-api-key": KEY, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ team_id: TEAM, status: row.to_stage }),
        });
        ok = res.ok;
        if (!ok) detail = `HTTP ${res.status}`;
      } catch (e) {
        detail = e instanceof Error ? e.message : String(e);
      }

      await supabase
        .from("apploi_outbound_status_queue")
        .update({
          status: ok ? "sent" : "failed",
          attempts: (row.attempts ?? 0) + 1,
          last_error: ok ? null : sanitize(detail),
          processed_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (ok) sent += 1;
      else failed += 1;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        processed: rows.length,
        sent,
        blocked,
        failed,
        write_enabled: WRITE_ENABLED && Boolean(STATUS_PATH),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = sanitize(e instanceof Error ? e.message : String(e));
    console.error("apploi-status-push failed:", message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
