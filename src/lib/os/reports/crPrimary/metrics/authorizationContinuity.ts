/**
 * Phase 2A — Authorization continuity + renewal risk from the CentralReach
 * authorization snapshot (`v_cr_authorization_current`).
 *
 * The snapshot tells us what coverage exists today. It does NOT tell us
 * whether services actually stopped, so a coverage gap is reported as
 * "Needs confirmation" — never as a confirmed service pause. Only a logged
 * pause event can confirm that.
 */
import { cleanReasonText } from "../scheduleTruth";

import { localIsoDate } from "../reportWindow";
import { buildClientIdentityResolver } from "./clientIdentity";
import { finiteNumberOrNull } from "./numeric";
import { strictDay, strictDaysBetween } from "./calendarDate";

export interface ContinuityAuthRow {
  id?: string;
  authorization_id?: string | null;
  authorization_number?: string | null;
  client_name?: string | null;
  client_cr_id?: string | null;
  payor?: string | null;
  state?: string | null;
  procedure_code?: string | null;
  service_codes?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  followup_start_date?: string | null;
  followup_end_date?: string | null;
  is_active?: boolean | null;
  status?: string | null;
  authorized_hours?: number | null;
  worked_hours?: number | null;
  remaining_hours?: number | null;
}

export const EXPIRING_WINDOWS = [
  { key: "0_14", label: "Expires ≤ 14 days", maxDays: 14 },
  { key: "15_30", label: "Expires 15–30 days", maxDays: 30 },
  { key: "31_60", label: "Expires 31–60 days", maxDays: 60 },
] as const;

export type ExpiringWindowKey = (typeof EXPIRING_WINDOWS)[number]["key"];

export type ContinuityState =
  | "active"
  | "expiring"
  | "expired"
  | "not_started"
  | "unknown_dates";

export interface ContinuityRow {
  key: string;
  authorizationNumber: string;
  client: string;
  clientCrId: string;
  payor: string;
  state: string;
  code: string;
  startDate: string | null;
  endDate: string | null;
  daysToExpiry: number | null;
  continuity: ContinuityState;
  window: ExpiringWindowKey | null;
  authorizedHours: number | null;
  usedHours: number | null;
  remainingHours: number | null;
  /** Renewal readiness is never asserted — the snapshot can't prove it. */
  renewal: "needs_confirmation" | "no_action" | "overdue";
  note: string;
}

export interface ContinuityMetrics {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  unknownDates: number;
  authorizedHours: number;
  usedHours: number;
  remainingHours: number;
  byWindow: { key: ExpiringWindowKey; label: string; value: number }[];
  rows: ContinuityRow[];
  /** Clients with zero active coverage today — needs confirmation, not a fact. */
  clientsWithoutCoverage: CoverageGapRow[];
}

/**
 * One row per resolved client identity. A gap exists only when the client has
 * no current coverage anywhere in the snapshot AND the latest known valid end
 * date is strictly before today.
 */
export interface CoverageGapRow {
  clientKey: string;
  client: string;
  clientCrId: string;
  state: string;
  payor: string;
  lastEnd: string | null;
  note: string;
}

/**
 * Legacy helpers kept for compatibility. They now only ever return a real
 * calendar date; row classification no longer relies on them, because mixing
 * a follow-up end with an unrelated base start manufactures coverage.
 */
export function endDateOf(row: ContinuityAuthRow): string | null {
  return (
    validDay(row.followup_end_date) ?? validDay(row.actual_end_date) ?? validDay(row.end_date)
  );
}

export function startDateOf(row: ContinuityAuthRow): string | null {
  return (
    validDay(row.actual_start_date) ?? validDay(row.start_date) ?? validDay(row.followup_start_date)
  );
}

export function daysBetween(from: string, to: string): number | null {
  return strictDaysBetween(from, to);
}

