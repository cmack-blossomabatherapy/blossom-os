/**
 * Phase 2B1 repair B — BCBA Supervision analysis (staff-facing).
 *
 * The ratio is exactly one thing: **97155 supervision hours ÷ 97153 direct
 * hours**, read against Blossom's 5% operational benchmark.
 *
 * Two views, never blended:
 *   - **Past Performance**      — completed, nonvoid, nondeleted 97153/97155.
 *   - **Projected Performance** — completed plus future active, nondeleted,
 *                                 noncancelled scheduled 97153/97155.
 *
 * Provenance, stated plainly wherever these numbers appear: billing and schedule
 * rows are an **operational view**, not a credentialing supervision log. A
 * dedicated supervision-log export is still required for credentialing review.
 *
 * A group with zero direct hours has no denominator, so it reports
 * "Insufficient data" — never 0%. In the provider/RBT view, supervision hours
 * are only ever shown when the source explicitly links them to that provider;
 * one BCBA's 97155 hours are never distributed across their RBTs.
 */
import { CODE_DIRECT, CODE_SUPERVISION, hoursOf, normalizeCode } from "./codes";
import { buildClientIdentityResolver, type ClientIdentityResolver } from "./clientIdentity";

export const SUPERVISION_BENCHMARK_PCT = 5;
export const SUPERVISION_BENCHMARK_LABEL = "Blossom operational benchmark";
/** Kept for existing callers; the value is the operational benchmark. */
export const SUPERVISION_TARGET_PCT = SUPERVISION_BENCHMARK_PCT;

export const SUPERVISION_PROVENANCE_NOTE =
  "Billing and schedule rows are an operational view of supervision, not a credentialing supervision log. A dedicated supervision-log export is still required for credentialing review.";

export const SUPERVISION_VIEW_LABELS = {
  past: "Past Performance",
  projected: "Projected Performance",
} as const;

export type SupervisionView = keyof typeof SUPERVISION_VIEW_LABELS;

export type SupervisionRatioStatus =
  | "meets_target"
  | "approaching"
  | "below_target"
  | "insufficient_data";

export const SUPERVISION_STATUS_LABELS: Record<SupervisionRatioStatus, string> = {
  meets_target: `Meets ${SUPERVISION_BENCHMARK_PCT}% benchmark`,
  approaching: "Approaching benchmark",
  below_target: "Below benchmark",
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
  /** Rendering provider CR id, when the source records one. */
  providerCrId?: string | null;
  state?: string | null;
  payor?: string | null;
  /**
   * Provider the supervision is explicitly linked to, when the source records
   * one. Without it, a 97155 row can never be attributed to an RBT.
   */
  supervisedProviderName?: string | null;
  /** CR id of the explicitly linked supervised provider, when recorded. */
  supervisedProviderCrId?: string | null;
}

export interface SupervisionGroupRow {
  key: string;
  label: string;
  /** Owning BCBA (always populated for the `bcba` grouping). */
  bcba: string;
  completedDirectHours: number;
  completedSupervisionHours: number;
  scheduledDirectHours: number;
  scheduledSupervisionHours: number;
  projectedDirectHours: number;
  projectedSupervisionHours: number;
  /** Direct hours for the active view (past or projected). */
  directHours: number;
  /** Supervision hours for the active view. */
  supervisionHours: number;
  /** Active-view ratio. Null when there are no direct hours. */
  ratioPct: number | null;
  status: SupervisionRatioStatus;
  clients: number;
  rbts: number;
  states: string[];
  /** Supervision hours needed to reach 5% of the active-view direct hours. */
  hoursToTarget: number | null;
  /** False when the source cannot link supervision to this group. */
  supervisionLinkable: boolean;
  note: string;
}

