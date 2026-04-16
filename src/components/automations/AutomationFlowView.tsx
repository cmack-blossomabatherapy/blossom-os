import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { lifecycleFlow, mockAutomations, workflowVariant } from "@/data/automations";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface Props {
  selectedNode: string | null;
  onSelectNode: (id: string) => void;
  onSelectAutomation: (id: string) => void;
}

export function AutomationFlowView({ selectedNode, onSelectNode, onSelectAutomation }: Props) {
  // For the selected node, show automations that touch that workflow
  const node = selectedNode ? lifecycleFlow.find((n) => n.id === selectedNode) : null;
  const related = node
    ? mockAutomations.filter(
        (a) =>
          a.workflow === node.workflow ||
          a.actions.some((act) => act.detail.toLowerCase().includes(node.label.toLowerCase())),
      )
    : [];

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border/60 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Lifecycle Flow</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Click a stage to see automations that fire there
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {mockAutomations.filter((a) => a.status === "Active").length} active automations
          </p>
        </div>
        <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
          {lifecycleFlow.map((n, i) => {
            const active = selectedNode === n.id;
            return (
              <div key={n.id} className="flex items-stretch gap-1 shrink-0">
                <button
                  onClick={() => onSelectNode(n.id)}
                  className={cn(
                    "min-w-[110px] rounded-xl border-2 transition-all p-3 text-left flex flex-col gap-1.5",
                    active
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/60 bg-card hover:border-primary/40",
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">{n.label}</p>
                  <StatusBadge status={n.workflow} variant={workflowVariant(n.workflow)} />
                  <div className="flex items-baseline gap-1 mt-auto">
                    <span className="text-base font-semibold text-primary tabular-nums">{n.automationCount}</span>
                    <span className="text-[10px] text-muted-foreground">automations</span>
                  </div>
                </button>
                {i < lifecycleFlow.length - 1 && (
                  <div className="flex items-center text-muted-foreground/40 px-0.5">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {node && (
        <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Automations at "{node.label}"</h3>
            <span className="text-xs font-medium text-muted-foreground bg-background border border-border/60 px-2 py-0.5 rounded-md">
              {related.length}
            </span>
          </div>
          {related.length === 0 ? (
            <p className="px-4 py-6 text-xs text-center text-muted-foreground italic">
              No automations linked to this stage yet
            </p>
          ) : (
            <div className="divide-y divide-border/30">
              {related.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onSelectAutomation(a.id)}
                  className="w-full text-left px-4 py-2.5 hover:bg-muted/20 transition-colors flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {a.triggerLabel} → {a.actions[0]?.detail}
                    </p>
                  </div>
                  <StatusBadge status={a.status} variant={a.status === "Active" ? "success" : a.status === "Error" ? "destructive" : "muted"} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
