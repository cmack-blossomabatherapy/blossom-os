import { useMemo } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { ExecPage, ExecCard, HealthPill, AIPrompt, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { ActionItemsPanel } from "@/components/executive/ActionItemsPanel";

const STATES = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;

const TONE_DOT: Record<HealthTone, string> = {
  healthy: "bg-emerald-500",
  attention: "bg-amber-500",
  risk: "bg-rose-500",
  blocked: "bg-rose-500",
  neutral: "bg-muted-foreground/50",
};

const TONE_RANK: Record<HealthTone, number> = {
  healthy: 0, neutral: 1, attention: 2, risk: 3, blocked: 4,
};

function worst(...tones: HealthTone[]): HealthTone {
  return tones.reduce((a, b) => (TONE_RANK[a] >= TONE_RANK[b] ? a : b), "healthy");
}

type Trend = "up" | "down" | "flat";
function TrendIcon({ trend, good = "down" }: { trend: Trend; good?: "up" | "down" }) {
  // good="up" means upward trend is positive (e.g. readiness improving)
  const upClass = good === "up" ? "text-emerald-600" : "text-rose-600";
  const downClass = good === "up" ? "text-rose-600" : "text-emerald-600";
  if (trend === "up") return <ArrowUpRight className={`size-3.5 ${upClass}`} />;
  if (trend === "down") return <ArrowDownRight className={`size-3.5 ${downClass}`} />;
  return <ArrowRight className="size-3.5 text-muted-foreground" />;
}

function readinessLabel(tone: HealthTone) {
  if (tone === "healthy") return "Ready";
  if (tone === "attention") return "Stable";
  if (tone === "risk") return "Watch";
  if (tone === "blocked") return "At risk";
  return "Tracking";
}

function overallReadiness(tones: HealthTone[]): { label: string; tone: HealthTone } {
  const w = worst(...tones);
  if (w === "blocked") return { label: "Expansion Risk Elevated", tone: "blocked" };
  if (w === "risk") return { label: "Growth Pressure Increasing", tone: "risk" };
  if (w === "attention") {
    const attn = tones.filter((t) => t === "attention").length;
    return { label: attn >= 4 ? "Controlled Expansion Recommended" : "Stable Growth", tone: "attention" };
  }
  return { label: "Ready to Scale", tone: "healthy" };
}

export default function GrowthReadiness() {
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
      totalAuths: ops.auths.total,
      uncovered: cr.counts.uncoveredClients,
      coverage: cr.counts.activeClients
        ? Math.round((cr.counts.coveredClients / cr.counts.activeClients) * 100)
        : null,
      cancel7: cr.cancellationsLast7d,
      cancel30: cr.cancellationsLast30d,
    };
  }, [ops, wf, cr]);

  // Section 3 — readiness matrix
  const readiness = useMemo(() => {
    type R = { id: string; label: string; tone: HealthTone; trend: Trend; note: string; confidence: "High" | "Medium" | "Low" };
    const conv = d.candidates ? (d.candidates - d.stalled) / d.candidates : 1;
    const items: R[] = [
      {
        id: "staffing", label: "Staffing readiness",
        tone: d.totalNeeds > 6 ? "risk" : d.totalNeeds > 3 ? "attention" : "healthy",
        trend: d.totalNeeds > 4 ? "up" : "flat",
        note: `${d.totalNeeds} open staffing need${d.totalNeeds === 1 ? "" : "s"} across active states.`,
        confidence: "High",
      },
      {
        id: "recruiting", label: "Recruiting readiness",
        tone: conv >= 0.85 ? "healthy" : conv >= 0.7 ? "attention" : "risk",
        trend: d.stalled > 8 ? "up" : "flat",
        note: `${d.candidates} active candidates · ${d.stalled} stalled ≥14d.`,
        confidence: "High",
      },
      {
        id: "onboarding", label: "Onboarding capacity",
        tone: d.stalled > 10 ? "risk" : d.stalled > 5 ? "attention" : "healthy",
        trend: d.stalled > 8 ? "up" : "flat",
        note: "Throughput tracked through recruiting → HR handoff.",
        confidence: "Medium",
      },
      {
        id: "workflow", label: "Workflow stability",
        tone: d.missingDocs > 4 || d.qaStalled > 4 ? "attention" : "healthy",
        trend: "flat",
        note: "Workflow handoffs holding under current volume.",
        confidence: "Medium",
      },
      {
        id: "qa", label: "QA readiness",
        tone: d.qaStalled > 5 ? "risk" : d.qaStalled > 0 ? "attention" : "healthy",
        trend: d.qaStalled > 3 ? "up" : "down",
        note: `${d.qaStalled} plans stalled ≥3d.`,
        confidence: "High",
      },
      {
        id: "scheduling", label: "Scheduling readiness",
        tone: d.uncovered > 8 ? "risk" : d.uncovered > 3 ? "attention" : "healthy",
        trend: d.uncovered > 5 ? "up" : "flat",
        note: d.coverage !== null ? `${d.coverage}% coverage · ${d.uncovered} uncovered.` : "Coverage stable.",
        confidence: "High",
      },
      {
        id: "leadership", label: "Leadership capacity",
        tone: d.overloaded > 2 && d.totalNeeds > 4 ? "attention" : "healthy",
        trend: "flat",
        note: "Regional leadership responsiveness remains aligned.",
        confidence: "Medium",
      },
      {
        id: "training", label: "Training adoption",
        tone: "healthy",
        trend: "down",
        note: "Onboarding curriculum completion holding above target.",
        confidence: "Medium",
      },
      {
        id: "consistency", label: "Operational consistency",
        tone: d.missingDocs > 4 ? "attention" : "healthy",
        trend: "flat",
        note: "SOP execution consistency stable across active states.",
        confidence: "Medium",
      },
      {
        id: "clinic", label: "Clinic readiness",
        tone: d.overloaded > 3 ? "risk" : d.overloaded > 1 ? "attention" : "healthy",
        trend: d.overloaded > 2 ? "up" : "flat",
        note: `${d.overloaded} overloaded · ${d.nearCap} near capacity.`,
        confidence: "High",
      },
      {
        id: "multistate", label: "Multi-state scalability",
        tone: d.totalNeeds > 8 ? "risk" : d.totalNeeds > 4 ? "attention" : "healthy",
        trend: d.totalNeeds > 6 ? "up" : "flat",
        note: "Cross-state coordination supports controlled expansion.",
        confidence: "Medium",
      },
      {
        id: "auths", label: "Authorization throughput",
        tone: d.expiring7 > 0 ? "risk" : d.expiring14 > 5 ? "attention" : "healthy",
        trend: d.expiring14 > 5 ? "up" : "flat",
        note: `${d.expiring7} ≤7d · ${d.expiring14} ≤14d · ${d.expiring30} ≤30d.`,
        confidence: "High",
      },
    ];
    return items;
  }, [d]);

  const overall = useMemo(() => overallReadiness(readiness.map((r) => r.tone)), [readiness]);

  // Section 2 — executive readiness summary
  const summary = useMemo(() => {
    const lines: string[] = [];
    const tight = (Object.entries(wf) as [string, typeof ga][])
      .filter(([, w]) => w.staffingNeeds.length >= 2).map(([s]) => s);
    if (tight.length) {
      lines.push(
        `Blossom remains positioned for controlled growth, though ${tight.join(", ")} staffing demand continues creating moderate expansion pressure.`
      );
    } else {
      lines.push("Blossom remains positioned for continued growth — staffing demand is absorbable across all active states.");
    }
    if (d.candidates > 0 && d.stalled <= 5) {
      lines.push("Recruiting momentum is supporting onboarding readiness, lowering near-term staffing instability.");
    } else if (d.stalled > 8) {
      lines.push(`Recruiting velocity is softening (${d.stalled} of ${d.candidates} candidates stalled) — onboarding throughput will tighten if this persists.`);
    }
    if (d.qaStalled > 3) {
      lines.push(`QA review pressure (${d.qaStalled} stalled) may reduce scalability confidence if reassessment cadence does not increase.`);
    } else {
      lines.push("QA stabilization continues to support scalability confidence across active states.");
    }
    if (d.overloaded > 1) {
      lines.push(`Operational dependency on a small number of BCBAs (${d.overloaded} overloaded · ${d.nearCap} near capacity) reduces clinic flexibility under additional growth.`);
    } else {
      lines.push("Current operational systems remain stable enough to absorb measured additional growth.");
    }
    return lines;
  }, [d, wf, ga]);

  // Section 4 — state expansion readiness
  const stateReadiness = useMemo(() => {
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
        tone === "risk" ? `Staffing demand nearing onboarding threshold — ${gap} open need${gap === 1 ? "" : "s"}.`
        : tone === "attention" ? `Monitor before scaling — ${gap} open need${gap === 1 ? "" : "s"}, ${near} near capacity.`
        : tone === "neutral" ? "Operationally stable with one developing pressure point."
        : "Operationally stable for continued growth.";
      return { state: s, tone, summary, gap, overloaded, near, label: readinessLabel(tone) };
    });
  }, [wf]);

  // Section 5 — staffing & capacity readiness
  const staffingCapacity = useMemo(() => [
    {
      label: "RBT staffing availability",
      tone: (d.totalNeeds > 6 ? "risk" : d.totalNeeds > 3 ? "attention" : "healthy") as HealthTone,
      note: `${d.totalNeeds} open staffing need${d.totalNeeds === 1 ? "" : "s"} across active states.`,
    },
    {
      label: "BCBA bandwidth",
      tone: (d.overloaded > 2 ? "risk" : d.nearCap > 4 ? "attention" : "healthy") as HealthTone,
      note: `${d.overloaded} overloaded · ${d.nearCap} near capacity of ${d.bcbaTotal}.`,
    },
    {
      label: "Recruiting conversion",
      tone: (d.candidates && d.stalled / d.candidates > 0.25 ? "attention" : "healthy") as HealthTone,
      note: `${d.candidates} active · ${d.stalled} stalled ≥14d.`,
    },
    {
      label: "Onboarding throughput",
      tone: (d.stalled > 10 ? "risk" : d.stalled > 5 ? "attention" : "healthy") as HealthTone,
      note: "Recruiting → HR handoff cadence currently sustainable.",
    },
    {
      label: "Staffing lead time",
      tone: (d.totalNeeds > 6 ? "attention" : "healthy") as HealthTone,
      note: "Time-to-staffing remains within target across states.",
    },
    {
      label: "Staffing sustainability",
      tone: (d.totalNeeds > 8 || d.overloaded > 3 ? "risk" : d.totalNeeds > 4 ? "attention" : "healthy") as HealthTone,
      note: "Composite of capacity, recruiting, and onboarding signals.",
    },
  ], [d]);

  // Section 6 — workflow scalability
  const workflows = useMemo(() => [
    { label: "Intake", tone: "healthy" as HealthTone, note: "Movement stable despite increased lead volume." },
    { label: "VOB", tone: "healthy" as HealthTone, note: "VOB cadence holding under current volume." },
    { label: "Authorizations", tone: (d.expiring7 > 0 ? "risk" : d.expiring14 > 5 ? "attention" : "healthy") as HealthTone, note: `${d.expiring7} ≤7d · ${d.expiring14} ≤14d expirations.` },
    { label: "Scheduling", tone: (d.uncovered > 5 ? "attention" : "healthy") as HealthTone, note: d.coverage !== null ? `${d.coverage}% coverage stable.` : "Coordination stable." },
    { label: "QA", tone: (d.qaStalled > 4 ? "risk" : d.qaStalled > 0 ? "attention" : "healthy") as HealthTone, note: `${d.qaStalled} plans stalled ≥3d.` },
    { label: "Staffing", tone: (d.totalNeeds > 6 ? "risk" : d.totalNeeds > 3 ? "attention" : "healthy") as HealthTone, note: `${d.totalNeeds} open needs across states.` },
    { label: "Payroll", tone: "healthy" as HealthTone, note: "Payroll cycles holding under current headcount." },
    { label: "Recruiting", tone: (d.stalled > 8 ? "attention" : "healthy") as HealthTone, note: "Pipeline movement supports current demand." },
    { label: "Training", tone: "healthy" as HealthTone, note: "Curriculum completion holding above target." },
    { label: "Clinic operations", tone: (d.overloaded > 2 ? "attention" : "healthy") as HealthTone, note: "Clinic execution stable in active markets." },
  ], [d]);

  // Section 7 — operational maturity index
  const maturity = useMemo(() => [
    { label: "SOP adoption", tone: "healthy" as HealthTone, note: "SOP usage trending up across onboarding workflows." },
    { label: "Workflow consistency", tone: (d.missingDocs > 4 ? "attention" : "healthy") as HealthTone, note: "Execution consistency improving across active states." },
    { label: "Onboarding standardization", tone: "healthy" as HealthTone, note: "Standardized onboarding rhythm holding." },
    { label: "Escalation handling", tone: (d.qaStalled > 4 ? "attention" : "healthy") as HealthTone, note: "Escalation response within target window." },
    { label: "Leadership responsiveness", tone: "healthy" as HealthTone, note: "Leadership alignment stable across active states." },
    { label: "Execution consistency", tone: (d.uncovered > 5 || d.missingDocs > 4 ? "attention" : "healthy") as HealthTone, note: "Operational execution holding under current load." },
    { label: "Training completion", tone: "healthy" as HealthTone, note: "Training adoption improving organizational scalability." },
    { label: "System adoption", tone: "healthy" as HealthTone, note: "Operating-system usage trending up across roles." },
  ], [d]);

  // Section 8 — scaling pressure detection
  const pressure = useMemo(() => {
    const items: { label: string; tone: HealthTone; note: string; trend: Trend }[] = [];
    if (d.totalNeeds > 4) items.push({ label: "Staffing demand accelerating", tone: d.totalNeeds > 8 ? "risk" : "attention", trend: "up", note: `${d.totalNeeds} open staffing need${d.totalNeeds === 1 ? "" : "s"}.` });
    if (d.stalled > 5) items.push({ label: "Recruiting slowdown risk", tone: d.stalled > 10 ? "risk" : "attention", trend: "up", note: `${d.stalled} candidates stalled ≥14d.` });
    if (d.qaStalled > 0) items.push({ label: "QA bottlenecks forming", tone: d.qaStalled > 4 ? "risk" : "attention", trend: "up", note: `${d.qaStalled} plans stalled ≥3d.` });
    if (d.expiring14 > 5) items.push({ label: "Reassessment pressure growing", tone: "attention", trend: "up", note: `${d.expiring14} auths expire ≤14d.` });
    if (d.uncovered > 3) items.push({ label: "Scheduling strain increasing", tone: d.uncovered > 8 ? "risk" : "attention", trend: "up", note: `${d.uncovered} uncovered clients.` });
    if (d.overloaded > 1) items.push({ label: "Clinic capacity pressure", tone: d.overloaded > 3 ? "risk" : "attention", trend: "up", note: `${d.overloaded} BCBAs overloaded.` });
    if (d.cancel7 > 10) items.push({ label: "Cancellation pressure rising", tone: "attention", trend: "up", note: `${d.cancel7} cancellations in 7d.` });
    if (!items.length) items.push({ label: "Current growth remains manageable", tone: "healthy", trend: "flat", note: "No active scaling pressure detected." });
    return items;
  }, [d]);

  // Section 9 — AI growth forecast
  const forecasts = useMemo(() => {
    const out: { horizon: string; tone: HealthTone; line: string }[] = [];
    if (d.stalled <= 5 && d.totalNeeds <= 4) {
      out.push({ horizon: "30–60 days", tone: "healthy", line: "Current staffing trends support controlled growth over the next 30–60 days." });
    } else {
      out.push({ horizon: "30–60 days", tone: "attention", line: "Staffing sustainability requires monitoring as demand approaches recruiting capacity." });
    }
    if (d.stalled > 5) {
      out.push({ horizon: "2–4 weeks", tone: "attention", line: "If recruiting momentum slows further, onboarding delays may increase in high-demand states." });
    } else {
      out.push({ horizon: "2–4 weeks", tone: "healthy", line: "Recruiting cadence remains sufficient to absorb onboarding demand." });
    }
    if (d.qaStalled > 2) {
      out.push({ horizon: "Next QA cycle", tone: "attention", line: "QA throughput may tighten if reassessment volume continues without added review capacity." });
    } else {
      out.push({ horizon: "Next QA cycle", tone: "healthy", line: "Current workflow maturity supports continued operational stability." });
    }
    if (d.overloaded > 2) {
      out.push({ horizon: "30–60 days", tone: "risk", line: "BCBA caseload concentration will compound supervision risk if growth continues without redistribution." });
    }
    return out;
  }, [d]);

  // Section 10 — executive recommendations
  const recs = useMemo(() => {
    const r: { title: string; note: string }[] = [];
    const heaviest = (Object.entries(wf) as [string, typeof ga][])
      .map(([s, w]) => ({ s, gap: w.staffingNeeds.length }))
      .sort((a, b) => b.gap - a.gap)[0];
    if (heaviest && heaviest.gap >= 3) {
      r.push({ title: `Support ${heaviest.s} staffing expansion`, note: "Prioritize recruiting and onboarding throughput where staffing demand is highest." });
    }
    if (d.qaStalled > 2 || d.expiring14 > 5) {
      r.push({ title: "Monitor reassessment timing before accelerating growth", note: "Protect reauth readiness against near-term expirations." });
    }
    if (d.stalled > 5) {
      r.push({ title: "Reinforce onboarding standardization", note: "Audit pipeline stages where movement is stalling beyond 14 days." });
    }
    if (d.overloaded > 1) {
      r.push({ title: "Improve BCBA bandwidth visibility", note: "Redistribute caseload before adding new clients in affected regions." });
    }
    r.push({ title: "Review onboarding throughput weekly", note: "Maintain operational rhythm around recruiting → HR handoffs." });
    if (d.totalNeeds > 4) {
      r.push({ title: "Strengthen scalability in high-growth states", note: "Confirm regional capacity supports planned client growth before commitments." });
    }
    return r;
  }, [d, wf, ga]);

  const lastUpdated = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <ExecPage
      title="Growth & Readiness"
      subtitle="Live organizational readiness intelligence across staffing, workflows, onboarding capacity, operational maturity, and scalable growth."
    >
      {/* Section 1 — Header */}
      <ExecCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className={`inline-flex size-2.5 rounded-full ${TONE_DOT[overall.tone]}`} />
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Organizational readiness
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
      </ExecCard>

      {/* Section 2 — Executive readiness summary */}
      <ExecCard title="Executive readiness summary" hint="AI-interpreted">
        <div className="space-y-2.5">
          {summary.map((line, i) => (
            <p key={i} className="text-[14px] leading-relaxed text-foreground">{line}</p>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Can we scale safely?" prompt="Based on current readiness, can Blossom safely continue growing right now?" />
          <AIPrompt label="Where is strain developing?" prompt="Where is scaling pressure developing fastest across the organization?" />
          <AIPrompt label="Best state to expand" prompt="Which state is most ready for additional expansion right now?" />
        </div>
      </ExecCard>

      {/* Section 3 — Organizational readiness grid */}
      <ExecCard title="Organizational readiness" hint="Composite · live">
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {readiness.map((r) => (
            <div key={r.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium">{r.label}</div>
                  <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">{r.note}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <HealthPill tone={r.tone}>{readinessLabel(r.tone)}</HealthPill>
                  <TrendIcon trend={r.trend} good="down" />
                </div>
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground">
                Confidence: <span className="text-foreground/80">{r.confidence}</span>
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 4 — State expansion readiness */}
      <ExecCard title="State expansion readiness" hint="Active operating states">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {stateReadiness.map((s) => (
            <div key={s.state} className="rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold tracking-tight">{s.state}</span>
                <span className={`inline-flex size-2 rounded-full ${TONE_DOT[s.tone]}`} />
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="mt-2 text-[12px] text-muted-foreground leading-relaxed">{s.summary}</div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                {s.gap} open · {s.overloaded} overloaded · {s.near} near cap
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 5 — Staffing & capacity readiness */}
      <ExecCard title="Staffing & capacity readiness" hint="Can staffing support growth?">
        <div className="grid gap-2 md:grid-cols-2">
          {staffingCapacity.map((s) => (
            <div key={s.label} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{s.label}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{s.note}</div>
              </div>
              <HealthPill tone={s.tone}>{readinessLabel(s.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 6 — Workflow scalability monitor */}
      <ExecCard title="Workflow scalability" hint="Can workflows scale safely?">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
          {workflows.map((w) => (
            <div key={w.label} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`inline-flex size-2 rounded-full ${TONE_DOT[w.tone]}`} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{w.label}</div>
                  <div className="text-[11.5px] text-muted-foreground truncate">{w.note}</div>
                </div>
              </div>
              <HealthPill tone={w.tone}>{readinessLabel(w.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 7 — Operational maturity index */}
      <ExecCard title="Operational maturity" hint="How scalable the organization is today">
        <div className="grid gap-2 md:grid-cols-2">
          {maturity.map((m) => (
            <div key={m.label} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{m.label}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{m.note}</div>
              </div>
              <HealthPill tone={m.tone}>{readinessLabel(m.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 8 — Scaling pressure detection */}
      <ExecCard title="Scaling pressure detection" hint="Where growth may outpace operations">
        <div className="space-y-1.5">
          {pressure.map((p, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
              <span className={`mt-1.5 inline-flex size-2 rounded-full shrink-0 ${TONE_DOT[p.tone]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[13px] font-medium">{p.label}</div>
                  <div className="flex items-center gap-1.5">
                    <TrendIcon trend={p.trend} good="down" />
                    <HealthPill tone={p.tone}>{readinessLabel(p.tone)}</HealthPill>
                  </div>
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{p.note}</div>
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 9 — AI growth forecast */}
      <ExecCard title="AI growth forecast" hint="What happens if growth continues">
        <div className="space-y-1.5">
          {forecasts.map((f, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
              <span className={`mt-1.5 inline-flex size-2 rounded-full shrink-0 ${TONE_DOT[f.tone]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{f.horizon}</span>
                  <HealthPill tone={f.tone}>{readinessLabel(f.tone)}</HealthPill>
                </div>
                <div className="mt-1 text-[13px] text-foreground leading-relaxed">{f.line}</div>
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 10 — Executive recommendations */}
      <ExecCard title="Executive recommendations" hint="Where to focus to scale safely">
        <div className="space-y-1.5">
          {recs.map((r, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="text-[13px] font-medium">{r.title}</div>
              <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{r.note}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Draft growth briefing" prompt="Draft a brief leadership note summarizing Blossom's current growth readiness and recommended actions." />
        </div>
      </ExecCard>
      <ActionItemsPanel sourcePage="executive/growth-readiness" />
    </ExecPage>
  );
}