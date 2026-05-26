import { Link } from "react-router-dom";
import { ArrowRight, Activity, AlertTriangle, Sparkles } from "lucide-react";
import { OpsPage, OpsCard, HealthPill, MetricTile, EmptyRow } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";

export default function OpsExecutiveDashboard() {
  const ops = useOpsIntelligence();
  const overallTone = ops.risks.some((r) => r.tone === "blocked")
    ? "blocked"
    : ops.risks.some((r) => r.tone === "risk")
    ? "risk"
    : ops.risks.length > 0
    ? "attention"
    : "healthy";

  return (
    <OpsPage
      title="Executive Dashboard"
      subtitle="A quiet, honest snapshot of how the organization is operating right now."
    >
      <div className="grid gap-3 md:grid-cols-4">
        <MetricTile label="Operational posture" value={overallTone === "healthy" ? "Healthy" : overallTone === "attention" ? "Attention" : overallTone === "risk" ? "At risk" : "Blocked"} hint="Composite of live signals" tone={overallTone as never} />
        <MetricTile label="Auths expiring ≤30d" value={ops.auths.expiring30.length} hint={`${ops.auths.expiring7.length} within 7 days`} tone={ops.auths.expiring7.length > 0 ? "blocked" : ops.auths.expiring14.length > 0 ? "risk" : "healthy"} />
        <MetricTile label="QA plans stalled" value={ops.auths.qaStalled.length} hint="≥3 days in QA review" tone={ops.auths.qaStalled.length > 5 ? "risk" : ops.auths.qaStalled.length > 0 ? "attention" : "healthy"} />
        <MetricTile label="Stalled candidates" value={ops.recruiting.stalledCandidates.length} hint={`of ${ops.recruiting.candidates.length} in pipeline`} tone={ops.recruiting.stalledCandidates.length > 10 ? "risk" : ops.recruiting.stalledCandidates.length > 0 ? "attention" : "healthy"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <OpsCard title="Department health" className="lg:col-span-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {ops.depts.map((d) => (
              <Link
                key={d.id}
                to="/operations/department-health"
                className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3 transition hover:border-border hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-foreground">{d.name}</div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground truncate">{d.signal}</div>
                </div>
                <HealthPill tone={d.tone}>{d.tone}</HealthPill>
              </Link>
            ))}
          </div>
        </OpsCard>

        <OpsCard title="What needs attention" hint={`${ops.risks.length} signal${ops.risks.length === 1 ? "" : "s"}`}>
          {ops.risks.length === 0 ? (
            <EmptyRow>Everything is calm. No leadership-level risks detected.</EmptyRow>
          ) : (
            <div className="space-y-2">
              {ops.risks.slice(0, 6).map((r) => (
                <div key={r.id} className="rounded-xl border border-border/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13px] font-medium text-foreground">{r.title}</div>
                    <HealthPill tone={r.tone}>{r.area}</HealthPill>
                  </div>
                  <div className="mt-1 text-[12px] text-muted-foreground">{r.detail}</div>
                </div>
              ))}
              <Link to="/operations/escalations" className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:opacity-80">
                Open escalations <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </OpsCard>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/operations/command-center" className="rounded-2xl border border-border/70 bg-card p-5 transition hover:-translate-y-0.5 hover:border-border">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <div className="mt-3 text-[14px] font-medium tracking-tight">Operations Command Center</div>
          <div className="mt-1 text-[12.5px] text-muted-foreground">Cross-department execution view.</div>
        </Link>
        <Link to="/operations/briefing" className="rounded-2xl border border-border/70 bg-card p-5 transition hover:-translate-y-0.5 hover:border-border">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
          <div className="mt-3 text-[14px] font-medium tracking-tight">Leadership Briefing</div>
          <div className="mt-1 text-[12.5px] text-muted-foreground">What changed today and what to read.</div>
        </Link>
        <Link to="/operations/escalations" className="rounded-2xl border border-border/70 bg-card p-5 transition hover:-translate-y-0.5 hover:border-border">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          <div className="mt-3 text-[14px] font-medium tracking-tight">Escalations & Blockers</div>
          <div className="mt-1 text-[12.5px] text-muted-foreground">Unresolved leadership issues across the org.</div>
        </Link>
      </div>
    </OpsPage>
  );
}