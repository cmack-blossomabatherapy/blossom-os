/**
 * Phase 2B1 — Parent Training (97156), staff-facing.
 *
 * Parent training is reported in three honest buckets, each from the source
 * that can actually prove it:
 *   - **Completed** — billed 97156 facts.
 *   - **Upcoming**  — kept future 97156 schedule events.
 *   - **Cancelled** — 97156 schedule events the source explicitly cancelled.
 *
 * A client with no completed and no upcoming parent training is an action item,
 * not a 0-hour row to scroll past. Clients below the monthly target are a second
 * queue. Nothing here infers delivery from a schedule event: a scheduled session
 * is never counted as completed.
 */
import { CODE_PARENT_TRAINING, hoursOf, normalizeCode } from "./codes";

/** Default expectation: one parent-training hour per client per month. */
export const PT_MONTHLY_TARGET_HOURS = 1;

export interface PtSessionInput {
  date: string | null | undefined;
  procedureCode: string | null | undefined;
  hours: number | null | undefined;
  clientName: string | null | undefined;
  clientCrId?: string | null;
  providerName?: string | null;
  payor?: string | null;
  state?: string | null;
  /** Only meaningful for schedule rows. */
  cancelled?: boolean;
  cancellationReason?: string | null;
}

export type PtBucket = "completed" | "upcoming" | "cancelled";

export interface PtEventRow {
  key: string;
  bucket: PtBucket;
  date: string | null;
  client: string;
  clientCrId: string;
  bcba: string;
  provider: string;
  payor: string;
  state: string;
  hours: number;
  reason: string | null;
}

export interface PtClientRow {
  client: string;
  clientCrId: string;
  bcba: string;
  payor: string;
  state: string;
  completedHours: number;
  completedSessions: number;
  upcomingSessions: number;
  upcomingHours: number;
  cancelledSessions: number;
  lastCompleted: string | null;
  nextScheduled: string | null;
  /** Target for the selected window, driven by the number of months covered. */
  targetHours: number;
  /** True when nothing is completed and nothing is on the calendar. */
  noAppointment: boolean;
  /** True when completed hours fall short of the window target. */
  belowTarget: boolean;
  note: string;
}

export interface PtGroupRow {
  name: string;
  completedHours: number;
  clients: number;
  clientsWithPt: number;
  coveragePct: number | null;
  cancelledSessions: number;
}

