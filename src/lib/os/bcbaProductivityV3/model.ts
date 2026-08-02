/**
 * BCBA Productivity V3 — pure calculation model.
 *
 * This module is the single calculation surface the report page consumes. It
 * is deliberately free of React, Supabase and DOM access so the locked
 * product rules can be tested directly:
 *
 *  - CentralReach Data Hub billing rows are the only source of hours.
 *  - Ownership is inferred month-first from BCBA anchor rows. A BCBA anchor is
 *    a row whose raw code does NOT start with 97153, whose
 *    ProviderContactLabels contain "BCBA", and which has a rendering provider.
 *    Client contact labels (current or historical) are never used.
 *  - 97153 (RBT direct) hours are credited to the BCBA owning the client on
 *    the date of service.
 *  - Supervision hours are normalized 97155 hours; supervision % is
 *    97155 / 97153 * 100 and is null (rendered as a dash) when 97153 is 0.
 *    < 5% urgent, 5–9.9% monitor, >= 10% healthy.
 */
import {
  CODE_97153,
  CODE_97155,
  UNASSIGNED_LABEL,
  aggregate,
  buildOwnership,
  hasBcbaLabel,
  normalizeProcedureCode,
  supervisionPercent,
  type BcbaSummaryRow,
  type ClientSummaryRow,
  type CodeBreakdownRow,
  type EngineBillingRow,
  type OwnedBillingRow,
  type OwnershipConflictRow,
  type OwnershipGapRow,
  type OwnershipResult,
  type OwnershipSegment,
  type RbtSummaryRow,
} from "./engine";

export type { EngineBillingRow, OwnedBillingRow } from "./engine";

/** Code families reported by prefix. */
export const BCBA_CODE_FAMILIES = ["97151", "97152", "97153", "97155", "97156"] as const;
export const OTHER_CODE_LABEL = "Other";

/**
 * Normalize a raw CentralReach procedure code to its reporting family by
 * prefix ("97153 GT" -> "97153"). Unknown codes keep their trimmed raw value;
 * an empty code becomes "Other" so it is never dropped from a breakdown.
 */
export function normalizeBcbaCode(rawCode: string | null | undefined): string {
  const normalized = normalizeProcedureCode(rawCode);
  if (!normalized) return OTHER_CODE_LABEL;
  return normalized;
}

export type BcbaSupervisionStatus = "urgent" | "monitor" | "healthy" | "none";

/** < 5% urgent, 5–9.9% monitor, >= 10% healthy, null -> none (dash). */
export function bcbaSupervisionStatus(pct: number | null): BcbaSupervisionStatus {
  if (pct === null || !Number.isFinite(pct)) return "none";
  if (pct < 5) return "urgent";
  if (pct < 10) return "monitor";
  return "healthy";
}

export function bcbaSupervisionPct(
  supervisionHours: number,
  direct97153Hours: number,
): number | null {
  return supervisionPercent(supervisionHours, direct97153Hours);
}

export interface BcbaProductivityKpis {
  rowCount: number;
  totalHours: number;
  hours97153: number;
  hours97155: number;
  supervisionHours: number;
  directBcbaHours: number;
  otherHours: number;
  supervisionPct: number | null;
  supervisionStatus: BcbaSupervisionStatus;
  activeBcbas: number;
  activeClients: number;
  activeRbts: number;
  assignedHours: number;
  unassignedHours: number;
  unassignedRowCount: number;
}

export interface BcbaSupervisionSummary {
  bcba: string;
  isUnassigned: boolean;
  supervisionHours: number;
  direct97153Hours: number;
  supervisionPct: number | null;
  status: BcbaSupervisionStatus;
  clientCount: number;
}

export interface BcbaOwnershipAudit {
  segments: OwnershipSegment[];
  conflicts: OwnershipConflictRow[];
  gaps: OwnershipGapRow[];
}

export interface BcbaUnassignedAudit {
  hours: number;
  rowCount: number;
  clients: { clientId: string; clientName: string; hours: number }[];
  rows: OwnedBillingRow[];
}

