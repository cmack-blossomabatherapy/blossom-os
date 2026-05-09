import { cn } from "@/lib/utils";

export function FunnelChart({ stages, className }: { stages: { stage: string; count: number }[]; className?: string }) {
  const max = Math.max(...stages.map((s) => s.count));
  return (
    <div className={cn("space-y-2", className)}>
      {stages.map((s, i) => {
        const pct = (s.count / max) * 100;
        const conv = i > 0 ? Math.round((s.count / stages[i - 1].count) * 100) : 100;
        return (
          <div key={s.stage} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{s.stage}</span>
              <span className="text-muted-foreground">
                {s.count.toLocaleString()} <span className="text-[10px]">({conv}%)</span>
              </span>
            </div>
            <div className="relative h-7 overflow-hidden rounded-lg bg-muted/40">
              <div className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-primary to-primary/70 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
