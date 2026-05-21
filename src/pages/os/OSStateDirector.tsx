import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight, ArrowDownRight, AlertTriangle, Flame, ArrowRight,
  Sparkles, Activity, CheckCircle2, Database, Search, Command as CmdIcon,
  Users2, FolderKanban, FileCheck2, Calendar as CIcon, UserCog, UserPlus,
  BarChart3, ListChecks, CircleDot, Bell,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRole } from "@/contexts/OSRoleContext";
import { cn } from "@/lib/utils";
import { useStateOps, type WindowKey } from "@/hooks/useStateOps";
import { quickStats, attentionItems, rosterStats } from "@/lib/analytics/stateOps";
import { CommandPalette } from "@/components/layout/CommandPalette";

const STATE_NAMES: Record<string, string> = {
  NC: "North Carolina", GA: "Georgia", VA: "Virginia", TN: "Tennessee",
  MD: "Maryland", FL: "Florida", TX: "Texas", SC: "South Carolina",
};

const WORKSPACES = [
  { label: "Clients",        path: "/clients",         icon: FolderKanban, hint: "Active patients & 360° records" },
  { label: "Staffing",       path: "/staff",           icon: UserCog,      hint: "RBT/BCBA capacity & matches" },
  { label: "Recruiting",     path: "/recruiting",      icon: UserPlus,     hint: "Pipeline & open roles" },
  { label: "Authorizations", path: "/authorizations",  icon: FileCheck2,   hint: "Approvals, denials, expirations" },
  { label: "Scheduling",     path: "/scheduling",      icon: CIcon,        hint: "This week's coverage" },
  { label: "Leads",          path: "/leads",           icon: Users2,       hint: "Intake & conversion" },
  { label: "Reports",        path: "/reports",         icon: BarChart3,    hint: "Deeper analytics" },
];

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

