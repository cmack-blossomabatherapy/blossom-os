import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const InputSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().min(1).max(300),
  type: z.string().min(1).max(60),
  category: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  tags: z.array(z.string().max(60)).max(20).optional().default([]),
  minutes: z.number().int().min(0).max(600).optional(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

    const parsed = InputSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const r = parsed.data;

    const systemPrompt = `You are Ask Blossom AI, the operational copilot for BCBAs at Blossom ABA Therapy. You generate calm, concise, action-oriented operational guidance for a Resource Library entry. You always respond by calling the provided tool. Keep language clinical, modern, and human. No fluff, no headers, no markdown. Never expose PHI. Frame everything around what a BCBA needs to do operationally.`;

    const userPrompt = `Resource:
- Title: ${r.title}
- Type: ${r.type}
- Category: ${r.category}
- Tags: ${r.tags.join(", ") || "—"}
- Description: ${r.description}

Generate:
1) summary: 2–3 sentence operational summary of what this resource is and when a BCBA uses it.
2) checklist: 5–7 short, imperative step-by-step actions a BCBA should take. Each step ≤ 14 words.
3) when_to_use: one sentence about the operational trigger.
4) watch_outs: 2–3 short risk/edge cases (each ≤ 14 words).`;

    const tool = {
      type: "function",
      function: {
        name: "resource_guidance",
        description: "Operational summary + checklist for a BCBA resource.",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string" },
            when_to_use: { type: "string" },
            checklist: {
              type: "array",
              minItems: 5,
              maxItems: 7,
              items: { type: "string" },
            },
            watch_outs: {
              type: "array",
              minItems: 2,
              maxItems: 3,
              items: { type: "string" },
            },
          },
          required: ["summary", "when_to_use", "checklist", "watch_outs"],
          additionalProperties: false,
        },
      },
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "resource_guidance" } },
      }),
    });

    if (aiResp.status === 429) return json({ error: "Rate limit reached. Try again in a moment." }, 429);
    if (aiResp.status === 402) return json({ error: "AI credits exhausted. Add credits in Workspace Settings." }, 402);
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return json({ error: "AI gateway error" }, 500);
    }

    const data = await aiResp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = call?.function?.arguments;
    if (!argsStr) return json({ error: "No AI response" }, 500);

    let args: unknown;
    try { args = JSON.parse(argsStr); } catch { return json({ error: "Malformed AI response" }, 500); }

    return json({ resource_id: r.id, ...(args as Record<string, unknown>) });
  } catch (e) {
    console.error("bcba-resource-ai error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});