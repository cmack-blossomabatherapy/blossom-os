// Batched ingestion of Resource Library files into knowledge_chunks.
// Reads pending hr_resources rows, downloads each file from Storage, extracts
// text (PDF/TXT/MD/CSV/JSON), chunks it, embeds via the Lovable AI Gateway
// (openai/text-embedding-3-small = 1536 dims to match the pgvector column),
// and inserts chunks with role-visibility metadata copied from the resource.
//
// Trigger repeatedly with { "limit": 25 } until { remaining: 0 }.
// Only super_admin / admin may invoke.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMBED_MODEL = "openai/text-embedding-3-small"; // 1536 dims
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/embeddings";
const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 150;
const MAX_CHARS_PER_FILE = 240_000; // ~60k tokens; guard rail per resource

type ResourceRow = {
  id: string;
  resource_id: string | null;
  title: string | null;
  description: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  mime_type: string | null;
  department: string | null;
  resource_type: string | null;
  visibility_level: string | null;
  visible_to_roles: string[] | null;
  is_sensitive: boolean | null;
  tags: string[] | null;
};

function chunk(text: string): string[] {
  const cleaned = text.replace(/\r/g, "").replace(/\s+\n/g, "\n").trim();
  if (!cleaned) return [];
  const out: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const end = Math.min(i + CHUNK_SIZE, cleaned.length);
    out.push(cleaned.slice(i, end));
    if (end >= cleaned.length) break;
    i = end - CHUNK_OVERLAP;
  }
  return out;
}

async function extractTextFromFile(bytes: Uint8Array, mime: string, path: string): Promise<string> {
  const lower = (mime || "").toLowerCase();
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const isText =
    lower.startsWith("text/") ||
    lower === "application/json" ||
    ["txt", "md", "markdown", "csv", "tsv", "json"].includes(ext);
  if (isText) {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
  if (lower === "application/pdf" || ext === "pdf") {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n\n") : String(text ?? "");
  }
  // DOCX/XLSX/etc. — not yet supported in this ingestion pass.
  throw new Error(`unsupported_type:${lower || ext || "unknown"}`);
}

async function embedBatch(inputs: string[], apiKey: string): Promise<number[][]> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Lovable-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: inputs }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`embed_${res.status}:${body.slice(0, 200)}`);
  }
  const json = await res.json() as { data: Array<{ embedding: number[]; index: number }> };
  const out: number[][] = new Array(inputs.length);
  for (const row of json.data) out[row.index] = row.embedding;
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Auth check: super_admin or admin only.
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roleSet = new Set((roles ?? []).map((r) => r.role));
    if (!roleSet.has("super_admin") && !roleSet.has("admin")) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = (await req.json().catch(() => ({}))) as { limit?: number; resourceId?: string };
    const limit = Math.min(Math.max(body.limit ?? 25, 1), 100);

    // Pick the next pending batch.
    let q = admin
      .from("hr_resources")
      .select("id,resource_id,title,description,storage_bucket,storage_path,mime_type,department,resource_type,visibility_level,visible_to_roles,is_sensitive,tags")
      .eq("ingest_status", "pending")
      .not("storage_path", "is", null)
      .neq("storage_path", "")
      .limit(limit);
    if (body.resourceId) q = admin.from("hr_resources").select("*").eq("id", body.resourceId).limit(1) as any;

    const { data: pending, error: pendErr } = await q;
    if (pendErr) throw pendErr;

    const results: Array<{ id: string; status: string; chunks: number; error?: string }> = [];

    for (const row of (pending ?? []) as ResourceRow[]) {
      const bucket = row.storage_bucket ?? "resource-library";
      const path = row.storage_path!;
      const isVideoBucket = bucket === "resource-videos";

      // Videos: no transcript pipeline yet — mark and continue.
      if (isVideoBucket) {
        await admin.from("hr_resources").update({
          ingest_status: "transcript_missing",
          ingest_error: null,
          ingested_at: new Date().toISOString(),
        }).eq("id", row.id);
        results.push({ id: row.id, status: "transcript_missing", chunks: 0 });
        continue;
      }

      try {
        const { data: file, error: dlErr } = await admin.storage.from(bucket).download(path);
        if (dlErr || !file) throw new Error(`download_failed:${dlErr?.message ?? "no_file"}`);
        const bytes = new Uint8Array(await file.arrayBuffer());
        let text = "";
        try {
          text = await extractTextFromFile(bytes, row.mime_type ?? "", path);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.startsWith("unsupported_type:")) {
            await admin.from("hr_resources").update({
              ingest_status: "unsupported_type",
              ingest_error: msg,
              ingested_at: new Date().toISOString(),
            }).eq("id", row.id);
            results.push({ id: row.id, status: "unsupported_type", chunks: 0, error: msg });
            continue;
          }
          throw e;
        }

        text = text.slice(0, MAX_CHARS_PER_FILE);
        const pieces = chunk(text);
        if (pieces.length === 0) {
          await admin.from("hr_resources").update({
            ingest_status: "empty",
            chunk_count: 0,
            ingest_error: null,
            ingested_at: new Date().toISOString(),
          }).eq("id", row.id);
          results.push({ id: row.id, status: "empty", chunks: 0 });
          continue;
        }

        // Wipe any prior chunks for this resource so we can re-ingest safely.
        if (row.resource_id) {
          await admin.from("knowledge_chunks").delete().eq("resource_id", row.resource_id);
        }

        // Embed in batches of 50 (well under gateway per-request cap).
        const embeddings: number[][] = [];
        for (let i = 0; i < pieces.length; i += 50) {
          const slice = pieces.slice(i, i + 50);
          const vecs = await embedBatch(slice, LOVABLE_API_KEY);
          embeddings.push(...vecs);
        }

        const rows = pieces.map((content, idx) => ({
          source_type: "hr_resource",
          source_title: row.title ?? row.resource_id ?? "Untitled",
          resource_id: row.resource_id,
          storage_bucket: bucket,
          storage_path: path,
          chunk_index: idx,
          content,
          embedding: embeddings[idx] as unknown as string,
          visibility_level: row.visibility_level ?? "admin_only",
          visible_to_roles: row.visible_to_roles ?? [],
          is_sensitive: row.is_sensitive ?? false,
          department: row.department,
          resource_type: row.resource_type,
          tags: row.tags ?? [],
          metadata: { description: row.description ?? null },
        }));

        const { error: insErr } = await admin.from("knowledge_chunks").insert(rows);
        if (insErr) throw insErr;

        await admin.from("hr_resources").update({
          ingest_status: "ingested",
          ingest_error: null,
          chunk_count: pieces.length,
          ingested_at: new Date().toISOString(),
        }).eq("id", row.id);

        results.push({ id: row.id, status: "ingested", chunks: pieces.length });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await admin.from("hr_resources").update({
          ingest_status: "error",
          ingest_error: msg.slice(0, 500),
          ingested_at: new Date().toISOString(),
        }).eq("id", row.id);
        results.push({ id: row.id, status: "error", chunks: 0, error: msg });
      }
    }

    const { count: remaining } = await admin
      .from("hr_resources")
      .select("id", { count: "exact", head: true })
      .eq("ingest_status", "pending");

    return new Response(JSON.stringify({ processed: results.length, results, remaining: remaining ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});