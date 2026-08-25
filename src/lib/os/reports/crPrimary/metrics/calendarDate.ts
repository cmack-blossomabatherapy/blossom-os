/**
 * Phase 4A2 audit repair — one strict calendar-date validator for report
 * metrics.
 *
 * `new Date("2026-02-31T00:00:00Z")` does not throw: JavaScript silently rolls
 * the value over to March 3rd. Every metric that trusted that check therefore
 * accepted impossible source dates and turned them into real day counts and
 * real "coverage". This validator round-trips the parsed UTC year/month/day
 * back to the input, so only a date that actually exists on the calendar is
 * accepted.
 *
 * A timestamp may contribute its leading `YYYY-MM-DD` only when that day is
 * itself real.
 */
export function strictDay(value: unknown): string | null {
  if (value == null) return null;
  const raw = typeof value === "string" ? value.trim() : String(value).trim();
  if (!raw) return null;

  const day = raw.slice(0, 10);
  const match = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = Number(match[3]);
  if (!year || month < 1 || month > 12 || date < 1 || date > 31) return null;

  // Round-trip guard: rejects 2026-02-31, 2026-04-31, non-leap 2026-02-29, etc.
  const parsed = new Date(Date.UTC(year, month - 1, date));
  if (Number.isNaN(parsed.getTime())) return null;
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== date
  ) {
    return null;
  }
  return day;
}

/**
 * Whole days between two day keys, or null when either side is not a real
 * calendar date. Both inputs are validated strictly, so a rollover date can
 * never produce a day count.
 */
export function strictDaysBetween(
  from: unknown,
  to: unknown,
): number | null {
  const a = strictDay(from);
  const b = strictDay(to);
  if (!a || !b) return null;
  const start = Date.parse(`${a}T00:00:00Z`);
  const end = Date.parse(`${b}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.round((end - start) / 86_400_000);
}
