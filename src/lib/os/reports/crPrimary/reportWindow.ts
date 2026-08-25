/**
 * Shared date-window defaults for the staff-facing CentralReach reports.
 *
 * Every report defaults to the *current calendar month* so a fresh open never
 * scans years of history. The month is resolved from **local** calendar parts
 * (`getFullYear` / `getMonth` / `getDate`) rather than `toISOString()`, because
 * `toISOString()` shifts to UTC and would put a US-evening "today" into
 * tomorrow — and on the 1st or last day of a month, into the wrong month.
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** `YYYY-MM-DD` for a Date using its local calendar parts. */
export function localIsoDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface ReportDateWindow {
  from: string;
  to: string;
}

/** First and last day of the month containing `today`, in local dates. */
export function currentMonthWindow(today: Date = new Date()): ReportDateWindow {
  const year = today.getFullYear();
  const month = today.getMonth();
  const last = new Date(year, month + 1, 0);
  return {
    from: `${year}-${pad(month + 1)}-01`,
    to: `${year}-${pad(month + 1)}-${pad(last.getDate())}`,
  };
}

/**
 * Merge a report's empty filter shape with the current-month window. Used as
 * the `useUrlFilterState` default so an absent `from`/`to` in the URL resolves
 * to this month, and Reset returns here too.
 */
export function withCurrentMonthDefault<T extends { from: string; to: string }>(
  empty: T,
  today: Date = new Date(),
): T {
  return { ...empty, ...currentMonthWindow(today) };
}

/**
 * The window immediately before `window`, of equal length, for prior-period
 * comparison. Returns `null` when either bound is missing.
 */
export function previousWindow(window: Partial<ReportDateWindow>): ReportDateWindow | null {
  const { from, to } = window;
  if (!from || !to) return null;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (days <= 0) return null;
  const prevEnd = new Date(start.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 86400000);
  return { from: localIsoDate(prevStart), to: localIsoDate(prevEnd) };
}
