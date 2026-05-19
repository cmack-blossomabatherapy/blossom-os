import {
  ArrowUpRight, ArrowDownRight, Sparkles, AlertTriangle, CalendarDays, ChevronRight,
  Users, Heart, FileCheck2, GraduationCap, Activity, Clock, BadgeCheck, Brain,
  Lightbulb, AlertCircle, CheckCircle2, Radio, Flame, UserPlus, ClipboardCheck,
  BookOpen, Inbox, ArrowRight, Phone, MessageSquare, Mail, Send, FileText,
  ShieldCheck, Smile, Pause, RefreshCw, Upload, StickyNote, Headphones, Hourglass,
  CalendarClock, FileWarning, FileSignature, Building2, Stamp, ShieldAlert, TrendingUp,
  CalendarCheck2, CalendarX2, MapPin, Route, UserCheck, UserX, Zap, Timer, Battery,
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
  { label: "Sessions Scheduled Today",value: "187", delta: "+12",  up: true,  status: "ok",   hint: "Across 3 states",     spark: [150,160,168,172,175,180,184,186,187], icon: CalendarCheck2 },
  { label: "Open Sessions",           value: "14",  delta: "+4",   up: false, status: "warn", hint: "8 within 24h",        spark: [6,7,9,10,11,12,13,14,14],   icon: Inbox },
  { label: "Staffing Needed",         value: "9",   delta: "+2",   up: false, status: "crit", hint: "3 urgent · evening",  spark: [4,5,6,6,7,7,8,9,9],         icon: UserPlus },
  { label: "Coverage Fill Rate",      value: "92%", delta: "+9%",  up: true,  status: "ok",   hint: "Target ≥ 92%",        spark: [78,82,84,86,88,89,90,91,92],icon: TrendingUp },
  { label: "Cancellation Rate",       value: "6%",  delta: "+1%",  up: false, status: "warn", hint: "7d rolling",          spark: [4,4,5,5,5,6,6,6,6],         icon: CalendarX2 },
  { label: "RBT Utilization",         value: "84%", delta: "+3%",  up: true,  status: "ok",   hint: "Healthy band 80–88%", spark: [76,78,80,81,82,83,83,84,84],icon: Battery },
  { label: "BCBA Utilization",        value: "71%", delta: "-2%",  up: false, status: "warn", hint: "Target ≥ 75%",        spark: [78,77,76,75,74,73,72,72,71],icon: UserCheck },
  { label: "Avg Time to Fill",        value: "38m", delta: "-12m", up: true,  status: "ok",   hint: "Target ≤ 45m",        spark: [60,56,52,48,46,44,42,40,38], icon: Timer },
  { label: "Scheduling Conflicts",    value: "5",   delta: "-3",   up: true,  status: "warn", hint: "2 same-time overlaps",spark: [9,8,8,7,7,6,6,5,5],         icon: AlertTriangle },
  { label: "Pending Pair-Ups",        value: "11",  delta: "+2",   up: false, status: "warn", hint: "BCBA assignment",     spark: [5,6,7,8,9,10,10,11,11],     icon: Users },
  { label: "Attendance Rate",         value: "94%", delta: "+1%",  up: true,  status: "ok",   hint: "Client side",         spark: [89,90,91,92,92,93,93,94,94],icon: CheckCircle2 },
  { label: "Sessions at Risk",        value: "6",   delta: "+2",   up: false, status: "crit", hint: "Likely to cancel",    spark: [2,3,3,4,4,5,5,6,6],         icon: ShieldAlert },
];

