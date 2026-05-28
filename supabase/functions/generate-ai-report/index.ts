const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are Blossom AI Report Builder for an ABA therapy operations platform.
You receive a CSV preview exported from CentralReach (or similar), a user prompt, and optional filters.
Build a clean, premium operational report. Always use the "build_report" tool. Be concise, surface the most operationally useful insights. Numbers must be derived from the provided data — never invent.
If the data is sparse, still produce a sensible report explaining what's there.`;

const tool = {
  type: "function",
  function: {
    name: "build_report",
    description: "Return a structured operational report based on the CSV data and user prompt.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short, specific report title (max 70 chars)." },
        summary: { type: "string", description: "1–2 sentence executive summary." },
        kpis: {
          type: "array",
          description: "3–6 high-signal KPIs computed from the data.",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              value: { type: "string", description: "Formatted value, e.g. '128', '94%', '$12,400'." },
              delta: { type: "string", description: "Optional change indicator, e.g. '+12%' or '-3 vs last period'." },
              trend: { type: "string", enum: ["up", "down", "flat"] },
            },
            required: ["label", "value"],
            additionalProperties: false,
          },
        },
        insights: {
          type: "array",
          description: "3–6 punchy operational insights or recommended actions.",
          items: { type: "string" },
        },
        chart: {
          type: "object",
          description: "Primary visual (bar or line). Keep to <= 12 labels.",
          properties: {
            type: { type: "string", enum: ["bar", "line"] },
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
          description: "Optional breakdown table (<= 12 rows).",
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
    const { prompt, filters, fileName, csvPreview, rowCount, headers } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const userMsg = [
      `Source file: ${fileName || "(unnamed)"}`,
      `Total rows: ${rowCount ?? "?"}`,
      headers?.length ? `Columns: ${headers.join(", ")}` : "",
      filters?.length ? `Filters: ${filters.join(" | ")}` : "",
      `User request: ${prompt || "Build the most useful operational report."}`,
      ``,
      `CSV preview (truncated):`,
      "```",
      csvPreview || "",
      "```",
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
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = call?.function?.arguments;
    if (!argsStr) throw new Error("No tool call returned");
    const result = JSON.parse(argsStr);

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