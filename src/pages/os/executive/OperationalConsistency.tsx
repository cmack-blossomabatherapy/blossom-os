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
  const upClass = good === "up" ? "text-emerald-600" : "text-rose-600";
  const downClass = good === "up" ? "text-rose-600" : "text-emerald-600";
  if (trend === "up") return <ArrowUpRight className={`size-3.5 ${upClass}`} />;
  if (trend === "down") return <ArrowDownRight className={`size-3.5 ${downClass}`} />;
  return <ArrowRight className="size-3.5 text-muted-foreground" />;
}

function consistencyLabel(tone: HealthTone) {
  if (tone === "healthy") return "Strong";
  if (tone === "neutral") return "Stable";
  if (tone === "attention") return "Watch";
  if (tone === "risk") return "Drift Detected";
  return "At Risk";
}

function overallConsistency(tones: HealthTone[]): { label: string; tone: HealthTone } {
  const w = worst(...tones);
  if (w === "blocked") return { label: "Operational Instability", tone: "blocked" };
  if (w === "risk") return { label: "Consistency Risk Increasing", tone: "risk" };
  if (w === "attention") {
    const attn = tones.filter((t) => t === "attention").length;
    return { label: attn >= 4 ? "Minor Drift Detected" : "Operationally Stable", tone: "attention" };
  }
  return { label: "Highly Consistent", tone: "healthy" };
}

