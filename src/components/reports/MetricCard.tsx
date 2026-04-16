import { useNavigate } from "react-router-dom";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiMetric } from "@/data/reports";

export function MetricCard({ metric }: { metric: KpiMetric }) {
  const navigate = useNavigate();
  const clickable = !!metric.drillTo;

  return (
    <button
      onClick={() => metric.drillTo && navigate(metric.drillTo)}
      disabled={!clickable}
      className={cn(
        "text-left bg-card rounded-xl border border-border/60 p-3.5 flex flex-col gap-1 transition-all group",
        clickable && "hover:border-primary/40 hover:shadow-sm cursor-pointer",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
          {metric.label}
        </span>
        {clickable && (
          <ArrowUpRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
        )}
      </div>
      <span className="text-2xl font-semibold text-foreground tracking-tight tabular-nums">{metric.value}</span>
      <div className="flex items-center gap-1.5">
        {metric.trend === "up" && <TrendingUp className="h-3 w-3 text-success" />}
        {metric.trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
        {metric.trend === "neutral" && <Minus className="h-3 w-3 text-muted-foreground" />}
        <span
          className={cn(
            "text-[11px] font-medium",
            metric.trend === "up" && "text-success",
            metric.trend === "down" && "text-destructive",
            metric.trend === "neutral" && "text-muted-foreground",
          )}
        >
          {metric.change}
        </span>
      </div>
      {metric.hint && <span className="text-[10px] text-muted-foreground">{metric.hint}</span>}
    </button>
  );
}
