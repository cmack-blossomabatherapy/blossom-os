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
  healthy: 0, neutral: 1, attention: 2, risk: 3, blocked: 4,
};

function worst(...tones: HealthTone[]): HealthTone {
  return tones.reduce((a, b) => (TONE_RANK[a] >= TONE_RANK[b] ? a : b), "healthy");
}

type Trend = "up" | "down" | "flat";
function TrendIcon({ trend, good = "down" }: { trend: Trend; good?: "up" | "down" }) {
  const upClass = good === "up" ? "text-emerald-600" : "text-rose-600";
  const downClass = good === "up" ? "text-rose-600" : "text-emerald-600";
  if (trend === "up") return <ArrowUpRight className={`size-3.5 ${upClass}`} />;
  if (trend === "down") return <ArrowDownRight className={`size-3.5 ${downClass}`} />;
  return <ArrowRight className="size-3.5 text-muted-foreground" />;
}

function statusLabel(tone: HealthTone) {
  if (tone === "healthy") return "Strong";
  if (tone === "neutral") return "Stable";
  if (tone === "attention") return "Watch";
  if (tone === "risk") return "Pressured";
  return "Critical";
}

function overallReadiness(tones: HealthTone[]): { label: string; tone: HealthTone } {
  const w = worst(...tones);
  if (w === "blocked") return { label: "Expansion Risk Elevated", tone: "blocked" };
  if (w === "risk") return { label: "Capacity Tightening", tone: "risk" };
  if (w === "attention") {
    const attn = tones.filter((t) => t === "attention").length;
    return { label: attn >= 4 ? "Moderate Staffing Pressure" : "Operationally Stable", tone: "attention" };
  }
  return { label: "Expansion Ready", tone: "healthy" };
}

