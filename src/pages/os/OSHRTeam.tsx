import {
  ArrowUpRight, ArrowDownRight, Sparkles, AlertTriangle, CalendarDays, ChevronRight,
  Users, Heart, FileCheck2, GraduationCap, Activity, Clock, BadgeCheck, Brain,
  Lightbulb, AlertCircle, CheckCircle2, Radio, Flame, UserPlus, ClipboardCheck,
  BookOpen, Inbox, ArrowRight, Phone, MessageSquare, Mail, Send, FileText,
  ShieldCheck, Smile, Pause, RefreshCw, Upload, StickyNote, Headphones, Hourglass,
  CalendarClock, FileWarning, FileSignature, Building2, Stamp, ShieldAlert, TrendingUp,
  Briefcase, UserCheck, Star, Target, Sparkle, Trophy, HeartHandshake, PartyPopper,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, RadialBarChart, RadialBar,
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
  { label: "Active Employees",          value: "248", delta: "+6",   up: true,  status: "ok",   hint: "Across 5 states",     spark: [232,235,238,240,242,244,246,247,248], icon: Users },
  { label: "New Hires",                 value: "14",  delta: "+4",   up: true,  status: "ok",   hint: "Last 30 days",        spark: [4,6,7,9,10,11,12,13,14],            icon: UserPlus },
  { label: "Orientation Completion",    value: "84%", delta: "-3%",  up: false, status: "warn", hint: "Target ≥ 90%",        spark: [90,88,87,86,86,85,84,84,84],         icon: Trophy },
  { label: "Overdue Trainings",         value: "11",  delta: "+3",   up: false, status: "warn", hint: "Across 4 depts",      spark: [4,5,6,7,8,9,10,11,11],               icon: AlertTriangle },
  { label: "Pending Evaluations",       value: "9",   delta: "+2",   up: false, status: "warn", hint: "3 overdue",           spark: [3,4,5,6,7,8,8,9,9],                  icon: ClipboardCheck },
  { label: "Compliance Rate",           value: "94%", delta: "+2%",  up: true,  status: "ok",   hint: "HIPAA · BACB · SOP",  spark: [88,89,90,91,92,93,93,94,94],         icon: ShieldCheck },
  { label: "Background Checks Pending", value: "5",   delta: "-1",   up: true,  status: "warn", hint: "Avg 3.2d",            spark: [8,8,7,7,6,6,5,5,5],                  icon: BadgeCheck },
  { label: "Employee Requests Open",    value: "17",  delta: "+5",   up: false, status: "warn", hint: "PTO · concerns",      spark: [9,10,11,12,13,14,15,16,17],          icon: Inbox },
  { label: "Credentialing Pending",     value: "6",   delta: "+1",   up: false, status: "warn", hint: "3 BCBA · 3 RBT",      spark: [3,3,4,4,5,5,5,6,6],                  icon: FileCheck2 },
  { label: "Avg Onboarding Time",       value: "9d",  delta: "-2d",  up: true,  status: "ok",   hint: "Hired → Ready",       spark: [14,13,12,12,11,10,10,9,9],           icon: Clock },
  { label: "Employee Retention",        value: "91%", delta: "+1%",  up: true,  status: "ok",   hint: "12mo rolling",        spark: [86,87,88,89,90,90,91,91,91],         icon: Heart },
  { label: "Satisfaction Score",        value: "4.4", delta: "+0.2", up: true,  status: "ok",   hint: "Last pulse survey",   spark: [3.9,4.0,4.1,4.2,4.2,4.3,4.3,4.4,4.4],icon: Smile },
];

const stages = [
  { name: "Applicant",            count: 28, stalled: 3, avg: "1.2d", tone: "os-tone-lilac" },
  { name: "Hired",                count: 14, stalled: 1, avg: "0.8d", tone: "os-tone-sky" },
  { name: "Onboarding",           count: 12, stalled: 2, avg: "3.4d", tone: "os-tone-violet" },
  { name: "Orientation Scheduled",count: 9,  stalled: 1, avg: "2.1d", tone: "os-tone-rose" },
  { name: "Active Employee",      count: 248,stalled: 0, avg: "—",    tone: "os-tone-mint" },
  { name: "Evaluation Due",       count: 9,  stalled: 3, avg: "5.2d", tone: "os-tone-amber" },
  { name: "Compliance Review",    count: 6,  stalled: 1, avg: "2.8d", tone: "os-tone-sky" },
  { name: "Offboarding",          count: 3,  stalled: 0, avg: "1.6d", tone: "os-tone-coral" },
];

