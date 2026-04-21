import { useState } from "react";
import { Client, ClientStage, clientStages, getClientAlert } from "@/data/clients";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients } from "@/contexts/ClientsContext";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  clients: Client[];
  onSelect: (c: Client) => void;
}

export function ClientPipelineView({ clients, onSelect }: Props) {
  const { moveStage, revertStage } = useClients();
  const { ownsClientStage, hasPerm } = useAuth();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ClientStage | null>(null);

  const stageData = clientStages.map((s) => ({
    ...s,
    clients: clients.filter((c) => c.stage === s.name),
  }));

  const handleDragStart = (e: React.DragEvent, client: Client) => {
    setDraggingId(client.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", client.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: ClientStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stage) setDragOverStage(stage);
  };

  const handleDragLeave = (e: React.DragEvent, stage: ClientStage) => {
    // Only clear if leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverStage === stage) setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, stage: ClientStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    setDragOverStage(null);
    if (!id) return;
    const client = clients.find((c) => c.id === id);
    if (!client || client.stage === stage) return;

    if (!hasPerm("clients.edit")) {
      toast.error("You don't have permission to edit clients");
      return;
    }
    if (!ownsClientStage(stage)) {
      toast.error(`Your role doesn't own the "${stage}" stage`, {
        description: "Ask an admin or operations manager to make this move.",
      });
      return;
    }

    // Snapshot what we need to undo BEFORE the move
    const previousStage = client.stage;
    const previousStageEnteredAt = new Date(Date.now() - client.daysInStage * 86400000).toISOString();
    const automationLogEntry = `Stage moved to ${stage} (manual)`;

    // Optimistic update via context (synchronous setState — UI updates immediately).
    // moveStage already appends an automation log entry + timeline event.
    moveStage([id], stage);
    toast.success(`${client.childName} moved to ${stage}`, {
      description: `From ${previousStage}`,
      action: {
        label: "Undo",
        onClick: () => {
          void revertStage(id, previousStage, previousStageEnteredAt, automationLogEntry);
          toast.success(`Reverted ${client.childName} to ${previousStage}`);
        },
      },
    });
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {stageData.map((stage) => {
        const isDropTarget = dragOverStage === stage.name;
        return (
          <div
            key={stage.name}
            className="min-w-[230px] max-w-[230px] flex flex-col"
            onDragOver={(e) => handleDragOver(e, stage.name)}
            onDragLeave={(e) => handleDragLeave(e, stage.name)}
            onDrop={(e) => handleDrop(e, stage.name)}
          >
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2 bg-card rounded-t-xl border border-border/60 border-b-0 transition-colors",
                isDropTarget && "border-primary bg-primary/5"
              )}
            >
              <StatusBadge status={stage.name} variant={stage.variant} />
              <span className="text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded-full">
                {stage.clients.length}
              </span>
            </div>
            <div
              className={cn(
                "flex-1 bg-muted/30 rounded-b-xl border border-border/60 border-t-0 p-2 space-y-2 min-h-[200px] transition-all",
                isDropTarget && "bg-primary/5 border-primary ring-2 ring-primary/20"
              )}
            >
              {stage.clients.length === 0 && (
                <p className={cn(
                  "text-xs text-center py-8 transition-colors",
                  isDropTarget ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                  {isDropTarget ? "Drop to move here" : "No clients"}
                </p>
              )}
              {stage.clients.map((c) => {
                const alert = getClientAlert(c);
                const aging = c.daysInStage >= 7 ? "border-l-destructive" : c.daysInStage >= 4 ? "border-l-warning" : "border-l-primary/30";
                const isDragging = draggingId === c.id;
                return (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, c)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onSelect(c)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") onSelect(c); }}
                    className={cn(
                      "w-full text-left bg-card rounded-lg border border-border/60 p-3 hover:shadow-md transition-all border-l-[3px] cursor-grab active:cursor-grabbing",
                      aging,
                      isDragging && "opacity-40 scale-95 rotate-1"
                    )}
                  >
                    <p className="text-sm font-medium text-foreground truncate">{c.childName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.bcba || "No BCBA"} {c.rbt && `· ${c.rbt}`}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <StatusBadge status={c.state} variant="muted" />
                      <span className="text-[10px] text-muted-foreground">{c.daysInStage}d</span>
                    </div>
                    {alert && (
                      <div className={cn(
                        "flex items-center gap-1 mt-2 text-[10px] font-medium",
                        alert.type === "red" ? "text-destructive" : "text-warning"
                      )}>
                        <AlertCircle className="h-2.5 w-2.5" />
                        {alert.message}
                      </div>
                    )}
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
