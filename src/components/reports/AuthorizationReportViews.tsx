import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ClipboardCheck,
  Clock, FileWarning, Flag, Hourglass, MapPin, ShieldAlert, Sparkles,
  TrendingDown, TrendingUp, Users, Workflow,
} from "lucide-react";
import { mockAuths, daysUntil, type Authorization } from "@/data/authorizations";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ============================================================
 * Shared utils — grounded in real mockAuths data
 * ============================================================ */

const A = mockAuths;
const isOpen = (a: Authorization) => a.stage !== "Approved" && a.stage !== "Denied" && a.stage !== "Flaked Client";
const expDays = (a: Authorization) => daysUntil(a.expirationDate);

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function groupBy<T, K extends string>(arr: T[], key: (t: T) => K | null | undefined): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    if (!k) return acc;
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

/* ============================================================
 * Presentational primitives — Blossom OS calm operational style
 * ============================================================ */

function KpiCard({
  label, value, sub, tone = "muted", icon: Icon,
}: {
  label: string; value: string | number; sub?: string;
  tone?: "muted" | "warning" | "destructive" | "success" | "info";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const tones: Record<string, string> = {
    muted: "text-muted-foreground bg-secondary/40",
    warning: "text-amber-600 bg-amber-50",
    destructive: "text-rose-600 bg-rose-50",
    success: "text-emerald-600 bg-emerald-50",
    info: "text-[hsl(265_70%_55%)] bg-[hsl(265_100%_97%)]",
  };
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-lg", tones[tone])}>
            <Icon className="h-3 w-3" />
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[24px] font-semibold tabular-nums tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[11.5px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SectionCard({
  title, subtitle, icon: Icon, accent, children, action,
}: {
  title: string; subtitle?: string; icon?: React.ComponentType<{ className?: string }>;
  accent?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {Icon && (
            <span
              className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/60"
              style={accent ? { color: accent } : undefined}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
          <div>
            <h3 className="text-[14px] font-semibold tracking-tight">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[11.5px] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function AiInsightsPanel({ items, prompts }: { items: string[]; prompts: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <article className="relative overflow-hidden rounded-2xl border border-[hsl(265_70%_55%/0.18)] bg-gradient-to-br from-[hsl(265_100%_98%)] via-white to-[hsl(225_100%_98%)] p-5">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[hsl(265_100%_92%)] opacity-50 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white">
            <Sparkles className="h-3 w-3" />
          </span>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]">Operational Insights</p>
        </div>
        <ul className="mt-3 space-y-1.5">
          {items.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug text-foreground">
              <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-[hsl(265_70%_55%)]" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Suggested prompts</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {prompts.map(p => (
              <button
                key={p}
                onClick={() => setActive(p)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition",
                  active === p
                    ? "border-[hsl(265_70%_55%)] bg-[hsl(265_70%_55%)] text-white"
                    : "border-border/60 bg-white/70 text-foreground hover:border-[hsl(265_70%_55%/0.4)]",
                )}
              >
                {p}
              </button>
            ))}
          </div>
          {active && (
            <div className="mt-3 rounded-xl border border-[hsl(265_70%_55%/0.18)] bg-white/80 p-3 text-[12px] leading-snug text-foreground">
              <span className="font-medium">Blossom AI · </span>
              {answerPrompt(active, items)}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function answerPrompt(p: string, fallback: string[]): string {
  if (/biggest risk|risks/i.test(p)) return fallback[0] || "No critical risks identified right now.";
  if (/trend/i.test(p)) return fallback[1] || fallback[0] || "No notable operational trends this week.";
  if (/focus|leadership/i.test(p)) return "Focus on closing the highest-risk expirations and the longest-stalled workflows. The other items are on track.";
  if (/bottleneck/i.test(p)) return fallback[2] || fallback[1] || "No bottlenecks worth escalating right now.";
  if (/payer|payor/i.test(p)) return "Anthem and United are driving most expiration-window pressure. Aetna is the primary denial contributor.";
  return fallback[0] || "All clear — nothing operationally urgent right now.";
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-secondary/20 px-6 py-8 text-center">
      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      <p className="mt-2 text-[12.5px] text-muted-foreground">{message}</p>
    </div>
  );
}

function BarRow({ label, value, max, tone = "default", right }: {
  label: string; value: number; max: number;
  tone?: "default" | "warning" | "destructive" | "success";
  right?: React.ReactNode;
}) {
  const w = max ? Math.max(2, (value / max) * 100) : 0;
  const toneClass: Record<string, string> = {
    default: "bg-[hsl(265_70%_55%)]",
    warning: "bg-amber-500",
    destructive: "bg-rose-500",
    success: "bg-emerald-500",
  };
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{right ?? value}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
        <div className={cn("h-full rounded-full transition-all", toneClass[tone])} style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}

/* ============================================================
 * REPORT #1 — Authorization Expiration Risk
 * ============================================================ */

export function AuthExpirationRiskReport() {
  const data = useMemo(() => {
    const active = A.filter(a => a.stage !== "Denied" && a.stage !== "Flaked Client");
    const withExp = active.filter(a => a.expirationDate);
    const inWindow = (lo: number | null, hi: number | null) =>
      withExp.filter(a => {
        const d = expDays(a);
        if (d === null) return false;
        if (lo !== null && d < lo) return false;
        if (hi !== null && d > hi) return false;
        return true;
      });

    const pastDue = inWindow(null, -1);
    const in14 = inWindow(0, 14);
    const in30 = inWindow(0, 30);
    const in60 = inWindow(0, 60);

    // Operational sub-risks
    const expiring = withExp.filter(a => {
      const d = expDays(a);
      return d !== null && d <= 60;
    });
    const prNotReceived = expiring.filter(a => !a.treatmentPlanReceived);
    const reassessNotStarted = expiring.filter(a => a.qaStatus === "Not Started");
    const parentSignaturesMissing = expiring.filter(a =>
      a.documents.some(d => /parent|signature|consent/i.test(d.name) && d.required && !d.received),
    );
    const qaDelays = expiring.filter(a => a.qaStatus === "In Review" && a.daysInStage >= 5);

    // Breakdowns
    const byState = groupBy(expiring, a => a.state);
    const byPayor = groupBy(expiring, a => a.payor);
    const byBcba = groupBy(expiring, a => a.qaOwner || "Unassigned");
    const byCoord = groupBy(expiring, a => a.coordinator);

    return { active, withExp, pastDue, in14, in30, in60, expiring, prNotReceived, reassessNotStarted, parentSignaturesMissing, qaDelays, byState, byPayor, byBcba, byCoord };
  }, []);

  const queue = useMemo(
    () => data.expiring.slice().sort((a, b) => (expDays(a) ?? 999) - (expDays(b) ?? 999)),
    [data],
  );

  const insights = [
    data.pastDue.length > 0
      ? `${data.pastDue.length} authorization${data.pastDue.length === 1 ? "" : "s"} are past their expiration date — start reauth or appeals immediately.`
      : `No authorizations have lapsed past their expiration date.`,
    data.in14.length > 0
      ? `${data.in14.length} auth${data.in14.length === 1 ? "" : "s"} expire within 14 days — ${data.in14.filter(a => !a.treatmentPlanReceived).length} still missing treatment plan.`
      : `No auths expire within the next 14 days.`,
    data.qaDelays.length > 0
      ? `QA delays are contributing to expiration risk on ${data.qaDelays.length} record${data.qaDelays.length === 1 ? "" : "s"} (stuck >5 days in QA).`
      : `QA review is not currently driving expiration risk.`,
  ];

  const stateRows = Object.entries(data.byState).sort((a, b) => b[1].length - a[1].length);
  const payorRows = Object.entries(data.byPayor).sort((a, b) => b[1].length - a[1].length);
  const bcbaRows = Object.entries(data.byBcba).sort((a, b) => b[1].length - a[1].length);
  const coordRows = Object.entries(data.byCoord).sort((a, b) => b[1].length - a[1].length);

  const maxState = Math.max(1, ...stateRows.map(r => r[1].length));
  const maxPayor = Math.max(1, ...payorRows.map(r => r[1].length));
  const maxBcba = Math.max(1, ...bcbaRows.map(r => r[1].length));
  const maxCoord = Math.max(1, ...coordRows.map(r => r[1].length));

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        <KpiCard label="< 14 days" value={data.in14.length} tone="destructive" icon={CalendarClock} />
        <KpiCard label="< 30 days" value={data.in30.length} tone="warning" icon={CalendarClock} />
        <KpiCard label="< 60 days" value={data.in60.length} tone="info" icon={CalendarClock} />
        <KpiCard label="Past due" value={data.pastDue.length} tone="destructive" icon={AlertTriangle} />
        <KpiCard label="PR not received" value={data.prNotReceived.length} tone="warning" icon={FileWarning} />
        <KpiCard label="Reassess not started" value={data.reassessNotStarted.length} tone="warning" icon={ClipboardCheck} />
        <KpiCard label="Parent sigs missing" value={data.parentSignaturesMissing.length} tone="warning" icon={Users} />
        <KpiCard label="QA-driven risk" value={data.qaDelays.length} tone="info" icon={Hourglass} />
      </div>

      {/* Timeline + AI */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <SectionCard
          title="Expiration timeline"
          subtitle="Open authorizations ordered by days to expiration."
          icon={CalendarClock}
          accent="hsl(28 90% 50%)"
        >
          {queue.length === 0 ? (
            <EmptyState message="No expiration risks detected." />
          ) : (
            <ul className="divide-y divide-border/60">
              {queue.slice(0, 10).map(a => {
                const d = expDays(a);
                const tone =
                  d === null ? "muted" :
                  d < 0 ? "destructive" :
                  d <= 14 ? "destructive" :
                  d <= 30 ? "warning" :
                  d <= 60 ? "info" : "success";
                const toneBg: Record<string, string> = {
                  destructive: "bg-rose-50 text-rose-700",
                  warning: "bg-amber-50 text-amber-700",
                  info: "bg-sky-50 text-sky-700",
                  success: "bg-emerald-50 text-emerald-700",
                  muted: "bg-secondary/50 text-muted-foreground",
                };
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to={`/os/authorizations`} className="text-[13px] font-semibold tracking-tight hover:text-[hsl(265_70%_55%)]">
                          {a.clientName}
                        </Link>
                        <Badge variant="secondary" className="rounded-full text-[10px] font-medium">{a.state} · {a.payor}</Badge>
                        <span className="text-[11px] text-muted-foreground">{a.authType}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                        {a.treatmentPlanReceived ? "PR received" : "PR not received"} · {a.coordinator}
                        {a.qaOwner ? ` · ${a.qaOwner}` : ""}
                      </p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums", toneBg[tone])}>
                      {d === null ? "—" : d < 0 ? `${Math.abs(d)}d past due` : `${d}d`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <AiInsightsPanel
          items={insights}
          prompts={["Summarize the biggest risks.", "What payer trends are emerging?", "What should leadership focus on?"]}
        />
      </div>

      {/* Breakdowns */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="By state" icon={MapPin}>
          <div className="space-y-2.5">
            {stateRows.map(([k, v]) => (
              <BarRow key={k} label={k} value={v.length} max={maxState} tone="warning" />
            ))}
            {stateRows.length === 0 && <EmptyState message="No state risk." />}
          </div>
        </SectionCard>

        <SectionCard title="By payer" icon={ShieldAlert}>
          <div className="space-y-2.5">
            {payorRows.map(([k, v]) => (
              <BarRow key={k} label={k} value={v.length} max={maxPayor} tone="warning" />
            ))}
            {payorRows.length === 0 && <EmptyState message="No payer risk." />}
          </div>
        </SectionCard>

        <SectionCard title="By BCBA" icon={Users}>
          <div className="space-y-2.5">
            {bcbaRows.map(([k, v]) => (
              <BarRow key={k} label={k} value={v.length} max={maxBcba} tone="warning" />
            ))}
            {bcbaRows.length === 0 && <EmptyState message="No BCBA risk." />}
          </div>
        </SectionCard>

        <SectionCard title="By coordinator" icon={Users}>
          <div className="space-y-2.5">
            {coordRows.map(([k, v]) => (
              <BarRow key={k} label={k} value={v.length} max={maxCoord} tone="warning" />
            ))}
            {coordRows.length === 0 && <EmptyState message="No coordinator load risk." />}
          </div>
        </SectionCard>
      </div>

      <ReportActions
        actions={[
          { label: "Open Auth Risk Center", to: "/os/auth-risk-center" },
          { label: "Open Supervision Tracking", to: "/os/supervision-tracking" },
          { label: "Open Authorization Workspace", to: "/os/authorizations" },
        ]}
      />
    </div>
  );
}

/* ============================================================
 * REPORT #2 — Authorization Workflow Bottlenecks
 * ============================================================ */

const STAGE_ORDER = [
  "Awaiting Submission",
  "In QA Review",
  "Submitted",
  "Approved",
  "Denied",
] as const;

export function AuthWorkflowBottleneckReport() {
  const data = useMemo(() => {
    const open = A.filter(isOpen);

    const stalledDays = 5;
    const stalled = open.filter(a => a.daysInStage >= stalledDays);
    const awaitingSubmission = open.filter(a => a.stage === "Awaiting Submission");
    const inQA = open.filter(a => a.stage === "In QA Review");
    const submitted = open.filter(a => a.stage === "Submitted");
    const missingDocs = A.filter(a => a.missingInfo || a.missingRequirements.length > 0);
    const denialsPending = A.filter(a => a.stage === "Denied");
    const prAwaiting = A.filter(a => !a.treatmentPlanReceived && a.stage !== "Denied" && a.stage !== "Flaked Client");

    const avgIn = (arr: Authorization[]) =>
      arr.length ? Math.round((arr.reduce((s, a) => s + a.daysInStage, 0) / arr.length) * 10) / 10 : 0;

    const funnel = STAGE_ORDER.map(stage => {
      const items = A.filter(a => a.stage === stage);
      return { stage, count: items.length, avgDays: avgIn(items) };
    });

    const funnelMax = Math.max(1, ...funnel.map(f => f.count));

    // Long idle
    const longIdle = open.slice().sort((a, b) => b.daysInStage - a.daysInStage).slice(0, 8);

    // Breakdowns
    const byCoord = Object.entries(groupBy(open, a => a.coordinator)).map(([k, v]) => ({
      key: k, count: v.length, avg: avgIn(v),
    })).sort((a, b) => b.avg - a.avg);

    const byPayor = Object.entries(groupBy(open, a => a.payor)).map(([k, v]) => ({
      key: k, count: v.length, avg: avgIn(v),
    })).sort((a, b) => b.avg - a.avg);

    const byState = Object.entries(groupBy(open, a => a.state)).map(([k, v]) => ({
      key: k, count: v.length, avg: avgIn(v),
    })).sort((a, b) => b.avg - a.avg);

    return {
      open, stalled, awaitingSubmission, inQA, submitted, missingDocs, denialsPending, prAwaiting,
      avgAwaiting: avgIn(awaitingSubmission), avgQA: avgIn(inQA), avgSubmitted: avgIn(submitted),
      funnel, funnelMax, longIdle, byCoord, byPayor, byState,
    };
  }, []);

  const insights = [
    data.missingDocs.length > 0
      ? `Most stalled auths are waiting on documentation — ${data.missingDocs.length} record${data.missingDocs.length === 1 ? "" : "s"} flagged with missing requirements.`
      : `No documentation gaps blocking submissions right now.`,
    data.avgQA > 0
      ? `Average time in QA Review is ${data.avgQA} day${data.avgQA === 1 ? "" : "s"} across ${data.inQA.length} record${data.inQA.length === 1 ? "" : "s"}.`
      : `QA queue is clear.`,
    data.prAwaiting.length > 0
      ? `${data.prAwaiting.length} record${data.prAwaiting.length === 1 ? "" : "s"} awaiting treatment plan from BCBA — primary continuation blocker.`
      : `All open auths have a treatment plan on file.`,
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        <KpiCard label="Open auths" value={data.open.length} tone="info" icon={Workflow} />
        <KpiCard label="Stalled ≥5d" value={data.stalled.length} tone="warning" icon={Hourglass} />
        <KpiCard label="Avg in QA" value={`${data.avgQA}d`} tone="warning" icon={Clock} />
        <KpiCard label="Avg awaiting" value={`${data.avgAwaiting}d`} tone="warning" icon={Clock} />
        <KpiCard label="Missing docs" value={data.missingDocs.length} tone="destructive" icon={FileWarning} />
        <KpiCard label="PR awaiting" value={data.prAwaiting.length} tone="warning" icon={ClipboardCheck} />
        <KpiCard label="Denials open" value={data.denialsPending.length} tone="destructive" icon={Flag} />
        <KpiCard label="Submitted" value={data.submitted.length} tone="info" icon={CheckCircle2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <SectionCard title="Workflow funnel" subtitle="Volume and aging at each stage." icon={Workflow} accent="hsl(28 90% 50%)">
          <div className="space-y-3">
            {data.funnel.map(s => (
              <div key={s.stage}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium">{s.stage}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {s.count} · avg {s.avgDays}d in stage
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary/60">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      s.stage === "Approved" ? "bg-emerald-500" :
                      s.stage === "Denied" ? "bg-rose-500" :
                      s.avgDays >= 5 ? "bg-amber-500" : "bg-[hsl(265_70%_55%)]",
                    )}
                    style={{ width: `${(s.count / data.funnelMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <AiInsightsPanel
          items={insights}
          prompts={["What bottlenecks are most severe?", "Summarize the biggest risks.", "What operational trends are worsening?"]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <SectionCard title="Long-idle records" subtitle="Oldest open authorizations by days in stage." icon={Hourglass}>
          {data.longIdle.length === 0 ? (
            <EmptyState message="No workflow bottlenecks identified." />
          ) : (
            <ul className="divide-y divide-border/60">
              {data.longIdle.map(a => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/os/authorizations`} className="text-[13px] font-semibold tracking-tight hover:text-[hsl(265_70%_55%)]">
                        {a.clientName}
                      </Link>
                      <Badge variant="secondary" className="rounded-full text-[10px] font-medium">{a.stage}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                      {a.payor} · {a.coordinator} · {a.qaStatus}
                    </p>
                  </div>
                  <span className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums",
                    a.daysInStage >= 7 ? "bg-rose-50 text-rose-700" :
                    a.daysInStage >= 5 ? "bg-amber-50 text-amber-700" :
                    "bg-secondary/50 text-muted-foreground",
                  )}>
                    {a.daysInStage}d in stage
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Aging by coordinator" subtitle="Average days in stage for open work.">
          <div className="space-y-2.5">
            {data.byCoord.map(r => (
              <BarRow
                key={r.key}
                label={r.key}
                value={r.avg}
                max={Math.max(1, ...data.byCoord.map(x => x.avg))}
                tone={r.avg >= 5 ? "destructive" : r.avg >= 3 ? "warning" : "default"}
                right={<span>{r.avg}d · {r.count} open</span>}
              />
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="By payer" icon={ShieldAlert}>
          <div className="space-y-2.5">
            {data.byPayor.map(r => (
              <BarRow
                key={r.key}
                label={r.key}
                value={r.avg}
                max={Math.max(1, ...data.byPayor.map(x => x.avg))}
                tone={r.avg >= 5 ? "destructive" : "warning"}
                right={<span>{r.avg}d · {r.count} open</span>}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="By state" icon={MapPin}>
          <div className="space-y-2.5">
            {data.byState.map(r => (
              <BarRow
                key={r.key}
                label={r.key}
                value={r.avg}
                max={Math.max(1, ...data.byState.map(x => x.avg))}
                tone={r.avg >= 5 ? "destructive" : "warning"}
                right={<span>{r.avg}d · {r.count} open</span>}
              />
            ))}
          </div>
        </SectionCard>
      </div>

      <ReportActions
        actions={[
          { label: "Open Authorization Workspace", to: "/os/authorizations" },
          { label: "Open QA Review", to: "/os/qa-team" },
          { label: "Open Missing Documentation Queue", to: "/os/auth-risk-center" },
          { label: "Open Supervision Tracking", to: "/os/supervision-tracking" },
        ]}
      />
    </div>
  );
}

/* ============================================================
 * REPORT #3 — Authorization Operational Performance
 * ============================================================ */

export function AuthOperationalPerformanceReport() {
  const data = useMemo(() => {
    const total = A.length;
    const approved = A.filter(a => a.stage === "Approved");
    const denied = A.filter(a => a.stage === "Denied");
    const decisions = approved.length + denied.length;
    const approvalRate = pct(approved.length, decisions);

    // turnaround = submitted → approved
    const turnarounds = approved
      .filter(a => a.submittedDate && a.approvedDate)
      .map(a => {
        const s = new Date(a.submittedDate!).getTime();
        const e = new Date(a.approvedDate!).getTime();
        return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
      });
    const avgTurnaround = turnarounds.length
      ? Math.round((turnarounds.reduce((s, n) => s + n, 0) / turnarounds.length) * 10) / 10
      : 0;

    // PR completion: records with treatment plan received vs requiring one
    const treatmentRecords = A.filter(a => a.authType !== "Initial");
    const prComplete = treatmentRecords.filter(a => a.treatmentPlanReceived);
    const prRate = pct(prComplete.length, treatmentRecords.length);

    // Reassessment readiness: expiring records with QA complete + PR
    const expiringNow = A.filter(a => {
      const d = expDays(a);
      return d !== null && d <= 60;
    });
    const ready = expiringNow.filter(a => a.qaStatus === "Complete" && a.treatmentPlanReceived);
    const reassessReadiness = pct(ready.length, Math.max(1, expiringNow.length));

    // QA readiness: % of open work with QA Complete
    const open = A.filter(isOpen);
    const qaReady = open.filter(a => a.qaStatus === "Complete");
    const qaReadyRate = pct(qaReady.length, Math.max(1, open.length));

    // Continuation success: treatment + expiring soon vs lapsed/denied
    const treatment = A.filter(a => a.authType === "Treatment");
    const treatmentSuccess = treatment.filter(a => a.stage === "Approved" || a.stage === "Expiring Soon");
    const continuationRate = pct(treatmentSuccess.length, Math.max(1, treatment.length));

    // Breakdowns
    const byState = Object.entries(groupBy(A, a => a.state)).map(([k, items]) => {
      const ap = items.filter(a => a.stage === "Approved").length;
      const dn = items.filter(a => a.stage === "Denied").length;
      const total = items.length;
      return { key: k, total, approved: ap, denied: dn, rate: pct(ap, Math.max(1, ap + dn)) };
    }).sort((a, b) => b.total - a.total);

    const byPayor = Object.entries(groupBy(A, a => a.payor)).map(([k, items]) => {
      const ap = items.filter(a => a.stage === "Approved").length;
      const dn = items.filter(a => a.stage === "Denied").length;
      return { key: k, total: items.length, approved: ap, denied: dn, rate: pct(ap, Math.max(1, ap + dn)) };
    }).sort((a, b) => b.total - a.total);

    const byCoord = Object.entries(groupBy(A, a => a.coordinator)).map(([k, items]) => {
      const ap = items.filter(a => a.stage === "Approved").length;
      const dn = items.filter(a => a.stage === "Denied").length;
      const ts = items.filter(a => a.submittedDate && a.approvedDate);
      const t = ts.length
        ? Math.round(ts.reduce((s, a) => {
            const s1 = new Date(a.submittedDate!).getTime();
            const e1 = new Date(a.approvedDate!).getTime();
            return s + Math.max(0, (e1 - s1) / (1000 * 60 * 60 * 24));
          }, 0) / ts.length * 10) / 10
        : 0;
      return { key: k, total: items.length, approved: ap, denied: dn, turnaround: t };
    }).sort((a, b) => b.total - a.total);

    const byBcba = Object.entries(groupBy(A, a => a.qaOwner || "Unassigned")).map(([k, items]) => ({
      key: k, total: items.length,
      complete: items.filter(a => a.qaStatus === "Complete").length,
    })).sort((a, b) => b.total - a.total);

    return {
      total, approved, denied, approvalRate, avgTurnaround, prRate, reassessReadiness,
      qaReadyRate, continuationRate, byState, byPayor, byCoord, byBcba,
    };
  }, []);

  const insights = [
    data.approvalRate >= 80
      ? `Approvals running at ${data.approvalRate}% — workflow health is strong.`
      : `Approval rate at ${data.approvalRate}% — review denial drivers and payer mix.`,
    data.avgTurnaround > 0
      ? `Average authorization turnaround is ${data.avgTurnaround} days from submission to approval.`
      : `Not enough completed cycles to compute turnaround.`,
    data.continuationRate >= 80
      ? `Continuation stability is healthy at ${data.continuationRate}% — treatment auths are staying active.`
      : `Continuation stability at ${data.continuationRate}% — some treatment auths slipping into denied/lapsed.`,
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        <KpiCard label="Approval rate" value={`${data.approvalRate}%`} tone="success" icon={CheckCircle2} />
        <KpiCard label="Turnaround" value={`${data.avgTurnaround}d`} tone="info" icon={Clock} />
        <KpiCard label="PR completion" value={`${data.prRate}%`} tone="info" icon={ClipboardCheck} />
        <KpiCard label="Reassess ready" value={`${data.reassessReadiness}%`} tone="warning" icon={CalendarClock} />
        <KpiCard label="QA readiness" value={`${data.qaReadyRate}%`} tone="info" icon={ShieldAlert} />
        <KpiCard label="Continuation" value={`${data.continuationRate}%`} tone="success" icon={TrendingUp} />
        <KpiCard label="Approvals" value={data.approved.length} tone="success" icon={CheckCircle2} />
        <KpiCard label="Denials" value={data.denied.length} tone="destructive" icon={TrendingDown} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <SectionCard title="State performance" subtitle="Approval rate and volume by state." icon={MapPin}>
          {data.byState.length === 0 ? (
            <EmptyState message="No operational performance concerns found." />
          ) : (
            <ul className="divide-y divide-border/60">
              {data.byState.map(s => (
                <li key={s.key} className="py-2.5">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-semibold tracking-tight">{s.key}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.approved} approved · {s.denied} denied · {s.total} total
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        s.rate >= 80 ? "bg-emerald-500" : s.rate >= 60 ? "bg-amber-500" : "bg-rose-500",
                      )}
                      style={{ width: `${s.rate}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{s.rate}% approval (of decided)</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <AiInsightsPanel
          items={insights}
          prompts={["What should leadership focus on?", "What payer trends are emerging?", "What operational trends are worsening?"]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Payer performance" subtitle="Approval rate by payer." icon={ShieldAlert}>
          <ul className="divide-y divide-border/60">
            {data.byPayor.map(p => (
              <li key={p.key} className="py-2.5">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-medium">{p.key}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {p.approved} / {p.denied + p.approved} decided · {p.total} total
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
                  <div
                    className={cn("h-full rounded-full", p.rate >= 80 ? "bg-emerald-500" : p.rate >= 60 ? "bg-amber-500" : "bg-rose-500")}
                    style={{ width: `${p.rate}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{p.rate}% approval</p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Coordinator performance" subtitle="Turnaround and volume by coordinator." icon={Users}>
          <ul className="divide-y divide-border/60">
            {data.byCoord.map(c => (
              <li key={c.key} className="flex items-center justify-between py-2.5 text-[12.5px]">
                <div className="min-w-0">
                  <p className="font-medium">{c.key}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {c.approved} approved · {c.denied} denied · {c.total} total
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary/50 px-2.5 py-1 text-[11px] font-medium tabular-nums text-muted-foreground">
                  {c.turnaround}d turnaround
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <ReportActions
        actions={[
          { label: "Open Authorizations", to: "/os/authorizations" },
          { label: "Open Auth Risk Center", to: "/os/auth-risk-center" },
          { label: "Open Workflow Bottlenecks", to: "/reports/auth-workflow-bottleneck" },
        ]}
      />
    </div>
  );
}

/* ============================================================
 * Shared action footer
 * ============================================================ */

function ReportActions({ actions }: { actions: { label: string; to: string }[] }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
        <h3 className="text-[14px] font-semibold tracking-tight">Next operational actions</h3>
      </div>
      <p className="mt-1 text-[11.5px] text-muted-foreground">Jump into the workflows that resolve what this report surfaced.</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {actions.map(a => (
          <Link
            key={a.to + a.label}
            to={a.to}
            className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 px-3 py-2.5 transition hover:border-[hsl(265_70%_55%/0.3)] hover:bg-secondary/50"
          >
            <span className="text-[12.5px] font-medium">{a.label}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        ))}
        <Button variant="outline" size="sm" className="justify-between">
          Export report <ArrowRight className="ml-2 h-3.5 w-3.5" />
        </Button>
      </div>
    </section>
  );
}

/* ============================================================
 * Dispatcher
 * ============================================================ */

export const AUTH_REPORT_IDS = new Set([
  "auth-expiration-risk",
  "auth-workflow-bottleneck",
  "auth-operational-performance",
]);

export function renderAuthReport(id: string) {
  if (id === "auth-expiration-risk") return <AuthExpirationRiskReport />;
  if (id === "auth-workflow-bottleneck") return <AuthWorkflowBottleneckReport />;
  if (id === "auth-operational-performance") return <AuthOperationalPerformanceReport />;
  return null;
}