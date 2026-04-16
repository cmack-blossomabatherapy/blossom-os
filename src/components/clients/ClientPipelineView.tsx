import { Client, clientStages, stageVariant, getClientAlert } from "@/data/clients";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  clients: Client[];
  onSelect: (c: Client) => void;
}

export function ClientPipelineView({ clients, onSelect }: Props) {
  const stageData = clientStages.map((s) => ({
    ...s,
    clients: clients.filter((c) => c.stage === s.name),
  }));

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {stageData.map((stage) => (
        <div key={stage.name} className="min-w-[230px] max-w-[230px] flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 bg-card rounded-t-xl border border-border/60 border-b-0">
            <StatusBadge status={stage.name} variant={stage.variant} />
            <span className="text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded-full">
              {stage.clients.length}
            </span>
          </div>
          <div className="flex-1 bg-muted/30 rounded-b-xl border border-border/60 border-t-0 p-2 space-y-2 min-h-[200px]">
            {stage.clients.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No clients</p>
            )}
            {stage.clients.map((c) => {
              const alert = getClientAlert(c);
              const aging = c.daysInStage >= 7 ? "border-l-destructive" : c.daysInStage >= 4 ? "border-l-warning" : "border-l-primary/30";
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={cn(
                    "w-full text-left bg-card rounded-lg border border-border/60 p-3 hover:shadow-md transition-shadow border-l-[3px]",
                    aging
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
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
