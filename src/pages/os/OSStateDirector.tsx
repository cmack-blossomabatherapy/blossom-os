import {
  ArrowUpRight, ArrowDownRight, Sparkles, ShieldCheck, AlertTriangle,
  CalendarDays, ChevronRight, Users, Heart, FileCheck2, Briefcase,
  GraduationCap, Activity, TrendingUp, Clock, BadgeCheck,
  Megaphone, ClipboardList, Shield, Building2, Brain, Lightbulb,
  AlertCircle, CheckCircle2, Workflow, Zap, Radio, Flame, UserPlus,
  ClipboardCheck, DollarSign, Plus, BookOpen, LifeBuoy, Send,
  Compass, Gauge, Inbox, ArrowRight, UserCog, BarChart3, MapPin,
  Phone, MessageSquare, Trophy, Smile,
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
  { label: "Active Clients",            value: "184", delta: "+9",   up: true,  status: "ok",   hint: "NC · Waitlist 22",        spark: [160,164,168,172,176,178,180,182,184], icon: Heart },
  { label: "New Leads (7d)",            value: "28",  delta: "+18%", up: true,  status: "ok",   hint: "vs prior week",           spark: [12,14,16,18,20,22,25,27,28],            icon: UserPlus },
  { label: "Clients Awaiting Staffing", value: "12",  delta: "+3",   up: false, status: "warn", hint: "Charlotte 7 · Raleigh 5", spark: [6,7,8,9,10,11,11,12,12],                icon: Inbox },
  { label: "Scheduling Fill Rate",      value: "89%", delta: "+6%",  up: true,  status: "ok",   hint: "Target ≥ 92%",            spark: [80,82,83,85,86,87,88,89,89],            icon: CalendarDays },
  { label: "Open Authorizations",       value: "31",  delta: "+4",   up: false, status: "warn", hint: "8 awaiting submit",       spark: [22,24,26,27,28,29,30,31,31],            icon: FileCheck2 },
  { label: "Expiring Auths (30d)",      value: "11",  delta: "+2",   up: false, status: "warn", hint: "3 within 7 days",         spark: [4,5,6,7,8,9,10,11,11],                  icon: AlertTriangle },
  { label: "Active RBTs",               value: "62",  delta: "+4",   up: true,  status: "ok",   hint: "8 onboarding",            spark: [54,55,56,58,59,60,61,62,62],            icon: UserCog },
  { label: "Active BCBAs",              value: "14",  delta: "+1",   up: true,  status: "ok",   hint: "2 awaiting cred.",        spark: [12,12,13,13,13,13,14,14,14],            icon: ShieldCheck },
  { label: "Recruiting Pipeline",       value: "47",  delta: "+11%", up: true,  status: "ok",   hint: "18 offers out",           spark: [30,33,36,38,40,42,44,46,47],            icon: Users },
  { label: "Orientation Completion",    value: "82%", delta: "-3%",  up: false, status: "warn", hint: "5 new hires backlog",     spark: [88,87,86,85,84,83,82,82,82],            icon: GraduationCap },
  { label: "Client Retention (90d)",    value: "94%", delta: "+1%",  up: true,  status: "ok",   hint: "State avg 91%",           spark: [90,91,91,92,92,93,93,94,94],            icon: BadgeCheck },
  { label: "Session Completion",        value: "93%", delta: "+2%",  up: true,  status: "ok",   hint: "Target ≥ 95%",            spark: [88,89,90,91,91,92,92,93,93],            icon: CheckCircle2 },
];

