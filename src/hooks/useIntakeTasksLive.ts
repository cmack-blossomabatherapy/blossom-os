import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type IntakeTaskRow = {
  id: string;
  lead_id: string | null;
  task_type: string;
  title: string;
  owner: string | null;
  due_date: string | null;
  status: "Open" | "In Progress" | "Completed" | "Blocked";
  notes: string | null;
  created_at: string;
  updated_at: string;
  parent_task_id?: string | null;
  related_record_type?: string | null;
  related_record_id?: string | null;
  related_record_label?: string | null;
  related_url?: string | null;
};

export interface CreateIntakeTaskInput {
  title: string;
  task_type?: string;
  owner?: string | null;
  due_date?: string | null;
  notes?: string | null;
  lead_id?: string | null;
  related_record_type?: string | null;
  related_record_id?: string | null;
  related_record_label?: string | null;
  related_url?: string | null;
  subtasks?: Array<{ title: string; owner?: string | null; due_date?: string | null }>;
}

/**
 * Sprint 04 Phase D — live, cross-lead intake task list backed by
 * `public.intake_tasks` with realtime updates and DB mutations.
 */
export function useIntakeTasksLive() {
  const [tasks, setTasks] = useState<IntakeTaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("intake_tasks")
        .select("*")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(500);
      if (error) throw error;
      setTasks((data ?? []) as IntakeTaskRow[]);
    } catch (error) {
      console.warn("[useIntakeTasksLive] task fetch failed", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const channelName = `intake-tasks-live-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const safeRefetch = async () => {
      if (active) await refetch();
    };
    void refetch();
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "intake_tasks" }, () => { void safeRefetch(); })
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [refetch]);

  const complete = useCallback(async (id: string) => {
    const { error } = await supabase.from("intake_tasks").update({ status: "Completed" } as never).eq("id", id);
    if (error) throw error;
  }, []);

  const snooze = useCallback(async (id: string, days = 3) => {
    const base = new Date();
    base.setDate(base.getDate() + days);
    const due = base.toISOString().split("T")[0];
    const { error } = await supabase.from("intake_tasks").update({ due_date: due } as never).eq("id", id);
    if (error) throw error;
  }, []);

  const reassign = useCallback(async (id: string, owner: string) => {
    const { error } = await supabase.from("intake_tasks").update({ owner } as never).eq("id", id);
    if (error) throw error;
  }, []);

  const markStarted = useCallback(async (task: IntakeTaskRow) => {
    const stamp = new Date().toISOString();
    const prev = (task.notes ?? "").trim();
    const entry = `[${stamp}] Task started`;
    const nextNotes = prev ? `${prev}\n${entry}` : entry;
    const { error } = await supabase
      .from("intake_tasks")
      .update({ status: "In Progress", notes: nextNotes } as never)
      .eq("id", task.id);
    if (error) throw error;
  }, []);

  /**
   * Inline status change with optimistic UI + activity logging.
   * - Instantly patches local cache so the row reflects the new status.
   * - Persists an audit line into `notes` (timestamped transition).
   * - Mirrors the change to `intake_communications` when a lead is attached.
   * - Rolls back local cache on failure.
   */
  const setStatus = useCallback(async (
    task: IntakeTaskRow,
    next: IntakeTaskRow["status"],
    opts?: { actor?: string | null },
  ) => {
    if (task.status === next) return;
    const stamp = new Date().toISOString();
    const actor = opts?.actor?.trim();
    const entry = `[${stamp}] Status: ${task.status} → ${next}${actor ? ` (by ${actor})` : ""}`;
    const prev = (task.notes ?? "").trim();
    const nextNotes = prev ? `${prev}\n${entry}` : entry;
    const patch: Record<string, unknown> = { status: next, notes: nextNotes };
    // Optimistic
    setTasks((cur) => cur.map((t) => t.id === task.id ? { ...t, status: next, notes: nextNotes } : t));
    const { error } = await supabase
      .from("intake_tasks")
      .update(patch as never)
      .eq("id", task.id);
    if (error) {
      // Rollback
      setTasks((cur) => cur.map((t) => t.id === task.id ? { ...t, status: task.status, notes: task.notes } : t));
      throw error;
    }
    if (task.lead_id) {
      await supabase.from("intake_communications").insert({
        lead_id: task.lead_id,
        communication_type: "note",
        direction: "internal",
        subject: `Task status: ${next}`,
        preview: `${task.title} — ${task.status} → ${next}${actor ? ` (by ${actor})` : ""}`,
        logged_by_name: actor || task.owner || "System",
      } as never).then(({ error: e }) => { if (e) console.warn("activity log failed", e); });
    }
  }, []);

  const create = useCallback(async (input: CreateIntakeTaskInput): Promise<IntakeTaskRow> => {
    const payload = {
      lead_id: input.lead_id ?? null,
      task_type: input.task_type ?? "task",
      title: input.title.trim(),
      owner: input.owner?.trim() || null,
      due_date: input.due_date || null,
      notes: input.notes?.trim() || null,
      status: "Open",
      related_record_type: input.related_record_type ?? null,
      related_record_id: input.related_record_id ?? null,
      related_record_label: input.related_record_label ?? null,
      related_url: input.related_url ?? null,
    };
    const { data, error } = await supabase
      .from("intake_tasks")
      .insert(payload as never)
      .select("*")
      .single();
    if (error) throw error;
    const parent = data as IntakeTaskRow;
    const subs = (input.subtasks ?? []).filter((s) => s.title.trim());
    if (subs.length > 0) {
      const rows = subs.map((s) => ({
        lead_id: input.lead_id ?? null,
        task_type: "subtask",
        title: s.title.trim(),
        owner: (s.owner ?? input.owner ?? null)?.trim() || null,
        due_date: s.due_date || input.due_date || null,
        notes: null,
        status: "Open",
        parent_task_id: parent.id,
        related_record_type: input.related_record_type ?? null,
        related_record_id: input.related_record_id ?? null,
        related_record_label: input.related_record_label ?? null,
        related_url: input.related_url ?? null,
      }));
      const { error: subErr } = await supabase.from("intake_tasks").insert(rows as never);
      if (subErr) throw subErr;
    }
    return parent;
  }, []);

  /**
   * Update editable task fields (title, owner, due_date, task_type) without
   * writing a status/activity line. Optimistic; rolls back on failure.
   */
  const updateFields = useCallback(async (
    id: string,
    patch: Partial<Pick<IntakeTaskRow,
      | "title" | "owner" | "due_date" | "task_type"
      | "lead_id"
      | "related_record_type" | "related_record_id"
      | "related_record_label" | "related_url"
    >>,
  ) => {
    let prev: IntakeTaskRow | undefined;
    setTasks((cur) => cur.map((t) => {
      if (t.id !== id) return t;
      prev = t;
      return { ...t, ...patch };
    }));
    const { error } = await supabase.from("intake_tasks").update(patch as never).eq("id", id);
    if (error) {
      if (prev) setTasks((cur) => cur.map((t) => t.id === id ? prev! : t));
      throw error;
    }
  }, []);

  /**
   * Append a freeform note to a task. Notes are stored inline in `notes` as:
   *   [<ISO>] Note (by <author>): <body>
   * so they coexist with status-change lines and can be parsed back out.
   */
  const addNote = useCallback(async (
    task: IntakeTaskRow,
    body: string,
    author?: string | null,
  ) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const stamp = new Date().toISOString();
    const who = (author ?? "").trim() || task.owner || "Unknown";
    const entry = `[${stamp}] Note (by ${who}): ${trimmed}`;
    const prev = (task.notes ?? "").trim();
    const nextNotes = prev ? `${prev}\n${entry}` : entry;
    setTasks((cur) => cur.map((t) => t.id === task.id ? { ...t, notes: nextNotes } : t));
    const { error } = await supabase
      .from("intake_tasks")
      .update({ notes: nextNotes } as never)
      .eq("id", task.id);
    if (error) {
      setTasks((cur) => cur.map((t) => t.id === task.id ? { ...t, notes: task.notes } : t));
      throw error;
    }
    if (task.lead_id) {
      await supabase.from("intake_communications").insert({
        lead_id: task.lead_id,
        communication_type: "note",
        direction: "internal",
        subject: `Task note`,
        preview: `${task.title} — ${trimmed}`,
        logged_by_name: who,
      } as never).then(({ error: e }) => { if (e) console.warn("note log failed", e); });
    }
  }, []);

  return { tasks, loading, refetch, complete, snooze, reassign, markStarted, setStatus, create, updateFields, addNote };
}