/**
 * Provider-level documentation readiness (CentralReach timesheet status).
 *
 * Truth rules:
 * - Informational only. Readiness NEVER creates or alters a formal violation,
 *   coaching record, notice, dispute, exception, or the date-of-service to
 *   billing-creation timeliness proxy. Nothing in this module returns or
 *   accepts a violation, severity, or category field.
 * - Aggregate only. The source RPC returns provider-level counts with no
 *   client identity, no hours, and no rate/amount/reference/note/check fields.
 * - Missing counts stay missing. A null count is reported as not documented
 *   rather than silently treated as zero.
 */
import type { CrTimesheetDocSummaryRow } from "../types";

export const DOCUMENTATION_READINESS_NOTE =
  "Documentation readiness is a source status signal only. Lock state, signatures and task completion never create a formal violation, coaching record, notice or dispute, and never change the date-of-service to billing-creation timeliness proxy.";

export interface DocumentationReadinessProviderRow {
  key: string;
  provider: string;
  locked: number | null;
  unlocked: number | null;
  missingProviderSignature: number | null;
  incompleteTasks: number | null;
  rowsTotal: number | null;
  latestDateOfService: string | null;
}

export interface DocumentationReadinessSummary {
  providers: DocumentationReadinessProviderRow[];
  locked: number;
  unlocked: number;
  missingProviderSignature: number;
  incompleteTasks: number;
  rowsTotal: number;
  latestDateOfService: string | null;
  /** Always true: this layer is never an input to any formal program step. */
  informationalOnly: true;
}

function countOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function summarizeDocumentationReadiness(
  rows: CrTimesheetDocSummaryRow[],
): DocumentationReadinessSummary {
  const providers: DocumentationReadinessProviderRow[] = rows.map((r) => ({
    key: r.provider_key || r.provider_name || "unknown",
    provider: r.provider_name?.trim() || "Unknown provider",
    locked: countOrNull(r.locked_rows),
    unlocked: countOrNull(r.unlocked_rows),
    missingProviderSignature: countOrNull(r.missing_provider_signature),
    incompleteTasks: countOrNull(r.incomplete_tasks),
    rowsTotal: countOrNull(r.rows_total),
    latestDateOfService: r.latest_date_of_service ?? null,
  }));

  const sum = (pick: (p: DocumentationReadinessProviderRow) => number | null) =>
    providers.reduce((acc, p) => acc + (pick(p) ?? 0), 0);

  const dates = providers
    .map((p) => p.latestDateOfService)
    .filter((d): d is string => Boolean(d))
    .sort();

  return {
    providers: providers.sort(
      (a, b) =>
        (b.unlocked ?? 0) + (b.missingProviderSignature ?? 0) + (b.incompleteTasks ?? 0) -
        ((a.unlocked ?? 0) + (a.missingProviderSignature ?? 0) + (a.incompleteTasks ?? 0)),
    ),
    locked: sum((p) => p.locked),
    unlocked: sum((p) => p.unlocked),
    missingProviderSignature: sum((p) => p.missingProviderSignature),
    incompleteTasks: sum((p) => p.incompleteTasks),
    rowsTotal: sum((p) => p.rowsTotal),
    latestDateOfService: dates.length ? dates[dates.length - 1] : null,
    informationalOnly: true,
  };
}
