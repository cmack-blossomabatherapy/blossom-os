/**
 * CentralReach Data Hub import service — the real upload path.
 *
 * Parses each uploaded CSV/XLSX, auto-detects the export type, normalizes rows
 * into the matching `cr_*` fact table, records one `cr_import_batches` row per
 * file/export type, and appends only globally-new rows. Normal imports never
 * archive or clear existing normalized data.
 */

import { parseAnyFile } from "@/lib/os/dashboardEngine/excelParser";
import { detectCentralReachUpload, type CRUploadKind } from "./detect";
import { runCrImportSession, identityToRowHash } from "./importSession";
import { createSupabaseCrImportStore } from "./supabaseStore";
import type { CrImportStore } from "./importSession";
import {
  createSupabaseCrRunTracker,
  noopCrRunTracker,
  type CrRunTracker,
} from "./syncRun";
import { createSupabaseCrSupportRefresher, type CrSupportRefresher } from "./supportTables";
import {
  CR_RAW_PAYLOAD,
  crCoverage,
  crTableForKind,
  hashUploadedFile,
  normalizeCrRows,
  type NormalizedCrRow,
} from "./normalize";

export interface CrFileImportOutcome {
  fileName: string;
  exportType: CRUploadKind;
  table: string | null;
  batchId: string | null;
  runId: string | null;
  parsedRowCount: number;
  appendedRowCount: number;
  duplicateRowCount: number;
  rejectedRowCount: number;
  coverageStart: string | null;
  coverageEnd: string | null;
  /** "active" for appended data, "archived" only for a fully duplicate reupload. */
  batchStatus: "active" | "archived" | "failed";
  /** Plain-English reason for the batch status — never a silent archive. */
  statusReason: string;
  warnings: string[];
  errors: string[];
  /** True only when normalized rows were appended or accounted for as duplicates. */
  ok: boolean;
}

export interface CrImportProgress {
  fileName: string;
  phase: "parsing" | "detecting" | "normalizing" | "writing" | "done";
  detail?: string;
}

export interface CrImportOptions {
  notes?: string | null;
  onProgress?: (progress: CrImportProgress) => void;
  /** Injectable store for tests; defaults to the Supabase-backed store. */
  makeStore?: (rawByHash: Map<string, Record<string, unknown>>) => CrImportStore<Record<string, unknown>>;
  /** Injectable run tracker for tests; defaults to the Supabase-backed tracker. */
  makeRunTracker?: () => CrRunTracker;
  /** Injectable support-table refresher for tests. */
  makeSupportRefresher?: () => CrSupportRefresher;
}

/** Group parsed sheets of a file by detected export kind. */
export async function detectAndGroupFile(file: File): Promise<Map<CRUploadKind, Record<string, unknown>[]>> {
  const sheets = await parseAnyFile(file);
  const byKind = new Map<CRUploadKind, Record<string, unknown>[]>();
  for (const sheet of sheets) {
    const detection = detectCentralReachUpload(sheet.headers ?? []);
    const bucket = byKind.get(detection.kind) ?? [];
    bucket.push(...(sheet.rows as Record<string, unknown>[]));
    byKind.set(detection.kind, bucket);
  }
  return byKind;
}

/**
 * Import one or more CentralReach exports into the normalized tables.
 * Files are processed sequentially so dedupe identities stay consistent.
 */
