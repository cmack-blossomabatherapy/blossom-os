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
import {
  assessUtilizationRisk,
  numOrNull,
  type SnapshotWindowMode,
  type UtilizationRiskLevel,
} from "./authorizationUtilizationScope";

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
  | "unique_fallback"
  | "ambiguous"
  | "none";

export function normalizeName(value: string | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export interface WorkedIndexEntry {
  hours: number;
  sessions: number;
}

/** How a billing row was allocated to an authorization (or why it was not). */
export type AllocationBasis =
  | "authorization_id"
  | "unique_fallback"
  | "ambiguous"
  | "unjoined";

export interface AllocationCounts {
  exact: number;
  uniqueFallback: number;
  ambiguous: number;
  unjoined: number;
}

/** Per-billing-row allocation provenance, so trends can use only clean rows. */
export interface BillingAllocationRow {
  /** Billing row id when present, else a synthetic index key. */
  key: string;
  date: string | null;
  hours: number;
  client: string;
  code: string | null;
  basis: AllocationBasis;
  /** Authorization slot the hours landed in; null for ambiguous/unjoined rows. */
  slotKey: string | null;
}

export interface BillingAllocation {
  /** Every billing row considered, with the basis it was allocated on. */
  allocations: BillingAllocationRow[];
  /** Worked hours per authorization slot key. Each billing row lands in ≤ 1 slot. */
  bySlot: Map<string, WorkedIndexEntry>;
  /** How each allocated slot was matched, for provenance in the UI. */
  slotBasis: Map<string, AllocationBasis>;
  counts: AllocationCounts;
}

/** Stable per-authorization slot key — never shared between two authorizations. */
export function authorizationSlotKey(row: ContinuityAuthRow, index: number): string {
  return `slot:${index}:${cleanReasonText(row.authorization_id) ?? cleanReasonText(row.authorization_number) ?? "unnumbered"}`;
}

const normalizeCodeText = (value: string | null | undefined): string =>
  String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Every service code an authorization covers; empty means "covers anything". */
export function authorizationCodeSet(row: ContinuityAuthRow): Set<string> {
  const raw = `${row.procedure_code ?? ""},${row.service_codes ?? ""}`;
  const codes = raw
    .split(/[,;/|]+/)
    .map((c) => normalizeCodeText(c))
    .filter(Boolean);
  return new Set(codes);
}

/** A billing code is compatible when the authorization lists it, or lists nothing. */
export function codesCompatible(
  authCodes: Set<string>,
  billingCode: string | null | undefined,
): boolean {
  if (authCodes.size === 0) return true;
  const code = normalizeCodeText(billingCode);
  if (!code) return false;
  for (const c of authCodes) if (c === code || c.includes(code) || code.includes(c)) return true;
  return false;
}

/** Authorization id carried by a billing fact, when CentralReach exported one. */
export function billingAuthorizationId(row: ProrationBillingRow): string {
  const authId = pickText(row as unknown as Record<string, unknown>, [
    "authorization_id",
    "authorizationId",
    "authorization_number",
    "auth_id",
    "auth_number",
  ]);
  return (cleanReasonText(authId) ?? "").toLowerCase();
}

function billingHoursOf(row: ProrationBillingRow): number {
  const hours = pickNumber(row as unknown as Record<string, unknown>, [
    "hours",
    "units_hours",
    "billed_hours",
  ]);
  return Number.isFinite(hours) ? hours : 0;
}

/**
 * Allocate every billing row to **at most one** authorization.
 *
 * 1. Exact `AuthorizationId` wins outright.
 * 2. Otherwise candidates are authorizations for the same client (CR id, or
 *    normalized name only when no client id exists on either side) whose service
 *    codes are compatible and whose coverage window contains the date of service.
 * 3. That fallback is only used when exactly one candidate survives — ambiguous
 *    rows stay unjoined so a client-level total is never copied onto every
 *    authorization that client has.
 */
export function allocateBillingToAuthorizations(
  auths: ContinuityAuthRow[],
  billing: ProrationBillingRow[],
  window: { from?: string; to?: string } = {},
): BillingAllocation {
  const bySlot = new Map<string, WorkedIndexEntry>();
  const slotBasis = new Map<string, AllocationBasis>();
  const allocations: BillingAllocationRow[] = [];
  const counts: AllocationCounts = { exact: 0, uniqueFallback: 0, ambiguous: 0, unjoined: 0 };

  interface Slot {
    key: string;
    authId: string;
    crId: string;
    name: string;
    codes: Set<string>;
    start: string | null;
    end: string | null;
  }

  const slots: Slot[] = auths.map((auth, index) => ({
    key: authorizationSlotKey(auth, index),
    authId: (cleanReasonText(auth.authorization_id) ?? cleanReasonText(auth.authorization_number) ?? "").toLowerCase(),
    crId: (cleanReasonText(auth.client_cr_id) ?? "").toLowerCase(),
    name: normalizeName(auth.client_name),
    codes: authorizationCodeSet(auth),
    start: startDateOf(auth),
    end: endDateOf(auth),
  }));

  const byAuthId = new Map<string, Slot[]>();
  for (const slot of slots) {
    if (!slot.authId) continue;
    if (!byAuthId.has(slot.authId)) byAuthId.set(slot.authId, []);
    byAuthId.get(slot.authId)!.push(slot);
  }

  const add = (key: string, hours: number, basis: AllocationBasis) => {
    if (!bySlot.has(key)) bySlot.set(key, { hours: 0, sessions: 0 });
    const entry = bySlot.get(key)!;
    entry.hours += hours;
    entry.sessions += 1;
    // Exact provenance is never downgraded by a later fallback allocation.
    if (basis === "authorization_id" || !slotBasis.has(key)) slotBasis.set(key, basis);
  };

  billing.forEach((row, rowIndex) => {
    const date = String(row.date_of_service ?? "").slice(0, 10) || null;
    // A billing row inside a selected window must have a usable date of
    // service; an undated row cannot be proven to belong to the window.
    if (window.from || window.to) {
      if (!date) return;
      if (window.from && date < window.from) return;
      if (window.to && date > window.to) return;
    }
    const hours = billingHoursOf(row);
    const record = (basis: AllocationBasis, slotKey: string | null) => {
      allocations.push({
        key: String(row.id ?? `row-${rowIndex}`),
        date,
        hours,
        client: String(row.client_name ?? "").trim() || "Unknown client",
        code: row.procedure_code ?? null,
        basis,
        slotKey,
      });
    };

    const authId = billingAuthorizationId(row);
    const exact = authId ? byAuthId.get(authId) : undefined;
    if (exact && exact.length === 1) {
      counts.exact += 1;
      add(exact[0].key, hours, "authorization_id");
      record("authorization_id", exact[0].key);
      return;
    }
    if (exact && exact.length > 1) {
      counts.ambiguous += 1;
      record("ambiguous", null);
      return;
    }

    const crId = (cleanReasonText(row.client_cr_id) ?? "").toLowerCase();
    const name = normalizeName(row.client_name);
    const candidates = slots.filter((slot) => {
      const sameClient = crId
        ? slot.crId === crId
        : name
          ? !slot.crId && slot.name === name
          : false;
      if (!sameClient) return false;
      if (!codesCompatible(slot.codes, row.procedure_code)) return false;
      if (!date) return false;
      if (slot.start && date < slot.start) return false;
      if (slot.end && date > slot.end) return false;
      return true;
    });

    if (candidates.length === 1) {
      counts.uniqueFallback += 1;
      add(candidates[0].key, hours, "unique_fallback");
      record("unique_fallback", candidates[0].key);
    } else if (candidates.length > 1) {
      counts.ambiguous += 1;
      record("ambiguous", null);
    } else {
      counts.unjoined += 1;
      record("unjoined", null);
    }
  });

  return { allocations, bySlot, slotBasis, counts };
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

export const JOIN_BASIS_LABELS: Record<JoinBasis, string> = {
  authorization_id: "Matched on authorization id",
  unique_fallback: "Matched on client, code, and date (single candidate)",
  ambiguous: "Ambiguous — hours held back",
  none: "No billing joined",
};

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
  /** Remaining hours as the snapshot reports them, for the selected window. */
  sourceRemainingHours: number | null;
  /** Scheduled (not yet billed) hours from the snapshot for the window. */
  scheduledHours: number | null;
  /** Pending (billed, not yet reconciled) hours from the snapshot. */
  pendingHours: number | null;
  /** Which snapshot hour variant these window figures came from. */
  snapshotWindow: SnapshotWindowMode;
  expiringWithin30: boolean;
  expiringWithin60: boolean;
  /** used + scheduled + pending. */
  projectedDemandHours: number | null;
  /** Used hours as a percentage of prorated authorized hours. */
  utilizationPacePct: number | null;
  riskLevel: UtilizationRiskLevel;
  riskReasons: string[];
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
  sourceRemainingHours: number | null;
  scheduledHours: number | null;
  pendingHours: number | null;
  projectedDemandHours: number | null;
  exhausted: number;
  exhaustionRisk: number;
  expiringWithin30: number;
  expiringWithin60: number;
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
  /** Billing-row allocation provenance, surfaced as data-quality warnings. */
  allocation: AllocationCounts;
  /** True when the selected range narrows at least one authorization window. */
  prorationApplied: boolean;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function computeProratedUtilization(
  auths: ContinuityAuthRow[],
  billing: ProrationBillingRow[],
  options: {
    from?: string;
    to?: string;
    today?: string;
    /** Which snapshot hour variant the selected window may honestly use. */
    snapshotWindow?: SnapshotWindowMode;
  } = {},
): ProratedUtilizationResult {
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const snapshotWindow: SnapshotWindowMode = options.snapshotWindow ?? "unavailable";
  const allocation = allocateBillingToAuthorizations(auths, billing, {
    from: options.from,
    to: options.to,
  });

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
    unique_fallback: 0,
    ambiguous: 0,
    none: 0,
  };

  let authorizedTotal = 0;
  let proratedTotal = 0;
  let sourceUsedTotal = 0;
  let recomputedTotal = 0;
  let remainingTotal: number | null = null;
  let scheduledTotal: number | null = null;
  let pendingTotal: number | null = null;
  let prorationApplied = false;

  auths.forEach((auth, index) => {
    const start = startDateOf(auth);
    const end = endDateOf(auth);
    const window = prorationWindow(start, end, options.from, options.to);
    if (window.factor != null && window.factor < 1) prorationApplied = true;

    // `numOrNull` (never `Number(...)`) so an absent source field stays null
    // instead of being documented as a real zero.
    const row = auth as unknown as Record<string, unknown>;
    const suffix = snapshotWindow === "month" ? "_month" : snapshotWindow === "auth_range" ? "_auth_range" : null;
    const windowField = (base: string): number | null =>
      suffix ? numOrNull(row[`${base}${suffix}`]) : null;

    const authorized = windowField("authorized_hours") ?? numOrNull(auth.authorized_hours);
    const sourceUsed = windowField("worked_hours") ?? numOrNull(auth.worked_hours);
    const sourceRemaining = windowField("remaining_hours") ?? numOrNull(auth.remaining_hours);
    const scheduled = windowField("scheduled_hours");
    const pending = windowField("pending_hours");

    const slotKey = authorizationSlotKey(auth, index);
    const match = allocation.bySlot.get(slotKey);
    // A legitimate zero must survive: only a missing allocation is null.
    const recomputed = match ? round1(match.hours) : null;
    const basis: JoinBasis = match
      ? ((allocation.slotBasis.get(slotKey) ?? "none") as JoinBasis)
      : "none";
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
    // `??` (never `||`) so a recomputed 0 is reported as 0, not swapped for the
    // CentralReach-reported figure.
    const numerator = recomputed ?? sourceUsed;
    const utilizationPct =
      denominator && denominator > 0 && numerator != null
        ? Math.round((numerator / denominator) * 1000) / 10
        : null;

    const expiringDays = end ? daysBetween(today, end) : null;
    const risk = assessUtilizationRisk({
      proratedAuthorizedHours: prorated ?? authorized,
      usedHours: numerator,
      scheduledHours: scheduled,
      pendingHours: pending,
      remainingHours:
        sourceRemaining ??
        (denominator != null && numerator != null ? round1(denominator - numerator) : null),
      utilizationPct,
      daysToExpiry: expiringDays,
    });

    if (dataState !== "outside_range") {
      if (authorized != null) authorizedTotal += authorized;
      if (sourceRemaining != null) remainingTotal = (remainingTotal ?? 0) + sourceRemaining;
      if (scheduled != null) scheduledTotal = (scheduledTotal ?? 0) + scheduled;
      if (pending != null) pendingTotal = (pendingTotal ?? 0) + pending;
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
      sourceRemainingHours: sourceRemaining != null ? round1(sourceRemaining) : null,
      scheduledHours: scheduled != null ? round1(scheduled) : null,
      pendingHours: pending != null ? round1(pending) : null,
      snapshotWindow,
      expiringWithin30: expiringDays != null && expiringDays >= 0 && expiringDays <= 30,
      expiringWithin60: expiringDays != null && expiringDays >= 0 && expiringDays <= 60,
      projectedDemandHours:
        risk.projectedDemand != null ? round1(risk.projectedDemand) : null,
      utilizationPacePct: utilizationPct,
      riskLevel: risk.level,
      riskReasons: risk.reasons,
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

  // Prorated totals of exactly 0 are real; only an absent prorated basis
  // (no authorization had usable coverage dates) falls back to raw authorized.
  const proratedDenominator = dataStateCounts.no_coverage_dates === auths.length
    ? authorizedTotal
    : proratedTotal;
  const usedNumerator = allocation.counts.exact + allocation.counts.uniqueFallback > 0
    ? recomputedTotal
    : sourceUsedTotal;

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
      sourceRemainingHours: remainingTotal != null ? round1(remainingTotal) : null,
      scheduledHours: scheduledTotal != null ? round1(scheduledTotal) : null,
      pendingHours: pendingTotal != null ? round1(pendingTotal) : null,
      projectedDemandHours: round1(
        usedNumerator + (scheduledTotal ?? 0) + (pendingTotal ?? 0),
      ),
      exhausted: rows.filter((r) => r.riskLevel === "exhausted").length,
      exhaustionRisk: rows.filter((r) => r.riskLevel === "at_risk").length,
      expiringWithin30: rows.filter((r) => r.expiringWithin30).length,
      expiringWithin60: rows.filter((r) => r.expiringWithin60).length,
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
    allocation: allocation.counts,
    prorationApplied,
  };
}
