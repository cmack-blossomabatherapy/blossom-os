import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const InputSchema = z.object({
  mode: z.enum(["module", "quiz", "both"]).default("both"),
  weekId: z.string().uuid().optional(),
  moduleId: z.string().uuid().optional(),
  // Inline context (used when item not yet saved)
  weekTitle: z.string().max(300).optional().default(""),
  weekObjective: z.string().max(2000).optional().default(""),
  weekOutcomes: z.array(z.string()).optional().default([]),
  moduleTitle: z.string().max(300).optional().default(""),
  moduleType: z.string().max(40).optional().default("training"),
  moduleDescriptionSeed: z.string().max(4000).optional().default(""),
  leaderName: z.string().max(120).optional().default(""),
  department: z.string().max(120).optional().default(""),
  // Tunables
  tone: z.enum(["Simple", "Detailed", "Technical"]).optional().default("Detailed"),
  quizComplexity: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
  quizQuestionCount: z.number().int().min(3).max(10).optional().default(5),
  extraInstructions: z.string().max(2000).optional().default(""),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Missing bearer token" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid session" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const [{ data: canManage }, { data: canAssign }, { data: isAdmin }] = await Promise.all([
      admin.rpc("has_permission", { _user_id: userData.user.id, _perm: "hr.training.manage" }),
      admin.rpc("has_permission", { _user_id: userData.user.id, _perm: "hr.training.assign" }),
      admin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" }),
    ]);
    if (!canManage && !canAssign && !isAdmin) return json({ error: "Training management access required" }, 403);

    const parsed = InputSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const input = parsed.data;

    // Hydrate context from DB if ids provided
    let ctx = {
      weekTitle: input.weekTitle,
      weekObjective: input.weekObjective,
      weekOutcomes: input.weekOutcomes,
      moduleTitle: input.moduleTitle,
      moduleType: input.moduleType,
      moduleDescriptionSeed: input.moduleDescriptionSeed,
      leaderName: input.leaderName,
      department: input.department,
    };
    if (input.moduleId) {
      const { data: m } = await admin.from("academy_modules").select("title, module_type, description, leader_name, department, week_id").eq("id", input.moduleId).maybeSingle();
      if (m) {
        ctx.moduleTitle ||= m.title ?? "";
        ctx.moduleType ||= m.module_type ?? "training";
        ctx.moduleDescriptionSeed ||= m.description ?? "";
        ctx.leaderName ||= m.leader_name ?? "";
        ctx.department ||= m.department ?? "";
        if (!input.weekId) input.weekId = m.week_id ?? undefined;
      }
    }
    if (input.weekId) {
      const { data: w } = await admin.from("academy_weeks").select("title, objective, outcomes").eq("id", input.weekId).maybeSingle();
      if (w) {
        ctx.weekTitle ||= w.title ?? "";
        ctx.weekObjective ||= w.objective ?? "";
        if ((!ctx.weekOutcomes || ctx.weekOutcomes.length === 0) && Array.isArray(w.outcomes)) ctx.weekOutcomes = w.outcomes as string[];
      }
    }

    if (!ctx.moduleTitle && !ctx.weekTitle) {
      return json({ error: "Need at least a week title or module title to generate content" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "Lovable AI is not configured" }, 500);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt(input.mode) },
          { role: "user", content: JSON.stringify({
            mode: input.mode,
            tone: input.tone,
            quizComplexity: input.quizComplexity,
            quizQuestionCount: input.quizQuestionCount,
            extraInstructions: input.extraInstructions,
            context: ctx,
          }) },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      const message = aiResponse.status === 429 ? "AI rate limit reached. Try again shortly."
        : aiResponse.status === 402 ? "AI credits are required before generating content."
        : "AI generation failed";
      console.error("Academy generation failed", aiResponse.status, detail);
      return json({ error: message, detail }, aiResponse.status === 429 || aiResponse.status === 402 ? aiResponse.status : 500);
    }

    const result = await aiResponse.json();
    const content = result?.choices?.[0]?.message?.content ?? "{}";
    const draft = normalize(JSON.parse(content), input.mode);
    return json({ draft });
  } catch (error) {
    console.error("generate-academy-module-content error", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function systemPrompt(mode: "module" | "quiz" | "both") {
  return `You are Blossom ABA Therapy's curriculum designer for the Operations Academy. Generate practical, on-brand content for academy modules used to onboard office operations staff.
Return JSON only with this exact shape: {"title":"","description":"","duration_label":"","objectives":[""],"key_points":[""],"content_markdown":"","activities":[""],"resources":[{"label":"","url":"","kind":"link|video|sop|doc|tango|form"}],"quiz":[{"type":"Multiple choice|True / false","question":"","options":[""],"answer":"","explanation":""}]}.
Rules:
- Tailor everything to the provided week context (objective, outcomes) and module type (training, shadowing, meeting, video, sop, quiz, reflection, task).
- description: 1-2 sentences, learner-facing.
- content_markdown: rich teaching content in markdown with headings, bullet points, examples. Length should match tone (Simple ~250 words, Detailed ~500 words, Technical ~700 words).
- key_points: 3-6 crisp takeaways.
- activities: 2-4 hands-on or reflection activities for the module type.
- resources: 0-4 suggested resources (leave url empty if unknown — do not fabricate URLs).
- quiz: produce exactly quizQuestionCount questions matched to quizComplexity. Each MC has 3-4 options. answer must match one option exactly. Include a one-sentence explanation.
- mode controls what to emphasize: "module" => return module content + empty quiz array; "quiz" => return quiz only with all other fields empty/short; "both" => return everything.
- Never invent leader names, links, or facts beyond the provided context. Stay grounded in ABA office operations (intake, auth, scheduling, billing, clinical coordination, HR onboarding, systems like CentralReach).`;
}

function normalize(raw: Record<string, unknown>, mode: "module" | "quiz" | "both") {
  const asString = (v: unknown, f = "") => typeof v === "string" ? v : f;
  const arr = (v: unknown) => Array.isArray(v) ? v : [];
  const quiz = arr(raw.quiz).slice(0, 10).map((q: any) => ({
    type: ["Multiple choice", "True / false"].includes(asString(q?.type)) ? asString(q?.type) : "Multiple choice",
    question: asString(q?.question),
    options: arr(q?.options).map((o) => asString(o)).filter(Boolean).slice(0, 4),
    answer: asString(q?.answer),
    explanation: asString(q?.explanation),
  })).filter((q) => q.question);
  const resources = arr(raw.resources).slice(0, 6).map((r: any) => ({
    label: asString(r?.label),
    url: asString(r?.url),
    kind: ["link", "video", "sop", "doc", "tango", "form"].includes(asString(r?.kind)) ? asString(r?.kind) : "link",
  })).filter((r) => r.label);
  return {
    mode,
    title: asString(raw.title),
    description: asString(raw.description),
    duration_label: asString(raw.duration_label),
    objectives: arr(raw.objectives).map((x) => asString(x)).filter(Boolean).slice(0, 6),
    key_points: arr(raw.key_points).map((x) => asString(x)).filter(Boolean).slice(0, 8),
    content_markdown: asString(raw.content_markdown),
    activities: arr(raw.activities).map((x) => asString(x)).filter(Boolean).slice(0, 6),
    resources,
    quiz,
  };
}