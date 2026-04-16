import { Lead, pipelineStages, statusVariant } from "@/data/leads";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

interface LeadPipelineViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export function LeadPipelineView({ leads, onSelectLead }: LeadPipelineViewProps) {
  const stageLeads = pipelineStages.map((stage) => ({
    ...stage,
    leads: leads.filter((l) => l.status === stage.name),
  }));

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {stageLeads.map((stage) => (
        <div key={stage.name} className="min-w-[220px] max-w-[220px] flex flex-col">
          {/* Column header */}
          <div className="flex items-center justify-between px-3 py-2 bg-card rounded-t-xl border border-border/60 border-b-0">
            <StatusBadge status={stage.name} variant={statusVariant(stage.name)} />
            <span className="text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded-full">
              {stage.leads.length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex-1 bg-muted/30 rounded-b-xl border border-border/60 border-t-0 p-2 space-y-2 min-h-[200px]">
            {stage.leads.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No leads</p>
            )}
            {stage.leads.map((lead) => {
              const agingColor = lead.daysInStage >= 5 ? "border-l-destructive" : lead.daysInStage >= 3 ? "border-l-warning" : "border-l-primary/30";
              return (
                <button
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className={cn(
                    "w-full text-left bg-card rounded-lg border border-border/60 p-3 hover:shadow-md transition-shadow border-l-[3px]",
                    agingColor
                  )}
                >
                  <p className="text-sm font-medium text-foreground truncate">{lead.childName}</p>
                  <p className="text-xs text-muted-foreground truncate">{lead.parentName}</p>
                  <div className="flex items-center justify-between mt-2">
                    <StatusBadge status={lead.state} variant="muted" />
                    <span className="text-[10px] text-muted-foreground">{lead.daysInStage}d</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 truncate">{lead.nextAction}</p>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
