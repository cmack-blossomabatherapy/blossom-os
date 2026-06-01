import type { CanonicalRow } from "@/lib/os/reportEngine/calculations";
import type { ColumnMapping, ParsedFile, CanonicalField } from "@/lib/os/reportEngine/types";

export type DashboardType =
  | "operations"
  | "supervision"
  | "authorization"
  | "parent_training"
  | "cancellation"
  | "scheduling"
  | "billing"
  | "leadership"
  | "state"
  | "bcba"
  | "custom";

export const DASHBOARD_TYPE_LABELS: Record<DashboardType, string> = {
  operations: "Operations Dashboard",
  supervision: "Supervision Dashboard",
  authorization: "Authorization Dashboard",
  parent_training: "Parent Training Dashboard",
  cancellation: "Cancellation Dashboard",
  scheduling: "Scheduling Dashboard",
  billing: "Billing Dashboard",
  leadership: "Leadership Dashboard",
  state: "State Dashboard",
  bcba: "BCBA Performance Dashboard",
  custom: "Custom Dashboard",
};

export type ChartType = "bar" | "line" | "pie" | "stacked-bar" | "area";

export interface KpiSpec {
  id: string;
  label: string;
  value: string;
  raw: number;
  delta?: { value: number; tone: "up" | "down" | "flat"; label?: string };
  trend?: number[];
  hint?: string;
  tone?: "default" | "success" | "warn" | "danger";
  /** Drilldown rows to show when card is clicked. */
  drilldown?: DrilldownSpec;
}

export interface DrilldownSpec {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  /** Optional sub-message shown when no rows match. */
  emptyMessage?: string;
}

export interface ChartSpec {
  id: string;
  title: string;
  subtitle?: string;
  type: ChartType;
  labels: string[];
  series: { name: string; data: number[]; color?: string }[];
  /** Suggested width hint (1 = half, 2 = full). */
  span?: 1 | 2;
  /** Y-axis suffix e.g. "%" or " hrs". */
  unit?: string;
}

export interface RiskTableSpec {
  id: string;
  title: string;
  severity: "low" | "med" | "high";
  columns: string[];
  rows: (string | number)[][];
  emptyMessage?: string;
}

export interface DataQualityIssue {
  label: string;
  detail: string;
  rowsAffected?: number;
}

export interface DashboardSpec {
  type: DashboardType;
  title: string;
  subtitle?: string;
  /** Engine-built KPIs (top row). */
  kpis: KpiSpec[];
  /** Primary + secondary charts (middle rows). */
  charts: ChartSpec[];
  /** Risk tables (third row). */
  risks: RiskTableSpec[];
  /** Full drilldown row sets keyed by id (used by the view). */
  drilldowns: Record<string, DrilldownSpec>;
  /** Executive insights (deterministic fallback; AI may overwrite). */
  executiveInsights: string[];
  /** Recommended actions (deterministic fallback; AI may overwrite). */
  recommendedActions: string[];
  /** Inline notes about unavailable metrics. */
  notes: string[];
  dataQuality: DataQualityIssue[];
  totalRows: number;
  totalFiles: number;
  dateRange: { min: string; max: string } | null;
}

export interface BuildDashboardInput {
  files: ParsedFile[];
  mappings: ColumnMapping[];
  type: DashboardType;
  prompt?: string;
}

export type { CanonicalRow, ColumnMapping, ParsedFile, CanonicalField };