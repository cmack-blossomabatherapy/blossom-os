import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2, Calendar, CalendarClock, AlertTriangle, MessageSquare,
  X, ChevronRight, Activity, CheckCircle2, UserCheck, Users, Phone, UserX,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useBcbaCaseload, daysSince, type Severity } from "@/hooks/useBcbaCaseload";
import type { ClientPairing } from "@/hooks/useCentralReachOps";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useBcbaActionDialogs, BcbaQuickActionBar, BcbaTaskList } from "@/components/bcba/BcbaActionDialogs";
import { BcbaClientTimeline } from "@/components/bcba/BcbaClientTimeline";

type Stability = "stable" | "watch" | "needs_attention" | "at_risk";

const stabilityMeta: Record<Stability, { label: string; dot: string; ring: string; text: string }> = {
  stable:           { label: "Stable",          dot: "bg-emerald-500", ring: "ring-emerald-200 dark:ring-emerald-500/30", text: "text-emerald-700 dark:text-emerald-300" },
  watch:            { label: "Watch",           dot: "bg-sky-500",     ring: "ring-sky-200 dark:ring-sky-500/30",         text: "text-sky-700 dark:text-sky-300" },
  needs_attention:  { label: "Needs attention", dot: "bg-amber-500",   ring: "ring-amber-200 dark:ring-amber-500/30",     text: "text-amber-700 dark:text-amber-300" },
  at_risk:          { label: "At risk",         dot: "bg-rose-500",    ring: "ring-rose-200 dark:ring-rose-500/30",       text: "text-rose-700 dark:text-rose-300" },
};

const sevChip: Record<Severity, string> = {
  crit: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  warn: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  info: "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
};

interface SchedRow {
  client: ClientPairing;
  stability: Stability;
  rbtDays: number | null;
  reasons: { label: string; tone: Severity }[];
  urgency: number;
  recommendedAction: string;
  weeklyHours: number;
  coverageLevel: "uncovered" | "at_risk" | "covered" | null;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}
function firstName(n: string | null | undefined) {
  if (!n) return "there";
  return n.trim().split(/\s+/)[0];
}
function relative(iso: string | null): string {
  if (!iso) return "—";
  const d = daysSince(iso);
  if (d === null) return "—";
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}
function addDayLabel(offset: number): string {
  const t = new Date(Date.now() + offset * 86_400_000);
  return t.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function Card({ className, children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl bg-card text-card-foreground border border-border/70 p-5",
        "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
        onClick && "cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-border",
        className,
      )}
    >{children}</div>
  );
}

