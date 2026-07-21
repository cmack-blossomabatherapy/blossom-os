/**
 * Role-consumption bridge for the canonical CentralReach view.
 *
 * Turns `v_cr_canonical_sessions` output (via the RLS-safe RPCs) into
 * surface-shaped rows that BCBA and RBT pages can render when their
 * role-specific tables are empty. Precedence — enforced by callers — is:
 *
 *   1. role-specific rows (existing tables)
 *   2. canonical rows (returned by these helpers, tagged `source: "canonical"`)
 *   3. missing — surface renders an actionable owner
 *
 * Everything here is *derivation only*. We never fabricate fields the billing
 * export lacks (scheduled times, location, cancellation reason). Those are
 * exposed via `unavailableFromCanonical` on each result so surfaces can label
 * them clearly.
 */

import {
  fetchCanonicalClientSummary,
  fetchCanonicalProviderSummary,
  fetchCanonicalSessionRows,
  summarizeProviderRows,
  type CanonicalClientSummaryRow,
  type CanonicalScope,
  type CanonicalSessionKind,
  type CanonicalSessionRow,
} from "./canonicalConsumer";
import { CANONICAL_UNAVAILABLE_FIELDS } from "./canonicalFallback";

export type CanonicalOriginSource = "canonical";

export const CANONICAL_SOURCE_LABEL = "v_cr_canonical_sessions";

function requireMapped(scope: CanonicalScope): boolean {
  return !!(scope.authUserId || scope.employeeId);
}

/* -------------------------------------------------------------------------- */
/* BCBA caseload — derive distinct clients + per-client hours                 */
/* -------------------------------------------------------------------------- */

export interface CanonicalCaseloadClient {
  crClientId: string;
  clientName: string | null;
  directHours: number;
  supervisionHours: number;
  parentTrainingHours: number;
  totalHours: number;
  rowCount: number;
  minServiceDate: string | null;
  maxServiceDate: string | null;
  source: CanonicalOriginSource;
  unavailableFromCanonical: readonly string[];
}

/**
 * Group `canonical_sessions_client_summary` rows into one row per client with
 * per-kind hour breakdowns and a date range. The RPC already returns one row
 * per (client, session_kind) — we fold them here.
 */
export function aggregateClientSummaryRows(
  rows: CanonicalClientSummaryRow[],
): CanonicalCaseloadClient[] {
  const byClient = new Map<string, CanonicalCaseloadClient>();
  for (const r of rows) {
    const key = r.crClientId || `name:${(r.clientName ?? "").toLowerCase()}`;
    const bucket =
      byClient.get(key) ??
      ({
        crClientId: r.crClientId,
        clientName: r.clientName,
        directHours: 0,
        supervisionHours: 0,
        parentTrainingHours: 0,
        totalHours: 0,
        rowCount: 0,
        minServiceDate: null,
        maxServiceDate: null,
        source: "canonical",
        unavailableFromCanonical: CANONICAL_UNAVAILABLE_FIELDS,
      } as CanonicalCaseloadClient);
    bucket.totalHours += r.hours;
    bucket.rowCount += r.rowCount;
    if (r.sessionKind === "direct") bucket.directHours += r.hours;
    else if (r.sessionKind === "supervision") bucket.supervisionHours += r.hours;
    else if (r.sessionKind === "parent_training") bucket.parentTrainingHours += r.hours;
    if (r.minServiceDate && (!bucket.minServiceDate || r.minServiceDate < bucket.minServiceDate)) {
      bucket.minServiceDate = r.minServiceDate;
    }
    if (r.maxServiceDate && (!bucket.maxServiceDate || r.maxServiceDate > bucket.maxServiceDate)) {
      bucket.maxServiceDate = r.maxServiceDate;
    }
    byClient.set(key, bucket);
  }
  return Array.from(byClient.values()).sort((a, b) =>
    (a.clientName ?? a.crClientId).localeCompare(b.clientName ?? b.crClientId),
  );
}

