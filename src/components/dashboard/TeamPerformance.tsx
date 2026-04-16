import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  name: string;
  role: string;
  metric1: { label: string; value: string | number };
  metric2: { label: string; value: string | number };
  metric3?: { label: string; value: string | number };
  status: "good" | "warning" | "critical";
}

const teamData: TeamMember[] = [
  { name: "Sarah M.", role: "Intake", metric1: { label: "Leads Handled", value: 24 }, metric2: { label: "Avg Contact Speed", value: "1.2h" }, metric3: { label: "Conversion", value: "68%" }, status: "good" },
  { name: "James R.", role: "Intake", metric1: { label: "Leads Handled", value: 18 }, metric2: { label: "Avg Contact Speed", value: "3.8h" }, metric3: { label: "Conversion", value: "52%" }, status: "warning" },
  { name: "Priya K.", role: "Auth", metric1: { label: "VOB Turnaround", value: "1.4d" }, metric2: { label: "Auth Speed", value: "2.1d" }, metric3: { label: "Approval Rate", value: "91%" }, status: "good" },
  { name: "Marcus T.", role: "Auth", metric1: { label: "VOB Turnaround", value: "2.8d" }, metric2: { label: "Auth Speed", value: "3.5d" }, metric3: { label: "Approval Rate", value: "84%" }, status: "warning" },
  { name: "Lisa W.", role: "QA", metric1: { label: "Turnaround", value: "1.6d" }, metric2: { label: "Completed/Day", value: 4.2 }, status: "good" },
  { name: "David C.", role: "Scheduling", metric1: { label: "Time to Schedule", value: "2.3d" }, metric2: { label: "Time to Start", value: "6.1d" }, status: "warning" },
];

const statusStyles = {
  good: "border-l-success",
  warning: "border-l-warning",
  critical: "border-l-destructive",
};

export function TeamPerformance() {
  return (
    <div className="bg-card rounded-xl border border-border/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Team Performance</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {teamData.map((member) => (
          <div
            key={member.name}
            className={cn(
              "rounded-lg bg-secondary/40 p-3 space-y-2 border-l-2 cursor-pointer hover:bg-secondary/60 transition-colors",
              statusStyles[member.status],
            )}
          >
            <div>
              <p className="text-sm font-medium text-foreground">{member.name}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{member.role}</p>
            </div>
            <div className="space-y-1">
              {[member.metric1, member.metric2, member.metric3].filter(Boolean).map((m) => (
                <div key={m!.label} className="flex justify-between items-baseline">
                  <span className="text-[10px] text-muted-foreground">{m!.label}</span>
                  <span className="text-[11px] font-semibold text-foreground">{m!.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
