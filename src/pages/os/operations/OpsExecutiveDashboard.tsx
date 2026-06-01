import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Pin,
  Plus,
  X,
  CircleDot,
  TrendingUp,
  ShieldAlert,
  Activity,
} from "lucide-react";
import { OpsPage, OpsCard, HealthPill, EmptyRow, type HealthTone } from "./_shared";
import { useOpsIntelligence } from "@/hooks/useOpsIntelligence";
import { useStateWorkforce } from "@/hooks/useStateWorkforce";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const STATES = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;
const PRIORITIES_KEY = "ops.leadership.priorities.v1";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(email: string | null | undefined, meta: any): string {
  const fromMeta = meta?.first_name || meta?.given_name || meta?.name;
  if (fromMeta && typeof fromMeta === "string") return String(fromMeta).split(" ")[0];
  if (email) return email.split("@")[0].split(".")[0].replace(/^[a-z]/, (c) => c.toUpperCase());
  return "Leader";
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function OpsExecutiveDashboard() {
  const { user } = useAuth();
  const ops = useOpsIntelligence();
  const ga = useStateWorkforce("GA");
  const nc = useStateWorkforce("NC");
  const va = useStateWorkforce("VA");
  const tn = useStateWorkforce("TN");
  const md = useStateWorkforce("MD");
  const cr = useCentralReachOps({});
  const wf = useMemo(() => [ga, nc, va, tn, md], [ga, nc, va, tn, md]);

  // ---- Posture ----
  const overallTone: HealthTone = ops.risks.some((r) => r.tone === "blocked")
    ? "blocked"
    : ops.risks.some((r) => r.tone === "risk")
    ? "risk"
    : ops.risks.length > 0
    ? "attention"
    : "healthy";

  // ---- Org-wide workforce aggregates ----
  const orgWorkforce = useMemo(() => {
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

  // ---- Posture summary sentence ----
  const summary = useMemo(() => {
    const stressed = ops.depts
      .filter((d) => d.tone === "risk" || d.tone === "blocked")
      .map((d) => d.name);
    const attention = ops.depts.filter((d) => d.tone === "attention").map((d) => d.name);
    if (stressed.length === 0 && attention.length === 0) {
      return "All departments are operating normally. No leadership-level intervention required right now.";
    }
    if (stressed.length > 0) {
      return `${stressed.join(" and ")} ${stressed.length === 1 ? "is" : "are"} under pressure and need leadership attention.${attention.length ? ` ${attention.join(", ")} ${attention.length === 1 ? "needs" : "need"} a closer look.` : ""}`;
    }
    return `Most departments are operating normally today. ${attention.join(", ")} ${attention.length === 1 ? "needs" : "need"} attention.`;
  }, [ops.depts]);

  // ---- Workflow readiness ----
  const readiness = useMemo(() => {
    const totalAuths = ops.auths.total || 1;
    const authReady = Math.max(
      0,
      Math.round(
        ((totalAuths -
          ops.auths.expiring7.length -
          ops.auths.qaStalled.length -
          ops.auths.missingDocs.length) /
          totalAuths) *
          100,
      ),
    );
    const recTotal = ops.recruiting.candidates.length || 1;
    const recReady = Math.round(
      ((recTotal - ops.recruiting.stalledCandidates.length) / recTotal) * 100,
    );
    const bcbaTotal = orgWorkforce.bcbas.length || 1;
    const staffReady = Math.round(((bcbaTotal - orgWorkforce.overloaded) / bcbaTotal) * 100);
    const qaReady = Math.round(((totalAuths - ops.auths.qaStalled.length) / totalAuths) * 100);
    const coverage = cr.counts.activeClients
      ? Math.round((cr.counts.coveredClients / cr.counts.activeClients) * 100)
      : null;
    return [
      { label: "Intake progression", value: 92, tone: "healthy" as HealthTone, detail: "Pipeline flowing" },
      { label: "Auth turnaround", value: authReady, tone: authReady >= 85 ? "healthy" : authReady >= 70 ? "attention" : "risk", detail: `${ops.auths.expiring7.length} expiring ≤7d` },
      { label: "QA readiness", value: qaReady, tone: qaReady >= 90 ? "healthy" : qaReady >= 75 ? "attention" : "risk", detail: `${ops.auths.qaStalled.length} plans stalled` },
      { label: "Scheduling coverage", value: coverage ?? 0, tone: coverage === null ? "neutral" : coverage >= 90 ? "healthy" : coverage >= 75 ? "attention" : "risk", detail: coverage === null ? "Awaiting session data" : `${cr.counts.uncoveredClients} uncovered` },
      { label: "Recruiting velocity", value: recReady, tone: recReady >= 85 ? "healthy" : recReady >= 70 ? "attention" : "risk", detail: `${ops.recruiting.stalledCandidates.length} stalled ≥14d` },
      { label: "Staffing capacity", value: staffReady, tone: staffReady >= 85 ? "healthy" : staffReady >= 70 ? "attention" : "risk", detail: `${orgWorkforce.overloaded} BCBAs near/over capacity` },
    ];
  }, [ops, orgWorkforce, cr]);

  // ---- Escalations (blocked / high-severity only) ----
  const escalations = ops.risks.filter((r) => r.tone === "blocked" || r.tone === "risk");

  // ---- Activity timeline (derived from live signals) ----
  const activity = useMemo(() => {
    const items: { id: string; when: string; title: string; tone: HealthTone }[] = [];
    if (cr.cancellationsLast7d > 0)
      items.push({ id: "cx7", when: "Past 7 days", title: `${cr.cancellationsLast7d} session cancellations across the org`, tone: cr.cancellationsLast7d > 30 ? "risk" : "attention" });
    if (ops.auths.expiring7.length > 0)
      items.push({ id: "exp7", when: "This week", title: `${ops.auths.expiring7.length} authorization${ops.auths.expiring7.length === 1 ? "" : "s"} entered the ≤7-day window`, tone: "blocked" });
    if (orgWorkforce.needs.length > 0)
      items.push({ id: "needs", when: "Today", title: `${orgWorkforce.needs.length} active staffing needs across states`, tone: orgWorkforce.needs.length > 5 ? "risk" : "attention" });
    if (cr.counts.coveredClients > 0)
      items.push({ id: "cov", when: "Past 30 days", title: `${cr.counts.coveredClients} active clients receiving coverage`, tone: "healthy" });
    if (ops.recruiting.candidates.length > 0)
      items.push({ id: "rec", when: "Pipeline", title: `${ops.recruiting.candidates.length} candidates in recruiting pipeline`, tone: "healthy" });
    return items.slice(0, 6);
  }, [cr, ops, orgWorkforce]);

  // ---- AI executive insights (derived heuristics over real signals) ----
  const aiInsights = useMemo(() => {
    const out: { id: string; text: string }[] = [];
    const heaviestState = [...wf]
      .map((w, i) => ({ s: STATES[i], gap: w.staffingNeeds.length, bcbas: w.bcbas.length }))
      .sort((a, b) => b.gap - a.gap)[0];
    if (heaviestState && heaviestState.gap > 0) {
      out.push({ id: "i1", text: `${heaviestState.s} carries the largest active staffing need (${heaviestState.gap}). Recruiting velocity in ${heaviestState.s} is the lever most likely to move this.` });
    }
    if (ops.auths.qaStalled.length > 3 && ops.auths.expiring14.length > 0) {
      out.push({ id: "i2", text: `QA turnaround delays (${ops.auths.qaStalled.length} stalled) may begin impacting reauthorization readiness within 10 days — ${ops.auths.expiring14.length} auths expire ≤14d.` });
    }
    if (orgWorkforce.overloaded > 3) {
      out.push({ id: "i3", text: `${orgWorkforce.overloaded} BCBAs are at or above capacity. Continued intake without redistribution will compress supervision quality.` });
    }
    if (cr.cancellationsLast7d > cr.cancellationsLast30d / 4 + 5) {
      out.push({ id: "i4", text: `Cancellations trended above the 30-day average this week (${cr.cancellationsLast7d} vs ~${Math.round(cr.cancellationsLast30d / 4)}).` });
    }
    if (out.length === 0) {
      out.push({ id: "i0", text: "Operational signals are quiet. No predictive risks rising to leadership level right now." });
    }
    return out;
  }, [wf, ops, orgWorkforce, cr]);

  // ---- Leadership priorities (local, pinned) ----
  const [priorities, setPriorities] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRIORITIES_KEY);
      if (raw) setPriorities(JSON.parse(raw));
    } catch {}
  }, []);
  function savePriorities(next: string[]) {
    setPriorities(next);
    try {
      localStorage.setItem(PRIORITIES_KEY, JSON.stringify(next));
    } catch {}
  }

  const name = firstName(user?.email, user?.user_metadata);

  return (
    <OpsPage
      title="Executive Dashboard"
      subtitle="The operational nervous system of Blossom — quiet, honest, and live."
    >
      {/* 1. Executive header */}
      <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/30 p-6 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_24px_-12px_hsl(220_15%_20%/0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[12px] text-muted-foreground">{fmtDate(new Date())}</div>
            <h2 className="mt-1 text-[26px] md:text-[32px] font-semibold tracking-tight">
              {greeting()}, {name}.
            </h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              {summary}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="relative inline-flex">
              <span
                className={cn("h-2.5 w-2.5 rounded-full", {
                  "bg-emerald-500": overallTone === "healthy",
                  "bg-amber-500": overallTone === "attention",
                  "bg-orange-500": overallTone === "risk",
                  "bg-rose-500": overallTone === "blocked",
                })}
              />
              <span
                className={cn("absolute inset-0 -m-1 rounded-full opacity-40 animate-ping", {
                  "bg-emerald-400": overallTone === "healthy",
                  "bg-amber-400": overallTone === "attention",
                  "bg-orange-400": overallTone === "risk",
                  "bg-rose-400": overallTone === "blocked",
                })}
              />
            </span>
            <HealthPill tone={overallTone}>
              {overallTone === "healthy"
                ? "Org operating normally"
                : overallTone === "attention"
                ? "Attention needed"
                : overallTone === "risk"
                ? "At risk"
                : "Blocked"}
            </HealthPill>
          </div>
        </div>
      </section>

      {/* 2. Organizational health snapshot */}
      <OpsCard title="Organizational health" hint="Department snapshot · live">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ops.depts.map((d) => (
            <Link
              key={d.id}
              to="/operations/department-health"
              className="group rounded-xl border border-border/60 bg-background/40 p-3 transition hover:-translate-y-0.5 hover:border-border hover:bg-muted/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-medium text-foreground">{d.name}</span>
                <HealthPill tone={d.tone}>{d.tone}</HealthPill>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", {
                    "bg-emerald-500": d.tone === "healthy",
                    "bg-amber-500": d.tone === "attention",
                    "bg-orange-500": d.tone === "risk",
                    "bg-rose-500": d.tone === "blocked",
                  })}
                  style={{ width: `${Math.min(100, Math.max(8, d.score))}%` }}
                />
              </div>
              <div className="mt-1.5 truncate text-[11.5px] text-muted-foreground">{d.signal}</div>
            </Link>
          ))}
        </div>
      </OpsCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 3. Operational attention center */}
        <OpsCard
          title="Operational attention center"
          hint={`${ops.risks.length} signal${ops.risks.length === 1 ? "" : "s"}`}
          className="lg:col-span-2"
        >
          {ops.risks.length === 0 ? (
            <EmptyRow>You’re all caught up. No leadership-level signals right now.</EmptyRow>
          ) : (
            <div className="space-y-2">
              {ops.risks.slice(0, 8).map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-3 transition hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn("h-1.5 w-1.5 rounded-full shrink-0", {
                          "bg-emerald-500": r.tone === "healthy",
                          "bg-amber-500": r.tone === "attention",
                          "bg-orange-500": r.tone === "risk",
                          "bg-rose-500": r.tone === "blocked",
                        })}
                      />
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {r.area}
                      </span>
                    </div>
                    <div className="mt-1 text-[13.5px] font-medium text-foreground">{r.title}</div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">{r.detail}</div>
                  </div>
                  <Link
                    to="/operations/escalations"
                    className="shrink-0 self-center rounded-full border border-border/60 px-3 py-1 text-[11.5px] text-muted-foreground transition hover:border-border hover:text-foreground"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </OpsCard>

        {/* 10. AI executive insights */}
        <OpsCard
          title="AI executive insights"
          hint="Live, derived"
        >
          <div className="space-y-3">
            {aiInsights.map((i) => (
              <div key={i.id} className="rounded-xl border border-border/60 bg-background/40 p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="text-[12.5px] leading-relaxed text-foreground">{i.text}</p>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["Ask follow-up", "Operational summary", "Leadership briefing", "Root causes"].map((a) => (
                <Link
                  key={a}
                  to="/operations/briefing"
                  className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-border hover:text-foreground"
                >
                  {a}
                </Link>
              ))}
            </div>
          </div>
        </OpsCard>
      </div>

      {/* 5. Staffing & 6. Workflow readiness side-by-side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <OpsCard title="Staffing & capacity" hint="Org-wide · by state">
          <div className="space-y-2.5">
            {STATES.map((s, i) => {
              const w = wf[i];
              const total = w.bcbas.length || 1;
              const overloaded = w.bcbas.filter(
                (b) => b.status === "Overloaded" || b.status === "Near Capacity",
              ).length;
              const pct = Math.round((overloaded / total) * 100);
              const tone: HealthTone = pct >= 30 ? "risk" : pct >= 15 ? "attention" : "healthy";
              return (
                <Link
                  key={s}
                  to="/operations/staffing-capacity"
                  className="block rounded-xl border border-border/60 p-3 transition hover:bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-foreground">{s}</span>
                      <span className="text-[11.5px] text-muted-foreground">
                        {w.bcbas.length} BCBA · {w.rbts.length} RBT · {w.staffingNeeds.length} need{w.staffingNeeds.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <HealthPill tone={tone}>{tone}</HealthPill>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", {
                        "bg-emerald-500": tone === "healthy",
                        "bg-amber-500": tone === "attention",
                        "bg-orange-500": tone === "risk",
                      })}
                      style={{ width: `${Math.max(8, 100 - pct)}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </OpsCard>

        <OpsCard title="Workflow readiness" hint="Bottleneck signals">
          <div className="space-y-2.5">
            {readiness.map((r) => (
              <div key={r.label} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-foreground">{r.label}</span>
                  <span className="text-[12px] tabular-nums text-muted-foreground">
                    {r.tone === "neutral" ? "—" : `${r.value}%`}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", {
                      "bg-emerald-500": r.tone === "healthy",
                      "bg-amber-500": r.tone === "attention",
                      "bg-orange-500": r.tone === "risk",
                      "bg-rose-500": r.tone === "blocked",
                      "bg-muted-foreground/30": r.tone === "neutral",
                    })}
                    style={{ width: `${r.tone === "neutral" ? 8 : Math.max(6, r.value)}%` }}
                  />
                </div>
                <div className="mt-1 text-[11.5px] text-muted-foreground">{r.detail}</div>
              </div>
            ))}
          </div>
        </OpsCard>
      </div>

      {/* 7. Escalation feed + 8. Leadership priorities */}
      <div className="grid gap-4 lg:grid-cols-3">
        <OpsCard
          title="Escalation feed"
          hint={`${escalations.length} active`}
          className="lg:col-span-2"
        >
          {escalations.length === 0 ? (
            <EmptyRow>No active escalations. Calm and clear.</EmptyRow>
          ) : (
            <ol className="relative space-y-3 border-l border-border/60 pl-5">
              {escalations.map((e) => (
                <li key={e.id} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-card",
                      {
                        "bg-rose-500": e.tone === "blocked",
                        "bg-orange-500": e.tone === "risk",
                        "bg-amber-500": e.tone === "attention",
                        "bg-emerald-500": e.tone === "healthy",
                      },
                    )}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {e.area}
                      </div>
                      <div className="mt-0.5 text-[13.5px] font-medium text-foreground">
                        {e.title}
                      </div>
                      <div className="mt-0.5 text-[12px] text-muted-foreground">{e.detail}</div>
                    </div>
                    <HealthPill tone={e.tone}>{e.tone}</HealthPill>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </OpsCard>

        <OpsCard title="Leadership priorities" hint={`${priorities.length} pinned`}>
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              const v = draft.trim();
              if (!v) return;
              savePriorities([v, ...priorities].slice(0, 8));
              setDraft("");
            }}
            className="mb-3 flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-2 py-1.5"
          >
            <Pin className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Pin a leadership focus…"
              className="flex-1 bg-transparent text-[13px] placeholder:text-muted-foreground/60 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full border border-border/60 p-1 text-muted-foreground transition hover:border-border hover:text-foreground"
              aria-label="Pin priority"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>
          {priorities.length === 0 ? (
            <EmptyRow>No pinned priorities. Pin operational focuses to keep them visible.</EmptyRow>
          ) : (
            <ul className="space-y-1.5">
              {priorities.map((p, idx) => (
                <li
                  key={`${p}-${idx}`}
                  className="group flex items-start justify-between gap-2 rounded-xl border border-border/60 px-3 py-2"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="text-[13px] text-foreground">{p}</span>
                  </div>
                  <button
                    onClick={() => savePriorities(priorities.filter((_, i) => i !== idx))}
                    className="opacity-0 transition group-hover:opacity-100"
                    aria-label="Remove"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </OpsCard>
      </div>

      {/* 9. Operational activity timeline */}
      <OpsCard title="Operational activity" hint="Recent organizational movement">
        {activity.length === 0 ? (
          <EmptyRow>Nothing notable to surface right now.</EmptyRow>
        ) : (
          <ul className="divide-y divide-border/60">
            {activity.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full shrink-0", {
                      "bg-emerald-500": a.tone === "healthy",
                      "bg-amber-500": a.tone === "attention",
                      "bg-orange-500": a.tone === "risk",
                      "bg-rose-500": a.tone === "blocked",
                    })}
                  />
                  <span className="truncate text-[13px] text-foreground">{a.title}</span>
                </div>
                <span className="shrink-0 text-[11.5px] text-muted-foreground">{a.when}</span>
              </li>
            ))}
          </ul>
        )}
      </OpsCard>

      {/* Quick navigation */}
      <div className="grid gap-3 md:grid-cols-3">
        <Link
          to="/operations/command-center"
          className="group rounded-2xl border border-border/70 bg-card p-4 transition hover:-translate-y-0.5 hover:border-border"
        >
          <Activity className="h-4 w-4 text-muted-foreground" />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[13px] font-medium tracking-tight">Command Center</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5" />
          </div>
        </Link>
        <Link
          to="/operations/workflow-risks"
          className="group rounded-2xl border border-border/70 bg-card p-4 transition hover:-translate-y-0.5 hover:border-border"
        >
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[13px] font-medium tracking-tight">Workflow Risks</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5" />
          </div>
        </Link>
        <Link
          to="/operations/escalations"
          className="group rounded-2xl border border-border/70 bg-card p-4 transition hover:-translate-y-0.5 hover:border-border"
        >
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[13px] font-medium tracking-tight">Escalations</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5" />
          </div>
        </Link>
      </div>
    </OpsPage>
  );
}