import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Blossom Assistant, the in-app AI helper for Blossom ABA Therapy staff.
You answer questions about training, SOPs, the employee handbook, HR policies, scheduling, and how to use the Blossom OS app.
Use the provided KNOWLEDGE excerpts as your primary source of truth. If the answer isn't in the knowledge, say so honestly and suggest who to contact (HR, Operations, or the employee's supervisor).
Be concise, warm, and practical. Use markdown (lists, bold, headings) when it helps. Cite the source title in italics when you quote it.`;

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

    // Ensure conversation exists & belongs to user
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

    // Persist user message
    await admin.from("chat_messages").insert({ conversation_id: conversationId, role: "user", content: message });

    // Load history (last 20 msgs)
    const { data: history } = await admin.from("chat_messages")
      .select("role,content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Knowledge retrieval via Postgres FTS
    const query = message.replace(/[^\w\s]/g, " ").trim().split(/\s+/).slice(0, 8).join(" | ");
    let knowledge: { source_title: string; source_url: string | null; content: string }[] = [];
    if (query) {
      const { data: chunks } = await admin.rpc("search_knowledge", { _q: query, _limit: 6 }).maybeSingle().then(() => ({ data: null })).catch(() => ({ data: null }));
      if (!chunks) {
        const { data: fallback } = await admin
          .from("knowledge_chunks")
          .select("source_title,source_url,content")
          .textSearch("search", query, { type: "websearch", config: "english" })
          .limit(6);
        knowledge = fallback ?? [];
      } else {
        knowledge = chunks as never;
      }
    }

    const knowledgeBlock = knowledge.length
      ? "KNOWLEDGE EXCERPTS (most relevant first):\n\n" + knowledge.map((k, i) => `[${i + 1}] ${k.source_title}\n${k.content}`).join("\n\n---\n\n")
      : "KNOWLEDGE EXCERPTS: (no matching documents indexed yet — answer from general Blossom OS knowledge or say you don't know.)";

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: knowledgeBlock },
          ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI workspace credits exhausted. Add credits in Settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Tee the stream: forward to client, accumulate to save
    let fullText = "";
    const reader = aiResp.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // Send conversationId first as a header-like SSE event
        controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ conversationId })}\n\n`));
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          buf += chunk;
          controller.enqueue(value);

          // Parse for assistant content to persist
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") continue;
            try {
              const parsed = JSON.parse(json);
              const c = parsed?.choices?.[0]?.delta?.content;
              if (c) fullText += c;
            } catch { /* partial */ }
          }
        }
        controller.close();

        if (fullText) {
          await admin.from("chat_messages").insert({ conversation_id: conversationId, role: "assistant", content: fullText });
          await admin.from("chat_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
        }
      },
    });

    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});