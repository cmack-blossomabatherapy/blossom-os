/**
 * Loader for the primary CentralReach-backed reports.
 *
 * Each report declares which normalized datasets it needs; the hook loads them
 * in parallel, resolves the freshness indicator from `cr_import_batches`, and
 * exposes an exact `empty` flag so pages can render an honest empty state
 * instead of fabricated numbers.
 *
 * Phase 2A adds the curated Phase 1 sources:
 * - `scheduleCurrent` → `v_cr_schedule_current` (explicit cancellation truth)
 * - `authCurrent`     → `v_cr_authorization_current` (latest snapshot state)
 * - `authEvents`      → `report_authorization_events()` (logged lifecycle)
 *
 * The legacy `schedule` / `authorizations` datasets stay untouched for the
 * reports that still read the raw tables.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchCrAuthorizationCurrent,
  fetchCrAuthorizations,
  fetchCrBatches,
  fetchCrBillingSessions,
  fetchCrScheduleCurrent,
  fetchCrClaimsStatus,
  fetchCrEraReconciliation,
  fetchCrPaymentsCurrent,
  fetchCrScheduleEvents,
  fetchReportTimesheetDocumentationSummary,
  fetchCrUtilization,
  fetchReportAuthorizationActions,
  fetchReportAuthorizationEvents,
  fetchReportBcbaTargets,
  fetchReportBillingFacts,
  summarizeFreshness,
} from "@/lib/os/reports/crPrimary/source";
import type {
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
} from "@/lib/os/reports/crPrimary/types";
import type { FreshnessInfo } from "@/components/reports/crPrimary/PrimaryReportShell";

export type CrDataset =
  | "billing"
  | "schedule"
  | "authorizations"
  | "utilization"
  | "scheduleCurrent"
  | "authCurrent"
  | "authEvents"
  | "authActions"
  | "billingFacts"
  | "bcbaTargets"
  | "claimsStatus"
  | "payments"
  | "eraPayments"
  | "timesheetDocs";

const BATCH_TYPES: Record<CrDataset, string[]> = {
  billing: ["billing", "billing_sessions", "sessions"],
  schedule: ["schedule", "scheduling", "schedule_events"],
  authorizations: ["authorizations", "authorization"],
  utilization: ["utilization", "authorization_utilization"],
  scheduleCurrent: ["schedule", "scheduling", "schedule_events"],
  authCurrent: ["authorizations", "authorization"],
  authEvents: [],
  authActions: [],
  billingFacts: ["billing", "billing_sessions", "sessions"],
  bcbaTargets: [],
  claimsStatus: ["claims"],
  payments: ["payments"],
  eraPayments: ["era_payments"],
  timesheetDocs: ["timesheet", "timesheets"],
};

export interface CrPrimaryReportData {
  billing: CrBillingSessionRow[];
  schedule: CrScheduleEventRow[];
  authorizations: CrAuthorizationRow[];
  utilization: CrUtilizationRow[];
  scheduleCurrent: CrScheduleCurrentRow[];
  authCurrent: CrAuthorizationCurrentRow[];
  authEvents: ReportAuthorizationEventRow[];
  authActions: ReportAuthorizationActionRow[];
  billingFacts: ReportBillingFactRow[];
  /** Recorded BCBA productivity targets; absent rows mean "No target". */
  bcbaTargets: ReportBcbaTargetRow[];
  claimsStatus: CrClaimsStatusRow[];
  payments: CrPaymentCurrentRow[];
  eraPayments: CrEraReconciliationRow[];
  timesheetDocs: CrTimesheetDocSummaryRow[];
  batches: CrBatchSummary[];
  freshness: FreshnessInfo;
  loading: boolean;
  /** No source rows at all for the requested datasets. */
  empty: boolean;
  errorMessage: string | null;
  refresh: () => void;
}

const EMPTY_RESULT = { rows: [], error: null } as const;

/**
 * For current-snapshot datasets keep only the newest batch of each export
 * type, so coverage/freshness matches the single batch the current view
 * selects instead of summing every retained historical snapshot.
 */
