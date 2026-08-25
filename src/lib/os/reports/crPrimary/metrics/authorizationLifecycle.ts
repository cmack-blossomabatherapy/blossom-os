/**
 * Phase 2A — Authorization lifecycle from logged events ONLY.
 *
 * CentralReach authorization exports are a *snapshot*: they carry coverage
 * windows and hour balances, but no submission, approval, or denial
 * timestamps. Inferring "IA submitted this week" from a start date produced
 * wrong weekly numbers, so this module refuses to do it.
 *
 * Every count here comes from a real logged authorization event
 * (`report_authorization_events`). When there are no events, callers must show
 * the explicit empty state instead of zeros dressed up as facts.
 */
import { weekStart } from "../format";
import { cleanReasonText } from "../scheduleTruth";

export type LifecycleKind =
  | "initial_assessment"
  | "initial_treatment"
  | "reauthorization"
  | "progress_report"
  | "unclassified";

export type LifecycleAction =
  | "submitted"
  | "approved"
  | "denied"
  | "paused"
  | "resubmitted"
  | "other";

export const LIFECYCLE_KINDS: Exclude<LifecycleKind, "unclassified">[] = [
  "initial_assessment",
  "initial_treatment",
  "reauthorization",
  "progress_report",
];

export const LIFECYCLE_KIND_LABELS: Record<LifecycleKind, string> = {
  initial_assessment: "Initial Assessment",
  initial_treatment: "Initial Treatment",
  reauthorization: "Reauthorization",
  progress_report: "Progress Report",
  unclassified: "Unclassified",
};

export interface LifecycleEventRow {
  record_id?: string;
  id?: string;
  source?: string | null;
  event_type: string;
  event_date: string | null;
  client_name?: string | null;
  client_cr_id?: string | null;
  authorization_number?: string | null;
  payor?: string | null;
  state?: string | null;
  reason?: string | null;
  created_at?: string | null;
}

/**
 * Map a logged event type onto a lifecycle cell. Unknown event types are
 * reported as `unclassified` rather than being forced into a bucket.
 */
export function classifyLifecycleEvent(eventType: string | null | undefined): {
  kind: LifecycleKind;
  action: LifecycleAction;
} {
  const t = String(eventType ?? "").toLowerCase();
  const kind: LifecycleKind = /initial[_\s-]*assessment|\bia\b|reassessment/.test(t)
    ? "initial_assessment"
    : /initial[_\s-]*treatment|\bit\b/.test(t)
      ? "initial_treatment"
      : /re-?auth|\bra\b|renewal|concurrent/.test(t)
        ? "reauthorization"
        : /progress[_\s-]*report|\bpr\b/.test(t)
          ? "progress_report"
          : "unclassified";
  const action: LifecycleAction = /resubmit/.test(t)
    ? "resubmitted"
    : /denied|denial|reject/.test(t)
      ? "denied"
      : /approved|approval|authorized/.test(t)
        ? "approved"
        : /paused|pause|hold|stopped/.test(t)
          ? "paused"
          : /submitted|submission|sent/.test(t)
            ? "submitted"
            : "other";
  return { kind, action };
}

export interface LifecycleKindRow {
  kind: LifecycleKind;
  label: string;
  submitted: number;
  approved: number;
  denied: number;
  resubmitted: number;
  paused: number;
  other: number;
  approvalRate: number | null;
  denialRate: number | null;
}

export interface LifecycleWeekRow {
  weekStart: string;
  submitted: number;
  approved: number;
  denied: number;
  paused: number;
}

export interface LifecycleMetrics {
  /** False when no logged events exist — render the explicit empty state. */
  hasEvents: boolean;
  totalEvents: number;
  submitted: number;
  approved: number;
  denied: number;
  paused: number;
  resubmitted: number;
  unclassifiedEvents: number;
  approvalRate: number | null;
  denialRate: number | null;
  byKind: LifecycleKindRow[];
  weekly: LifecycleWeekRow[];
  denialReasons: { label: string; value: number }[];
  pauseReasons: { label: string; value: number }[];
  /** Distinct sources that contributed events, for the provenance line. */
  sources: string[];
}

