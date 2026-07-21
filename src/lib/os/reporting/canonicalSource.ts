/**
 * Canonical CentralReach reporting adapter.
 *
 * Read-only surface over uploaded CentralReach data. Downstream reports MUST
 * NOT write clinical documentation back to CentralReach through this layer —
 * this is an import-only reporting seam.
 *
 * Backed by:
 *  - `v_cr_canonical_sessions` (Supabase view) for row-level session/billing
 *     shape normalized across procedure codes with reconciled provider IDs.
 *  - `report_source_coverage()` (Supabase RPC) for per-report aggregate
 *     diagnostics: file name, upload/sync time, row counts, date range,
 *     unmapped providers. No row-level PHI is returned.
 *  - `shared_report_datasets` for file-based uploads (authorization,
 *     cancellation-*), when the report is not powered by the productivity
 *     billing rows.
 */
import { supabase } from "@/integrations/supabase/client";

export type CanonicalReportKey =
  | "bcba-productivity"
  | "bcba-supervision"
  | "parent-training-97156"
  | "hour-based-utilization"
  | "rbt-session-supervision"
  | "authorization"
  | "cancellation-scheduling"
  | "cancellation-billing"
  | "cancellation-authorization";

export const CANONICAL_REPORT_LABELS: Record<CanonicalReportKey, string> = {
  "bcba-productivity": "BCBA Productivity",
  "bcba-supervision": "BCBA Supervision (97155)",
  "parent-training-97156": "Parent Training (97156)",
  "hour-based-utilization": "Hour-Based Authorization Utilization",
  "rbt-session-supervision": "RBT Session & Supervision",
  "authorization": "Authorization Analysis",
  "cancellation-scheduling": "Cancellation — Scheduling",
  "cancellation-billing": "Cancellation — Billing",
  "cancellation-authorization": "Cancellation — Authorization",
};

export type ReportSourceStatus = "ready" | "missing" | "stale" | "error";

export interface ReportSourceCoverage {
  reportKey: CanonicalReportKey;
  source: string;
  sourceFileName: string | null;
  sourceSystem: string | null;
  uploadedAt: string | null;
  serviceDateMin: string | null;
  serviceDateMax: string | null;
  rowCount: number | null;
  directRows: number | null;
  supervisionRows: number | null;
  parentTrainingRows: number | null;
  cancellationRows: number | null;
  distinctClients: number | null;
  distinctProviders: number | null;
  unmappedProviders: number | null;
  fileSize: number | null;
  status: ReportSourceStatus;
  ageDays: number | null;
}

const STALE_DAYS = 14;

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function ageDaysFrom(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

function normalize(raw: Record<string, unknown>): ReportSourceCoverage {
  const uploadedAt = (raw.uploaded_at as string | null) ?? null;
  const age = ageDaysFrom(uploadedAt);
  const rawStatus = (raw.status as string | null) ?? "ready";
  let status: ReportSourceStatus =
    rawStatus === "missing" ? "missing" : rawStatus === "error" ? "error" : "ready";
  if (status === "ready" && age != null && age > STALE_DAYS) status = "stale";
  return {
    reportKey: raw.report_key as CanonicalReportKey,
    source: (raw.source as string | null) ?? "unknown",
    sourceFileName: (raw.source_file_name as string | null) ?? null,
    sourceSystem: (raw.source_system as string | null) ?? null,
    uploadedAt,
    serviceDateMin: (raw.service_date_min as string | null) ?? null,
    serviceDateMax: (raw.service_date_max as string | null) ?? null,
    rowCount: toNumber(raw.row_count),
    directRows: toNumber(raw.direct_rows),
    supervisionRows: toNumber(raw.supervision_rows),
    parentTrainingRows: toNumber(raw.parent_training_rows),
    cancellationRows: toNumber(raw.cancellation_rows),
    distinctClients: toNumber(raw.distinct_clients),
    distinctProviders: toNumber(raw.distinct_providers),
    unmappedProviders: toNumber(raw.unmapped_providers),
    fileSize: toNumber(raw.file_size),
    status,
    ageDays: age,
  };
}

/**
 * Exported for unit tests — pure normalizer.
 */
export function _normalizeCoverageRow(raw: Record<string, unknown>): ReportSourceCoverage {
  return normalize(raw);
}

export async function fetchReportSourceCoverage(): Promise<ReportSourceCoverage[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("report_source_coverage");
  if (error) throw error;
  const rows: Record<string, unknown>[] = Array.isArray(data)
    ? (data as Record<string, unknown>[])
    : [];
  return rows.map(normalize);
}

export async function fetchReportSourceCoverageFor(
  keys: CanonicalReportKey[],
): Promise<ReportSourceCoverage[]> {
  const all = await fetchReportSourceCoverage();
  const wanted = new Set(keys);
  return all.filter((r) => wanted.has(r.reportKey));
}