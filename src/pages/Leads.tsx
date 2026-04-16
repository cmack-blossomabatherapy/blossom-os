import { PageShell } from "@/components/shared/PageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Users, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const stages = [
  { name: "New Lead", count: 14, variant: "info" as const },
  { name: "In Contact", count: 22, variant: "default" as const },
  { name: "Sent Form", count: 8, variant: "default" as const },
  { name: "Missing Info", count: 5, variant: "warning" as const },
  { name: "Form Received", count: 18, variant: "success" as const },
  { name: "Sent to VOB", count: 6, variant: "default" as const },
  { name: "VOB Completed", count: 12, variant: "success" as const },
  { name: "Can't Reach", count: 7, variant: "destructive" as const },
];

const leads = [
  { id: "L-1042", child: "Emma Thompson", parent: "Jennifer Thompson", state: "GA", status: "New Lead", source: "Website", owner: "Sarah M.", age: "3y 2m", daysInStage: 0 },
  { id: "L-1041", child: "Aiden Patel", parent: "Ravi Patel", state: "TX", status: "In Contact", source: "Referral", owner: "James R.", age: "4y 8m", daysInStage: 2 },
  { id: "L-1040", child: "Sofia Garcia", parent: "Maria Garcia", state: "GA", status: "Form Received", source: "Insurance", owner: "Sarah M.", age: "2y 11m", daysInStage: 1 },
  { id: "L-1039", child: "Liam Chen", parent: "Wei Chen", state: "AZ", status: "Sent to VOB", source: "Website", owner: "James R.", age: "5y 1m", daysInStage: 3 },
  { id: "L-1038", child: "Olivia Brown", parent: "Mark Brown", state: "GA", status: "Missing Info", source: "Referral", owner: "Sarah M.", age: "3y 7m", daysInStage: 5 },
  { id: "L-1037", child: "Noah Williams", parent: "Keisha Williams", state: "TX", status: "VOB Completed", source: "Website", owner: "James R.", age: "4y 0m", daysInStage: 1 },
  { id: "L-1036", child: "Ava Martinez", parent: "Carlos Martinez", state: "AZ", status: "Can't Reach", source: "Insurance", owner: "Sarah M.", age: "3y 4m", daysInStage: 8 },
  { id: "L-1035", child: "Ethan Davis", parent: "Lauren Davis", state: "GA", status: "New Lead", source: "Website", owner: "James R.", age: "2y 6m", daysInStage: 0 },
];

const statusVariant = (status: string) => {
  const map: Record<string, "default" | "success" | "warning" | "destructive" | "info" | "muted"> = {
    "New Lead": "info", "In Contact": "default", "Sent Form": "default",
    "Missing Info": "warning", "Form Received": "success", "Sent to VOB": "default",
    "VOB Completed": "success", "Can't Reach": "destructive",
  };
  return map[status] || "muted";
};

export default function Leads() {
  return (
    <PageShell
      title="Leads"
      description="Manage incoming leads through the intake pipeline"
      icon={Users}
      actions={
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New Lead
        </Button>
      }
    >
      {/* Stage pills */}
      <div className="flex flex-wrap gap-2">
        {stages.map((s) => (
          <button key={s.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border/60 hover:border-primary/30 transition-colors">
            <StatusBadge status={s.name} variant={s.variant} />
            <span className="text-sm font-semibold text-foreground">{s.count}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-8 h-8 text-sm" />
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Filter className="h-3 w-3" /> Filters
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">ID</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Child</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Parent</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">State</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Source</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Owner</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Days</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{lead.id}</td>
                <td className="px-4 py-2.5 font-medium text-foreground">{lead.child}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{lead.parent}</td>
                <td className="px-4 py-2.5"><StatusBadge status={lead.state} variant="muted" /></td>
                <td className="px-4 py-2.5"><StatusBadge status={lead.status} variant={statusVariant(lead.status)} /></td>
                <td className="px-4 py-2.5 text-muted-foreground">{lead.source}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{lead.owner}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{lead.daysInStage}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
