/**
 * CentralReach normalized-table readers for the 8 primary reports.
 *
 * Every read is RLS-safe (authenticated users only) and never throws — the
 * loaders return empty arrays plus an error message so pages can render an
 * exact empty state that points operators at the CentralReach Data Hub.
 *
 * Reads are ALL-OR-NOTHING. A transport error on any page, a thrown exception,
 * a missing `.range(...)` paging capability, or safety-cap exhaustion all
 * return `rows: []` plus the error. Partially paged rows are never returned,
 * so a KPI total can never be computed from an incomplete result set.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  AuthorizationWeeklyEventRow,
  CrAuthorizationCurrentRow,
  CrAuthorizationRow,
  CrBatchSummary,
  CrBillingSessionRow,
  CrClaimsStatusRow,
  CrEraReconciliationRow,
  CrPaymentCurrentRow,
  CrScheduleCurrentRow,
  CrScheduleEventRow,
  CrTimesheetDocSummaryRow,
  CrUtilizationRow,
  ReportAuthorizationActionRow,
  ReportAuthorizationEventRow,
  ReportBcbaTargetRow,
  ReportBillingFactRow,

} from "./types";

/**
 * Rows requested per page. The Data API caps every response at 1,000 rows
 * regardless of the requested range, so pages must be 1,000 and the loop may
 * only stop on a truly empty page.
 */
export const CR_PAGE_SIZE = 1000;
/** Hard safety cap; high enough for current + future production volume. */
export const CR_SAFETY_CAP = 250000;
/** Explicit, visible error when a read hits the safety cap. */
export const CR_SAFETY_CAP_ERROR =
  `Result exceeded the ${CR_SAFETY_CAP.toLocaleString()} row safety cap — totals would be incomplete`;
/** Explicit error when a report RPC client cannot be paged with `.range(...)`. */
export const CR_RPC_PAGING_UNAVAILABLE_ERROR =
  "Paged reads are unavailable for this report source — totals would be incomplete";

export interface CrLoadResult<T> {
  rows: T[];
  error: string | null;
}

/** All-or-nothing failure shape: never return partially paged rows. */
function failed<T>(error: string): CrLoadResult<T> {
  return { rows: [], error };
}

/**
 * Complete, deterministic paging over a normalized table or curated view.
 *
 * The Data API silently caps every response at 1,000 rows, so a single read
 * would present a partial total as if it were complete. Rows are ordered by a
 * stable unique column before `.range(...)` so pages never overlap or skip, and
 * paging stops on the first short page. Any error, exception or cap exhaustion
 * discards every accumulated row.
 */
export async function readTable<T>(
  table: string,
  columns: string,
  orderColumn = "id",
): Promise<CrLoadResult<T>> {
  const rows: T[] = [];
  try {
    for (let from = 0; from < CR_SAFETY_CAP; from += CR_PAGE_SIZE) {
      const to = Math.min(from + CR_PAGE_SIZE, CR_SAFETY_CAP) - 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any).from(table).select(columns);
      if (typeof query.order === "function") {
        query = query.order(orderColumn, { ascending: true });
      }
      const { data, error } = await query.range(from, to);
      if (error) return failed<T>(error.message);
      const page = (data ?? []) as T[];
      rows.push(...page);
      if (page.length < to - from + 1) return { rows, error: null };
    }
    return failed<T>(CR_SAFETY_CAP_ERROR);
  } catch (err) {
    return failed<T>(
      err instanceof Error ? err.message : `Failed to read ${table}`,
    );
  }
}

/**
 * Complete, deterministic paging over a curated SECURITY DEFINER report RPC.
 * The functions carry their own `ORDER BY` over stable unique fields, so range
 * requests are stable across calls. When the client cannot page the RPC there is
 * no one-shot fallback — an unpaged read would silently cap at 1,000 rows, so an
 * explicit paging-unavailable error is returned with zero rows.
 */
export async function readRpcPaged<T>(
  name: string,
  label: string,
): Promise<CrLoadResult<T>> {
  const rows: T[] = [];
  try {
    for (let from = 0; from < CR_SAFETY_CAP; from += CR_PAGE_SIZE) {
      const to = Math.min(from + CR_PAGE_SIZE, CR_SAFETY_CAP) - 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = (supabase as any).rpc(name);
      if (typeof query?.range !== "function") {
        return failed<T>(`${CR_RPC_PAGING_UNAVAILABLE_ERROR} (${label})`);
      }
      const { data, error } = await query.range(from, to);
      if (error) return failed<T>(error.message);
      const page = (data ?? []) as T[];
      rows.push(...page);
      if (page.length < to - from + 1) return { rows, error: null };
    }
    return failed<T>(CR_SAFETY_CAP_ERROR);
  } catch (err) {
    return failed<T>(err instanceof Error ? err.message : `Failed to read ${label}`);
  }
}


