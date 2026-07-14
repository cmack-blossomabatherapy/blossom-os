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
    const { data } = await supabase
      .from("intake_tasks")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(500);
    setTasks((data ?? []) as IntakeTaskRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refetch();
    const channel = supabase
      .channel("intake-tasks-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "intake_tasks" }, () => { void refetch(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
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

  return { tasks, loading, refetch, complete, snooze, reassign, markStarted, create };
}