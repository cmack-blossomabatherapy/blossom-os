/**
 * Admin-uploaded BCBA Productivity dataset (shared across users via Supabase).
 *
 * This module powers the Super Admin > System Tools > BCBA Productivity Uploads
 * page. Admins upload the CentralReach billing export here so the BCBA
 * Productivity Report V3 can load one shared, appended, deduped dataset for users.
 */

import { supabase } from "@/integrations/supabase/client";
import { parseAnyFile } from "@/lib/os/dashboardEngine/excelParser";
import { normalizeUsState, resolveRowState } from "./stateNormalization";

/* ----- shared types ----- */

export interface BcbaSharedBillingRow {
  clientId: string;
  clientName: string;
  rbt: string;
  renderingProvider: string;
  providerLabels: string;
  code: string;
  hours: number;
  date: string; // ISO YYYY-MM-DD
  state: string;
  payor: string;
}

export interface BcbaUploadBatch {
  id: string;
  createdAt: string;
  uploadedBy: string | null;
  uploadedByEmail: string | null;
  fileName: string;
  fileSize: number | null;
  fileHash: string | null;
  uploadLabel: string | null;
  notes: string | null;
  sourceSystem: string;
  reportType: string;
  status: "active" | "voided" | "failed" | string;
  parsedRowCount: number;
  appendedRowCount: number;
  duplicateRowCount: number;
  serviceDateMin: string | null;
  serviceDateMax: string | null;
  metadata: Record<string, unknown>;
}

export interface BcbaUploadParseResult {
  fileName: string;
  fileSize: number;
  headers: string[];
  rawRowCount: number;
  parsedRows: ParsedRow[];
  dropReasons: Record<string, number>;
  serviceDateMin: string | null;
  serviceDateMax: string | null;
  missingColumns: string[];
}

export interface BcbaUploadPreview extends BcbaUploadParseResult {
  duplicateRowCount: number;
  newRowCount: number;
}

export interface BcbaUploadAppendResult {
  batchId: string;
  parsedRowCount: number;
  appendedRowCount: number;
  duplicateRowCount: number;
  serviceDateMin: string | null;
  serviceDateMax: string | null;
}

export interface BcbaDatasetStatus {
  activeRowCount: number;
  batchCount: number;
  earliestServiceDate: string | null;
  latestServiceDate: string | null;
  lastUploadAt: string | null;
  lastUploadedByEmail: string | null;
}

/* ----- internal types ----- */

interface ParsedRow {
  row: BcbaSharedBillingRow;
  raw: Record<string, unknown>;
  rowHash: string;
  providerId: string;
  units: number | null;
}

/* ----- helpers ----- */

const normH = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");
function findH(headers: string[], cands: string[]) {
  const m = new Map(headers.map((h) => [normH(h), h]));
  for (const c of cands) {
    const hit = m.get(normH(c));
    if (hit) return hit;
  }
  return null;
}
function isoDate(d: string) {
  if (!d) return "";
  const t = new Date(d).getTime();
  return isFinite(t) ? new Date(t).toISOString().slice(0, 10) : "";
}
function numVal(v: unknown): number {
  if (v === undefined || v === null || v === "") return NaN;
  const n = parseFloat(String(v).replace(/[$,%]/g, ""));
  return isFinite(n) ? n : NaN;
}
function normText(v: unknown): string {
  return String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}
function normNumStr(n: number): string {
  if (!isFinite(n)) return "";
  return (Math.round(n * 1000) / 1000).toString();
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback (should not normally hit in browser)
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return `fb_${h}`;
}

/* ----- parse ----- */