export function fetchCrBillingSessions(): Promise<CrLoadResult<CrBillingSessionRow>> {
  return readTable<CrBillingSessionRow>(
    "cr_billing_sessions",
    "id,batch_id,date_of_service,procedure_code,hours,client_name,client_cr_id,rendering_provider_name,rendering_provider_cr_id,provider_contact_labels,payor,state,location,status",
  );
}

export function fetchCrScheduleEvents(): Promise<CrLoadResult<CrScheduleEventRow>> {
  return readTable<CrScheduleEventRow>(
    "cr_schedule_events",
    "id,batch_id,event_date,procedure_code,scheduled_hours,client_name,client_cr_id,provider_name,provider_cr_id,status,cancellation_reason,cancelled_by,state,location,payor",
  );
}

export function fetchCrAuthorizations(): Promise<CrLoadResult<CrAuthorizationRow>> {
  return readTable<CrAuthorizationRow>(
    "cr_authorizations",
    "id,batch_id,authorization_number,client_name,client_cr_id,payor,state,procedure_code,start_date,end_date,authorized_hours,worked_hours,remaining_hours,status,service_codes,client_labels,is_active,actual_start_date,actual_end_date,followup_start_date,followup_end_date",
  );
}

/**
 * Phase 1 curated scheduling view. Staff-facing scheduling reports read this
 * instead of `cr_schedule_events` so they always see one row per event with
 * the explicit cancellation / deletion truth columns.
 */
export function fetchCrScheduleCurrent(): Promise<CrLoadResult<CrScheduleCurrentRow>> {
  return readTable<CrScheduleCurrentRow>(
    "v_cr_schedule_current",
    "id,event_date,start_time,end_time,service_code,procedure_code,billing_code,billing_code_name,scheduled_hours,client_name,client_cr_id,provider_name,provider_cr_id,status,attendance,cancelled,deleted,converted_to_timesheet,cancellation_reason,cancelled_by,state,location,payor,billing_creation_date,last_seen_at",
  );
}

/** Phase 1 curated authorization snapshot (latest state per authorization). */
export function fetchCrAuthorizationCurrent(): Promise<
  CrLoadResult<CrAuthorizationCurrentRow>
> {
  return readTable<CrAuthorizationCurrentRow>(
    "v_cr_authorization_current",
    "id,authorization_id,authorization_number,followup_authorization_number,client_name,client_cr_id,payor,state,procedure_code,service_codes,followup_service_codes,frequency,manager,implementer,start_date,end_date,actual_start_date,actual_end_date,followup_start_date,followup_end_date,is_active,status,authorized_hours,worked_hours,remaining_hours,authorized_hours_all,authorized_hours_month,authorized_hours_auth_range,worked_hours_all,worked_hours_month,worked_hours_auth_range,scheduled_hours_all,scheduled_hours_month,scheduled_hours_auth_range,pending_hours_all,pending_hours_month,pending_hours_auth_range,remaining_hours_all,remaining_hours_month,remaining_hours_auth_range,utilization_percent_all,utilization_percent_month,utilization_percent_auth_range,source_row_id,last_seen_at",
  );
}

/**
 * Curated authorization lifecycle events via the `report_authorization_events`
 * SECURITY DEFINER RPC — cross-state, no PHI beyond the client name. Paged so a
 * busy authorization history is never silently truncated at 1,000 rows.
 */
export function fetchReportAuthorizationEvents(): Promise<
  CrLoadResult<ReportAuthorizationEventRow>
> {
  return readRpcPaged<ReportAuthorizationEventRow>(
    "report_authorization_events",
    "authorization lifecycle events",
  );
}

/** Generic curated-RPC reader: complete paging, never throws. */
const readRpc = readRpcPaged;


/**
 * Curated authorization operational actions via `report_authorization_actions`.
 * Supplies the authoritative due dates the Progress Reports and Pauses tabs
 * need — reports must never infer a due date from an authorization start date.
 */
export function fetchReportAuthorizationActions(): Promise<
  CrLoadResult<ReportAuthorizationActionRow>
> {
  return readRpc<ReportAuthorizationActionRow>(
    "report_authorization_actions",
    "authorization actions",
  );
}

/** Curated billing facts via `report_billing_facts` (sessions + status join). */
export function fetchReportBillingFacts(): Promise<CrLoadResult<ReportBillingFactRow>> {
  return readRpc<ReportBillingFactRow>("report_billing_facts", "billing facts");
}

/**
 * Curated BCBA productivity targets via `report_bcba_performance_targets`.
 * Only real target rows exist here — an absent row means "No target".
 */
