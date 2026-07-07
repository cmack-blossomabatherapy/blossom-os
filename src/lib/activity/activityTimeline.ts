/**
 * Unified Activity Timeline model.
 *
 * Pure types + helpers that normalize lead actions, source events,
 * communications, tasks, escalations, and system/audit events into a
 * single ActivityEvent shape used by Activity Center, Patient Activity,
 * User Activity, Patient Lifetime Journey, and lead detail drawers.
 *
 * Production data path is database-backed:
 *   - `marketing_source_events`
 *   - `marketing_call_events`
 *   - `marketing_email_events`
 *   - `operations_work_items` + `operations_work_item_events`
 *
 * `activityFromSourceEvent` remains a pure type helper for callers that
 * already have a normalized LeadSourceEvent shape. No production feed uses
 * any in-memory source-event store or seeded mock activity.
 */
import { useEffect, useState } from "react";
import {
  Activity as ActivityIcon,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  Inbox,
  KeyRound,
  Mail,
  MessageSquare,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PlugZap,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserCheck,
  UserPlus,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { LeadSourceEvent } from "@/lib/leads/leadSourceEvents";
import type { WorkItem } from "@/lib/workQueue/workQueueModel";
import { supabase } from "@/integrations/supabase/client";
import {
  mapRowToEvent,
  type MarketingSourceEventRow,
} from "@/lib/marketing/sourceEventMapper";

export type ActivityObjectType =
  | "lead"
  | "patient"
  | "user"
  | "employee"
  | "referral_partner"
  | "task"
  | "source_event"
  | "call"
  | "email"
  | "system";

export type ActivityEventType =
  | "lead_created"
  | "lead_updated"
  | "stage_changed"
  | "contact_logged"
  | "call_received"
  | "call_made"
  | "email_received"
  | "email_sent"
  | "sms_received"
  | "sms_sent"
  | "note_added"
  | "task_created"
  | "task_completed"
  | "task_reassigned"
  | "missing_info_flagged"
  | "missing_info_resolved"
  | "escalation_created"
  | "escalation_resolved"
  | "source_event_received"
  | "source_event_converted"
  | "source_event_attached"
  | "login_viewed"
  | "nfc_badge_updated"
  | "report_viewed"
  | "file_uploaded"
  | "integration_event"
  | "work_item_created"
  | "work_item_assigned"
  | "work_item_updated"
  | "work_item_completed"
  | "work_item_escalated"
  | "work_item_escalation_resolved"
  | "system_audit";

export type ActivitySeverity = "info" | "success" | "warning" | "critical";
export type ActivityStatus = "open" | "complete" | "ignored" | "error";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  objectType: ActivityObjectType;
  objectId?: string;
  objectLabel?: string;
  relatedLeadId?: string;
  relatedPatientId?: string;
  relatedUserId?: string;
  actorUserId?: string;
  actorName?: string;
  actorRole?: string;
  occurredAt: string;
  title: string;
  summary?: string;
  sourceSystem?: string;
  sourceUrl?: string;
  campaign?: string;
  severity?: ActivitySeverity;
  status?: ActivityStatus;
  metadata?: Record<string, unknown>;
}

/* ---------------------------- Normalization ---------------------------- */

