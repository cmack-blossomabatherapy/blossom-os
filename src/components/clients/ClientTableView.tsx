import { Client, stageVariant, authVariant, staffingVariant, qaVariant, getClientAlert } from "@/data/clients";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  clients: Client[];
  onSelect: (c: Client) => void;
}

export function ClientTableView({ clients, onSelect }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {[
                "Client", "State", "Clinic", "BCBA", "RBT", "Stage",
                "Auth", "Staffing", "QA", "Days in Stage", "Start Date", "Next Action",
              ].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const alert = getClientAlert(c);
              return (
                <tr
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-foreground">{c.childName}</p>
                        <p className="text-xs text-muted-foreground">{c.parentName} · {c.id}</p>
                      </div>
                      {alert && (
                        <span className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                          alert.type === "red" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                        )}>
                          <AlertCircle className="h-2.5 w-2.5" />
                          {alert.message}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge status={c.state} variant="muted" /></td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{c.clinic}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {c.bcba ? <span className="text-foreground">{c.bcba}</span> : <span className="text-destructive text-xs font-medium">Unassigned</span>}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {c.rbt ? <span className="text-foreground">{c.rbt}</span> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap"><StatusBadge status={c.stage} variant={stageVariant(c.stage)} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={c.authStatus} variant={authVariant(c.authStatus)} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={c.staffingStatus} variant={staffingVariant(c.staffingStatus)} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={c.qaStatus} variant={qaVariant(c.qaStatus)} /></td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                    <span className={cn(c.daysInStage >= 7 ? "text-destructive font-semibold" : c.daysInStage >= 4 ? "text-warning font-medium" : "")}>
                      {c.daysInStage}d
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{c.startDate || "—"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs max-w-[200px] truncate">{c.nextAction}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {clients.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No clients match your filters</p>
      )}
    </div>
  );
}
