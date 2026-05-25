import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SYSTEM_PROMPT = `You are Ask Blossom AI, the operational copilot for Blossom ABA Therapy's recruiting team.
You answer questions about live recruiting/interview data provided in the user message as JSON.

Rules:
- Be concise, calm, and action-oriented. No filler.
- Use markdown: short headers, bullet points, candidate names in **bold**.
- When listing candidates, include: name, role, state, recruiter, interview status, days in stage, next action.
- If the answer is "none", say so plainly (e.g. "No candidates match.").
- Never invent candidates or fields. Only use the provided data.
- Always end with a one-line "Suggested next action:" when relevant.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { question, candidates } = await req.json();

    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'question' string." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(candidates)) {
      return new Response(JSON.stringify({ error: "Missing 'candidates' array." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cap context size for safety.
    const trimmed = candidates.slice(0, 200);
    const today = new Date().toISOString().slice(0, 10);

    const userContent = [
      `Today: ${today}`,
      `Total candidates in scope: ${trimmed.length}`,
      "",
      "Live recruiting data (JSON):",
      "```json",
      JSON.stringify(trimmed, null, 2),
      "```",
      "",
      `Question: ${question}`,
    ].join("\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const answer = data.choices?.[0]?.message?.content ?? "No response generated.";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ask-blossom-recruiting error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});