const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are Blossom AI Report Builder for Blossom ABA Therapy — an operational OS for a multi-state ABA company.
You receive ONE OR MORE CSV previews (each with its own filename, columns, and row count), a user prompt, audience role, timeframe, primary breakdown, decision goal, comparison mode, and optional filters.
Build a PREMIUM DRILL-DOWN OPERATIONAL DASHBOARD — not a single chart. Think "executive command center": multiple sections, each answering a specific operational question, each with its own narrative, chart, and breakdown table.

RULES:
- Always call the "build_report" tool. Never reply with plain text.
- When multiple CSVs are provided, treat them as related sources for the SAME report. Identify the entity each file describes (e.g. sessions, authorizations, staff roster, cancellations), join them conceptually by obvious keys (client id, BCBA name, date), and let sections combine signals across files. Call out cross-file findings explicitly in narratives.
- If a file is clearly unrelated to the others, still surface it as its own section rather than ignore it.
- Tailor depth, KPIs, and language to the AUDIENCE role (e.g. a State Director cares about staffing/auths in their state; Finance cares about utilization $/hours; QA cares about supervision %, PR overdue; HR cares about turnover, onboarding; Leadership cares about trends and risk).
- Frame everything against the TIMEFRAME provided.
- Make the PRIMARY BREAKDOWN dimension the spine of the report (e.g. by BCBA, by State, by Payor) — at least one section must group by it.
- Use the GOAL to decide which sections to include — every section should help the user make that decision.
- If COMPARISON is provided (e.g. vs previous period, vs target), surface deltas in KPIs and call out movement in insights.
- Numbers MUST be derived from the provided CSV previews — never invent. If a file is sparse or only partially shown, say so plainly in the summary and still produce a useful structural report.
- Build 3–6 SECTIONS. Each section: a tight title, 1–3 sentence narrative, a chart (bar/line/area/pie/stacked-bar), an optional drill-down table (<= 15 rows), and 2–4 insight bullets specific to that section.
- Produce 4–8 KPIs at the top (most operationally relevant — not vanity metrics).
- Produce 3–6 RECOMMENDATIONS (concrete next actions, verb-led, owner-implied).
- Produce 1–4 RISKS with severity. Skip if truly none.
- Tone: calm, executive, operationally sharp. No fluff. No emojis.
- Title must be specific to the request, not generic.`;

const tool = {
  type: "function",
  function: {
    name: "build_report",
    description: "Return a structured operational report based on the CSV data and user prompt.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Specific report title, max 80 chars." },
        subtitle: { type: "string", description: "Optional one-line subtitle framing audience & timeframe." },
        summary: { type: "string", description: "2–4 sentence executive summary calling out the headline finding." },
        audience: { type: "string", description: "Echo the audience role this report is tailored for." },
        timeframe: { type: "string", description: "Echo the timeframe used." },
        kpis: {
          type: "array",
          description: "4–8 high-signal KPIs computed from the data. Most relevant to the audience & goal.",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              value: { type: "string", description: "Formatted, e.g. '128', '94%', '$12,400'." },
              delta: { type: "string", description: "Change vs comparison, e.g. '+12%' or '-3 vs last period'." },
              trend: { type: "string", enum: ["up", "down", "flat"] },
            },
            required: ["label", "value"],
            additionalProperties: false,
          },
        },
        insights: {
          type: "array",
          description: "3–6 top-line operational insights across the whole report.",
          items: { type: "string" },
        },
        recommendations: {
          type: "array",
          description: "3–6 concrete, verb-led recommended actions.",
          items: { type: "string" },
        },
        risks: {
          type: "array",
          description: "0–4 operational risks. Omit when truly none.",
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
        sections: {
          type: "array",
          description: "3–6 drill-down sections. Each answers a focused question and includes a chart + optional table.",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "url-safe id, lowercase-with-dashes" },
              title: { type: "string" },
              narrative: { type: "string", description: "1–3 sentences explaining the finding." },
              insights: { type: "array", items: { type: "string" } },
              chart: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["bar", "line", "area", "pie", "stacked-bar"] },
                  labels: { type: "array", items: { type: "string" } },
                  xLabel: { type: "string" },
                  yLabel: { type: "string" },
                  series: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        data: { type: "array", items: { type: "number" } },
                      },
                      required: ["name", "data"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["type", "labels", "series"],
                additionalProperties: false,
              },
              table: {
                type: "object",
                properties: {
                  columns: { type: "array", items: { type: "string" } },
                  rows: {
                    type: "array",
                    items: { type: "array", items: { type: ["string", "number"] } },
                  },
                },
                required: ["columns", "rows"],
                additionalProperties: false,
              },
            },
            required: ["id", "title"],
            additionalProperties: false,
          },
        },
        chart: {
          type: "object",
          description: "Optional headline visual when no sections are returned. Keep to <= 12 labels.",
          properties: {
            type: { type: "string", enum: ["bar", "line", "area", "pie", "stacked-bar"] },
            labels: { type: "array", items: { type: "string" } },
            series: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  data: { type: "array", items: { type: "number" } },
                },
                required: ["name", "data"],
                additionalProperties: false,
              },
            },
          },
          required: ["type", "labels", "series"],
          additionalProperties: false,
        },
        table: {
          type: "object",
          description: "Optional headline breakdown table (<= 15 rows).",
          properties: {
            columns: { type: "array", items: { type: "string" } },
            rows: {
              type: "array",
              items: { type: "array", items: { type: ["string", "number"] } },
            },
          },
          required: ["columns", "rows"],
          additionalProperties: false,
        },
      },
      required: ["title", "summary", "kpis", "insights"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      prompt, filters, fileName, csvPreview, rowCount, headers,
      files,
      audience, timeframe, breakdown, goal, comparison,
    } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    // Normalize: prefer multi-file `files` payload; fall back to legacy single-file fields.
    type FilePart = { fileName: string; preview: string; rowCount: number; headers?: string[] };
    const fileParts: FilePart[] = Array.isArray(files) && files.length
      ? files
      : [{ fileName: fileName || "upload.csv", preview: csvPreview || "", rowCount: rowCount ?? 0, headers }];

    const totalRows = fileParts.reduce((s, f) => s + (f.rowCount || 0), 0);
    const filesBlock = fileParts.map((f, i) => [
      `--- FILE ${i + 1}: ${f.fileName} (${f.rowCount ?? "?"} rows) ---`,
      f.headers?.length ? `Columns: ${f.headers.join(", ")}` : "",
      "```",
      f.preview || "",
      "```",
    ].filter(Boolean).join("\n")).join("\n\n");

    const userMsg = [
      `Number of source files: ${fileParts.length}`,
      `Total rows across all files: ${totalRows}`,
      audience ? `Audience role: ${audience}` : "",
      timeframe ? `Timeframe: ${timeframe}` : "",
      breakdown ? `Primary breakdown: ${breakdown}` : "",
      comparison ? `Comparison: ${comparison}` : "",
      goal ? `Decision / goal: ${goal}` : "",
      filters?.length ? `Filters: ${filters.join(" | ")}` : "",
      `User request: ${prompt || "Build the most useful operational report."}`,
      ``,
      `CSV previews (each file truncated):`,
      filesBlock,
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
        tool_choice: { type: "function", function: { name: "build_report" } },
        max_completion_tokens: 8192,
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
      throw new Error(`No tool call returned (finish_reason: ${finish || "unknown"}). The model may have hit the output token limit — try a smaller dataset or shorter prompt.`);
    }
    let result;
    try {
      result = JSON.parse(argsStr);
    } catch (err) {
      throw new Error("Model returned malformed JSON — likely truncated output. Try fewer/smaller files.");
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ai-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});