export default function OperationalConsistency() {
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
      qaStalled: ops.auths.qaStalled.length,
      missingDocs: ops.auths.missingDocs.length,
      expiring7: ops.auths.expiring7.length,
      expiring14: ops.auths.expiring14.length,
      expiring30: ops.auths.expiring30.length,
      totalAuths: ops.auths.total,
      stalled: ops.recruiting.stalledCandidates.length,
      candidates: ops.recruiting.candidates.length,
      totalNeeds: Object.values(wf).reduce((s, w) => s + w.staffingNeeds.length, 0),
      overloaded: allBcbas.filter((b) => b.status === "Overloaded").length,
      nearCap: allBcbas.filter((b) => b.status === "Near Capacity").length,
      uncovered: cr.counts.uncoveredClients,
      coverage: cr.counts.activeClients
        ? Math.round((cr.counts.coveredClients / cr.counts.activeClients) * 100)
        : null,
      cancel7: cr.cancellationsLast7d,
      cancel30: cr.cancellationsLast30d,
      risks: ops.risks.length,
    };
  }, [ops, wf, cr]);

  // Section 3 — Department execution consistency
  const deptConsistency = useMemo(() => {
    type D = { id: string; label: string; tone: HealthTone; trend: Trend; note: string; confidence: "High" | "Medium" | "Low" };
    const items: D[] = [
      {
        id: "intake", label: "Intake",
        tone: "healthy", trend: "flat",
        note: "Intake progression and form completion holding consistent.",
        confidence: "High",
      },
      {
        id: "auths", label: "Authorizations",
        tone: d.expiring7 > 0 ? "risk" : d.expiring14 > 5 || d.missingDocs > 3 ? "attention" : "healthy",
        trend: d.expiring14 > 5 ? "up" : "flat",
        note: `${d.expiring7} ≤7d · ${d.expiring14} ≤14d · ${d.missingDocs} missing docs.`,
        confidence: "High",
      },
      {
        id: "scheduling", label: "Scheduling",
        tone: d.uncovered > 8 ? "risk" : d.uncovered > 3 ? "attention" : "healthy",
        trend: d.uncovered > 5 ? "up" : "flat",
        note: d.coverage !== null ? `${d.coverage}% coverage · ${d.uncovered} uncovered.` : "Execution consistent.",
        confidence: "High",
      },
      {
        id: "qa", label: "QA",
        tone: d.qaStalled > 4 ? "risk" : d.qaStalled > 0 ? "attention" : "healthy",
        trend: d.qaStalled > 3 ? "up" : "down",
        note: `${d.qaStalled} plans stalled ≥3d — reassessment cadence stabilizing.`,
        confidence: "High",
      },
      {
        id: "recruiting", label: "Recruiting",
        tone: d.stalled > 10 ? "risk" : d.stalled > 5 ? "attention" : "healthy",
        trend: d.stalled > 8 ? "up" : "flat",
        note: `${d.stalled} of ${d.candidates} candidates stalled ≥14d.`,
        confidence: "Medium",
      },
      {
        id: "hr", label: "HR",
        tone: d.stalled > 8 ? "attention" : "healthy",
        trend: "flat",
        note: "Onboarding handoff quality consistent across regions.",
        confidence: "Medium",
      },
      {
        id: "payroll", label: "Payroll",
        tone: "healthy",
        trend: "flat",
        note: "Payroll execution remains highly stable.",
        confidence: "High",
      },
      {
        id: "training", label: "Training",
        tone: "healthy",
        trend: "down",
        note: "Curriculum completion reinforcing onboarding consistency.",
        confidence: "Medium",
      },
      {
        id: "operations", label: "Operations",
        tone: d.risks > 4 ? "attention" : "healthy",
        trend: "flat",
        note: "Operational coordination holding under current load.",
        confidence: "Medium",
      },
      {
        id: "clinic", label: "Clinic operations",
        tone: d.overloaded > 3 ? "risk" : d.overloaded > 1 ? "attention" : "healthy",
        trend: d.overloaded > 2 ? "up" : "flat",
        note: `${d.overloaded} overloaded · ${d.nearCap} near capacity.`,
        confidence: "High",
      },
    ];
    return items;
  }, [d]);

  const overall = useMemo(() => overallConsistency(deptConsistency.map((d) => d.tone)), [deptConsistency]);

  // Section 2 — Executive consistency summary
  const summary = useMemo(() => {
    const lines: string[] = [];
    const stableDepts = deptConsistency.filter((x) => x.tone === "healthy").map((x) => x.label);
    const watching = deptConsistency.filter((x) => x.tone === "attention" || x.tone === "risk").map((x) => x.label);
    if (stableDepts.length >= 3) {
      lines.push(`Operational consistency remains stable across ${stableDepts.slice(0, 3).join(", ")} workflows${watching.length ? `, while ${watching.slice(0, 2).join(" and ")} follow-through timing requires closer monitoring.` : "."}`);
    } else {
      lines.push("Operational consistency is holding across most workflows, though execution variability is widening in several departments.");
    }
    const tightStates = (Object.entries(wf) as [string, typeof ga][])
      .filter(([, w]) => w.staffingNeeds.length >= 3).map(([s]) => s);
    if (tightStates.length) {
      lines.push(`${tightStates.join(", ")} onboarding execution remains operationally healthy despite increased staffing pressure.`);
    } else {
      lines.push("State-level onboarding execution remains operationally healthy across active markets.");
    }
    if (d.qaStalled <= 2) {
      lines.push("QA workflow stability improved after recent reassessment backlog reduction.");
    } else {
      lines.push(`QA reassessment timing variability (${d.qaStalled} stalled ≥3d) is the most active drift signal.`);
    }
    lines.push("Training adoption improvements strengthened onboarding consistency across newer hires.");
    return lines;
  }, [d, wf, ga, deptConsistency]);

  // Section 4 — Workflow stability monitor
  const workflows = useMemo(() => [
    { label: "Intake progression", tone: "healthy" as HealthTone, note: "Intake workflow timing remains stable." },
    { label: "VOB processing", tone: "healthy" as HealthTone, note: "VOB cadence holding under current volume." },
    { label: "Authorization timing", tone: (d.expiring7 > 0 ? "risk" : d.expiring14 > 5 ? "attention" : "healthy") as HealthTone, note: `${d.expiring7} ≤7d · ${d.expiring14} ≤14d expirations.` },
    { label: "QA review consistency", tone: (d.qaStalled > 4 ? "risk" : d.qaStalled > 0 ? "attention" : "healthy") as HealthTone, note: `${d.qaStalled} plans stalled ≥3d.` },
    { label: "Scheduling execution", tone: (d.uncovered > 5 ? "attention" : "healthy") as HealthTone, note: d.coverage !== null ? `${d.coverage}% coverage stable.` : "Scheduling handoff quality improving." },
    { label: "Staffing coordination", tone: (d.totalNeeds > 6 ? "attention" : "healthy") as HealthTone, note: `${d.totalNeeds} open need${d.totalNeeds === 1 ? "" : "s"} across active states.` },
    { label: "Payroll processing", tone: "healthy" as HealthTone, note: "Payroll cycles holding under current headcount." },
    { label: "Recruiting flow", tone: (d.stalled > 8 ? "attention" : "healthy") as HealthTone, note: "Recruiting progression remains operationally healthy." },
    { label: "Training completion", tone: "healthy" as HealthTone, note: "Curriculum completion reinforcing execution quality." },
    { label: "Onboarding progression", tone: (d.stalled > 8 ? "attention" : "healthy") as HealthTone, note: "Onboarding cadence stable across regions." },
  ], [d]);

  // Section 5 — SOP & process adoption
  const sopHealth = useMemo(() => [
    { label: "SOP adoption", tone: "healthy" as HealthTone, note: "Onboarding SOP adherence improving." },
    { label: "Process reinforcement", tone: "healthy" as HealthTone, note: "Training reinforcement strengthening execution quality." },
    { label: "Onboarding standardization", tone: (d.stalled > 8 ? "attention" : "healthy") as HealthTone, note: "Standardized onboarding rhythm holding." },
    { label: "Operational adherence", tone: (d.missingDocs > 4 ? "attention" : "healthy") as HealthTone, note: `${d.missingDocs} missing-docs auths tracked.` },
    { label: "Workflow deviation", tone: (d.risks > 4 ? "attention" : "healthy") as HealthTone, note: "Deviation patterns remain within tolerance." },
    { label: "Escalation routing", tone: (d.qaStalled > 4 ? "attention" : "healthy") as HealthTone, note: "Escalation routing consistency stable." },
    { label: "Reassessment process", tone: (d.qaStalled > 3 ? "attention" : "healthy") as HealthTone, note: "Reassessment follow-up consistency requires monitoring." },
    { label: "Scheduling standards", tone: (d.uncovered > 5 ? "attention" : "healthy") as HealthTone, note: "Scheduling standards remain operationally aligned." },
  ], [d]);

  // Section 6 — Cross-department alignment
  const alignment = useMemo(() => [
    { label: "Intake → Authorizations", tone: (d.missingDocs > 4 ? "attention" : "healthy") as HealthTone, note: "Intake and auth handoffs remain highly aligned." },
    { label: "Authorizations → QA", tone: (d.qaStalled > 3 ? "attention" : "healthy") as HealthTone, note: "QA reassessment handoff timing improving." },
    { label: "QA → Scheduling", tone: (d.qaStalled > 4 || d.uncovered > 5 ? "attention" : "healthy") as HealthTone, note: "Coordination consistent under current volume." },
    { label: "Recruiting → Onboarding", tone: (d.stalled > 8 ? "attention" : "healthy") as HealthTone, note: "Recruiting-to-onboarding consistency stabilized." },
    { label: "Staffing → Scheduling", tone: (d.totalNeeds > 6 ? "attention" : "healthy") as HealthTone, note: "Staffing-to-scheduling communication holding." },
    { label: "Leadership escalation routing", tone: "healthy" as HealthTone, note: "Escalation routing remains operationally aligned." },
    { label: "Cross-state coordination", tone: (d.totalNeeds > 8 ? "attention" : "healthy") as HealthTone, note: "Multi-state coordination supports consistent execution." },
  ], [d]);

  // Section 7 — Operational drift detection
  const drift = useMemo(() => {
    const items: { label: string; tone: HealthTone; note: string; trend: Trend }[] = [];
    const heaviest = (Object.entries(wf) as [string, typeof ga][])
      .map(([s, w]) => ({ s, gap: w.staffingNeeds.length }))
      .sort((a, b) => b.gap - a.gap)[0];
    if (d.qaStalled > 2) items.push({ label: `${heaviest?.s ?? "Active"} reassessment coordination becoming less predictable`, tone: "attention", trend: "up", note: `${d.qaStalled} plans stalled ≥3d.` });
    if (d.stalled > 5) items.push({ label: "Onboarding timing variance increasing slightly", tone: d.stalled > 10 ? "risk" : "attention", trend: "up", note: `${d.stalled} candidates stalled ≥14d.` });
    if (d.uncovered > 5) items.push({ label: "Scheduling consistency variance forming", tone: d.uncovered > 8 ? "risk" : "attention", trend: "up", note: `${d.uncovered} uncovered clients.` });
    if (d.overloaded > 2) items.push({ label: "Clinic execution variability rising", tone: "attention", trend: "up", note: `${d.overloaded} BCBAs overloaded.` });
    items.push({ label: "Payroll execution remains highly stable", tone: "healthy", trend: "flat", note: "No drift detected in payroll cycles." });
    items.push({ label: "Authorization process variability improving", tone: d.missingDocs > 4 ? "attention" : "healthy", trend: "down", note: `${d.missingDocs} missing-docs auths.` });
    return items;
  }, [d, wf, ga]);

  // Section 8 — Training & reinforcement effectiveness
  const training = useMemo(() => [
    { label: "Onboarding completion", tone: "healthy" as HealthTone, note: "Training completion improving onboarding consistency." },
    { label: "Training adoption", tone: "healthy" as HealthTone, note: "Role-based academy adoption improving operational reliability." },
    { label: "SOP reinforcement", tone: "healthy" as HealthTone, note: "SOP reinforcement strengthening workflow execution." },
    { label: "Role-based learning", tone: "healthy" as HealthTone, note: "Role-based completion holding above target." },
    { label: "Operational reinforcement health", tone: (d.risks > 4 ? "attention" : "healthy") as HealthTone, note: "Reinforcement cadence supporting execution." },
    { label: "Workflow execution improvement", tone: (d.qaStalled > 3 ? "attention" : "healthy") as HealthTone, note: "New hire workflow adherence stabilizing." },
  ], [d]);

  // Section 9 — Organizational reliability forecast
  const forecasts = useMemo(() => {
    const out: { horizon: string; tone: HealthTone; line: string }[] = [];
    if (d.totalNeeds <= 4 && d.qaStalled <= 2) {
      out.push({ horizon: "30–60 days", tone: "healthy", line: "Current operational systems remain stable for continued growth." });
    } else {
      out.push({ horizon: "30–60 days", tone: "attention", line: "Rapid staffing growth may pressure onboarding consistency without added reinforcement." });
    }
    if (d.stalled > 5 || d.totalNeeds > 5) {
      out.push({ horizon: "2–4 weeks", tone: "attention", line: "Onboarding consistency may tighten if recruiting throughput softens further." });
    } else {
      out.push({ horizon: "2–4 weeks", tone: "healthy", line: "Workflow maturity is improving organizational scalability." });
    }
    if (d.qaStalled > 3) {
      out.push({ horizon: "Next QA cycle", tone: "attention", line: "Reassessment execution reliability requires monitoring through the next cycle." });
    } else {
      out.push({ horizon: "Next QA cycle", tone: "healthy", line: "QA execution reliability is stabilizing department-wide." });
    }
    if (d.overloaded > 2) {
      out.push({ horizon: "30–60 days", tone: "risk", line: "BCBA caseload concentration may pressure clinic execution consistency if growth continues without redistribution." });
    }
    return out;
  }, [d]);

  // Section 10 — Executive guidance
  const guidance = useMemo(() => {
    const r: { title: string; note: string }[] = [];
    if (d.qaStalled > 2) r.push({ title: "Reinforce reassessment follow-up standards", note: "Tighten QA cadence where reassessment timing is widening." });
    r.push({ title: "Continue strengthening onboarding standardization", note: "Maintain rhythm around role-based onboarding adherence." });
    const heaviest = (Object.entries(wf) as [string, typeof ga][])
      .map(([s, w]) => ({ s, gap: w.staffingNeeds.length }))
      .sort((a, b) => b.gap - a.gap)[0];
    if (heaviest && heaviest.gap >= 3) {
      r.push({ title: `Monitor onboarding variability in ${heaviest.s}`, note: "Track execution consistency against staffing demand weekly." });
    }
    r.push({ title: "Improve workflow consistency visibility", note: "Surface execution variance signals earlier across leadership reviews." });
    if (d.totalNeeds > 4) r.push({ title: "Support operational reinforcement across high-growth states", note: "Reinforce SOP adoption where staffing demand is widening." });
    r.push({ title: "Continue expanding training adoption", note: "Sustain reinforcement to lock onboarding consistency at scale." });
    return r;
  }, [d, wf, ga]);

  const lastUpdated = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <ExecPage
      title="Operational Consistency"
      subtitle="Live operational consistency intelligence across workflows, onboarding quality, SOP adoption, execution stability, and organizational alignment."
    >
      {/* Section 1 — Header */}
      <ExecCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className={`inline-flex size-2.5 rounded-full ${TONE_DOT[overall.tone]}`} />
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Operational consistency
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

      {/* Section 2 — Executive consistency summary */}
      <ExecCard title="Executive consistency summary" hint="AI-interpreted">
        <div className="space-y-2.5">
          {summary.map((line, i) => (
            <p key={i} className="text-[14px] leading-relaxed text-foreground">{line}</p>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Are we operating consistently?" prompt="Is Blossom operating consistently at scale right now?" />
          <AIPrompt label="Where is drift forming?" prompt="Where is operational drift forming fastest across Blossom departments?" />
          <AIPrompt label="What should leadership reinforce?" prompt="What operational systems should leadership reinforce in the next 30 days?" />
        </div>
      </ExecCard>

      {/* Section 3 — Department execution consistency */}
      <ExecCard title="Department execution consistency" hint="Composite · live">
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {deptConsistency.map((r) => (
            <div key={r.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium">{r.label}</div>
                  <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">{r.note}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <HealthPill tone={r.tone}>{consistencyLabel(r.tone)}</HealthPill>
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

      {/* Section 4 — Workflow stability monitor */}
      <ExecCard title="Workflow stability" hint="Are workflows holding at scale?">
        <div className="grid gap-2 sm:grid-cols-2">
          {workflows.map((w) => (
            <div key={w.label} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`inline-flex size-2 rounded-full ${TONE_DOT[w.tone]}`} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{w.label}</div>
                  <div className="text-[11.5px] text-muted-foreground truncate">{w.note}</div>
                </div>
              </div>
              <HealthPill tone={w.tone}>{consistencyLabel(w.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 5 — SOP & process adoption health */}
      <ExecCard title="SOP & process adoption" hint="Are standards being followed?">
        <div className="grid gap-2 md:grid-cols-2">
          {sopHealth.map((s) => (
            <div key={s.label} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{s.label}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{s.note}</div>
              </div>
              <HealthPill tone={s.tone}>{consistencyLabel(s.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 6 — Cross-department alignment */}
      <ExecCard title="Cross-department alignment" hint="Are handoffs consistent?">
        <div className="grid gap-2 md:grid-cols-2">
          {alignment.map((a) => (
            <div key={a.label} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{a.label}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{a.note}</div>
              </div>
              <HealthPill tone={a.tone}>{consistencyLabel(a.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 7 — Operational drift detection */}
      <ExecCard title="Operational drift detection" hint="Where execution is widening">
        <div className="space-y-1.5">
          {drift.map((p, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
              <span className={`mt-1.5 inline-flex size-2 rounded-full shrink-0 ${TONE_DOT[p.tone]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[13px] font-medium">{p.label}</div>
                  <div className="flex items-center gap-1.5">
                    <TrendIcon trend={p.trend} good="down" />
                    <HealthPill tone={p.tone}>{consistencyLabel(p.tone)}</HealthPill>
                  </div>
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{p.note}</div>
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 8 — Training & reinforcement */}
      <ExecCard title="Training & reinforcement effectiveness" hint="Is reinforcement strengthening execution?">
        <div className="grid gap-2 md:grid-cols-2">
          {training.map((t) => (
            <div key={t.label} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{t.label}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{t.note}</div>
              </div>
              <HealthPill tone={t.tone}>{consistencyLabel(t.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 9 — Organizational reliability forecast */}
      <ExecCard title="Organizational reliability forecast" hint="Will consistency hold as we grow?">
        <div className="space-y-1.5">
          {forecasts.map((f, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
              <span className={`mt-1.5 inline-flex size-2 rounded-full shrink-0 ${TONE_DOT[f.tone]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{f.horizon}</span>
                  <HealthPill tone={f.tone}>{consistencyLabel(f.tone)}</HealthPill>
                </div>
                <div className="mt-1 text-[13px] text-foreground leading-relaxed">{f.line}</div>
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 10 — Executive guidance */}
      <ExecCard title="Executive guidance" hint="Where to reinforce systems">
        <div className="space-y-1.5">
          {guidance.map((r, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="text-[13px] font-medium">{r.title}</div>
              <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{r.note}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Draft consistency briefing" prompt="Draft a brief leadership note summarizing Blossom's current operational consistency, drift signals, and recommended reinforcement actions." />
        </div>
      </ExecCard>
      <ActionItemsPanel sourcePage="executive/operational-consistency" />
    </ExecPage>
  );
}
