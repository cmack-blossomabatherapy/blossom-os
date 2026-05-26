import { useMemo } from "react";
import { ExecPage, ExecCard, HealthPill, AIPrompt, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";

const STATES = ["GA", "NC", "VA", "TN", "MD"] as const;

function statusFromScore(score: number): { label: string; tone: HealthTone } {
  if (score >= 85) return { label: "Healthy", tone: "healthy" };
  if (score >= 70) return { label: "Attention Needed", tone: "attention" };
  if (score >= 55) return { label: "At Risk", tone: "risk" };
  return { label: "Critical", tone: "blocked" };
}

export default function OrganizationalHealth() {
  const ops = useOpsIntelligence();
  const cr = useCentralReachOps({});
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const wf = useMemo(() => [ga, nc, va, tn, md], [ga, nc, va, tn, md]);

  const scores = useMemo(() => {
    const overloaded = wf.flatMap((w) => w.bcbas).filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length;
    const needs = wf.flatMap((w) => w.staffingNeeds).length;
    const stalled = ops.recruiting.stalledCandidates.length;
    const expiring = ops.auths.expiring7.length;
    const qaStalled = ops.auths.qaStalled.length;
    const coverage = cr.counts.activeClients
      ? Math.round((cr.counts.coveredClients / cr.counts.activeClients) * 100)
      : 90;

    return [
      { id: "intake", name: "Intake", score: 92 - Math.min(20, ops.depts.find((d) => d.id === "intake")?.tone === "risk" ? 20 : 0) },
      { id: "scheduling", name: "Scheduling", score: Math.max(40, coverage) },
      { id: "qa", name: "QA", score: Math.max(40, 100 - qaStalled * 6) },
      { id: "recruiting", name: "Recruiting", score: Math.max(40, 100 - stalled * 4) },
      { id: "hr", name: "HR", score: 88 },
      { id: "payroll", name: "Payroll", score: 92 },
      { id: "staffing", name: "Staffing", score: Math.max(40, 100 - needs * 5 - overloaded * 4) },
      { id: "training", name: "Training Adoption", score: 84 },
      { id: "consistency", name: "Operational Consistency", score: Math.max(40, 100 - (overloaded + qaStalled) * 3) },
      { id: "multistate", name: "Multi-state Readiness", score: Math.max(40, 100 - needs * 4) },
    ].map((s) => ({ ...s, ...statusFromScore(s.score) }));
  }, [ops, wf, cr]);

  const counts = useMemo(() => {
    const c = { healthy: 0, attention: 0, risk: 0, blocked: 0 };
    scores.forEach((s) => { (c as any)[s.tone]++; });
    return c;
  }, [scores]);

  return (
    <ExecPage
      title="Organizational Health"
      subtitle="A lightweight read on every operational system in Blossom."
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Healthy</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600 tabular-nums">{counts.healthy}</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Attention</div>
          <div className="mt-1 text-2xl font-semibold text-amber-600 tabular-nums">{counts.attention}</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">At Risk</div>
          <div className="mt-1 text-2xl font-semibold text-orange-600 tabular-nums">{counts.risk}</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Critical</div>
          <div className="mt-1 text-2xl font-semibold text-rose-600 tabular-nums">{counts.blocked}</div>
        </div>
      </div>

      <ExecCard title="Operational systems" hint="Score 0–100">
        <div className="grid gap-2 md:grid-cols-2">
          {scores.map((s) => (
            <div key={s.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-medium">{s.name}</span>
                <HealthPill tone={s.tone}>{s.label}</HealthPill>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={
                    s.tone === "healthy"
                      ? "h-full bg-emerald-500"
                      : s.tone === "attention"
                      ? "h-full bg-amber-500"
                      : s.tone === "risk"
                      ? "h-full bg-orange-500"
                      : "h-full bg-rose-500"
                  }
                  style={{ width: `${s.score}%` }}
                />
              </div>
              <div className="mt-1 text-[11.5px] text-muted-foreground tabular-nums">Score {s.score}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Summarize org health" prompt="Summarize Blossom's organizational health across all departments" />
          <AIPrompt label="Where is risk concentrated?" prompt="Which operational systems are concentrating the most risk right now?" />
        </div>
      </ExecCard>

      <ExecCard title="State readiness" hint="Workforce posture by state">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {STATES.map((s, i) => {
            const w = wf[i];
            const gap = w.staffingNeeds.length;
            const tone: HealthTone = gap > 3 ? "risk" : gap > 1 ? "attention" : "healthy";
            return (
              <div key={s} className="rounded-xl border border-border/60 bg-background/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium">{s}</span>
                  <HealthPill tone={tone}>{gap === 0 ? "Stable" : `${gap} needs`}</HealthPill>
                </div>
                <div className="mt-2 text-[12px] text-muted-foreground">
                  {w.bcbas.length} BCBAs · {w.rbts.length} RBTs
                </div>
              </div>
            );
          })}
        </div>
      </ExecCard>
    </ExecPage>
  );
}
