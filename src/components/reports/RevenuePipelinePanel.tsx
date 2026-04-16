import { useNavigate } from "react-router-dom";
import { DollarSign, ArrowUpRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { revenuePipeline, projectedStarts } from "@/data/reports";

export function RevenuePipelinePanel() {
  const navigate = useNavigate();
  const total = revenuePipeline.reduce((sum, s) => sum + s.value, 0);
  const weighted = revenuePipeline.reduce((sum, s) => sum + s.value * s.weight, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Pipeline by stage */}
      <div className="bg-card rounded-xl border border-border/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              Revenue Pipeline
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Proxy value by stage (in $k)</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground tabular-nums">${total}k</p>
            <p className="text-[10px] text-muted-foreground">Weighted: ${Math.round(weighted)}k</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {revenuePipeline.map((s) => {
            const pct = (s.value / total) * 100;
            return (
              <button
                key={s.stage}
                onClick={() => navigate("/clients")}
                className="w-full text-left group flex items-center gap-3"
              >
                <span className="text-[11px] text-muted-foreground w-40 shrink-0 truncate group-hover:text-foreground">
                  {s.stage}
                </span>
                <div className="flex-1 h-6 bg-muted/40 rounded-md overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-md flex items-center px-2"
                    style={{ width: `${Math.max(pct, 6)}%` }}
                  >
                    <span className="text-[10px] font-bold text-primary-foreground">{s.clients}</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-foreground tabular-nums w-12 text-right">
                  ${s.value}k
                </span>
                <ArrowUpRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Projected starts */}
      <div className="bg-card rounded-xl border border-border/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              Projected Starts (Next 30 Days)
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Forecast based on current pipeline</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground tabular-nums">
              {projectedStarts.reduce((s, p) => s + p.count, 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">total starts</p>
          </div>
        </div>
        <div className="space-y-2">
          {projectedStarts.map((p) => (
            <div
              key={p.window}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 bg-secondary/20"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{p.window}</p>
                <div className="mt-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      p.confidence >= 80 ? "bg-success" : p.confidence >= 60 ? "bg-warning" : "bg-destructive",
                    )}
                    style={{ width: `${p.confidence}%` }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-base font-semibold text-foreground tabular-nums">{p.count}</p>
                <p className="text-[10px] text-muted-foreground">{p.confidence}% conf</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
