import { AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskTableSpec } from "@/lib/os/dashboardEngine/types";

const TONE: Record<RiskTableSpec["severity"], string> = {
  low: "border-border/60",
  med: "border-amber-300/60",
  high: "border-rose-300/60",
};
const PILL: Record<RiskTableSpec["severity"], string> = {
  low: "bg-muted text-foreground",
  med: "bg-amber-500 text-white",
  high: "bg-rose-500 text-white",
};

export function RiskTable({ risk, onOpen }: { risk: RiskTableSpec; onOpen?: () => void }) {
  const hasRows = risk.rows.length > 0;
  return (
    <article className={cn("rounded-2xl border bg-card p-4", TONE[risk.severity])}>
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <h3 className="text-[13px] font-semibold tracking-tight">{risk.title}</h3>
        </div>
        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide", PILL[risk.severity])}>
          {risk.severity}
        </span>
      </header>
      {!hasRows ? (
        <p className="mt-3 rounded-xl border border-dashed border-border/60 bg-secondary/30 px-3 py-4 text-center text-[11.5px] text-muted-foreground">
          {risk.emptyMessage ?? "No issues detected."}
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-border/40">
          <table className="w-full text-[11.5px]">
            <thead className="bg-secondary/40">
              <tr>
                {risk.columns.map(c => (
                  <th key={c} className="px-2.5 py-1.5 text-left font-medium text-muted-foreground">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {risk.rows.map((row, i) => (
                <tr key={i} className="border-t border-border/30">
                  {row.map((cell, j) => (
                    <td key={j} className="px-2.5 py-1.5 tabular-nums">{String(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {onOpen && hasRows && (
        <button
          onClick={onOpen}
          className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(265_70%_55%)] transition hover:translate-x-0.5"
        >
          View all <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </article>
  );
}