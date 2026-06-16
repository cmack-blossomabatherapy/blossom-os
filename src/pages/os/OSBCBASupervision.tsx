import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2, Eye, AlertTriangle, CalendarClock, MessageSquare, Sparkles,
  X, ChevronRight, Users, HeartHandshake, FileSignature, Activity,
  CheckCircle2, ClipboardCheck, UserCheck, Clock,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useBcbaCaseload, daysSince, daysUntil, type Severity } from "@/hooks/useBcbaCaseload";
import type { ClientPairing } from "@/hooks/useCentralReachOps";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Status = "on_track" | "watch" | "needs" | "urgent";

const statusMeta: Record<Status, { label: string; dot: string; ring: string; text: string }> = {
  on_track: { label: "On track",        dot: "bg-emerald-500", ring: "ring-emerald-200 dark:ring-emerald-500/30", text: "text-emerald-700 dark:text-emerald-300" },
  watch:    { label: "Watch",           dot: "bg-amber-500",   ring: "ring-amber-200 dark:ring-amber-500/30",     text: "text-amber-700 dark:text-amber-300" },
  needs:    { label: "Needs supervision", dot: "bg-rose-500", ring: "ring-rose-200 dark:ring-rose-500/30", text: "text-rose-700 dark:text-rose-300" },
  urgent:   { label: "Urgent",          dot: "bg-rose-500",    ring: "ring-rose-200 dark:ring-rose-500/30",       text: "text-rose-700 dark:text-rose-300" },
};

const sevChip: Record<Severity, string> = {
  crit: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  warn: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  info: "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
};

// Target supervision cadence (days). Calm default for BCBA touchpoints.
const SUP_TARGET_DAYS = 14;