/** Strict: a blank/boolean/invalid hour value stays missing, never zero. */
function num(v: unknown): number | null {
  return finiteNumberOrNull(v);
}

/**
 * Strict day read: a blank, malformed or impossible source date (2026-02-31)
 * is not a date, so it can never create coverage or a day count.
 */
const validDay = (v: unknown): string | null =>
  strictDay(cleanReasonText(v as string | null | undefined));

/**
 * Matched start/end pairs only. Combining a follow-up future end date with an
 * unrelated current start date would manufacture coverage that no single
 * authorization actually provides.
 */
function datePairs(row: ContinuityAuthRow): { start: string | null; end: string | null }[] {
  return [
    { start: validDay(row.actual_start_date), end: validDay(row.actual_end_date) },
    { start: validDay(row.start_date), end: validDay(row.end_date) },
    { start: validDay(row.followup_start_date), end: validDay(row.followup_end_date) },
  ].filter((p) => p.start || p.end);
}

/** Conservative current-coverage test for a single authorization row. */
export function hasCurrentCoverage(row: ContinuityAuthRow, today: string): boolean {
  if (row.is_active === false) return false;
  return datePairs(row).some((p) => {
    if (!p.end) return false;
    if (p.end < today) return false;
    if (p.start && p.start > today) return false;
    return true;
  });
}

/** Latest valid end date documented anywhere on the row. */
export function latestEndOf(row: ContinuityAuthRow): string | null {
  let latest: string | null = null;
  for (const p of datePairs(row)) {
    if (p.end && (!latest || p.end > latest)) latest = p.end;
  }
  return latest;
}

