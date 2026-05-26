import { useMemo } from "react";
import { Activity, TrendingUp, TrendingDown, Users, Heart, Workflow } from "lucide-react";
import { ExecPage, ExecCard, HealthPill, MetricTile, AIPrompt, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";

const STATES = ["GA", "NC", "VA", "TN", "MD"] as const;

export default function CompanyPulse() {
  const ops = useOpsIntelligence();
  const cr = useCentralReachOps({});
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const wf = useMemo(() => [ga, nc, va, tn, md], [ga, nc, va, tn, md]);

  const beats = useMemo(() => {
    const overloaded = wf.flatMap((w) => w.bcbas).filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length;
    const needs = wf.flatMap((w) => w.staffingNeeds).length;
    const candidates = ops.recruiting.candidates.length;
    const stalled = ops.recruiting.stalledCandidates.length;
    const trendWeekly = cr.cancellationsLast7d - Math.round(cr.cancellationsLast30d / 4);
    return [
      { label: "Active Clients", value: cr.counts.activeClients ?? 0, hint: `${cr.counts.coveredClients} covered`, tone: "healthy" as HealthTone },
      { label: "Staffing Needs", value: needs, hint: "Across states", tone: needs > 6 ? "risk" : needs > 2 ? "attention" : "healthy" as HealthTone },
      { label: "BCBAs at Capacity", value: overloaded, hint: "Near/over capacity", tone: overloaded > 3 ? "risk" : overloaded > 0 ? "attention" : "healthy" as HealthTone },
      { label: "Recruiting Pipeline", value: candidates, hint: `${stalled} stalled ≥14d`, tone: stalled > 5 ? "attention" : "healthy" as HealthTone },
      { label: "Auths Expiring ≤7d", value: ops.auths.expiring7.length, hint: "Blocked window", tone: ops.auths.expiring7.length > 3 ? "blocked" : ops.auths.expiring7.length > 0 ? "risk" : "healthy" as HealthTone },
      { label: "Cancellations · 7d", value: cr.cancellationsLast7d, hint: trendWeekly > 0 ? `↑ ${trendWeekly} vs avg` : "Stable", tone: trendWeekly > 5 ? "attention" : "healthy" as HealthTone },
    ];
  }, [ops, cr, wf]);

  const momentum = useMemo(() => {
    return STATES.map((s, i) => {
      const w = wf[i];
      const gap = w.staffingNeeds.length;
      const tone: HealthTone = gap > 3 ? "risk" : gap > 1 ? "attention" : "healthy";
      const direction = gap > 3 ? "Pressure building" : gap === 0 ? "Stable" : "Watch";
      return { state: s, bcbas: w.bcbas.length, rbts: w.rbts.length, gap, tone, direction };
    });
  }, [wf]);

  return (
    <ExecPage
      title="Company Pulse"
      subtitle="The live organizational heartbeat — quiet signals, honest read."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {beats.map((b) => (
          <MetricTile key={b.label} label={b.label} value={b.value} hint={b.hint} tone={b.tone} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ExecCard title="State momentum" hint="Live workforce signal" className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-3 py-2 text-left">State</th><th className="px-3 py-2 text-right">BCBAs</th><th className="px-3 py-2 text-right">RBTs</th><th className="px-3 py-2 text-right">Open Needs</th><th className="px-3 py-2 text-left">Momentum</th></tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {momentum.map((r) => (
                  <tr key={r.state} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{r.state}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.bcbas}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.rbts}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.gap}</td>
                    <td className="px-3 py-2"><HealthPill tone={r.tone}>{r.direction}</HealthPill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ExecCard>

        <ExecCard title="Department pulse" hint="From operational signals">
          <ul className="space-y-2">
            {ops.depts.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-3 py-2">
                <span className="text-[13px] font-medium">{d.name}</span>
                <HealthPill tone={d.tone}>{d.tone}</HealthPill>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <AIPrompt label="Explain the pulse" prompt="Summarize Blossom's current operational pulse for the CEO" />
            <AIPrompt label="What's shifting?" prompt="What momentum shifts are happening across Blossom this week?" />
          </div>
        </ExecCard>
      </div>
    </ExecPage>
  );
}
