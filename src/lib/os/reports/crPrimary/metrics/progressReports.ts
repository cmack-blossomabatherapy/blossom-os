import { weekStart } from "../format";
import type { CrAuthorizationRow, CrBillingSessionRow } from "../types";
import {
  classifyAuthKind,
  classifyAuthStatus,
  classifyPauseReason,
} from "./authorizationAnalysis";
import { buildClientBcbaMap } from "./supervision";
import { isCountableStatus } from "./codes";

export interface ProgressReportRecord {
  client: string;
  bcba: string;
  payor: string;
  state: string;
  authorizationNumber: string;
  dueDate: string | null;
  status: "due" | "submitted" | "approved" | "denied" | "overdue" | "missing" | "paused";
  daysLate: number | null;
  pauseReason: string | null;
  weekStart: string | null;
  sourceStatus: string;
}

export interface ProgressReportMetrics {
  due: number;
  submitted: number;
  approved: number;
  denied: number;
  overdue: number;
  missing: number;
  pausedDueToPr: number;
  avgDaysLate: number;
  records: ProgressReportRecord[];
  weekly: { label: string; value: number; secondary?: number }[];
  overdueByBcba: { name: string; value: number }[];
  overdueByState: { name: string; value: number }[];
  overdueByPayor: { name: string; value: number }[];
  denialReasons: { label: string; value: number }[];
}

function daysBetween(target: string | null, now: Date): number | null {
  if (!target) return null;
  const d = new Date(`${String(target).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((now.getTime() - d.getTime()) / 86_400_000);
}

/**
 * Progress-report / clinical-documentation state derived from CentralReach
 * authorization rows explicitly classified as progress-report work. Missing
 * status is only reported when the CentralReach row itself says the progress
 * report is missing; billing activity alone is not evidence of a missing PR.
 */
export function computeProgressReportMetrics(
  auths: CrAuthorizationRow[],
  sessions: CrBillingSessionRow[] = [],
  now = new Date(),
): ProgressReportMetrics {
  const clientToBcba = buildClientBcbaMap(sessions.filter((s) => isCountableStatus(s.status)));
  const records: ProgressReportRecord[] = [];
  let pausedDueToPr = 0;
  const lateDays: number[] = [];
  const denialReasons = new Map<string, number>();

  for (const a of auths) {
    if (classifyAuthKind(a) !== "progress_report") continue;
    const client = (a.client_name ?? "Unknown client").trim() || "Unknown client";
    const st = classifyAuthStatus(a);
    const due = a.end_date ?? a.start_date ?? null;
    const late = daysBetween(due, now);
    const pause = classifyPauseReason(a);
    if (pause === "late_or_missing_pr") pausedDueToPr += 1;

    let status: ProgressReportRecord["status"] = "due";
    const sourceText = `${a.status ?? ""} ${a.procedure_code ?? ""}`.toLowerCase();
    if (/\bmissing\b|no\s+(?:progress\s*report|pr)\s+(?:on\s+file|received)/.test(sourceText)) status = "missing";
    else if (st === "approved") status = "approved";
    else if (st === "denied") status = "denied";
    else if (st === "submitted") status = "submitted";
    else if (st === "paused") status = "paused";
    else if (late != null && late > 0) status = "overdue";

    if (status === "overdue" && late != null) lateDays.push(late);
    if (status === "denied") {
      const reason = (a.status ?? "Denied").trim();
      denialReasons.set(reason, (denialReasons.get(reason) ?? 0) + 1);
    }

    records.push({
      client,
      bcba: clientToBcba.get(client) ?? "Unassigned",
      payor: a.payor ?? "Unknown",
      state: a.state ?? "—",
      authorizationNumber: a.authorization_number ?? "—",
      dueDate: due,
      status,
      daysLate: status === "overdue" ? late : null,
      pauseReason: pause,
      weekStart: weekStart(due),
      sourceStatus: a.status ?? "—",
    });
  }

  const countBy = (
    predicate: (r: ProgressReportRecord) => boolean,
    key: (r: ProgressReportRecord) => string,
  ) => {
    const m = new Map<string, number>();
    for (const r of records) {
      if (!predicate(r)) continue;
      const k = key(r) || "Unknown";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const weeks = new Map<string, { total: number; overdue: number }>();
  for (const r of records) {
    if (!r.weekStart) continue;
    if (!weeks.has(r.weekStart)) weeks.set(r.weekStart, { total: 0, overdue: 0 });
    const w = weeks.get(r.weekStart)!;
    w.total += 1;
    if (r.status === "overdue") w.overdue += 1;
  }

  const isLate = (r: ProgressReportRecord) => r.status === "overdue" || r.status === "missing";

  return {
    due: records.filter((r) => r.status === "due").length,
    submitted: records.filter((r) => r.status === "submitted").length,
    approved: records.filter((r) => r.status === "approved").length,
    denied: records.filter((r) => r.status === "denied").length,
    overdue: records.filter((r) => r.status === "overdue").length,
    missing: records.filter((r) => r.status === "missing").length,
    pausedDueToPr,
    avgDaysLate: lateDays.length
      ? Math.round((lateDays.reduce((s, d) => s + d, 0) / lateDays.length) * 10) / 10
      : 0,
    records,
    weekly: [...weeks.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, v]) => ({ label, value: v.total, secondary: v.overdue })),
    overdueByBcba: countBy(isLate, (r) => r.bcba),
    overdueByState: countBy(isLate, (r) => r.state),
    overdueByPayor: countBy(isLate, (r) => r.payor),
    denialReasons: [...denialReasons.entries()].map(([label, value]) => ({ label, value })),
  };
}