import {
  ArrowUpRight, ArrowDownRight, Sparkles, ShieldCheck, AlertTriangle,
  CalendarDays, ChevronRight, Users, Heart, FileCheck2, Briefcase,
  GraduationCap, Activity, TrendingUp, Clock, BadgeCheck,
  Megaphone, ClipboardList, Shield, Building2, Brain, Lightbulb,
  AlertCircle, CheckCircle2, Workflow, Zap, Radio, Flame, UserPlus,
  ClipboardCheck, DollarSign, Plus, BookOpen, LifeBuoy, Send,
  Compass, Gauge, Inbox, ArrowRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, RadialBarChart, RadialBar,
} from "recharts";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

/* ============ types ============ */

type Tone = "ok" | "warn" | "crit";

type Kpi = {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  status: Tone;
  hint: string;
  spark: number[];
  icon: React.ElementType;
};

/* ============ MOCK DATA ============ */

const kpis: Kpi[] = [
  { label: "New Leads Today",        value: "32",    delta: "+18%", up: true,  status: "ok",   hint: "vs yesterday",         spark: [12,16,18,20,22,24,28,30,32], icon: UserPlus },
  { label: "Intake Response Time",   value: "14m",   delta: "-21%", up: true,  status: "ok",   hint: "Target ≤ 20m",         spark: [22,20,19,18,17,16,15,14,14], icon: Clock },
  { label: "Active Clients",         value: "842",   delta: "+12",  up: true,  status: "ok",   hint: "Waitlist 73",          spark: [770,780,790,800,815,825,832,838,842], icon: Heart },
  { label: "Staffing Needed",        value: "18",    delta: "+3",   up: false, status: "warn", hint: "GA 9 · NC 6 · TX 3",   spark: [10,12,13,14,15,16,17,18,18], icon: Briefcase },
  { label: "Scheduling Fill Rate",   value: "92%",   delta: "+8%",  up: true,  status: "ok",   hint: "FL 96 · GA 88",        spark: [80,82,84,86,88,89,90,91,92], icon: CalendarDays },
  { label: "Open Authorizations",    value: "47",    delta: "+5",   up: false, status: "warn", hint: "12 awaiting submit",   spark: [38,40,41,42,44,45,46,47,47], icon: FileCheck2 },
  { label: "Expiring Auths (30d)",   value: "23",    delta: "+4",   up: false, status: "warn", hint: "5 within 7 days",      spark: [12,14,15,17,19,20,22,23,23], icon: AlertTriangle },
  { label: "Recruiting Pipeline",    value: "124",   delta: "+9%",  up: true,  status: "ok",   hint: "71 offers out",        spark: [88,95,100,108,112,116,120,122,124], icon: Users },
  { label: "Orientation Completion", value: "84%",   delta: "-2%",  up: false, status: "warn", hint: "12 staff backlog",     spark: [88,88,87,86,85,85,84,84,84], icon: GraduationCap },
  { label: "Open Escalations",       value: "7",     delta: "+2",   up: false, status: "crit", hint: "2 critical",           spark: [3,4,4,5,6,6,7,7,7], icon: Flame },
  { label: "Pending Tasks",          value: "38",    delta: "-6",   up: true,  status: "ok",   hint: "12 due today",         spark: [54,50,48,46,44,42,40,39,38], icon: ClipboardCheck },
  { label: "Workflow Completion",    value: "91%",   delta: "+3%",  up: true,  status: "ok",   hint: "Across 14 workflows",  spark: [82,84,85,87,88,89,90,90,91], icon: Workflow },
];

const departments = [
  { name: "Intake",         icon: ClipboardList, status: "ok",   score: 94, workload: 28, overdue: 2, completion: 96, ai: "Response time down to 14m", tone: "os-tone-rose" },
  { name: "Scheduling",     icon: CalendarDays,  status: "ok",   score: 92, workload: 46, overdue: 4, completion: 92, ai: "Fill rate at 92% — best week", tone: "os-tone-sky" },
  { name: "Recruiting",     icon: Users,         status: "warn", score: 78, workload: 71, overdue: 9, completion: 74, ai: "Follow-up completion below target", tone: "os-tone-violet" },
  { name: "Credentialing",  icon: BadgeCheck,    status: "crit", score: 64, workload: 18, overdue: 5, completion: 62, ai: "5 VA credentials stalled >7d", tone: "os-tone-lilac" },
  { name: "Authorizations", icon: FileCheck2,    status: "warn", score: 81, workload: 47, overdue: 7, completion: 84, ai: "23 expiring in 30 days", tone: "os-tone-amber" },
  { name: "QA",             icon: Shield,        status: "warn", score: 76, workload: 22, overdue: 6, completion: 78, ai: "VA backlog growing 12%", tone: "os-tone-mint" },
  { name: "Billing",        icon: DollarSign,    status: "ok",   score: 88, workload: 34, overdue: 3, completion: 91, ai: "Collections pacing +9%", tone: "os-tone-mint" },
  { name: "Training",       icon: GraduationCap, status: "warn", score: 84, workload: 19, overdue: 5, completion: 87, ai: "12 overdue across 4 depts", tone: "os-tone-lilac" },
  { name: "HR",             icon: Building2,     status: "ok",   score: 91, workload: 14, overdue: 1, completion: 94, ai: "Onboarding completion 94%", tone: "os-tone-violet" },
  { name: "Marketing",      icon: Megaphone,     status: "ok",   score: 96, workload: 11, overdue: 0, completion: 98, ai: "Lead ROI 3.4× — strongest qtr", tone: "os-tone-coral" },
];

