/**
 * Canonical `YYYY-MM-DD` day key for report date filtering.
 *
 * CentralReach values reach the reports in several shapes depending on the
 * export and the ingest path: real `date` columns (`2026-03-02`), timestamps
 * (`2026-03-02T00:00:00+00:00`), and raw CSV text (`3/2/2026`, `03-02-2026`).
 * Plain string comparison only works for the first shape, which is why date
 * range filters silently dropped or kept the wrong rows. Every date filter
 * must compare day keys produced here.
 */
export function toDayKey(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : iso(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }
  const raw = String(value).trim();
  if (!raw) return "";

  // 2026-03-02, 2026-03-02T10:00:00Z, 2026/03/02
  const isoish = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoish) return iso(+isoish[1], +isoish[2], +isoish[3]);

  // 3/2/2026, 03-02-2026, 3.2.2026 (US month-first, as CentralReach exports)
  const us = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (us) {
    const year = +us[3] < 100 ? 2000 + +us[3] : +us[3];
    return iso(year, +us[1], +us[2]);
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return iso(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }
  return "";
}

function iso(y: number, m: number, d: number): string {
  if (!y || !m || !d || m > 12 || d > 31) return "";
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Inclusive day-key range test. Rows without a usable date fail an active range. */
export function inDayRange(value: unknown, from: string, to: string): boolean {
  const f = toDayKey(from);
  const t = toDayKey(to);
  if (!f && !t) return true;
  const key = toDayKey(value);
  if (!key) return false;
  if (f && key < f) return false;
  if (t && key > t) return false;
  return true;
}

/**
 * Inclusive overlap test for records that represent a period rather than one
 * service day (for example, an authorization effective date through its end
 * date). Open-ended records are treated as continuing indefinitely.
 */
export function periodOverlapsDayRange(
  startValue: unknown,
  endValue: unknown,
  from: string,
  to: string,
): boolean {
  const filterStart = toDayKey(from);
  const filterEnd = toDayKey(to);
  if (!filterStart && !filterEnd) return true;

  const periodStart = toDayKey(startValue);
  const periodEnd = toDayKey(endValue);
  if (!periodStart && !periodEnd) return false;

  const effectiveStart = periodStart || periodEnd;
  const effectiveEnd = periodEnd || "9999-12-31";
  if (filterEnd && effectiveStart > filterEnd) return false;
  if (filterStart && effectiveEnd < filterStart) return false;
  return true;
}
