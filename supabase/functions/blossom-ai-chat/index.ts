// Blossom AI — the operational copilot.
// Role-aware RAG + operational tool router:
//   1. Always include a curated Blossom OS system brief so the model can
//      answer general "how does X work" questions.
//   2. Retrieve role-visible Resource Library chunks via match_resource_chunks
//      (RLS-scoped through the caller's JWT).
//   3. Expose a small set of read-only operational tools (leads, clients,
//      employees, my tasks, my goals). Every tool call goes through the
//      caller's JWT so Postgres RLS scopes results to that role.
//   4. Persist chat_conversations / chat_messages and write ai_audit_log.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { BLOSSOM_SYSTEM_PACK } from "../_shared/blossomSystemPack.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMBED_MODEL = "openai/text-embedding-3-small";
const CHAT_MODEL = "openai/gpt-5.5";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MATCH_COUNT = 12;
const CONTEXT_CHAR_BUDGET = 12_000;
const MAX_TOOL_STEPS = 3;
const REFUSAL_RE = /no approved.*resource|contact the owning team/i;

const SYSTEM_PROMPT = `You are Blossom AI, the operational copilot for Blossom ABA Therapy staff.

You help every role at Blossom: Executives, State Directors, Intake, Auth, Scheduling, Recruiting, HR, QA, BCBAs, RBTs, Marketing, Finance. Your job is to make operations faster and clearer.

HOW TO ANSWER
- Use the BLOSSOM OS BRIEF (always provided) for general questions about the company, workflows, roles, or how something works.
- Use the KNOWLEDGE excerpts (Resource Library) when they contain relevant material — cite them by number like [1] or [2].
- Call operational tools when the user asks about specific records ("my open tasks", "leads in Virginia", "find employee named …", "who is X", "tell me about client Y"). Tool results are RLS-scoped to the caller — if a row isn't there, the user can't see it.
- If nothing above answers the question, still respond helpfully with what you do know from the BRIEF and general operational knowledge, and say what you'd need to answer more precisely. Do NOT flat-refuse. NEVER say "no approved Blossom resource was found" — that phrase is banned; always try the BRIEF, tools, or ask a clarifying question first.

WHAT YOU CAN'T DO
- Never invent policies, SOPs, numbers, staff, clients, PHI, or file contents.
- Never reveal secrets, passwords, credentials, MFA/NFC data, storage paths, internal IDs, or raw URLs. Cite by title.
- Never expose PHI, HR/payroll, credentialing, or finance details a role wouldn't already see through the app.
- Never send emails, update records, change permissions, delete resources, submit auths, or modify payroll/finance data. If asked, produce a labeled draft ("**Draft — review before sending:**") and tell the user to take the action.
- Never complete quizzes or reveal quiz answers.
- Never guarantee legal, clinical, or compliance outcomes. Point to the SOP owner, QA, or Compliance instead.

STYLE
- Concise, warm, markdown. Use short bullets and headings. Cite Resource Library sources in italics when you quote them.`;

type ChunkHit = {
  id: string;
  resource_id: string | null;
  source_title: string;
  content: string;
  storage_bucket: string | null;
  storage_path: string | null;
  department: string | null;
  resource_type: string | null;
  similarity: number;
};

type ChatMessage =
  | { role: "system" | "user" | "assistant"; content: string; tool_calls?: unknown[]; name?: string }
  | { role: "tool"; content: string; tool_call_id: string; name?: string };