export async function parseBcbaProductivityUpload(file: File): Promise<BcbaUploadParseResult> {
  const parsed = await parseAnyFile(file);
  const first = parsed[0];
  if (!first) throw new Error("No data found in file.");
  const h = first.headers;

  const clientIdH = findH(h, ["ClientId", "Client ID", "PatientId", "MRN"]);
  const cliFirstH = findH(h, ["ClientFirstName", "Client First Name"]);
  const cliLastH = findH(h, ["ClientLastName", "Client Last Name"]);
  const clientNameH = findH(h, ["Client", "Client Name", "Patient", "Patient Name"]);
  const dosH = findH(h, ["DateOfService", "Date Of Service", "ServiceDate", "DOS", "Date"]);
  const codeH = findH(h, ["ProcedureCode", "Procedure Code", "Code", "CPT", "Service Code"]);
  const hoursH = findH(h, [
    "TimeWorkedInHours", "Time Worked In Hours", "Hours", "BillableHours", "Billable Hours", "ServiceHours",
  ]);
  const provIdH = findH(h, ["ProviderId", "Provider ID", "RenderingProviderId"]);
  const provFirstH = findH(h, ["ProviderFirstName", "Provider First Name"]);
  const provLastH = findH(h, ["ProviderLastName", "Provider Last Name"]);
  const provNameH = findH(h, ["Provider", "Provider Name", "RenderingProvider", "Rendering Provider"]);
  // State is resolved per-row via resolveRowState (column fallback + normalization),
  // so we don't pick a single global state header here.
  const payorH = findH(h, ["PayorNickname", "PayorName", "Payor Name", "Payor", "Payer", "Insurance"]);
  const provLabelsH = findH(h, [
    "ProviderContactLabels", "Provider Contact Labels", "ProviderLabels", "Provider Labels",
  ]);
  const startH = findH(h, ["StartTime", "Start Time", "TimeIn"]);
  const endH = findH(h, ["EndTime", "End Time", "TimeOut"]);
  const unitsH = findH(h, ["Units", "BilledUnits", "Billed Units"]);
  const apptIdH = findH(h, [
    "AppointmentId", "Appointment ID", "SessionId", "Session ID", "BillingId", "Billing ID",
  ]);

  const missing: string[] = [];
  if (!clientNameH && !(cliFirstH || cliLastH)) missing.push("Client name");
  if (!dosH) missing.push("DateOfService");
  if (!codeH) missing.push("ProcedureCode");
  if (!hoursH) missing.push("Hours");

  const drop: Record<string, number> = {};
  const bump = (k: string) => { drop[k] = (drop[k] || 0) + 1; };
  const parsedRows: ParsedRow[] = [];
  let dateMin = "", dateMax = "";

  if (missing.length === 0) {
    // First pass: build rows + collect hash keys synchronously.
    interface Pending {
      row: BcbaSharedBillingRow;
      raw: Record<string, unknown>;
      providerId: string;
      units: number | null;
      hashKey: string;
    }
    const pending: Pending[] = [];
    for (const r of first.rows) {
      const code = String((codeH ? r[codeH] : "") ?? "").trim();
      const hours = numVal(hoursH ? r[hoursH] : "");
      const clientName =
        String((clientNameH ? r[clientNameH] : "") ?? "").trim() ||
        [cliFirstH ? r[cliFirstH] : "", cliLastH ? r[cliLastH] : ""].filter(Boolean).join(" ").trim();
      const clientId = String((clientIdH ? r[clientIdH] : "") ?? "").trim();
      const dos = isoDate(String((dosH ? r[dosH] : "") ?? "").trim());

      if (!dos) { bump("No parseable Date of Service"); continue; }
      if (!clientName && !clientId) { bump("No client identity"); continue; }
      if (!code) { bump("No procedure code"); continue; }
      if (!isFinite(hours) || hours <= 0) { bump("No numeric hours"); continue; }

      const renderingProvider =
        String((provNameH ? r[provNameH] : "") ?? "").trim() ||
        [provFirstH ? r[provFirstH] : "", provLastH ? r[provLastH] : ""].filter(Boolean).join(" ").trim();
      const providerId = String((provIdH ? r[provIdH] : "") ?? "").trim();
      const isRbt = /^97153\b/.test(code);
      const units = unitsH ? numVal(r[unitsH]) : NaN;
      const startTime = startH ? String(r[startH] ?? "").trim() : "";
      const endTime = endH ? String(r[endH] ?? "").trim() : "";
      const apptId = apptIdH ? String(r[apptIdH] ?? "").trim() : "";

      const row: BcbaSharedBillingRow = {
        clientId,
        clientName,
        rbt: isRbt ? renderingProvider : "",
        renderingProvider,
        providerLabels: String((provLabelsH ? r[provLabelsH] : "") ?? "").trim(),
        code,
        hours,
        date: dos,
        state: resolveRowState(r as Record<string, unknown>),
        payor: String((payorH ? r[payorH] : "") ?? "").trim(),
      };

      const hashKey = apptId
        ? `appt|${normText(apptId)}`
        : [
            "v1",
            dos,
            normText(clientId),
            normText(clientName),
            normText(providerId),
            normText(renderingProvider),
            normText(code),
            normText(startTime),
            normText(endTime),
            normNumStr(hours),
            isFinite(units) ? normNumStr(units) : "",
          ].join("|");
      pending.push({ row, raw: r as Record<string, unknown>, providerId, units: isFinite(units) ? units : null, hashKey });
      if (!dateMin || dos < dateMin) dateMin = dos;
      if (!dateMax || dos > dateMax) dateMax = dos;
    }

    // Second pass: hash everything in parallel batches so we don't await per-row.
    const HASH_BATCH = 1000;
    for (let i = 0; i < pending.length; i += HASH_BATCH) {
      const slice = pending.slice(i, i + HASH_BATCH);
      const hashes = await Promise.all(slice.map((p) => sha256Hex(p.hashKey)));
      for (let j = 0; j < slice.length; j++) {
        const p = slice[j];
        parsedRows.push({
          row: p.row,
          raw: p.raw,
          rowHash: hashes[j],
          providerId: p.providerId,
          units: p.units,
        });
      }
    }
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    headers: h,
    rawRowCount: first.rows.length,
    parsedRows,
    dropReasons: drop,
    serviceDateMin: dateMin || null,
    serviceDateMax: dateMax || null,
    missingColumns: missing,
  };
}

