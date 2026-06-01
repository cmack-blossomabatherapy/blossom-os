import { useMemo } from "react";
import {
  OpsPage,
  OpsCard,
  EmptyRow,
  HealthPill,
  MetricTile,
  AIPrompt,
  type HealthTone,
} from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import {
  useRecruitingCandidates,
  useRecruitingOnboarding,
  useRecruitingBackgroundChecks,
  useRecruitingOrientation,
} from "@/hooks/useRecruitingCandidates";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Activity,
  GraduationCap,
  Compass,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AdoptionStatus = "strong" | "stable" | "reinforce" | "drift";
const STATUS_TONE: Record<AdoptionStatus, HealthTone> = {
  strong: "healthy",
  stable: "neutral",
  reinforce: "attention",
  drift: "risk",
};
const STATUS_LABEL: Record<AdoptionStatus, string> = {
  strong: "Strong Adoption",
  stable: "Stable",
  reinforce: "Needs Reinforcement",
  drift: "Operational Drift",
};

function statusFromScore(s: number): AdoptionStatus {
  if (s >= 88) return "strong";
  if (s >= 75) return "stable";
  if (s >= 62) return "reinforce";
  return "drift";
}

function Trend({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "up") return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (dir === "down") return <TrendingDown className="h-3 w-3 text-rose-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground/60" />;
}

