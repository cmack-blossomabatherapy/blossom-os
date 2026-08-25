/**
 * Phase 2B1 — BCBA Supervision analysis (staff-facing).
 *
 * The supervision ratio is exactly one thing: **97155 supervision hours ÷
 * 97153 direct hours**, expressed as a percentage against a 5% expectation.
 *
 * Two views, never blended:
 *   - **Past**      — billed facts that already happened.
 *   - **Projected** — kept future schedule events, i.e. what the ratio becomes
 *                     if every currently scheduled session is delivered.
 *
 * A group with zero direct hours has no denominator, so it reports
 * "Insufficient data" — never 0% and never "compliant".
 *
 * Ownership attribution is not decided here: callers pass `resolveOwner`, which
 * is backed by the canonical V3 ownership adapter so this report always agrees
 * with BCBA Productivity V3.
 */
import { CODE_DIRECT, CODE_SUPERVISION, hoursOf, normalizeCode } from "./codes";

export const SUPERVISION_TARGET_PCT = 5;

export type SupervisionRatioStatus =
  | "meets_target"
  | "approaching"
  | "below_target"
  | "insufficient_data";

export const SUPERVISION_STATUS_LABELS: Record<SupervisionRatioStatus, string> = {
  meets_target: "Meets 5% target",
  approaching: "Approaching target",
  below_target: "Below target",
  insufficient_data: "Insufficient data",
};

export type SupervisionGrouping = "bcba" | "client" | "rbt";

export interface SupervisionSessionInput {
  date: string | null | undefined;
  procedureCode: string | null | undefined;
  hours: number | null | undefined;
  clientName: string | null | undefined;
  clientCrId?: string | null;
  providerName: string | null | undefined;
  state?: string | null;
  payor?: string | null;
}

export interface SupervisionGroupRow {
  key: string;
  label: string;
  /** Owning BCBA (always populated for the `bcba` grouping). */
  bcba: string;
  directHours: number;
  supervisionHours: number;
  /** null when there are no direct hours — the ratio is undefined, not 0. */
  ratioPct: number | null;
  status: SupervisionRatioStatus;
  clients: number;
  rbts: number;
  states: string[];
  /** Supervision hours needed to reach the 5% target for the direct hours. */
  hoursToTarget: number | null;
  note: string;
}

export interface SupervisionViewMetrics {
  directHours: number;
  supervisionHours: number;
  ratioPct: number | null;
  groupsBelowTarget: number;
  groupsInsufficientData: number;
  rows: SupervisionGroupRow[];
}

export interface SupervisionAnalysis {
  past: SupervisionViewMetrics;
  projected: SupervisionViewMetrics;
  /** Projected minus past ratio, in percentage points; null when undefined. */
  ratioDeltaPct: number | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function supervisionRatioStatus(
  ratioPct: number | null,
  directHours: number,
): SupervisionRatioStatus {
  if (directHours <= 0 || ratioPct == null) return "insufficient_data";
  if (ratioPct >= SUPERVISION_TARGET_PCT) return "meets_target";
  if (ratioPct >= SUPERVISION_TARGET_PCT * 0.8) return "approaching";
  return "below_target";
}

interface Acc {
  label: string;
  bcba: string;
  direct: number;
  supervision: number;
  clients: Set<string>;
  rbts: Set<string>;
  states: Set<string>;
}

function buildView(
  sessions: SupervisionSessionInput[],
  grouping: SupervisionGrouping,
  resolveOwner: (s: SupervisionSessionInput) => string | null,
): SupervisionViewMetrics {
  const acc = new Map<string, Acc>();
  let direct = 0;
  let supervision = 0;

  for (const s of sessions) {
    const code = normalizeCode(s.procedureCode);
    if (code !== CODE_DIRECT && code !== CODE_SUPERVISION) continue;
    const hours = hoursOf(s.hours);
    const client = String(s.clientName ?? "").trim() || "Unknown client";
    const provider = String(s.providerName ?? "").trim();
    const owner = resolveOwner(s);
    const bcba = owner ?? "Unassigned";

    const key =
      grouping === "bcba" ? bcba : grouping === "client" ? client : provider || "Unknown provider";
    if (!acc.has(key)) {
      acc.set(key, {
        label: key,
        bcba,
        direct: 0,
        supervision: 0,
        clients: new Set(),
        rbts: new Set(),
        states: new Set(),
      });
    }
    const a = acc.get(key)!;
    a.clients.add(client);
    if (code === CODE_DIRECT && provider) a.rbts.add(provider);
    if (s.state) a.states.add(String(s.state));

    if (code === CODE_DIRECT) {
      a.direct += hours;
      direct += hours;
    } else {
      a.supervision += hours;
      supervision += hours;
    }
  }

  const rows: SupervisionGroupRow[] = [...acc.entries()].map(([key, a]) => {
    const ratio = a.direct > 0 ? Math.round((a.supervision / a.direct) * 1000) / 10 : null;
    const status = supervisionRatioStatus(ratio, a.direct);
    const needed =
      a.direct > 0
        ? Math.max(0, round1((SUPERVISION_TARGET_PCT / 100) * a.direct - a.supervision))
        : null;
    return {
      key,
      label: a.label,
      bcba: a.bcba,
      directHours: round1(a.direct),
      supervisionHours: round1(a.supervision),
      ratioPct: ratio,
      status,
      clients: a.clients.size,
      rbts: a.rbts.size,
      states: [...a.states].sort(),
      hoursToTarget: needed,
      note:
        status === "insufficient_data"
          ? "No 97153 direct hours in this window, so a supervision ratio cannot be calculated."
          : status === "meets_target"
            ? `${ratio}% of direct hours were supervised.`
            : `${ratio}% supervised — ${needed} more 97155 hour(s) would reach 5%.`,
    };
  });

  rows.sort((a, b) => {
    const rank = (s: SupervisionRatioStatus) =>
      s === "below_target" ? 0 : s === "approaching" ? 1 : s === "meets_target" ? 2 : 3;
    return rank(a.status) - rank(b.status) || b.directHours - a.directHours;
  });

  return {
    directHours: round1(direct),
    supervisionHours: round1(supervision),
    ratioPct: direct > 0 ? Math.round((supervision / direct) * 1000) / 10 : null,
    groupsBelowTarget: rows.filter((r) => r.status === "below_target" || r.status === "approaching")
      .length,
    groupsInsufficientData: rows.filter((r) => r.status === "insufficient_data").length,
    rows,
  };
}

export interface SupervisionAnalysisInput {
  /** Billed facts that already happened. */
  past: SupervisionSessionInput[];
  /** Kept future schedule events (cancelled/deleted already excluded). */
  projected: SupervisionSessionInput[];
  grouping?: SupervisionGrouping;
  /** Canonical owner lookup, backed by the V3 ownership adapter. */
  resolveOwner: (s: SupervisionSessionInput) => string | null;
}

export function computeSupervisionAnalysis({
  past,
  projected,
  grouping = "bcba",
  resolveOwner,
}: SupervisionAnalysisInput): SupervisionAnalysis {
  const pastView = buildView(past, grouping, resolveOwner);
  // Projected = delivered so far plus everything still on the calendar.
  const projectedView = buildView([...past, ...projected], grouping, resolveOwner);
  const delta =
    pastView.ratioPct != null && projectedView.ratioPct != null
      ? round1(projectedView.ratioPct - pastView.ratioPct)
      : null;
  return { past: pastView, projected: projectedView, ratioDeltaPct: delta };
}
