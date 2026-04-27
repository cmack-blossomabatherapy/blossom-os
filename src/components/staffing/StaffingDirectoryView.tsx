import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { mockRBTProfiles, getRBTUtilization, statusVariant } from "@/data/staffing";

interface Props {
  searchQuery: string;
  activeView: string;
}

export function StaffingDirectoryView({ searchQuery, activeView }: Props) {
  const navigate = useNavigate();
  const filtered = mockRBTProfiles.filter((r) => {
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeView === "available-rbts" && r.assignedHours >= r.capacityHours) return false;
    if (activeView === "overloaded" && getRBTUtilization(r) < 90) return false;
    return true;
  });

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {["RBT Name", "Status", "Location", "Travel", "Clients", "Hours / Capacity", "Workload", "Availability", "Tags"].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => {
            const util = getRBTUtilization(r);
            return (
              <tr
                key={r.id}
                onClick={() => navigate(`/staffing/${r.id}`)}
                className="border-b border-border/40 last:border-b-0 hover:bg-muted/20 cursor-pointer transition-colors"
              >
                <td className="px-4 py-2.5 font-medium text-foreground">{r.name}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={r.status} variant={statusVariant(r.status)} />
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {r.region} · {r.zip}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.travelRadius} mi</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.assignedClientIds.length}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {r.assignedHours}h / {r.capacityHours}h
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          util >= 95 ? "bg-destructive" : util >= 75 ? "bg-warning" : "bg-success",
                        )}
                        style={{ width: `${Math.min(util, 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums w-9 text-right">
                      {Math.round(util)}%
                    </span>
                  </div>
                  <p className={cn("mt-1 text-[10px] font-medium", util >= 95 ? "text-destructive" : util >= 75 ? "text-warning" : "text-success")}>{util >= 95 ? "Overloaded" : util >= 75 ? "Near capacity" : "Available"}</p>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    {r.availability.map((a) => (
                      <span key={a} className="text-[10px] uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        {a}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    {r.performanceTags.map((t) => (
                      <span key={t} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                No staff match the current filters
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
