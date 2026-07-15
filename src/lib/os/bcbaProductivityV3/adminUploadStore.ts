/**
 * Admin-uploaded BCBA Productivity dataset (shared across users via Supabase).
 *
 * This module powers the Super Admin > System Tools > BCBA Productivity Uploads
 * page. Admins upload the CentralReach billing export here so the BCBA
 * Productivity Report V3 can load one shared, appended, deduped dataset for users.
 */

import { supabase } from "@/integrations/supabase/client";
import { parseAnyFile } from "@/lib/os/dashboardEngine/excelParser";
import { STATE_FALLBACK_COLUMNS, normalizeUsState, resolveRowState } from "./stateNormalization";

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
    // CentralReach billing exports include an `Id` column that is the
    // strongest unique row identifier — prefer it above all other ids so
    // cumulative daily uploads dedupe reliably without removing legitimate
    // distinct rows that happen to share date/client/provider/code/hours.
    "Id", "CentralReachId", "CentralReach Id", "Row Id", "RowId",
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
    const rawAuditHeaders = Array.from(new Set([
      clientIdH, cliFirstH, cliLastH, clientNameH, dosH, codeH, hoursH,
      provIdH, provFirstH, provLastH, provNameH, payorH, provLabelsH,
      startH, endH, unitsH, apptIdH,
      ...STATE_FALLBACK_COLUMNS.map((col) => findH(h, [col])),
    ].filter(Boolean))) as string[];
    const compactRaw = (r: Record<string, unknown>) => {
      const out: Record<string, unknown> = {};
      for (const header of rawAuditHeaders) {
        const value = r[header];
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          out[header] = value;
        }
      }
      return out;
    };

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
      pending.push({ row, raw: compactRaw(r as Record<string, unknown>), providerId, units: isFinite(units) ? units : null, hashKey });
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
  // eslint-disable-next-line no-console
  console.info("[bcba-upload] preview: parsing file", { name: file.name, size: file.size });
  const parsed = await parseBcbaProductivityUpload(file);
  // eslint-disable-next-line no-console
  console.info("[bcba-upload] preview: parsed rows", {
    parsed: parsed.parsedRows.length, raw: parsed.rawRowCount, missing: parsed.missingColumns,
  });
  if (parsed.missingColumns.length || parsed.parsedRows.length === 0) {
    return { ...parsed, duplicateRowCount: 0, newRowCount: parsed.parsedRows.length };
  }
  const hashes = parsed.parsedRows.map((r) => r.rowHash);
  // eslint-disable-next-line no-console
  console.info("[bcba-upload] preview: checking duplicates", { hashes: hashes.length });
  const existing = await fetchExistingHashes(hashes);
  // eslint-disable-next-line no-console
  console.info("[bcba-upload] preview: duplicate check done", { duplicates: existing.size });
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
  // Use the edge function with POST body so a huge IN-list never blows
  // up the URL length (the old GET-based PostgREST query with
  // ?row_hash=in.(...) silently 414'd or hung for large files, which is
  // why uploads "just sat on Parsing").
  const accessToken = await getFreshAccessToken();
  if (!accessToken) {
    throw new Error(
      "Your session expired before the file could be parsed. Please sign out and back in, then try again.",
    );
  }
  const CHUNK = 2000;
  const chunks: string[][] = [];
  for (let i = 0; i < hashes.length; i += CHUNK) {
    chunks.push(hashes.slice(i, i + CHUNK));
  }
  const CONCURRENCY = 3;
  let cursor = 0;
  async function worker() {
    while (cursor < chunks.length) {
      const idx = cursor++;
      const res = await callUploadFn(accessToken!, {
        action: "check_hashes",
        hashes: chunks[idx],
      });
      const arr = Array.isArray(res.existing) ? (res.existing as string[]) : [];
      for (const h of arr) existing.add(h);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, chunks.length) }, worker),
  );
  return existing;
}

/* ----- append ----- */

