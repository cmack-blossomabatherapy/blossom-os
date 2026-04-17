import { cn } from "@/lib/utils";
import { DAYS, TIME_SLOTS, type AvailabilityGrid as Grid } from "@/data/recruiting";

const CELL_STYLES: Record<string, string> = {
  available: "bg-success/30 border-success/40",
  preferred: "bg-success border-success text-success-foreground",
  unavailable: "bg-muted/40 border-border/40",
};

export function AvailabilityGrid({ grid }: { grid: Grid }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium text-left px-1 w-20">Slot</th>
            {DAYS.map((d) => (
              <th key={d} className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium px-1">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((t) => (
            <tr key={t}>
              <td className="text-[10px] text-muted-foreground px-1 py-0.5 whitespace-nowrap">{t}</td>
              {DAYS.map((d) => {
                const v = grid[d][t];
                return (
                  <td key={`${d}-${t}`} className="px-0">
                    <div
                      className={cn(
                        "h-7 rounded border text-[9px] flex items-center justify-center",
                        CELL_STYLES[v],
                      )}
                      title={`${d} ${t}: ${v}`}
                    >
                      {v === "preferred" ? "★" : ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-success" /> Preferred
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-success/30" /> Available
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-muted/40 border border-border/40" /> Unavailable
        </span>
      </div>
    </div>
  );
}
