import {
  ArrowUpRight, ArrowDownRight, Sparkles, ShieldCheck, AlertTriangle,
  CalendarDays, ChevronRight, Users, Heart, FileCheck2, Briefcase,
  GraduationCap, Activity, TrendingUp, BadgeCheck,
  Megaphone, ClipboardList, Shield, Building2, Brain, Lightbulb,
  AlertCircle, CheckCircle2, Workflow, Flame, UserPlus,
  ClipboardCheck, LifeBuoy, Lock,
  Gauge, Inbox, ArrowRight, UserCog, BarChart3, MapPin,
  Phone, MessageSquare, Trophy, Smile, Radio,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, RadialBarChart, RadialBar,
} from "recharts";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRole } from "@/contexts/OSRoleContext";
import { cn } from "@/lib/utils";
import { getStateData, type Tone, type KpiSeed, type DepartmentSeed, type AiInsightSeed, type ActivitySeed } from "@/lib/os/stateData";

/* ===================== icon maps (kept on the client) ===================== */

const KPI_ICONS: Record<string, React.ElementType> = {
  "Active Clients": Heart,
  "New Leads (7d)": UserPlus,
  "Clients Awaiting Staffing": Inbox,
  "Scheduling Fill Rate": CalendarDays,
  "Open Authorizations": FileCheck2,
  "Expiring Auths (30d)": AlertTriangle,
  "Active RBTs": UserCog,
  "Active BCBAs": ShieldCheck,
  "Recruiting Pipeline": Users,
  "Orientation Completion": GraduationCap,
  "Client Retention (90d)": BadgeCheck,
  "Session Completion": CheckCircle2,
};

const DEPT_META: Record<string, { icon: React.ElementType; tone: string }> = {
  Intake:         { icon: ClipboardList,  tone: "os-tone-rose" },
  Scheduling:     { icon: CalendarDays,   tone: "os-tone-sky" },
  Staffing:       { icon: Briefcase,      tone: "os-tone-violet" },
  Recruiting:     { icon: UserPlus,       tone: "os-tone-lilac" },
  Credentialing:  { icon: BadgeCheck,     tone: "os-tone-coral" },
  Authorizations: { icon: FileCheck2,     tone: "os-tone-amber" },
  QA:             { icon: Shield,         tone: "os-tone-mint" },
  Training:       { icon: GraduationCap,  tone: "os-tone-lilac" },
  "Parent Comms": { icon: Megaphone,      tone: "os-tone-rose" },
  Operations:     { icon: Workflow,       tone: "os-tone-violet" },
};

const AI_META: Record<AiInsightSeed["kind"], { icon: React.ElementType; tone: string }> = {
  alert: { icon: AlertCircle,   tone: "os-tone-coral" },
  warn:  { icon: AlertTriangle, tone: "os-tone-amber" },
  trend: { icon: Brain,         tone: "os-tone-sky" },
  idea:  { icon: Lightbulb,     tone: "os-tone-lilac" },
  flow:  { icon: Activity,      tone: "os-tone-mint" },
};

const ACTIVITY_META: Record<ActivitySeed["kind"], { icon: React.ElementType; tone: string }> = {
  lead:     { icon: UserPlus,      tone: "os-tone-violet" },
  schedule: { icon: CalendarDays,  tone: "os-tone-sky" },
  cred:     { icon: BadgeCheck,    tone: "os-tone-mint" },
  auth:     { icon: FileCheck2,    tone: "os-tone-amber" },
  offer:    { icon: ClipboardCheck,tone: "os-tone-lilac" },
  client:   { icon: Heart,         tone: "os-tone-rose" },
  training: { icon: GraduationCap, tone: "os-tone-violet" },
};

const QUICK_ACTIONS = [
  { label: "Add Lead",             icon: UserPlus,       tone: "os-tone-rose" },
  { label: "Assign Staff",         icon: Briefcase,      tone: "os-tone-violet" },
  { label: "Create Task",          icon: ClipboardCheck, tone: "os-tone-sky" },
  { label: "Schedule Interview",   icon: CalendarDays,   tone: "os-tone-lilac" },
  { label: "Submit Credentialing", icon: BadgeCheck,     tone: "os-tone-mint" },
  { label: "Create Escalation",    icon: Flame,          tone: "os-tone-coral" },
  { label: "Publish Training",     icon: GraduationCap,  tone: "os-tone-amber" },
  { label: "Open Reports",         icon: BarChart3,      tone: "os-tone-violet" },
];

