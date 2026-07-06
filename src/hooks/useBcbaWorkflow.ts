import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * BCBA workflow data hook — reads/writes the persisted BCBA workflow tables
 * created for the BCBA completion pass:
 *   - bcba_action_tasks
 *   - bcba_supervision_logs
 *   - bcba_parent_training_logs
 *   - bcba_treatment_plan_items
 *   - bcba_client_notes
 *
 * These tables persist real BCBA actions (notes, tasks, supervision logs,
 * parent-training logs, PR/treatment-plan status changes) so BCBA pages can
 * move from read-only dashboards to a real operational workspace.
 */

export type BcbaActionStatus =
  | "open"
  | "in_progress"
  | "blocked"
  | "completed"
  | "escalated";

export type BcbaSourceArea =
  | "supervision"
  | "parent_training"
  | "treatment_plan"
  | "authorization"
  | "scheduling"
  | "evaluation"
  | "caseload";

export interface BcbaActionTask {
  id: string;
  client_id: string | null;
  client_name: string | null;
  assigned_bcba: string | null;
  assigned_to: string | null;
  created_by: string | null;
  source_area: BcbaSourceArea | string;
  title: string;
  description: string | null;
  status: BcbaActionStatus | string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  related_authorization_id: string | null;
  related_schedule_id: string | null;
  centralreach_client_id: string | null;
  centralreach_authorization_id: string | null;
  centralreach_sync_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface BcbaSupervisionLog {
  id: string;
  client_id: string | null;
  client_name: string | null;
  provider_name: string | null;
  bcba_id: string | null;
  occurred_at: string;
  modality: string;
  service_code: string | null;
  minutes: number | null;
  notes: string | null;
  barriers: string | null;
  next_action: string | null;
  created_by: string | null;
  centralreach_client_id: string | null;
  centralreach_sync_status: string | null;
  created_at: string;
}

export interface BcbaParentTrainingLog {
  id: string;
  client_id: string | null;
  client_name: string | null;
  caregiver_name: string | null;
  bcba_id: string | null;
  occurred_at: string;
  service_code: string | null;
  goal: string | null;
  participation_level: string | null;
  barriers: string | null;
  notes: string | null;
  next_session_plan: string | null;
  next_due_date: string | null;
  created_by: string | null;
  centralreach_client_id: string | null;
  centralreach_sync_status: string | null;
  created_at: string;
}

export interface BcbaTreatmentPlanItem {
  id: string;
  client_id: string | null;
  client_name: string | null;
  bcba_id: string | null;
  authorization_id: string | null;
  due_date: string | null;
  status: string;
  missing_items: string[];
  qa_notes: string | null;
  document_links: string[];
  last_touched_at: string | null;
  centralreach_sync_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface BcbaClientNote {
  id: string;
  client_id: string | null;
  client_name: string | null;
  bcba_id: string | null;
  author_id: string | null;
  note_type: string;
  body: string;
  visibility: string;
  related_work_item_id: string | null;
  centralreach_client_id: string | null;
  centralreach_sync_status: string | null;
  created_at: string;
}

// Centralized typed wrapper. Generated Supabase types include these tables now,
// but we keep the narrow cast in one place so page components don't need it.
const db = supabase as unknown as {
  from: (table: string) => any;
};

export type BcbaWorkflowScope = {
  clientId?: string | null;
  clientName?: string | null;
  centralreachClientId?: string | null;
  bcbaId?: string | null;
  bcbaName?: string | null;
  /** Cap for how many rows to fetch per table. Default 200. */
  limit?: number;
  /** Enable leadership-wide fetches (no client scope). When false and no
   *  client identifiers are supplied, the hook returns empty arrays instead
   *  of a broad fetch. Client-detail surfaces MUST pass `broad: false`. */
  broad?: boolean;
  /** ISO date lower bound (inclusive) applied to created_at / occurred_at. */
  fromDate?: string | null;
  /** ISO date upper bound (inclusive). */
  toDate?: string | null;
  /** Optional status whitelist for tasks / plan items. */
  statuses?: string[];
};

/** Build a workflow scope from anything that looks like a client record. */
export function makeBcbaWorkflowScope(
  client: {
    id?: string | null;
    clientId?: string | null;
    name?: string | null;
    clientName?: string | null;
    centralreachClientId?: string | null;
    centralreach_client_id?: string | null;
    bcbaId?: string | null;
  } | null | undefined,
  defaults: Partial<BcbaWorkflowScope> = {},
): BcbaWorkflowScope {
  const c = client ?? {};
  return {
    broad: false,
    limit: 100,
    ...defaults,
    clientId: (c as any).clientId ?? (c as any).id ?? defaults.clientId ?? null,
    clientName: (c as any).clientName ?? (c as any).name ?? defaults.clientName ?? null,
    centralreachClientId:
      (c as any).centralreachClientId ?? (c as any).centralreach_client_id ?? defaults.centralreachClientId ?? null,
    bcbaId: (c as any).bcbaId ?? defaults.bcbaId ?? null,
  };
}

export interface BcbaWorkflowActivityEvent {
  id: string;
  created_at: string;
  actor_id: string | null;
  client_id: string | null;
  client_name: string | null;
  client_name_key: string | null;
  centralreach_client_id: string | null;
  bcba_id: string | null;
  source_table: string;
  source_record_id: string | null;
  event_type: string;
  summary: string | null;
  metadata: any;
  centralreach_sync_status: string | null;
}

export interface BcbaCentralReachOutboxItem {
  id: string;
  created_at: string;
  updated_at: string;
  source_table: string;
  source_record_id: string;
  client_id: string | null;
  client_name: string | null;
  centralreach_client_id: string | null;
  action: string;
  sync_status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  payload: any;
}

function normalizeScope(input?: BcbaWorkflowScope | string | null): BcbaWorkflowScope {
  if (!input) return {};
  if (typeof input === "string") return { clientId: input };
  return input;
}

/** Canonical client-name normalization mirrored server-side by
 *  `bcba_normalize_client_name` — keep in sync. */
export function normalizeBcbaClientName(name?: string | null): string | null {
  if (!name) return null;
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export function useBcbaWorkflow(scopeInput?: BcbaWorkflowScope | string | null) {
  const scope = normalizeScope(scopeInput);
  const { clientId, clientName, centralreachClientId, bcbaId, broad, limit, fromDate, toDate, statuses } = scope;
  const rowLimit = limit ?? 200;
  const clientNameKey = normalizeBcbaClientName(clientName ?? null);
  const { user } = useAuth();
  const [tasks, setTasks] = useState<BcbaActionTask[]>([]);
  const [supervisionLogs, setSupervisionLogs] = useState<BcbaSupervisionLog[]>([]);
  const [ptLogs, setPtLogs] = useState<BcbaParentTrainingLog[]>([]);
  const [planItems, setPlanItems] = useState<BcbaTreatmentPlanItem[]>([]);
  const [notes, setNotes] = useState<BcbaClientNote[]>([]);
  const [activityEvents, setActivityEvents] = useState<BcbaWorkflowActivityEvent[]>([]);
  const [outboxItems, setOutboxItems] = useState<BcbaCentralReachOutboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyScope = useCallback(
    (q: any) => {
      if (clientId) return q.eq("client_id", clientId);
      if (centralreachClientId) return q.eq("centralreach_client_id", centralreachClientId);
      if (clientNameKey) return q.eq("client_name_key", clientNameKey);
      return q;
    },
    [clientId, centralreachClientId, clientNameKey],
  );

  const statusesKey = (statuses ?? []).join("|");
  const applyDate = useCallback(
    (q: any, col: string) => {
      let out = q;
      if (fromDate) out = out.gte(col, fromDate);
      if (toDate)   out = out.lte(col, toDate);
      return out;
    },
    [fromDate, toDate],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // A bcbaName/bcbaId also counts as scope: BCBA-role surfaces pass only
      // `{ bcbaName }` and expect their own workload (previously satisfied by
      // an implicit broad fetch). Treating it as scope restores those lists
      // without opening a leadership-wide fetch to unscoped callers.
      const hasScope = !!(clientId || centralreachClientId || clientNameKey || bcbaId || scope.bcbaName);
      // Client-detail surfaces should pass `broad: false`. Only fetch broadly
      // when the caller opts in explicitly with `broad: true`. Absent both a
      // client scope AND an explicit broad flag we return empty rather than
      // silently leaking a leadership-wide fetch into a client drawer.
      if (!hasScope && broad !== true) {
        setTasks([]); setSupervisionLogs([]); setPtLogs([]); setPlanItems([]); setNotes([]);
        setActivityEvents([]); setOutboxItems([]);
        setLoading(false);
        return;
      }
      let tasksQ = db.from("bcba_action_tasks").select("*").order("created_at", { ascending: false }).limit(rowLimit);
      let supQ   = db.from("bcba_supervision_logs").select("*").order("occurred_at", { ascending: false }).limit(rowLimit);
      let ptQ    = db.from("bcba_parent_training_logs").select("*").order("occurred_at", { ascending: false }).limit(rowLimit);
      let planQ  = db.from("bcba_treatment_plan_items").select("*").order("due_date", { ascending: true }).limit(rowLimit);
      let notesQ = db.from("bcba_client_notes").select("*").order("created_at", { ascending: false }).limit(rowLimit);
      let eventsQ = db.from("bcba_workflow_activity_events").select("*").order("created_at", { ascending: false }).limit(rowLimit);
      let outQ    = db.from("bcba_centralreach_outbox").select("*").order("created_at", { ascending: false }).limit(rowLimit);

      tasksQ = applyDate(tasksQ, "created_at");
      supQ   = applyDate(supQ,   "occurred_at");
      ptQ    = applyDate(ptQ,    "occurred_at");
      notesQ = applyDate(notesQ, "created_at");
      eventsQ = applyDate(eventsQ, "created_at");

      if (statuses && statuses.length > 0) {
        tasksQ = tasksQ.in("status", statuses);
        planQ  = planQ.in("status", statuses);
      }

      const [t, s, p, pl, n, ev, ob] = await Promise.all([
        applyScope(tasksQ),
        applyScope(supQ),
        applyScope(ptQ),
        applyScope(planQ),
        applyScope(notesQ),
        applyScope(eventsQ),
        applyScope(outQ),
      ]);

      if (t.error) throw t.error;
      if (s.error) throw s.error;
      if (p.error) throw p.error;
      if (pl.error) throw pl.error;
      if (n.error) throw n.error;
      // Activity events and outbox are best-effort - tables may not exist yet
      // in older environments. Swallow their errors so the timeline still
      // renders instead of blanking the whole page.

      setTasks((t.data ?? []) as BcbaActionTask[]);
      setSupervisionLogs((s.data ?? []) as BcbaSupervisionLog[]);
      setPtLogs((p.data ?? []) as BcbaParentTrainingLog[]);
      setPlanItems((pl.data ?? []) as BcbaTreatmentPlanItem[]);
      setNotes((n.data ?? []) as BcbaClientNote[]);
      setActivityEvents((ev?.error ? [] : ev?.data ?? []) as BcbaWorkflowActivityEvent[]);
      setOutboxItems((ob?.error ? [] : ob?.data ?? []) as BcbaCentralReachOutboxItem[]);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load BCBA workflow data");
    } finally {
      setLoading(false);
    }
  }, [applyScope, applyDate, broad, clientId, centralreachClientId, clientNameKey, rowLimit, statusesKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Pass 3: Realtime — any insert/update/delete on the BCBA workflow tables
  // triggers a refresh. RLS still filters what the current user sees.
  useEffect(() => {
    const channel = supabase
      .channel(`bcba-workflow-${clientId ?? clientName ?? centralreachClientId ?? "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bcba_action_tasks" },         () => { void refresh(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "bcba_supervision_logs" },     () => { void refresh(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "bcba_parent_training_logs" }, () => { void refresh(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "bcba_treatment_plan_items" }, () => { void refresh(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "bcba_client_notes" },         () => { void refresh(); })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, clientId, clientName, centralreachClientId]);

  // Pass 3: derived workflow metrics for surfaces like the BCBA Productivity
  // Report and workspace signals card.
  const now = Date.now();
  const todayStr = new Date().toISOString().slice(0, 10);
  const metrics = {
    openTasks: tasks.filter((t) => t.status !== "completed").length,
    blockedTasks: tasks.filter((t) => t.status === "blocked").length,
    escalatedTasks: tasks.filter((t) => t.status === "escalated").length,
    dueTodayTasks: tasks.filter((t) => t.status !== "completed" && t.due_date === todayStr).length,
    overdueTasks: tasks.filter((t) => t.status !== "completed" && !!t.due_date && new Date(t.due_date).getTime() < now).length,
    supervisionLogs30d: supervisionLogs.filter((s) => withinDays(s.occurred_at, 30)).length,
    parentTrainingLogs30d: ptLogs.filter((p) => withinDays(p.occurred_at, 30)).length,
    openPlanItems: planItems.filter((p) => p.status !== "complete" && p.status !== "completed").length,
    pendingCentralReachSync:
      tasks.filter((t) => (t.centralreach_sync_status ?? "pending_import") !== "synced").length +
      supervisionLogs.filter((s) => (s.centralreach_sync_status ?? "pending_import") !== "synced").length +
      ptLogs.filter((p) => (p.centralreach_sync_status ?? "pending_import") !== "synced").length +
      planItems.filter((p) => (p.centralreach_sync_status ?? "pending_import") !== "synced").length,
    pendingOutboxItems:   outboxItems.filter((o) => o.sync_status === "pending_review").length,
    manualCentralReachUpdates: outboxItems.filter((o) => o.sync_status === "manual_update_required").length,
    readyForApiItems:     outboxItems.filter((o) => o.sync_status === "ready_for_api").length,
  };

  const uid = user?.id ?? null;

  /** Best-effort activity-event write. Swallow errors so a missing table
   *  never breaks the primary workflow write. */
  const writeActivityEvent = useCallback(
    async (evt: {
      source_table: string;
      source_record_id: string | null;
      event_type: string;
      summary: string | null;
      metadata?: any;
      client_id?: string | null;
      client_name?: string | null;
      centralreach_client_id?: string | null;
      bcba_id?: string | null;
      centralreach_sync_status?: string | null;
    }) => {
      try {
        await db.from("bcba_workflow_activity_events").insert({
          actor_id: uid,
          client_id: evt.client_id ?? clientId ?? null,
          client_name: evt.client_name ?? clientName ?? null,
          client_name_key: normalizeBcbaClientName(evt.client_name ?? clientName ?? null),
          centralreach_client_id: evt.centralreach_client_id ?? centralreachClientId ?? null,
          bcba_id: evt.bcba_id ?? bcbaId ?? uid,
          source_table: evt.source_table,
          source_record_id: evt.source_record_id,
          event_type: evt.event_type,
          summary: evt.summary,
          metadata: evt.metadata ?? null,
          centralreach_sync_status: evt.centralreach_sync_status ?? "pending_review",
        });
      } catch {
        /* best-effort; do not break the workflow */
      }
    },
    [uid, bcbaId, clientId, clientName, centralreachClientId],
  );

  /** Best-effort CentralReach outbox write. */
  const writeOutbox = useCallback(
    async (evt: {
      source_table: string;
      source_record_id: string;
      action: string;
      sync_status?: string;
      client_id?: string | null;
      client_name?: string | null;
      centralreach_client_id?: string | null;
      payload?: any;
      notes?: string | null;
    }) => {
      try {
        await db.from("bcba_centralreach_outbox").insert({
          source_table: evt.source_table,
          source_record_id: evt.source_record_id,
          action: evt.action,
          sync_status: evt.sync_status ?? "pending_review",
          client_id: evt.client_id ?? clientId ?? null,
          client_name: evt.client_name ?? clientName ?? null,
          centralreach_client_id: evt.centralreach_client_id ?? centralreachClientId ?? null,
          payload: evt.payload ?? null,
          notes: evt.notes ?? null,
          created_by: uid,
        });
      } catch {
        /* best-effort */
      }
    },
    [uid, clientId, clientName, centralreachClientId],
  );

  // Ensures created rows always carry the best-available client identifiers
  // so client-scoped queries later find them, even when only a name exists.
  const withScopeDefaults = useCallback(
    <T extends Record<string, any>>(input: T): T => ({
      client_id: clientId ?? input.client_id ?? null,
      client_name: clientName ?? input.client_name ?? null,
      centralreach_client_id: centralreachClientId ?? input.centralreach_client_id ?? null,
      ...input,
    }),
    [clientId, clientName, centralreachClientId],
  );

  const createTask = useCallback(
    async (input: Partial<BcbaActionTask>) => {
      const payload = withScopeDefaults({
        ...input,
        created_by: uid,
        assigned_bcba: input.assigned_bcba ?? bcbaId ?? uid,
      });
      const { data, error } = await db.from("bcba_action_tasks").insert(payload).select("*").single();
      if (error) throw error;
      setTasks((prev) => [data as BcbaActionTask, ...prev]);
      await writeActivityEvent({
        source_table: "bcba_action_tasks",
        source_record_id: data.id,
        event_type: "task_created",
        summary: data.title,
        client_id: data.client_id, client_name: data.client_name, centralreach_client_id: data.centralreach_client_id,
      });
      await writeOutbox({
        source_table: "bcba_action_tasks",
        source_record_id: data.id,
        action: "task_created",
        sync_status: "not_applicable",
        client_id: data.client_id, client_name: data.client_name, centralreach_client_id: data.centralreach_client_id,
        payload: { title: data.title, source_area: data.source_area, priority: data.priority },
      });
      return data as BcbaActionTask;
    },
    [uid, bcbaId, withScopeDefaults, writeActivityEvent, writeOutbox],
  );

  const updateTask = useCallback(
    async (id: string, patch: Partial<BcbaActionTask>) => {
      const { data, error } = await db.from("bcba_action_tasks").update(patch).eq("id", id).select("*").single();
      if (error) throw error;
      setTasks((prev) => prev.map((row) => (row.id === id ? (data as BcbaActionTask) : row)));
      const isCompletion = patch.status === "completed";
      const isEscalation = patch.status === "escalated";
      await writeActivityEvent({
        source_table: "bcba_action_tasks",
        source_record_id: id,
        event_type: isCompletion ? "task_completed" : isEscalation ? "task_escalated" : "task_updated",
        summary: data.title,
        metadata: patch,
        client_id: data.client_id, client_name: data.client_name, centralreach_client_id: data.centralreach_client_id,
      });
      if (isCompletion || isEscalation) {
        await writeOutbox({
          source_table: "bcba_action_tasks",
          source_record_id: id,
          action: isCompletion ? "task_completed" : "task_escalated",
          sync_status: "pending_review",
          client_id: data.client_id, client_name: data.client_name, centralreach_client_id: data.centralreach_client_id,
          payload: { title: data.title, status: data.status },
        });
      }
      return data as BcbaActionTask;
    },
    [writeActivityEvent, writeOutbox],
  );

  const completeTask = useCallback(
    (id: string) => updateTask(id, { status: "completed", completed_at: new Date().toISOString() }),
    [updateTask],
  );

  const logSupervision = useCallback(
    async (input: Partial<BcbaSupervisionLog>) => {
      const payload = withScopeDefaults({ ...input, created_by: uid, bcba_id: input.bcba_id ?? bcbaId ?? uid });
      const { data, error } = await db.from("bcba_supervision_logs").insert(payload).select("*").single();
      if (error) throw error;
      setSupervisionLogs((prev) => [data as BcbaSupervisionLog, ...prev]);
      await writeActivityEvent({
        source_table: "bcba_supervision_logs",
        source_record_id: data.id,
        event_type: "supervision_logged",
        summary: `Supervision (${data.modality ?? "overlap"})${data.minutes ? ` - ${data.minutes} min` : ""}`,
        client_id: data.client_id, client_name: data.client_name, centralreach_client_id: data.centralreach_client_id,
      });
      await writeOutbox({
        source_table: "bcba_supervision_logs",
        source_record_id: data.id,
        action: "supervision_logged",
        sync_status: "ready_for_api",
        client_id: data.client_id, client_name: data.client_name, centralreach_client_id: data.centralreach_client_id,
        payload: { modality: data.modality, service_code: data.service_code, minutes: data.minutes, occurred_at: data.occurred_at },
      });
      return data as BcbaSupervisionLog;
    },
    [uid, bcbaId, withScopeDefaults, writeActivityEvent, writeOutbox],
  );

  const logParentTraining = useCallback(
    async (input: Partial<BcbaParentTrainingLog>) => {
      const payload = withScopeDefaults({
        service_code: "97156",
        ...input,
        created_by: uid,
        bcba_id: input.bcba_id ?? bcbaId ?? uid,
      });
      const { data, error } = await db.from("bcba_parent_training_logs").insert(payload).select("*").single();
      if (error) throw error;
      setPtLogs((prev) => [data as BcbaParentTrainingLog, ...prev]);
      await writeActivityEvent({
        source_table: "bcba_parent_training_logs",
        source_record_id: data.id,
        event_type: "parent_training_logged",
        summary: `Parent training${data.caregiver_name ? ` - ${data.caregiver_name}` : ""}`,
        client_id: data.client_id, client_name: data.client_name, centralreach_client_id: data.centralreach_client_id,
      });
      await writeOutbox({
        source_table: "bcba_parent_training_logs",
        source_record_id: data.id,
        action: "parent_training_logged",
        sync_status: "ready_for_api",
        client_id: data.client_id, client_name: data.client_name, centralreach_client_id: data.centralreach_client_id,
        payload: { service_code: data.service_code, participation_level: data.participation_level, occurred_at: data.occurred_at },
      });
      return data as BcbaParentTrainingLog;
    },
    [uid, bcbaId, withScopeDefaults, writeActivityEvent, writeOutbox],
  );

  const upsertPlanItem = useCallback(
    async (input: Partial<BcbaTreatmentPlanItem> & { id?: string }) => {
      const payload = withScopeDefaults({
        ...input,
        created_by: input.id ? undefined : uid,
        bcba_id: input.bcba_id ?? bcbaId ?? uid,
        last_touched_at: new Date().toISOString(),
      });
      if (input.id) {
        const { data, error } = await db
          .from("bcba_treatment_plan_items")
          .update(payload)
          .eq("id", input.id)
          .select("*")
          .single();
        if (error) throw error;
        setPlanItems((prev) => prev.map((row) => (row.id === input.id ? (data as BcbaTreatmentPlanItem) : row)));
        await writeActivityEvent({
          source_table: "bcba_treatment_plan_items", source_record_id: data.id,
          event_type: "plan_item_updated", summary: `Treatment plan item (${data.status})`,
          client_id: data.client_id, client_name: data.client_name, centralreach_client_id: data.centralreach_client_id,
        });
        await writeOutbox({
          source_table: "bcba_treatment_plan_items", source_record_id: data.id,
          action: "plan_item_updated", sync_status: "pending_review",
          client_id: data.client_id, client_name: data.client_name, centralreach_client_id: data.centralreach_client_id,
          payload: { status: data.status, due_date: data.due_date },
        });
        return data as BcbaTreatmentPlanItem;
      }
      const { data, error } = await db
        .from("bcba_treatment_plan_items")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      setPlanItems((prev) => [data as BcbaTreatmentPlanItem, ...prev]);
      await writeActivityEvent({
        source_table: "bcba_treatment_plan_items", source_record_id: data.id,
        event_type: "plan_item_created", summary: `Treatment plan item (${data.status})`,
        client_id: data.client_id, client_name: data.client_name, centralreach_client_id: data.centralreach_client_id,
      });
      await writeOutbox({
        source_table: "bcba_treatment_plan_items", source_record_id: data.id,
        action: "plan_item_created", sync_status: "pending_review",
        client_id: data.client_id, client_name: data.client_name, centralreach_client_id: data.centralreach_client_id,
        payload: { status: data.status, due_date: data.due_date },
      });
      return data as BcbaTreatmentPlanItem;
    },
    [uid, bcbaId, withScopeDefaults, writeActivityEvent, writeOutbox],
  );

  const addNote = useCallback(
    async (input: Partial<BcbaClientNote>) => {
      const payload = withScopeDefaults({ ...input, author_id: uid, bcba_id: input.bcba_id ?? bcbaId ?? uid });
      const { data, error } = await db.from("bcba_client_notes").insert(payload).select("*").single();
      if (error) throw error;
      setNotes((prev) => [data as BcbaClientNote, ...prev]);
      const status = data.visibility === "internal" ? "not_applicable" : "manual_update_required";
      await writeActivityEvent({
        source_table: "bcba_client_notes", source_record_id: data.id,
        event_type: "note_added", summary: data.body?.slice(0, 200) ?? "Note added",
        client_id: data.client_id, client_name: data.client_name, centralreach_client_id: data.centralreach_client_id,
        centralreach_sync_status: status,
      });
      await writeOutbox({
        source_table: "bcba_client_notes", source_record_id: data.id,
        action: "note_added", sync_status: status,
        client_id: data.client_id, client_name: data.client_name, centralreach_client_id: data.centralreach_client_id,
        payload: { note_type: data.note_type, visibility: data.visibility },
      });
      return data as BcbaClientNote;
    },
    [uid, bcbaId, withScopeDefaults, writeActivityEvent, writeOutbox],
  );

  return {
    loading,
    error,
    tasks,
    supervisionLogs,
    ptLogs,
    planItems,
    notes,
    activityEvents,
    outboxItems,
    metrics,
    refresh,
    createTask,
    updateTask,
    completeTask,
    logSupervision,
    logParentTraining,
    upsertPlanItem,
    addNote,
  };
}

function withinDays(iso: string | null | undefined, days: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= days * 86_400_000;
}