export async function importCentralReachFiles(
  files: File[],
  options: CrImportOptions = {},
): Promise<CrFileImportOutcome[]> {
  const outcomes: CrFileImportOutcome[] = [];
  const tracker = makeTracker(options);
  const support = options.makeSupportRefresher
    ? options.makeSupportRefresher()
    : createSupabaseCrSupportRefresher();

  for (const file of files) {
    options.onProgress?.({ fileName: file.name, phase: "parsing" });
    let grouped: Map<CRUploadKind, Record<string, unknown>[]>;
    let fileHash: string;
    try {
      fileHash = await hashUploadedFile(file);
      grouped = await detectAndGroupFile(file);
    } catch (error) {
      outcomes.push(await trackedFailure(tracker, file, "unknown", null, error));
      continue;
    }

    const kinds = [...grouped.keys()].filter((k): k is Exclude<CRUploadKind, "unknown"> => k !== "unknown");
    if (!kinds.length) {
      outcomes.push(
        await trackedFailure(
          tracker,
          file,
          "unknown",
          fileHash,
          new Error("Could not recognize this CentralReach export from its column headers."),
        ),
      );
      continue;
    }

    for (const kind of kinds) {
      const rawRows = grouped.get(kind) ?? [];
      options.onProgress?.({ fileName: file.name, phase: "normalizing", detail: kind });

      let runId: string | null = null;
      try {
        runId = await tracker.start({
          fileName: file.name,
          fileHash,
          fileSizeBytes: file.size ?? null,
          exportType: kind,
          detectedHeaders: Object.keys(rawRows[0] ?? {}),
          notes: options.notes ?? null,
        });
        await tracker.audit(runId, "upload_started", { fileName: file.name, exportType: kind });
      } catch {
        // Run tracking must never block the actual data write.
        runId = null;
      }

      let normalized: NormalizedCrRow[];
      try {
        normalized = normalizeCrRows(kind, rawRows);
      } catch (error) {
        outcomes.push(await trackedFailure(tracker, file, kind, fileHash, error, runId));
        continue;
      }

      const rawByHash = new Map<string, Record<string, unknown>>();
      for (const row of normalized) {
        const payload = (row as Record<symbol, unknown>)[CR_RAW_PAYLOAD] as
          | Record<string, unknown>
          | undefined;
        if (payload) rawByHash.set(identityToRowHash(row), payload);
      }

      const coverage = crCoverage(kind, normalized);
      const store = options.makeStore
        ? options.makeStore(rawByHash)
        : createSupabaseCrImportStore({ rawByHash, notes: options.notes ?? null });

      options.onProgress?.({ fileName: file.name, phase: "writing", detail: kind });
      try {
        const session = await runCrImportSession<Record<string, unknown>>(
          store,
          crTableForKind,
          [{
            fileName: file.name,
            fileHash,
            exportType: kind,
            rows: normalized as Record<string, unknown>[],
            coverageStart: coverage.start,
            coverageEnd: coverage.end,
          }],
        );
        const result = session.files[0];
        const accounted = (result?.appendedRowCount ?? 0) + (result?.duplicateRowCount ?? 0);
        const parsed = result?.parsedRowCount ?? 0;
        const appended = result?.appendedRowCount ?? 0;
        const duplicates = result?.duplicateRowCount ?? 0;
        const ok = !result?.skipped && (result?.errors?.length ?? 0) === 0 && accounted > 0;
        const warnings = [...(result?.warnings ?? [])];

        if (ok && appended > 0) {
          try {
            warnings.push(
              ...(await support.refresh({
                kind,
                table: crTableForKind(kind),
                batchId: result?.batchId || null,
                rowCount: appended,
                coverageStart: coverage.start,
                coverageEnd: coverage.end,
                rows: normalized as Record<string, unknown>[],
              })),
            );
          } catch (error) {
            warnings.push(`support tables not refreshed: ${describe(error)}`);
          }
        }

        const archived = ok && appended === 0 && duplicates > 0;
        const statusReason = !ok
          ? "No normalized rows were written."
          : archived
            ? `Archived — every one of the ${duplicates.toLocaleString()} rows was already imported, so report totals are unchanged.`
            : `Active — ${appended.toLocaleString()} new rows appended${duplicates ? `, ${duplicates.toLocaleString()} duplicates skipped` : ""}.`;

        if (ok) {
          try {
            await tracker.commit(runId, {
              rowCountTotal: parsed,
              rowsAdded: appended,
              rowsUnchanged: duplicates,
              rowsRejected: Math.max(parsed - appended - duplicates, 0),
            });
            await tracker.audit(runId, archived ? "upload_duplicate" : "upload_committed", {
              batchId: result?.batchId ?? null,
              table: crTableForKind(kind),
              appended,
              duplicates,
            });
          } catch {
            warnings.push("Upload committed, but the run record could not be updated.");
          }
        } else {
          await safeFail(tracker, runId, statusReason);
        }

        outcomes.push({
          fileName: file.name,
          exportType: kind,
          table: crTableForKind(kind),
          batchId: result?.batchId || null,
          runId,
          parsedRowCount: parsed,
          appendedRowCount: appended,
          duplicateRowCount: duplicates,
          rejectedRowCount: Math.max(parsed - appended - duplicates, 0),
          coverageStart: coverage.start ?? null,
          coverageEnd: coverage.end ?? null,
          batchStatus: ok ? (archived ? "archived" : "active") : "failed",
          statusReason,
          warnings,
          errors: result?.errors ?? [],
          ok,
        });
      } catch (error) {
        outcomes.push(await trackedFailure(tracker, file, kind, fileHash, error, runId));
      }
      options.onProgress?.({ fileName: file.name, phase: "done", detail: kind });
    }
  }

  return outcomes;
}