/* ===================== helpers ===================== */

const toneText = (t: Tone) => t === "ok" ? "text-[hsl(155_55%_38%)]" : t === "warn" ? "text-[hsl(30_85%_45%)]" : "text-[hsl(355_72%_52%)]";
const toneBg   = (t: Tone) => t === "ok" ? "bg-[hsl(150_70%_92%)]" : t === "warn" ? "bg-[hsl(40_100%_92%)]" : "bg-[hsl(355_100%_95%)]";
const toneStrokeHsl = (t: Tone) => t === "ok" ? "hsl(155 55% 45%)" : t === "warn" ? "hsl(35 90% 55%)" : "hsl(355 75% 58%)";
const toneGlow = (t: Tone) =>
  t === "ok"   ? "shadow-[0_0_0_1px_hsl(155_60%_60%/0.22),0_18px_44px_-22px_hsl(155_60%_45%/0.35)]" :
  t === "warn" ? "shadow-[0_0_0_1px_hsl(35_90%_65%/0.28),0_18px_44px_-22px_hsl(35_85%_55%/0.4)]"   :
                 "shadow-[0_0_0_1px_hsl(355_75%_70%/0.30),0_18px_44px_-22px_hsl(355_72%_55%/0.45)]";
const toneLabel = (t: Tone) => t === "ok" ? "Healthy" : t === "warn" ? "Watch" : "Critical";

function Pill({ tone = "default", children }: { tone?: "default" | "high" | "med" | "low" | "ok" | "warn" | "crit"; children: React.ReactNode }) {
  const map: Record<string, string> = {
    default: "bg-foreground/[0.05] text-foreground/70",
    high:    "bg-[hsl(355_100%_95%)] text-[hsl(355_70%_50%)]",
    med:     "bg-[hsl(30_100%_94%)]  text-[hsl(30_80%_45%)]",
    low:     "bg-[hsl(210_100%_95%)] text-[hsl(215_70%_50%)]",
    ok:      "bg-[hsl(150_70%_92%)]  text-[hsl(155_55%_32%)]",
    warn:    "bg-[hsl(40_100%_92%)]  text-[hsl(30_80%_42%)]",
    crit:    "bg-[hsl(355_100%_94%)] text-[hsl(355_70%_48%)]",
  };
  return <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-tight", map[tone])}>{children}</span>;
}

function StatusDot({ status }: { status: Tone }) {
  const color =
    status === "ok"   ? "bg-[hsl(155_60%_50%)] shadow-[0_0_0_4px_hsl(155_60%_50%/0.18)]" :
    status === "warn" ? "bg-[hsl(35_90%_55%)]  shadow-[0_0_0_4px_hsl(35_90%_55%/0.18)]"  :
                        "bg-[hsl(355_75%_58%)] shadow-[0_0_0_4px_hsl(355_75%_58%/0.18)]";
  return <span className={cn("inline-block h-2 w-2 rounded-full", color)} />;
}

