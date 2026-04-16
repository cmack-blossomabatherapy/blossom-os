import { AlertTriangle, Clock, FileText, ShieldCheck, Users, Calendar, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionItem {
  label: string;
  count: number;
  severity: "critical" | "warning" | "info";
}

interface ActionGroup {
  title: string;
  icon: React.ReactNode;
  items: ActionItem[];
}

const actionGroups: ActionGroup[] = [
  {
    title: "Intake",
    icon: <Users className="h-4 w-4 text-primary" />,
    items: [
      { label: "New leads not contacted", count: 6, severity: "critical" },
      { label: "Stuck in Sent Form > 3 days", count: 14, severity: "warning" },
      { label: "Missing information", count: 12, severity: "warning" },
    ],
  },
  {
    title: "Authorizations",
    icon: <ShieldCheck className="h-4 w-4 text-primary" />,
    items: [
      { label: "VOB not sent", count: 8, severity: "critical" },
      { label: "VOB pending > 5 days", count: 5, severity: "warning" },
      { label: "Auths awaiting submission", count: 11, severity: "critical" },
    ],
  },
  {
    title: "Clients",
    icon: <FileText className="h-4 w-4 text-primary" />,
    items: [
      { label: "Stuck in BCBA Assignment", count: 4, severity: "warning" },
      { label: "Pending Initial Auth", count: 11, severity: "warning" },
      { label: "Pending Treatment Auth", count: 7, severity: "critical" },
      { label: "Staffing Needed", count: 13, severity: "critical" },
      { label: "Pending Start Date", count: 5, severity: "info" },
    ],
  },
  {
    title: "Scheduling",
    icon: <Calendar className="h-4 w-4 text-primary" />,
    items: [
      { label: "Assessments not scheduled", count: 6, severity: "warning" },
      { label: "Assessments today", count: 3, severity: "info" },
    ],
  },
  {
    title: "QA",
    icon: <ClipboardCheck className="h-4 w-4 text-primary" />,
    items: [
      { label: "QA backlog", count: 9, severity: "warning" },
      { label: "QA overdue", count: 4, severity: "critical" },
    ],
  },
];

const severityStyles = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  info: "bg-info/10 text-info border-info/20",
};

const severityDot = {
  critical: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
};

export function ActionCenter() {
  const totalActions = actionGroups.reduce((sum, g) => sum + g.items.reduce((s, i) => s + i.count, 0), 0);

  return (
    <div className="bg-card rounded-xl border border-border/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">Today's Action Center</h3>
        </div>
        <span className="text-xs font-semibold bg-destructive/10 text-destructive px-2 py-0.5 rounded-md">
          {totalActions} items need attention
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {actionGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <div className="flex items-center gap-1.5 pb-1 border-b border-border/40">
              {group.icon}
              <span className="text-xs font-semibold text-foreground">{group.title}</span>
            </div>
            <div className="space-y-1.5">
              {group.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", severityDot[item.severity])} />
                    <span className="text-[11px] text-muted-foreground group-hover:text-foreground truncate">
                      {item.label}
                    </span>
                  </div>
                  <span className={cn(
                    "text-[11px] font-bold shrink-0 ml-2 px-1.5 py-0.5 rounded",
                    severityStyles[item.severity],
                  )}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
