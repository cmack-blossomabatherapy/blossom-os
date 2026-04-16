import { Authorization, stageVariant, daysUntil } from "@/data/authorizations";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AlertTriangle, DollarSign, CalendarClock, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  auths: Authorization[];
  onSelect: (a: Authorization) => void;
}

export function AuthQueueView({ auths, onSelect }: Props) {
  const sections = [
    {
      title: "Needs Immediate Action",
      icon: AlertTriangle,
      tone: "destructive" as const,
      filter: (a: Authorization) =>
        a.stage === "Awaiting Submission" ||
        a.missingInfo ||
        (a.stage === "In QA Review" && a.qaStatus === "Complete"),
    },
    {
      title: "Revenue Blockers",
      icon: DollarSign,
      tone: "destructive" as const,
      filter: (a: Authorization) =>
        a.stage === "Denied" ||
        (a.stage === "Awaiting Submission" && !a.treatmentPlanReceived) ||
        a.missingInfo,
    },
    {
      title: "Expiring Soon",
      icon: CalendarClock,
      tone: "warning" as const,
      filter: (a: Authorization) => {
        const d = daysUntil(a.expirationDate);
        return d !== null && d <= 90 && d >= 0;
      },
    },
    {
      title: "QA Queue",
      icon: ClipboardCheck,
      tone: "default" as const,
      filter: (a: Authorization) => a.stage === "In QA Review" || (a.treatmentPlanReceived && a.qaStatus === "Not Started"),
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const items = section.filter ? auths.filter(section.filter) : [];
        const Icon = section.icon;
        const toneColor =
          section.tone === "destructive" ? "text-destructive bg-destructive/10" :
          section.tone === "warning" ? "text-warning bg-warning/10" :
          "text-primary bg-primary/10";
        return (
          <div key={section.title} className="bg-card rounded-xl border border-border/60 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-2">
                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", toneColor)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
            </div>
            {items.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">Nothing here — nice work</p>
            ) : (
              <div className="divide-y divide-border/40">
                {items.map((a) => {
                  const days = daysUntil(a.expirationDate);
                  return (
                    <button
                      key={a.id}
                      onClick={() => onSelect(a)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/20 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{a.clientName}</p>
                          <StatusBadge status={a.stage} variant={stageVariant(a.stage)} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {a.payor} · {a.authType} · {a.coordinator} · {a.nextAction}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {days !== null ? `${days}d to expire` : `${a.daysInStage}d in stage`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