const bottlenecks = [
  { severity: "crit", title: "5 VA credentialing files stalled > 7 days",  dept: "Credentialing", owner: "Olivia C.", action: "Escalate to payer reps" },
  { severity: "crit", title: "GA — 12 uncovered sessions this week",       dept: "Scheduling",    owner: "Jacob T.",  action: "Open coverage matching" },
  { severity: "warn", title: "23 authorizations expiring within 30 days",  dept: "Authorizations",owner: "Marcus W.", action: "Batch renewal workflow" },
  { severity: "warn", title: "Recruiting follow-ups overdue (9)",          dept: "Recruiting",    owner: "Sarah M.",  action: "Assign follow-up sprint" },
  { severity: "warn", title: "Intake — 3 unassigned leads >24h",           dept: "Intake",        owner: "Emily R.",  action: "Auto-assign to FL pod" },
  { severity: "warn", title: "12 overdue trainings · 4 departments",       dept: "Training",      owner: "HR Ops",    action: "Send completion reminders" },
];

const staffingByState = [
  { s: "FL", fill: 96, need: 2 },
  { s: "GA", fill: 88, need: 9 },
  { s: "NC", fill: 82, need: 6 },
  { s: "TX", fill: 91, need: 3 },
  { s: "AZ", fill: 86, need: 2 },
];

const utilization = [
  { d: "Mon", v: 82 }, { d: "Tue", v: 85 }, { d: "Wed", v: 88 },
  { d: "Thu", v: 86 }, { d: "Fri", v: 91 }, { d: "Sat", v: 78 }, { d: "Sun", v: 72 },
];

const cancellationTrend = [
  { d: "W1", v: 6.2 }, { d: "W2", v: 5.8 }, { d: "W3", v: 5.1 },
  { d: "W4", v: 4.6 }, { d: "W5", v: 4.2 }, { d: "W6", v: 4.0 }, { d: "W7", v: 3.8 },
];

const leadConv = [
  { m: "Mar", v: 47 }, { m: "Apr", v: 52 }, { m: "May", v: 58 },
];
const recruitFunnel = [
  { stage: "Applicants",  v: 412 },
  { stage: "Screened",    v: 218 },
  { stage: "Interviewed", v: 124 },
  { stage: "Offered",     v: 71 },
  { stage: "Hired",       v: 41 },
];
const orientationDept = [
  { dept: "Intake", v: 96 }, { dept: "Sched", v: 92 }, { dept: "RBT", v: 84 },
  { dept: "BCBA",  v: 78 }, { dept: "Billing", v: 91 }, { dept: "QA", v: 82 },
];

const tasks = [
  { title: "Approve GA coverage matching plan",      owner: "Shira",  dept: "Scheduling",    due: "Today",    priority: "High",   bucket: "Urgent" },
  { title: "Escalate VA credentialing batch",        owner: "Olivia", dept: "Credentialing", due: "Today",    priority: "High",   bucket: "Urgent" },
  { title: "Sign off on intake auto-assign rules",   owner: "Emily",  dept: "Intake",        due: "Tomorrow", priority: "Medium", bucket: "Team" },
  { title: "Review recruiting velocity action plan", owner: "Sarah",  dept: "Recruiting",    due: "Fri",      priority: "High",   bucket: "Waiting" },
  { title: "Coordinate training completion sprint",  owner: "HR Ops", dept: "Training",      due: "May 30",   priority: "Medium", bucket: "Team" },
  { title: "Escalation: Aetna denial pattern",       owner: "Legal",  dept: "Billing",       due: "Jun 03",   priority: "High",   bucket: "Escalations" },
];

