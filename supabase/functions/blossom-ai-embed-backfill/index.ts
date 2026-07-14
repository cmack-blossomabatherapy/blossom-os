// Backfill embeddings for knowledge_chunks rows where embedding IS NULL.
// The initial resource ingest created 8,870 chunks but never wrote vectors,
// so match_resource_chunks always returned 0 hits and Blossom AI kept
// answering "No approved Blossom resource was found for that."
//
// Trigger repeatedly with { "limit": 96 } until { remaining: 0 }.
// Super Admin only.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMBED_MODEL = "openai/text-embedding-3-small"; // 1536 dims — matches column
const GATEWAY = "https://ai.gateway.lovable.dev/v1/embeddings";
const DEFAULT_BATCH = 64;
const MAX_BATCH = 96;

interface ChunkRow { id: string; content: string }

async function embedBatch(inputs: string[], apiKey: string): Promise<number[][]> {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: inputs }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`embed_${res.status}:${body.slice(0, 300)}`);
  }
  const j = await res.json() as { data: Array<{ embedding: number[]; index: number }> };
  // Sort by index just in case
  const sorted = [...j.data].sort((a, b) => a.index - b.index);
  return sorted.map((d) => d.embedding);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorize: super_admin or systems_admin only.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roles } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const allowed = (roles ?? []).some((r) => r.role === "super_admin" || r.role === "systems_admin");
    if (!allowed) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(1, Number(body?.limit) || DEFAULT_BATCH), MAX_BATCH);

    // Service-role client for the actual updates so we bypass RLS.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Select next batch of null-embedding rows.
    const { data: rows, error: selErr } = await admin
      .from("knowledge_chunks")
      .select("id, content")
      .is("embedding", null)
      .not("content", "is", null)
      .limit(limit);
    if (selErr) throw selErr;

    const chunks = (rows ?? []) as ChunkRow[];
    if (chunks.length === 0) {
      // Count remaining just to be sure.
      const { count } = await admin
        .from("knowledge_chunks")
        .select("id", { count: "exact", head: true })
        .is("embedding", null);
      return new Response(JSON.stringify({ processed: 0, remaining: count ?? 0, done: (count ?? 0) === 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize inputs — trim, cap length so a single monstrous chunk doesn't
    // 413 the whole batch. text-embedding-3-small handles ~8k tokens; 6000
    // characters is comfortably inside that.
    const inputs = chunks.map((c) => (c.content ?? "").slice(0, 6000).trim() || " ");
    const vectors = await embedBatch(inputs, LOVABLE_API_KEY);

    if (vectors.length !== chunks.length) {
      throw new Error(`embed_mismatch:${vectors.length}!=${chunks.length}`);
    }

    // Update each row. pgvector accepts a JSON array literal string.
    let updated = 0;
    for (let i = 0; i < chunks.length; i++) {
      const vec = vectors[i];
      const { error: upErr } = await admin
        .from("knowledge_chunks")
        .update({ embedding: vec as unknown as string })
        .eq("id", chunks[i].id);
      if (!upErr) updated += 1;
    }

    const { count: remaining } = await admin
      .from("knowledge_chunks")
      .select("id", { count: "exact", head: true })
      .is("embedding", null);

    return new Response(JSON.stringify({
      processed: updated,
      batchSize: chunks.length,
      remaining: remaining ?? 0,
      done: (remaining ?? 0) === 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    let status = 500;
    if (/^embed_429/.test(msg)) status = 429;
    else if (/^embed_402/.test(msg)) status = 402;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
