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
    <div className="bg-card rounded-xl border border-border/60 p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      <div className="space-y-2">
        {stages.map((stage, i) => {
          const pct = max > 0 ? (stage.count / max) * 100 : 0;
          const isBottleneck = stage.dropOff !== undefined && stage.dropOff > 30;
          return (
            <div key={stage.stage} className="group cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground w-32 shrink-0 truncate">{stage.stage}</span>
                <div className="flex-1 h-7 bg-muted/40 rounded-md overflow-hidden relative">
                  <div
                    className={cn(
                      "h-full rounded-md transition-all flex items-center px-2",
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
                    "text-[10px] font-semibold w-12 text-right shrink-0",
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
