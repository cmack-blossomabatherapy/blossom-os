/** Normalized row shapes for the CentralReach `cr_*` reporting tables. */

export interface CrBillingSessionRow {
  id: string;
  batch_id: string | null;
  date_of_service: string | null;
  procedure_code: string | null;
  hours: number | null;
  client_name: string | null;
  client_cr_id: string | null;
  rendering_provider_name: string | null;
  rendering_provider_cr_id: string | null;
  provider_contact_labels: string | null;
  payor: string | null;
  state: string | null;
  location: string | null;
  status: string | null;
}

export interface CrScheduleEventRow {
  id: string;
  batch_id: string | null;
  event_date: string | null;
  procedure_code: string | null;
  scheduled_hours: number | null;
  client_name: string | null;
  provider_name: string | null;
  status: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  state: string | null;
  location: string | null;
  payor: string | null;
}

export interface CrAuthorizationRow {
  id: string;
  batch_id: string | null;
  authorization_number: string | null;
  client_name: string | null;
  client_cr_id: string | null;
  payor: string | null;
  state: string | null;
  procedure_code: string | null;
  start_date: string | null;
  end_date: string | null;
  authorized_hours: number | null;
  worked_hours: number | null;
  remaining_hours: number | null;
  status: string | null;
}

export interface CrUtilizationRow {
  id: string;
  batch_id: string | null;
  authorization_number: string | null;
  client_name: string | null;
  payor: string | null;
  state: string | null;
  procedure_code: string | null;
  week_start: string | null;
  week_end: string | null;
  authorized_hours: number | null;
  used_hours: number | null;
  utilization_percent: number | null;
}

export interface CrBatchSummary {
  id: string;
  exportType: string;
  fileName: string;
  rowCount: number;
  dedupedRowCount: number | null;
  coverageStart: string | null;
  coverageEnd: string | null;
  createdAt: string;
  status: string | null;
}

/** Active filter state shared by every primary report. */
export interface PrimaryReportFilters {
  from: string;
  to: string;
  state: string;
  client: string;
  provider: string;
  payor: string;
  code: string;
  location: string;
  status: string;
}

export const EMPTY_FILTERS: PrimaryReportFilters = {
  from: "",
  to: "",
  state: "",
  client: "",
  provider: "",
  payor: "",
  code: "",
  location: "",
  status: "",
};

/** Field projection used by the generic filter matcher. */
export interface FilterableFact {
  date?: string | null;
  state?: string | null;
  client?: string | null;
  provider?: string | null;
  payor?: string | null;
  code?: string | null;
  location?: string | null;
  status?: string | null;
}

export interface KpiDefinition {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}

export interface ChartDatum {
  label: string;
  value: number;
  secondary?: number;
}

/** A drilldown request produced by clicking a KPI, chart segment, or row. */
export interface DrilldownRequest {
  title: string;
  subtitle?: string;
  /** Source rows shown in the drilldown, already filtered. */
  rows: Record<string, unknown>[];
  columns: { key: string; label: string }[];
  /** File slug used for the drilldown CSV export. */
  exportName: string;
}