/**
 * BCBA caseload derivation. Returns [] when the scope is unmapped or the
 * canonical view has nothing for this provider — never fabricates.
 */
export async function deriveCaseloadClientsFromCanonical(
  scope: CanonicalScope,
): Promise<CanonicalCaseloadClient[]> {
  if (!requireMapped(scope)) return [];
  try {
    const rows = await fetchCanonicalClientSummary(scope);
    return aggregateClientSummaryRows(rows);
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* BCBA parent-training derivation — one synthetic record per client with 97156 */
/* -------------------------------------------------------------------------- */

export interface CanonicalParentTrainingRecord {
  syntheticId: string;                   // stable id: "canon-pt-<crClientId>"
  crClientId: string;
  clientIdentifier: string;              // client name from export or CR id
  ptHours: number;
  ptRowCount: number;
  lastPtServiceDate: string | null;
  firstPtServiceDate: string | null;
  source: CanonicalOriginSource;
  unavailableFromCanonical: readonly string[];
}

export async function derivePtRecordsFromCanonical(
  scope: CanonicalScope,
): Promise<CanonicalParentTrainingRecord[]> {
  if (!requireMapped(scope)) return [];
  let rows: CanonicalClientSummaryRow[];
  try {
    rows = await fetchCanonicalClientSummary(scope);
  } catch {
    return [];
  }
  const byClient = new Map<string, CanonicalParentTrainingRecord>();
  for (const r of rows) {
    if (r.sessionKind !== "parent_training") continue;
    const cid = r.crClientId || `name:${(r.clientName ?? "").toLowerCase()}`;
    const bucket =
      byClient.get(cid) ??
      ({
        syntheticId: `canon-pt-${cid}`,
        crClientId: r.crClientId,
        clientIdentifier: r.clientName ?? r.crClientId,
        ptHours: 0,
        ptRowCount: 0,
        lastPtServiceDate: null,
        firstPtServiceDate: null,
        source: "canonical",
        unavailableFromCanonical: CANONICAL_UNAVAILABLE_FIELDS,
      } as CanonicalParentTrainingRecord);
    bucket.ptHours += r.hours;
    bucket.ptRowCount += r.rowCount;
    if (r.minServiceDate && (!bucket.firstPtServiceDate || r.minServiceDate < bucket.firstPtServiceDate)) {
      bucket.firstPtServiceDate = r.minServiceDate;
    }
    if (r.maxServiceDate && (!bucket.lastPtServiceDate || r.maxServiceDate > bucket.lastPtServiceDate)) {
      bucket.lastPtServiceDate = r.maxServiceDate;
    }
    byClient.set(cid, bucket);
  }
  return Array.from(byClient.values()).sort((a, b) =>
    a.clientIdentifier.localeCompare(b.clientIdentifier),
  );
}

/* -------------------------------------------------------------------------- */
/* BCBA supervision — per-RBT service hours + 97155 coverage per client       */
/* -------------------------------------------------------------------------- */

export interface CanonicalRbtServiceHours {
  employeeId: string;
  directHours: number;
  rowCount: number;
  minServiceDate: string | null;
  maxServiceDate: string | null;
  source: CanonicalOriginSource;
  unavailableFromCanonical: readonly string[];
}

/**
 * For every RBT employee id in `employeeIds`, compute canonical direct-service
 * hours in the window. Runs the provider-summary RPC once per RBT and returns
 * a map keyed by employee id. Callers use this only when `rbt_sessions` was
 * empty for that RBT.
 */
export async function deriveRbtServiceHoursMap(
  employeeIds: string[],
  window: { start?: string | null; end?: string | null } = {},
): Promise<Map<string, CanonicalRbtServiceHours>> {
  const out = new Map<string, CanonicalRbtServiceHours>();
  const unique = Array.from(new Set(employeeIds.filter(Boolean)));
  await Promise.all(
    unique.map(async (empId) => {
      try {
        const rows = await fetchCanonicalProviderSummary({
          employeeId: empId,
          start: window.start ?? null,
          end: window.end ?? null,
        });
        const totals = summarizeProviderRows(rows);
        if (totals.rowCount === 0) return;
        out.set(empId, {
          employeeId: empId,
          directHours: totals.directHours,
          rowCount: totals.rowCount,
          minServiceDate: totals.minServiceDate,
          maxServiceDate: totals.maxServiceDate,
          source: "canonical",
          unavailableFromCanonical: CANONICAL_UNAVAILABLE_FIELDS,
        });
      } catch {
        /* leave unset — the surface stays on its role-table empty state */
      }
    }),
  );
  return out;
}

/* -------------------------------------------------------------------------- */
/* RBT MyClients — distinct clients derived from the RBT's own canonical rows */
/* -------------------------------------------------------------------------- */

export interface CanonicalMyClient {
  crClientId: string;
  clientName: string | null;
  totalHours: number;
  directHours: number;
  supervisionHours: number;   // 97155 delivered by ANY provider on this client *while I was the provider*
  rowCount: number;
  firstServiceDate: string | null;
  lastServiceDate: string | null;
  source: CanonicalOriginSource;
  unavailableFromCanonical: readonly string[];
}

export async function deriveMyClientsFromCanonical(
  scope: CanonicalScope,
): Promise<CanonicalMyClient[]> {
  if (!requireMapped(scope)) return [];
  const clients = await deriveCaseloadClientsFromCanonical(scope);
  return clients.map((c) => ({
    crClientId: c.crClientId,
    clientName: c.clientName,
    totalHours: c.totalHours,
    directHours: c.directHours,
    supervisionHours: c.supervisionHours,
    rowCount: c.rowCount,
    firstServiceDate: c.minServiceDate,
    lastServiceDate: c.maxServiceDate,
    source: "canonical",
    unavailableFromCanonical: CANONICAL_UNAVAILABLE_FIELDS,
  }));
}

/* -------------------------------------------------------------------------- */
/* RBT schedule history — canonical rows labelled as delivered service history */
/* -------------------------------------------------------------------------- */

export interface CanonicalDeliveredServiceRow {
  rowId: string;
  serviceDate: string | null;
  clientName: string | null;
  crClientId: string | null;
  procedureCode: string | null;
  sessionKind: CanonicalSessionKind;
  hours: number;
  units: number;
  sourceFileName: string | null;
  batchUploadedAt: string | null;
  source: CanonicalOriginSource;
  /**
   * Always populated for callers — the billing export does not carry scheduled
   * times, location, or live status. Surfaces MUST label these unavailable.
   */
  unavailableFromCanonical: readonly string[];
  scheduledStartTime: null;
  scheduledEndTime: null;
  location: null;
  liveStatus: null;
}

export async function deriveDeliveredServiceRowsFromCanonical(
  scope: CanonicalScope,
  opts: { limit?: number } = {},
): Promise<CanonicalDeliveredServiceRow[]> {
  if (!requireMapped(scope)) return [];
  let rows: CanonicalSessionRow[];
  try {
    rows = await fetchCanonicalSessionRows({
      ...scope,
      limit: opts.limit ?? 200,
    });
  } catch {
    return [];
  }
  return rows.map((r) => ({
    rowId: r.rowId,
    serviceDate: r.serviceDate,
    clientName: r.clientName,
    crClientId: r.crClientId,
    procedureCode: r.procedureCode,
    sessionKind: r.sessionKind,
    hours: r.hours,
    units: r.units,
    sourceFileName: r.sourceFileName,
    batchUploadedAt: r.batchUploadedAt,
    source: "canonical",
    unavailableFromCanonical: CANONICAL_UNAVAILABLE_FIELDS,
    scheduledStartTime: null,
    scheduledEndTime: null,
    location: null,
    liveStatus: null,
  }));
}

/* -------------------------------------------------------------------------- */
/* RBT supervision coverage on my clients — 97155 hours per client, honestly  */
/* -------------------------------------------------------------------------- */

export interface CanonicalRbtSupervisionCoverage {
  crClientId: string;
  clientName: string | null;
  supervisionHoursOnClient: number;
  supervisionRowCount: number;
  firstDate: string | null;
  lastDate: string | null;
  source: CanonicalOriginSource;
  /**
   * These rows are NOT a one-to-one RBT observation — they only prove a BCBA
   * billed a 97155 code against the RBT's client(s). This label is mandatory
   * for consumers.
   */
  attribution: "client_level_coverage";
  unavailableFromCanonical: readonly string[];
}

/**
 * Given the RBT's own canonical client summary (their direct-service rows),
 * return the 97155 supervision hours the export associates with those same
 * clients. Because `canonical_sessions_client_summary` scopes to the passed
 * provider only, this returns the supervision the RBT themselves recorded on
 * the client — which is nearly always zero. When zero we surface an honest
 * "no direct-attributable supervision rows in this export" — never a
 * fabricated one-to-one BCBA→RBT link.
 */
export async function deriveRbtSupervisionCoverage(
  scope: CanonicalScope,
): Promise<CanonicalRbtSupervisionCoverage[]> {
  const clients = await deriveCaseloadClientsFromCanonical(scope);
  return clients
    .filter((c) => c.supervisionHours > 0)
    .map((c) => ({
      crClientId: c.crClientId,
      clientName: c.clientName,
      supervisionHoursOnClient: c.supervisionHours,
      supervisionRowCount: 0, // per-row 97155 count is not exposed by the summary RPC
      firstDate: c.minServiceDate,
      lastDate: c.maxServiceDate,
      source: "canonical",
      attribution: "client_level_coverage",
      unavailableFromCanonical: CANONICAL_UNAVAILABLE_FIELDS,
    }));
}

/* -------------------------------------------------------------------------- */
/* Cross-provider leakage guard — used by tests + hooks                       */
/* -------------------------------------------------------------------------- */

/**
 * Assert that every canonical row returned for a subject's scope belongs to
 * that subject (by employee_id or auth_user_id). Returns any leaked rows.
 * Hooks call this as a defense-in-depth check when combining scopes.
 */
export function assertNoCrossProviderLeakage(
  scope: CanonicalScope,
  rows: Pick<CanonicalSessionRow, "providerEmployeeId" | "providerAuthUserId">[],
): typeof rows {
  return rows.filter((r) => {
    const empOk = scope.employeeId ? r.providerEmployeeId === scope.employeeId : true;
    const authOk = scope.authUserId ? r.providerAuthUserId === scope.authUserId : true;
    return !(empOk && authOk);
  });
}

/* -------------------------------------------------------------------------- */
/* RBT worked-hours snapshot — synthesized from delivered canonical rows       */
/* -------------------------------------------------------------------------- */

export interface CanonicalDailyHours {
  direct: number;
  supervision: number;
  parent_training: number;
  assessment: number;
  cancellation: number;
  other: number;
}

export interface CanonicalHoursSnapshot {
  periodStart: string;
  periodEnd: string;
  /** Not carried by the billing export — always null; surfaces must label. */
  scheduledHours: null;
  completedHours: number;
  cancelledHours: number;
  importedHours: number;
  lastImportAt: string | null;
  source: CanonicalOriginSource;
  unavailableFromCanonical: readonly string[];
  byDate: Record<string, CanonicalDailyHours>;
  distinctClients: number;
  rowCount: number;
  windowLabel: "month_to_date";
}

function isoDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Derive an hours snapshot for the current calendar month from canonical
 * delivered-service rows. Returns null when the scope is unmapped or the
 * canonical view has nothing for the subject in the window — never fabricates.
 *
 * The billing export does NOT carry scheduled times or pay-period boundaries;
 * `scheduledHours` is always null and the window is labelled `month_to_date`
 * so surfaces do not misrepresent this as a payroll-accurate pay period.
 */
export async function deriveHoursSnapshotFromCanonical(
  scope: CanonicalScope,
  window?: { start?: string; end?: string },
): Promise<CanonicalHoursSnapshot | null> {
  if (!requireMapped(scope)) return null;
  const now = new Date();
  const start = window?.start ?? isoDateOnly(new Date(now.getFullYear(), now.getMonth(), 1));
  const end = window?.end ?? isoDateOnly(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  let rows: CanonicalSessionRow[];
  try {
    rows = await fetchCanonicalSessionRows({ ...scope, start, end, limit: 5000 });
  } catch {
    return null;
  }
  if (rows.length === 0) return null;
  const byDate: Record<string, CanonicalDailyHours> = {};
  const clients = new Set<string>();
  let completed = 0;
  let cancelled = 0;
  let lastImport = "";
  for (const r of rows) {
    const d = r.serviceDate ?? "unknown";
    const bucket =
      byDate[d] ??
      { direct: 0, supervision: 0, parent_training: 0, assessment: 0, cancellation: 0, other: 0 };
    if (r.sessionKind === "direct") bucket.direct += r.hours;
    else if (r.sessionKind === "supervision") bucket.supervision += r.hours;
    else if (r.sessionKind === "parent_training") bucket.parent_training += r.hours;
    else if (r.sessionKind === "assessment") bucket.assessment += r.hours;
    else if (r.sessionKind === "cancellation") bucket.cancellation += r.hours;
    else bucket.other += r.hours;
    if (r.sessionKind === "cancellation") cancelled += r.hours;
    else completed += r.hours;
    if (r.crClientId) clients.add(r.crClientId);
    if (r.batchUploadedAt && r.batchUploadedAt > lastImport) lastImport = r.batchUploadedAt;
    byDate[d] = bucket;
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    periodStart: start,
    periodEnd: end,
    scheduledHours: null,
    completedHours: round(completed),
    cancelledHours: round(cancelled),
    importedHours: round(completed),
    lastImportAt: lastImport || null,
    source: "canonical",
    unavailableFromCanonical: [
      ...CANONICAL_UNAVAILABLE_FIELDS,
      "scheduled_hours",
      "pay_period_boundaries",
    ],
    byDate,
    distinctClients: clients.size,
    rowCount: rows.length,
    windowLabel: "month_to_date",
  };
}

/* -------------------------------------------------------------------------- */
/* RBT performance totals — derived only, no attendance denominators           */
/* -------------------------------------------------------------------------- */

export interface CanonicalPerformanceTotals {
  totalHours: number;
  directHours: number;
  supervisionHours: number;
  parentTrainingHours: number;
  cancellationHours: number;
  distinctClients: number;
  rowCount: number;
  firstServiceDate: string | null;
  lastServiceDate: string | null;
  source: CanonicalOriginSource;
  /**
   * Attendance % and productivity-target % have no denominator in the billing
   * export (no scheduled sessions). Callers must render these as
   * "not available from CentralReach billing export".
   */
  unavailableFromCanonical: readonly string[];
}

export async function derivePerformanceTotalsFromCanonical(
  scope: CanonicalScope,
): Promise<CanonicalPerformanceTotals | null> {
  if (!requireMapped(scope)) return null;
  try {
    const rows = await fetchCanonicalProviderSummary(scope);
    if (rows.length === 0) return null;
    const t = summarizeProviderRows(rows);
    return {
      totalHours: t.totalHours,
      directHours: t.directHours,
      supervisionHours: t.supervisionHours,
      parentTrainingHours: t.parentTrainingHours,
      cancellationHours: t.cancellationHours,
      distinctClients: t.distinctClients,
      rowCount: t.rowCount,
      firstServiceDate: t.minServiceDate,
      lastServiceDate: t.maxServiceDate,
      source: "canonical",
      unavailableFromCanonical: [
        ...CANONICAL_UNAVAILABLE_FIELDS,
        "scheduled_sessions",
        "attendance_denominator",
        "productivity_target",
      ],
    };
  } catch {
    return null;
  }
}