const stages = [
  { name: "Charlotte, NC",     count: 62, stalled: 4, avg: "94%", tone: "os-tone-sky" },
  { name: "Raleigh, NC",       count: 41, stalled: 2, avg: "91%", tone: "os-tone-violet" },
  { name: "Wilmington, NC",    count: 18, stalled: 1, avg: "88%", tone: "os-tone-mint" },
  { name: "Atlanta, GA",       count: 34, stalled: 5, avg: "82%", tone: "os-tone-amber" },
  { name: "Savannah, GA",      count: 14, stalled: 3, avg: "76%", tone: "os-tone-coral" },
  { name: "Richmond, VA",      count: 12, stalled: 1, avg: "90%", tone: "os-tone-lilac" },
  { name: "Virginia Beach, VA",count: 8,  stalled: 2, avg: "84%", tone: "os-tone-rose" },
  { name: "Remote / Telehealth",count: 6, stalled: 0, avg: "97%", tone: "os-tone-mint" },
];

const leads = [
  { parent: "Ava Walker",   child: "4:00 – 6:00 PM",  insurance: "Charlotte · Home", owner: "BCBA: Patel",  stage: "RBT needed · 2h",     since: "Unfilled 35m", urgency: "crit" as Tone },
  { parent: "Liam Pierce",  child: "10:00 – 12:00",   insurance: "Atlanta · Clinic", owner: "BCBA: Nguyen", stage: "Pair-Up pending",     since: "Unfilled 1h",  urgency: "warn" as Tone },
  { parent: "Reya Sharma",  child: "1:00 – 3:00 PM",  insurance: "Raleigh · Home",   owner: "BCBA: Patel",  stage: "Sub coverage",        since: "Filled · Dana",urgency: "ok"   as Tone },
  { parent: "Mason Hayes",  child: "5:00 – 7:00 PM",  insurance: "Savannah · Home",  owner: "BCBA: Cole",   stage: "Evening · uncovered", since: "Unfilled 2h",  urgency: "crit" as Tone },
  { parent: "Sofia Ortiz",  child: "9:00 – 11:00 AM", insurance: "Charlotte · Home", owner: "BCBA: Nguyen", stage: "Cancellation risk",   since: "Parent flag",  urgency: "warn" as Tone },
  { parent: "Noah Davis",   child: "3:00 – 5:00 PM",  insurance: "Richmond · Clinic",owner: "BCBA: Cole",   stage: "Confirmed",           since: "Assigned",     urgency: "ok"   as Tone },
];

const followups = [
  { kind: "Assign",   parent: "Ava Walker · Charlotte",    time: "Cover by 4 PM", stage: "RBT needed · 2h",    priority: "High",   last: "Texted 3 RBTs · 10m" },
  { kind: "PairUp",   parent: "Liam Pierce · Atlanta",     time: "10:15 AM",      stage: "Pair-Up pending",    priority: "High",   last: "BCBA Nguyen pinged · 1h" },
  { kind: "Message",  parent: "Reya Sharma · Raleigh",     time: "11:00 AM",      stage: "Confirm with parent",priority: "Medium", last: "SMS sent · 30m" },
  { kind: "Assign",   parent: "Mason Hayes · Savannah",    time: "Cover by 5 PM", stage: "Evening uncovered",  priority: "High",   last: "Escalated to Dana" },
  { kind: "PairUp",   parent: "Sofia Ortiz · Charlotte",   time: "2:30 PM",       stage: "Sub RBT needed",     priority: "Medium", last: "RBT confirmed · 5m" },
  { kind: "Message",  parent: "Noah Davis · Richmond",     time: "3:45 PM",       stage: "Schedule change",    priority: "Medium", last: "Note · 1d" },
];

const forms = [
  { name: "Dana M. · RBT · Charlotte",   status: "Available · 22h/wk",  pct: 78,  days: 0, tone: "ok"   as Tone },
  { name: "Jordan K. · RBT · Atlanta",   status: "Near max · 36h/wk",   pct: 94,  days: 0, tone: "crit" as Tone },
  { name: "Maya R. · RBT · Raleigh",     status: "Underutilized · 12h", pct: 38,  days: 0, tone: "warn" as Tone },
  { name: "Dr. Patel · BCBA · NC",       status: "Pair-ups available",  pct: 72,  days: 0, tone: "ok"   as Tone },
  { name: "Dr. Cole · BCBA · GA",        status: "Limited after 5 PM",  pct: 88,  days: 0, tone: "warn" as Tone },
];