export async function previewBcbaProductivityUpload(file: File): Promise<BcbaUploadPreview> {
  const parsed = await parseBcbaProductivityUpload(file);
  if (parsed.missingColumns.length || parsed.parsedRows.length === 0) {
    return { ...parsed, duplicateRowCount: 0, newRowCount: parsed.parsedRows.length };
  }
  const hashes = parsed.parsedRows.map((r) => r.rowHash);
  const existing = await fetchExistingHashes(hashes);
  let duplicateRowCount = 0;
  for (const h of hashes) if (existing.has(h)) duplicateRowCount += 1;
  return {
    ...parsed,
    duplicateRowCount,
    newRowCount: parsed.parsedRows.length - duplicateRowCount,
  };
}

async function fetchExistingHashes(hashes: string[]): Promise<Set<string>> {
  const existing = new Set<string>();
  if (hashes.length === 0) return existing;
  const CHUNK = 250;
  const chunks: string[][] = [];
  for (let i = 0; i < hashes.length; i += CHUNK) {
    chunks.push(hashes.slice(i, i + CHUNK));
  }
  // Run dup-check queries in parallel waves to avoid sequential round-trips.
  const WAVE = 6;
  for (let i = 0; i < chunks.length; i += WAVE) {
    const wave = chunks.slice(i, i + WAVE);
    const results = await Promise.all(
      wave.map((chunk) =>
        supabase
          .from("bcba_productivity_billing_rows")
          .select("row_hash")
          .eq("active", true)
          .in("row_hash", chunk),
      ),
    );
    for (const { data, error } of results) {
      if (error) throw error;
      for (const d of data ?? []) existing.add((d as { row_hash: string }).row_hash);
    }
  }
  return existing;
}

/* ----- append ----- */

export interface AppendInput {
  file: File;
  uploadLabel?: string;
  notes?: string;
  parsed?: BcbaUploadParseResult;
}

