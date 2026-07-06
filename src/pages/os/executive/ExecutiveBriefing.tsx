import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight, Minus, Sparkles, Telescope } from "lucide-react";
import { ExecPage, ExecCard, AIPrompt, HealthPill, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { ActionItemsPanel } from "@/components/executive/ActionItemsPanel";
import { cn } from "@/lib/utils";

type Direction = "improved" | "stable" | "slowing" | "escalating" | "watch";

const STATES = [
  { code: "GA", name: "Georgia" },
  { code: "NC", name: "North Carolina" },
  { code: "TN", name: "Tennessee" },
  { code: "VA", name: "Virginia" },
  { code: "MD", name: "Maryland" },
] as const;

const TONE_DOT: Record<HealthTone, string> = {
  healthy: "bg-emerald-500",
  attention: "bg-amber-500",
  risk: "bg-rose-500",
  blocked: "bg-rose-500",
  neutral: "bg-muted-foreground/50",
};

function worst(tones: HealthTone[]): HealthTone {
  if (tones.includes("blocked")) return "blocked";
  if (tones.includes("risk")) return "risk";
  if (tones.includes("attention")) return "attention";
  return "healthy";
}

const DIR_STYLES: Record<Direction, { label: string; icon: typeof ArrowUpRight; tint: string }> = {
  improved: { label: "Improved", icon: ArrowUpRight, tint: "text-emerald-700 bg-emerald-50 border-emerald-200/70" },
  stable: { label: "Stable", icon: Minus, tint: "text-muted-foreground bg-muted/60 border-border/60" },
  slowing: { label: "Slowing", icon: ArrowDownRight, tint: "text-rose-700 bg-rose-50 border-rose-200/70" },
  escalating: { label: "Escalating", icon: ArrowDownRight, tint: "text-rose-700 bg-rose-50 border-rose-200/70" },
  watch: { label: "Watch", icon: Minus, tint: "text-amber-700 bg-amber-50 border-amber-200/70" },
};

function toneLabel(t: HealthTone) {
  return t === "healthy" ? "Stable" : t === "attention" ? "Watch" : t === "risk" ? "Pressured" : t === "blocked" ? "At Risk" : "—";
}

export default function ExecutiveBriefing() {
  const ops = useOpsIntelligence();
  const cr = useCentralReachOps({});
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const tn = useStateWorkforce("TN");
  const va = useStateWorkforce("VA");
  const md = useStateWorkforce("MD");
  const nj = useStateWorkforce("NJ");
  const wf = useMemo(
    () => [
      { state: STATES[0], data: ga },
      { state: STATES[1], data: nc },
      { state: STATES[2], data: tn },
      { state: STATES[3], data: va },
      { state: STATES[4], data: md },
    ],
    [ga, nc, tn, va, md],
  );

  const loading = ops.loading || cr.loading || wf.some((w) => w.data.loading);

  // ── shared derivations ─────────────────────────────────────────────
  const overloaded = wf.flatMap((w) => w.data.bcbas).filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length;
  const totalNeeds = wf.flatMap((w) => w.data.staffingNeeds).length;
  const criticalNeeds = wf.flatMap((w) => w.data.staffingNeeds).filter((n) => n.urgency === "critical").length;
  const weeklyCx = cr.cancellationsLast7d;
  const avgWeekCx = Math.round(cr.cancellationsLast30d / 4);
  const cxDelta = weeklyCx - avgWeekCx;
  const heaviest = [...wf].sort((a, b) => b.data.staffingNeeds.length - a.data.staffingNeeds.length)[0];

  const overallTone = worst(
    ops.depts.map((d) => d.tone).concat(criticalNeeds > 2 ? ["risk"] : criticalNeeds > 0 ? ["attention"] : []) as HealthTone[],
  );

  // ── Section 2: today's executive summary ───────────────────────────
  const summary = useMemo(() => {
    if (loading) return "Reading live operational signals across staffing, workflows, and authorizations…";
    const parts: string[] = [];
    if (overallTone === "healthy") {
      parts.push("Blossom is operating in a calm, stable rhythm today. No leadership-level intervention is required.");
    } else if (overallTone === "attention") {
      parts.push("Blossom remains operationally stable overall, with a few areas worth leadership visibility this week.");
    } else if (overallTone === "risk") {
      parts.push("Blossom is operating in a stable but pressured state. Specific workflows are absorbing strain that warrants coordinated attention.");
    } else {
      parts.push("Blossom is operating under elevated operational pressure today. Coordinated leadership attention is recommended before adding new operational load.");
    }
    if (heaviest && heaviest.data.staffingNeeds.length > 0) {
      parts.push(`Staffing pressure is concentrated in ${heaviest.state.name} (${heaviest.data.staffingNeeds.length} open need${heaviest.data.staffingNeeds.length === 1 ? "" : "s"}), where recruiting and onboarding velocity remain the highest-leverage moves.`);
    }
    if (ops.auths.expiring14.length > 0 && ops.auths.qaStalled.length > 0) {
      parts.push(`Authorization timing is sensitive — ${ops.auths.expiring14.length} expire within 14 days with ${ops.auths.qaStalled.length} treatment plan${ops.auths.qaStalled.length === 1 ? "" : "s"} sitting in QA review.`);
    } else if (ops.auths.expiring14.length > 0) {
      parts.push(`${ops.auths.expiring14.length} authorization${ops.auths.expiring14.length === 1 ? " enters" : "s enter"} the 14-day reauth window.`);
    }
    if (cxDelta > 5) parts.push(`Cancellations trended above average this week (${weeklyCx} vs ~${avgWeekCx}/wk).`);
    if (cxDelta < -3) parts.push(`Cancellations improved this week (${weeklyCx} vs ~${avgWeekCx}/wk average).`);
    if (ops.recruiting.candidates.length > 0 && ops.recruiting.stalledCandidates.length < 3) {
      parts.push("Recruiting throughput is moving cleanly across the pipeline.");
    }
    return parts.join(" ");
  }, [loading, overallTone, heaviest, ops, cxDelta, weeklyCx, avgWeekCx]);

  // ── Section 3: What Changed ────────────────────────────────────────
  const changes = useMemo(() => {
    const items: { id: string; title: string; detail: string; dir: Direction }[] = [];
    if (cxDelta < -3) items.push({ id: "c-cx-up", title: "Scheduling stabilizing", detail: `Cancellations down ${Math.abs(cxDelta)} vs weekly average.`, dir: "improved" });
    if (cxDelta > 5) items.push({ id: "c-cx-dn", title: "Scheduling under strain", detail: `Cancellations up ${cxDelta} vs weekly average (${weeklyCx} this week).`, dir: "escalating" });
    if (ops.auths.qaStalled.length === 0 && ops.auths.total > 0) items.push({ id: "c-qa-up", title: "QA backlog cleared", detail: "No treatment plans currently stalled ≥3 days in QA.", dir: "improved" });
    if (ops.auths.qaStalled.length > 5) items.push({ id: "c-qa-dn", title: "QA backlog building", detail: `${ops.auths.qaStalled.length} plans sitting in QA review.`, dir: "slowing" });
    if (ops.auths.expiring7.length > 0) items.push({ id: "c-auth-7", title: "Auth approvals tightening", detail: `${ops.auths.expiring7.length} expire within 7 days.`, dir: "escalating" });
    if (overloaded > 3) items.push({ id: "c-cap", title: "BCBA capacity tightening", detail: `${overloaded} BCBAs near or above capacity.`, dir: "slowing" });
    if (overloaded === 0) items.push({ id: "c-cap-clear", title: "BCBA capacity healthy", detail: "Caseloads within healthy bands company-wide.", dir: "improved" });
    if (criticalNeeds > 0) items.push({ id: "c-staff", title: "Staffing shortages worsened", detail: `${criticalNeeds} critical staffing need${criticalNeeds === 1 ? "" : "s"} unresolved.`, dir: "escalating" });
    if (ops.recruiting.candidates.length > 0 && ops.recruiting.stalledCandidates.length < 3) items.push({ id: "c-rec-up", title: "Recruiting pipeline moving", detail: `${ops.recruiting.candidates.length} active candidates · minimal stalls.`, dir: "improved" });
    if (ops.recruiting.stalledCandidates.length > 5) items.push({ id: "c-rec-dn", title: "Recruiting pipeline slowing", detail: `${ops.recruiting.stalledCandidates.length} candidates stalled ≥14 days.`, dir: "slowing" });
    if (ops.risks.length === 0) items.push({ id: "c-esc", title: "Escalations decreased", detail: "No leadership-level escalations open.", dir: "improved" });
    return items.slice(0, 7);
  }, [cxDelta, weeklyCx, ops, overloaded, criticalNeeds]);

  // ── Section 4: Emerging Risks ──────────────────────────────────────
  const emerging = useMemo(() => {
    const items: { id: string; area: string; title: string; label: string; tone: HealthTone }[] = [];
    if (heaviest && heaviest.data.staffingNeeds.length > 3) items.push({ id: "e-staff", area: heaviest.state.name, title: `Staffing concentration building in ${heaviest.state.name}`, label: "Pressure increasing", tone: "risk" });
    if (ops.auths.expiring14.length > 5) items.push({ id: "e-auth14", area: "Authorizations", title: `${ops.auths.expiring14.length} reauths entering the 14-day window`, label: "Monitor closely", tone: "attention" });
    if (ops.auths.qaStalled.length > 2 && ops.auths.expiring14.length > 0) items.push({ id: "e-qa", area: "QA", title: "QA backlog compounding reauth risk", label: "Leadership visibility recommended", tone: "risk" });
    if (overloaded > 2) items.push({ id: "e-cap", area: "Clinical", title: "BCBA capacity tightening — supervision quality at risk", label: "Potential slowdown developing", tone: "attention" });
    if (ops.recruiting.stalledCandidates.length > 5) items.push({ id: "e-rec", area: "Recruiting", title: "Candidate pipeline stalls increasing", label: "Monitor closely", tone: "attention" });
    if (criticalNeeds > 2) items.push({ id: "e-crit", area: "Staffing", title: `${criticalNeeds} critical staffing needs unresolved`, label: "Operational strain detected", tone: "risk" });
    if (ops.auths.denied.length > 0) items.push({ id: "e-deny", area: "Authorizations", title: `${ops.auths.denied.length} authorization${ops.auths.denied.length === 1 ? "" : "s"} denied — appeals required`, label: "Leadership visibility recommended", tone: "blocked" });
    return items.slice(0, 6);
  }, [heaviest, ops, overloaded, criticalNeeds]);

  // ── Section 5: Organizational Momentum ─────────────────────────────
  const momentum = useMemo(() => {
    const items: { id: string; title: string; detail: string; label: string }[] = [];
    if (cxDelta < -3) items.push({ id: "m-cx", title: "Scheduling coordination improving", detail: `Cancellations dropped ${Math.abs(cxDelta)} below weekly average.`, label: "Improving" });
    if (ops.recruiting.candidates.length > 0 && ops.recruiting.stalledCandidates.length < 3) items.push({ id: "m-rec", title: "Recruiting momentum building", detail: "Pipeline moving cleanly with minimal stalls.", label: "Momentum building" });
    if (ops.auths.qaStalled.length === 0) items.push({ id: "m-qa", title: "QA throughput stabilized", detail: "No plans currently stuck in QA review.", label: "Stabilizing" });
    if (totalNeeds === 0) items.push({ id: "m-staff", title: "Staffing readiness strong", detail: "No open staffing needs across active states.", label: "Readiness improving" });
    if (overloaded === 0) items.push({ id: "m-cap", title: "Caseload health stable", detail: "BCBA caseloads within healthy bands company-wide.", label: "Stable" });
    if (ops.auths.expiring7.length === 0 && ops.auths.expiring14.length === 0) items.push({ id: "m-auth", title: "Authorization backlog reducing", detail: "No urgent reauth window pressure detected.", label: "Backlog reducing" });
    return items.slice(0, 5);
  }, [cxDelta, ops, totalNeeds, overloaded]);

  // ── Section 6: Leadership Priorities ───────────────────────────────
  const priorities = useMemo(() => {
    const out: { id: string; title: string; reason: string; to: string }[] = [];
    if (heaviest && heaviest.data.staffingNeeds.length > 2)
      out.push({ id: "p-staff", title: `Review ${heaviest.state.name} staffing capacity`, reason: `${heaviest.data.staffingNeeds.length} open needs concentrating in one state.`, to: "/executive/staffing-expansion" });
    if (ops.auths.expiring14.length > 0 || ops.auths.qaStalled.length > 2)
      out.push({ id: "p-auth", title: "Monitor reassessment turnaround timing", reason: `${ops.auths.expiring14.length} reauths ≤14d · ${ops.auths.qaStalled.length} stalled in QA.`, to: "/operations/escalations" });
    if (ops.recruiting.stalledCandidates.length > 3)
      out.push({ id: "p-rec", title: "Support recruiting → onboarding alignment", reason: `${ops.recruiting.stalledCandidates.length} candidates stalled ≥14 days.`, to: "/executive/staffing-expansion" });
    if (cxDelta > 5)
      out.push({ id: "p-sched", title: "Watch scheduling delays affecting starts", reason: `Cancellations up ${cxDelta} vs weekly average.`, to: "/executive/operational-consistency" });
    if (overloaded > 2)
      out.push({ id: "p-cap", title: "Evaluate onboarding throughput readiness", reason: `${overloaded} BCBAs at or above capacity.`, to: "/executive/growth-readiness" });
    if (criticalNeeds > 0 || totalNeeds > 6)
      out.push({ id: "p-growth", title: "Monitor growth pacing vs staffing", reason: `${totalNeeds} open needs · ${criticalNeeds} critical.`, to: "/executive/growth-readiness" });
    if (!out.length) out.push({ id: "p-rhythm", title: "Maintain operational rhythm", reason: "No leadership-level priorities surfaced today.", to: "/executive/pulse" });
    return out.slice(0, 6);
  }, [heaviest, ops, cxDelta, overloaded, criticalNeeds, totalNeeds]);

  // ── Section 8: Forecast ────────────────────────────────────────────
  const forecast = useMemo(() => {
    const items: { id: string; title: string; tone: HealthTone }[] = [];
    if (heaviest && heaviest.data.staffingNeeds.length > 3 && ops.recruiting.candidates.length === 0)
      items.push({ id: "f-1", title: `${heaviest.state.name} growth may outpace RBT readiness if recruiting velocity does not pick up in the next 2–3 weeks.`, tone: "risk" });
    else if (heaviest && heaviest.data.staffingNeeds.length > 3)
      items.push({ id: "f-1b", title: `${heaviest.state.name} staffing pressure should ease over the next 2–3 weeks if recruiting momentum continues.`, tone: "attention" });
    if (ops.auths.expiring14.length > 5 && ops.auths.qaStalled.length > 2)
      items.push({ id: "f-2", title: "Pending reassessment volume may increase QA strain into next cycle without redistribution.", tone: "risk" });
    if (overloaded > 2)
      items.push({ id: "f-3", title: "Continued intake without caseload redistribution will compress supervision quality within the next billing cycle.", tone: "attention" });
    if (ops.recruiting.candidates.length > 0 && ops.recruiting.stalledCandidates.length < 3)
      items.push({ id: "f-4", title: "If recruiting momentum continues, onboarding stability is likely to improve across active states.", tone: "healthy" });
    if (cxDelta > 5)
      items.push({ id: "f-5", title: "Cancellation trend may continue pressuring weekly utilization if scheduling coordination is not reinforced.", tone: "attention" });
    if (!items.length) items.push({ id: "f-0", title: "Operational patterns are quiet — no significant directional risks forecasted in the next 2 weeks.", tone: "healthy" });
    return items.slice(0, 4);
  }, [heaviest, ops, overloaded, cxDelta]);

  const stamp = new Date().toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <ExecPage
      title="Executive Briefing"
      subtitle="AI-generated operational intelligence across staffing, workflows, growth readiness, and organizational stability."
    >
      {/* ─── Section 1 — Header ──────────────────────────────────────── */}
      <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/30 p-6 md:p-8 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset]">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary/70" />
              Daily Briefing · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <h2 className="mt-2 text-[28px] md:text-[34px] font-semibold tracking-tight">
              {overallTone === "healthy" ? "Operations are calm." : overallTone === "attention" ? "Stable, with a few areas to watch." : overallTone === "risk" ? "Stable but pressured." : "Elevated pressure today."}
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] text-muted-foreground">
              Last updated {stamp} · Generated from live operational systems
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/50 px-2.5 py-1 text-[10.5px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              High confidence
            </span>
            <HealthPill tone={overallTone}>{toneLabel(overallTone)}</HealthPill>
          </div>
        </div>
      </section>

      {/* ─── Section 2 — Today's Executive Summary ───────────────────── */}
      <ExecCard className="bg-gradient-to-br from-card via-card to-primary/[0.04]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-[13.5px] font-semibold tracking-tight">Today's Executive Summary</h2>
              <p className="text-[11px] text-muted-foreground">A COO-level read of the organization</p>
            </div>
          </div>
        </div>
        <p className="text-[16px] leading-[1.65] text-foreground/90 md:text-[17px]">{summary}</p>
        <div className="mt-5 flex flex-wrap gap-1.5">
          <AIPrompt label="Expand the briefing" prompt="Expand today's executive operational briefing into a deeper COO-level read for Blossom ABA." />
          <AIPrompt label="Compare to last week" prompt="How does today's operational posture compare to last week for Blossom?" />
          <AIPrompt label="Draft leadership update" prompt="Draft a short executive update to share with the leadership team based on today's signals." />
        </div>
      </ExecCard>

      {/* ─── Section 3 — What Changed ────────────────────────────────── */}
      <ExecCard title="What Changed" hint="Past 7 days · directional movement">
        {changes.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No notable directional movement this week.</p>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {changes.map((c) => {
              const s = DIR_STYLES[c.dir];
              const Icon = s.icon;
              return (
                <div key={c.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
                  <span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border", s.tint)}>
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13.5px] font-medium tracking-tight">{c.title}</span>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10.5px] font-medium", s.tint)}>{s.label}</span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{c.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ExecCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ─── Section 4 — Emerging Risks ────────────────────────────── */}
        <ExecCard title="Emerging Risks" hint={`${emerging.length} signal${emerging.length === 1 ? "" : "s"}`}>
          {emerging.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-background/40 p-6 text-center">
              <div className="text-[13px] font-medium text-foreground/80">No emerging risks detected.</div>
              <div className="mt-1 text-[12px] text-muted-foreground">Operational patterns are quiet right now.</div>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {emerging.map((e) => (
                <li key={e.id} className="rounded-xl border border-border/60 bg-background/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{e.area}</div>
                      <div className="mt-0.5 text-[13.5px] font-medium leading-snug">{e.title}</div>
                    </div>
                    <HealthPill tone={e.tone}>{e.label}</HealthPill>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ExecCard>

        {/* ─── Section 5 — Organizational Momentum ───────────────────── */}
        <ExecCard title="Organizational Momentum" hint={`${momentum.length} signal${momentum.length === 1 ? "" : "s"}`}>
          {momentum.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-background/40 p-6 text-center">
              <div className="text-[13px] font-medium text-foreground/80">No standout momentum yet.</div>
              <div className="mt-1 text-[12px] text-muted-foreground">As workflows stabilize, improvements will surface here.</div>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {momentum.map((m) => (
                <li key={m.id} className="rounded-xl border border-border/60 bg-background/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium leading-snug">{m.title}</div>
                      <div className="mt-0.5 text-[12.5px] text-muted-foreground">{m.detail}</div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
                      <ArrowUpRight className="h-2.5 w-2.5" />
                      {m.label}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ExecCard>
      </div>

      {/* ─── Section 6 — Leadership Priorities ───────────────────────── */}
      <ExecCard title="Leadership Priorities" hint="Strategic focus this week">
        <div className="grid gap-2 md:grid-cols-2">
          {priorities.map((p) => (
            <Link
              key={p.id}
              to={p.to}
              className="group rounded-xl border border-border/60 bg-background/40 p-4 transition hover:-translate-y-0.5 hover:bg-muted/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-medium tracking-tight">{p.title}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{p.reason}</p>
            </Link>
          ))}
        </div>
      </ExecCard>

      {/* ─── Section 7 — Department Snapshot Stream ──────────────────── */}
      <ExecCard title="Department Snapshot" hint="Live · click for detail">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ops.depts.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-3.5 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", TONE_DOT[d.tone])} />
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium tracking-tight">{d.name}</div>
                  <div className="truncate text-[11.5px] text-muted-foreground">{d.signal}</div>
                </div>
              </div>
              <HealthPill tone={d.tone}>{toneLabel(d.tone)}</HealthPill>
            </div>
          ))}
        </div>
      </ExecCard>

      {/* ─── Section 8 — AI Forecast ─────────────────────────────────── */}
      <ExecCard className="bg-gradient-to-br from-card via-card to-primary/[0.04]">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Telescope className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-[13.5px] font-semibold tracking-tight">AI Forecast</h2>
            <p className="text-[11px] text-muted-foreground">What may happen next, based on current operational patterns</p>
          </div>
        </div>
        <ul className="space-y-3">
          {forecast.map((f) => (
            <li key={f.id} className="flex gap-3 text-[14.5px] leading-relaxed text-foreground/90">
              <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", TONE_DOT[f.tone])} />
              <span>{f.title}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-1.5">
          <AIPrompt label="Forecast next 30 days" prompt="Forecast Blossom's operational posture across staffing, authorizations, and recruiting over the next 30 days." />
          <AIPrompt label="Stress test the plan" prompt="Stress test Blossom's current operations against a 20% intake increase over the next 60 days." />
          <a
            href="/executive/pulse"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-[11.5px] text-foreground/80 transition hover:bg-muted/40"
          >
            View company pulse <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </ExecCard>
      <ActionItemsPanel sourcePage="executive/briefing" />
    </ExecPage>
  );
}
