import {
  ArrowUpRight, ArrowDownRight, Sparkles, Crown, ShieldCheck, AlertTriangle,
  CalendarDays, ChevronRight, Users, Heart, FileCheck2, Briefcase, DollarSign,
  GraduationCap, Activity, TrendingUp, Award, Gauge, Clock, BadgeCheck,
  Megaphone, ClipboardList, Shield, Building2, Target, Stethoscope,
  Wallet, Brain, Lightbulb, AlertCircle, CheckCircle2, MapPin, Rocket,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, RadialBarChart, RadialBar, LineChart, Line,
} from "recharts";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

/* ============ MOCK DATA ============ */

type KpiTone = "ok" | "warn" | "crit";
type Kpi = {
  label: string;
  value: string;
  goal: string;
  pct: number; // 0..100 progress toward goal
  delta: string;
  up: boolean;
  status: KpiTone;
  hint: string;
  spark: number[];
};

const kpis: Kpi[] = [
  { label: "New Client Acquisition", value: "112",   goal: "≥ 100",   pct: 100, delta: "+14%", up: true,  status: "ok",   hint: "MTD vs target",       spark: [62,68,74,78,86,92,98,104,110,112] },
  { label: "Session Completion",     value: "94.2%", goal: "≥ 95%",   pct: 92,  delta: "+1.4%",up: true,  status: "warn", hint: "Missed: 188 / 3,240", spark: [88,89,90,91,90,92,93,93,94,94] },
  { label: "Offer Letters Sent",     value: "58%",   goal: "≥ 50%",   pct: 100, delta: "+6%",  up: true,  status: "ok",   hint: "Accepted: 41 of 71",  spark: [42,44,46,48,49,51,53,55,57,58] },
  { label: "Case Longevity",         value: "62 wk", goal: "≥ 50 wk", pct: 100, delta: "+3 wk",up: true,  status: "ok",   hint: "Discharge rate ↓ 8%", spark: [50,52,54,56,57,58,60,61,62,62] },
  { label: "Orientation Completion", value: "84%",   goal: "≥ 90%",   pct: 88,  delta: "-2%",  up: false, status: "warn", hint: "Backlog: 12 staff",   spark: [88,89,89,87,86,85,85,84,84,84] },
  { label: "BCBA Profitability",     value: "88",    goal: "≥ 85",    pct: 100, delta: "+3",   up: true,  status: "ok",   hint: "ROI index",           spark: [78,80,82,83,84,86,86,87,88,88] },
  { label: "Claims Denial Rate",     value: "12.4%", goal: "≤ 8%",    pct: 65,  delta: "+1.8%",up: false, status: "crit", hint: "GA payer mix risk",   spark: [9,9.5,10,10.5,11,11.2,11.8,12,12.3,12.4] },
  { label: "Client Retention",       value: "82%",   goal: "≥ 75%",   pct: 100, delta: "+4%",  up: true,  status: "ok",   hint: "Churn: 18% / 90d",    spark: [74,75,76,77,78,79,80,81,82,82] },
  { label: "Lifetime Value",         value: "$48K",  goal: "≥ $40K",  pct: 100, delta: "+$6K", up: true,  status: "ok",   hint: "FL leading +$11K",    spark: [34,36,38,40,42,44,45,46,47,48] },
  { label: "Gross Revenue (MTD)",    value: "$1.62M",goal: "≥ $1.50M",pct: 100, delta: "+12%", up: true,  status: "ok",   hint: "Forecast: $1.74M",    spark: [820,910,1010,1120,1240,1340,1450,1530,1600,1620] },
  { label: "Active Clients",         value: "842",   goal: "≥ 800",   pct: 100, delta: "+62",  up: true,  status: "ok",   hint: "Waitlist: 73",        spark: [720,740,760,775,790,800,815,825,835,842] },
  { label: "Total Hours Delivered",  value: "28,140",goal: "≥ 30,000",pct: 94,  delta: "+7%",  up: true,  status: "warn", hint: "Utilization 82%",     spark: [22000,23500,24800,25900,26500,27100,27600,27900,28000,28140] },
];

const revenueData = [
  { m: "Nov", actual: 940, forecast: null },
  { m: "Dec", actual: 1020, forecast: null },
  { m: "Jan", actual: 1110, forecast: null },
  { m: "Feb", actual: 1240, forecast: null },
  { m: "Mar", actual: 1380, forecast: null },
  { m: "Apr", actual: 1520, forecast: null },
  { m: "May", actual: 1620, forecast: 1620 },
  { m: "Jun", actual: null, forecast: 1740 },
  { m: "Jul", actual: null, forecast: 1860 },
  { m: "Aug", actual: null, forecast: 2010 },
];