export async function appendBcbaProductivityUpload(input: AppendInput): Promise<BcbaUploadAppendResult> {
  const parsed = input.parsed ?? (await parseBcbaProductivityUpload(input.file));
  if (parsed.missingColumns.length) {
    throw new Error(`Missing required columns: ${parsed.missingColumns.join(", ")}`);
  }

  // Pre-check duplicates (against current active rows).
  const hashes = parsed.parsedRows.map((r) => r.rowHash);
  const existing = await fetchExistingHashes(hashes);

  const toInsertSource = parsed.parsedRows.filter((p) => !existing.has(p.rowHash));
  // Dedupe within file itself.
  const seenInFile = new Set<string>();
  const toInsert: ParsedRow[] = [];
  for (const p of toInsertSource) {
    if (seenInFile.has(p.rowHash)) continue;
    seenInFile.add(p.rowHash);
    toInsert.push(p);
  }
  const duplicateRowCount = parsed.parsedRows.length - toInsert.length;

  // Create batch row via Edge Function (service-role, reliable).
  const fileHash = await sha256Hex(`${input.file.name}|${input.file.size}|${parsed.rawRowCount}`);
  const createRes = await callUploadFn({
    action: "create_batch",
    batch: {
      file_name: input.file.name,
      file_size: input.file.size,
      file_hash: fileHash,
      upload_label: input.uploadLabel || null,
      notes: input.notes || null,
      parsed_row_count: parsed.parsedRows.length,
      duplicate_row_count: duplicateRowCount,
      service_date_min: parsed.serviceDateMin,
      service_date_max: parsed.serviceDateMax,
      metadata: {
        rawRowCount: parsed.rawRowCount,
        dropReasons: parsed.dropReasons,
      },
    },
  });
  const batchId = createRes.batchId as string;
  if (!batchId) throw new Error("Failed to create upload batch");

  // Insert rows in chunks via Edge Function with limited concurrency.
  // Server-side inserts using the service role are fast and reliable,
  // and do not depend on the browser staying open or supabase-js promise
  // delivery quirks.
  let actuallyInserted = 0;
  if (toInsert.length > 0) {
    const CHUNK = 500;
    const CONCURRENCY = 3;
    const chunks: ParsedRow[][] = [];
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      chunks.push(toInsert.slice(i, i + CHUNK));
    }
    let cursor = 0;
    async function worker() {
      while (cursor < chunks.length) {
        const idx = cursor++;
        const slice = chunks[idx];
        const payload = slice.map((p) => ({
          row_hash: p.rowHash,
          service_date: p.row.date || null,
          client_id: p.row.clientId || null,
          client_name: p.row.clientName || null,
          provider_id: p.providerId || null,
          provider_name: p.row.renderingProvider || null,
          procedure_code: p.row.code || null,
          hours: p.row.hours,
          units: p.units,
          raw: p.raw,
          normalized: p.row,
        }));
        const res = await callUploadFn({ action: "append_rows", batchId, rows: payload });
        actuallyInserted += Number(res.inserted ?? 0);
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, chunks.length) }, worker));
  }

  // Finalize: server verifies actual row count and updates the batch row
  // with honest counters (no more "42707 appended" while only 6000 landed).
  const fin = await callUploadFn({
    action: "finalize_batch",
    batchId,
    expectedNew: toInsert.length,
    parsed_row_count: parsed.parsedRows.length,
    duplicate_row_count: duplicateRowCount,
    service_date_min: parsed.serviceDateMin,
    service_date_max: parsed.serviceDateMax,
  });
  const actualRows = Number(fin.actualRows ?? actuallyInserted);
  if (toInsert.length > 0 && actualRows < toInsert.length) {
    throw new Error(
      `Upload incomplete: only ${actualRows.toLocaleString()} of ${toInsert.length.toLocaleString()} new rows landed. The batch has been marked failed — please re-upload.`,
    );
  }

  return {
    batchId,
    parsedRowCount: parsed.parsedRows.length,
    appendedRowCount: actualRows,
    duplicateRowCount,
    serviceDateMin: parsed.serviceDateMin,
    serviceDateMax: parsed.serviceDateMax,
  };
}

/** Invoke the bcba-productivity-upload Edge Function. */
async function callUploadFn(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke("bcba-productivity-upload", { body });
  if (error) {
    const detail = (data && typeof data === "object" && "error" in (data as any))
      ? (data as any).error
      : error.message;
    throw new Error(detail || "Upload service error");
  }
  if (data && typeof data === "object" && "error" in data) {
    throw new Error(String((data as any).error));
  }
  return (data ?? {}) as Record<string, unknown>;
}

/* ----- queries ----- */

