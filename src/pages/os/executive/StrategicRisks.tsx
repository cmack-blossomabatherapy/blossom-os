import { useMemo } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { ExecPage, ExecCard, HealthPill, AIPrompt, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";

const STATES = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;

const TONE_DOT: Record<HealthTone, string> = {
  healthy: "bg-emerald-500",
  attention: "bg-amber-500",
  risk: "bg-orange-500",
  blocked: "bg-rose-500",
  neutral: "bg-muted-foreground/50",
};

const TONE_RANK: Record<HealthTone, number> = {
  healthy: 0,
  neutral: 1,
  attention: 2,
  risk: 3,
  blocked: 4,
};

function worst(...tones: HealthTone[]): HealthTone {
  return tones.reduce((a, b) => (TONE_RANK[a] >= TONE_RANK[b] ? a : b), "healthy");
}

function overallRisk(tones: HealthTone[]): { label: string; tone: HealthTone } {
  const w = worst(...tones);
  if (w === "blocked") return { label: "Critical Risk", tone: "blocked" };
  if (w === "risk") return { label: "Elevated Risk", tone: "risk" };
  if (w === "attention") {
    const attn = tones.filter((t) => t === "attention").length;
    return { label: attn >= 4 ? "Moderate Risk" : "Watch Closely", tone: "attention" };
  }
  return { label: "Stable", tone: "healthy" };
}

type Trend = "up" | "down" | "flat";
function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") return <ArrowUpRight className="size-3.5 text-rose-600" />;
  if (trend === "down") return <ArrowDownRight className="size-3.5 text-emerald-600" />;
  return <ArrowRight className="size-3.5 text-muted-foreground" />;
}

function pillLabel(tone: HealthTone) {
  if (tone === "healthy") return "Stable";
  if (tone === "attention") return "Watch";
  if (tone === "risk") return "Elevated";
  if (tone === "blocked") return "Critical";
  return "Tracking";
}

