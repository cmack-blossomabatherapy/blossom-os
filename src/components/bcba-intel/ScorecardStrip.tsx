import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Scorecard } from "@/lib/analytics/bcbaIntel";

interface Props { cards: Scorecard[]; }

/**
 * Executive scorecard strip — premium glass cards with trend deltas.
 * Tones map to semantic tokens only; no hardcoded colors.
 */
export function ScorecardStrip({ cards }: Props) {
  if (!cards.length) return null;
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 lg:grid-cols-7">
      {cards.map((c) => {
        const hasDelta = typeof c.delta === "number" && Number.isFinite(c.delta);
        const positive = hasDelta && (c.delta as number) > 0;
        const negative = hasDelta && (c.delta as number) < 0;
        const Icon = positive ? TrendingUp : negative ? TrendingDown : Minus;
        const tone =
          c.tone === "good" ? "text-success" :
          c.tone === "bad" ? "text-destructive" :
          "text-muted-foreground";
        return (
          <div
            key={c.label}
            className="group rounded-2xl border border-border/60 bg-card/70 backdrop-blur p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            title={c.hint}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground line-clamp-2 min-h-[2.2em]">{c.label}</p>
            <div className="mt-1.5 flex items-baseline justify-between gap-1.5">
              <span className="text-xl font-semibold tabular-nums tracking-tight text-foreground">{c.value}</span>
              {hasDelta && (
                <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium", positive ? "text-success" : negative ? "text-destructive" : "text-muted-foreground")}>
                  <Icon className="h-3 w-3" />
                  {Math.abs(c.delta as number).toFixed(0)}%
                </span>
              )}
            </div>
            {!hasDelta && c.hint && (
              <p className={cn("mt-1 text-[10px] leading-tight", tone)}>{c.hint}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}