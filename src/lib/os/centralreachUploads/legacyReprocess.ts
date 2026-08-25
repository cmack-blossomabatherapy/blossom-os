/**
 * Refresh the Scheduling + Authorization report tables from files that are
 * ALREADY uploaded. Nothing is uploaded, deleted or mutated here: the newest
 * ACTIVE shared dataset per report key is read in place and pushed through the
 * same append/dedupe importer, so running it twice never duplicates facts.
 *
 * Billing is deliberately excluded from this safe path — `cr_billing_sessions`
 * and BCBA Productivity V3 must never be touched by a report repair.
 */

import {
  listSharedReportDatasets,
  downloadSharedReportDatasetFile,
  type SharedReportDataset,
  type SharedReportKey,
} from "@/lib/os/sharedReportDatasets";
import { importCentralReachFiles, type CrFileImportOutcome } from "./importService";

/** Scheduling key used by the safe active-snapshot refresh. */
export const SAFE_SCHEDULING_KEYS: SharedReportKey[] = ["cancellation-scheduling"];

/** Authorization keys (aliases of the same export) used by the safe refresh. */
export const SAFE_AUTHORIZATION_KEYS: SharedReportKey[] = [
  "authorization",
  "cancellation-authorization",
];

/** Keys eligible for the safe report refresh. `cancellation-billing` is excluded. */
export const SAFE_REPORT_REFRESH_KEYS: SharedReportKey[] = [
  ...SAFE_SCHEDULING_KEYS,
  ...SAFE_AUTHORIZATION_KEYS,
];

export interface LegacyReprocessResult {
  datasets: number;
  outcomes: CrFileImportOutcome[];
  errors: string[];
}

function uploadedAtMs(dataset: SharedReportDataset): number {
  const ms = new Date(dataset.uploadedAt).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function dedupeKeyOf(dataset: SharedReportDataset): string {
  const name = (dataset.fileName ?? "").trim().toLowerCase();
  const size = dataset.fileSize ?? null;
  if (name) return `name:${name}|size:${size ?? "unknown"}`;
  // Stable fallback when the file name is missing.
  return `path:${dataset.storagePath ?? dataset.id}`;
}

/**
 * Pure selector: newest ACTIVE dataset per safe key, de-duplicated across the
 * authorization aliases, returned oldest → newest.
 */
export function selectActiveReportSnapshotDatasets(
  byKey: Partial<Record<SharedReportKey, SharedReportDataset[]>>,
): SharedReportDataset[] {
  const picked: SharedReportDataset[] = [];
  for (const key of SAFE_REPORT_REFRESH_KEYS) {
    const active = (byKey[key] ?? [])
      .filter((d) => d && d.isActive === true && d.reportKey === key)
      .sort((a, b) => uploadedAtMs(b) - uploadedAtMs(a));
    const newest = active[0];
    if (newest) picked.push(newest);
  }

  const seen = new Set<string>();
  const unique: SharedReportDataset[] = [];
  for (const dataset of picked) {
    const dedupeKey = dedupeKeyOf(dataset);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    unique.push(dataset);
  }

  return unique.sort(
    (a, b) => uploadedAtMs(a) - uploadedAtMs(b) || a.fileName.localeCompare(b.fileName),
  );
}

/** Read the active scheduling + authorization datasets already stored. */
export async function listActiveReportSnapshotDatasets(): Promise<SharedReportDataset[]> {
  const lists = await Promise.all(
    SAFE_REPORT_REFRESH_KEYS.map((key) => listSharedReportDatasets(key).catch(() => [])),
  );
  const byKey: Partial<Record<SharedReportKey, SharedReportDataset[]>> = {};
  SAFE_REPORT_REFRESH_KEYS.forEach((key, i) => {
    byKey[key] = lists[i] ?? [];
  });
  return selectActiveReportSnapshotDatasets(byKey);
}

/**
 * Safe refresh: re-read the already-uploaded active Scheduling + Authorization
 * exports and re-run them through the normalized importer. No uploads, no
 * deletes, no billing.
 */
export async function refreshReportsFromExistingUploads(
  options: { onProgress?: (fileName: string) => void } = {},
): Promise<LegacyReprocessResult> {
  const candidates = await listActiveReportSnapshotDatasets();
  const outcomes: CrFileImportOutcome[] = [];
  const errors: string[] = [];

  for (const dataset of candidates) {
    options.onProgress?.(dataset.fileName);
    try {
      const file = await downloadSharedReportDatasetFile(dataset);
      outcomes.push(...(await importCentralReachFiles([file])));
    } catch (error) {
      errors.push(`${dataset.fileName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { datasets: candidates.length, outcomes, errors };
}

/** @deprecated Compatibility alias — delegates to the safe active-snapshot refresh. */
export const reprocessLegacySharedDatasets = refreshReportsFromExistingUploads;

/** @deprecated Compatibility alias — use `listActiveReportSnapshotDatasets`. */
export const listLegacyReprocessCandidates = listActiveReportSnapshotDatasets;