export interface BcbaProductivityModel {
  ownedRows: OwnedBillingRow[];
  kpis: BcbaProductivityKpis;
  bcbaSummaries: BcbaSummaryRow[];
  codeSummaries: CodeBreakdownRow[];
  clientSummaries: ClientSummaryRow[];
  rbtSummaries: RbtSummaryRow[];
  supervisionSummaries: BcbaSupervisionSummary[];
  ownershipAudit: BcbaOwnershipAudit;
  unassignedAudit: BcbaUnassignedAudit;
  monthlyTrend: { monthKey: string; hours97153: number; hours97155: number; other: number }[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Build the full model from already-owned rows (the report's filtered view).
 * The ownership audit comes from the unfiltered inference so segments,
 * conflicts and gaps stay explainable even under a narrow filter.
 */
export function buildBcbaProductivityModelFromOwnedRows(
  ownedRows: OwnedBillingRow[],
  ownership?: OwnershipResult,
): BcbaProductivityModel {
  const agg = aggregate(ownedRows);

  const supervisionSummaries: BcbaSupervisionSummary[] = agg.bcbaSummary.map((b) => ({
    bcba: b.bcba,
    isUnassigned: b.isUnassigned,
    supervisionHours: b.hours97155,
    direct97153Hours: b.hours97153,
    supervisionPct: b.supervisionPct,
    status: bcbaSupervisionStatus(b.supervisionPct),
    clientCount: b.clientCount,
  }));

  const unassignedRows = ownedRows.filter((r) => !r.owner);
  const byClient = new Map<string, { clientId: string; clientName: string; hours: number }>();
  for (const r of unassignedRows) {
    const entry = byClient.get(r.clientKey) ?? {
      clientId: r.clientId,
      clientName: r.clientName,
      hours: 0,
    };
    entry.hours = round2(entry.hours + (Number.isFinite(r.hours) ? r.hours : 0));
    if (!entry.clientId && r.clientId) entry.clientId = r.clientId;
    byClient.set(r.clientKey, entry);
  }

  const kpis: BcbaProductivityKpis = {
    rowCount: agg.rowCount,
    totalHours: agg.totalHours,
    hours97153: agg.hours97153,
    hours97155: agg.hours97155,
    supervisionHours: agg.hours97155,
    directBcbaHours: agg.directBcbaHours,
    otherHours: agg.otherHours,
    supervisionPct: agg.supervisionPct,
    supervisionStatus: bcbaSupervisionStatus(agg.supervisionPct),
    activeBcbas: agg.activeBcbas,
    activeClients: agg.activeClients,
    activeRbts: agg.activeRbts,
    assignedHours: round2(agg.totalHours - agg.unassignedHours),
    unassignedHours: agg.unassignedHours,
    unassignedRowCount: agg.unassignedRowCount,
  };

  return {
    ownedRows,
    kpis,
    bcbaSummaries: agg.bcbaSummary,
    codeSummaries: agg.codeBreakdown,
    clientSummaries: agg.clientSummary,
    rbtSummaries: agg.rbtSummary,
    supervisionSummaries,
    ownershipAudit: {
      segments: ownership?.segments ?? [],
      conflicts: ownership?.conflicts ?? [],
      gaps: ownership?.gaps ?? [],
    },
    unassignedAudit: {
      hours: agg.unassignedHours,
      rowCount: agg.unassignedRowCount,
      clients: [...byClient.values()].sort((a, b) => b.hours - a.hours),
      rows: unassignedRows,
    },
    monthlyTrend: agg.monthlyTrend,
  };
}

/**
 * Build ownership + the full model straight from Data Hub billing rows.
 * This is the entry point used by tests and by any consumer that does not
 * need to keep the unfiltered ownership inference around.
 */
export function buildBcbaProductivityModel(
  rows: EngineBillingRow[],
): BcbaProductivityModel & { ownership: OwnershipResult } {
  const ownership = buildOwnership(rows);
  return {
    ...buildBcbaProductivityModelFromOwnedRows(ownership.rows, ownership),
    ownership,
  };
}

/** True when a row qualifies as a BCBA ownership anchor. */
export function isBcbaAnchorRow(row: {
  code?: string | null;
  providerLabels?: string | null;
  renderingProvider?: string | null;
}): boolean {
  const raw = String(row.code ?? "").trim();
  if (!raw || raw.startsWith(CODE_97153)) return false;
  if (!hasBcbaLabel(row.providerLabels)) return false;
  return !!String(row.renderingProvider ?? "").trim();
}

export { CODE_97153, CODE_97155, UNASSIGNED_LABEL };
