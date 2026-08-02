/**
 * Detection + guard helpers for the "legacy uploads need normalization" state:
 * files that landed in `shared_report_datasets` before the normalized importer
 * went live, so the normalized `cr_*` fact tables are still empty.
 */
import type { CrNormalizedCounts } from "./supabaseStore";
import type { LegacyReprocessResult } from "./legacyReprocess";
import { summarizeCrImport } from "./importService";

const FACT_KEYS: Array<keyof CrNormalizedCounts> = [
  "billing",
  "scheduling",
  "authorization",
  "utilization",
  "claims",
  "contacts",
];

export const AUTO_NORMALIZE_FLAG_KEY = "blossom.cr.autoNormalizeAttempted";

/** Total normalized fact rows across every cr_* fact table. */
export function countNormalizedFactRows(counts: CrNormalizedCounts | null): number {
  if (!counts) return 0;
  return FACT_KEYS.reduce((sum, key) => sum + (counts[key] ?? 0), 0);
}

/**
 * True when normalized reporting tables are completely empty but legacy shared
 * report datasets exist — i.e. data is trapped in legacy storage.
 */
export function needsLegacyNormalization(args: {
  counts: CrNormalizedCounts | null;
  legacyDatasetCount: number;
}): boolean {
  if (!args.counts) return false;
  if (args.legacyDatasetCount <= 0) return false;
  return countNormalizedFactRows(args.counts) === 0 && (args.counts.batches ?? 0) === 0;
}

function session(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function hasAutoNormalizeAttempted(): boolean {
  return session()?.getItem(AUTO_NORMALIZE_FLAG_KEY) === "1";
}

export function markAutoNormalizeAttempted(): void {
  try {
    session()?.setItem(AUTO_NORMALIZE_FLAG_KEY, "1");
  } catch {
    /* non-fatal */
  }
}

export function clearAutoNormalizeAttempted(): void {
  try {
    session()?.removeItem(AUTO_NORMALIZE_FLAG_KEY);
  } catch {
    /* non-fatal */
  }
}

export interface LegacyReprocessReport {
  filesProcessed: number;
  parsedRowCount: number;
  appendedRowCount: number;
  duplicateRowCount: number;
  /** Per-file warnings/errors, prefixed with the file name. */
  issues: string[];
  ok: boolean;
}

/** Flatten a reprocess result into explicit operator-facing numbers. */
export function summarizeLegacyReprocess(result: LegacyReprocessResult): LegacyReprocessReport {
  const summary = summarizeCrImport(result.outcomes);
  const issues: string[] = [...result.errors];
  for (const outcome of result.outcomes) {
    for (const warning of outcome.warnings) issues.push(`${outcome.fileName}: ${warning}`);
    for (const error of outcome.errors) issues.push(`${outcome.fileName}: ${error}`);
  }
  return {
    filesProcessed: result.datasets,
    parsedRowCount: summary.parsedRowCount,
    appendedRowCount: summary.appendedRowCount,
    duplicateRowCount: summary.duplicateRowCount,
    issues,
    ok: result.errors.length === 0 && summary.failed.length === 0,
  };
}
