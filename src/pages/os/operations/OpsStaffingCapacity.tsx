import { useMemo } from "react";
import { OpsPage, OpsCard, MetricTile, EmptyRow } from "./_shared";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useRecruitingCandidates } from "@/hooks/useRecruitingCandidates";

const STATES = ["GA", "NC", "VA", "TN", "MD"] as const;

export default function OpsStaffingCapacity() {
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const wf = [ga, nc, va, tn, md];
  const rec = useRecruitingCandidates();

  const totals = useMemo(() => {
    const bcbas = wf.flatMap((w) => w.bcbas);
    const rbts = wf.flatMap((w) => w.rbts);
    const overloaded = bcbas.filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length;
    const needsAttention = bcbas.filter((b) => b.status === "Needs Attention").length;
    const lowUtil = rbts.filter((r) => r.status === "Needs Attention" || r.status === "At Risk").length;
    return { bcbas: bcbas.length, rbts: rbts.length, overloaded, needsAttention, lowUtil };
  }, [wf]);

  const hiringPipeline = useMemo(() => {
    const groups = new Map<string, number>();
    rec.candidates.forEach((c) => groups.set(c.pipeline_stage, (groups.get(c.pipeline_stage) ?? 0) + 1));
    return Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
  }, [rec.candidates]);

  return (
    <OpsPage title="Staffing & Capacity" subtitle="Org-wide staffing posture and hiring pipeline.">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricTile label="BCBAs" value={totals.bcbas} hint={`${totals.overloaded} near/over capacity`} tone={totals.overloaded > 5 ? "risk" : "healthy"} />
        <MetricTile label="RBTs" value={totals.rbts} hint={`${totals.lowUtil} below utilization target`} tone={totals.lowUtil > 10 ? "attention" : "healthy"} />
        <MetricTile label="Active candidates" value={rec.candidates.length} hint="In recruiting pipeline" tone="healthy" />
        <MetricTile label="Urgent BCBA gaps" value={totals.needsAttention} hint="Caseload below threshold" tone={totals.needsAttention > 0 ? "attention" : "healthy"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OpsCard title="Staffing by state">
          <ul className="divide-y divide-border/60">
            {STATES.map((s, i) => {
              const w = wf[i];
              return (
                <li key={s} className="flex items-center justify-between py-2.5">
                  <span className="text-[13.5px] font-medium text-foreground">{s}</span>
                  <span className="text-[12px] text-muted-foreground tabular-nums">
                    {w.bcbas.length} BCBA · {w.rbts.length} RBT
                  </span>
                </li>
              );
            })}
          </ul>
        </OpsCard>

        <OpsCard title="Hiring pipeline">
          {hiringPipeline.length === 0 ? (
            <EmptyRow>No candidates currently in pipeline.</EmptyRow>
          ) : (
            <ul className="divide-y divide-border/60">
              {hiringPipeline.map(([stage, count]) => (
                <li key={stage} className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-foreground">{stage}</span>
                  <span className="text-[12px] text-muted-foreground tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </OpsCard>
      </div>
    </OpsPage>
  );
}