export interface ParentTrainingAnalysis {
  completedHours: number;
  completedSessions: number;
  upcomingSessions: number;
  upcomingHours: number;
  cancelledSessions: number;
  cancellationRatePct: number | null;
  clients: number;
  clientsWithCompleted: number;
  coveragePct: number | null;
  monthsInWindow: number;
  byBcba: PtGroupRow[];
  byPayor: PtGroupRow[];
  byState: PtGroupRow[];
  clientRows: PtClientRow[];
  events: PtEventRow[];
  /** Action queue: no completed and no upcoming parent training. */
  noAppointmentQueue: PtClientRow[];
  /** Action queue: some parent training, but below the window target. */
  belowTargetQueue: PtClientRow[];
  trend: { label: string; value: number }[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const iso = (d: string | null | undefined) => (d ? String(d).slice(0, 10) : null);
const isPt = (code: string | null | undefined) => normalizeCode(code) === CODE_PARENT_TRAINING;

/** Whole months (inclusive) a window spans; at least 1. */
export function monthsInWindow(from?: string | null, to?: string | null): number {
  if (!from || !to) return 1;
  const [fy, fm] = from.slice(0, 7).split("-").map(Number);
  const [ty, tm] = to.slice(0, 7).split("-").map(Number);
  if (!fy || !ty) return 1;
  return Math.max(1, (ty - fy) * 12 + (tm - fm) + 1);
}

export interface ParentTrainingInput {
  /** Billed 97156 facts (completed). */
  billed: PtSessionInput[];
  /** Schedule 97156 events inside the window, cancelled ones flagged. */
  scheduled: PtSessionInput[];
  /** Every client active in the window, so gaps are visible. */
  activeClients: { client: string; clientCrId?: string | null; payor?: string | null; state?: string | null }[];
  resolveOwner: (s: { clientName?: string | null; clientCrId?: string | null; date?: string | null }) => string | null;
  window?: { from?: string | null; to?: string | null };
  today?: string;
  monthlyTargetHours?: number;
}

export function computeParentTrainingAnalysis({
  billed,
  scheduled,
  activeClients,
  resolveOwner,
  window,
  today = new Date().toISOString().slice(0, 10),
  monthlyTargetHours = PT_MONTHLY_TARGET_HOURS,
}: ParentTrainingInput): ParentTrainingAnalysis {
  const months = monthsInWindow(window?.from, window?.to);
  const targetHours = round1(months * monthlyTargetHours);

  interface Acc extends PtClientRow {}
  const clients = new Map<string, Acc>();
  const events: PtEventRow[] = [];
  const trend = new Map<string, number>();

  const ensure = (input: {
    client?: string | null;
    clientCrId?: string | null;
    payor?: string | null;
    state?: string | null;
    date?: string | null;
  }): Acc => {
    const client = String(input.client ?? "").trim() || "Unknown client";
    const key = client.toLowerCase();
    if (!clients.has(key)) {
      clients.set(key, {
        client,
        clientCrId: String(input.clientCrId ?? "").trim(),
        bcba: resolveOwner({ clientName: client, clientCrId: input.clientCrId, date: input.date }) ?? "Unassigned",
        payor: String(input.payor ?? "").trim() || "Unknown",
        state: String(input.state ?? "").trim() || "Unknown",
        completedHours: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        upcomingHours: 0,
        cancelledSessions: 0,
        lastCompleted: null,
        nextScheduled: null,
        targetHours,
        noAppointment: true,
        belowTarget: true,
        note: "",
      });
    }
    const row = clients.get(key)!;
    if (!row.clientCrId && input.clientCrId) row.clientCrId = String(input.clientCrId).trim();
    return row;
  };

  for (const c of activeClients) ensure(c);

  billed.forEach((s, i) => {
    if (!isPt(s.procedureCode)) return;
    const row = ensure({
      client: s.clientName,
      clientCrId: s.clientCrId,
      payor: s.payor,
      state: s.state,
      date: s.date,
    });
    const hours = hoursOf(s.hours);
    const date = iso(s.date);
    row.completedHours = round1(row.completedHours + hours);
    row.completedSessions += 1;
    if (date && (!row.lastCompleted || date > row.lastCompleted)) row.lastCompleted = date;
    if (date) trend.set(date.slice(0, 7), round1((trend.get(date.slice(0, 7)) ?? 0) + hours));
    events.push({
      key: `billed-${i}`,
      bucket: "completed",
      date,
      client: row.client,
      clientCrId: row.clientCrId,
      bcba: row.bcba,
      provider: String(s.providerName ?? "").trim(),
      payor: row.payor,
      state: row.state,
      hours: round1(hours),
      reason: null,
    });
  });

  scheduled.forEach((s, i) => {
    if (!isPt(s.procedureCode)) return;
    const row = ensure({
      client: s.clientName,
      clientCrId: s.clientCrId,
      payor: s.payor,
      state: s.state,
      date: s.date,
    });
    const date = iso(s.date);
    const hours = hoursOf(s.hours);
    if (s.cancelled) {
      row.cancelledSessions += 1;
      events.push({
        key: `sched-${i}`,
        bucket: "cancelled",
        date,
        client: row.client,
        clientCrId: row.clientCrId,
        bcba: row.bcba,
        provider: String(s.providerName ?? "").trim(),
        payor: row.payor,
        state: row.state,
        hours: round1(hours),
        reason: s.cancellationReason ?? null,
      });
      return;
    }
    // Only events still ahead of today are "upcoming"; a kept past event is
    // proven by the billed facts, not by the calendar.
    if (date && date >= today) {
      row.upcomingSessions += 1;
      row.upcomingHours = round1(row.upcomingHours + hours);
      if (!row.nextScheduled || date < row.nextScheduled) row.nextScheduled = date;
      events.push({
        key: `sched-${i}`,
        bucket: "upcoming",
        date,
        client: row.client,
        clientCrId: row.clientCrId,
        bcba: row.bcba,
        provider: String(s.providerName ?? "").trim(),
        payor: row.payor,
        state: row.state,
        hours: round1(hours),
        reason: null,
      });
    }
  });

  const clientRows = [...clients.values()].map((r) => {
    r.noAppointment = r.completedSessions === 0 && r.upcomingSessions === 0;
    r.belowTarget = !r.noAppointment && r.completedHours < r.targetHours;
    r.note = r.noAppointment
      ? "No completed and no scheduled parent training in this window."
      : r.belowTarget
        ? `${r.completedHours} of ${r.targetHours} target hour(s) completed.`
        : `${r.completedHours} hour(s) completed — at or above target.`;
    return r;
  });

  const group = (pick: (r: PtClientRow) => string): PtGroupRow[] => {
    const map = new Map<string, PtGroupRow>();
    for (const r of clientRows) {
      const name = pick(r) || "Unknown";
      if (!map.has(name)) {
        map.set(name, {
          name,
          completedHours: 0,
          clients: 0,
          clientsWithPt: 0,
          coveragePct: null,
          cancelledSessions: 0,
        });
      }
      const g = map.get(name)!;
      g.completedHours = round1(g.completedHours + r.completedHours);
      g.clients += 1;
      if (r.completedSessions > 0) g.clientsWithPt += 1;
      g.cancelledSessions += r.cancelledSessions;
    }
    return [...map.values()]
      .map((g) => ({
        ...g,
        coveragePct: g.clients > 0 ? Math.round((g.clientsWithPt / g.clients) * 1000) / 10 : null,
      }))
      .sort((a, b) => b.completedHours - a.completedHours);
  };

  const completedSessions = clientRows.reduce((s, r) => s + r.completedSessions, 0);
  const cancelledSessions = clientRows.reduce((s, r) => s + r.cancelledSessions, 0);
  const upcomingSessions = clientRows.reduce((s, r) => s + r.upcomingSessions, 0);
  const withCompleted = clientRows.filter((r) => r.completedSessions > 0).length;
  const denom = completedSessions + cancelledSessions;

  return {
    completedHours: round1(clientRows.reduce((s, r) => s + r.completedHours, 0)),
    completedSessions,
    upcomingSessions,
    upcomingHours: round1(clientRows.reduce((s, r) => s + r.upcomingHours, 0)),
    cancelledSessions,
    cancellationRatePct: denom > 0 ? Math.round((cancelledSessions / denom) * 1000) / 10 : null,
    clients: clientRows.length,
    clientsWithCompleted: withCompleted,
    coveragePct:
      clientRows.length > 0 ? Math.round((withCompleted / clientRows.length) * 1000) / 10 : null,
    monthsInWindow: months,
    byBcba: group((r) => r.bcba),
    byPayor: group((r) => r.payor),
    byState: group((r) => r.state),
    clientRows: clientRows.sort((a, b) => b.completedHours - a.completedHours),
    events: events.sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? ""))),
    noAppointmentQueue: clientRows.filter((r) => r.noAppointment),
    belowTargetQueue: clientRows.filter((r) => r.belowTarget),
    trend: [...trend.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value })),
  };
}
