import { CheckSquare, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type TaskRecord,
  taskStatusVariant,
  departmentVariant,
  isOverdue,
  formatTaskDate,
} from "@/data/tasks";

interface Props {
  tasks: TaskRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TaskTimelineView({ tasks, selectedId, onSelect }: Props) {
  // group by due-date day label
  const groups = new Map<string, TaskRecord[]>();
  const sorted = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  sorted.forEach((t) => {
    const d = new Date(t.dueDate);
    const now = new Date();
    let label: string;
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (isOverdue(t)) label = "Overdue";
    else if (sameDay) label = "Today";
    else
      label = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(t);
  });

  // Move "Overdue" first, then "Today"
  const ordered = Array.from(groups.entries()).sort(([a], [b]) => {
    const rank = (k: string) => (k === "Overdue" ? 0 : k === "Today" ? 1 : 2);
    return rank(a) - rank(b);
  });

  return (
    <div className="space-y-5">
      {ordered.map(([label, items]) => {
        const isOverdueGroup = label === "Overdue";
        return (
          <div key={label}>
            <h3
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wider mb-2 px-1 inline-flex items-center gap-1.5",
                isOverdueGroup ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {isOverdueGroup && <AlertTriangle className="h-3 w-3" />}
              {label} · {items.length}
            </h3>
            <div
              className={cn(
                "bg-card rounded-xl border overflow-hidden divide-y divide-border/30",
                isOverdueGroup ? "border-destructive/30" : "border-border/60",
              )}
            >
              {items.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelect(t.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/20 transition-colors flex items-center gap-3",
                    selectedId === t.id && "bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      t.status === "Completed"
                        ? "bg-success/10 text-success"
                        : t.status === "Blocked"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary",
                    )}
                  >
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{t.title}</span>
                      <StatusBadge status={t.department} variant={departmentVariant(t.department)} />
                      <StatusBadge status={t.status} variant={taskStatusVariant(t.status)} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {t.linkedRecordLabel} · {t.owner}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        "text-xs font-medium tabular-nums",
                        isOverdueGroup ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {formatTaskDate(t.dueDate)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
