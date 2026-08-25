/**
 * Pure export projections for the Authorization Command Center.
 *
 * Each of the four URL tabs exports *its own* data. Before this module the
 * page exported continuity rows for every tab except lifecycle, so a user on
 * the Pauses or Progress Reports tab silently downloaded the wrong dataset.
 *
 * Nothing here infers an event, a kind, or a date: lifecycle kind always comes
 * from the recorded `lifecycle_kind` / `auth_type` first and only then from the
 * event type text, exactly as the on-screen tables classify it.
 */
import {
  LIFECYCLE_KIND_LABELS,
  classifyLifecycleEvent,
  type LifecycleEventRow,
  type LifecycleKindRow,
} from "./authorizationLifecycle";
import {
  NO_AUTHORITATIVE_DUE,
  type PauseOps,
  type ProgressReportOps,
} from "./authorizationActions";
import type { ContinuityRow } from "./authorizationContinuity";

export type AuthorizationTabKey = "lifecycle" | "continuity" | "progress-reports" | "pauses";

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportProjection {
  name: string;
  rows: Record<string, unknown>[];
  columns: ExportColumn[];
}

export interface AuthorizationExportInput {
  events: LifecycleEventRow[];
  byKind: LifecycleKindRow[];
  continuityRows: ContinuityRow[];
  progress: ProgressReportOps;
  pauses: PauseOps;
}

const asText = (v: unknown, fallback = "") => String(v ?? "").trim() || fallback;

export const CONTINUITY_LABEL: Record<ContinuityRow["continuity"], string> = {
  active: "Active",
  expiring: "Expiring",
  expired: "Expired",
  not_started: "Not started",
  unknown_dates: "Dates missing",
};

export const RENEWAL_LABEL: Record<ContinuityRow["renewal"], string> = {
  needs_confirmation: "Confirm renewal",
  no_action: "No action",
  overdue: "Overdue",
};

export const CONTINUITY_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "authorizationNumber", label: "Authorization #" },
  { key: "client", label: "Client" },
  { key: "clientCrId", label: "CR Client Id" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "code", label: "Service Code" },
  { key: "startDate", label: "Start" },
  { key: "endDate", label: "End" },
  { key: "daysToExpiry", label: "Days To Expiry" },
  { key: "continuity", label: "Coverage" },
  { key: "renewal", label: "Renewal" },
  { key: "authorizedHours", label: "Authorized Hrs" },
  { key: "usedHours", label: "Used Hrs" },
  { key: "remainingHours", label: "Remaining Hrs" },
  { key: "note", label: "What This Means" },
];

export const LIFECYCLE_EVENT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "eventDate", label: "Event Date" },
  { key: "eventType", label: "Event Type" },
  { key: "kind", label: "Authorization Kind" },
  { key: "kindSource", label: "Kind Source" },
  { key: "action", label: "Outcome" },
  { key: "authorizationNumber", label: "Authorization #" },
  { key: "client", label: "Client" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "reason", label: "Reason / Note" },
  { key: "source", label: "Logged From" },
];

export const LIFECYCLE_MATRIX_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "label", label: "Authorization Kind" },
  { key: "submitted", label: "Submitted" },
  { key: "approved", label: "Approved" },
  { key: "denied", label: "Denied" },
  { key: "resubmitted", label: "Resubmitted" },
  { key: "paused", label: "Paused" },
  { key: "approvalRate", label: "Approval %" },
  { key: "denialRate", label: "Denial %" },
];

const PROGRESS_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "section", label: "Section" },
  { key: "client", label: "Client" },
  { key: "authorizationNumber", label: "Authorization #" },
  { key: "eventDate", label: "Event Date" },
  { key: "outcome", label: "Outcome" },
  { key: "status", label: "Stage" },
  { key: "nextAction", label: "Next Action" },
  { key: "dueDate", label: "Due Date" },
  { key: "dueStatus", label: "Due Status" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "reason", label: "Reason / Note" },
  { key: "source", label: "Logged From" },
];

const PAUSE_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "section", label: "Section" },
  { key: "client", label: "Client" },
  { key: "authorizationNumber", label: "Authorization #" },
  { key: "eventDate", label: "Pause Date" },
  { key: "lastEnd", label: "Last Coverage End" },
  { key: "reason", label: "Reason" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "note", label: "Next Step" },
  { key: "source", label: "Logged From" },
];

/** The recorded kind wins; the event text is only a fallback. */
export function eventKindInput(event: LifecycleEventRow): string | null {
  return event.lifecycle_kind ?? event.auth_type ?? null;
}

export interface LifecycleEventProjection extends Record<string, unknown> {
  eventDate: string;
  eventType: string;
  kind: string;
  kindSource: string;
  action: string;
  authorizationNumber: string;
  client: string;
  payor: string;
  state: string;
  reason: string;
  source: string;
}