export interface SupervisionViewMetrics {
  view: SupervisionView;
  label: string;
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
  provenanceNote: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function supervisionRatioStatus(
  ratioPct: number | null,
  directHours: number,
): SupervisionRatioStatus {
  if (directHours <= 0 || ratioPct == null) return "insufficient_data";
  if (ratioPct >= SUPERVISION_BENCHMARK_PCT) return "meets_target";
  if (ratioPct >= SUPERVISION_BENCHMARK_PCT * 0.8) return "approaching";
  return "below_target";
}

interface Acc {
  label: string;
  bcba: string;
  completedDirect: number;
  completedSupervision: number;
  scheduledDirect: number;
  scheduledSupervision: number;
  clients: Set<string>;
  rbts: Set<string>;
  states: Set<string>;
  /** A supervision row was explicitly attributable to this group. */
  supervisionLinkable: boolean;
}

function buildView(
  completed: SupervisionSessionInput[],
  scheduled: SupervisionSessionInput[],
  grouping: SupervisionGrouping,
  resolveOwner: (s: SupervisionSessionInput) => string | null,
  view: SupervisionView,
  identity: { client: ClientIdentityResolver; provider: ClientIdentityResolver },
): SupervisionViewMetrics {
  const acc = new Map<string, Acc>();

  const ingest = (s: SupervisionSessionInput, bucket: "completed" | "scheduled") => {
    const code = normalizeCode(s.procedureCode);
    if (code !== CODE_DIRECT && code !== CODE_SUPERVISION) return;
    const hours = hoursOf(s.hours);
    const client = String(s.clientName ?? "").trim() || "Unknown client";
    const provider = String(s.providerName ?? "").trim();
    const owner = resolveOwner(s);
    const bcba = owner ?? "Unassigned";
    const supervisedProvider = String(s.supervisedProviderName ?? "").trim();

    // In the provider/RBT view, a 97155 row only belongs to an RBT when the
    // source explicitly links it. An unlinked supervision row is discarded
    // *before* any accumulator exists, so it can never create a pseudo row for
    // the supervising BCBA inside the RBT table.
    /**
     * Identity is resolved CR-id first over the COMPLETE past+projected input,
     * so two distinct CR ids that share a name never merge and a unique id-less
     * alias joins deterministically regardless of row order.
     */
    let key: string;
    let label: string;
    if (grouping === "bcba") {
      key = bcba;
      label = bcba;
    } else if (grouping === "client") {
      key = identity.client.keyFor(s.clientCrId, client);
      label = client;
    } else if (code === CODE_DIRECT) {
      label = provider || "Unknown provider";
      key = identity.provider.keyFor(s.providerCrId, label);
    } else if (supervisedProvider) {
      label = supervisedProvider;
      key = identity.provider.keyFor(s.supervisedProviderCrId, label);
    } else return; // unlinked 97155 in the RBT view — never fabricate the link

    if (!acc.has(key)) {
      acc.set(key, {
        label,
        bcba,
        completedDirect: 0,
        completedSupervision: 0,
        scheduledDirect: 0,
        scheduledSupervision: 0,
        clients: new Set(),
        rbts: new Set(),
        states: new Set(),
        supervisionLinkable: grouping !== "rbt",
      });
    }
    const a = acc.get(key)!;
    if (s.state) a.states.add(String(s.state));

    if (code === CODE_DIRECT) {
      a.clients.add(identity.client.keyFor(s.clientCrId, client));
      if (provider) a.rbts.add(identity.provider.keyFor(s.providerCrId, provider));
      if (bucket === "completed") a.completedDirect += hours;
      else a.scheduledDirect += hours;
      return;
    }

    // Supervision row — explicitly linked whenever it reaches this point.
    if (grouping === "rbt") a.supervisionLinkable = true;
    a.clients.add(identity.client.keyFor(s.clientCrId, client));
    if (bucket === "completed") a.completedSupervision += hours;
    else a.scheduledSupervision += hours;
  };


  for (const s of completed) ingest(s, "completed");
  for (const s of scheduled) ingest(s, "scheduled");

  const rows: SupervisionGroupRow[] = [...acc.entries()].map(([key, a]) => {
    const projectedDirect = a.completedDirect + a.scheduledDirect;
    const projectedSupervision = a.completedSupervision + a.scheduledSupervision;
    const direct = view === "past" ? a.completedDirect : projectedDirect;
    const supervision = view === "past" ? a.completedSupervision : projectedSupervision;
    const linkable = grouping === "rbt" ? a.supervisionLinkable : true;
    const ratio = !linkable || direct <= 0 ? null : Math.round((supervision / direct) * 1000) / 10;
    const status = linkable ? supervisionRatioStatus(ratio, direct) : "insufficient_data";
    const needed =
      linkable && direct > 0
        ? Math.max(0, round1((SUPERVISION_BENCHMARK_PCT / 100) * direct - supervision))
        : null;

    return {
      key,
      label: a.label,
      bcba: a.bcba,
      completedDirectHours: round1(a.completedDirect),
      completedSupervisionHours: round1(a.completedSupervision),
      scheduledDirectHours: round1(a.scheduledDirect),
      scheduledSupervisionHours: round1(a.scheduledSupervision),
      projectedDirectHours: round1(projectedDirect),
      projectedSupervisionHours: round1(projectedSupervision),
      directHours: round1(direct),
      supervisionHours: round1(supervision),
      ratioPct: ratio,
      status,
      clients: a.clients.size,
      rbts: a.rbts.size,
      states: [...a.states].sort(),
      hoursToTarget: needed,
      supervisionLinkable: linkable,
      note: !linkable
        ? "The source does not link any 97155 supervision hours to this provider, so a ratio cannot be calculated for them. Supervision is reported under the supervising BCBA instead."
        : status === "insufficient_data"
          ? "No 97153 direct hours in this view, so a supervision ratio cannot be calculated."
          : status === "meets_target"
            ? `${ratio}% of direct hours supervised, at or above the ${SUPERVISION_BENCHMARK_PCT}% ${SUPERVISION_BENCHMARK_LABEL}.`
            : `${ratio}% supervised — ${needed} more 97155 hour(s) would reach the ${SUPERVISION_BENCHMARK_PCT}% ${SUPERVISION_BENCHMARK_LABEL}.`,
    };
  });

  rows.sort((a, b) => {
    const rank = (s: SupervisionRatioStatus) =>
      s === "below_target" ? 0 : s === "approaching" ? 1 : s === "meets_target" ? 2 : 3;
    return rank(a.status) - rank(b.status) || b.directHours - a.directHours;
  });

  /**
   * Overall totals come from the raw 97153/97155 facts, never from the grouped
   * rows. Grouping decides how hours are *attributed*, not how many were
   * worked, so the top-line ratio stays identical across BCBA / client / RBT
   * groupings — and missing RBT linkage can never turn it into 0%.
   */
  let direct = 0;
  let supervision = 0;
  const tally = (list: SupervisionSessionInput[]) => {
    for (const s of list) {
      const code = normalizeCode(s.procedureCode);
      if (code === CODE_DIRECT) direct += hoursOf(s.hours);
      else if (code === CODE_SUPERVISION) supervision += hoursOf(s.hours);
    }
  };
  tally(completed);
  if (view === "projected") tally(scheduled);

  return {
    view,
    label: SUPERVISION_VIEW_LABELS[view],
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
  /** Completed, nonvoid, nondeleted billed 97153/97155 facts. */
  past: SupervisionSessionInput[];
  /** Future active, nondeleted, noncancelled scheduled 97153/97155 events. */
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
  const identity = {
    client: buildClientIdentityResolver(
      past.map((s) => ({ client: s.clientName, clientCrId: s.clientCrId })),
      projected.map((s) => ({ client: s.clientName, clientCrId: s.clientCrId })),
    ),
    provider: buildClientIdentityResolver(
      past.map((s) => ({ client: s.providerName, clientCrId: s.providerCrId })),
      projected.map((s) => ({ client: s.providerName, clientCrId: s.providerCrId })),
      past.map((s) => ({ client: s.supervisedProviderName, clientCrId: s.supervisedProviderCrId })),
      projected.map((s) => ({
        client: s.supervisedProviderName,
        clientCrId: s.supervisedProviderCrId,
      })),
    ),
  };
  const pastView = buildView(past, projected, grouping, resolveOwner, "past", identity);
  const projectedView = buildView(past, projected, grouping, resolveOwner, "projected", identity);
  const delta =
    pastView.ratioPct != null && projectedView.ratioPct != null
      ? round1(projectedView.ratioPct - pastView.ratioPct)
      : null;
  return {
    past: pastView,
    projected: projectedView,
    ratioDeltaPct: delta,
    provenanceNote: SUPERVISION_PROVENANCE_NOTE,
  };
}
