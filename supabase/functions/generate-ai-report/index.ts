const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are Blossom AI Report Narrator for Blossom ABA Therapy — an operational OS for a multi-state ABA company.
You receive a DETERMINISTIC report computation (KPIs, sections, tables, data-quality flags) already calculated from one or more uploaded CSVs.
Your job is to write NARRATIVE ONLY — never invent numbers, never restate KPIs as different values, never add data not present.

RULES:
- Always call the "write_narrative" tool. Never reply with plain text.
- Use ONLY the numbers/labels/rows provided. If a section is marked "unavailable", explain plainly what column is missing.
- Tailor tone, emphasis, and language to the AUDIENCE role (State Director, Finance, QA, HR, Leadership, etc.).
- Frame everything against the TIMEFRAME provided.
- summary: 2–4 sentence executive summary calling out the headline finding from the KPIs.
- insights: 3–6 top-line operational insights across the whole report (cite numbers from KPIs/sections).
- recommendations: 3–6 concrete, verb-led actions for the audience.
- risks: 0–4 operational risks with severity (omit if truly none).
- sectionNarratives: for EACH provided section id, write a 1–3 sentence narrative and 2–4 insight bullets specific to that section's table/chart.
- Tone: calm, executive, operationally sharp. No fluff. No emojis.`;

const tool = {
  type: "function",
  function: {
    name: "write_narrative",
    description: "Write narrative text to accompany a precomputed operational report.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string" },
        insights: { type: "array", items: { type: "string" } },
        recommendations: { type: "array", items: { type: "string" } },
        risks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              severity: { type: "string", enum: ["low", "med", "high"] },
              note: { type: "string" },
            },
            required: ["label", "severity"],
            additionalProperties: false,
          },
        },
        sectionNarratives: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              narrative: { type: "string" },
              insights: { type: "array", items: { type: "string" } },
            },
            required: ["id", "narrative"],
            additionalProperties: false,
          },
        },
      },
      required: ["summary", "insights"],
      additionalProperties: false,
    },
  },
};

function summarizeComputation(c: any): string {
  if (!c) return "(no computation provided)";
  const lines: string[] = [];
  lines.push(`Preset: ${c.presetTitle || c.presetKey || "custom"}`);
  lines.push(`Total rows: ${c.totalRows ?? "?"} across ${c.totalFiles ?? "?"} file(s)`);
  if (c.dateRange) lines.push(`Date range: ${c.dateRange.min} → ${c.dateRange.max}`);
  if (Array.isArray(c.missingFields) && c.missingFields.length) {
    lines.push(`Missing canonical fields: ${c.missingFields.join(", ")}`);
  }
  if (Array.isArray(c.kpis) && c.kpis.length) {
    lines.push("");
    lines.push("KPIs:");
    for (const k of c.kpis) lines.push(`- ${k.label}: ${k.value}${k.hint ? ` (${k.hint})` : ""}`);
  }
  if (Array.isArray(c.dataQuality) && c.dataQuality.length) {
    lines.push("");
    lines.push("Data quality flags:");
    for (const d of c.dataQuality) lines.push(`- ${d.label}: ${d.detail}${d.rowsAffected ? ` (${d.rowsAffected} rows)` : ""}`);
  }
  if (Array.isArray(c.sections) && c.sections.length) {
    lines.push("");
    lines.push("Sections:");
    for (const s of c.sections) {
      lines.push(`# ${s.id} — ${s.title}`);
      if (s.unavailable) { lines.push(`  UNAVAILABLE: ${s.unavailable}`); continue; }
      if (s.chart && Array.isArray(s.chart.labels)) {
        const labels = s.chart.labels.slice(0, 12).join(", ");
        lines.push(`  Chart (${s.chart.type}) labels: ${labels}`);
        for (const sr of (s.chart.series || []).slice(0, 4)) {
          lines.push(`    - ${sr.name}: [${(sr.data || []).slice(0, 12).join(", ")}]`);
        }
      }
      if (s.table && Array.isArray(s.table.columns)) {
        lines.push(`  Table columns: ${s.table.columns.join(" | ")}`);
        const rows = (s.table.rows || []).slice(0, 15);
        for (const r of rows) lines.push(`    ${r.join(" | ")}`);
      }
    }
  }
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      prompt, audience, timeframe, presetTitle, computation,
    } = body ?? {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    if (!computation) {
      return new Response(JSON.stringify({ error: "Missing 'computation' in payload. Re-upload your CSV(s) and try again." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const compBlock = summarizeComputation(computation);
    const userMsg = [
      presetTitle ? `Report: ${presetTitle}` : "",
      audience ? `Audience role: ${audience}` : "",
      timeframe ? `Timeframe: ${timeframe}` : "",
      `User request: ${prompt || "Write a clear executive narrative for this report."}`,
      ``,
      `=== DETERMINISTIC COMPUTATION (use these numbers verbatim) ===`,
      compBlock,
    ].filter(Boolean).join("\n");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "write_narrative" } },
        max_completion_tokens: 4096,
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
      return new Response(JSON.stringify({ error: `AI gateway error (${resp.status}): ${t.slice(0, 500)}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = call?.function?.arguments;
    if (!argsStr) {
      const finish = data?.choices?.[0]?.finish_reason;
      throw new Error(`No tool call returned (finish_reason: ${finish || "unknown"}).`);
    }
    let narrative;
    try {
      narrative = JSON.parse(argsStr);
    } catch {
      throw new Error("Model returned malformed JSON — likely truncated.");
    }

    return new Response(JSON.stringify({ narrative }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ai-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});