export function fetchReportBcbaTargets(): Promise<CrLoadResult<ReportBcbaTargetRow>> {
  return readRpc<ReportBcbaTargetRow>(
    "report_bcba_performance_targets",
    "BCBA performance targets",
  );
}


/** Authorization-team logged workflow events (submissions, denials, PRs, pauses). */
export function fetchAuthorizationWeeklyEvents(): Promise<
  CrLoadResult<AuthorizationWeeklyEventRow>
> {
  return readTable<AuthorizationWeeklyEventRow>(
    "authorization_weekly_events",
    "id,event_type,event_date,client_name,client_cr_id,authorization_number,payor,state,pause_reason,pause_reason_detail,notes,logged_by,created_at",
  );
}

export function fetchCrUtilization(): Promise<CrLoadResult<CrUtilizationRow>> {
  return readTable<CrUtilizationRow>(
    "cr_authorization_utilization",
    "id,batch_id,authorization_number,client_name,payor,state,procedure_code,week_start,week_end,authorized_hours,used_hours,utilization_percent",
  );
}

/** Latest active import batches, newest first, for the freshness indicator. */
export async function fetchCrBatches(
  exportTypes?: string[],
): Promise<CrLoadResult<CrBatchSummary>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabase as any)
      .from("cr_import_batches")
      .select(
        "id,file_name,export_type,row_count,deduped_row_count,coverage_start,coverage_end,status,created_at,is_active",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (exportTypes?.length) q = q.in("export_type", exportTypes);
    const { data, error } = await q;
    if (error) return { rows: [], error: error.message };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: CrBatchSummary[] = (data ?? []).map((r: any) => ({
      id: r.id,
      exportType: r.export_type ?? "unknown",
      fileName: r.file_name ?? "",
      rowCount: r.row_count ?? 0,
      dedupedRowCount: r.deduped_row_count ?? null,
      coverageStart: r.coverage_start ?? null,
      coverageEnd: r.coverage_end ?? null,
      createdAt: r.created_at,
      status: r.status ?? null,
    }));
    return { rows, error: null };
  } catch (err) {
    return {
      rows: [],
      error: err instanceof Error ? err.message : "Failed to read import batches",
    };
  }
}

/** Coverage window + row totals derived from batches for a report. */
export function summarizeFreshness(batches: CrBatchSummary[]) {
  if (!batches.length) {
    return {
      latestUpload: null as string | null,
      coverageStart: null as string | null,
      coverageEnd: null as string | null,
      rowCount: 0,
      batchCount: 0,
      fileName: null as string | null,
    };
  }
  const sorted = [...batches].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
  const starts = batches.map((b) => b.coverageStart).filter(Boolean) as string[];
  const ends = batches.map((b) => b.coverageEnd).filter(Boolean) as string[];
  return {
    latestUpload: sorted[0].createdAt,
    coverageStart: starts.length ? starts.sort()[0] : null,
    coverageEnd: ends.length ? ends.sort()[ends.length - 1] : null,
    rowCount: batches.reduce(
      (sum, b) => sum + (b.dedupedRowCount ?? b.rowCount ?? 0),
      0,
    ),
    batchCount: batches.length,
    fileName: sorted[0].fileName || null,
  };
}
/**
 * Curated claims status rows via the role-checked `report_claims_status` RPC.
 * The underlying table stays admin-only; this RPC is the staff-facing read
 * path. Amount columns are deliberately NOT returned: their unit is
 * unconfirmed, so no staff-facing claims report may display or estimate a
 * dollar value.
 */
export function fetchCrClaimsStatus(): Promise<CrLoadResult<CrClaimsStatusRow>> {
  return readRpcPaged<CrClaimsStatusRow>("report_claims_status", "claims submission status");
}

/** Curated payments snapshot RPC — no references, notes, check numbers or amounts. */
export function fetchCrPaymentsCurrent(): Promise<CrLoadResult<CrPaymentCurrentRow>> {
  return readRpcPaged<CrPaymentCurrentRow>("report_payments_current", "payments");
}

/** Curated ERA remittance reconciliation RPC — no check numbers, no amounts. */
export function fetchCrEraReconciliation(): Promise<CrLoadResult<CrEraReconciliationRow>> {
  return readRpcPaged<CrEraReconciliationRow>(
    "report_era_reconciliation",
    "ERA remittance reconciliation",
  );
}

/**
 * Provider-level documentation readiness summary. Aggregate only: no client
 * name/id, no hours, rates, amounts, references, notes or check fields.
 */
export function fetchReportTimesheetDocumentationSummary(): Promise<
  CrLoadResult<CrTimesheetDocSummaryRow>
> {
  return readRpcPaged<CrTimesheetDocSummaryRow>(
    "report_timesheet_documentation_summary",
    "documentation readiness",
  );
}

