import { PageShell } from "@/components/shared/PageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CheckSquare } from "lucide-react";

const tasks = [
  { title: "Follow up with Jennifer Thompson", type: "Intake", owner: "Sarah M.", due: "Today", linked: "L-1042", status: "Overdue" },
  { title: "Submit initial auth for Aiden Patel", type: "Auth", owner: "Marcus T.", due: "Today", linked: "A-2200", status: "Due" },
  { title: "Schedule assessment for Noah Williams", type: "Scheduling", owner: "David C.", due: "Tomorrow", linked: "C-0416", status: "Upcoming" },
  { title: "Complete QA review for Olivia Brown", type: "QA", owner: "Lisa W.", due: "Apr 18", linked: "A-2197", status: "In Progress" },
  { title: "Request missing insurance card from Wei Chen", type: "Intake", owner: "James R.", due: "Apr 19", linked: "L-1039", status: "Upcoming" },
  { title: "Confirm RBT pairing for Emma Thompson", type: "Staffing", owner: "David C.", due: "Apr 20", linked: "C-0421", status: "Upcoming" },
];

const sv = (s: string) => ({ "Overdue": "destructive" as const, "Due": "warning" as const, "In Progress": "info" as const, "Upcoming": "muted" as const }[s] || "muted" as const);

export default function Tasks() {
  return (
    <PageShell title="Tasks" description="Track and manage operational tasks across all workflows" icon={CheckSquare}>
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30">
            {["Task","Type","Owner","Due","Linked","Status"].map(h =>
              <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">{h}</th>
            )}
          </tr></thead>
          <tbody>{tasks.map((t, i) => (
            <tr key={i} className="border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors">
              <td className="px-4 py-2.5 font-medium text-foreground">{t.title}</td>
              <td className="px-4 py-2.5"><StatusBadge status={t.type} variant="muted" /></td>
              <td className="px-4 py-2.5 text-muted-foreground">{t.owner}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{t.due}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{t.linked}</td>
              <td className="px-4 py-2.5"><StatusBadge status={t.status} variant={sv(t.status)} /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </PageShell>
  );
}