const employees = [
  { parent: "Maya Thompson",  child: "RBT · Charlotte",        insurance: "Scheduling",   owner: "Mgr: Daylis",  stage: "Onboarding",     since: "Stalled 3d",  urgency: "crit" as Tone },
  { parent: "Andre Wilson",   child: "BCBA · Atlanta",         insurance: "Clinical",     owner: "Mgr: Renee",   stage: "Evaluation Due", since: "Overdue 5d",  urgency: "crit" as Tone },
  { parent: "Sofia Martinez", child: "RBT · Raleigh",          insurance: "Operations",   owner: "Mgr: Daylis",  stage: "Orientation",    since: "Tomorrow 9a", urgency: "ok"   as Tone },
  { parent: "Jamal Carter",   child: "Intake Coordinator",     insurance: "Intake",       owner: "Mgr: Nikki",   stage: "Active",         since: "Pulse +0.3",  urgency: "ok"   as Tone },
  { parent: "Priya Shah",     child: "RBT · Richmond",         insurance: "Scheduling",   owner: "Mgr: Daylis",  stage: "Compliance",     since: "HIPAA due",   urgency: "warn" as Tone },
  { parent: "Kenji Park",     child: "Scheduling Coordinator", insurance: "Scheduling",   owner: "Mgr: Daylis",  stage: "Active",         since: "Burnout risk",urgency: "warn" as Tone },
];

const followups = [
  { kind: "Approval",  parent: "PTO · Maya Thompson",          time: "9:30 AM",  stage: "Awaiting HR review",      priority: "High",   last: "Submitted · 1d" },
  { kind: "Meeting",   parent: "1:1 · Andre Wilson",           time: "11:00 AM", stage: "Coaching plan kickoff",   priority: "High",   last: "Confirmed · 2h" },
  { kind: "Email",     parent: "Compliance · Priya Shah",      time: "12:30 PM", stage: "HIPAA cert reminder",     priority: "Medium", last: "Auto · 3d" },
  { kind: "Approval",  parent: "Schedule change · Kenji Park", time: "1:00 PM",  stage: "Awaiting manager sign-off",priority: "High",  last: "Pending docs" },
  { kind: "Meeting",   parent: "Stay interview · Sam Webb",    time: "3:00 PM",  stage: "Retention pulse",         priority: "Medium", last: "Calendar sent" },
  { kind: "Email",     parent: "Concern · Aisha Cole",         time: "4:15 PM",  stage: "Employee relations",      priority: "High",   last: "Reply pending" },
];

const forms = [
  { name: "Maya Thompson · Onboarding packet",     status: "In progress",        pct: 65, days: 2, tone: "warn" as Tone },
  { name: "Andre Wilson · Viventium setup",        status: "Stalled · 4d",       pct: 40, days: 4, tone: "crit" as Tone },
  { name: "Sofia Martinez · Orientation prep",     status: "Scheduled · Mon",    pct: 80, days: 0, tone: "ok"   as Tone },
  { name: "Priya Shah · Background check",         status: "Awaiting clearance", pct: 30, days: 1, tone: "warn" as Tone },
  { name: "Kenji Park · Policy acknowledgements",  status: "Complete",           pct: 100,days: 0, tone: "ok"   as Tone },
];

const comms = [
  { who: "Recruiting",       what: "4 new hires routed to onboarding",    when: "12m", tone: "os-tone-mint",   icon: UserPlus },
  { who: "Training Academy", what: "Maya completed HIPAA module",         when: "35m", tone: "os-tone-sky",    icon: GraduationCap },
  { who: "Credentialing",    what: "BCBS enrollment approved · Wilson",   when: "1h",  tone: "os-tone-violet", icon: ShieldCheck },
  { who: "Background Co.",   what: "Thompson clearance received",         when: "2h",  tone: "os-tone-amber",  icon: BadgeCheck },
  { who: "Employee · Cole",  what: "submitted relations concern",         when: "3h",  tone: "os-tone-coral",  icon: AlertTriangle },
  { who: "Employee · Park",  what: "acknowledged updated SOP v4",         when: "4h",  tone: "os-tone-rose",   icon: CheckCircle2 },
];

