/**
 * Phase 2B1 — BCBA Performance scorecard (staff-facing).
 *
 * Five dimensions, each scored independently from a source that can prove it:
 *   1. **Productivity**            — billable hours vs. the recorded target
 *                                    (`report_bcba_performance_targets`). No
 *                                    target row means "No target", never 0%.
 *   2. **Supervision ratio**       — 97155 ÷ 97153 against the 5% expectation.
 *   3. **Parent-training cadence** — share of the BCBA's clients with 97156
 *                                    delivered in the window.
 *   4. **Authorization readiness** — clients whose authorization is expiring or
 *                                    exhausted and needs action.
 *   5. **Documentation timeliness**— progress-report work due vs. overdue.
 *
 * The overall status is the **worst** dimension: a BCBA carrying an At Risk
 * dimension is never averaged up into "Strong". Any dimension that cannot be
 * computed is `insufficient_data` and is excluded from the average score while
 * still being reported honestly.
 *
 * Incentive eligibility is deliberately a **separate** panel, not part of the
 * status: performance support and compensation are different conversations.
 */

export type PerformanceStatus =
  | "strong"
  | "on_track"
  | "needs_attention"
  | "at_risk"
  | "insufficient_data";

export const PERFORMANCE_STATUS_LABELS: Record<PerformanceStatus, string> = {
  strong: "Strong",
  on_track: "On Track",
  needs_attention: "Needs Attention",
  at_risk: "At Risk",
  insufficient_data: "Insufficient Data",
};

/** Worst-first ordering. `insufficient_data` never masks a real problem. */
const SEVERITY: Record<PerformanceStatus, number> = {
  at_risk: 0,
  needs_attention: 1,
  insufficient_data: 2,
  on_track: 3,
  strong: 4,
};

export function worstStatus(statuses: PerformanceStatus[]): PerformanceStatus {
  if (!statuses.length) return "insufficient_data";
  return statuses.slice().sort((a, b) => SEVERITY[a] - SEVERITY[b])[0];
}

export type PerformanceDimensionKey =
  | "productivity"
  | "supervision"
  | "parent_training"
  | "authorization_readiness"
  | "documentation";

export const DIMENSION_LABELS: Record<PerformanceDimensionKey, string> = {
  productivity: "Productivity",
  supervision: "Supervision Ratio",
  parent_training: "Parent Training Cadence",
  authorization_readiness: "Authorization Readiness",
  documentation: "Documentation Timeliness",
};

export interface PerformanceDimension {
  key: PerformanceDimensionKey;
  label: string;
  status: PerformanceStatus;
  /** Primary display value, e.g. `92` for 92%. Null when not computable. */
  value: number | null;
  unit: "percent" | "hours" | "count";
  /** Target this dimension was judged against, when one exists. */
  target: number | null;
  detail: string;
}

export interface BcbaPerformanceInput {
  bcba: string;
  states: string[];
  clients: number;
  rbts: number;
  billableHours: number;
  directHours: number;
  supervisionHours: number;
  /** Recorded productivity target hours; null when no target row exists. */
  targetHours: number | null;
  forecastHours: number | null;
  clientsWithParentTraining: number;
  /** Authorizations needing action (expiring ≤30 days, exhausted, at risk). */
  authActionCount: number;
  progressReportsDue: number;
  progressReportsOverdue: number;
}

export interface BcbaPerformanceRow extends BcbaPerformanceInput {
  supervisionRatioPct: number | null;
  productivityPct: number | null;
  ptCadencePct: number | null;
  dimensions: PerformanceDimension[];
  status: PerformanceStatus;
  /** Mean of the computable dimension scores, 0–100. Null when none compute. */
  score: number | null;
  /** The dimension(s) that set the overall status. */
  drivers: string[];
}

export interface IncentiveRow {
  bcba: string;
  billableHours: number;
  targetHours: number | null;
  attainmentPct: number | null;
  /** Eligible only when a real target exists and is met with no At Risk gate. */
  eligible: boolean;
  blockedBy: string[];
  note: string;
}

export interface BcbaPerformanceAnalysis {
  rows: BcbaPerformanceRow[];
  incentives: IncentiveRow[];
  counts: Record<PerformanceStatus, number>;
  totalBillableHours: number;
  withoutTargets: number;
  avgScore: number | null;
}

export const SUPERVISION_TARGET_PCT = 5;
export const PT_CADENCE_TARGET_PCT = 80;
export const PRODUCTIVITY_TARGET_PCT = 100;

const round1 = (n: number) => Math.round(n * 10) / 10;
const pctOf = (num: number, den: number): number | null =>
  den > 0 ? Math.round((num / den) * 1000) / 10 : null;

/** Banded status for a "higher is better" percentage against a target. */
function bandAgainstTarget(value: number | null, target: number): PerformanceStatus {
  if (value == null) return "insufficient_data";
  const ratio = value / target;
  if (ratio >= 1) return "strong";
  if (ratio >= 0.9) return "on_track";
  if (ratio >= 0.7) return "needs_attention";
  return "at_risk";
}

