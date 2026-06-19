// BCBA Productivity upload: reliable server-side batch insert.
//
// Replaces the previous client-side chunked insert which silently dropped
// rows when supabase-js inserts hung mid-upload. The client now parses the
// file, dedupes against existing hashes, and ships chunks here. The service
// role inserts are fast and atomic so 40k+ row uploads actually persist.
//
// Actions:
//   create_batch   -> insert batch row, return batchId
//   append_rows    -> upsert chunk of rows (ignore duplicates on row_hash)
//   finalize_batch -> verify actual row count, update batch counters honestly,
//                     mark failed if fewer rows landed than expected
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing bearer token" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Invalid session" }, 401);
  const callerId = userData.user.id;
  const callerEmail = userData.user.email ?? null;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Authorize: only super_admin / admin / systems_admin can append.
  const ALLOWED_ROLES = ["super_admin", "admin", "systems_admin"] as const;
  let allowed = false;
  for (const role of ALLOWED_ROLES) {
    const { data } = await admin.rpc("has_role", { _user_id: callerId, _role: role });
    if (data) { allowed = true; break; }
  }
  if (!allowed) return json({ error: "Admin access required" }, 403);

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const action = String(body.action ?? "");

  try {
    if (action === "create_batch") {
      const b = (body.batch ?? {}) as Record<string, unknown>;
      const { data, error } = await admin
        .from("bcba_productivity_upload_batches")
        .insert({
          uploaded_by: callerId,
          uploaded_by_email: callerEmail,
          file_name: String(b.file_name ?? "upload.csv"),
          file_size: typeof b.file_size === "number" ? b.file_size : null,
          file_hash: typeof b.file_hash === "string" ? b.file_hash : null,
          upload_label: typeof b.upload_label === "string" ? b.upload_label : null,
          notes: typeof b.notes === "string" ? b.notes : null,
          source_system: "centralreach",
          report_type: "bcba_productivity_billing",
          status: "active",
          parsed_row_count: typeof b.parsed_row_count === "number" ? b.parsed_row_count : 0,
          appended_row_count: 0,
          duplicate_row_count: typeof b.duplicate_row_count === "number" ? b.duplicate_row_count : 0,
          service_date_min: typeof b.service_date_min === "string" ? b.service_date_min : null,
          service_date_max: typeof b.service_date_max === "string" ? b.service_date_max : null,
          metadata: (b.metadata && typeof b.metadata === "object") ? b.metadata : {},
        })
        .select("id")
        .single();
      if (error || !data) return json({ error: error?.message ?? "Failed to create batch" }, 500);
      return json({ batchId: data.id });
    }

    if (action === "append_rows") {
      const batchId = String(body.batchId ?? "");
      const rows = Array.isArray(body.rows) ? body.rows as Record<string, unknown>[] : [];
      if (!batchId) return json({ error: "batchId required" }, 400);
      if (rows.length === 0) return json({ inserted: 0 });
      if (rows.length > 1000) return json({ error: "Max 1000 rows per chunk" }, 400);

      const payload = rows.map((r) => ({
        batch_id: batchId,
        row_hash: String(r.row_hash ?? ""),
        source_system: "centralreach",
        service_date: (r.service_date as string | null) ?? null,
        client_id: (r.client_id as string | null) ?? null,
        client_name: (r.client_name as string | null) ?? null,
        provider_id: (r.provider_id as string | null) ?? null,
        provider_name: (r.provider_name as string | null) ?? null,
        procedure_code: (r.procedure_code as string | null) ?? null,
        hours: typeof r.hours === "number" ? r.hours : null,
        units: typeof r.units === "number" ? r.units : null,
        raw: r.raw ?? {},
        normalized: r.normalized ?? {},
        active: true,
      }));

      // Insert with ON CONFLICT DO NOTHING via upsert on row_hash unique index.
      // The partial unique index uq_bcba_prod_rows_hash_active makes duplicate
      // active hashes silently skipped — exactly the dedupe behavior we want.
      const { error, count } = await admin
        .from("bcba_productivity_billing_rows")
        .upsert(payload, { onConflict: "row_hash", ignoreDuplicates: true, count: "exact" });
      if (error) return json({ error: error.message }, 500);
      return json({ inserted: count ?? payload.length, attempted: payload.length });
    }

    if (action === "finalize_batch") {
      const batchId = String(body.batchId ?? "");
      if (!batchId) return json({ error: "batchId required" }, 400);
      const parsedRowCount = typeof body.parsed_row_count === "number" ? body.parsed_row_count : 0;
      const duplicateRowCount = typeof body.duplicate_row_count === "number" ? body.duplicate_row_count : 0;
      const serviceDateMin = typeof body.service_date_min === "string" ? body.service_date_min : null;
      const serviceDateMax = typeof body.service_date_max === "string" ? body.service_date_max : null;

      // Source of truth: actual rows visible in DB for this batch.
      const { count: actual, error: countErr } = await admin
        .from("bcba_productivity_billing_rows")
        .select("id", { count: "exact", head: true })
        .eq("batch_id", batchId);
      if (countErr) return json({ error: countErr.message }, 500);
      const actualRows = actual ?? 0;

      const status = body.expectedNew && actualRows < Number(body.expectedNew)
        ? "failed"
        : "active";

      const { error: updErr } = await admin
        .from("bcba_productivity_upload_batches")
        .update({
          status,
          parsed_row_count: parsedRowCount,
          appended_row_count: actualRows,
          duplicate_row_count: duplicateRowCount,
          service_date_min: serviceDateMin,
          service_date_max: serviceDateMax,
        })
        .eq("id", batchId);
      if (updErr) return json({ error: updErr.message }, 500);

      return json({ ok: status === "active", actualRows, status });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ error: (e as Error).message ?? "Unexpected error" }, 500);
  }
});