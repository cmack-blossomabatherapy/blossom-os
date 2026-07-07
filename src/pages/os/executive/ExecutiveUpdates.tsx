import { useMemo } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Pin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ExecPage, ExecCard, HealthPill, AIPrompt, ActionPill, type HealthTone } from "./_shared";
import { PublishUpdateCard } from "@/components/executive/PublishUpdateCard";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";

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

function priorityFromTone(tone: HealthTone): string {
  if (tone === "blocked") return "Organization-Wide Priority";
  if (tone === "risk") return "Leadership Focus";
  if (tone === "attention") return "Important";
  return "Informational";
}

function rolloutStatus(tone: HealthTone): string {
  if (tone === "blocked") return "Needs Reinforcement";
  if (tone === "risk") return "Rolling Out";
  if (tone === "attention") return "Stabilizing";
  if (tone === "healthy") return "Adopted";
  return "Planning";
}

export default function ExecutiveUpdates() {
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
      totalNeeds: Object.values(wf).reduce((s, w) => s + w.staffingNeeds.length, 0),
      stalled: ops.recruiting.stalledCandidates.length,
      candidates: ops.recruiting.candidates.length,
      qaStalled: ops.auths.qaStalled.length,
      expiring7: ops.auths.expiring7.length,
      expiring14: ops.auths.expiring14.length,
      missingDocs: ops.auths.missingDocs.length,
      uncovered: cr.counts.uncoveredClients,
      activeClients: cr.counts.activeClients,
      blockers: ops.risks.filter((r) => r.tone === "blocked").length,
    };
  }, [wf, ops, cr]);

  // ---- Section 1: header status
  const overall = useMemo<{ label: string; tone: HealthTone }>(() => {
    const w = worst(
      d.blockers > 0 ? "blocked" : "healthy",
      d.qaStalled > 6 || d.expiring7 > 8 ? "risk" : "healthy",
      d.stalled > 8 || d.totalNeeds > 8 ? "attention" : "healthy",
      d.overloaded > 3 ? "attention" : "healthy",
    );
    if (w === "blocked") return { label: "Attention Required", tone: "blocked" };
    if (w === "risk") return { label: "High Operational Change", tone: "risk" };
    if (w === "attention") return { label: "Active Rollouts", tone: "attention" };
    return { label: "Fully Aligned", tone: "healthy" };
  }, [d]);

  // ---- Section 2: executive priority briefing
  const briefing = useMemo(() => {
    const lines: string[] = [];
    if (d.totalNeeds > 0 || d.overloaded > 0) {
      lines.push(
        `Current organizational focus remains centered on staffing stability — ${d.totalNeeds} active staffing needs and ${d.overloaded} BCBA caseloads running at full capacity.`,
      );
    } else {
      lines.push("Staffing posture remains stable across active states, with caseloads operating within healthy capacity.");
    }
    if (d.expiring14 > 0 || d.qaStalled > 0) {
      lines.push(
        `Leadership priority this week is improving reassessment turnaround — ${d.expiring14} authorizations expire within 14 days and ${d.qaStalled} QA reviews are pending coordination.`,
      );
    } else {
      lines.push("Reassessment timing is holding well; QA throughput remains aligned with leadership expectations.");
    }
    if (d.stalled > 4) {
      lines.push(
        `Recruiting and onboarding remain in active rollout — ${d.candidates} candidates in pipeline with ${d.stalled} requiring coordinated follow-up to maintain scaling readiness.`,
      );
    } else {
      lines.push("Recruiting throughput is supporting onboarding scalability with consistent operational rhythm.");
    }
    return lines;
  }, [d]);

  // ---- Section 3: featured executive updates
  const updates = useMemo(() => {
    const out: {
      id: string; title: string; body: string; tone: HealthTone;
      author: string; role: string; scope: string; tag: string; when: string;
    }[] = [];
    if (d.blockers > 0) {
      out.push({
        id: "u1",
        title: "Workflow reinforcement required across departments",
        body: `Active blockers detected in ${d.blockers} operational area${d.blockers === 1 ? "" : "s"}. Department leads asked to align and coordinate resolution this week.`,
        tone: "blocked", author: "Director of Operations", role: "Operations Leadership",
        scope: "Organization-Wide", tag: "Operations", when: "Today",
      });
    }
    if (d.totalNeeds > 0 || d.overloaded > 0) {
      out.push({
        id: "u2",
        title: "Staffing focus — protect capacity through expansion",
        body: `${d.totalNeeds} active staffing needs and ${d.overloaded} BCBA caseloads at capacity. Recruiting and HR aligned on staffing stability as the current organizational focus.`,
        tone: d.overloaded > 3 ? "risk" : "attention",
        author: "CEO", role: "Executive Leadership",
        scope: "Leadership + State Directors", tag: "Staffing", when: "This week",
      });
    }
    if (d.expiring14 > 0) {
      out.push({
        id: "u3",
        title: "Reassessment readiness — authorization renewal window",
        body: `${d.expiring14} authorizations expire within 14 days (${d.expiring7} within 7). Auth and QA coordinating reauth packets to protect continuity of care.`,
        tone: d.expiring7 > 6 ? "risk" : "attention",
        author: "Director of Operations", role: "Operations Leadership",
        scope: "Auth + QA Leadership", tag: "Authorizations", when: "This week",
      });
    }
    if (d.stalled > 4) {
      out.push({
        id: "u4",
        title: "Recruiting pipeline acceleration",
        body: `${d.stalled} candidates require coordinated outreach. Recruiting and HR aligned on onboarding handoff cadence to maintain hiring throughput.`,
        tone: "attention",
        author: "Recruiting Leadership", role: "Department Leadership",
        scope: "Recruiting + HR", tag: "Recruiting", when: "This week",
      });
    }
    out.push({
      id: "u5",
      title: "Quarterly priorities — operational focus",
      body: "Focus areas: staffing stability, reassessment readiness, onboarding scalability, and multi-state operational consistency.",
      tone: "healthy",
      author: "CEO", role: "Executive Leadership",
      scope: "Organization-Wide", tag: "Strategic", when: "Quarter",
    });
    out.push({
      id: "u6",
      title: "Weekly leadership rhythm",
      body: "Department leads to publish weekly progress notes by Friday EOD. Keep updates concise, operational, and focused on what needs leadership awareness.",
      tone: "neutral",
      author: "Director of Operations", role: "Operations Leadership",
      scope: "Department Leads", tag: "Cadence", when: "Weekly",
    });
    return out;
  }, [d]);

  // ---- Section 4: operational rollouts & initiatives
  const rollouts = useMemo(() => {
    const onboardingTone: HealthTone = d.totalNeeds > 8 ? "attention" : "healthy";
    const qaTone: HealthTone = d.qaStalled > 6 ? "risk" : d.qaStalled > 2 ? "attention" : "healthy";
    const recruitingTone: HealthTone = d.stalled > 8 ? "attention" : "healthy";
    const trainingTone: HealthTone = d.candidates > 30 ? "attention" : "healthy";
    return [
      {
        title: "Onboarding coordination workflow",
        impact: "Intake, Scheduling, HR",
        summary: d.totalNeeds > 8
          ? "Updated onboarding coordination is rolling out, with adoption stabilizing under active staffing demand."
          : "New onboarding workflow stabilizing across active states with consistent department adoption.",
        benefit: "Reduces handoff delays between intake, scheduling, and HR.",
        tone: onboardingTone, status: rolloutStatus(onboardingTone), trend: "down" as Trend,
      },
      {
        title: "QA reassessment improvements",
        impact: "Authorizations, QA, BCBA",
        summary: d.qaStalled > 2
          ? "Reassessment improvements actively rolling out with leadership reinforcement to clear pending coordination."
          : "QA reassessment improvements reducing operational delays across reauth cycles.",
        benefit: "Protects authorization continuity and reduces escalations.",
        tone: qaTone, status: rolloutStatus(qaTone), trend: "down" as Trend,
      },
      {
        title: "Recruiting flow updates",
        impact: "Recruiting, HR, Operations",
        summary: d.stalled > 8
          ? "Recruiting flow updates rolling out to accelerate stalled candidate movement and improve onboarding handoff."
          : "Recruiting flow improvements supporting consistent hiring throughput and scaling readiness.",
        benefit: "Improves hiring velocity and onboarding readiness.",
        tone: recruitingTone, status: rolloutStatus(recruitingTone), trend: "down" as Trend,
      },
      {
        title: "Training reinforcement rollout",
        impact: "Training, HR, Department Leads",
        summary: "Training reinforcement rollout improving onboarding consistency across new hires.",
        benefit: "Strengthens operational consistency and reduces ramp time.",
        tone: trainingTone, status: rolloutStatus(trainingTone), trend: "flat" as Trend,
      },
      {
        title: "Clinic expansion preparation",
        impact: "State Leadership, Operations",
        summary: "Operational scaffolding underway to support continued multi-state expansion readiness.",
        benefit: "Ensures Blossom can scale safely without operational drift.",
        tone: "neutral" as HealthTone, status: "Planning", trend: "flat" as Trend,
      },
    ];
  }, [d]);

  // ---- Section 5: leadership communication stream
  const stream = useMemo(() => {
    const items: { id: string; note: string; tone: HealthTone; tag: string; when: string }[] = [];
    items.push({
      id: "s1",
      note: `Current organizational focus: staffing stability and reassessment readiness across ${Object.keys(wf).length} active states.`,
      tone: "healthy", tag: "Direction", when: "Today",
    });
    if (d.uncovered > 0) {
      items.push({
        id: "s2",
        note: `Reminder: ${d.uncovered} active clients require coverage coordination — staffing teams aligned on resolution path.`,
        tone: "attention", tag: "Awareness", when: "Today",
      });
    }
    if (d.expiring7 > 0) {
      items.push({
        id: "s3",
        note: `Operational reminder: ${d.expiring7} authorizations expire within 7 days. Prioritize reauth packet completion.`,
        tone: "risk", tag: "Operations", when: "Today",
      });
    }
    items.push({
      id: "s4",
      note: "Growth readiness holding — leadership confirms continued safe expansion posture.",
      tone: "healthy", tag: "Growth", when: "This week",
    });
    items.push({
      id: "s5",
      note: "Operational wins: cross-department coordination strengthening on onboarding handoffs.",
      tone: "healthy", tag: "Win", when: "This week",
    });
    return items;
  }, [d, wf]);

  // ---- Section 6: organizational focus areas
  const focusAreas = useMemo(() => [
    { label: "Staffing stability", tone: (d.overloaded > 3 || d.totalNeeds > 8 ? "attention" : "healthy") as HealthTone,
      note: d.overloaded > 3 ? "Active focus — protect BCBA capacity under demand." : "Capacity holding across active states." },
    { label: "Onboarding consistency", tone: (d.candidates > 30 ? "attention" : "healthy") as HealthTone,
      note: "Reinforce handoff cadence from recruiting through training." },
    { label: "Reassessment timing", tone: (d.expiring7 > 6 || d.qaStalled > 4 ? "risk" : d.expiring14 > 0 ? "attention" : "healthy") as HealthTone,
      note: "Priority focus — maintain reauth packet flow with QA." },
    { label: "Scheduling coordination", tone: (d.uncovered > 5 ? "attention" : "healthy") as HealthTone,
      note: "Coverage coordination stable; monitor uncovered clients." },
    { label: "Training adoption", tone: "healthy" as HealthTone,
      note: "Training reinforcement supporting onboarding consistency." },
    { label: "Workflow standardization", tone: (d.blockers > 0 ? "attention" : "healthy") as HealthTone,
      note: "Department leads aligned on cross-functional consistency." },
    { label: "Escalation reduction", tone: (d.qaStalled > 6 ? "attention" : "healthy") as HealthTone,
      note: "Escalations routed cleanly across active workflows." },
    { label: "Operational scalability", tone: "healthy" as HealthTone,
      note: "Multi-state operations supporting continued expansion." },
  ], [d]);

  // ---- Section 7: active operational changes
  const changes = useMemo(() => [
    {
      title: "Updated onboarding coordination process",
      impacted: "Intake, Scheduling, HR",
      progress: d.totalNeeds > 8 ? "Stabilizing — adoption in progress" : "Adopted across departments",
      tone: (d.totalNeeds > 8 ? "attention" : "healthy") as HealthTone,
      impact: "Improves staffing readiness and reduces handoff drag.",
      guidance: "Department leads to reinforce handoff cadence weekly.",
    },
    {
      title: "New reassessment escalation routing",
      impacted: "Authorizations, QA",
      progress: d.qaStalled > 4 ? "Rolling out — reinforcement needed" : "Now active",
      tone: (d.qaStalled > 4 ? "risk" : "healthy") as HealthTone,
      impact: "Reduces reauth delays and protects authorization continuity.",
      guidance: "QA leadership to escalate stalled reviews into routing.",
    },
    {
      title: "Scheduling coordination updates",
      impacted: "Scheduling, BCBA, RBT Ops",
      progress: d.uncovered > 5 ? "Stabilizing across coverage cycle" : "Adopted",
      tone: (d.uncovered > 5 ? "attention" : "healthy") as HealthTone,
      impact: "Stabilizes onboarding flow and reduces coverage gaps.",
      guidance: "Maintain coordination rhythm with intake and HR.",
    },
    {
      title: "Recruiting flow improvements",
      impacted: "Recruiting, HR",
      progress: d.stalled > 8 ? "Rolling out" : "Stabilizing",
      tone: (d.stalled > 8 ? "attention" : "healthy") as HealthTone,
      impact: "Improves hiring throughput and onboarding readiness.",
      guidance: "Recruiting to publish weekly pipeline health update.",
    },
    {
      title: "QA process updates",
      impacted: "QA, BCBA, Authorizations",
      progress: "Adopted across reassessment workflows",
      tone: "healthy" as HealthTone,
      impact: "Reduces reassessment delays and supports BCBA coordination.",
      guidance: "Maintain reinforcement through department leads.",
    },
  ], [d]);

  // ---- Section 8: AI communication insights
  const aiInsights = useMemo(() => {
    const items: { tone: HealthTone; note: string }[] = [];
    items.push({ tone: "healthy", note: "Leadership communication remains highly aligned across departments." });
    items.push({
      tone: d.blockers > 0 ? "attention" : "healthy",
      note: d.blockers > 0
        ? "Workflow rollout adoption improving; additional reinforcement may be needed in affected areas."
        : "Workflow rollout adoption improving with consistent department engagement.",
    });
    items.push({ tone: "healthy", note: "Operational messaging consistency remains stable across active rollouts." });
    if (d.qaStalled > 4 || d.expiring7 > 6) {
      items.push({ tone: "attention", note: "Additional reinforcement may be needed for reassessment coordination changes." });
    } else {
      items.push({ tone: "healthy", note: "Reassessment coordination communication holding well across QA and Auth." });
    }
    if (d.stalled > 8) {
      items.push({ tone: "attention", note: "Recruiting communication may benefit from a brief leadership reinforcement note." });
    }
    return items;
  }, [d]);

  return (
    <ExecPage
      title="Executive Updates"
      subtitle="Leadership communication, operational priorities, strategic updates, and organizational direction across Blossom ABA."
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-[12px]">
            <span className={`size-2 rounded-full ${TONE_DOT[overall.tone]}`} />
            <span className="font-medium text-foreground">{overall.label}</span>
            <span className="text-muted-foreground">· {updates.length} updates</span>
          </div>
          <span className="text-[11.5px] text-muted-foreground">Updated just now</span>
        </div>
      }
    >
      {/* Section 2 — Executive priority briefing */}
      <ExecCard title="Executive priority briefing" hint="AI-curated">
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-background/40 to-background/60 p-5">
            <Sparkles className="mt-0.5 size-4 text-primary/80 shrink-0" />
            <div className="space-y-2.5">
              {briefing.map((line, i) => (
                <p key={i} className="text-[13.5px] leading-relaxed text-foreground/90 max-w-3xl">
                  {line}
                </p>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <AIPrompt label="Summarize this week's direction" prompt="Summarize this week's organizational direction, current priorities, and rollouts leadership should reinforce." variant="card" />
            <AIPrompt label="What needs reinforcement?" prompt="Where does communication or operational alignment need leadership reinforcement right now?" variant="card" />
          </div>
        </div>
      </ExecCard>

      {/* Section 3 — Featured executive updates */}
      <ExecCard title="Featured executive updates" hint="Curated leadership communication">
        <div className="grid gap-2.5 md:grid-cols-2">
          {updates.map((u) => (
            <div key={u.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Pin className="size-3.5 text-primary/70 shrink-0" />
                    <span className="text-[14px] font-medium truncate">{u.title}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">{u.body}</p>
                </div>
                <HealthPill tone={u.tone}>{u.tag}</HealthPill>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                <span className="font-medium text-foreground/80">{u.author}</span>
                <span>· {u.role}</span>
                <span>· {u.scope}</span>
                <span>· {u.when}</span>
                <span>· {priorityFromTone(u.tone)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <ActionPill
                  label="Acknowledge"
                  disabled
                  title="Acknowledgement tracking coming soon"
                />
                <ActionPill
                  label="Copy link"
                  onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(u.title)}`;
                    if (navigator.clipboard?.writeText) {
                      navigator.clipboard.writeText(url).then(
                        () => toast.success("Link copied"),
                        () => toast.error("Could not copy link"),
                      );
                    } else {
                      toast.error("Clipboard not available");
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 4 — Operational rollouts & initiatives */}
      <ExecCard title="Operational rollouts & initiatives" hint="In motion">
        <div className="grid gap-2.5 md:grid-cols-2">
          {rollouts.map((r) => (
            <div key={r.title} className="rounded-2xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14px] font-medium">{r.title}</div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">Impacts: {r.impact}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <TrendIcon trend={r.trend} good="down" />
                  <HealthPill tone={r.tone}>{r.status}</HealthPill>
                </div>
              </div>
              <p className="mt-2 text-[13px] text-muted-foreground">{r.summary}</p>
              <p className="mt-1.5 text-[12px] text-foreground/70">
                <span className="text-muted-foreground">Expected benefit — </span>{r.benefit}
              </p>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 5 — Leadership communication stream */}
      <ExecCard title="Leadership communication stream" hint="Concise · high-value">
        <div className="space-y-1.5">
          {stream.map((s) => (
            <div key={s.id} className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/30 px-3.5 py-2.5">
              <span className={`mt-1.5 size-2 rounded-full ${TONE_DOT[s.tone]} shrink-0`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-foreground/90">{s.note}</p>
                <div className="mt-1 text-[11px] text-muted-foreground">{s.tag} · {s.when}</div>
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 6 — Organizational focus areas */}
      <ExecCard title="Organizational focus areas" hint="Where leadership wants attention">
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {focusAreas.map((f) => (
            <div key={f.label} className="rounded-2xl border border-border/60 bg-background/40 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium">{f.label}</span>
                <span className={`size-2 rounded-full ${TONE_DOT[f.tone]}`} />
              </div>
              <p className="mt-1.5 text-[12px] text-muted-foreground">{f.note}</p>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 7 — Active operational changes */}
      <ExecCard title="Active operational changes" hint="In rollout">
        <div className="space-y-2">
          {changes.map((c) => (
            <div key={c.title} className="rounded-2xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14px] font-medium">{c.title}</div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">Departments: {c.impacted}</div>
                </div>
                <HealthPill tone={c.tone}>{c.progress}</HealthPill>
              </div>
              <div className="mt-2 grid gap-1 md:grid-cols-2">
                <p className="text-[12.5px] text-muted-foreground">
                  <span className="text-foreground/70">Impact — </span>{c.impact}
                </p>
                <p className="text-[12.5px] text-muted-foreground">
                  <span className="text-foreground/70">Guidance — </span>{c.guidance}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* Section 8 — Executive AI communication insights */}
      <ExecCard title="AI communication insights" hint="Alignment intelligence">
        <div className="space-y-1.5">
          {aiInsights.map((i, idx) => (
            <div key={idx} className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/30 px-3.5 py-2.5">
              <span className={`mt-1.5 size-2 rounded-full ${TONE_DOT[i.tone]} shrink-0`} />
              <p className="text-[13px] text-foreground/90">{i.note}</p>
            </div>
          ))}
          <div className="flex flex-wrap gap-1.5 pt-2">
            <AIPrompt label="How aligned is the organization?" prompt="How aligned is the Blossom organization operationally right now across departments and rollouts?" variant="card" />
            <AIPrompt label="Detect communication gaps" prompt="Where are communication gaps appearing across Blossom departments?" variant="card" />
            <AIPrompt label="Recommend reinforcement messaging" prompt="Recommend reinforcement messaging for emerging operational priorities." variant="card" />
          </div>
        </div>
      </ExecCard>

      {/* Section 9 — Publish a real executive update (persisted) */}
      <PublishUpdateCard />
    </ExecPage>
  );
}
