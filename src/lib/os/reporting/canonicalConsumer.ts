/**
 * Canonical CentralReach consumer adapter.
 *
 * Thin, typed wrapper over the four RLS-safe reporting RPCs added in the
 * "canonical reporting foundation" migration:
 *
 *   canonical_sessions_provider_summary(_auth_user_id, _employee_id, _start, _end)
 *   canonical_sessions_client_summary  (_auth_user_id, _employee_id, _start, _end)
 *   canonical_sessions_rows            (_auth_user_id, _employee_id, _client_id, _kinds, _start, _end, _limit)
 *   canonical_sessions_unmapped_providers(_limit)
 *
 * All RPCs are read-only; write-back into CentralReach is intentionally not
 * supported here (import-only semantics).
 */
import { supabase } from "@/integrations/supabase/client";

export type CanonicalSessionKind =
  | "direct"
  | "supervision"
  | "parent_training"
  | "assessment"
  | "cancellation"
  | "admin"
  | "other";

export interface CanonicalScope {
  /** Reconciled auth user id for the provider (BCBA or RBT). */
  authUserId?: string | null;
  /** Reconciled employees.id for the provider. */
  employeeId?: string | null;
  /** Inclusive service_date window (yyyy-mm-dd). */
  start?: string | null;
  end?: string | null;
}

export interface CanonicalProviderSummaryRow {
  sessionKind: CanonicalSessionKind;
  hours: number;
  units: number;
  rowCount: number;
  distinctClients: number;
  minServiceDate: string | null;
  maxServiceDate: string | null;
}

export interface CanonicalClientSummaryRow {
  crClientId: string;
  clientName: string | null;
  sessionKind: CanonicalSessionKind;
  hours: number;
  units: number;
  rowCount: number;
  minServiceDate: string | null;
  maxServiceDate: string | null;
}

export interface CanonicalSessionRow {
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
  procedureCode: string | null;
  sessionKind: CanonicalSessionKind;
  hours: number;
  units: number;
}

export interface CanonicalUnmappedProvider {
  crProviderId: string;
  providerName: string | null;
  rowCount: number;
  distinctClients: number;
  minServiceDate: string | null;
  maxServiceDate: string | null;
}

/* ------------------------------------------------------------------------- */
/* Pure helpers — exported for tests                                          */
/* ------------------------------------------------------------------------- */

