import { useMemo, useState } from "react";
import {
  ArrowUpRight, ArrowDownRight, AlertTriangle, Flame, ArrowRight,
  Sparkles, Activity, ShieldCheck, Wallet, CheckCircle2, Database, CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRole } from "@/contexts/OSRoleContext";
import { cn } from "@/lib/utils";
import { useStateOps, type WindowKey } from "@/hooks/useStateOps";
import { useStateMondayPipeline } from "@/hooks/useStateMondayPipeline";
import {
  filterByCode, weeklySeries, quickStats, supervisionLeaderboard,
  attentionItems, rosterStats, type CodeFilter,
} from "@/lib/analytics/stateOps";
import { HoursVsClientsChart } from "@/components/state-director/HoursVsClientsChart";
import { SupervisionLeaderboard } from "@/components/state-director/SupervisionLeaderboard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

const STATE_NAMES: Record<string, string> = {
  NC: "North Carolina", GA: "Georgia", VA: "Virginia", TN: "Tennessee",
  FL: "Florida", TX: "Texas", SC: "South Carolina",
};

const CODE_OPTIONS: { key: CodeFilter; label: string; sub: string }[] = [
  { key: "all", label: "All codes", sub: "Everything" },
  { key: "97153", label: "97153", sub: "Direct" },
  { key: "97155", label: "97155", sub: "Supervision" },
  { key: "97151", label: "97151", sub: "Assessment" },
  { key: "97156", label: "97156", sub: "Parent" },
];
const WINDOWS: { key: WindowKey; label: string }[] = [
  { key: "1w", label: "1w" }, { key: "2w", label: "2w" },
  { key: "4w", label: "4w" }, { key: "custom", label: "Custom" },
];

/* ---------- small UI atoms ---------- */

function HealthBadge({ score }: { score: number }) {
  const tone = score >= 85 ? "ok" : score >= 70 ? "warn" : "crit";
  const cls =
    tone === "ok" ? "bg-[hsl(150_70%_94%)] text-[hsl(155_55%_32%)]" :
    tone === "warn" ? "bg-[hsl(40_100%_94%)] text-[hsl(30_80%_42%)]" :
    "bg-[hsl(355_100%_95%)] text-[hsl(355_70%_48%)]";
  const label = tone === "ok" ? "Healthy" : tone === "warn" ? "Stable" : "Critical";
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold", cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full",
        tone === "ok" ? "bg-[hsl(155_60%_45%)]" : tone === "warn" ? "bg-[hsl(35_90%_50%)]" : "bg-[hsl(355_75%_55%)]")} />
      {label} · {score}
    </span>
  );
}

function Chip({ active, onClick, children, sub }: { active: boolean; onClick: () => void; children: React.ReactNode; sub?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition",
        active
          ? "border-foreground/15 bg-foreground text-background shadow-sm"
          : "border-foreground/10 bg-white/70 text-foreground/70 hover:bg-white",
      )}
    >
      {children}
      {sub && <span className={cn("text-[10px] font-medium", active ? "text-background/70" : "text-foreground/40")}>· {sub}</span>}
    </button>
  );
}

