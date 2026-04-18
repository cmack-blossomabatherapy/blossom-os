import { useState } from "react";
import { Lead, LeadStatus, pipelineStages, statusVariant } from "@/data/leads";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { useLeads } from "@/contexts/LeadsContext";
import { toast } from "sonner";

interface LeadPipelineViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export function LeadPipelineView({ leads, onSelectLead }: LeadPipelineViewProps) {
  const { moveStage, revertStage } = useLeads();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);

  const stageLeads = pipelineStages.map((stage) => ({
    ...stage,
    leads: leads.filter((l) => l.status === stage.name),
  }));

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggingId(lead.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", lead.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stage) setDragOverStage(stage);
  };

  const handleDragLeave = (e: React.DragEvent, stage: LeadStatus) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverStage === stage) setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, stage: LeadStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    setDragOverStage(null);
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === stage) return;

    // Snapshot for Undo
    const previousStatus = lead.status;
    const previousDaysInStage = lead.daysInStage;
    const automationLogEntry = `Stage moved to ${stage} (manual)`;

    // Optimistic update via context (synchronous setState)
    moveStage([id], stage);
    toast.success(`${lead.childName} moved to ${stage}`, {
      description: `From ${previousStatus}`,
      action: {
        label: "Undo",
        onClick: () => {
          revertStage(id, previousStatus, previousDaysInStage, automationLogEntry);
          toast.success(`Reverted ${lead.childName} to ${previousStatus}`);
        },
      },
    });
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {stageLeads.map((stage) => {
        const isDropTarget = dragOverStage === stage.name;
        return (
          <div
            key={stage.name}
            className="min-w-[220px] max-w-[220px] flex flex-col"
            onDragOver={(e) => handleDragOver(e, stage.name)}
            onDragLeave={(e) => handleDragLeave(e, stage.name)}
            onDrop={(e) => handleDrop(e, stage.name)}
          >
            {/* Column header */}
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2 bg-card rounded-t-xl border border-border/60 border-b-0 transition-colors",
                isDropTarget && "border-primary bg-primary/5",
              )}
            >
              <StatusBadge status={stage.name} variant={statusVariant(stage.name)} />
              <span className="text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded-full">
                {stage.leads.length}
              </span>
            </div>

            {/* Cards */}
            <div
              className={cn(
                "flex-1 bg-muted/30 rounded-b-xl border border-border/60 border-t-0 p-2 space-y-2 min-h-[200px] transition-all",
                isDropTarget && "bg-primary/5 border-primary ring-2 ring-primary/20",
              )}
            >
              {stage.leads.length === 0 && (
                <p className={cn(
                  "text-xs text-center py-8 transition-colors",
                  isDropTarget ? "text-primary font-medium" : "text-muted-foreground",
                )}>
                  {isDropTarget ? "Drop to move here" : "No leads"}
                </p>
              )}
              {stage.leads.map((lead) => {
                const agingColor = lead.daysInStage >= 5 ? "border-l-destructive" : lead.daysInStage >= 3 ? "border-l-warning" : "border-l-primary/30";
                const isDragging = draggingId === lead.id;
                return (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onSelectLead(lead)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") onSelectLead(lead); }}
                    className={cn(
                      "w-full text-left bg-card rounded-lg border border-border/60 p-3 hover:shadow-md transition-all border-l-[3px] cursor-grab active:cursor-grabbing",
                      agingColor,
                      isDragging && "opacity-40 scale-95 rotate-1",
                    )}
                  >
                    <p className="text-sm font-medium text-foreground truncate">{lead.childName}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.parentName}</p>
                    <div className="flex items-center justify-between mt-2">
                      <StatusBadge status={lead.state} variant="muted" />
                      <span className="text-[10px] text-muted-foreground">{lead.daysInStage}d</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 truncate">{lead.nextAction}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
