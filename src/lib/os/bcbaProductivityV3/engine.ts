/**
 * BCBA Productivity — pure calculation engine.
 *
 * Source of truth for hours is CentralReach Data Hub billing rows
 * (`cr_billing_sessions`). Ownership is inferred month-first from BCBA
 * anchor rows only. Client contact labels are never used for ownership.
 *
 * Ownership rules (locked by product):
 *   BCBA anchor row = normalized code does NOT start with 97153
 *                     AND ProviderContactLabels contains "BCBA"
 *                     AND a rendering provider exists.
 *   - A month with exactly one anchor BCBA -> that BCBA owns the whole month.
 *   - A month with several anchor BCBAs -> split by each BCBA's first
 *     same-month anchor date; the earliest owner also covers the start of
 *     the month.
 *   - A month with no anchors -> carry the previous month's final owner
 *     forward.
 *   - Months before the very first anchor -> backfilled with the first
 *     anchored month's first owner (flagged in the Ownership Audit).
 *   - No anchors at all for a client -> Unassigned.
 * 97153 (RBT direct) hours are always credited to the inferred owner on DOS.
 */

import { normalizeUsState, stateFromFreeText } from "./stateNormalization";

/* ---------------- code normalization ---------------- */

export const CODE_FAMILIES = ["97151", "97152", "97153", "97155", "97156"] as const;
export type CodeFamily = (typeof CODE_FAMILIES)[number];

export const CODE_97153 = "97153";
export const CODE_97155 = "97155";

/** Collapse `97153`, `97153 GT`, `97153-KX`, `97153U1`... to `97153`. */
export function normalizeProcedureCode(raw: string | null | undefined): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const compact = s.replace(/[\s-]/g, "").toUpperCase();
  for (const fam of CODE_FAMILIES) {
    if (compact.startsWith(fam)) return fam;
  }
  return s.toUpperCase();
}

export const is97153 = (code: string | null | undefined) =>
  normalizeProcedureCode(code) === CODE_97153;
export const is97155 = (code: string | null | undefined) =>
  normalizeProcedureCode(code) === CODE_97155;

/** Provider labels contain a BCBA token (word-boundary, case-insensitive). */
export function hasBcbaLabel(labels: string | null | undefined): boolean {
  return /(^|[^a-z])bcba([^a-z]|$)/i.test(String(labels ?? ""));
}

export function normalizeKeyName(s: string | null | undefined): string {
  return String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Normalized reporting state for a billing row. CentralReach leaves the
 * state column blank on a meaningful slice of rows, so the location string
 * and the provider contact labels ("BCBA ,Georgia Location") are used as
 * fallbacks. Returns a USPS two-letter code or "".
 */
export function resolveReportState(row: {
  state?: string | null;
  location?: string | null;
  providerLabels?: string | null;
}): string {
  return (
    normalizeUsState(row.state) ||
    stateFromFreeText(row.location) ||
    stateFromFreeText(row.providerLabels) ||
    ""
  );
}

/* ---------------- row types ---------------- */

export interface EngineBillingRow {
  clientId: string;
  clientName: string;
  renderingProvider: string;
  providerLabels: string;
  code: string;
  hours: number;
  date: string; // YYYY-MM-DD
  state: string;
  payor: string;
  location?: string;
}

export type OwnershipReason =
  | "month_anchor"
  | "month_split"
  | "carry_forward"
  | "backfill_earliest"
  | "no_anchor";

export const OWNERSHIP_REASON_LABELS: Record<OwnershipReason, string> = {
  month_anchor: "Single BCBA anchor in month",
  month_split: "Multiple BCBAs in month — split at first anchor date",
  carry_forward: "No anchor this month — prior owner carried forward",
  backfill_earliest: "Before first anchor — earliest owner backfilled",
  no_anchor: "No BCBA anchor found for this client",
};

export interface OwnedBillingRow extends EngineBillingRow {
  normalizedCode: string;
  rawCode: string;
  owner: string | null;
  ownerReason: OwnershipReason;
  isAnchor: boolean;
  clientKey: string;
  monthKey: string;
  rbt: string;
}

export interface OwnershipSegment {
  clientKey: string;
  clientId: string;
  clientName: string;
  monthKey: string;
  bcba: string;
  startDate: string;
  endDate: string | null;
  reason: OwnershipReason;
  anchorCount: number;
}

export interface OwnershipConflictRow {
  clientKey: string;
  clientId: string;
  clientName: string;
  monthKey: string;
  bcbas: { bcba: string; firstAnchorDate: string; anchorHours: number }[];
}

export interface OwnershipGapRow {
  clientKey: string;
  clientId: string;
  clientName: string;
  monthKey: string;
  reason: OwnershipReason;
  hours: number;
  owner: string | null;
}

export interface OwnershipResult {
  rows: OwnedBillingRow[];
  segments: OwnershipSegment[];
  conflicts: OwnershipConflictRow[];
  gaps: OwnershipGapRow[];
  clientsWithoutAnchors: { clientId: string; clientName: string; hours: number }[];
}

const monthOf = (iso: string) => (iso || "").slice(0, 7);
const monthStart = (m: string) => `${m}-01`;
function monthEnd(m: string) {
  const [y, mm] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mm, 0));
  return d.toISOString().slice(0, 10);
}