export interface AppendInput {
  file: File;
  uploadLabel?: string;
  notes?: string;
  parsed?: BcbaUploadParseResult;
  /**
   * Optional progress callback so the UI can show per-phase status while a
   * large upload runs. Phase order: create_batch → append_rows* → finalize_batch.
   */
  onProgress?: (event:
    | { phase: "check_duplicates" }
    | { phase: "create_batch" }
    | { phase: "append_rows"; inserted: number; total: number; chunk: number; chunks: number }
    | { phase: "finalize_batch" }
    | { phase: "verify" }
  ) => void;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function appendBcbaProductivityUpload(input: AppendInput): Promise<BcbaUploadAppendResult> {
  const parsed = input.parsed ?? (await parseBcbaProductivityUpload(input.file));
  if (parsed.missingColumns.length) {
    throw new Error(`Missing required columns: ${parsed.missingColumns.join(", ")}`);
  }

  // Hard preflight: confirm we have a usable access token *before* we touch
  // the edge function. Without this, an expired/missing JWT used to bubble
  // up as a vague invoke() failure and the user just saw "nothing happened".
  let accessToken = await getFreshAccessToken();
  if (!accessToken) {
    throw new Error(
      "Your session expired before the upload could start. Please sign out and back in, then try the Append again.",
    );
  }

  // Pre-check duplicates (against current active rows).
  const onProgress = input.onProgress;
  onProgress?.({ phase: "check_duplicates" });
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
  onProgress?.({ phase: "create_batch" });
  let batchId = "";
  const createRes = await callUploadFn(accessToken, {
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
  batchId = createRes.batchId as string;
  if (!batchId) throw new Error("Failed to create upload batch");

  let actuallyInserted = 0;
  try {
    // Insert rows in small, sequential chunks through the Edge Function.
    // CentralReach exports can have 180+ columns and 40k+ rows; keeping one
    // request in flight prevents the function from rebooting under parallel
    // oversized JSON payloads and makes progress honest/recoverable.
    if (toInsert.length > 0) {
      const CHUNK = 400;
      const chunks: ParsedRow[][] = [];
      for (let i = 0; i < toInsert.length; i += CHUNK) {
        chunks.push(toInsert.slice(i, i + CHUNK));
      }
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
        const slice = chunks[chunkIndex];
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
        let res: Record<string, unknown> | null = null;
        let lastError: unknown = null;
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          try {
            accessToken = (await getFreshAccessToken()) || accessToken;
            res = await callUploadFn(accessToken!, { action: "append_rows", batchId, rows: payload });
            lastError = null;
            break;
          } catch (e) {
            lastError = e;
            if (attempt < 3) await wait(1000 * attempt);
          }
        }
        if (lastError) throw lastError;
        const inserted = Number(res?.inserted);
        if (!Number.isFinite(inserted)) {
          throw new Error(`Upload service did not confirm inserted rows for chunk ${chunkIndex + 1} of ${chunks.length}.`);
        }
        actuallyInserted += inserted;
        onProgress?.({
          phase: "append_rows",
          inserted: actuallyInserted,
          total: toInsert.length,
          chunk: chunkIndex + 1,
          chunks: chunks.length,
        });
      }
    }

    // Finalize: server verifies actual row count and updates the batch row
    // with honest counters (no more "42707 appended" while only 6000 landed).
    onProgress?.({ phase: "finalize_batch" });
    // Refresh the token once for finalize in case the long upload outlived it.
    accessToken = (await getFreshAccessToken()) || accessToken;
    const fin = await callUploadFn(accessToken!, {
      action: "finalize_batch",
      batchId,
      expectedNew: toInsert.length,
      parsed_row_count: parsed.parsedRows.length,
      duplicate_row_count: duplicateRowCount,
      service_date_min: parsed.serviceDateMin,
      service_date_max: parsed.serviceDateMax,
    });
    const actualRows = Number(fin.actualRows ?? actuallyInserted);
    if (fin.status && fin.status !== "active") {
      throw new Error(`Upload did not finalize as active. Backend status: ${String(fin.status)}.`);
    }
    if (fin.ok === false) {
      throw new Error("Upload verification failed after finalize. No rows were activated for the report.");
    }
    if (toInsert.length > 0 && actualRows < toInsert.length) {
      throw new Error(
        `Upload incomplete: only ${actualRows.toLocaleString()} of ${toInsert.length.toLocaleString()} new rows landed. The batch has been marked failed — please re-upload.`,
      );
    }
    onProgress?.({ phase: "verify" });

    return {
      batchId,
      parsedRowCount: parsed.parsedRows.length,
      appendedRowCount: actualRows,
      duplicateRowCount,
      serviceDateMin: parsed.serviceDateMin,
      serviceDateMax: parsed.serviceDateMax,
    };
  } catch (e: any) {
    if (batchId) {
      try {
        await callUploadFn(accessToken!, {
          action: "fail_batch",
          batchId,
          error: e?.message ?? "Upload failed before finalize",
        });
      } catch { /* keep original error */ }
    }
    throw e;
  }
}

/**
 * Get a fresh access token. Tries `refreshSession()` first; falls back to
 * `getSession()`. Returns null only if the user is truly not signed in.
 */
async function getFreshAccessToken(): Promise<string | null> {
  try {
    const refreshed = await supabase.auth.refreshSession();
    const t = refreshed?.data?.session?.access_token;
    if (t) return t;
  } catch { /* fall through */ }
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Invoke the bcba-productivity-upload Edge Function via direct fetch.
 *
 * `supabase.functions.invoke` has been observed to silently hang or
 * return inconsistent error shapes for large multi-step flows like this
 * upload, so we hit the function URL ourselves with an explicit timeout
 * and surface real HTTP status codes / response bodies on failure.
 */
async function callUploadFn(
  accessToken: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!SUPABASE_URL || !ANON) {
    throw new Error("Supabase client is not configured (missing VITE_SUPABASE_URL).");
  }
  const url = `${SUPABASE_URL}/functions/v1/bcba-productivity-upload`;
  const action = String(body?.action ?? "?");

  // 90s per request — generous enough for a 500-row chunk insert but small
  // enough that a wedged request fails loudly instead of hanging forever.
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 90_000);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      signal: ac.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        apikey: ANON,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[bcba-upload] network error", { action, error: e });
    throw new Error(
      `Network error contacting upload service (action: ${action}). ` +
        `Check your internet connection and try again.`,
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let parsed: any = null;
  try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { raw: text }; }

