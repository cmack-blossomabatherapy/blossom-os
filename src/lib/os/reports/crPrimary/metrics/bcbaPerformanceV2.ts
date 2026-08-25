/**
 * Phase 2B1 repair B — BCBA Performance status table (staff-facing).
 *
 * **There is no composite score, average score, or ranking here — by design.**
 * A single number would hide which dimension is failing and invite a league
 * table; every dimension is reported on its own terms, with its numerator,
 * denominator or event basis, and the source (or explicitly labelled proxy)
 * that proves it.
 *
 * Five dimensions:
 *   1. **Productivity**             — owned billed hours vs. a *real* target row
 *                                     whose period applies to the selected
 *                                     window. No such row => Insufficient Data.
 *   2. **Supervision**              — 97155 ÷ 97153 against Blossom's 5%
 *                                     operational benchmark.
 *   3. **Parent Training Cadence**  — share of owned clients holding a usable,
 *                                     source-driven 97156 target that are at
 *                                     pace. No usable target => Insufficient Data.
 *   4. **Authorization / PR Readiness** — real coverage end dates, true progress
 *                                     report actions and due dates, confirmed
 *                                     pause events.
 *   5. **Documentation Timeliness** — DOS -> billing creation lag, always labelled
 *                                     "billing creation proxy". Over 7 calendar
 *                                     days is late *for this proxy*; it is never
 *                                     a formal Commit to Submit violation.
 *
 * Overall status is the **worst applicable** dimension. Fewer than three
 * measurable dimensions is Insufficient Data — a status built on one or two
 * signals is not a performance judgement.
 */
import { localIsoDate } from "../reportWindow";
import { finiteNumberOrNull } from "./numeric";

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
  supervision: "Supervision",
  parent_training: "Parent Training Cadence",
  authorization_readiness: "Authorization / PR Readiness",
  documentation: "Documentation Timeliness",
};

export const SUPERVISION_BENCHMARK_PCT = 5;
export const SUPERVISION_BENCHMARK_LABEL = "Blossom operational benchmark";
export const DOCUMENTATION_PROXY_LABEL = "billing creation proxy";
export const DOCUMENTATION_LATE_DAYS = 7;
export const REAL_DEADLINE_WINDOW_DAYS = 14;
/** A status needs at least this many measurable dimensions to mean anything. */
export const MIN_MEASURABLE_DIMENSIONS = 3;

export interface PerformanceDimension {
  key: PerformanceDimensionKey;
  label: string;
  status: PerformanceStatus;
  /** True when the source could actually measure this dimension. */
  measurable: boolean;
  /** Projected pace against the target, as a percentage. Null for event-based. */
  pacePct: number | null;
  numerator: number | null;
  denominator: number | null;
  /** Numerator/denominator or the event basis, in words. */
  basis: string;
  /** Source of truth or explicitly named proxy. */
  sourceLabel: string;
  reason: string;
  /** A real, documented deadline falls inside the 14-day window. */
  deadlineWithin14Days: boolean;
}

export interface BcbaPerformanceInput {
  bcba: string;
  states: string[];
  clients: number;
  rbts: number;

  /** Owned billed hours in the selected window (void/deleted excluded). */
  currentHours: number;
  /** Owned billed hours in the immediately prior equal-length window. */
  priorHours: number;
  /**
   * Productivity target hours from a real target row whose period applies to
   * the selected window. Null when no such row exists.
   */
  targetHours: number | null;
  /** Share of the current window already elapsed, 0–1. Closed windows are 1. */
  elapsedProportion: number;

  directHours: number;
  supervisionHours: number;

  /** Owned clients with a usable, source-driven 97156 target. */
  ptClientsWithTarget: number;
  /** Of those, how many are at or above their expected pace. */
  ptClientsAtPace: number;

  /** Real authorization/PR facts were available for this BCBA's clients. */
  readinessMeasurable: boolean;
  /** Days until the nearest real documented deadline. Null when none. */
  nearestDeadlineDays: number | null;
  /** Description of that deadline (client + date), for the reason text. */
  nearestDeadlineBasis?: string | null;
  authLapses: number;
  overdueProgressReports: number;
  confirmedPauses: number;

  /** Billed rows with both a DOS and a usable creation timestamp. */
  documentedBillingRows: number;
  /** Of those, rows created more than 7 calendar days after the DOS. */
  lateBillingRows: number;
  /** Rows whose creation timestamp is missing or invalid — a data gap. */
  missingCreationRows: number;

