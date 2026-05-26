import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Blossom Assistant, the in-app AI helper for Blossom ABA Therapy staff.

## What you help with
- Training questions (what's assigned to the user, what's overdue, course content)
- HR handbook, public policies, SOPs, how-to questions about Blossom OS
- Looking up coworkers — DIRECTORY-LEVEL info only
- The user's OWN profile (their hire date, employment type, manager, training status)

Use KNOWLEDGE excerpts as your primary source. For live data, CALL A TOOL. Don't guess.

## About COWORKERS, you may share ONLY these fields
- Name / preferred name
- Job title / role
- Department, clinic, state
- Work email
- Work phone

## NEVER share or discuss about ANY other employee (even if you find it)
- Pay, salary, hourly rate, bonus, pay type, comp band, payroll details
- SSN, government IDs, date of birth, bank/routing, tax forms
- Login credentials, passwords, vault entries, MFA secrets, API keys
- Performance reviews, disciplinary notes, write-ups, PIPs
- Termination reasons, internal HR notes, manager-only notes
- Hire date, employment type, work setting, employment status of OTHER employees
- Personal (non-work) phone, personal email, home address, emergency contacts
- Anything from confidential / internal-only HR resources

The user's OWN information (their own hire date, employment type, etc.) IS allowed.

## Refusal template
If asked for restricted info about another person, respond:
"I can only share public directory info (name, role, department, clinic, work email, work phone). For anything else, please contact HR."

Do not name the restricted field, do not hint at the value, do not say "I see it but can't share it."