function mapBatch(b: any): BcbaUploadBatch {
  return {
    id: b.id,
    createdAt: b.created_at,
    uploadedBy: b.uploaded_by,
    uploadedByEmail: b.uploaded_by_email,
    fileName: b.file_name,
    fileSize: b.file_size,
    fileHash: b.file_hash,
    uploadLabel: b.upload_label,
    notes: b.notes,
    sourceSystem: b.source_system,
    reportType: b.report_type,
    status: b.status,
    parsedRowCount: b.parsed_row_count,
    appendedRowCount: b.appended_row_count,
    duplicateRowCount: b.duplicate_row_count,
    serviceDateMin: b.service_date_min,
    serviceDateMax: b.service_date_max,
    metadata: (b.metadata as Record<string, unknown>) ?? {},
  };
}

export async function listBcbaProductivityUploadBatches(): Promise<BcbaUploadBatch[]> {
  const { data, error } = await supabase
    .from("bcba_productivity_upload_batches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map(mapBatch);
}

export interface GetSharedRowsOptions {
  limit?: number;
}

export async function getBcbaProductivitySharedRows(
  opts: GetSharedRowsOptions = {},
): Promise<BcbaSharedBillingRow[]> {
  const PAGE = 1000;
  const max = opts.limit ?? 100000;
  const out: BcbaSharedBillingRow[] = [];
  let from = 0;
  while (out.length < max) {
    const to = Math.min(from + PAGE - 1, max - 1);
    const { data, error } = await supabase
      .from("bcba_productivity_billing_rows")
      .select("normalized,raw")
      .eq("active", true)
      .order("service_date", { ascending: true })
      .range(from, to);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const d of data) {
      const n = (d.normalized as unknown as BcbaSharedBillingRow) || null;
      if (n && n.date && n.code) {
        const normState = normalizeUsState(n.state);
        const state = normState || resolveRowState((d as any).raw as Record<string, unknown>);
        out.push({ ...n, state });
      }
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

export async function getBcbaProductivityDatasetStatus(): Promise<BcbaDatasetStatus> {
  const { count: rowCount, error: rowErr } = await supabase
    .from("bcba_productivity_billing_rows")
    .select("id", { count: "exact", head: true })
    .eq("active", true);
  if (rowErr) throw rowErr;

  const { data: batchData, error: batchErr } = await supabase
    .from("bcba_productivity_upload_batches")
    .select("id,created_at,uploaded_by_email,service_date_min,service_date_max,status")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (batchErr) throw batchErr;

  let earliest: string | null = null;
  let latest: string | null = null;
  for (const b of batchData ?? []) {
    if (b.service_date_min && (!earliest || b.service_date_min < earliest)) earliest = b.service_date_min;
    if (b.service_date_max && (!latest || b.service_date_max > latest)) latest = b.service_date_max;
  }

  const last = (batchData ?? [])[0];
  return {
    activeRowCount: rowCount ?? 0,
    batchCount: batchData?.length ?? 0,
    earliestServiceDate: earliest,
    latestServiceDate: latest,
    lastUploadAt: last?.created_at ?? null,
    lastUploadedByEmail: last?.uploaded_by_email ?? null,
  };
}

export async function voidBcbaProductivityBatch(batchId: string, reason?: string): Promise<void> {
  const { error: rowsErr } = await supabase
    .from("bcba_productivity_billing_rows")
    .update({ active: false })
    .eq("batch_id", batchId);
  if (rowsErr) throw rowsErr;
  const { error: batchErr } = await supabase
    .from("bcba_productivity_upload_batches")
    .update({
      status: "voided",
      metadata: { voided_at: new Date().toISOString(), void_reason: reason || null },
    })
    .eq("id", batchId);
  if (batchErr) throw batchErr;
}

export async function getBcbaProductivityBatchRows(batchId: string): Promise<BcbaSharedBillingRow[]> {
  const { data, error } = await supabase
    .from("bcba_productivity_billing_rows")
    .select("normalized")
    .eq("batch_id", batchId);
  if (error) throw error;
  return (data ?? [])
    .map((d) => d.normalized as unknown as BcbaSharedBillingRow)
    .filter((r) => !!r && !!r.date);
}