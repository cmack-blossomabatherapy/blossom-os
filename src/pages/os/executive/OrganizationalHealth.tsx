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

function statusFromScore(score: number): { label: string; tone: HealthTone } {
  if (score >= 88) return { label: "Healthy", tone: "healthy" };
  if (score >= 75) return { label: "Stable", tone: "healthy" };
  if (score >= 65) return { label: "Watch", tone: "attention" };
  if (score >= 55) return { label: "Attention Needed", tone: "attention" };
  if (score >= 45) return { label: "At Risk", tone: "risk" };
  return { label: "Critical", tone: "blocked" };
}

function overallFromTones(tones: HealthTone[]): { label: string; tone: HealthTone } {
  const w = tones.reduce((a, b) => (TONE_RANK[a] >= TONE_RANK[b] ? a : b), "healthy" as HealthTone);
  if (w === "blocked") return { label: "Critical", tone: "blocked" };
  if (w === "risk") return { label: "At Risk", tone: "risk" };
  if (w === "attention") return { label: "Attention Needed", tone: "attention" };
  return { label: tones.filter((t) => t === "healthy").length >= tones.length - 1 ? "Healthy" : "Stable", tone: "healthy" };
}

type Trend = "up" | "down" | "flat";

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") return <ArrowUpRight className="size-3.5 text-emerald-600" />;
  if (trend === "down") return <ArrowDownRight className="size-3.5 text-rose-600" />;
  return <ArrowRight className="size-3.5 text-muted-foreground" />;
}

