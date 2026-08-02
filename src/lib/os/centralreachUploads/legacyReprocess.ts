/**
 * Reprocess legacy `shared_report_datasets` uploads into the normalized `cr_*`
 * tables. Needed for files that landed in the old upload path before the Data
 * Hub wrote normalized rows. Uses the same append/dedupe logic, so running it
 * twice never duplicates facts.
 */

import {
  listSharedReportDatasets,
  downloadSharedReportDatasetFile,
  type SharedReportDataset,
  type SharedReportKey,
} from "@/lib/os/sharedReportDatasets";
import { importCentralReachFiles, type CrFileImportOutcome } from "./importService";

const LEGACY_KEYS: SharedReportKey[] = [
  "cancellation-scheduling",
  "cancellation-billing",
  "cancellation-authorization",
  "authorization",
];

export interface LegacyReprocessResult {
  datasets: number;
  outcomes: CrFileImportOutcome[];
  errors: string[];
}

/** Collect the distinct legacy dataset files worth reprocessing. */
export async function listLegacyReprocessCandidates(limitPerKey = 3): Promise<SharedReportDataset[]> {
  const all = await Promise.all(LEGACY_KEYS.map((key) => listSharedReportDatasets(key).catch(() => [])));
  const seen = new Set<string>();
  const out: SharedReportDataset[] = [];
  for (const list of all) {
    for (const dataset of list.slice(0, limitPerKey)) {
      const dedupeKey = `${dataset.fileName}:${dataset.fileSize ?? 0}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      out.push(dataset);
    }
  }
  return out.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

export async function reprocessLegacySharedDatasets(
  options: { limitPerKey?: number; onProgress?: (fileName: string) => void } = {},
): Promise<LegacyReprocessResult> {
  const candidates = await listLegacyReprocessCandidates(options.limitPerKey ?? 3);
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
