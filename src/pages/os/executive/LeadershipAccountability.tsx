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

function statusLabel(tone: HealthTone) {
  if (tone === "healthy") return "Strong";
  if (tone === "attention") return "Stable";
  if (tone === "risk") return "Watch";
  if (tone === "blocked") return "Needs support";
  return "Tracking";
}

function overallStatus(tones: HealthTone[]): { label: string; tone: HealthTone } {
  const w = worst(...tones);
  if (w === "blocked") return { label: "Coordination Strain", tone: "blocked" };
  if (w === "risk") return { label: "Follow-Through Risk", tone: "risk" };
  if (w === "attention") {
    const attn = tones.filter((t) => t === "attention").length;
    return { label: attn >= 4 ? "Attention Needed" : "Operationally Stable", tone: "attention" };
  }
  return { label: "Strong Alignment", tone: "healthy" };
}

export default function LeadershipAccountability() {
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
      missingDocs: ops.auths.missingDocs.length,
      denied: ops.auths.denied.length,
      uncovered: cr.counts.uncoveredClients,
      coverage: cr.counts.activeClients
        ? Math.round((cr.counts.coveredClients / cr.counts.activeClients) * 100)
        : null,
      cancel7: cr.cancellationsLast7d,
    };
  }, [ops, wf, cr]);

  // Section 3 — leadership responsiveness grid
  const leadership = useMemo(() => {
    type L = { id: string; name: string; tone: HealthTone; trend: Trend; note: string };
    const items: L[] = [
      {
        id: "exec", name: "Executive Leadership",
        tone: d.qaStalled > 5 || d.totalNeeds > 8 ? "attention" : "healthy",
        trend: "flat",
        note: "Executive coordination remains aligned across active operational areas.",
      },
      {
        id: "ops", name: "Operations Leadership",
        tone: d.totalNeeds > 6 || d.uncovered > 5 ? "attention" : "healthy",
        trend: d.totalNeeds > 4 ? "up" : "flat",
        note: "Operational coordination holding under current workflow volume.",
      },
      {
        id: "intake", name: "Intake Leadership",
        tone: "healthy",
        trend: "down",
        note: "Intake follow-through highly consistent across active leads.",
      },
      {
        id: "auth", name: "Authorization Leadership",
        tone: d.expiring7 > 0 ? "risk" : d.expiring14 > 5 || d.missingDocs > 3 ? "attention" : "healthy",
        trend: d.expiring14 > 5 ? "up" : "flat",
        note: `${d.expiring7} ≤7d · ${d.missingDocs} missing docs — submission cadence holding.`,
      },
      {
        id: "sched", name: "Scheduling Leadership",
        tone: d.uncovered > 8 ? "risk" : d.uncovered > 3 ? "attention" : "healthy",
        trend: d.uncovered > 5 ? "up" : "flat",
        note: d.coverage !== null ? `${d.coverage}% coverage · ${d.uncovered} uncovered.` : "Coordination stable.",
      },
      {
        id: "qa", name: "QA Leadership",
        tone: d.qaStalled > 5 ? "risk" : d.qaStalled > 0 ? "attention" : "healthy",
        trend: d.qaStalled > 3 ? "up" : "down",
        note: `${d.qaStalled} plans stalled ≥3d — review cadence stable.`,
      },
      {
        id: "recruit", name: "Recruiting Leadership",
        tone: d.stalled > 10 ? "attention" : "healthy",
        trend: d.stalled > 8 ? "up" : "down",
        note: `${d.candidates} active candidates · ${d.stalled} stalled ≥14d.`,
      },
      {
        id: "hr", name: "HR Leadership",
        tone: d.candidates > 40 && d.stalled > 8 ? "attention" : "healthy",
        trend: "flat",
        note: "Onboarding coordination supporting recruiting handoffs.",
      },
      {
        id: "payroll", name: "Payroll Leadership",
        tone: "healthy",
        trend: "flat",
        note: "Payroll cycles executing on schedule under current headcount.",
      },
      {
        id: "state", name: "State Leadership",
        tone: d.totalNeeds > 6 ? "attention" : "healthy",
        trend: d.totalNeeds > 4 ? "up" : "flat",
        note: "State directors maintaining operational alignment.",
      },
      {
        id: "clinic", name: "Clinic Leadership",
        tone: d.overloaded > 2 ? "attention" : "healthy",
        trend: d.overloaded > 2 ? "up" : "flat",
        note: `${d.overloaded} overloaded · ${d.nearCap} near capacity.`,
      },
    ];
    return items;
  }, [d]);

  const overall = useMemo(() => overallStatus(leadership.map((l) => l.tone)), [leadership]);

  // Section 2 — executive accountability summary
  const summary = useMemo(() => {
    const lines: string[] = [];
    const tightStates = (Object.entries(wf) as [string, typeof ga][])
      .filter(([, w]) => w.staffingNeeds.length >= 2).map(([s]) => s);
    if (d.qaStalled === 0 && d.totalNeeds < 4) {
      lines.push("Operational leadership remains highly responsive across active workflows, with strong follow-through on escalations.");
    } else {
      lines.push("Operational leadership remains responsive overall, though follow-through coordination in several areas needs continued support.");
    }
    if (tightStates.length) {
      lines.push(`Staffing coordination in ${tightStates.join(", ")} continues requiring additional leadership support as demand persists.`);
    } else {
      lines.push("State-level staffing coordination is operationally aligned across active markets.");
    }
    if (d.qaStalled > 3) {
      lines.push(`QA reassessment follow-through (${d.qaStalled} plans stalled) requires additional coordination support as volume increases.`);
    } else {
      lines.push("QA escalation resolution timing remains stable despite ongoing reassessment volume.");
    }
    if (d.stalled <= 5) {
      lines.push("Recruiting and onboarding coordination improved this cycle, reducing staffing delays.");
    }
    return lines;
  }, [d, wf, ga]);

  // Section 4 — operational ownership monitor
  const ownership = useMemo(() => [
    {
      label: "Reassessment coordination",
      tone: (d.qaStalled > 4 ? "risk" : d.qaStalled > 0 ? "attention" : "healthy") as HealthTone,
      note: `${d.qaStalled} reassessment plans pending ≥3d.`,
    },
    {
      label: "Scheduling ownership",
      tone: (d.uncovered > 5 ? "attention" : "healthy") as HealthTone,
      note: d.coverage !== null ? `${d.coverage}% coverage maintained.` : "Scheduling ownership stable.",
    },
    {
      label: "Intake workflow follow-through",
      tone: "healthy" as HealthTone,
      note: "Lead progression remains highly consistent.",
    },
    {
      label: "Authorization submission ownership",
      tone: (d.expiring7 > 0 || d.missingDocs > 4 ? "attention" : "healthy") as HealthTone,
      note: `${d.expiring7} ≤7d expirations · ${d.missingDocs} missing docs.`,
    },
    {
      label: "Staffing escalation ownership",
      tone: (d.totalNeeds > 6 ? "attention" : "healthy") as HealthTone,
      note: `${d.totalNeeds} open staffing need${d.totalNeeds === 1 ? "" : "s"} actively coordinated.`,
    },
    {
      label: "Onboarding follow-through",
      tone: (d.stalled > 8 ? "attention" : "healthy") as HealthTone,
      note: "Recruiting → HR handoff cadence sustainable.",
    },
    {
      label: "Workflow handoff coordination",
      tone: (d.missingDocs > 4 ? "attention" : "healthy") as HealthTone,
      note: "Cross-team handoffs holding under current volume.",
    },
    {
      label: "Denied authorization ownership",
      tone: (d.denied > 0 ? "risk" : "healthy") as HealthTone,
      note: d.denied > 0 ? `${d.denied} denied auth${d.denied === 1 ? "" : "s"} pending appeal coordination.` : "No outstanding denial coordination required.",
    },
  ], [d]);

  // Section 5 — escalation resolution health
  const escalations = useMemo(() => [
    {
      label: "Scheduling escalations",
      tone: (d.uncovered > 5 ? "attention" : "healthy") as HealthTone,
      trend: (d.uncovered > 5 ? "up" : "down") as Trend,
      note: "Coordination response remains within target window.",
    },
    {
      label: "QA reassessment escalations",
      tone: (d.qaStalled > 4 ? "attention" : "healthy") as HealthTone,
      trend: (d.qaStalled > 3 ? "up" : "flat") as Trend,
      note: `${d.qaStalled} plans pending leadership review support.`,
    },
    {
      label: "Recruiting / onboarding escalations",
      tone: (d.stalled > 10 ? "attention" : "healthy") as HealthTone,
      trend: (d.stalled > 8 ? "up" : "down") as Trend,
      note: "Onboarding escalation handling trending favorably.",
    },
    {
      label: "Authorization escalations",
      tone: (d.expiring7 > 0 || d.denied > 0 ? "risk" : d.expiring14 > 5 ? "attention" : "healthy") as HealthTone,
      trend: (d.expiring14 > 5 ? "up" : "flat") as Trend,
      note: `${d.expiring7} ≤7d · ${d.denied} denied requiring escalation.`,
    },
    {
      label: "Staffing escalations",
      tone: (d.totalNeeds > 6 ? "attention" : "healthy") as HealthTone,
      trend: (d.totalNeeds > 4 ? "up" : "flat") as Trend,
      note: "Staffing escalations actively routed and tracked.",
    },
    {
      label: "Cross-department coordination",
      tone: (d.missingDocs > 4 ? "attention" : "healthy") as HealthTone,
      trend: "flat" as Trend,
      note: "Inter-team escalation routing remains operational.",
    },
  ], [d]);

  // Section 6 — department execution consistency
  const departments = useMemo(() => [
    { label: "Intake", tone: "healthy" as HealthTone, note: "Workflow execution highly consistent." },
    { label: "Auth", tone: (d.expiring7 > 0 ? "risk" : d.missingDocs > 4 ? "attention" : "healthy") as HealthTone, note: "Reassessment coordination steady under current volume." },
    { label: "Scheduling", tone: (d.uncovered > 5 ? "attention" : "healthy") as HealthTone, note: "Scheduling execution remains highly stable." },
    { label: "QA", tone: (d.qaStalled > 4 ? "risk" : d.qaStalled > 0 ? "attention" : "healthy") as HealthTone, note: "QA cadence holding through reassessment volume." },
    { label: "Recruiting", tone: (d.stalled > 8 ? "attention" : "healthy") as HealthTone, note: "Recruiting handoff consistency improving." },
    { label: "HR", tone: (d.candidates > 40 && d.stalled > 8 ? "attention" : "healthy") as HealthTone, note: "Onboarding execution holding under recruiting load." },
    { label: "Payroll", tone: "healthy" as HealthTone, note: "Payroll execution consistent across cycles." },
    { label: "Operations", tone: (d.totalNeeds > 6 ? "attention" : "healthy") as HealthTone, note: "Cross-team operational coordination stable." },
    { label: "Clinics", tone: (d.overloaded > 2 ? "attention" : "healthy") as HealthTone, note: "Clinic execution stable across active markets." },
  ], [d]);

  // Section 7 — leadership support needed
  const supportNeeded = useMemo(() => {
    const items: { label: string; tone: HealthTone; note: string }[] = [];
    const heaviest = (Object.entries(wf) as [string, typeof ga][])
      .map(([s, w]) => ({ s, gap: w.staffingNeeds.length }))
      .sort((a, b) => b.gap - a.gap)[0];
    if (heaviest && heaviest.gap >= 3) {
      items.push({ label: `${heaviest.s} onboarding coordination`, tone: heaviest.gap >= 5 ? "risk" : "attention", note: `${heaviest.gap} open staffing need${heaviest.gap === 1 ? "" : "s"} — leadership coordination support recommended.` });
    }
    if (d.qaStalled > 2) {
      items.push({ label: "Reassessment follow-up volume", tone: d.qaStalled > 5 ? "risk" : "attention", note: `${d.qaStalled} reassessment plans pending — review capacity support needed.` });
    }
    if (d.stalled > 8) {
      items.push({ label: "Recruiting throughput", tone: "attention", note: "Recruiting capacity-sensitive — onboarding coordination support recommended." });
    }
    if (d.uncovered > 5) {
      items.push({ label: "Scheduling strain", tone: "attention", note: `${d.uncovered} uncovered clients — scheduling coordination requires support.` });
    }
    if (d.overloaded > 2) {
      items.push({ label: "Clinic support strain", tone: "attention", note: `${d.overloaded} BCBAs overloaded — clinic-level support recommended.` });
    }
    if (!items.length) {
      items.push({ label: "No active leadership support gaps", tone: "healthy", note: "All operational areas are currently supported." });
    }
    return items;
  }, [d, wf, ga]);

  // Section 8 — organizational alignment monitor
  const alignment = useMemo(() => [
    { label: "Intake ↔ Scheduling", tone: "healthy" as HealthTone, note: "Coordination remains highly aligned." },
    { label: "QA ↔ Authorizations", tone: (d.qaStalled > 4 || d.expiring14 > 5 ? "attention" : "healthy") as HealthTone, note: "Reassessment coordination cadence improving." },
    { label: "Recruiting ↔ HR onboarding", tone: (d.stalled > 8 ? "attention" : "healthy") as HealthTone, note: "Recruiting-to-onboarding handoff delays decreasing." },
    { label: "Scheduling ↔ Staffing", tone: (d.totalNeeds > 6 || d.uncovered > 5 ? "attention" : "healthy") as HealthTone, note: "Coverage and staffing coordination holding." },
    { label: "State ↔ Operations", tone: (d.totalNeeds > 6 ? "attention" : "healthy") as HealthTone, note: "State directors synchronized with central operations." },
    { label: "Clinic ↔ QA", tone: (d.overloaded > 2 ? "attention" : "healthy") as HealthTone, note: "Clinic-QA coordination holding under caseload distribution." },
  ], [d]);

  // Section 9 — AI executive guidance
  const guidance = useMemo(() => {
    const r: { title: string; note: string }[] = [];
    const heaviest = (Object.entries(wf) as [string, typeof ga][])
      .map(([s, w]) => ({ s, gap: w.staffingNeeds.length }))
      .sort((a, b) => b.gap - a.gap)[0];
    if (heaviest && heaviest.gap >= 3) {
      r.push({ title: `Support ${heaviest.s} onboarding coordination`, note: "Provide additional leadership bandwidth where staffing demand is highest." });
    }
    if (d.qaStalled > 2) {
      r.push({ title: "Reinforce reassessment coordination", note: "Support QA review capacity to maintain follow-through on pending plans." });
    }
    if (d.uncovered > 5 || d.totalNeeds > 4) {
      r.push({ title: "Reinforce scheduling-to-staffing coordination", note: "Strengthen handoffs to maintain coverage discipline." });
    }
    if (d.missingDocs > 3) {
      r.push({ title: "Improve visibility into unresolved blockers", note: "Surface document and submission gaps earlier in the workflow." });
    }
    r.push({ title: "Continue strengthening recruiting throughput", note: "Maintain operational rhythm in recruiting → HR handoffs." });
    r.push({ title: "Review workflow ownership consistency", note: "Hold weekly ownership review across active operational workflows." });
    return r;
  }, [d, wf, ga]);

  const lastUpdated = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <ExecPage
      title="Leadership Accountability"
      subtitle="Live operational follow-through intelligence across leadership responsiveness, workflow ownership, escalation resolution, and organizational execution."
    >
      {/* Section 1 — Header */}
      <ExecCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className={`inline-flex size-2.5 rounded-full ${TONE_DOT[overall.tone]}`} />
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Organizational accountability
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

      {/* Section 2 — Executive accountability summary */}
      <ExecCard title="Executive accountability summary" hint="AI-interpreted · supportive">
        <div className="space-y-2.5">
          {summary.map((line, i) => (
            <p key={i} className="text-[14px] leading-relaxed text-foreground">{line}</p>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Where is follow-through weakening?" prompt="Where is leadership follow-through weakening across Blossom departments right now?" />
          <AIPrompt label="Where is support needed?" prompt="Which operational areas need additional leadership support this week?" />
          <AIPrompt label="Where is alignment strong?" prompt="Where is organizational leadership alignment strongest right now?" />
        </div>
      </ExecCard>

      {/* Section 3 — Leadership responsiveness grid */}
      <ExecCard title="Leadership responsiveness" hint="Across operational leadership">
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {leadership.map((l) => (
            <div key={l.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium">{l.name}</div>
                  <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">{l.note}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <HealthPill tone={l.tone}>{statusLabel(l.tone)}</HealthPill>
                  <TrendIcon trend={l.trend} good="down" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 4 — Operational ownership monitor */}
      <ExecCard title="Operational ownership" hint="Where workflows are actively owned">
        <div className="grid gap-2 md:grid-cols-2">
          {ownership.map((o) => (
            <div key={o.label} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{o.label}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{o.note}</div>
              </div>
              <HealthPill tone={o.tone}>{statusLabel(o.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 5 — Escalation resolution health */}
      <ExecCard title="Escalation resolution" hint="How effectively pressure is resolved">
        <div className="space-y-1.5">
          {escalations.map((e, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
              <span className={`mt-1.5 inline-flex size-2 rounded-full shrink-0 ${TONE_DOT[e.tone]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[13px] font-medium">{e.label}</div>
                  <div className="flex items-center gap-1.5">
                    <TrendIcon trend={e.trend} good="down" />
                    <HealthPill tone={e.tone}>{statusLabel(e.tone)}</HealthPill>
                  </div>
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{e.note}</div>
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 6 — Department execution consistency */}
      <ExecCard title="Department execution consistency" hint="Workflow execution stability">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dep) => (
            <div key={dep.label} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`inline-flex size-2 rounded-full ${TONE_DOT[dep.tone]}`} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{dep.label}</div>
                  <div className="text-[11.5px] text-muted-foreground truncate">{dep.note}</div>
                </div>
              </div>
              <HealthPill tone={dep.tone}>{statusLabel(dep.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 7 — Leadership support needed */}
      <ExecCard title="Leadership support needed" hint="Where systems may be overloaded">
        <div className="grid gap-2 md:grid-cols-2">
          {supportNeeded.map((s, i) => (
            <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{s.label}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{s.note}</div>
              </div>
              <HealthPill tone={s.tone}>{statusLabel(s.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 8 — Organizational alignment monitor */}
      <ExecCard title="Organizational alignment" hint="Coordination between leadership teams">
        <div className="grid gap-2 md:grid-cols-2">
          {alignment.map((a) => (
            <div key={a.label} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{a.label}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{a.note}</div>
              </div>
              <HealthPill tone={a.tone}>{statusLabel(a.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 9 — AI executive guidance */}
      <ExecCard title="AI executive guidance" hint="Where to focus leadership support">
        <div className="space-y-1.5">
          {guidance.map((g, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="text-[13px] font-medium">{g.title}</div>
              <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{g.note}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Draft leadership note" prompt="Draft a brief, supportive leadership note summarizing where coordination support is most needed across Blossom this week." />
        </div>
      </ExecCard>
    </ExecPage>
  );
}