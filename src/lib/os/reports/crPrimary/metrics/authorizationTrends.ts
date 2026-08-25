/**
 * Phase 2A repair — reconciled authorized-vs-used HOUR trends.
 *
 * Two separate series, deliberately never mixed on one axis:
 *   - `hours`   — authorized hours prorated into each period, next to the hours
 *                 actually worked in that period. Both are hours.
 *   - `pace`    — utilization percent per period, shown on its own display.
 *
 * Everything here is pure and calendar-based on local `YYYY-MM-DD` strings, so
 * a period boundary never shifts because of a timezone.
 */
import { daysBetween } from "./authorizationContinuity";

export type TrendGrain = "week" | "month";

export interface TrendAuthInput {
  startDate: string | null;
  endDate: string | null;
  /** Full authorized hours for the whole coverage window. */
  authorizedHours: number | null;
}

export interface TrendUsedInput {
  date: string | null | undefined;
  hours: number | null | undefined;
}

export interface TrendPoint {
  /** Period start, `YYYY-MM-DD`. */
  label: string;
  authorizedHours: number;
  usedHours: number;
  /** Used ÷ authorized as a percentage; null when there is nothing authorized. */
  utilizationPct: number | null;
}

export interface AuthorizationTrendResult {
  grain: TrendGrain;
  /** Hour series — both values are hours and share one axis. */
  hours: { label: string; value: number; secondary: number }[];
  /** Percentage pace series — rendered separately from the hour chart. */
  pace: { label: string; value: number | null }[];
  points: TrendPoint[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const iso = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;

/** Monday-start week key for a `YYYY-MM-DD` date. */
export function weekKey(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  return iso(d);
}

/** First-of-month key for a `YYYY-MM-DD` date. */
export function monthKey(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export function periodKey(date: string, grain: TrendGrain): string {
  return grain === "week" ? weekKey(date) : monthKey(date);
}

function periodEnd(start: string, grain: TrendGrain): string {
  const d = new Date(`${start}T00:00:00Z`);
  if (grain === "week") d.setUTCDate(d.getUTCDate() + 6);
  else {
    d.setUTCMonth(d.getUTCMonth() + 1);
    d.setUTCDate(0);
  }
  return iso(d);
}

/** Every period start between two dates, inclusive. */
export function periodStarts(from: string, to: string, grain: TrendGrain): string[] {
  const out: string[] = [];
  let cursor = periodKey(from, grain);
  const last = periodKey(to, grain);
  let guard = 0;
  while (cursor <= last && guard < 2000) {
    out.push(cursor);
    const d = new Date(`${cursor}T00:00:00Z`);
    if (grain === "week") d.setUTCDate(d.getUTCDate() + 7);
    else d.setUTCMonth(d.getUTCMonth() + 1);
    cursor = iso(d);
    guard += 1;
  }
  return out;
}

const overlapDays = (aStart: string, aEnd: string, bStart: string, bEnd: string): number => {
  const start = aStart > bStart ? aStart : bStart;
  const end = aEnd < bEnd ? aEnd : bEnd;
  const days = (daysBetween(start, end) ?? -1) + 1;
  return days > 0 ? days : 0;
};

/**
 * Spread each authorization's hours across the periods its coverage window
 * touches (by day count), and sum worked hours into the same periods.
 */
export function computeAuthorizationTrend(
  auths: TrendAuthInput[],
  used: TrendUsedInput[],
  options: { from?: string; to?: string; grain?: TrendGrain } = {},
): AuthorizationTrendResult {
  const grain = options.grain ?? "week";

  const dates: string[] = [];
  for (const a of auths) {
    if (a.startDate) dates.push(a.startDate);
    if (a.endDate) dates.push(a.endDate);
  }
  for (const u of used) {
    const d = String(u.date ?? "").slice(0, 10);
    if (d) dates.push(d);
  }
  if (options.from) dates.push(options.from);
  if (options.to) dates.push(options.to);
  const inRange = dates
    .filter((d) => (!options.from || d >= options.from) && (!options.to || d <= options.to))
    .sort();
  if (inRange.length === 0) {
    return { grain, hours: [], pace: [], points: [] };
  }

  const starts = periodStarts(inRange[0], inRange[inRange.length - 1], grain);
  const buckets = new Map<string, { authorized: number; used: number }>();
  for (const s of starts) buckets.set(s, { authorized: 0, used: 0 });

  for (const auth of auths) {
    const hours = Number(auth.authorizedHours);
    if (!auth.startDate || !auth.endDate || !Number.isFinite(hours) || hours <= 0) continue;
    const totalDays = (daysBetween(auth.startDate, auth.endDate) ?? -1) + 1;
    if (totalDays <= 0) continue;
    const perDay = hours / totalDays;
    for (const start of starts) {
      const days = overlapDays(auth.startDate, auth.endDate, start, periodEnd(start, grain));
      if (days > 0) buckets.get(start)!.authorized += perDay * days;
    }
  }

  for (const row of used) {
    const date = String(row.date ?? "").slice(0, 10);
    if (!date) continue;
    if (options.from && date < options.from) continue;
    if (options.to && date > options.to) continue;
    const key = periodKey(date, grain);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    const hours = Number(row.hours);
    bucket.used += Number.isFinite(hours) ? hours : 0;
  }

  const points: TrendPoint[] = starts.map((label) => {
    const b = buckets.get(label)!;
    const authorized = round1(b.authorized);
    const usedHours = round1(b.used);
    return {
      label,
      authorizedHours: authorized,
      usedHours,
      utilizationPct: authorized > 0 ? Math.round((usedHours / authorized) * 1000) / 10 : null,
    };
  });

  return {
    grain,
    // value = hours used, secondary = hours authorized. Same unit, one axis.
    hours: points.map((p) => ({
      label: p.label,
      value: p.usedHours,
      secondary: p.authorizedHours,
    })),
    pace: points.map((p) => ({ label: p.label, value: p.utilizationPct })),
    points,
  };
}
