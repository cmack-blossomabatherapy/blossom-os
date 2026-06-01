import { useMemo } from "react";
import {
  OpsPage,
  OpsCard,
  MetricTile,
  EmptyRow,
  HealthPill,
  AIPrompt,
  type HealthTone,
} from "./_shared";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useRecruitingCandidates } from "@/hooks/useRecruitingCandidates";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATES = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;

type Readiness = "stable" | "monitor" | "pressure" | "critical";
const TONE: Record<Readiness, HealthTone> = {
  stable: "healthy",
  monitor: "attention",
  pressure: "risk",
  critical: "blocked",
};
const LABEL: Record<Readiness, string> = {
  stable: "Stable",
  monitor: "Monitor",
  pressure: "Under Pressure",
  critical: "Critical",
};

function Trend({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "up") return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (dir === "down") return <TrendingDown className="h-3 w-3 text-rose-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground/60" />;
}

export default function OpsStaffingCapacity() {
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const rec = useRecruitingCandidates();
  const cr = useCentralReachOps();
  const ops = useOpsIntelligence();

  const wf = useMemo(
    () => [
      { code: "GA", data: ga },
      { code: "NC", data: nc },
      { code: "VA", data: va },
      { code: "TN", data: tn },
      { code: "MD", data: md },
    ],
    [ga, nc, va, tn, md],
  );

  // ─── Per-state pressure score ─────────────────────────
  const stateRows = useMemo(() => {
    return wf.map(({ code, data }) => {
      const critical = data.staffingNeeds.filter((n) => n.urgency === "critical").length;
      const high = data.staffingNeeds.filter((n) => n.urgency === "high").length;
      const overload = data.bcbas.filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length;
      const needsAttn = data.bcbas.filter((b) => b.status === "Needs Attention").length;
      const lowUtil = data.rbts.filter((r) => r.status === "Underutilized" || r.status === "At Risk").length;
      const totalNeed = data.staffingNeeds.length;
      const pressureScore = Math.max(
        0,
        Math.min(100, 100 - critical * 15 - high * 7 - overload * 4 - lowUtil * 1.5),
      );
      const readiness: Readiness =
        critical >= 2 || pressureScore < 55
          ? "critical"
          : critical >= 1 || pressureScore < 70
            ? "pressure"
            : high >= 2 || pressureScore < 82
              ? "monitor"
              : "stable";
      return {
        code,
        bcbas: data.bcbas.length,
        rbts: data.rbts.length,
        critical,
        high,
        overload,
        needsAttn,
        lowUtil,
        totalNeed,
        pressureScore: Math.round(pressureScore),
        readiness,
      };
    });
  }, [wf]);

  // ─── Org totals ───────────────────────────────────────
  const totals = useMemo(() => {
    const bcbas = wf.flatMap((w) => w.data.bcbas);
    const rbts = wf.flatMap((w) => w.data.rbts);
    const overloaded = bcbas.filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length;
    const needsAttn = bcbas.filter((b) => b.status === "Needs Attention").length;
    const lowUtil = rbts.filter((r) => r.status === "Underutilized" || r.status === "At Risk").length;
    const totalNeeds = wf.reduce((s, w) => s + w.data.staffingNeeds.length, 0);
    const criticalNeeds = wf.reduce(
      (s, w) => s + w.data.staffingNeeds.filter((n) => n.urgency === "critical").length,
      0,
    );
    const readinessScore = Math.round(
      stateRows.reduce((s, r) => s + r.pressureScore, 0) / Math.max(1, stateRows.length),
    );
    return {
      bcbas: bcbas.length,
      rbts: rbts.length,
      overloaded,
      needsAttn,
      lowUtil,
      totalNeeds,
      criticalNeeds,
      readinessScore,
    };
  }, [wf, stateRows]);

  const orgReadiness: Readiness =
    totals.criticalNeeds >= 4 || totals.readinessScore < 60
      ? "critical"
      : totals.criticalNeeds >= 1 || totals.readinessScore < 72
        ? "pressure"
        : totals.readinessScore < 84
          ? "monitor"
          : "stable";

  // ─── Recruiting funnel ────────────────────────────────
  const funnel = useMemo(() => {
    const groups = new Map<string, number>();
    rec.candidates.forEach((c) =>
      groups.set(c.pipeline_stage, (groups.get(c.pipeline_stage) ?? 0) + 1),
    );
    return Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
  }, [rec.candidates]);

  const stalledCount = ops.recruiting.stalledCandidates.length;

  // ─── Clinic / region capacity ─────────────────────────
  const clinicRows = useMemo(() => {
    const list: { id: string; name: string; state: string; bcbas: number; rbts: number; needs: number; readiness: Readiness; note: string }[] = [];
    const gaData = ga;
    const peachtree = {
      bcbas: gaData.bcbas.filter((b) => (b.region ?? "").toLowerCase().includes("peachtree")).length,
      rbts: gaData.rbts.filter((r) => (r.region ?? "").toLowerCase().includes("peachtree")).length,
    };
    const riverdale = {
      bcbas: gaData.bcbas.filter((b) => (b.region ?? "").toLowerCase().includes("riverdale")).length,
      rbts: gaData.rbts.filter((r) => (r.region ?? "").toLowerCase().includes("riverdale")).length,
    };
    list.push({
      id: "peachtree",
      name: "Peachtree Corners Clinic",
      state: "GA",
      bcbas: peachtree.bcbas,
      rbts: peachtree.rbts,
      needs: 0,
      readiness: peachtree.bcbas + peachtree.rbts === 0 ? "monitor" : "stable",
      note: "Clinic-based operations",
    });
    list.push({
      id: "riverdale",
      name: "Riverdale Clinic",
      state: "GA",
      bcbas: riverdale.bcbas,
      rbts: riverdale.rbts,
      needs: 0,
      readiness: riverdale.bcbas + riverdale.rbts === 0 ? "monitor" : "stable",
      note: "Clinic-based operations",
    });
    stateRows.forEach((s) => {
      list.push({
        id: `field-${s.code}`,
        name: `${s.code} Field Operations`,
        state: s.code,
        bcbas: s.bcbas,
        rbts: s.rbts,
        needs: s.totalNeed,
        readiness: s.readiness,
        note: `${s.critical} critical · ${s.high} high needs`,
      });
    });
    return list;
  }, [ga, stateRows]);

  // ─── Scheduling/assignment readiness ──────────────────
  const scheduling = useMemo(() => {
    return {
      uncovered: cr.counts.uncoveredClients,
      atRisk: cr.counts.atRiskClients,
      covered: cr.counts.coveredClients,
      cancellations7d: cr.cancellationsLast7d,
      cancellations30d: cr.cancellationsLast30d,
      activeClients: cr.counts.activeClients,
    };
  }, [cr]);

  const schedReadinessScore = Math.max(
    0,
    Math.round(100 - (scheduling.uncovered / Math.max(1, scheduling.activeClients)) * 80 - scheduling.atRisk * 1.5),
  );

  // ─── Forecasts ────────────────────────────────────────
  const forecasts = useMemo(() => {
    const out: { id: string; title: string; impact: string; confidence: string; urgency: Readiness; action: string }[] = [];
    const ga = stateRows.find((s) => s.code === "GA");
    if (ga && ga.critical >= 1)
      out.push({
        id: "f1",
        title: "GA onboarding may fall behind demand within 14 days",
        impact: "Service ramp-up at risk if onboarding doesn't accelerate",
        confidence: "High",
        urgency: "pressure",
        action: "Increase RBT interview throughput in GA",
      });
    const va = stateRows.find((s) => s.code === "VA");
    if (va && (va.critical > 0 || va.high >= 2))
      out.push({
        id: "f2",
        title: "VA scheduling pressure rising on delayed RBT onboarding",
        impact: "Assignment delays may impact treatment-start readiness",
        confidence: "Medium-High",
        urgency: "monitor",
        action: "Coordinate VA recruiting + onboarding cadence",
      });
    if (totals.overloaded > 3)
      out.push({
        id: "f3",
        title: "BCBA overload concentrated across multiple states",
        impact: "Supervision quality and PR throughput at risk",
        confidence: "High",
        urgency: "pressure",
        action: "Redistribute caseload or accelerate BCBA hiring",
      });
    if (stalledCount > 5)
      out.push({
        id: "f4",
        title: "Recruiting pipeline softening",
        impact: "Future staffing readiness will weaken in 3-4 weeks",
        confidence: "Medium",
        urgency: "monitor",
        action: "Review pipeline triage and conversion cadence",
      });
    if (scheduling.uncovered > 0)
      out.push({
        id: "f5",
        title: "Active coverage gaps could compound this week",
        impact: `${scheduling.uncovered} client${scheduling.uncovered === 1 ? "" : "s"} without consistent RBT coverage`,
        confidence: "High",
        urgency: "critical",
        action: "Approve temporary coverage or redistribute",
      });
    return out;
  }, [stateRows, totals, stalledCount, scheduling]);

  // ─── Leadership priorities ────────────────────────────
  const priorities = useMemo(() => {
    const out: { id: string; title: string; impact: string; urgency: Readiness; depts: string[]; expected: string }[] = [];
    const worst = [...stateRows].sort((a, b) => a.pressureScore - b.pressureScore)[0];
    if (worst && worst.readiness !== "stable")
      out.push({
        id: "p1",
        title: `Increase RBT recruiting in ${worst.code}`,
        impact: `Highest-pressure state with ${worst.critical} critical needs`,
        urgency: worst.readiness,
        depts: ["Recruiting", "State Leadership"],
        expected: "Reduces staffing gap within 21-30 days",
      });
    if (stalledCount > 4)
      out.push({
        id: "p2",
        title: "Improve onboarding throughput",
        impact: `${stalledCount} candidates stalled in pipeline`,
        urgency: "monitor",
        depts: ["Recruiting", "HR"],
        expected: "Re-accelerate staffing readiness",
      });
    if (totals.totalNeeds > 0)
      out.push({
        id: "p3",
        title: "Reduce staffing-needed backlog",
        impact: `${totals.totalNeeds} client need${totals.totalNeeds === 1 ? "" : "s"} unfulfilled`,
        urgency: totals.criticalNeeds > 0 ? "pressure" : "monitor",
        depts: ["Scheduling", "Recruiting"],
        expected: "Restores treatment continuity",
      });
    if (totals.overloaded > 2)
      out.push({
        id: "p4",
        title: "Stabilize BCBA caseload",
        impact: `${totals.overloaded} BCBAs at or above capacity`,
        urgency: "pressure",
        depts: ["Clinical Leadership"],
        expected: "Protects supervision quality",
      });
    if (scheduling.uncovered > 0)
      out.push({
        id: "p5",
        title: "Reduce pairing & coverage delays",
        impact: "Coverage gaps creating family-facing risk",
        urgency: "critical",
        depts: ["Scheduling"],
        expected: "Improves client continuity",
      });
    return out;
  }, [stateRows, stalledCount, totals, scheduling]);

  // ─── AI summary ───────────────────────────────────────
  const aiSummary = useMemo(() => {
    const parts: string[] = [];
    const worst = [...stateRows].sort((a, b) => a.pressureScore - b.pressureScore)[0];
    if (orgReadiness === "stable")
      parts.push("Org-wide staffing posture remains stable.");
    else if (orgReadiness === "monitor")
      parts.push("Org-wide staffing is mostly stable with localized pressure to monitor.");
    else if (orgReadiness === "pressure")
      parts.push("Operational staffing pressure is increasing — leadership coordination recommended.");
    else parts.push("Critical staffing pressure detected — immediate intervention recommended.");
    if (worst && worst.readiness !== "stable")
      parts.push(`${worst.code} is the highest-pressure region (${worst.critical} critical · ${worst.high} high needs).`);
    if (totals.overloaded > 2)
      parts.push(`${totals.overloaded} BCBAs at or above capacity is concentrating supervision risk.`);
    if (stalledCount > 5)
      parts.push(`${stalledCount} candidates stalled in pipeline could weaken staffing readiness over the next cycle.`);
    if (scheduling.uncovered > 0)
      parts.push(`${scheduling.uncovered} client${scheduling.uncovered === 1 ? "" : "s"} currently uncovered.`);
    return parts.join(" ");
  }, [orgReadiness, stateRows, totals, stalledCount, scheduling]);

  return (
    <OpsPage
      title="Staffing & Capacity"
      subtitle="The operational workforce intelligence layer — staffing readiness, pressure, and forecasting at a glance."
    >
      <div className="space-y-5">
        {/* 1. Header */}
        <OpsCard>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping",
                  orgReadiness === "stable" && "bg-emerald-400",
                  orgReadiness === "monitor" && "bg-amber-400",
                  orgReadiness === "pressure" && "bg-orange-400",
                  orgReadiness === "critical" && "bg-rose-400",
                )} />
                <span className={cn(
                  "relative inline-flex h-2.5 w-2.5 rounded-full",
                  orgReadiness === "stable" && "bg-emerald-500",
                  orgReadiness === "monitor" && "bg-amber-500",
                  orgReadiness === "pressure" && "bg-orange-500",
                  orgReadiness === "critical" && "bg-rose-500",
                )} />
              </span>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Staffing Readiness
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums">{totals.readinessScore}</span>
                  <HealthPill tone={TONE[orgReadiness]}>{LABEL[orgReadiness]}</HealthPill>
                </div>
              </div>
            </div>
            <p className="max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              <Sparkles className="mr-1.5 inline-block h-3.5 w-3.5 text-foreground/60" />
              {aiSummary}
            </p>
          </div>
        </OpsCard>

        {/* 2. Capacity snapshot */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="Clients needing staffing" value={totals.totalNeeds} hint={`${totals.criticalNeeds} critical`} tone={totals.criticalNeeds > 0 ? "risk" : totals.totalNeeds > 5 ? "attention" : "healthy"} />
          <MetricTile label="BCBA pressure" value={totals.overloaded} hint={`${totals.needsAttn} below threshold`} tone={totals.overloaded > 3 ? "risk" : "attention"} />
          <MetricTile label="Recruiting pipeline" value={rec.candidates.length} hint={`${stalledCount} stalled ≥14d`} tone={stalledCount > 5 ? "attention" : "healthy"} />
          <MetricTile label="Coverage readiness" value={`${schedReadinessScore}%`} hint={`${scheduling.uncovered} uncovered · ${scheduling.atRisk} at risk`} tone={scheduling.uncovered > 0 ? "risk" : schedReadinessScore < 85 ? "attention" : "healthy"} />
        </div>

        {/* 3. Staffing pressure map */}
        <OpsCard title="Staffing Pressure Map" hint="Per-state operational pressure">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {stateRows.map((s) => (
              <div key={s.code} className="rounded-xl border border-border/60 p-3.5 transition-all hover:-translate-y-0.5 hover:border-border">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold tracking-tight text-foreground">{s.code}</span>
                  <HealthPill tone={TONE[s.readiness]}>{LABEL[s.readiness]}</HealthPill>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">{s.pressureScore}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">readiness</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      s.readiness === "stable" && "bg-emerald-500",
                      s.readiness === "monitor" && "bg-amber-500",
                      s.readiness === "pressure" && "bg-orange-500",
                      s.readiness === "critical" && "bg-rose-500",
                    )}
                    style={{ width: `${s.pressureScore}%` }}
                  />
                </div>
                <div className="mt-2 space-y-1 text-[11.5px] text-muted-foreground">
                  <div className="flex justify-between"><span>BCBA · RBT</span><span className="tabular-nums text-foreground/80">{s.bcbas} · {s.rbts}</span></div>
                  <div className="flex justify-between"><span>Critical needs</span><span className="tabular-nums text-foreground/80">{s.critical}</span></div>
                  <div className="flex justify-between"><span>High needs</span><span className="tabular-nums text-foreground/80">{s.high}</span></div>
                  <div className="flex justify-between"><span>BCBA overload</span><span className="tabular-nums text-foreground/80">{s.overload}</span></div>
                </div>
              </div>
            ))}
          </div>
        </OpsCard>

        {/* 4. Clinic & region grid */}
        <OpsCard title="State & Clinic Capacity" hint="Operational readiness by location">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clinicRows.map((c) => (
              <div key={c.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{c.state}</div>
                  </div>
                  <HealthPill tone={TONE[c.readiness]}>{LABEL[c.readiness]}</HealthPill>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">BCBA</div>
                    <div className="mt-0.5 text-base font-semibold tabular-nums text-foreground">{c.bcbas}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">RBT</div>
                    <div className="mt-0.5 text-base font-semibold tabular-nums text-foreground">{c.rbts}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Needs</div>
                    <div className="mt-0.5 text-base font-semibold tabular-nums text-foreground">{c.needs}</div>
                  </div>
                </div>
                <div className="mt-2 text-[11.5px] text-muted-foreground">{c.note}</div>
              </div>
            ))}
          </div>
        </OpsCard>

        {/* 5. RBT & BCBA capacity */}
        <div className="grid gap-4 lg:grid-cols-2">
          <OpsCard title="BCBA Capacity" hint="Caseload load distribution">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total BCBAs</div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-foreground">{totals.bcbas}</div>
              </div>
              <div className="rounded-xl border border-border/60 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Near/Over capacity</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-semibold tabular-nums text-foreground">{totals.overloaded}</span>
                  {totals.overloaded > 3 && <Trend dir="down" />}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Below threshold</div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-foreground">{totals.needsAttn}</div>
              </div>
              <div className="rounded-xl border border-border/60 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Supervision risk</div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-foreground">{ops.auths.qaStalled.length}</div>
              </div>
            </div>
          </OpsCard>

          <OpsCard title="RBT Capacity" hint="Utilization & assignment health">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total RBTs</div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-foreground">{totals.rbts}</div>
              </div>
              <div className="rounded-xl border border-border/60 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Below utilization</div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-foreground">{totals.lowUtil}</div>
              </div>
              <div className="rounded-xl border border-border/60 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Uncovered clients</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-semibold tabular-nums text-foreground">{scheduling.uncovered}</span>
                  {scheduling.uncovered > 0 && <Trend dir="down" />}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">At-risk coverage</div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-foreground">{scheduling.atRisk}</div>
              </div>
            </div>
          </OpsCard>
        </div>

        {/* 6. Recruiting & onboarding pipeline */}
        <OpsCard title="Recruiting & Onboarding Pipeline" hint={`${rec.candidates.length} active candidates`}>
          {funnel.length === 0 ? (
            <EmptyRow>No candidates currently in pipeline.</EmptyRow>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {funnel.map(([stage, count]) => {
                const max = funnel[0]?.[1] ?? 1;
                const pct = Math.round((count / max) * 100);
                return (
                  <li key={stage} className="rounded-xl border border-border/60 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] font-medium text-foreground">{stage}</span>
                      <span className="text-[12px] tabular-nums text-muted-foreground">{count}</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-foreground/60" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {stalledCount > 0 && (
            <div className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-[12.5px] text-foreground/80">
              <Users className="mr-1.5 inline-block h-3.5 w-3.5 text-muted-foreground" />
              {stalledCount} candidate{stalledCount === 1 ? "" : "s"} stalled ≥14 days — pipeline triage recommended.
            </div>
          )}
        </OpsCard>

        {/* 7. Scheduling & assignment readiness */}
        <OpsCard title="Scheduling & Assignment Readiness" hint="Can staffing support scheduling demand?">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile label="Active clients" value={scheduling.activeClients} hint="Currently in service" tone="neutral" />
            <MetricTile label="Covered" value={scheduling.covered} hint="Consistent RBT pairing" tone="healthy" />
            <MetricTile label="At risk" value={scheduling.atRisk} hint="Inconsistent coverage" tone={scheduling.atRisk > 0 ? "attention" : "healthy"} />
            <MetricTile label="Cancellations 7d" value={scheduling.cancellations7d} hint={`${scheduling.cancellations30d} in 30d`} tone={scheduling.cancellations7d > 5 ? "attention" : "neutral"} />
          </div>
        </OpsCard>

        {/* 8. Capacity risk forecasting */}
        <OpsCard title="Capacity Risk Forecasting" hint="Predicted staffing pressure">
          {forecasts.length === 0 ? (
            <EmptyRow>No elevated staffing risks forecasted.</EmptyRow>
          ) : (
            <ul className="grid gap-2.5 md:grid-cols-2">
              {forecasts.map((f) => (
                <li key={f.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13.5px] font-medium text-foreground">{f.title}</div>
                    <HealthPill tone={TONE[f.urgency]}>{LABEL[f.urgency]}</HealthPill>
                  </div>
                  <div className="mt-1 text-[12.5px] text-muted-foreground">{f.impact}</div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                    <span className="text-muted-foreground">Confidence: {f.confidence}</span>
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      {f.action} <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </OpsCard>

        {/* 9. Leadership priorities */}
        <OpsCard title="Leadership Staffing Priorities" hint="Where focus moves the needle">
          {priorities.length === 0 ? (
            <EmptyRow>No active leadership priorities — staffing is stable.</EmptyRow>
          ) : (
            <ul className="grid gap-2.5 md:grid-cols-2">
              {priorities.map((p) => (
                <li key={p.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13.5px] font-medium text-foreground">{p.title}</div>
                    <HealthPill tone={TONE[p.urgency]}>{LABEL[p.urgency]}</HealthPill>
                  </div>
                  <div className="mt-1 text-[12.5px] text-muted-foreground">{p.impact}</div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                    <span className="text-muted-foreground">{p.depts.join(" · ")}</span>
                    <span className="font-medium text-foreground">{p.expected}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </OpsCard>

        {/* 10. AI workforce intelligence */}
        <OpsCard title="AI Workforce Intelligence" hint="Ask Blossom AI">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
              <p className="text-[13px] leading-relaxed text-foreground/90">{aiSummary}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                "Explain Staffing Risk",
                "Forecast Capacity",
                "Generate Staffing Summary",
                "Recommend Staffing Actions",
                "Predict Operational Pressure",
              ].map((p) => (
                <AIPrompt key={p} label={p} />
              ))}
            </div>
          </div>
        </OpsCard>
      </div>
    </OpsPage>
  );
}