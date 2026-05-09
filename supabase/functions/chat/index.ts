import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Blossom Assistant, the in-app AI helper for Blossom ABA Therapy staff.

You help employees with:
- Training questions (what's assigned to them, what's overdue, course content)
- HR handbook, policies, SOPs, and how-to questions
- Looking up coworkers (name, title, department, clinic, work email/phone — directory info only)
- Pulling HR resources / documents the employee is allowed to see
- Their own profile basics (title, department, hire date, training status)
- How to use Blossom OS

Use the provided KNOWLEDGE excerpts as your primary source. When you need live data (a coworker, a training assignment, a document, the user's own info), CALL A TOOL. Don't guess.

NEVER share or discuss:
- Pay rates, salaries, bonuses, payroll details
- Social Security numbers, government IDs, bank info
- Performance reviews, disciplinary notes, internal HR notes about other employees
- Termination reasons or anything in employee_notes
- Other people's personal contact info beyond name + work email + work phone + title

If asked for restricted info, politely decline and tell them to contact HR.

Tone: warm, concise, practical. Use markdown (lists, bold, headings). Cite source titles in italics when quoting from KNOWLEDGE. If you used a tool, briefly mention what you looked up.`;

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

async function runTool(name: string, args: any, ctx: { admin: any; userId: string }) {
  const { admin, userId } = ctx;
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
        .select("first_name, last_name, preferred_name, email, phone, job_title, clinic, state, status, department_id")
        .or(`first_name.ilike.${like},last_name.ilike.${like},preferred_name.ilike.${like},job_title.ilike.${like},clinic.ilike.${like}`)
        .neq("status", "terminated")
        .limit(limit);
      return { count: data?.length ?? 0, items: (data ?? []).map((e: any) => ({
        name: `${e.preferred_name || e.first_name} ${e.last_name}`.trim(),
        title: e.job_title, clinic: e.clinic, state: e.state, email: e.email, phone: e.phone, status: e.status,
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
      let qb = admin
        .from("hr_resources")
        .select("title, description, kind, category, url")
        .eq("is_active", true)
        .or(`title.ilike.${like},description.ilike.${like}`)
        .limit(limit);
      if (args.category) qb = qb.eq("category", args.category);
      const { data } = await qb;
      return { count: data?.length ?? 0, items: data ?? [] };
    }
    if (name === "search_knowledge_base") {
      const q = String(args.query ?? "").replace(/[^\w\s]/g, " ").trim().split(/\s+/).slice(0, 8).join(" | ");
      const limit = Math.min(Number(args.limit ?? 6), 12);
      if (!q) return { items: [] };
      const { data } = await admin
        .from("knowledge_chunks")
        .select("source_title, source_url, content")
        .textSearch("search", q, { type: "websearch", config: "english" })
        .limit(limit);
      return { count: data?.length ?? 0, items: data ?? [] };
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

    const ctx = { admin, userId };
    const usedTools: string[] = [];
    const sources: Array<{ title: string; url?: string; tool: string }> = [];
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
                if (it?.source_title) sources.push({ title: it.source_title, url: it.source_url ?? undefined, tool: fname });
              }
            } else if (fname === "search_hr_resources" || fname === "search_training_courses") {
              for (const it of items.slice(0, 6)) {
                if (it?.title) sources.push({ title: it.title, url: it.url ?? it.external_url ?? undefined, tool: fname });
              }
            }
          }
        } catch { /* ignore */ }
        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result).slice(0, 12000) });
      }
    }

    if (!finalText) finalText = "I wasn't able to put together an answer this time. Try rephrasing your question.";

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
