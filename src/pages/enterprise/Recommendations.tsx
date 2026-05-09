import { useState } from "react";
import { Lightbulb, ArrowRight, Filter } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeverityDot } from "@/components/enterprise/EnterpriseShared";
import { recommendations, type Severity } from "@/data/blossomEnterprise";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SEV_TONE: Record<Severity, string> = {
  critical: "border-l-destructive",
  high: "border-l-warning",
  medium: "border-l-primary",
  low: "border-l-muted-foreground",
};

export default function Recommendations() {
  const [filter, setFilter] = useState<"all" | Severity>("all");
  const items = filter === "all" ? recommendations : recommendations.filter(r => r.severity === filter);

  return (
    <GlassPageShell
      eyebrow="Enterprise"
      eyebrowIcon={Lightbulb}
      title="Smart Recommendations"
      description="AI-surfaced operational insights — what's drifting, what's improving, and what to do next."
      actions={
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(["all", "critical", "high", "medium", "low"] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className="capitalize h-8" onClick={() => setFilter(f)}>{f}</Button>
          ))}
        </div>
      }
    >
      <div className="grid lg:grid-cols-2 gap-3">
        {items.map(r => (
          <Card key={r.id} className={cn("bg-card/60 backdrop-blur-xl border-l-4", SEV_TONE[r.severity])}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base leading-snug flex items-center gap-2">
                  <SeverityDot s={r.severity} />{r.title}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] shrink-0">{r.delta}</Badge>
              </div>
              <div className="text-[11px] text-muted-foreground">{r.module} · owner: {r.owner}</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground/85">{r.insight}</p>
              <div className="flex flex-wrap gap-1.5">
                {r.actions.map(a => (
                  <Button key={a} size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success(`${a} — queued`)}>
                    {a} <ArrowRight className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </GlassPageShell>
  );
}