/**
 * Phase 2A — hour-based authorization utilization with honest proration.
 *
 * Two problems this module exists to solve:
 *
 * 1. **Window mismatch.** An authorization covering Jan–Jun compared against a
 *    March-only filter is not 100%-utilizable in March. We prorate the
 *    authorized hours by the overlap between the authorization window and the
 *    selected date range, and we say what factor we used.
 *
 * 2. **Identity.** Worked hours are joined to an authorization by
 *    CentralReach id first (authorization id, then client CR id) and only fall
 *    back to a normalized client name when no id exists on either side. The
 *    basis used is reported per row so nobody has to guess.
 *
 * When the inputs cannot support a number (no authorized hours, no coverage
 * dates, nothing joined), the row carries an explicit data state instead of a
 * fabricated percentage.
 */
import { pickNumber, pickText } from "../tolerant";
import { cleanReasonText } from "../scheduleTruth";
import { endDateOf, startDateOf, daysBetween, type ContinuityAuthRow } from "./authorizationContinuity";

export interface ProrationBillingRow {
  id?: string;
  date_of_service?: string | null;
  hours?: number | null;
  client_name?: string | null;
  client_cr_id?: string | null;
  procedure_code?: string | null;
  payor?: string | null;
  state?: string | null;
}

export type JoinBasis =
  | "authorization_id"
  | "client_cr_id"
  | "client_name"
  | "none";

export interface JoinKey {
  key: string;
  basis: JoinBasis;
}

