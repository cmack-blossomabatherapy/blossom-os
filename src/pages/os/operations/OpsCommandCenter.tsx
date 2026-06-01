import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  ArrowDownRight,
  Activity,
  Layers,
  Workflow,
} from "lucide-react";
import { OpsPage, OpsCard, HealthPill, EmptyRow, ActionPill, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { daysUntil, type AuthStage } from "@/data/authorizations";
import { cn } from "@/lib/utils";

const STATES = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;

const AUTH_LANE: AuthStage[] = [
  "Awaiting Submission",
  "In QA Review",
  "Submitted",
  "Approved",
  "Denied",
];

function toneFromCount(n: number, attentionAt: number, riskAt: number): HealthTone {
  if (n >= riskAt) return "risk";
  if (n >= attentionAt) return "attention";
  return "healthy";
}

function ToneBar({ tone, pct }: { tone: HealthTone; pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", {
          "bg-emerald-500": tone === "healthy",
          "bg-amber-500": tone === "attention",
          "bg-orange-500": tone === "risk",
          "bg-rose-500": tone === "blocked",
          "bg-muted-foreground/30": tone === "neutral",
        })}
        style={{ width: `${Math.max(6, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

function Dot({ tone }: { tone: HealthTone }) {
  return (
    <span
      className={cn("h-1.5 w-1.5 rounded-full shrink-0", {
        "bg-emerald-500": tone === "healthy",
        "bg-amber-500": tone === "attention",
        "bg-orange-500": tone === "risk",
        "bg-rose-500": tone === "blocked",
        "bg-muted-foreground/40": tone === "neutral",
      })}
    />
  );
}

export default function OpsCommandCenter() {
  const ops = useOpsIntelligence();
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const cr = useCentralReachOps({});
  const wf = useMemo(() => [ga, nc, va, tn, md], [ga, nc, va, tn, md]);

  // ---- Header signals ----
  const overallTone: HealthTone = ops.risks.some((r) => r.tone === "blocked")
    ? "blocked"
    : ops.risks.some((r) => r.tone === "risk")
    ? "risk"
    : ops.risks.length > 0
    ? "attention"
    : "healthy";

  const orgStaffing = useMemo(() => {
    const bcbas = wf.flatMap((w) => w.bcbas);
    const rbts = wf.flatMap((w) => w.rbts);
    const overloaded = bcbas.filter(
      (b) => b.status === "Overloaded" || b.status === "Near Capacity",
    ).length;
    const lowUtil = rbts.filter(
      (r) => r.status === "Underutilized" || r.status === "At Risk",
    ).length;
    const needs = wf.flatMap((w) => w.staffingNeeds);
    return { bcbas, rbts, overloaded, lowUtil, needs };
  }, [wf]);

  const blockedDepts = ops.depts.filter((d) => d.tone === "risk" || d.tone === "blocked");
  const attentionDepts = ops.depts.filter((d) => d.tone === "attention");
  const readinessScore = Math.round(
    ops.depts.reduce((s, d) => s + d.score, 0) / Math.max(1, ops.depts.length),
  );

  const headerSummary =
    blockedDepts.length === 0 && attentionDepts.length === 0
      ? "Operations are stable across the organization. No coordination intervention required right now."
      : blockedDepts.length > 0
      ? `Operations are stable overall. ${blockedDepts.map((d) => d.name).join(" and ")} require coordination today.`
      : `Operations are stable overall. ${attentionDepts.map((d) => d.name).join(", ")} need a closer look.`;

  // ---- Live Operations Pulse ----
  const pulse = useMemo(() => {
    const items: { id: string; area: string; title: string; tone: HealthTone; trend: "up" | "down" | "flat" }[] = [];
    if (ops.auths.expiring7.length > 0)
      items.push({ id: "p-exp", area: "Authorizations", title: `${ops.auths.expiring7.length} auths in ≤7-day window`, tone: "blocked", trend: "up" });
    if (ops.auths.qaStalled.length > 0)
      items.push({ id: "p-qa", area: "QA", title: `QA backlog at ${ops.auths.qaStalled.length}`, tone: ops.auths.qaStalled.length > 5 ? "risk" : "attention", trend: "up" });
    const heaviest = [...wf].map((w, i) => ({ s: STATES[i], n: w.staffingNeeds.length })).sort((a, b) => b.n - a.n)[0];
    if (heaviest && heaviest.n > 0)
      items.push({ id: "p-staff", area: "Staffing", title: `${heaviest.s} carries ${heaviest.n} active staffing needs`, tone: heaviest.n > 4 ? "risk" : "attention", trend: "up" });
    if (cr.cancellationsLast7d > 0)
      items.push({ id: "p-cx", area: "Scheduling", title: `${cr.cancellationsLast7d} session cancellations this week`, tone: cr.cancellationsLast7d > 20 ? "risk" : "attention", trend: cr.cancellationsLast7d > cr.cancellationsLast30d / 4 ? "up" : "flat" });
    if (ops.recruiting.stalledCandidates.length > 0)
      items.push({ id: "p-rec", area: "Recruiting", title: `${ops.recruiting.stalledCandidates.length} candidates stalled ≥14d`, tone: "attention", trend: "flat" });
    if (cr.counts.coveredClients > 0)
      items.push({ id: "p-cov", area: "Coverage", title: `${cr.counts.coveredClients} clients actively covered`, tone: "healthy", trend: "up" });
    if (ops.auths.missingDocs.length > 0)
      items.push({ id: "p-doc", area: "Authorizations", title: `${ops.auths.missingDocs.length} auths missing documentation`, tone: "attention", trend: "flat" });
    return items;
  }, [ops, wf, cr]);

  // ---- Active Workflow Streams ----
  const authLanes = useMemo(() => {
    return AUTH_LANE.map((stage) => {
      const inStage = ops.auths.expiring30.length > 0
        ? ops.auths // we want all auths, not just expiring; pull via signal sources below
        : [];
      void inStage;
      // Use full set from intelligence: rebuild from all known auth signals
      const all = [
        ...ops.auths.expiring30,
        ...ops.auths.qaStalled,
        ...ops.auths.missingDocs,
        ...ops.auths.denied,
      ];
      const dedup = new Map(all.map((a) => [a.id, a]));
      const items = Array.from(dedup.values()).filter((a) => a.stage === stage);
      const avgAge = items.length
        ? Math.round(items.reduce((s, a) => s + (a.daysInStage || 0), 0) / items.length)
        : 0;
      const tone: HealthTone =
        stage === "Denied"
          ? items.length > 0 ? "blocked" : "healthy"
          : avgAge >= 5
          ? "risk"
          : avgAge >= 3
          ? "attention"
          : "healthy";
      return { stage, count: items.length, avgAge, tone };
    });
  }, [ops]);

  const recruitingLanes = useMemo(() => {
    const map = new Map<string, number>();
    ops.recruiting.candidates.forEach((c) =>
      map.set(c.pipeline_stage, (map.get(c.pipeline_stage) ?? 0) + 1),
    );
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [ops.recruiting.candidates]);

  const staffingLanes = useMemo(
    () =>
      STATES.map((s, i) => {
        const w = wf[i];
        const need = w.staffingNeeds.length;
        const cap = w.bcbas.length || 1;
        const overloaded = w.bcbas.filter(
          (b) => b.status === "Overloaded" || b.status === "Near Capacity",
        ).length;
        const tone = toneFromCount(need + overloaded, 2, 5);
        return { state: s, need, overloaded, cap, tone };
      }),
    [wf],
  );

  // ---- Bottleneck Center ----
  const bottlenecks = useMemo(() => {
    const out: { id: string; title: string; aging: string; impact: string; area: string; owner: string; tone: HealthTone }[] = [];
    ops.auths.qaStalled.slice(0, 4).forEach((a) =>
      out.push({
        id: `qa-${a.id}`,
        title: `${a.clientName} — plan stalled in QA`,
        aging: `${a.daysInStage}d in stage`,
        impact: "Blocks auth submission",
        area: "QA",
        owner: a.qaOwner ?? a.coordinator,
        tone: a.daysInStage >= 5 ? "risk" : "attention",
      }),
    );
    ops.auths.missingDocs.slice(0, 3).forEach((a) =>
      out.push({
        id: `md-${a.id}`,
        title: `${a.clientName} — missing documentation`,
        aging: a.missingRequirements.slice(0, 2).join(", ") || "Awaiting docs",
        impact: "Auth submission blocked",
        area: "Authorizations",
        owner: a.coordinator,
        tone: "attention",
      }),
    );
    ops.auths.expiring7.slice(0, 3).forEach((a) =>
      out.push({
        id: `ex-${a.id}`,
        title: `${a.clientName} — auth expires in ${daysUntil(a.expirationDate)}d`,
        aging: a.payor,
        impact: "Reauthorization risk",
        area: "Authorizations",
        owner: a.coordinator,
        tone: "blocked",
      }),
    );
    ops.recruiting.stalledCandidates.slice(0, 3).forEach((c) =>
      out.push({
        id: `rc-${c.id}`,
        title: `${c.first_name} ${c.last_name} — stalled in ${c.pipeline_stage}`,
        aging: `${c.role} · ${c.state}`,
        impact: "Slows staffing pipeline",
        area: "Recruiting",
        owner: c.recruiter ?? "Unassigned",
        tone: "attention",
      }),
    );
    orgStaffing.needs.slice(0, 3).forEach((n) =>
      out.push({
        id: `sn-${n.id}`,
        title: `${n.client} — ${n.need} needed (${n.hoursNeeded}h/wk)`,
        aging: n.region,
        impact: "Client services at risk",
        area: "Staffing",
        owner: n.owner,
        tone: n.urgency === "critical" ? "blocked" : n.urgency === "high" ? "risk" : "attention",
      }),
    );
    return out;
  }, [ops, orgStaffing]);

  // ---- Department Coordination Grid ----
  const coordination = useMemo(() => {
    const intakeAuth: HealthTone = ops.auths.missingDocs.length > 5 ? "risk" : ops.auths.missingDocs.length > 0 ? "attention" : "healthy";
    const authQa: HealthTone = ops.auths.qaStalled.length > 5 ? "risk" : ops.auths.qaStalled.length > 0 ? "attention" : "healthy";
    const qaSched: HealthTone =
      ops.auths.qaStalled.length > 3 && cr.counts.uncoveredClients > 5 ? "risk" : ops.auths.qaStalled.length > 0 ? "attention" : "healthy";
    const recStaff: HealthTone =
      ops.recruiting.stalledCandidates.length > 5 && orgStaffing.needs.length > 3
        ? "risk"
        : ops.recruiting.stalledCandidates.length > 0
        ? "attention"
        : "healthy";
    const hrPay: HealthTone = "healthy";
    const trainOps: HealthTone = "attention";
    const sdBcba: HealthTone = orgStaffing.overloaded > 5 ? "risk" : orgStaffing.overloaded > 0 ? "attention" : "healthy";
    const clinicsStaff: HealthTone = orgStaffing.needs.length > 5 ? "risk" : orgStaffing.needs.length > 0 ? "attention" : "healthy";
    return [
      { id: "ia", a: "Intake", b: "Authorizations", tone: intakeAuth, signal: `${ops.auths.missingDocs.length} auths missing intake docs` },
      { id: "aq", a: "Authorizations", b: "QA", tone: authQa, signal: `${ops.auths.qaStalled.length} plans stalled in QA` },
      { id: "qs", a: "QA", b: "Scheduling", tone: qaSched, signal: `${cr.counts.uncoveredClients} clients without coverage` },
      { id: "rs", a: "Recruiting", b: "Staffing", tone: recStaff, signal: `${ops.recruiting.stalledCandidates.length} stalled · ${orgStaffing.needs.length} open needs` },
      { id: "hp", a: "HR", b: "Payroll", tone: hrPay, signal: "Cycle on track" },
      { id: "to", a: "Training", b: "Operations", tone: trainOps, signal: "Adoption pacing slightly behind" },
      { id: "sb", a: "State Directors", b: "BCBAs", tone: sdBcba, signal: `${orgStaffing.overloaded} BCBAs at/over capacity` },
      { id: "cs", a: "Clinics", b: "Staffing", tone: clinicsStaff, signal: `${orgStaffing.needs.length} active staffing needs` },
    ];
  }, [ops, cr, orgStaffing]);

  // ---- Staffing Pressure Monitor (state heat) ----
  const statePressure = useMemo(
    () =>
      STATES.map((s, i) => {
        const w = wf[i];
        const overloaded = w.bcbas.filter(
          (b) => b.status === "Overloaded" || b.status === "Near Capacity",
        ).length;
        const lowUtil = w.rbts.filter(
          (r) => r.status === "Underutilized" || r.status === "At Risk",
        ).length;
        const needs = w.staffingNeeds.length;
        const pressure = needs * 2 + overloaded + Math.floor(lowUtil / 2);
        const tone: HealthTone = pressure >= 10 ? "risk" : pressure >= 4 ? "attention" : "healthy";
        return { state: s, pressure, overloaded, lowUtil, needs, tone };
      }),
    [wf],
  );

  // ---- Escalations ----
  const escalations = ops.risks.filter((r) => r.tone === "blocked" || r.tone === "risk");

  // ---- Cross-Department Dependency Tracker ----
  const dependencies = useMemo(() => {
    const out: { id: string; chain: string[]; tone: HealthTone; detail: string }[] = [];
    if (ops.auths.qaStalled.length > 0)
      out.push({
        id: "d1",
        chain: ["QA plan stalled", "Auth submission delayed", "Client start slips"],
        tone: ops.auths.qaStalled.length > 5 ? "risk" : "attention",
        detail: `${ops.auths.qaStalled.length} plans currently affected`,
      });
    if (ops.auths.missingDocs.length > 0)
      out.push({
        id: "d2",
        chain: ["Intake packet missing info", "VOB delayed", "Assessment delayed"],
        tone: "attention",
        detail: `${ops.auths.missingDocs.length} auths blocked on documents`,
      });
    if (ops.recruiting.stalledCandidates.length > 0 && orgStaffing.needs.length > 0)
      out.push({
        id: "d3",
        chain: ["Recruiting stalled", "Staffing gaps grow", "Scheduling coverage drops"],
        tone: ops.recruiting.stalledCandidates.length > 5 ? "risk" : "attention",
        detail: `${ops.recruiting.stalledCandidates.length} stalled · ${orgStaffing.needs.length} open needs`,
      });
    if (ops.auths.expiring7.length > 0)
      out.push({
        id: "d4",
        chain: ["Auth nearing expiration", "Continuation at risk", "Service interruption"],
        tone: "blocked",
        detail: `${ops.auths.expiring7.length} auth${ops.auths.expiring7.length === 1 ? "" : "s"} ≤7d`,
      });
    if (out.length === 0)
      out.push({
        id: "d0",
        chain: ["No active dependency chains detected"],
        tone: "healthy",
        detail: "Cross-department flow is healthy",
      });
    return out;
  }, [ops, orgStaffing]);

  // ---- Readiness Monitor ----
  const readiness = useMemo(() => {
    const totalAuths = ops.auths.total || 1;
    const recTotal = ops.recruiting.candidates.length || 1;
    const bcbaTotal = orgStaffing.bcbas.length || 1;
    const authReady = Math.round(((totalAuths - ops.auths.expiring7.length - ops.auths.qaStalled.length - ops.auths.missingDocs.length) / totalAuths) * 100);
    const qaReady = Math.round(((totalAuths - ops.auths.qaStalled.length) / totalAuths) * 100);
    const recReady = Math.round(((recTotal - ops.recruiting.stalledCandidates.length) / recTotal) * 100);
    const staffReady = Math.round(((bcbaTotal - orgStaffing.overloaded) / bcbaTotal) * 100);
    const coverage = cr.counts.activeClients ? Math.round((cr.counts.coveredClients / cr.counts.activeClients) * 100) : null;
    function tone(v: number | null): HealthTone {
      if (v === null) return "neutral";
      if (v >= 90) return "healthy";
      if (v >= 75) return "attention";
      if (v >= 60) return "risk";
      return "blocked";
    }
    return [
      { label: "Intake", value: 92, tone: tone(92) },
      { label: "Assessment", value: qaReady, tone: tone(qaReady) },
      { label: "Staffing", value: staffReady, tone: tone(staffReady) },
      { label: "Scheduling", value: coverage ?? 0, tone: coverage === null ? "neutral" : tone(coverage) },
      { label: "QA", value: qaReady, tone: tone(qaReady) },
      { label: "Authorizations", value: authReady, tone: tone(authReady) },
      { label: "Recruiting", value: recReady, tone: tone(recReady) },
      { label: "Training", value: 78, tone: tone(78) },
    ];
  }, [ops, orgStaffing, cr]);

  // ---- AI Coordination Assistant ----
  const aiInsights = useMemo(() => {
    const out: string[] = [];
    const heaviest = [...wf].map((w, i) => ({ s: STATES[i], gap: w.staffingNeeds.length })).sort((a, b) => b.gap - a.gap)[0];
    if (heaviest && heaviest.gap > 0)
      out.push(`${heaviest.s} onboarding momentum is the lever — ${heaviest.gap} staffing need${heaviest.gap === 1 ? "" : "s"} are concentrated there.`);
    if (ops.auths.qaStalled.length > 3 && ops.auths.expiring14.length > 0)
      out.push(`QA backlog (${ops.auths.qaStalled.length}) is likely to compress reauthorization readiness for ${ops.auths.expiring14.length} auths within 14 days.`);
    if (orgStaffing.overloaded > 3 && orgStaffing.needs.length > 0)
      out.push(`${orgStaffing.overloaded} BCBAs near or over capacity while ${orgStaffing.needs.length} unstaffed clients are waiting — redistribution before new intake.`);
    if (cr.cancellationsLast7d > cr.cancellationsLast30d / 4 + 5)
      out.push(`Cancellation rate this week (${cr.cancellationsLast7d}) is above the trailing 30-day pace.`);
    if (out.length === 0) out.push("Coordination signals are quiet. No predictive risks crossing the leadership threshold.");
    return out;
  }, [wf, ops, orgStaffing, cr]);

  return (
    <OpsPage
      title="Operations Command Center"
      subtitle="The live coordination layer across departments — movement, bottlenecks, and where leadership is needed."
    >
      {/* 1. Operational Status Header */}
      <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/30 p-6 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_24px_-12px_hsl(220_15%_20%/0.08)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Live · Org-wide</div>
            <h2 className="mt-1 text-[24px] md:text-[28px] font-semibold tracking-tight">
              Operational readiness <span className="tabular-nums">{readinessScore}</span><span className="text-muted-foreground">/100</span>
            </h2>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">{headerSummary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5">
              <span className="relative inline-flex">
                <span className={cn("h-2 w-2 rounded-full", {
                  "bg-emerald-500": overallTone === "healthy",
                  "bg-amber-500": overallTone === "attention",
                  "bg-orange-500": overallTone === "risk",
                  "bg-rose-500": overallTone === "blocked",
                })} />
                <span className={cn("absolute inset-0 -m-1 rounded-full opacity-40 animate-ping", {
                  "bg-emerald-400": overallTone === "healthy",
                  "bg-amber-400": overallTone === "attention",
                  "bg-orange-400": overallTone === "risk",
                  "bg-rose-400": overallTone === "blocked",
                })} />
              </span>
              <span className="text-[12px] text-muted-foreground">Pulse</span>
            </div>
            <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-[12px] text-muted-foreground">
              {blockedDepts.length + attentionDepts.length} dept{blockedDepts.length + attentionDepts.length === 1 ? "" : "s"} under pressure
            </span>
            <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-[12px] text-muted-foreground">
              {ops.risks.length} blocker{ops.risks.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-[12px] text-muted-foreground">
              {escalations.length} escalation{escalations.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Live Operations Pulse */}
      <OpsCard title="Live operations pulse" hint="Last few hours · derived from live data">
        {pulse.length === 0 ? (
          <EmptyRow>Nothing notable to surface right now.</EmptyRow>
        ) : (
          <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            {pulse.map((p) => (
              <div
                key={p.id}
                className="min-w-[240px] max-w-[260px] shrink-0 rounded-xl border border-border/60 bg-background/40 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Dot tone={p.tone} />
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.area}</span>
                  </div>
                  <ArrowDownRight
                    className={cn("h-3.5 w-3.5", {
                      "rotate-[-90deg] text-rose-500": p.trend === "up",
                      "text-emerald-500": p.trend === "down",
                      "text-muted-foreground/50": p.trend === "flat",
                    })}
                  />
                </div>
                <div className="mt-2 text-[13px] font-medium leading-snug text-foreground">{p.title}</div>
              </div>
            ))}
          </div>
        )}
      </OpsCard>

      {/* 3. Active Workflow Streams */}
      <OpsCard title="Active workflow streams" hint="Lane health · live">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Authorizations lane */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Workflow className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[12px] font-semibold tracking-tight text-foreground">Authorizations</span>
            </div>
            <ul className="space-y-1.5">
              {authLanes.map((l) => (
                <li key={l.stage} className="rounded-xl border border-border/60 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] text-foreground">{l.stage}</span>
                    <span className="text-[11.5px] tabular-nums text-muted-foreground">{l.count}</span>
                  </div>
                  <div className="mt-1.5">
                    <ToneBar tone={l.tone} pct={Math.min(100, l.count * 8 + 10)} />
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{l.count ? `avg ${l.avgAge}d in stage` : "no items"}</div>
                </li>
              ))}
            </ul>
          </div>
          {/* Recruiting lane */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Workflow className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[12px] font-semibold tracking-tight text-foreground">Recruiting</span>
            </div>
            {recruitingLanes.length === 0 ? (
              <EmptyRow>No active candidates.</EmptyRow>
            ) : (
              <ul className="space-y-1.5">
                {recruitingLanes.map(([stage, n]) => {
                  const tone: HealthTone = n > 12 ? "attention" : "healthy";
                  return (
                    <li key={stage} className="rounded-xl border border-border/60 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[12.5px] text-foreground">{stage}</span>
                        <span className="text-[11.5px] tabular-nums text-muted-foreground">{n}</span>
                      </div>
                      <div className="mt-1.5">
                        <ToneBar tone={tone} pct={Math.min(100, n * 6 + 10)} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {/* Staffing lane */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Workflow className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[12px] font-semibold tracking-tight text-foreground">Staffing</span>
            </div>
            <ul className="space-y-1.5">
              {staffingLanes.map((l) => (
                <li key={l.state} className="rounded-xl border border-border/60 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] text-foreground">{l.state}</span>
                    <span className="text-[11.5px] tabular-nums text-muted-foreground">
                      {l.need} need · {l.overloaded} over
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <ToneBar tone={l.tone} pct={Math.min(100, (l.need + l.overloaded) * 10 + 10)} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </OpsCard>

      {/* 4. Bottleneck Center + 5. Coordination Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        <OpsCard
          title="Operational bottleneck center"
          hint={`${bottlenecks.length} signal${bottlenecks.length === 1 ? "" : "s"}`}
          className="lg:col-span-2"
        >
          {bottlenecks.length === 0 ? (
            <EmptyRow>No active bottlenecks detected.</EmptyRow>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {bottlenecks.slice(0, 10).map((b) => (
                <li key={b.id} className="rounded-xl border border-border/60 p-3">
                  <div className="flex items-center gap-2">
                    <Dot tone={b.tone} />
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{b.area}</span>
                  </div>
                  <div className="mt-1 truncate text-[13px] font-medium text-foreground">{b.title}</div>
                  <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{b.aging}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{b.impact}</span>
                    <span className="text-muted-foreground">{b.owner}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </OpsCard>

        <OpsCard title="Department coordination" hint="Handoff health">
          <ul className="space-y-1.5">
            {coordination.map((c) => (
              <li key={c.id} className="rounded-xl border border-border/60 p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[12.5px] font-medium text-foreground">{c.a}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[12.5px] font-medium text-foreground">{c.b}</span>
                  </div>
                  <HealthPill tone={c.tone}>{c.tone}</HealthPill>
                </div>
                <div className="mt-1 text-[11.5px] text-muted-foreground">{c.signal}</div>
              </li>
            ))}
          </ul>
        </OpsCard>
      </div>

      {/* 6. Staffing Pressure Monitor + 9. Readiness Monitor */}
      <div className="grid gap-4 lg:grid-cols-2">
        <OpsCard title="Staffing pressure" hint="By state · live">
          <div className="space-y-2">
            {statePressure.map((s) => (
              <Link
                key={s.state}
                to="/operations/staffing-capacity"
                className="block rounded-xl border border-border/60 p-3 transition hover:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[14px] font-semibold tracking-tight text-foreground">{s.state}</span>
                    <span className="text-[11.5px] text-muted-foreground">
                      {s.needs} need · {s.overloaded} over · {s.lowUtil} low-util
                    </span>
                  </div>
                  <HealthPill tone={s.tone}>{s.tone}</HealthPill>
                </div>
                <div className="mt-2">
                  <ToneBar tone={s.tone} pct={Math.min(100, s.pressure * 10 + 8)} />
                </div>
              </Link>
            ))}
          </div>
        </OpsCard>

        <OpsCard title="Operational readiness" hint="Confidence by area">
          <div className="grid gap-2 sm:grid-cols-2">
            {readiness.map((r) => (
              <div key={r.label} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-medium text-foreground">{r.label}</span>
                  <span className="text-[11.5px] tabular-nums text-muted-foreground">
                    {r.tone === "neutral" ? "—" : `${r.value}%`}
                  </span>
                </div>
                <div className="mt-1.5">
                  <ToneBar tone={r.tone} pct={r.tone === "neutral" ? 8 : r.value} />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {r.tone === "healthy"
                    ? "Ready"
                    : r.tone === "attention"
                    ? "Needs attention"
                    : r.tone === "risk"
                    ? "At risk"
                    : r.tone === "blocked"
                    ? "Blocked"
                    : "Awaiting signal"}
                </div>
              </div>
            ))}
          </div>
        </OpsCard>
      </div>

      {/* 7. Escalation Coordination Feed + 8. Dependency Tracker */}
      <div className="grid gap-4 lg:grid-cols-3">
        <OpsCard
          title="Escalation coordination"
          hint={`${escalations.length} active`}
          className="lg:col-span-2"
        >
          {escalations.length === 0 ? (
            <EmptyRow>No active escalations. Coordination is clear.</EmptyRow>
          ) : (
            <ol className="relative space-y-3 border-l border-border/60 pl-5">
              {escalations.map((e) => (
                <li key={e.id} className="relative">
                  <span
                    className={cn("absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-card", {
                      "bg-rose-500": e.tone === "blocked",
                      "bg-orange-500": e.tone === "risk",
                      "bg-amber-500": e.tone === "attention",
                      "bg-emerald-500": e.tone === "healthy",
                    })}
                  />
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{e.area}</div>
                      <div className="mt-0.5 text-[13.5px] font-medium text-foreground">{e.title}</div>
                      <div className="mt-0.5 text-[12px] text-muted-foreground">{e.detail}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ActionPill label="Assign" toastMessage={`Assigned: ${e.title}`} />
                      <ActionPill label="Follow up" toastMessage={`Follow-up logged for ${e.area}`} />
                      <Link to="/operations/escalations" className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-border hover:text-foreground">Open</Link>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </OpsCard>

        <OpsCard title="Cross-department dependencies" hint="Predictive chains">
          <ul className="space-y-2">
            {dependencies.map((d) => (
              <li key={d.id} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  <HealthPill tone={d.tone}>{d.tone}</HealthPill>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">
                  {d.chain.map((step, i) => (
                    <span key={`${d.id}-${i}`} className="inline-flex items-center gap-1.5">
                      <span className="rounded-md border border-border/60 bg-background/40 px-1.5 py-0.5 text-foreground">{step}</span>
                      {i < d.chain.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-[11.5px] text-muted-foreground">{d.detail}</div>
              </li>
            ))}
          </ul>
        </OpsCard>
      </div>

      {/* 10. AI Coordination Assistant */}
      <OpsCard title="AI coordination assistant" hint="Live · derived">
        <div className="grid gap-2 sm:grid-cols-2">
          {aiInsights.map((t, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-background/40 p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <p className="text-[12.5px] leading-relaxed text-foreground">{t}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            { label: "Ask AI", to: "/operations/briefing" },
            { label: "Coordination summary", to: "/operations/briefing" },
            { label: "Explain operational risk", to: "/operations/workflow-risks" },
            { label: "Workflow dependencies", to: "/operations/workflow-risks" },
            { label: "Recommend actions", to: "/operations/briefing" },
          ].map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="rounded-full border border-border/60 px-2.5 py-1 text-[11.5px] text-muted-foreground hover:border-border hover:text-foreground"
            >
              {a.label}
            </Link>
          ))}
        </div>
      </OpsCard>

      {/* Quick nav */}
      <div className="grid gap-3 md:grid-cols-3">
        <Link to="/operations" className="group rounded-2xl border border-border/70 bg-card p-4 transition hover:-translate-y-0.5 hover:border-border">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[13px] font-medium tracking-tight">Executive Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5" />
          </div>
        </Link>
        <Link to="/operations/workflow-risks" className="group rounded-2xl border border-border/70 bg-card p-4 transition hover:-translate-y-0.5 hover:border-border">
          <Workflow className="h-4 w-4 text-muted-foreground" />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[13px] font-medium tracking-tight">Workflow Risks</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5" />
          </div>
        </Link>
        <Link to="/operations/staffing-capacity" className="group rounded-2xl border border-border/70 bg-card p-4 transition hover:-translate-y-0.5 hover:border-border">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[13px] font-medium tracking-tight">Staffing & Capacity</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5" />
          </div>
        </Link>
      </div>
    </OpsPage>
  );
}