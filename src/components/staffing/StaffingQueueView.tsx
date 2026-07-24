import { AlertCircle, Clock, CheckCircle2, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getClientStaffingNeeds, type StaffingClientNeed } from "@/data/staffing";
import { useClients } from "@/contexts/ClientsContext";
import { toast } from "sonner";

const sections: {
  id: StaffingClientNeed["reason"];
  title: string;
  icon: typeof AlertCircle;
  iconClass: string;
  description: string;
}[] = [
  {
    id: "Staffing Needed",
    title: "Staffing Needed",
    icon: AlertCircle,
    iconClass: "text-destructive",
    description: "Auth approved · No RBT assigned",
  },
  {
    id: "Restaffing Needed",
    title: "Restaffing Needed",
    icon: Clock,
    iconClass: "text-warning",
    description: "Lost RBT · Needs replacement",
  },
  {
    id: "Matching",
    title: "Matching",
    icon: Sparkles,
    iconClass: "text-warning",
    description: "Staffing team is comparing RBT options",
  },
  {
    id: "RBT Assigned",
    title: "RBT Assigned",
    icon: CheckCircle2,
    iconClass: "text-success",
    description: "Ready for scheduling handoff",
  },
];

interface Props {
  searchQuery: string;
  onStartMatching?: () => void;
}

export function StaffingQueueView({ searchQuery, onStartMatching }: Props) {
  const navigate = useNavigate();
  const { clients, assignRbt } = useClients();
  const all = getClientStaffingNeeds(clients);
  const filtered = all.filter((n) =>
    !searchQuery ||
    n.client.childName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.client.bcba?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false),
  );

  return (
    <div className="space-y-4">
      {sections.map((s) => {
        const items = filtered.filter((n) => n.reason === s.id);
        return (
          <div key={s.id} className="bg-card rounded-xl border border-border/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2.5">
                <s.icon className={cn("h-4 w-4", s.iconClass)} />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                  <p className="text-[11px] text-muted-foreground">{s.description}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border/60">
                {items.length}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="px-4 py-6 text-xs text-muted-foreground italic text-center">No clients in this group</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/10">
                    {["Client", "Location", "Required Hours", "Availability", "Assigned RBT", "Priority", "Alerts", "Days Waiting", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((n) => (
                    <tr
                      key={n.client.id}
                      onClick={() => navigate(`/clients/${n.client.id}`)}
                      className="border-b border-border/30 last:border-b-0 hover:bg-muted/20 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2.5 font-medium text-foreground">{n.client.childName}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {n.region} · {n.zip}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{n.requiredHours} hr/wk</td>
                      <td className="px-4 py-2.5 text-muted-foreground capitalize">{n.availability.join(", ")}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{n.client.rbt ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge
                          status={n.priority}
                          variant={n.priority === "High" ? "destructive" : n.priority === "Medium" ? "warning" : "muted"}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        {n.alert ? <StatusBadge status={n.alert} variant={n.alert.includes("No available") || n.alert.includes("urgent") ? "destructive" : "warning"} /> : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className={cn("px-4 py-2.5 font-medium", n.daysWaiting > 5 ? "text-destructive" : "text-muted-foreground")}>
                        {n.daysWaiting}d
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={(event) => { event.stopPropagation(); onStartMatching?.(); }}>
                          Assign <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                        {n.client.rbt && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={async (event) => {
                          event.stopPropagation();
                          try {
                            await assignRbt([n.client.id], n.client.rbt ?? "");
                            toast.success("RBT assignment confirmed");
                          } catch {
                            toast.error("Couldn't confirm assignment — please try again.");
                          }
                        }}>Confirm</Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
