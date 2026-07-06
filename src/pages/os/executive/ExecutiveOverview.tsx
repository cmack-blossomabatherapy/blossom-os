import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ExecPage, ExecCard, HealthPill, AIPrompt, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { useAuth } from "@/contexts/AuthContext";
import { ActionItemsPanel } from "@/components/executive/ActionItemsPanel";
import { cn } from "@/lib/utils";

const STATES = [
  { code: "GA", name: "Georgia" },
  { code: "NC", name: "North Carolina" },
  { code: "TN", name: "Tennessee" },
  { code: "VA", name: "Virginia" },
  { code: "MD", name: "Maryland" },
] as const;

const DEPT_ROUTES: Record<string, string> = {
  intake: "/operations/department-health",
  authorizations: "/operations/escalations",
  scheduling: "/operations/staffing-capacity",
  recruiting: "/operations/staffing-capacity",
  qa: "/operations/workflow-risks",
  hr: "/operations/department-health",
  payroll: "/operations/department-health",
  training: "/operations/training-adoption",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(email: string | null | undefined, meta: any) {
  const fromMeta = meta?.first_name || meta?.given_name || meta?.name;
  if (fromMeta) return String(fromMeta).split(" ")[0];
  if (email) return email.split("@")[0].split(".")[0].replace(/^[a-z]/, (c) => c.toUpperCase());
  return "Leader";
}

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

function toneLabel(t: HealthTone) {
  return t === "healthy" ? "Stable" : t === "attention" ? "Attention Needed" : t === "risk" ? "Pressure Rising" : "Critical";
}

export default function ExecutiveOverview() {
  const { user } = useAuth();
  const ops = useOpsIntelligence();
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const tn = useStateWorkforce("TN");
  const va = useStateWorkforce("VA");
  const md = useStateWorkforce("MD");
  const nj = useStateWorkforce("NJ");
  const cr = useCentralReachOps({});
  const wf = useMemo(() => [
    { state: STATES[0], data: ga },
    { state: STATES[1], data: nc },
    { state: STATES[2], data: tn },
    { state: STATES[3], data: va },
    { state: STATES[4], data: md },
  ], [ga, nc, tn, va, md]);

  const overloaded = useMemo(
    () => wf.flatMap((w) => w.data.bcbas).filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length,
    [wf],
  );
  const totalNeeds = useMemo(() => wf.flatMap((w) => w.data.staffingNeeds).length, [wf]);
  const criticalNeeds = useMemo(
    () => wf.flatMap((w) => w.data.staffingNeeds).filter((n) => n.urgency === "critical").length,
    [wf],
  );

  // ── Executive status indicators ────────────────────────────────────────
  const stability = worst(ops.depts.map((d) => d.tone));
  const staffing: HealthTone =
    criticalNeeds > 3 ? "blocked" : totalNeeds > 8 ? "risk" : totalNeeds > 3 ? "attention" : "healthy";
  const workflow: HealthTone = worst([
    ops.depts.find((d) => d.id === "authorizations")?.tone ?? "healthy",
    ops.depts.find((d) => d.id === "scheduling")?.tone ?? "healthy",
    ops.depts.find((d) => d.id === "qa")?.tone ?? "healthy",
  ]);
  const leadership: HealthTone = ops.risks.filter((r) => r.tone === "blocked" || r.tone === "risk").length > 3 ? "risk" : ops.risks.length > 2 ? "attention" : "healthy";
  const escalation: HealthTone =
    ops.risks.filter((r) => r.tone === "blocked").length > 0 ? "blocked" :
    ops.risks.filter((r) => r.tone === "risk").length > 1 ? "risk" :
    ops.risks.length > 0 ? "attention" : "healthy";
  const growth: HealthTone = overloaded > 4 ? "risk" : overloaded > 1 ? "attention" : "healthy";

  const indicators = [
    { label: "Organizational Stability", tone: stability },
    { label: "Staffing Readiness", tone: staffing },
    { label: "Workflow Health", tone: workflow },
    { label: "Leadership Alignment", tone: leadership },
    { label: "Escalation Pressure", tone: escalation },
    { label: "Growth Readiness", tone: growth },
  ];

  // ── AI Executive Briefing ──────────────────────────────────────────────
  const briefing = useMemo(() => {
    const out: { text: string; trend: "up" | "down" | "flat" }[] = [];
    const heaviest = [...wf].sort((a, b) => b.data.staffingNeeds.length - a.data.staffingNeeds.length)[0];
    if (heaviest && heaviest.data.staffingNeeds.length > 0) {
      out.push({ text: `${heaviest.state.name} carries the largest active staffing need (${heaviest.data.staffingNeeds.length}) — recruiting velocity there is the highest-leverage move.`, trend: "down" });
    }
    if (overloaded > 3) {
      out.push({ text: `${overloaded} BCBAs across the company are at or above capacity. Continued intake without redistribution will compress supervision quality.`, trend: "down" });
    } else if (overloaded > 0) {
      out.push({ text: `${overloaded} BCBA${overloaded === 1 ? "" : "s"} approaching capacity — manageable, but watch redistribution.`, trend: "flat" });
    }
    if (ops.auths.expiring14.length > 0) {
      const word = ops.auths.qaStalled.length > 2 ? "pressuring" : "trending against";
      out.push({ text: `${ops.auths.expiring14.length} authorizations expire within 14 days${ops.auths.qaStalled.length > 0 ? `, with ${ops.auths.qaStalled.length} stalled in QA ${word} reauth readiness` : ""}.`, trend: ops.auths.expiring14.length > 5 ? "down" : "flat" });
    }
    const weekly = cr.cancellationsLast7d;
    const avgWeek = Math.round(cr.cancellationsLast30d / 4);
    if (weekly > avgWeek + 5) {
      out.push({ text: `Cancellations trended above the 30-day average this week (${weekly} vs ~${avgWeek}).`, trend: "down" });
    } else if (weekly < avgWeek - 3) {
      out.push({ text: `Cancellations improved this week (${weekly} vs ~${avgWeek} weekly average).`, trend: "up" });
    }
    if (ops.recruiting.candidates.length > 0 && ops.recruiting.stalledCandidates.length < 3) {
      out.push({ text: `Recruiting pipeline moving cleanly — ${ops.recruiting.candidates.length} active candidates, minimal stalls.`, trend: "up" });
    }
    if (!out.length) out.push({ text: "Operational signals are quiet. Blossom is running stably across all states and departments today.", trend: "flat" });
    return out;
  }, [wf, overloaded, ops, cr]);

  // ── Leadership attention list ──────────────────────────────────────────
  const attentionItems = useMemo(() => {
    const items: { id: string; area: string; title: string; tone: HealthTone }[] = [];
    ops.risks.slice(0, 6).forEach((r) => items.push({ id: r.id, area: r.area, title: r.title, tone: r.tone }));
    wf.forEach(({ state, data }) => {
      const crit = data.staffingNeeds.filter((n) => n.urgency === "critical").length;
      if (crit > 0) items.push({ id: `staff-${state.code}`, area: state.name, title: `${crit} critical staffing need${crit === 1 ? "" : "s"} unresolved`, tone: "risk" });
    });
    return items.slice(0, 7);
  }, [ops.risks, wf]);

  const name = firstName(user?.email, user?.user_metadata);
  const overall = worst(indicators.map((i) => i.tone));
  const stamp = new Date().toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <ExecPage title="Executive Overview" subtitle="Mission control for Blossom ABA — one calm read of the organization.">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/30 p-6 md:p-8 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset]">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[12px] text-muted-foreground">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <h2 className="mt-1 text-[28px] md:text-[34px] font-semibold tracking-tight">
              {greeting()}, {name}.
            </h2>
            <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
              {overall === "healthy"
                ? "Blossom is operating quietly today. No leadership-level intervention required."
                : overall === "attention"
                ? "A few areas need a closer look — nothing destabilizing. Briefing below."
                : overall === "risk"
                ? "Operational pressure is building in specific areas. Leadership attention recommended."
                : "Critical signals detected. Review the briefing and attention list below."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="relative inline-flex">
              <span className={cn("h-2.5 w-2.5 rounded-full", TONE_DOT[overall])} />
              <span className={cn("absolute inset-0 -m-1 rounded-full opacity-30 animate-ping", TONE_DOT[overall])} />
            </span>
            <HealthPill tone={overall}>{toneLabel(overall)}</HealthPill>
          </div>
        </div>
      </section>

      {/* ─── Section 1 — Executive Status Bar ───────────────────────────── */}
      <section className="rounded-2xl border border-border/70 bg-card p-5">
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {indicators.map((i) => (
            <div key={i.label} className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{i.label}</span>
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", TONE_DOT[i.tone])} />
                <span className="text-[14px] font-medium text-foreground">{toneLabel(i.tone)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Section 2 — AI Executive Briefing ──────────────────────────── */}
      <ExecCard className="bg-gradient-to-br from-card via-card to-primary/[0.03]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-[13.5px] font-semibold tracking-tight">AI Executive Briefing</h2>
              <p className="text-[11px] text-muted-foreground">Generated from live operational systems · {stamp}</p>
            </div>
          </div>
          <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/50 px-2.5 py-1 text-[10.5px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            High confidence
          </span>
        </div>
        <ul className="space-y-3">
          {briefing.map((b, i) => {
            const Icon = b.trend === "up" ? TrendingUp : b.trend === "down" ? TrendingDown : Minus;
            const tint = b.trend === "up" ? "text-emerald-600 bg-emerald-50" : b.trend === "down" ? "text-rose-600 bg-rose-50" : "text-muted-foreground bg-muted/50";
            return (
              <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-foreground/90">
                <span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full", tint)}>
                  <Icon className="h-3 w-3" />
                </span>
                <span>{b.text}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-5 flex flex-wrap gap-1.5">
          <AIPrompt label="Summarize today" prompt="Summarize today's executive operational posture for Blossom ABA" />
          <AIPrompt label="Top 3 strategic risks" prompt="What are the top 3 strategic risks across Blossom right now?" />
          <AIPrompt label="Where should I focus?" prompt="As CEO, where should I focus today across staffing, escalations, and growth readiness?" />
        </div>
      </ExecCard>

      {/* ─── Section 3 — Organizational Pressure Map ────────────────────── */}
      <ExecCard title="Organizational Pressure Map" hint="By state · live signals">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {wf.map(({ state, data }) => {
            const needs = data.staffingNeeds.length;
            const crit = data.staffingNeeds.filter((n) => n.urgency === "critical").length;
            const over = data.bcbas.filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length;
            const tone: HealthTone = crit > 1 ? "blocked" : needs > 4 ? "risk" : needs > 1 || over > 1 ? "attention" : "healthy";
            const readiness = Math.max(0, Math.min(100, 100 - needs * 6 - over * 4 - crit * 8));
            return (
              <Link
                key={state.code}
                to="/executive/staffing-expansion"
                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-background/40 p-4 transition hover:-translate-y-0.5 hover:border-border"
              >
                <div className={cn(
                  "absolute inset-x-0 top-0 h-0.5 transition-opacity",
                  tone === "healthy" && "bg-emerald-400/70",
                  tone === "attention" && "bg-amber-400/80",
                  tone === "risk" && "bg-rose-400/80",
                  tone === "blocked" && "bg-rose-400/80",
                )} />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{state.code}</div>
                    <div className="mt-0.5 text-[15px] font-semibold tracking-tight">{state.name}</div>
                  </div>
                  <span className={cn("h-2 w-2 rounded-full", TONE_DOT[tone])} />
                </div>
                <div className="mt-3 space-y-1 text-[12px] text-muted-foreground">
                  <div className="flex items-center justify-between"><span>Staffing needs</span><span className="tabular-nums text-foreground/80">{needs}</span></div>
                  <div className="flex items-center justify-between"><span>At capacity</span><span className="tabular-nums text-foreground/80">{over}</span></div>
                  <div className="flex items-center justify-between"><span>Readiness</span><span className="tabular-nums text-foreground/80">{readiness}%</span></div>
                </div>
                <div className="mt-3 h-1 rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-1 rounded-full transition-all",
                      tone === "healthy" && "bg-emerald-400",
                      tone === "attention" && "bg-amber-400",
                      tone === "risk" && "bg-rose-400",
                      tone === "blocked" && "bg-rose-400",
                    )}
                    style={{ width: `${readiness}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </ExecCard>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* ─── Section 4 — Department Health Stream ─────────────────────── */}
        <ExecCard title="Department Health" hint="Live · click for detail" className="lg:col-span-3">
          <div className="divide-y divide-border/60">
            {ops.depts.map((d) => (
              <Link
                key={d.id}
                to={DEPT_ROUTES[d.id] ?? "/executive/organizational-health"}
                className="group flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 transition"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", TONE_DOT[d.tone])} />
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium tracking-tight">{d.name}</div>
                    <div className="truncate text-[12px] text-muted-foreground">{d.signal}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <HealthPill tone={d.tone}>{toneLabel(d.tone)}</HealthPill>
                  <ArrowRight className="h-3.5 w-3.5 opacity-30 transition group-hover:translate-x-0.5 group-hover:opacity-70" />
                </div>
              </Link>
            ))}
          </div>
        </ExecCard>

        {/* ─── Section 5 — Leadership Attention Needed ──────────────────── */}
        <ExecCard title="Leadership Attention" hint={`${attentionItems.length} signal${attentionItems.length === 1 ? "" : "s"}`} className="lg:col-span-2">
          {attentionItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-background/40 p-6 text-center">
              <div className="text-[13px] font-medium text-foreground/80">All clear.</div>
              <div className="mt-1 text-[12px] text-muted-foreground">No leadership-level escalations open right now.</div>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {attentionItems.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-border/60 bg-background/40 p-3 transition hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{a.area}</div>
                      <div className="mt-0.5 text-[13.5px] font-medium leading-snug">{a.title}</div>
                    </div>
                    <HealthPill tone={a.tone}>{toneLabel(a.tone)}</HealthPill>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-1.5">
            <AIPrompt label="Draft leadership note" prompt="Draft a short executive note to operations leadership summarizing today's attention items." />
            <AIPrompt label="Suggest next moves" prompt="For each leadership attention item today, suggest the next operational move." />
          </div>
        </ExecCard>
      </div>

      {/* ─── Leadership Action Items — persisted to executive_work_items ─ */}
      <ActionItemsPanel sourcePage="executive_overview" />
    </ExecPage>
  );
}
