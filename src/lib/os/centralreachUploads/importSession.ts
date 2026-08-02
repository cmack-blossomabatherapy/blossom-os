/**
 * CentralReach Data Hub import session runtime.
 *
 * Runs an APPEND-mode import for one or more files in a single session:
 *  - loads the row hashes already stored for the target normalized table,
 *  - inserts only rows whose stable identity is new (global dedupe, never
 *    per-batch), even when the DB unique index is missing,
 *  - writes one cr_import_batches record per uploaded file with honest counters,
 *  - never clears, deletes, or deactivates existing rows.
 */

import type { CRUploadKind } from "./detect";
import {
  applyAppendBatch,
  crRowHash,
  crRowIdentity,
  validateCrBatch,
  type CRBatchDescriptor,
  type AppendPlanResult,
} from "./dataHub";
import { CR_RAW_PAYLOAD } from "./normalize";

/**
 * Id-like headers found in CentralReach exports. The source row id is the
 * primary dedupe identity: normalized facts alone can legitimately repeat
 * (same client/date/provider/code/hours) and must never be collapsed.
 */
const RAW_ID_KEYS = [
  "crrowid",
  "rowid",
  "rownum",
  "id",
  "billingid",
  "appointmentid",
  "authorizationid",
  "claimid",
  "claimnumber",
  "authorizationnumber",
  "contactid",
  "eventid",
  "serviceid",
  "sessionid",
  "scheduleid",
  "resourceid",
];

function normKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findRawId(source: Record<string, unknown> | undefined): string | null {
  if (!source) return null;
  for (const key of Object.keys(source)) {
    if (RAW_ID_KEYS.includes(normKey(key))) {
      const value = String(source[key] ?? "").trim();
      if (value) return value;
    }
  }
  return null;
}

function rawPayloadOf(row: Record<string, unknown>): Record<string, unknown> | undefined {
  return (row as Record<symbol, unknown>)[CR_RAW_PAYLOAD] as Record<string, unknown> | undefined;
}

/**
 * Import-time identity: direct id-like column, else the CentralReach raw
 * payload's id, else a deterministic hash of the normalized fields.
 */
export function crImportRowIdentity(row: Record<string, unknown>): string {
  const direct = crRowIdentity(row);
  if (direct.startsWith("id:")) return direct;
  const rawId = findRawId(rawPayloadOf(row));
  if (rawId) return `id:${rawId}`;
  return direct;
}

/** Persisted row_hash for a row (matches the identity used for dedupe). */
export function crImportRowHash(row: Record<string, unknown>): string {
  const identity = crImportRowIdentity(row);
  return identity.startsWith("id:") ? identity : crRowHash(row);
}

/** Append planning that uses the import-specific (raw-id aware) identity. */
function planImportRows<T extends Record<string, unknown>>(
  existingIdentities: Iterable<string>,
  rows: T[],
): AppendPlanResult<T> {
  const identities = new Set<string>(existingIdentities);
  const toInsert: T[] = [];
  const duplicates: T[] = [];
  for (const row of rows ?? []) {
    const identity = crImportRowIdentity(row);
    if (identities.has(identity)) {
      duplicates.push(row);
      continue;
    }
    identities.add(identity);
    toInsert.push(row);
  }
  return {
    toInsert,
    duplicates,
    parsedRowCount: rows?.length ?? 0,
    appendedRowCount: toInsert.length,
    duplicateRowCount: duplicates.length,
    identities,
  };
}

export interface CrImportFile<T extends Record<string, unknown> = Record<string, unknown>> {
  fileName: string;
  fileHash: string;
  exportType: CRUploadKind;
  rows: T[];
  coverageStart?: string | null;
  coverageEnd?: string | null;
}

/** Minimal persistence surface — injected so it can be a Supabase client or a fake. */
export interface CrImportStore<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Row hashes/identities already stored for this normalized table (all batches). */
  loadExistingIdentities(table: string): Promise<string[]>;
  /** Insert new rows. Must NOT delete or deactivate anything. */
  insertRows(table: string, rows: Array<T & { row_hash: string; batch_id: string }>): Promise<void>;
  /** Create the cr_import_batches record; returns its id. */
  createBatch(batch: CRBatchDescriptor): Promise<string>;
  /** Persist final counters/status for a batch. */
  finalizeBatch(batchId: string, batch: CRBatchDescriptor): Promise<void>;
}

