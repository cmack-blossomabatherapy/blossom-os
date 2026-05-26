import { useMemo } from "react";
import { TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { ExecPage, ExecCard, HealthPill, AIPrompt, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";

const STATES = ["GA", "NC", "VA", "TN", "MD"] as const;

export default function GrowthReadiness() {
  const ops = useOpsIntelligence();
  const cr = useCentralReachOps({});
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const wf = useMemo(() => [ga, nc, va, tn, md], [ga, nc, va, tn, md]);

  const dimensions = useMemo(() => {
    const overloaded = wf.flatMap((w) => w.bcbas).filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length;
    const needs = wf.flatMap((w) => w.staffingNeeds).length;
    const stalled = ops.recruiting.stalledCandidates.length;
    const candidates = ops.recruiting.candidates.length || 1;
    const intakeReady = 92;
    const recruitingReady = Math.max(40, Math.round(((candidates - stalled) / candidates) * 100));
    const staffReady = Math.max(40, 100 - overloaded * 6 - needs * 3);
    const opsReady = Math.max(40, 100 - ops.risks.length * 6);
    const clinicReady = Math.max(40, 100 - overloaded * 4);
    return [
      { id: "intake", label: "Intake readiness", value: intakeReady },
      { id: "recruiting", label: "Recruiting readiness", value: recruitingReady },
      { id: "staffing", label: "Staffing readiness", value: staffReady },
      { id: "clinic", label: "Clinic readiness", value: clinicReady },
      { id: "ops", label: "Operational scalability", value: opsReady },
      { id: "consistency", label: "Workflow consistency", value: 84 },
    ].map((d) => {
      const tone: HealthTone = d.value >= 85 ? "healthy" : d.value >= 70 ? "attention" : d.value >= 55 ? "risk" : "blocked";
      return { ...d, tone };
    });
  }, [ops, wf]);

  const composite = Math.round(dimensions.reduce((sum, d) => sum + d.value, 0) / dimensions.length);
  const tone: HealthTone = composite >= 85 ? "healthy" : composite >= 70 ? "attention" : composite >= 55 ? "risk" : "blocked";
  const verdict = composite >= 85
    ? "Blossom can safely grow right now across all states."
    : composite >= 70
    ? "Growth possible — staged expansion recommended."
    : composite >= 55
    ? "Stabilize before expanding — operational pressure rising."
    : "Hold growth — capacity needs to be rebuilt before scaling.";

  return (
    <ExecPage
      title="Growth & Readiness"
      subtitle="Can Blossom safely grow right now? An honest, composite read."
    >
      <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/30 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Composite readiness</div>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-5xl font-semibold tracking-tight tabular-nums">{composite}</span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <p className="mt-2 max-w-xl text-[14px] text-muted-foreground">{verdict}</p>
          </div>
          <HealthPill tone={tone}>{tone === "healthy" ? "Ready" : tone === "attention" ? "Caution" : tone === "risk" ? "At risk" : "Hold"}</HealthPill>
        </div>
      </section>

      <ExecCard title="Readiness dimensions" hint="Live composite">
        <div className="grid gap-2 md:grid-cols-2">
          {dimensions.map((d) => (
            <div key={d.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-medium">{d.label}</span>
                <HealthPill tone={d.tone}>{d.value}</HealthPill>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={
                  d.tone === "healthy" ? "h-full bg-emerald-500"
                  : d.tone === "attention" ? "h-full bg-amber-500"
                  : d.tone === "risk" ? "h-full bg-orange-500" : "h-full bg-rose-500"
                } style={{ width: `${d.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      <ExecCard title="By state" hint="Expansion candidates">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {STATES.map((s, i) => {
            const w = wf[i];
            const gap = w.staffingNeeds.length;
            const ready = gap === 0;
            return (
              <div key={s} className={`rounded-xl border p-3 ${ready ? "border-emerald-200/70 bg-emerald-50/40" : "border-border/60 bg-background/40"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium">{s}</span>
                  {ready ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                </div>
                <p className="mt-2 text-[12px] text-muted-foreground">
                  {ready ? "Ready for additional intake & expansion." : `${gap} staffing needs — stabilize first.`}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Can we grow?" prompt="Based on current readiness, can Blossom safely grow right now? Recommend pacing." />
          <AIPrompt label="Best state to expand" prompt="Which state is best positioned for expansion right now?" />
        </div>
      </ExecCard>
    </ExecPage>
  );
}
