import { useState } from "react";
import { Lead, LeadStatus, pipelineStages, statusVariant } from "@/data/leads";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { useLeads } from "@/contexts/LeadsContext";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface LeadPipelineViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export function LeadPipelineView({ leads, onSelectLead }: LeadPipelineViewProps) {
  const { moveStage, revertStage } = useLeads();
  const { ownsLeadStage, hasPerm } = useAuth();
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

    if (!hasPerm("leads.edit")) {
      toast.error("You don't have permission to edit leads");
      return;
    }
    if (!ownsLeadStage(stage)) {
      toast.error(`Your role doesn't own the "${stage}" stage`, {
        description: "Ask an admin or operations manager to make this move.",
      });
      return;
    }

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
    <div className="flex gap-2 pb-4 xl:gap-1.5">
      {stageLeads.map((stage) => {
        const isDropTarget = dragOverStage === stage.name;
        return (
          <div
            key={stage.name}
            className="flex-1 min-w-0 basis-0 flex flex-col"
            onDragOver={(e) => handleDragOver(e, stage.name)}
            onDragLeave={(e) => handleDragLeave(e, stage.name)}
            onDrop={(e) => handleDrop(e, stage.name)}
          >
            {/* Column header */}
            <div
              className={cn(
                "flex items-center justify-between px-2 py-2 bg-card rounded-t-xl border border-border/60 border-b-0 transition-colors gap-1",
                isDropTarget && "border-primary bg-primary/5",
              )}
            >
              <span
                title={stage.name}
                className="text-[10.5px] font-semibold text-foreground truncate"
              >
                {stage.name}
              </span>
              <span className="text-[10px] font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
                {stage.leads.length}
              </span>
            </div>

            {/* Cards */}
            <div
              className={cn(
                "flex-1 bg-muted/30 rounded-b-xl border border-border/60 border-t-0 p-1.5 space-y-1.5 min-h-[200px] transition-all",
                isDropTarget && "bg-primary/5 border-primary ring-2 ring-primary/20",
              )}
            >
              {stage.leads.length === 0 && (
                <p className={cn(
                  "text-[11px] text-center py-8 transition-colors",
                  isDropTarget ? "text-primary font-medium" : "text-muted-foreground",
                )}>
                  {isDropTarget ? "Drop here" : "—"}
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
                      "w-full text-left bg-card rounded-lg border border-border/60 p-2 hover:shadow-md transition-all border-l-[3px] cursor-grab active:cursor-grabbing",
                      agingColor,
                      isDragging && "opacity-40 scale-95 rotate-1",
                    )}
                  >
                    <p className="text-[12.5px] font-medium text-foreground truncate leading-tight">{lead.childName}</p>
                    <p className="text-[10.5px] text-muted-foreground truncate leading-tight">{lead.parentName}</p>
                    <div className="flex items-center justify-between mt-1.5 gap-1">
                      <span className="text-[9.5px] font-medium text-muted-foreground uppercase tracking-wide">{lead.state}</span>
                      <span className={cn(
                        "text-[9.5px] font-semibold tabular-nums",
                        lead.daysInStage >= 5 ? "text-destructive" : lead.daysInStage >= 3 ? "text-warning" : "text-muted-foreground",
                      )}>{lead.daysInStage}d</span>
                    </div>
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