function n(v: unknown): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}
function s(v: unknown): string | null {
  return v == null || v === "" ? null : String(v);
}
function kind(v: unknown): CanonicalSessionKind {
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

/**
 * Deterministic session-level dedupe key.
 * Keeps only the newest row within (service_date, client, provider, procedure, hours).
 * Exported for tests — mirrors the DISTINCT ON logic in `canonical_sessions_rows`.
 */
export function sessionDedupeKey(r: {
  serviceDate: string | null;
  crClientId: string | null;
  crProviderId: string | null;
  procedureCode: string | null;
  hours: number;
}): string {
  return [
    r.serviceDate ?? "",
    r.crClientId ?? "",
    r.crProviderId ?? "",
    r.procedureCode ?? "",
    Number.isFinite(r.hours) ? r.hours.toFixed(4) : "0",
  ].join("|");
}

/**
 * Client-side dedupe backup: given raw canonical rows, keep the newest batch
 * per session key. Used when reading rows from a source other than the RPC
 * (e.g., in tests or when combining multiple pages of results).
 */
export function dedupeSessionRows<T extends CanonicalSessionRow>(rows: T[]): T[] {
  const best = new Map<string, T>();
  for (const r of rows) {
    const k = sessionDedupeKey(r);
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

/**
 * Precedence for "which source powers this surface":
 *   1. role-specific rows (existing table hits)
 *   2. canonical rows (v_cr_canonical_sessions via these RPCs)
 *   3. missing — actionable owner shown to user
 *
 * A scope with neither authUserId nor employeeId is treated as unmapped when a
 * clinician surface (BCBA/RBT) requests scoped data. Reports may pass an
 * empty scope for company-wide aggregates.
 */
export type CanonicalPrecedenceResult =
  | { source: "role"; reason: "role_has_rows" }
  | { source: "canonical"; reason: "canonical_has_rows" }
  | { source: "missing"; reason: "unmapped_provider" | "no_data" };

export function resolvePrecedence(input: {
  roleRowCount: number;
  canonicalRowCount: number;
  scope: CanonicalScope;
  requireScope: boolean;
}): CanonicalPrecedenceResult {
  if (input.roleRowCount > 0) return { source: "role", reason: "role_has_rows" };
  const mapped = !!(input.scope.authUserId || input.scope.employeeId);
  if (input.requireScope && !mapped) {
    return { source: "missing", reason: "unmapped_provider" };
  }
  if (input.canonicalRowCount > 0) return { source: "canonical", reason: "canonical_has_rows" };
  return { source: "missing", reason: "no_data" };
}

/* ------------------------------------------------------------------------- */
/* Fetchers                                                                   */
/* ------------------------------------------------------------------------- */

function scopeArgs(scope: CanonicalScope) {
  return {
    _auth_user_id: scope.authUserId ?? null,
    _employee_id: scope.employeeId ?? null,
    _start: scope.start ?? null,
    _end: scope.end ?? null,
  };
}

export async function fetchCanonicalProviderSummary(
  scope: CanonicalScope,
): Promise<CanonicalProviderSummaryRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc(
    "canonical_sessions_provider_summary",
    scopeArgs(scope),
  );
  if (error) throw error;
  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  return rows.map((r) => ({
    sessionKind: kind(r.session_kind),
    hours: n(r.hours),
    units: n(r.units),
    rowCount: n(r.row_count),
    distinctClients: n(r.distinct_clients),
    minServiceDate: s(r.min_service_date),
    maxServiceDate: s(r.max_service_date),
  }));
}

export async function fetchCanonicalClientSummary(
  scope: CanonicalScope,
): Promise<CanonicalClientSummaryRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc(
    "canonical_sessions_client_summary",
    scopeArgs(scope),
  );
  if (error) throw error;
  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  return rows.map((r) => ({
    crClientId: String(r.cr_client_id ?? ""),
    clientName: s(r.client_name),
    sessionKind: kind(r.session_kind),
    hours: n(r.hours),
    units: n(r.units),
    rowCount: n(r.row_count),
    minServiceDate: s(r.min_service_date),
    maxServiceDate: s(r.max_service_date),
  }));
}

export interface CanonicalRowFilter extends CanonicalScope {
  clientId?: string | null;
  kinds?: CanonicalSessionKind[] | null;
  limit?: number;
}

export async function fetchCanonicalSessionRows(
  filter: CanonicalRowFilter,
): Promise<CanonicalSessionRow[]> {
  const args = {
    ...scopeArgs(filter),
    _client_id: filter.clientId ?? null,
    _kinds: filter.kinds && filter.kinds.length ? filter.kinds : null,
    _limit: filter.limit ?? 500,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("canonical_sessions_rows", args);
  if (error) throw error;
  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  return rows.map((r) => ({
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
    procedureCode: s(r.procedure_code),
    sessionKind: kind(r.session_kind),
    hours: n(r.hours),
    units: n(r.units),
  }));
}

export async function fetchCanonicalUnmappedProviders(
  limit = 100,
): Promise<CanonicalUnmappedProvider[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc(
    "canonical_sessions_unmapped_providers",
    { _limit: limit },
  );
  if (error) throw error;
  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  return rows.map((r) => ({
    crProviderId: String(r.cr_provider_id ?? ""),
    providerName: s(r.provider_name),
    rowCount: n(r.row_count),
    distinctClients: n(r.distinct_clients),
    minServiceDate: s(r.min_service_date),
    maxServiceDate: s(r.max_service_date),
  }));
}

/**
 * Summarize provider-summary rows into the shape most surfaces need:
 * total direct/supervision/parent-training/cancellation hours and freshness.
 */
export interface CanonicalTotals {
  totalHours: number;
  directHours: number;
  supervisionHours: number;
  parentTrainingHours: number;
  assessmentHours: number;
  cancellationHours: number;
  adminHours: number;
  distinctClients: number;
  rowCount: number;
  minServiceDate: string | null;
  maxServiceDate: string | null;
}

export function summarizeProviderRows(rows: CanonicalProviderSummaryRow[]): CanonicalTotals {
  const t: CanonicalTotals = {
    totalHours: 0,
    directHours: 0,
    supervisionHours: 0,
    parentTrainingHours: 0,
    assessmentHours: 0,
    cancellationHours: 0,
    adminHours: 0,
    distinctClients: 0,
    rowCount: 0,
    minServiceDate: null,
    maxServiceDate: null,
  };
  const clientsSeen = new Set<number>(); // per-kind distinct — we just take max
  for (const r of rows) {
    t.totalHours += r.hours;
    t.rowCount += r.rowCount;
    clientsSeen.add(r.distinctClients);
    if (r.sessionKind === "direct") t.directHours += r.hours;
    else if (r.sessionKind === "supervision") t.supervisionHours += r.hours;
    else if (r.sessionKind === "parent_training") t.parentTrainingHours += r.hours;
    else if (r.sessionKind === "assessment") t.assessmentHours += r.hours;
    else if (r.sessionKind === "cancellation") t.cancellationHours += r.hours;
    else if (r.sessionKind === "admin") t.adminHours += r.hours;
    if (r.minServiceDate && (!t.minServiceDate || r.minServiceDate < t.minServiceDate)) {
      t.minServiceDate = r.minServiceDate;
    }
    if (r.maxServiceDate && (!t.maxServiceDate || r.maxServiceDate > t.maxServiceDate)) {
      t.maxServiceDate = r.maxServiceDate;
    }
  }
  // Distinct clients across kinds isn't strictly additive; the RPC counts per
  // kind. Take the max as a lower bound rather than double-count.
  t.distinctClients = Math.max(0, ...Array.from(clientsSeen));
  return t;
}