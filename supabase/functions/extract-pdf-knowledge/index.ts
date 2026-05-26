import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";

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
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { bucket, storage_path, source_type, source_id, source_title, source_url, document_id } = await req.json();
    if (!bucket || !storage_path || !source_type || !source_title) {
      return new Response(JSON.stringify({ error: "bucket, storage_path, source_type, source_title required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: file, error: dlErr } = await admin.storage.from(bucket).download(storage_path);
    if (dlErr || !file) {
      return new Response(JSON.stringify({ error: dlErr?.message || "File not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const buf = new Uint8Array(await file.arrayBuffer());
    let text = "";
    const lower = storage_path.toLowerCase();
    if (lower.endsWith(".pdf")) {
      try {
        const pdf = await getDocumentProxy(buf);
        const { text: pages } = await extractText(pdf, { mergePages: true });
        text = Array.isArray(pages) ? pages.join("\n\n") : (pages as string);
      } catch (e) {
        console.error("pdf parse failed", e);
        return new Response(JSON.stringify({ error: "Could not parse PDF" }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else if (lower.endsWith(".txt") || lower.endsWith(".md")) {
      text = new TextDecoder().decode(buf);
    } else {
      return new Response(JSON.stringify({ error: "Unsupported file type. PDF, TXT, MD only." }), { status: 415, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!text.trim()) {
      if (document_id) {
        await admin.from("knowledge_documents").update({ ingest_status: "failed", ingest_error: "No text extracted" }).eq("id", document_id);
      }
      return new Response(JSON.stringify({ inserted: 0, warning: "No text extracted" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Forward to ingest-knowledge for chunking + embeddings + status updates
    const ingestResp = await fetch(`${supabaseUrl}/functions/v1/ingest-knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({
        source_type, source_id: source_id ?? null, source_title, source_url: source_url ?? null,
        content: text, document_id: document_id ?? null,
        metadata: { storage_path, bucket },
      }),
    });
    const ingestBody = await ingestResp.json().catch(() => ({}));
    return new Response(JSON.stringify({ ...ingestBody, chars: text.length }), { status: ingestResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("extract-pdf-knowledge error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
