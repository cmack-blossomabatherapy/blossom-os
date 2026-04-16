import { useNavigate } from "react-router-dom";
import { AlertTriangle, AlertOctagon, Info, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskAlert } from "@/data/reports";

const severityMap = {
  high: { Icon: AlertOctagon, classes: "bg-destructive/10 text-destructive border-destructive/30" },
  medium: { Icon: AlertTriangle, classes: "bg-warning/10 text-warning border-warning/30" },
  low: { Icon: Info, classes: "bg-info/10 text-info border-info/30" },
} as const;

export function RiskAlertPanel({ alerts }: { alerts: RiskAlert[] }) {
  const navigate = useNavigate();
  return (
    <div className="bg-card rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Alerts & Risk</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Auto-surfaced from pipeline state</p>
        </div>
        <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
          {alerts.filter((a) => a.severity === "high").length} HIGH
        </span>
      </div>
      <div className="space-y-2">
        {alerts.map((a) => {
          const { Icon, classes } = severityMap[a.severity];
          return (
            <button
              key={a.id}
              onClick={() => navigate(a.drillTo)}
              className="w-full text-left flex items-center gap-3 p-2.5 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-muted/20 transition-colors group"
            >
              <div className={cn("h-7 w-7 rounded-md inline-flex items-center justify-center border shrink-0", classes)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{a.title}</span>
                  <span className="text-xs font-bold text-foreground tabular-nums">{a.count}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{a.description}</p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
