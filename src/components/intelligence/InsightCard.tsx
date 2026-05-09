import { AlertTriangle, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RiskInsight } from "@/data/blossomIntelligence";

export function InsightCard({ insight }: { insight: RiskInsight }) {
  const tone = insight.severity === "high" ? "border-destructive/30 bg-destructive/[0.04]" : insight.severity === "medium" ? "border-warning/30 bg-warning/[0.04]" : "border-border/60";
  const pillTone = insight.severity === "high" ? "bg-destructive/15 text-destructive" : insight.severity === "medium" ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary";
  return (
    <div className={cn("rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md", tone)}>
      <div className="flex items-start justify-between gap-2">
        <div className="rounded-lg bg-background p-1.5 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", pillTone)}>{insight.severity}</span>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{insight.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{insight.description}</p>
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">{insight.category}</Badge>
          <span>{insight.affected} affected</span>
        </div>
        <Button size="sm" variant="ghost" className="h-7 text-[11px]">
          {insight.cta} <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
