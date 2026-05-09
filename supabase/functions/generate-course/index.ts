import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SourceSchema = z.object({
  id: z.string(),
  kind: z.enum(["SOP", "Tango", "Loom", "PDF", "Video", "Notes"]),
  title: z.string().min(1).max(300),
  meta: z.string().max(300).optional().default(""),
  content: z.string().max(60000).optional().default(""),
});

const InputSchema = z.object({
  courseTitle: z.string().min(1).max(200).optional().default(""),
  competency: z.string().max(200).optional().default(""),
  role: z.string().max(120).optional().default("All staff"),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]).optional().default("Intermediate"),
  tone: z.string().max(120).optional().default("Warm professional"),
  moduleCount: z.number().int().min(2).max(8).optional().default(4),
  quizPerModule: z.number().int().min(2).max(10).optional().default(4),
  includeVoiceover: z.boolean().optional().default(true),
  includeScenarios: z.boolean().optional().default(true),
  sources: z.array(SourceSchema).min(1).max(10),
  // Regeneration controls
  regenerateModuleId: z.string().optional(),       // regen one module
  regenerateField: z.enum(["module", "quiz", "voiceover", "objectives"]).optional(),
  existingCourse: z.unknown().optional(),
  instructions: z.string().max(2000).optional().default(""),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function systemPrompt() {
  return `You are an expert ABA therapy instructional designer for the Blossom ABA Operations Academy.
You generate executive-grade micro-courses from operational source material (SOPs, Tango walkthroughs, Loom transcripts, PDFs, video transcripts, and analyst notes).
Voice: warm, confident, specific. Avoid fluff. Use concrete clinical/operational language.
Always return STRICT JSON matching the requested schema. Do not include markdown fences or commentary.`;
}

function userPrompt(input: z.infer<typeof InputSchema>) {
  const sourceBlock = input.sources.map((s, i) => {
    const body = s.content?.trim() ? `\nCONTENT:\n${s.content.slice(0, 8000)}` : "";
    return `--- SOURCE ${i + 1} (${s.kind}) ---\nTitle: ${s.title}\nMeta: ${s.meta}${body}`;
  }).join("\n\n");

  const regenBlock = input.regenerateField
    ? `\n\nREGENERATION REQUEST:
Field: ${input.regenerateField}
Module ID: ${input.regenerateModuleId ?? "(course-level)"}
Instructions: ${input.instructions || "(none)"}
Existing course (preserve everything not being regenerated):
${JSON.stringify(input.existingCourse).slice(0, 6000)}`
    : "";

  return `Generate a complete training course.

COURSE BRIEF:
- Working title: ${input.courseTitle || "(propose one)"}
- Competency: ${input.competency || "(infer from sources)"}
- Target role: ${input.role}
- Level: ${input.level}
- Tone: ${input.tone}
- Modules to produce: ${input.moduleCount}
- Quiz questions per module: ${input.quizPerModule}
- Include voiceover script: ${input.includeVoiceover}
- Include practice scenarios: ${input.includeScenarios}

SOURCES:
${sourceBlock}${regenBlock}

Return JSON with this exact shape:
{
  "title": string,
  "competency": string,
  "level": "Beginner" | "Intermediate" | "Advanced",
  "tone": string,
  "role": string,
  "totalMin": number,
  "summary": string,                       // 2-3 sentences, why this course matters
  "outcomes": string[],                    // 3-5 course-level learning outcomes
  "modules": [{
      "id": string,                        // m1, m2, ...
      "title": string,
      "summary": string,                   // 1-2 sentences
      "objectives": string[],              // 3-4 objectives
      "durationMin": number,
      "keyPoints": string[],               // 3-6 bullets of teaching content
      "scenarios": [{ "prompt": string, "ideal": string }],
      "voiceoverScript": string,           // narratable script, ~120-180 words, conversational
      "quiz": [{
        "question": string,
        "choices": string[],               // 4 plausible choices
        "correctIndex": number,            // 0-3
        "rationale": string
      }]
  }]
}

Hard rules:
- Ground every module in the supplied sources. Do not invent processes that contradict them.
- If regenerating, return the SAME full course shape, only changing the requested field/module.
- Quiz: exactly the requested number of questions per module, exactly 4 choices each, correctIndex in range.
- Voiceover: plain narratable text. No stage directions or markdown.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const parsed = InputSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const input = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "Lovable AI is not configured" }, 500);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: userPrompt(input) },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      const message =
        aiResponse.status === 429 ? "AI rate limit reached. Try again shortly."
        : aiResponse.status === 402 ? "AI credits are exhausted. Add credits in Workspace > Usage."
        : "AI generation failed";
      console.error("Course generation failed", aiResponse.status, detail);
      return json({ error: message, detail }, aiResponse.status === 429 || aiResponse.status === 402 ? aiResponse.status : 500);
    }

    const result = await aiResponse.json();
    const raw = result?.choices?.[0]?.message?.content ?? "{}";
    let course: unknown;
    try {
      course = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (e) {
      return json({ error: "AI returned invalid JSON", raw }, 500);
    }
    return json({ course });
  } catch (error) {
    console.error("generate-course error", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});