  /** Recorded incentive fields only — never derived. */
  incentiveTargetHours?: number | null;
  incentiveActualHours?: number | null;
  incentiveForecastHours?: number | null;
}

export interface BcbaPerformanceRow {
  bcba: string;
  states: string[];
  clients: number;
  rbts: number;
  currentHours: number;
  priorHours: number;
  deltaHours: number;
  deltaPct: number | null;
  targetHours: number | null;
  supervisionRatioPct: number | null;
  dimensions: PerformanceDimension[];
  measurableCount: number;
  status: PerformanceStatus;
  /** The dimension label(s) that set the overall status. */
  drivers: string[];
}

/** Recorded incentive progress only — no invented eligible yes/no gate. */
export interface IncentiveProgressRow {
  bcba: string;
  actualHours: number | null;
  targetHours: number | null;
  forecastHours: number | null;
  actualAttainmentPct: number | null;
  forecastAttainmentPct: number | null;
  note: string;
}

export interface BcbaPerformanceAnalysis {
  rows: BcbaPerformanceRow[];
  incentives: IncentiveProgressRow[];
  counts: Record<PerformanceStatus, number>;
  totalCurrentHours: number;
  totalPriorHours: number;
  totalDeltaHours: number;
  totalDeltaPct: number | null;
  withoutTargets: number;
  attentionQueue: BcbaPerformanceRow[];
  atRiskQueue: BcbaPerformanceRow[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (num: number, den: number): number | null =>
  den > 0 ? Math.round((num / den) * 1000) / 10 : null;

/** Band a projected pace percentage into the approved statuses. */
export function bandPace(pacePct: number | null): PerformanceStatus {
  if (pacePct == null) return "insufficient_data";
  if (pacePct >= 100) return "strong";
  if (pacePct >= 90) return "on_track";
  if (pacePct >= 75) return "needs_attention";
  return "at_risk";
}

// ---------------------------------------------------------------------------
// Prior equal-length window
// ---------------------------------------------------------------------------

export interface DateWindow {
  from: string;
  to: string;
}

const dayNum = (d: string) => new Date(`${d}T00:00:00Z`).getTime() / 86400000;
const fromDayNum = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10);

/** The immediately preceding window of identical length. */
export function priorEqualWindow(window: DateWindow): DateWindow {
  const from = dayNum(window.from);
  const to = dayNum(window.to);
  const length = to - from + 1;
  return { from: fromDayNum(from - length), to: fromDayNum(from - 1) };
}

/** Share of the window already elapsed, 0–1. A closed window is always 1. */
export function windowElapsedProportion(window: DateWindow, today = localIsoDate()): number {
  if (today >= window.to) return 1;
  if (today < window.from) return 0;
  const total = dayNum(window.to) - dayNum(window.from) + 1;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (dayNum(today) - dayNum(window.from) + 1) / total));
}

// ---------------------------------------------------------------------------
// Target selection
// ---------------------------------------------------------------------------

/**
 * Shape of a row from `report_bcba_performance_targets()`. The RPC reports
 * `mtd_target_hours` / `mtd_actual_hours` / `forecast_hours`; reading a
 * non-existent `target_hours` turned every real target into "No target", so the
 * MTD fields are authoritative here. The legacy aliases are still accepted so
 * older fixtures and any alternate snapshot source keep working.
 */
export interface PerformanceTargetRow {
  bcba_name?: string | null;
  state?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  period_label?: string | null;
  mtd_target_hours?: number | null;
  mtd_actual_hours?: number | null;
  forecast_hours?: number | null;
  /** Compatibility aliases only — never the primary contract. */
  target_hours?: number | null;
  actual_hours?: number | null;
  updated_at?: string | null;
}

/** Strict: blank/boolean/invalid stays missing, a real 0 stays 0. */
const numOrNull = (v: unknown): number | null => finiteNumberOrNull(v);

/** MTD target hours from the real RPC contract, with a legacy alias fallback. */
export function targetHoursOf(row: PerformanceTargetRow): number | null {
  return numOrNull(row.mtd_target_hours) ?? numOrNull(row.target_hours);
}

/** MTD actual hours from the real RPC contract, with a legacy alias fallback. */
export function actualHoursOf(row: PerformanceTargetRow): number | null {
  return numOrNull(row.mtd_actual_hours) ?? numOrNull(row.actual_hours);
}

export function forecastHoursOf(row: PerformanceTargetRow): number | null {
  return numOrNull(row.forecast_hours);
}