const training = [
  { name: "Scheduling Team",   pct: 92 },
  { name: "Intake Team",       pct: 88 },
  { name: "RBT Onboarding",    pct: 84 },
  { name: "BCBA Documentation",pct: 64 },
];

const activity = [
  { who: "Emily R.",  what: "submitted a new lead (FL)",       when: "2m",  tone: "os-tone-violet", icon: UserPlus },
  { who: "Jacob T.",  what: "resolved GA scheduling conflict", when: "11m", tone: "os-tone-sky",    icon: CalendarDays },
  { who: "Olivia C.", what: "approved BCBA credential",        when: "22m", tone: "os-tone-mint",   icon: BadgeCheck },
  { who: "Aetna",     what: "approved auth #A-2841",           when: "38m", tone: "os-tone-amber",  icon: FileCheck2 },
  { who: "Sarah M.",  what: "offer letter signed · RBT",       when: "1h",  tone: "os-tone-lilac",  icon: ClipboardCheck },
  { who: "System",    what: "published Intake SOP v3",         when: "2h",  tone: "os-tone-rose",   icon: BookOpen },
  { who: "Shira",     what: "assigned 4 unstaffed clients",    when: "3h",  tone: "os-tone-violet", icon: Briefcase },
];

const aiInsights = [
  { icon: AlertCircle, tone: "os-tone-coral",  title: "GA staffing pressure",    body: "GA has 12 uncovered sessions — projected to grow if 3 RBT hires don't close this week.", cta: "Open coverage" },
  { icon: Brain,       tone: "os-tone-sky",    title: "Intake risk",             body: "Intake conversion likely to decline if response time rises above 22m.",                  cta: "View trend" },
  { icon: AlertTriangle,tone: "os-tone-amber", title: "Credentialing → NC impact",body:"Credentialing delays may impact NC staffing within 10 days.",                            cta: "See forecast" },
  { icon: Lightbulb,   tone: "os-tone-lilac",  title: "Recruiting bottleneck",   body: "Recruiting follow-up bottleneck detected in GA — 14 candidates idle 3+ days.",         cta: "Action plan" },
  { icon: Activity,    tone: "os-tone-mint",   title: "Workflow optimization",   body: "Auto-assign intake to FL pod — could save ~18h/week of triage.",                       cta: "Apply rule" },
];

const meetings = [
  { title: "Ops Standup",            time: "8:30 – 9:00 AM",  tone: "os-tone-sky" },
  { title: "Scheduling Sync",        time: "10:00 – 10:30",   tone: "os-tone-violet" },
  { title: "Recruiting 1:1 — Sarah", time: "1:00 – 1:30 PM",  tone: "os-tone-rose" },
  { title: "QA Review",              time: "3:30 – 4:00 PM",  tone: "os-tone-amber" },
];

const quickActions = [
  { label: "Add Lead",         icon: UserPlus,     tone: "os-tone-rose"   },
  { label: "Create Client",    icon: Heart,        tone: "os-tone-violet" },
  { label: "Assign Staff",     icon: Briefcase,    tone: "os-tone-sky"    },
  { label: "Create Task",      icon: ClipboardCheck,tone: "os-tone-lilac" },
  { label: "Publish SOP",      icon: BookOpen,     tone: "os-tone-mint"   },
  { label: "Create Training",  icon: GraduationCap,tone: "os-tone-amber"  },
  { label: "Submit Tech Req",  icon: LifeBuoy,     tone: "os-tone-coral"  },
  { label: "Open Workflow",    icon: Workflow,     tone: "os-tone-violet" },
];

const approvals = [
  { what: "Recruiting offer · BCBA · GA",  who: "Sarah M.",  due: "Today" },
  { what: "Coverage swap · FL pod",         who: "Jacob T.",  due: "Today" },
  { what: "SOP update · Documentation",     who: "Olivia C.", due: "Tomorrow" },
];

/* ============ helpers ============ */

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

/* ============ KPI card ============ */