function MetricTile({ label, value, delta, suffix, hint, tone = "neutral" }: {
  label: string; value: string | number; delta?: number; suffix?: string; hint?: string;
  tone?: "good" | "bad" | "neutral";
}) {
  const up = (delta ?? 0) > 0;
  const down = (delta ?? 0) < 0;
  const deltaColor =
    tone === "good" ? (up ? "text-[hsl(155_55%_38%)]" : down ? "text-[hsl(355_72%_52%)]" : "text-muted-foreground") :
    tone === "bad"  ? (up ? "text-[hsl(355_72%_52%)]" : down ? "text-[hsl(155_55%_38%)]" : "text-muted-foreground") :
    up ? "text-foreground/70" : down ? "text-foreground/70" : "text-muted-foreground";
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_18px_44px_-30px_hsl(220_40%_30%/0.25)]">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-[26px] font-semibold leading-none tracking-tight tabular-nums">
        {value}{suffix && <span className="ml-1 text-[14px] font-medium text-muted-foreground">{suffix}</span>}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        {typeof delta === "number" ? (
          <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums", deltaColor)}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : down ? <ArrowDownRight className="h-3 w-3" /> : null}
            {delta > 0 ? "+" : ""}{delta}
            {suffix === "%" ? " pts" : ""}
          </span>
        ) : <span />}
        {hint && <span className="truncate text-[10.5px] text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function OSStateDirector() {
  const { user } = useAuth();
  const { activeState } = useOSRole();
  const [code, setCode] = useState<CodeFilter>("all");
  const [windowKey, setWindowKey] = useState<WindowKey>("4w");
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);

  const customFromStr = customFrom ? format(customFrom, "yyyy-MM-dd") : undefined;
  const customToStr = customTo ? format(customTo, "yyyy-MM-dd") : undefined;

  const { sessions, loading, hasAnyData, fetchedAt } = useStateOps(activeState, windowKey, customFromStr, customToStr);
  const pipeline = useStateMondayPipeline(activeState);

  const filtered = useMemo(() => filterByCode(sessions, code), [sessions, code]);
  const series = useMemo(() => weeklySeries(filtered), [filtered]);
  const stats = useMemo(() => quickStats(filtered), [filtered]);
  const roster = useMemo(() => rosterStats(sessions), [sessions]);
  const sup = useMemo(() => supervisionLeaderboard(sessions), [sessions]);
  const attention = useMemo(() => attentionItems(sessions), [sessions]);

  // Composite health score: a blend of staffing efficiency, billing, and capacity.
  const score = useMemo(() => {
    if (!sessions.length) return 0;
    const eff = Math.min(100, (stats.hoursPerClient / 16) * 100);          // 16 hrs/client target
    const supScore = Math.min(100, (stats.supervisionRatio / 12) * 100);    // 12% supervision target
    const billable = sessions.filter((s) => s.is_billable !== false).length / sessions.length * 100;
    return Math.round(eff * 0.45 + supScore * 0.25 + billable * 0.3);
  }, [sessions, stats]);

  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Director").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const stateName = STATE_NAMES[activeState] ?? activeState;

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1180px] space-y-6 pb-12">

        {/* ============ HEADER ============ */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {today} · {stateName}
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight md:text-[32px]">
              {greet}, {name}.
            </h1>
            {loading ? (
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">Loading session data…</p>
            ) : !hasAnyData ? (
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
                No session data is loaded for this state yet. Once imported, this page lights up automatically.
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-foreground/70 backdrop-blur">
              <Activity className="h-3 w-3" /> Live
            </span>
            <HealthBadge score={score} />
          </div>
        </header>

        {/* ============ HERO: HOURS vs CLIENTS ============ */}
        <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-white via-white to-[hsl(220_45%_98%)] p-6 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_30px_70px_-40px_hsl(220_40%_30%/0.25)] md:p-7">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.18)] to-transparent blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-[hsl(180_70%_60%/0.18)] to-transparent blur-3xl" />

          <div className="relative">
            {/* Hero headline number */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Hours per active patient
                </p>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-[56px] font-semibold leading-none tracking-tight tabular-nums">
                    {stats.hoursPerClient.toFixed(1)}
                  </span>
                  <span className="text-[18px] font-medium text-muted-foreground">hrs / wk</span>
                  {stats.hoursPerClientDelta !== 0 && (
                    <span className={cn("inline-flex items-center gap-0.5 text-[13px] font-semibold tabular-nums",
                      stats.hoursPerClientDelta > 0 ? "text-[hsl(155_55%_38%)]" : "text-[hsl(355_72%_52%)]")}>
                      {stats.hoursPerClientDelta > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      {stats.hoursPerClientDelta > 0 ? "+" : ""}{stats.hoursPerClientDelta} vs prior wk
                    </span>
                  )}
                </div>
                <p className="mt-2 max-w-md text-[12.5px] text-muted-foreground">
                  Higher = more billable hours per patient, the signal of healthy staffing.
                </p>
              </div>

              {/* Window chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {WINDOWS.map((w) => (
                  <Chip key={w.key} active={windowKey === w.key} onClick={() => setWindowKey(w.key)}>
                    {w.label}
                  </Chip>
                ))}
                {windowKey === "custom" && (
                  <div className="flex items-center gap-1.5">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn(
                          "h-8 rounded-full border px-3 text-[11.5px] font-semibold",
                          !customFrom && "text-muted-foreground"
                        )}>
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {customFrom ? format(customFrom, "MMM d") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={customFrom}
                          onSelect={setCustomFrom}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-[11px] text-muted-foreground">–</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn(
                          "h-8 rounded-full border px-3 text-[11.5px] font-semibold",
                          !customTo && "text-muted-foreground"
                        )}>
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {customTo ? format(customTo, "MMM d") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={customTo}
                          onSelect={setCustomTo}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>

            {/* Code filter chips */}
            <div className="mt-5 flex flex-wrap gap-1.5">
              {CODE_OPTIONS.map((o) => (
                <Chip key={o.key} active={code === o.key} onClick={() => setCode(o.key)} sub={o.sub}>
                  {o.label}
                </Chip>
              ))}
            </div>

            {/* The chart */}
            <div className="mt-5">
              <HoursVsClientsChart data={series} />
            </div>
          </div>
        </section>

        {/* ============ QUICK STATS ============ */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="Hours this week" value={stats.hoursThisWeek.toFixed(1)} delta={stats.hoursDelta} tone="good" hint="Billable + admin" />
          <MetricTile
            label="Active patients"
            value={pipeline.loading ? "…" : pipeline.activeClients}
            tone="neutral"
            hint={`Monday "Active" · ${pipeline.totalClients} total in state`}
          />
          <MetricTile label="Hours / patient" value={stats.hoursPerClient.toFixed(1)} delta={stats.hoursPerClientDelta} tone="good" hint="Staffing efficiency" />
          <MetricTile label="Supervision ratio" value={stats.supervisionRatio.toFixed(1)} suffix="%" delta={stats.supervisionDelta} tone="good" hint="97155 / 97153" />
        </section>

        {/* ============ MONDAY PIPELINE SNAPSHOT ============ */}
        <PipelineSnapshot pipeline={pipeline} stateName={stateName} />

        {/* ============ SUPERVISION LEADERBOARD ============ */}
        <section className="rounded-[24px] border border-white/70 bg-white/80 p-6 backdrop-blur shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_24px_60px_-40px_hsl(220_40%_30%/0.18)]">
          <header className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
                <ShieldCheck className="h-4 w-4 text-[hsl(265_70%_55%)]" />
                BCBA Supervision Health
              </h3>
              <p className="text-[12px] text-muted-foreground">Who's maximizing supervision, who needs coaching</p>
            </div>
            <span className="rounded-full bg-foreground/[0.05] px-2.5 py-1 text-[11px] font-semibold text-foreground/70">
              {roster.activeBcbas} BCBAs · {roster.activeRbts} RBTs
            </span>
          </header>
          <SupervisionLeaderboard rows={sup} />
        </section>

        {/* ============ ATTENTION REQUIRED ============ */}
        <section>
          <header className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight">Attention Required</h3>
              <p className="text-[12px] text-muted-foreground">Generated from this week's session + billing data</p>
            </div>
          </header>
          {attention.length === 0 ? (
            <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-foreground/15 bg-white/50 py-10 text-center">
              <CheckCircle2 className="h-6 w-6 text-[hsl(155_55%_45%)]" />
              <p className="text-[13px] font-semibold">Nothing on fire.</p>
              <p className="text-[11.5px] text-muted-foreground">No red flags detected in the current window.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {attention.map((a) => {
                const tone = a.severity === "crit"
                  ? { bg: "bg-[hsl(355_100%_95%)]", text: "text-[hsl(355_72%_52%)]", ring: "shadow-[0_0_0_1px_hsl(355_75%_70%/0.30),0_18px_44px_-24px_hsl(355_72%_55%/0.40)]" }
                  : { bg: "bg-[hsl(40_100%_94%)]",  text: "text-[hsl(30_85%_45%)]", ring: "shadow-[0_0_0_1px_hsl(35_90%_65%/0.24),0_18px_44px_-24px_hsl(35_85%_50%/0.35)]" };
                const Icon = a.severity === "crit" ? Flame : AlertTriangle;
                return (
                  <article key={a.id} className={cn("group rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur transition hover:-translate-y-0.5", tone.ring)}>
                    <div className="flex items-start gap-3">
                      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tone.bg, tone.text)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", tone.bg, tone.text)}>
                          {a.severity === "crit" ? "Critical" : "Watch"}
                        </span>
                        <p className="mt-1.5 text-[13.5px] font-semibold leading-snug">{a.title}</p>
                        <p className="mt-0.5 text-[11.5px] text-muted-foreground">{a.detail}</p>
                        <button className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-foreground/80 hover:text-foreground">
                          {a.action} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ============ BILLING TILE (compact) ============ */}
        {hasAnyData && (
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur">
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Wallet className="h-3 w-3" /> Billed
              </p>
              <p className="mt-2 text-[22px] font-semibold tracking-tight tabular-nums">
                ${roster.billedTotal.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Paid</p>
              <p className="mt-2 text-[22px] font-semibold tracking-tight tabular-nums text-[hsl(155_55%_38%)]">
                ${roster.paidTotal.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Outstanding</p>
              <p className="mt-2 text-[22px] font-semibold tracking-tight tabular-nums text-[hsl(30_85%_45%)]">
                ${roster.owedTotal.toLocaleString()}
              </p>
            </div>
          </section>
        )}

        {/* ============ EMPTY STATE / FOOTER ============ */}
        {!loading && !hasAnyData && (
          <section className="grid place-items-center gap-2 rounded-3xl border border-dashed border-foreground/15 bg-white/50 py-12 text-center">
            <Database className="h-7 w-7 text-foreground/40" />
            <p className="text-[14px] font-semibold">No session data for {stateName} yet</p>
            <p className="max-w-md text-[12px] text-muted-foreground">
              Once the latest CMS export is imported, this dashboard fills in automatically — codes, billing, supervision and all.
            </p>
          </section>
        )}

        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          <Sparkles className="mr-1 inline h-3 w-3" />
          One calm screen. Everything else lives a click deeper.
          {fetchedAt && <> · Updated {new Date(fetchedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</>}
        </p>
      </div>
    </OSShell>
  );
}

function PipelineSnapshot({ pipeline, stateName }: { pipeline: ReturnType<typeof useStateMondayPipeline>; stateName: string }) {
  if (pipeline.loading) {
    return (
      <section className="rounded-[24px] border border-white/70 bg-white/70 p-6 text-[12px] text-muted-foreground">
        Loading {stateName} pipeline from Monday…
      </section>
    );
  }
  const boards: { title: string; subtitle: string; rows: { group: string; count: number }[] }[] = [
    { title: "Clients",        subtitle: `${pipeline.totalClients} total`,                                rows: pipeline.clients },
    { title: "Leads",          subtitle: `${pipeline.leads.reduce((s,g)=>s+g.count,0)} total`,            rows: pipeline.leads },
    { title: "Authorizations", subtitle: `${pipeline.authorizations.reduce((s,g)=>s+g.count,0)} total`,   rows: pipeline.authorizations },
    { title: "Approvals",      subtitle: `${pipeline.approvals.reduce((s,g)=>s+g.count,0)} total`,        rows: pipeline.approvals },
    { title: "Denials",        subtitle: `${pipeline.denials.reduce((s,g)=>s+g.count,0)} total`,          rows: pipeline.denials },
  ];
  return (
    <section className="rounded-[24px] border border-white/70 bg-white/80 p-6 backdrop-blur shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_24px_60px_-40px_hsl(220_40%_30%/0.18)]">
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
            <Database className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            {stateName} Pipeline · live from Monday
          </h3>
          <p className="text-[12px] text-muted-foreground">
            1:1 with each board's kanban groups — these are the numbers your team manages every day.
          </p>
        </div>
      </header>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {boards.map((b) => (
          <div key={b.title} className="rounded-2xl border border-foreground/10 bg-white/70 p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[12.5px] font-semibold tracking-tight">{b.title}</p>
              <p className="text-[11px] text-muted-foreground">{b.subtitle}</p>
            </div>
            {b.rows.length === 0 ? (
              <p className="mt-3 text-[11.5px] text-muted-foreground">No rows for {stateName}.</p>
            ) : (
              <ul className="mt-2 divide-y divide-foreground/[0.06]">
                {b.rows.slice(0, 8).map((r) => (
                  <li key={r.group} className="flex items-center justify-between py-1.5 text-[12px]">
                    <span className="truncate text-foreground/80">{r.group}</span>
                    <span className="ml-2 shrink-0 rounded-full bg-foreground/[0.05] px-2 py-0.5 text-[11px] font-semibold tabular-nums">
                      {r.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}