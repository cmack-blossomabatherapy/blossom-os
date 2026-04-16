import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FunnelStage } from "@/data/reports";

interface Props {
  title: string;
  subtitle?: string;
  stages: FunnelStage[];
}

export function ReportFunnel({ title, subtitle, stages }: Props) {
  const navigate = useNavigate();
  const max = Math.max(...stages.map((s) => s.count));

  return (
    <div className="bg-card rounded-xl border border-border/60 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="space-y-1.5">
        {stages.map((s) => {
          const pct = max > 0 ? (s.count / max) * 100 : 0;
          const bottleneck = s.dropOff !== undefined && s.dropOff >= 20;
          const clickable = !!s.drillTo;
          return (
            <button
              key={s.stage}
              onClick={() => s.drillTo && navigate(s.drillTo)}
              disabled={!clickable}
              className={cn(
                "w-full text-left group flex items-center gap-3",
                clickable && "cursor-pointer",
              )}
            >
              <span className="text-[11px] text-muted-foreground w-36 shrink-0 truncate group-hover:text-foreground transition-colors">
                {s.stage}
              </span>
              <div className="flex-1 h-7 bg-muted/40 rounded-md overflow-hidden relative">
                <div
                  className={cn(
                    "h-full rounded-md transition-all flex items-center px-2",
                    bottleneck ? "bg-destructive/80" : "bg-primary/70",
                    clickable && "group-hover:opacity-90",
                  )}
                  style={{ width: `${Math.max(pct, 8)}%` }}
                >
                  <span className="text-[10px] font-bold text-primary-foreground">{s.count}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 w-16 justify-end shrink-0">
                {s.dropOff !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] font-semibold tabular-nums",
                      bottleneck ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    -{s.dropOff}%
                  </span>
                )}
                {clickable && (
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
