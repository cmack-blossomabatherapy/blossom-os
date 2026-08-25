/**
 * Phase 4B1 — decision-ready queues for the Authorization Command Center.
 *
 * Everything here is pure and source-dated. Three rules are non-negotiable:
 *
 * 1. **Only real recorded dates count.** Every date passes the shared strict
 *    calendar validator, so a missing, malformed, impossible or reversed value
 *    reads "Not documented" — never zero, never a deadline.
 * 2. **Resolved work is history, not a queue.** `isActionResolved` decides;
 *    a denial with a live appeal or next-action requirement stays unresolved.
 * 3. **A coverage gap is a question.** Service activity with no current
 *    coverage produces a *confirmation candidate* per client identity, never a
 *    confirmed pause and never a violation.
 */
import { classifyLifecycleKind, type LifecycleKind } from "./authorizationLifecycle";
import {
  NOT_DOCUMENTED,
  isActionResolved,
  validDay,
  type AuthorizationActionRow,
} from "./authorizationActions";
import { buildClientIdentityResolver } from "./clientIdentity";
import { finiteNumberOrNull } from "./numeric";
import { inDayRange } from "@/lib/os/reports/dateKey";

const text = (v: unknown, fallback: string) => String(v ?? "").trim() || fallback;

export interface DayRange {
  from: string;
  to: string;
}

/** True when a recorded date is real AND falls inside the selected range. */
export function eventInRange(value: unknown, range: DayRange): boolean {
  const day = validDay(value);
  if (!day) return false;
  return inDayRange(day, range.from, range.to);
}

// ---------------------------------------------------------------------------
// Action queues
// ---------------------------------------------------------------------------

export interface ActionQueueRow {
  key: string;
  client: string;
  clientCrId: string;
  authorizationNumber: string;
  state: string;
  payor: string;
  serviceCode: string;
  kind: LifecycleKind;
  status: string;
  nextAction: string;
  receivedDate: string | null;
  submittedDate: string | null;
  approvedDate: string | null;
  deniedDate: string | null;
  dueDate: string | null;
  daysOverdue: number | null;
  resolved: boolean;
  note: string;
}

export interface AuthorizationActionQueues {
  rows: ActionQueueRow[];
  /** Received, no submitted date recorded, and not resolved. */
  pendingSubmissions: ActionQueueRow[];
  /** Submitted, no approved/denied date recorded, and not resolved. */
  pendingDecisions: ActionQueueRow[];
  /** A real recorded due date already in the past, and not resolved. */
  overdueActions: ActionQueueRow[];
  /** Reauthorization / reassessment work still open. */
  reassessmentWork: ActionQueueRow[];
  resolvedRows: ActionQueueRow[];
  denials: ActionQueueRow[];
  /** Denials ÷ recorded decisions (approved + denied) in the selected range. */
  denialRatePct: number | null;
  decisionsInRange: number;
  denialReasons: { label: string; value: number }[];
}

/**
 * Queues built from source-dated authorization actions. The selected range is
 * applied to each real recorded date independently — an action never enters a
 * range because of an unrelated column.
 */
