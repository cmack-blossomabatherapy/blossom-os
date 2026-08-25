/**
 * Phase 2B1 — pure scope, numeric, and risk rules for Authorization Utilization.
 *
 * Three correctness rules live here, all pure and unit-tested:
 *
 * 1. **Active never means future.** An authorization is active when the source
 *    explicitly says `is_active = true`, or when it is not explicitly false and
 *    today sits inside its coverage window. An authorization that starts next
 *    month is *not* active. An explicit `false` always loses, whatever the dates
 *    say. `is_active = true` with missing bounds is retained but flagged so the
 *    UI can say the dates are missing instead of pretending they align.
 *
 * 2. **`Number(null)` is not a documented zero.** Missing authorized / worked /
 *    scheduled / pending / remaining source fields stay `null` so the UI can
 *    show "Not documented" rather than a fabricated 0.
 *
 * 3. **Risk is a rule, not a vibe.** Exhausted and exhaustion-risk are computed
 *    from an explicit, reason-bearing rule so every badge can explain itself.
 */

/** Numeric read that keeps `null`/blank/NaN as `null` — never a fake zero. */
export function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = String(value).trim();
  if (!text) return null;
  const parsed = Number(text.replace(/[$,%\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export interface ActiveScopeInput {
  is_active?: boolean | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ActiveScopeResult {
  active: boolean;
  /** True when the row is retained on an explicit flag but has no usable bounds. */
  datesMissing: boolean;
  reason: string;
}

/**
 * Active scope for the utilization report. Future-dated authorizations are
 * excluded: they have no hours to utilize inside the selected window.
 */
export function resolveActiveScope(
  row: ActiveScopeInput,
  today: string,
): ActiveScopeResult {
  const start = row.startDate ? String(row.startDate).slice(0, 10) : null;
  const end = row.endDate ? String(row.endDate).slice(0, 10) : null;

  if (row.is_active === false) {
    return { active: false, datesMissing: false, reason: "Source marks this authorization inactive." };
  }
  if (row.is_active === true) {
    if (!start || !end) {
      return {
        active: true,
        datesMissing: true,
        reason: "Marked active by the source, but coverage dates are missing.",
      };
    }
    return { active: true, datesMissing: false, reason: "Marked active by the source." };
  }
  if (!start && !end) {
    return {
      active: false,
      datesMissing: true,
      reason: "No active flag and no coverage dates — cannot confirm it is active.",
    };
  }
  if (start && today < start) {
    return {
      active: false,
      datesMissing: false,
      reason: `Coverage has not started yet (starts ${start}).`,
    };
  }
  if (end && today > end) {
    return { active: false, datesMissing: false, reason: `Coverage ended ${end}.` };
  }
  return { active: true, datesMissing: false, reason: "Today is inside the coverage window." };
}

export interface UtilizationRiskInput {
  /** Authorized hours prorated to the selected window. */
  proratedAuthorizedHours: number | null;
  /** Chosen used hours (recomputed when allocated, otherwise source). */
  usedHours: number | null;
  scheduledHours: number | null;
  pendingHours: number | null;
  remainingHours: number | null;
  utilizationPct: number | null;
  daysToExpiry: number | null;
}

export type UtilizationRiskLevel =
  | "exhausted"
  | "at_risk"
  | "on_track"
  | "insufficient_data";

export interface UtilizationRiskResult {
  level: UtilizationRiskLevel;
  /** used + scheduled + pending — the demand the authorization must absorb. */
  projectedDemand: number | null;
  reasons: string[];
}

export const UTILIZATION_RISK_LABELS: Record<UtilizationRiskLevel, string> = {
  exhausted: "Exhausted",
  at_risk: "Exhaustion risk",
  on_track: "On track",
  insufficient_data: "Insufficient data",
};

/**
 * Exhausted  = usable remaining hours ≤ 0.
 * At risk    = projected demand exceeds prorated authorized hours, OR
 *              utilization ≥ 90% with more than 14 days of coverage left.
 * Anything we cannot compute stays `insufficient_data` — never 0%.
 */
export function assessUtilizationRisk(input: UtilizationRiskInput): UtilizationRiskResult {
  const {
    proratedAuthorizedHours: authorized,
    usedHours,
    scheduledHours,
    pendingHours,
    remainingHours,
    utilizationPct,
    daysToExpiry,
  } = input;

  const reasons: string[] = [];
  const parts = [usedHours, scheduledHours, pendingHours].filter(
    (v): v is number => v != null,
  );
  const projectedDemand = usedHours == null ? null : parts.reduce((s, v) => s + v, 0);

  const usable =
    remainingHours != null
      ? remainingHours
      : authorized != null && usedHours != null
        ? Math.round((authorized - usedHours) * 10) / 10
        : null;

  if (authorized == null || authorized <= 0 || usedHours == null) {
    reasons.push("Authorized or used hours are not documented, so risk cannot be assessed.");
    return { level: "insufficient_data", projectedDemand, reasons };
  }

  if (usable != null && usable <= 0) {
    reasons.push(`No usable hours remain (${usable} remaining).`);
    return { level: "exhausted", projectedDemand, reasons };
  }

  if (projectedDemand != null && projectedDemand > authorized) {
    reasons.push(
      `Projected demand of ${Math.round(projectedDemand * 10) / 10} hrs exceeds ${authorized} authorized hrs (used + scheduled + pending).`,
    );
  }
  if (utilizationPct != null && utilizationPct >= 90 && (daysToExpiry ?? 0) > 14) {
    reasons.push(
      `${utilizationPct}% utilized with ${daysToExpiry} days of coverage still to run.`,
    );
  }
  if (reasons.length) return { level: "at_risk", projectedDemand, reasons };

  reasons.push("Projected demand fits inside the authorized hours for this window.");
  return { level: "on_track", projectedDemand, reasons };
}

/** Which snapshot hour variant the selected window can honestly be compared to. */
export type SnapshotWindowMode = "month" | "auth_range" | "unavailable";

/**
 * The CentralReach snapshot only exports hour figures for two windows: the
 * current month and the full authorization range. Any other selected range has
 * no matching snapshot column, so we report those figures as unavailable rather
 * than pretending a March-only filter lines up with an all-time total.
 */
export function snapshotWindowMode(
  window: { from?: string; to?: string },
  today: string,
  fullRangeView = false,
): SnapshotWindowMode {
  if (fullRangeView) return "auth_range";
  const { from, to } = window;
  if (!from || !to) return "unavailable";
  const monthStart = `${today.slice(0, 7)}-01`;
  const [y, m] = today.slice(0, 7).split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const monthEnd = `${today.slice(0, 7)}-${String(lastDay).padStart(2, "0")}`;
  return from === monthStart && to === monthEnd ? "month" : "unavailable";
}
