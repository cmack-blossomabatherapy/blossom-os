import { useMemo } from "react";
import { ShieldAlert, AlertTriangle, TrendingDown } from "lucide-react";
import { ExecPage, ExecCard, HealthPill, AIPrompt, EmptyRow, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";

const STATES = ["GA", "NC", "VA", "TN", "MD"] as const;

export default function StrategicRisks() {
  const ops = useOpsIntelligence();
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const wf = useMemo(() => [ga, nc, va, tn, md], [ga, nc, va, tn, md]);

  const strategic = useMemo(() => {
    const out: { id: string; title: string; detail: string; tone: HealthTone; horizon: string }[] = [];
    const overloaded = wf.flatMap((w) => w.bcbas).filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length;
    if (overloaded > 3) out.push({ id: "cap", title: "BCBA capacity compression", detail: `${overloaded} BCBAs near or above capacity — supervision quality and reauth turnaround at risk if intake continues without redistribution.`, tone: "risk", horizon: "Now" });

    const heaviest = wf.map((w, i) => ({ s: STATES[i], gap: w.staffingNeeds.length })).sort((a, b) => b.gap - a.gap)[0];
    if (heaviest?.gap >= 4) out.push({ id: "state", title: `${heaviest.s} staffing concentration`, detail: `${heaviest.s} carries ${heaviest.gap} active staffing needs. State scaling capacity becomes the constraint for growth in that region.`, tone: "risk", horizon: "30 days" });

    if (ops.auths.qaStalled.length > 2 && ops.auths.expiring14.length > 0)
      out.push({ id: "qa", title: "QA throughput pressuring reauth readiness", detail: `${ops.auths.qaStalled.length} plans stalled in QA against ${ops.auths.expiring14.length} authorizations expiring ≤14d. Compounding risk to revenue continuity.`, tone: "blocked", horizon: "14 days" });

    if (ops.recruiting.stalledCandidates.length > 5)
      out.push({ id: "recruit", title: "Recruiting velocity slowing", detail: `${ops.recruiting.stalledCandidates.length} candidates stalled ≥14d. Forward pipeline cannot absorb growth at current throughput.`, tone: "attention", horizon: "60 days" });

    const totalNeeds = wf.flatMap((w) => w.staffingNeeds).length;
    if (totalNeeds > 6) out.push({ id: "scale", title: "Operational scaling instability", detail: `${totalNeeds} open needs across states — leadership coordination across HR, Recruiting, and Scheduling required to stabilize before new openings.`, tone: "risk", horizon: "Now" });

    if (!out.length) out.push({ id: "ok", title: "No strategic risks rising to leadership", detail: "Predictive signals are quiet. Continue rhythmic monitoring.", tone: "healthy", horizon: "—" });
    return out;
  }, [ops, wf]);

  const categories = [
    { id: "scaling", label: "Scaling", count: strategic.filter((s) => /scal|growth|expansion/i.test(s.title)).length },
    { id: "staffing", label: "Staffing", count: strategic.filter((s) => /staff|capacity|recruit/i.test(s.title)).length },
    { id: "workflow", label: "Workflow", count: strategic.filter((s) => /qa|reauth|workflow/i.test(s.title)).length },
    { id: "execution", label: "Execution", count: strategic.filter((s) => /execution|consist/i.test(s.title)).length },
  ];

  return (
    <ExecPage
      title="Strategic Risks"
      subtitle="Predictive operational signals leadership should be tracking — not yesterday's reports."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{c.count}</div>
          </div>
        ))}
      </div>

      <ExecCard title="Strategic risk signals" hint="Predictive · live">
        {strategic.length === 0 ? (
          <EmptyRow>No strategic risks detected right now.</EmptyRow>
        ) : (
          <div className="space-y-2">
            {strategic.map((r) => (
              <div key={r.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className={
                      r.tone === "blocked" ? "mt-0.5 h-4 w-4 text-rose-600"
                      : r.tone === "risk" ? "mt-0.5 h-4 w-4 text-orange-600"
                      : r.tone === "attention" ? "mt-0.5 h-4 w-4 text-amber-600"
                      : "mt-0.5 h-4 w-4 text-emerald-600"
                    } />
                    <div>
                      <div className="text-[14px] font-medium">{r.title}</div>
                      <p className="mt-1 text-[12.5px] text-muted-foreground">{r.detail}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <HealthPill tone={r.tone}>{r.tone}</HealthPill>
                    <span className="text-[11px] text-muted-foreground">{r.horizon}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Explain strategic risks" prompt="Explain the strategic risks facing Blossom and recommend mitigations" />
          <AIPrompt label="Forecast 30 days" prompt="Forecast how Blossom's operational posture will look in 30 days if no action is taken" />
          <AIPrompt label="Where should leadership intervene?" prompt="Where should leadership intervene first to reduce strategic risk?" />
        </div>
      </ExecCard>
    </ExecPage>
  );
}