export function normalizeActivityEvent(input: Partial<ActivityEvent>): ActivityEvent {
  const id =
    input.id ?? `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    type: input.type ?? "system_audit",
    objectType: input.objectType ?? "system",
    objectId: input.objectId,
    objectLabel: input.objectLabel,
    relatedLeadId: input.relatedLeadId,
    relatedPatientId: input.relatedPatientId,
    relatedUserId: input.relatedUserId,
    actorUserId: input.actorUserId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    title: input.title ?? "Activity",
    summary: input.summary,
    sourceSystem: input.sourceSystem,
    sourceUrl: input.sourceUrl,
    campaign: input.campaign,
    severity: input.severity ?? "info",
    status: input.status,
    metadata: input.metadata,
  };
}

/* ---------------------------- Adapters ---------------------------- */

export function activityFromLeadAction(args: {
  leadId: string;
  leadLabel: string;
  type: ActivityEventType;
  title: string;
  summary?: string;
  actorName?: string;
  actorRole?: string;
  severity?: ActivitySeverity;
  occurredAt?: string;
}): ActivityEvent {
  return normalizeActivityEvent({
    type: args.type,
    objectType: "lead",
    objectId: args.leadId,
    objectLabel: args.leadLabel,
    relatedLeadId: args.leadId,
    title: args.title,
    summary: args.summary,
    actorName: args.actorName,
    actorRole: args.actorRole,
    severity: args.severity ?? "info",
    occurredAt: args.occurredAt,
    sourceSystem: "Blossom OS",
  });
}

export function activityFromSourceEvent(event: LeadSourceEvent): ActivityEvent {
  const family = [event.parentFirstName, event.parentLastName].filter(Boolean).join(" ");
  const child = [event.childFirstName, event.childLastName].filter(Boolean).join(" ");
  const label = family || child || event.phone || event.email || "Unknown contact";

  let type: ActivityEventType = "source_event_received";
  let severity: ActivitySeverity = "info";
  let title = `${event.sourceLabel} — inbound`;

  if (event.status === "converted_to_lead") {
    type = "source_event_converted";
    severity = "success";
    title = `Lead created from ${event.sourceLabel}`;
  } else if (event.status === "attached_to_existing_lead") {
    type = "source_event_attached";
    severity = "success";
    title = `${event.sourceLabel} attached to existing lead`;
  } else if (event.status === "possible_duplicate" || event.status === "needs_review") {
    severity = "warning";
    title = `${event.sourceLabel} — needs review`;
  } else if (event.status === "error") {
    severity = "critical";
    title = `${event.sourceLabel} — ingestion error`;
  } else if (event.status === "ignored") {
    title = `${event.sourceLabel} — ignored`;
  }

  const summaryBits = [
    event.summary,
    event.campaign ? `Campaign: ${event.campaign}` : null,
    event.referralPartner ? `Partner: ${event.referralPartner}` : null,
    event.state ? `State: ${event.state}` : null,
  ].filter(Boolean);

  return normalizeActivityEvent({
    id: `src_${event.id}`,
    type,
    objectType: "source_event",
    objectId: event.id,
    objectLabel: label,
    relatedLeadId: event.resolvedLeadId ?? event.matchedLeadId,
    title,
    summary: summaryBits.join(" · ") || undefined,
    severity,
    occurredAt: event.resolvedAt ?? event.receivedAt,
    sourceSystem: event.sourceLabel,
    sourceUrl: event.externalUrl,
    campaign: event.campaign ?? event.utmCampaign,
    status: event.status === "ignored" ? "ignored" : undefined,
    metadata: {
      sourceEventType: event.sourceEventType,
      externalId: event.externalId,
      callRecordingUrl: event.callRecordingUrl,
      campaignId: event.campaignId,
      sourceRowId: event.sourceRowId,
    },
  });
}

export function activityFromCommunication(args: {
  id?: string;
  direction: "inbound" | "outbound";
  channel: "call" | "email" | "sms";
  title: string;
  summary?: string;
  relatedLeadId?: string;
  relatedPatientId?: string;
  actorName?: string;
  occurredAt?: string;
}): ActivityEvent {
  const map: Record<string, ActivityEventType> = {
    "inbound-call": "call_received",
    "outbound-call": "call_made",
    "inbound-email": "email_received",
    "outbound-email": "email_sent",
    "inbound-sms": "sms_received",
    "outbound-sms": "sms_sent",
  };
  return normalizeActivityEvent({
    id: args.id,
    type: map[`${args.direction}-${args.channel}`] ?? "note_added",
    objectType: args.channel === "email" ? "email" : "call",
    title: args.title,
    summary: args.summary,
    relatedLeadId: args.relatedLeadId,
    relatedPatientId: args.relatedPatientId,
    actorName: args.actorName,
    occurredAt: args.occurredAt,
    sourceSystem: args.channel === "call" ? "Phone System" : "Communications",
  });
}

export function activityFromTask(args: {
  id?: string;
  title: string;
  summary?: string;
  status: "open" | "complete" | "reassigned";
  relatedLeadId?: string;
  actorName?: string;
  occurredAt?: string;
}): ActivityEvent {
  const type: ActivityEventType =
    args.status === "complete"
      ? "task_completed"
      : args.status === "reassigned"
      ? "task_reassigned"
      : "task_created";
  return normalizeActivityEvent({
    id: args.id,
    type,
    objectType: "task",
    title: args.title,
    summary: args.summary,
    relatedLeadId: args.relatedLeadId,
    actorName: args.actorName,
    occurredAt: args.occurredAt,
    severity: args.status === "complete" ? "success" : "info",
    status: args.status === "complete" ? "complete" : "open",
  });
}

export function activityFromEscalation(args: {
  id?: string;
  title: string;
  summary?: string;
  resolved?: boolean;
  relatedLeadId?: string;
  actorName?: string;
  occurredAt?: string;
}): ActivityEvent {
  return normalizeActivityEvent({
    id: args.id,
    type: args.resolved ? "escalation_resolved" : "escalation_created",
    objectType: "lead",
    title: args.title,
    summary: args.summary,
    relatedLeadId: args.relatedLeadId,
    actorName: args.actorName,
    occurredAt: args.occurredAt,
    severity: args.resolved ? "success" : "critical",
    status: args.resolved ? "complete" : "open",
  });
}

/* ---------------------------- Display helpers ---------------------------- */

export function getActivityIcon(type: ActivityEventType): LucideIcon {
  switch (type) {
    case "lead_created":
      return UserPlus;
    case "lead_updated":
    case "stage_changed":
      return ArrowRightLeft;
    case "contact_logged":
    case "note_added":
      return MessageSquare;
    case "call_received":
      return PhoneIncoming;
    case "call_made":
      return PhoneOutgoing;
    case "email_received":
    case "email_sent":
      return Mail;
    case "sms_received":
    case "sms_sent":
      return MessageSquare;
    case "task_created":
    case "task_completed":
    case "task_reassigned":
      return ClipboardList;
    case "missing_info_flagged":
    case "missing_info_resolved":
      return AlertTriangle;
    case "escalation_created":
    case "escalation_resolved":
      return Sparkles;
    case "source_event_received":
      return Inbox;
    case "source_event_converted":
      return UserCheck;
    case "source_event_attached":
      return Workflow;
    case "login_viewed":
      return KeyRound;
    case "nfc_badge_updated":
      return ShieldCheck;
    case "report_viewed":
      return FileText;
    case "file_uploaded":
      return UploadCloud;
    case "integration_event":
      return PlugZap;
    case "work_item_created":
    case "work_item_assigned":
    case "work_item_updated":
      return ClipboardList;
    case "work_item_completed":
      return CheckCircle2;
    case "work_item_escalated":
    case "work_item_escalation_resolved":
      return Sparkles;
    case "system_audit":
      return CheckCircle2;
    default:
      return ActivityIcon;
  }
}

export function getActivityColor(
  type: ActivityEventType,
  severity: ActivitySeverity = "info",
): string {
  if (severity === "critical") return "text-red-600 bg-red-50 border-red-200";
  if (severity === "warning") return "text-amber-700 bg-amber-50 border-amber-200";
  if (severity === "success") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  switch (type) {
    case "call_received":
    case "call_made":
      return "text-sky-700 bg-sky-50 border-sky-200";
    case "email_received":
    case "email_sent":
      return "text-indigo-700 bg-indigo-50 border-indigo-200";
    case "source_event_received":
    case "source_event_converted":
    case "source_event_attached":
      return "text-violet-700 bg-violet-50 border-violet-200";
    case "login_viewed":
    case "nfc_badge_updated":
    case "system_audit":
      return "text-slate-700 bg-slate-50 border-slate-200";
    default:
      return "text-foreground bg-muted/40 border-border/60";
  }
}

export function formatActivityTitle(event: ActivityEvent): string {
  if (event.title) return event.title;
  return event.type.replace(/_/g, " ");
}

/* ---------------------------- Filtering / grouping ---------------------------- */

export interface ActivityFilters {
  search?: string;
  objectType?: ActivityObjectType | "all";
  eventType?: ActivityEventType | "all";
  severity?: ActivitySeverity | "all";
  sourceSystem?: string | "all";
  campaign?: string | "all";
  relatedLeadId?: string;
  relatedUserId?: string;
}

export function filterActivityEvents(
  events: ActivityEvent[],
  filters: ActivityFilters,
): ActivityEvent[] {
  const q = filters.search?.trim().toLowerCase();
  return events.filter((e) => {
    if (filters.objectType && filters.objectType !== "all" && e.objectType !== filters.objectType)
      return false;
    if (filters.eventType && filters.eventType !== "all" && e.type !== filters.eventType)
      return false;
    if (filters.severity && filters.severity !== "all" && (e.severity ?? "info") !== filters.severity)
      return false;
    if (
      filters.sourceSystem &&
      filters.sourceSystem !== "all" &&
      (e.sourceSystem ?? "") !== filters.sourceSystem
    )
      return false;
    if (
      filters.campaign &&
      filters.campaign !== "all" &&
      (e.campaign ?? "") !== filters.campaign
    )
      return false;
    if (filters.relatedLeadId && e.relatedLeadId !== filters.relatedLeadId) return false;
    if (filters.relatedUserId && e.relatedUserId !== filters.relatedUserId) return false;
    if (q) {
      const hay = [
        e.title,
        e.summary,
        e.objectLabel,
        e.actorName,
        e.actorRole,
        e.sourceSystem,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortActivityNewestFirst(events: ActivityEvent[]): ActivityEvent[] {
  return [...events].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

export function groupActivityByDate(events: ActivityEvent[]): { label: string; events: ActivityEvent[] }[] {
  const today = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const todayStart = startOfDay(today);
  const yesterdayStart = todayStart - 86_400_000;

  const buckets = new Map<string, ActivityEvent[]>();
  for (const e of sortActivityNewestFirst(events)) {
    const t = new Date(e.occurredAt);
    const ts = startOfDay(t);
    let label: string;
    if (ts === todayStart) label = "Today";
    else if (ts === yesterdayStart) label = "Yesterday";
    else label = t.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const arr = buckets.get(label) ?? [];
    arr.push(e);
    buckets.set(label, arr);
  }
  return Array.from(buckets, ([label, events]) => ({ label, events }));
}

/* ---------------------------- Aggregated feed ---------------------------- */

/**
 * Synchronous fallback feed. Production surfaces should always prefer the
 * async `fetchActivityFeed()` / `useActivityFeed()` paths, which pull from
 * Supabase. Kept as an empty-array stub for any legacy call sites so they
 * never surface seeded/mock work queue items.
 */
export function buildActivityFeed(): ActivityEvent[] {
  return [];
}

/**
 * Legacy no-op subscription. The realtime Supabase subscription lives inside
 * `useActivityFeed()`. This shim exists only so older callers do not crash.
 */
export function subscribeActivityFeed(_listener: (events: ActivityEvent[]) => void): () => void {
  return () => {};
}

/* ---------------------------- Database-backed feed ---------------------------- */

interface MarketingCallRow {
  id: string;
  occurred_at: string;
  source_system: string | null;
  caller_name: string | null;
  caller_phone: string | null;
  transcript_summary: string | null;
  status: string | null;
  lead_id: string | null;
  recording_url: string | null;
  direction?: string | null;
  duration_seconds?: number | null;
  disposition?: string | null;
  call_category?: string | null;
  source_id?: string | null;
  campaign_id?: string | null;
}

interface OperationsWorkItemRow {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  department: string | null;
  owner_id: string | null;
  owner_name: string | null;
  assigned_role: string | null;
  state: string | null;
  priority: string | null;
  status: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string | null;
  escalated_at: string | null;
  resolved_at: string | null;
  snoozed_until: string | null;
  related_lead_id: string | null;
  related_patient_id: string | null;
  related_user_id: string | null;
  source_system: string | null;
  tags: string[] | null;
  escalation_reason: string | null;
  escalation_level: number | null;
  resolution_notes: string | null;
  metadata: Record<string, unknown> | null;
}

interface OperationsWorkItemEventRow {
  id: string;
  work_item_id: string;
  event_type: string;
  message: string | null;
  actor_id: string | null;
  actor_name: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

function rowToWorkItem(r: OperationsWorkItemRow): WorkItem {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    type: (r.type as WorkItem["type"]) ?? "general_task",
    department: (r.department as WorkItem["department"]) ?? "Operations Leadership",
    ownerId: r.owner_id ?? undefined,
    ownerName: r.owner_name ?? undefined,
    assignedRole: r.assigned_role ?? undefined,
    state: r.state ?? undefined,
    priority: (r.priority as WorkItem["priority"]) ?? "normal",
    status: (r.status as WorkItem["status"]) ?? "open",
    dueDate: r.due_date ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? undefined,
    escalatedAt: r.escalated_at ?? undefined,
    resolvedAt: r.resolved_at ?? undefined,
    snoozedUntil: r.snoozed_until ?? undefined,
    relatedLeadId: r.related_lead_id ?? undefined,
    relatedPatientId: r.related_patient_id ?? undefined,
    relatedUserId: r.related_user_id ?? undefined,
    sourceSystem: r.source_system ?? undefined,
    tags: r.tags ?? [],
    escalationReason: r.escalation_reason ?? undefined,
    escalationLevel: (r.escalation_level as WorkItem["escalationLevel"]) ?? undefined,
    resolutionNotes: r.resolution_notes ?? undefined,
    metadata: r.metadata ?? undefined,
  };
}

const WORK_ITEM_EVENT_TITLES: Record<string, { title: (msg?: string | null) => string; type: ActivityEventType; severity: ActivitySeverity }> = {
  work_item_created: { title: () => "Work item created", type: "work_item_created", severity: "info" },
  work_item_updated: { title: () => "Work item updated", type: "work_item_updated", severity: "info" },
  work_item_assigned: { title: () => "Work item assigned", type: "work_item_assigned", severity: "info" },
  work_item_status_changed: { title: () => "Status changed", type: "work_item_updated", severity: "info" },
  work_item_snoozed: { title: () => "Snoozed", type: "work_item_updated", severity: "info" },
  work_item_escalated: { title: () => "Escalated", type: "work_item_escalated", severity: "warning" },
  work_item_escalation_resolved: { title: () => "Escalation resolved", type: "work_item_escalation_resolved", severity: "success" },
  work_item_completed: { title: () => "Completed", type: "work_item_completed", severity: "success" },
  note_added: { title: () => "Note added", type: "note_added", severity: "info" },
};

function activityFromWorkItemEvent(
  ev: OperationsWorkItemEventRow,
  item?: WorkItem,
): ActivityEvent {
  const preset = WORK_ITEM_EVENT_TITLES[ev.event_type] ?? WORK_ITEM_EVENT_TITLES.work_item_updated;
  const suffix = item?.title ? ` — ${item.title}` : "";
  return normalizeActivityEvent({
    id: `wie_${ev.id}`,
    type: preset.type,
    objectType: "task",
    objectId: ev.work_item_id,
    objectLabel: item?.title ?? item?.department,
    relatedLeadId: item?.relatedLeadId,
    relatedPatientId: item?.relatedPatientId,
    relatedUserId: item?.relatedUserId,
    actorUserId: ev.actor_id ?? undefined,
    actorName: ev.actor_name ?? item?.ownerName,
    actorRole: item?.department,
    occurredAt: ev.created_at,
    title: preset.title() + suffix,
    summary: ev.message ?? undefined,
    sourceSystem: item?.sourceSystem ?? "Work Queue",
    severity: preset.severity,
    metadata: ev.metadata ?? undefined,
  });
}

interface MarketingEmailRow {
  id: string;
  occurred_at: string;
  event_type: string | null;
  subject: string | null;
  recipient_email: string | null;
  list_name: string | null;
  campaign_id: string | null;
  lead_id: string | null;
}

function activityFromMarketingCall(row: MarketingCallRow): ActivityEvent {
  const outbound = (row.direction ?? "").toLowerCase() === "outbound";
  const summaryBits = [
    row.transcript_summary ?? undefined,
    row.disposition ? `Disposition: ${row.disposition}` : undefined,
    row.call_category && row.call_category !== "unknown"
      ? `Category: ${row.call_category}`
      : undefined,
  ].filter(Boolean) as string[];
  return normalizeActivityEvent({
    id: `mcall_${row.id}`,
    type: outbound ? "call_made" : "call_received",
    objectType: "call",
    objectId: row.id,
    objectLabel: row.caller_name ?? row.caller_phone ?? "Unknown caller",
    relatedLeadId: row.lead_id ?? undefined,
    title: outbound
      ? `Outbound call — ${row.caller_name ?? row.caller_phone ?? "unknown"}`
      : `Inbound call — ${row.caller_name ?? row.caller_phone ?? "unknown"}`,
    summary: summaryBits.join(" · ") || undefined,
    sourceSystem: row.source_system ?? "Phone System",
    sourceUrl: row.recording_url ?? undefined,
    occurredAt: row.occurred_at,
    severity: row.status === "missed" ? "warning" : "info",
    metadata: {
      occurredAt: row.occurred_at,
      sourceId: row.source_id ?? undefined,
      campaignId: row.campaign_id ?? undefined,
      disposition: row.disposition ?? undefined,
      callCategory: row.call_category ?? undefined,
      direction: row.direction ?? undefined,
      durationSeconds: row.duration_seconds ?? undefined,
    },
  });
}

function activityFromMarketingEmail(row: MarketingEmailRow): ActivityEvent {
  const type: ActivityEventType =
    (row.event_type ?? "").toLowerCase().includes("open") ||
    (row.event_type ?? "").toLowerCase().includes("receiv")
      ? "email_received"
      : "email_sent";
  return normalizeActivityEvent({
    id: `memail_${row.id}`,
    type,
    objectType: "email",
    objectId: row.id,
    objectLabel: row.subject ?? row.recipient_email ?? "Email",
    relatedLeadId: row.lead_id ?? undefined,
    title: row.subject ?? (type === "email_received" ? "Email received" : "Email sent"),
    summary: row.list_name ? `List: ${row.list_name}` : undefined,
    sourceSystem: "Mailchimp",
    occurredAt: row.occurred_at,
  });
}

/**
 * Fetch the merged, database-backed activity feed. Combines Marketing source
 * events, call events, email events, and local Work Queue items into a single
 * chronologically-sorted list.
 */
export async function fetchActivityFeed(
  { limit = 300 }: { limit?: number } = {},
): Promise<ActivityEvent[]> {
  const [srcRes, callRes, emailRes, wiRes, wiEventRes] = await Promise.all([
    supabase
      .from("marketing_source_events")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(limit),
    supabase
      .from("marketing_call_events")
      .select(
        "id, occurred_at, source_system, caller_name, caller_phone, transcript_summary, status, lead_id, recording_url, direction, duration_seconds, disposition, call_category, source_id, campaign_id",
      )
      .order("occurred_at", { ascending: false })
      .limit(limit),
    supabase
      .from("marketing_email_events")
      .select("id, occurred_at, event_type, subject, recipient_email, list_name, campaign_id, lead_id")
      .order("occurred_at", { ascending: false })
      .limit(limit),
    supabase
      .from("operations_work_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("operations_work_item_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const sourceEvents = ((srcRes.data ?? []) as MarketingSourceEventRow[])
    .map(mapRowToEvent)
    .map(activityFromSourceEvent);
  const callEvents = ((callRes.data ?? []) as unknown as MarketingCallRow[]).map(
    activityFromMarketingCall,
  );
  const emailEvents = ((emailRes.data ?? []) as unknown as MarketingEmailRow[]).map(
    activityFromMarketingEmail,
  );
  const workItems = ((wiRes.data ?? []) as unknown as OperationsWorkItemRow[]).map(rowToWorkItem);
  const workItemsById = new Map(workItems.map((w) => [w.id, w]));
  const workEvents = workItems.map(activityFromWorkItem);
  const workItemEvents = ((wiEventRes.data ?? []) as unknown as OperationsWorkItemEventRow[]).map(
    (ev) => activityFromWorkItemEvent(ev, workItemsById.get(ev.work_item_id)),
  );

  return sortActivityNewestFirst([
    ...sourceEvents,
    ...callEvents,
    ...emailEvents,
    ...workEvents,
    ...workItemEvents,
  ]);
}

/**
 * React hook that loads the database-backed activity feed, live-updates on
 * Marketing table changes and Work Queue changes, and exposes a `refresh()`.
 */
export function useActivityFeed({ limit = 300 }: { limit?: number } = {}) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const feed = await fetchActivityFeed({ limit });
        if (!cancelled) {
          setEvents(feed);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error)?.message ?? "Failed to load activity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();

    const channel = supabase
      .channel("activity-feed-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marketing_source_events" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marketing_call_events" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marketing_email_events" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operations_work_items" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operations_work_item_events" },
        () => void load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [limit]);

  return { events, loading, error, refresh: () => fetchActivityFeed({ limit }).then(setEvents) };
}

/** Normalize a WorkItem into the most representative activity event. */
export function activityFromWorkItem(item: WorkItem): ActivityEvent {
  let type: ActivityEventType = "work_item_created";
  let severity: ActivitySeverity = "info";
  let title = `Work item created — ${item.title}`;
  let occurredAt = item.createdAt;

  if (item.status === "escalated") {
    type = "work_item_escalated";
    severity = item.priority === "critical" ? "critical" : "warning";
    title = `Escalated — ${item.title}`;
    occurredAt = item.escalatedAt ?? occurredAt;
  } else if (item.status === "resolved" || item.status === "closed") {
    type = "work_item_completed";
    severity = "success";
    title = `Resolved — ${item.title}`;
    occurredAt = item.resolvedAt ?? occurredAt;
  } else if (item.updatedAt && item.updatedAt !== item.createdAt) {
    type = "work_item_updated";
    occurredAt = item.updatedAt;
    title = `Updated — ${item.title}`;
  }

  return normalizeActivityEvent({
    id: `wi_${item.id}_${type}`,
    type,
    objectType: "task",
    objectId: item.id,
    objectLabel: item.department,
    relatedLeadId: item.relatedLeadId,
    relatedPatientId: item.relatedPatientId,
    relatedUserId: item.relatedUserId,
    actorName: item.ownerName,
    actorRole: item.department,
    occurredAt,
    title,
    summary: item.escalationReason ?? item.description,
    sourceSystem: item.sourceSystem ?? "Work Queue",
    severity,
    status: item.status === "resolved" || item.status === "closed" ? "complete" : "open",
  });
}

/** Distinct source-system labels currently in the feed (for filter UIs). */
export function listKnownSourceSystems(events: ActivityEvent[]): string[] {
  return Array.from(new Set(events.map((e) => e.sourceSystem).filter(Boolean) as string[])).sort();
}

/** Distinct campaign labels currently in the feed (for filter UIs). */
export function listKnownCampaigns(events: ActivityEvent[]): string[] {
  return Array.from(new Set(events.map((e) => e.campaign).filter(Boolean) as string[])).sort();
}

/** Distinct event types currently in the feed (for filter UIs). */
export function listKnownEventTypes(events: ActivityEvent[]): ActivityEventType[] {
  return Array.from(new Set(events.map((e) => e.type))).sort() as ActivityEventType[];
}