/**
 * Only rows whose period overlaps the selected window count, and for duplicate
 * snapshots of the same BCBA/state/period only the latest updated row is used.
 * Summing every historical snapshot would inflate the target several times over.
 */
export function selectApplicableTargets(
  rows: PerformanceTargetRow[],
  window: DateWindow,
): PerformanceTargetRow[] {
  const latest = new Map<string, PerformanceTargetRow>();
  for (const r of rows) {
    const start = r.period_start ? String(r.period_start).slice(0, 10) : null;
    const end = r.period_end ? String(r.period_end).slice(0, 10) : null;
    // An unrelated period can never set the target for this window.
    if (!start || !end) continue;
    if (end < window.from || start > window.to) continue;
    const key = [
      String(r.bcba_name ?? "").trim().toLowerCase(),
      String(r.state ?? "").trim().toLowerCase(),
      `${start}..${end}`,
    ].join("|");
    const prev = latest.get(key);
    if (!prev || String(r.updated_at ?? "") > String(prev.updated_at ?? "")) latest.set(key, r);
  }
  return [...latest.values()];
}

/** The latest applicable target rows for one BCBA in the selected window. */
export function selectBcbaTargets(
  rows: PerformanceTargetRow[],
  bcba: string,
  window: DateWindow,
): PerformanceTargetRow[] {
  return selectApplicableTargets(rows, window).filter(
    (r) => String(r.bcba_name ?? "").trim().toLowerCase() === bcba.trim().toLowerCase(),
  );
}

/** Sum of the latest applicable target rows for one BCBA. Null when none. */
export function resolveTargetHours(
  rows: PerformanceTargetRow[],
  bcba: string,
  window: DateWindow,
): number | null {
  const values = selectBcbaTargets(rows, bcba, window)
    .map((r) => targetHoursOf(r))
    .filter((n): n is number => n != null && n > 0);
  if (!values.length) return null;
  return round1(values.reduce((s, v) => s + v, 0));
}

/**
 * Incentive target/actual/forecast for one BCBA, summed over the *same*
 * selected/latest snapshot set as the productivity target — never whichever row
 * happened to be last in an unfiltered array, and never an unrelated period.
 */
export function resolveIncentiveFigures(
  rows: PerformanceTargetRow[],
  bcba: string,
  window: DateWindow,
): { targetHours: number | null; actualHours: number | null; forecastHours: number | null } {
  const applicable = selectBcbaTargets(rows, bcba, window);
  const sum = (pick: (r: PerformanceTargetRow) => number | null): number | null => {
    const values = applicable.map(pick).filter((n): n is number => n != null);
    return values.length ? round1(values.reduce((s, v) => s + v, 0)) : null;
  };
  return {
    targetHours: sum(targetHoursOf),
    actualHours: sum(actualHoursOf),
    forecastHours: sum(forecastHoursOf),
  };
}


// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