/** 0–100 score for a dimension, capped so overachievement can't hide a gap. */
function dimensionScore(value: number | null, target: number): number | null {
  if (value == null || target <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

export function buildDimensions(input: BcbaPerformanceInput): PerformanceDimension[] {
  const productivityPct =
    input.targetHours != null && input.targetHours > 0
      ? pctOf(input.billableHours, input.targetHours)
      : null;
  const supervisionPct = pctOf(input.supervisionHours, input.directHours);
  const ptPct = pctOf(input.clientsWithParentTraining, input.clients);

  const authStatus: PerformanceStatus =
    input.clients === 0
      ? "insufficient_data"
      : input.authActionCount === 0
        ? "strong"
        : input.authActionCount <= 2
          ? "needs_attention"
          : "at_risk";

  const docStatus: PerformanceStatus =
    input.progressReportsDue === 0 && input.progressReportsOverdue === 0
      ? "strong"
      : input.progressReportsOverdue > 0
        ? "at_risk"
        : "needs_attention";

  return [
    {
      key: "productivity",
      label: DIMENSION_LABELS.productivity,
      status: bandAgainstTarget(productivityPct, PRODUCTIVITY_TARGET_PCT),
      value: productivityPct,
      unit: "percent",
      target: input.targetHours,
      detail:
        input.targetHours == null
          ? "No productivity target is recorded for this period, so attainment is not scored."
          : `${round1(input.billableHours)} of ${round1(input.targetHours)} target hours billed.`,
    },
    {
      key: "supervision",
      label: DIMENSION_LABELS.supervision,
      status:
        input.directHours <= 0
          ? "insufficient_data"
          : bandAgainstTarget(supervisionPct, SUPERVISION_TARGET_PCT),
      value: supervisionPct,
      unit: "percent",
      target: SUPERVISION_TARGET_PCT,
      detail:
        input.directHours <= 0
          ? "No 97153 direct hours, so a supervision ratio cannot be calculated."
          : `${supervisionPct}% of direct hours supervised (5% expected).`,
    },
    {
      key: "parent_training",
      label: DIMENSION_LABELS.parent_training,
      status: input.clients === 0 ? "insufficient_data" : bandAgainstTarget(ptPct, PT_CADENCE_TARGET_PCT),
      value: ptPct,
      unit: "percent",
      target: PT_CADENCE_TARGET_PCT,
      detail:
        input.clients === 0
          ? "No clients attributed in this window."
          : `${input.clientsWithParentTraining} of ${input.clients} clients received 97156.`,
    },
    {
      key: "authorization_readiness",
      label: DIMENSION_LABELS.authorization_readiness,
      status: authStatus,
      value: input.authActionCount,
      unit: "count",
      target: 0,
      detail:
        input.clients === 0
          ? "No clients attributed, so authorization readiness is not scored."
          : `${input.authActionCount} authorization(s) need action.`,
    },
    {
      key: "documentation",
      label: DIMENSION_LABELS.documentation,
      status: docStatus,
      value: input.progressReportsOverdue,
      unit: "count",
      target: 0,
      detail:
        input.progressReportsOverdue > 0
          ? `${input.progressReportsOverdue} progress report(s) overdue.`
          : input.progressReportsDue > 0
            ? `${input.progressReportsDue} progress report(s) due, none overdue.`
            : "No progress reports due in this window.",
    },
  ];
}

export function computeBcbaPerformanceAnalysis(
  inputs: BcbaPerformanceInput[],
): BcbaPerformanceAnalysis {
  const rows: BcbaPerformanceRow[] = inputs.map((input) => {
    const dimensions = buildDimensions(input);
    const status = worstStatus(dimensions.map((d) => d.status));
    const scores = [
      dimensionScore(dimensions[0].value, PRODUCTIVITY_TARGET_PCT),
      dimensionScore(dimensions[1].value, SUPERVISION_TARGET_PCT),
      dimensionScore(dimensions[2].value, PT_CADENCE_TARGET_PCT),
      input.clients === 0 ? null : Math.max(0, 100 - input.authActionCount * 20),
      Math.max(0, 100 - input.progressReportsOverdue * 25 - input.progressReportsDue * 5),
    ].filter((v): v is number => v != null);

    return {
      ...input,
      supervisionRatioPct: dimensions[1].value,
      productivityPct: dimensions[0].value,
      ptCadencePct: dimensions[2].value,
      dimensions,
      status,
      score: scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null,
      drivers: dimensions.filter((d) => d.status === status).map((d) => d.label),
    };
  });

  const incentives: IncentiveRow[] = rows.map((r) => {
    const attainment = r.productivityPct;
    const blockedBy: string[] = [];
    if (r.targetHours == null) blockedBy.push("No recorded productivity target");
    if (attainment != null && attainment < 100) blockedBy.push("Target hours not met");
    const gates = r.dimensions.filter((d) => d.status === "at_risk").map((d) => d.label);
    blockedBy.push(...gates.map((g) => `${g} is At Risk`));
    return {
      bcba: r.bcba,
      billableHours: round1(r.billableHours),
      targetHours: r.targetHours,
      attainmentPct: attainment,
      eligible: blockedBy.length === 0,
      blockedBy,
      note:
        blockedBy.length === 0
          ? "Target met with no At Risk dimensions."
          : blockedBy.join("; "),
    };
  });

  const counts: Record<PerformanceStatus, number> = {
    strong: 0,
    on_track: 0,
    needs_attention: 0,
    at_risk: 0,
    insufficient_data: 0,
  };
  for (const r of rows) counts[r.status] += 1;

  const scored = rows.map((r) => r.score).filter((v): v is number => v != null);

  rows.sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status] || b.billableHours - a.billableHours);

  return {
    rows,
    incentives: incentives.sort((a, b) => Number(b.eligible) - Number(a.eligible)),
    counts,
    totalBillableHours: round1(rows.reduce((s, r) => s + r.billableHours, 0)),
    withoutTargets: rows.filter((r) => r.targetHours == null).length,
    avgScore: scored.length ? Math.round(scored.reduce((s, v) => s + v, 0) / scored.length) : null,
  };
}
