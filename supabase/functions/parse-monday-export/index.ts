import { createClient } from "npm:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Board =
  | "leads"
  | "clients"
  | "no_oon"
  | "authorizations"
  | "auth_approvals"
  | "denials"
  | "va_credentialing";

const TABLE: Record<Board, string> = {
  leads: "monday_leads_raw",
  clients: "monday_clients_raw",
  no_oon: "monday_no_oon_raw",
  authorizations: "monday_authorizations_raw",
  auth_approvals: "monday_auth_approvals_raw",
  denials: "monday_denials_raw",
  va_credentialing: "va_credentialing_raw",
};

const NULL_TOKENS = new Set([
  "no insurance selected",
  "no state selected",
  "no gender",
  "no source",
  "no email",
  "",
]);

function norm(v: unknown): any {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  const s = String(v).trim();
  if (NULL_TOKENS.has(s.toLowerCase())) return null;
  return s;
}

function isGroupRow(row: any[]): boolean {
  // Single non-empty cell in first position = Monday group divider
  if (!row || row.length === 0) return false;
  const first = row[0];
  if (first == null || String(first).trim() === "") return false;
  for (let i = 1; i < row.length; i++) {
    if (row[i] != null && String(row[i]).trim() !== "") return false;
  }
  return true;
}

function isHeaderRow(row: any[]): boolean {
  const first = row?.[0];
  if (first == null) return false;
  const s = String(first).trim().toLowerCase();
  return s === "name" || s === "name of patient" || s === "subitems";
}

function isSubitemHeader(row: any[]): boolean {
  const first = row?.[0];
  return first != null && String(first).trim().toLowerCase() === "subitems";
}