function StatTile({ label, value, hint, tone }: { label: string; value: number | string; hint?: string; tone?: Stability }) {
  return (
    <div className="rounded-2xl bg-muted/50 border border-border/60 p-4">
      <div className="flex items-center gap-2">
        {tone && <span className={cn("size-1.5 rounded-full", stabilityMeta[tone].dot)} />}
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl font-medium tracking-tight text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function OSBCBAScheduling() {
  const c = useBcbaCaseload();
  const [active, setActive] = useState<string | null>(null);

  const rows: SchedRow[] = useMemo(() => {
    return c.caseload.map((client) => {
      const rbtDays = daysSince(client.lastRbtSessionDate);
      const cov = c.coverageAlerts.find((x) => x.clientName === client.clientName) ?? null;
      const weeklyHours = client.rbtHoursLast7d;
      const reasons: { label: string; tone: Severity }[] = [];
      let urgency = 0;

      if (!client.rbtName) {
        reasons.push({ label: "No assigned RBT", tone: "crit" });
        urgency += 70;
      }
      if (rbtDays === null) {
        reasons.push({ label: "No recent sessions", tone: "crit" });
        urgency += 50;
      } else if (rbtDays >= 14) {
        reasons.push({ label: `Last session ${rbtDays}d ago`, tone: "crit" });
        urgency += 50;
      } else if (rbtDays >= 7) {
        reasons.push({ label: `Last session ${rbtDays}d ago`, tone: "warn" });
        urgency += 25;
      }

      if (cov?.level === "uncovered") {
        reasons.push({ label: "Uncovered schedule", tone: "crit" });
        urgency += 40;
      } else if (cov?.level === "at_risk") {
        reasons.push({ label: "Coverage at risk", tone: "warn" });
        urgency += 20;
      }

      if (client.cancellationsLast30d >= 4) {
        reasons.push({ label: `${client.cancellationsLast30d} cancellations / 30d`, tone: "crit" });
        urgency += 35;
      } else if (client.cancellationsLast30d >= 2) {
        reasons.push({ label: `${client.cancellationsLast30d} cancellations / 30d`, tone: "warn" });
        urgency += 15;
      }

      if (weeklyHours === 0 && client.rbtName) {
        reasons.push({ label: "No hours this week", tone: "warn" });
        urgency += 20;
      }

      const stability: Stability =
        urgency >= 70 ? "at_risk" :
        urgency >= 35 ? "needs_attention" :
        urgency >= 10 ? "watch" : "stable";

      const recommendedAction =
        stability === "at_risk" ? "Contact scheduling today" :
        stability === "needs_attention" ? "Review coverage with scheduling" :
        stability === "watch" ? "Monitor attendance this week" : "On track";

      return {
        client, stability, rbtDays, reasons, urgency, recommendedAction,
        weeklyHours, coverageLevel: cov?.level ?? null,
      };
    });
  }, [c.caseload, c.coverageAlerts]);

  const counts = useMemo(() => {
    const stable = rows.filter((r) => r.stability === "stable").length;
    const watch = rows.filter((r) => r.stability === "watch").length;
    const attention = rows.filter((r) => r.stability === "needs_attention").length;
    const atRisk = rows.filter((r) => r.stability === "at_risk").length;
    const cancellations = c.caseload.reduce((s, p) => s + p.cancellationsLast30d, 0);
    const staffingConcerns = rows.filter((r) => !r.client.rbtName || (r.rbtDays !== null && r.rbtDays >= 14)).length;
    const coordItems = rows.filter((r) => r.urgency >= 20).length;
    return { stable, watch, attention, atRisk, cancellations, staffingConcerns, coordItems };
  }, [rows, c.caseload]);

  const queue = useMemo(
    () => [...rows].sort((a, b) => b.urgency - a.urgency).filter((r) => r.urgency > 0).slice(0, 8),
    [rows],
  );

  const upcomingWeek = useMemo(() => {
    const items = [...rows]
      .filter((r) => r.stability !== "stable")
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 7);
    return items.map((row, i) => ({ row, day: addDayLabel(i + 1) }));
  }, [rows]);

  const activeRow = useMemo(
    () => (active ? rows.find((r) => r.client.clientName === active) ?? null : null),
    [active, rows],
  );

  const clientOptions = useMemo(() => c.caseload.map((p) => p.clientName), [c.caseload]);
  const bcba = useBcbaActionDialogs({
    scope: { clientName: active ?? undefined, bcbaName: c.resolvedBcba },
    clientOptions,
    defaultSourceArea: "scheduling",
  });

  return (
    <OSShell>
      <div className="space-y-10 px-4 pb-16 pt-6 md:px-8">

        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
          <div className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">My Scheduling Visibility</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {firstName(c.profileMatched ? c.profileName : c.resolvedBcba)}'s schedule pulse
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                {c.loading ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Loading scheduling signals…</span>
                ) : c.caseload.length === 0 ? (
                  "No active clients on your caseload."
                ) : (
                  <>
                    <b className="text-foreground">{c.caseload.length}</b> active clients ·{" "}
                    <b className="text-foreground">{counts.attention + counts.atRisk}</b> with scheduling concerns ·{" "}
                    <b className="text-foreground">{counts.staffingConcerns}</b> staffing concerns ·{" "}
                    <b className="text-foreground">{counts.coordItems}</b> coordination items
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col items-start gap-1 md:items-end">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                {c.profileMatched ? "Caseload" : "Viewing as"}
              </label>
              <select
                className="h-10 rounded-xl border border-border bg-muted/60 px-3 text-sm font-medium text-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
                value={c.resolvedBcba ?? ""}
                onChange={(e) => c.setSelectedBcba(e.target.value || null)}
                disabled={c.bcbaOptions.length === 0}
              >
                {c.bcbaOptions.length === 0 ? (
                  <option value="">No BCBAs found</option>
                ) : (
                  c.bcbaOptions.map((b) => (
                    <option key={b.name} value={b.name}>{b.name} · {b.distinctClients} clients</option>
                  ))
                )}
              </select>
            </div>
          </div>
        </header>

        {/* Overview */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <StatTile label="Stable"            value={counts.stable}          tone="stable" />
          <StatTile label="Watch"             value={counts.watch}           tone="watch" />
          <StatTile label="Needs attention"   value={counts.attention}       tone="needs_attention" />
          <StatTile label="At risk"           value={counts.atRisk}          tone="at_risk" />
          <StatTile label="Cancellations 30d" value={counts.cancellations}   hint="across caseload" />
          <StatTile label="Staffing concerns" value={counts.staffingConcerns} hint="RBT instability" />
          <StatTile label="Coordination"      value={counts.coordItems}      hint="needs follow-up" />
        </section>

        {/* Priority queue */}
        <Section title="Scheduling priority" action={
          <Link to="/bcba/scheduling" className="text-xs font-medium text-primary hover:underline">Message scheduling →</Link>
        }>
          {c.loading ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted/60 animate-pulse" />)}
            </div>
          ) : queue.length === 0 ? (
            <Card className="border-dashed bg-muted/30 text-center">
              <CheckCircle2 className="mx-auto size-6 text-emerald-600 dark:text-emerald-400" />
              <p className="mt-2 text-sm text-muted-foreground">Schedules are stable across your caseload.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {queue.map((r) => (
                <Card key={r.client.clientName} onClick={() => setActive(r.client.clientName)}>
                  <div className="flex items-start gap-3">
                    <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{initials(r.client.clientName)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">{r.client.clientName}</p>
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1", stabilityMeta[r.stability].text, stabilityMeta[r.stability].ring)}>
                          <span className={cn("size-1.5 rounded-full", stabilityMeta[r.stability].dot)} />
                          {stabilityMeta[r.stability].label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {r.client.rbtName ?? "Unassigned"} · last session {relative(r.client.lastRbtSessionDate)}
                      </p>
                    </div>
                  </div>

                  {r.reasons.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.reasons.slice(0, 3).map((b, i) => (
                        <span key={i} className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sevChip[b.tone])}>{b.label}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Next:</span> {r.recommendedAction}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-foreground/70">Open <ChevronRight className="size-3.5" /></span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Section>

        {/* Caseload schedule stability */}
        <Section title="Caseload schedule stability">
          {c.loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-muted/60 animate-pulse" />)}
            </div>
          ) : rows.length === 0 ? (
            <Card className="border-dashed bg-muted/30 text-center text-sm text-muted-foreground">No clients on your caseload.</Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...rows].sort((a, b) => b.urgency - a.urgency).map((r) => (
                <Card key={r.client.clientName} onClick={() => setActive(r.client.clientName)}>
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{initials(r.client.clientName)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">{r.client.clientName}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {r.client.rbtName ?? "Unassigned"}{r.client.state ? ` · ${r.client.state}` : ""}
                      </p>
                    </div>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1", stabilityMeta[r.stability].text, stabilityMeta[r.stability].ring)}>
                      <span className={cn("size-1.5 rounded-full", stabilityMeta[r.stability].dot)} />
                      {stabilityMeta[r.stability].label}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="uppercase tracking-widest text-muted-foreground">Hours 7d</p>
                      <p className="mt-0.5 font-medium text-foreground">{r.weeklyHours.toFixed(1)}h</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="uppercase tracking-widest text-muted-foreground">Last session</p>
                      <p className="mt-0.5 font-medium text-foreground">{relative(r.client.lastRbtSessionDate)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="uppercase tracking-widest text-muted-foreground">Cxl 30d</p>
                      <p className="mt-0.5 font-medium text-foreground">{r.client.cancellationsLast30d}</p>
                    </div>
                  </div>

                  {/* Weekly pattern sparkline */}
                  {r.client.weeklyPattern && r.client.weeklyPattern.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1 text-[11px] uppercase tracking-widest text-muted-foreground">This week</p>
                      <div className="flex items-end gap-1 h-10">
                        {r.client.weeklyPattern.map((d) => {
                          const max = Math.max(...r.client.weeklyPattern.map((x) => x.hours), 1);
                          const pct = (d.hours / max) * 100;
                          return (
                            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                              <div
                                className={cn("w-full rounded-sm", d.hours > 0 ? "bg-primary/60" : "bg-muted")}
                                style={{ height: `${Math.max(4, pct)}%` }}
                              />
                              <span className="text-[9px] text-muted-foreground">{d.day[0]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </Section>

        {/* Cancellation & attendance */}
        <Section title="Cancellation & attendance">
          {c.cancellationAlerts.length === 0 ? (
            <Card className="border-dashed bg-muted/30 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="mx-auto mb-1 size-5 text-emerald-600 dark:text-emerald-400" />
              No repeated cancellation patterns on your caseload.
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {c.cancellationAlerts.slice(0, 8).map((p) => (
                <Card key={p.clientName} onClick={() => setActive(p.clientName)} className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={cn("mt-0.5 size-4",
                      p.cancellationsLast30d >= 4 ? "text-rose-500" : "text-amber-500"
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{p.clientName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {p.cancellationsLast30d} cancellations / 30d · {p.rbtName ?? "Unassigned"}
                      </p>
                    </div>
                    <ChevronRight className="mt-1 size-4 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Section>

        {/* Staffing stability visibility */}
        <Section title="Staffing stability" action={
          <span className="text-xs text-muted-foreground">Visibility only</span>
        }>
          {(() => {
            const staffing = rows.filter((r) => !r.client.rbtName || (r.rbtDays !== null && r.rbtDays >= 14) || r.coverageLevel === "uncovered");
            if (staffing.length === 0) {
              return <Card className="border-dashed bg-muted/30 text-center text-sm text-muted-foreground">No staffing instability detected.</Card>;
            }
            return (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {staffing.slice(0, 6).map((r) => (
                  <Card key={r.client.clientName} onClick={() => setActive(r.client.clientName)}>
                    <div className="flex items-start gap-3">
                      <UserX className="mt-0.5 size-4 text-rose-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{r.client.clientName}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {!r.client.rbtName ? "Awaiting RBT assignment" :
                           r.rbtDays === null ? "No recent sessions" :
                           `Last RBT session ${r.rbtDays}d ago`}
                        </p>
                      </div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">Coordinate</span>
                    </div>
                  </Card>
                ))}
              </div>
            );
          })()}
        </Section>

        {/* Parent training scheduling visibility */}
        <Section title="Parent training scheduling" action={
          <Link to="/bcba/parent-training" className="text-xs font-medium text-primary hover:underline">Open parent training →</Link>
        }>
          {(() => {
            const pt = rows.filter((r) => {
              const d = daysSince(r.client.lastBcbaSessionDate);
              return d === null || d >= 14;
            });
            if (pt.length === 0) {
              return <Card className="border-dashed bg-muted/30 text-center text-sm text-muted-foreground">Parent training cadence is on track.</Card>;
            }
            return (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {pt.slice(0, 6).map((r) => (
                  <Card key={r.client.clientName} onClick={() => setActive(r.client.clientName)}>
                    <div className="flex items-start gap-3">
                      <CalendarClock className="mt-0.5 size-4 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{r.client.clientName}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          Last 97156 {relative(r.client.lastBcbaSessionDate)}
                        </p>
                      </div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">Schedule</span>
                    </div>
                  </Card>
                ))}
              </div>
            );
          })()}
        </Section>

        {/* Upcoming coordination */}
        <Section title="Upcoming coordination" action={
          <Link to="/bcba/scheduling" className="text-xs font-medium text-primary hover:underline">Open scheduling →</Link>
        }>
          {upcomingWeek.length === 0 ? (
            <Card className="border-dashed bg-muted/30 text-center text-sm text-muted-foreground">Nothing to coordinate this week.</Card>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
              {upcomingWeek.map(({ row, day }, i) => (
                <button
                  key={`${row.client.clientName}-${i}`}
                  onClick={() => setActive(row.client.clientName)}
                  className="group rounded-2xl border border-border/60 bg-card p-3 text-left transition hover:-translate-y-0.5 hover:border-border"
                >
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{day}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">{row.client.clientName}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{row.client.rbtName ?? "Unassigned"}</p>
                  <span className={cn("mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1", stabilityMeta[row.stability].text, stabilityMeta[row.stability].ring)}>
                    <span className={cn("size-1 rounded-full", stabilityMeta[row.stability].dot)} />
                    {stabilityMeta[row.stability].label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Risk indicators */}
        <Section title="Scheduling risk indicators">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {rows.filter((r) => r.reasons.length > 0).slice(0, 8).map((r) => (
              <Card key={r.client.clientName} onClick={() => setActive(r.client.clientName)} className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={cn("mt-0.5 size-4",
                    r.stability === "at_risk" ? "text-rose-500" :
                    r.stability === "needs_attention" ? "text-amber-500" : "text-sky-500"
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{r.client.clientName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.reasons[0]?.label}</p>
                  </div>
                  <ChevronRight className="mt-1 size-4 text-muted-foreground" />
                </div>
              </Card>
            ))}
            {rows.filter((r) => r.reasons.length > 0).length === 0 && (
              <Card className="border-dashed bg-muted/30 text-center text-sm text-muted-foreground md:col-span-2">
                <CheckCircle2 className="mx-auto mb-1 size-5 text-emerald-600 dark:text-emerald-400" />
                No active scheduling risks.
              </Card>
            )}
          </div>
        </Section>

        {/* Persisted scheduling coordination workflow */}
        <Section title="Scheduling coordination">
          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Scheduling coordination notes and tasks — visibility only, scheduling remains owned by the scheduling team.</p>
              <BcbaQuickActionBar
                onNote={() => bcba.openNote()}
                onTask={() => bcba.openTask()}
                onSupervision={() => bcba.openSupervision()}
                onParentTraining={() => bcba.openParentTraining()}
              />
              <BcbaClientTimeline scope={{}} className="mt-4" />
            </div>
            <BcbaTaskList
              tasks={bcba.workflow.tasks.filter((t) => t.status !== "completed" && t.source_area === "scheduling").slice(0, 6)}
              onComplete={(id) => bcba.workflow.completeTask(id)}
              empty="No open scheduling coordination items."
            />
          </Card>
        </Section>

        {/* Quick actions */}
        <section>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <QuickAction to="/bcba/clients"          icon={UserCheck}      label="Open clients" />
            <QuickAction to="/bcba/workspace"        icon={Activity}       label="Open workspace" />
            <QuickAction to="/bcba/scheduling"            icon={MessageSquare}  label="Contact scheduling" />
            <QuickAction to="/bcba/parent-training"  icon={CalendarClock}  label="Parent training" />
            <QuickAction to="/bcba/supervision"      icon={Users}          label="Supervision" />
          </div>
        </section>
      </div>

      {/* Side panel */}
      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {activeRow && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-xl">{activeRow.client.clientName}</SheetTitle>
                  <button onClick={() => setActive(null)} className="rounded-full p-1 hover:bg-muted"><X className="size-4" /></button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activeRow.client.rbtName ?? "Unassigned"}{activeRow.client.state ? ` · ${activeRow.client.state}` : ""}
                </p>
              </SheetHeader>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1", stabilityMeta[activeRow.stability].text, stabilityMeta[activeRow.stability].ring)}>
                  <span className={cn("size-1.5 rounded-full", stabilityMeta[activeRow.stability].dot)} />
                  {stabilityMeta[activeRow.stability].label}
                </span>
                {activeRow.reasons.slice(0, 3).map((b, i) => (
                  <span key={i} className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sevChip[b.tone])}>{b.label}</span>
                ))}
              </div>

              <div className="mt-6 space-y-5">
                <PanelSection title="Schedule snapshot">
                  <KV k="Hours last 7d"        v={`${activeRow.client.rbtHoursLast7d.toFixed(1)}h`} />
                  <KV k="Hours last 30d"       v={`${activeRow.client.rbtHoursLast30d.toFixed(1)}h`} />
                  <KV k="Last RBT session"     v={relative(activeRow.client.lastRbtSessionDate)} />
                  <KV k="Last BCBA session"    v={relative(activeRow.client.lastBcbaSessionDate)} />
                  <KV k="Recommended action"   v={activeRow.recommendedAction} />
                </PanelSection>

                <PanelSection title="Attendance & staffing">
                  <KV k="Cancellations 30d"    v={String(activeRow.client.cancellationsLast30d)} />
                  <KV k="Coverage status"      v={activeRow.coverageLevel ? activeRow.coverageLevel.replace("_", " ") : "covered"} />
                  <KV k="Assigned RBT"         v={activeRow.client.rbtName ?? "Unassigned"} />
                </PanelSection>

                {activeRow.reasons.length > 0 && (
                  <PanelSection title="Why it matters">
                    <div className="space-y-1.5">
                      {activeRow.reasons.map((b, i) => (
                        <div key={i} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-xs", sevChip[b.tone])}>
                          <AlertTriangle className="size-3.5" />
                          {b.label}
                        </div>
                      ))}
                    </div>
                  </PanelSection>
                )}

                <PanelSection title="Quick actions">
                  <div className="grid grid-cols-2 gap-2">
                    <PanelLink to="/bcba/clients" icon={UserCheck}>Open client</PanelLink>
                    <PanelLink to="/bcba/parent-training" icon={CalendarClock}>Parent training</PanelLink>
                    <PanelLink to="/bcba/supervision" icon={Users}>Supervision</PanelLink>
                    <PanelLink to="/bcba/workspace" icon={Calendar}>Open workspace</PanelLink>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted" onClick={() => bcba.openNote(activeRow.client.clientName)}>Add scheduling note</button>
                    <button type="button" className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted" onClick={() => bcba.openTask(activeRow.client.clientName)}>Coordination task</button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                      onClick={async () => {
                        try {
                          await bcba.workflow.createTask({
                            client_name: activeRow.client.clientName,
                            source_area: "scheduling",
                            title: `Escalate scheduling blocker: ${activeRow.client.clientName}`,
                            priority: "high",
                            status: "escalated",
                          });
                        } catch { /* toast handled by callers when using dialogs; keep quiet here */ }
                      }}
                    >Escalate blocker</button>
                  </div>
                </PanelSection>

                {activeRow.client.rbtName && (
                  <PanelSection title="RBT contact">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Assigned RBT</span>
                      <span className="font-medium text-foreground">{activeRow.client.rbtName}</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted">
                        <Phone className="size-3.5 text-muted-foreground" /> Call
                      </button>
                      <button className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted">
                        <MessageSquare className="size-3.5 text-muted-foreground" /> Message
                      </button>
                    </div>
                  </PanelSection>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      {bcba.dialogs}
    </OSShell>
  );
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 space-y-1">{children}</div>
    </div>
  );
}
function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-foreground text-right">{v}</span>
    </div>
  );
}
function QuickAction({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="group flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 text-sm font-medium text-foreground backdrop-blur transition hover:-translate-y-0.5 hover:border-border">
      <Icon className="size-4 text-muted-foreground group-hover:text-primary" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
function PanelLink({ to, icon: Icon, children }: { to: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted">
      <Icon className="size-3.5 text-muted-foreground" />
      {children}
    </Link>
  );
}