export function computeAuthorizationActionQueues(
  actions: AuthorizationActionRow[],
  range: DayRange,
  today: string,
): AuthorizationActionQueues {
  const rows: ActionQueueRow[] = actions.map((a, i) => {
    const receivedDate = validDay(a.received_date);
    const submittedDate = validDay(a.submitted_date);
    const approvedDate = validDay(a.approved_date);
    const deniedDate = validDay(a.denied_date);
    const dueDate = validDay(a.next_action_due_date) ?? validDay(a.appeal_due_date);
    const resolved = isActionResolved(a);
    const overdueDays =
      dueDate && dueDate < today
        ? Math.round(
            (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${dueDate}T00:00:00Z`)) / 86_400_000,
          )
        : null;
    return {
      key: `${a.record_id}-${i}`,
      client: text(a.client_name, "Unknown client"),
      clientCrId: text(a.client_cr_id, ""),
      authorizationNumber: text(a.authorization_number, NOT_DOCUMENTED),
      state: text(a.state, "Unknown"),
      payor: text(a.payor, "Unknown"),
      serviceCode: text(a.service_code, NOT_DOCUMENTED),
      kind: classifyLifecycleKind(a.auth_type),
      status: text(a.workflow_stage ?? a.status, NOT_DOCUMENTED),
      nextAction: text(a.next_action, NOT_DOCUMENTED),
      receivedDate,
      submittedDate,
      approvedDate,
      deniedDate,
      dueDate,
      daysOverdue: resolved ? null : overdueDays,
      resolved,
      note: resolved
        ? "Closed out in the source record — kept for history, not pending work."
        : dueDate
          ? overdueDays != null
            ? `Overdue by ${overdueDays} day(s) against the recorded due date.`
            : "Open with a recorded due date."
          : `Open · due date ${NOT_DOCUMENTED}.`,
    };
  });

  const open = rows.filter((r) => !r.resolved);
  const denials = rows.filter((r) => r.deniedDate != null && eventInRange(r.deniedDate, range));
  const approvals = rows.filter((r) => r.approvedDate != null && eventInRange(r.approvedDate, range));
  const decisionsInRange = denials.length + approvals.length;

  const reasons = new Map<string, number>();
  for (const a of actions) {
    if (!eventInRange(a.denied_date, range)) continue;
    const label = text(a.denial_reason, "Reason not documented");
    reasons.set(label, (reasons.get(label) ?? 0) + 1);
  }

  return {
    rows,
    pendingSubmissions: open.filter((r) => r.receivedDate != null && r.submittedDate == null),
    pendingDecisions: open.filter(
      (r) => r.submittedDate != null && r.approvedDate == null && r.deniedDate == null,
    ),
    overdueActions: open.filter((r) => r.daysOverdue != null),
    reassessmentWork: open.filter((r) => r.kind === "reauthorization"),
    resolvedRows: rows.filter((r) => r.resolved),
    denials,
    denialRatePct:
      decisionsInRange > 0 ? Math.round((denials.length / decisionsInRange) * 1000) / 10 : null,
    decisionsInRange,
    denialReasons: [...reasons.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
  };
}

// ---------------------------------------------------------------------------
// Source-dated event counts by service code and by authorization kind
// ---------------------------------------------------------------------------

export interface SourceEventCountRow {
  key: string;
  label: string;
  submitted: number;
  approved: number;
  denied: number;
}

const codeMatches = (serviceCode: unknown, code: string): boolean =>
  String(serviceCode ?? "").toLowerCase().includes(code.toLowerCase());

/**
 * Submitted / approved / denied counts per service code, where **each** date is
 * evaluated independently against the selected range. An approval inside the
 * range still counts when its submission happened earlier.
 */
export function computeCodeEventCounts(
  actions: AuthorizationActionRow[],
  codes: readonly string[],
  range: DayRange,
): SourceEventCountRow[] {
  return codes.map((code) => {
    const scoped = actions.filter((a) => codeMatches(a.service_code, code));
    return {
      key: code,
      label: code,
      submitted: scoped.filter((a) => eventInRange(a.submitted_date, range)).length,
      approved: scoped.filter((a) => eventInRange(a.approved_date, range)).length,
      denied: scoped.filter((a) => eventInRange(a.denied_date, range)).length,
    };
  });
}

export const AUTH_KIND_LABELS: Record<Exclude<LifecycleKind, "unclassified">, string> = {
  initial_assessment: "IA · Initial Assessment",
  initial_treatment: "IT · Initial Treatment",
  reauthorization: "RA · Reauthorization",
  progress_report: "PR · Progress Report",
};

/** IA / IT / RA / PR submitted, approved and denied source events in range. */
export function computeKindEventCounts(
  actions: AuthorizationActionRow[],
  range: DayRange,
): SourceEventCountRow[] {
  return (
    Object.keys(AUTH_KIND_LABELS) as Exclude<LifecycleKind, "unclassified">[]
  ).map((kind) => {
    const scoped = actions.filter((a) => classifyLifecycleKind(a.auth_type) === kind);
    return {
      key: kind,
      label: AUTH_KIND_LABELS[kind],
      submitted: scoped.filter((a) => eventInRange(a.submitted_date, range)).length,
      approved: scoped.filter((a) => eventInRange(a.approved_date, range)).length,
      denied: scoped.filter((a) => eventInRange(a.denied_date, range)).length,
    };
  });
}

// ---------------------------------------------------------------------------
// Service activity with no current coverage — confirmation candidates
// ---------------------------------------------------------------------------

export interface ServiceActivityRowInput {
  client_name?: string | null;
  client_cr_id?: string | null;
  date_of_service?: string | null;
  hours?: number | null;
  state?: string | null;
  payor?: string | null;
  is_void?: boolean | null;
  deleted?: boolean | null;
}

export interface CoverageGapIdentityInput {
  client: string;
  clientCrId?: string | null;
  state?: string | null;
  payor?: string | null;
  lastEnd: string | null;
}

export interface ServiceActivityWithoutCoverageRow {
  key: string;
  clientKey: string;
  client: string;
  clientCrId: string;
  state: string;
  payor: string;
  lastEnd: string | null;
  sessions: number;
  /** Sum of the hours that are actually recorded. Missing values are excluded. */
  hours: number;
  /** Sessions counted here whose hours are missing, blank or non-numeric. */
  missingHours: number;
  firstService: string | null;
  lastService: string | null;
  /** Always true: this is a question for staff, never a confirmed pause. */
  needsConfirmation: true;
  note: string;
  /** Plain-language data-quality note, or null when every session has hours. */
  dataQualityNote: string | null;
}

/**
 * Selected-range service activity intersected with the *current* continuity
 * coverage-gap identities. Identity is resolved CR-ID first across both inputs,
 * so an id-less billing row is never split from its own client, and the output
 * is one row per client identity.
 */
export function computeServiceActivityWithoutCoverage(
  serviceRows: ServiceActivityRowInput[],
  gaps: CoverageGapIdentityInput[],
): ServiceActivityWithoutCoverageRow[] {
  const identity = buildClientIdentityResolver(
    serviceRows.map((r) => ({ client_name: r.client_name, client_cr_id: r.client_cr_id })),
    gaps.map((g) => ({ client_name: g.client, client_cr_id: g.clientCrId })),
  );

  const gapByKey = new Map<string, CoverageGapIdentityInput>();
  for (const g of gaps) {
    const key = identity.keyFor(g.clientCrId, g.client);
    if (!gapByKey.has(key)) gapByKey.set(key, g);
  }

  const acc = new Map<string, ServiceActivityWithoutCoverageRow>();
  for (const r of serviceRows) {
    if (r.is_void || r.deleted) continue;
    const key = identity.keyFor(r.client_cr_id, r.client_name);
    const gap = gapByKey.get(key);
    if (!gap) continue;
    const day = validDay(r.date_of_service);
    // A blank, boolean or non-finite hours value is missing, never a real 0.
    const hours = finiteNumberOrNull(r.hours);
    if (!acc.has(key)) {
      acc.set(key, {
        key,
        clientKey: key,
        client: text(gap.client, text(r.client_name, "Unknown client")),
        clientCrId: text(gap.clientCrId ?? r.client_cr_id, ""),
        state: text(gap.state ?? r.state, "Unknown"),
        payor: text(gap.payor ?? r.payor, "Unknown"),
        lastEnd: gap.lastEnd,
        sessions: 0,
        hours: 0,
        missingHours: 0,
        firstService: null,
        lastService: null,
        needsConfirmation: true as const,
        note: "Service activity recorded in this range with no current authorization coverage — confirm with the authorization team before treating it as a pause.",
        dataQualityNote: null,
      });
    }
    const row = acc.get(key)!;
    row.sessions += 1;
    if (hours == null) row.missingHours += 1;
    else row.hours = Math.round((row.hours + hours) * 100) / 100;
    if (day) {
      if (!row.firstService || day < row.firstService) row.firstService = day;
      if (!row.lastService || day > row.lastService) row.lastService = day;
    }
  }

  for (const row of acc.values()) {
    row.dataQualityNote =
      row.missingHours > 0
        ? `${row.missingHours} of ${row.sessions} session(s) have no recorded hours, so the hour total covers the documented sessions only.`
        : null;
  }

  return [...acc.values()].sort((a, b) => b.sessions - a.sessions || a.client.localeCompare(b.client));
}