const clientGrowth = [
  { m: "Nov", v: 640 }, { m: "Dec", v: 680 }, { m: "Jan", v: 720 },
  { m: "Feb", v: 755 }, { m: "Mar", v: 780 }, { m: "Apr", v: 810 }, { m: "May", v: 842 },
];

const recruitingFunnel = [
  { stage: "Applicants",  v: 412 },
  { stage: "Screened",    v: 218 },
  { stage: "Interviewed", v: 124 },
  { stage: "Offered",     v: 71 },
  { stage: "Hired",       v: 41 },
];

const payerMix = [
  { name: "BCBS",     value: 38, color: "hsl(265 85% 65%)" },
  { name: "Aetna",    value: 22, color: "hsl(210 85% 60%)" },
  { name: "Tricare",  value: 14, color: "hsl(330 75% 62%)" },
  { name: "Medicaid", value: 18, color: "hsl(30 90% 60%)"  },
  { name: "Self-Pay", value: 8,  color: "hsl(155 60% 50%)" },
];

const stateRevenue = [
  { s: "FL", v: 612 }, { s: "GA", v: 384 }, { s: "NC", v: 248 },
  { s: "TX", v: 226 }, { s: "AZ", v: 150 },
];

const denialTrend = [
  { m: "Nov", v: 8.2 }, { m: "Dec", v: 8.6 }, { m: "Jan", v: 9.1 },
  { m: "Feb", v: 10.2 }, { m: "Mar", v: 11.0 }, { m: "Apr", v: 11.8 }, { m: "May", v: 12.4 },
];

const departments = [
  { name: "Intake",         icon: ClipboardList,score: 94, status: "ok",   trend: "+6%",  insight: "Response time down to 14m",         tone: "os-tone-rose" },
  { name: "Recruiting",     icon: Users,        score: 78, status: "warn", trend: "-8%",  insight: "Offer acceptance dropped 8%",       tone: "os-tone-violet" },
  { name: "Scheduling",     icon: CalendarDays, score: 92, status: "ok",   trend: "+4%",  insight: "Fill rate 92% across all states",   tone: "os-tone-sky" },
  { name: "Authorizations", icon: FileCheck2,   score: 81, status: "warn", trend: "-3%",  insight: "23 auths expiring in 30 days",      tone: "os-tone-amber" },
  { name: "QA",             icon: Shield,       score: 72, status: "warn", trend: "-5%",  insight: "VA backlog growing 12%",            tone: "os-tone-mint" },
  { name: "Billing",        icon: DollarSign,   score: 68, status: "crit", trend: "-9%",  insight: "GA denial rate climbing",           tone: "os-tone-coral" },
  { name: "HR",             icon: Building2,    score: 91, status: "ok",   trend: "+2%",  insight: "Onboarding completion 94%",         tone: "os-tone-violet" },
  { name: "Training",       icon: GraduationCap,score: 84, status: "warn", trend: "-1%",  insight: "12 overdue across 4 depts",         tone: "os-tone-lilac" },
  { name: "Marketing",      icon: Megaphone,    score: 96, status: "ok",   trend: "+18%", insight: "Lead ROI 3.4× — best quarter",      tone: "os-tone-coral" },
];

const aiInsights = [
  { icon: AlertCircle, tone: "os-tone-coral",  title: "GA staffing risk",          body: "GA staffing likely to impact session completion next week. Forecast confidence 87%.", cta: "Open forecast" },
  { icon: AlertTriangle,tone: "os-tone-amber", title: "VA recruiting velocity",    body: "VA recruiting velocity 22% below target. 3 candidates stalled at offer stage.",       cta: "Review pipeline" },
  { icon: TrendingUp,  tone: "os-tone-mint",   title: "FL retention surge",        body: "FL 90-day retention up 9 pts. Pattern matches new BCBA scorecard rollout.",          cta: "See drivers" },
  { icon: Lightbulb,   tone: "os-tone-lilac",  title: "Suggested rollout",         body: "Roll FL BCBA scorecard to GA & NC — expected retention lift 4–6 pts.",               cta: "Plan rollout" },
  { icon: Activity,    tone: "os-tone-sky",    title: "Denial rate alert",         body: "Aetna denials trending +18% over 14d. Recommend payer audit.",                       cta: "Run audit" },
];

