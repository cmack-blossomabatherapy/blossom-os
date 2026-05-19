import {
  UserPlus, Heart, CalendarDays, DollarSign, ArrowUpRight, ArrowDownRight,
  Circle, ClipboardList, Users, FolderKanban, FileText,
  Send, Sparkles, Shield, Briefcase, GraduationCap, Workflow,
  Brain, Zap, Activity, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  Bot, Wand2, BookOpen, Target, Plus, BarChart3, ChevronRight, Flame,
  Lightbulb, Cpu, Rocket, MessageSquare, FileCheck2, BadgeCheck,
  Megaphone, LifeBuoy, Radio, Star, Award, Gauge,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRole } from "@/contexts/OSRoleContext";
import { ROLE_HOME } from "@/lib/os/roleHome";
import { Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/* ---------------- mock data ---------------- */

const revenueData = [
  { d: "May 1", v: 420000 }, { d: "May 4", v: 480000 }, { d: "May 8", v: 560000 },
  { d: "May 11", v: 640000 }, { d: "May 15", v: 720000 }, { d: "May 18", v: 820000 },
  { d: "May 22", v: 940000 }, { d: "May 25", v: 1060000 }, { d: "May 29", v: 1240000 },
];
const intakeConvData = [
  { m: "Dec", v: 38 }, { m: "Jan", v: 41 }, { m: "Feb", v: 44 },
  { m: "Mar", v: 47 }, { m: "Apr", v: 52 }, { m: "May", v: 58 },
];
const hiringData = [
  { m: "Dec", v: 6 }, { m: "Jan", v: 9 }, { m: "Feb", v: 12 },
  { m: "Mar", v: 14 }, { m: "Apr", v: 18 }, { m: "May", v: 22 },
];
const stateFill = [
  { name: "FL", value: 94 }, { name: "GA", value: 88 },
  { name: "NC", value: 76 }, { name: "TX", value: 91 }, { name: "AZ", value: 82 },
];
const pipeline = [
  { name: "New",        value: 32, pct: 25, color: "hsl(265 85% 65%)" },
  { name: "Contacted",  value: 28, pct: 22, color: "hsl(210 85% 60%)" },
  { name: "Qualified",  value: 40, pct: 31, color: "hsl(330 75% 62%)" },
  { name: "Proposal",   value: 18, pct: 14, color: "hsl(30 90% 60%)"  },
  { name: "Won",        value: 10, pct: 8,  color: "hsl(155 60% 50%)" },
];

const kpis = [
  { icon: Heart,        tone: "os-tone-rose",   label: "Active Clients",   value: "842",   delta: "+12%", up: true,  hint: "vs last month", spark: [12,14,13,16,18,17,19,22,24,23,26] },
  { icon: UserPlus,     tone: "os-tone-violet", label: "New Leads (7d)",   value: "128",   delta: "+18%", up: true,  hint: "vs last week",  spark: [4,8,6,10,12,14,18,16,22,24,28] },
  { icon: FileCheck2,   tone: "os-tone-amber",  label: "Auths Expiring",   value: "23",    delta: "+4",   up: false, hint: "next 30 days",  spark: [10,12,11,14,15,17,16,18,20,22,23] },
  { icon: Briefcase,    tone: "os-tone-sky",    label: "Staffing Needed",  value: "18",    delta: "-3",   up: true,  hint: "open requests", spark: [22,20,19,21,20,18,17,18,19,18,18] },
  { icon: DollarSign,   tone: "os-tone-mint",   label: "Revenue (MTD)",    value: "$1.24M",delta: "+9%",  up: true,  hint: "vs last month", spark: [40,48,56,64,72,82,94,106,118,124,124] },
  { icon: LifeBuoy,     tone: "os-tone-coral",  label: "Open Tech Reqs",   value: "11",    delta: "+2",   up: false, hint: "3 urgent",      spark: [6,5,7,8,7,9,10,11,12,11,11] },
  { icon: GraduationCap,tone: "os-tone-lilac",  label: "Training Complete",value: "87%",   delta: "+5%",  up: true,  hint: "company-wide",  spark: [70,72,74,75,78,80,82,84,85,86,87] },
  { icon: FolderKanban, tone: "os-tone-violet", label: "Open Projects",    value: "14",    delta: "+1",   up: true,  hint: "4 launching",   spark: [9,10,11,11,12,12,13,13,14,14,14] },
];

const departments = [
  { name: "Intake",         icon: ClipboardList, tone: "os-tone-rose",   value: "14m", hint: "Avg response time", status: "healthy", alerts: 0, due: 4 },
  { name: "Scheduling",     icon: CalendarDays,  tone: "os-tone-sky",    value: "92%", hint: "Fill rate",         status: "healthy", alerts: 0, due: 6 },
  { name: "Recruiting",     icon: UserPlus,      tone: "os-tone-violet", value: "8",   hint: "Pending candidates",status: "warning", alerts: 2, due: 3 },
  { name: "Credentialing",  icon: BadgeCheck,    tone: "os-tone-lilac",  value: "5",   hint: "In progress",       status: "critical",alerts: 3, due: 5 },
  { name: "Authorizations", icon: FileCheck2,    tone: "os-tone-amber",  value: "23",  hint: "Expiring 30d",      status: "warning", alerts: 1, due: 7 },
  { name: "QA",             icon: Shield,        tone: "os-tone-mint",   value: "+12%",hint: "Backlog growth",    status: "warning", alerts: 2, due: 9 },
  { name: "Billing",        icon: DollarSign,    tone: "os-tone-mint",   value: "$320K",hint:"Unpaid claims",     status: "healthy", alerts: 0, due: 2 },
  { name: "HR",             icon: Users,         tone: "os-tone-violet", value: "94%", hint: "Onboarding done",   status: "healthy", alerts: 0, due: 1 },
  { name: "Marketing",      icon: Megaphone,     tone: "os-tone-coral",  value: "3.4x",hint: "Lead ROI",          status: "healthy", alerts: 0, due: 2 },
  { name: "Training",       icon: GraduationCap, tone: "os-tone-lilac",  value: "87%", hint: "Completion",        status: "warning", alerts: 1, due: 5 },
];

const projects = [
  { name: "Blossom OS Redesign",     pct: 72, team: ["CM","ER","JT"], due: "Jun 14", priority: "High",   status: "On track", tone: "os-tone-violet" },
  { name: "Training Academy v2",     pct: 58, team: ["OC","SM"],      due: "Jun 28", priority: "High",   status: "On track", tone: "os-tone-lilac" },
  { name: "AI Intake Agent",         pct: 41, team: ["CM","BB"],      due: "Jul 05", priority: "Medium", status: "At risk",  tone: "os-tone-rose" },
  { name: "KPI Dashboard Rollout",   pct: 86, team: ["CM","ER"],      due: "Jun 03", priority: "High",   status: "On track", tone: "os-tone-mint" },
  { name: "Scheduling Automation",   pct: 33, team: ["JT","SM"],      due: "Jul 18", priority: "Medium", status: "Blocked",  tone: "os-tone-amber" },
  { name: "Viventium Payroll Sync",  pct: 64, team: ["BB","OC"],      due: "Jun 21", priority: "Low",    status: "On track", tone: "os-tone-sky" },
];

const automations = [
  { name: "Make.com — Lead Intake → CRM",    status: "healthy",  detail: "412 runs / 24h" },
  { name: "Monday — Auth Tracker Sync",      status: "warning",  detail: "Last sync 38m ago" },
  { name: "AI Call Transcription Queue",     status: "critical", detail: "Queue backed up — 64 pending" },
  { name: "RBT Onboarding Workflow",         status: "healthy",  detail: "18 completed today" },
  { name: "BCBA Credential Renewal Bot",     status: "healthy",  detail: "0 failures / 7d" },
  { name: "Insurance Verification Agent",    status: "warning",  detail: "2 failed overnight" },
];

const performers = [
  { name: "Emily Rivera",  dept: "Intake",       score: 98, hint: "18% above avg" },
  { name: "Jacob Tran",    dept: "Scheduling",   score: 95, hint: "Top fill rate" },
  { name: "Olivia Chen",   dept: "Credentialing",score: 92, hint: "Fastest turnaround" },
  { name: "Sarah Martin",  dept: "Recruiting",   score: 89, hint: "Most placements" },
];
const atRisk = [
  { name: "Brandon B.",  dept: "QA",       reason: "12 overdue tasks" },
  { name: "Nicole D.",   dept: "Billing",  reason: "Response time +42%" },
  { name: "Marcus W.",   dept: "Recruiting", reason: "3 missed deadlines" },
];

const training = [
  { name: "RBT Onboarding 2.0", pct: 92, dept: "Field Ops" },
  { name: "HIPAA Refresher",    pct: 78, dept: "Company-wide" },
  { name: "Documentation SOP",  pct: 64, dept: "BCBA" },
  { name: "Crisis Response",    pct: 51, dept: "RBT" },
];

const tasks = [
  { title: "Review Blossom OS redesign PR",       project: "OS Redesign",   due: "Today",     priority: "High",   status: "In progress" },
  { title: "Approve VA credentialing batch",      project: "Credentialing", due: "Today",     priority: "High",   status: "Waiting" },
  { title: "Sign off on Training Academy v2",     project: "Training",      due: "Tomorrow",  priority: "Medium", status: "Open" },
  { title: "Fix Monday→CRM sync regression",      project: "Automations",   due: "Tomorrow",  priority: "High",   status: "Blocked" },
  { title: "QBR deck — May",                      project: "Leadership",    due: "May 30",    priority: "Medium", status: "Open" },
  { title: "Interview 2 BCBA candidates",         project: "Recruiting",    due: "Fri",       priority: "Low",    status: "Open" },
];

const activity = [
  { who: "Emily R.",  what: "submitted a new lead",          when: "2m",  tone: "os-tone-violet", icon: UserPlus },
  { who: "Olivia C.", what: "approved BCBA credential",      when: "18m", tone: "os-tone-mint",   icon: BadgeCheck },
  { who: "Aetna",     what: "denied auth #A-2841",           when: "32m", tone: "os-tone-coral",  icon: AlertTriangle },
  { who: "Jacob T.",  what: "completed HIPAA refresher",     when: "1h",  tone: "os-tone-lilac",  icon: GraduationCap },
  { who: "System",    what: "published new Intake SOP",      when: "2h",  tone: "os-tone-sky",    icon: BookOpen },
  { who: "Corey M.",  what: "updated KPI Dashboard project", when: "3h",  tone: "os-tone-violet", icon: FolderKanban },
  { who: "Make.com",  what: "automation failure recovered",  when: "4h",  tone: "os-tone-amber",  icon: Zap },
];

const aiInsights = [
  { icon: Flame,     tone: "os-tone-rose",   title: "Credentialing bottleneck",  body: "5 VA credentials stalled >7 days. Likely 6-day slip if untouched.", cta: "Open queue" },
  { icon: TrendingUp,tone: "os-tone-mint",   title: "Intake speed improving",    body: "Avg response time down 23% WoW across FL & TX.",                cta: "View trend" },
  { icon: AlertTriangle,tone: "os-tone-amber", title: "NC intake conversion ↓",  body: "Conversion dropped 12% last 14 days. 3 likely causes identified.", cta: "See analysis" },
  { icon: Lightbulb, tone: "os-tone-lilac",  title: "Suggested rollout",         body: "Roll Documentation SOP to BCBA group — adoption gap detected.",  cta: "Plan rollout" },
  { icon: Cpu,       tone: "os-tone-sky",    title: "Automation degradation",   body: "Monday sync latency rising 4 days. Recommend health check.",     cta: "Run check" },
];

const meetings = [
  { title: "Leadership Standup",        time: "9:00 – 9:30 AM",  tone: "os-tone-sky" },
  { title: "OS Redesign Review",        time: "11:00 – 12:00",   tone: "os-tone-violet" },
  { title: "BCBA Candidate Interviews", time: "2:00 – 4:00 PM",  tone: "os-tone-rose" },
  { title: "1:1 — Olivia",              time: "4:30 – 5:00 PM",  tone: "os-tone-amber" },
];

const quickActions = [
  { label: "Add Lead",          icon: UserPlus,    tone: "os-tone-rose"   },
  { label: "Create Client",     icon: Heart,       tone: "os-tone-violet" },
  { label: "Open Project",      icon: FolderKanban,tone: "os-tone-lilac"  },
  { label: "Publish SOP",       icon: BookOpen,    tone: "os-tone-sky"    },
  { label: "Create Training",   icon: GraduationCap,tone: "os-tone-mint"  },
  { label: "Create Automation", icon: Zap,         tone: "os-tone-amber"  },
  { label: "Submit Tech Req",   icon: LifeBuoy,    tone: "os-tone-coral"  },
  { label: "Generate Report",   icon: BarChart3,   tone: "os-tone-violet" },
];

/* ---------------- helpers ---------------- */

function fmtMoney(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1000)}K`;
  return `$${v}`;
}

function Spark({ data, up }: { data: number[]; up: boolean }) {
  const points = data.map((v, i) => ({ i, v }));
  const stroke = up ? "hsl(155 55% 45%)" : "hsl(355 70% 58%)";
  const fill   = up ? "hsl(155 55% 45% / 0.18)" : "hsl(355 70% 58% / 0.18)";
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sp-${up ? "u" : "d"}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.75} fill={fill} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StatusDot({ status }: { status: "healthy" | "warning" | "critical" }) {
  const color =
    status === "healthy"  ? "bg-[hsl(155_60%_50%)] shadow-[0_0_0_4px_hsl(155_60%_50%/0.18)]" :
    status === "warning"  ? "bg-[hsl(35_90%_55%)]  shadow-[0_0_0_4px_hsl(35_90%_55%/0.18)]"  :
                            "bg-[hsl(355_75%_58%)] shadow-[0_0_0_4px_hsl(355_75%_58%/0.18)]";
  return <span className={cn("inline-block h-2 w-2 rounded-full", color)} />;
}

function Pill({ tone = "default", children }: { tone?: "default" | "high" | "med" | "low" | "ok" | "warn" | "crit"; children: React.ReactNode }) {
  const map: Record<string, string> = {
    default: "bg-foreground/[0.05] text-foreground/70",
    high:    "bg-[hsl(355_100%_95%)] text-[hsl(355_70%_50%)]",
    med:     "bg-[hsl(30_100%_94%)]  text-[hsl(30_80%_45%)]",
    low:     "bg-[hsl(210_100%_95%)] text-[hsl(215_70%_50%)]",
    ok:      "bg-[hsl(150_70%_92%)]  text-[hsl(155_55%_35%)]",
    warn:    "bg-[hsl(40_100%_92%)]  text-[hsl(30_80%_42%)]",
    crit:    "bg-[hsl(355_100%_94%)] text-[hsl(355_70%_48%)]",
  };
  return <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-tight", map[tone])}>{children}</span>;
}

function Avatar({ initials, tone = "violet" }: { initials: string; tone?: "violet" | "rose" | "sky" | "mint" }) {
  const map = {
    violet: "from-[hsl(265_70%_85%)] to-[hsl(285_70%_88%)] text-[hsl(265_60%_40%)]",
    rose:   "from-[hsl(340_80%_90%)] to-[hsl(355_80%_92%)] text-[hsl(340_60%_42%)]",
    sky:    "from-[hsl(210_80%_88%)] to-[hsl(225_80%_92%)] text-[hsl(215_60%_38%)]",
    mint:   "from-[hsl(150_70%_88%)] to-[hsl(165_70%_92%)] text-[hsl(155_55%_30%)]",
  };
  return (
    <div className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[10.5px] font-bold", map[tone])}>
      {initials}
    </div>
  );
}

/* ---------------- KPI Card ---------------- */

function KpiCard({ k }: { k: typeof kpis[number] }) {
  const Icon = k.icon;
  return (
    <div className="os-card os-rise group relative overflow-hidden">
      <div className="flex items-start gap-3">
        <div className={cn("os-kpi-icon", k.tone)}><Icon className="h-5 w-5" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-[11.5px] font-medium text-muted-foreground">{k.label}</p>
          <p className="mt-0.5 text-[24px] font-semibold tracking-tight leading-none">{k.value}</p>
        </div>
      </div>
      <div className="mt-2 -mx-1"><Spark data={k.spark} up={k.up} /></div>
      <div className="mt-1 flex items-center gap-1 text-[11px] font-medium">
        {k.up ? <ArrowUpRight className="h-3 w-3 os-trend-up" /> : <ArrowDownRight className="h-3 w-3 os-trend-down" />}
        <span className={k.up ? "os-trend-up" : "os-trend-down"}>{k.delta}</span>
        <span className="text-muted-foreground">{k.hint}</span>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function OSDashboard() {
  const { user } = useAuth();
  const { role } = useOSRole();
  // Non-super-admin roles get redirected to their role-specific dashboard.
  if (role !== "super_admin") {
    return <Navigate to={ROLE_HOME[role]} replace />;
  }
  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Corey").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <OSShell
      rightRail={
        <>
          {/* AI INSIGHTS */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.25)] to-transparent blur-2xl" />
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                  <Brain className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-[14px] font-semibold tracking-tight">AI Insights</h3>
              </div>
              <button className="text-[11px] font-semibold text-[hsl(265_70%_55%)] hover:underline">All</button>
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

          {/* RECENT ACTIVITY */}
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
      <header className="os-rise relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-white via-[hsl(265_100%_99%)] to-[hsl(285_100%_98%)] p-6 shadow-[0_24px_60px_-30px_hsl(265_60%_50%/0.25)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.35)] to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-24 h-56 w-56 rounded-full bg-gradient-to-br from-[hsl(330_85%_75%/0.25)] to-transparent blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-muted-foreground backdrop-blur">
              <Shield className="h-3 w-3 text-[hsl(265_70%_55%)]" /> Systems & Software · Super Admin
            </div>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[34px]">
              {greet}, <span className="capitalize">{name}</span> <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {today} · Here's what's happening across Blossom today.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(150_70%_92%)] px-2.5 py-1 font-semibold text-[hsl(155_55%_32%)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(155_60%_50%)]" /> All systems operational
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(40_100%_92%)] px-2.5 py-1 font-semibold text-[hsl(30_80%_42%)]">
                <AlertTriangle className="h-3 w-3" /> 3 active alerts
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(265_100%_95%)] px-2.5 py-1 font-semibold text-[hsl(265_70%_50%)]">
                <Sparkles className="h-3 w-3" /> 5 new AI insights
              </span>
            </div>
          </div>

          {/* AI Briefing card */}
          <div className="relative w-full max-w-md shrink-0 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_14px_36px_-20px_hsl(265_60%_50%/0.35)] backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-none tracking-tight">Blossom AI Briefing</p>
                <p className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Updated 2 min ago</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 text-[12px]">
              {[
                ["3 intake bottlenecks detected",   "warn"],
                ["VA credentialing delayed (5)",    "crit"],
                ["12 overdue trainings",            "warn"],
                ["Scheduling efficiency +8%",       "ok"],
                ["2 automations failed overnight",  "crit"],
              ].map(([text, tone]) => (
                <li key={text as string} className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 rounded-full",
                    tone === "ok" ? "bg-[hsl(155_60%_50%)]" : tone === "warn" ? "bg-[hsl(35_90%_55%)]" : "bg-[hsl(355_75%_58%)]")} />
                  <span className="text-foreground/80">{text}</span>
                </li>
              ))}
            </ul>
            <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.55)] transition hover:opacity-95">
              Open AI Insights <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 1 — KPI GRID */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => <KpiCard key={k.label} k={k} />)}
      </div>

      {/* SECTION 2 — BUSINESS HEALTH */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Business Health</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Operational analytics across the company</p>
          </div>
          <button className="os-glass-input rounded-xl px-3 py-1.5 text-[12px] font-medium">Last 30 days ▾</button>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Revenue */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11.5px] font-medium text-muted-foreground">Revenue Overview</p>
                <p className="mt-0.5 text-[22px] font-semibold tracking-tight">$1,240,000</p>
                <p className="text-[10.5px] text-muted-foreground">Month to date</p>
              </div>
              <Pill tone="ok">+9% MoM</Pill>
            </div>
            <div className="mt-3 h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(265 85% 65%)" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="hsl(265 85% 65%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} tickFormatter={(v) => fmtMoney(v)} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(255 30% 92%)" }} formatter={(v: number) => fmtMoney(v)} />
                  <Area type="monotone" dataKey="v" stroke="hsl(265 85% 60%)" strokeWidth={2.25} fill="url(#rev2)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pipeline donut */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-[11.5px] font-medium text-muted-foreground">Lead Pipeline</p>
            <div className="mt-1 flex items-center gap-3">
              <div className="relative h-[140px] w-[140px] shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pipeline} dataKey="value" innerRadius={44} outerRadius={64} paddingAngle={3} strokeWidth={0}>
                      {pipeline.map((p) => <Cell key={p.name} fill={p.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-[18px] font-semibold leading-none">128</p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">leads</p>
                  </div>
                </div>
              </div>
              <ul className="flex-1 space-y-1.5 text-[11.5px]">
                {pipeline.map((p) => (
                  <li key={p.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                    <span className="flex-1 font-medium">{p.name}</span>
                    <span className="tabular-nums text-muted-foreground">{p.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Intake conv */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11.5px] font-medium text-muted-foreground">Intake Conversion</p>
                <p className="mt-0.5 text-[20px] font-semibold tracking-tight">58%</p>
              </div>
              <Pill tone="ok">+6 pts</Pill>
            </div>
            <div className="mt-2 h-[110px]">
              <ResponsiveContainer>
                <AreaChart data={intakeConvData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(155 55% 45%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(155 55% 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                  <Area type="monotone" dataKey="v" stroke="hsl(155 55% 45%)" strokeWidth={2} fill="url(#ic)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hiring */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11.5px] font-medium text-muted-foreground">Hires / Month</p>
                <p className="mt-0.5 text-[20px] font-semibold tracking-tight">22</p>
              </div>
              <Pill tone="ok">+22%</Pill>
            </div>
            <div className="mt-2 h-[110px]">
              <ResponsiveContainer>
                <BarChart data={hiringData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <XAxis dataKey="m" tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} axisLine={false} tickLine={false} />
                  <Bar dataKey="v" fill="hsl(265 85% 70%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fill rate by state */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-[11.5px] font-medium text-muted-foreground">Scheduling Fill Rate · by state</p>
            <ul className="mt-3 space-y-2.5">
              {stateFill.map((s) => (
                <li key={s.name}>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold">{s.name}</span>
                    <span className="tabular-nums text-muted-foreground">{s.value}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)]"
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 3 — DEPARTMENTS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Department Overview</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Live operational status across {departments.length} departments</p>
          </div>
          <button className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">View all</button>
        </header>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {departments.map((d) => (
            <button key={d.name} className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_hsl(265_60%_50%/0.28)]">
              <div className="flex items-center justify-between">
                <div className={cn("grid h-8 w-8 place-items-center rounded-xl", d.tone)}>
                  <d.icon className="h-4 w-4" />
                </div>
                <StatusDot status={d.status as any} />
              </div>
              <p className="mt-2.5 text-[12px] font-semibold tracking-tight">{d.name}</p>
              <p className="mt-1.5 text-[18px] font-semibold tracking-tight">{d.value}</p>
              <p className="text-[10.5px] text-muted-foreground">{d.hint}</p>
              <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                {d.alerts > 0 && <Pill tone="crit">{d.alerts} alert{d.alerts > 1 ? "s" : ""}</Pill>}
                <Pill tone="default">{d.due} due</Pill>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 4 — PROJECTS & SYSTEMS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Projects & Systems</h3>
          </div>
          <div className="flex items-center gap-2">
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">Kanban</button>
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">Timeline</button>
            <button className="rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] px-3 py-1.5 text-[11.5px] font-semibold text-white">
              <Plus className="mr-1 inline h-3 w-3" /> New
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const statusTone = p.status === "On track" ? "ok" : p.status === "At risk" ? "warn" : "crit";
            const prioTone   = p.priority === "High" ? "high" : p.priority === "Medium" ? "med" : "low";
            return (
              <div key={p.name} className="rounded-2xl border border-white/70 bg-white/70 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_hsl(265_60%_50%/0.25)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("grid h-8 w-8 place-items-center rounded-xl", p.tone)}>
                      <FolderKanban className="h-4 w-4" />
                    </div>
                    <p className="text-[12.5px] font-semibold tracking-tight">{p.name}</p>
                  </div>
                  <Pill tone={prioTone as any}>{p.priority}</Pill>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10.5px] text-muted-foreground">
                  <span>Progress</span>
                  <span className="tabular-nums">{p.pct}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)]" style={{ width: `${p.pct}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    {p.team.map((t, i) => (
                      <div key={i} className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-[hsl(265_70%_85%)] to-[hsl(285_70%_88%)] text-[9.5px] font-bold text-[hsl(265_60%_40%)]">
                        {t}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> Due {p.due}
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <Pill tone={statusTone as any}>{p.status}</Pill>
                  <button className="text-[10.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">Open →</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 5 — TECH & AUTOMATION HEALTH */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Tech & Automation Health</h3>
          </div>
          <div className="flex items-center gap-2 text-[10.5px]">
            <Pill tone="ok">4 healthy</Pill>
            <Pill tone="warn">2 warning</Pill>
            <Pill tone="crit">1 critical</Pill>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {automations.map((a) => (
            <div key={a.name} className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 p-3.5">
              <StatusDot status={a.status as any} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold tracking-tight">{a.name}</p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">{a.detail}</p>
              </div>
              <button className="os-glass-icon h-8 w-8 rounded-xl"><Zap className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6 — STAFF PERFORMANCE */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[hsl(155_55%_40%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Top Performers</h3>
            </div>
            <button className="text-[11px] font-semibold text-[hsl(265_70%_55%)] hover:underline">View</button>
          </header>
          <ul className="space-y-2.5">
            {performers.map((p) => (
              <li key={p.name} className="flex items-center gap-3 rounded-xl border border-white/70 bg-white/70 p-2.5">
                <Avatar initials={p.name.split(" ").map(s => s[0]).join("")} tone="mint" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold leading-tight">{p.name}</p>
                  <p className="text-[10.5px] text-muted-foreground">{p.dept} · {p.hint}</p>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-[hsl(150_70%_92%)] px-2 py-1 text-[11px] font-bold text-[hsl(155_55%_32%)]">
                  <Star className="h-3 w-3" /> {p.score}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[hsl(355_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">At-Risk Staff</h3>
            </div>
            <button className="text-[11px] font-semibold text-[hsl(265_70%_55%)] hover:underline">Review</button>
          </header>
          <ul className="space-y-2.5">
            {atRisk.map((p) => (
              <li key={p.name} className="flex items-center gap-3 rounded-xl border border-white/70 bg-white/70 p-2.5">
                <Avatar initials={p.name.split(" ").map(s => s[0]).join("")} tone="rose" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold leading-tight">{p.name}</p>
                  <p className="text-[10.5px] text-muted-foreground">{p.dept} · {p.reason}</p>
                </div>
                <Pill tone="warn">Follow up</Pill>
              </li>
            ))}
            <li className="rounded-xl border border-dashed border-foreground/[0.12] p-3 text-center text-[11px] text-muted-foreground">
              Department avg response: <span className="font-semibold text-foreground">2h 14m</span> · Company avg: <span className="font-semibold text-foreground">2h 48m</span>
            </li>
          </ul>
        </section>
      </div>

      {/* SECTION 7 — TRAINING & ADOPTION */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Training & Adoption</h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            Company completion: <span className="font-semibold text-foreground">87%</span>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {training.map((t) => (
            <div key={t.name} className="rounded-2xl border border-white/70 bg-white/70 p-3.5">
              <p className="text-[12.5px] font-semibold tracking-tight">{t.name}</p>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">{t.dept}</p>
              <div className="mt-3 flex items-center justify-between text-[10.5px]">
                <span className="text-muted-foreground">Completion</span>
                <span className="tabular-nums font-semibold">{t.pct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)]" style={{ width: `${t.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-3.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Recently completed</p>
            <p className="mt-1 text-[12.5px]">HIPAA Refresher · 24 staff</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/70 p-3.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Needs attention</p>
            <p className="mt-1 text-[12.5px]">12 overdue trainings across 4 depts</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/70 p-3.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Suggested rollout</p>
            <p className="mt-1 text-[12.5px]">Documentation SOP → BCBA group</p>
          </div>
        </div>
      </section>

      {/* SECTION 8 — TASKS & PRIORITIES */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Tasks & Priorities</h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {["My Tasks", "Urgent", "Waiting", "This Week", "Blocked"].map((t, i) => (
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
            const stat = t.status === "Blocked" ? "crit" : t.status === "Waiting" ? "warn" : "default";
            return (
              <li key={t.title} className="group flex items-center gap-3 py-3">
                <button className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-foreground/20 text-transparent transition hover:border-[hsl(155_55%_45%)] hover:bg-[hsl(150_70%_92%)] hover:text-[hsl(155_55%_35%)]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium">{t.title}</p>
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground">{t.project} · Due {t.due}</p>
                </div>
                <Pill tone={prio as any}>{t.priority}</Pill>
                <Pill tone={stat as any}>{t.status}</Pill>
              </li>
            );
          })}
        </ul>
      </section>

      {/* SECTION 11 — QUICK ACTIONS */}
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