export function buildDimensions(input: BcbaPerformanceInput): PerformanceDimension[] {
  const elapsed = Math.min(1, Math.max(0, input.elapsedProportion));

  // 1. Productivity — paced against a real target row only.
  const expectedToDate =
    input.targetHours != null ? Math.round(input.targetHours * elapsed * 10) / 10 : null;
  const productivityPace =
    expectedToDate != null && expectedToDate > 0 ? pct(input.currentHours, expectedToDate) : null;
  const productivity: PerformanceDimension = {
    key: "productivity",
    label: DIMENSION_LABELS.productivity,
    status: bandPace(productivityPace),
    measurable: productivityPace != null,
    pacePct: productivityPace,
    numerator: round1(input.currentHours),
    denominator: expectedToDate,
    basis:
      expectedToDate == null
        ? "No applicable target row for this period"
        : `${round1(input.currentHours)} owned billed hrs ÷ ${expectedToDate} expected hrs to date`,
    sourceLabel: "Owned billed hours (report_billing_facts) vs. recorded target row",
    reason:
      expectedToDate == null
        ? "No productivity target row applies to the selected period, so attainment cannot be measured."
        : `${round1(input.currentHours)} of ${expectedToDate} expected hours billed so far (${productivityPace}% of pace).`,
    deadlineWithin14Days: false,
  };

  // 2. Supervision — 97155 ÷ 97153 against the 5% operational benchmark.
  const supervisionRatio = pct(input.supervisionHours, input.directHours);
  const supervisionPace =
    supervisionRatio == null
      ? null
      : Math.round((supervisionRatio / SUPERVISION_BENCHMARK_PCT) * 1000) / 10;
  const supervision: PerformanceDimension = {
    key: "supervision",
    label: DIMENSION_LABELS.supervision,
    status: input.directHours <= 0 ? "insufficient_data" : bandPace(supervisionPace),
    measurable: input.directHours > 0,
    pacePct: supervisionPace,
    numerator: round1(input.supervisionHours),
    denominator: round1(input.directHours),
    basis: `${round1(input.supervisionHours)} hrs 97155 ÷ ${round1(input.directHours)} hrs 97153`,
    sourceLabel: `Billed 97155/97153 vs. ${SUPERVISION_BENCHMARK_PCT}% ${SUPERVISION_BENCHMARK_LABEL}`,
    reason:
      input.directHours <= 0
        ? "No 97153 direct hours in this window, so a supervision ratio cannot be calculated."
        : `${supervisionRatio}% of direct hours supervised against the ${SUPERVISION_BENCHMARK_PCT}% ${SUPERVISION_BENCHMARK_LABEL}.`,
    deadlineWithin14Days: false,
  };

  // 3. Parent training cadence — source-driven client targets only.
  const ptPace = pct(input.ptClientsAtPace, input.ptClientsWithTarget);
  const parentTraining: PerformanceDimension = {
    key: "parent_training",
    label: DIMENSION_LABELS.parent_training,
    status: input.ptClientsWithTarget <= 0 ? "insufficient_data" : bandPace(ptPace),
    measurable: input.ptClientsWithTarget > 0,
    pacePct: ptPace,
    numerator: input.ptClientsAtPace,
    denominator: input.ptClientsWithTarget,
    basis:
      input.ptClientsWithTarget <= 0
        ? "No owned client has a usable 97156 target"
        : `${input.ptClientsAtPace} of ${input.ptClientsWithTarget} owned clients with a documented 97156 target are at pace`,
    sourceLabel: "Billed 97156 vs. active 97156 authorization targets",
    reason:
      input.ptClientsWithTarget <= 0
        ? "No owned client has authorized monthly 97156 hours or an unambiguous cadence, so cadence cannot be measured."
        : `${input.ptClientsAtPace} of ${input.ptClientsWithTarget} clients with a documented target are at pace.`,
    deadlineWithin14Days: false,
  };

  // 4. Authorization / PR readiness — real events and deadlines only.
  const deadlineSoon =
    input.nearestDeadlineDays != null &&
    input.nearestDeadlineDays >= 0 &&
    input.nearestDeadlineDays <= REAL_DEADLINE_WINDOW_DAYS;
  const readinessProblems =
    input.authLapses + input.overdueProgressReports + input.confirmedPauses;
  const readiness: PerformanceDimension = {
    key: "authorization_readiness",
    label: DIMENSION_LABELS.authorization_readiness,
    status: !input.readinessMeasurable
      ? "insufficient_data"
      : readinessProblems > 0
        ? "at_risk"
        : deadlineSoon
          ? "needs_attention"
          : "strong",
    measurable: input.readinessMeasurable,
    pacePct: null,
    numerator: readinessProblems,
    denominator: null,
    basis: !input.readinessMeasurable
      ? "No authorization coverage, progress-report action, or pause event available"
      : `${input.authLapses} auth lapse(s), ${input.overdueProgressReports} overdue progress report(s), ${input.confirmedPauses} confirmed pause(s)${
          input.nearestDeadlineBasis ? ` · nearest deadline: ${input.nearestDeadlineBasis}` : ""
        }`,
    sourceLabel: "Authorization coverage dates, progress-report actions, confirmed pause events",
    reason: !input.readinessMeasurable
      ? "No real authorization coverage, progress-report action, or pause event exists for these clients."
      : readinessProblems > 0
        ? `${input.authLapses} authorization lapse(s), ${input.overdueProgressReports} overdue progress report(s), and ${input.confirmedPauses} confirmed pause(s) need action.`
        : deadlineSoon
          ? `A real documented deadline falls within ${REAL_DEADLINE_WINDOW_DAYS} days${input.nearestDeadlineBasis ? ` (${input.nearestDeadlineBasis})` : ""}.`
          : "No lapse, overdue report, confirmed pause, or near-term deadline.",
    deadlineWithin14Days: Boolean(input.readinessMeasurable && deadlineSoon),
  };

  // 5. Documentation timeliness — DOS -> creation lag, proxy only.
  const documentation: PerformanceDimension = {
    key: "documentation",
    label: DIMENSION_LABELS.documentation,
    status:
      input.documentedBillingRows <= 0
        ? "insufficient_data"
        : input.lateBillingRows > 0
          ? "at_risk"
          : "strong",
    measurable: input.documentedBillingRows > 0,
    pacePct: null,
    numerator: input.lateBillingRows,
    denominator: input.documentedBillingRows,
    basis:
      input.documentedBillingRows <= 0
        ? "No billed row has both a date of service and a usable creation timestamp"
        : `${input.lateBillingRows} of ${input.documentedBillingRows} billed rows created more than ${DOCUMENTATION_LATE_DAYS} days after the date of service`,
    sourceLabel: `Date of service → billing creation lag (${DOCUMENTATION_PROXY_LABEL})`,
    reason:
      input.documentedBillingRows <= 0
        ? `Creation timestamps are missing or invalid on ${input.missingCreationRows} row(s) — a data gap, not a zero.`
        : input.lateBillingRows > 0
          ? `${input.lateBillingRows} row(s) were created more than ${DOCUMENTATION_LATE_DAYS} calendar days after the date of service (${DOCUMENTATION_PROXY_LABEL}; not a formal Commit to Submit finding).${
              input.missingCreationRows > 0
                ? ` ${input.missingCreationRows} row(s) have no usable creation timestamp — a data gap.`
                : ""
            }`
          : `All ${input.documentedBillingRows} measurable row(s) were created within ${DOCUMENTATION_LATE_DAYS} days of the date of service (${DOCUMENTATION_PROXY_LABEL}).`,
    deadlineWithin14Days: false,
  };

  return [productivity, supervision, parentTraining, readiness, documentation];
}