const departments = [
  { name: "Intake",         icon: ClipboardList, status: "ok",   score: 93, workload: 14, overdue: 1, completion: 95, ai: "NC response time 16m · improving",  tone: "os-tone-rose" },
  { name: "Scheduling",     icon: CalendarDays,  status: "warn", score: 84, workload: 22, overdue: 4, completion: 89, ai: "Charlotte has 18 uncovered hours",  tone: "os-tone-sky" },
  { name: "Staffing",       icon: Briefcase,     status: "warn", score: 78, workload: 12, overdue: 3, completion: 82, ai: "12 clients awaiting RBT match",     tone: "os-tone-violet" },
  { name: "Recruiting",     icon: UserPlus,      status: "ok",   score: 87, workload: 47, overdue: 2, completion: 88, ai: "Pipeline healthy · 18 offers out",  tone: "os-tone-lilac" },
  { name: "Credentialing",  icon: BadgeCheck,    status: "crit", score: 62, workload: 7,  overdue: 3, completion: 58, ai: "3 BCBAs awaiting payer approval",   tone: "os-tone-coral" },
  { name: "Authorizations", icon: FileCheck2,    status: "warn", score: 80, workload: 31, overdue: 5, completion: 84, ai: "11 expiring in 30 days",            tone: "os-tone-amber" },
  { name: "QA",             icon: Shield,        status: "ok",   score: 90, workload: 9,  overdue: 0, completion: 93, ai: "Reports on schedule",               tone: "os-tone-mint" },
  { name: "Training",       icon: GraduationCap, status: "warn", score: 82, workload: 11, overdue: 4, completion: 84, ai: "5 new hires awaiting orientation",  tone: "os-tone-lilac" },
  { name: "Parent Comms",   icon: Megaphone,     status: "ok",   score: 91, workload: 8,  overdue: 1, completion: 94, ai: "Escalation volume low",             tone: "os-tone-rose" },
  { name: "Operations",     icon: Workflow,      status: "ok",   score: 88, workload: 16, overdue: 2, completion: 90, ai: "Daily standups on track",           tone: "os-tone-violet" },
];

const bottlenecks = [
  { severity: "crit", title: "Charlotte — 18 uncovered hours this week",  dept: "Scheduling",    owner: "Jacob T.",   action: "Open coverage matching" },
  { severity: "crit", title: "3 BCBAs pending insurance credentialing",    dept: "Credentialing", owner: "Olivia C.",  action: "Escalate to payer reps" },
  { severity: "warn", title: "RBT shortage detected in Raleigh",           dept: "Staffing",      owner: "Marcus W.",  action: "Activate recruiting sprint" },
  { severity: "warn", title: "11 authorizations expiring within 30 days",  dept: "Authorizations",owner: "Priya N.",   action: "Batch renewal workflow" },
  { severity: "warn", title: "5 leads stalled awaiting intake forms",      dept: "Intake",        owner: "Emily R.",   action: "Send reminder + follow-up" },
  { severity: "warn", title: "2 parent escalations open > 48h",            dept: "Parent Comms",  owner: "Ezra (you)", action: "Schedule outreach calls" },
];

const staffingByState = [
  { s: "Charlotte",  fill: 78, need: 7 },
  { s: "Raleigh",    fill: 84, need: 5 },
  { s: "Greensboro", fill: 92, need: 2 },
  { s: "Durham",     fill: 88, need: 3 },
  { s: "Asheville",  fill: 95, need: 1 },
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
  { title: "Approve Charlotte coverage matching plan",     owner: "Ezra",   dept: "Scheduling",    due: "Today",    priority: "High",   bucket: "Urgent" },
  { title: "Follow up on BCBA credentialing (3 pending)",  owner: "Olivia", dept: "Credentialing", due: "Today",    priority: "High",   bucket: "Urgent" },
  { title: "Call parent — escalation #NC-218",             owner: "Ezra",   dept: "Parent Comms",  due: "Today",    priority: "High",   bucket: "Escalations" },
  { title: "Sign off on Raleigh intake auto-assign",       owner: "Emily",  dept: "Intake",        due: "Tomorrow", priority: "Medium", bucket: "Team" },
  { title: "Review recruiting velocity plan",              owner: "Sarah",  dept: "Recruiting",    due: "Fri",      priority: "Medium", bucket: "Waiting" },
  { title: "Orientation kickoff — 5 new hires",            owner: "HR Ops", dept: "Training",      due: "Mon",      priority: "Medium", bucket: "Team" },
];

const training = [
  { name: "Scheduling Team",       pct: 94 },
  { name: "Intake Team",           pct: 88 },
  { name: "NC RBT Onboarding",     pct: 82 },
  { name: "NC BCBA Documentation", pct: 71 },
];

const activity = [
  { who: "Emily R.",  what: "submitted a new lead (Charlotte)",     when: "3m",  tone: "os-tone-violet", icon: UserPlus },
  { who: "Jacob T.",  what: "resolved Raleigh scheduling conflict", when: "14m", tone: "os-tone-sky",    icon: CalendarDays },
  { who: "Olivia C.", what: "approved RBT credential · NC",         when: "28m", tone: "os-tone-mint",   icon: BadgeCheck },
  { who: "BCBS NC",   what: "approved auth #A-2841",                when: "41m", tone: "os-tone-amber",  icon: FileCheck2 },
  { who: "Sarah M.",  what: "offer letter signed · Greensboro RBT", when: "1h",  tone: "os-tone-lilac",  icon: ClipboardCheck },
  { who: "System",    what: "client staffed · Durham",              when: "2h",  tone: "os-tone-rose",   icon: Heart },
  { who: "Marcus W.", what: "completed orientation module",         when: "3h",  tone: "os-tone-violet", icon: GraduationCap },
];