const bottlenecks = [
  { severity: "crit", title: "Andre Wilson — evaluation overdue 5 days",    stage: "Evaluation",     owner: "Renee",  action: "Schedule review today" },
  { severity: "crit", title: "Maya Thompson — onboarding stalled 3 days",   stage: "Onboarding",     owner: "Nikki",  action: "Reach out to candidate" },
  { severity: "warn", title: "Scheduling dept training completion 78%",     stage: "Training",       owner: "Daylis", action: "Send dept reminder" },
  { severity: "warn", title: "3 RBT certifications expire in 14 days",      stage: "Credentialing",  owner: "Nikki",  action: "Trigger renewal flow" },
  { severity: "warn", title: "Burnout risk elevated · Scheduling team",     stage: "Engagement",     owner: "Daylis", action: "Run stay interviews" },
  { severity: "warn", title: "2 employees missing policy acknowledgements", stage: "Compliance",     owner: "Nikki",  action: "Send acknowledgement link" },
];

const training = [
  { name: "HIPAA Refresher · Annual",          pct: 92, kind: "Compliance", tone: "os-tone-mint"   },
  { name: "Scheduling Team · SOP v4",          pct: 78, kind: "Department", tone: "os-tone-amber"  },
  { name: "Manager Training · Coaching Plans", pct: 55, kind: "Leadership", tone: "os-tone-violet" },
  { name: "Operational Onboarding Checklist",  pct: 84, kind: "Onboarding", tone: "os-tone-sky"    },
];

const aiInsights = [
  { icon: AlertCircle,  tone: "os-tone-coral", title: "Orientation delays may impact staffing",  body: "4 orientations stalled — projected to delay 6 RBT placements next week.",       cta: "Open orientations" },
  { icon: AlertTriangle,tone: "os-tone-amber", title: "Training engagement dropping · Recruiting", body: "Recruiting dept training completion fell 12% — content may need refresh.",     cta: "Review module" },
  { icon: Brain,        tone: "os-tone-sky",   title: "Burnout risk elevated · Scheduling",     body: "Schedule load + after-hours messages up 18% — recommend stay interviews.",      cta: "Trigger pulse" },
  { icon: Lightbulb,    tone: "os-tone-lilac", title: "Evaluation backlog detected",            body: "9 reviews pending — clearing this week unlocks 4 promotions.",                    cta: "Open evaluations" },
  { icon: Activity,     tone: "os-tone-mint",  title: "Onboarding velocity improving",          body: "Avg onboarding time dropped 2 days — automation rules are working.",             cta: "See trend" },
];

const calls = [
  { title: "Orientation kickoff · Sofia Martinez", time: "9:00 – 9:45 AM",   tone: "os-tone-sky" },
  { title: "1:1 · Andre Wilson coaching plan",     time: "11:00 – 11:30",    tone: "os-tone-violet" },
  { title: "Employee relations · Aisha Cole",      time: "1:00 – 1:30 PM",   tone: "os-tone-rose" },
  { title: "Stay interview · Kenji Park",          time: "3:30 – 4:00 PM",   tone: "os-tone-amber" },
];

const quickActions = [
  { label: "Add Employee",         icon: UserPlus,       tone: "os-tone-rose"   },
  { label: "Schedule Orientation", icon: CalendarClock,  tone: "os-tone-sky"    },
  { label: "Assign Training",      icon: GraduationCap,  tone: "os-tone-violet" },
  { label: "Upload Document",      icon: Upload,         tone: "os-tone-lilac"  },
  { label: "Create Evaluation",    icon: ClipboardCheck, tone: "os-tone-mint"   },
  { label: "Approve Request",      icon: CheckCircle2,   tone: "os-tone-amber"  },
  { label: "Open SOP",             icon: BookOpen,       tone: "os-tone-violet" },
  { label: "View Reports",         icon: Activity,       tone: "os-tone-coral"  },
];

const activity = [
  { who: "Nikki",         what: "approved PTO · Maya Thompson",       when: "4m",  tone: "os-tone-violet", icon: CheckCircle2 },
  { who: "System",        what: "new employee onboarded · Martinez",   when: "18m", tone: "os-tone-mint",   icon: UserPlus },
  { who: "Andre Wilson",  what: "submitted self evaluation",           when: "32m", tone: "os-tone-sky",    icon: ClipboardCheck },
  { who: "System",        what: "background check completed · Park",   when: "55m", tone: "os-tone-amber",  icon: BadgeCheck },
  { who: "Sofia Martinez",what: "completed HIPAA training",            when: "1h",  tone: "os-tone-lilac",  icon: GraduationCap },
  { who: "Renee",         what: "uploaded coaching plan · Wilson",     when: "2h",  tone: "os-tone-rose",   icon: FileSignature },
];