const rate = (n: number, d: number): number | null =>
  d ? Math.round((n / d) * 1000) / 10 : null;

export function computeAuthorizationLifecycle(
  events: LifecycleEventRow[],
): LifecycleMetrics {
  const kinds = new Map<LifecycleKind, LifecycleKindRow>();
  const ensureKind = (kind: LifecycleKind): LifecycleKindRow => {
    if (!kinds.has(kind)) {
      kinds.set(kind, {
        kind,
        label: LIFECYCLE_KIND_LABELS[kind],
        submitted: 0,
        approved: 0,
        denied: 0,
        resubmitted: 0,
        paused: 0,
        other: 0,
        approvalRate: null,
        denialRate: null,
      });
    }
    return kinds.get(kind)!;
  };

  const weeks = new Map<string, LifecycleWeekRow>();
  const denialReasons = new Map<string, number>();
  const pauseReasons = new Map<string, number>();
  const sources = new Set<string>();

  let submitted = 0;
  let approved = 0;
  let denied = 0;
  let paused = 0;
  let resubmitted = 0;
  let unclassified = 0;

  for (const e of events) {
    const { kind, action } = classifyLifecycleEvent(e.event_type);
    const row = ensureKind(kind);
    if (kind === "unclassified") unclassified += 1;
    if (e.source) sources.add(String(e.source));

    // Approved / denied / resubmitted all imply a submission happened.
    if (action === "approved") {
      row.approved += 1;
      row.submitted += 1;
      approved += 1;
      submitted += 1;
    } else if (action === "denied") {
      row.denied += 1;
      row.submitted += 1;
      denied += 1;
      submitted += 1;
      denialReasons.set(
        cleanReasonText(e.reason) ?? "Reason not documented",
        (denialReasons.get(cleanReasonText(e.reason) ?? "Reason not documented") ?? 0) + 1,
      );
    } else if (action === "resubmitted") {
      row.resubmitted += 1;
      row.submitted += 1;
      resubmitted += 1;
      submitted += 1;
    } else if (action === "submitted") {
      row.submitted += 1;
      submitted += 1;
    } else if (action === "paused") {
      row.paused += 1;
      paused += 1;
      pauseReasons.set(
        cleanReasonText(e.reason) ?? "Reason not documented",
        (pauseReasons.get(cleanReasonText(e.reason) ?? "Reason not documented") ?? 0) + 1,
      );
    } else {
      row.other += 1;
    }

    const wk = weekStart(e.event_date);
    if (wk) {
      if (!weeks.has(wk)) {
        weeks.set(wk, { weekStart: wk, submitted: 0, approved: 0, denied: 0, paused: 0 });
      }
      const w = weeks.get(wk)!;
      if (action === "approved") {
        w.approved += 1;
        w.submitted += 1;
      } else if (action === "denied") {
        w.denied += 1;
        w.submitted += 1;
      } else if (action === "submitted" || action === "resubmitted") {
        w.submitted += 1;
      } else if (action === "paused") {
        w.paused += 1;
      }
    }
  }

  const byKind = [...kinds.values()]
    .map((k) => ({
      ...k,
      approvalRate: rate(k.approved, k.submitted),
      denialRate: rate(k.denied, k.submitted),
    }))
    .sort((a, b) => {
      const order = [...LIFECYCLE_KINDS, "unclassified"];
      return order.indexOf(a.kind) - order.indexOf(b.kind);
    });

  return {
    hasEvents: events.length > 0,
    totalEvents: events.length,
    submitted,
    approved,
    denied,
    paused,
    resubmitted,
    unclassifiedEvents: unclassified,
    approvalRate: rate(approved, submitted),
    denialRate: rate(denied, submitted),
    byKind,
    weekly: [...weeks.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    denialReasons: [...denialReasons.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    pauseReasons: [...pauseReasons.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    sources: [...sources].sort(),
  };
}
