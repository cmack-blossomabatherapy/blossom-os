/**
 * Shared-dataset loader for the three report engines that read admin-fed
 * files (Authorization Analysis / Hour-Based Utilization / Cancellation
 * Command Center).
 *
 * Given a `SharedReportKey`, this module:
 *   1) fetches the active `shared_report_datasets` row
 *   2) downloads the storage file (`data-uploads` bucket, RLS-safe)
 *   3) parses it through `parseAnyFile` (CSV / XLSX / XLS)
 *   4) inspects the parsed file with the canonical mapper (`inspectFile`)
 *   5) validates the report's required canonical fields
 *   6) computes staleness (default: >30 days since upload)
 *
 * The result is a discriminated union so consumers can render exact
 * loading / missing / invalid / stale / ready / error states without
 * inventing demo data. This helper is import-only — it never writes
 * clinical documentation back to CentralReach.
 *
 * No PHI is logged. Errors carry short technical messages only.
 */
import {
  getActiveSharedReportDataset,
  downloadSharedReportDatasetFile,
  type SharedReportKey,
  type SharedReportDataset,
} from "@/lib/os/sharedReportDatasets";
import { parseAnyFile } from "@/lib/os/dashboardEngine/excelParser";
import { inspectFile } from "@/lib/os/reportEngine/inspector";
import type {
  CanonicalField,
  InspectionResult,
  ParsedFile,
} from "@/lib/os/reportEngine/types";

export type SharedDatasetStatus =
  | "idle"
  | "loading"
  | "ready"
  | "missing"
  | "invalid"
  | "error";

export interface SharedDatasetLoadResult {
  key: SharedReportKey;
  status: SharedDatasetStatus;
  /** Days since upload (integer). Null when there is no dataset. */
  ageDays: number | null;
  /** True when the loaded/known dataset is older than the stale threshold. */
  stale: boolean;
  dataset: SharedReportDataset | null;
  parsed: ParsedFile | null;
  inspection: InspectionResult | null;
  missingFields: CanonicalField[];
  errorMessage: string | null;
}

const DEFAULT_STALE_DAYS = 30;

function computeAgeDays(uploadedAt: string | null | undefined): number | null {
  if (!uploadedAt) return null;
  const uploaded = new Date(uploadedAt);
  if (Number.isNaN(uploaded.getTime())) return null;
  const ms = Date.now() - uploaded.getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function emptyResult(
  key: SharedReportKey,
  status: SharedDatasetStatus,
  extra: Partial<SharedDatasetLoadResult> = {},
): SharedDatasetLoadResult {
  return {
    key,
    status,
    ageDays: null,
    stale: false,
    dataset: null,
    parsed: null,
    inspection: null,
    missingFields: [],
    errorMessage: null,
    ...extra,
  };
}

export interface LoadSharedDatasetOptions {
  requiredFields?: CanonicalField[];
  staleAfterDays?: number;
  /** If true, only look up dataset metadata — do NOT download/parse. */
  probeOnly?: boolean;
}

/**
 * Locate + download + parse + validate the active shared dataset for a
 * report key. Never throws — every failure mode is encoded in the
 * returned result so the UI can render an exact state.
 */
export async function loadSharedDataset(
  key: SharedReportKey,
  opts: LoadSharedDatasetOptions = {},
): Promise<SharedDatasetLoadResult> {
  const required = opts.requiredFields ?? [];
  const staleAfter = opts.staleAfterDays ?? DEFAULT_STALE_DAYS;

  let dataset: SharedReportDataset | null = null;
  try {
    dataset = await getActiveSharedReportDataset(key);
  } catch (err) {
    return emptyResult(key, "error", {
      errorMessage:
        err instanceof Error ? err.message : "Failed to look up shared dataset",
    });
  }

  if (!dataset) {
    return emptyResult(key, "missing");
  }

  const ageDays = computeAgeDays(dataset.uploadedAt);
  const stale = ageDays != null && ageDays > staleAfter;

  if (opts.probeOnly) {
    return emptyResult(key, "ready", {
      dataset,
      ageDays,
      stale,
    });
  }

  let file: File;
  try {
    file = await downloadSharedReportDatasetFile(dataset);
  } catch (err) {
    return emptyResult(key, "error", {
      dataset,
      ageDays,
      stale,
      errorMessage:
        err instanceof Error ? err.message : "Failed to download shared dataset",
    });
  }

  let parsed: ParsedFile | null = null;
  try {
    const sheets = await parseAnyFile(file);
    parsed = sheets[0] ?? null;
    if (!parsed || !parsed.rowCount) {
      return emptyResult(key, "invalid", {
        dataset,
        ageDays,
        stale,
        parsed,
        errorMessage: "Shared dataset file is empty.",
      });
    }
  } catch (err) {
    return emptyResult(key, "invalid", {
      dataset,
      ageDays,
      stale,
      errorMessage:
        err instanceof Error
          ? err.message
          : "Shared dataset file could not be parsed.",
    });
  }

  const inspection = inspectFile(parsed);
  const missingFields = required.filter((f) => !inspection.detected[f]);
  if (missingFields.length > 0) {
    return emptyResult(key, "invalid", {
      dataset,
      ageDays,
      stale,
      parsed,
      inspection,
      missingFields,
      errorMessage:
        `Shared dataset is missing required canonical fields: ${missingFields.join(", ")}`,
    });
  }

  return {
    key,
    status: "ready",
    ageDays,
    stale,
    dataset,
    parsed,
    inspection,
    missingFields: [],
    errorMessage: null,
  };
}

/** Convert a loaded shared dataset back into a `File` for legacy handlers. */
export async function sharedDatasetToFile(
  dataset: SharedReportDataset,
): Promise<File> {
  return downloadSharedReportDatasetFile(dataset);
}

export const SHARED_DATASET_STALE_DAYS = DEFAULT_STALE_DAYS;