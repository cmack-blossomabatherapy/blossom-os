/**
 * CentralReach Data Hub — batch validation, append-mode dedupe, and guarded reset.
 *
 * Uploads APPEND by default. A Data Hub import session may contain many files,
 * and many sessions accumulate over time. Rows are deduplicated GLOBALLY per
 * normalized table / export type on a stable identity (CentralReach row id when
 * present, else a deterministic row hash) — never merely per batch. Existing
 * report rows are only cleared by an explicit reset action.
 */

import type { CRUploadKind } from "./detect";

export type CRBatchStatus = "pending" | "active" | "archived" | "failed";

export interface CRBatchDescriptor {
  fileName: string;
  fileHash: string;
  exportType: CRUploadKind;
  rowCount: number;
  coverageStart?: string | null;
  coverageEnd?: string | null;
  uploadedBy?: string | null;
  status?: CRBatchStatus;
  warnings?: string[];
  isActive?: boolean;
  /** Rows parsed out of the file. */
  parsedRowCount?: number;
  /** New unique rows actually inserted by this batch. */
  appendedRowCount?: number;
  /** Rows skipped because their identity already exists (any batch). */
  duplicateRowCount?: number;
  /** Import contract used for this batch. */
  importStrategy?: "append_fact" | "upsert_snapshot";
  /** Existing CURRENT rows refreshed by this batch (snapshot strategy). */
  updatedRowCount?: number;
  /** Repeated identities within the same import that needed no extra write. */
  unchangedRowCount?: number;
}

export interface CRBatchValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/** Validate an upload batch before it is committed to the normalized store. */
export function validateCrBatch(batch: Partial<CRBatchDescriptor>): CRBatchValidation {
  const errors: string[] = [];
  const warnings: string[] = [...(batch.warnings ?? [])];

  if (!batch.fileName || !batch.fileName.trim()) errors.push("File name is required.");
  else if (!/\.(csv|xlsx|xls)$/i.test(batch.fileName)) errors.push("Only CSV and XLSX exports are supported.");

  if (!batch.fileHash || batch.fileHash.length < 8) errors.push("File hash is required for duplicate detection.");

  if (!batch.exportType || batch.exportType === "unknown") {
    errors.push("Export type could not be detected from the file headers.");
  }

  if (batch.rowCount === undefined || batch.rowCount === null) errors.push("Row count is required.");
  else if (batch.rowCount <= 0) errors.push("Export contains no data rows.");

  if (batch.coverageStart && !ISO_DATE.test(batch.coverageStart)) errors.push("Coverage start must be an ISO date.");
  if (batch.coverageEnd && !ISO_DATE.test(batch.coverageEnd)) errors.push("Coverage end must be an ISO date.");
  if (batch.coverageStart && batch.coverageEnd && batch.coverageStart > batch.coverageEnd) {
    errors.push("Coverage start is after coverage end.");
  }
  if (!batch.coverageStart || !batch.coverageEnd) {
    warnings.push("Date coverage could not be derived — freshness will be based on upload time.");
  }

  return { valid: errors.length === 0, errors, warnings };
}

/** Deterministic, order-stable hash for a raw CentralReach row. */
export function crRowHash(row: Record<string, unknown>): string {
  const keys = Object.keys(row).sort();
  const payload = keys
    .map((k) => `${k.toLowerCase()}=${String(row[k] ?? "").trim()}`)
    .join("|");
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < payload.length; i += 1) {
    const c = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c + i, 2246822519) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

const ID_KEYS = ["crrowid", "rowid", "id", "billingid", "appointmentid", "claimid", "authorizationid"];

/** Stable identity of a row: CentralReach row id when available, else row hash. */
export function crRowIdentity(row: Record<string, unknown>): string {
  for (const key of Object.keys(row)) {
    const norm = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (ID_KEYS.includes(norm)) {
      const value = String(row[key] ?? "").trim();
      if (value) return `id:${value}`;
    }
  }
  return `hash:${crRowHash(row)}`;
}

export interface SnapshotDedupeResult<T> {
  rows: T[];
  duplicatesRemoved: number;
}

/** Dedupe a full-snapshot import, keeping the last occurrence of each identity. */
export function dedupeSnapshotRows<T extends Record<string, unknown>>(rows: T[]): SnapshotDedupeResult<T> {
  const byIdentity = new Map<string, T>();
  rows.forEach((row) => byIdentity.set(crRowIdentity(row), row));
  return { rows: Array.from(byIdentity.values()), duplicatesRemoved: rows.length - byIdentity.size };
}

/**
 * Apply a daily full snapshot: the incoming batch becomes active and prior
 * batches of the same export type are archived (never deleted).
 */
export function applySnapshotBatches(
  existing: CRBatchDescriptor[],
  incoming: CRBatchDescriptor,
): CRBatchDescriptor[] {
  const archived = existing.map((batch) =>
    batch.exportType === incoming.exportType
      ? { ...batch, isActive: false, status: "archived" as CRBatchStatus }
      : batch,
  );
  return [...archived, { ...incoming, isActive: true, status: "active" as CRBatchStatus }];
}

