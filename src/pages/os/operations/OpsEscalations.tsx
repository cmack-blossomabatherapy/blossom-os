import { useMemo } from "react";
import {
  OpsPage,
  OpsCard,
  HealthPill,
  EmptyRow,
  MetricTile,
  AIPrompt,
  type HealthTone,
} from "./_shared";
import { useOpsIntelligence, type OpsTone } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { daysUntil } from "@/data/authorizations";
import {
  ArrowRight,
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATES = ["GA", "NC", "VA", "TN", "MD"] as const;

type Severity = "monitoring" | "coordination" | "escalated" | "critical";
const SEV_TONE: Record<Severity, HealthTone> = {
  monitoring: "neutral",
  coordination: "attention",
  escalated: "risk",
  critical: "blocked",
};
const SEV_LABEL: Record<Severity, string> = {
  monitoring: "Monitoring",
  coordination: "Needs Coordination",
  escalated: "Escalated",
  critical: "Critical",
};

interface Blocker {
  id: string;
  title: string;
  severity: Severity;
  workflow: string;
  departments: string[];
  owner: string;
  ageDays: number;
  source: string;
  impact: string;
  nextAction: string;
  history?: string;
}

function toneFromOps(tone: OpsTone): HealthTone {
  return tone;
}

export default function OpsEscalations() {
  const ops = useOpsIntelligence();
  const cr = useCentralReachOps();
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const states = useMemo(
    () => [
      { code: "GA", data: ga },
      { code: "NC", data: nc },
      { code: "VA", data: va },
      { code: "TN", data: tn },
      { code: "MD", data: md },
    ],
    [ga, nc, va, tn, md],
  );

  // ─── Derive real blockers ──────────────────────────────
  const blockers = useMemo<Blocker[]>(() => {
    const out: Blocker[] = [];

    ops.auths.expiring7.slice(0, 6).forEach((a) => {
      const d = daysUntil(a.expirationDate);
      out.push({
        id: `auth7-${a.id}`,
        title: `${a.clientName} — auth expires in ${d ?? "?"} day${d === 1 ? "" : "s"}`,
        severity: "critical",
        workflow: "Authorization → Reauth",
        departments: ["Authorizations", "QA"],
        owner: a.qaOwner ?? "Auth team",
        ageDays: Math.max(1, a.daysInStage ?? 1),
        source: "CentralReach · Authorizations",
        impact: "Service interruption risk — client billing blocked at lapse",
        nextAction: "Submit continuation packet today",
        history: a.stage,
      });
    });

    ops.auths.qaStalled.slice(0, 5).forEach((a) => {
      out.push({
        id: `qa-${a.id}`,
        title: `${a.clientName} — treatment plan stalled in QA ${a.daysInStage}d`,
        severity: a.daysInStage >= 7 ? "escalated" : "coordination",
        workflow: "QA Review → Authorization Submission",
        departments: ["QA", "Authorizations"],
        owner: a.qaOwner ?? "QA reviewer",
        ageDays: a.daysInStage,
        source: "QA Workflow",
        impact: "Downstream auth submission blocked",
        nextAction: "Reassign reviewer or unblock comments",
      });
    });

    ops.auths.missingDocs.slice(0, 4).forEach((a) => {
      out.push({
        id: `docs-${a.id}`,
        title: `${a.clientName} — missing documentation`,
        severity: "escalated",
        workflow: "Intake → VOB → Authorization",
        departments: ["Intake", "Authorizations"],
        owner: a.qaOwner ?? "Intake",
        ageDays: a.daysInStage ?? 3,
        source: "Authorization workflow",
        impact: "Submission blocked pending records",
        nextAction: "Contact family / clinical for missing items",
      });
    });

    ops.auths.denied.slice(0, 3).forEach((a) => {
      out.push({
        id: `den-${a.id}`,
        title: `${a.clientName} — authorization denied`,
        severity: "critical",
        workflow: "Authorization → Appeal",
        departments: ["Authorizations", "Clinical"],
        owner: a.qaOwner ?? "Auth lead",
        ageDays: a.daysInStage ?? 1,
        source: "Payer response",
        impact: "Coverage gap — appeal window closing",
        nextAction: "Open appeal coordination thread",
      });
    });

    cr.coverageRisks
      .filter((c) => c.level === "uncovered")
      .slice(0, 5)
      .forEach((c, i) => {
        out.push({
          id: `cov-${i}-${c.clientName}`,
          title: `${c.clientName} — uncovered (${c.state ?? "—"})`,
          severity: "critical",
          workflow: "Scheduling → Staffing",
          departments: ["Scheduling", "Recruiting"],
          owner: c.bcbaName ?? "Scheduling",
          ageDays: c.daysSinceLastRbt ?? 14,
          source: "CentralReach · Coverage",
          impact: c.reason,
          nextAction: "Assign RBT or escalate to State Director",
        });
      });

    cr.coverageRisks
      .filter((c) => c.level === "at_risk")
      .slice(0, 4)
      .forEach((c, i) => {
        out.push({
          id: `atr-${i}-${c.clientName}`,
          title: `${c.clientName} — coverage at risk`,
          severity: "escalated",
          workflow: "Scheduling → Staffing",
          departments: ["Scheduling"],
          owner: c.bcbaName ?? "Scheduling",
          ageDays: c.daysSinceLastRbt ?? 7,
          source: "CentralReach · Coverage",
          impact: c.reason,
          nextAction: "Confirm next-week schedule with RBT",
        });
      });

    states.forEach(({ code, data }) => {
      data.staffingNeeds
        .filter((n) => n.urgency === "critical")
        .slice(0, 3)
        .forEach((n) => {
          out.push({
            id: `need-${code}-${n.id}`,
            title: `${code} · ${n.client} — needs ${n.need} (${n.hoursNeeded}h)`,
            severity: "escalated",
            workflow: "Recruiting → Onboarding → Staffing",
            departments: ["Recruiting", "Scheduling"],
            owner: n.owner,
            ageDays: 5,
            source: "Staffing & Capacity",
            impact: `Unfilled staffing need in ${n.region}`,
            nextAction: "Pull from recruiting pool or split caseload",
          });
        });
    });

    ops.recruiting.stalledCandidates.slice(0, 3).forEach((c) => {
      const days = c.stage_entered_at
        ? Math.floor((Date.now() - new Date(c.stage_entered_at).getTime()) / 86400000)
        : 14;
      out.push({
        id: `cand-${c.id}`,
        title: `${c.first_name} ${c.last_name} — stalled in ${c.pipeline_stage} ${days}d`,
        severity: "coordination",
        workflow: "Recruiting → Onboarding",
        departments: ["Recruiting", "HR"],
        owner: "Recruiting",
        ageDays: days,
        source: "Recruiting pipeline",
        impact: "Onboarding delay → staffing pressure downstream",
        nextAction: "Re-engage candidate or move to terminal status",
      });
    });

    return out.sort((a, b) => {
      const order: Severity[] = ["critical", "escalated", "coordination", "monitoring"];
      const d = order.indexOf(a.severity) - order.indexOf(b.severity);
      return d !== 0 ? d : b.ageDays - a.ageDays;
    });
  }, [ops, cr, states]);

  const counts = useMemo(() => {
    const by: Record<Severity, number> = {
      monitoring: 0,
      coordination: 0,
      escalated: 0,
      critical: 0,
    };
    blockers.forEach((b) => (by[b.severity] += 1));
    const deptSet = new Set<string>();
    blockers.forEach((b) => b.departments.forEach((d) => deptSet.add(d)));
    const avgAge = blockers.length
      ? Math.round(blockers.reduce((s, b) => s + b.ageDays, 0) / blockers.length)
      : 0;
    return { by, deptCount: deptSet.size, avgAge, total: blockers.length };
  }, [blockers]);

  const posture: { tone: HealthTone; label: string } = counts.by.critical >= 3
    ? { tone: "blocked", label: "Critical" }
    : counts.by.critical > 0 || counts.by.escalated >= 4
      ? { tone: "risk", label: "Escalated" }
      : counts.by.escalated > 0 || counts.by.coordination >= 3
        ? { tone: "attention", label: "Needs Coordination" }
        : { tone: "healthy", label: "Stable" };

  const aiSummary = useMemo(() => {
    if (counts.total === 0) return "No active operational escalations. Workflows are executing within tolerance.";
    const lines: string[] = [];
    if (counts.by.critical > 0)
      lines.push(`${counts.by.critical} critical blocker${counts.by.critical === 1 ? "" : "s"} preventing execution — leadership intervention recommended.`);
    if (ops.auths.expiring7.length > 0)
      lines.push(`Authorization re-auth pressure is the dominant risk vector (${ops.auths.expiring7.length} expiring ≤7d).`);
    if (cr.counts.uncoveredClients > 0)
      lines.push(`${cr.counts.uncoveredClients} uncovered client${cr.counts.uncoveredClients === 1 ? "" : "s"} creating service-continuity risk.`);
    if (ops.auths.qaStalled.length > 3)
      lines.push(`QA throughput is compounding downstream auth blockers.`);
    return lines.join(" ");
  }, [counts, ops, cr]);

  // ─── Workflow blockage chains ─────────────────────────
  const chains = useMemo(() => {
    const list: { id: string; trigger: string; cascade: string[]; severity: Severity }[] = [];
    if (ops.auths.qaStalled.length > 2)
      list.push({
        id: "c1",
        trigger: `${ops.auths.qaStalled.length} plans stalled in QA`,
        cascade: ["Auth submission delayed", "Re-auth window narrowing", "Service continuity risk"],
        severity: ops.auths.qaStalled.length > 5 ? "escalated" : "coordination",
      });
    if (ops.auths.missingDocs.length > 0)
      list.push({
        id: "c2",
        trigger: `${ops.auths.missingDocs.length} auth${ops.auths.missingDocs.length === 1 ? "" : "s"} missing docs`,
        cascade: ["VOB cannot complete", "Assessment scheduling held", "Client start date slips"],
        severity: "escalated",
      });
    if (cr.counts.uncoveredClients > 0)
      list.push({
        id: "c3",
        trigger: `${cr.counts.uncoveredClients} uncovered client${cr.counts.uncoveredClients === 1 ? "" : "s"}`,
        cascade: ["Sessions unbilled", "Family escalation risk", "Auth utilization drops"],
        severity: "critical",
      });
    if (ops.recruiting.stalledCandidates.length > 5)
      list.push({
        id: "c4",
        trigger: `${ops.recruiting.stalledCandidates.length} candidates stalled in pipeline`,
        cascade: ["Onboarding delays", "Recruiting → Staffing slowdown", "State capacity pressure"],
        severity: "coordination",
      });
    return list;
  }, [ops, cr]);

  // ─── Staffing escalations roll-up ─────────────────────
  const staffingEsc = useMemo(() => {
    return states.map(({ code, data }) => {
      const critical = data.staffingNeeds.filter((n) => n.urgency === "critical").length;
      const high = data.staffingNeeds.filter((n) => n.urgency === "high").length;
      const overload = data.bcbas.filter((b: any) => (b.clientCount ?? 0) > 12).length;
      const tone: HealthTone =
        critical >= 2 ? "blocked" : critical >= 1 || high >= 3 ? "risk" : high > 0 ? "attention" : "healthy";
      return { code, critical, high, overload, tone, total: data.staffingNeeds.length };
    });
  }, [states]);

  // ─── Aging risk ───────────────────────────────────────
  const agingRisks = useMemo(
    () =>
      blockers
        .filter((b) => b.ageDays >= 7)
        .sort((a, b) => b.ageDays - a.ageDays)
        .slice(0, 6),
    [blockers],
  );

  // ─── Leadership interventions ─────────────────────────
  const interventions = useMemo(() => {
    const list: { id: string; title: string; why: string; impact: string; urgency: Severity; depts: string[]; action: string }[] = [];
    if (counts.by.critical > 0)
      list.push({
        id: "i1",
        title: "Authorize re-auth war-room",
        why: "Multiple auths expiring inside the SLA window",
        impact: "Prevents service interruption across active clients",
        urgency: "critical",
        depts: ["Authorizations", "QA"],
        action: "Stand up daily 15-min standup until backlog clears",
      });
    const overloadState = staffingEsc.find((s) => s.critical >= 2);
    if (overloadState)
      list.push({
        id: "i2",
        title: `Coordinate ${overloadState.code} State Director`,
        why: `${overloadState.critical} critical staffing need${overloadState.critical === 1 ? "" : "s"} unresolved`,
        impact: "Recover staffing capacity in highest-pressure region",
        urgency: "escalated",
        depts: ["State Leadership", "Recruiting"],
        action: "Align caseload redistribution with State Director",
      });
    if (cr.counts.uncoveredClients > 0)
      list.push({
        id: "i3",
        title: "Service continuity intervention",
        why: `${cr.counts.uncoveredClients} client${cr.counts.uncoveredClients === 1 ? "" : "s"} uncovered`,
        impact: "Protect family experience and auth utilization",
        urgency: "escalated",
        depts: ["Scheduling", "Clinical"],
        action: "Approve overtime or temporary reassignments",
      });
    if (ops.auths.qaStalled.length > 5)
      list.push({
        id: "i4",
        title: "Unblock QA throughput",
        why: "QA review is the upstream bottleneck",
        impact: "Clears downstream auth + assessment workflow",
        urgency: "coordination",
        depts: ["QA"],
        action: "Re-sequence reviewer load or add capacity",
      });
    return list;
  }, [counts, staffingEsc, cr, ops]);

  // ─── Coordination feed (derived) ──────────────────────
  const feed = useMemo(() => {
    const items: { id: string; text: string; meta: string; tone: HealthTone }[] = [];
    if (ops.auths.expiring7.length > 0)
      items.push({
        id: "f1",
        text: `Authorizations team flagged ${ops.auths.expiring7.length} re-auth${ops.auths.expiring7.length === 1 ? "" : "s"} inside 7-day window`,
        meta: "Today · Auth → Leadership",
        tone: "blocked",
      });
    if (cr.counts.uncoveredClients > 0)
      items.push({
        id: "f2",
        text: `Scheduling escalated ${cr.counts.uncoveredClients} uncovered client${cr.counts.uncoveredClients === 1 ? "" : "s"} to State Directors`,
        meta: "Today · Scheduling → State Leadership",
        tone: "risk",
      });
    if (ops.auths.qaStalled.length > 0)
      items.push({
        id: "f3",
        text: `QA reviewer reassignment requested for ${ops.auths.qaStalled.length} plan${ops.auths.qaStalled.length === 1 ? "" : "s"}`,
        meta: "Yesterday · QA → Ops",
        tone: "attention",
      });
    if (ops.recruiting.stalledCandidates.length > 0)
      items.push({
        id: "f4",
        text: `Recruiting looped HR into ${ops.recruiting.stalledCandidates.length} stalled candidate${ops.recruiting.stalledCandidates.length === 1 ? "" : "s"}`,
        meta: "Yesterday · Recruiting → HR",
        tone: "attention",
      });
    if (cr.cancellationsLast7d > 0)
      items.push({
        id: "f5",
        text: `${cr.cancellationsLast7d} cancellation${cr.cancellationsLast7d === 1 ? "" : "s"} logged in last 7 days — coordination review`,
        meta: "This week · Scheduling",
        tone: "neutral",
      });
    return items;
  }, [ops, cr]);

  // ─── Resolutions (positive momentum) ──────────────────
  const resolutions = useMemo(() => {
    const items: { id: string; text: string; meta: string }[] = [];
    if (cr.counts.coveredClients > 0)
      items.push({
        id: "r1",
        text: `${cr.counts.coveredClients} client${cr.counts.coveredClients === 1 ? "" : "s"} actively covered this week`,
        meta: "Scheduling",
      });
    const healthyDepts = ops.depts.filter((d) => d.tone === "healthy");
    if (healthyDepts.length > 0)
      items.push({
        id: "r2",
        text: `${healthyDepts.length} departments operating in healthy state`,
        meta: "Department Health",
      });
    if (ops.auths.total - ops.auths.expiring30.length > 0)
      items.push({
        id: "r3",
        text: `${ops.auths.total - ops.auths.expiring30.length} authorizations stable beyond 30-day window`,
        meta: "Authorizations",
      });
    return items;
  }, [ops, cr]);

  // ─── Render ───────────────────────────────────────────
  return (
    <OpsPage
      title="Escalations & Blockers"
      subtitle="The operational intervention center — where execution is blocked and leadership attention is required."
    >
      <div className="space-y-5">
        {/* 1. Status header */}
        <OpsCard>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping",
                  posture.tone === "blocked" && "bg-rose-400",
                  posture.tone === "risk" && "bg-orange-400",
                  posture.tone === "attention" && "bg-amber-400",
                  posture.tone === "healthy" && "bg-emerald-400",
                )} />
                <span className={cn(
                  "relative inline-flex h-2.5 w-2.5 rounded-full",
                  posture.tone === "blocked" && "bg-rose-500",
                  posture.tone === "risk" && "bg-orange-500",
                  posture.tone === "attention" && "bg-amber-500",
                  posture.tone === "healthy" && "bg-emerald-500",
                )} />
              </span>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Operational Posture</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xl font-semibold tracking-tight text-foreground">{posture.label}</span>
                  <HealthPill tone={posture.tone}>{counts.total} active</HealthPill>
                </div>
              </div>
            </div>
            <p className="max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              <Sparkles className="mr-1.5 inline-block h-3.5 w-3.5 text-foreground/60" />
              {aiSummary}
            </p>
          </div>
        </OpsCard>

        {/* 2. Active escalation summary */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="Critical" value={counts.by.critical} hint="Blocking execution" tone="blocked" />
          <MetricTile label="Escalated" value={counts.by.escalated} hint="Cross-team coordination" tone="risk" />
          <MetricTile label="Departments impacted" value={counts.deptCount} hint="Across active blockers" tone="attention" />
          <MetricTile label="Avg blocker age" value={`${counts.avgAge}d`} hint="Time unresolved" tone={counts.avgAge >= 7 ? "risk" : "neutral"} />
        </div>

        {/* 3. Critical Blockers Center */}
        <OpsCard
          title="Critical Blockers"
          hint={`${blockers.length} active`}
        >
          {blockers.length === 0 ? (
            <EmptyRow>No operational blockers detected. Execution is unobstructed.</EmptyRow>
          ) : (
            <ul className="space-y-2.5">
              {blockers.slice(0, 12).map((b) => (
                <li
                  key={b.id}
                  className="rounded-xl border border-border/60 bg-background/40 p-4 transition-all hover:-translate-y-0.5 hover:border-border"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <HealthPill tone={SEV_TONE[b.severity]}>{SEV_LABEL[b.severity]}</HealthPill>
                        <span className="text-[11px] text-muted-foreground">{b.source}</span>
                      </div>
                      <div className="mt-1.5 text-[14px] font-medium text-foreground">{b.title}</div>
                      <div className="mt-0.5 text-[12.5px] text-muted-foreground">{b.impact}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Activity className="h-3 w-3" />{b.workflow}</span>
                        <span>·</span>
                        <span>{b.departments.join(" · ")}</span>
                        <span>·</span>
                        <span>Owner: {b.owner}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{b.ageDays}d open</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Next</div>
                      <div className="text-[12.5px] font-medium text-foreground">{b.nextAction}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </OpsCard>

        {/* 4 + 5 split */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Coordination feed */}
          <OpsCard title="Escalation Coordination" hint="Live ownership movement">
            {feed.length === 0 ? (
              <EmptyRow>No escalation activity to report.</EmptyRow>
            ) : (
              <ul className="space-y-2.5">
                {feed.map((f) => (
                  <li key={f.id} className="flex items-start gap-3 rounded-xl border border-border/60 p-3">
                    <span className={cn(
                      "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                      f.tone === "blocked" && "bg-rose-500",
                      f.tone === "risk" && "bg-orange-500",
                      f.tone === "attention" && "bg-amber-500",
                      f.tone === "neutral" && "bg-muted-foreground/50",
                      f.tone === "healthy" && "bg-emerald-500",
                    )} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-foreground">{f.text}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{f.meta}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </OpsCard>

          {/* Workflow blockage chains */}
          <OpsCard title="Workflow Blockage Mapping" hint="Cascade impact">
            {chains.length === 0 ? (
              <EmptyRow>No active cascade risks detected.</EmptyRow>
            ) : (
              <ul className="space-y-3">
                {chains.map((c) => (
                  <li key={c.id} className="rounded-xl border border-border/60 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[13px] font-medium text-foreground">{c.trigger}</div>
                      <HealthPill tone={SEV_TONE[c.severity]}>{SEV_LABEL[c.severity]}</HealthPill>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted-foreground">
                      {c.cascade.map((step, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5">
                          <span className="rounded-md bg-muted px-2 py-0.5 text-foreground/80">{step}</span>
                          {i < c.cascade.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/60" />}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </OpsCard>
        </div>

        {/* 6. Staffing & readiness escalations */}
        <OpsCard title="Staffing & Readiness Escalations" hint="State-level pressure">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {staffingEsc.map((s) => (
              <div key={s.code} className="rounded-xl border border-border/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold tracking-tight text-foreground">{s.code}</span>
                  <HealthPill tone={s.tone}>{s.tone}</HealthPill>
                </div>
                <div className="mt-2 space-y-1 text-[12px] text-muted-foreground">
                  <div className="flex justify-between"><span>Critical needs</span><span className="tabular-nums text-foreground">{s.critical}</span></div>
                  <div className="flex justify-between"><span>High needs</span><span className="tabular-nums text-foreground">{s.high}</span></div>
                  <div className="flex justify-between"><span>BCBA overload</span><span className="tabular-nums text-foreground">{s.overload}</span></div>
                </div>
              </div>
            ))}
          </div>
        </OpsCard>

        {/* 7. Aging risk */}
        <OpsCard title="Aging & Resolution Risk" hint="Blockers becoming dangerous">
          {agingRisks.length === 0 ? (
            <EmptyRow>No aging blockers — turnaround is healthy.</EmptyRow>
          ) : (
            <ul className="space-y-2">
              {agingRisks.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-foreground">{b.title}</div>
                    <div className="mt-0.5 text-[11.5px] text-muted-foreground">{b.workflow} · {b.owner}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 text-rose-500" />
                    <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11.5px] font-medium text-rose-700 tabular-nums">{b.ageDays}d unresolved</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </OpsCard>

        {/* 8. Leadership intervention queue */}
        <OpsCard title="Leadership Intervention Queue" hint="Where executive coordination is needed">
          {interventions.length === 0 ? (
            <EmptyRow>No leadership-level interventions required.</EmptyRow>
          ) : (
            <ul className="grid gap-2.5 md:grid-cols-2">
              {interventions.map((i) => (
                <li key={i.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13.5px] font-medium text-foreground">{i.title}</div>
                    <HealthPill tone={SEV_TONE[i.urgency]}>{SEV_LABEL[i.urgency]}</HealthPill>
                  </div>
                  <div className="mt-1 text-[12.5px] text-muted-foreground">{i.why}</div>
                  <div className="mt-2 text-[12px] text-foreground/80">
                    <span className="text-muted-foreground">Impact: </span>{i.impact}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                    <span className="text-muted-foreground">{i.depts.join(" · ")}</span>
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      {i.action} <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </OpsCard>

        {/* 9. Resolution tracking */}
        <OpsCard title="Operational Resolution & Momentum" hint="Recovery signals">
          {resolutions.length === 0 ? (
            <EmptyRow>No recent resolutions logged.</EmptyRow>
          ) : (
            <ul className="space-y-2">
              {resolutions.map((r) => (
                <li key={r.id} className="flex items-start gap-3 rounded-xl border border-border/60 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-foreground">{r.text}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{r.meta}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </OpsCard>

        {/* 10. AI escalation intelligence */}
        <OpsCard title="AI Escalation Intelligence" hint="Ask Blossom AI">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 text-foreground/70 shrink-0" />
              <p className="text-[13px] leading-relaxed text-foreground/90">{aiSummary}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                "Explain Escalation",
                "Predict Operational Impact",
                "Generate Leadership Summary",
                "Identify Root Cause",
                "Recommend Intervention",
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