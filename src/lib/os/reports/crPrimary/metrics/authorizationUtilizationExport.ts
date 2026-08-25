/**
 * Pure export projections for Authorization Utilization.
 *
 * Each of the four tabs exports its own dataset. Trends export only the
 * cleanly allocated hours the chart is drawn from — ambiguous and unjoined
 * billing rows are never exported as if they belonged to an authorization.
 */
import type { ExportColumn, ExportProjection } from "./authorizationExport";
import type { AuthorizationTrendResult } from "./authorizationTrends";

export type UtilizationTabKey = "utilization" | "trends" | "reconciliation" | "gaps";

export interface UtilizationExportInput {
  /** Already-projected utilization rows and their column set. */
  utilizationRows: Record<string, unknown>[];
  utilizationColumns: ExportColumn[];
  /** Rows where source and recomputed hours disagree. */
  reconciliationRows: Record<string, unknown>[];
  /** Rows that cannot be computed, with the documented reason. */
  gapRows: Record<string, unknown>[];
  /** Trend built exclusively from cleanly allocated billing hours. */
  trend: AuthorizationTrendResult;
}

export const TREND_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "period", label: "Period Start" },
  { key: "grain", label: "Grain" },
  { key: "authorizedHours", label: "Authorized Hrs (Prorated)" },
  { key: "usedHours", label: "Used Hrs (Allocated Only)" },
  { key: "utilizationPct", label: "Utilization %" },
];

export function buildUtilizationTabExport(
  tab: UtilizationTabKey,
  input: UtilizationExportInput,
): ExportProjection {
  if (tab === "trends") {
    return {
      name: "authorization-utilization-trends",
      columns: TREND_EXPORT_COLUMNS,
      rows: input.trend.points.map((p) => ({
        period: p.label,
        grain: input.trend.grain,
        authorizedHours: p.authorizedHours,
        usedHours: p.usedHours,
        utilizationPct: p.utilizationPct ?? "Cannot compute",
      })),
    };
  }
  if (tab === "reconciliation") {
    return {
      name: "authorization-utilization-reconciliation",
      columns: input.utilizationColumns,
      rows: input.reconciliationRows,
    };
  }
  if (tab === "gaps") {
    return {
      name: "authorization-utilization-data-gaps",
      columns: input.utilizationColumns,
      rows: input.gapRows,
    };
  }
  return {
    name: "authorization-utilization-hour-based",
    columns: input.utilizationColumns,
    rows: input.utilizationRows,
  };
}