const tasks = [
  { title: "Approve Q3 expansion plan",          owner: "Chad",   dept: "Strategy",  due: "Today",    priority: "High",   bucket: "Urgent" },
  { title: "Review GA denial rate root cause",   owner: "COO",    dept: "Billing",   due: "Today",    priority: "High",   bucket: "Urgent" },
  { title: "Sign off on new BCBA scorecard",     owner: "Chad",   dept: "Clinical",  due: "Tomorrow", priority: "Medium", bucket: "Strategic" },
  { title: "Recruiting velocity action plan",    owner: "Sarah",  dept: "Recruiting",due: "Fri",      priority: "High",   bucket: "Waiting" },
  { title: "Board prep — May QBR",               owner: "Chad",   dept: "Leadership",due: "May 30",   priority: "Medium", bucket: "Strategic" },
  { title: "Escalation: Aetna contract review",  owner: "Legal",  dept: "Finance",   due: "Jun 03",   priority: "High",   bucket: "Escalations" },
];

const meetings = [
  { title: "Executive Standup",       time: "9:00 – 9:30 AM",  tone: "os-tone-sky" },
  { title: "Board Prep — May QBR",    time: "10:30 – 12:00",   tone: "os-tone-violet" },
  { title: "GA State Director 1:1",   time: "1:00 – 1:30 PM",  tone: "os-tone-rose" },
  { title: "Finance Review",          time: "3:00 – 4:00 PM",  tone: "os-tone-amber" },
];

const growth = [
  { label: "Projected Active Clients (Q3)", value: "1,140", delta: "+35%", up: true, hint: "+298 net new" },
  { label: "Projected Revenue (Q3)",        value: "$5.6M", delta: "+22%", up: true, hint: "Confidence 84%" },
  { label: "Hiring Need (Q3)",              value: "84",    delta: "+18",  up: true, hint: "RBT 62 · BCBA 22" },
  { label: "State Expansion Readiness",     value: "SC · TN", delta: "Q4",  up: true, hint: "Credentialing in motion" },
];

/* ============ helpers ============ */

const toneText = (t: KpiTone) => t === "ok" ? "text-[hsl(155_55%_38%)]" : t === "warn" ? "text-[hsl(30_85%_45%)]" : "text-[hsl(355_72%_52%)]";
const toneBg   = (t: KpiTone) => t === "ok" ? "bg-[hsl(150_70%_92%)]" : t === "warn" ? "bg-[hsl(40_100%_92%)]" : "bg-[hsl(355_100%_95%)]";
const toneStrokeHsl = (t: KpiTone) => t === "ok" ? "hsl(155 55% 45%)" : t === "warn" ? "hsl(35 90% 55%)" : "hsl(355 75% 58%)";
const toneGlow = (t: KpiTone) =>
  t === "ok"   ? "shadow-[0_0_0_1px_hsl(155_60%_60%/0.25),0_18px_44px_-22px_hsl(155_60%_45%/0.4)]" :
  t === "warn" ? "shadow-[0_0_0_1px_hsl(35_90%_65%/0.30),0_18px_44px_-22px_hsl(35_85%_55%/0.45)]"  :
                 "shadow-[0_0_0_1px_hsl(355_75%_70%/0.30),0_18px_44px_-22px_hsl(355_72%_55%/0.5)]";
const toneLabel = (t: KpiTone) => t === "ok" ? "Healthy" : t === "warn" ? "Needs Attention" : "At Risk";

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

