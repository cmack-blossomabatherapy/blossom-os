import { ArrowUpRight, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiSpec } from "@/lib/os/dashboardEngine/types";

const TONE_RING: Record<NonNullable<KpiSpec["tone"]>, string> = {
  default: "border-border/60",
  success: "border-emerald-300/60",
  warn: "border-amber-300/70",
  danger: "border-rose-300/70",
};

const TONE_DOT: Record<NonNullable<KpiSpec["tone"]>, string> = {
  default: "bg-muted-foreground/30",
  success: "bg-emerald-500",
  warn: "bg-amber-500",
  danger: "bg-rose-500",
};

export function KpiTile({ kpi, onClick }: { kpi: KpiSpec; onClick?: (k: KpiSpec) => void }) {
  const tone = kpi.tone ?? "default";
  const clickable = !!kpi.drilldown;
  const TrendIcon = kpi.delta?.tone === "up" ? TrendingUp : kpi.delta?.tone === "down" ? TrendingDown : Minus;
  return (
    <button
      type="button"
      onClick={() => clickable && onClick?.(kpi)}
      disabled={!clickable}
      className={cn(
        "group relative flex w-full flex-col rounded-2xl border bg-card p-4 text-left transition-all duration-300",
        TONE_RING[tone],
        clickable && "hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.4)] hover:shadow-[0_20px_40px_-25px_hsl(265_60%_50%/0.4)]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[tone])} />
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{kpi.label}</p>
        </div>
        {clickable && (
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 transition group-hover:text-[hsl(265_70%_55%)]" />
        )}
      </div>
      <p className="mt-2 text-[26px] font-semibold tabular-nums tracking-tight">{kpi.value}</p>
      {kpi.delta && (
        <p className={cn(
          "mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium",
          kpi.delta.tone === "up" ? "text-emerald-600" : kpi.delta.tone === "down" ? "text-rose-600" : "text-muted-foreground",
        )}>
          <TrendIcon className="h-3 w-3" /> {kpi.delta.label ?? `${kpi.delta.value.toFixed(1)}%`}
        </p>
      )}
      {kpi.hint && <p className="mt-1 text-[10.5px] text-muted-foreground">{kpi.hint}</p>}
    </button>
  );
}