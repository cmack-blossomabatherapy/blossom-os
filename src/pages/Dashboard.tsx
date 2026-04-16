import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Users, FileText, ShieldCheck, Calendar, UserPlus, ClipboardCheck,
  AlertTriangle, Clock, TrendingUp, Activity
} from "lucide-react";

const kpis = [
  { label: "New Leads Today", value: 8, change: "+3 vs yesterday", trend: "up" as const },
  { label: "Awaiting Contact", value: 14, change: "5 overdue", trend: "down" as const },
  { label: "Forms Outstanding", value: 22 },
  { label: "VOB Pending", value: 9 },
  { label: "Pending Initial Auth", value: 11 },
  { label: "Assessments to Schedule", value: 6 },
  { label: "Pending Treatment Auth", value: 7 },
  { label: "Staffing Needed", value: 13, change: "+4 this week", trend: "down" as const },
  { label: "Pending Start Dates", value: 5 },
  { label: "Active Clients", value: 142, change: "+8 this month", trend: "up" as const },
  { label: "Expiring Auths", value: 18, change: "3 this week", trend: "down" as const },
  { label: "QA Backlog", value: 9 },
];

const exceptions = [
  { label: "Can't Reach", count: 7, variant: "warning" as const },
  { label: "Missing Info", count: 12, variant: "destructive" as const },
  { label: "Can't Submit Auth", count: 3, variant: "destructive" as const },
  { label: "Denials", count: 2, variant: "destructive" as const },
  { label: "Services on Pause", count: 4, variant: "warning" as const },
  { label: "Flaked Clients", count: 6, variant: "muted" as const },
];

const teamLoad = [
  { name: "Sarah M.", role: "Intake", active: 18, overdue: 2 },
  { name: "James R.", role: "Intake", active: 15, overdue: 0 },
  { name: "Priya K.", role: "Auth", active: 22, overdue: 4 },
  { name: "Marcus T.", role: "Auth", active: 19, overdue: 1 },
  { name: "Lisa W.", role: "QA", active: 9, overdue: 3 },
  { name: "David C.", role: "Scheduling", active: 14, overdue: 0 },
];

const pipelineStages = [
  { stage: "New Lead", count: 14, color: "bg-info" },
  { stage: "In Contact", count: 22, color: "bg-primary" },
  { stage: "Form Received", count: 18, color: "bg-accent" },
  { stage: "VOB Complete", count: 12, color: "bg-success" },
  { stage: "Auth Pending", count: 11, color: "bg-warning" },
  { stage: "Assessment", count: 6, color: "bg-primary" },
  { stage: "Staffing", count: 13, color: "bg-destructive" },
  { stage: "Active", count: 142, color: "bg-success" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Overview */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Pipeline Overview</h3>
          </div>
          <div className="space-y-3">
            {pipelineStages.map((stage) => (
              <div key={stage.stage} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24 shrink-0">{stage.stage}</span>
                <div className="flex-1 h-6 bg-muted/50 rounded-md overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-md transition-all flex items-center pl-2`}
                    style={{ width: `${Math.min((stage.count / 142) * 100, 100)}%`, minWidth: '2rem' }}
                  >
                    <span className="text-[10px] font-semibold text-primary-foreground">{stage.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exception Center */}
        <div className="bg-card rounded-xl border border-border/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-semibold text-foreground">Exception Center</h3>
          </div>
          <div className="space-y-2.5">
            {exceptions.map((exc) => (
              <div key={exc.label} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <StatusBadge status={exc.label} variant={exc.variant} />
                </div>
                <span className="text-sm font-semibold text-foreground">{exc.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Load */}
      <div className="bg-card rounded-xl border border-border/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Team Workload</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {teamLoad.map((member) => (
            <div key={member.name} className="rounded-lg bg-secondary/40 p-3 space-y-1">
              <p className="text-sm font-medium text-foreground">{member.name}</p>
              <p className="text-[11px] text-muted-foreground">{member.role}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-lg font-semibold text-foreground">{member.active}</span>
                {member.overdue > 0 && (
                  <StatusBadge status={`${member.overdue} overdue`} variant="destructive" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