const aiInsights = [
  { icon: AlertCircle,  tone: "os-tone-coral", title: "NC staffing demand rising",      body: "Charlotte demand likely to grow next week — staffing buffer is below threshold.",      cta: "Open coverage" },
  { icon: AlertTriangle,tone: "os-tone-amber", title: "Credentialing → client starts",  body: "3 BCBA credential delays may impact 8 client starts within 10 days.",                  cta: "See forecast" },
  { icon: Brain,        tone: "os-tone-sky",   title: "Fill rate projection",           body: "Scheduling fill rate projected to decline 4 pts if Raleigh RBT pipeline doesn't close.",cta: "View trend" },
  { icon: Lightbulb,    tone: "os-tone-lilac", title: "Recruiting pipeline gap",        body: "Pipeline insufficient for projected NC growth — add 6 candidates this week.",          cta: "Action plan" },
  { icon: Activity,     tone: "os-tone-mint",  title: "Workflow optimization",          body: "Auto-assign Charlotte intake to local pod — could save ~9h/week of triage.",           cta: "Apply rule" },
];

const meetings = [
  { title: "NC Daily Standup",          time: "8:30 – 9:00 AM",  tone: "os-tone-sky" },
  { title: "Charlotte Scheduling Sync", time: "10:00 – 10:30",   tone: "os-tone-violet" },
  { title: "1:1 — Assistant Director",  time: "1:00 – 1:30 PM",  tone: "os-tone-rose" },
  { title: "Parent Escalation Call",    time: "3:30 – 4:00 PM",  tone: "os-tone-amber" },
];

const quickActions = [
  { label: "Add Lead",             icon: UserPlus,      tone: "os-tone-rose"   },
  { label: "Assign Staff",         icon: Briefcase,     tone: "os-tone-violet" },
  { label: "Create Task",          icon: ClipboardCheck,tone: "os-tone-sky"    },
  { label: "Schedule Interview",   icon: CalendarDays,  tone: "os-tone-lilac"  },
  { label: "Submit Credentialing", icon: BadgeCheck,    tone: "os-tone-mint"   },
  { label: "Create Escalation",    icon: Flame,         tone: "os-tone-coral"  },
  { label: "Publish Training",     icon: GraduationCap, tone: "os-tone-amber"  },
  { label: "Open Reports",         icon: BarChart3,     tone: "os-tone-violet" },
];

const approvals = [
  { what: "Recruiting offer · BCBA · Charlotte", who: "Sarah M.",  due: "Today" },
  { what: "Coverage swap · Raleigh pod",         who: "Jacob T.",  due: "Today" },
  { what: "Credentialing submission · 2 RBTs",   who: "Olivia C.", due: "Tomorrow" },
];

const regions = [
  { name: "Charlotte",  clients: 58, fill: 78, recruit: 64, ops: 71, trend: "down" as const, status: "warn" as Tone, note: "RBT shortage risk" },
  { name: "Raleigh",    clients: 47, fill: 84, recruit: 70, ops: 79, trend: "down" as const, status: "warn" as Tone, note: "Hiring velocity slowing" },
  { name: "Greensboro", clients: 32, fill: 92, recruit: 88, ops: 91, trend: "up"   as const, status: "ok"   as Tone, note: "Top performer this month" },
  { name: "Durham",     clients: 28, fill: 88, recruit: 82, ops: 86, trend: "up"   as const, status: "ok"   as Tone, note: "Stable & growing" },
  { name: "Wilmington", clients: 14, fill: 81, recruit: 58, ops: 73, trend: "down" as const, status: "warn" as Tone, note: "Pipeline below target" },
  { name: "Asheville",  clients: 5,  fill: 95, recruit: 90, ops: 93, trend: "up"   as const, status: "ok"   as Tone, note: "Excellent operational score" },
];

