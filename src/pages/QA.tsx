import { PageShell } from "@/components/shared/PageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ClipboardCheck } from "lucide-react";

const items = [
  { client: "Olivia Brown", auth: "A-2197", status: "In Review", reviewer: "Lisa W.", received: "2026-04-10", daysInQueue: 6 },
  { client: "Liam Chen", auth: "A-2198", status: "Awaiting Plan", reviewer: "Lisa W.", received: "—", daysInQueue: 8 },
  { client: "Emma Thompson", auth: "A-2201", status: "Ready to Submit", reviewer: "Lisa W.", received: "2026-04-05", daysInQueue: 2 },
  { client: "Aiden Patel", auth: "A-2200", status: "Returned", reviewer: "Lisa W.", received: "2026-04-08", daysInQueue: 4 },
];

const sv = (s: string) => ({ "In Review": "info" as const, "Awaiting Plan": "warning" as const, "Ready to Submit": "success" as const, "Returned": "destructive" as const }[s] || "muted" as const);

export default function QA() {
  return (
    <PageShell title="QA Reviews" description="Treatment plan review and submission readiness" icon={ClipboardCheck}>
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30">
            {["Client","Auth","Status","Reviewer","Received","Days in Queue"].map(h =>
              <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">{h}</th>
            )}
          </tr></thead>
          <tbody>{items.map((r, i) => (
            <tr key={i} className="border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors">
              <td className="px-4 py-2.5 font-medium text-foreground">{r.client}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.auth}</td>
              <td className="px-4 py-2.5"><StatusBadge status={r.status} variant={sv(r.status)} /></td>
              <td className="px-4 py-2.5 text-muted-foreground">{r.reviewer}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{r.received}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{r.daysInQueue}d</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </PageShell>
  );
}
