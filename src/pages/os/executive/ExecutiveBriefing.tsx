import { useMemo } from "react";
import { Sparkles, ArrowUpRight, ArrowDownRight, ChevronRight, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { ExecPage, ExecCard, AIPrompt, HealthPill, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";

const STATES = ["GA", "NC", "VA", "TN", "MD"] as const;

export default function ExecutiveBriefing() {
  const ops = useOpsIntelligence();
  const cr = useCentralReachOps({});
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const wf = useMemo(() => [ga, nc, va, tn, md], [ga, nc, va, tn, md]);

  const briefing = useMemo(() => {
    const improved: string[] = [];
    const worsened: string[] = [];
    const emerging: string[] = [];

    if (cr.cancellationsLast7d < cr.cancellationsLast30d / 4) improved.push(`Cancellations trending down this week (${cr.cancellationsLast7d} vs ~${Math.round(cr.cancellationsLast30d / 4)} avg).`);
    else if (cr.cancellationsLast7d > cr.cancellationsLast30d / 4 + 3) worsened.push(`Cancellations rising (${cr.cancellationsLast7d} this week).`);

    const overloaded = wf.flatMap((w) => w.bcbas).filter((b) => b.status === "Overloaded" || b.status === "Near Capacity").length;
    if (overloaded > 3) worsened.push(`${overloaded} BCBAs at or above capacity — supervision quality at risk.`);
    if (overloaded === 0) improved.push("BCBA caseloads within healthy bands across all states.");

    if (ops.auths.expiring7.length > 0) emerging.push(`${ops.auths.expiring7.length} authorization${ops.auths.expiring7.length === 1 ? " enters" : "s enter"} the ≤7-day window.`);
    if (ops.auths.qaStalled.length > 2) emerging.push(`${ops.auths.qaStalled.length} treatment plans stalled in QA.`);

    const heaviest = wf.map((w, i) => ({ s: STATES[i], gap: w.staffingNeeds.length })).sort((a, b) => b.gap - a.gap)[0];
    if (heaviest?.gap > 0) emerging.push(`${heaviest.s} carries the largest active staffing need (${heaviest.gap}).`);

    if (ops.recruiting.stalledCandidates.length > 5) worsened.push(`${ops.recruiting.stalledCandidates.length} candidates stalled in the recruiting pipeline ≥14 days.`);

    return { improved, worsened, emerging };
  }, [ops, cr, wf]);

  const priorities = useMemo(() => {
    const out: { title: string; reason: string; to: string }[] = [];
    if (briefing.worsened.length) out.push({ title: "Address operational pressure", reason: briefing.worsened[0], to: "/executive/strategic-risks" });
    if (briefing.emerging.some((e) => e.includes("staffing"))) out.push({ title: "Review state staffing", reason: "Open needs concentrating in one state.", to: "/executive/staffing-expansion" });
    if (briefing.emerging.some((e) => e.includes("QA"))) out.push({ title: "Reinforce QA throughput", reason: "Plan stalls compounding reauth risk.", to: "/executive/operational-consistency" });
    if (!out.length) out.push({ title: "Maintain rhythm", reason: "No leadership-level priorities surfaced today.", to: "/executive/pulse" });
    return out;
  }, [briefing]);

  return (
    <ExecPage
      title="Executive Briefing"
      subtitle="Your daily operational read — what changed, what's emerging, where to focus."
    >
      <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/30 p-6">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary/70" />
          AI Briefing · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-foreground/90">
          {briefing.worsened.length === 0 && briefing.emerging.length === 0
            ? "Blossom is steady today. The pulse is quiet, departments are aligned, and no leadership-level intervention is required."
            : `Today's read: ${briefing.worsened[0] ?? briefing.emerging[0] ?? "stable operations"}. ${briefing.emerging.length > 0 ? `Emerging signal — ${briefing.emerging[0]}.` : ""}`}
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <ExecCard title="What improved" hint="Past 7 days">
          {briefing.improved.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Nothing notable improved this week.</p>
          ) : (
            <ul className="space-y-2">
              {briefing.improved.map((t, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-foreground/85">
                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 text-emerald-600" /><span>{t}</span>
                </li>
              ))}
            </ul>
          )}
        </ExecCard>

        <ExecCard title="What worsened" hint="Past 7 days">
          {briefing.worsened.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Nothing worsened materially this week.</p>
          ) : (
            <ul className="space-y-2">
              {briefing.worsened.map((t, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-foreground/85">
                  <ArrowDownRight className="mt-0.5 h-3.5 w-3.5 text-rose-600" /><span>{t}</span>
                </li>
              ))}
            </ul>
          )}
        </ExecCard>

        <ExecCard title="Emerging signals" hint="Predictive">
          {briefing.emerging.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No emerging signals detected.</p>
          ) : (
            <ul className="space-y-2">
              {briefing.emerging.map((t, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-foreground/85">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-amber-600" /><span>{t}</span>
                </li>
              ))}
            </ul>
          )}
        </ExecCard>
      </div>

      <ExecCard title="Leadership priorities" hint="Where to focus today">
        <div className="grid gap-2 md:grid-cols-2">
          {priorities.map((p, i) => (
            <Link key={i} to={p.to} className="group rounded-xl border border-border/60 bg-background/40 p-4 transition hover:-translate-y-0.5 hover:bg-muted/40">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium">{p.title}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
              </div>
              <p className="mt-1 text-[12.5px] text-muted-foreground">{p.reason}</p>
            </Link>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <AIPrompt label="Generate full briefing" prompt="Generate the full executive operational briefing for today" />
          <AIPrompt label="Compare to last week" prompt="How does today's operational posture compare to last week?" />
          <AIPrompt label="Draft leadership update" prompt="Draft a brief executive update to share with leadership based on today's signals" />
        </div>
      </ExecCard>
    </ExecPage>
  );
}
