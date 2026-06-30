import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Authorization, AuthStage, AuthType } from "@/data/authorizations";

/**
 * Live authorizations merged from three sources of truth:
 *   1. `monday_authorizations_raw`   — historical import feed
 *   2. `authorization_operational_records` — Blossom OS operational overlay
 *      (manual records, CentralReach-ready records, and Monday overrides)
 *   3. `authorization_requirements`, `authorization_tasks`, `authorization_activity`
 *      — attached child records that surface in detail drawers
 *
 * Rules:
 * - If an overlay row exists for a Monday item (matched by monday_item_id),
 *   the overlay values override the Monday raw values.
 * - Overlay rows with no monday_item_id (manual / CR sources) always appear.
 * - Manual records created from NewAuthorizationDialog show up immediately.
 */

const PAGE_SIZE = 1000;

interface RawAuthRow {
  id: string;
  monday_item_id: string | null;
  monday_group: string | null;
  name: string | null;
  state: string | null;
  status: string | null;
  owner: string | null;
  data: Record<string, unknown>;
  updated_at: string;
  imported_at: string;
}

interface OverlayRow {
  id: string;
  source_system: string | null;
  monday_item_id: string | null;
  centralreach_authorization_id: string | null;
  centralreach_client_id: string | null;
  centralreach_sync_status: string | null;
  centralreach_last_synced_at: string | null;
  client_name: string | null;
  state: string | null;
  payer: string | null;
  auth_type: string | null;
  status: string | null;
  workflow_stage: string | null;
  assigned_owner: string | null;
  assigned_bcba: string | null;
  assigned_auth_coordinator: string | null;
  qa_owner: string | null;
  submitted_date: string | null;
  approved_date: string | null;
  expiration_date: string | null;
  start_date: string | null;
  denial_reason: string | null;
  next_action: string | null;
  next_action_due_date: string | null;
  authorization_number: string | null;
  tracking_number: string | null;
  service_code: string | null;
  authorized_hours: number | null;
  used_hours: number | null;
  priority: string | null;
  updated_at: string;
  created_at: string;
}

interface RequirementRow {
  id: string;
  authorization_id: string | null;
  title: string | null;
  status: string | null;
  due_date: string | null;
}

interface TaskRow {
  id: string;
  authorization_id: string | null;
  title: string | null;
  status: string | null;
  due_date: string | null;
  owner_user: string | null;
}

interface ActivityRow {
  id: string;
  authorization_id: string | null;
  activity_type: string | null;
  title: string | null;
  body: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  created_by: string | null;
}

/** QA persisted overrides keyed by (source_system, source_record_id). */
interface QAOverrideRow {
  id: string;
  source_system: string;
  source_record_id: string;
  monday_item_id: string | null;
  client_id: string | null;
  assigned_qa_owner: string | null;
  qa_status: string | null;
  priority: string | null;
  next_action: string | null;
  blockers: string[] | null;
  alerts: string[] | null;
  notes: string | null;
  escalated: boolean | null;
  escalation_reason: string | null;
  last_action_at: string | null;
}

function pickIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
function pickString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length ? v : null;
}
function truthyText(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  return v.length > 0 && v !== "no" && v !== "false" && v !== "n/a" && v !== "none";
}

function mapStage(status: string | null, group: string | null): AuthStage {
  const s = (status ?? "").trim();
  switch (s) {
    case "Approved":
    case "Partial Approval":
      return "Approved";
    case "Denied":
      return "Denied";
    case "Expiring Soon":
      return "Expiring Soon";
    case "Flaked Client":
    case "Cancelled":
    case "NAR":
      return "Flaked Client";
    case "In QA Review":
      return "In QA Review";
    case "Submitted":
    case "Pending-rec'd in process":
      return "Submitted";
    case "Awaiting Submission":
      return "Awaiting Submission";
  }
  // Fall back to the monday group bucket when status is unfamiliar.
  const g = (group ?? "").trim();
  if (g === "Approved") return "Approved";
  if (g === "Denied") return "Denied";
  if (g === "Expiring Soon" || g === "Expired") return "Expiring Soon";
  if (g === "Flaked") return "Flaked Client";
  if (g === "QA Review") return "In QA Review";
  if (g.startsWith("Pending")) return "Submitted";
  return "Awaiting Submission";
}

