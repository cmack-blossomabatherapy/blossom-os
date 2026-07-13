// Bulk-upsert resource metadata for the Resource Library import.
// Guarded by a shared secret (RESOURCE_INGEST_SECRET). Server-side only.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Row = {
  resource_id: string;
  title: string;
  description?: string | null;
  kind: string;
  category: string;
  manifest_upload_path?: string | null;
  storage_path?: string | null;
  storage_bucket?: string | null;
  file_name?: string | null;
  visibility_roles?: string[];
  departments?: string[];
  topic_tags?: string[];
  state_scope?: string[];
  tags?: string[];
  visibility_level?: string | null;
  is_sensitive?: boolean;
  requires_acknowledgement?: boolean;
  training_related?: boolean;
  sop_related?: boolean;
  owner?: string | null;
  last_reviewed_date?: string | null;
  resource_type?: string | null;
  attachment_status?: string;
  upload_status?: string;
  sensitivity?: string;
  import_batch?: number;
  pending_reason?: string | null;
  uploaded_by_name?: string | null;
  is_active?: boolean;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const shared = Deno.env.get("RESOURCE_INGEST_SECRET");
  const bootstrap = Deno.env.get("RESOURCE_INGEST_BOOTSTRAP");
  const provided = req.headers.get("x-ingest-secret");
  const ok = (shared && provided === shared) || (bootstrap && provided === bootstrap);
  if (!ok) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "upsert";

  // Mode: return signed upload URLs so the importer can PUT file bytes
  // straight into the private `resource-library` bucket.
  if (mode === "sign_uploads") {
    let payload: { paths?: string[] };
    try { payload = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "invalid_json" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const paths = Array.isArray(payload.paths) ? payload.paths : [];
    const out: Array<{ path: string; signedUrl?: string; token?: string; error?: string }> = [];
    for (const p of paths) {
      const { data, error } = await supabase.storage
        .from("resource-library")
        .createSignedUploadUrl(p, { upsert: true });
      if (error || !data) out.push({ path: p, error: error?.message ?? "sign_failed" });
      else out.push({ path: p, signedUrl: data.signedUrl, token: data.token });
    }
    return new Response(JSON.stringify({ ok: true, results: out }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { rows?: Row[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (!rows.length) {
    return new Response(JSON.stringify({ error: "no_rows" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cleaned = rows.map((r) => ({
    resource_id: r.resource_id,
    title: r.title,
    description: r.description ?? null,
    kind: r.kind,
    category: r.category,
    manifest_upload_path: r.manifest_upload_path ?? null,
    storage_path: r.storage_path ?? null,
    storage_bucket: r.storage_bucket ?? "resource-library",
    file_name: r.file_name ?? null,
    visibility_roles: r.visibility_roles ?? [],
    departments: r.departments ?? [],
    topic_tags: r.topic_tags ?? [],
    state_scope: r.state_scope ?? [],
    tags: r.tags ?? [],
    visibility_level: r.visibility_level ?? null,
    is_sensitive: !!r.is_sensitive,
    requires_acknowledgement: !!r.requires_acknowledgement,
    training_related: !!r.training_related,
    sop_related: !!r.sop_related,
    owner: r.owner ?? null,
    last_reviewed_date: r.last_reviewed_date || null,
    resource_type: r.resource_type ?? null,
    attachment_status: r.attachment_status ?? "pending_upload",
    upload_status: r.upload_status ?? "pending_review",
    sensitivity: r.sensitivity ?? "public_internal",
    import_batch: r.import_batch ?? null,
    pending_reason: r.pending_reason ?? null,
    uploaded_by_name: r.uploaded_by_name ?? "Batch Import",
    is_active: r.is_active !== false,
  }));

  const { error, count } = await supabase
    .from("hr_resources")
    .upsert(cleaned, { onConflict: "resource_id", count: "exact" });

  if (error) {
    console.error("upsert error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ ok: true, upserted: count ?? cleaned.length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});