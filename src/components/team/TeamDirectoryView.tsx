import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type TeamMember,
  departmentVariant,
  statusVariant,
  workloadVariant,
} from "@/data/team";

interface Props {
  members: TeamMember[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TeamDirectoryView({ members, selectedId, onSelect }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {["Name", "Role", "Department", "States", "Leads", "Clients", "Auths", "Tasks", "Overdue", "Workload", "Status"].map((h) => (
              <th key={h} className="text-left px-3 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td colSpan={11} className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                No team members match this view
              </td>
            </tr>
          ) : (
            members.map((t) => (
              <tr
                key={t.id}
                onClick={() => onSelect(t.id)}
                className={cn(
                  "border-b border-border/40 last:border-b-0 hover:bg-muted/20 cursor-pointer transition-colors",
                  selectedId === t.id && "bg-primary/5",
                )}
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">
                      {t.initials}
                    </div>
                    <span className="text-sm font-medium text-foreground truncate">{t.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{t.role}</td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={t.department} variant={departmentVariant(t.department)} />
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{t.states.join(", ")}</td>
                <td className="px-3 py-2.5 text-xs font-semibold tabular-nums text-foreground">{t.workload.leads || "—"}</td>
                <td className="px-3 py-2.5 text-xs font-semibold tabular-nums text-foreground">{t.workload.clients || "—"}</td>
                <td className="px-3 py-2.5 text-xs font-semibold tabular-nums text-foreground">{t.workload.auths || "—"}</td>
                <td className="px-3 py-2.5 text-xs font-semibold tabular-nums text-foreground">{t.workload.tasksOpen}</td>
                <td className="px-3 py-2.5">
                  <span className={cn(
                    "text-xs font-semibold tabular-nums",
                    t.workload.tasksOverdue > 0 ? "text-destructive" : "text-muted-foreground",
                  )}>
                    {t.workload.tasksOverdue}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={t.workloadLevel} variant={workloadVariant(t.workloadLevel)} />
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={t.status} variant={statusVariant(t.status)} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
