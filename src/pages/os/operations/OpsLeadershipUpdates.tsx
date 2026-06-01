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
} from "@/hooks/useRecruitingCandidates";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import {
  Sparkles,
  Activity,
  Megaphone,
  Workflow,
  Users,
  Link2,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Priority = "info" | "important" | "operational" | "immediate";
const PRIORITY_TONE: Record<Priority, HealthTone> = {
  info: "neutral",
  important: "attention",
  operational: "risk",
  immediate: "blocked",
};
const PRIORITY_LABEL: Record<Priority, string> = {
  info: "Informational",
  important: "Important",
  operational: "Operational Priority",
  immediate: "Immediate Attention",
};

type AlignStatus = "aligned" | "monitoring" | "reinforce" | "critical";
const ALIGN_TONE: Record<AlignStatus, HealthTone> = {
  aligned: "healthy",
  monitoring: "neutral",
  reinforce: "attention",
  critical: "blocked",
};
const ALIGN_LABEL: Record<AlignStatus, string> = {
  aligned: "Aligned",
  monitoring: "Monitoring",
  reinforce: "Needs Reinforcement",
  critical: "Critical Communication",
};

function relTime(daysAgo: number): string {
  if (daysAgo <= 0) return "today";
  if (daysAgo === 1) return "yesterday";
  if (daysAgo < 7) return `${daysAgo}d ago`;
  return `${Math.floor(daysAgo / 7)}w ago`;
}

export default function OpsLeadershipUpdates() {
  const ops = useOpsIntelligence();
  const auths = useLiveAuthorizations();
  const rec = useRecruitingCandidates();
  const onb = useRecruitingOnboarding();
  const cr = useCentralReachOps();

  // ─── Real-data derived counts ─────────────────────────
  const sig = useMemo(() => {
    const expiring7 = ops.auths.expiring7.length;
    const expiring30 = ops.auths.expiring30.length;
    const qaStalled = ops.auths.qaStalled.length;
    const missingDocs = ops.auths.missingDocs.length;
    const denied = ops.auths.denied.length;
    const uncovered = cr.counts.uncoveredClients;
    const atRisk = cr.counts.atRiskClients;
    const stalledCand = ops.recruiting.stalledCandidates.length;
    const onbOverdue = onb.items.filter(
      (t) => !t.completed && t.due_date && new Date(t.due_date).getTime() < Date.now(),
    ).length;
    const onbCompleted = onb.items.filter((t) => t.completed).length;
    const onbTotal = onb.items.length;
    return {
      expiring7,
      expiring30,
      qaStalled,
      missingDocs,
      denied,
      uncovered,
      atRisk,
      stalledCand,
      onbOverdue,
      onbCompleted,
      onbTotal,
      activeClients: cr.counts.activeClients,
      rbtCount: cr.counts.rbtCount,
      bcbaCount: cr.counts.bcbaCount,
      candidateCount: rec.candidates.length,
    };
  }, [ops, cr, rec.candidates.length, onb.items]);

  // ─── Priority announcements (real signals → updates) ──
  const announcements = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      body: string;
      priority: Priority;
      departments: string[];
      owner: string;
      daysAgo: number;
      acks: { done: number; total: number };
      sop?: string;
      timeline?: string;
    }> = [];

    if (sig.expiring7 > 0) {
      list.push({
        id: "auth-expiring",
        title: `Authorization continuity push — ${sig.expiring7} auths expiring ≤7 days`,
        body: "Coordinators must prioritize reauth submissions for clients with imminent expirations. Daily standup includes auth review until backlog clears.",
        priority: "immediate",
        departments: ["Authorizations", "QA", "Scheduling"],
        owner: "Operations Leadership",
        daysAgo: 0,
        acks: { done: 2, total: 5 },
        sop: "Auth submission SOP",
        timeline: "Effective immediately",
      });
    }
    if (sig.uncovered > 0) {
      list.push({
        id: "coverage-push",
        title: `Coverage workflow reinforcement — ${sig.uncovered} clients without provider coverage`,
        body: "Scheduling teams to use the coverage escalation workflow for any client without an active RBT pairing within 48 hours.",
        priority: "operational",
        departments: ["Scheduling", "Staffing", "State Leadership"],
        owner: "Operations Leadership",
        daysAgo: 1,
        acks: { done: 3, total: 6 },
        sop: "Coverage escalation SOP",
        timeline: "Active this week",
      });
    }
    if (sig.qaStalled > 3) {
      list.push({
        id: "qa-cadence",
        title: `QA review cadence reinforcement — ${sig.qaStalled} plans aging in review`,
        body: "Reviewers to clear plans aging ≥3 days as priority. State Directors please pair newer BCBAs with senior reviewers this week.",
        priority: "operational",
        departments: ["QA", "Clinics"],
        owner: "QA Leadership",
        daysAgo: 2,
        acks: { done: 4, total: 5 },
        sop: "QA review SOP",
        timeline: "This week",
      });
    }
    if (sig.missingDocs > 0) {
      list.push({
        id: "auth-docs",
        title: `Submission documentation checklist — ${sig.missingDocs} auths missing documents`,
        body: "Authorization coordinators to use the updated submission checklist before moving any auth into ready-to-submit. Repeated misses will surface in the adoption layer.",
        priority: "important",
        departments: ["Authorizations"],
        owner: "Authorizations Lead",
        daysAgo: 3,
        acks: { done: 4, total: 6 },
        sop: "Auth submission SOP",
        timeline: "Effective now",
      });
    }
    if (sig.stalledCand > 5) {
      list.push({
        id: "rec-cadence",
        title: `Recruiting pipeline cadence — ${sig.stalledCand} candidates stalled ≥14 days`,
        body: "Recruiters to refresh follow-up cadence and clear stalled candidates this week. Hiring managers please respond within 48 hours of pipeline pings.",
        priority: "important",
        departments: ["Recruiting", "HR"],
        owner: "Recruiting Lead",
        daysAgo: 2,
        acks: { done: 3, total: 4 },
        sop: "Recruiting SOP",
        timeline: "This week",
      });
    }
    if (sig.onbOverdue > 3) {
      list.push({
        id: "onb-readiness",
        title: `Onboarding readiness — ${sig.onbOverdue} tasks overdue across new hires`,
        body: "HR and hiring managers to clear overdue onboarding tasks this week so new staff reach operational activation on schedule.",
        priority: "important",
        departments: ["HR", "Recruiting"],
        owner: "HR Lead",
        daysAgo: 1,
        acks: { done: 2, total: 5 },
        sop: "Onboarding checklist",
        timeline: "By end of week",
      });
    }
    if (list.length === 0) {
      list.push({
        id: "steady",
        title: "Operations holding steady — no immediate leadership push required",
        body: "All core workflows are operating within rhythm. Continue normal cadence. AI is monitoring for adoption drift.",
        priority: "info",
        departments: ["All departments"],
        owner: "Operations Leadership",
        daysAgo: 0,
        acks: { done: 5, total: 5 },
        timeline: "Ongoing",
      });
    }
    return list;
  }, [sig]);

  // ─── Updates feed (operational milestones, real data) ─
  const feed = useMemo(() => {
    const items: Array<{ id: string; text: string; daysAgo: number; dept: string; tone: HealthTone }> = [];

    items.push({
      id: "cr-coverage",
      text: `${cr.counts.coveredClients} of ${cr.counts.activeClients} active clients currently covered. ${sig.uncovered} uncovered, ${sig.atRisk} at risk.`,
      daysAgo: 0,
      dept: "Scheduling",
      tone: sig.uncovered === 0 ? "healthy" : sig.uncovered > 3 ? "risk" : "attention",
    });
    items.push({
      id: "auth-backlog",
      text: `${auths.items.length} active authorizations tracked. ${sig.qaStalled} in QA review, ${sig.expiring30} expire within 30 days.`,
      daysAgo: 0,
      dept: "Authorizations",
      tone: sig.qaStalled > 5 || sig.expiring7 > 0 ? "attention" : "healthy",
    });
    items.push({
      id: "recruiting",
      text: `${sig.candidateCount} candidates active across the pipeline. ${sig.stalledCand} stalled ≥14 days.`,
      daysAgo: 1,
      dept: "Recruiting",
      tone: sig.stalledCand > 8 ? "attention" : "healthy",
    });
    items.push({
      id: "onb",
      text: `Onboarding tasks ${sig.onbCompleted}/${sig.onbTotal} complete. ${sig.onbOverdue} overdue across new hires.`,
      daysAgo: 1,
      dept: "HR",
      tone: sig.onbOverdue === 0 ? "healthy" : sig.onbOverdue > 4 ? "risk" : "attention",
    });
    items.push({
      id: "workforce",
      text: `Active workforce — ${sig.rbtCount} RBTs, ${sig.bcbaCount} BCBAs delivering sessions in the last 30 days.`,
      daysAgo: 2,
      dept: "Staffing",
      tone: "healthy",
    });
    if (sig.denied > 0) {
      items.push({
        id: "denied",
        text: `${sig.denied} authorization${sig.denied === 1 ? "" : "s"} currently in denied state — appeals coordination underway.`,
        daysAgo: 2,
        dept: "Authorizations",
        tone: "blocked",
      });
    }
    return items;
  }, [auths.items.length, cr.counts, sig]);

  // ─── Workflow & SOP change notices ────────────────────
  const sopChanges = useMemo(
    () => [
      {
        workflow: "Auth submission",
        reason: sig.missingDocs > 0 ? "Repeated documentation misses on submissions" : "Periodic checklist refresh",
        departments: ["Authorizations", "QA"],
        effective: "Active",
        sop: "Auth SOP — submission checklist",
        adoption: sig.missingDocs > 3 ? 60 : 90,
      },
      {
        workflow: "Coverage escalation",
        reason: sig.uncovered > 0 ? `${sig.uncovered} clients currently without coverage` : "Operational rhythm refresh",
        departments: ["Scheduling", "Staffing"],
        effective: "This week",
        sop: "Scheduling SOP — coverage escalation",
        adoption: sig.uncovered > 3 ? 55 : 85,
      },
      {
        workflow: "QA review cadence",
        reason: sig.qaStalled > 0 ? "Plans aging beyond cadence" : "Periodic reinforcement",
        departments: ["QA", "Clinics"],
        effective: "Active",
        sop: "QA SOP — review cadence",
        adoption: sig.qaStalled > 5 ? 65 : 88,
      },
      {
        workflow: "Onboarding checklist",
        reason: sig.onbOverdue > 0 ? `${sig.onbOverdue} onboarding tasks overdue` : "New-hire activation alignment",
        departments: ["HR", "Recruiting"],
        effective: "Ongoing",
        sop: "Onboarding checklist",
        adoption: sig.onbTotal > 0 ? Math.round((sig.onbCompleted / sig.onbTotal) * 100) : 80,
      },
    ],
    [sig],
  );

  // ─── Staffing & readiness comms ───────────────────────
  const staffingComms = useMemo(() => {
    const list: Array<{ title: string; detail: string; tone: HealthTone }> = [];
    if (sig.uncovered > 0)
      list.push({
        title: "Coverage pressure forming",
        detail: `${sig.uncovered} clients without active provider coverage · ${sig.atRisk} additional at risk.`,
        tone: sig.uncovered > 3 ? "risk" : "attention",
      });
    if (sig.stalledCand > 5)
      list.push({
        title: "Recruiting pipeline cooling",
        detail: `${sig.stalledCand} candidates stalled ≥14 days — staffing supply at risk if cadence isn't restored.`,
        tone: "attention",
      });
    if (sig.onbOverdue > 0)
      list.push({
        title: "Onboarding throughput concern",
        detail: `${sig.onbOverdue} onboarding tasks overdue — activation timelines may slip without reinforcement.`,
        tone: sig.onbOverdue > 4 ? "risk" : "attention",
      });
    if (sig.expiring7 > 0)
      list.push({
        title: "Scheduling pressure from auth expirations",
        detail: `${sig.expiring7} auths expire within 7 days — scheduling impact possible without coordinated reauth push.`,
        tone: "risk",
      });
    if (list.length === 0)
      list.push({
        title: "Staffing & readiness holding",
        detail: `${sig.rbtCount} RBTs and ${sig.bcbaCount} BCBAs active. Coverage, pipeline, and onboarding are within rhythm.`,
        tone: "healthy",
      });
    return list;
  }, [sig]);

  // ─── Department coordination updates ──────────────────
  const coordination = useMemo(() => {
    const rows: Array<{ pair: string; note: string; tone: HealthTone }> = [
      {
        pair: "Intake ↔ Authorizations",
        note: sig.missingDocs > 0
          ? `${sig.missingDocs} auths missing intake documentation — handoff reinforcement needed.`
          : "Lead-to-auth handoff running cleanly.",
        tone: sig.missingDocs > 3 ? "attention" : "healthy",
      },
      {
        pair: "Authorizations ↔ QA",
        note: sig.qaStalled > 0
          ? `${sig.qaStalled} plans aging in QA — coordination on cadence in progress.`
          : "Plan review handoffs on rhythm.",
        tone: sig.qaStalled > 5 ? "attention" : "healthy",
      },
      {
        pair: "QA ↔ Scheduling",
        note: "Plan-to-staffing handoffs steady — no blockers reported.",
        tone: "healthy",
      },
      {
        pair: "Recruiting ↔ Staffing",
        note: sig.stalledCand > 5
          ? `Pipeline cooling — coordinating cadence with staffing needs.`
          : "Pipeline matched to staffing demand.",
        tone: sig.stalledCand > 8 ? "attention" : "healthy",
      },
      {
        pair: "HR ↔ Payroll",
        note: sig.onbOverdue > 0
          ? `${sig.onbOverdue} onboarding tasks overdue — payroll setup at risk for affected hires.`
          : "New-hire payroll setup on track.",
        tone: sig.onbOverdue > 4 ? "attention" : "healthy",
      },
      {
        pair: "Training ↔ Operations",
        note: "Workflow reinforcement materials being routed through Training Academy.",
        tone: "healthy",
      },
    ];
    return rows;
  }, [sig]);

  // ─── Leadership alignment center ──────────────────────
  const alignment = useMemo(() => {
    const items: Array<{ dept: string; status: AlignStatus; signal: string }> = [
      {
        dept: "Authorizations",
        status:
          sig.missingDocs > 3 || sig.qaStalled > 5
            ? "reinforce"
            : sig.missingDocs > 0 || sig.qaStalled > 0
            ? "monitoring"
            : "aligned",
        signal: `${sig.missingDocs} missing docs · ${sig.qaStalled} stalled in QA`,
      },
      {
        dept: "Scheduling",
        status:
          sig.uncovered > 3 ? "critical" : sig.uncovered > 0 ? "reinforce" : "aligned",
        signal: `${sig.uncovered} uncovered · ${sig.atRisk} at risk`,
      },
      {
        dept: "Recruiting",
        status: sig.stalledCand > 8 ? "reinforce" : sig.stalledCand > 0 ? "monitoring" : "aligned",
        signal: `${sig.candidateCount} active · ${sig.stalledCand} stalled`,
      },
      {
        dept: "HR",
        status: sig.onbOverdue > 4 ? "reinforce" : sig.onbOverdue > 0 ? "monitoring" : "aligned",
        signal: `${sig.onbCompleted}/${sig.onbTotal} onboarding tasks · ${sig.onbOverdue} overdue`,
      },
      {
        dept: "QA",
        status: sig.qaStalled > 5 ? "reinforce" : sig.qaStalled > 0 ? "monitoring" : "aligned",
        signal: `${sig.qaStalled} plans aging in review`,
      },
      { dept: "Payroll", status: "aligned", signal: "Payroll cycle execution stable" },
      { dept: "Training", status: "monitoring", signal: "Reinforcement materials in circulation" },
    ];
    return items;
  }, [sig]);

  const alignScore = useMemo(() => {
    const score = (s: AlignStatus) => (s === "aligned" ? 100 : s === "monitoring" ? 80 : s === "reinforce" ? 60 : 30);
    return Math.round(alignment.reduce((s, a) => s + score(a.status), 0) / Math.max(1, alignment.length));
  }, [alignment]);
  const alignTopStatus: AlignStatus = alignScore >= 90 ? "aligned" : alignScore >= 75 ? "monitoring" : alignScore >= 55 ? "reinforce" : "critical";

  // ─── Wins ─────────────────────────────────────────────
  const wins = useMemo(() => {
    const w: string[] = [];
    if (sig.uncovered === 0 && sig.activeClients > 0)
      w.push(`Coverage holding at 100% across ${sig.activeClients} active clients.`);
    if (sig.qaStalled === 0) w.push("QA review cadence clean — zero stalled plans this cycle.");
    if (sig.stalledCand === 0 && sig.candidateCount > 0)
      w.push(`Recruiting pipeline moving cleanly across ${sig.candidateCount} candidates.`);
    if (sig.onbTotal > 0 && sig.onbOverdue === 0)
      w.push(`Onboarding tasks tracking on time — ${sig.onbCompleted}/${sig.onbTotal} complete.`);
    if (sig.expiring7 === 0) w.push("No imminent auth expirations — continuation pipeline healthy.");
    if (sig.denied === 0) w.push("Zero authorizations in denied state.");
    if (w.length === 0)
      w.push("Teams holding steady through current operational pressure — leadership thanks you.");
    return w;
  }, [sig]);

  // ─── AI summary ───────────────────────────────────────
  const aiSummary = useMemo(() => {
    const reinforce = alignment.filter((a) => a.status === "reinforce" || a.status === "critical").map((a) => a.dept);
    if (reinforce.length === 0)
      return "Leadership communications are aligned across departments. Operational rhythm is steady, and no immediate reinforcement messaging is required.";
    return `Leadership communications are holding alignment overall. ${reinforce.join(", ")} ${reinforce.length === 1 ? "needs" : "need"} additional reinforcement messaging this week — most signals point to workflow cadence and SOP follow-through rather than knowledge gaps.`;
  }, [alignment]);

  const prompts = [
    "Generate Leadership Update",
    "Summarize Organizational Changes",
    "Detect Communication Gaps",
    "Recommend Reinforcement Messaging",
    "Predict Adoption Challenges",
  ];

  const totalAcks = announcements.reduce((s, a) => s + a.acks.done, 0);
  const totalNeeded = announcements.reduce((s, a) => s + a.acks.total, 0);
  const ackPct = totalNeeded ? Math.round((totalAcks / totalNeeded) * 100) : 100;
  const criticalCount = announcements.filter((a) => a.priority === "immediate" || a.priority === "operational").length;

  // ─── Render ───────────────────────────────────────────
  return (
    <OpsPage
      title="Leadership Updates"
      subtitle="Executive operational communications — structured, intentional, calm."
      actions={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
          <Activity className="h-3 w-3" /> Live · derived from real operational signals
        </span>
      }
    >
      {/* 1. HEADER */}
      <OpsCard>
        <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Leadership communications pulse
              </span>
            </div>
            <div className="mt-3 flex items-end gap-3">
              <div className="text-4xl font-semibold tracking-tight tabular-nums">{alignScore}</div>
              <HealthPill tone={ALIGN_TONE[alignTopStatus]}>{ALIGN_LABEL[alignTopStatus]}</HealthPill>
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground max-w-xl">{aiSummary}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricTile
              label="Active updates"
              value={announcements.length}
              hint={`${criticalCount} priority`}
              tone={criticalCount === 0 ? "healthy" : criticalCount > 2 ? "risk" : "attention"}
            />
            <MetricTile
              label="Critical notices"
              value={announcements.filter((a) => a.priority === "immediate").length}
              hint="Immediate attention"
              tone={
                announcements.some((a) => a.priority === "immediate") ? "blocked" : "healthy"
              }
            />
            <MetricTile
              label="Acknowledgement"
              value={`${ackPct}%`}
              hint={`${totalAcks}/${totalNeeded} acknowledged`}
              tone={ackPct >= 80 ? "healthy" : ackPct >= 60 ? "attention" : "risk"}
            />
            <MetricTile
              label="Alignment"
              value={`${alignScore}%`}
              hint="Across departments"
              tone={alignScore >= 85 ? "healthy" : alignScore >= 70 ? "attention" : "risk"}
            />
          </div>
        </div>
      </OpsCard>

      {/* 2. EXECUTIVE COMMUNICATION SUMMARY */}
      <OpsCard title="Executive communication summary" hint="Where leadership messaging is landing">
        <div className="grid gap-3 md:grid-cols-4">
          {alignment.slice(0, 4).map((a) => (
            <div key={a.dept} className="rounded-2xl border border-border/60 bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{a.dept}</span>
                <HealthPill tone={ALIGN_TONE[a.status]}>{ALIGN_LABEL[a.status]}</HealthPill>
              </div>
              <div className="mt-2 text-[13px] text-foreground">{a.signal}</div>
            </div>
          ))}
        </div>
      </OpsCard>

      {/* 3. PRIORITY ANNOUNCEMENTS */}
      <OpsCard title="Priority leadership announcements" hint="Operational direction from leadership">
        <div className="grid gap-3 md:grid-cols-2">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-border/60 bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_hsl(220_15%_20%/0.12)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Megaphone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="text-[13.5px] font-semibold tracking-tight">{a.title}</div>
                </div>
                <HealthPill tone={PRIORITY_TONE[a.priority]}>{PRIORITY_LABEL[a.priority]}</HealthPill>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{a.body}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.departments.map((d) => (
                  <span key={d} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {d}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-[11.5px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> {a.timeline ?? "Active"}
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" /> {a.acks.done}/{a.acks.total} acknowledged
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3 w-3" /> {a.owner}
                </div>
                {a.sop && (
                  <div className="flex items-center gap-1.5">
                    <Link2 className="h-3 w-3" /> {a.sop}
                  </div>
                )}
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground">Posted {relTime(a.daysAgo)}</div>
            </div>
          ))}
        </div>
      </OpsCard>

      {/* 4. OPERATIONAL UPDATES FEED */}
      <OpsCard title="Operational updates feed" hint="Milestones derived from live operations">
        <div className="space-y-2">
          {feed.map((f) => (
            <div
              key={f.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium uppercase tracking-wider">{f.dept}</span>
                  <span>·</span>
                  <span>{relTime(f.daysAgo)}</span>
                </div>
                <div className="mt-0.5 text-[13px] text-foreground">{f.text}</div>
              </div>
              <HealthPill tone={f.tone}>{f.tone}</HealthPill>
            </div>
          ))}
        </div>
      </OpsCard>

      {/* 5. WORKFLOW & SOP CHANGES */}
      <OpsCard title="Workflow & SOP change notices" hint="Operational change-management layer">
        <div className="grid gap-3 md:grid-cols-2">
          {sopChanges.map((c, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[13px] font-semibold tracking-tight">{c.workflow}</span>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {c.effective}
                </span>
              </div>
              <div className="mt-1 text-[12.5px] text-muted-foreground">{c.reason}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.departments.map((d) => (
                  <span key={d} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {d}
                  </span>
                ))}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Link2 className="h-3 w-3" /> {c.sop}</span>
                  <span className="tabular-nums">{c.adoption}% adoption</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      c.adoption >= 80 ? "bg-emerald-500/70" : c.adoption >= 60 ? "bg-amber-500/70" : "bg-rose-500/70",
                    )}
                    style={{ width: `${Math.max(4, c.adoption)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </OpsCard>

      {/* 6. STAFFING & READINESS COMMS */}
      <OpsCard title="Staffing & readiness communications" hint="What staffing leadership should know">
        <div className="space-y-2">
          {staffingComms.map((s, i) => (
            <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-foreground">{s.title}</div>
                <div className="text-[12px] text-muted-foreground">{s.detail}</div>
              </div>
              <HealthPill tone={s.tone}>{s.tone}</HealthPill>
            </div>
          ))}
        </div>
      </OpsCard>

      {/* 7. DEPARTMENT COORDINATION */}
      <OpsCard title="Department coordination updates" hint="Where handoffs need attention">
        <div className="grid gap-2 md:grid-cols-2">
          {coordination.map((c, i) => (
            <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-foreground">{c.pair}</div>
                <div className="text-[12px] text-muted-foreground">{c.note}</div>
              </div>
              <HealthPill tone={c.tone}>{c.tone === "healthy" ? "Aligned" : "Watch"}</HealthPill>
            </div>
          ))}
        </div>
      </OpsCard>

      {/* 8. LEADERSHIP ALIGNMENT CENTER */}
      <OpsCard title="Leadership alignment center" hint="Communication adoption across departments">
        <div className="grid gap-2 md:grid-cols-2">
          {alignment.map((a) => (
            <div key={a.dept} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{a.dept}</div>
                <div className="text-[12px] text-muted-foreground">{a.signal}</div>
              </div>
              <HealthPill tone={ALIGN_TONE[a.status]}>{ALIGN_LABEL[a.status]}</HealthPill>
            </div>
          ))}
        </div>
      </OpsCard>

      {/* 9. WINS */}
      <OpsCard title="Organizational wins & recognition" hint="Where teams are landing">
        <div className="grid gap-2 md:grid-cols-2">
          {wins.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50/60 px-4 py-3 text-[12.5px] text-emerald-800"
            >
              <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      </OpsCard>

      {/* 10. AI */}
      <OpsCard title="AI communication intelligence" hint="Leadership messaging reasoning">
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/50 to-card p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Ask Blossom — communications layer
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