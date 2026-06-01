import { useMemo } from "react";
import { OpsPage, OpsCard, HealthPill, EmptyRow, AIPrompt, ActionPill, type HealthTone } from "./_shared";
import { useOpsIntelligence, type OpsTone } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { TrendingUp, TrendingDown, Minus, Sparkles, ArrowRight, ShieldAlert, Workflow, Users2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const DEPT_LINKS: Record<string, string> = {
  staffing: "/operations/staffing-capacity",
  clinics: "/operations/command-center",
  "state-leadership": "/operations/department-health",
  systems: "/operations/workflow-risks",
  intake: "/operations/workflow-risks",
  authorizations: "/operations/escalations",
  scheduling: "/operations/staffing-capacity",
  qa: "/operations/workflow-risks",
  recruiting: "/operations/staffing-capacity",
  hr: "/operations/accountability",
  payroll: "/operations/escalations",
  training: "/operations/training-adoption",
};

const STATES = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;
const toneToHealth = (t: OpsTone): HealthTone => t;

function postureLabel(score: number) {
  if (score >= 88) return { label: "Stable", tone: "healthy" as HealthTone };
  if (score >= 75) return { label: "Watching", tone: "attention" as HealthTone };
  if (score >= 60) return { label: "Pressured", tone: "risk" as HealthTone };
  return { label: "Critical", tone: "blocked" as HealthTone };
}

const STATUS_LABEL: Record<OpsTone, string> = {
  healthy: "Healthy",
  attention: "Attention Needed",
  risk: "At Risk",
  blocked: "Blocked",
};

export default function OpsDepartmentHealth() {
  const ops = useOpsIntelligence();
  const cr = useCentralReachOps();
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const nj = useStateWorkforce("NJ");
  const wf = { GA: ga, NC: nc, VA: va, TN: tn, MD: md, NJ: nj };

  const orgScore = Math.round(ops.depts.reduce((a, d) => a + d.score, 0) / Math.max(1, ops.depts.length));
  const posture = postureLabel(orgScore);

  const counts = ops.depts.reduce(
    (a, d) => {
      a[d.tone]++;
      return a;
    },
    { healthy: 0, attention: 0, risk: 0, blocked: 0 } as Record<OpsTone, number>,
  );

  // Staffing pressure per state
  const statePressure = STATES.map((s) => {
    const w = wf[s];
    const overload = w.bcbas.filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length;
    const atRisk = w.rbts.filter((r) => r.status === "At Risk").length;
    const underutil = w.rbts.filter((r) => r.status === "Underutilized").length;
    const needs = w.staffingNeeds.length;
    const score = overload * 3 + needs * 2 + atRisk;
    const tone: HealthTone = score >= 12 ? "blocked" : score >= 7 ? "risk" : score >= 3 ? "attention" : "healthy";
    return { state: s, overload, atRisk, underutil, needs, score, tone };
  });

  // Add Clinics, Staffing, State Leadership, Systems
  const totalNeeds = statePressure.reduce((a, p) => a + p.needs, 0);
  const totalOverload = statePressure.reduce((a, p) => a + p.overload, 0);
  const extraDepts = [
    {
      id: "staffing",
      name: "Staffing",
      tone: (totalNeeds > 12 ? "risk" : totalNeeds > 5 ? "attention" : "healthy") as OpsTone,
      score: Math.max(55, 100 - totalNeeds * 2 - totalOverload),
      signal: `${totalNeeds} open need${totalNeeds === 1 ? "" : "s"} across states · ${totalOverload} BCBA capacity strain`,
    },
    {
      id: "clinics",
      name: "Clinics",
      tone: "healthy" as OpsTone,
      score: 86,
      signal: `${cr.counts.activeClients} active clients · ${cr.counts.coveredClients} covered`,
    },
    {
      id: "state-leadership",
      name: "State Leadership",
      tone: (statePressure.some((p) => p.tone === "blocked") ? "risk" : statePressure.some((p) => p.tone === "risk") ? "attention" : "healthy") as OpsTone,
      score: 84,
      signal: `${STATES.length} state directors active`,
    },
    {
      id: "systems",
      name: "Systems & Operations",
      tone: "healthy" as OpsTone,
      score: 94,
      signal: "Blossom OS uptime and integrations nominal",
    },
  ];

  const allDepts = [...ops.depts, ...extraDepts];

  // Stability indicators (organization-wide, lightweight)
  const stability = [
    {
      label: "Workflow stability",
      value: Math.round(((ops.auths.total || 1) - ops.auths.qaStalled.length - ops.auths.missingDocs.length) / Math.max(1, ops.auths.total) * 100),
    },
    {
      label: "Handoff consistency",
      value: Math.max(60, 95 - ops.auths.missingDocs.length * 2),
    },
    {
      label: "Operational responsiveness",
      value: ops.auths.qaStalled.length === 0 ? 94 : Math.max(55, 95 - ops.auths.qaStalled.length * 3),
    },
    {
      label: "Escalation pressure",
      value: Math.max(40, 100 - ops.risks.filter((r) => r.tone === "blocked" || r.tone === "risk").length * 8),
    },
    {
      label: "Staffing volatility",
      value: Math.max(50, 100 - totalNeeds * 2 - totalOverload * 3),
    },
    {
      label: "Execution consistency",
      value: orgScore,
    },
  ];

  // Workflow performance
  const totalAuths = ops.auths.total || 1;
  const workflows = [
    { label: "Authorization turnaround", value: Math.round(((totalAuths - ops.auths.expiring7.length - ops.auths.qaStalled.length) / totalAuths) * 100) },
    { label: "QA review velocity", value: Math.round(((totalAuths - ops.auths.qaStalled.length) / totalAuths) * 100) },
    { label: "Intake responsiveness", value: 86 },
    { label: "Recruiting conversion", value: ops.recruiting.candidates.length === 0 ? 80 : Math.max(55, 100 - ops.recruiting.stalledCandidates.length * 3) },
    { label: "Onboarding completion", value: 84 },
    cr.counts.activeClients > 0
      ? { label: "Scheduling coverage", value: Math.round((cr.counts.coveredClients / cr.counts.activeClients) * 100) }
      : null,
  ].filter(Boolean) as { label: string; value: number }[];

  // Cross-department coordination
  const coordination = [
    {
      from: "Intake",
      to: "Authorizations",
      tone: (ops.auths.missingDocs.length > 5 ? "risk" : ops.auths.missingDocs.length > 0 ? "attention" : "healthy") as HealthTone,
      signal: `${ops.auths.missingDocs.length} auth${ops.auths.missingDocs.length === 1 ? "" : "s"} blocked on intake documentation`,
    },
    {
      from: "Authorizations",
      to: "QA",
      tone: (ops.auths.qaStalled.length > 5 ? "risk" : ops.auths.qaStalled.length > 0 ? "attention" : "healthy") as HealthTone,
      signal: `${ops.auths.qaStalled.length} plan${ops.auths.qaStalled.length === 1 ? "" : "s"} pending QA review ≥3d`,
    },
    {
      from: "QA",
      to: "Scheduling",
      tone: (ops.auths.qaStalled.length > 8 ? "risk" : "healthy") as HealthTone,
      signal: "Approved plans flowing into scheduling on cadence",
    },
    {
      from: "Recruiting",
      to: "Staffing",
      tone: (ops.recruiting.stalledCandidates.length > 8 ? "risk" : ops.recruiting.stalledCandidates.length > 3 ? "attention" : "healthy") as HealthTone,
      signal: `${ops.recruiting.candidates.length - ops.recruiting.stalledCandidates.length} active candidate${ops.recruiting.candidates.length - ops.recruiting.stalledCandidates.length === 1 ? "" : "s"} progressing`,
    },
    { from: "HR", to: "Payroll", tone: "healthy" as HealthTone, signal: "Onboarding-to-payroll handoff steady" },
    { from: "Training", to: "Operations", tone: "attention" as HealthTone, signal: "Adoption tracked in Training & Adoption" },
  ];

  // Department risks (predictive)
  const departmentRisks = useMemo(() => {
    const out: { dept: string; severity: HealthTone; title: string; impact: string; confidence: number; action: string }[] = [];
    if (ops.auths.qaStalled.length > 3) {
      out.push({
        dept: "QA",
        severity: ops.auths.qaStalled.length > 8 ? "risk" : "attention",
        title: "QA backlog compounding",
        impact: "Treatment plan delays will cascade into scheduling and reauth windows.",
        confidence: 85,
        action: "Sequence QA queue by reauth expiration this week.",
      });
    }
    if (ops.auths.expiring7.length > 0) {
      out.push({
        dept: "Authorizations",
        severity: "blocked",
        title: `${ops.auths.expiring7.length} reauths inside 7-day window`,
        impact: "Service interruption risk for affected clients.",
        confidence: 95,
        action: "Confirm reauth owner for each auth today.",
      });
    }
    const worstState = [...statePressure].sort((a, b) => b.score - a.score)[0];
    if (worstState && worstState.tone !== "healthy") {
      out.push({
        dept: `${worstState.state} Staffing`,
        severity: worstState.tone,
        title: `${worstState.state} carrying highest staffing load`,
        impact: `${worstState.overload} BCBA capacity strains, ${worstState.needs} open needs.`,
        confidence: 80,
        action: `Align recruiting forecast with ${worstState.state} demand.`,
      });
    }
    if (ops.recruiting.stalledCandidates.length > 5) {
      out.push({
        dept: "Recruiting",
        severity: "attention",
        title: "Pipeline movement slowing",
        impact: "Onboarding throughput will lag staffing demand within 2–3 weeks.",
        confidence: 72,
        action: "Run a candidate triage standup this cycle.",
      });
    }
    return out;
  }, [ops, statePressure]);

  // Intervention watchlist
  const watchlist = allDepts
    .filter((d) => d.tone !== "healthy")
    .sort((a, b) => (a.tone === "blocked" ? -1 : b.tone === "blocked" ? 1 : a.score - b.score))
    .slice(0, 5);

  // AI summary
  const aiSummary = useMemo(() => {
    const stressed = allDepts.filter((d) => d.tone !== "healthy").map((d) => d.name);
    const healthy = allDepts.filter((d) => d.tone === "healthy").map((d) => d.name);
    const lines: string[] = [];
    if (stressed.length === 0) {
      lines.push("Every department is operating in a healthy posture. No active intervention is required.");
    } else {
      lines.push(`${healthy.length} of ${allDepts.length} departments are healthy. ${stressed.slice(0, 3).join(", ")}${stressed.length > 3 ? ` and ${stressed.length - 3} more` : ""} need attention.`);
    }
    if (ops.auths.qaStalled.length > 3) lines.push(`QA throughput is the dominant friction signal — ${ops.auths.qaStalled.length} plans stalled.`);
    if (totalNeeds > 5) lines.push(`Staffing demand is concentrated in ${statePressure.filter((p) => p.tone !== "healthy").map((p) => p.state).join(", ") || "active states"}.`);
    if (ops.recruiting.stalledCandidates.length > 5) lines.push("Recruiting pipeline movement needs a nudge to keep onboarding ahead of demand.");
    return lines;
  }, [allDepts, ops, statePressure, totalNeeds]);

  return (
    <OpsPage title="Department Health" subtitle="A calm operational health map of every department in Blossom ABA.">
      {/* 1. Header */}
      <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/40 p-6 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                  posture.tone === "healthy" ? "bg-emerald-400" : posture.tone === "attention" ? "bg-amber-400" : posture.tone === "risk" ? "bg-rose-400" : "bg-rose-400")} />
                <span className={cn("relative inline-flex h-2 w-2 rounded-full",
                  posture.tone === "healthy" ? "bg-emerald-500" : posture.tone === "attention" ? "bg-amber-500" : posture.tone === "risk" ? "bg-rose-500" : "bg-rose-500")} />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Organizational posture · {posture.label}</span>
            </div>
            <p className="max-w-2xl text-[15px] leading-relaxed text-foreground">{aiSummary[0]}</p>
            <div className="flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {counts.healthy} healthy</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {counts.attention} attention</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> {counts.risk} at risk</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> {counts.blocked} blocked</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-card border border-border/70 px-4 py-3 text-right">
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Org health</div>
              <div className="text-2xl font-semibold tabular-nums text-foreground">{orgScore}</div>
            </div>
            <HealthPill tone={posture.tone}>{posture.label}</HealthPill>
          </div>
        </div>
      </section>

      {/* 2. Org summary tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Healthy departments", value: counts.healthy, tone: "healthy" as HealthTone, hint: `${allDepts.length} total` },
          { label: "Under pressure", value: counts.attention + counts.risk, tone: "attention" as HealthTone, hint: "Attention or at risk" },
          { label: "Active risks", value: ops.risks.length, tone: ops.risks.length > 3 ? ("risk" as HealthTone) : ("attention" as HealthTone), hint: "Cross-department signals" },
          { label: "Open staffing needs", value: totalNeeds, tone: totalNeeds > 5 ? ("risk" as HealthTone) : ("healthy" as HealthTone), hint: "Across all states" },
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

      {/* 3. Department health grid */}
      <OpsCard title="Department health" hint={`${allDepts.length} departments`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allDepts.map((d) => {
            const trend = d.score >= 85 ? "up" : d.score >= 72 ? "flat" : "down";
            const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
            const iconCls = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-muted-foreground";
            const tone = toneToHealth(d.tone);
            const barCls = tone === "healthy" ? "bg-emerald-500" : tone === "attention" ? "bg-amber-500" : tone === "risk" ? "bg-rose-500" : "bg-rose-500";
            return (
              <Link
                key={d.id}
                to={DEPT_LINKS[d.id] ?? "/operations/command-center"}
                className="group rounded-2xl border border-border/70 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_hsl(220_15%_20%/0.12)] hover:border-border block"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold tracking-tight text-foreground">{d.name}</div>
                    <div className="mt-0.5 text-[11.5px] text-muted-foreground">{STATUS_LABEL[d.tone]}</div>
                  </div>
                  <Icon className={cn("size-4", iconCls)} />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div className="text-[22px] font-semibold tabular-nums text-foreground">{Math.round(d.score)}</div>
                  <HealthPill tone={tone}>{d.tone}</HealthPill>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", barCls)} style={{ width: `${Math.min(100, Math.max(8, d.score))}%` }} />
                </div>
                <div className="mt-2 text-[11.5px] text-muted-foreground line-clamp-2">{d.signal}</div>
              </Link>
            );
          })}
        </div>
      </OpsCard>

      {/* 4. Stability indicators */}
      <OpsCard title="Operational stability indicators">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stability.map((s) => {
            const tone: HealthTone = s.value >= 88 ? "healthy" : s.value >= 75 ? "attention" : s.value >= 60 ? "risk" : "blocked";
            const barCls = tone === "healthy" ? "bg-emerald-500" : tone === "attention" ? "bg-amber-500" : tone === "risk" ? "bg-rose-500" : "bg-rose-500";
            return (
              <div key={s.label} className="rounded-xl border border-border/60 bg-card p-3">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-semibold tabular-nums text-foreground">{s.value}</span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", barCls)} style={{ width: `${Math.min(100, Math.max(4, s.value))}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </OpsCard>

      {/* 5 + 6 Workflow performance & Staffing */}
      <div className="grid gap-4 lg:grid-cols-2">
        <OpsCard title="Workflow performance" hint="Higher is better">
          <div className="space-y-2.5">
            {workflows.map((w) => {
              const tone: HealthTone = w.value >= 88 ? "healthy" : w.value >= 75 ? "attention" : w.value >= 60 ? "risk" : "blocked";
              const barCls = tone === "healthy" ? "bg-emerald-500" : tone === "attention" ? "bg-amber-500" : tone === "risk" ? "bg-rose-500" : "bg-rose-500";
              return (
                <div key={w.label}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="inline-flex items-center gap-1.5 text-foreground/90"><Workflow className="size-3 text-muted-foreground" />{w.label}</span>
                    <span className="font-semibold tabular-nums text-foreground">{w.value}%</span>
                  </div>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", barCls)} style={{ width: `${Math.min(100, Math.max(4, w.value))}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </OpsCard>

        <OpsCard title="Staffing & capacity health" hint="By state">
          <ul className="space-y-2">
            {statePressure.sort((a, b) => b.score - a.score).map((p) => (
              <li key={p.state} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Users2 className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-foreground">{p.state}</div>
                    <div className="text-[11.5px] text-muted-foreground">{p.overload} BCBA strain · {p.needs} open need{p.needs === 1 ? "" : "s"} · {p.atRisk} RBT at risk</div>
                  </div>
                </div>
                <HealthPill tone={p.tone}>{p.tone}</HealthPill>
              </li>
            ))}
          </ul>
        </OpsCard>
      </div>

      {/* 7. Cross-department coordination */}
      <OpsCard title="Cross-department coordination">
        <ul className="grid gap-2 md:grid-cols-2">
          {coordination.map((c) => (
            <li key={`${c.from}-${c.to}`} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
              <div className="flex items-center gap-2 min-w-0">
                <Link2 className="size-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                    <span>{c.from}</span>
                    <ArrowRight className="size-3 text-muted-foreground" />
                    <span>{c.to}</span>
                  </div>
                  <div className="text-[11.5px] text-muted-foreground line-clamp-1">{c.signal}</div>
                </div>
              </div>
              <HealthPill tone={c.tone}>{c.tone}</HealthPill>
            </li>
          ))}
        </ul>
      </OpsCard>

      {/* 8. Risk detection */}
      <OpsCard title="Department risk detection" hint="Predictive signals">
        {departmentRisks.length === 0 ? (
          <EmptyRow>No early-warning patterns detected across departments.</EmptyRow>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {departmentRisks.map((r, i) => (
              <li key={i} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className={cn("size-3.5", r.severity === "blocked" ? "text-rose-500" : r.severity === "risk" ? "text-rose-500" : "text-amber-500")} />
                      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">{r.dept}</div>
                    </div>
                    <div className="mt-1 text-[13.5px] font-medium text-foreground">{r.title}</div>
                    <div className="mt-1 text-[12.5px] text-muted-foreground">{r.impact}</div>
                    <div className="mt-2 text-[12px] text-foreground/90"><span className="text-muted-foreground">Action: </span>{r.action}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <HealthPill tone={r.severity}>{r.severity}</HealthPill>
                    <div className="mt-1 text-[10.5px] text-muted-foreground">{r.confidence}% confidence</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </OpsCard>

      {/* 9. Intervention watchlist */}
      <OpsCard title="Leadership intervention watchlist">
        {watchlist.length === 0 ? (
          <EmptyRow>No departments require leadership intervention right now.</EmptyRow>
        ) : (
          <ul className="space-y-2">
            {watchlist.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-foreground">{d.name}</div>
                  <div className="text-[12px] text-muted-foreground">{d.signal}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <HealthPill tone={toneToHealth(d.tone)}>{STATUS_LABEL[d.tone]}</HealthPill>
                  <ActionPill
                    label="Coordinate"
                    toastMessage={`Coordination ping sent for ${d.name}`}
                    icon={<ArrowRight className="size-3" />}
                    className="bg-card text-foreground/90 border-border/70"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </OpsCard>

      {/* 10. AI department intelligence */}
      <OpsCard title="AI department intelligence" hint="Cross-signal summary">
        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card to-muted/30 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Blossom AI summary</span>
          </div>
          <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
            {aiSummary.map((l, i) => (
              <li key={i} className="flex gap-2"><span className="text-muted-foreground">·</span>{l}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Generate department summary", "Explain department risk", "Predict operational strain", "Recommend leadership support"].map((a) => (
              <AIPrompt key={a} label={a} variant="card" />
            ))}
          </div>
        </div>
      </OpsCard>
    </OpsPage>
  );
}