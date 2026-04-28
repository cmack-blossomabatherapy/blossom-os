import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const InputSchema = z.object({
  sourceType: z.enum(["tango", "upload", "paste", "combined"]),
  tangoUrl: z.string().url().optional().or(z.literal("")),
  sopText: z.string().max(60000).optional().default(""),
  fileName: z.string().max(255).optional().default(""),
  tone: z.enum(["Simple", "Detailed", "Technical"]).optional().default("Detailed"),
  quizComplexity: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
  sectionMode: z.enum(["full", "sop", "steps", "quiz"]).optional().default("full"),
  currentDraft: z.unknown().optional(),
});

const departments = ["exec", "ops", "systems", "hr", "finance", "intake", "auth", "clients", "qa", "clinic", "state", "clinical", "general"];
const difficulties = ["Beginner", "Intermediate", "Advanced"];
const trainingTypes = ["Workflow", "SOP", "System Training", "Policy", "Onboarding", "Clinical", "Tango", "Checklist", "Quiz", "Video"];

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
    const hasTango = Boolean(input.tangoUrl?.trim());
    const hasSop = Boolean(input.sopText?.trim());
    if (input.sourceType === "combined" && (!hasTango || !hasSop)) return json({ error: "Add both a Tango link and SOP content for combined generation" }, 400);
    if (input.sourceType !== "combined" && !hasTango && !hasSop && !input.currentDraft) return json({ error: "Add a Tango link, SOP text, or an existing draft first" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "Lovable AI is not configured" }, 500);

    const quizGuidance = quizComplexityGuidance(input.quizComplexity);
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: JSON.stringify({ ...input, quizGuidance, departments, difficulties, trainingTypes }) },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      const message = aiResponse.status === 429 ? "AI rate limit reached. Try again shortly." : aiResponse.status === 402 ? "AI credits are required before generating trainings." : "AI generation failed";
      console.error("Training generation failed", aiResponse.status, detail);
      return json({ error: message, detail }, aiResponse.status === 429 || aiResponse.status === 402 ? aiResponse.status : 500);
    }

    const result = await aiResponse.json();
    const content = result?.choices?.[0]?.message?.content ?? "{}";
    const draft = normalizeDraft(JSON.parse(content));
    return json({ draft });
  } catch (error) {
    console.error("generate-training-draft error", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function systemPrompt() {
  return `You are Blossom ABA Therapy's embedded training specialist. Generate a complete, practical training draft from a Tango URL, uploaded SOP text, pasted SOP text, or a combined Tango + SOP package.
Return JSON only with this exact shape: {"title":"","description":"","departmentId":"","difficulty":"Beginner|Intermediate|Advanced","type":"Workflow|SOP|System Training|Policy|Onboarding|Clinical|Tango|Checklist|Quiz|Video","minutes":30,"objectives":[""],"sop":{"title":"","content":"Purpose\n...\n\nWhen used\n...\n\nSystems required\n...\n\nStep-by-step instructions\n...\n\nExpected outcome\n...\n\nCommon mistakes\n..."},"walkthrough":{"url":"","label":"","summary":""},"steps":[{"title":"","description":"","systemTag":""}],"checklist":[""],"commonMistakes":[{"error":"","consequence":"","avoid":""}],"quiz":[{"type":"Multiple choice|True / false","question":"","options":[""],"answer":"","explanation":""}],"badge":{"title":"","description":""},"qualityScore":82}.
 Rules: choose departmentId from the provided ids; infer systems like Blossom OS, CentralReach, Monday, Viventium, SharePoint, Email, Phone; simplify messy language; remove redundancy; create 3-5 quiz questions; match the quiz to quizComplexity and quizGuidance; make steps actionable and readable; score based on SOP completeness, step clarity, checklist, quiz, and mistakes. For Tango-only input, infer a workflow from the URL/title when content is limited and attach the URL. For combined mode, merge SOP policy/context with the Tango walkthrough sequence into one cohesive course: SOP provides standards, rationale, expected outcomes, mistakes, and validation; Tango provides walkthrough flow and step order. If sectionMode is sop, steps, or quiz, regenerate ONLY that requested section using currentDraft as context and keep all other fields minimal or unchanged in the returned JSON.`;
}

function quizComplexityGuidance(complexity: "easy" | "medium" | "hard") {
  if (complexity === "easy") return "Use direct recall and basic recognition. Questions should confirm the learner can identify the right step, system, or simple rule.";
  if (complexity === "hard") return "Use scenario-based, judgment-heavy questions. Include edge cases, consequences, prioritization, and choosing the best action when details are ambiguous.";
  return "Use applied understanding. Questions should require choosing the correct action in common workflow situations, not just memorizing definitions.";
}

function normalizeDraft(raw: Record<string, unknown>) {
  const asString = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
  const arr = (value: unknown) => Array.isArray(value) ? value : [];
  const dept = departments.includes(asString(raw.departmentId)) ? asString(raw.departmentId) : "general";
  const difficulty = difficulties.includes(asString(raw.difficulty)) ? asString(raw.difficulty) : "Beginner";
  const type = trainingTypes.includes(asString(raw.type)) ? asString(raw.type) : "Workflow";
  const qualityScore = Math.max(0, Math.min(100, Number(raw.qualityScore) || 75));
  return {
    title: asString(raw.title, "Generated Training Draft"),
    description: asString(raw.description, "AI-generated training draft ready for review."),
    departmentId: dept,
    difficulty,
    type,
    minutes: Math.max(5, Math.min(180, Number(raw.minutes) || 30)),
    objectives: arr(raw.objectives).map((x) => asString(x)).filter(Boolean).slice(0, 6),
    sop: typeof raw.sop === "object" && raw.sop ? raw.sop : { title: "Generated SOP", content: "" },
    walkthrough: typeof raw.walkthrough === "object" && raw.walkthrough ? raw.walkthrough : { url: "", label: "Open Walkthrough", summary: "" },
    steps: arr(raw.steps).slice(0, 12),
    checklist: arr(raw.checklist).map((x) => asString(x)).filter(Boolean).slice(0, 12),
    commonMistakes: arr(raw.commonMistakes).slice(0, 8),
    quiz: arr(raw.quiz).slice(0, 5),
    badge: typeof raw.badge === "object" && raw.badge ? raw.badge : { title: "Workflow Certified", description: "Awarded after completing this training." },
    qualityScore,
  };
}