export default function StrategicRisks() {
  const ops = useOpsIntelligence();
  const cr = useCentralReachOps({});
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const nj = useStateWorkforce("NJ");
  const wf = useMemo(() => ({ GA: ga, NC: nc, VA: va, TN: tn, MD: md, NJ: nj }), [ga, nc, va, tn, md, nj]);

  const d = useMemo(() => {
    const allBcbas = Object.values(wf).flatMap((w) => w.bcbas);
    return {
      overloaded: allBcbas.filter((b) => b.status === "Overloaded").length,
      nearCap: allBcbas.filter((b) => b.status === "Near Capacity").length,
      bcbaTotal: allBcbas.length,
      totalNeeds: Object.values(wf).reduce((s, w) => s + w.staffingNeeds.length, 0),
      stalled: ops.recruiting.stalledCandidates.length,
      candidates: ops.recruiting.candidates.length,
      qaStalled: ops.auths.qaStalled.length,
      expiring7: ops.auths.expiring7.length,
      expiring14: ops.auths.expiring14.length,
      expiring30: ops.auths.expiring30.length,
      missingDocs: ops.auths.missingDocs.length,
      denied: ops.auths.denied.length,
      totalAuths: ops.auths.total,
      uncovered: cr.counts.uncoveredClients,
      coverage: cr.counts.activeClients
        ? Math.round((cr.counts.coveredClients / cr.counts.activeClients) * 100)
        : null,
      cancel7: cr.cancellationsLast7d,
      cancel30: cr.cancellationsLast30d,
    };
  }, [ops, wf, cr]);

  // Section 3 — emerging risks
  const risks = useMemo(() => {
    type Risk = {
      id: string;
      category: "Staffing" | "Workflow" | "Leadership" | "Scaling" | "Execution";
      title: string;
      detail: string;
      tone: HealthTone;
      confidence: "High" | "Medium" | "Low";
      impact: "Low" | "Moderate" | "High";
      trend: Trend;
      horizon: string;
    };
    const list: Risk[] = [];

    // Staffing
    if (d.overloaded > 0) {
      list.push({
        id: "bcba-overload",
        category: "Staffing",
        title: "BCBA capacity compression",
        detail: `${d.overloaded} BCBAs over capacity, ${d.nearCap} near capacity. Supervision quality and reauth turnaround vulnerable if intake continues without redistribution.`,
        tone: d.overloaded > 3 ? "risk" : "attention",
        confidence: "High", impact: "High",
        trend: "up", horizon: "Now · 14d",
      });
    }
    const heaviest = (Object.entries(wf) as [string, typeof ga][])
      .map(([s, w]) => ({ s, gap: w.staffingNeeds.length }))
      .sort((a, b) => b.gap - a.gap)[0];
    if (heaviest && heaviest.gap >= 3) {
      list.push({
        id: "state-concentration",
        category: "Staffing",
        title: `${heaviest.s} staffing concentration`,
        detail: `${heaviest.s} carries ${heaviest.gap} active staffing needs — state scaling capacity becomes the regional growth constraint.`,
        tone: heaviest.gap >= 5 ? "risk" : "attention",
        confidence: "High", impact: "Moderate",
        trend: "up", horizon: "30 days",
      });
    }

    // Workflow
    if (d.qaStalled > 0 && d.expiring14 > 0) {
      list.push({
        id: "qa-reauth",
        category: "Workflow",
        title: "QA throughput pressuring reauth readiness",
        detail: `${d.qaStalled} plans stalled in QA against ${d.expiring14} authorizations expiring ≤14d — compounding risk to revenue continuity.`,
        tone: d.qaStalled > 4 ? "blocked" : "risk",
        confidence: "High", impact: "High",
        trend: "up", horizon: "14 days",
      });
    }
    if (d.expiring7 > 0) {
      list.push({
        id: "auth-expiry",
        category: "Workflow",
        title: "Near-term authorization expiry",
        detail: `${d.expiring7} authorizations expire within 7 days — continuation submissions must move now to avoid revenue gaps.`,
        tone: "risk",
        confidence: "High", impact: "High",
        trend: "up", horizon: "≤7 days",
      });
    }
    if (d.missingDocs > 0) {
      list.push({
        id: "auth-docs",
        category: "Workflow",
        title: "Authorizations missing documentation",
        detail: `${d.missingDocs} submissions blocked pending documents — workflow drift in document handoffs.`,
        tone: d.missingDocs > 4 ? "risk" : "attention",
        confidence: "Medium", impact: "Moderate",
        trend: "flat", horizon: "Now",
      });
    }

    // Scaling
    if (d.totalNeeds > 5) {
      list.push({
        id: "scaling-needs",
        category: "Scaling",
        title: "Operational scaling instability",
        detail: `${d.totalNeeds} open staffing needs across states — coordination across HR, Recruiting, and Scheduling required before new openings.`,
        tone: d.totalNeeds > 10 ? "risk" : "attention",
        confidence: "High", impact: "High",
        trend: "up", horizon: "30–60 days",
      });
    }
    if (d.stalled > 5) {
      list.push({
        id: "recruiting-slow",
        category: "Scaling",
        title: "Recruiting velocity softening",
        detail: `${d.stalled} of ${d.candidates} candidates stalled ≥14d — forward pipeline cannot absorb growth at current throughput.`,
        tone: d.stalled > 12 ? "risk" : "attention",
        confidence: "Medium", impact: "Moderate",
        trend: "up", horizon: "60 days",
      });
    }

    // Execution
    if (d.uncovered > 3) {
      list.push({
        id: "coverage-drift",
        category: "Execution",
        title: "Client coverage drift",
        detail: `${d.uncovered} uncovered clients · ${d.coverage ?? "—"}% overall coverage — scheduling adherence beginning to slip.`,
        tone: d.uncovered > 8 ? "risk" : "attention",
        confidence: "Medium", impact: "Moderate",
        trend: "up", horizon: "Now",
      });
    }
    if (d.cancel7 > 10) {
      list.push({
        id: "cancellations",
        category: "Execution",
        title: "Cancellation pressure rising",
        detail: `${d.cancel7} cancellations in last 7d (${d.cancel30} over 30d) — clinic predictability and revenue continuity at risk.`,
        tone: "attention",
        confidence: "Medium", impact: "Moderate",
        trend: "up", horizon: "14 days",
      });
    }

    // Leadership
    if (d.totalNeeds > 4 && d.overloaded > 2) {
      list.push({
        id: "leadership-dep",
        category: "Leadership",
        title: "Operational dependency on limited capacity",
        detail: `Multiple states leaning on a small number of senior BCBAs to absorb staffing gaps — leadership redistribution required.`,
        tone: "attention",
        confidence: "Medium", impact: "Moderate",
        trend: "flat", horizon: "Ongoing",
      });
    }
    if (d.denied > 0) {
      list.push({
        id: "denials",
        category: "Leadership",
        title: "Authorization denials requiring escalation",
        detail: `${d.denied} denied authorization${d.denied === 1 ? "" : "s"} — appeals coordination needs leadership ownership.`,
        tone: "risk",
        confidence: "High", impact: "High",
        trend: "flat", horizon: "Now",
      });
    }

    if (!list.length) {
      list.push({
        id: "calm",
        category: "Execution",
        title: "No strategic risks rising to leadership",
        detail: "Predictive signals are quiet across staffing, workflows, scaling, and execution. Continue rhythmic monitoring.",
        tone: "healthy",
        confidence: "High", impact: "Low",
        trend: "flat", horizon: "—",
      });
    }
    return list;
  }, [d, wf, ga]);

  const overall = useMemo(() => overallRisk(risks.map((r) => r.tone)), [risks]);

  // Category counts
  const categories = useMemo(() => {
    const cats: { id: string; label: string; count: number; tone: HealthTone }[] = [
      { id: "Staffing", label: "Staffing", count: 0, tone: "healthy" },
      { id: "Workflow", label: "Workflow", count: 0, tone: "healthy" },
      { id: "Scaling", label: "Scaling", count: 0, tone: "healthy" },
      { id: "Execution", label: "Execution", count: 0, tone: "healthy" },
      { id: "Leadership", label: "Leadership", count: 0, tone: "healthy" },
    ];
    risks.forEach((r) => {
      const c = cats.find((x) => x.id === r.category);
      if (!c) return;
      if (r.tone !== "healthy") c.count++;
      c.tone = worst(c.tone, r.tone);
    });
    return cats;
  }, [risks]);

  // Section 2 — exec summary lines
  const summary = useMemo(() => {
    const lines: string[] = [];
    const tight = (Object.entries(wf) as [string, typeof ga][])
      .filter(([, w]) => w.staffingNeeds.length >= 2).map(([s]) => s);
    if (tight.length) {
      lines.push(`${tight.join(", ")} staffing demand continues outpacing onboarding throughput, creating moderate scaling risk over the next 30 days.`);
    } else {
      lines.push("Staffing demand is currently absorbable across all active states — no immediate regional scaling risk detected.");
    }
    if (d.qaStalled > 0 && d.expiring14 > 0) {
      lines.push(`Pending QA review volume (${d.qaStalled}) against ${d.expiring14} near-term auth expirations creates compounding workflow pressure.`);
    } else if (d.expiring7 > 0) {
      lines.push(`${d.expiring7} authorizations expire within 7 days — continuation cadence must hold to protect revenue continuity.`);
    } else {
      lines.push("Authorization workflows remain stable with no near-term reauthorization pressure.");
    }
    if (d.overloaded > 0 || d.nearCap > 0) {
      lines.push(`Operational dependency on limited BCBA capacity (${d.overloaded + d.nearCap} of ${d.bcbaTotal}) may reduce scheduling flexibility as growth continues.`);
    }
    if (d.stalled <= 5 && d.candidates > 0) {
      lines.push(`Recruiting momentum remains healthy, lowering immediate staffing instability concerns.`);
    }
    return lines;
  }, [d, wf, ga]);

  // Section 4 — state risk intelligence
  const stateRisks = useMemo(() => {
    return STATES.map((s) => {
      const w = wf[s];
      const gap = w.staffingNeeds.length;
      const overloaded = w.bcbas.filter((b) => b.status === "Overloaded").length;
      const near = w.bcbas.filter((b) => b.status === "Near Capacity").length;
      const tone: HealthTone =
        gap >= 4 || overloaded >= 2 ? "risk"
          : gap >= 2 || near >= 3 ? "attention"
          : gap === 1 ? "neutral"
          : "healthy";
      const summary =
        tone === "risk" ? `Operational strain increasing — ${gap} open need${gap === 1 ? "" : "s"}, ${overloaded} overloaded.`
        : tone === "attention" ? `Watch — ${gap} open need${gap === 1 ? "" : "s"}, ${near} near capacity.`
        : tone === "neutral" ? "Largely stable with one developing pressure point."
        : "Stable — staffing and execution posture healthy.";
      return { state: s, tone, summary };
    });
  }, [wf]);

  // Section 5 — fragility
  const fragility = useMemo(() => [
    {
      label: "Authorization continuation",
      tone: (d.expiring7 > 0 || d.qaStalled > 3 ? "risk" : d.expiring14 > 5 ? "attention" : "healthy") as HealthTone,
      note: "Workflow leans on a narrow QA review window for reauth readiness.",
    },
    {
      label: "State scheduling coordination",
      tone: (d.uncovered > 5 ? "attention" : "healthy") as HealthTone,
      note: "Coverage discipline depends on a small set of coordinators per state.",
    },
    {
      label: "BCBA caseload distribution",
      tone: (d.overloaded > 2 ? "risk" : d.nearCap > 4 ? "attention" : "healthy") as HealthTone,
      note: `${d.overloaded} overloaded · ${d.nearCap} near capacity — single-point-of-failure exposure.`,
    },
    {
      label: "HR onboarding capacity",
      tone: (d.candidates > 40 && d.stalled > 8 ? "attention" : "healthy") as HealthTone,
      note: "Growth in active candidates may approach HR processing limits.",
    },
    {
      label: "Document handoff reliability",
      tone: (d.missingDocs > 3 ? "attention" : "healthy") as HealthTone,
      note: `${d.missingDocs} auths missing docs — manual coordination dependency.`,
    },
    {
      label: "Reassessment follow-up bandwidth",
      tone: (d.qaStalled > 4 ? "risk" : d.qaStalled > 0 ? "attention" : "healthy") as HealthTone,
      note: "Heavy reliance on a limited reassessment pipeline.",
    },
  ], [d]);

  // Section 6 — escalation & pressure
  const pressure = useMemo(() => [
    { label: "Auth expiry pressure", tone: (d.expiring7 > 0 ? "risk" : d.expiring14 > 5 ? "attention" : "healthy") as HealthTone,
      note: `${d.expiring7} ≤7d · ${d.expiring14} ≤14d · ${d.expiring30} ≤30d.` },
    { label: "QA stall pressure", tone: (d.qaStalled > 5 ? "risk" : d.qaStalled > 0 ? "attention" : "healthy") as HealthTone,
      note: `${d.qaStalled} plans stalled ≥3d.` },
    { label: "Scheduling pressure", tone: (d.uncovered > 5 ? "attention" : "healthy") as HealthTone,
      note: d.coverage !== null ? `${d.coverage}% coverage · ${d.uncovered} uncovered.` : "Coordination stable." },
    { label: "Recruiting pipeline", tone: (d.stalled > 8 ? "attention" : "healthy") as HealthTone,
      note: `${d.candidates} active · ${d.stalled} stalled ≥14d.` },
    { label: "Onboarding throughput", tone: (d.stalled > 10 ? "attention" : "healthy") as HealthTone,
      note: "Throughput tracked through recruiting → HR handoff." },
    { label: "Cancellation trend", tone: (d.cancel7 > 10 ? "attention" : "healthy") as HealthTone,
      note: `${d.cancel7} in 7d · ${d.cancel30} in 30d.` },
  ], [d]);

  // Section 7 — forecasts
  const forecasts = useMemo(() => {
    const out: { horizon: string; tone: HealthTone; line: string }[] = [];
    if (d.stalled > 5 && d.totalNeeds > 3) {
      out.push({ horizon: "2–4 weeks", tone: "attention",
        line: "If recruiting throughput continues softening, regional staffing shortages may intensify." });
    } else {
      out.push({ horizon: "2–4 weeks", tone: "healthy",
        line: "Current recruiting cadence remains sufficient to absorb staffing demand." });
    }
    if (d.qaStalled > 2) {
      out.push({ horizon: "Next QA cycle", tone: "attention",
        line: "Pending reassessment volume may pressure QA timelines if review cadence does not increase." });
    } else {
      out.push({ horizon: "Next QA cycle", tone: "healthy",
        line: "QA review cadence is supporting reassessment volume." });
    }
    if (d.candidates > 0 && d.stalled / Math.max(d.candidates, 1) < 0.2) {
      out.push({ horizon: "30 days", tone: "healthy",
        line: "Onboarding velocity remains sustainable if staffing conversion rates hold." });
    } else {
      out.push({ horizon: "30 days", tone: "attention",
        line: "Onboarding velocity will require monitoring as candidate conversion softens." });
    }
    if (d.overloaded > 2) {
      out.push({ horizon: "30–60 days", tone: "risk",
        line: "BCBA caseload concentration will compound supervision risk if growth continues without redistribution." });
    }
    if (d.cancel7 > 10) {
      out.push({ horizon: "30 days", tone: "attention",
        line: "Sustained cancellation pressure may reduce clinic throughput and complicate scheduling forecasts." });
    }
    return out;
  }, [d]);

  // Section 8 — recommendations
  const recs = useMemo(() => {
    const r: { title: string; note: string }[] = [];
    if (d.stalled > 5 || d.totalNeeds > 4) {
      r.push({ title: "Support recruiting expansion where staffing demand is highest",
        note: "Prioritize regions carrying open needs above pipeline capacity." });
    }
    if (d.qaStalled > 2 || d.expiring14 > 5) {
      r.push({ title: "Monitor QA & reassessment turnaround timing closely",
        note: "Protect reauth readiness against near-term expirations." });
    }
    if (d.overloaded > 1) {
      r.push({ title: "Reduce dependency on a small number of BCBAs",
        note: "Redistribute caseload before adding new clients in affected regions." });
    }
    if (d.stalled > 8) {
      r.push({ title: "Improve onboarding throughput stability",
        note: "Audit pipeline stages where movement is stalling beyond 14 days." });
    }
    if (d.totalNeeds > 6) {
      r.push({ title: "Review staffing readiness before expansion commitments",
        note: "Confirm regional capacity supports planned client growth." });
    }
    if (d.missingDocs > 3 || d.uncovered > 5) {
      r.push({ title: "Reinforce SOP consistency across high-growth states",
        note: "Tighten document and coverage handoffs to prevent workflow drift." });
    }
    if (!r.length) {
      r.push({ title: "Maintain current operational rhythm",
        note: "No proactive interventions required — continue monitoring." });
    }
    return r;
  }, [d]);

  const lastUpdated = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <ExecPage
      title="Strategic Risks"
      subtitle="Predictive operational intelligence across staffing, workflows, scalability, execution stability, and organizational readiness."
    >
      {/* Section 1 — Header */}
      <ExecCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className={`inline-flex size-2.5 rounded-full ${TONE_DOT[overall.tone]}`} />
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Organizational risk posture
              </div>
              <div className="mt-0.5 text-[20px] font-semibold tracking-tight">{overall.label}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-3.5" />
              <span>AI confidence: High</span>
            </div>
            <div>Updated {lastUpdated}</div>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-5">
          {categories.map((c) => (
            <div key={c.id} className="rounded-xl border border-border/60 bg-background/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</span>
                <span className={`inline-flex size-2 rounded-full ${TONE_DOT[c.tone]}`} />
              </div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{c.count}</div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 2 — Executive risk summary */}
      <ExecCard title="Executive risk briefing" hint="AI-interpreted">
        <div className="space-y-2.5">
          {summary.map((line, i) => (
            <p key={i} className="text-[14px] leading-relaxed text-foreground">{line}</p>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="What could break next?" prompt="What operational risks could escalate next if leadership does not intervene?" />
          <AIPrompt label="Forecast 30 days" prompt="Forecast how Blossom's risk posture will look in 30 days if no action is taken" />
          <AIPrompt label="Where to intervene first" prompt="Where should leadership intervene first to reduce strategic risk?" />
        </div>
      </ExecCard>

      {/* Section 3 — Emerging risks grid */}
      <ExecCard title="Emerging risks" hint="Predictive · live">
        <div className="grid gap-2 md:grid-cols-2">
          {risks.map((r) => (
            <div key={r.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <span className={`mt-1.5 inline-flex size-2 rounded-full shrink-0 ${TONE_DOT[r.tone]}`} />
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{r.category}</div>
                    <div className="mt-0.5 text-[14px] font-medium leading-snug">{r.title}</div>
                    <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-relaxed">{r.detail}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <HealthPill tone={r.tone}>{pillLabel(r.tone)}</HealthPill>
                  <TrendIcon trend={r.trend} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span>Impact: <span className="text-foreground/80">{r.impact}</span></span>
                <span>Confidence: <span className="text-foreground/80">{r.confidence}</span></span>
                <span>Window: <span className="text-foreground/80">{r.horizon}</span></span>
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 4 — State risk intelligence */}
      <ExecCard title="State risk intelligence" hint="Active operating states">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {stateRisks.map((r) => (
            <div key={r.state} className="rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold tracking-tight">{r.state}</span>
                <span className={`inline-flex size-2 rounded-full ${TONE_DOT[r.tone]}`} />
              </div>
              <div className="mt-2 text-[12px] text-muted-foreground leading-relaxed">{r.summary}</div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 5 — Operational fragility */}
      <ExecCard title="Operational fragility" hint="Where execution may not scale cleanly">
        <div className="grid gap-2 md:grid-cols-2">
          {fragility.map((f) => (
            <div key={f.label} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{f.label}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{f.note}</div>
              </div>
              <HealthPill tone={f.tone}>{pillLabel(f.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 6 — Escalation & pressure */}
      <ExecCard title="Pressure monitor" hint="Where operational pressure is building">
        <div className="grid gap-2 md:grid-cols-2">
          {pressure.map((p) => (
            <div key={p.label} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`inline-flex size-2 rounded-full ${TONE_DOT[p.tone]}`} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{p.label}</div>
                  <div className="text-[11.5px] text-muted-foreground truncate">{p.note}</div>
                </div>
              </div>
              <HealthPill tone={p.tone}>{pillLabel(p.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 7 — Risk forecasting */}
      <ExecCard title="Risk forecast" hint="What may develop next">
        <div className="space-y-1.5">
          {forecasts.map((f, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
              <span className={`mt-1.5 inline-flex size-2 rounded-full shrink-0 ${TONE_DOT[f.tone]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{f.horizon}</span>
                  <HealthPill tone={f.tone}>{pillLabel(f.tone)}</HealthPill>
                </div>
                <div className="mt-1 text-[13px] text-foreground leading-relaxed">{f.line}</div>
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 8 — Executive recommendations */}
      <ExecCard title="Executive recommendations" hint="Where to focus proactively">
        <div className="space-y-1.5">
          {recs.map((r, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="text-[13px] font-medium">{r.title}</div>
              <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{r.note}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Draft leadership briefing" prompt="Draft a brief leadership note summarizing these strategic risks and recommended actions." />
        </div>
      </ExecCard>
    </ExecPage>
  );
}
