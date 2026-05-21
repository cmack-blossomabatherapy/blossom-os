import { cn } from "@/lib/utils";
import { formatKpiValue } from "@/lib/scorecards/kpiDefs";
import type { WeeklyScorecard } from "@/lib/scorecards/mockScorecards";
import { Button } from "@/components/ui/button";
import { Download, GitCompare, X } from "lucide-react";
import { exportCsv } from "@/lib/scorecards/copyForBloom";
import { toast } from "sonner";
import { useState } from "react";

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
  const [compare, setCompare] = useState<string[]>([]);

  function toggleCompare(week: string) {
    setCompare(prev => {
      if (prev.includes(week)) return prev.filter(w => w !== week);
      if (prev.length >= 3) {
        toast.info("Compare up to 3 weeks at a time");
        return prev;
      }
      return [...prev, week];
    });
  }

  function exportSelected() {
    const rows = compare.length
      ? scorecards.filter(s => compare.includes(s.weekOf))
      : scorecards;
    const csv = exportCsv(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scorecards-${compare.length ? "compare" : "all"}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} week${rows.length === 1 ? "" : "s"}`);
  }

  const comparing = compare
    .map(w => scorecards.find(s => s.weekOf === w))
    .filter((s): s is WeeklyScorecard => !!s)
    .sort((a, b) => a.weekOf.localeCompare(b.weekOf));

  return (
    <div className="rounded-2xl border border-border/60 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div>
          <h3 className="text-[14px] font-semibold tracking-tight">Weekly scorecards</h3>
          <p className="text-[11.5px] text-muted-foreground">
            Click a week to load it · use the checkboxes to compare up to 3.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {compare.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(265_70%_55%/0.1)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[hsl(265_70%_45%)]">
              <GitCompare className="h-3 w-3" /> {compare.length} selected
              <button onClick={() => setCompare([])} className="ml-0.5 rounded-full p-0.5 hover:bg-white/60">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}
          <Button size="sm" variant="outline" onClick={exportSelected} className="h-7 text-[11.5px]">
            <Download className="mr-1 h-3 w-3" />
            Export {compare.length > 0 ? "selected" : "all"}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-t border-border/60 bg-secondary/30 text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
              <th className="bg-secondary/30 px-2 py-2 w-8" />
              <th className="bg-secondary/30 px-3 py-2 text-left font-semibold">Week of</th>
              {COLS.map(c => <th key={c.key} className="px-3 py-2 text-right font-semibold">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {ordered.map(s => {
              const active = s.weekOf === activeWeek;
              const isCompared = compare.includes(s.weekOf);
              return (
                <tr key={s.weekOf}
                    onClick={() => onSelectWeek(s.weekOf)}
                    className={cn(
                      "cursor-pointer border-t border-border/40 transition hover:bg-secondary/30",
                      active && "bg-[hsl(265_70%_55%/0.07)] hover:bg-[hsl(265_70%_55%/0.1)]",
                      isCompared && !active && "bg-[hsl(195_70%_50%/0.06)]"
                    )}>
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isCompared}
                      onChange={() => toggleCompare(s.weekOf)}
                      className="h-3.5 w-3.5 cursor-pointer accent-[hsl(265_70%_55%)]"
                    />
                  </td>
                  <td className={cn("px-3 py-2 font-semibold", active && "text-[hsl(265_70%_45%)]")}>
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
            {comparing.length >= 2 && (() => {
              const first = comparing[0];
              const last = comparing[comparing.length - 1];
              return (
                <tr className="border-t-2 border-[hsl(265_70%_55%/0.4)] bg-[hsl(265_70%_55%/0.05)] text-[11.5px]">
                  <td className="px-2 py-2" />
                  <td className="px-3 py-2 font-semibold text-[hsl(265_70%_45%)]">
                    Δ {first.weekLabel} → {last.weekLabel}
                  </td>
                  {COLS.map(c => {
                    const a = first.values[c.key] ?? 0;
                    const b = last.values[c.key] ?? 0;
                    const d = b - a;
                    const sign = d > 0 ? "+" : "";
                    return (
                      <td key={c.key} className={cn(
                        "px-3 py-2 text-right tabular-nums font-semibold",
                        d > 0 && "text-emerald-700",
                        d < 0 && "text-rose-700",
                        d === 0 && "text-muted-foreground",
                      )}>
                        {sign}{formatKpiValue(d, c.unit)}{c.unit === "percent" ? "%" : ""}
                      </td>
                    );
                  })}
                </tr>
              );
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}