function OpsKpi({ k }: { k: Kpi }) {
  const Icon = k.icon;
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-tight">{k.label}</p>
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

/* ============ PAGE ============ */

export default function OSOperations() {
  const { user } = useAuth();
  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Shira").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const opsScore = 84;
  const taskBuckets = ["Urgent", "Team", "Waiting", "Escalations"];

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
                  <h3 className="text-[14px] font-semibold tracking-tight">AI Ops Insights</h3>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Predictive · Actionable</p>
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

          {/* OPS SCORE */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(155_70%_70%/0.25)] to-transparent blur-2xl" />
            <header className="mb-2">
              <h3 className="text-[14px] font-semibold tracking-tight">Operations Score</h3>
              <p className="text-[10.5px] text-muted-foreground">Composite health · live</p>
            </header>
            <div className="relative grid place-items-center py-2">
              <div className="relative h-[140px] w-[140px]">
                <ResponsiveContainer>
                  <RadialBarChart innerRadius="75%" outerRadius="100%" data={[{ v: opsScore }]} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="v" cornerRadius={10} fill="hsl(265 85% 62%)" background={{ fill: "hsl(240 10% 94%)" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-[28px] font-semibold leading-none tracking-tight">{opsScore}</p>
                    <p className="mt-1 text-[9.5px] uppercase tracking-wider text-muted-foreground">Healthy</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="rounded-lg bg-[hsl(150_70%_94%)] py-1.5 font-semibold text-[hsl(155_55%_32%)]">6 Healthy</div>
              <div className="rounded-lg bg-[hsl(40_100%_94%)] py-1.5 font-semibold text-[hsl(30_80%_42%)]">3 Watch</div>
              <div className="rounded-lg bg-[hsl(355_100%_95%)] py-1.5 font-semibold text-[hsl(355_70%_48%)]">1 Critical</div>
            </div>
          </section>

          {/* TODAY */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold tracking-tight">Today</h3>
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

          {/* APPROVALS */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold tracking-tight">Pending Approvals</h3>
              <Pill tone="med">{approvals.length}</Pill>
            </header>
            <ul className="space-y-2">
              {approvals.map((a) => (
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

          {/* LIVE ACTIVITY */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
                <h3 className="text-[14px] font-semibold tracking-tight">Live Activity</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[hsl(155_55%_38%)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(155_60%_50%)]" /> Live
              </span>
            </header>
            <ul className="space-y-3">
              {activity.map((a, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-xl", a.tone)}>
                    <a.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] leading-tight">
                      <span className="font-semibold">{a.who}</span>{" "}
                      <span className="text-muted-foreground">{a.what}</span>
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-muted-foreground">{a.when} ago</p>
                  </div>
                </li>
              ))}
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
              <Compass className="h-3 w-3 text-[hsl(265_70%_55%)]" /> Operations Leadership · Mission Control
            </div>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[34px]">
              {greet}, <span className="capitalize">{name}</span> <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {today} · Here's what's happening across Blossom operations today.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(150_70%_92%)] px-2.5 py-1 font-semibold text-[hsl(155_55%_32%)]">
                <ShieldCheck className="h-3 w-3" /> Ops score 84 · Healthy
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(40_100%_92%)] px-2.5 py-1 font-semibold text-[hsl(30_80%_42%)]">
                <AlertTriangle className="h-3 w-3" /> 6 bottlenecks
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(355_100%_94%)] px-2.5 py-1 font-semibold text-[hsl(355_70%_48%)]">
                <Flame className="h-3 w-3" /> 2 escalations
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(265_100%_95%)] px-2.5 py-1 font-semibold text-[hsl(265_70%_50%)]">
                <Sparkles className="h-3 w-3" /> 5 AI insights
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
                <p className="text-[13px] font-semibold leading-none tracking-tight">Operations AI Briefing</p>
                <p className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Updated 3 min ago</p>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/85">
              Scheduling delays increased in <span className="font-semibold text-[hsl(355_70%_52%)]">GA</span>, while intake conversion improved
              <span className="font-semibold text-[hsl(155_55%_38%)]"> 12%</span> this week.
              Recruiting follow-up completion is below target.
            </p>
            <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.55)] transition hover:opacity-95">
              Open Operational Insights <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 2 — DAILY OPS KPI GRID */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h2 className="text-[15px] font-semibold tracking-tight">Daily Operations KPIs</h2>
            <Pill tone="default">{kpis.length} metrics</Pill>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">Today</button>
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">7d</button>
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">30d</button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kpis.map((k) => <OpsKpi key={k.label} k={k} />)}
        </div>
      </section>

      {/* SECTION 3 — DEPARTMENT OPS OVERVIEW */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Department Operations</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Workload, completion, and AI insight per department</p>
          </div>
          <button className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">View all</button>
        </header>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {departments.map((d) => (
            <button key={d.name} className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_hsl(265_60%_50%/0.28)]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("grid h-8 w-8 place-items-center rounded-xl", d.tone)}>
                    <d.icon className="h-4 w-4" />
                  </div>
                  <p className="text-[12.5px] font-semibold tracking-tight">{d.name}</p>
                </div>
                <StatusDot status={d.status as Tone} />
              </div>
              <p className="mt-2.5 text-[20px] font-semibold tracking-tight tabular-nums">{d.score}<span className="ml-1 text-[10.5px] font-normal text-muted-foreground">score</span></p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                <div className="h-full rounded-full" style={{ width: `${d.completion}%`, background: `linear-gradient(90deg, ${toneStrokeHsl(d.status as Tone)}, hsl(265 85% 72%))` }} />
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                <Pill tone="default">{d.workload} active</Pill>
                {d.overdue > 0 && <Pill tone={d.overdue >= 5 ? "crit" : "warn"}>{d.overdue} overdue</Pill>}
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-[10.5px] text-muted-foreground">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[hsl(265_70%_55%)]" />
                {d.ai}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 4 — BOTTLENECKS & ALERTS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-[hsl(355_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Workflow Bottlenecks</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10.5px]">
            <Pill tone="crit">2 critical</Pill>
            <Pill tone="warn">4 watch</Pill>
          </div>
        </header>
        <ul className="space-y-2">
          {bottlenecks.map((b) => (
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

      {/* SECTION 5 — STAFFING & SCHEDULING HEALTH */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Staffing & Scheduling</h3>
          </div>
          <Pill tone="warn">22 open needs</Pill>
        </header>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Fill rate by state */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-[11.5px] font-medium text-muted-foreground">Fill Rate · by state</p>
            <ul className="mt-3 space-y-2.5">
              {staffingByState.map((s) => (
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
                <p className="text-[11.5px] font-medium text-muted-foreground">Utilization · 7 days</p>
                <p className="mt-0.5 text-[20px] font-semibold tracking-tight">86%</p>
              </div>
              <Pill tone="ok">+4%</Pill>
            </div>
            <div className="mt-2 h-[140px]">
              <ResponsiveContainer>
                <BarChart data={utilization} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
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
                <p className="text-[11.5px] font-medium text-muted-foreground">Cancellation Rate · 7 wk</p>
                <p className="mt-0.5 text-[20px] font-semibold tracking-tight">3.8%</p>
              </div>
              <Pill tone="ok">-2.4 pts</Pill>
            </div>
            <div className="mt-2 h-[140px]">
              <ResponsiveContainer>
                <LineChart data={cancellationTrend} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
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
              <h3 className="text-[15px] font-semibold tracking-tight">Recruiting Funnel</h3>
            </div>
            <Pill tone="warn">Velocity 11/wk · target 14</Pill>
          </header>
          <ul className="space-y-2.5">
            {recruitFunnel.map((f, i) => {
              const max = recruitFunnel[0].v;
              const pct = Math.round((f.v / max) * 100);
              const next = recruitFunnel[i + 1];
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
              <h3 className="text-[15px] font-semibold tracking-tight">Intake Conversion</h3>
            </div>
            <Pill tone="ok">+12%</Pill>
          </header>
          <p className="text-[28px] font-semibold tracking-tight tabular-nums">58%</p>
          <p className="text-[10.5px] text-muted-foreground">3-mo trend</p>
          <div className="mt-2 h-[120px]">
            <ResponsiveContainer>
              <AreaChart data={leadConv} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
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
            <h3 className="text-[15px] font-semibold tracking-tight">Operational Task Center</h3>
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

      {/* SECTION 8 — TRAINING & EMPLOYEE ENGAGEMENT */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Training & Engagement</h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Co. completion <span className="font-semibold text-foreground">87%</span></span>
          </header>
          <div className="grid grid-cols-2 gap-2.5">
            {training.map((t) => (
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
              <p className="mt-1 text-[12.5px] font-semibold">Scheduling · 92%</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-gradient-to-br from-[hsl(355_100%_96%)] to-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(355_70%_50%)]">Onboarding Risk</p>
              <p className="mt-1 text-[12.5px] font-semibold">3 employees delayed</p>
            </div>
          </div>
        </section>

        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Orientation by Department</h3>
            </div>
          </header>
          <div className="h-[210px]">
            <ResponsiveContainer>
              <BarChart data={orientationDept} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="dept" tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(255 30% 92%)" }} />
                <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                  {orientationDept.map((d, i) => (
                    <Cell key={i} fill={d.v >= 90 ? "hsl(155 55% 50%)" : d.v >= 80 ? "hsl(265 85% 68%)" : "hsl(35 90% 60%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* QUICK ACTIONS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold tracking-tight">Quick Actions</h3>
          <span className="text-[11px] text-muted-foreground">⌘K to search anything</span>
        </header>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {quickActions.map((a) => (
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
