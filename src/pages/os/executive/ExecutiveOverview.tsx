import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Activity, ShieldAlert, TrendingUp, Users2, GraduationCap, Workflow } from "lucide-react";
import { ExecPage, ExecCard, HealthPill, AIPrompt, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const STATES = ["GA", "NC", "VA", "TN", "MD"] as const;

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

export default function ExecutiveOverview() {
  const { user } = useAuth();
  const ops = useOpsIntelligence();
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const cr = useCentralReachOps({});
  const wf = useMemo(() => [ga, nc, va, tn, md], [ga, nc, va, tn, md]);

  const posture: HealthTone = ops.risks.some((r) => r.tone === "blocked")
    ? "blocked"
    : ops.risks.some((r) => r.tone === "risk")
    ? "risk"
    : ops.risks.length > 0
    ? "attention"
    : "healthy";

  const summary = useMemo(() => {
    const stressed = ops.depts.filter((d) => d.tone === "risk" || d.tone === "blocked").map((d) => d.name);
    const attention = ops.depts.filter((d) => d.tone === "attention").map((d) => d.name);
    if (!stressed.length && !attention.length)
      return "Blossom is operating quietly today. No leadership-level intervention required.";
    if (stressed.length)
      return `${stressed.join(" and ")} ${stressed.length === 1 ? "is" : "are"} under pressure.${attention.length ? ` ${attention.join(", ")} need a closer look.` : ""}`;
    return `Most of the organization is operating normally. ${attention.join(", ")} ${attention.length === 1 ? "needs" : "need"} attention.`;
  }, [ops.depts]);

  const overloaded = useMemo(
    () => wf.flatMap((w) => w.bcbas).filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length,
    [wf],
  );
  const totalNeeds = useMemo(() => wf.flatMap((w) => w.staffingNeeds).length, [wf]);

  const pillars = [
    { id: "health", label: "Organizational Health", value: ops.depts.filter((d) => d.tone === "healthy").length + " / " + ops.depts.length, tone: posture, to: "/executive/organizational-health", hint: "Departments healthy" },
    { id: "risks", label: "Strategic Risks", value: String(ops.risks.length), tone: ops.risks.length > 4 ? "risk" : ops.risks.length > 1 ? "attention" : "healthy", to: "/executive/strategic-risks", hint: "Live signals" },
    { id: "staffing", label: "Staffing & Expansion", value: String(totalNeeds), tone: totalNeeds > 6 ? "risk" : totalNeeds > 2 ? "attention" : "healthy", to: "/executive/staffing-expansion", hint: "Open needs across states" },
    { id: "growth", label: "Growth Readiness", value: String(Math.max(0, 100 - overloaded * 6 - totalNeeds * 3)) + "%", tone: overloaded > 3 ? "risk" : overloaded > 0 ? "attention" : "healthy", to: "/executive/growth-readiness", hint: "Composite readiness" },
  ] as const;

  const aiInsights = useMemo(() => {
    const out: string[] = [];
    const heaviest = wf.map((w, i) => ({ s: STATES[i], gap: w.staffingNeeds.length })).sort((a, b) => b.gap - a.gap)[0];
    if (heaviest?.gap > 0) out.push(`${heaviest.s} carries the largest active staffing need (${heaviest.gap}). Recruiting velocity there is the highest-leverage move.`);
    if (overloaded > 3) out.push(`${overloaded} BCBAs are at or above capacity — continued intake without redistribution will compress supervision quality.`);
    if (ops.auths.expiring14.length > 0 && ops.auths.qaStalled.length > 2)
      out.push(`QA backlog (${ops.auths.qaStalled.length} stalled) may begin pressuring reauth readiness — ${ops.auths.expiring14.length} auths expire ≤14d.`);
    if (cr.cancellationsLast7d > (cr.cancellationsLast30d / 4) + 5)
      out.push(`Cancellations trended above the 30-day average this week (${cr.cancellationsLast7d} vs ~${Math.round(cr.cancellationsLast30d / 4)}).`);
    if (!out.length) out.push("Operational signals are quiet. No predictive risks rising to leadership level right now.");
    return out;
  }, [wf, overloaded, ops, cr]);

  const name = firstName(user?.email, user?.user_metadata);

  return (
    <ExecPage
      title="Executive Overview"
      subtitle="A calm, honest read of where Blossom stands today."
    >
      {/* Header */}
      <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/30 p-6 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[12px] text-muted-foreground">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <h2 className="mt-1 text-[26px] md:text-[32px] font-semibold tracking-tight">
              {greeting()}, {name}.
            </h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">{summary}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="relative inline-flex">
              <span className={cn("h-2.5 w-2.5 rounded-full", {
                "bg-emerald-500": posture === "healthy",
                "bg-amber-500": posture === "attention",
                "bg-orange-500": posture === "risk",
                "bg-rose-500": posture === "blocked",
              })} />
              <span className={cn("absolute inset-0 -m-1 rounded-full opacity-40 animate-ping", {
                "bg-emerald-400": posture === "healthy",
                "bg-amber-400": posture === "attention",
                "bg-orange-400": posture === "risk",
                "bg-rose-400": posture === "blocked",
              })} />
            </span>
            <HealthPill tone={posture}>
              {posture === "healthy" ? "Org operating normally" : posture === "attention" ? "Attention needed" : posture === "risk" ? "At risk" : "Blocked"}
            </HealthPill>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {pillars.map((p) => (
          <Link
            key={p.id}
            to={p.to}
            className="group rounded-2xl border border-border/70 bg-card p-5 transition hover:-translate-y-0.5 hover:border-border"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{p.label}</span>
              <HealthPill tone={p.tone as HealthTone}>{p.tone}</HealthPill>
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{p.value}</div>
            <div className="mt-1 flex items-center justify-between text-[12px] text-muted-foreground">
              <span>{p.hint}</span>
              <ArrowRight className="h-3.5 w-3.5 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Departments */}
        <ExecCard title="Departments" hint="Live · click for detail" className="lg:col-span-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {ops.depts.map((d) => (
              <Link
                key={d.id}
                to="/executive/organizational-health"
                className="rounded-xl border border-border/60 bg-background/40 p-3 transition hover:-translate-y-0.5 hover:bg-muted/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-medium">{d.name}</span>
                  <HealthPill tone={d.tone}>{d.tone}</HealthPill>
                </div>
              </Link>
            ))}
          </div>
        </ExecCard>

        {/* AI insights */}
        <ExecCard title="AI executive intelligence" hint="Derived from live signals">
          <ul className="space-y-2.5">
            {aiInsights.map((t, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-foreground/85">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <AIPrompt label="Summarize today" prompt="Summarize today's executive operational posture for Blossom ABA" />
            <AIPrompt label="Top 3 strategic risks" prompt="What are the top 3 strategic risks across Blossom right now?" />
            <AIPrompt label="Where do I focus?" prompt="As CEO, where should I focus today across staffing, escalations, and growth readiness?" />
          </div>
        </ExecCard>
      </div>

      {/* Quick navigation */}
      <ExecCard title="Quick navigation">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {[
            { to: "/executive/pulse", label: "Company Pulse", icon: Activity },
            { to: "/executive/briefing", label: "Executive Briefing", icon: Sparkles },
            { to: "/executive/strategic-risks", label: "Strategic Risks", icon: ShieldAlert },
            { to: "/executive/growth-readiness", label: "Growth & Readiness", icon: TrendingUp },
            { to: "/executive/staffing-expansion", label: "Staffing & Expansion", icon: Users2 },
            { to: "/executive/operational-consistency", label: "Operational Consistency", icon: Workflow },
            { to: "/executive/updates", label: "Executive Updates", icon: GraduationCap },
            { to: "/executive/resources", label: "Resource Library", icon: GraduationCap },
            { to: "/ai/assistant", label: "Ask Blossom AI", icon: Sparkles },
          ].map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 text-[13px] transition hover:bg-muted/40"
            >
              <span className="flex items-center gap-2 text-foreground/85">
                <q.icon className="h-3.5 w-3.5 opacity-70" />
                {q.label}
              </span>
              <ArrowRight className="h-3.5 w-3.5 opacity-50" />
            </Link>
          ))}
        </div>
      </ExecCard>
    </ExecPage>
  );
}
