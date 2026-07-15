import { useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO, isPast } from "date-fns";
import { CheckCircle2, Circle, Plus, ListTodo, Clock, ArrowRight, Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUserTasks, type TaskScope, type UserTask } from "@/hooks/useUserTasks";
import { toast } from "sonner";
import { resolveRelatedRecordHref, relatedRecordChipLabel } from "@/lib/tasks/relatedRecord";

function priorityColor(p: UserTask["priority"]) {
  if (p === "high") return "text-rose-500 bg-rose-500/10";
  if (p === "medium") return "text-amber-500 bg-amber-500/10";
  return "text-muted-foreground bg-muted";
}

function TaskRow({ task, onComplete }: { task: UserTask; onComplete: (id: string) => void }) {
  const overdue = task.due_at && isPast(parseISO(task.due_at));
  const relatedHref = resolveRelatedRecordHref(task);
  const relatedLabel = relatedRecordChipLabel(task);
  const taskHref = `/tasks?taskId=${encodeURIComponent(task.id)}&activity=1`;
  return (
    <li className="group flex items-start gap-3 rounded-xl p-2 -mx-2 hover:bg-muted/60 transition">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onComplete(task.id); }}
        className="mt-0.5 text-muted-foreground hover:text-foreground"
        aria-label="Complete task"
      >
        <Circle className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <Link
          to={taskHref}
          className="block text-sm font-medium text-foreground leading-tight truncate hover:text-primary transition"
          title="Open in Tasks"
        >
          {task.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {task.due_at && (
            <span className={cn("inline-flex items-center gap-1", overdue && "text-rose-500 font-medium")}>
              <Clock className="size-3" />
              {format(parseISO(task.due_at), "MMM d")}
            </span>
          )}
          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize", priorityColor(task.priority))}>
            {task.priority}
          </span>
          {relatedLabel && relatedHref && (
            <Link
              to={relatedHref}
              className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-1.5 py-0.5 text-[10px] font-medium text-foreground/80 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition max-w-[220px]"
              title={`Open ${relatedLabel}`}
            >
              <Link2 className="size-3 shrink-0" />
              <span className="truncate">{relatedLabel}</span>
              <ArrowRight className="size-3 shrink-0 opacity-60" />
            </Link>
          )}
          {relatedLabel && !relatedHref && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground max-w-[220px]">
              <Link2 className="size-3 shrink-0" />
              <span className="truncate">{relatedLabel}</span>
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function Section({ label, tasks, onComplete, filterHref }: { label: string; tasks: UserTask[]; onComplete: (id: string) => void; filterHref?: string }) {
  if (tasks.length === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
        {filterHref && (
          <Link to={filterHref} className="text-[11px] text-muted-foreground hover:text-primary transition inline-flex items-center gap-0.5">
            View <ArrowRight className="size-3" />
          </Link>
        )}
      </div>
      <ul className="space-y-1">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} onComplete={onComplete} />
        ))}
      </ul>
    </div>
  );
}

export function MyTasksCard() {
  const [scope, setScope] = useState<TaskScope>("assigned_to_me");
  const [title, setTitle] = useState("");
  const { grouped, tasks, loading, createTask, completeTask } = useUserTasks(scope);

  const handleAdd = async () => {
    const t = title.trim();
    if (!t) return;
    try {
      await createTask.mutateAsync({ title: t });
      setTitle("");
    } catch (e) {
      toast.error("Couldn't add task", { description: (e as Error).message });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeTask.mutateAsync(id);
    } catch (e) {
      toast.error("Couldn't complete", { description: (e as Error).message });
    }
  };

  const openCount =
    grouped.overdue.length + grouped.today.length + grouped.week.length + grouped.later.length;

  return (
    <Card className="rounded-2xl border-border/70 bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            My Tasks
          </h2>
          {openCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {openCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/tasks"
            className="text-[11px] font-medium text-muted-foreground hover:text-primary transition inline-flex items-center gap-0.5"
          >
            View all <ArrowRight className="size-3" />
          </Link>
        <div className="flex rounded-full border border-border/60 bg-muted/40 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setScope("assigned_to_me")}
            className={cn(
              "rounded-full px-2.5 py-1 font-medium transition",
              scope === "assigned_to_me" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            To me
          </button>
          <button
            type="button"
            onClick={() => setScope("assigned_by_me")}
            className={cn(
              "rounded-full px-2.5 py-1 font-medium transition",
              scope === "assigned_by_me" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            By me
          </button>
        </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a task…"
          className="h-9 rounded-xl bg-muted/30"
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!title.trim() || createTask.isPending}
          className="h-9 rounded-xl"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="space-y-2 py-2" aria-label="Loading tasks">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-3"
            >
              <div className="size-4 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                <div className="h-2.5 w-1/3 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : openCount === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          <CheckCircle2 className="mx-auto mb-2 size-5 text-emerald-500" />
          <div className="font-medium text-foreground">You're all caught up.</div>
          <div className="mt-1 text-xs">New tasks assigned to you will appear here.</div>
        </div>
      ) : (
        <div className="space-y-5">
          <Section label="Overdue" tasks={grouped.overdue} onComplete={handleComplete} filterHref="/tasks?filter=overdue" />
          <Section label="Today" tasks={grouped.today} onComplete={handleComplete} filterHref="/tasks?filter=today" />
          <Section label="This week" tasks={grouped.week} onComplete={handleComplete} filterHref="/tasks?due=7d" />
          <Section label="Later" tasks={grouped.later} onComplete={handleComplete} filterHref="/tasks?due=30d" />
        </div>
      )}
    </Card>
  );
}