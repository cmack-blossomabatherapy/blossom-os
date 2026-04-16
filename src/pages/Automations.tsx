import { PageShell } from "@/components/shared/PageShell";
import { Zap } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";

const automations = [
  { name: "Auto-assign new leads by state", trigger: "New Lead Created", status: "Active", lastRun: "2 min ago", runs: 342 },
  { name: "Send follow-up after 48h no contact", trigger: "Timer: 48h", status: "Active", lastRun: "1h ago", runs: 189 },
  { name: "Alert on auth expiring <30 days", trigger: "Daily Check", status: "Active", lastRun: "6h ago", runs: 56 },
  { name: "Notify QA when treatment plan uploaded", trigger: "Document Upload", status: "Active", lastRun: "3h ago", runs: 124 },
  { name: "Escalate can't-reach after 5 attempts", trigger: "Call Status", status: "Paused", lastRun: "2d ago", runs: 31 },
];

export default function Automations() {
  return (
    <PageShell title="Automations" description="Workflow automation control center" icon={Zap}>
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30">
            {["Automation","Trigger","Status","Last Run","Total Runs"].map(h =>
              <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">{h}</th>
            )}
          </tr></thead>
          <tbody>{automations.map((a, i) => (
            <tr key={i} className="border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors">
              <td className="px-4 py-2.5 font-medium text-foreground">{a.name}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{a.trigger}</td>
              <td className="px-4 py-2.5"><StatusBadge status={a.status} variant={a.status === "Active" ? "success" : "muted"} /></td>
              <td className="px-4 py-2.5 text-muted-foreground">{a.lastRun}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{a.runs}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </PageShell>
  );
}
