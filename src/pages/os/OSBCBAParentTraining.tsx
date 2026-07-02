import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2, HeartHandshake, AlertTriangle, CalendarClock, MessageSquare, Sparkles,
  X, ChevronRight, Activity, CheckCircle2, UserCheck, Users, FileSignature, Phone,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useBcbaCaseload, daysSince, daysUntil, type Severity } from "@/hooks/useBcbaCaseload";
import type { ClientPairing } from "@/hooks/useCentralReachOps";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// Parent training (97156) cadence target — calm default, weekly touchpoint
const PT_TARGET_DAYS = 14;

type Engagement = "engaged" | "stable" | "watch" | "needs_support";

const engagementMeta: Record<Engagement, { label: string; dot: string; ring: string; text: string }> = {
  engaged:      { label: "Engaged",        dot: "bg-emerald-500", ring: "ring-emerald-200 dark:ring-emerald-500/30", text: "text-emerald-700 dark:text-emerald-300" },
  stable:       { label: "Stable",         dot: "bg-sky-500",     ring: "ring-sky-200 dark:ring-sky-500/30",         text: "text-sky-700 dark:text-sky-300" },
  watch:        { label: "Watch",          dot: "bg-amber-500",   ring: "ring-amber-200 dark:ring-amber-500/30",     text: "text-amber-700 dark:text-amber-300" },
  needs_support:{ label: "Needs support",  dot: "bg-rose-500",    ring: "ring-rose-200 dark:ring-rose-500/30",       text: "text-rose-700 dark:text-rose-300" },
};

const sevChip: Record<Severity, string> = {
  crit: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  warn: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  info: "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
};

interface PtRow {
  client: ClientPairing;
  engagement: Engagement;
  ptDays: number | null;
  authDue: number | null;
  progressPct: number;
  reasons: { label: string; tone: Severity }[];
  urgency: number;
  recommendedAction: string;
  caregiverName: string;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}
