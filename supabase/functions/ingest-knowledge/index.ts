import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function chunk(text: string, size = 800, overlap = 100): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];
  const out: string[] = [];
  let i = 0;
  while (i < clean.length) {
    out.push(clean.slice(i, i + size));
    i += size - overlap;
  }
  return out;
}

async function embedBatch(inputs: string[], apiKey: string): Promise<(number[] | null)[]> {
  // Lovable AI Gateway embeddings (OpenAI-compatible). 1536 dims matches knowledge_chunks.embedding column.
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/text-embedding-3-small", input: inputs }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("embed error", resp.status, t);
      return inputs.map(() => null);
    }
    const data = await resp.json();
    return (data.data ?? []).map((d: any) => (Array.isArray(d.embedding) ? d.embedding : null));
  } catch (e) {
    console.error("embed exception", e);
    return inputs.map(() => null);
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
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { source_type, source_id, source_title, source_url, content, metadata, document_id } = await req.json();
    if (!source_type || !source_title || !content) {
      return new Response(JSON.stringify({ error: "source_type, source_title, content required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    if (document_id) {
      await admin.from("knowledge_chunks").delete().eq("document_id", document_id);
      await admin.from("knowledge_documents").update({ ingest_status: "processing", ingest_error: null }).eq("id", document_id);
    } else if (source_id) {
      await admin.from("knowledge_chunks").delete().eq("source_type", source_type).eq("source_id", source_id);
    }
    const chunks = chunk(String(content));
    if (!chunks.length) {
      if (document_id) await admin.from("knowledge_documents").update({ ingest_status: "ready", chunk_count: 0 }).eq("id", document_id);
      return new Response(JSON.stringify({ inserted: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Embed chunks in batches (OpenAI allows up to 2048 inputs; we batch at 64 to stay safe)
    const embeddings: (number[] | null)[] = [];
    if (LOVABLE_API_KEY) {
      const BATCH = 64;
      for (let i = 0; i < chunks.length; i += BATCH) {
        const slice = chunks.slice(i, i + BATCH);
        const vecs = await embedBatch(slice, LOVABLE_API_KEY);
        embeddings.push(...vecs);
      }
    } else {
      console.warn("LOVABLE_API_KEY not set — skipping embeddings (FTS only)");
      for (let i = 0; i < chunks.length; i++) embeddings.push(null);
    }

    const rows = chunks.map((c, i) => ({
      source_type, source_id: source_id ?? null, source_title, source_url: source_url ?? null,
      chunk_index: i, content: c, metadata: metadata ?? {},
      document_id: document_id ?? null,
      embedding: embeddings[i] ?? null,
    }));
    const { error } = await admin.from("knowledge_chunks").insert(rows);
    if (error) {
      if (document_id) await admin.from("knowledge_documents").update({ ingest_status: "failed", ingest_error: error.message }).eq("id", document_id);
      throw error;
    }

    const embeddedCount = embeddings.filter((e) => e).length;
    if (document_id) {
      await admin.from("knowledge_documents").update({
        ingest_status: embeddedCount > 0 ? "ready" : "failed",
        ingest_error: embeddedCount > 0 ? null : "Embedding failed for all chunks",
        chunk_count: rows.length,
      }).eq("id", document_id);
    }

    return new Response(JSON.stringify({ inserted: rows.length, embedded: embeddedCount }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ingest-knowledge error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});