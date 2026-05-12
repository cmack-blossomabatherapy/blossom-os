import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const STATUS_LABELS = new Set([
  "needs verification","client","reassessment approved","telehealth approved",
  "initial treatment approved","concurrent treatment approved","reassessment",
  "initial assessment approved","tms - billable sessions pulled for secondary",
  "initial treatment","concurrent treatment","initial assessment",
  "staffing needed","secondary for rf","new client","ready to schedule",
  "ready to staff","awaiting auth","awaiting assessment",
]);

function extractBcba(labels: string): string | null {
  if (!labels) return null;
  const parts = labels.split(",").map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    const lower = p.toLowerCase();
    if (STATUS_LABELS.has(lower)) continue;
    if (lower.startsWith("case manager")) continue;
    if (lower.includes("location")) continue;
    if (lower.includes("clinic")) continue;
    if (lower.includes("approved")) continue;
    if (lower.includes("pending")) continue;
    if (/^\d/.test(p)) continue;
    // Heuristic: looks like a person name (2+ words, mostly letters)
    const words = p.split(/\s+/).filter(Boolean);
    if (words.length < 2) continue;
    if (!/^[A-Za-z][A-Za-z'.\- ]+$/.test(p)) continue;
    return p;
  }
  return null;
}

type CsvRowHandler = (row: string[], rowNumber: number) => Promise<void> | void;

// Streaming CSV parser (handles quoted fields, embedded commas, escaped quotes)
async function parseCsvStream(blob: Blob, onRow: CsvRowHandler) {
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  let pendingQuote = false;
  let rowNumber = 0;
  const reader = blob.stream().getReader();
  const decoder = new TextDecoder();

  const emitRow = async () => {
    cur.push(field);
    field = "";
    await onRow(cur, rowNumber++);
    cur = [];
  };

  const consume = async (text: string) => {
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (pendingQuote) {
        if (c === '"') {
          field += '"';
          pendingQuote = false;
          continue;
        }
        inQuotes = false;
        pendingQuote = false;
      }
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else if (i === text.length - 1) pendingQuote = true;
          else inQuotes = false;
        } else field += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ",") { cur.push(field); field = ""; }
        else if (c === "\n") await emitRow();
        else if (c === "\r") { /* skip */ }
        else field += c;
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    await consume(decoder.decode(value, { stream: true }));
  }
  const tail = decoder.decode();
  if (tail) await consume(tail);
  if (field.length || cur.length) await emitRow();
}

function getRequiredColumnIndexes(header: string[]) {
  const idx = (n: string) => header.indexOf(n);
  const cols = {
    id: idx("Id"),
    dos: idx("DateOfService"),
    cf: idx("ClientFirstName"),
    cl: idx("ClientLastName"),
    labels: idx("ClientContactLabels"),
    pf: idx("ProviderFirstName"),
    pl: idx("ProviderLastName"),
    code: idx("ProcedureCode"),
    desc: idx("ProcedureCodeDescription"),
    hours: idx("TimeWorkedInHours"),
    voided: idx("IsVoid"),
    deleted: idx("IsDeleted"),
  };
  const missing = Object.entries(cols).filter(([, value]) => value < 0).map(([key]) => key);
  if (missing.length) throw new Error(`CSV is missing required columns: ${missing.join(", ")}`);
  return cols;
}

function parseDate(s: string): string | null {
  if (!s) return null;
  // Expecting M/D/YYYY [time]
  const datePart = s.split(" ")[0];
  const m = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const mm = m[1].padStart(2, "0");
  const dd = m[2].padStart(2, "0");
  let yy = m[3];
  if (yy.length === 2) yy = "20" + yy;
  return `${yy}-${mm}-${dd}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify caller is admin
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes } = await userClient.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "content-type": "application/json" } });
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "content-type": "application/json" } });

    const body = await req.json();
    const storagePath: string = body.storagePath ?? "";
    const filename: string = body.filename ?? "upload.csv";
    if (!storagePath) {
      return new Response(JSON.stringify({ error: "Missing storagePath" }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    // Download CSV from storage using service role
    const { data: fileBlob, error: dlErr } = await supabase.storage.from("bcba-imports").download(storagePath);
    if (dlErr || !fileBlob) {
      return new Response(JSON.stringify({ error: `Could not download CSV: ${dlErr?.message ?? "not found"}` }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    }
    const csv = await fileBlob.text();
    console.log(`Downloaded CSV: ${csv.length} chars`);

    const rows = parseCsv(csv);
    if (rows.length < 2) return new Response(JSON.stringify({ error: "Empty CSV" }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    const header = rows[0];
    const idx = (n: string) => header.indexOf(n);
    const cols = {
      id: idx("Id"),
      dos: idx("DateOfService"),
      cf: idx("ClientFirstName"),
      cl: idx("ClientLastName"),
      labels: idx("ClientContactLabels"),
      pf: idx("ProviderFirstName"),
      pl: idx("ProviderLastName"),
      code: idx("ProcedureCode"),
      desc: idx("ProcedureCodeDescription"),
      hours: idx("TimeWorkedInHours"),
      voided: idx("IsVoid"),
      deleted: idx("IsDeleted"),
    };

    // Create import record
    const { data: imp, error: impErr } = await supabase
      .from("bcba_billable_imports")
      .insert({ uploaded_by: userId, filename, row_count: 0, is_active: false })
      .select("id").single();
    if (impErr || !imp) throw impErr ?? new Error("import insert failed");

    const records: any[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 5) continue;
      const voided = (r[cols.voided] || "").toLowerCase();
      const deleted = (r[cols.deleted] || "").toLowerCase();
      if (voided === "true" || deleted === "true") continue;
      const hours = parseFloat(r[cols.hours] || "0") || 0;
      const labels = r[cols.labels] || "";
      records.push({
        import_id: imp.id,
        source_id: r[cols.id] || null,
        date_of_service: parseDate(r[cols.dos] || ""),
        client_first: r[cols.cf] || null,
        client_last: r[cols.cl] || null,
        bcba_name: extractBcba(labels),
        provider_first: r[cols.pf] || null,
        provider_last: r[cols.pl] || null,
        procedure_code: r[cols.code] || null,
        procedure_description: r[cols.desc] || null,
        hours,
        raw_labels: labels,
      });
    }

    console.log(`Parsed ${records.length} records from ${rows.length - 1} rows`);

    // Insert in batches
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = await supabase.from("bcba_billable_sessions").insert(batch);
      if (error) {
        console.error("Insert error at batch", i, error);
        throw error;
      }
    }

    // Activate this import; deactivate (and clean up) others
    const { data: oldImports } = await supabase
      .from("bcba_billable_imports")
      .select("id")
      .neq("id", imp.id);
    if (oldImports && oldImports.length > 0) {
      const oldIds = oldImports.map((x: any) => x.id);
      // Delete old sessions and old import rows so storage stays lean
      await supabase.from("bcba_billable_sessions").delete().in("import_id", oldIds);
      await supabase.from("bcba_billable_imports").delete().in("id", oldIds);
    }
    await supabase.from("bcba_billable_imports").update({ is_active: true, row_count: records.length }).eq("id", imp.id);

    // Remove the uploaded CSV from storage now that it's been processed
    await supabase.storage.from("bcba-imports").remove([storagePath]);

    return new Response(JSON.stringify({ ok: true, importId: imp.id, rows: records.length }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});