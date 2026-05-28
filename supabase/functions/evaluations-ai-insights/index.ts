import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Gather a compact operational snapshot
    const [staffR, evalsR, perfR, flagsR, goalsR, coachR] = await Promise.all([
      admin.from("evaluation_staff").select("id, first_name, last_name, role, state, supervisor_name, active_status").eq("active_status", true).limit(500),
      admin.from("evaluations").select("id, staff_id, evaluation_type, self_status, leadership_status, meeting_status, final_status, next_review_date, completed_at, created_at").order("created_at", { ascending: false }).limit(800),
      admin.from("evaluation_performance_scores").select("staff_id, overall_score, category, created_at").order("created_at", { ascending: false }).limit(800),
      admin.from("evaluation_risk_flags").select("staff_id, flag_type, severity, resolved").eq("resolved", false).limit(300),
      admin.from("evaluation_goals").select("staff_id, status, due_date").limit(800),
      admin.from("evaluation_coaching_plans").select("staff_id, status").neq("status", "Completed").limit(300),
    ]);

    const snapshot = {
      staff_count: staffR.data?.length ?? 0,
      evaluations: evalsR.data ?? [],
      performance: perfR.data ?? [],
      open_flags: flagsR.data ?? [],
      goals: goalsR.data ?? [],
      coaching: coachR.data ?? [],
      generated_at: new Date().toISOString(),
    };

    const systemPrompt = `You are an operational HR analyst for Blossom ABA Therapy.
Your job is to surface concise, actionable insights for HR and leadership from evaluation data.

Rules:
- Never make employment decisions.
- Never recommend discipline.
- Highlight trends, risks, and high performers operationally.
- Use plain English. No HR jargon.
- Each insight should be useful to act on within a week.
- Severity is one of: "info", "warn", "crit".
- Scope is one of: "company", "state", "staff", "reviewer".
- Recommended action should be 1 short sentence.

Return between 3 and 8 insights total.`;

    const tool = {
      type: "function",
      function: {
        name: "submit_insights",
        description: "Return prioritized operational insights about the evaluation program.",
        parameters: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scope: { type: "string", enum: ["company", "state", "staff", "reviewer"] },
                  severity: { type: "string", enum: ["info", "warn", "crit"] },
                  title: { type: "string" },
                  body: { type: "string" },
                  recommended_action: { type: "string" },
                },
                required: ["scope", "severity", "title", "body", "recommended_action"],
                additionalProperties: false,
              },
            },
          },
          required: ["insights"],
          additionalProperties: false,
        },
      },
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Operational snapshot (JSON):\n${JSON.stringify(snapshot).slice(0, 18000)}` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "submit_insights" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "Lovable AI credits exhausted. Add credits in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiRes.json();
    const call = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : { insights: [] };
    const insights: any[] = Array.isArray(args.insights) ? args.insights : [];

    if (insights.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, insights: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Clear stale (non-dismissed) insights, insert fresh batch
    await admin.from("evaluation_ai_insights").delete().eq("dismissed", false);
    const rows = insights.slice(0, 8).map((i) => ({
      scope: i.scope ?? "company",
      severity: i.severity ?? "info",
      title: String(i.title ?? "").slice(0, 200),
      body: String(i.body ?? "").slice(0, 1200),
      recommended_action: String(i.recommended_action ?? "").slice(0, 400),
      source_data: { snapshot_at: snapshot.generated_at },
    }));
    const { error: insErr } = await admin.from("evaluation_ai_insights").insert(rows);
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ inserted: rows.length, insights: rows }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluations-ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});