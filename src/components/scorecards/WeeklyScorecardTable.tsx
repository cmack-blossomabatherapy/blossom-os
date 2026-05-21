import { cn } from "@/lib/utils";
import { formatKpiValue } from "@/lib/scorecards/kpiDefs";
import type { WeeklyScorecard } from "@/lib/scorecards/mockScorecards";

const COLS: { key: string; label: string; unit: "hours" | "clients" | "count" | "percent" }[] = [
  { key: "hours_51",         label: "51",            unit: "hours" },
  { key: "hours_53",         label: "53",            unit: "hours" },
  { key: "hours_55",         label: "55",            unit: "hours" },
  { key: "hours_56",         label: "56",            unit: "hours" },
  { key: "total_hours",      label: "Total",         unit: "hours" },
  { key: "active_clients",   label: "Clients",       unit: "clients" },
  { key: "avg_client_hours", label: "Avg Hrs",       unit: "hours" },
  { key: "restaffing_needed",label: "Restaffing",    unit: "count" },
  { key: "pct_bcba_hours",   label: "BCBA %",        unit: "percent" },
  { key: "cases_started",    label: "Cases Started", unit: "count" },
];

export function WeeklyScorecardTable({
  scorecards, activeWeek, onSelectWeek,
}: { scorecards: WeeklyScorecard[]; activeWeek: string; onSelectWeek: (w: string) => void }) {
  const ordered = [...scorecards].reverse();
  return (
    <div className="rounded-2xl border border-border/60 bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h3 className="text-[14px] font-semibold tracking-tight">Weekly scorecards</h3>
          <p className="text-[11.5px] text-muted-foreground">Click any week to load it above.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-t border-border/60 bg-secondary/30 text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
              <th className="sticky left-0 z-10 bg-secondary/30 px-3 py-2 text-left font-semibold">Week of</th>
              {COLS.map(c => <th key={c.key} className="px-3 py-2 text-right font-semibold">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {ordered.map(s => {
              const active = s.weekOf === activeWeek;
              return (
                <tr key={s.weekOf}
                    onClick={() => onSelectWeek(s.weekOf)}
                    className={cn(
                      "cursor-pointer border-t border-border/40 transition hover:bg-secondary/30",
                      active && "bg-[hsl(265_70%_55%/0.07)] hover:bg-[hsl(265_70%_55%/0.1)]"
                    )}>
                  <td className={cn("sticky left-0 bg-card px-3 py-2 font-semibold", active && "bg-[hsl(265_70%_55%/0.07)] text-[hsl(265_70%_45%)]")}>
                    {s.weekLabel}
                    <span className="ml-1.5 text-[10.5px] font-normal text-muted-foreground">{s.weekOf}</span>
                  </td>
                  {COLS.map(c => (
                    <td key={c.key} className="px-3 py-2 text-right tabular-nums">
                      {formatKpiValue(s.values[c.key], c.unit)}{c.unit === "percent" ? "%" : ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}