async function embedQuery(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch(`${GATEWAY}/embeddings`, {
    method: "POST",
    headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  if (!res.ok) throw new Error(`embed_${res.status}:${(await res.text()).slice(0, 200)}`);
  const j = await res.json() as { data: Array<{ embedding: number[] }> };
  return j.data[0].embedding;
}

async function chatCompletion(
  messages: ChatMessage[],
  apiKey: string,
  tools?: unknown[],
): Promise<{
  content: string | null;
  tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
}> {
  const body: Record<string, unknown> = { model: CHAT_MODEL, messages };
  if (tools?.length) body.tools = tools;
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`chat_${res.status}:${(await res.text()).slice(0, 200)}`);
  const j = await res.json() as { choices: Array<{ message: {
    content: string | null;
    tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
  } }> };
  const msg = j.choices?.[0]?.message ?? { content: "" };
  return { content: msg.content ?? null, tool_calls: msg.tool_calls };
}

// --- Operational tools (RLS-scoped via caller JWT) -------------------------

const TOOL_DEFS = [
  {
    type: "function",
    function: {
      name: "search_leads",
      description: "Search intake leads visible to the caller. Filters by name/email substring and optional stage or state.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Name, parent name, child name, email, or phone substring." },
          stage: { type: "string", description: "Optional pipeline stage filter." },
          state: { type: "string", description: "Optional US state (e.g. 'GA')." },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_clients",
      description: "Search active clients visible to the caller by name substring.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_employees",
      description: "Search employees by name, email, or role. RLS scopes results to what the caller can see.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_my_tasks",
      description: "List tasks assigned to the current user. Optional status filter (open, in_progress, completed).",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_my_goals",
      description: "List goals owned by or assigned to the current user, with milestone status.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_expiring_authorizations",
      description: "List client authorizations expiring within N days (default 30) that the caller can see.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_person",
      description: "Look up a person across employees and the company org chart by name, title, department, or state. Use for 'who is X' or 'who owns Y'.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Name, title, department, or role keyword." },
          limit: { type: "number" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_resource_library",
      description: "Keyword search over Resource Library titles and descriptions when semantic retrieval didn't surface the right document.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
        },
        required: ["query"],
      },
    },
  },
];

type SBClient = ReturnType<typeof createClient>;

