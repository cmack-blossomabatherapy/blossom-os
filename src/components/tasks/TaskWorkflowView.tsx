import { Layers, AlertTriangle, CheckSquare } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type TaskRecord,
  type TaskDepartment,
  taskStatusVariant,
  taskPriorityVariant,
  departmentOrder,
  isOverdue,
  formatTaskDate,
} from "@/data/tasks";

interface Props {
  tasks: TaskRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const deptSubtitle: Record<TaskDepartment, string> = {
  Intake: "Forms · Insurance · Missing Info",
  Auth: "VOB · Treatment Auth · Documentation",
  QA: "Treatment Plan · Checklist · Approval",
  Scheduling: "BCBA · Assessment · Build Schedule",
  Staffing: "Assign · Reassign · Availability",
  Operations: "Case Coord · Pairing Email",
};

export function TaskWorkflowView({ tasks, selectedId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {departmentOrder.map((dept) => {
        const items = tasks.filter((t) => t.department === dept);
        const blocked = items.filter((t) => t.status === "Blocked").length;
        const overdueCount = items.filter(isOverdue).length;

        return (
          <div key={dept} className="bg-card rounded-xl border border-border/60 overflow-hidden flex flex-col">
            <div className="px-3 py-2.5 border-b border-border/40 bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Layers className="h-3 w-3" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground truncate">{dept}</h3>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground bg-background border border-border/60 px-1.5 py-0.5 rounded shrink-0">
                  {items.length}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 ml-8 truncate">{deptSubtitle[dept]}</p>
              {(blocked > 0 || overdueCount > 0) && (
                <div className="flex items-center gap-1.5 mt-1.5 ml-8 flex-wrap">
                  {overdueCount > 0 && (
                    <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {overdueCount} overdue
                    </span>
                  )}
                  {blocked > 0 && (
                    <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                      {blocked} blocked
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="divide-y divide-border/30 flex-1">
              {items.length === 0 ? (
                <p className="px-3 py-6 text-xs text-center text-muted-foreground italic">No tasks</p>
              ) : (
                items.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 hover:bg-muted/20 transition-colors",
                      selectedId === t.id && "bg-primary/5",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <CheckSquare
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          t.status === "Completed"
                            ? "text-success"
                            : t.status === "Blocked"
                              ? "text-destructive"
                              : "text-muted-foreground",
                        )}
                      />
                      <span className="text-xs font-medium text-foreground truncate flex-1">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 ml-5 flex-wrap">
                      <StatusBadge status={t.status} variant={taskStatusVariant(t.status)} />
                      <StatusBadge status={t.priority} variant={taskPriorityVariant(t.priority)} />
                      <span
                        className={cn(
                          "text-[10px] tabular-nums ml-auto",
                          isOverdue(t) ? "text-destructive font-semibold" : "text-muted-foreground",
                        )}
                      >
                        {formatTaskDate(t.dueDate)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 ml-5 truncate">
                      {t.linkedRecordLabel} · {t.owner}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