const comms = [
  { who: "Parent · Ortiz",   what: "cancelled tomorrow's session",       when: "12m", tone: "os-tone-coral",  icon: CalendarX2 },
  { who: "Parent · Hayes",   what: "cancelled 3 sessions this week",     when: "35m", tone: "os-tone-coral",  icon: AlertTriangle },
  { who: "Riverdale clinic", what: "attendance declining",               when: "1h",  tone: "os-tone-amber",  icon: TrendingUp },
  { who: "Client · Walker",  what: "no-show · session 2pm",              when: "2h",  tone: "os-tone-rose",   icon: UserX },
  { who: "Client · Pierce",  what: "confirmed for tomorrow",             when: "3h",  tone: "os-tone-mint",   icon: CheckCircle2 },
  { who: "Parent · Davis",   what: "requested schedule change",          when: "4h",  tone: "os-tone-violet", icon: RefreshCw },
];

const bottlenecks = [
  { severity: "crit", title: "Ava Walker — RBT needed within 2 hours",          stage: "Charlotte · 4 PM",  owner: "Daylis",   action: "Assign Dana M." },
  { severity: "crit", title: "Mason Hayes — evening session uncovered",         stage: "Savannah · 5 PM",   owner: "Daylis",   action: "Escalate to GA lead" },
  { severity: "warn", title: "Liam Pierce — pair-up pending with BCBA",         stage: "Atlanta · 10 AM",   owner: "Dr. Nguyen", action: "Confirm pair-up" },
  { severity: "warn", title: "GA evening coverage at risk",                     stage: "Atlanta/Savannah",  owner: "Daylis",   action: "Open availability" },
  { severity: "warn", title: "Jordan K. nearing burnout · 36h scheduled",       stage: "Atlanta · RBT",     owner: "Daylis",   action: "Redistribute hours" },
  { severity: "warn", title: "Sofia Ortiz — cancellation risk flagged by AI",   stage: "Charlotte · 9 AM",  owner: "Daylis",   action: "Call parent" },
];

const training = [
  { name: "New Pair-Up SOP · v2",          pct: 100, kind: "SOP",      tone: "os-tone-mint"   },
  { name: "Scheduling Escalation Workflow",pct: 60,  kind: "Training", tone: "os-tone-amber"  },
  { name: "Tango Walkthrough · Coverage",  pct: 35,  kind: "Walkthru", tone: "os-tone-violet" },
  { name: "Cancellation Policy Updates",   pct: 80,  kind: "SOP",      tone: "os-tone-sky"    },
];

const aiInsights = [
  { icon: AlertCircle,  tone: "os-tone-coral", title: "GA evening coverage critical",  body: "Atlanta + Savannah evening fill rate trending toward 68% by Friday.",        cta: "View gaps" },
  { icon: AlertTriangle,tone: "os-tone-amber", title: "Tuesday cancellations spiking",  body: "Client cancellations on Tuesdays up 22% over 3 weeks — proactive calls may help.", cta: "Open trend" },
  { icon: Brain,        tone: "os-tone-sky",   title: "2 RBTs at burnout risk",         body: "Jordan K. and Mia S. logged > 35h scheduled this week — redistribute load.", cta: "Rebalance" },
  { icon: Lightbulb,    tone: "os-tone-lilac", title: "Route optimization · 3h saved",  body: "Re-pairing Charlotte routes could save ~3 hours of drive time this week.",   cta: "Apply tip" },
  { icon: Activity,     tone: "os-tone-mint",  title: "Pairing efficiency below target",body: "BCBA-RBT pairings averaging 71% match score — target is 80%.",               cta: "View pairs" },
];

const calls = [
  { title: "Coverage huddle · NC team",     time: "9:00 – 9:15 AM",  tone: "os-tone-sky" },
  { title: "Pair-up review · Dr. Patel",    time: "10:30 – 10:45",   tone: "os-tone-violet" },
  { title: "GA evening planning",           time: "1:00 – 1:30 PM",  tone: "os-tone-rose" },
  { title: "Parent call · Hayes (cxl)",     time: "3:45 – 4:00 PM",  tone: "os-tone-amber" },
];

