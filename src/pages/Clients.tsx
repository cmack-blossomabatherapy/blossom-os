import { PageShell } from "@/components/shared/PageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserCheck, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const stages = [
  { name: "BCBA Assignment", count: 4, variant: "info" as const },
  { name: "Pending Initial Auth", count: 11, variant: "warning" as const },
  { name: "Schedule Assessment", count: 6, variant: "default" as const },
  { name: "In QA", count: 9, variant: "default" as const },
  { name: "Pending Treatment Auth", count: 7, variant: "warning" as const },
  { name: "Staffing Needed", count: 13, variant: "destructive" as const },
  { name: "Active", count: 142, variant: "success" as const },
  { name: "Services on Pause", count: 4, variant: "muted" as const },
];

const clients = [
  { id: "C-0421", name: "Emma Thompson", state: "GA", clinic: "Peachtree Corners", status: "Active", bcba: "Dr. Kim", rbt: "Taylor S.", authExpiry: "2026-06-15" },
  { id: "C-0420", name: "Aiden Patel", state: "TX", clinic: "Remote", status: "Staffing Needed", bcba: "Dr. Lee", rbt: "—", authExpiry: "2026-05-22" },
  { id: "C-0419", name: "Sofia Garcia", state: "GA", clinic: "Riverdale", status: "Active", bcba: "Dr. Kim", rbt: "Jordan M.", authExpiry: "2026-08-01" },
  { id: "C-0418", name: "Liam Chen", state: "AZ", clinic: "Remote", status: "In QA", bcba: "Dr. Patel", rbt: "—", authExpiry: "—" },
  { id: "C-0417", name: "Olivia Brown", state: "GA", clinic: "Peachtree Corners", status: "Pending Treatment Auth", bcba: "Dr. Lee", rbt: "Casey R.", authExpiry: "—" },
  { id: "C-0416", name: "Noah Williams", state: "TX", clinic: "Remote", status: "Schedule Assessment", bcba: "Dr. Kim", rbt: "—", authExpiry: "—" },
];

const statusVariant = (s: string) => {
  const m: Record<string, "default" | "success" | "warning" | "destructive" | "info" | "muted"> = {
    "Active": "success", "Staffing Needed": "destructive", "In QA": "default",
    "Pending Treatment Auth": "warning", "Schedule Assessment": "info",
    "BCBA Assignment": "info", "Pending Initial Auth": "warning", "Services on Pause": "muted",
  };
  return m[s] || "muted";
};

export default function Clients() {
  return (
    <PageShell title="Clients" description="Track clients through the full service lifecycle" icon={UserCheck}
      actions={<Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New Client</Button>}>
      <div className="flex flex-wrap gap-2">
        {stages.map((s) => (
          <button key={s.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border/60 hover:border-primary/30 transition-colors">
            <StatusBadge status={s.name} variant={s.variant} />
            <span className="text-sm font-semibold text-foreground">{s.count}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search clients..." className="pl-8 h-8 text-sm" />
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"><Filter className="h-3 w-3" /> Filters</Button>
      </div>
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30">
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">ID</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Client</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">State</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Clinic</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">BCBA</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">RBT</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Auth Expiry</th>
          </tr></thead>
          <tbody>{clients.map((c) => (
            <tr key={c.id} className="border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors">
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{c.id}</td>
              <td className="px-4 py-2.5 font-medium text-foreground">{c.name}</td>
              <td className="px-4 py-2.5"><StatusBadge status={c.state} variant="muted" /></td>
              <td className="px-4 py-2.5 text-muted-foreground">{c.clinic}</td>
              <td className="px-4 py-2.5"><StatusBadge status={c.status} variant={statusVariant(c.status)} /></td>
              <td className="px-4 py-2.5 text-muted-foreground">{c.bcba}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{c.rbt}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{c.authExpiry}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </PageShell>
  );
}
