import { Zap, AlertOctagon, Pause, ArrowRight, Star } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type Automation,
  automationStatusVariant,
  workflowVariant,
  formatRelative,
} from "@/data/automations";

interface Props {
  automations: Automation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function AutomationListView({ automations, selectedId, onSelect }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {["Automation", "Workflow", "Trigger", "Action", "Status", "Last Run", "Success", "Owner"].map((h) => (
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
          {automations.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                No automations match this view
              </td>
            </tr>
          ) : (
            automations.map((a) => {
              const StatusIcon = a.status === "Error" ? AlertOctagon : a.status === "Paused" ? Pause : Zap;
              return (
                <tr
                  key={a.id}
                  onClick={() => onSelect(a.id)}
                  className={cn(
                    "border-b border-border/40 last:border-b-0 hover:bg-muted/20 cursor-pointer transition-colors",
                    selectedId === a.id && "bg-primary/5",
                  )}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <StatusIcon
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          a.status === "Active" && "text-primary",
                          a.status === "Error" && "text-destructive",
                          a.status === "Paused" && "text-muted-foreground",
                        )}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground truncate">{a.name}</span>
                          {a.highImpact && (
                            <Star className="h-3 w-3 text-warning fill-warning shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">{a.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={a.workflow} variant={workflowVariant(a.workflow)} />
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[180px]">
                    {a.triggerLabel}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[160px]">{a.actions[0]?.detail ?? "—"}</span>
                      {a.actions.length > 1 && (
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1 rounded shrink-0">
                          +{a.actions.length - 1}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={a.status} variant={automationStatusVariant(a.status)} />
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                    {formatRelative(a.lastRun)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            a.successRate >= 95
                              ? "bg-success"
                              : a.successRate >= 85
                                ? "bg-warning"
                                : "bg-destructive",
                          )}
                          style={{ width: `${a.successRate}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-[11px] font-medium tabular-nums",
                          a.successRate >= 95
                            ? "text-success"
                            : a.successRate >= 85
                              ? "text-warning"
                              : "text-destructive",
                        )}
                      >
                        {a.successRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{a.owner}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