function Spark({ data, tone }: { data: number[]; tone: KpiTone }) {
  const stroke = toneStrokeHsl(tone);
  const points = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sp-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.75} fill={`url(#sp-${tone})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StatusDot({ status }: { status: KpiTone }) {
  const color =
    status === "ok"   ? "bg-[hsl(155_60%_50%)] shadow-[0_0_0_4px_hsl(155_60%_50%/0.18)]" :
    status === "warn" ? "bg-[hsl(35_90%_55%)]  shadow-[0_0_0_4px_hsl(35_90%_55%/0.18)]"  :
                        "bg-[hsl(355_75%_58%)] shadow-[0_0_0_4px_hsl(355_75%_58%/0.18)]";
  return <span className={cn("inline-block h-2 w-2 rounded-full", color)} />;
}

/* ============ KPI card ============ */

function ExecKpi({ k }: { k: Kpi }) {
  return (
    <div className={cn(
      "os-rise group relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-4 backdrop-blur transition hover:-translate-y-0.5",
      toneGlow(k.status),
    )}>
      {/* tone wash */}
      <div className={cn(
        "pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-70",
        k.status === "ok" ? "bg-[hsl(155_70%_70%/0.35)]" : k.status === "warn" ? "bg-[hsl(35_95%_70%/0.35)]" : "bg-[hsl(355_85%_75%/0.4)]"
      )} />

      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{k.label}</p>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide", toneBg(k.status), toneText(k.status))}>
          <span className={cn("h-1 w-1 rounded-full",
            k.status === "ok" ? "bg-[hsl(155_60%_45%)]" : k.status === "warn" ? "bg-[hsl(35_90%_50%)]" : "bg-[hsl(355_75%_55%)]")} />
          {toneLabel(k.status)}
        </span>
      </div>

      <p className="relative mt-2 text-[28px] font-semibold tracking-tight leading-none tabular-nums">{k.value}</p>
      <div className="relative mt-1 flex items-center justify-between text-[10.5px]">
        <span className="text-muted-foreground">Goal {k.goal}</span>
        <span className={cn("inline-flex items-center gap-0.5 font-semibold", k.up ? "os-trend-up" : "os-trend-down")}>
          {k.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {k.delta}
        </span>
      </div>

      {/* progress to goal */}
      <div className="relative mt-2.5 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, k.pct)}%`,
            background: `linear-gradient(90deg, ${toneStrokeHsl(k.status)}, ${k.status === "ok" ? "hsl(165 70% 55%)" : k.status === "warn" ? "hsl(40 95% 60%)" : "hsl(345 75% 60%)"})`,
          }}
        />
      </div>

      <div className="relative mt-2 -mx-1"><Spark data={k.spark} tone={k.status} /></div>
      <p className="relative mt-1 text-[10.5px] text-muted-foreground">{k.hint}</p>
    </div>
  );
}

/* ============ PAGE ============ */

