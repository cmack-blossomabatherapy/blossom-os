// ctm-retry-event — re-process a failed ctm_webhook_events row.
// Idempotent: re-runs the same normalization/link path against the stored
// payload. Role-gated to admin/intake-ops. INGEST_ONLY safe.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { normalizeCtmPayload, linkOrCreateLeadForCall } from "../_shared/ctm/normalizer.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const ALLOWED_ROLES = [
  "super_admin","admin","operations_leadership","intake_lead","intake_coordinator",
];

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return j({ error: "Unauthorized" }, 401);
  const uc = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: userRes, error: uerr } = await uc.auth.getUser();
  if (uerr || !userRes?.user) return j({ error: "Unauthorized" }, 401);
  const svc = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: roles } = await svc.from("user_roles").select("role").eq("user_id", userRes.user.id);
  if (!(roles ?? []).some((r: { role: string }) => ALLOWED_ROLES.includes(r.role))) return j({ error: "forbidden" }, 403);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty */ }
  const eventId = String(body.event_id ?? "");
  if (!eventId) return j({ error: "event_id required" }, 400);

  const { data: ev } = await svc.from("ctm_webhook_events").select("*").eq("id", eventId).maybeSingle();
  if (!ev) return j({ error: "event_not_found" }, 404);

  const call = normalizeCtmPayload((ev.payload as Record<string, unknown>) ?? {});
  if (!call) {
    await svc.from("ctm_webhook_events").update({
      status: "failed", error: "missing_call_id", attempt_count: (ev.attempt_count ?? 1) + 1,
      processed_at: new Date().toISOString(),
    }).eq("id", eventId);
    return j({ ok: false, error: "missing_call_id" });
  }

  const { data: upserted, error: upErr } = await svc.from("ctm_call_events")
    .upsert(call, { onConflict: "ctm_call_id" }).select("id,intake_lead_id").single();
  if (upErr) {
    await svc.from("ctm_webhook_events").update({
      status: "failed", error: upErr.message, attempt_count: (ev.attempt_count ?? 1) + 1,
      processed_at: new Date().toISOString(),
    }).eq("id", eventId);
    return j({ ok: false, error: upErr.message }, 500);
  }

  let outcome: Awaited<ReturnType<typeof linkOrCreateLeadForCall>> | null = null;
  if (!upserted.intake_lead_id) {
    outcome = await linkOrCreateLeadForCall(svc as any, call, { resolvedState: null });
    if (outcome.lead_id) {
      await svc.from("ctm_call_events").update({
        intake_lead_id: outcome.lead_id, matched_lead_id: outcome.lead_id,
      }).eq("id", upserted.id);
    }
  }

  await svc.from("ctm_webhook_events").update({
    status: "processed", error: null,
    attempt_count: (ev.attempt_count ?? 1) + 1,
    processed_at: new Date().toISOString(),
    linked_call_event_id: upserted.id,
  }).eq("id", eventId);

  return j({ ok: true, call_id: call.ctm_call_id, lead_state: outcome?.state ?? "linked_existing", lead_id: outcome?.lead_id ?? upserted.intake_lead_id ?? null });
});