interface SupRow {
  client: ClientPairing;
  status: Status;
  supDays: number | null;
  authDue: number | null;
  progressPct: number;
  reasons: { label: string; tone: Severity }[];
  urgency: number;
  recommendedAction: string;
  newPairing: boolean;
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

function StatTile({ label, value, hint, tone }: { label: string; value: number | string; hint?: string; tone?: Status }) {
  return (
    <div className="rounded-2xl bg-muted/50 border border-border/60 p-4">
      <div className="flex items-center gap-2">
        {tone && <span className={cn("size-1.5 rounded-full", statusMeta[tone].dot)} />}
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

export default function OSBCBASupervision() {
  const c = useBcbaCaseload();
  const [active, setActive] = useState<string | null>(null);

  const rows: SupRow[] = useMemo(() => {
    return c.caseload.map((client) => {
      const auth = c.authByClient.get(client.clientName.toLowerCase()) ?? null;
      const supDays = daysSince(client.lastBcbaSessionDate);
      const authDue = daysUntil(auth?.nextTaskDue ?? null);
      const reasons: { label: string; tone: Severity }[] = [];
      let urgency = 0;

      // Supervision cadence
      if (supDays === null) { reasons.push({ label: "No BCBA touchpoint in 60d", tone: "crit" }); urgency += 80; }
      else if (supDays >= 21) { reasons.push({ label: `Last supervision ${supDays}d ago`, tone: "crit" }); urgency += 70; }
      else if (supDays >= 14) { reasons.push({ label: `Last supervision ${supDays}d ago`, tone: "warn" }); urgency += 35; }

      // New pairing (RBT activity in last 14d but no BCBA touch yet)
      const rbtDays = daysSince(client.lastRbtSessionDate);
      const newPairing = (rbtDays !== null && rbtDays <= 14) && (supDays === null || supDays >= 14);
      if (newPairing) { reasons.push({ label: "New RBT pairing — overlap needed", tone: "warn" }); urgency += 30; }

      // Cancellations impacting supervision
      if (client.cancellationsLast30d >= 3) { reasons.push({ label: `${client.cancellationsLast30d} cxl impacting cadence`, tone: "warn" }); urgency += 25; }

      // PR proximity raises supervision priority
      if (auth) {
        if (auth.stage === "Expiring Soon" || (authDue !== null && authDue <= 14)) {
          reasons.push({ label: `PR due ${authDue !== null ? authDue + "d" : "soon"} — supervision matters`, tone: authDue !== null && authDue <= 7 ? "crit" : "warn" });
          urgency += authDue !== null && authDue <= 7 ? 40 : 20;
        }
      }

      // Coverage/schedule risk
      const cov = c.coverageAlerts.find((x) => x.clientName === client.clientName) ?? null;
      if (cov?.level === "uncovered") { reasons.push({ label: "Uncovered — schedule blocker", tone: "crit" }); urgency += 30; }
      else if (cov?.level === "at_risk") { reasons.push({ label: "Coverage at risk", tone: "warn" }); urgency += 15; }

      const status: Status =
        urgency >= 70 ? "urgent" :
        urgency >= 40 ? "needs" :
        urgency >= 15 ? "watch" : "on_track";

      const progressPct = supDays === null
        ? 0
        : Math.max(0, Math.min(100, Math.round(((SUP_TARGET_DAYS - supDays) / SUP_TARGET_DAYS) * 100)));

      const recommendedAction =
        status === "urgent" ? "Schedule supervision this week" :
        newPairing ? "Schedule overlap with RBT" :
        status === "needs" ? "Plan supervision in next 7 days" :
        status === "watch" ? "Monitor cadence" : "On track";

      return { client, status, supDays, authDue, progressPct, reasons, urgency, recommendedAction, newPairing };
    });
  }, [c.caseload, c.authByClient, c.coverageAlerts]);

  const counts = useMemo(() => {
    const activeRbts = new Set(c.caseload.map((p) => p.rbtName).filter(Boolean)).size;
    const urgent = rows.filter((r) => r.status === "urgent").length;
    const needs = rows.filter((r) => r.status === "needs").length;
    const watch = rows.filter((r) => r.status === "watch").length;
    const onTrack = rows.filter((r) => r.status === "on_track").length;
    const overlaps = rows.filter((r) => r.newPairing).length;
    const completedThisWeek = c.caseload.filter((p) => {
      const d = daysSince(p.lastBcbaSessionDate);
      return d !== null && d <= 7;
    }).length;
    const upcoming = rows.filter((r) => r.status === "needs" || r.status === "urgent").length;
    return { activeRbts, urgent, needs, watch, onTrack, overlaps, completedThisWeek, upcoming };
  }, [rows, c.caseload]);

  const queue = useMemo(
    () => [...rows].sort((a, b) => b.urgency - a.urgency).filter((r) => r.urgency > 0).slice(0, 8),
    [rows],
  );

  // RBT support view — derive from caseload
  const rbts = useMemo(() => {
    const map = new Map<string, { name: string; clients: ClientPairing[]; lastBcba: string | null; concerns: number; newPairing: boolean }>();
    for (const p of c.caseload) {
      if (!p.rbtName) continue;
      let r = map.get(p.rbtName);
      if (!r) { r = { name: p.rbtName, clients: [], lastBcba: null, concerns: 0, newPairing: false }; map.set(p.rbtName, r); }
      r.clients.push(p);
      const t = p.lastBcbaSessionDate ? new Date(p.lastBcbaSessionDate).getTime() : 0;
      const prev = r.lastBcba ? new Date(r.lastBcba).getTime() : 0;
      if (t > prev) r.lastBcba = p.lastBcbaSessionDate;
      const days = daysSince(p.lastBcbaSessionDate);
      if (days === null || days >= 14) r.concerns++;
      const rbtDays = daysSince(p.lastRbtSessionDate);
      if (rbtDays !== null && rbtDays <= 14 && (days === null || days >= 14)) r.newPairing = true;
    }
    return [...map.values()].sort((a, b) => b.concerns - a.concerns);
  }, [c.caseload]);

  // Overlaps & 97155 buckets
  const overlaps = useMemo(() => {
    const needed: SupRow[] = [];
    const atRisk: SupRow[] = [];
    const completed: SupRow[] = [];
    for (const r of rows) {
      if (r.supDays !== null && r.supDays <= 7) completed.push(r);
      else if (r.newPairing || r.urgency >= 70) atRisk.push(r);
      else if (r.supDays === null || r.supDays >= 14) needed.push(r);
    }
    return { needed, atRisk, completed };
  }, [rows]);

  const upcomingWeek = useMemo(() => {
    return [...rows]
      .filter((r) => r.status === "needs" || r.status === "urgent" || r.newPairing)
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 7)
      .map((r, i) => ({ row: r, day: addDays(null, i) }));
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
              <p className="text-xs uppercase tracking-widest text-muted-foreground">My Supervision</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {firstName(c.profileMatched ? c.profileName : c.resolvedBcba)}'s supervision
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                {c.loading ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Loading supervision signals…</span>
                ) : c.caseload.length === 0 ? (
                  "No caseload activity in the last 60 days."
                ) : (
                  <>
                    <b className="text-foreground">{c.caseload.length}</b> clients · <b className="text-foreground">{counts.activeRbts}</b> RBTs ·{" "}
                    <b className="text-foreground">{counts.needs + counts.urgent}</b> need supervision ·{" "}
                    <b className="text-foreground">{counts.overlaps}</b> overlaps at risk
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

        {/* Overview tiles */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <StatTile label="Active clients"    value={c.caseload.length} />
          <StatTile label="Assigned RBTs"     value={counts.activeRbts} />
          <StatTile label="Supervision due"   value={counts.needs + counts.urgent} tone="needs" />
          <StatTile label="Overlaps needed"   value={counts.overlaps} tone="watch" hint="new RBT pairings" />
          <StatTile label="Urgent"            value={counts.urgent}    tone="urgent" />
          <StatTile label="Completed / 7d"    value={counts.completedThisWeek} hint="recent touchpoints" />
          <StatTile label="Upcoming"          value={counts.upcoming}  hint="prioritize this week" />
        </section>

        {/* Priority queue */}
        <Section title="Supervision priority queue" action={
          <Link to="/bcba/scheduling" className="text-xs font-medium text-primary hover:underline">View schedule →</Link>
        }>
          {c.loading ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted/60 animate-pulse" />)}
            </div>
          ) : queue.length === 0 ? (
            <Card className="border-dashed bg-muted/30 text-center">
              <CheckCircle2 className="mx-auto size-6 text-emerald-600 dark:text-emerald-400" />
              <p className="mt-2 text-sm text-muted-foreground">Supervision is on track. Nothing urgent right now.</p>
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
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1", statusMeta[r.status].text, statusMeta[r.status].ring)}>
                          <span className={cn("size-1.5 rounded-full", statusMeta[r.status].dot)} />
                          {statusMeta[r.status].label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        RBT: {r.client.rbtName ?? "Unassigned"} · last sup. {relative(r.client.lastBcbaSessionDate)}
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

        {/* Client supervision cards */}
        <Section title="Client supervision">
          {c.loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-muted/60 animate-pulse" />)}
            </div>
          ) : rows.length === 0 ? (
            <Card className="border-dashed bg-muted/30 text-center text-sm text-muted-foreground">No clients on your caseload.</Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rows.sort((a, b) => b.urgency - a.urgency).map((r) => (
                <Card key={r.client.clientName} onClick={() => setActive(r.client.clientName)}>
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{initials(r.client.clientName)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">{r.client.clientName}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {r.client.rbtName ?? "Unassigned"}{r.client.state ? ` · ${r.client.state}` : ""}
                      </p>
                    </div>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1", statusMeta[r.status].text, statusMeta[r.status].ring)}>
                      <span className={cn("size-1.5 rounded-full", statusMeta[r.status].dot)} />
                      {statusMeta[r.status].label}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Cadence (target {SUP_TARGET_DAYS}d)</span>
                      <span className="font-medium text-foreground">{r.supDays !== null ? `${r.supDays}d` : "—"}</span>
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
                      <p className="uppercase tracking-widest text-muted-foreground">Last sup.</p>
                      <p className="mt-0.5 font-medium text-foreground">{relative(r.client.lastBcbaSessionDate)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="uppercase tracking-widest text-muted-foreground">Next due</p>
                      <p className="mt-0.5 font-medium text-foreground">{addDays(r.client.lastBcbaSessionDate, SUP_TARGET_DAYS)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="uppercase tracking-widest text-muted-foreground">PR due</p>
                      <p className="mt-0.5 font-medium text-foreground">{r.authDue !== null ? `${r.authDue}d` : "—"}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Section>

        {/* RBT Support View */}
        <Section title="RBT support">
          {rbts.length === 0 ? (
            <Card className="border-dashed bg-muted/30 text-center text-sm text-muted-foreground">No RBTs assigned on your caseload.</Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {rbts.map((r) => {
                const supportStatus: Status =
                  r.newPairing ? "watch" :
                  r.concerns >= 2 ? "needs" :
                  r.concerns === 1 ? "watch" : "on_track";
                const supportLabel =
                  r.newPairing ? "New pairing" :
                  r.concerns >= 2 ? "Needs check-in" :
                  r.concerns === 1 ? "Watch" : "Stable";
                return (
                  <Card key={r.name}>
                    <div className="flex items-start gap-3">
                      <div className="grid size-10 place-items-center rounded-full bg-muted text-sm font-semibold text-foreground">{initials(r.name)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">{r.name}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.clients.length} client{r.clients.length === 1 ? "" : "s"} · last touch {relative(r.lastBcba)}</p>
                      </div>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1", statusMeta[supportStatus].text, statusMeta[supportStatus].ring)}>
                        <span className={cn("size-1.5 rounded-full", statusMeta[supportStatus].dot)} />
                        {supportLabel}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.clients.slice(0, 4).map((cl) => (
                        <button
                          key={cl.clientName}
                          onClick={() => setActive(cl.clientName)}
                          className="rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted"
                        >{cl.clientName.split(" ")[0]}</button>
                      ))}
                      {r.clients.length > 4 && <span className="text-[11px] text-muted-foreground">+{r.clients.length - 4} more</span>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Section>

        {/* Overlaps & 97155 */}
        <Section title="Overlaps & 97155 tracking">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <OverlapColumn title="Needed"     tone="needs"   rows={overlaps.needed}    onOpen={setActive} />
            <OverlapColumn title="At risk"    tone="urgent"  rows={overlaps.atRisk}    onOpen={setActive} />
            <OverlapColumn title="Completed"  tone="on_track" rows={overlaps.completed} onOpen={setActive} />
          </div>
        </Section>

        {/* Risk indicators */}
        <Section title="Supervision risk indicators">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {rows.filter((r) => r.reasons.length > 0).slice(0, 8).map((r) => (
              <Card key={r.client.clientName} onClick={() => setActive(r.client.clientName)} className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={cn("mt-0.5 size-4", r.status === "urgent" ? "text-rose-500" : r.status === "needs" ? "text-rose-500" : "text-amber-500")} />
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
                No active supervision risks.
              </Card>
            )}
          </div>
        </Section>

        {/* Upcoming supervision (lightweight calendar) */}
        <Section title="Upcoming supervision" action={
          <Link to="/bcba/scheduling" className="text-xs font-medium text-primary hover:underline">Open schedule →</Link>
        }>
          {upcomingWeek.length === 0 ? (
            <Card className="border-dashed bg-muted/30 text-center text-sm text-muted-foreground">Nothing scheduled — supervision targets are met.</Card>
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
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{row.client.rbtName ?? "—"}</p>
                  <span className={cn("mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1", statusMeta[row.status].text, statusMeta[row.status].ring)}>
                    <span className={cn("size-1 rounded-full", statusMeta[row.status].dot)} />
                    {statusMeta[row.status].label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Completed snapshot */}
        <Section title="Recently supervised">
          {counts.completedThisWeek === 0 ? (
            <Card className="border-dashed bg-muted/30 text-center text-sm text-muted-foreground">No supervision logged in the last 7 days.</Card>
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
                      <p className="truncate text-xs text-muted-foreground">{p.rbtName ?? "—"} · {relative(p.lastBcbaSessionDate)}</p>
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
                <p className="text-sm font-semibold text-foreground">Plan your supervision week</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Scoped to your caseload only. Permission-aware.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Which clients need supervision first?",
                    "Which RBTs need support?",
                    "Which overlaps are missing?",
                    "Summarize my supervision risks this week",
                    "Who has not been supervised in 21+ days?",
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

        {/* Quick workflow actions */}
        <section>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <QuickAction to="/bcba/scheduling"     icon={CalendarClock}   label="Schedule supervision" />
            <QuickAction to="/bcba/clients"        icon={UserCheck}       label="View clients" />
            <QuickAction to="/bcba/workspace"      icon={Activity}        label="Open workspace" />
            <QuickAction to="/bcba/parent-training" icon={HeartHandshake} label="Parent training" />
            <QuickAction to="/scheduling"          icon={MessageSquare}   label="Contact scheduling" />
            <QuickAction to="/ai"                  icon={Sparkles}        label="Operational Insights" />
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
                <p className="text-sm text-muted-foreground">RBT: {activeRow.client.rbtName ?? "Unassigned"}{activeRow.client.state ? ` · ${activeRow.client.state}` : ""}</p>
              </SheetHeader>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1", statusMeta[activeRow.status].text, statusMeta[activeRow.status].ring)}>
                  <span className={cn("size-1.5 rounded-full", statusMeta[activeRow.status].dot)} />
                  {statusMeta[activeRow.status].label}
                </span>
                {activeRow.reasons.slice(0, 3).map((b, i) => (
                  <span key={i} className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sevChip[b.tone])}>{b.label}</span>
                ))}
              </div>

              <div className="mt-6 space-y-5">
                <PanelSection title="Supervision status">
                  <KV k="Last BCBA touchpoint" v={relative(activeRow.client.lastBcbaSessionDate)} />
                  <KV k="Days since"           v={activeRow.supDays !== null ? `${activeRow.supDays}d` : "—"} />
                  <KV k="Cadence target"       v={`${SUP_TARGET_DAYS}d`} />
                  <KV k="Next recommended"     v={addDays(activeRow.client.lastBcbaSessionDate, SUP_TARGET_DAYS)} />
                  <KV k="Recommended action"   v={activeRow.recommendedAction} />
                </PanelSection>

                <PanelSection title="Operational context">
                  <KV k="Last RBT session"     v={relative(activeRow.client.lastRbtSessionDate)} />
                  <KV k="RBT hours / 7d"       v={`${activeRow.client.rbtHoursLast7d.toFixed(1)}h`} />
                  <KV k="Cancellations 30d"    v={String(activeRow.client.cancellationsLast30d)} />
                  <KV k="PR / Auth"            v={activeAuth ? `${activeAuth.stage}${activeRow.authDue !== null ? ` · due ${activeRow.authDue}d` : ""}` : "—"} />
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
                    <PanelLink to="/bcba/scheduling" icon={CalendarClock}>Schedule supervision</PanelLink>
                    <PanelLink to="/bcba/clients" icon={UserCheck}>Open client</PanelLink>
                    <PanelLink to="/bcba/authorizations" icon={FileSignature}>View PR</PanelLink>
                    <PanelLink to="/scheduling" icon={MessageSquare}>Message scheduling</PanelLink>
                    <PanelLink to="/bcba/parent-training" icon={HeartHandshake}>Parent training</PanelLink>
                    <PanelLink to={`/ai?q=${encodeURIComponent(`Tell me about supervision for ${activeRow.client.clientName}`)}`} icon={Sparkles}>Operational Insights</PanelLink>
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

function OverlapColumn({ title, tone, rows, onOpen }: { title: string; tone: Status; rows: SupRow[]; onOpen: (n: string) => void }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("size-1.5 rounded-full", statusMeta[tone].dot)} />
          <p className="text-sm font-semibold tracking-tight text-foreground">{title}</p>
        </div>
        <span className="text-xs text-muted-foreground">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-3 text-center text-xs text-muted-foreground">Nothing here.</p>
      ) : (
        <div className="space-y-2">
          {rows.slice(0, 5).map((r) => (
            <button key={r.client.clientName} onClick={() => onOpen(r.client.clientName)}
              className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card p-3 text-left transition hover:border-border">
              <Clock className="size-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{r.client.clientName}</p>
                <p className="truncate text-[11px] text-muted-foreground">{r.client.rbtName ?? "—"} · {relative(r.client.lastBcbaSessionDate)}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
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