/** True when an identical file (same hash + export type) is already active. */
export function isDuplicateBatch(existing: CRBatchDescriptor[], incoming: CRBatchDescriptor): boolean {
  return existing.some(
    (batch) => batch.fileHash === incoming.fileHash && batch.exportType === incoming.exportType,
  );
}

/* ---------------- append mode (default) ---------------- */

export interface AppendPlanResult<T> {
  /** New unique rows to insert. */
  toInsert: T[];
  /** Rows skipped: identity already stored (any earlier batch) or repeated in this session. */
  duplicates: T[];
  parsedRowCount: number;
  appendedRowCount: number;
  duplicateRowCount: number;
  /** Identity set after the append, for chaining across files in one session. */
  identities: Set<string>;
}

/**
 * Plan an APPEND of one or more parsed files against the identities already
 * stored for this normalized table / export type.
 *
 * Dedupe is global: an identity that exists in ANY previous batch is skipped,
 * and repeats across the files of the current session are skipped too. Nothing
 * existing is replaced or deactivated.
 */
export function planAppendRows<T extends Record<string, unknown>>(
  existingIdentities: Iterable<string>,
  incomingFiles: T[][] | T[],
): AppendPlanResult<T> {
  const files: T[][] = Array.isArray(incomingFiles[0]) || incomingFiles.length === 0
    ? (incomingFiles as T[][])
    : [incomingFiles as T[]];

  const identities = new Set<string>(existingIdentities);
  const toInsert: T[] = [];
  const duplicates: T[] = [];
  let parsedRowCount = 0;

  for (const rows of files) {
    for (const row of rows ?? []) {
      parsedRowCount += 1;
      const identity = crRowIdentity(row);
      if (identities.has(identity)) {
        duplicates.push(row);
        continue;
      }
      identities.add(identity);
      toInsert.push(row);
    }
  }

  return {
    toInsert,
    duplicates,
    parsedRowCount,
    appendedRowCount: toInsert.length,
    duplicateRowCount: duplicates.length,
    identities,
  };
}

/**
 * Record an append batch. Unlike the snapshot path, prior batches of the same
 * export type stay ACTIVE — new rows are added next to them.
 */
export function applyAppendBatch(
  existing: CRBatchDescriptor[],
  incoming: CRBatchDescriptor,
): CRBatchDescriptor[] {
  return [...existing, { ...incoming, isActive: true, status: "active" as CRBatchStatus }];
}

/** Only ACTIVE batch rows may feed reports; archived/failed batches are excluded. */
export function activeReportBatches(batches: CRBatchDescriptor[]): CRBatchDescriptor[] {
  return batches.filter((b) => b.isActive !== false && b.status !== "archived" && b.status !== "failed");
}

/* ---------------- guarded reset ---------------- */

export const CR_RESET_CONFIRMATION_PHRASE = "RESET CENTRALREACH REPORT DATA";

/** CR-derived reporting tables that a guarded reset is allowed to clear. */
export const CR_RESETTABLE_TABLES = [
  "cr_raw_rows",
  "cr_billing_sessions",
  "cr_schedule_events",
  "cr_authorizations",
  "cr_authorization_utilization",
  "cr_claims",
  "cr_contacts",
  "cr_bcba_ownership_inferred",
  "cr_import_batches",
] as const;

export interface CrResetRequest {
  confirmationPhrase: string;
  backupLabel?: string;
  tables?: string[];
}

export interface CrResetPlan {
  allowed: boolean;
  errors: string[];
  tables: string[];
  backupLabel: string;
}

/**
 * Validate a reset request. Resets require the exact confirmation phrase and can
 * only ever touch CR-derived reporting tables — never people, auth, or HR data.
 */
export function planCrReset(request: CrResetRequest): CrResetPlan {
  const errors: string[] = [];
  if (request.confirmationPhrase?.trim() !== CR_RESET_CONFIRMATION_PHRASE) {
    errors.push(`Type "${CR_RESET_CONFIRMATION_PHRASE}" exactly to confirm.`);
  }
  const requested = request.tables?.length ? request.tables : [...CR_RESETTABLE_TABLES];
  const disallowed = requested.filter((t) => !CR_RESETTABLE_TABLES.includes(t as any));
  if (disallowed.length) errors.push(`Not CentralReach report data: ${disallowed.join(", ")}.`);
  return {
    allowed: errors.length === 0,
    errors,
    tables: requested,
    backupLabel: request.backupLabel?.trim() || `cr-reset-${new Date().toISOString().slice(0, 19)}`,
  };
}

/* ---------------- executive presentation formatting ---------------- */

export function formatHours(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return Math.round(value).toLocaleString("en-US");
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

/** Supervision % = 97155 / 97153 * 100; dash when there are no 97153 hours. */
export function supervisionPercent(hours97155: number, hours97153: number): number | null {
  if (!hours97153) return null;
  return (hours97155 / hours97153) * 100;
}