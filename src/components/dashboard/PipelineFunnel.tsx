import { cn } from "@/lib/utils";

interface FunnelStage {
  stage: string;
  count: number;
  dropOff?: number;
}

interface PipelineFunnelProps {
  title: string;
  stages: FunnelStage[];
  maxCount?: number;
}

export function PipelineFunnel({ title, stages, maxCount }: PipelineFunnelProps) {
  const max = maxCount ?? Math.max(...stages.map((s) => s.count));

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 md:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground md:mb-4">{title}</h3>
      <div className="space-y-2.5 md:space-y-2">
        {stages.map((stage, i) => {
          const pct = max > 0 ? (stage.count / max) * 100 : 0;
          const isBottleneck = stage.dropOff !== undefined && stage.dropOff > 30;
          return (
            <div key={stage.stage} className="group cursor-pointer">
              {/* Mobile: stacked label above bar for full-width touch target */}
              <div className="md:hidden">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-foreground">{stage.stage}</span>
                  {stage.dropOff !== undefined && (
                    <span className={cn(
                      "text-[11px] font-semibold",
                      isBottleneck ? "text-destructive" : "text-muted-foreground",
                    )}>
                      -{stage.dropOff}%
                    </span>
                  )}
                </div>
                <div className="relative h-9 overflow-hidden rounded-md bg-muted/40">
                  <div
                    className={cn(
                      "flex h-full items-center rounded-md px-2.5 transition-all",
                      isBottleneck ? "bg-destructive/80" : "bg-primary/70",
                    )}
                    style={{ width: `${Math.max(pct, 12)}%` }}
                  >
                    <span className="text-xs font-bold text-primary-foreground">{stage.count}</span>
                  </div>
                </div>
              </div>
              {/* Desktop: original inline layout */}
              <div className="hidden items-center gap-3 md:flex">
                <span className="w-32 shrink-0 truncate text-[11px] text-muted-foreground">{stage.stage}</span>
                <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-muted/40">
                  <div
                    className={cn(
                      "flex h-full items-center rounded-md px-2 transition-all",
                      isBottleneck ? "bg-destructive/80" : "bg-primary/70",
                      "group-hover:opacity-90",
                    )}
                    style={{ width: `${Math.max(pct, 8)}%` }}
                  >
                    <span className="text-[10px] font-bold text-primary-foreground">{stage.count}</span>
                  </div>
                </div>
                {stage.dropOff !== undefined && (
                  <span className={cn(
                    "w-12 shrink-0 text-right text-[10px] font-semibold",
                    isBottleneck ? "text-destructive" : "text-muted-foreground",
                  )}>
                    -{stage.dropOff}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
