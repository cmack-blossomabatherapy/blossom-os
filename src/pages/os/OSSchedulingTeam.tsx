import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, CalendarDays, UserPlus, CalendarClock, ShieldAlert, CheckCircle2,
  Users, AlertTriangle, MapPin, Sparkles, ChevronRight, Phone, Mail,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";
import { mockClients, type Client } from "@/data/clients";

/* ============================ helpers ============================ */

const TODAY = new Date();
function daysFromNow(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime() - TODAY.getTime();
  return Math.round(d / 86_400_000);
}

type Bucket =
  | "needs_rbt"
  | "pending_start"
  | "ready_to_schedule"
  | "coverage_risk"
  | "active";

function bucketOf(c: Client): Bucket | null {
  // Needs RBT: client at staffing stage without RBT
  if ((c.stage === "Staffing Needed" || c.staffingStatus === "Needed" || c.staffingStatus === "In Progress") && !c.rbt) {
    return "needs_rbt";
  }
  // Pending start date: paired but no confirmed start
  if (c.stage === "Pending Start Date" || (c.rbt && c.bcba && !c.startDate && c.authStatus === "Approved")) {
    return "pending_start";
  }
  // Ready to schedule: auth approved, BCBA + RBT in place, scheduling not yet active
  if (
    c.authStatus === "Approved" && c.bcba && c.rbt &&
    (c.schedulingStatus === "Pending Schedule" || c.schedulingStatus === "Schedule Created") &&
    c.stage !== "Active"
  ) {
    return "ready_to_schedule";
  }
  // Coverage risk: active with cancellation/pause/flag signals
  if (
    c.stage === "Active" &&
    (c.activeServiceStatus === "Services on Pause" ||
      c.activeServiceStatus === "Flaked" ||
      (c.scheduledWeeklyHours !== undefined && c.approvedWeeklyHours !== undefined &&
        c.scheduledWeeklyHours < c.approvedWeeklyHours * 0.8) ||
      (c.blockers && c.blockers.length > 0))
  ) {
    return "coverage_risk";
  }
  if (c.stage === "Active") return "active";
  return null;
}

function blockerOf(c: Client, b: Bucket): string {
  if (b === "needs_rbt") return "No RBT assigned · auth approved";
  if (b === "pending_start") return c.startDate ? `Start ${c.startDate}` : "Start date not confirmed";
  if (b === "ready_to_schedule") return "Schedule not yet built";
  if (b === "coverage_risk") {
    if (c.activeServiceStatus === "Services on Pause") return "Services paused";
    if (c.activeServiceStatus === "Flaked") return "Family unreachable";
    if (c.blockers?.length) return c.blockers[0];
    return "Below scheduled hours target";
  }
  return "—";
}

function nextActionOf(b: Bucket): { label: string; to: string } {
  switch (b) {
    case "needs_rbt":         return { label: "Assign RBT",         to: "/scheduling-workspace?view=needs_rbt" };
    case "pending_start":     return { label: "Confirm Start Date", to: "/clients?stage=pending_start" };
    case "ready_to_schedule": return { label: "Build Schedule",     to: "/scheduling?view=ready" };
    case "coverage_risk":     return { label: "Resolve Risk",       to: "/scheduling-workspace?view=risks" };
    default:                  return { label: "Open Client",         to: "/clients" };
  }
}

/* ============================ page ============================ */

