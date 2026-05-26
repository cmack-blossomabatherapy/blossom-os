import { useMemo, useState, useEffect } from "react";
import { OpsPage, OpsCard, HealthPill, EmptyRow, type HealthTone } from "./_shared";
import { useOpsIntelligence, type OpsTone } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { Sparkles, TrendingUp, TrendingDown, Minus, ArrowUpRight, CheckCircle2, Clock, AlertTriangle, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STATES = ["GA", "NC", "VA", "TN", "MD"] as const;

const toneToHealth = (t: OpsTone): HealthTone => t;

function postureLabel(score: number) {
  if (score >= 88) return { label: "Stable", tone: "healthy" as HealthTone };
  if (score >= 75) return { label: "Watching", tone: "attention" as HealthTone };
  if (score >= 60) return { label: "Pressured", tone: "risk" as HealthTone };
  return { label: "Critical", tone: "blocked" as HealthTone };
}

export default function OpsLeadershipBriefing() {
  const ops = useOpsIntelligence();
  const cr = useCentralReachOps();
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const wf = { GA: ga, NC: nc, VA: va, TN: tn, MD: md };

  const now = new Date();
  const today = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const stamp = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const orgScore = Math.round(ops.depts.reduce((a, d) => a + d.score, 0) / Math.max(1, ops.depts.length));
  const posture = postureLabel(orgScore);
  const confidence = Math.min(98, 70 + Math.round((cr.totalSessions > 0 ? 15 : 0) + (ops.auths.total > 0 ? 13 : 0)));

  // Staffing pressure (state)
  const statePressure = STATES.map((s) => {
    const w = wf[s];
    const overload = w.bcbas.filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length;
    const atRisk = w.rbts.filter((r) => r.status === "At Risk" || r.status === "Underutilized").length;
    const needs = w.staffingNeeds.length;
    const score = overload * 3 + needs * 2 + atRisk;
    const tone: HealthTone = score >= 12 ? "blocked" : score >= 7 ? "risk" : score >= 3 ? "attention" : "healthy";
    return { state: s, overload, atRisk, needs, score, tone };
  });
  const sortedPressure = [...statePressure].sort((a, b) => b.score - a.score);
  const topPressure = sortedPressure[0];

  // AI Summary
  const summary = useMemo(() => {
    const parts: string[] = [];
    parts.push(
      orgScore >= 85
        ? "Operations remain stable across the organization."
        : orgScore >= 72
          ? "Operations are holding, with isolated pressure points worth monitoring."
          : "Operations are under pressure today and warrant active leadership coordination.",
    );
    if (ops.auths.expiring7.length) {
      parts.push(`${ops.auths.expiring7.length} authorization${ops.auths.expiring7.length === 1 ? "" : "s"} expire within 7 days — reauth coordination is the most time-sensitive item on the desk.`);
    } else if (ops.auths.expiring30.length) {
      parts.push(`${ops.auths.expiring30.length} authorizations sit inside the 30-day reauth window; nothing urgent today.`);
    }
    if (ops.auths.qaStalled.length > 3) {
      parts.push(`QA throughput is the dominant friction point — ${ops.auths.qaStalled.length} treatment plans have been stalled three days or longer.`);
    } else if (ops.auths.qaStalled.length === 0) {
      parts.push("QA review is clear and responsive.");
    }
    if (topPressure && topPressure.score >= 7) {
      parts.push(`${topPressure.state} is carrying the heaviest staffing load (${topPressure.overload} BCBA capacity strains, ${topPressure.needs} open staffing needs).`);
    }
    if (ops.recruiting.stalledCandidates.length > 5) {
      parts.push(`Recruiting pipeline shows ${ops.recruiting.stalledCandidates.length} candidates idle 14+ days; movement needs a nudge.`);
    } else if (ops.recruiting.candidates.length > 0) {
      parts.push("Recruiting pipeline is moving steadily.");
    }
    if (cr.cancellationsLast7d > 0) {
      parts.push(`Scheduling absorbed ${cr.cancellationsLast7d} cancellation${cr.cancellationsLast7d === 1 ? "" : "s"} in the last 7 days.`);
    }
    return parts;
  }, [orgScore, ops, topPressure, cr]);

  const focusBullets = useMemo(() => {
    const out: string[] = [];
    if (ops.auths.expiring7.length) out.push("Confirm reauth ownership for every auth in the ≤7-day window.");
    if (ops.auths.qaStalled.length > 3) out.push("Unblock the QA queue — pull the three oldest stalled plans into review today.");
    if (topPressure && topPressure.tone !== "healthy") out.push(`Check in with ${topPressure.state} state director on staffing pressure.`);
    if (ops.recruiting.stalledCandidates.length > 5) out.push("Recruiting standup: move stalled candidates or close them out.");
    if (out.length === 0) out.push("No active leadership intervention required — protect deep work today.");
    return out;
  }, [ops, topPressure]);

  // Department movement (lightweight, derived)
  const movement = ops.depts.map((d) => ({
    ...d,
    trend: d.score >= 85 ? "up" : d.score >= 72 ? "flat" : "down",
  }));

  // Workflow readiness
  const totalAuths = ops.auths.total || 1;
  const authReady = Math.round(((totalAuths - ops.auths.expiring7.length - ops.auths.qaStalled.length - ops.auths.missingDocs.length) / totalAuths) * 100);
  const qaReady = Math.round(((totalAuths - ops.auths.qaStalled.length) / totalAuths) * 100);
  const coverageReady = cr.counts.activeClients > 0
    ? Math.round((cr.counts.coveredClients / cr.counts.activeClients) * 100)
    : null;

  const readiness = [
    { label: "Authorization turnaround", value: authReady },
    { label: "QA throughput", value: qaReady },
    coverageReady !== null ? { label: "Client coverage", value: coverageReady } : null,
  ].filter(Boolean) as { label: string; value: number }[];

  // Wins
  const wins = [
    ops.auths.expiring7.length === 0 && "Zero authorizations expire in the next 7 days.",
    ops.auths.qaStalled.length === 0 && "QA review queue is clear.",
    ops.recruiting.stalledCandidates.length === 0 && ops.recruiting.candidates.length > 0 && "All candidates moved within the last 14 days.",
    ops.auths.denied.length === 0 && "No outstanding authorization denials.",
    cr.counts.activeClients > 0 && coverageReady !== null && coverageReady >= 90 && `${coverageReady}% of active clients are fully covered.`,
    statePressure.every((p) => p.tone === "healthy") && "All five states are operating in a healthy staffing posture.",
  ].filter(Boolean) as string[];

  // Follow-up tracker (localStorage)
  const [followUps, setFollowUps] = useState<{ id: string; text: string }[]>([]);
  useEffect(() => {
    try { setFollowUps(JSON.parse(localStorage.getItem("ops:followups") || "[]")); } catch { /* noop */ }
  }, []);
  const saveFollowUps = (next: { id: string; text: string }[]) => {
    setFollowUps(next);
    localStorage.setItem("ops:followups", JSON.stringify(next));
  };
  const [newItem, setNewItem] = useState("");

  // AI strategic recommendations
  const recommendations = useMemo(() => {
    const recs: { title: string; detail: string; tone: HealthTone }[] = [];
    if (ops.auths.qaStalled.length > 3 && ops.auths.expiring14.length > 0) {
      recs.push({
        title: "QA stalls are putting reauth windows at risk",
        detail: `${ops.auths.qaStalled.length} plans stalled in QA while ${ops.auths.expiring14.length} auths sit inside the 14-day reauth window. Sequence QA review by expiration date this week.`,
        tone: "risk",
      });
    }
    if (topPressure && topPressure.needs > 3 && ops.recruiting.candidates.length > 0) {
      recs.push({
        title: `${topPressure.state} staffing demand is outpacing onboarding`,
        detail: `${topPressure.needs} open staffing needs against current pipeline. Pull recruiting forecast for ${topPressure.state} and align on a 14-day plan.`,
        tone: "attention",
      });
    }
    if (ops.auths.missingDocs.length > 3) {
      recs.push({
        title: "Documentation friction is compounding",
        detail: `${ops.auths.missingDocs.length} authorizations are blocked on missing documentation — standardize the intake handoff checklist this cycle.`,
        tone: "attention",
      });
    }
    if (cr.cancellationsLast30d > cr.cancellationsLast7d * 5 && cr.cancellationsLast30d > 20) {
      recs.push({
        title: "Cancellation trend warrants a closer look",
        detail: `${cr.cancellationsLast30d} cancellations in 30 days. Review root-cause categories with scheduling leadership.`,
        tone: "attention",
      });
    }
    if (recs.length === 0) {
      recs.push({
        title: "No strategic interventions needed today",
        detail: "Operational posture is steady. Use the calm to invest in coaching, training, or backlog reduction.",
        tone: "healthy",
      });
    }
    return recs;
  }, [ops, topPressure, cr]);

  return (
    <OpsPage title="Leadership Briefing" subtitle={`${today} · prepared by Blossom AI`}>
      {/* 1. Executive header */}
      <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/40 p-6 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                  posture.tone === "healthy" ? "bg-emerald-400" : posture.tone === "attention" ? "bg-amber-400" : posture.tone === "risk" ? "bg-orange-400" : "bg-rose-400")} />
                <span className={cn("relative inline-flex h-2 w-2 rounded-full",
                  posture.tone === "healthy" ? "bg-emerald-500" : posture.tone === "attention" ? "bg-amber-500" : posture.tone === "risk" ? "bg-orange-500" : "bg-rose-500")} />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Operational readiness · {posture.label}</span>
            </div>
            <p className="max-w-2xl text-[15px] leading-relaxed text-foreground">
              {summary[0]} {summary[1]}
            </p>
            <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Sparkles className="size-3" /> AI briefing · confidence {confidence}%</span>
              <span>·</span>
              <span>Generated {stamp}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-card border border-border/70 px-4 py-3 text-right">
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Org score</div>
              <div className="text-2xl font-semibold tabular-nums text-foreground">{orgScore}</div>
            </div>
            <HealthPill tone={posture.tone}>{posture.label}</HealthPill>
          </div>
        </div>
      </section>

      {/* 2. AI summary */}
      <OpsCard title="Daily operational summary" hint="Composed from live operational signals">
        <div className="space-y-3 text-[14px] leading-relaxed text-foreground/90">
          {summary.map((p, i) => (
            <p key={i} className={cn(i === 0 && "text-foreground font-medium")}>{p}</p>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recommended leadership focus</div>
            <ul className="space-y-1.5 text-[13px] text-foreground/90">
              {focusBullets.map((b, i) => (
                <li key={i} className="flex gap-2"><span className="text-muted-foreground">·</span>{b}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quick actions</div>
            <div className="flex flex-wrap gap-2">
              {["Generate executive summary", "Explain risk trend", "Recommend intervention", "Predict operational impact"].map((a) => (
                <button key={a} className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-[12px] text-foreground/90 hover:bg-muted transition">
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </OpsCard>

      {/* 3. Attention areas */}
      <OpsCard title="Today's leadership attention areas" hint={`${ops.risks.length} item${ops.risks.length === 1 ? "" : "s"}`}>
        {ops.risks.length === 0 ? (
          <EmptyRow>Nothing requires leadership attention today. You're clear to focus on strategic work.</EmptyRow>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {ops.risks.map((r) => (
              <li key={r.id} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">{r.area}</div>
                    <div className="mt-1 text-[13.5px] font-medium text-foreground">{r.title}</div>
                    <div className="mt-1 text-[12.5px] text-muted-foreground">{r.detail}</div>
                  </div>
                  <HealthPill tone={toneToHealth(r.tone)}>{r.tone === "blocked" ? "Immediate" : r.tone === "risk" ? "Attention" : "Monitor"}</HealthPill>
                </div>
              </li>
            ))}
          </ul>
        )}
      </OpsCard>

      {/* 4. Department movement */}
      <OpsCard title="Department movement" hint="Last 7 days">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {movement.map((d) => {
            const Icon = d.trend === "up" ? TrendingUp : d.trend === "down" ? TrendingDown : Minus;
            const iconCls = d.trend === "up" ? "text-emerald-600" : d.trend === "down" ? "text-rose-600" : "text-muted-foreground";
            return (
              <div key={d.id} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-foreground">{d.name}</span>
                  <Icon className={cn("size-4", iconCls)} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg font-semibold tabular-nums text-foreground">{d.score}</span>
                  <HealthPill tone={toneToHealth(d.tone)}>{d.tone}</HealthPill>
                </div>
                <div className="mt-1 text-[11.5px] text-muted-foreground line-clamp-2">{d.signal}</div>
              </div>
            );
          })}
        </div>
      </OpsCard>

      {/* 5+6 Risks/Escalations & Staffing */}
      <div className="grid gap-4 lg:grid-cols-3">
        <OpsCard title="Operational risks & escalations" className="lg:col-span-2">
          {ops.risks.filter((r) => r.tone === "blocked" || r.tone === "risk").length === 0 ? (
            <EmptyRow>No active escalations.</EmptyRow>
          ) : (
            <ul className="space-y-2">
              {ops.risks.filter((r) => r.tone === "blocked" || r.tone === "risk").map((r) => (
                <li key={r.id} className="flex items-start gap-3 rounded-xl border border-border/60 p-3">
                  <AlertTriangle className={cn("mt-0.5 size-4 shrink-0", r.tone === "blocked" ? "text-rose-500" : "text-orange-500")} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium text-foreground">{r.title}</div>
                    <div className="text-[12px] text-muted-foreground">{r.detail} · owner: {r.area} lead</div>
                  </div>
                  <HealthPill tone={toneToHealth(r.tone)}>{r.tone}</HealthPill>
                </li>
              ))}
            </ul>
          )}
        </OpsCard>

        <OpsCard title="Staffing & capacity">
          <ul className="space-y-2">
            {sortedPressure.map((p) => (
              <li key={p.state} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground">{p.state}</div>
                  <div className="text-[11.5px] text-muted-foreground">{p.overload} BCBA strain · {p.needs} open need{p.needs === 1 ? "" : "s"}</div>
                </div>
                <HealthPill tone={p.tone}>{p.tone}</HealthPill>
              </li>
            ))}
          </ul>
        </OpsCard>
      </div>

      {/* 7. Workflow readiness */}
      <OpsCard title="Workflow delays & readiness" hint="Higher is better">
        {readiness.length === 0 ? (
          <EmptyRow>Workflow telemetry warming up.</EmptyRow>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {readiness.map((r) => {
              const tone: HealthTone = r.value >= 90 ? "healthy" : r.value >= 75 ? "attention" : r.value >= 60 ? "risk" : "blocked";
              const barCls = tone === "healthy" ? "bg-emerald-500" : tone === "attention" ? "bg-amber-500" : tone === "risk" ? "bg-orange-500" : "bg-rose-500";
              return (
                <div key={r.label} className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-semibold tabular-nums text-foreground">{r.value}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", barCls)} style={{ width: `${Math.max(4, Math.min(100, r.value))}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </OpsCard>

      {/* 8. Wins */}
      <OpsCard title="Organizational wins & momentum">
        {wins.length === 0 ? (
          <EmptyRow>Wins will appear as the day progresses.</EmptyRow>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {wins.map((w, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50/60 px-3 py-2 text-[13px] text-emerald-900">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        )}
      </OpsCard>

      {/* 9. Follow-up tracker */}
      <OpsCard title="Leadership follow-up tracker" hint="Saved locally to this device">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = newItem.trim();
            if (!t) return;
            saveFollowUps([{ id: crypto.randomUUID(), text: t }, ...followUps]);
            setNewItem("");
          }}
          className="mb-3 flex gap-2"
        >
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add a leadership follow-up…"
            className="h-10 flex-1 rounded-xl border border-border bg-muted/60 px-4 text-[13.5px] placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition"
          />
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 text-[13px] font-medium text-primary-foreground shadow-sm hover:opacity-90 transition">
            <Plus className="size-4" /> Add
          </button>
        </form>
        {followUps.length === 0 ? (
          <EmptyRow>No open leadership follow-ups.</EmptyRow>
        ) : (
          <ul className="space-y-1.5">
            {followUps.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2">
                <div className="flex items-center gap-2 text-[13.5px] text-foreground">
                  <Clock className="size-3.5 text-muted-foreground" />{f.text}
                </div>
                <button onClick={() => saveFollowUps(followUps.filter((x) => x.id !== f.id))} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition">
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </OpsCard>

      {/* 10. AI strategic recommendations */}
      <OpsCard title="AI strategic recommendations" hint="Generated from cross-department signals">
        <ul className="space-y-2">
          {recommendations.map((r, i) => (
            <li key={i} className="rounded-xl border border-border/60 bg-gradient-to-br from-card to-muted/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-primary" />
                    <div className="text-[13.5px] font-medium text-foreground">{r.title}</div>
                  </div>
                  <div className="mt-1.5 text-[12.5px] text-muted-foreground">{r.detail}</div>
                </div>
                <HealthPill tone={r.tone}>{r.tone}</HealthPill>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-3 py-1 text-[11.5px] text-foreground/90 hover:bg-muted transition">
                  Generate leadership note <ArrowUpRight className="size-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </OpsCard>
    </OpsPage>
  );
}