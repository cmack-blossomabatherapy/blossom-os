import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { teamPerformance } from "@/data/reports";

export function TeamPerformanceTable() {
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40">
        <h3 className="text-sm font-semibold text-foreground">Team Performance</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">By department · last 30 days</p>
      </div>
      <div className="divide-y divide-border/30">
        {teamPerformance.map((m) => (
          <div key={m.name} className="px-4 py-3 flex items-center gap-4 hover:bg-muted/10">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
              {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
              <p className="text-[11px] text-muted-foreground">{m.role}</p>
            </div>
            <div className="hidden md:flex items-center gap-6 shrink-0">
              <Stat label={m.metric1Label} value={m.metric1Value} />
              <Stat label={m.metric2Label} value={m.metric2Value} />
              <Stat label={m.metric3Label} value={m.metric3Value} />
            </div>
            <div className="shrink-0">
              {m.trend === "up" && <TrendingUp className="h-4 w-4 text-success" />}
              {m.trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
              {m.trend === "neutral" && <Minus className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold text-foreground tabular-nums")}>{value}</p>
    </div>
  );
}