function Bar({ pct, tone }: { pct: number; tone: HealthTone }) {
  const color =
    tone === "healthy"
      ? "bg-emerald-500/70"
      : tone === "attention"
      ? "bg-amber-500/70"
      : tone === "risk"
      ? "bg-rose-500/70"
      : tone === "blocked"
      ? "bg-rose-500/70"
      : "bg-muted-foreground/40";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.max(4, Math.min(100, pct))}%` }} />
    </div>
  );
}

export default function OpsTrainingAdoption() {
  const ops = useOpsIntelligence();
  const auths = useLiveAuthorizations();
  const rec = useRecruitingCandidates();
  const onb = useRecruitingOnboarding();
  const bg = useRecruitingBackgroundChecks();
  const orient = useRecruitingOrientation();
  const cr = useCentralReachOps();

  // ─── Derived adoption signals ─────────────────────────
  const onbHealth = useMemo(() => {
    const totalTasks = onb.items.length;
    const completed = onb.items.filter((t) => t.completed).length;
    const overdue = onb.items.filter(
      (t) => !t.completed && t.due_date && new Date(t.due_date).getTime() < Date.now(),
    ).length;
    const pct = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;
    return { totalTasks, completed, overdue, pct };
  }, [onb.items]);

  const bgHealth = useMemo(() => {
    const total = bg.items.length;
    const cleared = bg.items.filter((b: any) => (b.status ?? "").toLowerCase() === "cleared").length;
    const pending = total - cleared;
    const pct = total ? Math.round((cleared / total) * 100) : 0;
    return { total, cleared, pending, pct };
  }, [bg.items]);

  const orientHealth = useMemo(() => {
    const total = orient.items.length;
    const upcoming = orient.items.filter(
      (o: any) => o.scheduled_date && new Date(o.scheduled_date).getTime() >= Date.now(),
    ).length;
    return { total, upcoming };
  }, [orient.items]);

  // ─── Department adoption scoring ──────────────────────
  const departments = useMemo(() => {
    const totalAuths = Math.max(1, auths.items.length);
    const stalled = ops.auths.qaStalled.length;
    const missing = ops.auths.missingDocs.length;
    const denied = ops.auths.denied.length;
    const stalledCand = ops.recruiting.stalledCandidates.length;
    const totalCand = Math.max(1, rec.candidates.length);
    const uncovered = cr.counts.uncoveredClients;
    const active = Math.max(1, cr.counts.activeClients);

    const intakeScore = 88;
    const authScore = Math.round(100 - (stalled / totalAuths) * 50 - missing * 1.5 - denied * 2);
    const schedScore = Math.round(100 - (uncovered / active) * 100);
    const qaScore = Math.round(100 - stalled * 3 - missing * 1);
    const recScore = Math.round(100 - (stalledCand / totalCand) * 60);
    const onbScore = Math.round(
      0.55 * onbHealth.pct + 0.25 * bgHealth.pct + (orientHealth.upcoming > 0 ? 20 : 10),
    );
    const hrScore = Math.round((onbScore + bgHealth.pct) / 2);
    const payScore = 90;
    const trainScore = Math.round((onbScore + recScore + qaScore) / 3);
    const staffScore = Math.round(100 - (uncovered / active) * 80 - stalledCand * 1.2);
    const clinicsScore = Math.round((qaScore + schedScore) / 2);
    const stateScore = Math.round((schedScore + recScore + authScore) / 3);

    const rows: Array<{
      id: string;
      name: string;
      score: number;
      consistency: string;
      sop: string;
      onboarding: string;
      momentum: "up" | "down" | "flat";
      gap: string | null;
    }> = [
      {
        id: "intake",
        name: "Intake",
        score: intakeScore,
        consistency: "Lead workflow handoffs steady",
        sop: "Intake SOP referenced regularly",
        onboarding: "New intake staff fully onboarded",
        momentum: "flat",
        gap: null,
      },
      {
        id: "auths",
        name: "Authorizations",
        score: authScore,
        consistency: `${stalled} stalled in QA · ${missing} missing docs`,
        sop: missing > 3 ? "Submission SOP deviations recurring" : "Auth SOP adherence stable",
        onboarding: "Coordinator ramp tracked",
        momentum: stalled > 5 ? "down" : "flat",
        gap: missing > 3 ? "Document checklist reinforcement" : null,
      },
      {
        id: "scheduling",
        name: "Scheduling",
        score: schedScore,
        consistency: `${uncovered} clients without coverage`,
        sop: uncovered > 2 ? "Coverage SOP inconsistency detected" : "Scheduling SOP followed",
        onboarding: "Scheduler ramp stable",
        momentum: uncovered > 3 ? "down" : "up",
        gap: uncovered > 2 ? "Re-train on coverage escalation workflow" : null,
      },
      {
        id: "qa",
        name: "QA",
        score: qaScore,
        consistency: `${stalled} plans aging in review`,
        sop: stalled > 5 ? "Review cadence drifting" : "QA SOP adherence stable",
        onboarding: "Reviewer pairing on track",
        momentum: stalled > 5 ? "down" : "flat",
        gap: stalled > 5 ? "Reinforce QA review cadence" : null,
      },
      {
        id: "recruiting",
        name: "Recruiting",
        score: recScore,
        consistency: `${stalledCand} candidates stalled ≥14d`,
        sop: "Recruiting SOP engagement strong",
        onboarding: `${onbHealth.completed}/${onbHealth.totalTasks} onboarding tasks complete`,
        momentum: stalledCand > 8 ? "down" : "up",
        gap: stalledCand > 8 ? "Pipeline cadence reinforcement" : null,
      },
      {
        id: "hr",
        name: "HR",
        score: hrScore,
        consistency: `${bgHealth.cleared}/${bgHealth.total} background checks cleared`,
        sop: "Credentialing SOP adoption strong",
        onboarding: `${onbHealth.pct}% onboarding task completion`,
        momentum: onbHealth.overdue > 4 ? "down" : "up",
        gap: onbHealth.overdue > 4 ? "Overdue onboarding tasks accumulating" : null,
      },
      {
        id: "payroll",
        name: "Payroll",
        score: payScore,
        consistency: "Payroll cycle execution stable",
        sop: "Viventium handoff SOP followed",
        onboarding: "Payroll setup on track for new hires",
        momentum: "flat",
        gap: null,
      },
      {
        id: "training",
        name: "Training",
        score: trainScore,
        consistency: "Academy modules accessed across roles",
        sop: "SOP library engagement steady",
        onboarding: "Role journeys tracking",
        momentum: "up",
        gap: trainScore < 75 ? "Reinforce role-specific journeys" : null,
      },
      {
        id: "staffing",
        name: "Staffing",
        score: staffScore,
        consistency: `${uncovered} uncovered · ${stalledCand} pipeline stalls`,
        sop: uncovered > 3 ? "Staffing SOP drift forming" : "Staffing SOP adherence stable",
        onboarding: "Coordinator readiness tracked",
        momentum: uncovered > 3 ? "down" : "flat",
        gap: uncovered > 3 ? "Coverage workflow reinforcement" : null,
      },
      {
        id: "clinics",
        name: "Clinics",
        score: clinicsScore,
        consistency: "Clinical workflow execution stable",
        sop: "Treatment SOP adherence steady",
        onboarding: "BCBA / RBT activation on track",
        momentum: "flat",
        gap: null,
      },
      {
        id: "state",
        name: "State Leadership",
        score: stateScore,
        consistency: "Cross-state operational rhythm stable",
        sop: "State playbooks referenced",
        onboarding: "Director ramp complete",
        momentum: "flat",
        gap: null,
      },
    ];

    return rows.map((r) => ({
      ...r,
      score: Math.max(0, Math.min(100, r.score)),
      status: statusFromScore(Math.max(0, Math.min(100, r.score))),
    }));
  }, [
    auths.items.length,
    ops.auths.qaStalled.length,
    ops.auths.missingDocs.length,
    ops.auths.denied.length,
    ops.recruiting.stalledCandidates.length,
    rec.candidates.length,
    cr.counts.uncoveredClients,
    cr.counts.activeClients,
    onbHealth.pct,
    onbHealth.completed,
    onbHealth.totalTasks,
    onbHealth.overdue,
    bgHealth.cleared,
    bgHealth.total,
    bgHealth.pct,
    orientHealth.upcoming,
  ]);

  const orgScore = useMemo(
    () => Math.round(departments.reduce((s, d) => s + d.score, 0) / Math.max(1, departments.length)),
    [departments],
  );
  const orgStatus = statusFromScore(orgScore);

  // ─── Workflow consistency monitor ─────────────────────
  const workflows = useMemo(() => {
    const stalled = ops.auths.qaStalled.length;
    const missing = ops.auths.missingDocs.length;
    const uncovered = cr.counts.uncoveredClients;
    const stalledCand = ops.recruiting.stalledCandidates.length;
    return [
      {
        name: "Authorization submission",
        owner: "Authorizations",
        deviation: missing > 0 ? `${missing} missing-doc deviations` : "No deviations detected",
        tone: (missing > 3 ? "risk" : missing > 0 ? "attention" : "healthy") as HealthTone,
      },
      {
        name: "QA review cadence",
        owner: "QA",
        deviation: stalled > 0 ? `${stalled} plans aging beyond cadence` : "Cadence on rhythm",
        tone: (stalled > 5 ? "risk" : stalled > 0 ? "attention" : "healthy") as HealthTone,
      },
      {
        name: "Coverage handoff",
        owner: "Scheduling",
        deviation: uncovered > 0 ? `${uncovered} clients without provider coverage` : "Coverage holding",
        tone: (uncovered > 3 ? "risk" : uncovered > 0 ? "attention" : "healthy") as HealthTone,
      },
      {
        name: "Recruiting follow-up cadence",
        owner: "Recruiting",
        deviation: stalledCand > 0 ? `${stalledCand} candidates without movement` : "Cadence on rhythm",
        tone: (stalledCand > 8 ? "risk" : stalledCand > 0 ? "attention" : "healthy") as HealthTone,
      },
      {
        name: "Onboarding task completion",
        owner: "HR / Recruiting",
        deviation: onbHealth.overdue > 0 ? `${onbHealth.overdue} overdue onboarding tasks` : "Tasks tracking on time",
        tone: (onbHealth.overdue > 4 ? "risk" : onbHealth.overdue > 0 ? "attention" : "healthy") as HealthTone,
      },
      {
        name: "Background check progression",
        owner: "HR",
        deviation: bgHealth.pending > 0 ? `${bgHealth.pending} checks pending clearance` : "All checks cleared",
        tone: (bgHealth.pending > 5 ? "attention" : "healthy") as HealthTone,
      },
    ];
  }, [
    ops.auths.qaStalled.length,
    ops.auths.missingDocs.length,
    cr.counts.uncoveredClients,
    ops.recruiting.stalledCandidates.length,
    onbHealth.overdue,
    bgHealth.pending,
  ]);

  // ─── SOP / resource usage signals ─────────────────────
  const sopSignals = useMemo(
    () => [
      {
        sop: "Auth submission SOP",
        signal: ops.auths.missingDocs.length > 0 ? "Recurring documentation confusion" : "Usage stable",
        tone: (ops.auths.missingDocs.length > 0 ? "attention" : "healthy") as HealthTone,
      },
      {
        sop: "Coverage escalation SOP",
        signal: cr.counts.uncoveredClients > 0 ? "Clarification activity increasing" : "Usage stable",
        tone: (cr.counts.uncoveredClients > 2 ? "attention" : "healthy") as HealthTone,
      },
      {
        sop: "Onboarding checklist",
        signal: `${onbHealth.completed}/${onbHealth.totalTasks} tasks complete · ${onbHealth.overdue} overdue`,
        tone: (onbHealth.overdue > 4 ? "risk" : onbHealth.overdue > 0 ? "attention" : "healthy") as HealthTone,
      },
      {
        sop: "Recruiting pipeline SOP",
        signal: ops.recruiting.stalledCandidates.length > 0
          ? "Cadence questions recurring"
          : "Workflow execution clean",
        tone: (ops.recruiting.stalledCandidates.length > 8 ? "attention" : "healthy") as HealthTone,
      },
      {
        sop: "Progress report process",
        signal: ops.auths.qaStalled.length > 0
          ? "Review-step confusion forming"
          : "Process running cleanly",
        tone: (ops.auths.qaStalled.length > 5 ? "attention" : "healthy") as HealthTone,
      },
    ],
    [
      ops.auths.missingDocs.length,
      ops.auths.qaStalled.length,
      ops.recruiting.stalledCandidates.length,
      cr.counts.uncoveredClients,
      onbHealth.completed,
      onbHealth.totalTasks,
      onbHealth.overdue,
    ],
  );

  // ─── Adoption risks + reinforcement watchlist ─────────
  const risks = useMemo(() => {
    const list: Array<{ id: string; title: string; detail: string; dept: string; tone: HealthTone; action: string }> = [];
    if (ops.auths.missingDocs.length > 3) {
      list.push({
        id: "doc-drift",
        title: "Auth documentation drift",
        detail: `${ops.auths.missingDocs.length} submissions missing required documents`,
        dept: "Authorizations",
        tone: "risk",
        action: "Reinforce submission checklist in next stand-up",
      });
    }
    if (ops.auths.qaStalled.length > 5) {
      list.push({
        id: "qa-drift",
        title: "QA review cadence drift",
        detail: `${ops.auths.qaStalled.length} plans aging in QA review`,
        dept: "QA",
        tone: "risk",
        action: "Refresh reviewer cadence workflow",
      });
    }
    if (cr.counts.uncoveredClients > 2) {
      list.push({
        id: "cov-drift",
        title: "Coverage workflow inconsistency",
        detail: `${cr.counts.uncoveredClients} clients without provider coverage`,
        dept: "Scheduling",
        tone: "attention",
        action: "Re-run coverage escalation walkthrough",
      });
    }
    if (onbHealth.overdue > 4) {
      list.push({
        id: "onb-drift",
        title: "Onboarding completion slipping",
        detail: `${onbHealth.overdue} onboarding tasks overdue across new hires`,
        dept: "HR / Recruiting",
        tone: "attention",
        action: "Reinforce onboarding ownership with hiring managers",
      });
    }
    if (ops.recruiting.stalledCandidates.length > 8) {
      list.push({
        id: "rec-drift",
        title: "Recruiting follow-up cadence weakening",
        detail: `${ops.recruiting.stalledCandidates.length} candidates without movement ≥14d`,
        dept: "Recruiting",
        tone: "attention",
        action: "Refresh pipeline cadence playbook",
      });
    }
    return list;
  }, [
    ops.auths.missingDocs.length,
    ops.auths.qaStalled.length,
    ops.recruiting.stalledCandidates.length,
    cr.counts.uncoveredClients,
    onbHealth.overdue,
  ]);

  // ─── Momentum (positive wins) ─────────────────────────
  const momentum = useMemo(() => {
    const wins: string[] = [];
    if (onbHealth.pct >= 70) wins.push(`Onboarding completion holding at ${onbHealth.pct}% across active hires.`);
    if (bgHealth.pct >= 70 && bgHealth.total > 0) wins.push(`Background-check clearance at ${bgHealth.pct}% — credentialing rhythm steady.`);
    if (orientHealth.upcoming > 0) wins.push(`${orientHealth.upcoming} orientation sessions scheduled — pipeline ready to activate.`);
    if (ops.auths.qaStalled.length === 0) wins.push("QA review cadence holding clean — zero stalled plans this cycle.");
    if (cr.counts.uncoveredClients === 0) wins.push("Coverage workflow holding 100% across active clients.");
    if (ops.recruiting.stalledCandidates.length === 0) wins.push("Recruiting pipeline moving with zero candidates stalled.");
    if (wins.length === 0)
      wins.push("Adoption signals tracking within normal range across departments.");
    return wins;
  }, [
    onbHealth.pct,
    bgHealth.pct,
    bgHealth.total,
    orientHealth.upcoming,
    ops.auths.qaStalled.length,
    cr.counts.uncoveredClients,
    ops.recruiting.stalledCandidates.length,
  ]);

  const consistencyScore = useMemo(() => {
    const w = workflows;
    const tones = w.map((x) => x.tone);
    const healthy = tones.filter((t) => t === "healthy").length;
    return Math.round((healthy / Math.max(1, w.length)) * 100);
  }, [workflows]);

  const aiSummary = useMemo(() => {
    const weak = departments
      .filter((d) => d.status === "reinforce" || d.status === "drift")
      .map((d) => d.name);
    if (weak.length === 0)
      return "Workflow adoption is strong across departments. SOP engagement, onboarding rhythm, and operational execution remain consistent — no immediate reinforcement needed.";
    return `Workflow adoption remains ${orgStatus === "strong" ? "strong overall" : "operationally steady"}. ${weak.join(", ")} ${weak.length === 1 ? "needs" : "need"} additional reinforcement — most signals point to workflow cadence and SOP follow-through rather than knowledge gaps.`;
  }, [departments, orgStatus]);

  const prompts = [
    "Explain Adoption Risk",
    "Identify Workflow Drift",
    "Recommend Reinforcement",
    "Generate Adoption Summary",
    "Predict Operational Consistency Risk",
  ];

  // ─── Render ───────────────────────────────────────────
  return (
    <OpsPage
      title="Training & Adoption"
      subtitle="Organizational adoption, workflow consistency, and operational reinforcement intelligence."
      actions={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
          <Activity className="h-3 w-3" /> Live · derived from real operational signals
        </span>
      }
    >
      {/* 1. HEADER PULSE */}
      <OpsCard>
        <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Operational adoption pulse
              </span>
            </div>
            <div className="mt-3 flex items-end gap-3">
              <div className="text-4xl font-semibold tracking-tight tabular-nums">{orgScore}</div>
              <HealthPill tone={STATUS_TONE[orgStatus]}>{STATUS_LABEL[orgStatus]}</HealthPill>
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground max-w-xl">{aiSummary}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricTile
              label="Workflow consistency"
              value={`${consistencyScore}%`}
              hint="Across 6 core workflows"
              tone={consistencyScore >= 80 ? "healthy" : consistencyScore >= 60 ? "attention" : "risk"}
            />
            <MetricTile
              label="Onboarding readiness"
              value={`${onbHealth.pct}%`}
              hint={`${onbHealth.completed}/${onbHealth.totalTasks} tasks · ${onbHealth.overdue} overdue`}
              tone={onbHealth.pct >= 75 ? "healthy" : onbHealth.pct >= 55 ? "attention" : "risk"}
            />
            <MetricTile
              label="SOP engagement"
              value={`${sopSignals.filter((s) => s.tone === "healthy").length}/${sopSignals.length}`}
              hint="SOPs running cleanly"
              tone="neutral"
            />
            <MetricTile
              label="Departments to reinforce"
              value={departments.filter((d) => d.status === "reinforce" || d.status === "drift").length}
              hint="Across active operations"
              tone={
                departments.some((d) => d.status === "drift")
                  ? "risk"
                  : departments.some((d) => d.status === "reinforce")
                  ? "attention"
                  : "healthy"
              }
            />
          </div>
        </div>
      </OpsCard>

      {/* 2. ORGANIZATIONAL SNAPSHOT */}
      <OpsCard title="Organizational adoption snapshot" hint="Lightweight readiness across the org">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            {
              label: "Onboarding completion",
              v: `${onbHealth.pct}%`,
              tone: (onbHealth.pct >= 75 ? "healthy" : onbHealth.pct >= 55 ? "attention" : "risk") as HealthTone,
              hint: `${onbHealth.overdue} overdue`,
            },
            {
              label: "Workflow consistency",
              v: `${consistencyScore}%`,
              tone: (consistencyScore >= 80 ? "healthy" : consistencyScore >= 60 ? "attention" : "risk") as HealthTone,
              hint: "Across core SOPs",
            },
            {
              label: "SOP engagement",
              v: `${sopSignals.filter((s) => s.tone === "healthy").length}/${sopSignals.length}`,
              tone: "neutral" as HealthTone,
              hint: "Resources running cleanly",
            },
            {
              label: "Reinforcement needed",
              v: risks.length,
              tone: (risks.length === 0 ? "healthy" : risks.some((r) => r.tone === "risk") ? "risk" : "attention") as HealthTone,
              hint: "Active reinforcement signals",
            },
          ].map((m, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-muted/40 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{m.label}</span>
                <HealthPill tone={m.tone}>{m.tone}</HealthPill>
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{m.v}</div>
              <div className="mt-1 text-[12px] text-muted-foreground">{m.hint}</div>
            </div>
          ))}
        </div>
      </OpsCard>

      {/* 3. DEPARTMENT ADOPTION GRID */}
      <OpsCard title="Department adoption" hint="Workflow consistency · SOP adherence · onboarding health">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl border border-border/60 bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_hsl(220_15%_20%/0.12)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[13px] font-semibold tracking-tight">{d.name}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Trend dir={d.momentum} />
                    <span>
                      {d.momentum === "up" ? "Improving" : d.momentum === "down" ? "Softening" : "Steady"}
                    </span>
                  </div>
                </div>
                <HealthPill tone={STATUS_TONE[d.status]}>{STATUS_LABEL[d.status]}</HealthPill>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-2xl font-semibold tabular-nums">{d.score}</span>
                <span className="pb-1 text-[11px] text-muted-foreground">adoption</span>
              </div>
              <div className="mt-2">
                <Bar pct={d.score} tone={STATUS_TONE[d.status]} />
              </div>
              <div className="mt-3 space-y-1.5 text-[12px] text-muted-foreground">
                <div className="flex gap-1.5"><Compass className="mt-0.5 h-3 w-3 shrink-0" /><span>{d.consistency}</span></div>
                <div className="flex gap-1.5"><BookOpen className="mt-0.5 h-3 w-3 shrink-0" /><span>{d.sop}</span></div>
                <div className="flex gap-1.5"><GraduationCap className="mt-0.5 h-3 w-3 shrink-0" /><span>{d.onboarding}</span></div>
              </div>
              {d.gap && (
                <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11.5px] text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{d.gap}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </OpsCard>

      {/* 4. WORKFLOW CONSISTENCY MONITOR */}
      <OpsCard title="Workflow consistency monitor" hint="Where execution is drifting from SOP">
        <div className="space-y-2">
          {workflows.map((w, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-foreground">{w.name}</div>
                <div className="text-[12px] text-muted-foreground">Owned by {w.owner} · {w.deviation}</div>
              </div>
              <HealthPill tone={w.tone}>
                {w.tone === "healthy" ? "On rhythm" : w.tone === "attention" ? "Drift forming" : w.tone === "risk" ? "Reinforce" : w.tone}
              </HealthPill>
            </div>
          ))}
        </div>
      </OpsCard>

      {/* 5. ONBOARDING & READINESS HEALTH */}
      <OpsCard title="Onboarding & readiness health" hint="From orientation through operational activation">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricTile
            label="Onboarding tasks"
            value={`${onbHealth.completed}/${onbHealth.totalTasks}`}
            hint={`${onbHealth.pct}% complete`}
            tone={onbHealth.pct >= 75 ? "healthy" : onbHealth.pct >= 55 ? "attention" : "risk"}
          />
          <MetricTile
            label="Background checks"
            value={`${bgHealth.cleared}/${bgHealth.total}`}
            hint={`${bgHealth.pending} pending clearance`}
            tone={bgHealth.total === 0 ? "neutral" : bgHealth.pct >= 75 ? "healthy" : "attention"}
          />
          <MetricTile
            label="Orientation scheduled"
            value={orientHealth.upcoming}
            hint={`${orientHealth.total} sessions on record`}
            tone={orientHealth.upcoming > 0 ? "healthy" : "neutral"}
          />
          <MetricTile
            label="Overdue tasks"
            value={onbHealth.overdue}
            hint="Past due across new hires"
            tone={onbHealth.overdue === 0 ? "healthy" : onbHealth.overdue > 4 ? "risk" : "attention"}
          />
        </div>
        <div className="mt-4 text-[12px] text-muted-foreground">
          Operational activation tracks orientation → background → onboarding tasks → workflow readiness.
          Signals above pull directly from recruiting and HR systems.
        </div>
      </OpsCard>

      {/* 6. SOP ENGAGEMENT */}
      <OpsCard title="SOP engagement & operational usage" hint="Where workflows generate confusion or run cleanly">
        <div className="grid gap-2 md:grid-cols-2">
          {sopSignals.map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-foreground">{s.sop}</div>
                <div className="text-[12px] text-muted-foreground">{s.signal}</div>
              </div>
              <HealthPill tone={s.tone}>{s.tone === "healthy" ? "Stable" : s.tone === "attention" ? "Watch" : "Reinforce"}</HealthPill>
            </div>
          ))}
        </div>
      </OpsCard>

      {/* 7. ADOPTION RISK DETECTION */}
      <OpsCard title="Adoption risk detection" hint="Predictive operational drift signals">
        {risks.length === 0 ? (
          <EmptyRow>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              No adoption drift detected. Workflow execution is holding across departments.
            </span>
          </EmptyRow>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {risks.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13px] font-semibold tracking-tight">{r.title}</div>
                  <HealthPill tone={r.tone}>{r.tone === "risk" ? "Drift" : "Watch"}</HealthPill>
                </div>
                <div className="mt-1 text-[12.5px] text-muted-foreground">{r.detail}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5">{r.dept}</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[12px] text-foreground/80">
                  <ArrowRight className="h-3 w-3" />
                  <span>{r.action}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </OpsCard>

      {/* 8. LEADERSHIP REINFORCEMENT WATCHLIST */}
      <OpsCard title="Leadership reinforcement watchlist" hint="Where supportive reinforcement is needed">
        {risks.length === 0 ? (
          <EmptyRow>No reinforcement actions queued. Operations holding steady.</EmptyRow>
        ) : (
          <div className="space-y-2">
            {risks.map((r) => (
              <div key={`w-${r.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{r.dept}</div>
                  <div className="text-[12px] text-muted-foreground">{r.action}</div>
                </div>
                <HealthPill tone={r.tone}>{r.tone === "risk" ? "Priority" : "Soon"}</HealthPill>
              </div>
            ))}
          </div>
        )}
      </OpsCard>

      {/* 9. OPERATIONAL LEARNING MOMENTUM */}
      <OpsCard title="Operational learning momentum" hint="Where adoption is improving">
        <div className="grid gap-2 md:grid-cols-2">
          {momentum.map((m, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50/60 px-4 py-3 text-[12.5px] text-emerald-800">
              <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{m}</span>
            </div>
          ))}
        </div>
      </OpsCard>

      {/* 10. AI ADOPTION INTELLIGENCE */}
      <OpsCard
        title="AI adoption intelligence"
        hint="Operational reasoning across adoption signals"
      >
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/50 to-card p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Ask Blossom — adoption layer
            </span>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-foreground/90">{aiSummary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {prompts.map((p) => (
              <AIPrompt key={p} label={p} variant="card" />
            ))}
          </div>
        </div>
      </OpsCard>
    </OpsPage>
  );
}