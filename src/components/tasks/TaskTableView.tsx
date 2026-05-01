import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type TaskRecord,
  taskStatusVariant,
  taskPriorityVariant,
  departmentVariant,
  linkedTypeVariant,
  isOverdue,
  formatTaskDate,
} from "@/data/tasks";

interface Props {
  tasks: TaskRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TaskTableView({ tasks, selectedId, onSelect }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      {/* Mobile card list */}
      <ul className="md:hidden divide-y divide-border/40">
        {tasks.length === 0 ? (
          <li className="px-4 py-8 text-center text-xs text-muted-foreground italic">
            No tasks match this view
          </li>
        ) : (
          tasks.map((t) => {
            const overdue = isOverdue(t);
            return (
              <li
                key={t.id}
                onClick={() => onSelect(t.id)}
                className={cn(
                  "px-3 py-3 cursor-pointer transition-colors active:bg-muted/30",
                  selectedId === t.id && "bg-primary/5",
                )}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0 mt-1.5",
                      t.priority === "High"
                        ? "bg-destructive"
                        : t.priority === "Medium"
                          ? "bg-warning"
                          : "bg-muted-foreground/40",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.linkedRecordLabel} · {t.owner}
                    </p>
                  </div>
                  <StatusBadge status={t.status} variant={taskStatusVariant(t.status)} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={t.department} variant={departmentVariant(t.department)} />
                  <StatusBadge status={t.linkedRecordType} variant={linkedTypeVariant(t.linkedRecordType)} />
                  <StatusBadge status={t.priority} variant={taskPriorityVariant(t.priority)} />
                  <span className={cn(
                    "ml-auto text-[11px] font-medium tabular-nums",
                    overdue ? "text-destructive" : "text-muted-foreground",
                  )}>
                    {formatTaskDate(t.dueDate)}
                  </span>
                </div>
                {t.currentStage && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground truncate">→ {t.currentStage}</p>
                )}
              </li>
            );
          })
        )}
      </ul>

      {/* Desktop table */}
      <table className="hidden md:table w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {["Task", "Dept", "Linked", "Owner", "Status", "Priority", "Stage", "Due"].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                No tasks match this view
              </td>
            </tr>
          ) : (
            tasks.map((t) => {
              const overdue = isOverdue(t);
              return (
                <tr
                  key={t.id}
                  onClick={() => onSelect(t.id)}
                  className={cn(
                    "border-b border-border/40 last:border-b-0 hover:bg-muted/20 cursor-pointer transition-colors",
                    selectedId === t.id && "bg-primary/5",
                  )}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          t.priority === "High"
                            ? "bg-destructive"
                            : t.priority === "Medium"
                              ? "bg-warning"
                              : "bg-muted-foreground/40",
                        )}
                      />
                      <span className="text-sm font-medium text-foreground truncate">{t.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={t.department} variant={departmentVariant(t.department)} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={t.linkedRecordType} variant={linkedTypeVariant(t.linkedRecordType)} />
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {t.linkedRecordLabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.owner}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={t.status} variant={taskStatusVariant(t.status)} />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={t.priority} variant={taskPriorityVariant(t.priority)} />
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[160px]">
                    {t.currentStage}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "text-xs font-medium tabular-nums",
                        overdue ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {formatTaskDate(t.dueDate)}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
