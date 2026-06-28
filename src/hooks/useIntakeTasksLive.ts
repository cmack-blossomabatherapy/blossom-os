import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type IntakeTaskRow = {
  id: string;
  lead_id: string;
  task_type: string;
  title: string;
  owner: string | null;
  due_date: string | null;
  status: "Open" | "In Progress" | "Completed" | "Blocked";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

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

  return { tasks, loading, refetch, complete, snooze, reassign, markStarted };
}