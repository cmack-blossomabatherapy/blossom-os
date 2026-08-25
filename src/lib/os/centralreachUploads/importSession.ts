/**
 * CentralReach Data Hub import session runtime.
 *
 * Runs an import for one or more files in a single session using an explicit
 * per-kind strategy (see `strategy.ts`):
 *
 *  - `append_fact` (billing, contacts): only globally-new identities are
 *    inserted; re-seen identities are duplicates and the stored fact is left
 *    exactly as it was.
 *  - `upsert_snapshot` (scheduling, authorization, utilization, claims): new
 *    identities are inserted and EXISTING identities are UPDATED in place so
 *    current values never go stale.
 *
 * Raw provenance (`cr_raw_rows`) is written for every parsed row of every
 * batch — inserts, updates, and duplicates alike — one version per batch.
 */

import type { CRUploadKind } from "./detect";
import {
  applyAppendBatch,
  crRowHash,
  crRowIdentity,
  validateCrBatch,
  type CRBatchDescriptor,
} from "./dataHub";
import { CR_RAW_PAYLOAD } from "./normalize";
import {
  CR_SIDE_TABLE_FOR_KIND,
  crImportStrategyFor,
  type CrImportStrategy,
} from "./strategy";

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

/**
 * Report-type-specific identity headers, checked BEFORE the generic list.
 *
 * Scheduling exports carry no Id/AppointmentId/EventId — the stable identifier
 * is the raw `Event` column (e.g. 1375558467). It is scoped to scheduling so an
 * unrelated generic `Event` field in another export can never become its key.
 */
const RAW_ID_KEYS_BY_KIND: Partial<Record<CRUploadKind, string[]>> = {
  scheduling: ["eventid", "appointmentid", "scheduleid", "event"],
};

function normKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findRawIdIn(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    for (const candidate of Object.keys(source)) {
      if (normKey(candidate) !== key) continue;
      const value = String(source[candidate] ?? "").trim();
      if (value) return value;
    }
  }
  return null;
}

function findRawId(
  source: Record<string, unknown> | undefined,
  kind?: CRUploadKind,
): string | null {
  if (!source) return null;
  const scoped = kind ? RAW_ID_KEYS_BY_KIND[kind] : undefined;
  if (scoped) {
    const hit = findRawIdIn(source, scoped);
    if (hit) return hit;
  }
  for (const key of Object.keys(source)) {
    if (RAW_ID_KEYS.includes(normKey(key))) {
      const value = String(source[key] ?? "").trim();
      if (value) return value;
    }
  }
  return null;
}

export function rawPayloadOf(row: Record<string, unknown>): Record<string, unknown> | undefined {
  return (row as Record<symbol, unknown>)[CR_RAW_PAYLOAD] as Record<string, unknown> | undefined;
}

/**
 * Import-time identity: report-type-specific id column, else a direct id-like
 * column, else the CentralReach raw payload's id, else a deterministic hash of
 * the normalized fields.
 */
export function crImportRowIdentity(
  row: Record<string, unknown>,
  kind?: CRUploadKind,
): string {
  const scoped = kind ? RAW_ID_KEYS_BY_KIND[kind] : undefined;
  if (scoped) {
    const raw = rawPayloadOf(row);
    const scopedId = (raw && findRawIdIn(raw, scoped)) || findRawIdIn(row, scoped);
    if (scopedId) return `id:${scopedId}`;
  }
  const direct = crRowIdentity(row);
  if (direct.startsWith("id:")) return direct;
  const rawId = findRawId(rawPayloadOf(row), kind);
  if (rawId) return `id:${rawId}`;
  return direct;
}

/** Persisted row_hash for a row (matches the identity used for dedupe). */
export function crImportRowHash(row: Record<string, unknown>, kind?: CRUploadKind): string {
  const identity = crImportRowIdentity(row, kind);
  return identity.startsWith("id:") ? identity : crRowHash(row);
}

/** The CentralReach source row id, persisted explicitly as `source_row_id`. */
export function crSourceRowId(row: Record<string, unknown>, kind?: CRUploadKind): string | null {
  const identity = crImportRowIdentity(row, kind);

  return identity.startsWith("id:") ? identity.slice(3) : null;
}

export interface CrImportPlan<T> {
  /** New identities to insert. */
  toInsert: T[];
  /** Existing identities whose current values must be refreshed (snapshot only). */
  toUpdate: T[];
  /** Append-fact rows skipped because the immutable fact already exists. */
  duplicates: T[];
  parsedRowCount: number;
  appendedRowCount: number;
  updatedRowCount: number;
  /** Repeats of an identity already handled by this same import. */
  unchangedRowCount: number;
  duplicateRowCount: number;
  identities: Set<string>;
}

