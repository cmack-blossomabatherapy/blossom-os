/**
 * Phase 2A — scheduling truth rules.
 *
 * Every staff-facing scheduling metric (cancellations, lost hours, delivered
 * hours) resolves from these rules so two reports can never disagree about
 * what "cancelled" means.
 *
 * Ordering is deliberate:
 *   1. The explicit Phase 1 boolean columns (`cancelled`, `deleted`,
 *      `converted_to_timesheet`) win whenever they are present — including
 *      when they are explicitly `false`.
 *   2. Only when the explicit flag is absent (legacy rows imported before the
 *      Phase 1 snapshot columns existed) do we infer from attendance / status
 *      text, and the report says so out loud.
 *
 * Nothing here guesses a reason. A blank, `0`, or `false` reason is *not
 * documented*, and is reported as such rather than bucketed into "Other".
 */

export interface ScheduleTruthRow {
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  scheduled_hours?: number | null;
  status?: string | null;
  attendance?: string | null;
  cancelled?: boolean | null;
  deleted?: boolean | null;
  converted_to_timesheet?: boolean | null;
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
}

/** Values CentralReach exports use to mean "empty" in a text column. */
const PLACEHOLDER_TEXT =
  /^(0|0+\.0*|false|f|no|n|na|n\/a|none|null|nil|-{1,3}|—|undefined|#n\/a)$/i;

/**
 * Real documented text, or `null`. Guards against the `0` / `false` /
 * `N/A` placeholders CentralReach writes into optional text columns.
 */
export function cleanReasonText(value: string | null | undefined): string | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  if (PLACEHOLDER_TEXT.test(s)) return null;
  return s;
}

export function isDeletedEvent(row: ScheduleTruthRow): boolean {
  if (row.deleted != null) return row.deleted === true;
  return /\bdeleted\b|\bremoved\b|\bvoid(ed)?\b/i.test(String(row.status ?? ""));
}

export function isConvertedToTimesheet(row: ScheduleTruthRow): boolean {
  if (row.converted_to_timesheet != null) return row.converted_to_timesheet === true;
  return /converted|timesheet|billed/i.test(String(row.status ?? ""));
}

export type CancellationTruthSource =
  | "explicit_flag"
  | "attendance_text"
  | "status_text"
  | "reason_text"
  | "none";

export interface CancellationTruth {
  cancelled: boolean;
  /** Which signal decided the answer — surfaced in report provenance. */
  source: CancellationTruthSource;
}

const CANCEL_TEXT = /cancel|no[\s-]?show|missed|did not attend|dna\b/i;

/** Resolve whether an event is cancelled, and from which signal. */
export function cancellationTruth(row: ScheduleTruthRow): CancellationTruth {
  if (row.cancelled != null) {
    return { cancelled: row.cancelled === true, source: "explicit_flag" };
  }
  const attendance = cleanReasonText(row.attendance);
  if (attendance && CANCEL_TEXT.test(attendance)) {
    return { cancelled: true, source: "attendance_text" };
  }
  const status = cleanReasonText(row.status);
  if (status && CANCEL_TEXT.test(status)) {
    return { cancelled: true, source: "status_text" };
  }
  if (cleanReasonText(row.cancellation_reason)) {
    return { cancelled: true, source: "reason_text" };
  }
  return { cancelled: false, source: "none" };
}

export function isCancelledEventStrict(row: ScheduleTruthRow): boolean {
  if (isDeletedEvent(row)) return false;
  return cancellationTruth(row).cancelled;
}

/** A real, kept, delivered-or-deliverable event: not deleted, not cancelled. */
export function isActiveEvent(row: ScheduleTruthRow): boolean {
  if (isDeletedEvent(row)) return false;
  return !cancellationTruth(row).cancelled;
}

/** Deleted rows never count in a denominator. */
export function isCountableEvent(row: ScheduleTruthRow): boolean {
  return !isDeletedEvent(row);
}

export function isNoShow(row: ScheduleTruthRow): boolean {
  const text = `${cleanReasonText(row.attendance) ?? ""} ${cleanReasonText(row.status) ?? ""} ${
    cleanReasonText(row.cancellation_reason) ?? ""
  }`;
  return /no[\s-]?show|did not attend|dna\b/i.test(text);
}

/** Minutes since midnight for `HH:MM`, `HH:MM:SS`, or an ISO timestamp. */
export function clockMinutes(value: string | null | undefined): number | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const m = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]m)?/i);
  if (!m) return null;
  let hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const suffix = (m[4] ?? "").toLowerCase();
  if (suffix === "pm" && hours < 12) hours += 12;
  if (suffix === "am" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Duration in hours. Wall-clock start/end wins when both are present and
 * produce a positive span; otherwise the exported `scheduled_hours` is used.
 * Never negative, never invented.
 */
export function eventDurationHours(row: ScheduleTruthRow): number {
  const start = clockMinutes(row.start_time);
  const end = clockMinutes(row.end_time);
  if (start != null && end != null) {
    const span = end - start;
    if (span > 0) return Math.round((span / 60) * 100) / 100;
  }
  const hours = Number(row.scheduled_hours);
  if (Number.isFinite(hours) && hours > 0) return Math.round(hours * 100) / 100;
  return 0;
}

export type TruthMode = "empty" | "explicit" | "inferred" | "mixed";

export interface TruthCoverage {
  total: number;
  withExplicitFlag: number;
  explicitPct: number;
  mode: TruthMode;
  /** Plain-language provenance line rendered on the report. */
  label: string;
}

/**
 * How much of the loaded scheduling data carries the explicit Phase 1
 * cancellation flag. Reports print this so nobody mistakes an inferred number
 * for a source-of-truth number.
 */
export function scheduleTruthCoverage(rows: ScheduleTruthRow[]): TruthCoverage {
  const total = rows.length;
  const withExplicitFlag = rows.reduce((n, r) => n + (r.cancelled != null ? 1 : 0), 0);
  const explicitPct = total ? Math.round((withExplicitFlag / total) * 1000) / 10 : 0;
  const mode: TruthMode =
    total === 0
      ? "empty"
      : withExplicitFlag === total
        ? "explicit"
        : withExplicitFlag === 0
          ? "inferred"
          : "mixed";
  const label =
    mode === "empty"
      ? "No scheduling rows in range."
      : mode === "explicit"
        ? "Cancellations read from the CentralReach cancelled flag on every row."
        : mode === "inferred"
          ? "These rows predate the CentralReach cancelled flag — cancellations are read from status, attendance, and documented reason text."
          : `${explicitPct}% of rows carry the CentralReach cancelled flag; the rest fall back to status, attendance, and reason text.`;
  return { total, withExplicitFlag, explicitPct, mode, label };
}

/** ISO weekday label for an event date (UTC, Monday first). */
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function dayOfWeekLabel(dateStr: string | null | undefined): string | null {
  const s = String(dateStr ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const idx = (d.getUTCDay() + 6) % 7;
  return DAY_LABELS[idx];
}

export const DAY_OF_WEEK_ORDER = DAY_LABELS;
