/**
 * Documentation Readiness (staff-facing primary report).
 *
 * Source: the curated, staff-safe `report_timesheet_documentation_summary()`
 * provider aggregate (`timesheetDocs` dataset). Provider-level ONLY — no
 * client identity, hours, rates, amounts, references, notes or check fields.
 *
 * Deliberate boundaries:
 * - **Operational readiness, not formal compliance.** This is a source status
 *   signal about lock state, signatures and task completion. It is never an
 *   input to Commit to Submit's documentation-timeliness proxy, and it never
 *   creates or alters a coaching record, formal violation, notice, dispute or
 *   exception.
 * - **Overlapping issue counts.** Unlocked rows, missing provider signature
 *   and incomplete tasks are independent, overlapping conditions on the same
 *   source rows. A row can carry more than one issue at once, so these counts
 *   must never be summed into a single "issues" total and a "ready" count
 *   must never be derived by subtracting them from rows total.
 * - **Missing stays missing.** A null count from the source is treated as not
 *   documented — never silently coerced to zero.
 */
import type { CrTimesheetDocSummaryRow } from "../types";
import { finiteNumberOrNull } from "./numeric";
import { pct } from "../format";

export const DOCUMENTATION_READINESS_NOTE =
  "Operational readiness only — not Commit to Submit formal compliance. Unlocked rows, missing provider signatures and incomplete tasks overlap on the same source rows, so they are never summed into one issue count and a 'ready' count is never derived by subtracting them.";

export interface DocumentationReadinessProviderRow {
  key: string;
  provider: string;
  rowsTotal: number | null;
  locked: number | null;
  unlocked: number | null;
  lockedRatePercent: number | null;
  missingProviderSignature: number | null;
  incompleteTasks: number | null;
  latestDateOfService: string | null;
  latestSeenAt: string | null;
  /** True when this provider has any actionable backlog worth surfacing. */
  needsAction: boolean;
}

export interface DocumentationReadinessSummary {
  providers: DocumentationReadinessProviderRow[];
  rowsTotal: number;
  locked: number;
  unlocked: number;
  lockedRatePercent: number | null;
  missingProviderSignature: number;
  incompleteTasks: number;
  providersNeedingAction: number;
  /** Always true: overlapping issue counts, never a subtraction-derived total. */
  overlappingIssueCounts: true;
}

/** A provider needs action when it has any unlocked, missing-signature or incomplete-task row. */
function providerNeedsAction(row: DocumentationReadinessProviderRow): boolean {
  return (row.unlocked ?? 0) > 0 || (row.missingProviderSignature ?? 0) > 0 || (row.incompleteTasks ?? 0) > 0;
}

export function summarizeDocumentationReadiness(
  rows: CrTimesheetDocSummaryRow[],
): DocumentationReadinessSummary {
  const providers: DocumentationReadinessProviderRow[] = rows.map((r) => {
    const rowsTotal = finiteNumberOrNull(r.rows_total);
    const locked = finiteNumberOrNull(r.locked_rows);
    const unlocked = finiteNumberOrNull(r.unlocked_rows);
    const missingProviderSignature = finiteNumberOrNull(r.missing_provider_signature);
    const incompleteTasks = finiteNumberOrNull(r.incomplete_tasks);
    const lockedRatePercent =
      locked != null && rowsTotal != null && rowsTotal > 0 ? pct(locked, rowsTotal) : null;

    const row: DocumentationReadinessProviderRow = {
      key: r.provider_key || r.provider_cr_id || r.provider_name || "unknown",
      provider: r.provider_name?.trim() || "Unknown provider",
      rowsTotal,
      locked,
      unlocked,
      lockedRatePercent,
      missingProviderSignature,
      incompleteTasks,
      latestDateOfService: r.latest_date_of_service ?? null,
      latestSeenAt: r.latest_seen_at ?? null,
      needsAction: false,
    };
    row.needsAction = providerNeedsAction(row);
    return row;
  });

  // Largest actionable backlog first: unlocked, then missing signature, then
  // incomplete tasks, then total rows as a stable tiebreaker.
  providers.sort((a, b) => {
    const backlogA = (a.unlocked ?? 0) + (a.missingProviderSignature ?? 0) + (a.incompleteTasks ?? 0);
    const backlogB = (b.unlocked ?? 0) + (b.missingProviderSignature ?? 0) + (b.incompleteTasks ?? 0);
    if (backlogB !== backlogA) return backlogB - backlogA;
    if ((b.unlocked ?? 0) !== (a.unlocked ?? 0)) return (b.unlocked ?? 0) - (a.unlocked ?? 0);
    return (b.rowsTotal ?? 0) - (a.rowsTotal ?? 0);
  });

  const sum = (pick: (p: DocumentationReadinessProviderRow) => number | null) =>
    providers.reduce((acc, p) => acc + (pick(p) ?? 0), 0);

  const rowsTotal = sum((p) => p.rowsTotal);
  const locked = sum((p) => p.locked);
  const unlocked = sum((p) => p.unlocked);

  return {
    providers,
    rowsTotal,
    locked,
    unlocked,
    lockedRatePercent: rowsTotal > 0 ? pct(locked, rowsTotal) : null,
    missingProviderSignature: sum((p) => p.missingProviderSignature),
    incompleteTasks: sum((p) => p.incompleteTasks),
    providersNeedingAction: providers.filter((p) => p.needsAction).length,
    overlappingIssueCounts: true,
  };
}
