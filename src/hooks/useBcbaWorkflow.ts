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
};

function normalizeScope(input?: BcbaWorkflowScope | string | null): BcbaWorkflowScope {
  if (!input) return {};
  if (typeof input === "string") return { clientId: input };
  return input;
}

export function useBcbaWorkflow(scopeInput?: BcbaWorkflowScope | string | null) {
  const scope = normalizeScope(scopeInput);
  const { clientId, clientName, centralreachClientId, bcbaId } = scope;
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
      if (clientName) return q.eq("client_name", clientName);
      return q;
    },
    [clientId, centralreachClientId, clientName],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tasksQ = db.from("bcba_action_tasks").select("*").order("created_at", { ascending: false }).limit(500);
      const supQ = db.from("bcba_supervision_logs").select("*").order("occurred_at", { ascending: false }).limit(500);
      const ptQ = db.from("bcba_parent_training_logs").select("*").order("occurred_at", { ascending: false }).limit(500);
      const planQ = db.from("bcba_treatment_plan_items").select("*").order("due_date", { ascending: true }).limit(500);
      const notesQ = db.from("bcba_client_notes").select("*").order("created_at", { ascending: false }).limit(500);

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
  }, [applyScope]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