export interface CrImportFileResult {
  batchId: string;
  fileName: string;
  exportType: CRUploadKind;
  parsedRowCount: number;
  appendedRowCount: number;
  duplicateRowCount: number;
  errors: string[];
  warnings: string[];
  skipped: boolean;
}

export interface CrImportSessionResult {
  files: CrImportFileResult[];
  batches: CRBatchDescriptor[];
  parsedRowCount: number;
  appendedRowCount: number;
  duplicateRowCount: number;
  /** Append mode never resets data. */
  reset: false;
}

/**
 * Run an append-mode import session across many files.
 * Identities are carried between files so repeats inside the session are skipped too.
 */
export async function runCrImportSession<T extends Record<string, unknown>>(
  store: CrImportStore<T>,
  tableFor: (kind: CRUploadKind) => string,
  files: Array<CrImportFile<T>>,
  options: { uploadedBy?: string | null; existingBatches?: CRBatchDescriptor[] } = {},
): Promise<CrImportSessionResult> {
  const identitiesByTable = new Map<string, Set<string>>();
  let batches = [...(options.existingBatches ?? [])];
  const results: CrImportFileResult[] = [];

  for (const file of files) {
    const descriptorBase: CRBatchDescriptor = {
      fileName: file.fileName,
      fileHash: file.fileHash,
      exportType: file.exportType,
      rowCount: file.rows.length,
      parsedRowCount: file.rows.length,
      coverageStart: file.coverageStart ?? null,
      coverageEnd: file.coverageEnd ?? null,
      uploadedBy: options.uploadedBy ?? null,
    };

    const validation = validateCrBatch(descriptorBase);
    if (!validation.valid) {
      results.push({
        batchId: "",
        fileName: file.fileName,
        exportType: file.exportType,
        parsedRowCount: file.rows.length,
        appendedRowCount: 0,
        duplicateRowCount: 0,
        errors: validation.errors,
        warnings: validation.warnings,
        skipped: true,
      });
      continue;
    }

    const table = tableFor(file.exportType);
    if (!identitiesByTable.has(table)) {
      identitiesByTable.set(table, new Set(await store.loadExistingIdentities(table)));
    }
    const identities = identitiesByTable.get(table)!;

    const plan = planImportRows<T>(identities, file.rows);
    plan.identities.forEach((id) => identities.add(id));

    const descriptor: CRBatchDescriptor = {
      ...descriptorBase,
      appendedRowCount: plan.appendedRowCount,
      duplicateRowCount: plan.duplicateRowCount,
      status: "active",
      isActive: true,
      warnings: validation.warnings,
    };

    const batchId = await store.createBatch(descriptor);
    if (plan.toInsert.length > 0) {
      await store.insertRows(
        table,
        plan.toInsert.map((row) => ({ ...row, row_hash: identityToRowHash(row), batch_id: batchId })),
      );
    }
    await store.finalizeBatch(batchId, descriptor);
    batches = applyAppendBatch(batches, descriptor);

    results.push({
      batchId,
      fileName: file.fileName,
      exportType: file.exportType,
      parsedRowCount: plan.parsedRowCount,
      appendedRowCount: plan.appendedRowCount,
      duplicateRowCount: plan.duplicateRowCount,
      errors: [],
      warnings: validation.warnings,
      skipped: false,
    });
  }

  return {
    files: results,
    batches,
    parsedRowCount: results.reduce((sum, r) => sum + r.parsedRowCount, 0),
    appendedRowCount: results.reduce((sum, r) => sum + r.appendedRowCount, 0),
    duplicateRowCount: results.reduce((sum, r) => sum + r.duplicateRowCount, 0),
    reset: false,
  };
}

/**
 * Persisted row_hash for a row. Uses the CentralReach row id when present so the
 * global unique index on row_hash matches the in-memory identity used for dedupe.
 */
export function identityToRowHash(row: Record<string, unknown>): string {
  return crImportRowHash(row);
}