function mapType(group: string | null): AuthType {
  const g = (group ?? "").trim();
  if (g === "Pending IA" || g === "Pending Initial Treatment") return "Initial";
  if (g === "Pending Concurrent" || g === "Pending RA") return "Reauth";
  return "Treatment";
}

function daysBetween(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function mapRow(row: RawAuthRow): Authorization & { liveBcba: string | null } {
  const data = row.data ?? {};
  const stage = mapStage(row.status, row.monday_group);
  const submitted = pickIsoDate(data["Date Submitted"]);
  const approved = pickIsoDate(data["Date Reviewed"]);
  const expiration = pickIsoDate(data["Auth Exp. Date"]);
  const prDue = pickIsoDate(data["PR Due Date"]);
  const denialReason = pickString(data["Denial Reason"]);
  const insurance = pickString(data["Insurance"]) ?? "Unknown";
  const units = pickString(data["Code(s)/Units"]);
  const bcba = pickString(data["Active BCBA"]);
  const coordinator =
    pickString(row.owner) ?? pickString(data["Person"]) ?? "Unassigned";
  const missingInfo = truthyText(data["Missing Information"]);
  const id = row.monday_item_id || row.id;

  const nextAction = (() => {
    switch (stage) {
      case "Awaiting Submission": return "Submit authorization packet";
      case "Submitted": return "Awaiting payor decision";
      case "In QA Review": return "Complete QA review";
      case "Approved": return expiration ? `Approved · expires ${expiration}` : "Approved";
      case "Denied": return denialReason ? `Address denial: ${denialReason}` : "Address denial reason";
      case "Expiring Soon": return "Initiate reauthorization";
      case "Flaked Client": return "Confirm client status";
    }
  })();

  return {
    id,
    clientId: id,
    clientName: row.name?.trim() || "Unnamed client",
    state: row.state?.trim() || "—",
    payor: insurance,
    authType: mapType(row.monday_group),
    stage,
    coordinator,
    qaOwner: stage === "In QA Review" ? coordinator : null,
    qaStatus: stage === "In QA Review" ? "In Review" : stage === "Approved" ? "Complete" : "Not Started",
    qaNotes: null,
    submittedDate: submitted,
    approvedDate: approved,
    expirationDate: expiration,
    hours: units,
    daysInStage: daysBetween(row.updated_at),
    riskLevel: stage === "Denied" || stage === "Expiring Soon" ? "High"
      : stage === "In QA Review" || stage === "Awaiting Submission" ? "Medium" : "Low",
    missingInfo,
    treatmentPlanReceived: stage !== "Awaiting Submission",
    documents: [],
    missingRequirements: missingInfo ? ["Listed in Monday: Missing Information"] : [],
    nextAction,
    nextTaskDue: prDue ?? expiration,
    lastActivity: row.updated_at,
    tasks: [],
    timeline: [
      {
        id: "imported",
        type: "system",
        description: `Imported from Monday (group: ${row.monday_group ?? "—"})`,
        timestamp: row.imported_at,
      },
    ],
    automationLog: [],
    denialReason: denialReason ?? undefined,
    liveBcba: bcba,
  };
}

/** Build an Authorization shape from an overlay-only record (no Monday raw). */
function mapOverlayAsAuth(o: OverlayRow): Authorization & { liveBcba: string | null } {
  const stage = mapStage(o.workflow_stage ?? o.status, null);
  const coordinator =
    o.assigned_owner ?? o.assigned_auth_coordinator ?? "Unassigned";
  return {
    id: o.id,
    clientId: o.id,
    clientName: o.client_name?.trim() || "Unnamed client",
    state: o.state?.trim() || "—",
    payor: o.payer ?? "Unknown",
    authType:
      (o.auth_type as AuthType) ||
      (mapType(null) as AuthType),
    stage,
    coordinator,
    qaOwner: o.qa_owner,
    qaStatus: stage === "In QA Review" ? "In Review" : stage === "Approved" ? "Complete" : "Not Started",
    qaNotes: null,
    submittedDate: o.submitted_date,
    approvedDate: o.approved_date,
    expirationDate: o.expiration_date,
    hours: o.authorized_hours != null ? String(o.authorized_hours) : null,
    daysInStage: daysBetween(o.updated_at),
    riskLevel: (o.priority === "High" ? "High" : stage === "Denied" || stage === "Expiring Soon" ? "High" : stage === "Awaiting Submission" || stage === "In QA Review" ? "Medium" : "Low"),
    missingInfo: false,
    treatmentPlanReceived: stage !== "Awaiting Submission",
    documents: [],
    missingRequirements: [],
    nextAction: o.next_action ?? null,
    nextTaskDue: o.next_action_due_date ?? o.expiration_date,
    lastActivity: o.updated_at,
    tasks: [],
    timeline: [
      {
        id: `created-${o.id}`,
        type: "system",
        description:
          o.source_system === "centralreach"
            ? "Imported from CentralReach"
            : o.source_system === "manual"
              ? "Created manually in Blossom OS"
              : "Operational overlay created",
        timestamp: o.created_at,
      },
    ],
    automationLog: [],
    denialReason: o.denial_reason ?? undefined,
    liveBcba: o.assigned_bcba,
  };
}

/**
 * Merge an overlay row into an existing mapped Authorization.
 * Overlay values win when present.
 */
export function mergeOverlayIntoAuth(
  base: Authorization & { liveBcba: string | null },
  o: OverlayRow,
): Authorization & { liveBcba: string | null } {
  const stage = o.workflow_stage || o.status
    ? mapStage(o.workflow_stage ?? o.status, null)
    : base.stage;
  return {
    ...base,
    clientName: o.client_name?.trim() || base.clientName,
    state: o.state?.trim() || base.state,
    payor: o.payer ?? base.payor,
    authType: (o.auth_type as AuthType) || base.authType,
    stage,
    coordinator: o.assigned_owner ?? o.assigned_auth_coordinator ?? base.coordinator,
    qaOwner: o.qa_owner ?? base.qaOwner,
    submittedDate: o.submitted_date ?? base.submittedDate,
    approvedDate: o.approved_date ?? base.approvedDate,
    expirationDate: o.expiration_date ?? base.expirationDate,
    hours: o.authorized_hours != null ? String(o.authorized_hours) : base.hours,
    nextAction: o.next_action ?? base.nextAction,
    nextTaskDue: o.next_action_due_date ?? base.nextTaskDue,
    denialReason: o.denial_reason ?? base.denialReason,
    liveBcba: o.assigned_bcba ?? base.liveBcba,
  };
}

/** Attach child records (requirements / tasks / activity) to authorizations. */
export function attachChildren(
  auths: Authorization[],
  overlayIdByAuthId: Map<string, string>,
  reqs: RequirementRow[],
  tasks: TaskRow[],
  activity: ActivityRow[],
): Authorization[] {
  const reqByAuth = new Map<string, RequirementRow[]>();
  for (const r of reqs) {
    if (!r.authorization_id) continue;
    const list = reqByAuth.get(r.authorization_id) ?? [];
    list.push(r);
    reqByAuth.set(r.authorization_id, list);
  }
  const tasksByAuth = new Map<string, TaskRow[]>();
  for (const t of tasks) {
    if (!t.authorization_id) continue;
    const list = tasksByAuth.get(t.authorization_id) ?? [];
    list.push(t);
    tasksByAuth.set(t.authorization_id, list);
  }
  const activityByAuth = new Map<string, ActivityRow[]>();
  for (const a of activity) {
    if (!a.authorization_id) continue;
    const list = activityByAuth.get(a.authorization_id) ?? [];
    list.push(a);
    activityByAuth.set(a.authorization_id, list);
  }

  return auths.map((auth) => {
    const overlayId = overlayIdByAuthId.get(auth.id);
    if (!overlayId) return auth;
    const r = reqByAuth.get(overlayId) ?? [];
    const t = tasksByAuth.get(overlayId) ?? [];
    const a = activityByAuth.get(overlayId) ?? [];
    const openReqs = r.filter((row) => (row.status ?? "open").toLowerCase() !== "received" && (row.status ?? "open").toLowerCase() !== "waived");
    const extraTimeline = a
      .sort((x, y) => (x.created_at < y.created_at ? 1 : -1))
      .map((row) => ({
        id: row.id,
        type: "system" as const,
        description: row.title ?? row.body ?? row.activity_type ?? "Activity",
        timestamp: row.created_at,
      }));
    return {
      ...auth,
      missingRequirements: openReqs.length
        ? openReqs.map((row) => row.title ?? "Missing requirement")
        : auth.missingRequirements,
      tasks: t.length
        ? t.map((row) => ({
            id: row.id,
            title: row.title ?? "Task",
            completed: (row.status ?? "").toLowerCase() === "completed" || (row.status ?? "").toLowerCase() === "done",
            dueDate: row.due_date ?? undefined,
          }))
        : auth.tasks,
      timeline: [...extraTimeline, ...auth.timeline],
    };
  });
}

export interface LiveAuthorizations {
  loading: boolean;
  error: string | null;
  items: Authorization[];
  /**
   * Same as `items`, but `coordinator` is overwritten with the actual
   * `Active BCBA` (from Monday) when one exists. QA pages display this
   * field as "BCBA", so this gives them the correct attribution without
   * affecting non-QA consumers that still need the auth coordinator.
   */
  qaItems: Authorization[];
  bcbaById: Map<string, string>;
  totalRows: number;
  /** Map of public auth id (Monday item id or overlay id) → overlay row id. */
  overlayIdByAuthId: Map<string, string>;
  /** Source system per auth id (monday | manual | centralreach). */
  sourceById: Map<string, "monday" | "manual" | "centralreach">;
  refresh: () => Promise<void>;
}

export function useLiveAuthorizations(): LiveAuthorizations {
  const [rows, setRows] = useState<RawAuthRow[]>([]);
  const [overlays, setOverlays] = useState<OverlayRow[]>([]);
  const [reqs, setReqs] = useState<RequirementRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [qaOverrides, setQaOverrides] = useState<QAOverrideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Monday raw
        const all: RawAuthRow[] = [];
        for (let page = 0; ; page++) {
          const from = page * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;
          const { data, error: qErr } = await supabase
            .from("monday_authorizations_raw")
            .select("id,monday_item_id,monday_group,name,state,status,owner,data,updated_at,imported_at")
            .order("updated_at", { ascending: false })
            .range(from, to);
          if (qErr) throw qErr;
          const chunk = (data ?? []) as unknown as RawAuthRow[];
          all.push(...chunk);
          if (chunk.length < PAGE_SIZE) break;
          if (page > 20) break;
        }

        // Operational overlay (manual + CR + Monday overrides)
        const { data: overlayData, error: overlayErr } = await supabase
          .from("authorization_operational_records")
          .select(
            "id,source_system,monday_item_id,centralreach_authorization_id,centralreach_client_id,centralreach_sync_status,centralreach_last_synced_at,client_name,state,payer,auth_type,status,workflow_stage,assigned_owner,assigned_bcba,assigned_auth_coordinator,qa_owner,submitted_date,approved_date,expiration_date,start_date,denial_reason,next_action,next_action_due_date,authorization_number,tracking_number,service_code,authorized_hours,used_hours,priority,updated_at,created_at",
          )
          .order("updated_at", { ascending: false })
          .limit(2000);
        if (overlayErr) throw overlayErr;

        const overlayIds = (overlayData ?? []).map((o) => o.id);

        const [reqsRes, tasksRes, actRes] = await Promise.all([
          overlayIds.length
            ? supabase
                .from("authorization_requirements")
                .select("id,authorization_id,title,status,due_date")
                .in("authorization_id", overlayIds)
            : Promise.resolve({ data: [], error: null }),
          overlayIds.length
            ? supabase
                .from("authorization_tasks")
                .select("id,authorization_id,title,status,due_date,owner_user")
                .in("authorization_id", overlayIds)
            : Promise.resolve({ data: [], error: null }),
          overlayIds.length
            ? supabase
                .from("authorization_activity")
                .select("id,authorization_id,activity_type,title,body,old_value,new_value,created_at,created_by")
                .in("authorization_id", overlayIds)
                .order("created_at", { ascending: false })
                .limit(2000)
            : Promise.resolve({ data: [], error: null }),
        ]);
        if (reqsRes.error) throw reqsRes.error;
        if (tasksRes.error) throw tasksRes.error;
        if (actRes.error) throw actRes.error;

        // QA persisted overrides — overlay on top of monday + operational rows.
        const { data: qaData, error: qaErr } = await supabase
          .from("qa_work_item_overrides" as never)
          .select(
            "id,source_system,source_record_id,monday_item_id,client_id,assigned_qa_owner,qa_status,priority,next_action,blockers,alerts,notes,escalated,escalation_reason,last_action_at",
          )
          .order("last_action_at", { ascending: false, nullsFirst: false })
          .limit(5000);
        if (qaErr && qaErr.code !== "PGRST116") throw qaErr;

        if (!cancelled) {
          setRows(all);
          setOverlays((overlayData ?? []) as unknown as OverlayRow[]);
          setReqs((reqsRes.data ?? []) as unknown as RequirementRow[]);
          setTasks((tasksRes.data ?? []) as unknown as TaskRow[]);
          setActivity((actRes.data ?? []) as unknown as ActivityRow[]);
          setQaOverrides((qaData ?? []) as unknown as QAOverrideRow[]);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load authorizations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reloadTick]);

  return useMemo(() => {
    const mondayMapped = rows
      .filter((r) => (r.status ?? "").toLowerCase() !== "duplicate")
      .map(mapRow);

    // Index overlays by monday_item_id (for merging) and pull standalone overlays (no Monday match).
    const overlayByMondayId = new Map<string, OverlayRow>();
    const standaloneOverlays: OverlayRow[] = [];
    for (const o of overlays) {
      if (o.monday_item_id) {
        overlayByMondayId.set(o.monday_item_id, o);
      } else {
        standaloneOverlays.push(o);
      }
    }

    // Merge overlays into Monday-mapped rows
    const merged = mondayMapped.map((m) => {
      const o = overlayByMondayId.get(m.id);
      return o ? mergeOverlayIntoAuth(m, o) : m;
    });

    // Append manual/CR overlay-only records
    const overlayOnly = standaloneOverlays.map(mapOverlayAsAuth);
    const combined = [...overlayOnly, ...merged];

    // Build maps before stripping liveBcba
    const bcbaById = new Map<string, string>();
    const overlayIdByAuthId = new Map<string, string>();
    const sourceById = new Map<string, "monday" | "manual" | "centralreach">();

    for (const m of mondayMapped) {
      sourceById.set(m.id, "monday");
    }
    for (const o of standaloneOverlays) {
      overlayIdByAuthId.set(o.id, o.id);
      const src = (o.source_system as "monday" | "manual" | "centralreach") ?? "manual";
      sourceById.set(o.id, src === "monday" ? "manual" : src);
    }
    for (const o of overlays) {
      if (o.monday_item_id) overlayIdByAuthId.set(o.monday_item_id, o.id);
    }

    let items: Authorization[] = combined.map(({ liveBcba, ...auth }) => {
      if (liveBcba) bcbaById.set(auth.id, liveBcba);
      return auth;
    });

    // Attach child records (requirements / tasks / activity) by overlay id
    items = attachChildren(items, overlayIdByAuthId, reqs, tasks, activity);

    // Overlay QA persisted state from qa_work_item_overrides.
    // Match by source_record_id (works for monday item id, manual overlay id,
    // and CentralReach record id since they're all stored as auth.id).
    if (qaOverrides.length) {
      const qaByRecord = new Map<string, QAOverrideRow>();
      for (const q of qaOverrides) {
        qaByRecord.set(q.source_record_id, q);
        if (q.monday_item_id) qaByRecord.set(q.monday_item_id, q);
      }
      items = items.map((a) => {
        const q = qaByRecord.get(a.id);
        if (!q) return a;
        const blockers = q.blockers ?? [];
        const alerts = q.alerts ?? [];
        return {
          ...a,
          qaOwner: q.assigned_qa_owner ?? a.qaOwner,
          qaStatus: (q.qa_status as Authorization["qaStatus"]) ?? a.qaStatus,
          qaNotes: q.notes ?? a.qaNotes,
          priority: (q.priority as Authorization["priority"]) ?? a.priority,
          nextAction: q.next_action ?? a.nextAction,
          escalated: q.escalated ?? a.escalated,
          missingRequirements: blockers.length ? blockers : a.missingRequirements,
          missingInfo: blockers.length > 0 || a.missingInfo,
          alerts: alerts.length ? alerts : a.alerts,
        };
      });
    }

    const qaItems: Authorization[] = items.map((a) => {
      const bcba = bcbaById.get(a.id);
      return bcba ? { ...a, coordinator: bcba } : a;
    });

    const refresh = async () => {
      setReloadTick((n) => n + 1);
    };

    return {
      loading,
      error,
      items,
      qaItems,
      bcbaById,
      totalRows: rows.length + standaloneOverlays.length,
      overlayIdByAuthId,
      sourceById,
      refresh,
    };
  }, [rows, overlays, reqs, tasks, activity, loading, error]);
}