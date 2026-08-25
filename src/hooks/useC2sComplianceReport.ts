/**
 * Loader for the staff-facing Commit to Submit Compliance report.
 *
 * Two scopes load in parallel and stay clearly separated for the whole page:
 * - GLOBAL proxy scope: `report_c2s_documentation_proxy` + the staff-safe
 *   `report_c2s_program_status`.
 * - RLS-LIMITED sensitive scope: the six operational C2S tables. Zero rows is a
 *   normal, expected outcome for most staff and never a global data error.
 *
 * The window defaults to the current calendar month. An invalid window is not
 * queried at all, so an impossible range can never render as valid data.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  C2S_EMPLOYEE_FALLBACK_NAME,
  fetchC2sCoachingRecords,
  fetchC2sDisputes,
  fetchC2sEmployeeNames,
  fetchC2sExceptions,
  fetchC2sNotices,
  fetchC2sProgramReviews,
  fetchC2sGovernanceCounts,
  fetchC2sProgramStatus,
  fetchC2sProxyRows,
  fetchC2sTrackerRecords,
  fetchIsC2sHrAuthority,
  fetchViewerEmployeeId,
  isValidDateWindow,
  C2S_EMPTY_GOVERNANCE_COUNTS,
  type C2sGovernanceCounts,
  type C2sDisputeRow,
  type C2sExceptionRow,
  type C2sNoticeRecord,
  type C2sProgramReviewRecord,
  type C2sProgramStatus,
} from "@/lib/os/reports/crPrimary/c2s/source";
import type {
  C2sCoachingRecord,
  C2sProxyRow,
  C2sTrackerRecord,
} from "@/lib/os/reports/crPrimary/metrics/commitToSubmit";
import type { FreshnessInfo } from "@/components/reports/crPrimary/PrimaryReportShell";

/** Proxy data older than this many days is called out as materially stale. */
export const C2S_STALE_AFTER_DAYS = 7;

export type C2sCoachingRow = C2sCoachingRecord & {
  topic: string | null;
  summary: string | null;
};

export interface C2sReportData {
  status: C2sProgramStatus;
  proxyRows: C2sProxyRow[];
  tracker: C2sTrackerRecord[];
  coaching: C2sCoachingRow[];
  notices: C2sNoticeRecord[];
  disputes: C2sDisputeRow[];
  exceptions: C2sExceptionRow[];
  reviews: C2sProgramReviewRecord[];
  employeeNames: Record<string, string>;
  viewerEmployeeId: string | null;
  isHrAuthority: boolean;
  /**
   * Aggregate governance counts from the staff-safe RPC. These are the ONLY
   * source for active formal records — never inferred from proxy rows.
   */
  governanceCounts: C2sGovernanceCounts;
  freshness: FreshnessInfo;
  /** Proxy freshness is unknown or materially old. */
  stale: boolean;
  loading: boolean;
  /** Global proxy scope produced no rows. */
  empty: boolean;
  /** Only a real global failure (proxy/status), never an RLS-empty result. */
  errorMessage: string | null;
  invalidWindow: boolean;
  refresh: () => void;
}

const EMPTY_FRESHNESS: FreshnessInfo = {
  latestUpload: null,
  coverageStart: null,
  coverageEnd: null,
  rowCount: 0,
  batchCount: 0,
  fileName: null,
};

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

/** Display name for a subject employee, with a safe non-leaking fallback. */
export function c2sDisplayName(
  names: Record<string, string>,
  employeeId: string | null | undefined,
): string {
  if (!employeeId) return C2S_EMPLOYEE_FALLBACK_NAME;
  return names[employeeId] ?? C2S_EMPLOYEE_FALLBACK_NAME;
}

