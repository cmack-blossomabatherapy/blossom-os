// Re-links a CTM call event to the matching intake lead, client, employee,
// and dial-intent (agent). Idempotent — safe to invoke multiple times.
// Callable from ctm-webhook (fire-and-forget) or admin backfill.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function digitsOnly(v: string | null | undefined): string {
  if (!v) return "";
  return String(v).replace(/[^\d]/g, "");
}
function variants(v: string | null | undefined): string[] {
  const d = digitsOnly(v);
  if (d.length < 10) return [];
  const bare = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  const e164 = `+1${bare}`;
  return Array.from(new Set([e164, bare, `1${bare}`, `+${bare}`]));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let body: { call_event_id?: string; ctm_call_id?: string; limit?: number } = {};
  try { body = await req.json(); } catch (_) { /* ignore */ }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  let query = supabase
    .from("ctm_call_events")
    .select("id,ctm_call_id,direction,from_number,to_number,called_at,matched_lead_id,matched_client_id,matched_employee_id,matched_agent_user_id,intake_lead_id,status");
  if (body.call_event_id) query = query.eq("id", body.call_event_id);
  else if (body.ctm_call_id) query = query.eq("ctm_call_id", body.ctm_call_id);
  else query = query.is("linked_at", null).order("called_at", { ascending: false, nullsFirst: false }).limit(body.limit ?? 100);

  const { data: events, error } = await query;
  if (error) {
    console.error("ctm-link-call load failed", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let linked = 0;
  let missedTasks = 0;
  for (const ev of events ?? []) {
    const isOutbound = ev.direction?.toLowerCase().startsWith("out");
    const externalNumber = isOutbound ? ev.to_number : ev.from_number;
    const nums = variants(externalNumber);
    if (nums.length === 0) continue;

    const update: Record<string, unknown> = { linked_at: new Date().toISOString() };

    if (!ev.matched_lead_id) {
      const or = nums.flatMap((n) => [`phone.eq.${n}`, `parent_cell_phone.eq.${n}`, `home_phone.eq.${n}`]).join(",");
      const { data: lead } = await supabase.from("intake_leads").select("id").or(or).limit(1).maybeSingle();
      if (lead?.id) update.matched_lead_id = lead.id;
    }

    if (!ev.matched_client_id) {
      const or = nums.flatMap((n) => [`primary_phone.eq.${n}`, `parent_phone.eq.${n}`]).join(",");
      const { data: client } = await supabase.from("clients").select("id").or(or).limit(1).maybeSingle().then(
        (r) => r,
        () => ({ data: null }),
      );
      if (client?.id) update.matched_client_id = client.id;
    }

    if (!ev.matched_employee_id) {
      const or = nums.flatMap((n) => [`work_phone.eq.${n}`, `personal_phone.eq.${n}`]).join(",");
      const { data: emp } = await supabase.from("employees").select("id,user_id").or(or).limit(1).maybeSingle().then(
        (r) => r,
        () => ({ data: null }),
      );
      if (emp?.id) update.matched_employee_id = emp.id;
    }

    if (isOutbound && !ev.matched_agent_user_id) {
      const windowStart = ev.called_at ? new Date(new Date(ev.called_at).getTime() - 120_000).toISOString() : null;
      const windowEnd = ev.called_at ? new Date(new Date(ev.called_at).getTime() + 60_000).toISOString() : null;
      let dq = supabase
        .from("phone_dial_events")
        .select("id,user_id,dialed_at")
        .in("target_number_e164", nums)
        .order("dialed_at", { ascending: false })
        .limit(1);
      if (windowStart) dq = dq.gte("dialed_at", windowStart);
      if (windowEnd) dq = dq.lte("dialed_at", windowEnd);
      const { data: dial } = await dq.maybeSingle();
      if (dial?.id) {
        update.linked_dial_event_id = dial.id;
        update.matched_agent_user_id = dial.user_id;
      }
    }

    await supabase.from("ctm_call_events").update(update).eq("id", ev.id);

    const leadId = (update.matched_lead_id as string | undefined) ?? ev.matched_lead_id ?? ev.intake_lead_id;
    if (leadId) {
      const { data: exists } = await supabase
        .from("intake_communications")
        .select("id").eq("lead_id", leadId).ilike("preview", `%CTM:${ev.ctm_call_id}%`).limit(1).maybeSingle();
      if (!exists) {
        await supabase.from("intake_communications").insert({
          lead_id: leadId,
          communication_type: "phone",
          direction: ev.direction ?? "inbound",
          subject: `CTM call ${isOutbound ? "→" : "←"} ${externalNumber ?? ""}`,
          preview: `Status: ${ev.status ?? "unknown"} · CTM:${ev.ctm_call_id}`,
        });
      }

      const missed = ev.status?.toLowerCase().includes("miss") || ev.status?.toLowerCase().includes("voicemail");
      if (missed) {
        const { data: taskExists } = await supabase
          .from("intake_tasks").select("id").eq("lead_id", leadId).ilike("title", `%CTM:${ev.ctm_call_id}%`).limit(1).maybeSingle();
        if (!taskExists) {
          await supabase.from("intake_tasks").insert({
            lead_id: leadId,
            title: `Return missed call · CTM:${ev.ctm_call_id}`,
            status: "open",
          });
          missedTasks++;
        }
      }
    }

    linked++;
  }

  return new Response(JSON.stringify({ ok: true, processed: events?.length ?? 0, linked, missed_tasks: missedTasks }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
