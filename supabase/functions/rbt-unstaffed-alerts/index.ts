import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date();

  const { data: rules } = await supabase
    .from("rbt_unstaffed_alert_rules")
    .select("*")
    .eq("is_active", true)
    .order("threshold_days");

  const { data: waiting } = await supabase
    .from("rbt_staffing_status")
    .select("employee_id, became_ready_at, status")
    .eq("status", "ready_for_matching");

  let created = 0;
  const results: any[] = [];

  for (const r of waiting ?? []) {
    if (!r.became_ready_at) continue;
    const days = Math.floor((now.getTime() - new Date(r.became_ready_at).getTime()) / 86400000);

    for (const rule of rules ?? []) {
      if (days < rule.threshold_days) continue;

      const { data: existing } = await supabase
        .from("rbt_unstaffed_alerts")
        .select("id")
        .eq("employee_id", r.employee_id)
        .eq("rule_id", rule.id)
        .is("resolved_at", null)
        .maybeSingle();
      if (existing) continue;

      const message =
        rule.message_template?.replace("{days}", String(days)) ??
        `RBT unstaffed for ${days} day${days === 1 ? "" : "s"}`;

      const { error } = await supabase.from("rbt_unstaffed_alerts").insert({
        employee_id: r.employee_id,
        rule_id: rule.id,
        severity: rule.severity ?? "attention",
        days_waiting: days,
        message,
        triggered_at: now.toISOString(),
      });
      if (!error) {
        created += 1;
        results.push({ employee_id: r.employee_id, rule: rule.threshold_days, days });
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, created, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});