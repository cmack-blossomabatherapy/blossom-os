import { Authorization, authStages, daysUntil, expirationTone, getAuthAlert } from "@/data/authorizations";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  auths: Authorization[];
  onSelect: (a: Authorization) => void;
}

export function AuthPipelineView({ auths, onSelect }: Props) {
  const stageData = authStages.map((s) => ({
    ...s,
    items: auths.filter((a) => a.stage === s.name),
  }));

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {stageData.map((stage) => (
        <div key={stage.name} className="min-w-[240px] max-w-[240px] flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 bg-card rounded-t-xl border border-border/60 border-b-0">
            <StatusBadge status={stage.name} variant={stage.variant} />
            <span className="text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded-full">
              {stage.items.length}
            </span>
          </div>
          <div className="flex-1 bg-muted/30 rounded-b-xl border border-border/60 border-t-0 p-2 space-y-2 min-h-[200px]">
            {stage.items.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">None</p>
            )}
            {stage.items.map((a) => {
              const alert = getAuthAlert(a);
              const days = daysUntil(a.expirationDate);
              const tone = expirationTone(days);
              const aging = a.daysInStage >= 5 ? "border-l-destructive" : a.daysInStage >= 3 ? "border-l-warning" : "border-l-primary/30";
              return (
                <button
                  key={a.id}
                  onClick={() => onSelect(a)}
                  className={cn(
                    "w-full text-left bg-card rounded-lg border border-border/60 p-3 hover:shadow-md transition-shadow border-l-[3px]",
                    aging
                  )}
                >
                  <p className="text-sm font-medium text-foreground truncate">{a.clientName}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.payor} · {a.authType}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-mono text-muted-foreground">{a.id}</span>
                    {days !== null && (
                      <span className={cn(
                        "text-[10px] font-semibold",
                        tone === "destructive" && "text-destructive",
                        tone === "warning" && "text-warning",
                        tone === "success" && "text-success",
                      )}>
                        {days}d left
                      </span>
                    )}
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