async function processBoard(
  supabase: any,
  board: Board,
  storagePath: string,
  sourceFile: string
) {
  const { data: fileData, error: dlErr } = await supabase.storage
    .from("data-uploads")
    .download(storagePath);
  if (dlErr) throw new Error(`Download failed: ${dlErr.message}`);
  const buf = new Uint8Array(await fileData.arrayBuffer());
  const wb = XLSX.read(buf, { type: "array", cellDates: true });

  // Main sheet = first sheet
  const mainSheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[mainSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: false,
    dateNF: "yyyy-mm-dd",
  });
  // Free the workbook ASAP
  delete (wb.Sheets as any)[mainSheetName];

  let currentGroup: string | null = null;
  let header: string[] = [];
  let inSubitems = false;
  let parentItemName: string | null = null;
  let parentItemId: string | null = null;
  let subHeader: string[] = [];

  const table = TABLE[board];
  let inserted = 0;
  let updated = 0;
  let subInserted = 0;
  let mainBuf: any[] = [];
  let subBuf: any[] = [];
  const FLUSH = 300;

  async function flushMain() {
    if (!mainBuf.length) return;
    const withId = mainBuf.filter((r) => r.monday_item_id);
    const noId = mainBuf.filter((r) => !r.monday_item_id);
    if (withId.length) {
      const { error, count } = await supabase
        .from(table)
        .upsert(withId, { onConflict: "monday_item_id", count: "exact" });
      if (error) throw new Error(`Upsert ${table}: ${error.message}`);
      inserted += withId.length; // best-effort; upsert doesn't split counts
    }
    if (noId.length) {
      const { error } = await supabase.from(table).insert(noId);
      if (error) throw new Error(`Insert ${table}: ${error.message}`);
      inserted += noId.length;
    }
    mainBuf = [];
  }
  async function flushSub() {
    if (!subBuf.length) return;
    const withId = subBuf.filter((r) => r.monday_item_id);
    const noId = subBuf.filter((r) => !r.monday_item_id);
    if (withId.length) {
      const { error } = await supabase
        .from("monday_subitems_raw")
        .upsert(withId, { onConflict: "monday_item_id" });
      if (error) throw new Error(`Subitems: ${error.message}`);
      subInserted += withId.length;
    }
    if (noId.length) {
      const { error } = await supabase.from("monday_subitems_raw").insert(noId);
      if (error) throw new Error(`Subitems insert: ${error.message}`);
      subInserted += noId.length;
    }
    subBuf = [];
  }

  // Skip row 0 (board name)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => c == null || String(c).trim() === "")) continue;

    if (isSubitemHeader(row)) {
      // Next row will be subitem column header
      inSubitems = true;
      subHeader = [];
      continue;
    }
    if (inSubitems && subHeader.length === 0 && row[1] != null) {
      // First row after Subitems is sub-header (col 1 = "Name")
      subHeader = row.map((c) => (c == null ? "" : String(c).trim()));
      continue;
    }
    if (inSubitems) {
      // Subitem data row (col 0 empty, col 1 = name)
      if (row[0] != null && String(row[0]).trim() !== "") {
        // Exited subitems section
        inSubitems = false;
        subHeader = [];
      } else {
        const rec: Record<string, any> = {};
        subHeader.forEach((h, idx) => {
          if (h) rec[h] = norm(row[idx]);
        });
        const itemId =
          rec["Item ID (auto generated)"] || rec["Item ID"] || null;
        const dueRaw = rec["Due Date"] || rec["Due"];
        let dueDate: string | null = null;
        if (dueRaw) {
          const d = new Date(dueRaw);
          if (!isNaN(+d)) dueDate = d.toISOString().slice(0, 10);
        }
        subBuf.push({
          parent_board: board,
          parent_item_id: parentItemId,
          parent_item_name: parentItemName,
          monday_item_id: itemId ? String(itemId) : null,
          name: rec["Name"] || null,
          owner: rec["Owner"] || null,
          status: rec["Status"] || null,
          due_date: dueDate,
          data: rec,
          source_file: sourceFile,
        });
        if (subBuf.length >= FLUSH) await flushSub();
        continue;
      }
    }

    if (isHeaderRow(row)) {
      header = row.map((c) => (c == null ? "" : String(c).trim()));
      continue;
    }
    if (isGroupRow(row)) {
      currentGroup = String(row[0]).trim();
      continue;
    }
    if (header.length === 0) continue;

    // Data row
    const rec: Record<string, any> = {};
    header.forEach((h, idx) => {
      if (h && h !== "Subitems") rec[h] = norm(row[idx]);
    });
    const name =
      rec["Name"] || rec["Name of Patient"] || rec[header[0]] || null;
    if (!name || String(name).trim() === "") continue;
    parentItemName = String(name);

    const itemId =
      rec["Item ID (auto generated)"] ||
      rec["Item ID"] ||
      // Last numeric-only field as fallback
      null;
    parentItemId = itemId ? String(itemId) : null;

    mainBuf.push({
      monday_item_id: parentItemId,
      monday_group: currentGroup,
      name: String(name),
      state: rec["State"] || null,
      status: rec["Status"] || rec["VOB Status"] || rec["SCA Status"] || null,
      owner:
        rec["Person"] ||
        rec["People"] ||
        rec["Intake Person"] ||
        rec["Main Assignee"] ||
        rec["Case Manager"] ||
        null,
      data: rec,
      source_file: sourceFile,
    });
    if (mainBuf.length >= FLUSH) await flushMain();
  }
  await flushMain();
  await flushSub();

  // Free the big rows array
  rows.length = 0;

  // Updates sheet
  let updInserted = 0;
  if (wb.SheetNames.includes("updates")) {
    const uSheet = wb.Sheets["updates"];
    const uRows: any[][] = XLSX.utils.sheet_to_json(uSheet, {
      header: 1,
      defval: null,
      raw: false,
    });
    // First row = board name, second = header
    const uHeader = (uRows[1] || []).map((c) =>
      c == null ? "" : String(c).trim()
    );
    const records: any[] = [];
    for (let i = 2; i < uRows.length; i++) {
      const r = uRows[i];
      if (!r || r.every((c) => c == null || String(c).trim() === "")) continue;
      const rec: Record<string, any> = {};
      uHeader.forEach((h, idx) => {
        if (h) rec[h] = norm(r[idx]);
      });
      const postedRaw = rec["Created at"] || rec["Date"] || rec["Posted"];
      let postedAt: string | null = null;
      if (postedRaw) {
        const d = new Date(postedRaw);
        if (!isNaN(+d)) postedAt = d.toISOString();
      }
      records.push({
        parent_board: board,
        parent_item_name: rec[Object.keys(rec)[0]] || null,
        author: rec["Author"] || rec["Created by"] || rec["By"] || null,
        posted_at: postedAt,
        body: rec["Update"] || rec["Updates"] || rec["Body"] || null,
        source_file: sourceFile,
      });
    }
    for (let i = 0; i < records.length; i += 500) {
      const chunk = records.slice(i, i + 500);
      const { error } = await supabase.from("monday_updates_raw").insert(chunk);
      if (error) throw new Error(`Updates: ${error.message}`);
      updInserted += chunk.length;
    }
  }

  return {
    rows_inserted: inserted,
    rows_updated: updated,
    subitems_inserted: subInserted,
    updates_inserted: updInserted,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const started = Date.now();
  let runId: string | null = null;
  let board: Board | null = null;
  let storagePath = "";

  try {
    const body = await req.json();
    board = body.board as Board;
    storagePath = body.storage_path as string;
    if (!board || !TABLE[board])
      throw new Error(`Invalid board: ${board}. Valid: ${Object.keys(TABLE).join(", ")}`);
    if (!storagePath) throw new Error("storage_path required");

    const userId = body.user_id || null;
    const sourceFile = storagePath.split("/").pop() || storagePath;

    const { data: run } = await supabase
      .from("monday_import_runs")
      .insert({
        board,
        storage_path: storagePath,
        started_by: userId,
      })
      .select("id")
      .single();
    runId = run?.id;

    const result = await processBoard(supabase, board, storagePath, sourceFile);

    await supabase
      .from("monday_import_runs")
      .update({
        ...result,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - started,
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({ ok: true, run_id: runId, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("parse-monday-export error", e);
    if (runId) {
      await supabase
        .from("monday_import_runs")
        .update({
          error: e.message,
          finished_at: new Date().toISOString(),
          duration_ms: Date.now() - started,
        })
        .eq("id", runId);
    }
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});