  if (!res.ok) {
    const detail = parsed?.error || parsed?.message || text || res.statusText;
    // eslint-disable-next-line no-console
    console.error("[bcba-upload] http error", { action, status: res.status, detail, parsed });
    if (res.status === 401) {
      throw new Error(
        "Upload service rejected your session (401). Please sign out and back in, then try again.",
      );
    }
    if (res.status === 403) {
      throw new Error(
        "You do not have admin access to upload BCBA productivity data (403). " +
          "Ask a super admin to grant you the role.",
      );
    }
    throw new Error(
      `Upload service error (${res.status}, action: ${action}): ${detail}`,
    );
  }
  if (parsed && typeof parsed === "object" && "error" in parsed) {
    // eslint-disable-next-line no-console
    console.error("[bcba-upload] payload error", { action, parsed });
    throw new Error(String(parsed.error));
  }
  return (parsed ?? {}) as Record<string, unknown>;
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
  /** Progress callback: fired after each page loads. */
  onProgress?: (loaded: number, total: number) => void;
  /** Force a fresh fetch, bypassing the in-memory cache. */
  force?: boolean;
}

/**
 * In-memory cache of the shared dataset so repeated Refresh clicks (and
 * cross-navigations back to the report) don't re-download 47k+ rows unless
 * the underlying dataset actually changed. Keyed by `activeRowCount` +
 * `lastUploadAt` so any admin upload or void invalidates it automatically.
 */
let SHARED_CACHE: { key: string; rows: BcbaSharedBillingRow[] } | null = null;

export function invalidateBcbaProductivitySharedCache() {
  SHARED_CACHE = null;
}

export async function getBcbaProductivitySharedRows(
  opts: GetSharedRowsOptions = {},
): Promise<BcbaSharedBillingRow[]> {
  const max = opts.limit ?? 250000;

  // Get authoritative count first so we can size the fetch, drive an honest
  // progress bar, and cache-key against dataset state.
  const { count, error: countErr } = await supabase
    .from("bcba_productivity_billing_rows")
    .select("id", { count: "exact", head: true })
    .eq("active", true);
  if (countErr) throw countErr;
  const total = Math.min(count ?? 0, max);
  if (total === 0) return [];

  // Also fingerprint by newest batch so uploads bust the cache.
  const { data: lastBatch } = await supabase
    .from("bcba_productivity_upload_batches")
    .select("id,created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);
  const cacheKey = `${total}|${lastBatch?.[0]?.id ?? ""}|${lastBatch?.[0]?.created_at ?? ""}`;

  if (!opts.force && SHARED_CACHE && SHARED_CACHE.key === cacheKey) {
    opts.onProgress?.(SHARED_CACHE.rows.length, SHARED_CACHE.rows.length);
    return SHARED_CACHE.rows;
  }

  // Fetch pages in parallel batches. `raw` (huge JSONB) is intentionally
  // omitted from the select — state is already normalized into `normalized`
  // at insert time, and pulling `raw` for 47k rows was the primary reason
  // Refresh Data spun forever (payload was ~10x the size the report needs).
  const PAGE = 5000;
  const CONCURRENCY = 4;
  const pageCount = Math.ceil(total / PAGE);
  const results: BcbaSharedBillingRow[][] = new Array(pageCount);
  let loaded = 0;

  async function fetchPage(pageIndex: number): Promise<void> {
    const from = pageIndex * PAGE;
    const to = Math.min(from + PAGE - 1, total - 1);
    const { data, error } = await supabase
      .from("bcba_productivity_billing_rows")
      .select("normalized")
      .eq("active", true)
      .order("service_date", { ascending: true })
      .range(from, to);
    if (error) throw error;
    const slice: BcbaSharedBillingRow[] = [];
    for (const d of data ?? []) {
      const n = (d.normalized as unknown as BcbaSharedBillingRow) || null;
      if (n && n.date && n.code) {
        const state = normalizeUsState(n.state) || n.state || "";
        slice.push(state === n.state ? n : { ...n, state });
      }
    }
    results[pageIndex] = slice;
    loaded += slice.length;
    opts.onProgress?.(loaded, total);
  }

  // Simple worker pool for bounded parallelism.
  let next = 0;
  async function worker() {
    while (next < pageCount) {
      const idx = next++;
      await fetchPage(idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pageCount) }, worker));

  const out: BcbaSharedBillingRow[] = [];
  for (const s of results) if (s) out.push(...s);
  SHARED_CACHE = { key: cacheKey, rows: out };
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