export function computeAuthorizationContinuity(
  rows: ContinuityAuthRow[],
  today = localIsoDate(),
): ContinuityMetrics {
  const out: ContinuityRow[] = [];
  const windowCounts = new Map<ExpiringWindowKey, number>();
  let authorizedHours = 0;
  let usedHours = 0;
  let remainingHours = 0;
  let active = 0;
  let expiring = 0;
  let expired = 0;
  let unknown = 0;

  // Client identity is resolved across the FULL snapshot before grouping, so
  // gap output never depends on row order and id-less rows never split.
  const identity = buildClientIdentityResolver(rows);

  const clientCoverage = new Map<
    string,
    {
      clientKey: string;
      client: string;
      clientCrId: string;
      state: string;
      payor: string;
      anyCurrent: boolean;
      lastEnd: string | null;
    }
  >();

  rows.forEach((row, index) => {
    const start = startDateOf(row);
    const end = endDateOf(row);
    const authorized = num(row.authorized_hours);
    const used = num(row.worked_hours);
    const remaining =
      num(row.remaining_hours) ??
      (authorized != null && used != null ? Math.round((authorized - used) * 100) / 100 : null);
    if (authorized != null) authorizedHours += authorized;
    if (used != null) usedHours += used;
    if (remaining != null) remainingHours += remaining;

    const daysToExpiry = end ? daysBetween(today, end) : null;
    let continuity: ContinuityState;
    if (!end) {
      continuity = "unknown_dates";
      unknown += 1;
    } else if (daysToExpiry != null && daysToExpiry < 0) {
      continuity = "expired";
      expired += 1;
    } else if (start && daysBetween(today, start) != null && daysBetween(today, start)! > 0) {
      continuity = "not_started";
    } else if (daysToExpiry != null && daysToExpiry <= 60) {
      continuity = "expiring";
      expiring += 1;
      active += 1;
    } else {
      continuity = "active";
      active += 1;
    }

    const window =
      continuity === "expiring" && daysToExpiry != null
        ? (EXPIRING_WINDOWS.find((w) => daysToExpiry <= w.maxDays)?.key ?? null)
        : null;
    if (window) windowCounts.set(window, (windowCounts.get(window) ?? 0) + 1);

    const client = (row.client_name ?? "").trim() || "Unknown client";
    const clientCrId = (row.client_cr_id ?? "").trim();
    const clientKey = identity.keyFor(clientCrId, client);
    if (!clientCoverage.has(clientKey)) {
      clientCoverage.set(clientKey, {
        clientKey,
        client,
        clientCrId,
        state: (row.state ?? "").trim() || "Unknown",
        payor: (row.payor ?? "").trim() || "Unknown",
        anyCurrent: false,
        lastEnd: null,
      });
    }
    const coverage = clientCoverage.get(clientKey)!;
    if (!coverage.clientCrId && clientCrId) coverage.clientCrId = clientCrId;
    if (hasCurrentCoverage(row, today)) coverage.anyCurrent = true;
    const rowLatestEnd = latestEndOf(row);
    if (rowLatestEnd && (!coverage.lastEnd || rowLatestEnd > coverage.lastEnd)) {
      coverage.lastEnd = rowLatestEnd;
    }

    const renewal: ContinuityRow["renewal"] =
      continuity === "expired"
        ? "overdue"
        : continuity === "expiring"
          ? "needs_confirmation"
          : "no_action";

    out.push({
      key: `${row.authorization_id ?? row.authorization_number ?? row.id ?? "auth"}-${index}`,
      authorizationNumber: (row.authorization_number ?? "").trim() || "Not numbered",
      client,
      clientCrId: (row.client_cr_id ?? "").trim(),
      payor: (row.payor ?? "").trim() || "Unknown",
      state: (row.state ?? "").trim() || "Unknown",
      code:
        cleanReasonText(row.procedure_code) ?? cleanReasonText(row.service_codes) ?? "Not specified",
      startDate: start,
      endDate: end,
      daysToExpiry,
      continuity,
      window,
      authorizedHours: authorized,
      usedHours: used,
      remainingHours: remaining,
      renewal,
      note:
        continuity === "unknown_dates"
          ? "No end date on the CentralReach snapshot — confirm coverage in CentralReach."
          : continuity === "expired"
            ? `Coverage ended ${end}. Confirm whether a renewal was submitted.`
            : continuity === "expiring"
              ? `Coverage ends ${end}${daysToExpiry != null ? ` (${daysToExpiry} days)` : ""}.`
              : "Coverage active on the latest snapshot.",
    });
  });

  const clientsWithoutCoverage: CoverageGapRow[] = [...clientCoverage.values()]
    // Not-started/future-only rows, unknown dates and an end date of today are
    // never gap candidates: the latest known end must be strictly in the past.
    .filter((c) => !c.anyCurrent && c.lastEnd != null && c.lastEnd < today)
    .map((c) => ({
      clientKey: c.clientKey,
      client: c.client,
      clientCrId: c.clientCrId,
      state: c.state,
      payor: c.payor,
      lastEnd: c.lastEnd,
      note: "No active authorization on the latest snapshot — needs confirmation, not a confirmed service pause.",
    }))
    .sort((a, b) => (b.lastEnd ?? "").localeCompare(a.lastEnd ?? ""));

  const riskRank: Record<ContinuityState, number> = {
    expired: 4,
    expiring: 3,
    unknown_dates: 2,
    active: 1,
    not_started: 0,
  };

  return {
    total: rows.length,
    active,
    expiringSoon: expiring,
    expired,
    unknownDates: unknown,
    authorizedHours: Math.round(authorizedHours * 10) / 10,
    usedHours: Math.round(usedHours * 10) / 10,
    remainingHours: Math.round(remainingHours * 10) / 10,
    byWindow: EXPIRING_WINDOWS.map((w) => ({
      key: w.key,
      label: w.label,
      value: windowCounts.get(w.key) ?? 0,
    })),
    rows: out.sort(
      (a, b) =>
        riskRank[b.continuity] - riskRank[a.continuity] ||
        (a.daysToExpiry ?? 9999) - (b.daysToExpiry ?? 9999),
    ),
    clientsWithoutCoverage,
  };
}