export default function OrganizationalHealth() {
  const ops = useOpsIntelligence();
  const cr = useCentralReachOps({});
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const nj = useStateWorkforce("NJ");
  const wf = useMemo(() => ({ GA: ga, NC: nc, VA: va, TN: tn, MD: md, NJ: nj }), [ga, nc, va, tn, md, nj]);

  const data = useMemo(() => {
    const allBcbas = Object.values(wf).flatMap((w) => w.bcbas);
    const overloaded = allBcbas.filter((b) => b.status === "Overloaded").length;
    const nearCap = allBcbas.filter((b) => b.status === "Near Capacity").length;
    const needsAttn = allBcbas.filter((b) => b.status === "Needs Attention").length;
    const totalNeeds = Object.values(wf).reduce((s, w) => s + w.staffingNeeds.length, 0);
    const stalled = ops.recruiting.stalledCandidates.length;
    const candidates = ops.recruiting.candidates.length;
    const qaStalled = ops.auths.qaStalled.length;
    const expiring7 = ops.auths.expiring7.length;
    const expiring14 = ops.auths.expiring14.length;
    const missingDocs = ops.auths.missingDocs.length;
    const denied = ops.auths.denied.length;
    const totalAuths = ops.auths.total;
    const coverage = cr.counts.activeClients
      ? Math.round((cr.counts.coveredClients / cr.counts.activeClients) * 100)
      : null;
    const uncovered = cr.counts.uncoveredClients;
    const cancel30 = cr.cancellationsLast30d;
    const cancel7 = cr.cancellationsLast7d;

    return {
      overloaded, nearCap, needsAttn, totalNeeds, stalled, candidates,
      qaStalled, expiring7, expiring14, missingDocs, denied, totalAuths,
      coverage, uncovered, cancel30, cancel7,
    };
  }, [ops, wf, cr]);

  const departments = useMemo(() => {
    const d = data;
    return [
      {
        id: "intake", name: "Intake",
        score: 88,
        summary: "Live pipeline flowing. Lead movement and form completion stable.",
        trend: "flat" as Trend,
      },
      {
        id: "authorizations", name: "Authorizations",
        score: Math.max(40, 100 - d.expiring14 * 2 - d.qaStalled * 1.5 - d.denied * 3),
        summary: d.expiring7 > 0
          ? `${d.expiring7} auths expire ≤7d · ${d.qaStalled} stalled in QA review.`
          : `${d.totalAuths || 0} active auths · ${d.qaStalled} stalled in QA.`,
        trend: (d.expiring7 > 0 ? "down" : "flat") as Trend,
      },
      {
        id: "scheduling", name: "Scheduling",
        score: d.coverage ?? 82,
        summary: d.coverage !== null
          ? `${d.coverage}% client coverage · ${d.uncovered} uncovered.`
          : "Capacity tracked in Staffing & Capacity.",
        trend: (d.uncovered > 3 ? "down" : "flat") as Trend,
      },
      {
        id: "qa", name: "QA",
        score: Math.max(50, 100 - d.qaStalled * 4),
        summary: d.qaStalled > 0
          ? `${d.qaStalled} treatment plans stalled ≥3d in review.`
          : "Review throughput healthy.",
        trend: (d.qaStalled > 5 ? "down" : d.qaStalled === 0 ? "up" : "flat") as Trend,
      },
      {
        id: "recruiting", name: "Recruiting",
        score: Math.max(50, 100 - d.stalled * 3),
        summary: `${d.candidates} candidates active · ${d.stalled} stalled ≥14d.`,
        trend: (d.stalled > 10 ? "down" : d.candidates > 30 ? "up" : "flat") as Trend,
      },
      {
        id: "hr", name: "HR",
        score: 90,
        summary: "Onboarding and credentialing tracked centrally.",
        trend: "flat" as Trend,
      },
      {
        id: "payroll", name: "Payroll",
        score: 92,
        summary: "Payroll cycle operationally stable.",
        trend: "flat" as Trend,
      },
      {
        id: "training", name: "Training",
        score: 78,
        summary: "Adoption tracked in Training & Adoption view.",
        trend: "flat" as Trend,
      },
      {
        id: "operations", name: "Operations",
        score: Math.max(50, 100 - d.totalNeeds * 3 - d.overloaded * 4),
        summary: d.totalNeeds > 0
          ? `${d.totalNeeds} open staffing needs across regions.`
          : "Operational coordination stable.",
        trend: (d.totalNeeds > 5 ? "down" : "flat") as Trend,
      },
      {
        id: "clinic", name: "Clinic Operations",
        score: Math.max(50, 100 - d.cancel7 * 2 - d.overloaded * 3),
        summary: `${d.cancel7} cancellations in last 7d · ${d.cancel30} in last 30d.`,
        trend: (d.cancel7 > 10 ? "down" : "flat") as Trend,
      },
    ].map((s) => ({ ...s, score: Math.round(s.score), ...statusFromScore(s.score) }));
  }, [data]);

  const overall = useMemo(() => overallFromTones(departments.map((d) => d.tone)), [departments]);
  const counts = useMemo(() => {
    const c = { healthy: 0, attention: 0, risk: 0, blocked: 0 };
    departments.forEach((d) => {
      if (d.tone === "healthy") c.healthy++;
      else if (d.tone === "attention") c.attention++;
      else if (d.tone === "risk") c.risk++;
      else if (d.tone === "blocked") c.blocked++;
    });
    return c;
  }, [departments]);

  // Section 2 — Executive summary lines from real signals
  const summaryLines = useMemo(() => {
    const d = data;
    const lines: string[] = [];
    const tightStates = Object.entries(wf)
      .filter(([, w]) => w.staffingNeeds.length >= 2)
      .map(([s]) => s);
    if (tightStates.length) {
      lines.push(`Staffing pressure remains elevated in ${tightStates.join(", ")} with ${d.totalNeeds} open needs across regions.`);
    } else {
      lines.push("Staffing posture is stable across all active states with no critical regional gaps.");
    }
    if (d.expiring7 > 0) {
      lines.push(`Authorizations require executive awareness — ${d.expiring7} expire within 7 days and ${d.qaStalled} plans remain in QA review.`);
    } else if (d.qaStalled > 0) {
      lines.push(`QA throughput is the primary workflow pressure point with ${d.qaStalled} plans stalled ≥3 days.`);
    } else {
      lines.push("Authorization and QA workflows are moving without backlog accumulation.");
    }
    if (d.stalled > 5) {
      lines.push(`Recruiting throughput is softening — ${d.stalled} of ${d.candidates} candidates have stalled ≥14 days in pipeline.`);
    } else if (d.candidates > 0) {
      lines.push(`Recruiting pipeline is healthy with ${d.candidates} active candidates moving through stages.`);
    }
    if (d.cancel7 > 10) {
      lines.push(`Clinical cancellations are trending up (${d.cancel7} in last 7d) — coverage stability warrants monitoring.`);
    }
    return lines;
  }, [data, wf]);

  // Section 4 — Stability monitors
  const stability = useMemo(() => {
    const d = data;
    return [
      {
        label: "Onboarding consistency",
        tone: (d.stalled > 8 ? "attention" : "healthy") as HealthTone,
        note: d.stalled > 8 ? "Pipeline stalling reduces throughput predictability." : "Throughput holding steady.",
      },
      {
        label: "Staffing sustainability",
        tone: (d.totalNeeds > 5 || d.overloaded > 3 ? "risk" : d.totalNeeds > 2 ? "attention" : "healthy") as HealthTone,
        note: `${d.overloaded} overloaded · ${d.nearCap} near capacity.`,
      },
      {
        label: "Workflow reliability",
        tone: (d.qaStalled > 5 || d.missingDocs > 5 ? "attention" : "healthy") as HealthTone,
        note: `${d.qaStalled} QA stalls · ${d.missingDocs} auths missing docs.`,
      },
      {
        label: "Escalation pressure",
        tone: (d.denied > 0 || d.expiring7 > 3 ? "risk" : "healthy") as HealthTone,
        note: `${d.denied} denials · ${d.expiring7} ≤7d auths.`,
      },
      {
        label: "Department execution",
        tone: worst(...departments.map((x) => x.tone)),
        note: `${counts.healthy} healthy · ${counts.attention} attention · ${counts.risk + counts.blocked} at risk.`,
      },
      {
        label: "Operational maturity",
        tone: "healthy" as HealthTone,
        note: "Workflows, ownership, and reporting layers are in place.",
      },
    ];
  }, [data, departments, counts]);

  // Section 5 — Staffing health by state
  const stateRows = useMemo(() => {
    return STATES.map((s) => {
      const w = wf[s];
      const gap = w.staffingNeeds.length;
      const tone: HealthTone =
        gap >= 4 ? "risk" : gap >= 2 ? "attention" : gap === 1 ? "neutral" : "healthy";
      const overloaded = w.bcbas.filter((b) => b.status === "Overloaded").length;
      const near = w.bcbas.filter((b) => b.status === "Near Capacity").length;
      const summary =
        gap === 0
          ? `${w.bcbas.length} BCBAs · staffing stable.`
          : `${gap} open need${gap === 1 ? "" : "s"} · ${overloaded} overloaded · ${near} near capacity.`;
      return { state: s, tone, summary, gap, bcbas: w.bcbas.length };
    });
  }, [wf]);

  // Section 6 — Workflow health
  const workflows = useMemo(() => {
    const d = data;
    return [
      { name: "Intake", tone: "healthy" as HealthTone, note: "Lead movement and form completion stable." },
      { name: "VOB", tone: "healthy" as HealthTone, note: "Verification cadence holding." },
      { name: "Authorizations", tone: (d.expiring7 > 0 ? "risk" : d.expiring14 > 5 ? "attention" : "healthy") as HealthTone,
        note: `${d.expiring7} ≤7d · ${d.expiring14} ≤14d.` },
      { name: "Assessments", tone: (d.qaStalled > 3 ? "attention" : "healthy") as HealthTone,
        note: `${d.qaStalled} stalled in QA review.` },
      { name: "Staffing", tone: (d.totalNeeds > 3 ? "attention" : "healthy") as HealthTone,
        note: `${d.totalNeeds} open need${d.totalNeeds === 1 ? "" : "s"}.` },
      { name: "Scheduling", tone: (d.uncovered > 3 ? "attention" : "healthy") as HealthTone,
        note: d.coverage !== null ? `${d.coverage}% coverage · ${d.uncovered} uncovered.` : "Coordination stable." },
      { name: "QA", tone: (d.qaStalled > 5 ? "risk" : d.qaStalled > 0 ? "attention" : "healthy") as HealthTone,
        note: `${d.qaStalled} plans ≥3d in review.` },
      { name: "Payroll", tone: "healthy" as HealthTone, note: "Cycle execution on schedule." },
      { name: "Recruiting", tone: (d.stalled > 8 ? "attention" : "healthy") as HealthTone,
        note: `${d.candidates} active · ${d.stalled} stalled.` },
      { name: "Training", tone: "attention" as HealthTone, note: "Adoption tracking continues." },
    ];
  }, [data]);

  // Section 7 — Drift detection
  const drift = useMemo(() => {
    const d = data;
    const items: { label: string; tone: HealthTone; note: string }[] = [];
    items.push({
      label: "Authorization workflow execution",
      tone: d.expiring7 > 0 ? "risk" : "healthy",
      note: d.expiring7 > 0 ? "Reauth timing slipping on near-term auths." : "Submission cadence on time.",
    });
    items.push({
      label: "QA review consistency",
      tone: d.qaStalled > 3 ? "attention" : "healthy",
      note: d.qaStalled > 3 ? "Stall window extending beyond 3 days." : "Review timing within standard.",
    });
    items.push({
      label: "Recruiting follow-up cadence",
      tone: d.stalled > 8 ? "attention" : "healthy",
      note: d.stalled > 8 ? "Pipeline movement softening." : "Stage progression on cadence.",
    });
    items.push({
      label: "Scheduling coverage discipline",
      tone: d.uncovered > 3 ? "attention" : "healthy",
      note: d.uncovered > 3 ? `${d.uncovered} uncovered clients drifting.` : "Coverage adherence stable.",
    });
    items.push({
      label: "Staffing capacity adherence",
      tone: d.overloaded > 2 ? "risk" : d.nearCap > 4 ? "attention" : "healthy",
      note: d.overloaded > 0 ? `${d.overloaded} BCBAs over capacity.` : "Caseload distribution healthy.",
    });
    items.push({
      label: "Training completion",
      tone: "neutral",
      note: "Tracked in Training & Adoption.",
    });
    return items;
  }, [data]);

  // Section 8 — Growth readiness
  const growth = useMemo(() => {
    const d = data;
    return [
      {
        label: "Staffing readiness",
        tone: (d.totalNeeds > 5 ? "risk" : d.totalNeeds > 2 ? "attention" : "healthy") as HealthTone,
        note: d.totalNeeds > 5
          ? "Open needs may constrain near-term growth absorption."
          : "Capacity supports continued client onboarding.",
      },
      {
        label: "Recruiting throughput",
        tone: (d.stalled > 8 ? "attention" : d.candidates > 25 ? "healthy" : "neutral") as HealthTone,
        note: `${d.candidates} active candidates feed onboarding pipeline.`,
      },
      {
        label: "QA capacity for growth",
        tone: (d.qaStalled > 5 ? "risk" : "healthy") as HealthTone,
        note: d.qaStalled > 5
          ? "QA backlog reduces room to absorb new caseload."
          : "QA can absorb additional caseload volume.",
      },
      {
        label: "Clinic operational stability",
        tone: (d.cancel7 > 10 ? "attention" : "healthy") as HealthTone,
        note: d.cancel7 > 10
          ? "Cancellation trend pressures clinic predictability."
          : "Clinic operations support continued scale.",
      },
      {
        label: "Multi-state readiness",
        tone: worst(...stateRows.map((r) => r.tone)),
        note: "Mixed state posture — see staffing overview.",
      },
      {
        label: "Leadership capacity",
        tone: "healthy" as HealthTone,
        note: "State leadership coverage in place across active states.",
      },
    ];
  }, [data, stateRows]);

  const lastUpdated = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <ExecPage
      title="Organizational Health"
      subtitle="Live organizational health intelligence across staffing, workflows, operational consistency, and growth readiness."
    >
      {/* Section 1 — Header status banner */}
      <ExecCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className={`inline-flex size-2.5 rounded-full ${TONE_DOT[overall.tone]}`} />
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Overall company posture
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
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {[
            { label: "Healthy", value: counts.healthy, color: "text-emerald-600" },
            { label: "Attention", value: counts.attention, color: "text-amber-600" },
            { label: "At Risk", value: counts.risk, color: "text-orange-600" },
            { label: "Critical", value: counts.blocked, color: "text-rose-600" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-border/60 bg-background/40 p-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</div>
              <div className={`mt-0.5 text-xl font-semibold tabular-nums ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 2 — Executive health summary */}
      <ExecCard title="Executive health summary" hint="AI-interpreted">
        <div className="space-y-2.5">
          {summaryLines.map((line, i) => (
            <p key={i} className="text-[14px] leading-relaxed text-foreground">
              {line}
            </p>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="What needs my attention?" prompt="What organizational health issues need executive attention right now?" />
          <AIPrompt label="Where is risk concentrated?" prompt="Which operational systems are concentrating the most risk?" />
          <AIPrompt label="Is growth supportable?" prompt="Can Blossom safely absorb continued growth at current operational health?" />
        </div>
      </ExecCard>

      {/* Section 3 — Department health grid */}
      <ExecCard title="Department health" hint="10 operational systems">
        <div className="grid gap-2 md:grid-cols-2">
          {departments.map((d) => (
            <div key={d.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex size-2 rounded-full ${TONE_DOT[d.tone]}`} />
                  <span className="text-[13.5px] font-medium">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendIcon trend={d.trend} />
                  <HealthPill tone={d.tone}>{d.label}</HealthPill>
                </div>
              </div>
              <p className="mt-2 text-[12.5px] text-muted-foreground leading-relaxed">{d.summary}</p>
              <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${TONE_DOT[d.tone]}`} style={{ width: `${d.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 4 — Stability monitor */}
      <ExecCard title="Organizational stability" hint="Long-term operational read">
        <div className="grid gap-2 md:grid-cols-2">
          {stability.map((s) => (
            <div key={s.label} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{s.label}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">{s.note}</div>
              </div>
              <HealthPill tone={s.tone}>
                {s.tone === "healthy" ? "Stable" : s.tone === "attention" ? "Watch" : s.tone === "risk" ? "At Risk" : s.tone === "blocked" ? "Critical" : "Tracking"}
              </HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 5 — Staffing health by state */}
      <ExecCard title="Staffing health by state" hint="Active operating states">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {stateRows.map((r) => (
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

      {/* Section 6 — Workflow health */}
      <ExecCard title="Workflow health monitor" hint="End-to-end operational flow">
        <div className="grid gap-2 md:grid-cols-2">
          {workflows.map((w) => (
            <div key={w.name} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`inline-flex size-2 rounded-full ${TONE_DOT[w.tone]}`} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{w.name}</div>
                  <div className="text-[11.5px] text-muted-foreground truncate">{w.note}</div>
                </div>
              </div>
              <HealthPill tone={w.tone}>
                {w.tone === "healthy" ? "Stable" : w.tone === "attention" ? "Watch" : w.tone === "risk" ? "At Risk" : "Critical"}
              </HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 7 — Drift detection */}
      <ExecCard title="Organizational drift detection" hint="Predictive consistency read">
        <div className="space-y-1.5">
          {drift.map((d) => (
            <div key={d.label} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`inline-flex size-2 rounded-full ${TONE_DOT[d.tone]}`} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{d.label}</div>
                  <div className="text-[11.5px] text-muted-foreground">{d.note}</div>
                </div>
              </div>
              <HealthPill tone={d.tone}>
                {d.tone === "healthy" ? "On track" : d.tone === "attention" ? "Drifting" : d.tone === "risk" ? "Slipping" : d.tone === "blocked" ? "Critical" : "Tracking"}
              </HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 8 — Growth readiness */}
      <ExecCard title="Growth stability readiness" hint="Can Blossom continue scaling?">
        <div className="grid gap-2 md:grid-cols-2">
          {growth.map((g) => (
            <div key={g.label} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{g.label}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{g.note}</div>
              </div>
              <HealthPill tone={g.tone}>
                {g.tone === "healthy" ? "Ready" : g.tone === "attention" ? "Watch" : g.tone === "risk" ? "Constrained" : g.tone === "blocked" ? "Blocked" : "Tracking"}
              </HealthPill>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Forecast growth absorption" prompt="Forecast Blossom's ability to absorb continued growth based on current organizational health." />
        </div>
      </ExecCard>
    </ExecPage>
  );
}