export default function OSExecutive() {
  const { user } = useAuth();
  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Chad").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const healthScore = 87;
  const taskBuckets = ["Urgent", "Waiting", "Strategic", "Escalations"];

  return (
    <OSShell
      rightRail={
        <>
          {/* AI EXECUTIVE INSIGHTS */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.28)] to-transparent blur-2xl" />
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                  <Brain className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold tracking-tight">AI Executive Insights</h3>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Predictive · Strategic</p>
                </div>
              </div>
            </header>
            <ul className="space-y-3">
              {aiInsights.map((i) => (
                <li key={i.title} className="group rounded-2xl border border-white/70 bg-white/70 p-3 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_hsl(265_60%_50%/0.25)]">
                  <div className="flex items-start gap-2.5">
                    <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl", i.tone)}>
                      <i.icon className="h-4 w-4" />
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
              ))}
            </ul>
          </section>

          {/* Upcoming Leadership */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold tracking-tight">Leadership Today</h3>
              <span className="text-[11px] text-muted-foreground">{today}</span>
            </header>
            <ul className="space-y-3">
              {meetings.map((m) => (
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

          {/* Company Health Score */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(155_70%_70%/0.3)] to-transparent blur-2xl" />
            <header className="mb-2">
              <h3 className="text-[14px] font-semibold tracking-tight">Company Health</h3>
              <p className="text-[10.5px] text-muted-foreground">Composite operational score</p>
            </header>
            <div className="relative grid place-items-center py-2">
              <div className="relative h-[140px] w-[140px]">
                <ResponsiveContainer>
                  <RadialBarChart innerRadius="75%" outerRadius="100%" data={[{ v: healthScore }]} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="v" cornerRadius={10} fill="hsl(155 55% 45%)" background={{ fill: "hsl(240 10% 94%)" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-[28px] font-semibold leading-none tracking-tight">{healthScore}</p>
                    <p className="mt-1 text-[9.5px] uppercase tracking-wider text-muted-foreground">Healthy</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="rounded-lg bg-[hsl(150_70%_94%)] py-1.5 font-semibold text-[hsl(155_55%_32%)]">7 Healthy</div>
              <div className="rounded-lg bg-[hsl(40_100%_94%)] py-1.5 font-semibold text-[hsl(30_80%_42%)]">4 Watch</div>
              <div className="rounded-lg bg-[hsl(355_100%_95%)] py-1.5 font-semibold text-[hsl(355_70%_48%)]">1 Risk</div>
            </div>
          </section>
        </>
      }
    >
      {/* HERO */}
      <header className="os-rise relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-white via-[hsl(265_100%_99%)] to-[hsl(220_100%_98%)] p-6 shadow-[0_24px_60px_-30px_hsl(265_60%_50%/0.25)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.35)] to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-24 h-56 w-56 rounded-full bg-gradient-to-br from-[hsl(210_85%_75%/0.3)] to-transparent blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-muted-foreground backdrop-blur">
              <Crown className="h-3 w-3 text-[hsl(265_70%_55%)]" /> Executive Leadership · Company Pulse
            </div>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[34px]">
              {greet}, <span className="capitalize">{name}</span> <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {today} · Here's the current health of Blossom across all operations.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(150_70%_92%)] px-2.5 py-1 font-semibold text-[hsl(155_55%_32%)]">
                <ShieldCheck className="h-3 w-3" /> Health score 87 · Healthy
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(40_100%_92%)] px-2.5 py-1 font-semibold text-[hsl(30_80%_42%)]">
                <AlertTriangle className="h-3 w-3" /> 4 active alerts
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(265_100%_95%)] px-2.5 py-1 font-semibold text-[hsl(265_70%_50%)]">
                <Sparkles className="h-3 w-3" /> 5 AI insights
              </span>
            </div>
          </div>

          {/* AI Executive Briefing */}
          <div className="relative w-full max-w-md shrink-0 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_14px_36px_-20px_hsl(265_60%_50%/0.35)] backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-none tracking-tight">Executive AI Briefing</p>
                <p className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Generated 4 min ago</p>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/85">
              Client acquisition is up <span className="font-semibold text-[hsl(155_55%_38%)]">14%</span> this week and revenue is pacing <span className="font-semibold text-[hsl(155_55%_38%)]">+12%</span> against plan.
              However, claims denial rate has increased in <span className="font-semibold text-[hsl(355_70%_52%)]">Georgia</span> and orientation completion is below target.
            </p>
            <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.55)] transition hover:opacity-95">
              Open Full Briefing <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 2 — PRIMARY KPI GRID */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h2 className="text-[15px] font-semibold tracking-tight">Executive KPIs</h2>
            <Pill tone="default">12 metrics</Pill>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">MTD</button>
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">QTD</button>
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">YTD</button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kpis.map((k) => <ExecKpi key={k.label} k={k} />)}
        </div>
      </section>

      {/* SECTION 3 — COMPANY HEALTH ANALYTICS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Company Health</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Growth, retention, revenue and recruiting trends</p>
          </div>
          <button className="os-glass-input rounded-xl px-3 py-1.5 text-[12px] font-medium">Last 9 months ▾</button>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Revenue + Forecast */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11.5px] font-medium text-muted-foreground">Gross Revenue · Actual vs Forecast</p>
                <p className="mt-0.5 text-[22px] font-semibold tracking-tight">$1.62M</p>
                <p className="text-[10.5px] text-muted-foreground">Forecast Aug: $2.01M</p>
              </div>
              <Pill tone="ok">+12% MoM</Pill>
            </div>
            <div className="mt-3 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev-act" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(265 85% 65%)" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="hsl(265 85% 65%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="rev-fc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(155 55% 45%)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(155 55% 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} tickFormatter={(v) => `$${v}K`} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(255 30% 92%)" }} formatter={(v: number) => `$${v}K`} />
                  <Area type="monotone" dataKey="actual"   stroke="hsl(265 85% 60%)" strokeWidth={2.25} fill="url(#rev-act)" dot={false} />
                  <Area type="monotone" dataKey="forecast" stroke="hsl(155 55% 45%)" strokeWidth={2}    strokeDasharray="5 4" fill="url(#rev-fc)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payer mix */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-[11.5px] font-medium text-muted-foreground">Payer Mix</p>
            <div className="mt-1 flex items-center gap-3">
              <div className="relative h-[140px] w-[140px] shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={payerMix} dataKey="value" innerRadius={44} outerRadius={64} paddingAngle={3} strokeWidth={0}>
                      {payerMix.map((p) => <Cell key={p.name} fill={p.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-[16px] font-semibold leading-none">5</p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">payers</p>
                  </div>
                </div>
              </div>
              <ul className="flex-1 space-y-1.5 text-[11.5px]">
                {payerMix.map((p) => (
                  <li key={p.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                    <span className="flex-1 font-medium">{p.name}</span>
                    <span className="tabular-nums text-muted-foreground">{p.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Client growth */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11.5px] font-medium text-muted-foreground">Active Clients · 7-mo growth</p>
                <p className="mt-0.5 text-[20px] font-semibold tracking-tight">842</p>
              </div>
              <Pill tone="ok">+31%</Pill>
            </div>
            <div className="mt-2 h-[110px]">
              <ResponsiveContainer>
                <AreaChart data={clientGrowth} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(265 85% 65%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(265 85% 65%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                  <Area type="monotone" dataKey="v" stroke="hsl(265 85% 60%)" strokeWidth={2} fill="url(#cg)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recruiting Funnel */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-[11.5px] font-medium text-muted-foreground">Recruiting Funnel · MTD</p>
            <ul className="mt-3 space-y-2">
              {recruitingFunnel.map((f, i) => {
                const max = recruitingFunnel[0].v;
                const pct = Math.round((f.v / max) * 100);
                return (
                  <li key={f.stage}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold">{f.stage}</span>
                      <span className="tabular-nums text-muted-foreground">{f.v}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, hsl(265 85% 65%), hsl(285 85% 72%))" }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Denial trend */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11.5px] font-medium text-muted-foreground">Claims Denial Rate · 7 mo</p>
                <p className="mt-0.5 text-[20px] font-semibold tracking-tight">12.4%</p>
              </div>
              <Pill tone="crit">+4.2 pts</Pill>
            </div>
            <div className="mt-2 h-[110px]">
              <ResponsiveContainer>
                <LineChart data={denialTrend} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <XAxis dataKey="m" tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                  <Line type="monotone" dataKey="v" stroke="hsl(355 75% 58%)" strokeWidth={2.25} dot={{ r: 2.5, fill: "hsl(355 75% 58%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — DEPARTMENT INTELLIGENCE */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Department Intelligence</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Health scores, trends and AI insight per department</p>
          </div>
          <button className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">View all</button>
        </header>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <button key={d.name} className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_hsl(265_60%_50%/0.28)]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn("grid h-9 w-9 place-items-center rounded-xl", d.tone)}>
                    <d.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[12.5px] font-semibold tracking-tight">{d.name}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
                      <StatusDot status={d.status as KpiTone} /> {toneLabel(d.status as KpiTone)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[20px] font-semibold tracking-tight tabular-nums">{d.score}</p>
                  <p className={cn("inline-flex items-center gap-0.5 text-[10.5px] font-semibold", d.trend.startsWith("+") ? "os-trend-up" : "os-trend-down")}>
                    {d.trend.startsWith("+") ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{d.trend}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                <div className="h-full rounded-full" style={{ width: `${d.score}%`, background: `linear-gradient(90deg, ${toneStrokeHsl(d.status as KpiTone)}, hsl(265 85% 72%))` }} />
              </div>
              <p className="mt-2.5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[hsl(265_70%_55%)]" />
                {d.insight}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 5 — FINANCIAL INTELLIGENCE */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Financial Intelligence</h3>
          </div>
          <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">Q2 ▾</button>
        </header>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Gross Revenue",   value: "$1.62M",  delta: "+12%", up: true,  tone: "ok"   },
            { label: "Collections",     value: "$1.41M",  delta: "+9%",  up: true,  tone: "ok"   },
            { label: "Avg Reimburse",   value: "$112/hr", delta: "+$4",  up: true,  tone: "ok"   },
            { label: "Denial Rate",     value: "12.4%",   delta: "+1.8%",up: false, tone: "crit" },
          ].map((f) => (
            <div key={f.label} className="rounded-2xl border border-white/70 bg-white/70 p-3.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</p>
              <p className="mt-1 text-[20px] font-semibold tracking-tight">{f.value}</p>
              <p className={cn("mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold", f.up ? "os-trend-up" : "os-trend-down")}>
                {f.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{f.delta}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-white/70 bg-white/70 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11.5px] font-medium text-muted-foreground">Revenue by State · MTD ($K)</p>
            <Pill tone="default">FL leads +$612K</Pill>
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer>
              <BarChart data={stateRevenue} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="s" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(240 5% 55%)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(240 5% 55%)" }} tickFormatter={(v) => `$${v}K`} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(255 30% 92%)" }} formatter={(v: number) => `$${v}K`} />
                <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                  {stateRevenue.map((s, i) => (
                    <Cell key={i} fill={`hsl(${265 + i * 6} 85% ${68 - i * 3}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* SECTION 6 — STAFFING & CLINICAL HEALTH */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Staffing & Clinical</h3>
            </div>
            <Pill tone="warn">2 risks</Pill>
          </header>
          <ul className="space-y-2.5">
            {[
              { label: "RBT Coverage",            v: "92%", tone: "ok",   hint: "FL 96 · GA 88 · NC 82" },
              { label: "BCBA Utilization",        v: "78%", tone: "warn", hint: "Target 85%" },
              { label: "Orientation Completion",  v: "84%", tone: "warn", hint: "12 staff backlog" },
              { label: "Burnout Indicator",       v: "Low", tone: "ok",   hint: "0 red flags this week" },
              { label: "Recruiting Velocity",     v: "11/wk",tone: "warn",hint: "Target 14/wk · VA below" },
              { label: "Credentialing Bottleneck",v: "5",   tone: "crit", hint: "VA stalled > 7 days" },
            ].map((s) => (
              <li key={s.label} className="flex items-center gap-3 rounded-xl border border-white/70 bg-white/70 p-2.5">
                <StatusDot status={s.tone as KpiTone} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold leading-tight">{s.label}</p>
                  <p className="text-[10.5px] text-muted-foreground">{s.hint}</p>
                </div>
                <span className="rounded-lg bg-foreground/[0.05] px-2 py-1 text-[11px] font-bold tabular-nums">{s.v}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* TRAINING & EMPLOYEE HEALTH */}
        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Training & Employee Health</h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Co. completion <span className="font-semibold text-foreground">87%</span></span>
          </header>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { name: "RBT Onboarding 2.0", pct: 92 },
              { name: "HIPAA Refresher",    pct: 78 },
              { name: "Documentation SOP",  pct: 64 },
              { name: "Crisis Response",    pct: 51 },
            ].map((t) => (
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
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(155_55%_38%)]">Most Improved</p>
              <p className="mt-1 text-[12.5px] font-semibold">FL Field Ops · +14%</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-gradient-to-br from-[hsl(355_100%_96%)] to-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(355_70%_50%)]">Training Risk Area</p>
              <p className="mt-1 text-[12.5px] font-semibold">VA BCBA · 41% completion</p>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 9 — EXECUTIVE PRIORITIES */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Executive Priorities</h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {["All", ...taskBuckets].map((t, i) => (
              <button key={t} className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-semibold",
                i === 0 ? "bg-foreground text-background" : "bg-foreground/[0.05] text-foreground/70 hover:bg-foreground/[0.08]"
              )}>{t}</button>
            ))}
          </div>
        </header>
        <ul className="divide-y divide-foreground/[0.06]">
          {tasks.map((t) => {
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
                <Pill tone={prio as any}>{t.priority}</Pill>
                <Pill tone={bucketTone as any}>{t.bucket}</Pill>
              </li>
            );
          })}
        </ul>
      </section>

      {/* SECTION 10 — GROWTH & FORECASTING */}
      <section className="os-card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.25)] to-transparent blur-3xl" />
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Growth & Forecasting</h3>
            <Pill tone="default">Boardroom view</Pill>
          </div>
          <button className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">Open strategic plan</button>
        </header>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {growth.map((g) => (
            <div key={g.label} className="rounded-2xl border border-white/70 bg-white/75 p-4 backdrop-blur">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</p>
              <p className="mt-1 text-[22px] font-semibold tracking-tight">{g.value}</p>
              <p className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold os-trend-up">
                <ArrowUpRight className="h-3 w-3" /> {g.delta}
              </p>
              <p className="mt-1.5 text-[10.5px] text-muted-foreground">{g.hint}</p>
            </div>
          ))}
        </div>
        <div className="relative mt-4 flex items-center gap-3 rounded-2xl border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] via-white to-[hsl(220_100%_98%)] p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold tracking-tight">State Expansion · SC & TN</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Credentialing in motion · Recruiting plan finalized · Launch Q4 2026</p>
          </div>
          <button className="rounded-xl bg-foreground/[0.05] px-3 py-1.5 text-[11.5px] font-semibold hover:bg-foreground/[0.08]">Review</button>
        </div>
      </section>
    </OSShell>
  );
}
