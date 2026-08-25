/**
 * Claims Submission & Error Queue metrics.
 *
 * Source: the curated `v_cr_claims_status` snapshot.
 *
 * Deliberate boundaries:
 * - **No dollar values.** The CentralReach claims exports carry amount columns
 *   whose unit is unconfirmed (`amount_unit` is `unknown`), so this report never
 *   displays, sums, or estimates money. Suppression is a stated fact, not an
 *   omission.
 * - **No inferred workflow.** A claim is only "exported", "errored" or given a
 *   response status when the source row says so. A missing flag is
 *   "Not documented", never a zero and never a failure.
 * - Action age is measured only from a real, valid `action_date`.
 */

import type { CrClaimsStatusRow } from "../types";
import { validDay } from "./authorizationActions";
import { finiteNumberOrNull } from "./numeric";

export const CLAIMS_AMOUNT_SUPPRESSION_NOTE =
  "Claim dollar amounts are hidden: the CentralReach export does not confirm the unit of its amount columns, so no value or total can be stated honestly here.";

export const NOT_DOCUMENTED = "Not documented";

export interface ClaimsQueueRow {
  key: string;
  claimNumber: string;
  client: string;
  payor: string;
  state: string;
  dateOfService: string | null;
  procedureCode: string;
  status: string;
  responseStatus: string;
  actionDate: string | null;
  /** Whole days between the action date and today. Null when not documented. */
  actionAgeDays: number | null;
  actionBy: string;
  submitReason: string;
  errorCount: number | null;
  exportState: "Exported" | "Not exported" | typeof NOT_DOCUMENTED;
  hasErrors: boolean;
  followUpReason: string | null;
}

export interface ClaimsQueueBucket {
  key: string;
  name: string;
  claims: number;
  withErrors: number;
  notExported: number;
}

export interface ClaimsQueueMetrics {
  totalClaims: number;
  withErrors: number;
  totalErrors: number;
  notExported: number;
  exportStateNotDocumented: number;
  /** Claims with a documented response/status value. */
  withResponseStatus: number;
  responseMix: ClaimsQueueBucket[];
  payors: ClaimsQueueBucket[];
  submitReasons: ClaimsQueueBucket[];
  /** Average age in days of documented action dates. Null when none exist. */
  avgActionAgeDays: number | null;
  oldestActionAgeDays: number | null;
  actionDateNotDocumented: number;
  rows: ClaimsQueueRow[];
  followUpQueue: ClaimsQueueRow[];
  dataQualityWarnings: string[];
}

const text = (value: unknown, fallback = NOT_DOCUMENTED): string => {
  if (value == null) return fallback;
  const s = String(value).trim();
  return s ? s : fallback;
};

function ageDays(day: string, today: Date): number | null {
  const then = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(then)) return null;
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.floor((now - then) / 86_400_000);
}

function bucket(
  rows: ClaimsQueueRow[],
  pick: (row: ClaimsQueueRow) => string,
): ClaimsQueueBucket[] {
  const map = new Map<string, ClaimsQueueBucket>();
  for (const row of rows) {
    const name = pick(row);
    const key = name.toLowerCase();
    const entry =
      map.get(key) ?? { key, name, claims: 0, withErrors: 0, notExported: 0 };
    entry.claims += 1;
    if (row.hasErrors) entry.withErrors += 1;
    if (row.exportState === "Not exported") entry.notExported += 1;
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => b.claims - a.claims || a.name.localeCompare(b.name));
}

export function computeClaimsQueue(
  source: CrClaimsStatusRow[],
  options: { today?: Date } = {},
): ClaimsQueueMetrics {
  const today = options.today ?? new Date();

  const rows: ClaimsQueueRow[] = source.map((r, index) => {
    const errorCount = finiteNumberOrNull(r.error_count);
    const actionDate = validDay(r.action_date);
    const exportState: ClaimsQueueRow["exportState"] =
      r.exported == null ? NOT_DOCUMENTED : r.exported ? "Exported" : "Not exported";
    const hasErrors = (errorCount ?? 0) > 0;
    const responseStatus = text(r.responses_status ?? r.status);

    const followUpReason = hasErrors
      ? `${errorCount} claim error${errorCount === 1 ? "" : "s"} to clear`
      : exportState === "Not exported"
        ? "Not exported to the payor yet"
        : null;

    return {
      key: r.id ?? r.source_row_id ?? `claim-${index}`,
      claimNumber: text(r.claim_number),
      client: text(r.client_name),
      payor: text(r.payor),
      state: text(r.state),
      dateOfService: validDay(r.date_of_service),
      procedureCode: text(r.procedure_code),
      status: text(r.status),
      responseStatus,
      actionDate,
      actionAgeDays: actionDate ? ageDays(actionDate, today) : null,
      actionBy: text(r.action_by),
      submitReason: text(r.submit_reason),
      errorCount,
      exportState,
      hasErrors,
      followUpReason,
    };
  });

  const ages = rows
    .map((r) => r.actionAgeDays)
    .filter((n): n is number => n != null && n >= 0);

  const warnings: string[] = [CLAIMS_AMOUNT_SUPPRESSION_NOTE];
  const noActionDate = rows.filter((r) => r.actionDate == null).length;
  if (noActionDate > 0) {
    warnings.push(
      `${noActionDate} claim${noActionDate === 1 ? " has" : "s have"} no usable action date in the source, so their action age is shown as ${NOT_DOCUMENTED}.`,
    );
  }
  const noExportFlag = rows.filter((r) => r.exportState === NOT_DOCUMENTED).length;
  if (noExportFlag > 0) {
    warnings.push(
      `${noExportFlag} claim${noExportFlag === 1 ? " has" : "s have"} no export flag in the source and are not counted as unexported.`,
    );
  }
  const noErrorCount = rows.filter((r) => r.errorCount == null).length;
  if (noErrorCount > 0) {
    warnings.push(
      `${noErrorCount} claim${noErrorCount === 1 ? " has" : "s have"} no error count in the source and are not counted as clean or errored.`,
    );
  }

  return {
    totalClaims: rows.length,
    withErrors: rows.filter((r) => r.hasErrors).length,
    totalErrors: rows.reduce((sum, r) => sum + (r.errorCount ?? 0), 0),
    notExported: rows.filter((r) => r.exportState === "Not exported").length,
    exportStateNotDocumented: noExportFlag,
    withResponseStatus: rows.filter((r) => r.responseStatus !== NOT_DOCUMENTED).length,
    responseMix: bucket(rows, (r) => r.responseStatus),
    payors: bucket(rows, (r) => r.payor),
    submitReasons: bucket(rows, (r) => r.submitReason),
    avgActionAgeDays: ages.length
      ? Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10
      : null,
    oldestActionAgeDays: ages.length ? Math.max(...ages) : null,
    actionDateNotDocumented: noActionDate,
    rows,
    followUpQueue: rows
      .filter((r) => r.followUpReason != null)
      .sort((a, b) => (b.actionAgeDays ?? -1) - (a.actionAgeDays ?? -1)),
    dataQualityWarnings: warnings,
  };
}