/* ---------------- ownership inference ---------------- */

export function buildOwnership(rows: EngineBillingRow[]): OwnershipResult {
  interface Bucket {
    clientId: string;
    clientName: string;
    rows: EngineBillingRow[];
  }
  const buckets = new Map<string, Bucket>();
  for (const r of rows) {
    if (!r.date) continue;
    const key = (r.clientId && r.clientId.trim()) || normalizeKeyName(r.clientName);
    if (!key) continue;
    let b = buckets.get(key);
    if (!b) {
      b = { clientId: r.clientId, clientName: r.clientName, rows: [] };
      buckets.set(key, b);
    }
    b.rows.push(r);
    if (!b.clientId && r.clientId) b.clientId = r.clientId;
    if (!b.clientName && r.clientName) b.clientName = r.clientName;
  }

  const outRows: OwnedBillingRow[] = [];
  const segments: OwnershipSegment[] = [];
  const conflicts: OwnershipConflictRow[] = [];
  const gapMap = new Map<string, OwnershipGapRow>();
  const noAnchorClients: { clientId: string; clientName: string; hours: number }[] = [];

  for (const [clientKey, bucket] of buckets) {
    const anchors = bucket.rows.filter(
      (r) =>
        !is97153(r.code) &&
        hasBcbaLabel(r.providerLabels) &&
        !!r.renderingProvider.trim(),
    );

    // Month -> ordered owner segments.
    const monthSegments = new Map<string, OwnershipSegment[]>();
    const anchoredMonths: string[] = [];

    if (anchors.length) {
      const byMonth = new Map<string, EngineBillingRow[]>();
      for (const a of anchors) {
        const m = monthOf(a.date);
        if (!byMonth.has(m)) byMonth.set(m, []);
        byMonth.get(m)!.push(a);
      }
      for (const m of [...byMonth.keys()].sort()) {
        const list = byMonth.get(m)!;
        const perBcba = new Map<string, { firstAnchorDate: string; anchorHours: number }>();
        for (const a of list) {
          const name = a.renderingProvider.trim();
          const cur = perBcba.get(name);
          if (!cur) perBcba.set(name, { firstAnchorDate: a.date, anchorHours: a.hours || 0 });
          else {
            if (a.date < cur.firstAnchorDate) cur.firstAnchorDate = a.date;
            cur.anchorHours += a.hours || 0;
          }
        }
        const ordered = [...perBcba.entries()]
          .map(([bcba, v]) => ({ bcba, ...v }))
          .sort((a, b) =>
            a.firstAnchorDate === b.firstAnchorDate
              ? a.bcba.localeCompare(b.bcba)
              : a.firstAnchorDate.localeCompare(b.firstAnchorDate),
          );
        const reason: OwnershipReason = ordered.length > 1 ? "month_split" : "month_anchor";
        if (ordered.length > 1) {
          conflicts.push({
            clientKey,
            clientId: bucket.clientId,
            clientName: bucket.clientName,
            monthKey: m,
            bcbas: ordered,
          });
        }
        const segs: OwnershipSegment[] = ordered.map((o, i) => ({
          clientKey,
          clientId: bucket.clientId,
          clientName: bucket.clientName,
          monthKey: m,
          bcba: o.bcba,
          // The earliest owner also covers the beginning of the month.
          startDate: i === 0 ? monthStart(m) : o.firstAnchorDate,
          endDate: null,
          reason,
          anchorCount: ordered.length,
        }));
        for (let i = 0; i < segs.length; i++) {
          segs[i].endDate = segs[i + 1]
            ? isoAddDays(segs[i + 1].startDate, -1)
            : monthEnd(m);
        }
        monthSegments.set(m, segs);
        anchoredMonths.push(m);
      }
    }

    // Every month present in the client's billing data.
    const dataMonths = [...new Set(bucket.rows.map((r) => monthOf(r.date)).filter(Boolean))].sort();
    const resolved = new Map<string, OwnershipSegment[]>();
    let lastOwner: string | null = null;
    const firstAnchoredMonth = anchoredMonths[0] ?? null;
    const firstOwner = firstAnchoredMonth
      ? monthSegments.get(firstAnchoredMonth)![0].bcba
      : null;

    for (const m of dataMonths) {
      const segs = monthSegments.get(m);
      if (segs && segs.length) {
        resolved.set(m, segs);
        lastOwner = segs[segs.length - 1].bcba;
        continue;
      }
      if (lastOwner) {
        resolved.set(m, [
          {
            clientKey, clientId: bucket.clientId, clientName: bucket.clientName,
            monthKey: m, bcba: lastOwner,
            startDate: monthStart(m), endDate: monthEnd(m),
            reason: "carry_forward", anchorCount: 0,
          },
        ]);
        continue;
      }
      if (firstOwner) {
        resolved.set(m, [
          {
            clientKey, clientId: bucket.clientId, clientName: bucket.clientName,
            monthKey: m, bcba: firstOwner,
            startDate: monthStart(m), endDate: monthEnd(m),
            reason: "backfill_earliest", anchorCount: 0,
          },
        ]);
        continue;
      }
      resolved.set(m, []);
    }

    for (const segs of resolved.values()) segments.push(...segs);

    let noAnchorHours = 0;
    for (const r of bucket.rows) {
      const m = monthOf(r.date);
      const segs = resolved.get(m) ?? [];
      let owner: string | null = null;
      let reason: OwnershipReason = "no_anchor";
      for (const s of segs) {
        if (r.date >= s.startDate && (!s.endDate || r.date <= s.endDate)) {
          owner = s.bcba;
          reason = s.reason;
        }
      }
      if (!owner && segs.length) {
        // Defensive: date inside the month always matches a segment, but keep
        // the earliest segment as the fallback owner instead of dropping hours.
        owner = segs[0].bcba;
        reason = segs[0].reason;
      }
      if (!owner) noAnchorHours += r.hours || 0;

      const normalizedCode = normalizeProcedureCode(r.code);
      const isDirectRbt = normalizedCode === CODE_97153;
      outRows.push({
        ...r,
        state: resolveReportState(r),
        clientKey,
        monthKey: m,
        normalizedCode,
        rawCode: r.code,
        owner,
        ownerReason: reason,
        isAnchor:
          !isDirectRbt && hasBcbaLabel(r.providerLabels) && !!r.renderingProvider.trim(),
        rbt: isDirectRbt ? r.renderingProvider : "",
      });

      if (reason !== "month_anchor" && reason !== "month_split") {
        const gk = `${clientKey}|${m}`;
        const g = gapMap.get(gk);
        if (g) g.hours += r.hours || 0;
        else
          gapMap.set(gk, {
            clientKey,
            clientId: bucket.clientId,
            clientName: bucket.clientName,
            monthKey: m,
            reason,
            hours: r.hours || 0,
            owner,
          });
      }
    }

    if (!anchors.length) {
      noAnchorClients.push({
        clientId: bucket.clientId,
        clientName: bucket.clientName,
        hours: Math.round(noAnchorHours * 100) / 100,
      });
    }
  }

  outRows.sort((a, b) => a.date.localeCompare(b.date));
  segments.sort(
    (a, b) => a.clientName.localeCompare(b.clientName) || a.startDate.localeCompare(b.startDate),
  );

  return {
    rows: outRows,
    segments,
    conflicts: conflicts.sort(
      (a, b) => a.clientName.localeCompare(b.clientName) || a.monthKey.localeCompare(b.monthKey),
    ),
    gaps: [...gapMap.values()].sort((a, b) => b.hours - a.hours),
    clientsWithoutAnchors: noAnchorClients.sort((a, b) => b.hours - a.hours),
  };
}