/** Row-level lifecycle projection shared by the table, drilldowns, and export. */
export function projectLifecycleEvent(event: LifecycleEventRow): LifecycleEventProjection {
  const explicit = eventKindInput(event);
  const c = classifyLifecycleEvent(event.event_type, explicit);
  return {
    eventDate: asText(event.event_date).slice(0, 10),
    eventType: asText(event.event_type, "Not documented"),
    kind: LIFECYCLE_KIND_LABELS[c.kind],
    kindSource: explicit ? "Recorded authorization type" : "Parsed from event type",
    action: c.action,
    authorizationNumber: asText(event.authorization_number, "Not documented"),
    client: asText(event.client_name, "Unknown client"),
    payor: asText(event.payor),
    state: asText(event.state),
    reason: asText(event.reason, "Not documented"),
    source: asText(event.source, "Not documented"),
  };
}

export function projectContinuityRows(rows: ContinuityRow[]): Record<string, unknown>[] {
  return rows.map((r) => ({
    authorizationNumber: r.authorizationNumber,
    client: r.client,
    clientCrId: r.clientCrId,
    payor: r.payor,
    state: r.state,
    code: r.code,
    startDate: r.startDate ?? "Not documented",
    endDate: r.endDate ?? "Not documented",
    daysToExpiry: r.daysToExpiry ?? "Unknown",
    continuity: CONTINUITY_LABEL[r.continuity],
    renewal: RENEWAL_LABEL[r.renewal],
    authorizedHours: r.authorizedHours ?? "Not documented",
    usedHours: r.usedHours ?? "Not documented",
    remainingHours: r.remainingHours ?? "Not documented",
    note: r.note,
  }));
}

/** Build the CSV projection for the tab the user is actually looking at. */
export function buildAuthorizationTabExport(
  tab: AuthorizationTabKey,
  input: AuthorizationExportInput,
): ExportProjection {
  if (tab === "lifecycle") {
    if (input.events.length > 0) {
      return {
        name: "authorization-lifecycle-events",
        rows: input.events.map(projectLifecycleEvent),
        columns: LIFECYCLE_EVENT_EXPORT_COLUMNS,
      };
    }
    return {
      name: "authorization-lifecycle-matrix",
      rows: input.byKind.map((k) => ({ ...k })),
      columns: LIFECYCLE_MATRIX_EXPORT_COLUMNS,
    };
  }

  if (tab === "progress-reports") {
    const rows: Record<string, unknown>[] = [
      ...input.progress.events.map((e) => ({
        section: "Progress-report event",
        client: e.client,
        authorizationNumber: e.authorizationNumber,
        eventDate: e.eventDate ?? "Not documented",
        outcome: e.outcome,
        status: "",
        nextAction: "",
        dueDate: "",
        dueStatus: "",
        payor: e.payor,
        state: e.state,
        reason: e.reason,
        source: e.source,
      })),
      ...input.progress.dueRows.map((r) => ({
        section: "Progress-report due",
        client: r.client,
        authorizationNumber: r.authorizationNumber,
        eventDate: "",
        outcome: "",
        status: r.status,
        nextAction: r.nextAction,
        dueDate: r.dueDate ?? NO_AUTHORITATIVE_DUE,
        dueStatus: r.overdue ? "Overdue" : r.dueSource === "none" ? "No due date" : "On track",
        payor: r.payor,
        state: r.state,
        reason: r.note,
        source: "",
      })),
    ];
    return { name: "authorization-progress-reports", rows, columns: PROGRESS_EXPORT_COLUMNS };
  }

  if (tab === "pauses") {
    const rows: Record<string, unknown>[] = [
      ...input.pauses.confirmedPauses.map((p) => ({
        section: "Confirmed pause",
        client: p.client,
        authorizationNumber: p.authorizationNumber,
        eventDate: p.eventDate ?? "Not documented",
        lastEnd: "",
        reason: p.reason,
        payor: p.payor,
        state: p.state,
        note: "",
        source: p.source,
      })),
      ...input.pauses.candidates.map((c) => ({
        section: "Needs Confirmation",
        client: c.client,
        authorizationNumber: "",
        eventDate: "",
        lastEnd: c.lastEnd ?? "Not documented",
        reason: "",
        payor: c.payor,
        state: c.state,
        note: c.note,
        source: "",
      })),
    ];
    return { name: "authorization-pauses", rows, columns: PAUSE_EXPORT_COLUMNS };
  }

  return {
    name: "authorization-continuity",
    rows: projectContinuityRows(input.continuityRows),
    columns: CONTINUITY_EXPORT_COLUMNS,
  };
}
