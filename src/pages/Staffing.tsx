import { PageShell } from "@/components/shared/PageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserPlus } from "lucide-react";

const requests = [
  { client: "Aiden Patel", state: "TX", hours: "20hr/wk", urgency: "High", daysOpen: 12, status: "Staffing Needed" },
  { client: "Liam Chen", state: "AZ", hours: "15hr/wk", urgency: "Medium", daysOpen: 5, status: "Staffing Needed" },
  { client: "Olivia Brown", state: "GA", hours: "25hr/wk", urgency: "High", daysOpen: 18, status: "Restaffing" },
  { client: "Marcus J.", state: "TX", hours: "10hr/wk", urgency: "Low", daysOpen: 2, status: "Staffing Needed" },
];

export default function Staffing() {
  return (
    <PageShell title="Staffing" description="Match client demand to RBT supply" icon={UserPlus}>
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30">
            {["Client","State","Hours","Urgency","Days Open","Status"].map(h =>
              <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">{h}</th>
            )}
          </tr></thead>
          <tbody>{requests.map((r, i) => (
            <tr key={i} className="border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors">
              <td className="px-4 py-2.5 font-medium text-foreground">{r.client}</td>
              <td className="px-4 py-2.5"><StatusBadge status={r.state} variant="muted" /></td>
              <td className="px-4 py-2.5 text-muted-foreground">{r.hours}</td>
              <td className="px-4 py-2.5"><StatusBadge status={r.urgency} variant={r.urgency === "High" ? "destructive" : r.urgency === "Medium" ? "warning" : "muted"} /></td>
              <td className="px-4 py-2.5 text-muted-foreground">{r.daysOpen}d</td>
              <td className="px-4 py-2.5"><StatusBadge status={r.status} variant={r.status === "Restaffing" ? "warning" : "info"} /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </PageShell>
  );
}