export function normalizeName(value: string | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Id-first join key for an authorization row. */
export function authorizationJoinKey(row: ContinuityAuthRow): JoinKey {
  const authId = cleanReasonText(row.authorization_id);
  if (authId) return { key: `auth:${authId.toLowerCase()}`, basis: "authorization_id" };
  const crId = cleanReasonText(row.client_cr_id);
  if (crId) return { key: `crid:${crId.toLowerCase()}`, basis: "client_cr_id" };
  const name = normalizeName(row.client_name);
  if (name) return { key: `name:${name}`, basis: "client_name" };
  return { key: "", basis: "none" };
}

/**
 * Id-first join key for a billing fact. CentralReach billing exports only
 * sometimes carry an authorization id, so it is read tolerantly from the raw
 * payload before falling back to the client CR id and finally the name.
 */
export function billingJoinKeys(row: ProrationBillingRow): JoinKey[] {
  const keys: JoinKey[] = [];
  const authId = pickText(row as unknown as Record<string, unknown>, [
    "authorization_id",
    "authorizationId",
    "authorization_number",
    "auth_id",
    "auth_number",
  ]);
  if (cleanReasonText(authId)) {
    keys.push({ key: `auth:${authId.toLowerCase()}`, basis: "authorization_id" });
  }
  const crId = cleanReasonText(row.client_cr_id);
  if (crId) keys.push({ key: `crid:${crId.toLowerCase()}`, basis: "client_cr_id" });
  const name = normalizeName(row.client_name);
  if (name) keys.push({ key: `name:${name}`, basis: "client_name" });
  return keys;
}

export interface WorkedIndexEntry {
  hours: number;
  sessions: number;
}

/**
 * Sum worked hours per join key, limited to the selected window. A billing row
 * is indexed under every key it can supply so the authorization side can pick
 * its most specific available match.
 */
export function buildWorkedHoursIndex(
  billing: ProrationBillingRow[],
  window: { from?: string; to?: string } = {},
): Map<string, WorkedIndexEntry> {
  const index = new Map<string, WorkedIndexEntry>();
  for (const row of billing) {
    const date = String(row.date_of_service ?? "").slice(0, 10);
    if (window.from && date && date < window.from) continue;
    if (window.to && date && date > window.to) continue;
    const hours = pickNumber(row as unknown as Record<string, unknown>, [
      "hours",
      "units_hours",
      "billed_hours",
    ]);
    for (const { key } of billingJoinKeys(row)) {
      if (!key) continue;
      if (!index.has(key)) index.set(key, { hours: 0, sessions: 0 });
      const entry = index.get(key)!;
      entry.hours += Number.isFinite(hours) ? hours : 0;
      entry.sessions += 1;
    }
  }
  return index;
}

export interface ProrationWindow {
  authDays: number | null;
  overlapDays: number;
  factor: number | null;
  /** True when the authorization window is fully inside the selected range. */
  fullyInRange: boolean;
}

/**
 * Overlap between an authorization coverage window and the selected filter
 * range. `factor` is null when the authorization has no usable window, which
 * forces the caller into an explicit "cannot prorate" state.
 */
export function prorationWindow(
  authStart: string | null,
  authEnd: string | null,
  from?: string,
  to?: string,
): ProrationWindow {
  if (!authStart || !authEnd) {
    return { authDays: null, overlapDays: 0, factor: null, fullyInRange: false };
  }
  const authDays = (daysBetween(authStart, authEnd) ?? -1) + 1;
  if (authDays <= 0) {
    return { authDays: null, overlapDays: 0, factor: null, fullyInRange: false };
  }
  if (!from && !to) {
    return { authDays, overlapDays: authDays, factor: 1, fullyInRange: true };
  }
  const start = from && from > authStart ? from : authStart;
  const end = to && to < authEnd ? to : authEnd;
  const overlap = (daysBetween(start, end) ?? -1) + 1;
  const overlapDays = overlap > 0 ? overlap : 0;
  return {
    authDays,
    overlapDays,
    factor: Math.round((overlapDays / authDays) * 10000) / 10000,
    fullyInRange: overlapDays === authDays,
  };
}

export type UtilizationDataState =
  | "ok"
  | "no_authorized_hours"
  | "no_coverage_dates"
  | "no_worked_hours_joined"
  | "outside_range";

export const UTILIZATION_DATA_STATE_LABELS: Record<UtilizationDataState, string> = {
  ok: "Complete",
  no_authorized_hours: "No authorized hours on the snapshot",
  no_coverage_dates: "No coverage dates — cannot prorate",
  no_worked_hours_joined: "No worked hours joined to this authorization",
  outside_range: "Coverage does not overlap the selected range",
};

export interface ProratedUtilizationRow {
  key: string;
  authorizationNumber: string;
  client: string;
  clientCrId: string;
  payor: string;
  state: string;
  code: string;
  startDate: string | null;
  endDate: string | null;
  authorizedHours: number | null;
  proratedAuthorizedHours: number | null;
  prorationFactor: number | null;
  overlapDays: number;
  coverageDays: number | null;
  /** Hours CentralReach reports as worked on the authorization snapshot. */
  sourceUsedHours: number | null;
  /** Hours recomputed from billing facts joined to this authorization. */
  recomputedUsedHours: number | null;
  joinBasis: JoinBasis;
  joinedSessions: number;
  varianceHours: number | null;
  utilizationPct: number | null;
  remainingHours: number | null;
  daysToExpiry: number | null;
  dataState: UtilizationDataState;
  note: string;
}

export interface ProratedUtilizationTotals {
  authorizations: number;
  authorizedHours: number;
  proratedAuthorizedHours: number;
  sourceUsedHours: number;
  recomputedUsedHours: number;
  varianceHours: number;
  variancePct: number | null;
  utilizationPct: number | null;
  complete: number;
  incomplete: number;
}

export interface ProratedUtilizationResult {
  rows: ProratedUtilizationRow[];
  totals: ProratedUtilizationTotals;
  dataStateCounts: Record<UtilizationDataState, number>;
  joinBasisCounts: Record<JoinBasis, number>;
  /** True when the selected range narrows at least one authorization window. */
  prorationApplied: boolean;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function computeProratedUtilization(
  auths: ContinuityAuthRow[],
  billing: ProrationBillingRow[],
  options: { from?: string; to?: string; today?: string } = {},
): ProratedUtilizationResult {
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const worked = buildWorkedHoursIndex(billing, { from: options.from, to: options.to });

  const rows: ProratedUtilizationRow[] = [];
  const dataStateCounts: Record<UtilizationDataState, number> = {
    ok: 0,
    no_authorized_hours: 0,
    no_coverage_dates: 0,
    no_worked_hours_joined: 0,
    outside_range: 0,
  };
  const joinBasisCounts: Record<JoinBasis, number> = {
    authorization_id: 0,
    client_cr_id: 0,
    client_name: 0,
    none: 0,
  };

  let authorizedTotal = 0;
  let proratedTotal = 0;
  let sourceUsedTotal = 0;
  let recomputedTotal = 0;
  let prorationApplied = false;

  auths.forEach((auth, index) => {
    const start = startDateOf(auth);
    const end = endDateOf(auth);
    const window = prorationWindow(start, end, options.from, options.to);
    if (window.factor != null && window.factor < 1) prorationApplied = true;

    const authorized = Number.isFinite(Number(auth.authorized_hours))
      ? Number(auth.authorized_hours)
      : null;
    const sourceUsed = Number.isFinite(Number(auth.worked_hours))
      ? Number(auth.worked_hours)
      : null;

    const join = authorizationJoinKey(auth);
    const match = join.key ? worked.get(join.key) : undefined;
    const recomputed = match ? round1(match.hours) : null;
    const basis: JoinBasis = match ? join.basis : "none";
    joinBasisCounts[basis] += 1;

    const prorated =
      authorized != null && window.factor != null ? round1(authorized * window.factor) : null;

    let dataState: UtilizationDataState = "ok";
    if (window.factor != null && window.overlapDays === 0) dataState = "outside_range";
    else if (authorized == null || authorized === 0) dataState = "no_authorized_hours";
    else if (window.factor == null) dataState = "no_coverage_dates";
    else if (recomputed == null && sourceUsed == null) dataState = "no_worked_hours_joined";
    dataStateCounts[dataState] += 1;

    const denominator = prorated ?? authorized;
    const numerator = recomputed ?? sourceUsed;
    const utilizationPct =
      denominator && denominator > 0 && numerator != null
        ? Math.round((numerator / denominator) * 1000) / 10
        : null;

    if (dataState !== "outside_range") {
      if (authorized != null) authorizedTotal += authorized;
      if (prorated != null) proratedTotal += prorated;
      if (sourceUsed != null) sourceUsedTotal += sourceUsed;
      if (recomputed != null) recomputedTotal += recomputed;
    }

    rows.push({
      key: `${auth.authorization_id ?? auth.authorization_number ?? auth.id ?? "auth"}-${index}`,
      authorizationNumber: (auth.authorization_number ?? "").trim() || "Not numbered",
      client: (auth.client_name ?? "").trim() || "Unknown client",
      clientCrId: (auth.client_cr_id ?? "").trim(),
      payor: (auth.payor ?? "").trim() || "Unknown",
      state: (auth.state ?? "").trim() || "Unknown",
      code:
        cleanReasonText(auth.procedure_code) ?? cleanReasonText(auth.service_codes) ?? "Not specified",
      startDate: start,
      endDate: end,
      authorizedHours: authorized != null ? round1(authorized) : null,
      proratedAuthorizedHours: prorated,
      prorationFactor: window.factor,
      overlapDays: window.overlapDays,
      coverageDays: window.authDays,
      sourceUsedHours: sourceUsed != null ? round1(sourceUsed) : null,
      recomputedUsedHours: recomputed,
      joinBasis: basis,
      joinedSessions: match?.sessions ?? 0,
      varianceHours:
        recomputed != null && sourceUsed != null ? round1(recomputed - sourceUsed) : null,
      utilizationPct,
      remainingHours:
        denominator != null && numerator != null ? round1(denominator - numerator) : null,
      daysToExpiry: end ? daysBetween(today, end) : null,
      dataState,
      note:
        dataState === "ok"
          ? window.factor != null && window.factor < 1
            ? `Authorized hours prorated to ${Math.round(window.factor * 1000) / 10}% of the coverage window (${window.overlapDays} of ${window.authDays} days in range).`
            : "Full authorization window is inside the selected range."
          : UTILIZATION_DATA_STATE_LABELS[dataState],
    });
  });

  const proratedDenominator = proratedTotal || authorizedTotal;
  const usedNumerator = recomputedTotal || sourceUsedTotal;

  return {
    rows: rows.sort(
      (a, b) =>
        (b.utilizationPct ?? -1) - (a.utilizationPct ?? -1) ||
        (a.daysToExpiry ?? 9999) - (b.daysToExpiry ?? 9999),
    ),
    totals: {
      authorizations: auths.length,
      authorizedHours: round1(authorizedTotal),
      proratedAuthorizedHours: round1(proratedTotal),
      sourceUsedHours: round1(sourceUsedTotal),
      recomputedUsedHours: round1(recomputedTotal),
      varianceHours: round1(recomputedTotal - sourceUsedTotal),
      variancePct: sourceUsedTotal
        ? Math.round(((recomputedTotal - sourceUsedTotal) / sourceUsedTotal) * 1000) / 10
        : null,
      utilizationPct:
        proratedDenominator > 0
          ? Math.round((usedNumerator / proratedDenominator) * 1000) / 10
          : null,
      complete: dataStateCounts.ok,
      incomplete: auths.length - dataStateCounts.ok,
    },
    dataStateCounts,
    joinBasisCounts,
    prorationApplied,
  };
}
