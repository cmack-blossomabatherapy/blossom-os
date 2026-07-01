/**
 * Timezone helpers for marketing call classification.
 * All after-hours logic MUST resolve against America/New_York (Blossom HQ tz),
 * NOT the browser's local timezone (which changes per user machine).
 */

export const BLOSSOM_TZ = "America/New_York";

/** Return the hour (0-23) of an ISO timestamp in the given IANA timezone. */
export function hourInTimeZone(iso: string | Date, tz: string = BLOSSOM_TZ): number {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return NaN;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = parts.find((p) => p.type === "hour")?.value ?? "0";
  // Intl may return "24" for midnight in some engines - normalize.
  const n = parseInt(h, 10);
  return Number.isFinite(n) ? n % 24 : NaN;
}

/** Return the weekday (0=Sun..6=Sat) of an ISO timestamp in the given tz. */
export function weekdayInTimeZone(iso: string | Date, tz: string = BLOSSOM_TZ): number {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return NaN;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).formatToParts(d);
  const w = parts.find((p) => p.type === "weekday")?.value ?? "";
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[w] ?? NaN;
}

/**
 * True when the call occurred outside 8am-6pm America/New_York, Mon-Fri.
 * Weekends are always after-hours.
 */
export function isAfterHoursEastern(iso: string | Date): boolean {
  const h = hourInTimeZone(iso, BLOSSOM_TZ);
  const w = weekdayInTimeZone(iso, BLOSSOM_TZ);
  if (!Number.isFinite(h) || !Number.isFinite(w)) return false;
  if (w === 0 || w === 6) return true;
  return h < 8 || h >= 18;
}