/* ============ helpers ============ */

const toneText = (t: Tone) => t === "ok" ? "text-[hsl(155_55%_38%)]" : t === "warn" ? "text-[hsl(30_85%_45%)]" : "text-[hsl(355_72%_52%)]";
const toneBg   = (t: Tone) => t === "ok" ? "bg-[hsl(150_70%_92%)]" : t === "warn" ? "bg-[hsl(40_100%_92%)]" : "bg-[hsl(355_100%_95%)]";
const toneStrokeHsl = (t: Tone) => t === "ok" ? "hsl(155 55% 45%)" : t === "warn" ? "hsl(35 90% 55%)" : "hsl(355 75% 58%)";
const toneGlow = (t: Tone) =>
  t === "ok"   ? "shadow-[0_0_0_1px_hsl(155_60%_60%/0.22),0_18px_44px_-22px_hsl(155_60%_45%/0.35)]" :
  t === "warn" ? "shadow-[0_0_0_1px_hsl(35_90%_65%/0.28),0_18px_44px_-22px_hsl(35_85%_55%/0.4)]"   :
                 "shadow-[0_0_0_1px_hsl(355_75%_70%/0.30),0_18px_44px_-22px_hsl(355_72%_55%/0.45)]";
const toneLabel = (t: Tone) => t === "ok" ? "Healthy" : t === "warn" ? "Watch" : "Urgent";

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

function Dot({ tone }: { tone: Tone }) {
  const c = tone === "ok" ? "bg-[hsl(155_60%_50%)] shadow-[0_0_0_4px_hsl(155_60%_50%/0.18)]"
        : tone === "warn" ? "bg-[hsl(35_90%_55%)]  shadow-[0_0_0_4px_hsl(35_90%_55%/0.18)]"
        :                   "bg-[hsl(355_75%_58%)] shadow-[0_0_0_4px_hsl(355_75%_58%/0.18)]";
  return <span className={cn("inline-block h-2 w-2 rounded-full", c)} />;
}