function currentSnapshotBatches(
  batches: CrBatchSummary[],
  currentOnlyTypes: Set<string>,
): CrBatchSummary[] {
  if (!currentOnlyTypes.size) return batches;
  const seen = new Set<string>();
  const sorted = [...batches].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return sorted.filter((b) => {
    const type = (b.exportType ?? "").toLowerCase();
    if (!currentOnlyTypes.has(type)) return true;
    if (seen.has(type)) return false;
    seen.add(type);
    return true;
  });
}

/**
 * Optional selected date window. Reports that pass it get the window pushed to
 * the database before pagination, so a routine current-month view never pages
 * years of history. Omit it (or leave the bounds blank) for All Dates.
 */
export interface CrReportWindow {
  from?: string | null;
  to?: string | null;
}

/**
 * Datasets whose freshness must describe the ONE current snapshot batch the
 * report actually reads, not every retained historical batch of that type.
 */
const CURRENT_SNAPSHOT_DATASETS: CrDataset[] = ["claimsStatus"];

export function useCrPrimaryReport(
  datasets: CrDataset[],
  window?: CrReportWindow,
): CrPrimaryReportData {
  const key = datasets.slice().sort().join(",");
  const windowKey = `${window?.from ?? ""}|${window?.to ?? ""}`;
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [billing, setBilling] = useState<CrBillingSessionRow[]>([]);
  const [schedule, setSchedule] = useState<CrScheduleEventRow[]>([]);
  const [authorizations, setAuthorizations] = useState<CrAuthorizationRow[]>([]);
  const [utilization, setUtilization] = useState<CrUtilizationRow[]>([]);
  const [scheduleCurrent, setScheduleCurrent] = useState<CrScheduleCurrentRow[]>([]);
  const [authCurrent, setAuthCurrent] = useState<CrAuthorizationCurrentRow[]>([]);
  const [authEvents, setAuthEvents] = useState<ReportAuthorizationEventRow[]>([]);
  const [authActions, setAuthActions] = useState<ReportAuthorizationActionRow[]>([]);
  const [billingFacts, setBillingFacts] = useState<ReportBillingFactRow[]>([]);
  const [bcbaTargets, setBcbaTargets] = useState<ReportBcbaTargetRow[]>([]);
  const [claimsStatus, setClaimsStatus] = useState<CrClaimsStatusRow[]>([]);
  const [payments, setPayments] = useState<CrPaymentCurrentRow[]>([]);
  const [eraPayments, setEraPayments] = useState<CrEraReconciliationRow[]>([]);
  const [timesheetDocs, setTimesheetDocs] = useState<CrTimesheetDocSummaryRow[]>([]);
  const [batches, setBatches] = useState<CrBatchSummary[]>([]);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    const wanted = new Set(key.split(",").filter(Boolean) as CrDataset[]);

    (async () => {
      setLoading(true);
      const errors: string[] = [];
      const batchTypes = [...wanted].flatMap((d) => BATCH_TYPES[d]);
      const currentOnlyTypes = new Set(
        [...wanted]
          .filter((d) => CURRENT_SNAPSHOT_DATASETS.includes(d))
          .flatMap((d) => BATCH_TYPES[d]),
      );

      const [from, to] = windowKey.split("|");
      const win = from || to ? { from: from || null, to: to || null } : null;

      const [b, s, a, u, sc, ac, ae, aa, bf, bt, cs, pay, era, tsd, batchRes] = await Promise.all([
        wanted.has("billing") ? fetchCrBillingSessions(win) : Promise.resolve(EMPTY_RESULT),
        wanted.has("schedule") ? fetchCrScheduleEvents(win) : Promise.resolve(EMPTY_RESULT),
        wanted.has("authorizations") ? fetchCrAuthorizations() : Promise.resolve(EMPTY_RESULT),
        wanted.has("utilization") ? fetchCrUtilization() : Promise.resolve(EMPTY_RESULT),
        wanted.has("scheduleCurrent") ? fetchCrScheduleCurrent(win) : Promise.resolve(EMPTY_RESULT),
        wanted.has("authCurrent") ? fetchCrAuthorizationCurrent() : Promise.resolve(EMPTY_RESULT),
        wanted.has("authEvents")
          ? fetchReportAuthorizationEvents()
          : Promise.resolve(EMPTY_RESULT),
        wanted.has("authActions")
          ? fetchReportAuthorizationActions()
          : Promise.resolve(EMPTY_RESULT),
        wanted.has("billingFacts") ? fetchReportBillingFacts(win) : Promise.resolve(EMPTY_RESULT),
        wanted.has("bcbaTargets") ? fetchReportBcbaTargets() : Promise.resolve(EMPTY_RESULT),
        wanted.has("claimsStatus") ? fetchCrClaimsStatus(win) : Promise.resolve(EMPTY_RESULT),
        wanted.has("payments") ? fetchCrPaymentsCurrent() : Promise.resolve(EMPTY_RESULT),
        wanted.has("eraPayments") ? fetchCrEraReconciliation() : Promise.resolve(EMPTY_RESULT),
        wanted.has("timesheetDocs")
          ? fetchReportTimesheetDocumentationSummary()
          : Promise.resolve(EMPTY_RESULT),
        fetchCrBatches(batchTypes),
      ]);
      if (cancelled) return;

      for (const r of [b, s, a, u, sc, ac, ae, aa, bf, bt, cs, pay, era, tsd, batchRes]) {
        if (r.error) errors.push(r.error);
      }
      setBilling(b.rows as CrBillingSessionRow[]);
      setSchedule(s.rows as CrScheduleEventRow[]);
      setAuthorizations(a.rows as CrAuthorizationRow[]);
      setUtilization(u.rows as CrUtilizationRow[]);
      setScheduleCurrent(sc.rows as CrScheduleCurrentRow[]);
      setAuthCurrent(ac.rows as CrAuthorizationCurrentRow[]);
      setAuthEvents(ae.rows as ReportAuthorizationEventRow[]);
      setAuthActions(aa.rows as ReportAuthorizationActionRow[]);
      setBillingFacts(bf.rows as ReportBillingFactRow[]);
      setBcbaTargets(bt.rows as ReportBcbaTargetRow[]);
      setClaimsStatus(cs.rows as CrClaimsStatusRow[]);
      setPayments(pay.rows as CrPaymentCurrentRow[]);
      setEraPayments(era.rows as CrEraReconciliationRow[]);
      setTimesheetDocs(tsd.rows as CrTimesheetDocSummaryRow[]);
      setBatches(currentSnapshotBatches(batchRes.rows, currentOnlyTypes));
      setErrorMessage(errors.length ? errors[0] : null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [key, nonce, windowKey]);

  /**
   * Lifecycle events alone never make a report "non-empty" — an authorization
   * report with a snapshot but no logged events must still render its data.
   */
  const sourceRowCount =
    billing.length +
    schedule.length +
    authorizations.length +
    utilization.length +
    scheduleCurrent.length +
    authCurrent.length +
    billingFacts.length +
    claimsStatus.length +
    payments.length +
    eraPayments.length +
    timesheetDocs.length;

  const freshness = useMemo<FreshnessInfo>(() => {
    const summary = summarizeFreshness(batches);
    // Prefer the true loaded row count when batch metadata is incomplete.
    return { ...summary, rowCount: summary.rowCount || sourceRowCount };
  }, [batches, sourceRowCount]);

  return {
    billing,
    schedule,
    authorizations,
    utilization,
    scheduleCurrent,
    authCurrent,
    authEvents,
    authActions,
    billingFacts,
    bcbaTargets,
    claimsStatus,
    payments,
    eraPayments,
    timesheetDocs,
    batches,

    freshness,
    loading,
    empty: !loading && sourceRowCount === 0,
    errorMessage,
    refresh,
  };
}
