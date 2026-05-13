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
    const mode: "replace" | "append" = body.mode === "append" ? "append" : "replace";
    if (!storagePath) {
      return new Response(JSON.stringify({ error: "Missing storagePath" }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    // Download CSV from storage using service role
    const { data: fileBlob, error: dlErr } = await supabase.storage.from("bcba-imports").download(storagePath);
    if (dlErr || !fileBlob) {
      return new Response(JSON.stringify({ error: `Could not download CSV: ${dlErr?.message ?? "not found"}` }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    }
    console.log(`Processing CSV from storage: ${storagePath}`);

    // Create import record
    const { data: imp, error: impErr } = await supabase
      .from("bcba_billable_imports")
      .insert({ uploaded_by: userId, filename, row_count: 0, is_active: false })
      .select("id").single();
    if (impErr || !imp) throw impErr ?? new Error("import insert failed");

    const batchSize = 500;
    let cols: ReturnType<typeof getRequiredColumnIndexes> | null = null;
    let records: any[] = [];
    let parsedRows = 0;
    let insertedRows = 0;
    const flushRecords = async () => {
      if (records.length === 0) return;
      const batch = records;
      records = [];
      // In append mode dedupe by source_id (upsert/ignore conflicts).
      // In replace mode prior data is wiped after the parse, so plain insert is fine.
      if (mode === "append") {
        const { error, data } = await supabase
          .from("bcba_billable_sessions")
          .upsert(batch, { onConflict: "source_id", ignoreDuplicates: true })
          .select("id");
        if (error) {
          console.error("Upsert error after parsed row", parsedRows, error);
          throw error;
        }
        insertedRows += data?.length ?? 0;
      } else {
        const { error } = await supabase.from("bcba_billable_sessions").insert(batch);
        if (error) {
          console.error("Insert error after parsed row", parsedRows, error);
          throw error;
        }
        insertedRows += batch.length;
      }
    };

    await parseCsvStream(fileBlob, async (r, rowNumber) => {
      if (rowNumber === 0) {
        cols = getRequiredColumnIndexes(r);
        return;
      }
      if (!r || r.length < 5) return;
      parsedRows += 1;
      const c = cols!;
      const voided = (r[c.voided] || "").toLowerCase();
      const deleted = (r[c.deleted] || "").toLowerCase();
      if (voided === "true" || deleted === "true") return;
      const hours = parseFloat(r[c.hours] || "0") || 0;
      const labels = r[c.labels] || "";
      records.push({
        import_id: imp.id,
        source_id: r[c.id] || null,
        date_of_service: parseDate(r[c.dos] || ""),
        client_first: r[c.cf] || null,
        client_last: r[c.cl] || null,
        bcba_name: extractBcba(labels),
        provider_first: r[c.pf] || null,
        provider_last: r[c.pl] || null,
        procedure_code: r[c.code] || null,
        procedure_description: r[c.desc] || null,
        hours,
        raw_labels: labels,
      });
      if (records.length >= batchSize) await flushRecords();
    });
    await flushRecords();
    if (!cols || parsedRows === 0) return new Response(JSON.stringify({ error: "Empty CSV" }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });

    console.log(`Parsed ${insertedRows} records from ${parsedRows} rows (mode=${mode})`);

    if (mode === "replace") {
      // Replace: wipe all prior imports + sessions
      const { data: oldImports } = await supabase
        .from("bcba_billable_imports")
        .select("id")
        .neq("id", imp.id);
      if (oldImports && oldImports.length > 0) {
        const oldIds = oldImports.map((x: any) => x.id);
        await supabase.from("bcba_billable_sessions").delete().in("import_id", oldIds);
        await supabase.from("bcba_billable_imports").delete().in("id", oldIds);
      }
    }
    // Activate this import either way (append keeps prior imports active too)
    await supabase.from("bcba_billable_imports").update({ is_active: true, row_count: insertedRows }).eq("id", imp.id);

    // Remove the uploaded CSV from storage now that it's been processed
    await supabase.storage.from("bcba-imports").remove([storagePath]);

    return new Response(JSON.stringify({ ok: true, importId: imp.id, rows: insertedRows, mode }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});