function firstName(n: string | null | undefined) {
  if (!n) return "there";
  return n.trim().split(/\s+/)[0];
}
function caregiverFor(clientName: string) {
  // We don't have caregiver records — derive a calm operational label.
  return `${clientName.split(/\s+/)[0]}'s caregiver`;
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
function addDays(iso: string | null, days: number): string {
  const base = iso ? new Date(iso).getTime() : Date.now();
  const t = new Date(base + days * 86_400_000);
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

function StatTile({ label, value, hint, tone }: { label: string; value: number | string; hint?: string; tone?: Engagement }) {
  return (
    <div className="rounded-2xl bg-muted/50 border border-border/60 p-4">
      <div className="flex items-center gap-2">
        {tone && <span className={cn("size-1.5 rounded-full", engagementMeta[tone].dot)} />}
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

export default function OSBCBAParentTraining() {
  const c = useBcbaCaseload();
  const [active, setActive] = useState<string | null>(null);

  const rows: PtRow[] = useMemo(() => {
    return c.caseload.map((client) => {
      const auth = c.authByClient.get(client.clientName.toLowerCase()) ?? null;
      // Parent training touchpoint proxy: use BCBA-side session recency.
      // (Real 97156 separation will be wired when caregiver records exist.)
      const ptDays = daysSince(client.lastBcbaSessionDate);
      const authDue = daysUntil(auth?.nextTaskDue ?? null);
      const reasons: { label: string; tone: Severity }[] = [];
      let urgency = 0;

      if (ptDays === null) { reasons.push({ label: "No parent training on record", tone: "crit" }); urgency += 70; }
      else if (ptDays >= 30) { reasons.push({ label: `Parent training ${ptDays}d ago`, tone: "crit" }); urgency += 60; }
      else if (ptDays >= PT_TARGET_DAYS) { reasons.push({ label: `Last 97156 ${ptDays}d ago`, tone: "warn" }); urgency += 30; }

      if (client.cancellationsLast30d >= 3) { reasons.push({ label: `${client.cancellationsLast30d} cancellations in 30d`, tone: "warn" }); urgency += 30; }
      else if (client.cancellationsLast30d >= 2) { reasons.push({ label: `${client.cancellationsLast30d} cancellations`, tone: "info" }); urgency += 10; }

      const cov = c.coverageAlerts.find((x) => x.clientName === client.clientName) ?? null;
      if (cov?.level === "uncovered") { reasons.push({ label: "Scheduling unstable", tone: "crit" }); urgency += 25; }
      else if (cov?.level === "at_risk") { reasons.push({ label: "Scheduling at risk", tone: "warn" }); urgency += 12; }

      // New family signal (RBT active in last 14d, no PT yet)
      const rbtDays = daysSince(client.lastRbtSessionDate);
      if (rbtDays !== null && rbtDays <= 14 && (ptDays === null || ptDays >= PT_TARGET_DAYS)) {
        reasons.push({ label: "Newly onboarded family", tone: "info" });
        urgency += 15;
      }

      if (auth && (auth.stage === "Expiring Soon" || (authDue !== null && authDue <= 14))) {
        reasons.push({ label: `PR due ${authDue !== null ? authDue + "d" : "soon"}`, tone: authDue !== null && authDue <= 7 ? "crit" : "warn" });
        urgency += authDue !== null && authDue <= 7 ? 30 : 15;
      }

      const engagement: Engagement =
        urgency >= 60 ? "needs_support" :
        urgency >= 30 ? "watch" :
        urgency >= 10 ? "stable" : "engaged";

      const progressPct = ptDays === null
        ? 0
        : Math.max(0, Math.min(100, Math.round(((PT_TARGET_DAYS - ptDays) / PT_TARGET_DAYS) * 100)));

      const recommendedAction =
        engagement === "needs_support" ? "Reach out to caregiver this week" :
        engagement === "watch" ? "Schedule parent training in next 7 days" :
        engagement === "stable" ? "Confirm next session" : "On track";

      return {
        client, engagement, ptDays, authDue, progressPct, reasons, urgency,
        recommendedAction, caregiverName: caregiverFor(client.clientName),
      };
    });
  }, [c.caseload, c.authByClient, c.coverageAlerts]);

  const counts = useMemo(() => {
    const upcoming = rows.filter((r) => r.engagement === "watch" || r.engagement === "needs_support").length;
    const overdue  = rows.filter((r) => r.ptDays === null || (r.ptDays !== null && r.ptDays >= PT_TARGET_DAYS)).length;
    const concerns = rows.filter((r) => r.engagement === "needs_support").length;
    const completedWeek = c.caseload.filter((p) => { const d = daysSince(p.lastBcbaSessionDate); return d !== null && d <= 7; }).length;
    const schedRisk = rows.filter((r) => r.reasons.some((x) => x.label.startsWith("Scheduling"))).length;
    const atRisk = rows.filter((r) => r.urgency >= 60).length;
    return { upcoming, overdue, concerns, completedWeek, schedRisk, atRisk };
  }, [rows, c.caseload]);

  const queue = useMemo(
    () => [...rows].sort((a, b) => b.urgency - a.urgency).filter((r) => r.urgency > 0).slice(0, 8),
    [rows],
  );

  const upcomingWeek = useMemo(() => {
    return [...rows]
      .filter((r) => r.engagement !== "engaged")
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 7)
      .map((r, i) => ({ row: r, day: addDays(null, i + 1) }));
  }, [rows]);

  const activeRow = useMemo(
    () => (active ? rows.find((r) => r.client.clientName === active) ?? null : null),
    [active, rows],
  );
  const activeAuth = useMemo(
    () => (active ? c.authByClient.get(active.toLowerCase()) ?? null : null),
    [active, c.authByClient],
  );

  return (
    <OSShell>
      <div className="space-y-10 px-4 pb-16 pt-6 md:px-8">

        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
          <div className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">My Parent Trainings</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {firstName(c.profileMatched ? c.profileName : c.resolvedBcba)}'s caregivers
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                {c.loading ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Loading caregiver signals…</span>
                ) : c.caseload.length === 0 ? (
                  "No active families on your caseload."
                ) : (
                  <>
                    <b className="text-foreground">{c.caseload.length}</b> active families ·{" "}
                    <b className="text-foreground">{counts.upcoming}</b> sessions to plan ·{" "}
                    <b className="text-foreground">{counts.overdue}</b> overdue ·{" "}
                    <b className="text-foreground">{counts.concerns}</b> engagement concerns
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
          <StatTile label="Active families"   value={c.caseload.length} />
          <StatTile label="Upcoming"          value={counts.upcoming}   tone="watch" hint="plan this week" />
          <StatTile label="Overdue"           value={counts.overdue}    tone="needs_support" />
          <StatTile label="Engagement risk"   value={counts.concerns}   tone="needs_support" />
          <StatTile label="Completed / 7d"    value={counts.completedWeek} hint="recent touchpoints" />
          <StatTile label="Scheduling risk"   value={counts.schedRisk}  hint="instability" />
          <StatTile label="At risk"           value={counts.atRisk}     hint="needs follow-up" />
        </section>

        {/* Priority queue */}
        <Section title="Parent training priority" action={
          <Link to="/bcba/scheduling" className="text-xs font-medium text-primary hover:underline">Open schedule →</Link>
        }>
          {c.loading ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted/60 animate-pulse" />)}
            </div>
          ) : queue.length === 0 ? (
            <Card className="border-dashed bg-muted/30 text-center">
              <CheckCircle2 className="mx-auto size-6 text-emerald-600 dark:text-emerald-400" />
              <p className="mt-2 text-sm text-muted-foreground">All families are on track for parent training.</p>
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
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1", engagementMeta[r.engagement].text, engagementMeta[r.engagement].ring)}>
                          <span className={cn("size-1.5 rounded-full", engagementMeta[r.engagement].dot)} />
                          {engagementMeta[r.engagement].label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {r.caregiverName} · last 97156 {relative(r.client.lastBcbaSessionDate)}
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

        {/* Family engagement cards */}
        <Section title="Family engagement">
          {c.loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-muted/60 animate-pulse" />)}
            </div>
          ) : rows.length === 0 ? (
            <Card className="border-dashed bg-muted/30 text-center text-sm text-muted-foreground">No families on your caseload.</Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...rows].sort((a, b) => b.urgency - a.urgency).map((r) => (
                <Card key={r.client.clientName} onClick={() => setActive(r.client.clientName)}>
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{initials(r.client.clientName)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">{r.client.clientName}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {r.caregiverName}{r.client.state ? ` · ${r.client.state}` : ""}
                      </p>
                    </div>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1", engagementMeta[r.engagement].text, engagementMeta[r.engagement].ring)}>
                      <span className={cn("size-1.5 rounded-full", engagementMeta[r.engagement].dot)} />
                      {engagementMeta[r.engagement].label}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Cadence (target {PT_TARGET_DAYS}d)</span>
                      <span className="font-medium text-foreground">{r.ptDays !== null ? `${r.ptDays}d` : "—"}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full",
                          r.progressPct >= 60 ? "bg-emerald-500" :
                          r.progressPct >= 30 ? "bg-amber-500" : "bg-rose-500"
                        )}
                        style={{ width: `${Math.max(6, r.progressPct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="uppercase tracking-widest text-muted-foreground">Last 97156</p>
                      <p className="mt-0.5 font-medium text-foreground">{relative(r.client.lastBcbaSessionDate)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="uppercase tracking-widest text-muted-foreground">Next due</p>
                      <p className="mt-0.5 font-medium text-foreground">{addDays(r.client.lastBcbaSessionDate, PT_TARGET_DAYS)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="uppercase tracking-widest text-muted-foreground">Cxl 30d</p>
                      <p className="mt-0.5 font-medium text-foreground">{r.client.cancellationsLast30d}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Section>

        {/* Upcoming parent trainings */}
        <Section title="Upcoming parent trainings" action={
          <Link to="/bcba/scheduling" className="text-xs font-medium text-primary hover:underline">View schedule →</Link>
        }>
          {upcomingWeek.length === 0 ? (
            <Card className="border-dashed bg-muted/30 text-center text-sm text-muted-foreground">Nothing to plan this week — caregivers are on track.</Card>
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
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{row.caregiverName}</p>
                  <span className={cn("mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1", engagementMeta[row.engagement].text, engagementMeta[row.engagement].ring)}>
                    <span className={cn("size-1 rounded-full", engagementMeta[row.engagement].dot)} />
                    {engagementMeta[row.engagement].label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Participation & engagement visibility */}
        <Section title="Participation & engagement">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <ParticipationTile label="Strong participation" tone="engaged" rows={rows.filter((r) => r.engagement === "engaged")} onOpen={setActive} />
            <ParticipationTile label="Stable"               tone="stable"  rows={rows.filter((r) => r.engagement === "stable")} onOpen={setActive} />
            <ParticipationTile label="Watch"                tone="watch"   rows={rows.filter((r) => r.engagement === "watch")} onOpen={setActive} />
            <ParticipationTile label="Needs follow-up"      tone="needs_support" rows={rows.filter((r) => r.engagement === "needs_support")} onOpen={setActive} />
          </div>
        </Section>

        {/* Risk indicators */}
        <Section title="Parent training risk indicators">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {rows.filter((r) => r.reasons.length > 0).slice(0, 8).map((r) => (
              <Card key={r.client.clientName} onClick={() => setActive(r.client.clientName)} className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={cn("mt-0.5 size-4",
                    r.engagement === "needs_support" ? "text-rose-500" :
                    r.engagement === "watch" ? "text-amber-500" : "text-sky-500"
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
                No active parent training risks.
              </Card>
            )}
          </div>
        </Section>

        {/* Scheduling coordination */}
        <Section title="Scheduling coordination" action={
          <Link to="/bcba/scheduling" className="text-xs font-medium text-primary hover:underline">Message scheduling →</Link>
        }>
          {counts.schedRisk === 0 ? (
            <Card className="border-dashed bg-muted/30 text-center text-sm text-muted-foreground">No scheduling instability affecting parent training.</Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {rows.filter((r) => r.reasons.some((x) => x.label.startsWith("Scheduling"))).slice(0, 6).map((r) => (
                <Card key={r.client.clientName} onClick={() => setActive(r.client.clientName)}>
                  <div className="flex items-start gap-3">
                    <CalendarClock className="mt-0.5 size-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{r.client.clientName}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.caregiverName} · {r.client.cancellationsLast30d} cxl in 30d</p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">Coordinate</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Section>

        {/* Completed snapshot */}
        <Section title="Recently completed">
          {counts.completedWeek === 0 ? (
            <Card className="border-dashed bg-muted/30 text-center text-sm text-muted-foreground">No parent training touchpoints in the last 7 days.</Card>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {c.caseload
                .filter((p) => { const d = daysSince(p.lastBcbaSessionDate); return d !== null && d <= 7; })
                .sort((a, b) => (b.lastBcbaSessionDate ?? "").localeCompare(a.lastBcbaSessionDate ?? ""))
                .slice(0, 8)
                .map((p) => (
                  <button key={p.clientName} onClick={() => setActive(p.clientName)}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 text-left transition hover:border-border">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{p.clientName}</p>
                      <p className="truncate text-xs text-muted-foreground">{caregiverFor(p.clientName)} · {relative(p.lastBcbaSessionDate)}</p>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </Section>

        {/* Operational Insights */}
        <Section title="Operational Insights">
          <Card className="bg-gradient-to-br from-primary/5 via-card to-card">
            <div className="flex items-start gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary"><Sparkles className="size-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Coordinate your caregivers</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Scoped to your caseload only. Permission-aware.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Which families need follow-up?",
                    "Which parent trainings are overdue?",
                    "Which caregivers are disengaged?",
                    "Summarize my parent training risks",
                    "Which clients have repeated cancellations?",
                  ].map((q) => (
                    <Link key={q} to={`/ai?q=${encodeURIComponent(q)}`}
                      className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-border hover:bg-muted">
                      {q}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </Section>

        {/* Quick actions */}
        <section>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <QuickAction to="/bcba/scheduling"      icon={CalendarClock}  label="Schedule training" />
            <QuickAction to="/bcba/clients"         icon={UserCheck}      label="Open clients" />
            <QuickAction to="/bcba/scheduling"           icon={MessageSquare}  label="Contact scheduling" />
            <QuickAction to="/bcba/supervision"     icon={Users}          label="Supervision" />
            <QuickAction to="/bcba/workspace"       icon={Activity}       label="Open workspace" />
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
                  {activeRow.caregiverName}{activeRow.client.state ? ` · ${activeRow.client.state}` : ""}
                </p>
              </SheetHeader>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1", engagementMeta[activeRow.engagement].text, engagementMeta[activeRow.engagement].ring)}>
                  <span className={cn("size-1.5 rounded-full", engagementMeta[activeRow.engagement].dot)} />
                  {engagementMeta[activeRow.engagement].label}
                </span>
                {activeRow.reasons.slice(0, 3).map((b, i) => (
                  <span key={i} className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sevChip[b.tone])}>{b.label}</span>
                ))}
              </div>

              <div className="mt-6 space-y-5">
                <PanelSection title="Parent training status">
                  <KV k="Last 97156"            v={relative(activeRow.client.lastBcbaSessionDate)} />
                  <KV k="Days since"            v={activeRow.ptDays !== null ? `${activeRow.ptDays}d` : "—"} />
                  <KV k="Cadence target"        v={`${PT_TARGET_DAYS}d`} />
                  <KV k="Next recommended"      v={addDays(activeRow.client.lastBcbaSessionDate, PT_TARGET_DAYS)} />
                  <KV k="Recommended action"    v={activeRow.recommendedAction} />
                </PanelSection>

                <PanelSection title="Operational context">
                  <KV k="Assigned RBT"          v={activeRow.client.rbtName ?? "Unassigned"} />
                  <KV k="Last RBT session"      v={relative(activeRow.client.lastRbtSessionDate)} />
                  <KV k="Cancellations 30d"     v={String(activeRow.client.cancellationsLast30d)} />
                  <KV k="PR / Auth"             v={activeAuth ? `${activeAuth.stage}${activeRow.authDue !== null ? ` · due ${activeRow.authDue}d` : ""}` : "—"} />
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
                    <PanelLink to="/bcba/scheduling" icon={CalendarClock}>Schedule training</PanelLink>
                    <PanelLink to="/bcba/clients" icon={UserCheck}>Open client</PanelLink>
                    <PanelLink to="/bcba/scheduling" icon={MessageSquare}>Message scheduling</PanelLink>
                    <PanelLink to="/bcba/supervision" icon={Users}>Supervision</PanelLink>
                    <PanelLink to="/bcba/authorizations" icon={FileSignature}>View PR</PanelLink>
                    <PanelLink to={`/ai?q=${encodeURIComponent(`Tell me about parent training for ${activeRow.client.clientName}`)}`} icon={Sparkles}>Operational Insights</PanelLink>
                  </div>
                </PanelSection>

                <PanelSection title="Caregiver contact">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Primary caregiver</span>
                    <span className="font-medium text-foreground">{activeRow.caregiverName}</span>
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
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </OSShell>
  );
}

function ParticipationTile({ label, tone, rows, onOpen }: { label: string; tone: Engagement; rows: PtRow[]; onOpen: (n: string) => void }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("size-1.5 rounded-full", engagementMeta[tone].dot)} />
          <p className="text-sm font-semibold tracking-tight text-foreground">{label}</p>
        </div>
        <span className="text-xs text-muted-foreground">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-3 text-center text-xs text-muted-foreground">None.</p>
      ) : (
        <div className="space-y-1.5">
          {rows.slice(0, 4).map((r) => (
            <button key={r.client.clientName} onClick={() => onOpen(r.client.clientName)}
              className="flex w-full items-center justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-left text-xs hover:bg-muted">
              <span className="truncate font-medium text-foreground">{r.client.clientName}</span>
              <span className="text-muted-foreground">{r.ptDays !== null ? `${r.ptDays}d` : "—"}</span>
            </button>
          ))}
          {rows.length > 4 && <p className="pt-1 text-center text-[11px] text-muted-foreground">+{rows.length - 4} more</p>}
        </div>
      )}
    </div>
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