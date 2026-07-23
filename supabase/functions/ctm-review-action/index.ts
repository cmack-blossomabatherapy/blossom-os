// ctm-review-action — decide on unknown/ambiguous CTM callers.
//
// Actions:
//   { action: "attach", review_id, lead_id, reason? }
//     Attach the CTM call to an existing lead; writes provenance row and
//     updates ctm_call_events.intake_lead_id.
//   { action: "create", review_id, parent_name?, child_name?, state?, reason? }
//     Create a new Lead Captured lead from the CTM call caller data and
//     attach the call.
//   { action: "ignore", review_id, reason }
//     Mark review as ignored (preserves original event; no delete).
//
// Role gate: admin / intake_lead / intake_coordinator / operations_leadership / super_admin.
// INGEST_ONLY: never sends outbound CTM messages/tasks.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { normalizePhoneE164 } from "../_shared/ctm/normalizer.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const ALLOWED_ROLES = [
  "super_admin","admin","operations_leadership","intake_lead","intake_coordinator",
];

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return j({ error: "Unauthorized" }, 401);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) return j({ error: "Unauthorized" }, 401);
  const userId = userRes.user.id;
  const service = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: roles } = await service.from("user_roles").select("role").eq("user_id", userId);
  const allowed = (roles ?? []).some((r: { role: string }) => ALLOWED_ROLES.includes(r.role));
  if (!allowed) return j({ error: "forbidden" }, 403);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty */ }
  const action = String(body.action ?? "");
  const reviewId = String(body.review_id ?? "");
  if (!reviewId) return j({ error: "review_id required" }, 400);

  const { data: review } = await service.from("ctm_unknown_caller_reviews")
    .select("*").eq("id", reviewId).maybeSingle();
  if (!review) return j({ error: "review_not_found" }, 404);
  if (review.status !== "open") return j({ error: "review_already_decided", status: review.status }, 409);

  const { data: callEvent } = await service.from("ctm_call_events")
    .select("id,ctm_call_id,from_number,tracking_number,source_name,caller_state,resolved_state")
    .eq("id", review.ctm_call_event_id).maybeSingle();
  if (!callEvent) return j({ error: "call_event_missing" }, 404);

  const stamp = new Date().toISOString();

  async function attach(leadId: string, kind: "attached" | "created_lead") {
    // 1. Link CTM call event to the lead.
    await service.from("ctm_call_events").update({
      intake_lead_id: leadId,
      matched_lead_id: leadId,
      linked_at: stamp,
    }).eq("id", callEvent!.id);

    // 2. Idempotent provenance row.
    await service.from("intake_lead_source_events").upsert({
      lead_id: leadId,
      integration_id: "ctm",
      provider_event_id: callEvent!.ctm_call_id,
      event_kind: "inbound_call",
      metadata: {
        tracking_number: callEvent!.tracking_number,
        source: callEvent!.source_name,
        reviewed_via: "ctm_review_action",
      },
    }, { onConflict: "integration_id,provider_event_id" });

    // 3. Close review.
    await service.from("ctm_unknown_caller_reviews").update({
      status: kind,
      decided_lead_id: leadId,
      decided_by: userId,
      decided_at: stamp,
      decision_reason: String(body.reason ?? ""),
    }).eq("id", reviewId);
  }

  if (action === "attach") {
    const leadId = String(body.lead_id ?? "");
    if (!leadId) return j({ error: "lead_id required" }, 400);
    const { data: lead } = await service.from("intake_leads").select("id").eq("id", leadId).maybeSingle();
    if (!lead) return j({ error: "lead_not_found" }, 404);
    await attach(leadId, "attached");
    return j({ ok: true, lead_id: leadId, review_id: reviewId });
  }

  if (action === "create") {
    const phone = normalizePhoneE164(callEvent.from_number);
    const insert = {
      parent_name: String(body.parent_name ?? review.caller_name ?? "Unknown caller"),
      child_name: String(body.child_name ?? "Unknown"),
      phone: phone ?? "",
      email: "",
      state: String(body.state ?? review.resolved_state ?? callEvent.caller_state ?? callEvent.resolved_state ?? "Unknown"),
      lead_source: callEvent.source_name ?? "CTM",
      pipeline_stage: "Lead Captured",
      ctm_call_id: callEvent.ctm_call_id,
      source_metadata: {
        integration_id: "ctm",
        provider_record_id: callEvent.ctm_call_id,
        tracking_number: callEvent.tracking_number,
        created_via: "ctm_review_action",
      },
    };
    const { data: created, error: cErr } = await service.from("intake_leads")
      .insert(insert).select("id").single();
    if (cErr || !created) return j({ error: cErr?.message ?? "create_failed" }, 500);
    await attach(created.id, "created_lead");
    return j({ ok: true, lead_id: created.id, review_id: reviewId, created: true });
  }

  if (action === "ignore") {
    const reason = String(body.reason ?? "").trim();
    if (!reason) return j({ error: "reason required" }, 400);
    await service.from("ctm_unknown_caller_reviews").update({
      status: "ignored", decided_by: userId, decided_at: stamp, decision_reason: reason,
    }).eq("id", reviewId);
    return j({ ok: true, review_id: reviewId });
  }

  return j({ error: "unknown_action" }, 400);
});