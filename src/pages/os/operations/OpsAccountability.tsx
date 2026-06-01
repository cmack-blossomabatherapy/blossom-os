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
import { useRecruitingCandidates } from "@/hooks/useRecruitingCandidates";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AccountStatus = "strong" | "stable" | "support" | "attention";
const STATUS_TONE: Record<AccountStatus, HealthTone> = {
  strong: "healthy",
  stable: "neutral",
  support: "attention",
  attention: "risk",
};
const STATUS_LABEL: Record<AccountStatus, string> = {
  strong: "Strong",
  stable: "Stable",
  support: "Needs Support",
  attention: "Attention Needed",
};

function statusFromScore(score: number): AccountStatus {
  if (score >= 88) return "strong";
  if (score >= 75) return "stable";
  if (score >= 62) return "support";
  return "attention";
}

function Trend({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "up") return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (dir === "down") return <TrendingDown className="h-3 w-3 text-rose-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground/60" />;
}

export default function OpsAccountability() {
  const ops = useOpsIntelligence();
  const auths = useLiveAuthorizations();
  const rec = useRecruitingCandidates();
  const cr = useCentralReachOps();

  // ─── Owner-derived signals (real data) ────────────────
  const coordLoad = useMemo(() => {
    const map = new Map<string, { owner: string; total: number; stalled: number; overdue: number }>();
    auths.items.forEach((a) => {
      const owner = a.coordinator || "Unassigned";
      const e = map.get(owner) ?? { owner, total: 0, stalled: 0, overdue: 0 };
      e.total += 1;
      if (a.daysInStage >= 5) e.stalled += 1;
      if (a.daysInStage >= 10) e.overdue += 1;
      map.set(owner, e);
    });
    return Array.from(map.values()).sort((a, b) => b.stalled - a.stalled);
  }, [auths.items]);

  const recruiterLoad = useMemo(() => {
    const map = new Map<string, { recruiter: string; total: number; stalled: number }>();
    rec.candidates.forEach((c) => {
      const r = c.recruiter || "Unassigned";
      const e = map.get(r) ?? { recruiter: r, total: 0, stalled: 0 };
      e.total += 1;
      const days = c.stage_entered_at
        ? Math.floor((Date.now() - new Date(c.stage_entered_at).getTime()) / 86400000)
        : 0;
      if (days >= 14) e.stalled += 1;
      map.set(r, e);
    });
    return Array.from(map.values()).sort((a, b) => b.stalled - a.stalled);
  }, [rec.candidates]);

  // ─── Department accountability scoring ────────────────
  const departments = useMemo(() => {
    const totalAuths = Math.max(1, auths.items.length);
    const stalledAuths = ops.auths.qaStalled.length;
    const expiringPressure = ops.auths.expiring7.length;
    const missingDocs = ops.auths.missingDocs.length;
    const stalledCandidates = ops.recruiting.stalledCandidates.length;
    const totalCandidates = Math.max(1, rec.candidates.length);
    const uncovered = cr.counts.uncoveredClients;
    const activeClients = Math.max(1, cr.counts.activeClients);

    const authScore = Math.round(100 - (stalledAuths / totalAuths) * 60 - expiringPressure * 2.5 - missingDocs * 1.5);
    const qaScore = Math.round(100 - stalledAuths * 3 - missingDocs * 1);
    const recruitingScore = Math.round(100 - (stalledCandidates / totalCandidates) * 70);
    const schedulingScore = Math.round(100 - (uncovered / activeClients) * 80);

    const list = [
      {
        id: "intake",
        name: "Intake",
        score: 86,
        completion: 92,
        responsiveness: 88,
        overdue: 0,
        unresolved: 0,
        trend: "flat" as const,
        note: "Pipeline flowing — handoffs consistent",
      },
      {
        id: "auth",
        name: "Authorizations",
        score: Math.max(45, Math.min(98, authScore)),
        completion: Math.max(50, 100 - stalledAuths * 4),
        responsiveness: Math.max(55, 100 - expiringPressure * 3),
        overdue: expiringPressure,
        unresolved: missingDocs,
        trend: expiringPressure > 3 ? ("down" as const) : ("flat" as const),
        note: `${stalledAuths} stalled · ${expiringPressure} expiring ≤7d`,
      },
      {
        id: "scheduling",
        name: "Scheduling",
        score: Math.max(45, Math.min(98, schedulingScore)),
        completion: Math.max(60, 100 - uncovered * 4),
        responsiveness: 84,
        overdue: uncovered,
        unresolved: cr.counts.atRiskClients,
        trend: uncovered > 0 ? ("down" as const) : ("up" as const),
        note: `${uncovered} uncovered · ${cr.counts.atRiskClients} at risk`,
      },
      {
        id: "qa",
        name: "QA",
        score: Math.max(40, Math.min(98, qaScore)),
        completion: Math.max(50, 100 - stalledAuths * 4),
        responsiveness: Math.max(55, 100 - stalledAuths * 3),
        overdue: stalledAuths,
        unresolved: 0,
        trend: stalledAuths > 5 ? ("down" as const) : ("flat" as const),
        note: `${stalledAuths} treatment plans stalled ≥3d`,
      },
      {
        id: "recruiting",
        name: "Recruiting",
        score: Math.max(45, Math.min(98, recruitingScore)),
        completion: Math.max(60, 100 - stalledCandidates * 2),
        responsiveness: 80,
        overdue: stalledCandidates,
        unresolved: 0,
        trend: stalledCandidates > 5 ? ("down" as const) : ("up" as const),
        note: `${stalledCandidates} candidates stalled ≥14d`,
      },
      { id: "hr", name: "HR", score: 90, completion: 94, responsiveness: 90, overdue: 0, unresolved: 0, trend: "flat" as const, note: "Onboarding & credentialing on track" },
      { id: "payroll", name: "Payroll", score: 92, completion: 96, responsiveness: 92, overdue: 0, unresolved: 0, trend: "flat" as const, note: "Cycle stable" },
      { id: "training", name: "Training", score: 78, completion: 82, responsiveness: 76, overdue: 0, unresolved: 0, trend: "up" as const, note: "Adoption improving" },
      { id: "staffing", name: "Staffing", score: schedulingScore > 80 ? 84 : 70, completion: 80, responsiveness: 78, overdue: uncovered, unresolved: 0, trend: uncovered > 0 ? "down" as const : "flat" as const, note: "Coordination active" },
      { id: "clinics", name: "Clinics", score: 85, completion: 88, responsiveness: 84, overdue: 0, unresolved: 0, trend: "flat" as const, note: "Operationally steady" },
      { id: "state", name: "State Leadership", score: 88, completion: 90, responsiveness: 88, overdue: 0, unresolved: 0, trend: "flat" as const, note: "Coordinated across regions" },
    ];
    return list.map((d) => ({ ...d, status: statusFromScore(d.score) }));
  }, [auths.items.length, ops, rec.candidates.length, cr.counts]);

  const orgScore = useMemo(
    () => Math.round(departments.reduce((s, d) => s + d.score, 0) / departments.length),
    [departments],
  );
  const orgStatus = statusFromScore(orgScore);

  const totals = useMemo(() => {
    const overdue = departments.reduce((s, d) => s + d.overdue, 0);
    const unresolved = departments.reduce((s, d) => s + d.unresolved, 0);
    const avgCompletion = Math.round(
      departments.reduce((s, d) => s + d.completion, 0) / departments.length,
    );
    const avgResp = Math.round(
      departments.reduce((s, d) => s + d.responsiveness, 0) / departments.length,
    );
    return { overdue, unresolved, avgCompletion, avgResp };
  }, [departments]);

  const aiSummary = useMemo(() => {
    const parts: string[] = [];
    if (orgScore >= 88)
      parts.push("Operational ownership is strong across the organization.");
    else if (orgScore >= 75)
      parts.push("Operational ownership is stable overall.");
    else parts.push("Follow-through is slipping in several areas — leadership support recommended.");
    if (ops.auths.qaStalled.length > 3)
      parts.push(`QA follow-through is the dominant friction point (${ops.auths.qaStalled.length} stalled plans).`);
    if (cr.counts.uncoveredClients > 0)
      parts.push(`Scheduling coordination has ${cr.counts.uncoveredClients} unresolved coverage gap${cr.counts.uncoveredClients === 1 ? "" : "s"}.`);
    if (ops.recruiting.stalledCandidates.length > 5)
      parts.push("Recruiting responsiveness has softened on stalled candidates.");
    return parts.join(" ");
  }, [orgScore, ops, cr]);

  // ─── Workflow ownership rows ──────────────────────────
  const workflows = useMemo(
    () => [
      { id: "intake-fu", name: "Intake follow-ups", owner: "Intake", overdue: 0, status: "strong" as AccountStatus, note: "Lead workflow stable" },
      { id: "vob", name: "VOB processing", owner: "Intake → Auth", overdue: ops.auths.missingDocs.length, status: ops.auths.missingDocs.length > 0 ? "support" as AccountStatus : "stable" as AccountStatus, note: "VOB tied to documentation" },
      { id: "auth-sub", name: "Authorization submissions", owner: "Authorizations", overdue: ops.auths.expiring7.length, status: ops.auths.expiring7.length > 2 ? "attention" as AccountStatus : "stable" as AccountStatus, note: "Re-auth window pressure" },
      { id: "tp", name: "Treatment plan collection", owner: "QA / BCBA", overdue: ops.auths.qaStalled.length, status: ops.auths.qaStalled.length > 3 ? "support" as AccountStatus : "stable" as AccountStatus, note: "Plans aging in QA review" },
      { id: "qa-review", name: "QA reviews", owner: "QA", overdue: ops.auths.qaStalled.length, status: ops.auths.qaStalled.length > 5 ? "attention" as AccountStatus : "stable" as AccountStatus, note: "Review velocity" },
      { id: "staffing-coord", name: "Staffing coordination", owner: "Scheduling", overdue: cr.counts.uncoveredClients, status: cr.counts.uncoveredClients > 0 ? "attention" as AccountStatus : "strong" as AccountStatus, note: "Coverage continuity" },
      { id: "onboarding", name: "Onboarding completion", owner: "Recruiting → HR", overdue: ops.recruiting.stalledCandidates.length, status: ops.recruiting.stalledCandidates.length > 5 ? "support" as AccountStatus : "stable" as AccountStatus, note: "Pipeline handoff" },
      { id: "payroll", name: "Payroll approvals", owner: "Payroll", overdue: 0, status: "strong" as AccountStatus, note: "On cycle" },
      { id: "pr", name: "Progress reports", owner: "BCBA", overdue: ops.auths.qaStalled.length, status: ops.auths.qaStalled.length > 4 ? "support" as AccountStatus : "stable" as AccountStatus, note: "PR responsiveness" },
    ],
    [ops, cr],
  );

  // ─── Responsiveness ───────────────────────────────────
  const responsiveness = useMemo(
    () => [
      { id: "pr-resp", label: "BCBA progress report response", score: Math.max(55, 100 - ops.auths.qaStalled.length * 4), trend: ops.auths.qaStalled.length > 4 ? "down" as const : "flat" as const },
      { id: "intake-fu", label: "Intake packet follow-up", score: Math.max(65, 100 - ops.auths.missingDocs.length * 5), trend: ops.auths.missingDocs.length > 0 ? "down" as const : "up" as const },
      { id: "auth-resp", label: "Authorization support responsiveness", score: Math.max(60, 100 - ops.auths.expiring7.length * 3), trend: ops.auths.expiring7.length > 3 ? "down" as const : "flat" as const },
      { id: "onb-resp", label: "Onboarding responsiveness", score: Math.max(60, 100 - ops.recruiting.stalledCandidates.length * 2), trend: ops.recruiting.stalledCandidates.length > 5 ? "down" as const : "up" as const },
      { id: "esc-resp", label: "Escalation response timing", score: 84, trend: "flat" as const },
      { id: "handoff", label: "Cross-team handoff responsiveness", score: 82, trend: "flat" as const },
    ],
    [ops],
  );

  // ─── Follow-up monitor ────────────────────────────────
  const followUps = useMemo(() => {
    const items: { id: string; title: string; owner: string; dept: string; age: number; impact: string; severity: AccountStatus; support: string }[] = [];
    ops.auths.qaStalled.slice(0, 4).forEach((a) => {
      items.push({
        id: `qa-${a.id}`,
        title: `${a.clientName} — QA review aging`,
        owner: a.qaOwner ?? "QA reviewer",
        dept: "QA",
        age: a.daysInStage,
        impact: "Downstream auth submission delayed",
        severity: a.daysInStage >= 7 ? "attention" : "support",
        support: "Re-sequence reviewer load or pair with backup",
      });
    });
    ops.auths.missingDocs.slice(0, 3).forEach((a) => {
      items.push({
        id: `doc-${a.id}`,
        title: `${a.clientName} — missing documentation`,
        owner: a.qaOwner ?? "Intake",
        dept: "Intake",
        age: a.daysInStage ?? 4,
        impact: "Auth submission blocked",
        severity: "support",
        support: "Family outreach + intake escalation",
      });
    });
    ops.recruiting.stalledCandidates.slice(0, 3).forEach((c) => {
      const days = c.stage_entered_at
        ? Math.floor((Date.now() - new Date(c.stage_entered_at).getTime()) / 86400000)
        : 14;
      items.push({
        id: `cand-${c.id}`,
        title: `${c.first_name} ${c.last_name} — stalled in ${c.pipeline_stage}`,
        owner: c.recruiter || "Recruiting",
        dept: "Recruiting",
        age: days,
        impact: "Onboarding pipeline slowdown",
        severity: days >= 21 ? "attention" : "support",
        support: "Re-engage or move to terminal status",
      });
    });
    return items.sort((a, b) => b.age - a.age);
  }, [ops]);

  // ─── Leadership support watchlist ─────────────────────
  const watchlist = useMemo(() => {
    const items: { id: string; title: string; impact: string; urgency: AccountStatus; recommendation: string; depts: string[] }[] = [];
    if (ops.auths.qaStalled.length > 4)
      items.push({
        id: "w1",
        title: "QA follow-through softening",
        impact: "Downstream authorization throughput affected",
        urgency: "support",
        recommendation: "Align with QA lead on reviewer capacity",
        depts: ["QA", "Authorizations"],
      });
    if (cr.counts.uncoveredClients > 0)
      items.push({
        id: "w2",
        title: "Scheduling coordination needs support",
        impact: "Coverage gaps creating family-facing risk",
        urgency: "attention",
        recommendation: "Coordinate with State Director on temporary coverage",
        depts: ["Scheduling", "State Leadership"],
      });
    if (ops.auths.expiring7.length > 2)
      items.push({
        id: "w3",
        title: "Re-auth ownership pressure",
        impact: "Multiple re-auth windows narrowing",
        urgency: "support",
        recommendation: "Confirm coordinator load is balanced",
        depts: ["Authorizations"],
      });
    if (ops.recruiting.stalledCandidates.length > 5)
      items.push({
        id: "w4",
        title: "Recruiting responsiveness watch",
        impact: "Stalled candidates affecting onboarding timing",
        urgency: "support",
        recommendation: "Review pipeline triage cadence with recruiting lead",
        depts: ["Recruiting", "HR"],
      });
    return items;
  }, [ops, cr]);

  // ─── Trend insights ───────────────────────────────────
  const trendInsights = useMemo(
    () => [
      { id: "t1", label: "Workflow completion consistency", value: `${totals.avgCompletion}%`, trend: totals.avgCompletion >= 85 ? "up" as const : "flat" as const, note: "Across all departments" },
      { id: "t2", label: "Average responsiveness", value: `${totals.avgResp}%`, trend: totals.avgResp >= 82 ? "up" as const : "down" as const, note: "Cross-team coordination" },
      { id: "t3", label: "Departments needing support", value: String(departments.filter((d) => d.status === "support" || d.status === "attention").length), trend: "flat" as const, note: "Active support areas" },
      { id: "t4", label: "Overdue ownership items", value: String(totals.overdue), trend: totals.overdue > 5 ? "down" as const : "flat" as const, note: "Across active workflows" },
    ],
    [totals, departments],
  );

  // ─── Recognition / wins ───────────────────────────────
  const wins = useMemo(() => {
    const out: { id: string; text: string; meta: string }[] = [];
    const strong = departments.filter((d) => d.status === "strong");
    if (strong.length > 0)
      out.push({
        id: "win1",
        text: `${strong.length} department${strong.length === 1 ? "" : "s"} operating with strong consistency`,
        meta: strong.map((d) => d.name).slice(0, 4).join(" · "),
      });
    if (cr.counts.coveredClients > 0)
      out.push({
        id: "win2",
        text: `${cr.counts.coveredClients} clients actively covered — scheduling reliability holding`,
        meta: "Scheduling",
      });
    if (ops.recruiting.stalledCandidates.length < 5 && ops.recruiting.candidates.length > 0)
      out.push({
        id: "win3",
        text: "Recruiting onboarding follow-through remained consistent this week",
        meta: "Recruiting",
      });
    if (ops.auths.total > 0 && ops.auths.expiring7.length === 0)
      out.push({
        id: "win4",
        text: "Authorization team cleared all 7-day re-auth pressure",
        meta: "Authorizations",
      });
    return out;
  }, [departments, cr, ops]);

  return (
    <OpsPage
      title="Team Accountability"
      subtitle="Operational follow-through and ownership visibility — supportive, not punitive."
    >
      <div className="space-y-5">
        {/* 1. Overview header */}
        <OpsCard>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping",
                  orgStatus === "strong" && "bg-emerald-400",
                  orgStatus === "stable" && "bg-sky-400",
                  orgStatus === "support" && "bg-amber-400",
                  orgStatus === "attention" && "bg-rose-400",
                )} />
                <span className={cn(
                  "relative inline-flex h-2.5 w-2.5 rounded-full",
                  orgStatus === "strong" && "bg-emerald-500",
                  orgStatus === "stable" && "bg-sky-500",
                  orgStatus === "support" && "bg-amber-500",
                  orgStatus === "attention" && "bg-rose-500",
                )} />
              </span>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Organizational Accountability
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums">{orgScore}</span>
                  <HealthPill tone={STATUS_TONE[orgStatus]}>{STATUS_LABEL[orgStatus]}</HealthPill>
                </div>
              </div>
            </div>
            <p className="max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              <Sparkles className="mr-1.5 inline-block h-3.5 w-3.5 text-foreground/60" />
              {aiSummary}
            </p>
          </div>
        </OpsCard>

        {/* 2. Follow-through snapshot */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="Completion consistency" value={`${totals.avgCompletion}%`} hint="Avg across departments" tone={totals.avgCompletion >= 85 ? "healthy" : "attention"} />
          <MetricTile label="Responsiveness" value={`${totals.avgResp}%`} hint="Cross-team coordination" tone={totals.avgResp >= 82 ? "healthy" : "attention"} />
          <MetricTile label="Overdue ownership" value={totals.overdue} hint="Active workflows" tone={totals.overdue > 5 ? "risk" : "neutral"} />
          <MetricTile label="Unresolved blockers" value={totals.unresolved} hint="Pending follow-through" tone={totals.unresolved > 0 ? "attention" : "healthy"} />
        </div>

        {/* 3. Department accountability grid */}
        <OpsCard title="Department Accountability" hint="Workflow completion & responsiveness">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((d) => (
              <div key={d.id} className="rounded-xl border border-border/60 p-4 transition-all hover:-translate-y-0.5 hover:border-border">
                <div className="flex items-center justify-between">
                  <div className="text-[13.5px] font-medium text-foreground">{d.name}</div>
                  <HealthPill tone={STATUS_TONE[d.status]}>{STATUS_LABEL[d.status]}</HealthPill>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">{d.score}</span>
                  <Trend dir={d.trend} />
                </div>
                <div className="mt-2 space-y-1 text-[11.5px] text-muted-foreground">
                  <div className="flex justify-between"><span>Completion</span><span className="tabular-nums text-foreground/80">{d.completion}%</span></div>
                  <div className="flex justify-between"><span>Responsiveness</span><span className="tabular-nums text-foreground/80">{d.responsiveness}%</span></div>
                  <div className="flex justify-between"><span>Overdue</span><span className="tabular-nums text-foreground/80">{d.overdue}</span></div>
                </div>
                <div className="mt-2 text-[11.5px] text-muted-foreground">{d.note}</div>
              </div>
            ))}
          </div>
        </OpsCard>

        {/* 4. Workflow ownership */}
        <OpsCard title="Workflow Ownership Visibility" hint="Is ownership clear and moving?">
          <ul className="space-y-2">
            {workflows.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground">{w.name}</div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">{w.owner} · {w.note}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11.5px] text-muted-foreground tabular-nums">{w.overdue} overdue</span>
                  <HealthPill tone={STATUS_TONE[w.status]}>{STATUS_LABEL[w.status]}</HealthPill>
                </div>
              </li>
            ))}
          </ul>
        </OpsCard>

        {/* 5. Responsiveness & 6. Follow-up monitor */}
        <div className="grid gap-4 lg:grid-cols-2">
          <OpsCard title="Responsiveness & Resolution Health" hint="How fast teams are resolving">
            <ul className="space-y-2.5">
              {responsiveness.map((r) => (
                <li key={r.id} className="rounded-xl border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-foreground">{r.label}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Trend dir={r.trend} />
                      <span className="text-[12px] font-medium text-foreground tabular-nums">{r.score}%</span>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        r.score >= 85 ? "bg-emerald-500" : r.score >= 70 ? "bg-amber-500" : "bg-rose-500",
                      )}
                      style={{ width: `${Math.min(100, r.score)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </OpsCard>

          <OpsCard title="Operational Follow-Up Monitor" hint="Aging items needing support">
            {followUps.length === 0 ? (
              <EmptyRow>No aging follow-ups — ownership chains are healthy.</EmptyRow>
            ) : (
              <ul className="space-y-2">
                {followUps.slice(0, 8).map((f) => (
                  <li key={f.id} className="rounded-xl border border-border/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-foreground truncate">{f.title}</div>
                        <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                          {f.dept} · {f.owner} · <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{f.age}d</span>
                        </div>
                        <div className="mt-1 text-[11.5px] text-muted-foreground">{f.impact}</div>
                      </div>
                      <HealthPill tone={STATUS_TONE[f.severity]}>{STATUS_LABEL[f.severity]}</HealthPill>
                    </div>
                    <div className="mt-2 text-[11.5px] text-foreground/80">
                      <span className="text-muted-foreground">Support: </span>{f.support}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </OpsCard>
        </div>

        {/* 7. Leadership support watchlist */}
        <OpsCard title="Leadership Support Watchlist" hint="Where support is recommended">
          {watchlist.length === 0 ? (
            <EmptyRow>No active support areas — operations are running cleanly.</EmptyRow>
          ) : (
            <ul className="grid gap-2.5 md:grid-cols-2">
              {watchlist.map((w) => (
                <li key={w.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13.5px] font-medium text-foreground">{w.title}</div>
                    <HealthPill tone={STATUS_TONE[w.urgency]}>{STATUS_LABEL[w.urgency]}</HealthPill>
                  </div>
                  <div className="mt-1 text-[12.5px] text-muted-foreground">{w.impact}</div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                    <span className="text-muted-foreground">{w.depts.join(" · ")}</span>
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      {w.recommendation} <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </OpsCard>

        {/* 8. Trend insights */}
        <OpsCard title="Accountability Trend Insights" hint="Organizational patterns">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trendInsights.map((t) => (
              <div key={t.id} className="rounded-xl border border-border/60 p-3.5">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.label}</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums">{t.value}</span>
                  <Trend dir={t.trend} />
                </div>
                <div className="mt-1 text-[11.5px] text-muted-foreground">{t.note}</div>
              </div>
            ))}
          </div>
        </OpsCard>

        {/* 9. Recognition / wins */}
        <OpsCard title="Recognition & Consistency Highlights" hint="Operational wins">
          {wins.length === 0 ? (
            <EmptyRow>No standout wins logged this cycle.</EmptyRow>
          ) : (
            <ul className="space-y-2">
              {wins.map((w) => (
                <li key={w.id} className="flex items-start gap-3 rounded-xl border border-border/60 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <div className="min-w-0">
                    <div className="text-[13px] text-foreground">{w.text}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{w.meta}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </OpsCard>

        {/* Owner load (real data backing) */}
        <div className="grid gap-4 lg:grid-cols-2">
          <OpsCard title="Authorization Coordinators" hint="Active · stalled ≥5d · overdue ≥10d">
            {coordLoad.length === 0 ? (
              <EmptyRow>No active authorizations.</EmptyRow>
            ) : (
              <ul className="divide-y divide-border/60">
                {coordLoad.slice(0, 10).map((o) => (
                  <li key={o.owner} className="flex items-center justify-between py-2">
                    <span className="text-[13px] font-medium text-foreground">{o.owner}</span>
                    <span className="text-[11.5px] text-muted-foreground tabular-nums">
                      {o.total} active · <span className={o.stalled > 0 ? "text-amber-700" : ""}>{o.stalled} stalled</span> · <span className={o.overdue > 0 ? "text-rose-700" : ""}>{o.overdue} overdue</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </OpsCard>
          <OpsCard title="Recruiters" hint="Candidates · stalled ≥14d">
            {recruiterLoad.length === 0 ? (
              <EmptyRow>No candidates in pipeline.</EmptyRow>
            ) : (
              <ul className="divide-y divide-border/60">
                {recruiterLoad.slice(0, 10).map((r) => (
                  <li key={r.recruiter} className="flex items-center justify-between py-2">
                    <span className="text-[13px] font-medium text-foreground">{r.recruiter}</span>
                    <span className="text-[11.5px] text-muted-foreground tabular-nums">
                      {r.total} active · <span className={r.stalled > 0 ? "text-amber-700" : ""}>{r.stalled} stalled</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </OpsCard>
        </div>

        {/* 10. AI Intelligence */}
        <OpsCard title="AI Accountability Intelligence" hint="Ask Blossom AI">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
              <p className="text-[13px] leading-relaxed text-foreground/90">{aiSummary}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                "Explain Accountability Risk",
                "Identify Ownership Gaps",
                "Recommend Leadership Support",
                "Generate Accountability Summary",
                "Predict Operational Reliability",
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