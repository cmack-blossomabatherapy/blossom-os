// Role-aware RAG chat for Blossom AI.
// - Embeds the user's question via the Lovable AI Gateway
// - Calls match_resource_chunks() with the caller's JWT so RLS filters chunks
//   to only those visible to their role (Resource Library rules)
// - Sends context + question to a chat model with strict "cite only what you
//   used, refuse when nothing relevant" instructions
// - Returns { content, sources: [{ resourceId, title, url? }] }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMBED_MODEL = "openai/text-embedding-3-small";
const CHAT_MODEL = "google/gemini-3-flash-preview";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MATCH_COUNT = 8;
const CONTEXT_CHAR_BUDGET = 12_000;

const SYSTEM_PROMPT = `You are Blossom AI, the operational assistant for Blossom ABA Therapy staff.

GROUND RULES — ANSWER FROM SOURCES
- Answer ONLY from the provided KNOWLEDGE excerpts. Do NOT use outside knowledge.
- Every substantive claim must cite the source by number, like [1] or [2].
- If the excerpts don't contain the answer, say: "No approved Blossom resource was found for that. Try rephrasing, or contact the owning team."
- Never invent policies, SOPs, numbers, names, staff, clients, or file contents.
- If the user asks about a video and the excerpts include no transcript for it, say the transcript isn't available yet — do not pretend the video was reviewed.
- If context suggests the user lacks access to something, say "You don't have access to that resource." Do not describe or hint at its contents.
- Never reveal secrets, passwords, credentials, MFA codes, NFC/security data, storage paths, internal IDs, or raw URLs. Cite by title and number only.
- Do not give legal, medical, clinical, or compliance guarantees. Say the user should consult the SOP owner, QA, or Compliance.
- Do not expose PHI, HR/payroll, or credentialing details beyond what the excerpts already show for this role.

WHAT YOU CAN DO
- Summarize accessible SOPs/resources, explain workflows, recommend next steps.
- Find related resources and link to them via their citation number.
- Draft text (emails, tasks, updates) for the user to review — always label a draft with "**Draft — review before sending:**" and do NOT claim it has been sent.
- Help users understand reports and metrics.

WHAT YOU CANNOT DO WITHOUT EXPLICIT CONFIRMATION
- Send emails, update client/employee/HR records, change permissions, delete resources, submit authorizations, modify payroll/finance/credentialing data, or change report calculations.
- If a user asks for one of those, respond: "I can prepare a draft, but I can't do that action for you. Review it and take the action yourself, or ask the owning team."
- Never complete training or quiz work for the user. Never reveal quiz answers.

STYLE
- Concise, warm, markdown. Cite source titles in italics when quoting.`;

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

