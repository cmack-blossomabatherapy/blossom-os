import { useMemo } from "react";
import { OpsPage, OpsCard, HealthPill, EmptyRow, AIPrompt, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { daysUntil } from "@/data/authorizations";
import { Sparkles, ArrowRight, TrendingUp, TrendingDown, AlertTriangle, GitBranch, Activity, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const STATES = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;

type Status = "Stable" | "Monitor" | "At Risk" | "Critical";
const statusTone: Record<Status, HealthTone> = {
  Stable: "healthy",
  Monitor: "attention",
  "At Risk": "risk",
  Critical: "blocked",
};

function scoreToStatus(score: number): Status {
  if (score >= 88) return "Stable";
  if (score >= 75) return "Monitor";
  if (score >= 60) return "At Risk";
  return "Critical";
}

export default function OpsWorkflowRisks() {
  const ops = useOpsIntelligence();
  const cr = useCentralReachOps();
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const wf = { GA: ga, NC: nc, VA: va, TN: tn, MD: md };

  const totalAuths = ops.auths.total || 1;

  // Workflow risk grid — 12 operational workflows
  const workflows = useMemo(() => {
    const needsByState = STATES.map((s) => wf[s].staffingNeeds.length).reduce((a, b) => a + b, 0);
    const overloadByState = STATES.map((s) => wf[s].bcbas.filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length).reduce((a, b) => a + b, 0);
    const coverage = cr.counts.activeClients > 0 ? Math.round((cr.counts.coveredClients / cr.counts.activeClients) * 100) : 100;

    return [
      { id: "intake", name: "Intake pipeline", score: 86, owner: "Intake lead", bottleneck: "Lead-to-VOB conversion", trend: "flat" as const, signal: "Pipeline flowing on cadence" },
      { id: "vob", name: "VOB processing", score: ops.auths.missingDocs.length > 5 ? 64 : 82, owner: "VOB team", bottleneck: ops.auths.missingDocs.length > 5 ? "Missing insurance information" : "On track", trend: ops.auths.missingDocs.length > 5 ? ("down" as const) : ("flat" as const), signal: `${ops.auths.missingDocs.length} VOB-blocked submissions` },
      { id: "auth-sub", name: "Authorization submission", score: Math.max(50, 100 - ops.auths.missingDocs.length * 3 - ops.auths.expiring7.length * 2), owner: "Auth team", bottleneck: "Missing documentation packets", trend: "down" as const, signal: `${ops.auths.missingDocs.length} blocked on docs` },
      { id: "qa", name: "QA review", score: Math.max(45, 100 - ops.auths.qaStalled.length * 4), owner: "QA lead", bottleneck: "Plans stalled ≥3 days", trend: ops.auths.qaStalled.length > 5 ? ("down" as const) : ("up" as const), signal: `${ops.auths.qaStalled.length} plans in QA backlog` },
      { id: "assess", name: "Assessment scheduling", score: 80, owner: "Scheduling", bottleneck: "BCBA availability", trend: "flat" as const, signal: "Tracked in scheduling workspace" },
      { id: "treatment", name: "Treatment authorization", score: Math.max(45, 100 - ops.auths.expiring7.length * 5 - ops.auths.denied.length * 6), owner: "Auth team", bottleneck: "Reauth window pressure", trend: "down" as const, signal: `${ops.auths.expiring7.length} expire ≤7d · ${ops.auths.denied.length} denied` },
      { id: "staffing", name: "Staffing assignment", score: Math.max(50, 100 - needsByState * 2 - overloadByState), owner: "Scheduling", bottleneck: "Open staffing needs", trend: needsByState > 5 ? ("down" as const) : ("flat" as const), signal: `${needsByState} open needs · ${overloadByState} BCBA strain` },
      { id: "recruiting", name: "Recruiting pipeline", score: Math.max(55, 100 - ops.recruiting.stalledCandidates.length * 3), owner: "Recruiting", bottleneck: "Candidates stalled ≥14d", trend: ops.recruiting.stalledCandidates.length > 5 ? ("down" as const) : ("flat" as const), signal: `${ops.recruiting.stalledCandidates.length} candidates stalled` },
      { id: "onboarding", name: "Employee onboarding", score: 82, owner: "HR", bottleneck: "Credentialing turnaround", trend: "flat" as const, signal: "Onboarding cycle steady" },
      { id: "payroll", name: "Payroll readiness", score: 92, owner: "Payroll", bottleneck: "—", trend: "flat" as const, signal: "Cycle stable" },
      { id: "pr", name: "Progress report collection", score: ops.auths.qaStalled.length > 3 ? 68 : 84, owner: "BCBAs / QA", bottleneck: "Late PR submissions", trend: ops.auths.qaStalled.length > 3 ? ("down" as const) : ("up" as const), signal: `${ops.auths.qaStalled.length} downstream QA delays` },
      { id: "clinics", name: "Clinic readiness", score: coverage, owner: "Clinic ops", bottleneck: cr.counts.uncoveredClients > 0 ? `${cr.counts.uncoveredClients} uncovered clients` : "Covered", trend: coverage < 85 ? ("down" as const) : ("flat" as const), signal: `${coverage}% client coverage` },
    ].map((w) => ({ ...w, status: scoreToStatus(w.score) }));
  }, [ops, cr, wf]);

  const counts = workflows.reduce((a, w) => { a[w.status]++; return a; }, { Stable: 0, Monitor: 0, "At Risk": 0, Critical: 0 } as Record<Status, number>);
  const orgRiskScore = Math.round(workflows.reduce((a, w) => a + w.score, 0) / workflows.length);
  const orgStatus = scoreToStatus(orgRiskScore);

  // Bottlenecks
  const bottlenecks = useMemo(() => {
    const out: { title: string; severity: HealthTone; impact: string; aging: string; depts: string; action: string }[] = [];
    if (ops.auths.qaStalled.length > 0) out.push({
      title: "QA review backlog",
      severity: ops.auths.qaStalled.length > 8 ? "blocked" : ops.auths.qaStalled.length > 3 ? "risk" : "attention",
      impact: "Delays treatment authorization and scheduling downstream.",
      aging: `${ops.auths.qaStalled.length} plans ≥3 days`,
      depts: "QA · Auth · Scheduling",
      action: "Sequence QA queue by reauth expiration.",
    });
    if (ops.auths.missingDocs.length > 0) out.push({
      title: "Missing documentation packets",
      severity: ops.auths.missingDocs.length > 5 ? "risk" : "attention",
      impact: "Auth submissions blocked at the gate.",
      aging: `${ops.auths.missingDocs.length} auths waiting`,
      depts: "Intake · Auth",
      action: "Standardize intake handoff checklist.",
    });
    if (ops.auths.expiring7.length > 0) out.push({
      title: "Reauth window pressure",
      severity: "blocked",
      impact: "Service interruption risk for affected clients.",
      aging: `${ops.auths.expiring7.length} expire ≤7d`,
      depts: "Auth · State leadership",
      action: "Confirm reauth owners today.",
    });
    if (ops.recruiting.stalledCandidates.length > 5) out.push({
      title: "Recruiting drop-offs",
      severity: "attention",
      impact: "Onboarding throughput will lag staffing demand.",
      aging: `${ops.recruiting.stalledCandidates.length} stalled ≥14d`,
      depts: "Recruiting",
      action: "Triage stalled candidates this week.",
    });
    return out;
  }, [ops]);

  // Dependency chains
  const dependencies = useMemo(() => {
    const chains: { chain: string[]; severity: HealthTone; signal: string }[] = [];
    if (ops.auths.missingDocs.length > 0) chains.push({
      chain: ["Intake docs", "VOB", "Auth submission", "Assessment", "Staffing"],
      severity: ops.auths.missingDocs.length > 5 ? "risk" : "attention",
      signal: `${ops.auths.missingDocs.length} missing-doc cases blocking the chain`,
    });
    if (ops.auths.qaStalled.length > 0) chains.push({
      chain: ["Progress report", "QA review", "Treatment auth", "Scheduling"],
      severity: ops.auths.qaStalled.length > 5 ? "risk" : "attention",
      signal: `${ops.auths.qaStalled.length} plans stuck in QA delaying downstream auth`,
    });
    const totalNeeds = STATES.reduce((a, s) => a + wf[s].staffingNeeds.length, 0);
    if (ops.recruiting.stalledCandidates.length > 3 || totalNeeds > 5) chains.push({
      chain: ["Recruiting", "Onboarding", "Staffing pool", "Client coverage"],
      severity: ops.recruiting.stalledCandidates.length > 8 ? "risk" : "attention",
      signal: `Pipeline drag → ${totalNeeds} open staffing needs across states`,
    });
    if (ops.auths.expiring14.length > 0) chains.push({
      chain: ["QA throughput", "Reauth submission", "Continuation of care"],
      severity: ops.auths.expiring7.length > 0 ? "blocked" : "risk",
      signal: `${ops.auths.expiring14.length} reauths inside 14-day window`,
    });
    return chains;
  }, [ops, wf]);

  // Readiness monitor
  const readiness = [
    { area: "Intake readiness", score: 86 },
    { area: "Auth readiness", score: Math.max(45, 100 - ops.auths.missingDocs.length * 3 - ops.auths.expiring7.length * 4) },
    { area: "Staffing readiness", score: Math.max(50, 100 - STATES.reduce((a, s) => a + wf[s].staffingNeeds.length, 0) * 2) },
    { area: "Onboarding readiness", score: 84 },
    { area: "Scheduling readiness", score: cr.counts.activeClients > 0 ? Math.round((cr.counts.coveredClients / cr.counts.activeClients) * 100) : 88 },
    { area: "Payroll readiness", score: 92 },
    { area: "Clinic readiness", score: 86 },
    { area: "Training readiness", score: 78 },
    { area: "QA readiness", score: Math.max(45, 100 - ops.auths.qaStalled.length * 4) },
  ].map((r) => ({ ...r, status: scoreToStatus(r.score) }));

  // Staffing pressure (state)
  const statePressure = STATES.map((s) => {
    const w = wf[s];
    const overload = w.bcbas.filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length;
    const atRisk = w.rbts.filter((r) => r.status === "At Risk").length;
    const needs = w.staffingNeeds.length;
    const score = overload * 3 + needs * 2 + atRisk;
    const tone: HealthTone = score >= 12 ? "blocked" : score >= 7 ? "risk" : score >= 3 ? "attention" : "healthy";
    return { state: s, overload, atRisk, needs, score, tone };
  }).sort((a, b) => b.score - a.score);

  // Escalation forecasting
  const escalations = useMemo(() => {
    const out: { title: string; likelihood: number; impact: string; window: string; tone: HealthTone }[] = [];
    if (ops.auths.expiring7.length > 0) out.push({
      title: `${ops.auths.expiring7.length} reauth${ops.auths.expiring7.length === 1 ? "" : "s"} could lapse`,
      likelihood: 92, impact: "Service interruption", window: "≤7 days", tone: "blocked",
    });
    if (ops.auths.qaStalled.length > 5) out.push({
      title: "QA backlog will block treatment authorizations",
      likelihood: 80, impact: "Auth turnaround", window: "7–14 days", tone: "risk",
    });
    if (ops.auths.denied.length > 0) out.push({
      title: `${ops.auths.denied.length} denial${ops.auths.denied.length === 1 ? "" : "s"} need appeals`,
      likelihood: 88, impact: "Revenue + care continuity", window: "Active", tone: "risk",
    });
    if (statePressure[0] && statePressure[0].tone !== "healthy") out.push({
      title: `${statePressure[0].state} staffing instability rising`,
      likelihood: 70, impact: "Client coverage", window: "10–14 days", tone: statePressure[0].tone,
    });
    if (ops.recruiting.stalledCandidates.length > 5) out.push({
      title: "Recruiting drop-offs will weaken onboarding pipeline",
      likelihood: 65, impact: "Future staffing capacity", window: "2–3 weeks", tone: "attention",
    });
    return out.sort((a, b) => b.likelihood - a.likelihood);
  }, [ops, statePressure]);

  // Recommendations
  const recommendations = useMemo(() => {
    const out: { title: string; impact: string; urgency: HealthTone; depts: string; reduction: string }[] = [];
    if (ops.auths.qaStalled.length > 3) out.push({
      title: "Add QA review capacity this cycle",
      impact: "Unblock auth turnaround and protect reauth windows.",
      urgency: "risk", depts: "QA · Auth", reduction: "−25% backlog projected",
    });
    if (ops.auths.expiring7.length > 0) out.push({
      title: "Escalate ≤7-day reauths to state directors",
      impact: "Prevent service interruptions.",
      urgency: "blocked", depts: "Auth · State leadership", reduction: "−95% lapse risk",
    });
    if (statePressure[0] && statePressure[0].score >= 7) out.push({
      title: `Rebalance scheduling in ${statePressure[0].state}`,
      impact: "Lower BCBA strain and protect client coverage.",
      urgency: statePressure[0].tone, depts: `${statePressure[0].state} state · Scheduling`, reduction: "−30% strain projected",
    });
    if (ops.recruiting.stalledCandidates.length > 5) out.push({
      title: "Run recruiting triage standup",
      impact: "Restore pipeline velocity ahead of staffing demand.",
      urgency: "attention", depts: "Recruiting · HR", reduction: "+20% onboarding throughput",
    });
    if (out.length === 0) out.push({
      title: "Maintain current operational rhythm",
      impact: "No interventions required — protect deep work.",
      urgency: "healthy", depts: "—", reduction: "—",
    });
    return out;
  }, [ops, statePressure]);

  // AI predictive summary
  const aiLines = useMemo(() => {
    const lines: string[] = [];
    lines.push(
      orgRiskScore >= 85
        ? "Workflow stability is high across the organization. No imminent failures detected."
        : orgRiskScore >= 72
          ? "Workflow stability is holding, but isolated bottlenecks are compounding."
          : "Workflow degradation is active and will cascade without intervention.",
    );
    if (ops.auths.qaStalled.length > 3 && ops.auths.expiring14.length > 0) {
      lines.push(`QA backlog (${ops.auths.qaStalled.length}) is intersecting with ${ops.auths.expiring14.length} 14-day reauths — risk concentrates in the next 10 days.`);
    }
    if (statePressure[0] && statePressure[0].tone !== "healthy") {
      lines.push(`${statePressure[0].state} carries the highest staffing risk — ${statePressure[0].overload} BCBA strains and ${statePressure[0].needs} open needs.`);
    }
    if (ops.auths.missingDocs.length > 3) {
      lines.push(`Documentation friction is the root cause of ${ops.auths.missingDocs.length} stalled auth submissions.`);
    }
    return lines;
  }, [orgRiskScore, ops, statePressure]);

  return (
    <OpsPage title="Workflow Risks" subtitle="Predictive operational intelligence — surface failure before it happens.">
      {/* 1. Header */}
      <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/40 p-6 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                  orgStatus === "Stable" ? "bg-emerald-400" : orgStatus === "Monitor" ? "bg-amber-400" : orgStatus === "At Risk" ? "bg-orange-400" : "bg-rose-400")} />
                <span className={cn("relative inline-flex h-2 w-2 rounded-full",
                  orgStatus === "Stable" ? "bg-emerald-500" : orgStatus === "Monitor" ? "bg-amber-500" : orgStatus === "At Risk" ? "bg-orange-500" : "bg-rose-500")} />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workflow posture · {orgStatus}</span>
            </div>
            <p className="max-w-2xl text-[15px] leading-relaxed text-foreground">{aiLines[0]}</p>
            <div className="flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {counts.Stable} stable</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {counts.Monitor} monitor</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> {counts["At Risk"]} at risk</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> {counts.Critical} critical</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-card border border-border/70 px-4 py-3 text-right">
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Readiness</div>
              <div className="text-2xl font-semibold tabular-nums text-foreground">{orgRiskScore}</div>
            </div>
            <HealthPill tone={statusTone[orgStatus]}>{orgStatus}</HealthPill>
          </div>
        </div>
      </section>

      {/* 2. Risk summary tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Stable workflows", value: counts.Stable, tone: "healthy" as HealthTone, hint: `${workflows.length} total` },
          { label: "Active bottlenecks", value: bottlenecks.length, tone: bottlenecks.length > 2 ? ("risk" as HealthTone) : ("attention" as HealthTone), hint: "Cross-department friction" },
          { label: "Escalation forecasts", value: escalations.length, tone: escalations.some((e) => e.tone === "blocked") ? ("blocked" as HealthTone) : ("risk" as HealthTone), hint: "Predicted next 14d" },
          { label: "Blocked dependencies", value: dependencies.filter((d) => d.severity === "blocked" || d.severity === "risk").length, tone: "risk" as HealthTone, hint: "Cascade risk" },
        ].map((t) => (
          <div key={t.label} className="rounded-2xl bg-card border border-border/70 p-4 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t.label}</span>
              <HealthPill tone={t.tone}>{t.tone}</HealthPill>
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{t.value}</div>
            <div className="mt-1 text-[12px] text-muted-foreground">{t.hint}</div>
          </div>
        ))}
      </div>

      {/* 3. Active workflow risk grid */}
      <OpsCard title="Active workflow risks" hint={`${workflows.length} workflows`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((w) => {
            const tone = statusTone[w.status];
            const Trend = w.trend === "up" ? TrendingUp : w.trend === "down" ? TrendingDown : Activity;
            const trendCls = w.trend === "up" ? "text-emerald-600" : w.trend === "down" ? "text-rose-600" : "text-muted-foreground";
            const barCls = tone === "healthy" ? "bg-emerald-500" : tone === "attention" ? "bg-amber-500" : tone === "risk" ? "bg-orange-500" : "bg-rose-500";
            return (
              <div key={w.id} className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold tracking-tight text-foreground">{w.name}</div>
                    <div className="mt-0.5 text-[11.5px] text-muted-foreground">{w.owner}</div>
                  </div>
                  <Trend className={cn("size-4", trendCls)} />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div className="text-[20px] font-semibold tabular-nums text-foreground">{Math.round(w.score)}</div>
                  <HealthPill tone={tone}>{w.status}</HealthPill>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", barCls)} style={{ width: `${Math.min(100, Math.max(8, w.score))}%` }} />
                </div>
                <div className="mt-2 text-[11.5px] text-muted-foreground line-clamp-2">{w.signal}</div>
                <div className="mt-1.5 text-[11px] text-muted-foreground/80">Bottleneck: <span className="text-foreground/80">{w.bottleneck}</span></div>
              </div>
            );
          })}
        </div>
      </OpsCard>

      {/* 4. Bottleneck detection */}
      <OpsCard title="Bottleneck detection" hint="Where workflows are beginning to fail">
        {bottlenecks.length === 0 ? (
          <EmptyRow>No active bottlenecks detected. Workflows are moving cleanly.</EmptyRow>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {bottlenecks.map((b, i) => (
              <li key={i} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Flame className={cn("size-3.5", b.severity === "blocked" ? "text-rose-500" : b.severity === "risk" ? "text-orange-500" : "text-amber-500")} />
                      <div className="text-[13.5px] font-medium text-foreground">{b.title}</div>
                    </div>
                    <div className="mt-1 text-[12.5px] text-muted-foreground">{b.impact}</div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
                      <span>{b.aging}</span>
                      <span>·</span>
                      <span>{b.depts}</span>
                    </div>
                    <div className="mt-2 text-[12px] text-foreground/90"><span className="text-muted-foreground">Action: </span>{b.action}</div>
                  </div>
                  <HealthPill tone={b.severity}>{b.severity}</HealthPill>
                </div>
              </li>
            ))}
          </ul>
        )}
      </OpsCard>

      {/* 5. Dependency mapping */}
      <OpsCard title="Workflow dependency mapping" hint="One delay cascades through the chain">
        {dependencies.length === 0 ? (
          <EmptyRow>No active dependency cascades.</EmptyRow>
        ) : (
          <ul className="space-y-3">
            {dependencies.map((d, i) => (
              <li key={i} className="rounded-xl border border-border/60 bg-gradient-to-br from-card to-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <GitBranch className="size-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cascade</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {d.chain.map((step, idx) => (
                        <div key={step} className="flex items-center gap-1.5">
                          <span className={cn(
                            "rounded-full border px-2.5 py-1 text-[11.5px] font-medium",
                            idx === 0
                              ? d.severity === "blocked" ? "bg-rose-50 text-rose-700 border-rose-200/70"
                                : d.severity === "risk" ? "bg-orange-50 text-orange-700 border-orange-200/70"
                                : "bg-amber-50 text-amber-700 border-amber-200/70"
                              : "bg-card text-foreground/80 border-border/60",
                          )}>
                            {step}
                          </span>
                          {idx < d.chain.length - 1 && <ArrowRight className="size-3 text-muted-foreground" />}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-[12.5px] text-muted-foreground">{d.signal}</div>
                  </div>
                  <HealthPill tone={d.severity}>{d.severity}</HealthPill>
                </div>
              </li>
            ))}
          </ul>
        )}
      </OpsCard>

      {/* 6. Readiness monitor */}
      <OpsCard title="Readiness risk monitor">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {readiness.map((r) => {
            const tone = statusTone[r.status];
            const barCls = tone === "healthy" ? "bg-emerald-500" : tone === "attention" ? "bg-amber-500" : tone === "risk" ? "bg-orange-500" : "bg-rose-500";
            return (
              <div key={r.area} className="rounded-xl border border-border/60 bg-card p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] text-foreground/90">{r.area}</span>
                  <HealthPill tone={tone}>{r.status}</HealthPill>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", barCls)} style={{ width: `${Math.min(100, Math.max(4, r.score))}%` }} />
                  </div>
                  <span className="text-[11.5px] font-semibold tabular-nums text-foreground">{Math.round(r.score)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </OpsCard>

      {/* 7. Staffing pressure */}
      <OpsCard title="Staffing pressure risk layer" hint="By state">
        <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
          {statePressure.map((p) => (
            <li key={p.state} className="rounded-xl border border-border/60 bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-foreground">{p.state}</span>
                <HealthPill tone={p.tone}>{p.tone}</HealthPill>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1 text-[11px]">
                <div className="text-center"><div className="font-semibold tabular-nums text-foreground">{p.overload}</div><div className="text-muted-foreground">BCBA</div></div>
                <div className="text-center"><div className="font-semibold tabular-nums text-foreground">{p.needs}</div><div className="text-muted-foreground">Needs</div></div>
                <div className="text-center"><div className="font-semibold tabular-nums text-foreground">{p.atRisk}</div><div className="text-muted-foreground">RBT</div></div>
              </div>
            </li>
          ))}
        </ul>
      </OpsCard>

      {/* 8. Escalation forecasting */}
      <OpsCard title="Escalation risk forecasting" hint="Predicted, ranked by likelihood">
        {escalations.length === 0 ? (
          <EmptyRow>No escalations forecasted in the current window.</EmptyRow>
        ) : (
          <ul className="space-y-2">
            {escalations.map((e, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-border/60 p-3">
                <AlertTriangle className={cn("mt-0.5 size-4 shrink-0", e.tone === "blocked" ? "text-rose-500" : e.tone === "risk" ? "text-orange-500" : "text-amber-500")} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium text-foreground">{e.title}</div>
                  <div className="text-[12px] text-muted-foreground">Impact: {e.impact} · Window: {e.window}</div>
                </div>
                <div className="text-right shrink-0">
                  <HealthPill tone={e.tone}>{e.tone}</HealthPill>
                  <div className="mt-1 text-[10.5px] text-muted-foreground">{e.likelihood}% likely</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </OpsCard>

      {/* 9. Recommendations */}
      <OpsCard title="Leadership intervention recommendations">
        <ul className="grid gap-2 md:grid-cols-2">
          {recommendations.map((r, i) => (
            <li key={i} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-foreground">{r.title}</div>
                  <div className="mt-1 text-[12.5px] text-muted-foreground">{r.impact}</div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 text-[11.5px] text-muted-foreground">
                    <span>{r.depts}</span>
                    {r.reduction !== "—" && (<><span>·</span><span className="text-emerald-700">{r.reduction}</span></>)}
                  </div>
                </div>
                <HealthPill tone={r.urgency}>{r.urgency}</HealthPill>
              </div>
            </li>
          ))}
        </ul>
      </OpsCard>

      {/* 10. AI predictive engine */}
      <OpsCard title="AI predictive operations engine" hint="Composed from cross-workflow signals">
        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card to-muted/30 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Blossom AI · predictive summary</span>
          </div>
          <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
            {aiLines.map((l, i) => (
              <li key={i} className="flex gap-2"><span className="text-muted-foreground">·</span>{l}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Explain workflow risk", "Predict operational failure", "Generate risk summary", "Identify root cause", "Recommend leadership actions"].map((a) => (
              <AIPrompt key={a} label={a} variant="card" />
            ))}
          </div>
        </div>
      </OpsCard>
    </OpsPage>
  );
}