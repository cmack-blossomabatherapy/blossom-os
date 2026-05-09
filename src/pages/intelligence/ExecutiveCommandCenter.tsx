import { Activity, Sparkles } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/intelligence/KpiCard";
import { ScoreRing } from "@/components/intelligence/ScoreRing";
import { AlertFeedItem } from "@/components/intelligence/AlertFeedItem";
import { TrendLine } from "@/components/intelligence/TrendLine";
import { FilterBar } from "@/components/intelligence/FilterBar";
import {
  executiveKpis, executiveAlerts, operationalHealthScore, workforceReadinessScore,
  complianceByState, completionTrend,
} from "@/data/blossomIntelligence";

export default function ExecutiveCommandCenter() {
  return (
    <GlassPageShell
      eyebrow="Executive Command Center"
      eyebrowIcon={Sparkles}
      title="Operational intelligence"
      description="Real-time visibility across workforce, training, compliance, and operations."
      stats={
        <div className="flex items-center gap-6 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
          <ScoreRing value={operationalHealthScore} label="Operational Health" size={104} />
          <ScoreRing value={workforceReadinessScore} label="Workforce Readiness" size={104} />
        </div>
      }
    >
      <FilterBar />

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {executiveKpis.map((k) => (
          <KpiCard key={k.id} label={k.label} value={k.value} delta={k.delta} trend={k.trend} hint={k.hint} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Org training completion trend</h3>
            <span className="text-[11px] text-muted-foreground">Last 14 weeks</span>
          </div>
          <TrendLine values={completionTrend} />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Active alerts</h3>
          <div className="space-y-0 max-h-[300px] overflow-y-auto">
            {executiveAlerts.slice(0, 5).map((a) => <AlertFeedItem key={a.id} {...a} />)}
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <h3 className="mb-4 text-sm font-semibold">State comparison · Compliance score</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          {complianceByState.map((s) => (
            <div key={s.state} className="rounded-xl bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{s.state}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{s.score}%</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${s.score}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{s.employees} employees</p>
            </div>
          ))}
        </div>
      </Card>
    </GlassPageShell>
  );
}
