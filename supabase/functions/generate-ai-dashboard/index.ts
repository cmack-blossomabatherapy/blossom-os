const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are Blossom AI Dashboard Narrator for Blossom ABA Therapy — an operational OS for a multi-state ABA company.
You receive a DETERMINISTIC dashboard computation (KPIs, charts, risks, drilldowns) already calculated from one or more uploaded files.
Your job is to produce executive insights and recommended actions — never invent numbers, never restate KPIs differently.

RULES:
- Always call the "write_dashboard_narrative" tool. Never reply with plain text.
- Use ONLY the numbers/labels provided.
- executiveInsights: 3–6 sharp, executive-level observations citing real KPI values.
- recommendedActions: 3–6 concrete, verb-led next steps for an operations leader.
- title: a clean, contextual dashboard title (max 60 chars) reflecting the data + prompt.
- subtitle: optional 1-line subtitle (timeframe / scope).
- Tone: calm, executive, operationally sharp. No fluff. No emojis. No marketing.`;

const tool = {
  type: "function",
  function: {
    name: "write_dashboard_narrative",
    description: "Produce executive insights, recommended actions, and a title for the dashboard.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        executiveInsights: { type: "array", items: { type: "string" } },
        recommendedActions: { type: "array", items: { type: "string" } },
      },
      required: ["title", "executiveInsights", "recommendedActions"],
      additionalProperties: false,
    },
  },
};

function summarizeSpec(s: any): string {
  if (!s) return "(no spec)";
  const lines: string[] = [];
  lines.push(`Dashboard type: ${s.type}`);
  lines.push(`Rows: ${s.totalRows ?? "?"} across ${s.totalFiles ?? "?"} file(s)`);
  if (s.dateRange) lines.push(`Date range: ${s.dateRange.min} → ${s.dateRange.max}`);
  if (Array.isArray(s.kpis)) {
    lines.push("\nKPIs:");
    for (const k of s.kpis) lines.push(`- ${k.label}: ${k.value}${k.tone && k.tone !== "default" ? ` [${k.tone}]` : ""}`);
  }
  if (Array.isArray(s.risks)) {
    lines.push("\nRisks:");
    for (const r of s.risks) lines.push(`- ${r.title} (severity: ${r.severity}, ${r.rows?.length ?? 0} rows)`);
  }
  if (Array.isArray(s.notes) && s.notes.length) {
    lines.push("\nNotes:");
    for (const n of s.notes) lines.push(`- ${n}`);
  }
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { prompt, spec } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!spec) {
      return new Response(JSON.stringify({ error: "Missing 'spec' in payload." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMsg = [
      `User question: ${prompt || "Build an operational dashboard."}`,
      ``,
      `=== DETERMINISTIC DASHBOARD (use these numbers verbatim) ===`,
      summarizeSpec(spec),
    ].join("\n");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "write_dashboard_narrative" } },
        max_completion_tokens: 2048,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Workspace Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: `AI gateway error (${resp.status})` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const argsStr = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argsStr) throw new Error("No tool call returned");
    const narrative = JSON.parse(argsStr);

    return new Response(JSON.stringify({ narrative }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ai-dashboard error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});