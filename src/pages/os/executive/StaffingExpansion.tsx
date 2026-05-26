import { useMemo } from "react";
import { Users2, MapPin, TrendingUp } from "lucide-react";
import { ExecPage, ExecCard, HealthPill, MetricTile, AIPrompt, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";

const STATES = ["GA", "NC", "VA", "TN", "MD"] as const;

export default function StaffingExpansion() {
  const ops = useOpsIntelligence();
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const wf = useMemo(() => [ga, nc, va, tn, md], [ga, nc, va, tn, md]);

  const totals = useMemo(() => {
    const bcbas = wf.flatMap((w) => w.bcbas);
    const rbts = wf.flatMap((w) => w.rbts);
    const needs = wf.flatMap((w) => w.staffingNeeds);
    const overloaded = bcbas.filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length;
    return { bcbas: bcbas.length, rbts: rbts.length, needs: needs.length, overloaded };
  }, [wf]);

  const recruiting = ops.recruiting;

  return (
    <ExecPage
      title="Staffing & Expansion"
      subtitle="Where staffing is stable, where pressure is building, and whether expansion is possible."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="BCBAs" value={totals.bcbas} hint="Across all states" tone="healthy" />
        <MetricTile label="RBTs" value={totals.rbts} hint="Across all states" tone="healthy" />
        <MetricTile label="Open staffing needs" value={totals.needs} hint="Live" tone={totals.needs > 6 ? "risk" : totals.needs > 2 ? "attention" : "healthy"} />
        <MetricTile label="BCBAs at capacity" value={totals.overloaded} hint="Near/over capacity" tone={totals.overloaded > 3 ? "risk" : totals.overloaded > 0 ? "attention" : "healthy"} />
      </div>

      <ExecCard title="State staffing stability" hint="Workforce by state">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {STATES.map((s, i) => {
            const w = wf[i];
            const gap = w.staffingNeeds.length;
            const tone: HealthTone = gap > 3 ? "risk" : gap > 1 ? "attention" : "healthy";
            return (
              <div key={s} className="rounded-xl border border-border/60 bg-background/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[13.5px] font-medium">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />{s}
                  </div>
                  <HealthPill tone={tone}>{gap === 0 ? "Stable" : `${gap} open`}</HealthPill>
                </div>
                <div className="mt-2 text-[12px] text-muted-foreground space-y-0.5">
                  <div>BCBAs: <span className="text-foreground tabular-nums">{w.bcbas.length}</span></div>
                  <div>RBTs: <span className="text-foreground tabular-nums">{w.rbts.length}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </ExecCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ExecCard title="Recruiting momentum" hint="Pipeline">
          <div className="grid grid-cols-2 gap-3">
            <MetricTile label="Candidates" value={recruiting.candidates.length} tone="healthy" />
            <MetricTile label="Stalled ≥14d" value={recruiting.stalledCandidates.length} tone={recruiting.stalledCandidates.length > 5 ? "risk" : recruiting.stalledCandidates.length > 0 ? "attention" : "healthy"} />
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <AIPrompt label="Forecast hiring throughput" prompt="Forecast Blossom's hiring throughput over the next 60 days" />
            <AIPrompt label="Where is pipeline weakest?" prompt="Where is the recruiting pipeline weakest right now and what should leadership do?" />
          </div>
        </ExecCard>

        <ExecCard title="Expansion readiness" hint="Where Blossom can grow next">
          <ul className="space-y-2">
            {STATES.map((s, i) => {
              const w = wf[i];
              const gap = w.staffingNeeds.length;
              const ready = gap === 0;
              return (
                <li key={s} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-3 py-2">
                  <span className="text-[13px] font-medium">{s}</span>
                  <HealthPill tone={ready ? "healthy" : "attention"}>
                    {ready ? "Ready to expand" : "Stabilize first"}
                  </HealthPill>
                </li>
              );
            })}
          </ul>
        </ExecCard>
      </div>
    </ExecPage>
  );
}
