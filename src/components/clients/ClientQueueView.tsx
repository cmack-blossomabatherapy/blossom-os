import { Client, stageVariant } from "@/data/clients";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AlertTriangle, Hourglass, ArrowRightCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { canonicalPipelineStage } from "@/data/pipeline";

interface Props {
  clients: Client[];
  onSelect: (c: Client) => void;
}

export function ClientQueueView({ clients, onSelect }: Props) {
  const sections = [
    {
      title: "Needs Immediate Action",
      icon: AlertTriangle,
      tone: "destructive" as const,
      filter: (c: Client) =>
        !c.bcba ||
        c.blockers.length > 0 ||
        c.qaStatus === "In Review" ||
        (canonicalPipelineStage(c.stage) === "Initial Auth – Awaiting Submission" && c.authStatus === "Not Submitted") ||
        canonicalPipelineStage(c.stage) === "Waiting on Consent" ||
        (canonicalPipelineStage(c.stage) === "Schedule Assessment" && c.daysInStage >= 3),
    },
    {
      title: "Bottlenecks",
      icon: Hourglass,
      tone: "warning" as const,
      filter: (c: Client) =>
        canonicalPipelineStage(c.stage).startsWith("Treatment Auth") ||
        c.authorizations.some((auth) => auth.qaStatus === "In Review" || auth.status === "Submitted") ||
        ["Staffing Needed", "Matching in Progress", "Restaffing Needed", "QA Review", "QA Issues / Fix Required"].includes(canonicalPipelineStage(c.stage)),
    },
    {
      title: "Ready to Move",
      icon: ArrowRightCircle,
      tone: "success" as const,
      filter: (c: Client) =>
        c.stage === "Pending Start Date" ||
        canonicalPipelineStage(c.stage) === "QA Approved",
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const items = clients.filter(section.filter);
        const Icon = section.icon;
        const toneColor =
          section.tone === "destructive" ? "text-destructive bg-destructive/10" :
          section.tone === "warning" ? "text-warning bg-warning/10" :
          "text-success bg-success/10";
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
                {items.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelect(c)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/20 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{c.childName}</p>
                        <StatusBadge status={canonicalPipelineStage(c.stage)} variant={stageVariant(c.stage)} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {c.bcba || "No BCBA"} {c.rbt && `· ${c.rbt}`} · {c.state} · {c.authorizations.length} auth · {c.schedule.length} schedule · {c.nextAction}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{c.daysInStage}d in stage</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
