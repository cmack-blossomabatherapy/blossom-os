import { cn } from "@/lib/utils";
import type { KpiDefinition } from "@/lib/os/reports/crPrimary/types";

const TONE: Record<string, string> = {
  neutral: "border-border/60",
  good: "border-emerald-500/40 bg-emerald-500/[0.04]",
  warn: "border-amber-500/40 bg-amber-500/[0.04]",
  bad: "border-destructive/40 bg-destructive/[0.04]",
};

/** Clickable KPI scorecards — clicking one opens the matching drilldown. */
export function KpiScorecards({
  kpis,
  onSelect,
}: {
  kpis: KpiDefinition[];
  onSelect: (id: string) => void;
}) {
  return (
    <section
      data-testid="kpi-grid"
      className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-4"
    >
      {kpis.map((k) => (
        <button
          key={k.id}
          type="button"
          onClick={() => onSelect(k.id)}
          data-testid={`kpi-${k.id}`}
          className={cn(
            "group rounded-2xl border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
            TONE[k.tone ?? "neutral"],
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            {k.label}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{k.value}</p>
          {k.hint && <p className="mt-1 text-[11px] text-muted-foreground">{k.hint}</p>}
          <span className="mt-2 block text-[10px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            View source rows →
          </span>
        </button>
      ))}
    </section>
  );
}