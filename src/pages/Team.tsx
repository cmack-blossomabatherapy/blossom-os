import { PageShell } from "@/components/shared/PageShell";
import { UsersRound } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";

const team = [
  { name: "Sarah Mitchell", role: "Intake Coordinator", dept: "Intake", states: "GA, TX", active: 18, email: "sarah.m@blossomaba.com" },
  { name: "James Rodriguez", role: "Intake Coordinator", dept: "Intake", states: "TX, AZ", active: 15, email: "james.r@blossomaba.com" },
  { name: "Priya Kapoor", role: "Auth Coordinator", dept: "Authorizations", states: "GA, TX, AZ", active: 22, email: "priya.k@blossomaba.com" },
  { name: "Marcus Taylor", role: "Auth Coordinator", dept: "Authorizations", states: "GA, TX", active: 19, email: "marcus.t@blossomaba.com" },
  { name: "Lisa Wang", role: "QA Reviewer", dept: "QA", states: "All", active: 9, email: "lisa.w@blossomaba.com" },
  { name: "David Chen", role: "Scheduler", dept: "Scheduling", states: "GA, TX, AZ", active: 14, email: "david.c@blossomaba.com" },
  { name: "Dr. Kim", role: "BCBA", dept: "Clinical", states: "GA, TX", active: 24, email: "dr.kim@blossomaba.com" },
  { name: "Dr. Lee", role: "BCBA", dept: "Clinical", states: "GA, TX", active: 18, email: "dr.lee@blossomaba.com" },
];

export default function Team() {
  return (
    <PageShell title="Team" description="Team directory, roles, and workload" icon={UsersRound}>
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30">
            {["Name","Role","Department","States","Active Cases","Email"].map(h =>
              <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">{h}</th>
            )}
          </tr></thead>
          <tbody>{team.map((t, i) => (
            <tr key={i} className="border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors">
              <td className="px-4 py-2.5 font-medium text-foreground">{t.name}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{t.role}</td>
              <td className="px-4 py-2.5"><StatusBadge status={t.dept} variant="muted" /></td>
              <td className="px-4 py-2.5 text-muted-foreground">{t.states}</td>
              <td className="px-4 py-2.5 font-semibold text-foreground">{t.active}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{t.email}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </PageShell>
  );
}
