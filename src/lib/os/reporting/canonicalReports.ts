/**
 * Canonical CentralReach REPORT engines.
 *
 * Thin, typed wrappers around the four aggregate RPCs added by the
 * "canonical reporting engines" migration. All are read-only, RLS-safe
 * (SECURITY DEFINER + EXECUTE granted to `authenticated`/`service_role`
 * only) and operate on `v_cr_canonical_sessions`.
 *
 *   canonical_report_totals(_start,_end,_search)
 *   canonical_report_client_hours(_start,_end,_search,_limit,_offset)
 *   canonical_report_provider_hours(_start,_end,_search,_include_unmapped,_limit,_offset)
 *   canonical_report_billing_rows(_start,_end,_search,_client_id,_provider_id,_kinds,_codes,_limit,_offset)
 *
 * These are the primary data sources for the BCBA Productivity, BCBA
 * Supervision and Parent Training reports. Manual uploads on those pages
 * are explicit *temporary overrides* with a visible "Reset to shared
 * source" control — never a silent replacement for canonical data.
 */
import { supabase } from "@/integrations/supabase/client";
import type { CanonicalSessionKind } from "@/lib/os/reporting/canonicalConsumer";

/* -------- helpers exported for tests -------- */

export function n(v: unknown): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}
export function s(v: unknown): string | null {
  return v == null || v === "" ? null : String(v);
}

/* -------- filter contract -------- */

export interface CanonicalReportFilter {
  start?: string | null;
  end?: string | null;
  search?: string | null;
}

/* -------- totals -------- */

export interface CanonicalReportTotals {
  totalRows: number;
  totalHours: number;
  directHours: number;
  supervisionHours: number;
  parentTrainingHours: number;
  assessmentHours: number;
  cancellationHours: number;
  adminHours: number;
  h97153: number;
  h97155: number;
  h97156: number;
  distinctClients: number;
  distinctProviders: number;
  unmappedRows: number;
  unmappedHours: number;
  unmappedProviders: number;
  minServiceDate: string | null;
  maxServiceDate: string | null;
  minBatchUploadedAt: string | null;
  maxBatchUploadedAt: string | null;
}

export function mapTotals(row: Record<string, unknown> | null | undefined): CanonicalReportTotals {
  const r = row ?? {};
  return {
    totalRows: n(r.total_rows),
    totalHours: n(r.total_hours),
    directHours: n(r.direct_hours),
    supervisionHours: n(r.supervision_hours),
    parentTrainingHours: n(r.parent_training_hours),
    assessmentHours: n(r.assessment_hours),
    cancellationHours: n(r.cancellation_hours),
    adminHours: n(r.admin_hours),
    h97153: n(r.h97153),
    h97155: n(r.h97155),
    h97156: n(r.h97156),
    distinctClients: n(r.distinct_clients),
    distinctProviders: n(r.distinct_providers),
    unmappedRows: n(r.unmapped_rows),
    unmappedHours: n(r.unmapped_hours),
    unmappedProviders: n(r.unmapped_providers),
    minServiceDate: s(r.min_service_date),
    maxServiceDate: s(r.max_service_date),
    minBatchUploadedAt: s(r.min_batch_uploaded_at),
    maxBatchUploadedAt: s(r.max_batch_uploaded_at),
  };
}

export async function fetchCanonicalReportTotals(
  filter: CanonicalReportFilter = {},
): Promise<CanonicalReportTotals> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("canonical_report_totals", {
    _start: filter.start ?? null,
    _end: filter.end ?? null,
    _search: filter.search ?? null,
  });
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  return mapTotals(rows[0] ?? null);
}

/* -------- per-client (Supervision + PT) -------- */

export type SupervisionStatus =
  | "Meets Threshold"
  | "Low Supervision"
  | "Critical Low Supervision"
  | "Missing Supervision"
  | "Review Data";

export type ParentTrainingStatus = "Completed" | "Missing Parent Training";

export interface CanonicalReportClientRow {
  crClientId: string | null;
  clientName: string | null;
  h97153: number;
  h97155: number;
  h97156: number;
  totalHours: number;
  rowCount: number;
  distinctProviders: number;
  primaryProvider: string | null;
  primaryProviderId: string | null;
  minServiceDate: string | null;
  maxServiceDate: string | null;
  supervisionPct: number;
  supervisionStatus: SupervisionStatus;
  parentTrainingStatus: ParentTrainingStatus;
}