const quickActions = [
  { label: "Assign RBT",            icon: UserPlus,       tone: "os-tone-rose"   },
  { label: "Coverage Request",      icon: CalendarClock,  tone: "os-tone-sky"    },
  { label: "Pair-Up Therapist",     icon: Users,          tone: "os-tone-violet" },
  { label: "Message Staff",         icon: MessageSquare,  tone: "os-tone-lilac"  },
  { label: "Open Availability",     icon: CalendarCheck2, tone: "os-tone-mint"   },
  { label: "View Reports",          icon: Activity,       tone: "os-tone-amber"  },
  { label: "Escalate Issue",        icon: Flame,          tone: "os-tone-coral"  },
  { label: "Open SOP",              icon: BookOpen,       tone: "os-tone-violet" },
];

const activity = [
  { who: "Daylis",        what: "assigned Dana M. to Walker · 4 PM",  when: "4m",  tone: "os-tone-violet", icon: UserCheck },
  { who: "System",        what: "pair-up completed · Pierce / Nguyen",when: "18m", tone: "os-tone-mint",   icon: Users },
  { who: "Parent · Ortiz",what: "logged cancellation for tomorrow",   when: "32m", tone: "os-tone-coral",  icon: CalendarX2 },
  { who: "System",        what: "coverage request created · Hayes",   when: "55m", tone: "os-tone-amber",  icon: CalendarClock },
  { who: "Dana M.",       what: "accepted Charlotte coverage shift",  when: "1h",  tone: "os-tone-sky",    icon: CheckCircle2 },
  { who: "Maya R.",       what: "added evening availability",         when: "2h",  tone: "os-tone-lilac",  icon: CalendarCheck2 },
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
          <linearGradient id={`intk-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.32} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.75} fill={`url(#intk-${tone})`} dot={false} />
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

const kindIcon: Record<string, React.ElementType> = { Assign: UserPlus, PairUp: Users, Message: MessageSquare };
const kindTone: Record<string, string> = { Assign: "os-tone-sky", PairUp: "os-tone-violet", Message: "os-tone-lilac" };

/* ============ PAGE ============ */

export default function OSSchedulingTeam() {
  const { user } = useAuth();
  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Daylis").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const score = 88;

  return (
    <OSShell
      rightRail={
        <>
          {/* AI INTAKE INSIGHTS */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.28)] to-transparent blur-2xl" />
            <header className="mb-3 flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                <Brain className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold tracking-tight">AI Scheduling Insights</h3>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Predictive · Supportive</p>
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

          {/* INTAKE SCORE */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(155_70%_70%/0.25)] to-transparent blur-2xl" />
            <header className="mb-2">
              <h3 className="text-[14px] font-semibold tracking-tight">Your Scheduling Score</h3>
              <p className="text-[10.5px] text-muted-foreground">Fill Rate · Utilization · Speed</p>
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
                    <p className="mt-1 text-[9.5px] uppercase tracking-wider text-muted-foreground">Strong</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="rounded-lg bg-[hsl(150_70%_94%)] py-1.5 font-semibold text-[hsl(155_55%_32%)]">Fill 92</div>
              <div className="rounded-lg bg-[hsl(40_100%_94%)] py-1.5 font-semibold text-[hsl(30_80%_42%)]">Util 84</div>
              <div className="rounded-lg bg-[hsl(265_100%_95%)] py-1.5 font-semibold text-[hsl(265_70%_50%)]">Speed 88</div>
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
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium leading-tight">{m.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{m.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* TRAINING & SOP */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
                <h3 className="text-[14px] font-semibold tracking-tight">Training & SOPs</h3>
              </div>
              <Pill tone="med">4</Pill>
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
                <h3 className="text-[14px] font-semibold tracking-tight">Recent Activity</h3>
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
              <CalendarCheck2 className="h-3 w-3 text-[hsl(265_70%_55%)]" /> Scheduling Team · Mission Control
            </div>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[34px]">
              {greet}, <span className="capitalize">{name}</span> <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {today} · Here's what's happening across Scheduling today.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(265_100%_95%)] px-2.5 py-1 font-semibold text-[hsl(265_70%_50%)]">
                <Inbox className="h-3 w-3" /> 14 open sessions
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(355_100%_94%)] px-2.5 py-1 font-semibold text-[hsl(355_70%_48%)]">
                <UserPlus className="h-3 w-3" /> 9 staffing needed
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(40_100%_92%)] px-2.5 py-1 font-semibold text-[hsl(30_80%_42%)]">
                <CalendarX2 className="h-3 w-3" /> 3 cancellations today
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(150_70%_92%)] px-2.5 py-1 font-semibold text-[hsl(155_55%_32%)]">
                <TrendingUp className="h-3 w-3" /> 92% fill rate
              </span>
            </div>
          </div>

          {/* AI Intake Briefing */}
          <div className="relative w-full max-w-md shrink-0 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_14px_36px_-20px_hsl(265_60%_50%/0.35)] backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-none tracking-tight">Scheduling AI Briefing</p>
                <p className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Updated 2 min ago</p>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/85">
              <span className="font-semibold text-[hsl(355_70%_52%)]">8 sessions</span> still require staffing today.
              Utilization is improving in NC, but <span className="font-semibold">GA evening coverage</span> is at risk.
            </p>
            <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.55)] transition hover:opacity-95">
              Open Scheduling Insights <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* KPI GRID */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h2 className="text-[15px] font-semibold tracking-tight">Daily Scheduling KPIs</h2>
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

      {/* LEAD PIPELINE */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Coverage by Region</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Sessions today · stalled coverage · fill rate per location</p>
          </div>
          <button className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">Open coverage map</button>
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

        {/* recent lead cards */}
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {leads.map((l) => (
            <button key={l.parent} className="group flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_hsl(265_60%_50%/0.28)]">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_70%/0.18)] to-[hsl(210_85%_75%/0.18)] text-[hsl(265_70%_45%)] font-semibold">
                {l.parent.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-semibold leading-tight">{l.parent}</p>
                  <Dot tone={l.urgency} />
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{l.child} · {l.insurance}</p>
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

      {/* FOLLOW-UPS & TASKS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Tasks & Coordination</h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {["All", "Urgent Coverage", "Pair-Ups", "Follow-Ups", "Escalations", "Schedule Changes", "Waiting"].map((t, i) => (
              <button key={t} className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-semibold",
                i === 0 ? "bg-foreground text-background" : "bg-foreground/[0.05] text-foreground/70 hover:bg-foreground/[0.08]"
              )}>{t}</button>
            ))}
          </div>
        </header>
        <ul className="divide-y divide-foreground/[0.06]">
          {followups.map((f) => {
            const Icon = kindIcon[f.kind] ?? Phone;
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
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Call"><Phone className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Text"><MessageSquare className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Snooze"><Pause className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Reassign"><RefreshCw className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(150_70%_92%)] text-[hsl(155_55%_35%)] hover:bg-[hsl(150_70%_88%)]" title="Complete"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* FORMS & VOB + COMMS */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="os-card lg:col-span-2">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">RBT / BCBA Availability</h3>
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
              <CalendarX2 className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Cancellations & Attendance</h3>
            </div>
            <Pill tone="ok">94% attendance</Pill>
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
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><Phone className="mr-1 inline h-3 w-3" />Call</button>
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><MessageSquare className="mr-1 inline h-3 w-3" />Text</button>
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><CalendarClock className="mr-1 inline h-3 w-3" />Reschedule</button>
          </div>
        </section>
      </div>

      {/* INTAKE BOTTLENECKS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-[hsl(355_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Urgent Coverage & Open Sessions</h3>
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