function Spark({ data, tone }: { data: number[]; tone: Tone }) {
  const stroke = toneStrokeHsl(tone);
  const points = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`hr-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.32} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.75} fill={`url(#hr-${tone})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function KpiCard({ k }: { k: Kpi }) {
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

const kindIcon: Record<string, React.ElementType> = { Approval: CheckCircle2, Meeting: CalendarClock, Email: Mail };
const kindTone: Record<string, string> = { Approval: "os-tone-mint", Meeting: "os-tone-violet", Email: "os-tone-lilac" };

/* ============ PAGE ============ */

export default function OSHRTeam() {
  const { user } = useAuth();
  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Nikki").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const score = 91;

  return (
    <OSShell
      rightRail={
        <>
          {/* AI HR INSIGHTS */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.28)] to-transparent blur-2xl" />
            <header className="mb-3 flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                <Brain className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold tracking-tight">AI HR Insights</h3>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Predictive · People-first</p>
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

          {/* HR SCORE */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(155_70%_70%/0.25)] to-transparent blur-2xl" />
            <header className="mb-2">
              <h3 className="text-[14px] font-semibold tracking-tight">People Operations Score</h3>
              <p className="text-[10.5px] text-muted-foreground">Compliance · Engagement · Retention</p>
            </header>
            <div className="relative grid place-items-center py-2">
              <div className="relative h-[140px] w-[140px]">
                <ResponsiveContainer>
                  <RadialBarChart innerRadius="75%" outerRadius="100%" data={[{ v: score }]} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="v" cornerRadius={10} fill="hsl(265 85% 62%)" background={{ fill: "hsl(240 10% 94%)" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-[28px] font-semibold leading-none tracking-tight">{score}</p>
                    <p className="mt-1 text-[9.5px] uppercase tracking-wider text-muted-foreground">Excellent</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="rounded-lg bg-[hsl(150_70%_94%)] py-1.5 font-semibold text-[hsl(155_55%_32%)]">Cmp 94</div>
              <div className="rounded-lg bg-[hsl(40_100%_94%)] py-1.5 font-semibold text-[hsl(30_80%_42%)]">Eng 88</div>
              <div className="rounded-lg bg-[hsl(265_100%_95%)] py-1.5 font-semibold text-[hsl(265_70%_50%)]">Ret 91</div>
            </div>
          </section>

          {/* TODAY */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold tracking-tight">Today</h3>
              <span className="text-[11px] text-muted-foreground">{today}</span>
            </header>
            <ul className="space-y-3">
              {calls.map((m) => (
                <li key={m.title} className="flex items-center gap-3">
                  <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", m.tone)}>
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium leading-tight">{m.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{m.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* TRAINING & COMPLIANCE */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
                <h3 className="text-[14px] font-semibold tracking-tight">Training & Compliance</h3>
              </div>
              <Pill tone="med">{training.length}</Pill>
            </header>
            <ul className="space-y-2.5">
              {training.map((t) => (
                <li key={t.name} className="rounded-xl border border-white/70 bg-white/70 p-2.5">
                  <div className="flex items-center gap-2">
                    <div className={cn("grid h-7 w-7 place-items-center rounded-xl", t.tone)}>
                      <BookOpen className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold leading-tight">{t.name}</p>
                      <p className="text-[10.5px] text-muted-foreground">{t.kind}</p>
                    </div>
                    <span className="tabular-nums text-[11px] font-semibold">{t.pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)]" style={{ width: `${t.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* LIVE ACTIVITY */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
                <h3 className="text-[14px] font-semibold tracking-tight">Recent HR Activity</h3>
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
              <HeartHandshake className="h-3 w-3 text-[hsl(265_70%_55%)]" /> HR Team · People Ops Mission Control
            </div>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[34px]">
              {greet}, <span className="capitalize">{name}</span> <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {today} · Here's what's happening across Employee Operations today.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(265_100%_95%)] px-2.5 py-1 font-semibold text-[hsl(265_70%_50%)]">
                <Users className="h-3 w-3" /> 248 active employees
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(355_100%_94%)] px-2.5 py-1 font-semibold text-[hsl(355_70%_48%)]">
                <AlertTriangle className="h-3 w-3" /> 4 overdue documents
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(40_100%_92%)] px-2.5 py-1 font-semibold text-[hsl(30_80%_42%)]">
                <ClipboardCheck className="h-3 w-3" /> 9 evaluations due
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(150_70%_92%)] px-2.5 py-1 font-semibold text-[hsl(155_55%_32%)]">
                <TrendingUp className="h-3 w-3" /> 94% compliance
              </span>
            </div>
          </div>

          {/* AI HR Briefing */}
          <div className="relative w-full max-w-md shrink-0 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_14px_36px_-20px_hsl(265_60%_50%/0.35)] backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-none tracking-tight">HR AI Briefing</p>
                <p className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Updated 2 min ago</p>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/85">
              <span className="font-semibold text-[hsl(155_55%_38%)]">Orientation completion</span> improved this week, but
              <span className="font-semibold"> 4 employee documents</span> are overdue and training engagement dropped in
              <span className="font-semibold"> Scheduling</span>.
            </p>
            <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.55)] transition hover:opacity-95">
              Open HR Insights <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* KPI GRID */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h2 className="text-[15px] font-semibold tracking-tight">Employee Operations KPIs</h2>
            <Pill tone="default">{kpis.length} metrics</Pill>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">Today</button>
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">7d</button>
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">30d</button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kpis.map((k) => <KpiCard key={k.label} k={k} />)}
        </div>
      </section>

      {/* LIFECYCLE PIPELINE */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Employee Lifecycle Overview</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Applicant through offboarding — every stage tracked</p>
          </div>
          <button className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">Open directory</button>
        </header>
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-3 px-1">
            {stages.map((s) => (
              <div key={s.name} className="w-[170px] shrink-0 rounded-2xl border border-white/70 bg-white/70 p-3">
                <div className="flex items-center gap-2">
                  <div className={cn("grid h-7 w-7 place-items-center rounded-xl", s.tone)}>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                  <p className="truncate text-[11.5px] font-semibold leading-tight">{s.name}</p>
                </div>
                <p className="mt-2 text-[22px] font-semibold tabular-nums leading-none">{s.count}</p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Avg {s.avg}</span>
                  {s.stalled > 0 ? <Pill tone="warn">{s.stalled} stalled</Pill> : <Pill tone="ok">on track</Pill>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* employee cards */}
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((l) => (
            <button key={l.parent} className="group flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_hsl(265_60%_50%/0.28)]">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_70%/0.18)] to-[hsl(210_85%_75%/0.18)] text-[hsl(265_70%_45%)] font-semibold">
                {l.parent.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-semibold leading-tight">{l.parent}</p>
                  <Dot tone={l.urgency} />
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{l.child} · {l.insurance} · {l.owner}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Pill tone="default">{l.stage}</Pill>
                  <span className="text-[10.5px] text-muted-foreground">{l.since}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 self-center text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </button>
          ))}
        </div>
      </section>

      {/* TASKS & REQUESTS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Employee Requests & HR Tasks</h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {["All", "Approvals", "PTO", "Evaluations", "Onboarding", "Concerns", "Escalations"].map((t, i) => (
              <button key={t} className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-semibold",
                i === 0 ? "bg-foreground text-background" : "bg-foreground/[0.05] text-foreground/70 hover:bg-foreground/[0.08]"
              )}>{t}</button>
            ))}
          </div>
        </header>
        <ul className="divide-y divide-foreground/[0.06]">
          {followups.map((f) => {
            const Icon = kindIcon[f.kind] ?? CheckCircle2;
            const prio = f.priority === "High" ? "high" : f.priority === "Medium" ? "med" : "low";
            return (
              <li key={f.parent + f.time} className="group flex items-center gap-3 py-3">
                <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", kindTone[f.kind] ?? "os-tone-sky")}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold leading-tight">{f.parent}</p>
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground">{f.stage} · Last: {f.last} · {f.time}</p>
                </div>
                <Pill tone={prio as any}>{f.priority}</Pill>
                <div className="ml-1 hidden items-center gap-1 md:flex">
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Note"><StickyNote className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Message"><MessageSquare className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Snooze"><Pause className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Reassign"><RefreshCw className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(150_70%_92%)] text-[hsl(155_55%_35%)] hover:bg-[hsl(150_70%_88%)]" title="Approve"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ONBOARDING + CREDENTIALING */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="os-card lg:col-span-2">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Onboarding & Orientation Tracking</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <Pill tone="warn">3 stalled</Pill>
              <Pill tone="crit">1 flagged</Pill>
            </div>
          </header>
          <ul className="space-y-2.5">
            {forms.map((f) => (
              <li key={f.name} className={cn(
                "rounded-2xl border border-white/70 bg-white/70 p-3.5",
                f.tone === "crit" && "shadow-[inset_3px_0_0_hsl(355_75%_58%)]",
                f.tone === "warn" && "shadow-[inset_3px_0_0_hsl(35_90%_55%)]",
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", toneBg(f.tone), toneText(f.tone))}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold leading-tight">{f.name}</p>
                    <p className="mt-0.5 text-[10.5px] text-muted-foreground">{f.status}{f.days > 0 ? ` · ${f.days}d open` : ""}</p>
                  </div>
                  <Pill tone={f.tone}>{toneLabel(f.tone)}</Pill>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                  <div className="h-full rounded-full" style={{ width: `${f.pct}%`, background: `linear-gradient(90deg, ${toneStrokeHsl(f.tone)}, hsl(265 85% 72%))` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Credentialing & Documents</h3>
            </div>
            <Pill tone="ok">84% ready</Pill>
          </header>
          <ul className="space-y-3">
            {comms.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl", c.tone)}>
                  <c.icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-tight">
                    <span className="font-semibold">{c.who}</span>{" "}
                    <span className="text-muted-foreground">{c.what}</span>
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground">{c.when} ago</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><Upload className="mr-1 inline h-3 w-3" />Upload</button>
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><BadgeCheck className="mr-1 inline h-3 w-3" />Verify</button>
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><RefreshCw className="mr-1 inline h-3 w-3" />Renew</button>
          </div>
        </section>
      </div>

      {/* BOTTLENECKS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-[hsl(355_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Evaluations, Engagement & Urgent HR Items</h3>
          </div>
          <div className="flex items-center gap-1.5">
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
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">{b.stage} · Owner {b.owner}</p>
              </div>
              <div className="hidden items-center gap-1.5 text-[10.5px] text-muted-foreground md:flex">
                <span>Next:</span>
                <span className="font-semibold text-foreground">{b.action}</span>
              </div>
              <button className="ml-1 inline-flex items-center gap-1 rounded-lg bg-foreground/[0.05] px-2.5 py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]">
                Take action <ArrowRight className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      </section>

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
