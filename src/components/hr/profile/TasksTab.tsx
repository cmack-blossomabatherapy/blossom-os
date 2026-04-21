import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { Employee } from "@/lib/hr/types";

interface TaskRow {
  id: string; title: string; category: string; due_date: string | null;
  completed: boolean; owner_role: string | null; is_required: boolean;
}

export function TasksTab({ employee }: { employee: Employee }) {
  const { hasPerm } = useAuth();
  const canEdit = hasPerm("hr.onboarding.manage");
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, [employee.id]);

  async function load() {
    setLoading(true);
    const { data: onb } = await supabase.from("employee_onboarding").select("id").eq("employee_id", employee.id);
    const ids = (onb ?? []).map((o) => o.id);
    if (ids.length === 0) { setTasks([]); setLoading(false); return; }
    const { data } = await supabase
      .from("employee_onboarding_tasks")
      .select("id, title, category, due_date, completed, owner_role, is_required")
      .in("onboarding_id", ids)
      .order("position");
    setTasks((data ?? []) as TaskRow[]);
    setLoading(false);
  }

  async function toggle(t: TaskRow) {
    if (!canEdit) return;
    const next = !t.completed;
    setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, completed: next } : x));
    const { error } = await supabase
      .from("employee_onboarding_tasks")
      .update({ completed: next, completed_at: next ? new Date().toISOString() : null })
      .eq("id", t.id);
    if (error) { toast.error(error.message); void load(); return; }
    if (next) {
      await supabase.from("employee_timeline").insert({
        employee_id: employee.id,
        event_type: "onboarding_advanced",
        description: `Onboarding task completed: ${t.title}`,
      });
    }
  }

  if (loading) return <Skeleton className="h-40" />;
  if (tasks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">No onboarding tasks yet.</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Start an onboarding workflow from the Onboarding Center.</p>
      </Card>
    );
  }

  const grouped = tasks.reduce<Record<string, TaskRow[]>>((acc, t) => {
    (acc[t.category] = acc[t.category] ?? []).push(t); return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat} className="p-4">
          <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">{cat}</h4>
          <div className="space-y-1">
            {items.map((t) => (
              <label key={t.id} className={cn("flex items-start gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/30", canEdit ? "cursor-pointer" : "cursor-default")}>
                <Checkbox checked={t.completed} disabled={!canEdit} onCheckedChange={() => toggle(t)} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", t.completed ? "line-through text-muted-foreground" : "text-foreground")}>{t.title}</p>
                  <p className="text-[11px] text-muted-foreground">{t.owner_role ?? "Unassigned"}{t.due_date ? ` · due ${t.due_date}` : ""}</p>
                </div>
                {t.is_required && <span className="text-[10px] uppercase tracking-wider text-warning">Required</span>}
              </label>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}