export default function OSSchedulingTeam() {
  const enriched = useMemo(() => {
    return mockClients.map((c) => ({ c, b: bucketOf(c) })).filter((x) => x.b !== null) as { c: Client; b: Bucket }[];
  }, []);

  const counts = useMemo(() => {
    const k = { needs_rbt: 0, pending_start: 0, ready_to_schedule: 0, coverage_risk: 0, active: 0, on_pause: 0 };
    for (const { b } of enriched) (k as any)[b]++;
    for (const c of mockClients) if (c.activeServiceStatus === "Services on Pause") k.on_pause++;
    return k;
  }, [enriched]);

  const priorities = useMemo(() => {
    const order: Bucket[] = ["needs_rbt", "pending_start", "ready_to_schedule", "coverage_risk"];
    return [...enriched]
      .sort((a, b) => order.indexOf(a.b) - order.indexOf(b.b))
      .slice(0, 8);
  }, [enriched]);

  const gaCount = enriched.filter((x) => x.c.state === "GA").length;
  const nonGaCount = enriched.length - gaCount;
  const blockedNoAvailability = mockClients.filter((c) => c.blockers?.some((b) => /availability/i.test(b))).length;
  const waitingBcba = mockClients.filter((c) => !c.bcba && c.authStatus === "Approved").length;
  const conflictCount = mockClients.filter((c) => c.blockers?.some((b) => /conflict|overlap/i.test(b))).length;
  const rbtsAvailable = 7; // operational placeholder — no RBT roster in mock yet

  const upcomingStarts = useMemo(() => {
    return mockClients
      .filter((c) => c.startDate && (daysFromNow(c.startDate) ?? -1) >= 0 && (daysFromNow(c.startDate) ?? 99) <= 21)
      .sort((a, b) => (daysFromNow(a.startDate!) ?? 0) - (daysFromNow(b.startDate!) ?? 0))
      .slice(0, 5);
  }, []);

  const coverageIssues = useMemo(() => {
    return mockClients
      .filter((c) => c.stage === "Active" && (
        c.activeServiceStatus === "Services on Pause" ||
        c.activeServiceStatus === "Flaked" ||
        (c.blockers && c.blockers.length > 0)
      ))
      .slice(0, 5);
  }, []);

  return (
    <OSShell>
      <div className="mx-auto max-w-6xl space-y-8 px-4 md:px-6 lg:px-8 py-6">
        <Header />

        {/* 4 KPI cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            icon={UserPlus} label="Clients Needing RBT" value={counts.needs_rbt}
            hint="Authorized · awaiting RBT pairing"
            to="/scheduling-workspace?view=needs_rbt"
          />
          <KpiCard
            icon={CalendarClock} label="Pending Start Date" value={counts.pending_start}
            hint="Paired · start not confirmed"
            to="/clients?stage=pending_start"
          />
          <KpiCard
            icon={ShieldAlert} label="Coverage Risks" value={counts.coverage_risk}
            hint="Paused · flaked · below target"
            to="/scheduling-workspace?view=risks"
            tone="warn"
          />
          <KpiCard
            icon={CheckCircle2} label="Ready to Schedule" value={counts.ready_to_schedule}
            hint="Cleared · awaiting schedule build"
            to="/scheduling?view=ready"
          />
        </section>

        {/* 2-col body */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader title="Today's Scheduling Priorities" subtitle="Ordered by what needs Scheduling first" />
            {priorities.length === 0 ? (
              <Empty message="You're clear for now. No scheduling priorities." />
            ) : (
              <ul className="divide-y divide-border/60">
                {priorities.map(({ c, b }) => {
                  const action = nextActionOf(b);
                  return (
                    <li key={c.id} className="flex items-center gap-3 py-3">
                      <BucketDot bucket={b} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link to="/clients" className="truncate text-[14px] font-medium tracking-tight text-foreground hover:underline">
                            {c.childName}
                          </Link>
                          <span className="text-[11px] text-muted-foreground">· {c.state}</span>
                          <BucketPill bucket={b} />
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{blockerOf(c, b)}</p>
                      </div>
                      <Link
                        to={action.to}
                        className="hidden sm:inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground/80 hover:bg-muted/40"
                      >
                        {action.label} <ChevronRight className="h-3 w-3" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Operational Signals" subtitle="What Scheduling should know right now" />
            <ul className="space-y-1.5">
              <SignalRow label="GA staffing items" value={gaCount} to="/scheduling-workspace?view=needs_rbt&state=GA" icon={MapPin} />
              <SignalRow label="Non-GA staffing items" value={nonGaCount} to="/scheduling-workspace?view=needs_rbt" icon={MapPin} />
              <SignalRow label="Waiting on BCBA confirmation" value={waitingBcba} to="/bcba" icon={Users} />
              <SignalRow label="Blocked by missing availability" value={blockedNoAvailability} to="/scheduling-workspace?view=availability" icon={AlertTriangle} />
              <SignalRow label="RBTs available for pairing" value={rbtsAvailable} to="/rbt" icon={UserPlus} />
              <SignalRow label="Schedule conflicts to review" value={conflictCount} to="/scheduling-workspace?view=conflicts" icon={AlertTriangle} />
            </ul>
          </Card>
        </section>

        {/* Second row — 3 cards */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Staffing Queue Snapshot */}
          <Card>
            <CardHeader title="Staffing Queue Snapshot" />
            <div className="space-y-2.5">
              <QueueBar label="Needs RBT"          count={counts.needs_rbt}         max={Math.max(counts.needs_rbt, counts.active, 1)} tone="warn" />
              <QueueBar label="RBT Confirmed"      count={counts.ready_to_schedule} max={Math.max(counts.needs_rbt, counts.active, 1)} tone="info" />
              <QueueBar label="Pending Start Date" count={counts.pending_start}     max={Math.max(counts.needs_rbt, counts.active, 1)} tone="info" />
              <QueueBar label="Active"             count={counts.active}            max={Math.max(counts.needs_rbt, counts.active, 1)} tone="ok" />
              <QueueBar label="On Pause"           count={counts.on_pause}          max={Math.max(counts.needs_rbt, counts.active, 1)} tone="muted" />
            </div>
          </Card>

          {/* Upcoming Starts */}
          <Card>
            <CardHeader title="Upcoming Starts" subtitle="Next 21 days" />
            {upcomingStarts.length === 0 ? (
              <Empty message="No start dates are pending." />
            ) : (
              <ul className="space-y-2.5">
                {upcomingStarts.map((c) => (
                  <li key={c.id} className="rounded-xl border border-border/60 bg-muted/40 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Link to="/clients" className="truncate text-[13px] font-medium text-foreground hover:underline">
                        {c.childName}
                      </Link>
                      <span className="rounded-full bg-card border border-border/70 px-2 py-0.5 text-[10.5px] text-foreground/70">
                        {c.startDate}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11.5px] text-muted-foreground">
                      {c.state} · BCBA {c.bcba ?? "—"} · RBT {c.rbt ?? "—"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Cancellations & Coverage */}
          <Card>
            <CardHeader title="Cancellations & Coverage" subtitle="Recent operational issues" />
            {coverageIssues.length === 0 ? (
              <Empty message="No active scheduling risks found." />
            ) : (
              <ul className="space-y-2.5">
                {coverageIssues.map((c) => (
                  <li key={c.id} className="rounded-xl border border-border/60 bg-muted/40 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Link to="/clients" className="truncate text-[13px] font-medium text-foreground hover:underline">
                        {c.childName}
                      </Link>
                      <span className="rounded-full bg-card border border-border/70 px-2 py-0.5 text-[10.5px] text-foreground/70">
                        {c.activeServiceStatus ?? "—"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11.5px] text-muted-foreground">
                      {c.blockers?.[0] ?? "Coverage gap"} · RBT {c.rbt ?? "—"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* Ask Blossom AI */}
        <Card>
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-muted/70 text-foreground/70">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-medium tracking-tight text-foreground">Ask Blossom AI</h3>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                Get help finding staffing risks, schedule blockers, or next actions.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  "Which clients need staffing today?",
                  "Show me clients approved but not scheduled.",
                  "Which RBT pairings are incomplete?",
                  "What are the biggest scheduling risks this week?",
                  "Which clients are ready for a start date?",
                ].map((q) => (
                  <Link
                    key={q}
                    to={`/ask-blossom?q=${encodeURIComponent(q)}`}
                    className="rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11.5px] text-foreground/80 hover:bg-muted/40"
                  >
                    {q}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </OSShell>
  );
}

/* ============================ components ============================ */

function Header() {
  const dateLabel = TODAY.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 text-[11px] text-foreground/70">
            <CalendarDays className="h-3 w-3" /> Staffing & Scheduling Operations
          </span>
          <span className="text-[11.5px] text-muted-foreground">{dateLabel}</span>
        </div>
        <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          Scheduling Dashboard
        </h1>
        <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
          Today's staffing priorities, coverage risks, and schedule readiness across Blossom.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/scheduling-workspace"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-card px-3.5 text-[12.5px] font-medium text-foreground/80 hover:bg-muted/40"
        >
          Review Staffing Queue
        </Link>
        <Link
          to="/scheduling-workspace"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-[12.5px] font-medium text-background hover:bg-foreground/90"
        >
          Open Scheduling Workspace <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card border border-border/70 p-5",
        "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[15px] font-medium tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="mt-0.5 text-[12px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, hint, to, tone = "neutral",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  hint: string;
  to: string;
  tone?: "neutral" | "warn";
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group rounded-2xl bg-card border border-border/70 p-4",
        "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn(
          "grid h-8 w-8 place-items-center rounded-xl",
          tone === "warn" ? "bg-destructive/10 text-destructive" : "bg-muted/70 text-foreground/70"
        )}>
          <Icon className="h-4 w-4" />
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 transition group-hover:text-foreground/70" />
      </div>
      <div className="mt-3">
        <p className="text-[11.5px] text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
        <p className="mt-1 text-[11px] text-muted-foreground/80">{hint}</p>
      </div>
    </Link>
  );
}

function BucketDot({ bucket }: { bucket: Bucket }) {
  const tone =
    bucket === "needs_rbt"        ? "bg-destructive/70" :
    bucket === "coverage_risk"    ? "bg-amber-500/70" :
    bucket === "pending_start"    ? "bg-foreground/40" :
    bucket === "ready_to_schedule"? "bg-foreground/30" :
                                    "bg-foreground/20";
  return <span className={cn("h-2 w-2 flex-none rounded-full", tone)} />;
}

function BucketPill({ bucket }: { bucket: Bucket }) {
  const label =
    bucket === "needs_rbt"         ? "Needs RBT" :
    bucket === "pending_start"     ? "Pending Start" :
    bucket === "ready_to_schedule" ? "Ready" :
    bucket === "coverage_risk"     ? "Coverage Risk" : "Active";
  return (
    <span className="rounded-full border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[10px] text-foreground/65">
      {label}
    </span>
  );
}

function SignalRow({
  label, value, to, icon: Icon,
}: {
  label: string; value: number; to: string; icon: React.ElementType;
}) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 hover:bg-muted/40 transition"
      >
        <span className="flex items-center gap-2 text-[12.5px] text-foreground/80">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          {label}
        </span>
        <span className="text-[12px] font-medium text-foreground tabular-nums">{value}</span>
      </Link>
    </li>
  );
}

function QueueBar({
  label, count, max, tone,
}: {
  label: string; count: number; max: number;
  tone: "ok" | "warn" | "info" | "muted";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((count / max) * 100)) : 0;
  const bar =
    tone === "warn"  ? "bg-amber-500/70" :
    tone === "ok"    ? "bg-foreground/60" :
    tone === "info"  ? "bg-foreground/40" :
                       "bg-foreground/20";
  return (
    <div>
      <div className="flex items-center justify-between text-[12px] text-foreground/80">
        <span>{label}</span>
        <span className="tabular-nums text-foreground">{count}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
        <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center">
      <p className="text-[12.5px] text-muted-foreground">{message}</p>
    </div>
  );
}
