import { Gauge, Users, TrendingUp, AlertTriangle, ChevronRight } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ReadinessGauge, TrendChip, StatChip, Sparkline, Section } from "@/components/enterprise/EnterpriseShared";
import { readinessScore, readinessDelta, readinessTrend, readinessFactors, readinessBreakdowns } from "@/data/blossomEnterprise";
import { cn } from "@/lib/utils";

export default function Readiness() {
  const groups: Array<"Department" | "State" | "Manager"> = ["Department", "State", "Manager"];
  return (
    <GlassPageShell
      eyebrow="Enterprise"
      eyebrowIcon={Gauge}
      title="Workforce Readiness Index"
      description="A composite score across onboarding, compliance, competency, engagement, task on-time rate, and tenure stability — refreshed daily."
    >
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 bg-card/60 backdrop-blur-xl">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <ReadinessGauge value={readinessScore} label="Composite" />
            <div className="flex items-center gap-2">
              <TrendChip trend={readinessDelta >= 0 ? "up" : "down"} delta={readinessDelta} />
              <span className="text-xs text-muted-foreground">vs prior 30 days</span>
            </div>
            <div className="w-full pt-2 border-t border-border/40">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">11-week trend</div>
              <Sparkline data={readinessTrend} height={48} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base">Contributing factors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {readinessFactors.map(f => (
              <div key={f.key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">{f.label}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">weight {Math.round(f.weight * 100)}%</Badge>
                  </div>
                  <span className={cn("text-sm font-bold tabular-nums", f.score >= 85 ? "text-success" : f.score >= 70 ? "text-primary" : "text-warning")}>
                    {f.score}
                  </span>
                </div>
                <Progress value={f.score} className="h-1.5" />
                <p className="text-[11px] text-muted-foreground">{f.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip icon={Users} label="Employees scored" value={283} />
        <StatChip icon={TrendingUp} label="Improving cohorts" value={9} />
        <StatChip icon={AlertTriangle} label="At-risk cohorts" value={3} />
        <StatChip icon={Gauge} label="Score range" value="60 – 92" />
      </div>

      {groups.map(g => (
        <Section key={g} title={`${g} breakdown`}>
          <Card className="bg-card/60 backdrop-blur-xl">
            <CardContent className="p-0 divide-y divide-border/40">
              {readinessBreakdowns.filter(b => b.group === g).map(b => (
                <div key={b.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="col-span-4 min-w-0">
                    <div className="text-sm font-semibold truncate">{b.label}</div>
                    <div className="text-[11px] text-muted-foreground">{b.headcount} people · risk: {b.topRisk}</div>
                  </div>
                  <div className="col-span-5"><Progress value={b.score} className="h-1.5" /></div>
                  <div className="col-span-2 flex items-center gap-2">
                    <span className={cn("text-sm font-bold tabular-nums", b.score >= 85 ? "text-success" : b.score >= 70 ? "text-primary" : "text-warning")}>{b.score}</span>
                    <TrendChip trend={b.delta >= 0 ? "up" : "down"} delta={b.delta} />
                  </div>
                  <ChevronRight className="col-span-1 h-4 w-4 text-muted-foreground justify-self-end" />
                </div>
              ))}
            </CardContent>
          </Card>
        </Section>
      ))}
    </GlassPageShell>
  );
}