export function deriveSupervisionStatus(h97153: number, h97155: number): {
  pct: number;
  status: SupervisionStatus;
} {
  if (h97153 <= 0 && h97155 > 0) return { pct: 0, status: "Review Data" };
  if (h97153 > 0 && h97155 <= 0) return { pct: 0, status: "Missing Supervision" };
  if (h97153 <= 0 && h97155 <= 0) return { pct: 0, status: "Review Data" };
  const pct = h97155 / h97153;
  if (pct < 0.05) return { pct, status: "Critical Low Supervision" };
  if (pct < 0.1) return { pct, status: "Low Supervision" };
  return { pct, status: "Meets Threshold" };
}

export function deriveParentTrainingStatus(h97156: number): ParentTrainingStatus {
  return h97156 > 0 ? "Completed" : "Missing Parent Training";
}

export function mapClientRow(r: Record<string, unknown>): CanonicalReportClientRow {
  const h97153 = n(r.h97153);
  const h97155 = n(r.h97155);
  const h97156 = n(r.h97156);
  const sup = deriveSupervisionStatus(h97153, h97155);
  return {
    crClientId: s(r.cr_client_id),
    clientName: s(r.client_name),
    h97153,
    h97155,
    h97156,
    totalHours: n(r.total_hours),
    rowCount: n(r.row_count),
    distinctProviders: n(r.distinct_providers),
    primaryProvider: s(r.primary_provider),
    primaryProviderId: s(r.primary_provider_id),
    minServiceDate: s(r.min_service_date),
    maxServiceDate: s(r.max_service_date),
    supervisionPct: sup.pct,
    supervisionStatus: sup.status,
    parentTrainingStatus: deriveParentTrainingStatus(h97156),
  };
}

export interface CanonicalClientPage {
  rows: CanonicalReportClientRow[];
  totalCount: number;
}

export async function fetchCanonicalReportClientHours(
  filter: CanonicalReportFilter & { limit?: number; offset?: number } = {},
): Promise<CanonicalClientPage> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("canonical_report_client_hours", {
    _start: filter.start ?? null,
    _end: filter.end ?? null,
    _search: filter.search ?? null,
    _limit: filter.limit ?? 500,
    _offset: filter.offset ?? 0,
  });
  if (error) throw error;
  const raw = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  return {
    rows: raw.map(mapClientRow),
    totalCount: raw[0] ? n(raw[0].total_count) : 0,
  };
}

/* -------- per-provider (Productivity) -------- */

export interface CanonicalReportProviderRow {
  crProviderId: string | null;
  providerName: string | null;
  providerEmployeeId: string | null;
  providerAuthUserId: string | null;
  mappingStatus: string | null;
  isMapped: boolean;
  directHours: number;
  supervisionHours: number;
  parentTrainingHours: number;
  assessmentHours: number;
  adminHours: number;
  totalHours: number;
  totalUnits: number;
  rowCount: number;
  distinctClients: number;
  minServiceDate: string | null;
  maxServiceDate: string | null;
}

export function mapProviderRow(r: Record<string, unknown>): CanonicalReportProviderRow {
  const status = s(r.mapping_status);
  return {
    crProviderId: s(r.cr_provider_id),
    providerName: s(r.provider_name),
    providerEmployeeId: s(r.provider_employee_id),
    providerAuthUserId: s(r.provider_auth_user_id),
    mappingStatus: status,
    isMapped: status === "mapped",
    directHours: n(r.direct_hours),
    supervisionHours: n(r.supervision_hours),
    parentTrainingHours: n(r.parent_training_hours),
    assessmentHours: n(r.assessment_hours),
    adminHours: n(r.admin_hours),
    totalHours: n(r.total_hours),
    totalUnits: n(r.total_units),
    rowCount: n(r.row_count),
    distinctClients: n(r.distinct_clients),
    minServiceDate: s(r.min_service_date),
    maxServiceDate: s(r.max_service_date),
  };
}

export interface CanonicalProviderPage {
  rows: CanonicalReportProviderRow[];
  totalCount: number;
}

