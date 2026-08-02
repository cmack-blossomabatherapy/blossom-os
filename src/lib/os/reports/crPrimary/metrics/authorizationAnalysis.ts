import { weekStart } from "../format";
import type { CrAuthorizationRow } from "../types";
import { normalizeCode } from "./codes";

export type AuthWorkKind =
  | "initial_assessment"
  | "initial_treatment"
  | "reauthorization"
  | "progress_report"
  | "other";

export type AuthWorkStatus =
  | "submitted"
  | "approved"
  | "denied"
  | "pending"
  | "paused"
  | "expired"
  | "other";

/** Classify an authorization row into the weekly workflow bucket. */
export function classifyAuthKind(row: CrAuthorizationRow): AuthWorkKind {
  const code = normalizeCode(row.procedure_code);
  const text = `${row.status ?? ""} ${row.procedure_code ?? ""}`.toLowerCase();
  if (/progress\s*report|\bpr\b/.test(text)) return "progress_report";
  if (code === "97151" || /assessment|eval/.test(text)) return "initial_assessment";
  if (/re-?auth|\bra\b|renewal|concurrent/.test(text)) return "reauthorization";
  if (/initial/.test(text)) return "initial_treatment";
  if (code === "97153" || code === "97155" || code === "97156") return "initial_treatment";
  return "other";
}

export function classifyAuthStatus(row: CrAuthorizationRow): AuthWorkStatus {
  const s = (row.status ?? "").toLowerCase();
  if (/denied|reject/.test(s)) return "denied";
  if (/approved|authorized|active/.test(s)) return "approved";
  if (/paused|hold|stopped/.test(s)) return "paused";
  if (/submitted|sent/.test(s)) return "submitted";
  if (/pending|review|in progress/.test(s)) return "pending";
  if (/expired|closed|terminated/.test(s)) return "expired";
  return "other";
}

export type PauseReason = "no_reauthorization" | "late_or_missing_pr" | "other" | null;

export function classifyPauseReason(row: CrAuthorizationRow): PauseReason {
  if (classifyAuthStatus(row) !== "paused") return null;
  const s = (row.status ?? "").toLowerCase();
  if (/progress\s*report|\bpr\b|late/.test(s)) return "late_or_missing_pr";
  if (/re-?auth|\bra\b|renewal|no auth/.test(s)) return "no_reauthorization";
  return "other";
}

export interface AuthWeeklyMetrics {
  weekStart: string;
  initialAssessmentSubmitted: number;
  initialAssessmentApproved: number;
  initialAssessmentDenied: number;
  initialTreatmentSubmitted: number;
  initialTreatmentApproved: number;
  initialTreatmentDenied: number;
  raSubmitted: number;
  raApproved: number;
  raDenied: number;
  prSubmitted: number;
  prApproved: number;
  prDenied: number;
  pausedNoRa: number;
  pausedLatePr: number;
}

function blankWeek(week: string): AuthWeeklyMetrics {
  return {
    weekStart: week,
    initialAssessmentSubmitted: 0,
    initialAssessmentApproved: 0,
    initialAssessmentDenied: 0,
    initialTreatmentSubmitted: 0,
    initialTreatmentApproved: 0,
    initialTreatmentDenied: 0,
    raSubmitted: 0,
    raApproved: 0,
    raDenied: 0,
    prSubmitted: 0,
    prApproved: 0,
    prDenied: 0,
    pausedNoRa: 0,
    pausedLatePr: 0,
  };
}

const KIND_PREFIX: Record<Exclude<AuthWorkKind, "other">, string> = {
  initial_assessment: "initialAssessment",
  initial_treatment: "initialTreatment",
  reauthorization: "ra",
  progress_report: "pr",
};