export function isoAddDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/* ---------------- filters ---------------- */

export interface BcbaProductivityFilters {
  from: string;
  to: string;
  state: string;
  bcba: string;
  client: string;
  provider: string;
  payor: string;
  code: string;
  location: string;
  search: string;
}

export const EMPTY_FILTERS: BcbaProductivityFilters = {
  from: "", to: "", state: "", bcba: "", client: "", provider: "",
  payor: "", code: "", location: "", search: "",
};

export const UNASSIGNED_LABEL = "— Unassigned —";

const eq = (a: string | null | undefined, b: string) =>
  String(a ?? "").trim().toLowerCase() === b.trim().toLowerCase();

export function matchesFilters(
  row: OwnedBillingRow,
  f: BcbaProductivityFilters,
): boolean {
  if (!inDayRange(row.date, f.from, f.to)) return false;
  if (f.state && !eq(row.state, f.state)) return false;
  if (f.bcba) {
    if (f.bcba === UNASSIGNED_LABEL) {
      if (row.owner) return false;
    } else if (!eq(row.owner ?? "", f.bcba)) return false;
  }
  if (f.client && !eq(row.clientName, f.client)) return false;
  if (f.provider && !eq(row.renderingProvider, f.provider)) return false;
  if (f.payor && !eq(row.payor, f.payor)) return false;
  if (f.code && normalizeProcedureCode(row.code) !== normalizeProcedureCode(f.code)) return false;
  if (f.location && !eq(row.location ?? "", f.location)) return false;
  if (f.search) {
    const q = f.search.trim().toLowerCase();
    if (q) {
      const hay = [
        row.clientName, row.clientId, row.owner ?? "", row.renderingProvider,
        row.rawCode, row.state, row.payor, row.location ?? "", row.providerLabels,
      ].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
  }
  return true;
}

export function applyFilters(
  rows: OwnedBillingRow[],
  f: BcbaProductivityFilters,
): OwnedBillingRow[] {
  return rows.filter((r) => matchesFilters(r, f));
}

export function activeFilterCount(f: BcbaProductivityFilters): number {
  return Object.values(f).filter((v) => !!String(v ?? "").trim()).length;
}

export function filterOptions(rows: OwnedBillingRow[]) {
  const set = (pick: (r: OwnedBillingRow) => string | null | undefined) => {
    const s = new Set<string>();
    for (const r of rows) {
      const v = String(pick(r) ?? "").trim();
      if (v) s.add(v);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  };
  return {
    states: set((r) => r.state),
    bcbas: [UNASSIGNED_LABEL, ...set((r) => r.owner)],
    clients: set((r) => r.clientName),
    providers: set((r) => r.renderingProvider),
    payors: set((r) => r.payor),
    codes: set((r) => r.normalizedCode),
    locations: set((r) => r.location),
  };
}

/* ---------------- supervision ---------------- */

export type SupervisionStatus = "none" | "red" | "yellow" | "green";

/** Supervision % = normalized 97155 hours / normalized 97153 hours * 100. */
export function supervisionPercent(
  supervisionHours: number,
  direct97153Hours: number,
): number | null {
  if (!direct97153Hours) return null;
  return Math.round((supervisionHours / direct97153Hours) * 1000) / 10;
}

export function supervisionStatus(pct: number | null): SupervisionStatus {
  if (pct === null) return "none";
  if (pct < 5) return "red";
  if (pct < 10) return "yellow";
  return "green";
}

/* ---------------- aggregation ---------------- */

/**
 * Hours are stored at 2-decimal precision (CentralReach bills quarter hours,
 * e.g. 146.75) and only formatted to 1 decimal for display.
 */
const r1 = (n: number) => Math.round(n * 100) / 100;

export interface BcbaSummaryRow {
  bcba: string;
  isUnassigned: boolean;
  totalHours: number;
  hours97153: number;
  hours97155: number;
  directBcbaHours: number;
  otherHours: number;
  supervisionPct: number | null;
  supervisionStatus: SupervisionStatus;
  clientCount: number;
  rbtCount: number;
  rowCount: number;
  states: string[];
}

export interface CodeBreakdownRow {
  normalizedCode: string;
  hours: number;
  rowCount: number;
  bcbaCount: number;
  clientCount: number;
  rawCodes: string[];
}

export interface ClientSummaryRow {
  clientKey: string;
  clientId: string;
  clientName: string;
  owner: string | null;
  owners: string[];
  totalHours: number;
  hours97153: number;
  hours97155: number;
  supervisionPct: number | null;
  supervisionStatus: SupervisionStatus;
  rbtCount: number;
  state: string;
  payor: string;
}

export interface RbtSummaryRow {
  rbt: string;
  hours97153: number;
  clientCount: number;
  bcbas: string[];
  rowCount: number;
}

export interface BcbaProductivityAggregate {
  rowCount: number;
  totalHours: number;
  hours97153: number;
  hours97155: number;
  directBcbaHours: number;
  otherHours: number;
  supervisionPct: number | null;
  supervisionStatus: SupervisionStatus;
  activeBcbas: number;
  activeClients: number;
  activeRbts: number;
  unassignedHours: number;
  unassignedRowCount: number;
  bcbaSummary: BcbaSummaryRow[];
  codeBreakdown: CodeBreakdownRow[];
  clientSummary: ClientSummaryRow[];
  rbtSummary: RbtSummaryRow[];
  monthlyTrend: { monthKey: string; hours97153: number; hours97155: number; other: number }[];
}

/**
 * Direct BCBA hours = every hour rendered by a BCBA-labeled provider on a
 * non-97153 code (assessment, supervision, parent training, etc.).
 */
export function aggregate(rows: OwnedBillingRow[]): BcbaProductivityAggregate {
  interface Acc {
    total: number; h53: number; h55: number; direct: number; other: number;
    clients: Set<string>; rbts: Set<string>; states: Set<string>; rowCount: number;
  }
  const mkAcc = (): Acc => ({
    total: 0, h53: 0, h55: 0, direct: 0, other: 0,
    clients: new Set(), rbts: new Set(), states: new Set(), rowCount: 0,
  });

  const byBcba = new Map<string, Acc>();
  const byCode = new Map<string, { hours: number; rowCount: number; bcbas: Set<string>; clients: Set<string>; raw: Set<string> }>();
  const byClient = new Map<string, {
    clientId: string; clientName: string; owners: Set<string>; total: number;
    h53: number; h55: number; rbts: Set<string>; state: string; payor: string;
  }>();
  const byRbt = new Map<string, { h53: number; clients: Set<string>; bcbas: Set<string>; rowCount: number }>();
  const byMonth = new Map<string, { h53: number; h55: number; other: number }>();

  let total = 0, h53 = 0, h55 = 0, direct = 0, other = 0;
  let unassignedHours = 0, unassignedRowCount = 0;
  const clients = new Set<string>();
  const rbts = new Set<string>();

  for (const r of rows) {
    const hours = Number.isFinite(r.hours) ? r.hours : 0;
    const code = r.normalizedCode;
    const ownerKey = r.owner ?? UNASSIGNED_LABEL;
    const acc = byBcba.get(ownerKey) ?? mkAcc();
    byBcba.set(ownerKey, acc);

    total += hours;
    acc.total += hours;
    acc.rowCount += 1;
    if (r.state) acc.states.add(r.state);
    clients.add(r.clientKey);
    acc.clients.add(r.clientKey);

    const isDirectRbt = code === CODE_97153;
    const isSup = code === CODE_97155;
    if (isDirectRbt) {
      h53 += hours; acc.h53 += hours;
      if (r.renderingProvider) { rbts.add(r.renderingProvider); acc.rbts.add(r.renderingProvider); }
    } else {
      if (isSup) { h55 += hours; acc.h55 += hours; }
      else { other += hours; acc.other += hours; }
      if (hasBcbaLabel(r.providerLabels)) { direct += hours; acc.direct += hours; }
    }

    if (!r.owner) { unassignedHours += hours; unassignedRowCount += 1; }

    const c = byCode.get(code) ?? { hours: 0, rowCount: 0, bcbas: new Set<string>(), clients: new Set<string>(), raw: new Set<string>() };
    c.hours += hours; c.rowCount += 1; c.bcbas.add(ownerKey); c.clients.add(r.clientKey);
    if (r.rawCode) c.raw.add(r.rawCode);
    byCode.set(code, c);

    const cl = byClient.get(r.clientKey) ?? {
      clientId: r.clientId, clientName: r.clientName, owners: new Set<string>(),
      total: 0, h53: 0, h55: 0, rbts: new Set<string>(), state: r.state, payor: r.payor,
    };
    cl.total += hours;
    if (isDirectRbt) { cl.h53 += hours; if (r.renderingProvider) cl.rbts.add(r.renderingProvider); }
    if (isSup) cl.h55 += hours;
    if (r.owner) cl.owners.add(r.owner);
    if (!cl.state && r.state) cl.state = r.state;
    if (!cl.payor && r.payor) cl.payor = r.payor;
    if (!cl.clientId && r.clientId) cl.clientId = r.clientId;
    byClient.set(r.clientKey, cl);

    if (isDirectRbt && r.renderingProvider) {
      const rb = byRbt.get(r.renderingProvider) ?? { h53: 0, clients: new Set<string>(), bcbas: new Set<string>(), rowCount: 0 };
      rb.h53 += hours; rb.clients.add(r.clientKey); rb.rowCount += 1;
      if (r.owner) rb.bcbas.add(r.owner);
      byRbt.set(r.renderingProvider, rb);
    }

    const m = byMonth.get(r.monthKey) ?? { h53: 0, h55: 0, other: 0 };
    if (isDirectRbt) m.h53 += hours; else if (isSup) m.h55 += hours; else m.other += hours;
    byMonth.set(r.monthKey, m);
  }

  const bcbaSummary: BcbaSummaryRow[] = [...byBcba.entries()].map(([bcba, a]) => {
    const p = supervisionPercent(a.h55, a.h53);
    return {
      bcba,
      isUnassigned: bcba === UNASSIGNED_LABEL,
      totalHours: r1(a.total),
      hours97153: r1(a.h53),
      hours97155: r1(a.h55),
      directBcbaHours: r1(a.direct),
      otherHours: r1(a.other),
      supervisionPct: p,
      supervisionStatus: supervisionStatus(p),
      clientCount: a.clients.size,
      rbtCount: a.rbts.size,
      rowCount: a.rowCount,
      states: [...a.states].sort(),
    };
  }).sort((a, b) => b.totalHours - a.totalHours);

  const codeBreakdown: CodeBreakdownRow[] = [...byCode.entries()].map(([normalizedCode, v]) => ({
    normalizedCode,
    hours: r1(v.hours),
    rowCount: v.rowCount,
    bcbaCount: v.bcbas.size,
    clientCount: v.clients.size,
    rawCodes: [...v.raw].sort(),
  })).sort((a, b) => b.hours - a.hours);

  const clientSummary: ClientSummaryRow[] = [...byClient.entries()].map(([clientKey, v]) => {
    const p = supervisionPercent(v.h55, v.h53);
    const owners = [...v.owners].sort();
    return {
      clientKey,
      clientId: v.clientId,
      clientName: v.clientName,
      owner: owners.length ? owners[owners.length - 1] : null,
      owners,
      totalHours: r1(v.total),
      hours97153: r1(v.h53),
      hours97155: r1(v.h55),
      supervisionPct: p,
      supervisionStatus: supervisionStatus(p),
      rbtCount: v.rbts.size,
      state: v.state,
      payor: v.payor,
    };
  }).sort((a, b) => b.totalHours - a.totalHours);

  const rbtSummary: RbtSummaryRow[] = [...byRbt.entries()].map(([rbt, v]) => ({
    rbt,
    hours97153: r1(v.h53),
    clientCount: v.clients.size,
    bcbas: [...v.bcbas].sort(),
    rowCount: v.rowCount,
  })).sort((a, b) => b.hours97153 - a.hours97153);

  const monthlyTrend = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, v]) => ({
      monthKey,
      hours97153: r1(v.h53),
      hours97155: r1(v.h55),
      other: r1(v.other),
    }));

  const overallPct = supervisionPercent(h55, h53);

  return {
    rowCount: rows.length,
    totalHours: r1(total),
    hours97153: r1(h53),
    hours97155: r1(h55),
    directBcbaHours: r1(direct),
    otherHours: r1(other),
    supervisionPct: overallPct,
    supervisionStatus: supervisionStatus(overallPct),
    activeBcbas: bcbaSummary.filter((b) => !b.isUnassigned).length,
    activeClients: clients.size,
    activeRbts: rbts.size,
    unassignedHours: r1(unassignedHours),
    unassignedRowCount,
    bcbaSummary,
    codeBreakdown,
    clientSummary,
    rbtSummary,
    monthlyTrend,
  };
}

/* ---------------- formatting ---------------- */

export const fmtHours = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n)
    ? "—"
    : n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const fmtCount = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n) ? "—" : Math.round(n).toLocaleString("en-US");

export const fmtPct = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n)
    ? "—"
    : `${n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

/* ---------------- drilldown export ---------------- */

export const DRILLDOWN_COLUMNS = [
  "Date of Service",
  "Client",
  "Client ID",
  "Inferred BCBA Owner",
  "Rendering Provider",
  "Normalized Code",
  "Raw Code",
  "Hours",
  "State",
  "Payor",
  "Location",
  "Provider Labels",
  "Ownership Reason",
] as const;

export function drilldownRowToCells(r: OwnedBillingRow): (string | number)[] {
  return [
    r.date,
    r.clientName,
    r.clientId,
    r.owner ?? "Unassigned",
    r.renderingProvider,
    r.normalizedCode,
    r.rawCode,
    Math.round((r.hours || 0) * 100) / 100,
    r.state,
    r.payor,
    r.location ?? "",
    r.providerLabels,
    OWNERSHIP_REASON_LABELS[r.ownerReason],
  ];
}

export function toCsv(columns: readonly string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}