export function useC2sComplianceReport(from: string, to: string): C2sReportData {
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<C2sProgramStatus>({
    configured: false,
    enabled: false,
    policyVersion: null,
    trackingStartDate: null,
    approvalsComplete: false,
    requiredValuesComplete: false,
    activationReady: false,
  });
  const [proxyRows, setProxyRows] = useState<C2sProxyRow[]>([]);
  const [tracker, setTracker] = useState<C2sTrackerRecord[]>([]);
  const [coaching, setCoaching] = useState<C2sCoachingRow[]>([]);
  const [notices, setNotices] = useState<C2sNoticeRecord[]>([]);
  const [disputes, setDisputes] = useState<C2sDisputeRow[]>([]);
  const [exceptions, setExceptions] = useState<C2sExceptionRow[]>([]);
  const [reviews, setReviews] = useState<C2sProgramReviewRecord[]>([]);
  const [employeeNames, setEmployeeNames] = useState<Record<string, string>>({});
  const [viewerEmployeeId, setViewerEmployeeId] = useState<string | null>(null);
  const [isHrAuthority, setIsHrAuthority] = useState(false);
  const [governanceCounts, setGovernanceCounts] = useState<C2sGovernanceCounts>(
    C2S_EMPTY_GOVERNANCE_COUNTS,
  );

  const invalidWindow = !isValidDateWindow(from, to);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [
        statusResult,
        proxyResult,
        trackerResult,
        coachingResult,
        noticeResult,
        disputeResult,
        exceptionResult,
        reviewResult,
        viewerId,
        hrAuthority,
        counts,
      ] = await Promise.all([
        fetchC2sProgramStatus(),
        fetchC2sProxyRows(from, to),
        fetchC2sTrackerRecords(),
        fetchC2sCoachingRecords(),
        fetchC2sNotices(),
        fetchC2sDisputes(),
        fetchC2sExceptions(),
        fetchC2sProgramReviews(),
        fetchViewerEmployeeId(),
        fetchIsC2sHrAuthority(),
        fetchC2sGovernanceCounts(),
      ]);
      if (cancelled) return;

      setStatus(statusResult.status);
      setProxyRows(invalidWindow ? [] : proxyResult.rows);
      setTracker(trackerResult.rows);
      setCoaching(coachingResult.rows);
      setNotices(noticeResult.rows);
      setDisputes(disputeResult.rows);
      setExceptions(exceptionResult.rows);
      setReviews(reviewResult.rows);
      setViewerEmployeeId(viewerId);
      setIsHrAuthority(hrAuthority);
      setGovernanceCounts(counts);
      // Only global-scope failures are page-level errors. An RLS-limited table
      // returning nothing is a normal outcome and must not blank the report.
      setErrorMessage(
        invalidWindow ? null : (proxyResult.error ?? statusResult.error ?? null),
      );

      const subjectIds = [
        ...trackerResult.rows.map((r) => r.subjectEmployeeId),
        ...coachingResult.rows.map((r) => r.subjectEmployeeId),
        ...noticeResult.rows.map((r) => r.subjectEmployeeId),
        ...disputeResult.rows.map((r) => r.subjectEmployeeId),
        ...exceptionResult.rows.map((r) => r.subjectEmployeeId),
        ...reviewResult.rows.map((r) => r.subjectEmployeeId),
      ];
      const names = await fetchC2sEmployeeNames(subjectIds);
      if (!cancelled) {
        setEmployeeNames(names);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [from, to, invalidWindow, tick]);

  const freshness = useMemo<FreshnessInfo>(() => {
    if (proxyRows.length === 0) return EMPTY_FRESHNESS;
    const seen = proxyRows.map((r) => r.lastSeenAt).filter(Boolean) as string[];
    const dates = proxyRows.map((r) => r.dateOfService).filter(Boolean) as string[];
    return {
      latestUpload: seen.length ? seen.reduce((a, b) => (a > b ? a : b)) : null,
      coverageStart: dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null,
      coverageEnd: dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null,
      rowCount: proxyRows.length,
      batchCount: 0,
      fileName: null,
    };
  }, [proxyRows]);

  const stale = useMemo(() => {
    if (invalidWindow) return false;
    const age = daysSince(freshness.latestUpload);
    return age === null || age > C2S_STALE_AFTER_DAYS;
  }, [freshness.latestUpload, invalidWindow]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  return {
    status,
    proxyRows,
    tracker,
    coaching,
    notices,
    disputes,
    exceptions,
    reviews,
    employeeNames,
    viewerEmployeeId,
    isHrAuthority,
    governanceCounts,
    freshness,
    stale,
    loading,
    empty: !invalidWindow && !loading && proxyRows.length === 0,
    errorMessage,
    invalidWindow,
    refresh,
  };
}