export async function fetchCanonicalReportProviderHours(
  filter: CanonicalReportFilter & {
    includeUnmapped?: boolean;
    limit?: number;
    offset?: number;
  } = {},
): Promise<CanonicalProviderPage> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("canonical_report_provider_hours", {
    _start: filter.start ?? null,
    _end: filter.end ?? null,
    _search: filter.search ?? null,
    _include_unmapped: filter.includeUnmapped ?? true,
    _limit: filter.limit ?? 500,
    _offset: filter.offset ?? 0,
  });
  if (error) throw error;
  const raw = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  return {
    rows: raw.map(mapProviderRow),
    totalCount: raw[0] ? n(raw[0].total_count) : 0,
  };
}

/* -------- paged detail rows (drilldown + export) -------- */

export interface CanonicalReportBillingRow {
  rowId: string;
  batchId: string | null;
  sourceFileName: string | null;
  batchUploadedAt: string | null;
  serviceDate: string | null;
  crClientId: string | null;
  clientName: string | null;
  crProviderId: string | null;
  providerName: string | null;
  providerEmployeeId: string | null;
  providerAuthUserId: string | null;
  providerMappingStatus: string | null;
  procedureCode: string | null;
  procedureCodeRoot: string | null;
  sessionKind: CanonicalSessionKind;
  hours: number;
  units: number;
}

function toKind(v: unknown): CanonicalSessionKind {
  const k = String(v ?? "other");
  return (
    k === "direct" ||
      k === "supervision" ||
      k === "parent_training" ||
      k === "assessment" ||
      k === "cancellation" ||
      k === "admin"
      ? (k as CanonicalSessionKind)
      : "other"
  );
}

export function mapBillingRow(r: Record<string, unknown>): CanonicalReportBillingRow {
  return {
    rowId: String(r.row_id ?? ""),
    batchId: s(r.batch_id),
    sourceFileName: s(r.source_file_name),
    batchUploadedAt: s(r.batch_uploaded_at),
    serviceDate: s(r.service_date),
    crClientId: s(r.cr_client_id),
    clientName: s(r.client_name),
    crProviderId: s(r.cr_provider_id),
    providerName: s(r.provider_name),
    providerEmployeeId: s(r.provider_employee_id),
    providerAuthUserId: s(r.provider_auth_user_id),
    providerMappingStatus: s(r.provider_mapping_status),
    procedureCode: s(r.procedure_code),
    procedureCodeRoot: s(r.procedure_code_root),
    sessionKind: toKind(r.session_kind),
    hours: n(r.hours),
    units: n(r.units),
  };
}

export interface CanonicalBillingPage {
  rows: CanonicalReportBillingRow[];
  totalCount: number;
}

export interface CanonicalBillingRowFilter extends CanonicalReportFilter {
  clientId?: string | null;
  providerId?: string | null;
  kinds?: CanonicalSessionKind[] | null;
  codes?: string[] | null;
  limit?: number;
  offset?: number;
}

export async function fetchCanonicalReportBillingRows(
  filter: CanonicalBillingRowFilter = {},
): Promise<CanonicalBillingPage> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("canonical_report_billing_rows", {
    _start: filter.start ?? null,
    _end: filter.end ?? null,
    _search: filter.search ?? null,
    _client_id: filter.clientId ?? null,
    _provider_id: filter.providerId ?? null,
    _kinds: filter.kinds && filter.kinds.length ? filter.kinds : null,
    _codes: filter.codes && filter.codes.length ? filter.codes : null,
    _limit: filter.limit ?? 1000,
    _offset: filter.offset ?? 0,
  });
  if (error) throw error;
  const raw = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  return {
    rows: raw.map(mapBillingRow),
    totalCount: raw[0] ? n(raw[0].total_count) : 0,
  };
}

/**
 * Fetches all detail rows for a filter by paging through the RPC.
 * Guarded by a hard row cap so a runaway filter can never lock the tab.
 */
export async function fetchAllCanonicalReportBillingRows(
  filter: CanonicalBillingRowFilter,
  opts: {
    pageSize?: number;
    hardCap?: number;
    onProgress?: (loaded: number, total: number) => void;
  } = {},
): Promise<CanonicalReportBillingRow[]> {
  const pageSize = opts.pageSize ?? 2000;
  const hardCap = opts.hardCap ?? 60000;
  const out: CanonicalReportBillingRow[] = [];
  let offset = 0;
  let total = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const page = await fetchCanonicalReportBillingRows({
      ...filter,
      limit: pageSize,
      offset,
    });
    // The RPC only returns total_count on the first page (offset=0) to keep
    // subsequent pages fast. Preserve the initial total across iterations —
    // overwriting it with 0 on later pages would trip the stop condition
    // below and truncate the dataset.
    if (offset === 0) total = page.totalCount;
    if (!page.rows.length) break;
    out.push(...page.rows);
    opts.onProgress?.(out.length, total);
    if (page.rows.length < pageSize) break;
    if (total > 0 && out.length >= total) break;
    if (out.length >= hardCap) break;
    offset += pageSize;
  }
  return dedupeBillingRows(out);
}