function makeTracker(options: CrImportOptions): CrRunTracker {
  if (options.makeRunTracker) return options.makeRunTracker();
  try {
    return createSupabaseCrRunTracker();
  } catch {
    return noopCrRunTracker;
  }
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  const maybe = error as { message?: string; details?: string; hint?: string };
  return [maybe?.message, maybe?.details, maybe?.hint].filter(Boolean).join(" — ") || String(error);
}

async function safeFail(tracker: CrRunTracker, runId: string | null, message: string) {
  try {
    await tracker.fail(runId, message);
  } catch {
    /* run bookkeeping must never mask the original error */
  }
}

/** Build a failure outcome and record it on the run so nothing fails silently. */
async function trackedFailure(
  tracker: CrRunTracker,
  file: File,
  exportType: CRUploadKind,
  fileHash: string | null,
  error: unknown,
  existingRunId: string | null = null,
): Promise<CrFileImportOutcome> {
  const message = describe(error);
  let runId = existingRunId;
  if (!runId) {
    try {
      runId = await tracker.start({
        fileName: file.name,
        fileHash: fileHash ?? "unhashed",
        fileSizeBytes: file.size ?? null,
        exportType,
        notes: null,
      });
    } catch {
      runId = null;
    }
  }
  await safeFail(tracker, runId, message);
  return { ...failure(file.name, exportType, error), runId };
}

function failure(fileName: string, exportType: CRUploadKind, error: unknown): CrFileImportOutcome {
  return {
    fileName,
    exportType,
    table: null,
    batchId: null,
    runId: null,
    parsedRowCount: 0,
    appendedRowCount: 0,
    duplicateRowCount: 0,
    rejectedRowCount: 0,
    coverageStart: null,
    coverageEnd: null,
    batchStatus: "failed",
    statusReason: describe(error),
    warnings: [],
    errors: [describe(error)],
    ok: false,
  };
}

/** Roll a set of outcomes into UI-facing totals. */
export function summarizeCrImport(outcomes: CrFileImportOutcome[]) {
  return {
    appendedRowCount: outcomes.reduce((s, o) => s + o.appendedRowCount, 0),
    duplicateRowCount: outcomes.reduce((s, o) => s + o.duplicateRowCount, 0),
    parsedRowCount: outcomes.reduce((s, o) => s + o.parsedRowCount, 0),
    rejectedRowCount: outcomes.reduce((s, o) => s + o.rejectedRowCount, 0),
    archived: outcomes.filter((o) => o.batchStatus === "archived"),
    failed: outcomes.filter((o) => !o.ok),
    ok: outcomes.length > 0 && outcomes.every((o) => o.ok),
  };
}
