import { CheckCircle2, AlertOctagon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { mockAutomations, formatRelative, workflowVariant } from "@/data/automations";

interface Props {
  onSelectAutomation: (id: string) => void;
}

export function AutomationLogsView({ onSelectAutomation }: Props) {
  // Flatten all logs across automations
  const allLogs = mockAutomations.flatMap((a) =>
    a.recentLogs.map((l) => ({ ...l, automation: a })),
  );
  allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const failures = allLogs.filter((l) => l.status === "failure");
  const successes = allLogs.filter((l) => l.status === "success");

  return (
    <div className="space-y-4">
      {/* Failed runs */}
      <div className="bg-card rounded-xl border border-destructive/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 bg-destructive/5 flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-destructive/10 text-destructive border border-destructive/30 inline-flex items-center justify-center">
            <AlertOctagon className="h-3 w-3" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Failed Runs</h3>
          <span className="text-xs font-medium text-muted-foreground bg-background border border-border/60 px-2 py-0.5 rounded-md">
            {failures.length}
          </span>
        </div>
        {failures.length === 0 ? (
          <p className="px-4 py-6 text-xs text-center text-muted-foreground italic">No failures — system is clean</p>
        ) : (
          <div className="divide-y divide-border/30">
            {failures.map((l) => (
              <div
                key={`${l.automation.id}-${l.id}`}
                className="px-4 py-3 hover:bg-muted/20 transition-colors flex items-start gap-3 group"
              >
                <div className="h-7 w-7 rounded-md bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  <AlertOctagon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => onSelectAutomation(l.automation.id)}
                    className="text-left"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate group-hover:text-primary">
                        {l.automation.name}
                      </span>
                      <StatusBadge status={l.automation.workflow} variant={workflowVariant(l.automation.workflow)} />
                    </div>
                  </button>
                  <p className="text-xs text-foreground mt-1">
                    {l.message} · <span className="text-muted-foreground">{l.recordType} · {l.recordLabel}</span>
                  </p>
                  {l.errorDetail && (
                    <p className="text-[11px] text-destructive bg-destructive/5 border border-destructive/20 rounded px-2 py-1 mt-1.5 font-mono">
                      {l.errorDetail}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[11px] text-muted-foreground tabular-nums">{formatRelative(l.timestamp)}</span>
                  <Button variant="outline" size="sm" className="h-6 text-[11px] px-2">
                    <RefreshCw className="h-2.5 w-2.5 mr-1" />
                    Retry
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent successes */}
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-success/10 text-success border border-success/30 inline-flex items-center justify-center">
            <CheckCircle2 className="h-3 w-3" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Recent Successful Runs</h3>
          <span className="text-xs font-medium text-muted-foreground bg-background border border-border/60 px-2 py-0.5 rounded-md">
            {successes.length}
          </span>
        </div>
        <div className="divide-y divide-border/30">
          {successes.slice(0, 12).map((l) => (
            <button
              key={`${l.automation.id}-${l.id}`}
              onClick={() => onSelectAutomation(l.automation.id)}
              className={cn(
                "w-full text-left px-4 py-2.5 hover:bg-muted/20 transition-colors flex items-center gap-3",
              )}
            >
              <div className="h-7 w-7 rounded-md bg-success/10 text-success flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{l.automation.name}</span>
                  <StatusBadge status={l.automation.workflow} variant={workflowVariant(l.automation.workflow)} />
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {l.message} · {l.recordType} {l.recordLabel}
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                {formatRelative(l.timestamp)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
