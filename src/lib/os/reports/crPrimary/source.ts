/**
 * CentralReach normalized-table readers for the 8 primary reports.
 *
 * Every read is RLS-safe (authenticated users only) and never throws — the
 * loaders return empty arrays plus an error message so pages can render an
 * exact empty state that points operators at the CentralReach Data Hub.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  AuthorizationWeeklyEventRow,
  CrAuthorizationRow,
  CrBatchSummary,
  CrBillingSessionRow,
  CrScheduleEventRow,
  CrUtilizationRow,
} from "./types";

/** Rows requested per Supabase range page. */
export const CR_PAGE_SIZE = 5000;
/** Hard safety cap; high enough for current + future production volume. */
export const CR_SAFETY_CAP = 250000;

export interface CrLoadResult<T> {
  rows: T[];
  error: string | null;
}

export async function readTable<T>(
  table: string,
  columns: string,
): Promise<CrLoadResult<T>> {
  const rows: T[] = [];
  try {
    for (let from = 0; from < CR_SAFETY_CAP; from += CR_PAGE_SIZE) {
      const to = Math.min(from + CR_PAGE_SIZE, CR_SAFETY_CAP) - 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(table)
        .select(columns)
        .range(from, to);
      if (error) return { rows: rows as T[], error: error.message };
      const page = (data ?? []) as T[];
      rows.push(...page);
      if (page.length < to - from + 1) return { rows, error: null };
    }
    return { rows, error: "Result exceeded safety cap" };
  } catch (err) {
    return {
      rows,
      error: err instanceof Error ? err.message : `Failed to read ${table}`,
    };
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
    "id,batch_id,event_date,procedure_code,scheduled_hours,client_name,provider_name,status,cancellation_reason,cancelled_by,state,location,payor",
  );
}

export function fetchCrAuthorizations(): Promise<CrLoadResult<CrAuthorizationRow>> {
  return readTable<CrAuthorizationRow>(
    "cr_authorizations",
    "id,batch_id,authorization_number,client_name,client_cr_id,payor,state,procedure_code,start_date,end_date,authorized_hours,worked_hours,remaining_hours,status,service_codes,client_labels,is_active,actual_start_date,actual_end_date,followup_start_date,followup_end_date",
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