const support = [
  { who: "Marisol Chen",  role: "VP State Operations", tone: "os-tone-violet" },
  { who: "James Okafor",  role: "Asst. State Director", tone: "os-tone-sky"    },
  { who: "Priya Nair",    role: "Auth Ops Lead",        tone: "os-tone-amber"  },
  { who: "Jacob Thomas",  role: "Scheduling Lead",      tone: "os-tone-mint"   },
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

export default function OSStateDirector() {
  const { user } = useAuth();
  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Ezra").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const opsScore = 82;
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

          {/* NEED SUPPORT */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(355_85%_75%/0.25)] to-transparent blur-2xl" />
            <header className="mb-3 flex items-center gap-2">
              <LifeBuoy className="h-3.5 w-3.5 text-[hsl(355_70%_55%)]" />
              <h3 className="text-[14px] font-semibold tracking-tight">Need Support?</h3>
            </header>
            <p className="text-[11.5px] leading-snug text-muted-foreground">
              Your operational leadership and escalation paths — one tap away.
            </p>
            <ul className="mt-3 space-y-2">
              {support.map((s) => (
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
              <MapPin className="h-3 w-3 text-[hsl(265_70%_55%)]" /> State Director · North Carolina
            </div>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[34px]">
              {greet}, <span className="capitalize">{name}</span> <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {today} · Here's what's happening across North Carolina today.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(150_70%_92%)] px-2.5 py-1 font-semibold text-[hsl(155_55%_32%)]">
                <ShieldCheck className="h-3 w-3" /> NC ops score 82 · Stable
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(40_100%_92%)] px-2.5 py-1 font-semibold text-[hsl(30_80%_42%)]">
                <AlertTriangle className="h-3 w-3" /> 6 alerts
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
                <p className="text-[13px] font-semibold leading-none tracking-tight">NC State AI Briefing</p>
                <p className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Updated 3 min ago</p>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/85">
              NC intake conversion improved <span className="font-semibold text-[hsl(155_55%_38%)]">+11%</span> this week, however
              <span className="font-semibold text-[hsl(355_70%_52%)]"> Charlotte staffing shortages</span> may impact scheduling within 5 days.
            </p>
            <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.55)] transition hover:opacity-95">
              Open State Insights <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 2 — DAILY OPS KPI GRID */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h2 className="text-[15px] font-semibold tracking-tight">North Carolina · State KPIs</h2>
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
            <h3 className="text-[15px] font-semibold tracking-tight">NC Department Operations</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Workload, completion, and AI insight across your state teams</p>
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
            <h3 className="text-[15px] font-semibold tracking-tight">Operational Alerts & Escalations</h3>
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

      {/* SECTION 4b — REGIONAL LEADERBOARD */}
      <section className="os-card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.18)] to-transparent blur-3xl" />
        <header className="relative mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Regional Performance · NC</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Top-performing and at-risk regions across your state</p>
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
          {regions.map((r, idx) => (
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
                  { label: "Fill",     v: r.fill    },
                  { label: "Recruit",  v: r.recruit },
                  { label: "Ops",      v: r.ops     },
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
            <h3 className="text-[15px] font-semibold tracking-tight">NC Staffing & Scheduling</h3>
          </div>
          <Pill tone="warn">18 open needs</Pill>
        </header>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Fill rate by state */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-[11.5px] font-medium text-muted-foreground">Fill Rate · NC clinics</p>
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
              <span className="font-semibold text-[hsl(265_70%_50%)]">184 children</span> across North Carolina received
              life-changing care this month — powered by your teams and your leadership.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(150_70%_92%)] px-2.5 py-1 font-semibold text-[hsl(155_55%_30%)]">
                <Trophy className="h-3 w-3" /> Greensboro: Top region
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(265_100%_95%)] px-2.5 py-1 font-semibold text-[hsl(265_70%_50%)]">
                <Sparkles className="h-3 w-3" /> 9 new hires this week
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Parent Satisfaction", value: "4.8 / 5", hint: "NC survey · 240 responses", tone: "os-tone-rose",   icon: Smile },
              { label: "Team Engagement",     value: "92%",     hint: "Pulse · this month",        tone: "os-tone-violet", icon: Users },
              { label: "Client Outcomes",     value: "+14%",    hint: "Goal mastery · 90d",        tone: "os-tone-mint",   icon: TrendingUp },
              { label: "Operational Progress",value: "82",      hint: "State health score",        tone: "os-tone-sky",    icon: Activity },
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