function Spark({ data, tone }: { data: number[]; tone: Tone }) {
  const stroke = toneStrokeHsl(tone);
  const points = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`opsp-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.32} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.75} fill={`url(#opsp-${tone})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function OpsKpi({ k }: { k: KpiSeed }) {
  const Icon = KPI_ICONS[k.key] ?? Gauge;
  return (
    <div className={cn(
      "os-rise group relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-4 backdrop-blur transition hover:-translate-y-0.5",
      toneGlow(k.status),
    )}>
      <div className={cn(
        "pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-70",
        k.status === "ok" ? "bg-[hsl(155_70%_70%/0.30)]" : k.status === "warn" ? "bg-[hsl(35_95%_70%/0.32)]" : "bg-[hsl(355_85%_75%/0.38)]"
      )} />
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn("grid h-8 w-8 place-items-center rounded-xl", toneBg(k.status), toneText(k.status))}>
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-tight">{k.key}</p>
        </div>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide", toneBg(k.status), toneText(k.status))}>
          <span className={cn("h-1 w-1 rounded-full",
            k.status === "ok" ? "bg-[hsl(155_60%_45%)]" : k.status === "warn" ? "bg-[hsl(35_90%_50%)]" : "bg-[hsl(355_75%_55%)]")} />
          {toneLabel(k.status)}
        </span>
      </div>
      <p className="relative mt-2.5 text-[26px] font-semibold tracking-tight leading-none tabular-nums">{k.value}</p>
      <div className="relative mt-1 flex items-center justify-between text-[10.5px]">
        <span className="text-muted-foreground">{k.hint}</span>
        <span className={cn("inline-flex items-center gap-0.5 font-semibold", k.up ? "os-trend-up" : "os-trend-down")}>
          {k.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {k.delta}
        </span>
      </div>
      <div className="relative mt-2 -mx-1"><Spark data={k.spark} tone={k.status} /></div>
    </div>
  );
}

/* ===================== PAGE ===================== */

export default function OSStateDirector() {
  const { user } = useAuth();
  const { activeState, role } = useOSRole();
  const d = getStateData(activeState);
  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Ezra").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const taskBuckets = ["Urgent", "Team", "Waiting", "Escalations"];

  const deptCounts = d.departments.reduce(
    (acc, dept) => {
      acc[dept.status] += 1;
      return acc;
    },
    { ok: 0, warn: 0, crit: 0 } as Record<Tone, number>,
  );
  const critBottlenecks = d.bottlenecks.filter((b) => b.severity === "crit").length;
  const warnBottlenecks = d.bottlenecks.filter((b) => b.severity === "warn").length;
  const isStateDirector = role === "state_director";

  return (
    <OSShell
      rightRail={
        <>
          {/* AI OPS INSIGHTS */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.28)] to-transparent blur-2xl" />
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                  <Brain className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold tracking-tight">AI Ops Insights · {d.code}</h3>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Predictive · Actionable</p>
                </div>
              </div>
            </header>
            <ul className="space-y-3">
              {d.ai.map((i) => {
                const meta = AI_META[i.kind];
                return (
                  <li key={i.title} className="group rounded-2xl border border-white/70 bg-white/70 p-3 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_hsl(265_60%_50%/0.25)]">
                    <div className="flex items-start gap-2.5">
                      <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl", meta.tone)}>
                        <meta.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-semibold leading-tight">{i.title}</p>
                        <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{i.body}</p>
                        <button className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-semibold text-[hsl(265_70%_55%)] hover:underline">
                          {i.cta} <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* OPS SCORE */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(155_70%_70%/0.25)] to-transparent blur-2xl" />
            <header className="mb-2">
              <h3 className="text-[14px] font-semibold tracking-tight">{d.code} Operations Score</h3>
              <p className="text-[10.5px] text-muted-foreground">Composite health · live</p>
            </header>
            <div className="relative grid place-items-center py-2">
              <div className="relative h-[140px] w-[140px]">
                <ResponsiveContainer>
                  <RadialBarChart innerRadius="75%" outerRadius="100%" data={[{ v: d.opsScore }]} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="v" cornerRadius={10} fill="hsl(265 85% 62%)" background={{ fill: "hsl(240 10% 94%)" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-[28px] font-semibold leading-none tracking-tight">{d.opsScore}</p>
                    <p className="mt-1 text-[9.5px] uppercase tracking-wider text-muted-foreground">{d.opsLabel}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="rounded-lg bg-[hsl(150_70%_94%)] py-1.5 font-semibold text-[hsl(155_55%_32%)]">{deptCounts.ok} Healthy</div>
              <div className="rounded-lg bg-[hsl(40_100%_94%)] py-1.5 font-semibold text-[hsl(30_80%_42%)]">{deptCounts.warn} Watch</div>
              <div className="rounded-lg bg-[hsl(355_100%_95%)] py-1.5 font-semibold text-[hsl(355_70%_48%)]">{deptCounts.crit} Critical</div>
            </div>
          </section>

          {/* TODAY */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold tracking-tight">Today · {d.code}</h3>
              <span className="text-[11px] text-muted-foreground">{today}</span>
            </header>
            <ul className="space-y-3">
              {d.meetings.map((m) => (
                <li key={m.title} className="flex items-center gap-3">
                  <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", m.tone)}>
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium leading-tight">{m.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{m.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* APPROVALS */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold tracking-tight">Pending Approvals</h3>
              <Pill tone="med">{d.approvals.length}</Pill>
            </header>
            <ul className="space-y-2">
              {d.approvals.map((a) => (
                <li key={a.what} className="flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/70 p-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[hsl(265_70%_55%)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold leading-tight">{a.what}</p>
                    <p className="text-[10.5px] text-muted-foreground">{a.who} · {a.due}</p>
                  </div>
                  <button className="rounded-lg bg-foreground/[0.05] px-2 py-1 text-[10.5px] font-semibold hover:bg-foreground/[0.08]">Review</button>
                </li>
              ))}
            </ul>
          </section>

          {/* NEED SUPPORT */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(355_85%_75%/0.25)] to-transparent blur-2xl" />
            <header className="mb-3 flex items-center gap-2">
              <LifeBuoy className="h-3.5 w-3.5 text-[hsl(355_70%_55%)]" />
              <h3 className="text-[14px] font-semibold tracking-tight">Need Support? · {d.code}</h3>
            </header>
            <p className="text-[11.5px] leading-snug text-muted-foreground">
              Your {d.name} leadership and escalation paths — one tap away.
            </p>
            <ul className="mt-3 space-y-2">
              {d.support.map((s) => (
                <li key={s.who} className="flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/70 p-2.5">
                  <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[11px] font-bold", s.tone)}>
                    {s.who.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold leading-tight">{s.who}</p>
                    <p className="truncate text-[10.5px] text-muted-foreground">{s.role}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="grid h-7 w-7 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Message"><MessageSquare className="h-3 w-3" /></button>
                    <button className="grid h-7 w-7 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Call"><Phone className="h-3 w-3" /></button>
                  </div>
                </li>
              ))}
            </ul>
            <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[hsl(355_75%_60%)] to-[hsl(15_85%_62%)] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(355_75%_55%/0.55)] transition hover:opacity-95">
              <Flame className="h-3.5 w-3.5" /> Create Escalation
            </button>
          </section>

          {/* LIVE ACTIVITY */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
                <h3 className="text-[14px] font-semibold tracking-tight">Live Activity · {d.code}</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[hsl(155_55%_38%)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(155_60%_50%)]" /> Live
              </span>
            </header>
            <ul className="space-y-3">
              {d.activity.map((a, i) => {
                const meta = ACTIVITY_META[a.kind];
                return (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-xl", meta.tone)}>
                      <meta.icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] leading-tight">
                        <span className="font-semibold">{a.who}</span>{" "}
                        <span className="text-muted-foreground">{a.what}</span>
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-muted-foreground">{a.when} ago</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      }
    >
      {/* HERO */}
      <header className="os-rise relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-white via-[hsl(265_100%_99%)] to-[hsl(210_100%_98%)] p-6 shadow-[0_24px_60px_-30px_hsl(265_60%_50%/0.25)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.35)] to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-24 h-56 w-56 rounded-full bg-gradient-to-br from-[hsl(210_85%_75%/0.3)] to-transparent blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-muted-foreground backdrop-blur">
              <MapPin className="h-3 w-3 text-[hsl(265_70%_55%)]" /> State Director · {d.name}
              {isStateDirector && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[hsl(265_100%_95%)] px-1.5 py-0.5 text-[9.5px] font-bold text-[hsl(265_70%_50%)]">
                  <Lock className="h-2.5 w-2.5" /> {d.code} only
                </span>
              )}
            </div>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[34px]">
              {greet}, <span className="capitalize">{name}</span> <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {today} · Here's what's happening across {d.name} today.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(150_70%_92%)] px-2.5 py-1 font-semibold text-[hsl(155_55%_32%)]">
                <ShieldCheck className="h-3 w-3" /> {d.code} ops score {d.opsScore} · {d.opsLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(40_100%_92%)] px-2.5 py-1 font-semibold text-[hsl(30_80%_42%)]">
                <AlertTriangle className="h-3 w-3" /> {d.alerts} alerts
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(355_100%_94%)] px-2.5 py-1 font-semibold text-[hsl(355_70%_48%)]">
                <Flame className="h-3 w-3" /> {d.escalations} escalations
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(265_100%_95%)] px-2.5 py-1 font-semibold text-[hsl(265_70%_50%)]">
                <Sparkles className="h-3 w-3" /> {d.insightsCount} AI insights
              </span>
            </div>
          </div>

          {/* AI Operations Briefing */}
          <div className="relative w-full max-w-md shrink-0 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_14px_36px_-20px_hsl(265_60%_50%/0.35)] backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-none tracking-tight">{d.code} State AI Briefing</p>
                <p className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Updated 3 min ago</p>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/85">{d.briefing}</p>
            <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.55)] transition hover:opacity-95">
              Open {d.code} State Insights <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Scope notice */}
        <div className="relative mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/70 bg-white/60 px-3 py-2 text-[11px] text-muted-foreground backdrop-blur">
          <Lock className="h-3 w-3 text-[hsl(265_70%_55%)]" />
          <span>
            Data scope: <span className="font-semibold text-foreground">{d.name} ({d.code})</span> · {d.regions.length} regions · all widgets,
            drilldowns, AI insights and approvals filtered to this state.
          </span>
        </div>
      </header>

      {/* SECTION 2 — DAILY OPS KPI GRID */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h2 className="text-[15px] font-semibold tracking-tight">{d.name} · State KPIs</h2>
            <Pill tone="default">{d.kpis.length} metrics</Pill>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">Today</button>
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">7d</button>
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">30d</button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {d.kpis.map((k) => <OpsKpi key={k.key} k={k} />)}
        </div>
      </section>

      {/* SECTION 3 — DEPARTMENT OPS OVERVIEW */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">{d.code} Department Operations</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Workload, completion, and AI insight across your {d.name} teams</p>
          </div>
          <button className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">View all</button>
        </header>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {d.departments.map((dept: DepartmentSeed) => {
            const meta = DEPT_META[dept.name] ?? { icon: Workflow, tone: "os-tone-violet" };
            return (
              <button key={dept.name} className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_hsl(265_60%_50%/0.28)]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("grid h-8 w-8 place-items-center rounded-xl", meta.tone)}>
                      <meta.icon className="h-4 w-4" />
                    </div>
                    <p className="text-[12.5px] font-semibold tracking-tight">{dept.name}</p>
                  </div>
                  <StatusDot status={dept.status} />
                </div>
                <p className="mt-2.5 text-[20px] font-semibold tracking-tight tabular-nums">{dept.score}<span className="ml-1 text-[10.5px] font-normal text-muted-foreground">score</span></p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                  <div className="h-full rounded-full" style={{ width: `${dept.completion}%`, background: `linear-gradient(90deg, ${toneStrokeHsl(dept.status)}, hsl(265 85% 72%))` }} />
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                  <Pill tone="default">{dept.workload} active</Pill>
                  {dept.overdue > 0 && <Pill tone={dept.overdue >= 5 ? "crit" : "warn"}>{dept.overdue} overdue</Pill>}
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-[10.5px] text-muted-foreground">
                  <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[hsl(265_70%_55%)]" />
                  {dept.ai}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 4 — BOTTLENECKS & ALERTS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-[hsl(355_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">{d.code} Operational Alerts & Escalations</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10.5px]">
            <Pill tone="crit">{critBottlenecks} critical</Pill>
            <Pill tone="warn">{warnBottlenecks} watch</Pill>
          </div>
        </header>
        <ul className="space-y-2">
          {d.bottlenecks.map((b) => (
            <li key={b.title} className={cn(
              "flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 p-3.5",
              b.severity === "crit" && "shadow-[inset_3px_0_0_hsl(355_75%_58%)]",
              b.severity === "warn" && "shadow-[inset_3px_0_0_hsl(35_90%_55%)]",
            )}>
              <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                b.severity === "crit" ? "bg-[hsl(355_100%_95%)] text-[hsl(355_70%_50%)]" : "bg-[hsl(40_100%_92%)] text-[hsl(30_80%_45%)]")}>
                {b.severity === "crit" ? <AlertCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold leading-tight">{b.title}</p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">{b.dept} · Owner {b.owner}</p>
              </div>
              <div className="hidden items-center gap-1.5 text-[10.5px] text-muted-foreground md:flex">
                <span>Recommend:</span>
                <span className="font-semibold text-foreground">{b.action}</span>
              </div>
              <button className="ml-1 inline-flex items-center gap-1 rounded-lg bg-foreground/[0.05] px-2.5 py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]">
                Resolve <ArrowRight className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* SECTION 4b — REGIONAL LEADERBOARD */}
      <section className="os-card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.18)] to-transparent blur-3xl" />
        <header className="relative mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Regional Performance · {d.code}</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Top-performing and at-risk regions across {d.name}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {["Ops Score", "Fill Rate", "Recruiting"].map((t, i) => (
              <button key={t} className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-semibold",
                i === 0 ? "bg-foreground text-background" : "bg-foreground/[0.05] text-foreground/70 hover:bg-foreground/[0.08]"
              )}>{t}</button>
            ))}
          </div>
        </header>
        <ul className="relative space-y-2">
          {d.regions.map((r, idx) => (
            <li key={r.name} className={cn(
              "group grid grid-cols-[28px,1.4fr,2fr,auto] items-center gap-4 rounded-2xl border border-white/70 bg-white/70 p-3.5 transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_hsl(265_60%_50%/0.28)]",
              r.status === "warn" && "shadow-[inset_3px_0_0_hsl(35_90%_55%)]",
              r.status === "crit" && "shadow-[inset_3px_0_0_hsl(355_75%_58%)]",
            )}>
              <div className={cn("grid h-7 w-7 place-items-center rounded-xl text-[11px] font-bold tabular-nums",
                idx === 0 ? "bg-[hsl(40_100%_88%)] text-[hsl(30_80%_38%)]" :
                idx === 1 ? "bg-[hsl(265_100%_92%)] text-[hsl(265_70%_45%)]" :
                idx === 2 ? "bg-[hsl(150_70%_88%)] text-[hsl(155_55%_30%)]" :
                            "bg-foreground/[0.05] text-foreground/70"
              )}>{idx + 1}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
                  <p className="truncate text-[13px] font-semibold leading-tight">{r.name}</p>
                  <StatusDot status={r.status} />
                </div>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">{r.clients} active clients · {r.note}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Fill",    v: r.fill },
                  { label: "Recruit", v: r.recruit },
                  { label: "Ops",     v: r.ops },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-medium uppercase tracking-wider text-muted-foreground">{m.label}</span>
                      <span className="tabular-nums font-semibold">{m.v}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                      <div className="h-full rounded-full" style={{
                        width: `${m.v}%`,
                        background: m.v >= 90 ? "hsl(155 55% 45%)" : m.v >= 80 ? "linear-gradient(90deg, hsl(265 85% 65%), hsl(285 85% 72%))" : "hsl(35 90% 55%)",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
              <span className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-semibold",
                r.trend === "up" ? "bg-[hsl(150_70%_92%)] text-[hsl(155_55%_32%)]" : "bg-[hsl(355_100%_94%)] text-[hsl(355_70%_48%)]")}>
                {r.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {r.trend === "up" ? "Improving" : "Watch"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* SECTION 5 — STAFFING & SCHEDULING HEALTH */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">{d.code} Staffing & Scheduling</h3>
          </div>
          <Pill tone="warn">{d.openNeeds} open needs</Pill>
        </header>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Fill rate by region */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-[11.5px] font-medium text-muted-foreground">Fill Rate · {d.code} clinics</p>
            <ul className="mt-3 space-y-2.5">
              {d.staffing.map((s) => (
                <li key={s.s}>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold">{s.s}</span>
                    <span className="tabular-nums text-muted-foreground">{s.fill}% · {s.need} open</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.fill}%`,
                        background: s.fill >= 95 ? "hsl(155 55% 45%)" : s.fill >= 85 ? "linear-gradient(90deg, hsl(265 85% 65%), hsl(285 85% 72%))" : "hsl(35 90% 55%)",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Utilization */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11.5px] font-medium text-muted-foreground">Utilization · 7 days · {d.code}</p>
                <p className="mt-0.5 text-[20px] font-semibold tracking-tight">
                  {Math.round(d.utilization.reduce((a, b) => a + b.v, 0) / d.utilization.length)}%
                </p>
              </div>
              <Pill tone="ok">+4%</Pill>
            </div>
            <div className="mt-2 h-[140px]">
              <ResponsiveContainer>
                <BarChart data={d.utilization} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                  <Bar dataKey="v" fill="hsl(265 85% 70%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cancellations */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11.5px] font-medium text-muted-foreground">Cancellation Rate · 7 wk · {d.code}</p>
                <p className="mt-0.5 text-[20px] font-semibold tracking-tight">{d.cancellation[d.cancellation.length - 1].v}%</p>
              </div>
              <Pill tone="ok">↓ trend</Pill>
            </div>
            <div className="mt-2 h-[140px]">
              <ResponsiveContainer>
                <LineChart data={d.cancellation} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                  <Line type="monotone" dataKey="v" stroke="hsl(155 55% 45%)" strokeWidth={2.25} dot={{ r: 2.5, fill: "hsl(155 55% 45%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — INTAKE & RECRUITING INTELLIGENCE */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="os-card lg:col-span-2">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">{d.code} Recruiting Funnel</h3>
            </div>
            <Pill tone="warn">Velocity {d.recruitFunnel[d.recruitFunnel.length - 1].v}/qtr</Pill>
          </header>
          <ul className="space-y-2.5">
            {d.recruitFunnel.map((f, i) => {
              const max = d.recruitFunnel[0].v;
              const pct = Math.round((f.v / max) * 100);
              const next = d.recruitFunnel[i + 1];
              const conv = next ? Math.round((next.v / f.v) * 100) : null;
              return (
                <li key={f.stage}>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold">{f.stage}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {f.v}{conv !== null && <span className="ml-2 text-[10.5px]">→ {conv}%</span>}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-foreground/[0.06]">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, hsl(265 85% 65%), hsl(285 85% 72%))" }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[hsl(155_55%_40%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">{d.code} Intake Conversion</h3>
            </div>
            <Pill tone="ok">3-mo</Pill>
          </header>
          <p className="text-[28px] font-semibold tracking-tight tabular-nums">{d.leadConv[d.leadConv.length - 1].v}%</p>
          <p className="text-[10.5px] text-muted-foreground">3-mo trend · {d.name}</p>
          <div className="mt-2 h-[120px]">
            <ResponsiveContainer>
              <AreaChart data={d.leadConv} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="ic-ops" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(155 55% 45%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(155 55% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                <Area type="monotone" dataKey="v" stroke="hsl(155 55% 45%)" strokeWidth={2} fill="url(#ic-ops)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* SECTION 7 — TASKS & PRIORITIES */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">{d.code} Operational Task Center</h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {["All", "My Tasks", ...taskBuckets].map((t, i) => (
              <button key={t} className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-semibold",
                i === 0 ? "bg-foreground text-background" : "bg-foreground/[0.05] text-foreground/70 hover:bg-foreground/[0.08]"
              )}>{t}</button>
            ))}
          </div>
        </header>
        <ul className="divide-y divide-foreground/[0.06]">
          {d.tasks.map((t) => {
            const prio = t.priority === "High" ? "high" : t.priority === "Medium" ? "med" : "low";
            const bucketTone = t.bucket === "Urgent" ? "crit" : t.bucket === "Escalations" ? "warn" : t.bucket === "Waiting" ? "med" : "default";
            return (
              <li key={t.title} className="group flex items-center gap-3 py-3">
                <button className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-foreground/20 text-transparent transition hover:border-[hsl(155_55%_45%)] hover:bg-[hsl(150_70%_92%)] hover:text-[hsl(155_55%_35%)]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium">{t.title}</p>
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground">{t.dept} · Owner {t.owner} · Due {t.due}</p>
                </div>
                <Pill tone={prio as "high" | "med" | "low"}>{t.priority}</Pill>
                <Pill tone={bucketTone as "crit" | "warn" | "med" | "default"}>{t.bucket}</Pill>
              </li>
            );
          })}
        </ul>
      </section>

      {/* SECTION 8 — TRAINING & EMPLOYEE ENGAGEMENT */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">{d.code} Training & Engagement</h3>
            </div>
            <span className="text-[11px] text-muted-foreground">{d.code} avg <span className="font-semibold text-foreground">{Math.round(d.training.reduce((a, b) => a + b.pct, 0) / d.training.length)}%</span></span>
          </header>
          <div className="grid grid-cols-2 gap-2.5">
            {d.training.map((t) => (
              <div key={t.name} className="rounded-xl border border-white/70 bg-white/70 p-3">
                <p className="truncate text-[11.5px] font-semibold">{t.name}</p>
                <div className="mt-1 flex items-center justify-between text-[10.5px]">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="tabular-nums font-semibold">{t.pct}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)]" style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-white/70 bg-gradient-to-br from-[hsl(150_70%_96%)] to-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(155_55%_38%)]">Operational Ready</p>
              <p className="mt-1 text-[12.5px] font-semibold">{d.training[0].name} · {d.training[0].pct}%</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-gradient-to-br from-[hsl(355_100%_96%)] to-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(355_70%_50%)]">Onboarding Risk</p>
              <p className="mt-1 text-[12.5px] font-semibold">{d.departments.find((x) => x.name === "Training")?.overdue ?? 0} employees delayed</p>
            </div>
          </div>
        </section>

        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">{d.code} Orientation by Department</h3>
            </div>
          </header>
          <div className="h-[210px]">
            <ResponsiveContainer>
              <BarChart data={d.orientationDept} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="dept" tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(255 30% 92%)" }} />
                <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                  {d.orientationDept.map((entry, i) => (
                    <Cell key={i} fill={entry.v >= 90 ? "hsl(155 55% 50%)" : entry.v >= 80 ? "hsl(265 85% 68%)" : "hsl(35 90% 60%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* SECTION — CULTURE & MOTIVATION */}
      <section className="os-rise relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-white via-[hsl(265_100%_99%)] to-[hsl(150_100%_98%)] p-6 shadow-[0_24px_60px_-30px_hsl(265_60%_50%/0.22)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.28)] to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-20 h-56 w-56 rounded-full bg-gradient-to-br from-[hsl(150_85%_75%/0.3)] to-transparent blur-3xl" />
        <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr,2fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-muted-foreground backdrop-blur">
              <Heart className="h-3 w-3 text-[hsl(355_70%_55%)]" /> Mission · Culture · Impact
            </div>
            <h3 className="mt-3 text-[22px] font-semibold tracking-tight md:text-[26px]">
              You're making a difference, <span className="capitalize">{name}</span>.
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/80">
              <span className="font-semibold text-[hsl(265_70%_50%)]">{d.childrenServed} children</span> across {d.name} received
              life-changing care this month — powered by your teams and your leadership.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(150_70%_92%)] px-2.5 py-1 font-semibold text-[hsl(155_55%_30%)]">
                <Trophy className="h-3 w-3" /> {d.highlights.topRegion}: Top region
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(265_100%_95%)] px-2.5 py-1 font-semibold text-[hsl(265_70%_50%)]">
                <Sparkles className="h-3 w-3" /> {d.highlights.newHires} new hires this week
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Parent Satisfaction", value: d.highlights.parentSat, hint: `${d.code} survey responses`,  tone: "os-tone-rose",   icon: Smile },
              { label: "Team Engagement",     value: d.highlights.engagement, hint: "Pulse · this month",          tone: "os-tone-violet", icon: Users },
              { label: "Client Outcomes",     value: d.highlights.outcomes,   hint: "Goal mastery · 90d",          tone: "os-tone-mint",   icon: TrendingUp },
              { label: "Operational Progress",value: String(d.opsScore),      hint: `${d.code} health score`,      tone: "os-tone-sky",    icon: Activity },
            ].map((m) => (
              <div key={m.label} className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-3.5 backdrop-blur">
                <div className={cn("grid h-8 w-8 place-items-center rounded-xl", m.tone)}>
                  <m.icon className="h-4 w-4" />
                </div>
                <p className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{m.label}</p>
                <p className="mt-0.5 text-[20px] font-semibold tracking-tight tabular-nums">{m.value}</p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">{m.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between" id="quick-actions-header">
          <h3 className="text-[15px] font-semibold tracking-tight">Quick Actions · {d.code}</h3>
          <span className="text-[11px] text-muted-foreground">⌘K to search anything</span>
        </header>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {QUICK_ACTIONS.map((a) => (
            <button key={a.label} className="group flex flex-col items-start gap-2 rounded-2xl border border-white/70 bg-white/70 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_hsl(265_60%_50%/0.28)]">
              <div className={cn("grid h-9 w-9 place-items-center rounded-xl", a.tone)}>
                <a.icon className="h-4 w-4" />
              </div>
              <span className="text-[11.5px] font-semibold leading-tight tracking-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </section>
    </OSShell>
  );
}