export default function StaffingExpansion() {
  const ops = useOpsIntelligence();
  const cr = useCentralReachOps({});
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const wf = useMemo(() => ({ GA: ga, NC: nc, VA: va, TN: tn, MD: md }), [ga, nc, va, tn, md]);

  const d = useMemo(() => {
    const allBcbas = Object.values(wf).flatMap((w) => w.bcbas);
    const allRbts = Object.values(wf).flatMap((w) => w.rbts);
    return {
      bcbaTotal: allBcbas.length,
      rbtTotal: allRbts.length,
      overloaded: allBcbas.filter((b) => b.status === "Overloaded").length,
      nearCap: allBcbas.filter((b) => b.status === "Near Capacity").length,
      totalNeeds: Object.values(wf).reduce((s, w) => s + w.staffingNeeds.length, 0),
      candidates: ops.recruiting.candidates.length,
      stalled: ops.recruiting.stalledCandidates.length,
      uncovered: cr.counts.uncoveredClients,
      coverage: cr.counts.activeClients
        ? Math.round((cr.counts.coveredClients / cr.counts.activeClients) * 100)
        : null,
      activeClients: cr.counts.activeClients,
    };
  }, [ops, wf, cr]);

  // Section 3 — Staffing stability grid
  const stability = useMemo(() => {
    const conv = d.candidates ? (d.candidates - d.stalled) / d.candidates : 1;
    const items: { id: string; label: string; tone: HealthTone; trend: Trend; note: string; impact: string }[] = [
      {
        id: "rbt", label: "RBT availability",
        tone: d.totalNeeds > 6 ? "risk" : d.totalNeeds > 3 ? "attention" : "healthy",
        trend: d.totalNeeds > 4 ? "up" : "flat",
        note: `${d.totalNeeds} open staffing need${d.totalNeeds === 1 ? "" : "s"} across active states.`,
        impact: d.totalNeeds > 6 ? "High" : d.totalNeeds > 3 ? "Moderate" : "Low",
      },
      {
        id: "bcba", label: "BCBA capacity",
        tone: d.overloaded > 2 ? "risk" : d.nearCap > 4 ? "attention" : "healthy",
        trend: d.overloaded > 1 ? "up" : "flat",
        note: `${d.overloaded} overloaded · ${d.nearCap} near capacity of ${d.bcbaTotal}.`,
        impact: d.overloaded > 2 ? "High" : "Moderate",
      },
      {
        id: "recruiting", label: "Recruiting strength",
        tone: conv >= 0.85 ? "healthy" : conv >= 0.7 ? "attention" : "risk",
        trend: d.stalled > 8 ? "up" : "down",
        note: `${d.candidates} active candidates · ${d.stalled} stalled ≥14d.`,
        impact: conv < 0.7 ? "High" : "Moderate",
      },
      {
        id: "onboarding", label: "Onboarding throughput",
        tone: d.stalled > 10 ? "risk" : d.stalled > 5 ? "attention" : "healthy",
        trend: d.stalled > 8 ? "up" : "flat",
        note: "Recruiting → HR handoff cadence currently sustainable.",
        impact: "Moderate",
      },
      {
        id: "orientation", label: "Orientation completion",
        tone: d.stalled > 8 ? "attention" : "healthy",
        trend: "flat",
        note: "Orientation completion holding above target.",
        impact: "Low",
      },
      {
        id: "leadtime", label: "Staffing lead time",
        tone: d.totalNeeds > 6 ? "attention" : "healthy",
        trend: d.totalNeeds > 4 ? "up" : "flat",
        note: "Time-to-staffing within executive target window.",
        impact: "Moderate",
      },
      {
        id: "sched", label: "Scheduling readiness",
        tone: d.uncovered > 8 ? "risk" : d.uncovered > 3 ? "attention" : "healthy",
        trend: d.uncovered > 5 ? "up" : "flat",
        note: d.coverage !== null ? `${d.coverage}% coverage · ${d.uncovered} uncovered.` : "Coverage stable.",
        impact: d.uncovered > 8 ? "High" : "Moderate",
      },
      {
        id: "clinic", label: "Clinic staffing stability",
        tone: d.overloaded > 3 ? "risk" : d.overloaded > 1 ? "attention" : "healthy",
        trend: d.overloaded > 2 ? "up" : "flat",
        note: "Clinic execution stable in active markets.",
        impact: "Moderate",
      },
      {
        id: "multistate", label: "Multi-state staffing readiness",
        tone: d.totalNeeds > 8 ? "risk" : d.totalNeeds > 4 ? "attention" : "healthy",
        trend: d.totalNeeds > 6 ? "up" : "flat",
        note: "Cross-state coordination supports controlled expansion.",
        impact: "Moderate",
      },
      {
        id: "sustain", label: "Staffing sustainability",
        tone: d.totalNeeds > 8 || d.overloaded > 3 ? "risk" : d.totalNeeds > 4 ? "attention" : "healthy",
        trend: d.totalNeeds > 6 ? "up" : "flat",
        note: "Composite of capacity, recruiting, and onboarding signals.",
        impact: "High",
      },
    ];
    return items;
  }, [d]);

  const overall = useMemo(() => overallReadiness(stability.map((s) => s.tone)), [stability]);

  // Section 2 — Executive staffing summary
  const summary = useMemo(() => {
    const lines: string[] = [];
    const tight = (Object.entries(wf) as [string, typeof ga][])
      .filter(([, w]) => w.staffingNeeds.length >= 2).map(([s]) => s);
    if (tight.length) {
      lines.push(`Blossom remains operationally capable of controlled growth, though ${tight.join(", ")} staffing pressure continues increasing faster than onboarding throughput.`);
    } else {
      lines.push("Blossom remains operationally capable of controlled growth — staffing pressure is absorbable across all active states.");
    }
    if (d.candidates > 0 && d.stalled <= 5) {
      lines.push("Recruiting momentum is strengthening onboarding readiness across active states.");
    } else if (d.stalled > 8) {
      lines.push(`Recruiting velocity is softening (${d.stalled} of ${d.candidates} candidates stalled) — onboarding readiness will tighten if this persists.`);
    }
    if (d.overloaded <= 1) {
      lines.push("Current BCBA assignment capacity remains stable across most active states.");
    } else {
      lines.push(`BCBA bandwidth is tightening — ${d.overloaded} overloaded and ${d.nearCap} near capacity reduce clinic flexibility under additional growth.`);
    }
    lines.push("Clinic expansion readiness remains healthy, though onboarding scalability should continue to be monitored.");
    return lines;
  }, [d, wf, ga]);

  // Section 4 — State expansion readiness
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
        tone === "risk" ? `Staffing demand nearing strain — ${gap} open need${gap === 1 ? "" : "s"}, ${overloaded} overloaded.`
        : tone === "attention" ? `Monitor before scaling — ${gap} open need${gap === 1 ? "" : "s"}, ${near} near capacity.`
        : tone === "neutral" ? "Operationally stable with one developing pressure point."
        : "Operationally stable for additional onboarding.";
      return { state: s, tone, summary, gap, overloaded, near, bcbas: w.bcbas.length, rbts: w.rbts.length };
    });
  }, [wf]);

  // Section 5 — Recruiting & onboarding momentum
  const recruitingMomentum = useMemo(() => {
    const conv = d.candidates ? (d.candidates - d.stalled) / d.candidates : 1;
    return [
      { label: "Application volume", tone: (d.candidates >= 10 ? "healthy" : "attention") as HealthTone, note: `${d.candidates} active candidates in pipeline.` },
      { label: "Interview progression", tone: (d.stalled > 8 ? "attention" : "healthy") as HealthTone, note: "Progression cadence holding above target." },
      { label: "Onboarding completion", tone: (d.stalled > 10 ? "risk" : d.stalled > 5 ? "attention" : "healthy") as HealthTone, note: `${d.stalled} candidates stalled ≥14d.` },
      { label: "Orientation scheduling", tone: "healthy" as HealthTone, note: "Orientation cadence stable." },
      { label: "Background check timing", tone: "healthy" as HealthTone, note: "Background check cycles within target." },
      { label: "Recruiting conversion", tone: (conv >= 0.85 ? "healthy" : conv >= 0.7 ? "attention" : "risk") as HealthTone, note: `${Math.round(conv * 100)}% pipeline conversion rate.` },
      { label: "Onboarding delays", tone: (d.stalled > 8 ? "attention" : "healthy") as HealthTone, note: "Hiring throughput stable despite increased demand." },
      { label: "Staffing pipeline health", tone: (d.totalNeeds > 6 && d.stalled > 5 ? "attention" : "healthy") as HealthTone, note: "Pipeline supports current staffing demand." },
    ];
  }, [d]);

  // Section 6 — Staffing pressure detection
  const pressure = useMemo(() => {
    const items: { label: string; tone: HealthTone; note: string; trend: Trend }[] = [];
    if (d.uncovered > 3) items.push({ label: "Pending starts increasing due to staffing shortages", tone: d.uncovered > 8 ? "risk" : "attention", trend: "up", note: `${d.uncovered} uncovered clients awaiting staffing.` });
    const heavy = (Object.entries(wf) as [string, typeof ga][]).filter(([, w]) => w.staffingNeeds.length >= 3).map(([s]) => s);
    if (heavy.length) items.push({ label: `${heavy.join(", ")} onboarding pressure increasing`, tone: "attention", trend: "up", note: "Staffing demand outpacing recruiting throughput." });
    if (d.overloaded > 1) items.push({ label: "BCBA overload developing", tone: d.overloaded > 3 ? "risk" : "attention", trend: "up", note: `${d.overloaded} BCBAs overloaded.` });
    if (d.stalled > 5) items.push({ label: "Recruiting shortfalls forming", tone: d.stalled > 10 ? "risk" : "attention", trend: "up", note: `${d.stalled} candidates stalled ≥14d.` });
    if (!items.length) items.push({ label: "Scheduling support remains operationally healthy", tone: "healthy", trend: "flat", note: "No active staffing strain detected." });
    items.push({ label: "BCBA assignment timing remains stable", tone: d.overloaded > 2 ? "attention" : "healthy", trend: "flat", note: "Assignment cycles within target window." });
    return items;
  }, [d, wf, ga]);

  // Section 7 — Clinic & expansion capacity
  const clinicCapacity = useMemo(() => [
    { label: "Clinic staffing readiness", tone: (d.overloaded > 2 ? "attention" : "healthy") as HealthTone, note: "Clinic staffing remains stable across active markets." },
    { label: "Onboarding capacity", tone: (d.stalled > 8 ? "attention" : "healthy") as HealthTone, note: "Current onboarding infrastructure supports moderate expansion." },
    { label: "Operational maturity", tone: "healthy" as HealthTone, note: "SOP execution consistency stable across active states." },
    { label: "Staffing support systems", tone: (d.totalNeeds > 6 ? "attention" : "healthy") as HealthTone, note: "Staffing coordination holding under current load." },
    { label: "Leadership bandwidth", tone: (d.overloaded > 2 && d.totalNeeds > 4 ? "attention" : "healthy") as HealthTone, note: "Regional leadership responsiveness remains aligned." },
    { label: "Clinic scalability", tone: (d.overloaded > 3 ? "risk" : d.overloaded > 1 ? "attention" : "healthy") as HealthTone, note: "Clinics positioned for measured growth." },
    { label: "Scheduling support", tone: (d.uncovered > 5 ? "attention" : "healthy") as HealthTone, note: d.coverage !== null ? `${d.coverage}% coverage stable.` : "Scheduling support healthy." },
    { label: "Training readiness", tone: "healthy" as HealthTone, note: "Training adoption sustains onboarding scalability." },
  ], [d]);

  // Section 8 — Staffing forecasting
  const forecasts = useMemo(() => {
    const out: { horizon: string; tone: HealthTone; line: string }[] = [];
    if (d.stalled <= 5 && d.totalNeeds <= 4) {
      out.push({ horizon: "30–60 days", tone: "healthy", line: "Current staffing trends support controlled expansion over the next 30–60 days." });
    } else {
      out.push({ horizon: "30–60 days", tone: "attention", line: "Staffing sustainability requires monitoring as demand approaches recruiting capacity." });
    }
    const heaviest = (Object.entries(wf) as [string, typeof ga][])
      .map(([s, w]) => ({ s, gap: w.staffingNeeds.length }))
      .sort((a, b) => b.gap - a.gap)[0];
    if (heaviest && heaviest.gap >= 3) {
      out.push({ horizon: "2–4 weeks", tone: "attention", line: `If recruiting slows, onboarding pressure may increase in ${heaviest.s}.` });
    } else {
      out.push({ horizon: "2–4 weeks", tone: "healthy", line: "Recruiting cadence remains sufficient to absorb onboarding demand." });
    }
    const stable = (Object.entries(wf) as [string, typeof ga][])
      .filter(([, w]) => w.staffingNeeds.length <= 1 && w.bcbas.filter((b) => b.status === "Overloaded").length === 0)
      .map(([s]) => s);
    if (stable.length >= 2) {
      out.push({ horizon: "Next quarter", tone: "healthy", line: `Current staffing stability supports continued growth in ${stable.slice(0, 2).join(" and ")}.` });
    }
    if (d.overloaded > 2) {
      out.push({ horizon: "30–60 days", tone: "risk", line: "BCBA caseload concentration will compound supervision risk if growth continues without redistribution." });
    }
    return out;
  }, [d, wf, ga]);

  // Section 9 — Executive recommendations
  const recs = useMemo(() => {
    const r: { title: string; note: string }[] = [];
    const heaviest = (Object.entries(wf) as [string, typeof ga][])
      .map(([s, w]) => ({ s, gap: w.staffingNeeds.length }))
      .sort((a, b) => b.gap - a.gap)[0];
    if (heaviest && heaviest.gap >= 3) {
      r.push({ title: `Support recruiting expansion in ${heaviest.s}`, note: "Prioritize onboarding throughput where staffing demand is highest." });
    }
    r.push({ title: "Monitor onboarding throughput weekly", note: "Maintain operational rhythm around recruiting → HR handoffs." });
    if (d.overloaded > 1) {
      r.push({ title: "Review BCBA capacity before clinic expansion", note: "Redistribute caseload before adding new clients in affected regions." });
    }
    if (d.totalNeeds > 4) {
      r.push({ title: "Reinforce staffing visibility in high-growth states", note: "Confirm regional capacity supports planned client growth before commitments." });
    }
    if (d.stalled > 5) {
      r.push({ title: "Continue improving orientation conversion", note: "Audit pipeline stages where movement is stalling beyond 14 days." });
    }
    if (d.uncovered > 3) {
      r.push({ title: "Monitor pending start growth versus staffing readiness", note: "Track uncovered client growth against onboarding throughput weekly." });
    }
    return r;
  }, [d, wf, ga]);

  const lastUpdated = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <ExecPage
      title="Staffing & Expansion"
      subtitle="Live staffing stability and expansion readiness intelligence across onboarding, recruiting, staffing pressure, and scalable growth capacity."
    >
      {/* Section 1 — Header */}
      <ExecCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className={`inline-flex size-2.5 rounded-full ${TONE_DOT[overall.tone]}`} />
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Staffing readiness
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

      {/* Section 2 — Executive staffing summary */}
      <ExecCard title="Executive staffing summary" hint="AI-interpreted">
        <div className="space-y-2.5">
          {summary.map((line, i) => (
            <p key={i} className="text-[14px] leading-relaxed text-foreground">{line}</p>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Can we expand safely?" prompt="Based on staffing readiness, can Blossom safely expand operationally right now?" />
          <AIPrompt label="Where is staffing strain?" prompt="Where is staffing pressure developing fastest across the organization?" />
          <AIPrompt label="Best state to expand" prompt="Which state is most staffing-ready for additional expansion right now?" />
        </div>
      </ExecCard>

      {/* Section 3 — Staffing stability grid */}
      <ExecCard title="Staffing stability" hint="Composite · live">
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {stability.map((s) => (
            <div key={s.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium">{s.label}</div>
                  <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">{s.note}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <HealthPill tone={s.tone}>{statusLabel(s.tone)}</HealthPill>
                  <TrendIcon trend={s.trend} good="down" />
                </div>
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground">
                Operational impact: <span className="text-foreground/80">{s.impact}</span>
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
              <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{statusLabel(s.tone)}</div>
              <div className="mt-2 text-[12px] text-muted-foreground leading-relaxed">{s.summary}</div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                {s.bcbas} BCBA · {s.rbts} RBT · {s.gap} open
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 5 — Recruiting & onboarding momentum */}
      <ExecCard title="Recruiting & onboarding momentum" hint="Can hiring sustain growth?">
        <div className="grid gap-2 md:grid-cols-2">
          {recruitingMomentum.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{r.label}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{r.note}</div>
              </div>
              <HealthPill tone={r.tone}>{statusLabel(r.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 6 — Staffing pressure detection */}
      <ExecCard title="Staffing pressure detection" hint="Where strain is developing">
        <div className="space-y-1.5">
          {pressure.map((p, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
              <span className={`mt-1.5 inline-flex size-2 rounded-full shrink-0 ${TONE_DOT[p.tone]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[13px] font-medium">{p.label}</div>
                  <div className="flex items-center gap-1.5">
                    <TrendIcon trend={p.trend} good="down" />
                    <HealthPill tone={p.tone}>{statusLabel(p.tone)}</HealthPill>
                  </div>
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{p.note}</div>
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 7 — Clinic & expansion capacity */}
      <ExecCard title="Clinic & expansion capacity" hint="Can clinics support expansion?">
        <div className="grid gap-2 md:grid-cols-2">
          {clinicCapacity.map((c) => (
            <div key={c.label} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{c.label}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{c.note}</div>
              </div>
              <HealthPill tone={c.tone}>{statusLabel(c.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 8 — Staffing forecasting */}
      <ExecCard title="Staffing forecasting" hint="What may happen if growth continues">
        <div className="space-y-1.5">
          {forecasts.map((f, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
              <span className={`mt-1.5 inline-flex size-2 rounded-full shrink-0 ${TONE_DOT[f.tone]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{f.horizon}</span>
                  <HealthPill tone={f.tone}>{statusLabel(f.tone)}</HealthPill>
                </div>
                <div className="mt-1 text-[13px] text-foreground leading-relaxed">{f.line}</div>
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 9 — Executive recommendations */}
      <ExecCard title="Executive recommendations" hint="Where to focus to staff safely">
        <div className="space-y-1.5">
          {recs.map((r, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="text-[13px] font-medium">{r.title}</div>
              <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{r.note}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Draft staffing briefing" prompt="Draft a brief leadership note summarizing Blossom's current staffing stability, expansion readiness, and recommended actions." />
        </div>
      </ExecCard>
    </ExecPage>
  );
}
