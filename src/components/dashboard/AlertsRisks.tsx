import { ShieldAlert, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  label: string;
  count: number;
  severity: "critical" | "warning" | "info";
  trend?: string;
}

const alerts: Alert[] = [
  { label: "Denied authorizations", count: 2, severity: "critical", trend: "↑ 1 this week" },
  { label: "Missing documentation", count: 12, severity: "warning" },
  { label: "Expiring auth < 7 days", count: 8, severity: "critical", trend: "3 expire tomorrow" },
  { label: "Flaked clients", count: 6, severity: "warning", trend: "↑ 2 this month" },
  { label: "Services on pause", count: 4, severity: "warning" },
];

const sevDot = { critical: "bg-destructive", warning: "bg-warning", info: "bg-info" };
const sevBg = { critical: "bg-destructive/5", warning: "bg-warning/5", info: "bg-info/5" };

export function AlertsRisks() {
  return (
    <div className="bg-card rounded-xl border border-border/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="h-4 w-4 text-destructive" />
        <h3 className="text-sm font-semibold text-foreground">Alerts & Risks</h3>
      </div>
      <div className="space-y-1.5">
        {alerts.map((a) => (
          <div
            key={a.label}
            className={cn(
              "flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity group",
              sevBg[a.severity],
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn("h-2 w-2 rounded-full shrink-0", sevDot[a.severity])} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{a.label}</p>
                {a.trend && <p className="text-[10px] text-muted-foreground">{a.trend}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-bold text-foreground">{a.count}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