function PulseTile({ label, value, delta, suffix, hint, tone = "neutral" }: {
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

export default function OSStateDirector() {
  const { user } = useAuth();
  const { activeState } = useOSRole();
  const navigate = useNavigate();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [windowKey] = useState<WindowKey>("12w");

  const { sessions, loading, hasAnyData, fetchedAt } = useStateOps(activeState, windowKey);
  const stats = useMemo(() => quickStats(sessions), [sessions]);
  const roster = useMemo(() => rosterStats(sessions), [sessions]);
  const attention = useMemo(() => attentionItems(sessions), [sessions]);

  const queue = useMemo(() => {
    const base = attention.slice(0, 4).map((a) => ({
      id: a.id,
      title: a.action,
      detail: a.title,
      severity: a.severity,
    }));
    return base.length ? base : [
      { id: "rev-roster",   title: "Review this week's BCBA roster",   detail: "Confirm assignments & coverage", severity: "warn" as const },
      { id: "call-parents", title: "Return outstanding parent calls",  detail: "Check escalations queue",        severity: "warn" as const },
      { id: "auth-renewals", title: "Scan expiring authorizations",    detail: "Anything within 14 days",        severity: "warn" as const },
    ];
  }, [attention]);

  const score = useMemo(() => {
    if (!sessions.length) return 0;
    const eff = Math.min(100, (stats.hoursPerClient / 16) * 100);
    const supScore = Math.min(100, (stats.supervisionRatio / 12) * 100);
    const billable = sessions.filter((s) => s.is_billable !== false).length / sessions.length * 100;
    return Math.round(eff * 0.45 + supScore * 0.25 + billable * 0.3);
  }, [sessions, stats]);

  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Director").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const stateName = STATE_NAMES[activeState] ?? activeState;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1180px] space-y-6 pb-12">

        {/* HEADER */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {today} · {stateName} · Command Center
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight md:text-[32px]">
              {greet}, {name}.
            </h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              Everything you need to run {stateName} today — operational pulse, what needs you now, and your action queue.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => setCmdOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-white/80 px-3.5 py-2 text-[12px] text-foreground/70 backdrop-blur shadow-sm transition hover:bg-white"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search clients, BCBAs, auths, candidates…</span>
              <kbd className="ml-2 inline-flex items-center gap-0.5 rounded border border-foreground/10 bg-foreground/[0.04] px-1.5 py-0.5 text-[10px] font-mono font-semibold text-foreground/60">
                <CmdIcon className="h-2.5 w-2.5" />K
              </kbd>
            </button>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-foreground/70 backdrop-blur">
                <Activity className="h-3 w-3" /> Live
              </span>
              <HealthBadge score={score} />
            </div>
          </div>
        </header>

        {/* 01 · OPERATIONAL PULSE */}
        <section>
          <header className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">01 · Operational Pulse</p>
              <h2 className="mt-0.5 text-[15px] font-semibold tracking-tight">How is {stateName} doing right now</h2>
            </div>
            <span className="text-[11px] text-muted-foreground">{roster.activeBcbas} BCBAs · {roster.activeRbts} RBTs</span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PulseTile label="Hours this week" value={stats.hoursThisWeek.toFixed(1)} delta={stats.hoursDelta} tone="good" hint="Billable + admin" />
            <PulseTile label="Active patients" value={stats.clientsThisWeek} delta={stats.clientsDelta} tone="neutral" hint="Distinct, this week" />
            <PulseTile label="Hours / patient" value={stats.hoursPerClient.toFixed(1)} delta={stats.hoursPerClientDelta} tone="good" hint="Staffing efficiency" />
            <PulseTile label="Supervision ratio" value={stats.supervisionRatio.toFixed(1)} suffix="%" delta={stats.supervisionDelta} tone="good" hint="97155 / 97153" />
          </div>
        </section>

        {/* 02 · ATTENTION REQUIRED (dominant) */}
        <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-white via-white to-[hsl(355_100%_98%)] p-6 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_30px_70px_-40px_hsl(355_50%_40%/0.18)] md:p-7">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-to-br from-[hsl(355_85%_70%/0.14)] to-transparent blur-3xl" />
          <header className="relative mb-5 flex items-end justify-between">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[hsl(355_72%_52%)]">02 · Attention Required</p>
              <h2 className="mt-1 text-[22px] font-semibold tracking-tight md:text-[24px]">
                {attention.length === 0 ? "Nothing on fire." : `${attention.length} operational ${attention.length === 1 ? "fire" : "fires"} need you`}
              </h2>
              <p className="mt-1 text-[12.5px] text-muted-foreground">The real command center — what's broken, blocked, or at risk right now.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(355_72%_75%)]/30 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[hsl(355_72%_45%)]">
              <Bell className="h-3 w-3" /> Live signals
            </span>
          </header>
          {attention.length === 0 ? (
            <div className="relative grid place-items-center gap-2 rounded-2xl border border-dashed border-foreground/15 bg-white/60 py-12 text-center">
              <CheckCircle2 className="h-6 w-6 text-[hsl(155_55%_45%)]" />
              <p className="text-[13px] font-semibold">All clear in {stateName}.</p>
              <p className="text-[11.5px] text-muted-foreground">No red flags detected in the current window.</p>
            </div>
          ) : (
            <div className="relative grid gap-3 md:grid-cols-2">
              {attention.map((a) => {
                const tone = a.severity === "crit"
                  ? { bg: "bg-[hsl(355_100%_95%)]", text: "text-[hsl(355_72%_52%)]", ring: "shadow-[0_0_0_1px_hsl(355_75%_70%/0.30),0_18px_44px_-24px_hsl(355_72%_55%/0.40)]" }
                  : { bg: "bg-[hsl(40_100%_94%)]",  text: "text-[hsl(30_85%_45%)]", ring: "shadow-[0_0_0_1px_hsl(35_90%_65%/0.24),0_18px_44px_-24px_hsl(35_85%_50%/0.35)]" };
                const Icon = a.severity === "crit" ? Flame : AlertTriangle;
                return (
                  <article key={a.id} className={cn("group rounded-2xl border border-white/70 bg-white/85 p-4 backdrop-blur transition hover:-translate-y-0.5", tone.ring)}>
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

        {/* 03 · ACTION QUEUE */}
        <section className="rounded-[24px] border border-white/70 bg-white/80 p-6 backdrop-blur shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_24px_60px_-40px_hsl(220_40%_30%/0.18)]">
          <header className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">03 · Action Queue</p>
              <h2 className="mt-0.5 flex items-center gap-2 text-[17px] font-semibold tracking-tight">
                <ListChecks className="h-4 w-4 text-[hsl(265_70%_55%)]" /> What you actually need to do today
              </h2>
            </div>
            <span className="text-[11px] text-muted-foreground">{queue.length} item{queue.length === 1 ? "" : "s"}</span>
          </header>
          <ul className="divide-y divide-foreground/[0.05]">
            {queue.map((q) => (
              <li key={q.id} className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <CircleDot className={cn("mt-0.5 h-4 w-4 shrink-0",
                  q.severity === "crit" ? "text-[hsl(355_72%_52%)]" : "text-[hsl(30_85%_50%)]")} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold leading-snug">{q.title}</p>
                  <p className="text-[11.5px] text-muted-foreground">{q.detail}</p>
                </div>
                <button className="opacity-0 transition group-hover:opacity-100 text-[11.5px] font-semibold text-foreground/70 hover:text-foreground inline-flex items-center gap-1">
                  Open <ArrowRight className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* 04 · STATE WORKSPACES */}
        <section>
          <header className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">04 · State Workspaces</p>
              <h2 className="mt-0.5 text-[15px] font-semibold tracking-tight">Jump into any operational area</h2>
            </div>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WORKSPACES.map((w) => (
              <button
                key={w.path}
                onClick={() => navigate(w.path)}
                className="group flex items-start gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 text-left backdrop-blur transition hover:-translate-y-0.5 hover:bg-white shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_18px_44px_-30px_hsl(220_40%_30%/0.25)]"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_70%)] to-[hsl(220_85%_65%)] text-white">
                  <w.icon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold leading-tight">{w.label}</p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">{w.hint}</p>
                </div>
                <ArrowRight className="mt-1 h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </button>
            ))}
          </div>
        </section>

        {!loading && !hasAnyData && (
          <section className="grid place-items-center gap-2 rounded-3xl border border-dashed border-foreground/15 bg-white/50 py-10 text-center">
            <Database className="h-7 w-7 text-foreground/40" />
            <p className="text-[14px] font-semibold">No session data for {stateName} yet</p>
            <p className="max-w-md text-[12px] text-muted-foreground">
              Once the latest CMS export is imported, Operational Pulse fills in automatically.
            </p>
          </section>
        )}

        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          <Sparkles className="mr-1 inline h-3 w-3" />
          Run your state from one calm screen — press <kbd className="rounded border border-foreground/10 bg-foreground/[0.04] px-1 py-0.5 text-[10px] font-mono">⌘K</kbd> to search anything.
          {fetchedAt && <> · Updated {new Date(fetchedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</>}
        </p>
      </div>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </OSShell>
  );
}