async function runTool(
  name: string,
  args: Record<string, unknown>,
  supabase: SBClient,
  userId: string,
): Promise<string> {
  const limit = Math.min(Math.max(1, Number(args.limit) || 8), 20);
  try {
    if (name === "search_leads") {
      const q = String(args.query ?? "").trim();
      let query = supabase.from("intake_leads").select(
        "id, patient_first_name, patient_last_name, parent_name, email, phone, state, pipeline_stage, priority, next_action, next_task_due"
      ).limit(limit);
      if (q) {
        const like = `%${q}%`;
        query = query.or(
          `parent_name.ilike.${like},patient_first_name.ilike.${like},patient_last_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`
        );
      }
      if (args.stage) query = query.eq("pipeline_stage", String(args.stage));
      if (args.state) query = query.eq("state", String(args.state));
      const { data, error } = await query;
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ count: data?.length ?? 0, results: data ?? [] });
    }

    if (name === "search_clients") {
      const q = String(args.query ?? "").trim();
      const like = `%${q}%`;
      const { data, error } = await supabase.from("clients")
        .select("id, first_name, last_name, state, status")
        .or(`first_name.ilike.${like},last_name.ilike.${like}`)
        .limit(limit);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ count: data?.length ?? 0, results: data ?? [] });
    }

    if (name === "search_employees") {
      const q = String(args.query ?? "").trim();
      const like = `%${q}%`;
      const { data, error } = await supabase.from("employees")
        .select("id, first_name, last_name, email, state, status")
        .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like}`)
        .limit(limit);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ count: data?.length ?? 0, results: data ?? [] });
    }

    if (name === "list_my_tasks") {
      let query = supabase.from("user_tasks")
        .select("id, title, priority, status, due_at, related_record_type, related_record_label")
        .eq("assignee_id", userId)
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(limit);
      if (args.status) query = query.eq("status", String(args.status));
      const { data, error } = await query;
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ count: data?.length ?? 0, results: data ?? [] });
    }

    if (name === "list_my_goals") {
      const { data, error } = await supabase.from("user_goals")
        .select("id, title, goal_type, quarter, status")
        .or(`owner_id.eq.${userId},assignee_id.eq.${userId}`)
        .limit(20);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ count: data?.length ?? 0, results: data ?? [] });
    }

    if (name === "list_expiring_authorizations") {
      const days = Math.min(Math.max(1, Number(args.days) || 30), 180);
      const cutoff = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase.from("client_authorizations")
        .select("id, client_id, authorization_number, end_date, payer_name, status")
        .gte("end_date", today)
        .lte("end_date", cutoff)
        .order("end_date", { ascending: true })
        .limit(limit);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ count: data?.length ?? 0, results: data ?? [] });
    }

    if (name === "find_person") {
      const q = String(args.query ?? "").trim();
      if (!q) return JSON.stringify({ error: "missing_query" });
      const like = `%${q}%`;
      const [emp, org] = await Promise.all([
        supabase.from("employees")
          .select("id, first_name, last_name, email, title, department, state, status")
          .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like},title.ilike.${like},department.ilike.${like}`)
          .limit(limit),
        supabase.from("org_chart_nodes")
          .select("id, name, title, department, state, parent_id")
          .or(`name.ilike.${like},title.ilike.${like},department.ilike.${like}`)
          .limit(limit),
      ]);
      return JSON.stringify({
        employees: emp.data ?? [],
        org_chart: org.data ?? [],
      });
    }

    if (name === "search_resource_library") {
      const q = String(args.query ?? "").trim();
      if (!q) return JSON.stringify({ error: "missing_query" });
      const like = `%${q}%`;
      const { data, error } = await supabase.from("knowledge_documents")
        .select("id, title, category, description")
        .or(`title.ilike.${like},description.ilike.${like}`)
        .limit(limit);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ count: data?.length ?? 0, results: data ?? [] });
    }

    return JSON.stringify({ error: `unknown_tool:${name}` });
  } catch (e) {
    return JSON.stringify({ error: e instanceof Error ? e.message : String(e) });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startedAt = Date.now();
  let auditUserId: string | null = null;
  let auditRole: string | null = null;
  let auditEmail: string | null = null;
  let auditPrompt = "";
  let auditStatus: "ok" | "no_context" | "error" = "ok";
  let auditKbHits: Array<{ resourceId: string | null; title: string; similarity: number }> = [];
  const toolsCalled: string[] = [];
  let auditPreview = "";
  let auditError: string | null = null;
  let auditActiveState: string | null = null;

  const logAudit = async (client: SBClient): Promise<string | null> => {
    try {
      const { data } = await client.from("ai_audit_log").insert({
        user_id: auditUserId,
        user_email: auditEmail,
        role: auditRole,
        active_state: auditActiveState,
        prompt: auditPrompt.slice(0, 4000),
        response_preview: auditPreview.slice(0, 1200),
        status: auditStatus,
        model: CHAT_MODEL,
        duration_ms: Date.now() - startedAt,
        kb_hits: auditKbHits,
        tools_called: toolsCalled,
        records_accessed: [],
        error: auditError,
      }).select("id").maybeSingle();
      return data?.id ?? null;
    } catch {
      return null;
    }
  };

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    auditUserId = user.id;
    auditEmail = user.email ?? null;

    const body = (await req.json().catch(() => ({}))) as {
      message?: string; department?: string; resourceType?: string;
      role?: string; activeState?: string; conversationId?: string;
    };
    auditRole = body.role ?? null;
    auditActiveState = body.activeState ?? null;
    const question = (body.message ?? "").trim();
    if (!question) {
      return new Response(JSON.stringify({ error: "missing_message" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    auditPrompt = question;

    // Persist conversation & user turn
    let conversationId = body.conversationId ?? null;
    if (conversationId) {
      const { data: existing } = await supabase
        .from("chat_conversations").select("id")
        .eq("id", conversationId).eq("user_id", user.id).maybeSingle();
      if (!existing) conversationId = null;
    }
    if (!conversationId) {
      const title = question.length > 60 ? question.slice(0, 57) + "…" : question;
      const { data: conv, error: convErr } = await supabase
        .from("chat_conversations").insert({ user_id: user.id, title })
        .select("id").single();
      if (convErr) throw convErr;
      conversationId = conv.id;
    }
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId, role: "user", content: question,
    });

    const { data: prior } = await supabase.from("chat_messages")
      .select("role,content").eq("conversation_id", conversationId)
      .order("created_at", { ascending: false }).limit(12);
    const priorTurns = (prior ?? []).reverse().slice(0, -1);

    // Parallel: embed + KB retrieval
    let contextParts: string[] = [];
    let cited: Array<{ number: number; resourceId: string | null; title: string; department: string | null; type: string | null }> = [];
    try {
      const qvec = await embedQuery(question, LOVABLE_API_KEY);
      const { data: hits } = await supabase.rpc("match_resource_chunks", {
        query_embedding: qvec as unknown as string,
        match_count: MATCH_COUNT,
        filter_department: body.department ?? null,
        filter_resource_type: body.resourceType ?? null,
      });
      const chunks = (hits ?? []) as ChunkHit[];
      auditKbHits = chunks.map((c) => ({
        resourceId: c.resource_id, title: c.source_title, similarity: Number(c.similarity ?? 0),
      }));

      let used = 0;
      let n = 0;
      const seen = new Set<string>();
      for (const c of chunks) {
        const excerpt = c.content.slice(0, 1600);
        if (used + excerpt.length > CONTEXT_CHAR_BUDGET) break;
        n += 1;
        contextParts.push(`[${n}] ${c.source_title}\n${excerpt}`);
        used += excerpt.length;
        const key = c.resource_id ?? c.source_title;
        if (!seen.has(key)) {
          seen.add(key);
          cited.push({ number: n, resourceId: c.resource_id, title: c.source_title,
            department: c.department, type: c.resource_type });
        }
      }
    } catch (e) {
      // KB failure shouldn't kill the whole answer — log and continue with just
      // the system pack + tools.
      console.error("kb_retrieval_failed", e);
    }

    const kbBlock = contextParts.length
      ? `KNOWLEDGE (Resource Library excerpts, cite as [n]):\n\n${contextParts.join("\n\n---\n\n")}`
      : "KNOWLEDGE: no directly matching Resource Library excerpts for this question.";

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `BLOSSOM OS BRIEF:\n\n${BLOSSOM_SYSTEM_PACK}` },
      { role: "system", content: kbBlock },
      ...priorTurns.map((t) => ({ role: t.role as "user" | "assistant", content: t.content })),
      { role: "user", content: question },
    ];

    // Tool-calling loop, bounded.
    let finalAnswer = "";
    for (let step = 0; step < MAX_TOOL_STEPS; step++) {
      const { content, tool_calls } = await chatCompletion(messages, LOVABLE_API_KEY, TOOL_DEFS);
      if (tool_calls && tool_calls.length > 0) {
        messages.push({ role: "assistant", content: content ?? "", tool_calls });
        for (const call of tool_calls) {
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(call.function.arguments || "{}"); } catch { /* ignore */ }
          toolsCalled.push(call.function.name);
          const result = await runTool(call.function.name, args, supabase, user.id);
          messages.push({
            role: "tool", tool_call_id: call.id, name: call.function.name,
            content: result.slice(0, 8000),
          });
        }
        continue;
      }
      finalAnswer = content ?? "";
      break;
    }
    if (!finalAnswer) {
      // Model kept requesting tools past the cap — ask once more with tools off.
      const { content } = await chatCompletion(messages, LOVABLE_API_KEY);
      finalAnswer = content ?? "I'm having trouble putting together an answer. Try rephrasing.";
    }

    // Refusal guard: if the model still emitted the banned refusal phrasing,
    // retry once with an explicit "do not refuse" instruction, then hard-strip
    // if it slips through again.
    if (REFUSAL_RE.test(finalAnswer)) {
      messages.push({
        role: "system",
        content:
          "Your previous answer used a banned refusal phrase. Try again. Answer from the Blossom OS brief, general ABA operations knowledge, or tools. Never say 'no approved Blossom resource was found' — if retrieval was empty, still be helpful, explain what you do know, and ask a clarifying question if needed.",
      });
      const { content: retry } = await chatCompletion(messages, LOVABLE_API_KEY, TOOL_DEFS);
      if (retry && retry.trim()) finalAnswer = retry;
      if (REFUSAL_RE.test(finalAnswer)) {
        finalAnswer =
          "I couldn't find a specific Resource Library document for that, but here's what I can tell you from the Blossom OS operations brief:\n\n" +
          finalAnswer.replace(REFUSAL_RE, "").trim() +
          "\n\nWant me to search a different phrasing, look up a specific person/client, or pull a related SOP?";
      }
    }

    auditPreview = finalAnswer;
    auditStatus = contextParts.length === 0 && toolsCalled.length === 0 ? "no_context" : "ok";
    const logId = await logAudit(supabase);

    await supabase.from("chat_messages").insert({
      conversation_id: conversationId, role: "assistant", content: finalAnswer,
      metadata: { sources: cited, tools_called: toolsCalled },
    });
    await supabase.from("chat_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    return new Response(JSON.stringify({
      content: finalAnswer,
      sources: cited,
      tools_used: toolsCalled,
      matchedChunks: contextParts.length,
      conversationId,
      logId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    auditStatus = "error";
    auditError = msg.slice(0, 500);
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
      const authHeader = req.headers.get("Authorization") ?? "";
      if (authHeader) {
        const c = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } },
        });
        await logAudit(c);
      }
    } catch { /* swallow */ }
    let status = 500;
    if (/^embed_429|^chat_429/.test(msg)) status = 429;
    else if (/^embed_402|^chat_402/.test(msg)) status = 402;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
