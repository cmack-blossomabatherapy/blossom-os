import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";
import { formatKpiValue, statusFor, type KpiDef, type KpiStatus } from "@/lib/scorecards/kpiDefs";

const STATUS_RING: Record<KpiStatus, string> = {
  healthy: "ring-emerald-200/70 bg-gradient-to-br from-emerald-50/40 to-white",
  watch:   "ring-amber-200/70 bg-gradient-to-br from-amber-50/40 to-white",
  at_risk: "ring-rose-200/70 bg-gradient-to-br from-rose-50/40 to-white",
};
const STATUS_DOT: Record<KpiStatus, string> = {
  healthy: "bg-emerald-500",
  watch:   "bg-amber-500",
  at_risk: "bg-rose-500",
};

export function KpiTile({ def, value, previous, change, series }: {
  def: KpiDef; value: number; previous: number; change: number | null; series: number[];
}) {
  const status = statusFor(def, change);
  const dir = change === null ? "flat" : change > 0.5 ? "up" : change < -0.5 ? "down" : "flat";
  const positive = change !== null && (def.higherIsBetter ? change > 0 : change < 0);
  const negative = change !== null && (def.higherIsBetter ? change < -0.5 : change > 0.5);

  const Arrow = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;
  const deltaCls = change === null ? "text-muted-foreground"
    : positive ? "text-emerald-600"
    : negative ? "text-rose-600"
    : "text-muted-foreground";

  return (
    <div className={cn(
      "group relative rounded-2xl border border-white/70 p-3.5 ring-1 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-30px_hsl(265_70%_55%/0.5)]",
      STATUS_RING[status]
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
            <p className="truncate text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{def.label}</p>
          </div>
          <p className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-tight">
            {formatKpiValue(value, def.unit)}
            {def.unit === "percent" && <span className="ml-0.5 text-[12px] font-medium text-muted-foreground">%</span>}
          </p>
        </div>
        <Sparkline values={series} tone={status === "healthy" ? "success" : status === "watch" ? "warn" : "danger"} />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px]">
        <span className={cn("inline-flex items-center gap-0.5 font-semibold tabular-nums", deltaCls)}>
          <Arrow className="h-3 w-3" />
          {change === null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`}
        </span>
        <span className="text-muted-foreground">
          prev {formatKpiValue(previous, def.unit)}
        </span>
      </div>
    </div>
  );
}