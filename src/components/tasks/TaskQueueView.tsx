import { AlertTriangle, Clock, ArrowUpRight, AlertOctagon, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type TaskRecord,
  taskStatusVariant,
  taskPriorityVariant,
  departmentVariant,
  isOverdue,
  isDueToday,
  formatTaskDate,
} from "@/data/tasks";

interface Props {
  tasks: TaskRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TaskQueueView({ tasks, selectedId, onSelect }: Props) {
  const overdue = tasks.filter((t) => isOverdue(t) && t.status !== "Blocked");
  const today = tasks.filter(isDueToday);
  const blocked = tasks.filter((t) => t.status === "Blocked");
  const nextUp = tasks.filter(
    (t) => t.status !== "Completed" && t.status !== "Blocked" && !isOverdue(t) && !isDueToday(t),
  );

  return (
    <div className="space-y-4">
      <Section
        title="Overdue"
        count={overdue.length}
        icon={AlertOctagon}
        tone="destructive"
        empty="Nothing overdue — keep it up"
      >
        {overdue.map((t) => (
          <TaskRow key={t.id} task={t} selected={selectedId === t.id} onSelect={onSelect} />
        ))}
      </Section>

      <Section
        title="Due Today"
        count={today.length}
        icon={Clock}
        tone="warning"
        empty="No tasks due today"
      >
        {today.map((t) => (
          <TaskRow key={t.id} task={t} selected={selectedId === t.id} onSelect={onSelect} />
        ))}
      </Section>

      <Section
        title="Blocked"
        count={blocked.length}
        icon={AlertTriangle}
        tone="destructive"
        empty="No blockers — clear runway"
      >
        {blocked.map((t) => (
          <TaskRow key={t.id} task={t} selected={selectedId === t.id} onSelect={onSelect} showBlocker />
        ))}
      </Section>

      <Section
        title="Next Up"
        count={nextUp.length}
        icon={CheckCircle2}
        tone="default"
        empty="No upcoming tasks"
      >
        {nextUp.map((t) => (
          <TaskRow key={t.id} task={t} selected={selectedId === t.id} onSelect={onSelect} />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title, count, icon: Icon, tone, empty, children,
}: {
  title: string;
  count: number;
  icon: typeof AlertTriangle;
  tone: "destructive" | "warning" | "default";
  empty: string;
  children: React.ReactNode;
}) {
  const toneClasses = {
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    default: "bg-primary/10 text-primary border-primary/30",
  } as const;

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/40 bg-muted/20 flex items-center gap-2.5">
        <div className={cn("h-6 w-6 rounded-md inline-flex items-center justify-center border", toneClasses[tone])}>
          <Icon className="h-3 w-3" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs font-medium text-muted-foreground bg-background border border-border/60 px-2 py-0.5 rounded-md">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="px-4 py-6 text-xs text-center text-muted-foreground italic">{empty}</p>
      ) : (
        <div className="divide-y divide-border/30">{children}</div>
      )}
    </div>
  );
}

function TaskRow({
  task, selected, onSelect, showBlocker = false,
}: {
  task: TaskRecord;
  selected: boolean;
  onSelect: (id: string) => void;
  showBlocker?: boolean;
}) {
  const overdue = isOverdue(task);
  return (
    <button
      onClick={() => onSelect(task.id)}
      className={cn(
        "w-full text-left px-4 py-3 hover:bg-muted/20 transition-colors flex items-center gap-3 group",
        selected && "bg-primary/5",
      )}
    >
      <div
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          task.priority === "High" ? "bg-destructive" : task.priority === "Medium" ? "bg-warning" : "bg-muted-foreground/40",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
          <StatusBadge status={task.department} variant={departmentVariant(task.department)} />
          <StatusBadge status={task.status} variant={taskStatusVariant(task.status)} />
          <StatusBadge status={task.priority} variant={taskPriorityVariant(task.priority)} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {task.linkedRecordLabel} · {task.currentStage} · {task.owner}
          {showBlocker && task.blocker && ` · ${task.blocker}`}
        </p>
      </div>
      <div className="text-right shrink-0">
        <div
          className={cn(
            "text-xs font-medium tabular-nums",
            overdue ? "text-destructive" : isDueToday(task) ? "text-warning" : "text-muted-foreground",
          )}
        >
          {formatTaskDate(task.dueDate)}
        </div>
        <ArrowUpRight className="h-3 w-3 text-muted-foreground/60 group-hover:text-primary mt-0.5 ml-auto" />
      </div>
    </button>
  );
}
