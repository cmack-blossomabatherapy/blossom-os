import { Sparkline } from "./Sparkline";
import { cn } from "@/lib/utils";
import type { ScorecardRowData } from "@/data/blossomIntelligence";

export function ScorecardRow({ row }: { row: ScorecardRowData }) {
  const dotTone = row.status === "green" ? "bg-success" : row.status === "yellow" ? "bg-warning" : "bg-destructive";
  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="py-3 pr-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", dotTone)} />
          <span className="font-medium text-foreground text-sm">{row.kpi}</span>
        </div>
      </td>
      <td className="py-3 pr-3 text-xs text-muted-foreground hidden md:table-cell">{row.owner}</td>
      <td className="py-3 pr-3 text-xs text-center hidden sm:table-cell">{row.target}</td>
      <td className="py-3 pr-3 text-sm font-semibold text-center">{row.current}</td>
      <td className="py-3 w-32"><Sparkline values={row.trend} height={24} tone={row.status === "green" ? "success" : row.status === "yellow" ? "warning" : "destructive"} /></td>
    </tr>
  );
}