/**
 * Deterministic dedupe on (service_date, client, provider, code, hours),
 * keeping the newest batch. Mirrors the RPC contract for defensive
 * client-side use across pages.
 */
export function dedupeBillingRows<T extends CanonicalReportBillingRow>(rows: T[]): T[] {
  const best = new Map<string, T>();
  for (const r of rows) {
    const k = [
      r.serviceDate ?? "",
      r.crClientId ?? "",
      r.crProviderId ?? "",
      r.procedureCode ?? "",
      Number.isFinite(r.hours) ? r.hours.toFixed(4) : "0",
    ].join("|");
    const prev = best.get(k);
    if (!prev) {
      best.set(k, r);
      continue;
    }
    const a = Date.parse(prev.batchUploadedAt ?? "") || 0;
    const b = Date.parse(r.batchUploadedAt ?? "") || 0;
    if (b > a || (b === a && r.rowId > prev.rowId)) best.set(k, r);
  }
  return Array.from(best.values());
}

/* -------- source-state helpers -------- */

export type CanonicalSourceState =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "ready"; totals: CanonicalReportTotals; ageDays: number | null }
  | { kind: "stale"; totals: CanonicalReportTotals; ageDays: number }
  | { kind: "error"; message: string };

/** > 30d since the newest batch → stale. */
export function deriveSourceState(
  totals: CanonicalReportTotals | null,
  now = new Date(),
): CanonicalSourceState {
  if (!totals || totals.totalRows === 0) return { kind: "missing" };
  const uploadedAt = totals.maxBatchUploadedAt ? Date.parse(totals.maxBatchUploadedAt) : NaN;
  const ageDays = Number.isFinite(uploadedAt)
    ? Math.floor((now.getTime() - uploadedAt) / 86_400_000)
    : null;
  if (ageDays !== null && ageDays > 30) return { kind: "stale", totals, ageDays };
  return { kind: "ready", totals, ageDays };
}

/* -------- V3 compatibility bridge --------
 * BcbaProductivityReportV3 assumes a `BcbaSharedBillingRow`-shaped row set
 * (see `@/lib/os/bcbaProductivityV3/adminUploadStore`). Convert canonical
 * billing rows to that shape so the existing report can consume the RPC
 * without a rewrite. The canonical view does NOT carry state/payor columns;
 * those degrade to empty strings and the state/payor filters silently collapse
 * to "All" until the ingest pipeline enriches them. Provider labels are
 * reconstructed from canonical session kind so the legacy V3 ownership engine
 * can still infer BCBA owners from non-97153 clinical rows. */

export interface BcbaSharedBillingRowLike {
  clientId: string;
  clientName: string;
  rbt: string;
  renderingProvider: string;
  providerLabels: string;
  code: string;
  hours: number;
  date: string;
  state: string;
  payor: string;
}

export function toBcbaSharedShape(r: CanonicalReportBillingRow): BcbaSharedBillingRowLike {
  const code = r.procedureCode ?? "";
  const provider = r.providerName ?? "";
  const is97153 = /^97153\b/.test(code) || code.startsWith("97153");
  const providerLabels = !is97153 && provider ? "BCBA" : "";
  return {
    clientId: r.crClientId ?? "",
    clientName: r.clientName ?? "",
    rbt: is97153 ? provider : "",
    renderingProvider: provider,
    providerLabels,
    code,
    hours: r.hours,
    date: r.serviceDate ?? "",
    state: "",
    payor: "",
  };
}

export async function fetchBcbaBillingRowsAsSharedShape(
  filter: CanonicalReportFilter & { pageSize?: number; hardCap?: number;
    onProgress?: (loaded: number, total: number) => void },
): Promise<BcbaSharedBillingRowLike[]> {
  const rows = await fetchAllCanonicalReportBillingRows(
    { start: filter.start ?? null, end: filter.end ?? null, search: filter.search ?? null },
    { pageSize: filter.pageSize, hardCap: filter.hardCap, onProgress: filter.onProgress },
  );
  return rows.map(toBcbaSharedShape);
}