async function chat(messages: Array<{ role: string; content: string }>, apiKey: string): Promise<string> {
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ model: CHAT_MODEL, messages }),
  });
  if (!res.ok) throw new Error(`chat_${res.status}:${(await res.text()).slice(0, 200)}`);
  const j = await res.json() as { choices: Array<{ message: { content: string } }> };
  return j.choices?.[0]?.message?.content ?? "";
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
  let auditPreview = "";
  let auditError: string | null = null;
  let auditActiveState: string | null = null;

  const logAudit = async (client: ReturnType<typeof createClient>): Promise<string | null> => {
    try {
      const { data, error } = await client.from("ai_audit_log").insert({
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
        tools_called: [],
        records_accessed: [],
        error: auditError,
      }).select("id").maybeSingle();
      if (error) return null;
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

    // Per-request client that carries the user's JWT so RLS applies to the RPC.
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
      message?: string;
      department?: string;
      resourceType?: string;
      role?: string;
      activeState?: string;
      conversationId?: string;
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

    // 0. Resolve / create the persistent conversation so history survives reloads
    //    and the user can switch between past chats. All writes go through the
    //    user-scoped client so RLS on chat_conversations / chat_messages applies.
    let conversationId = body.conversationId ?? null;
    if (conversationId) {
      const { data: existing } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!existing) conversationId = null;
    }
    if (!conversationId) {
      const title = question.length > 60 ? question.slice(0, 57) + "…" : question;
      const { data: conv, error: convErr } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();
      if (convErr) throw convErr;
      conversationId = conv.id;
    }

    // Persist the user turn before we call the model so it shows in history
    // even if the model call fails downstream.
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: question,
    });

    // Pull recent turns for multi-turn context (bounded so we don't blow the
    // context window). Newest last.
    const { data: prior } = await supabase
      .from("chat_messages")
      .select("role,content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(12);
    const priorTurns = (prior ?? []).reverse().slice(0, -1); // drop the user turn we just wrote — we re-add it below

    // 1. Embed
    const qvec = await embedQuery(question, LOVABLE_API_KEY);

    // 2. Role-filtered retrieval (RLS on knowledge_chunks does the filtering)
    const { data: hits, error: rpcErr } = await supabase.rpc("match_resource_chunks", {
      query_embedding: qvec as unknown as string,
      match_count: MATCH_COUNT,
      filter_department: body.department ?? null,
      filter_resource_type: body.resourceType ?? null,
    });
    if (rpcErr) throw rpcErr;

    const chunks = (hits ?? []) as ChunkHit[];
    auditKbHits = chunks.slice(0, MATCH_COUNT).map((c) => ({
      resourceId: c.resource_id,
      title: c.source_title,
      similarity: Number(c.similarity ?? 0),
    }));

    if (chunks.length === 0) {
      auditStatus = "no_context";
      auditPreview = "No approved Blossom resource was found for that.";
      const logId = await logAudit(supabase);
      const emptyAnswer =
        "No approved Blossom resource was found for that. Try rephrasing, or contact the owning team.";
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: emptyAnswer,
        metadata: { sources: [], no_context: true },
      });
      await supabase
        .from("chat_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
      return new Response(JSON.stringify({
        content: emptyAnswer,
        sources: [],
        conversationId,
        logId,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Assemble context within a character budget, dedup by resource.
    let used = 0;
    const contextParts: string[] = [];
    const cited: Array<{ number: number; resourceId: string | null; title: string; department: string | null; type: string | null }> = [];
    const seenResources = new Set<string>();
    let n = 0;
    for (const c of chunks) {
      const excerpt = c.content.slice(0, 1600);
      if (used + excerpt.length > CONTEXT_CHAR_BUDGET) break;
      n += 1;
      contextParts.push(`[${n}] ${c.source_title}\n${excerpt}`);
      used += excerpt.length;
      const key = c.resource_id ?? c.source_title;
      if (!seenResources.has(key)) {
        seenResources.add(key);
        cited.push({
          number: n,
          resourceId: c.resource_id,
          title: c.source_title,
          department: c.department,
          type: c.resource_type,
        });
      }
    }

    // 4. Ask the model
    const answer = await chat([
      { role: "system", content: SYSTEM_PROMPT },
      ...priorTurns.map((t) => ({ role: t.role, content: t.content })),
      { role: "user", content: `KNOWLEDGE:\n\n${contextParts.join("\n\n---\n\n")}\n\nQUESTION: ${question}` },
    ], LOVABLE_API_KEY);
    auditPreview = answer;
    const logId = await logAudit(supabase);

    // Persist assistant turn + bump conversation timestamp so the sidebar sorts.
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: answer,
      metadata: { sources: cited },
    });
    await supabase
      .from("chat_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    return new Response(JSON.stringify({
      content: answer,
      sources: cited,
      matchedChunks: chunks.length,
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
    // 429 rate limit and 402 credit exhaustion surface as their status in msg
    let status = 500;
    if (/^embed_429|^chat_429/.test(msg)) status = 429;
    else if (/^embed_402|^chat_402/.test(msg)) status = 402;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});