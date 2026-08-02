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
  parsedRowCount: number;
  appendedRowCount: number;
  duplicateRowCount: number;
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

  for (const file of files) {
    options.onProgress?.({ fileName: file.name, phase: "parsing" });
    let grouped: Map<CRUploadKind, Record<string, unknown>[]>;
    let fileHash: string;
    try {
      fileHash = await hashUploadedFile(file);
      grouped = await detectAndGroupFile(file);
    } catch (error) {
      outcomes.push(failure(file.name, "unknown", error));
      continue;
    }

    const kinds = [...grouped.keys()].filter((k): k is Exclude<CRUploadKind, "unknown"> => k !== "unknown");
    if (!kinds.length) {
      outcomes.push({
        fileName: file.name,
        exportType: "unknown",
        table: null,
        batchId: null,
        parsedRowCount: 0,
        appendedRowCount: 0,
        duplicateRowCount: 0,
        warnings: [],
        errors: ["Could not recognize this CentralReach export from its column headers."],
        ok: false,
      });
      continue;
    }

    for (const kind of kinds) {
      const rawRows = grouped.get(kind) ?? [];
      options.onProgress?.({ fileName: file.name, phase: "normalizing", detail: kind });

      let normalized: NormalizedCrRow[];
      try {
        normalized = normalizeCrRows(kind, rawRows);
      } catch (error) {
        outcomes.push(failure(file.name, kind, error));
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
        outcomes.push({
          fileName: file.name,
          exportType: kind,
          table: crTableForKind(kind),
          batchId: result?.batchId || null,
          parsedRowCount: result?.parsedRowCount ?? 0,
          appendedRowCount: result?.appendedRowCount ?? 0,
          duplicateRowCount: result?.duplicateRowCount ?? 0,
          warnings: result?.warnings ?? [],
          errors: result?.errors ?? [],
          ok: !result?.skipped && (result?.errors?.length ?? 0) === 0 && accounted > 0,
        });
      } catch (error) {
        outcomes.push(failure(file.name, kind, error));
      }
      options.onProgress?.({ fileName: file.name, phase: "done", detail: kind });
    }
  }

  return outcomes;
}

function failure(fileName: string, exportType: CRUploadKind, error: unknown): CrFileImportOutcome {
  return {
    fileName,
    exportType,
    table: null,
    batchId: null,
    parsedRowCount: 0,
    appendedRowCount: 0,
    duplicateRowCount: 0,
    warnings: [],
    errors: [error instanceof Error ? error.message : String(error)],
    ok: false,
  };
}

/** Roll a set of outcomes into UI-facing totals. */
export function summarizeCrImport(outcomes: CrFileImportOutcome[]) {
  return {
    appendedRowCount: outcomes.reduce((s, o) => s + o.appendedRowCount, 0),
    duplicateRowCount: outcomes.reduce((s, o) => s + o.duplicateRowCount, 0),
    parsedRowCount: outcomes.reduce((s, o) => s + o.parsedRowCount, 0),
    failed: outcomes.filter((o) => !o.ok),
    ok: outcomes.length > 0 && outcomes.every((o) => o.ok),
  };
}
