import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserTaskStatus = "open" | "in_progress" | "done" | "cancelled";
export type UserTaskPriority = "low" | "medium" | "high";

export interface UserTask {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string;
  assigned_by_id: string;
  due_at: string | null;
  priority: UserTaskPriority;
  status: UserTaskStatus;
  related_record_type: string | null;
  related_record_id: string | null;
  related_record_label: string | null;
  related_url: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const TASK_COLUMNS =
  "id,title,description,assignee_id,assigned_by_id,due_at,priority,status,related_record_type,related_record_id,related_record_label,related_url,completed_at,created_at,updated_at";

export type TaskScope = "assigned_to_me" | "assigned_by_me";

export function useUserTasks(scope: TaskScope = "assigned_to_me") {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["user_tasks", scope, userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<UserTask[]> => {
      if (!userId) return [];
      const col = scope === "assigned_to_me" ? "assignee_id" : "assigned_by_id";
      const { data, error } = await supabase
        .from("user_tasks")
        .select(TASK_COLUMNS)
        .eq(col, userId)
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UserTask[];
    },
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["user_tasks"] });

  const createTask = useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string | null;
      assignee_id?: string;
      due_at?: string | null;
      priority?: UserTaskPriority;
      related_record_type?: string | null;
      related_record_id?: string | null;
      related_record_label?: string | null;
      related_url?: string | null;
    }) => {
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_tasks")
        .insert({
          title: input.title,
          description: input.description ?? null,
          assignee_id: input.assignee_id ?? userId,
          assigned_by_id: userId,
          due_at: input.due_at ?? null,
          priority: input.priority ?? "medium",
          status: "open",
          related_record_type: input.related_record_type ?? null,
          related_record_id: input.related_record_id ?? null,
          related_record_label: input.related_record_label ?? null,
          related_url: input.related_url ?? null,
        })
        .select(TASK_COLUMNS)
        .single();
      if (error) throw error;
      return data as UserTask;
    },
    onSuccess: invalidate,
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<UserTask> }) => {
      const { error } = await supabase.from("user_tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const completeTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_tasks")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const tasks = query.data ?? [];
  const grouped = useMemo(() => groupTasks(tasks), [tasks]);

  return {
    tasks,
    grouped,
    loading: query.isLoading,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
  };
}

function groupTasks(tasks: UserTask[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000;
  const endOfWeek = startOfToday + 7 * 24 * 60 * 60 * 1000;

  const overdue: UserTask[] = [];
  const today: UserTask[] = [];
  const week: UserTask[] = [];
  const later: UserTask[] = [];
  const done: UserTask[] = [];

  for (const t of tasks) {
    if (t.status === "done" || t.status === "cancelled") {
      done.push(t);
      continue;
    }
    if (!t.due_at) {
      later.push(t);
      continue;
    }
    const due = new Date(t.due_at).getTime();
    if (due < startOfToday) overdue.push(t);
    else if (due < endOfToday) today.push(t);
    else if (due < endOfWeek) week.push(t);
    else later.push(t);
  }
  return { overdue, today, week, later, done };
}