/** Strategy-aware planning that uses the import-specific (raw-id aware) identity. */
export function planImportRows<T extends Record<string, unknown>>(
  existingIdentities: Iterable<string>,
  rows: T[],
  strategy: CrImportStrategy = "append_fact",
  kind?: CRUploadKind,
): CrImportPlan<T> {
  const existing = new Set<string>(existingIdentities);
  const insertByIdentity = new Map<string, T>();
  const updateByIdentity = new Map<string, T>();
  const duplicates: T[] = [];
  let unchanged = 0;

  for (const row of rows ?? []) {
    const identity = crImportRowIdentity(row, kind);

    if (strategy === "append_fact") {
      if (existing.has(identity) || insertByIdentity.has(identity)) {
        duplicates.push(row);
        continue;
      }
      insertByIdentity.set(identity, row);
      continue;
    }
    // Snapshot: last occurrence in the file wins.
    if (existing.has(identity)) {
      if (updateByIdentity.has(identity)) unchanged += 1;
      updateByIdentity.set(identity, row);
      continue;
    }
    if (insertByIdentity.has(identity)) unchanged += 1;
    insertByIdentity.set(identity, row);
  }

  const identities = new Set<string>(existing);
  insertByIdentity.forEach((_v, k) => identities.add(k));
  updateByIdentity.forEach((_v, k) => identities.add(k));

  return {
    toInsert: [...insertByIdentity.values()],
    toUpdate: [...updateByIdentity.values()],
    duplicates,
    parsedRowCount: rows?.length ?? 0,
    appendedRowCount: insertByIdentity.size,
    updatedRowCount: updateByIdentity.size,
    unchangedRowCount: unchanged,
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

export interface CrRawRowRecord {
  batch_id: string;
  export_type: string;
  row_hash: string;
  cr_row_id?: string | null;
  payload: Record<string, unknown>;
}

/** Minimal persistence surface — injected so it can be a Supabase client or a fake. */
export interface CrImportStore<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Row hashes/identities already stored for this normalized table (all batches). */
  loadExistingIdentities(table: string): Promise<string[]>;
  /** Insert new rows. Must NOT delete or deactivate anything. */
  insertRows(table: string, rows: Array<T & { row_hash: string; batch_id: string }>): Promise<void>;
  /** Update existing CURRENT rows matched by `row_hash` (snapshot strategy). */
  updateRows?(table: string, rows: Array<T & { row_hash: string; batch_id: string }>): Promise<void>;
  /** Insert-or-update side-table metadata keyed by `row_hash`. */
  upsertRows?(table: string, rows: Array<Record<string, unknown> & { row_hash: string }>): Promise<void>;
  /** Persist raw provenance for every parsed row of the batch. Not best-effort. */
  saveRawRows?(rows: CrRawRowRecord[]): Promise<void>;
  /** Create the cr_import_batches record; returns its id. */
  createBatch(batch: CRBatchDescriptor): Promise<string>;
  /** Persist final counters/status for a batch. */
  finalizeBatch(batchId: string, batch: CRBatchDescriptor): Promise<void>;
}

export interface CrImportFileResult {
  batchId: string;
  fileName: string;
  exportType: CRUploadKind;
  importStrategy: CrImportStrategy;
  parsedRowCount: number;
  appendedRowCount: number;
  updatedRowCount: number;
  unchangedRowCount: number;
  duplicateRowCount: number;
  rawRowCount: number;
  errors: string[];
  warnings: string[];
  skipped: boolean;
}

export interface CrImportSessionResult {
  files: CrImportFileResult[];
  batches: CRBatchDescriptor[];
  parsedRowCount: number;
  appendedRowCount: number;
  updatedRowCount: number;
  unchangedRowCount: number;
  duplicateRowCount: number;
  /** Imports never reset data. */
  reset: false;
}

export interface CrImportSessionOptions {
  uploadedBy?: string | null;
  existingBatches?: CRBatchDescriptor[];
  /** Optional side-table mapper (billing documentation status). */
  sideRowFor?: (kind: CRUploadKind, row: Record<string, unknown>) => Record<string, unknown> | null;
}

/**
 * Run an import session across many files.
 * Identities are carried between files so repeats inside the session are handled too.
 */
export async function runCrImportSession<T extends Record<string, unknown>>(
  store: CrImportStore<T>,
  tableFor: (kind: CRUploadKind) => string,
  files: Array<CrImportFile<T>>,
  options: CrImportSessionOptions = {},
): Promise<CrImportSessionResult> {
  const identitiesByTable = new Map<string, Set<string>>();
  let batches = [...(options.existingBatches ?? [])];
  const results: CrImportFileResult[] = [];

  for (const file of files) {
    const strategy = crImportStrategyFor(file.exportType);
    const descriptorBase: CRBatchDescriptor = {
      fileName: file.fileName,
      fileHash: file.fileHash,
      exportType: file.exportType,
      rowCount: file.rows.length,
      parsedRowCount: file.rows.length,
      coverageStart: file.coverageStart ?? null,
      coverageEnd: file.coverageEnd ?? null,
      uploadedBy: options.uploadedBy ?? null,
      importStrategy: strategy,
    };

    const validation = validateCrBatch(descriptorBase);
    if (!validation.valid) {
      results.push({
        batchId: "",
        fileName: file.fileName,
        exportType: file.exportType,
        importStrategy: strategy,
        parsedRowCount: file.rows.length,
        appendedRowCount: 0,
        updatedRowCount: 0,
        unchangedRowCount: 0,
        duplicateRowCount: 0,
        rawRowCount: 0,
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

    const plan = planImportRows<T>(identities, file.rows, strategy);
    plan.identities.forEach((id) => identities.add(id));

    const descriptor: CRBatchDescriptor = {
      ...descriptorBase,
      appendedRowCount: plan.appendedRowCount,
      updatedRowCount: plan.updatedRowCount,
      unchangedRowCount: plan.unchangedRowCount,
      duplicateRowCount: plan.duplicateRowCount,
      status: "active",
      isActive: true,
      warnings: validation.warnings,
    };

    const batchId = await store.createBatch(descriptor);
    const stamp = (row: T) => ({
      ...row,
      row_hash: crImportRowHash(row),
      source_row_id: crSourceRowId(row),
      batch_id: batchId,
      last_seen_batch_id: batchId,
      last_seen_at: new Date().toISOString(),
    }) as T & { row_hash: string; batch_id: string };

    if (plan.toInsert.length > 0) {
      await store.insertRows(table, plan.toInsert.map(stamp));
    }
    if (plan.toUpdate.length > 0 && store.updateRows) {
      await store.updateRows(table, plan.toUpdate.map(stamp));
    }

    // Side table (billing documentation status) is refreshed for EVERY parsed
    // row, including rows whose immutable billing fact was a duplicate.
    const sideTable = CR_SIDE_TABLE_FOR_KIND[file.exportType as Exclude<CRUploadKind, "unknown">];
    if (sideTable && options.sideRowFor && store.upsertRows) {
      const seen = new Set<string>();
      const sideRows: Array<Record<string, unknown> & { row_hash: string }> = [];
      for (const row of file.rows) {
        const hash = crImportRowHash(row);
        if (seen.has(hash)) continue;
        seen.add(hash);
        const mapped = options.sideRowFor(file.exportType, rawPayloadOf(row) ?? row);
        if (!mapped) continue;
        sideRows.push({
          ...mapped,
          row_hash: hash,
          source_row_id: crSourceRowId(row),
          batch_id: batchId,
          last_seen_batch_id: batchId,
          last_seen_at: new Date().toISOString(),
        });
      }
      if (sideRows.length) await store.upsertRows(sideTable, sideRows);
    }

    // Raw provenance for every parsed row of this batch — one version per batch.
    let rawRowCount = 0;
    if (store.saveRawRows) {
      const byHash = new Map<string, CrRawRowRecord>();
      for (const row of file.rows) {
        const payload = rawPayloadOf(row) ?? (row as Record<string, unknown>);
        const hash = crImportRowHash(row);
        byHash.set(hash, {
          batch_id: batchId,
          export_type: String(file.exportType),
          row_hash: hash,
          cr_row_id: crSourceRowId(row),
          payload,
        });
      }
      const rawRows = [...byHash.values()];
      if (rawRows.length) await store.saveRawRows(rawRows);
      rawRowCount = rawRows.length;
    }

    await store.finalizeBatch(batchId, descriptor);
    batches = applyAppendBatch(batches, descriptor);

    results.push({
      batchId,
      fileName: file.fileName,
      exportType: file.exportType,
      importStrategy: strategy,
      parsedRowCount: plan.parsedRowCount,
      appendedRowCount: plan.appendedRowCount,
      updatedRowCount: plan.updatedRowCount,
      unchangedRowCount: plan.unchangedRowCount,
      duplicateRowCount: plan.duplicateRowCount,
      rawRowCount,
      errors: [],
      warnings: validation.warnings,
      skipped: false,
    });
  }

  const sum = (key: keyof CrImportFileResult) =>
    results.reduce((total, r) => total + (Number(r[key]) || 0), 0);

  return {
    files: results,
    batches,
    parsedRowCount: sum("parsedRowCount"),
    appendedRowCount: sum("appendedRowCount"),
    updatedRowCount: sum("updatedRowCount"),
    unchangedRowCount: sum("unchangedRowCount"),
    duplicateRowCount: sum("duplicateRowCount"),
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

export { crImportStrategyFor };
export type { CrImportStrategy };
