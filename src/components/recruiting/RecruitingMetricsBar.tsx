import { Users, UserCheck, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { recruitingMetrics } from "@/data/recruiting";
import { cn } from "@/lib/utils";

export function RecruitingMetricsBar() {
  const m = recruitingMetrics();
  const items = [
    { label: "Total Candidates", value: m.total, icon: Users, tone: "text-foreground" },
    { label: "New This Week", value: m.newThisWeek, icon: Sparkles, tone: "text-info" },
    { label: "In Onboarding", value: m.inOnboarding, icon: Loader2, tone: "text-warning" },
    { label: "Ready for Staffing", value: m.ready, icon: UserCheck, tone: "text-success" },
    { label: "Stuck > 10 days", value: m.stuck, icon: AlertTriangle, tone: "text-destructive" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {items.map((i) => (
        <div key={i.label} className="bg-card rounded-xl border border-border/60 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{i.label}</p>
            <i.icon className={cn("h-3.5 w-3.5", i.tone)} />
          </div>
          <p className={cn("text-xl font-semibold mt-1 tabular-nums", i.tone)}>{i.value}</p>
        </div>
      ))}
    </div>
  );
}
