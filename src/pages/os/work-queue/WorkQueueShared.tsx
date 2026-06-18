import { type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getEscalationLevel,
  getRecommendedWorkAction,
  isWorkItemEscalated,
  isWorkItemOverdue,
  type WorkItem,
  type WorkItemPriority,
  type WorkItemStatus,
} from "@/lib/workQueue/workQueueModel";

export const PRIORITY_TONE: Record<WorkItemPriority, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  normal: "bg-slate-50 text-slate-700 border-slate-200",
  low: "bg-muted text-muted-foreground border-border/60",
};

export const STATUS_TONE: Record<WorkItemStatus, string> = {
  new: "bg-sky-50 text-sky-700 border-sky-200",
  open: "bg-sky-50 text-sky-700 border-sky-200",
  in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
  waiting: "bg-amber-50 text-amber-800 border-amber-200",
  blocked: "bg-red-50 text-red-700 border-red-200",
  escalated: "bg-red-100 text-red-800 border-red-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-muted text-muted-foreground border-border/60",
  ignored: "bg-muted text-muted-foreground border-border/60",
};

export function PriorityBadge({ priority }: { priority: WorkItemPriority }) {
  return (
    <Badge variant="outline" className={cn("text-[10px] capitalize", PRIORITY_TONE[priority])}>
      {priority}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: WorkItemStatus }) {
  return (
    <Badge variant="outline" className={cn("text-[10px] capitalize", STATUS_TONE[status])}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export function DueCell({ item }: { item: WorkItem }) {
  if (!item.dueDate) return <span className="text-xs text-muted-foreground">—</span>;
  const overdue = isWorkItemOverdue(item);
  const d = new Date(item.dueDate);
  return (
    <span className={cn("text-xs", overdue ? "text-red-700 font-medium" : "text-muted-foreground")}>
      {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      {overdue ? " · overdue" : ""}
    </span>
  );
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={cn("h-9 w-9 rounded-lg grid place-items-center", tone ?? "bg-muted text-muted-foreground")}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold leading-tight">{value}</div>
        </div>
      </div>
    </div>
  );
}

export function WorkItemMeta({ item }: { item: WorkItem }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <PriorityBadge priority={item.priority} />
      <StatusBadge status={item.status} />
      {isWorkItemEscalated(item) && (
        <Badge variant="outline" className="text-[10px] border-red-200 text-red-700 bg-red-50">
          L{getEscalationLevel(item)} escalation
        </Badge>
      )}
      {item.state && (
        <Badge variant="outline" className="text-[10px] font-normal">
          {item.state}
        </Badge>
      )}
    </div>
  );
}

export function RecommendedAction({ item }: { item: WorkItem }) {
  return <span className="text-xs text-muted-foreground">{getRecommendedWorkAction(item)}</span>;
}