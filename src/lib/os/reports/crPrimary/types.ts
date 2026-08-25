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

/**
 * Phase 1 curated scheduling view (`v_cr_schedule_current`): one row per
 * CentralReach event, carrying the explicit cancellation / deletion truth
 * columns. Staff-facing scheduling reports read this, not the raw table.
 */
export interface CrScheduleCurrentRow {
  id: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  service_code: string | null;
  procedure_code: string | null;
  billing_code: string | null;
  billing_code_name: string | null;
  scheduled_hours: number | null;
  client_name: string | null;
  provider_name: string | null;
  status: string | null;
  attendance: string | null;
  cancelled: boolean | null;
  deleted: boolean | null;
  converted_to_timesheet: boolean | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  state: string | null;
  location: string | null;
  payor: string | null;
  billing_creation_date: string | null;
  last_seen_at: string | null;
}

/**
 * Phase 1 curated authorization snapshot (`v_cr_authorization_current`): the
 * latest state of every authorization, including the month / range hour
 * variants CentralReach reports.
 */
export interface CrAuthorizationCurrentRow {
  id: string;
  authorization_id: string | null;
  authorization_number: string | null;
  followup_authorization_number: string | null;
  client_name: string | null;
  client_cr_id: string | null;
  payor: string | null;
  state: string | null;
  procedure_code: string | null;
  service_codes: string | null;
  frequency: string | null;
  manager: string | null;
  implementer: string | null;
  start_date: string | null;
  end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  followup_start_date: string | null;
  followup_end_date: string | null;
  is_active: boolean | null;
  status: string | null;
  authorized_hours: number | null;
  worked_hours: number | null;
  remaining_hours: number | null;
  authorized_hours_month: number | null;
  worked_hours_month: number | null;
  authorized_hours_all: number | null;
  authorized_hours_auth_range: number | null;
  worked_hours_all: number | null;
  worked_hours_auth_range: number | null;
  scheduled_hours_all: number | null;
  scheduled_hours_month: number | null;
  scheduled_hours_auth_range: number | null;
  pending_hours_all: number | null;
  pending_hours_month: number | null;
  pending_hours_auth_range: number | null;
  remaining_hours_all: number | null;
  remaining_hours_month: number | null;
  remaining_hours_auth_range: number | null;
  utilization_percent_all: number | null;
  utilization_percent_month: number | null;
  utilization_percent_auth_range: number | null;
  followup_service_codes: string | null;
  source_row_id: string | null;
  last_seen_at: string | null;
}

/**
 * Curated authorization operational action row from the
 * `report_authorization_actions` SECURITY DEFINER RPC. Only the minimum
 * operational fields — no contact info, assignee UUIDs, notes, or payloads.
 */
export interface ReportAuthorizationActionRow {
  record_id: string;
  client_name: string | null;
  client_cr_id: string | null;
  authorization_id: string | null;
  authorization_number: string | null;
  auth_type: string | null;
  state: string | null;
  payor: string | null;
  service_code: string | null;
  status: string | null;
  workflow_stage: string | null;
  received_date: string | null;
  submitted_date: string | null;
  approved_date: string | null;
  denied_date: string | null;
  resubmitted_date: string | null;
  expiration_date: string | null;
  denial_reason: string | null;
  missing_info: string | null;
  next_action: string | null;
  next_action_due_date: string | null;
  appeal_due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Curated billing fact from the `report_billing_facts` SECURITY DEFINER RPC:
 * `cr_billing_sessions` joined to its mutable status row. Reports read this
 * instead of the base billing table — no rates, payloads, or contact labels.
 */
export interface ReportBillingFactRow {
  id: string;
  source_row_id: string | null;
  date_of_service: string | null;
  procedure_code: string | null;
  hours: number | null;
  client_name: string | null;
  client_cr_id: string | null;
  provider_name: string | null;
  provider_cr_id: string | null;
  payor: string | null;
  state: string | null;
  location: string | null;
  status: string | null;
  authorization_id: string | null;
  creation_date: string | null;
  first_bill_date: string | null;
  first_claim_date: string | null;
  is_void: boolean | null;
  deleted: boolean | null;
  signed_by_provider: boolean | null;
  signed_by_client: boolean | null;
  provider_role: string | null;
  delivery_method: string | null;
  place_of_service: string | null;
  last_seen_at: string | null;
}

/**
 * Curated authorization lifecycle event from the `report_authorization_events`
 * SECURITY DEFINER RPC. No PHI beyond the client name, no financial fields.
 *
 * `auth_type` / `lifecycle_kind` carry the *recorded* authorization type for
 * operational records so a real submitted/approved/denied event is classified
 * honestly instead of collapsing into "Unclassified". Manually logged weekly
 * events leave both null unless the event type itself names the kind — the kind
 * is never invented from dates.
 */
export interface ReportAuthorizationEventRow {
  record_id: string;
  source: string | null;
  event_type: string;
  event_date: string | null;
  client_name: string | null;
  client_cr_id: string | null;
  authorization_number: string | null;
  auth_type: string | null;
  lifecycle_kind: string | null;
  payor: string | null;
  state: string | null;
  reason: string | null;
  created_at: string | null;
}

/**
 * Curated BCBA productivity target from `report_bcba_performance_targets()`.
 * Target/forecast hours only — no UUIDs, notes, risks, or admin fields. When no
 * row exists for a BCBA and period the report must show "No target" rather than
 * fabricate a minimum.
 */
export interface ReportBcbaTargetRow {
  bcba_name: string | null;
  state: string | null;
  period_start: string | null;
  period_end: string | null;
  mtd_target_hours: number | null;
  mtd_actual_hours: number | null;
  forecast_hours: number | null;
  updated_at: string | null;
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
  service_codes?: string | null;
  client_labels?: string | null;
  is_active?: boolean | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  followup_start_date?: string | null;
  followup_end_date?: string | null;
}

/**
 * Manually logged authorization workflow event. CentralReach exports carry no
 * submission/denial timestamps or progress-report events, so the Authorization
 * team logs them weekly and the report merges them with derived signals.
 */
export interface AuthorizationWeeklyEventRow {
  id: string;
  event_type: string;
  event_date: string;
  client_name: string | null;
  client_cr_id: string | null;
  authorization_number: string | null;
  payor: string | null;
  state: string | null;
  pause_reason: string | null;
  pause_reason_detail: string | null;
  notes: string | null;
  logged_by: string | null;
  created_at: string;
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
  /** End of an effective period; omitted for single-day facts. */
  endDate?: string | null;
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
  /** Exact filters that produced this row set (shown as chips in the drawer). */
  filters?: { label: string; value: string }[];
  /** Source rows shown in the drilldown, already filtered. */
  rows: Record<string, unknown>[];
  columns: { key: string; label: string }[];
  /** File slug used for the drilldown CSV export. */
  exportName: string;
}