import { Sparkles, AlertTriangle, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Observation } from "@/lib/analytics/bcbaIntel";

interface Props { observations: Observation[]; }

/**
 * Horizontally-scrolling "Live Observations" rail — auto-generated
 * operational insights from the loaded sessions.
 */
export function ObservationsRail({ observations }: Props) {
  if (!observations.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-3 text-[12px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          No notable patterns detected in this window. Try widening the date range.
        </span>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 px-0.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Live observations
        </span>
        <span className="text-[10px] text-muted-foreground/70">· auto-detected from current filters</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {observations.map((o) => {
          const Icon = o.severity === "alert" ? AlertTriangle
            : o.severity === "warn" ? AlertTriangle
            : o.severity === "positive" ? TrendingUp
            : Info;
          const toneClass =
            o.severity === "alert"    ? "border-destructive/30 bg-destructive/[0.06] text-destructive" :
            o.severity === "warn"     ? "border-warning/30 bg-warning/[0.06] text-warning" :
            o.severity === "positive" ? "border-success/30 bg-success/[0.06] text-success" :
                                        "border-primary/30 bg-primary/[0.06] text-primary";
          return (
            <div
              key={o.id}
              className={cn(
                "shrink-0 max-w-[340px] rounded-xl border px-3 py-2 text-[12px] leading-snug shadow-sm transition-all hover:-translate-y-0.5",
                toneClass,
              )}
            >
              <div className="flex items-start gap-1.5">
                <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <p className="text-foreground/90">{o.text}</p>
              </div>
              <p className="mt-1 text-[10px] uppercase tracking-wide opacity-60">{o.category}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}