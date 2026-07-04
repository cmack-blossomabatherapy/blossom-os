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
  /** Enable leadership-wide fetches (no client scope). Default false. */
  broad?: boolean;
};

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
  const { clientId, clientName, centralreachClientId, bcbaId, broad, limit } = scope;
  const rowLimit = limit ?? 200;
  const clientNameKey = normalizeBcbaClientName(clientName ?? null);
  const { user } = useAuth();
  const [tasks, setTasks] = useState<BcbaActionTask[]>([]);
  const [supervisionLogs, setSupervisionLogs] = useState<BcbaSupervisionLog[]>([]);
  const [ptLogs, setPtLogs] = useState<BcbaParentTrainingLog[]>([]);
  const [planItems, setPlanItems] = useState<BcbaTreatmentPlanItem[]>([]);
  const [notes, setNotes] = useState<BcbaClientNote[]>([]);
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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Broad fetches (no client scope) are allowed by default so existing
      // BCBA dashboard/workspace surfaces keep working. Pages that only care
      // about a single client should always pass a scope; leadership views
      // may opt out explicitly with `broad: false`.
      const hasScope = !!(clientId || centralreachClientId || clientNameKey);
      if (!hasScope && broad === false) {
        setTasks([]); setSupervisionLogs([]); setPtLogs([]); setPlanItems([]); setNotes([]);
        setLoading(false);
        return;
      }
      const tasksQ = db.from("bcba_action_tasks").select("*").order("created_at", { ascending: false }).limit(rowLimit);
      const supQ   = db.from("bcba_supervision_logs").select("*").order("occurred_at", { ascending: false }).limit(rowLimit);
      const ptQ    = db.from("bcba_parent_training_logs").select("*").order("occurred_at", { ascending: false }).limit(rowLimit);
      const planQ  = db.from("bcba_treatment_plan_items").select("*").order("due_date", { ascending: true }).limit(rowLimit);
      const notesQ = db.from("bcba_client_notes").select("*").order("created_at", { ascending: false }).limit(rowLimit);

      const [t, s, p, pl, n] = await Promise.all([
        applyScope(tasksQ),
        applyScope(supQ),
        applyScope(ptQ),
        applyScope(planQ),
        applyScope(notesQ),
      ]);

      if (t.error) throw t.error;
      if (s.error) throw s.error;
      if (p.error) throw p.error;
      if (pl.error) throw pl.error;
      if (n.error) throw n.error;

      setTasks((t.data ?? []) as BcbaActionTask[]);
      setSupervisionLogs((s.data ?? []) as BcbaSupervisionLog[]);
      setPtLogs((p.data ?? []) as BcbaParentTrainingLog[]);
      setPlanItems((pl.data ?? []) as BcbaTreatmentPlanItem[]);
      setNotes((n.data ?? []) as BcbaClientNote[]);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load BCBA workflow data");
    } finally {
      setLoading(false);
    }
  }, [applyScope, broad, clientId, centralreachClientId, clientNameKey, rowLimit]);

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
  };

  const uid = user?.id ?? null;

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
      return data as BcbaActionTask;
    },
    [uid, bcbaId, withScopeDefaults],
  );

  const updateTask = useCallback(
    async (id: string, patch: Partial<BcbaActionTask>) => {
      const { data, error } = await db.from("bcba_action_tasks").update(patch).eq("id", id).select("*").single();
      if (error) throw error;
      setTasks((prev) => prev.map((row) => (row.id === id ? (data as BcbaActionTask) : row)));
      return data as BcbaActionTask;
    },
    [],
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
      return data as BcbaSupervisionLog;
    },
    [uid, bcbaId, withScopeDefaults],
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
      return data as BcbaParentTrainingLog;
    },
    [uid, bcbaId, withScopeDefaults],
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
        return data as BcbaTreatmentPlanItem;
      }
      const { data, error } = await db
        .from("bcba_treatment_plan_items")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      setPlanItems((prev) => [data as BcbaTreatmentPlanItem, ...prev]);
      return data as BcbaTreatmentPlanItem;
    },
    [uid, bcbaId, withScopeDefaults],
  );

  const addNote = useCallback(
    async (input: Partial<BcbaClientNote>) => {
      const payload = withScopeDefaults({ ...input, author_id: uid, bcba_id: input.bcba_id ?? bcbaId ?? uid });
      const { data, error } = await db.from("bcba_client_notes").insert(payload).select("*").single();
      if (error) throw error;
      setNotes((prev) => [data as BcbaClientNote, ...prev]);
      return data as BcbaClientNote;
    },
    [uid, bcbaId, withScopeDefaults],
  );

  return {
    loading,
    error,
    tasks,
    supervisionLogs,
    ptLogs,
    planItems,
    notes,
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