/** Weekly authorization workflow counts. Approved/denied also count as submitted. */
export function computeAuthorizationWeekly(
  rows: CrAuthorizationRow[],
): AuthWeeklyMetrics[] {
  const weeks = new Map<string, AuthWeeklyMetrics>();
  for (const row of rows) {
    const wk = weekStart(row.start_date) ?? weekStart(row.end_date);
    if (!wk) continue;
    if (!weeks.has(wk)) weeks.set(wk, blankWeek(wk));
    const w = weeks.get(wk)!;
    const kind = classifyAuthKind(row);
    const status = classifyAuthStatus(row);

    if (kind !== "other") {
      const prefix = KIND_PREFIX[kind];
      const submittedKey = `${prefix}Submitted` as keyof AuthWeeklyMetrics;
      const approvedKey = `${prefix}Approved` as keyof AuthWeeklyMetrics;
      const deniedKey = `${prefix}Denied` as keyof AuthWeeklyMetrics;
      if (status === "approved") {
        (w[approvedKey] as number) += 1;
        (w[submittedKey] as number) += 1;
      } else if (status === "denied") {
        (w[deniedKey] as number) += 1;
        (w[submittedKey] as number) += 1;
      } else if (status === "submitted" || status === "pending") {
        (w[submittedKey] as number) += 1;
      }
    }

    const pause = classifyPauseReason(row);
    if (pause === "no_reauthorization") w.pausedNoRa += 1;
    if (pause === "late_or_missing_pr") w.pausedLatePr += 1;
  }
  return [...weeks.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export interface AuthAnalysisGroup {
  name: string;
  submitted: number;
  approved: number;
  denied: number;
  paused: number;
  approvalRate: number;
}

export interface AuthAnalysisMetrics {
  totalAuthorizations: number;
  submitted: number;
  approved: number;
  denied: number;
  paused: number;
  pausedNoRa: number;
  pausedLatePr: number;
  approvalRate: number;
  denialRate: number;
  weekly: AuthWeeklyMetrics[];
  byPayor: AuthAnalysisGroup[];
  byState: AuthAnalysisGroup[];
  byClient: AuthAnalysisGroup[];
  pauseReasons: { label: string; value: number }[];
}

export function computeAuthorizationAnalysis(
  rows: CrAuthorizationRow[],
): AuthAnalysisMetrics {
  const weekly = computeAuthorizationWeekly(rows);
  let submitted = 0;
  let approved = 0;
  let denied = 0;
  let paused = 0;
  let pausedNoRa = 0;
  let pausedLatePr = 0;
  let pausedOther = 0;

  const dims = {
    payor: new Map<string, AuthAnalysisGroup>(),
    state: new Map<string, AuthAnalysisGroup>(),
    client: new Map<string, AuthAnalysisGroup>(),
  };
  const ensure = (map: Map<string, AuthAnalysisGroup>, key: string) => {
    const k = (key || "Unknown").trim() || "Unknown";
    if (!map.has(k)) {
      map.set(k, { name: k, submitted: 0, approved: 0, denied: 0, paused: 0, approvalRate: 0 });
    }
    return map.get(k)!;
  };

  for (const row of rows) {
    const status = classifyAuthStatus(row);
    const groups = [
      ensure(dims.payor, row.payor ?? ""),
      ensure(dims.state, row.state ?? ""),
      ensure(dims.client, row.client_name ?? ""),
    ];
    if (status === "approved") {
      approved += 1;
      submitted += 1;
      groups.forEach((g) => {
        g.approved += 1;
        g.submitted += 1;
      });
    } else if (status === "denied") {
      denied += 1;
      submitted += 1;
      groups.forEach((g) => {
        g.denied += 1;
        g.submitted += 1;
      });
    } else if (status === "submitted" || status === "pending") {
      submitted += 1;
      groups.forEach((g) => {
        g.submitted += 1;
      });
    } else if (status === "paused") {
      paused += 1;
      groups.forEach((g) => {
        g.paused += 1;
      });
      const reason = classifyPauseReason(row);
      if (reason === "no_reauthorization") pausedNoRa += 1;
      else if (reason === "late_or_missing_pr") pausedLatePr += 1;
      else pausedOther += 1;
    }
  }

  const finish = (map: Map<string, AuthAnalysisGroup>) =>
    [...map.values()]
      .map((g) => ({
        ...g,
        approvalRate: g.submitted ? Math.round((g.approved / g.submitted) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.submitted - a.submitted);

  return {
    totalAuthorizations: rows.length,
    submitted,
    approved,
    denied,
    paused,
    pausedNoRa,
    pausedLatePr,
    approvalRate: submitted ? Math.round((approved / submitted) * 1000) / 10 : 0,
    denialRate: submitted ? Math.round((denied / submitted) * 1000) / 10 : 0,
    weekly,
    byPayor: finish(dims.payor),
    byState: finish(dims.state),
    byClient: finish(dims.client),
    pauseReasons: [
      { label: "No reauthorization on file", value: pausedNoRa },
      { label: "Late / missing progress report", value: pausedLatePr },
      { label: "Other pause reason", value: pausedOther },
    ].filter((r) => r.value > 0),
  };
}