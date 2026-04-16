import { TrendingDown, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCapacityMap } from "@/data/staffing";

export function StaffingCapacityView() {
  const rows = getCapacityMap();
  const totalGap = rows.reduce((s, r) => s + r.gap, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border/60 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Active Regions</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{rows.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border/60 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Available Hours</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {rows.reduce((s, r) => s + r.availableHours, 0)}h
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border/60 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Network Gap</p>
          <p className={cn("text-2xl font-semibold mt-1 inline-flex items-center gap-1.5", totalGap < 0 ? "text-destructive" : "text-success")}>
            {totalGap < 0 ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
            {totalGap}h
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 bg-muted/20">
          <h3 className="text-sm font-semibold text-foreground">Capacity by State</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Available vs needed weekly hours</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/10">
              {["Region", "RBTs", "Available", "Needed", "Gap", "Utilization"].map((h) => (
                <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const usagePct = Math.min((r.neededHours / Math.max(r.availableHours + r.neededHours, 1)) * 100, 100);
              return (
                <tr key={r.region} className="border-b border-border/30 last:border-b-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{r.region}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {r.totalRBTs}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.availableHours}h</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.neededHours}h</td>
                  <td className={cn("px-4 py-3 font-semibold", r.gap < 0 ? "text-destructive" : "text-success")}>
                    {r.gap > 0 ? "+" : ""}
                    {r.gap}h
                  </td>
                  <td className="px-4 py-3 min-w-[180px]">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          r.gap < 0 ? "bg-destructive" : usagePct > 80 ? "bg-warning" : "bg-success",
                        )}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