export function computeBcbaPerformanceAnalysis(
  inputs: BcbaPerformanceInput[],
): BcbaPerformanceAnalysis {
  const rows: BcbaPerformanceRow[] = inputs.map((input) => {
    const dimensions = buildDimensions(input);
    const measurable = dimensions.filter((d) => d.measurable);
    const applicableWorst = worstStatus(measurable.map((d) => d.status));
    // A status assembled from one or two signals is not a judgement.
    const status =
      measurable.length < MIN_MEASURABLE_DIMENSIONS ? "insufficient_data" : applicableWorst;
    const delta = round1(input.currentHours - input.priorHours);

    return {
      bcba: input.bcba,
      states: input.states,
      clients: input.clients,
      rbts: input.rbts,
      currentHours: round1(input.currentHours),
      priorHours: round1(input.priorHours),
      deltaHours: delta,
      deltaPct: input.priorHours > 0 ? Math.round((delta / input.priorHours) * 1000) / 10 : null,
      targetHours: input.targetHours,
      supervisionRatioPct: dimensions[1].pacePct == null ? null : pct(input.supervisionHours, input.directHours),
      dimensions,
      measurableCount: measurable.length,
      status,
      drivers:
        measurable.length < MIN_MEASURABLE_DIMENSIONS
          ? [`Only ${measurable.length} measurable dimension(s)`]
          : measurable.filter((d) => d.status === status).map((d) => d.label),
    };
  });

  const incentives: IncentiveProgressRow[] = inputs.map((input) => {
    const actual = input.incentiveActualHours ?? null;
    const target = input.incentiveTargetHours ?? null;
    const forecast = input.incentiveForecastHours ?? null;
    return {
      bcba: input.bcba,
      actualHours: actual,
      targetHours: target,
      forecastHours: forecast,
      actualAttainmentPct: target != null && target > 0 && actual != null ? pct(actual, target) : null,
      forecastAttainmentPct:
        target != null && target > 0 && forecast != null ? pct(forecast, target) : null,
      note:
        target == null
          ? "No recorded incentive target for this period."
          : "Recorded incentive target, actual, and forecast as reported by the source.",
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

  rows.sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status] || b.currentHours - a.currentHours);

  const totalCurrent = round1(rows.reduce((s, r) => s + r.currentHours, 0));
  const totalPrior = round1(rows.reduce((s, r) => s + r.priorHours, 0));

  return {
    rows,
    incentives,
    counts,
    totalCurrentHours: totalCurrent,
    totalPriorHours: totalPrior,
    totalDeltaHours: round1(totalCurrent - totalPrior),
    totalDeltaPct:
      totalPrior > 0 ? Math.round(((totalCurrent - totalPrior) / totalPrior) * 1000) / 10 : null,
    withoutTargets: rows.filter((r) => r.targetHours == null).length,
    attentionQueue: rows.filter((r) => r.status === "needs_attention"),
    atRiskQueue: rows.filter((r) => r.status === "at_risk"),
  };
}