Tone: warm, concise, practical. Use markdown. Cite source titles in italics when quoting KNOWLEDGE.`;

const tools = [
  {
    type: "function",
    function: {
      name: "get_my_profile",
      description: "Get the current user's own employee profile (job title, department, clinic, hire date, status, manager).",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_trainings",
      description: "Get the current user's training assignments with status, due date, and course title.",
      parameters: {
        type: "object",
        properties: { status: { type: "string", enum: ["all", "assigned", "in_progress", "completed", "overdue"], description: "Filter by status. Default 'all'." } },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_employees",
      description: "Search the employee directory by name, job title, department, or clinic. Returns directory-only info (no pay/SSN/notes).",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Name, title, department, or clinic to search for." }, limit: { type: "number", default: 8 } },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_training_courses",
      description: "Search the training catalog (courses, SOPs, compliance trainings) by title, category, or type.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" }, limit: { type: "number", default: 8 } },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_hr_resources",
      description: "Search the HR Resource Hub (handbook pages, policies, SOPs, links). Returns title, description, kind, category, and URL when available.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" }, category: { type: "string", description: "Optional: handbook, policy, sop, benefits, training, general, etc." }, limit: { type: "number", default: 8 } },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_knowledge_base",
      description: "Full-text search the AI knowledge base (ingested SOPs, handbook chunks, training guides). Use this for policy/procedure questions.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" }, limit: { type: "number", default: 6 } },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
];

async function runTool(name: string, args: any, ctx: { admin: any; userId: string; roles: string[] }) {
  const { admin, userId, roles } = ctx;
  try {
    if (name === "get_my_profile") {
      const { data: emp } = await admin
        .from("employees")
        .select("id, first_name, last_name, preferred_name, email, phone, job_title, department_id, clinic, state, work_setting, employment_type, status, hire_date, start_date")
        .eq("user_id", userId)
        .maybeSingle();
      if (!emp) return { error: "No employee record linked to this account." };
      let department: string | null = null;
      if (emp.department_id) {
        const { data: dep } = await admin.from("hr_departments").select("name").eq("id", emp.department_id).maybeSingle();
        department = dep?.name ?? null;
      }
      return { ...emp, department };
    }
    if (name === "get_my_trainings") {
      const { data: emp } = await admin.from("employees").select("id").eq("user_id", userId).maybeSingle();
      if (!emp) return { error: "No employee record linked." };
      const { data } = await admin
        .from("employee_trainings")
        .select("id, status, due_date, started_at, completed_at, expires_on, course:training_courses(title, training_type, estimated_minutes)")
        .eq("employee_id", emp.id)
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(50);
      const today = new Date().toISOString().slice(0, 10);
      let rows = (data ?? []).map((r: any) => ({
        title: r.course?.title,
        type: r.course?.training_type,
        minutes: r.course?.estimated_minutes,
        status: r.status,
        due_date: r.due_date,
        completed_at: r.completed_at,
        overdue: r.due_date && r.due_date < today && r.status !== "completed",
      }));
      if (args?.status && args.status !== "all") {
        if (args.status === "overdue") rows = rows.filter((r: any) => r.overdue);
        else rows = rows.filter((r: any) => r.status === args.status);
      }
      return { count: rows.length, items: rows };
    }
    if (name === "search_employees") {
      const q = String(args.query ?? "").trim();
      const limit = Math.min(Number(args.limit ?? 8), 25);
      if (!q) return { items: [] };
      const like = `%${q}%`;
      const { data } = await admin
        .from("employees")
        .select("first_name, last_name, preferred_name, email, phone, job_title, clinic, state, department_id")
        .or(`first_name.ilike.${like},last_name.ilike.${like},preferred_name.ilike.${like},job_title.ilike.${like},clinic.ilike.${like}`)
        .neq("status", "terminated")
        .limit(limit);
      const deptIds = Array.from(new Set((data ?? []).map((e: any) => e.department_id).filter(Boolean)));
      let deptMap: Record<string, string> = {};
      if (deptIds.length) {
        const { data: deps } = await admin.from("hr_departments").select("id,name").in("id", deptIds);
        deptMap = Object.fromEntries((deps ?? []).map((d: any) => [d.id, d.name]));
      }
      return { count: data?.length ?? 0, items: (data ?? []).map((e: any) => ({
        name: `${e.preferred_name || e.first_name} ${e.last_name}`.trim(),
        title: e.job_title,
        department: e.department_id ? deptMap[e.department_id] ?? null : null,
        clinic: e.clinic,
        state: e.state,
        work_email: e.email,
        work_phone: e.phone,
      })) };
    }
    if (name === "search_training_courses") {
      const q = String(args.query ?? "").trim();
      const limit = Math.min(Number(args.limit ?? 8), 25);
      const like = `%${q}%`;
      const { data } = await admin
        .from("training_courses")
        .select("title, description, category, training_type, difficulty, estimated_minutes, renewal_months, role_visibility, external_url")
        .or(`title.ilike.${like},description.ilike.${like},category.ilike.${like},training_type.ilike.${like}`)
        .eq("is_active", true)
        .limit(limit);
      return { count: data?.length ?? 0, items: data ?? [] };
    }
    if (name === "search_hr_resources") {
      const q = String(args.query ?? "").trim();
      const limit = Math.min(Number(args.limit ?? 8), 25);
      const like = `%${q}%`;
      const BLOCKED_CATEGORIES = ["payroll", "comp", "compensation", "discipline", "performance", "internal", "confidential"];
      let qb = admin
        .from("hr_resources")
        .select("title, description, kind, category, url")
        .eq("is_active", true)
        .or(`title.ilike.${like},description.ilike.${like}`)
        .not("category", "in", `(${BLOCKED_CATEGORIES.join(",")})`)
        .limit(limit);
      if (args.category) qb = qb.eq("category", args.category);
      const { data } = await qb;
      return { count: data?.length ?? 0, items: data ?? [] };
    }
    if (name === "search_knowledge_base") {
      const limit = Math.min(Number(args.limit ?? 6), 12);
      const raw = String(args.query ?? "").trim();
      if (!raw) return { items: [] };
      const DENY = /(payroll|salary|compensation|comp\s*band|bonus|pay\s*rate|vault|credential|password|login|performance\s*review|discipline|write[-\s]?up|termination|ssn)/i;

      // 1. Try semantic vector search first
      let rows: any[] = [];
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
          const eResp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "openai/text-embedding-3-small", input: raw }),
          });
          if (eResp.ok) {
            const eData = await eResp.json();
            const queryEmbedding = eData.data?.[0]?.embedding;
            if (Array.isArray(queryEmbedding)) {
              const { data: matches } = await admin.rpc("match_knowledge_chunks_v2", {
                query_embedding: queryEmbedding,
                match_count: limit * 2,
                min_similarity: 0.4,
                _roles: roles.length ? roles : null,
              });
              rows = matches ?? [];
            }
          }
        } catch (e) {
          console.warn("semantic search failed, falling back to FTS", e);
        }
      }

      // 2. Fallback: keyword FTS if no semantic results
      if (!rows.length) {
        const q = raw.replace(/[^\w\s]/g, " ").trim().split(/\s+/).slice(0, 8).join(" | ");
        if (q) {
          const { data } = await admin
            .from("knowledge_chunks")
            .select("source_title, source_url, content, document_id")
            .textSearch("search", q, { type: "websearch", config: "english" })
            .limit(limit * 2);
          rows = data ?? [];
          // Filter by role visibility for the FTS fallback
          if (rows.length && roles.length) {
            const docIds = Array.from(new Set(rows.map((r: any) => r.document_id).filter(Boolean)));
            if (docIds.length) {
              const { data: docs } = await admin
                .from("knowledge_documents")
                .select("id, role_visibility, category")
                .in("id", docIds);
              const docMap = Object.fromEntries((docs ?? []).map((d: any) => [d.id, d]));
              rows = rows.filter((r: any) => {
                if (!r.document_id) return true; // legacy chunks without a parent doc
                const d = docMap[r.document_id];
                if (!d) return true;
                if (!d.role_visibility) return true;
                return d.role_visibility.some((rv: string) => roles.includes(rv));
              }).map((r: any) => ({ ...r, category: docMap[r.document_id]?.category ?? "general" }));
            }
          }
        }
      }

      const filtered = rows
        .filter((r: any) => !DENY.test(r.source_title ?? "") && !DENY.test(r.content ?? ""))
        .slice(0, limit)
        .map((r: any) => ({
          source_title: r.source_title,
          source_url: r.source_url,
          content: r.content,
          similarity: typeof r.similarity === "number" ? r.similarity : undefined,
          category: r.category ?? "general",
        }));
      return { count: filtered.length, items: filtered };
    }
    return { error: `Unknown tool ${name}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Tool failed" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json();
    const { conversationId: incomingConvId, message } = body as { conversationId?: string; message: string };
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Load the user's roles for permission-scoped knowledge retrieval.
    const { data: roleRows } = await admin.from("user_roles").select("role").eq("user_id", userId);
    const roles = (roleRows ?? []).map((r: any) => String(r.role));

    let conversationId = incomingConvId;
    if (!conversationId) {
      const title = message.slice(0, 60);
      const { data: conv, error } = await admin.from("chat_conversations").insert({ user_id: userId, title }).select("id").single();
      if (error) throw error;
      conversationId = conv.id;
    } else {
      const { data: conv } = await admin.from("chat_conversations").select("id,user_id").eq("id", conversationId).maybeSingle();
      if (!conv || conv.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Conversation not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    await admin.from("chat_messages").insert({ conversation_id: conversationId, role: "user", content: message });

    const { data: history } = await admin.from("chat_messages")
      .select("role,content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const ctx = { admin, userId, roles };
    const usedTools: string[] = [];
    const sources: Array<{ title: string; url?: string; tool: string; snippet?: string; similarity?: number; category?: string }> = [];
    const startedAt = Date.now();
    let finalText = "";

    // Tool loop (max 4 rounds)
    for (let round = 0; round < 4; round++) {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
          tools,
          tool_choice: "auto",
        }),
      });

      if (!aiResp.ok) {
        if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI workspace credits exhausted. Add credits in Settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const txt = await aiResp.text();
        console.error("AI gateway error", aiResp.status, txt);
        return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await aiResp.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;
      if (!msg) break;

      const toolCalls = msg.tool_calls ?? [];
      if (toolCalls.length === 0) {
        finalText = msg.content ?? "";
        break;
      }

      // Append assistant message that requested tools
      messages.push({ role: "assistant", content: msg.content ?? "", tool_calls: toolCalls });

      // Run each tool
      for (const tc of toolCalls) {
        const fname = tc.function?.name;
        let fargs: any = {};
        try { fargs = JSON.parse(tc.function?.arguments || "{}"); } catch { /* */ }
        usedTools.push(fname);
        const result = await runTool(fname, fargs, ctx);
        // Capture cited sources from knowledge-style tools.
        try {
          const items = (result as any)?.items;
          if (Array.isArray(items)) {
            if (fname === "search_knowledge_base") {
              for (const it of items.slice(0, 6)) {
                if (it?.source_title) sources.push({
                  title: it.source_title,
                  url: it.source_url ?? undefined,
                  tool: fname,
                  snippet: typeof it.content === "string" ? it.content.slice(0, 260) : undefined,
                  similarity: typeof it.similarity === "number" ? it.similarity : undefined,
                  category: it.category ?? undefined,
                });
              }
            } else if (fname === "search_hr_resources" || fname === "search_training_courses") {
              for (const it of items.slice(0, 6)) {
                if (it?.title) sources.push({
                  title: it.title,
                  url: it.url ?? it.external_url ?? undefined,
                  tool: fname,
                  snippet: typeof it.description === "string" ? it.description.slice(0, 260) : undefined,
                  category: it.category ?? undefined,
                });
              }
            }
          }
        } catch { /* ignore */ }
        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result).slice(0, 12000) });
      }
    }

    if (!finalText) finalText = "I wasn't able to put together an answer this time. Try rephrasing your question.";

    // Defensive output redaction — last line of defense against model leaks.
    finalText = finalText
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[redacted — contact HR]")
      .replace(/(salary|pay\s*rate|hourly\s*rate|wage|bonus|compensation)[^\n.]{0,40}\$\s?[\d,]+(?:\.\d+)?/gi, "$1: [redacted — contact HR]")
      .replace(/(password|passcode|api[\s_-]?key|secret|token|login\s*credentials?)\s*[:=]\s*\S+/gi, "$1: [redacted — contact HR]");

    // Dedupe sources by title+url.
    const seen = new Set<string>();
    const dedupedSources = sources.filter((s) => {
      const k = `${s.title}|${s.url ?? ""}`;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });

    const latencyMs = Date.now() - startedAt;
    const success = !/wasn't able to put together/i.test(finalText);
    const metadata = {
      tools_used: usedTools,
      sources: dedupedSources,
      latency_ms: latencyMs,
      success,
      model: "google/gemini-2.5-flash",
    };

    const { data: inserted } = await admin
      .from("chat_messages")
      .insert({ conversation_id: conversationId, role: "assistant", content: finalText, metadata })
      .select("id")
      .single();
    await admin.from("chat_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);

    // ---- AI audit log (Phase 4) ------------------------------------------------
    try {
      const userEmail = (claims.claims as any)?.email ?? null;
      await admin.from("ai_audit_log").insert({
        user_id: userId,
        user_email: userEmail,
        role: roles[0] ?? null,
        conversation_id: conversationId,
        prompt: message.slice(0, 2000),
        response_preview: finalText.slice(0, 500),
        kb_hits: dedupedSources.map((s) => ({ title: s.title, similarity: s.similarity ?? null, category: s.category ?? null })),
        tools_called: usedTools,
        records_accessed: [],
        model: "google/gemini-2.5-flash",
        duration_ms: latencyMs,
        status: success ? "ok" : "no_answer",
      });
    } catch (auditErr) {
      console.error("ai_audit_log insert failed", auditErr);
    }

    return new Response(JSON.stringify({
      conversationId,
      messageId: inserted?.id,
      content: finalText,
      tools_used: usedTools,
      sources: dedupedSources,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
