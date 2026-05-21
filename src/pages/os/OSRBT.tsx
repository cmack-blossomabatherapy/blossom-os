import {
  Sparkles, ChevronRight, Clock, CalendarDays, MapPin, MessageSquare,
  CheckCircle2, AlertTriangle, GraduationCap, BookOpen, Radio,
  Heart, Smile, NotebookPen, Stethoscope, FileText, Phone, HelpCircle,
  Coffee, Sun, Award, Flame, TrendingUp, Bell, Baby, Activity, Trophy,
  PlayCircle, BellRing, Brain, Lightbulb, ArrowRight, PhoneCall, LifeBuoy,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, RadialBarChart, RadialBar,
} from "recharts";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type Tone = "ok" | "warn" | "crit";

// ---------- DATA ----------
const schedule = [
  { time: "9:00 – 11:00 AM",  client: "Liam Carter",    type: "1:1 Therapy",      loc: "Home · Buckhead",      bcba: "Jennifer P.", status: "upcoming" as const, in: "in 45 min", tone: "os-tone-sky" },
  { time: "11:30 – 12:30 PM", client: "Travel · 30m",   type: "Travel Gap",       loc: "→ Sandy Springs",       bcba: "—",            status: "gap" as const,      in: "drive time", tone: "os-tone-mint" },
  { time: "12:30 – 2:30 PM",  client: "Aria Johnson",   type: "1:1 Therapy",      loc: "Clinic · Sandy Springs",bcba: "Marcus L.",   status: "upcoming" as const, in: "later",      tone: "os-tone-violet" },
  { time: "2:30 – 3:00 PM",   client: "Lunch & Notes",  type: "Break",            loc: "—",                     bcba: "—",            status: "break" as const,    in: "30 min",     tone: "os-tone-amber" },
  { time: "3:00 – 5:00 PM",   client: "Mia Reynolds",   type: "1:1 + Supervision",loc: "Home · Decatur",        bcba: "Jennifer P.", status: "supervision" as const, in: "overlap", tone: "os-tone-lilac" },
  { time: "5:15 – 6:15 PM",   client: "Noah Brooks",    type: "1:1 Therapy",      loc: "Clinic · Sandy Springs",bcba: "Marcus L.",   status: "upcoming" as const, in: "last one",   tone: "os-tone-rose" },
];

const clients = [
  { name: "Liam Carter",    age: "6 yrs",  focus: "Communication · Requesting",   notes: "Loves trains 🚂 · use as reinforcement",   next: "Today 9 AM",  flag: "Focus on mands today" },
  { name: "Aria Johnson",   age: "4 yrs",  focus: "Tolerance · Transitions",      notes: "Parent requested post-session update",     next: "Today 12:30 PM", flag: "Parent update after" },
  { name: "Mia Reynolds",   age: "5 yrs",  focus: "Play skills · Peer engagement",notes: "Working on turn-taking · use favorite toys",next: "Today 3 PM",  flag: "Supervision overlap" },
  { name: "Noah Brooks",    age: "8 yrs",  focus: "Behavior reduction",           notes: "Use visual schedule · neutral tone",        next: "Today 5:15 PM", flag: "Stay consistent" },
];

const tasks = [
  { kind: "Note",   title: "Session note · Liam Carter (yesterday)", due: "Today",      priority: "High",   tone: "os-tone-violet", icon: NotebookPen },
  { kind: "Parent", title: "Parent follow-up · Aria Johnson",         due: "Today",      priority: "Medium", tone: "os-tone-mint",   icon: Phone },
  { kind: "Train",  title: "Parent Communication training",            due: "Tomorrow",   priority: "Medium", tone: "os-tone-sky",    icon: GraduationCap },
  { kind: "Doc",    title: "Upload signed consent · Mia Reynolds",     due: "This week",  priority: "Low",    tone: "os-tone-amber",  icon: FileText },
  { kind: "Sup",    title: "Confirm Friday supervision · Jennifer P.", due: "Wed",        priority: "Medium", tone: "os-tone-lilac",  icon: Stethoscope },
];

const trainings = [
  { name: "Parent Communication 101",  kind: "Required · due tomorrow", pct: 72, tone: "os-tone-amber"  },
  { name: "Mand Training Refresher",   kind: "Recommended",             pct: 45, tone: "os-tone-violet" },
  { name: "Crisis De-escalation",      kind: "Annual · 30d left",       pct: 100, tone: "os-tone-mint"  },
  { name: "Visual Supports SOP",       kind: "New SOP",                 pct: 20, tone: "os-tone-sky"    },
];

const badges = [
  { label: "5-day streak",    icon: Flame,  tone: "os-tone-coral"  },
  { label: "Notes on-time",   icon: CheckCircle2, tone: "os-tone-mint" },
  { label: "Perfect attend.", icon: Award,  tone: "os-tone-violet" },
  { label: "Top learner",     icon: Trophy, tone: "os-tone-amber"  },
];

const performance = [
  { label: "Session Completion", value: "96%", hint: "Team avg 91%",  spark: [88,89,90,91,93,94,95,96,96], tone: "ok"   as Tone, icon: CheckCircle2 },
  { label: "On-time Arrival",    value: "98%", hint: "Excellent",     spark: [92,93,94,95,96,97,98,98,98], tone: "ok"   as Tone, icon: Clock },
  { label: "Notes Submitted",    value: "92%", hint: "Within 24h",    spark: [78,80,82,85,87,89,90,91,92], tone: "ok"   as Tone, icon: NotebookPen },
  { label: "Supervision Hours",  value: "4.5h",hint: "of 5h goal",    spark: [1,2,2.5,3,3.5,4,4,4.25,4.5], tone: "warn" as Tone, icon: Stethoscope },
];

const messages = [
  { who: "Jennifer P. · BCBA",   what: "Great session notes on Liam — let's review at supervision.", when: "12m", tone: "os-tone-violet", icon: MessageSquare, unread: true },
  { who: "Scheduling",           what: "Tomorrow's 1 PM session moved to 1:30 PM.",                    when: "1h",  tone: "os-tone-amber",  icon: CalendarDays,  unread: true },
  { who: "Aria's parent",        what: "Quick update request after today's session — thank you!",     when: "2h",  tone: "os-tone-mint",   icon: Baby,          unread: false },
  { who: "HR · Announcements",   what: "August team huddle Friday 4 PM — virtual.",                    when: "1d",  tone: "os-tone-sky",    icon: BellRing,      unread: false },
];

const aiInsights = [
  { icon: Smile,       tone: "os-tone-mint",   title: "You're having a great week",       body: "Session completion is above team average. Keep it up!",                       cta: "See trends" },
  { icon: Lightbulb,   tone: "os-tone-sky",    title: "Lighter afternoon today",          body: "Only 1 session after 3 PM — great time to finish notes from yesterday.",     cta: "Open notes" },
  { icon: Bell,        tone: "os-tone-amber",  title: "Training due tomorrow",            body: "Parent Communication 101 — 28 min left to complete.",                         cta: "Continue" },
  { icon: Baby,        tone: "os-tone-violet", title: "Parent update requested",          body: "Aria's parent asked for a quick recap after today's session.",                cta: "Send update" },
];

const activity = [
  { who: "You",            what: "completed session · Liam Carter",          when: "yesterday", tone: "os-tone-mint",   icon: CheckCircle2 },
  { who: "Jennifer P.",    what: "left feedback on your last note",          when: "yesterday", tone: "os-tone-violet", icon: MessageSquare },
  { who: "You",            what: "submitted Crisis De-escalation training",  when: "2d",        tone: "os-tone-sky",    icon: GraduationCap },
  { who: "Scheduling",     what: "added Wed 4 PM supervision overlap",       when: "2d",        tone: "os-tone-amber",  icon: CalendarDays },
  { who: "You",            what: "uploaded consent form · Mia Reynolds",     when: "3d",        tone: "os-tone-rose",   icon: FileText },
];

const quickActions = [
  { label: "Open Session",   icon: PlayCircle,    tone: "os-tone-violet" },
  { label: "Add Note",       icon: NotebookPen,   tone: "os-tone-sky"    },
  { label: "View Schedule",  icon: CalendarDays,  tone: "os-tone-amber"  },
  { label: "Request Help",   icon: LifeBuoy,      tone: "os-tone-rose"   },
  { label: "Open Training",  icon: GraduationCap, tone: "os-tone-mint"   },
  { label: "Call Parent",    icon: PhoneCall,     tone: "os-tone-coral"  },
  { label: "Open SOP",       icon: BookOpen,      tone: "os-tone-violet" },
];

// ---------- HELPERS ----------
const toneText = (t: Tone) => t === "ok" ? "text-[hsl(155_55%_38%)]" : t === "warn" ? "text-[hsl(30_85%_45%)]" : "text-[hsl(355_72%_52%)]";
const toneBg   = (t: Tone) => t === "ok" ? "bg-[hsl(150_70%_92%)]" : t === "warn" ? "bg-[hsl(40_100%_92%)]" : "bg-[hsl(355_100%_95%)]";
const toneStrokeHsl = (t: Tone) => t === "ok" ? "hsl(155 55% 45%)" : t === "warn" ? "hsl(35 90% 55%)" : "hsl(355 75% 58%)";

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

function Spark({ data, tone }: { data: number[]; tone: Tone }) {
  const stroke = toneStrokeHsl(tone);
  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={data.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`rbt-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.32} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.75} fill={`url(#rbt-${tone})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ---------- PAGE ----------
export default function OSRBT() {
  const { user } = useAuth();
  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Sarah").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const wellnessScore = 92;

  return (
    <OSShell
      rightRail={
        <>
          {/* AI Support Insights */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.28)] to-transparent blur-2xl" />
            <header className="mb-3 flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                <Brain className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold tracking-tight">AI Support</h3>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Gentle · Helpful</p>
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

          {/* Wellness Score */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(155_70%_70%/0.25)] to-transparent blur-2xl" />
            <header className="mb-2">
              <h3 className="text-[14px] font-semibold tracking-tight">Wellness & Balance</h3>
              <p className="text-[10.5px] text-muted-foreground">Schedule · Breaks · Energy</p>
            </header>
            <div className="relative grid place-items-center py-2">
              <div className="relative h-[140px] w-[140px]">
                <ResponsiveContainer>
                  <RadialBarChart innerRadius="75%" outerRadius="100%" data={[{ v: wellnessScore }]} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="v" cornerRadius={10} fill="hsl(265 85% 62%)" background={{ fill: "hsl(240 10% 94%)" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-[28px] font-semibold leading-none tracking-tight">{wellnessScore}</p>
                    <p className="mt-1 text-[9.5px] uppercase tracking-wider text-muted-foreground">Balanced</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="rounded-lg bg-[hsl(150_70%_94%)] py-1.5 font-semibold text-[hsl(155_55%_32%)]">6.5h today</div>
              <div className="rounded-lg bg-[hsl(40_100%_94%)] py-1.5 font-semibold text-[hsl(30_80%_42%)]">2 breaks</div>
              <div className="rounded-lg bg-[hsl(265_100%_95%)] py-1.5 font-semibold text-[hsl(265_70%_50%)]">PTO in 12d</div>
            </div>
            <p className="mt-3 rounded-xl bg-[hsl(150_70%_96%)] px-3 py-2 text-[11px] leading-snug text-[hsl(155_55%_30%)]">
              <Smile className="mr-1 inline h-3 w-3" />
              Great work completing all session notes yesterday — keep it up!
            </p>
          </section>

          {/* Recent Activity */}
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
                    <p className="mt-0.5 text-[10.5px] text-muted-foreground">{a.when}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      }
    >
      {/* HERO */}
      <header className="os-rise relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-white via-[hsl(265_100%_99%)] to-[hsl(195_100%_98%)] p-6 shadow-[0_24px_60px_-30px_hsl(265_60%_50%/0.25)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.32)] to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-24 h-56 w-56 rounded-full bg-gradient-to-br from-[hsl(195_85%_75%/0.3)] to-transparent blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-muted-foreground backdrop-blur">
              <Sun className="h-3 w-3 text-[hsl(35_90%_55%)]" /> RBT · Daily Mission Control
            </div>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[34px]">
              {greet}, <span className="capitalize">{name}</span> <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {today} · Here's your schedule and priorities for today.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(265_100%_95%)] px-2.5 py-1 font-semibold text-[hsl(265_70%_50%)]">
                <CalendarDays className="h-3 w-3" /> 4 sessions today
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(195_100%_94%)] px-2.5 py-1 font-semibold text-[hsl(200_75%_40%)]">
                <Clock className="h-3 w-3" /> 6.5 scheduled hours
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(40_100%_92%)] px-2.5 py-1 font-semibold text-[hsl(30_80%_42%)]">
                <Stethoscope className="h-3 w-3" /> 1 supervision overlap
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(355_100%_94%)] px-2.5 py-1 font-semibold text-[hsl(355_70%_48%)]">
                <GraduationCap className="h-3 w-3" /> 1 training due tomorrow
              </span>
            </div>
          </div>

          <div className="relative w-full max-w-md shrink-0 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_14px_36px_-20px_hsl(265_60%_50%/0.35)] backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-none tracking-tight">Your Daily Briefing</p>
                <p className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Updated just now</p>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/85">
              You have <span className="font-semibold">4 sessions</span> today and one
              <span className="font-semibold text-[hsl(265_70%_55%)]"> supervision overlap </span>
              this afternoon. Don't forget your
              <span className="font-semibold text-[hsl(30_80%_45%)]"> training due tomorrow</span>.
            </p>
            <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.55)] transition hover:opacity-95">
              Open My Day <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* QUICK ACTIONS */}
      <section>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
          {quickActions.map((q) => (
            <button key={q.label} className="group flex flex-col items-center gap-1.5 rounded-2xl border border-white/70 bg-white/70 p-3 text-center transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_hsl(265_60%_50%/0.3)]">
              <div className={cn("grid h-10 w-10 place-items-center rounded-xl transition group-hover:scale-105", q.tone)}>
                <q.icon className="h-4.5 w-4.5" />
              </div>
              <span className="text-[11px] font-semibold leading-tight">{q.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* DAILY SCHEDULE — the hero of this page */}
      <section className="os-card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.18)] to-transparent blur-3xl" />
        <header className="relative mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[16px] font-semibold tracking-tight">Today's Schedule</h2>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">{today} · Next session in 45 minutes</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">Today</button>
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">Tomorrow</button>
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">This week</button>
          </div>
        </header>

        <div className="relative">
          <div className="absolute left-[18px] top-1 bottom-1 w-px bg-gradient-to-b from-[hsl(265_85%_75%/0.5)] via-[hsl(265_85%_75%/0.25)] to-transparent" />
          <ul className="space-y-2.5">
            {schedule.map((s, idx) => {
              const isBreak = s.status === "break" || s.status === "gap";
              return (
                <li key={idx} className={cn(
                  "relative flex items-start gap-3 rounded-2xl border p-3.5 transition hover:-translate-y-0.5",
                  isBreak
                    ? "border-dashed border-[hsl(265_40%_80%)] bg-[hsl(265_100%_99%)]"
                    : "border-white/70 bg-white/80 hover:shadow-[0_22px_44px_-22px_hsl(265_60%_50%/0.28)]",
                )}>
                  <div className={cn("relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-4 ring-white", s.tone)}>
                    {isBreak ? <Coffee className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-semibold leading-tight">{s.client}</p>
                      {s.status === "supervision" && <Pill tone="med">Supervision overlap</Pill>}
                      {s.status === "break" && <Pill tone="default">Break</Pill>}
                      {s.status === "gap" && <Pill tone="default">Travel gap</Pill>}
                      {s.status === "upcoming" && idx === 0 && <Pill tone="ok">Starts in 45 min</Pill>}
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">{s.type}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {s.time}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.loc}</span>
                      {s.bcba !== "—" && <span className="inline-flex items-center gap-1"><Stethoscope className="h-3 w-3" /> {s.bcba}</span>}
                    </div>
                  </div>
                  {!isBreak && (
                    <div className="ml-1 hidden items-center gap-1 sm:flex">
                      <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Navigate"><MapPin className="h-3.5 w-3.5" /></button>
                      <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Add note"><NotebookPen className="h-3.5 w-3.5" /></button>
                      <button className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(265_100%_95%)] text-[hsl(265_70%_50%)] hover:bg-[hsl(265_100%_92%)]" title="Open session"><PlayCircle className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* CLIENT CARDS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Today's Clients</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Quick reminders and what to focus on</p>
          </div>
          <Pill tone="default">{clients.length} sessions</Pill>
        </header>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {clients.map((c) => (
            <button key={c.name} className="group flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_hsl(265_60%_50%/0.28)]">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(265_85%_70%/0.18)] to-[hsl(195_85%_75%/0.18)] text-[hsl(265_70%_45%)] font-semibold">
                {c.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-semibold leading-tight">{c.name}</p>
                  <span className="text-[10.5px] text-muted-foreground">{c.age}</span>
                </div>
                <p className="mt-0.5 text-[11.5px] font-medium text-[hsl(265_70%_50%)]">{c.focus}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{c.notes}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Pill tone="ok">{c.next}</Pill>
                  <Pill tone="med">{c.flag}</Pill>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 self-center text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </button>
          ))}
        </div>
      </section>

      {/* SUPERVISION + TASKS row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* SUPERVISION */}
        <section className="os-card relative overflow-hidden lg:col-span-1">
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.22)] to-transparent blur-2xl" />
          <header className="mb-3 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Supervision & BCBA</h3>
          </header>

          <div className="relative grid place-items-center py-1">
            <div className="relative h-[120px] w-[120px]">
              <ResponsiveContainer>
                <RadialBarChart innerRadius="76%" outerRadius="100%" data={[{ v: 75 }]} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="v" cornerRadius={10} fill="hsl(265 85% 62%)" background={{ fill: "hsl(240 10% 94%)" }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-[22px] font-semibold leading-none tracking-tight">3.0 / 4h</p>
                  <p className="mt-1 text-[9.5px] uppercase tracking-wider text-muted-foreground">This month</p>
                </div>
              </div>
            </div>
          </div>

          <ul className="mt-3 space-y-2.5">
            <li className="flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/70 p-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl os-tone-violet"><CalendarDays className="h-3.5 w-3.5" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold leading-tight">Supervision · Jennifer P.</p>
                <p className="text-[10.5px] text-muted-foreground">Friday 3:00 PM · Mia's home</p>
              </div>
              <Pill tone="med">Confirm</Pill>
            </li>
            <li className="flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/70 p-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl os-tone-mint"><MessageSquare className="h-3.5 w-3.5" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold leading-tight">Feedback ready · Marcus L.</p>
                <p className="text-[10.5px] text-muted-foreground">Last week's overlap notes</p>
              </div>
              <Pill tone="ok">View</Pill>
            </li>
            <li className="flex items-center gap-2.5 rounded-xl border border-white/70 bg-white/70 p-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl os-tone-sky"><Stethoscope className="h-3.5 w-3.5" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold leading-tight">Today's overlap · 3 PM</p>
                <p className="text-[10.5px] text-muted-foreground">Jennifer joins Mia's session</p>
              </div>
              <Pill tone="ok">Ready</Pill>
            </li>
          </ul>
        </section>

        {/* TASKS */}
        <section className="os-card lg:col-span-2">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Tasks & Reminders</h3>
              <Pill tone="default">{tasks.length}</Pill>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {["All", "Notes", "Parent", "Training", "Documentation", "Supervision"].map((t, i) => (
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
              return (
                <li key={t.title} className="group flex items-center gap-3 py-3">
                  <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", t.tone)}>
                    <t.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold leading-tight">{t.title}</p>
                    <p className="mt-0.5 text-[10.5px] text-muted-foreground">Due {t.due}</p>
                  </div>
                  <Pill tone={prio as any}>{t.priority}</Pill>
                  <div className="ml-1 hidden items-center gap-1 md:flex">
                    <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Snooze"><Clock className="h-3.5 w-3.5" /></button>
                    <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Request help"><HelpCircle className="h-3.5 w-3.5" /></button>
                    <button className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(150_70%_92%)] text-[hsl(155_55%_35%)] hover:bg-[hsl(150_70%_88%)]" title="Complete"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* TRAINING + PERFORMANCE */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* TRAINING & GROWTH */}
        <section className="os-card relative overflow-hidden">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(195_85%_75%/0.28)] to-transparent blur-3xl" />
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Training & Growth</h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[hsl(30_80%_45%)]">
              <Flame className="h-3.5 w-3.5" /> 3 trainings this week
            </span>
          </header>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <span key={b.label} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-semibold", b.tone)}>
                <b.icon className="h-3 w-3" /> {b.label}
              </span>
            ))}
          </div>

          <ul className="space-y-2.5">
            {trainings.map((t) => (
              <li key={t.name} className="rounded-xl border border-white/70 bg-white/70 p-3">
                <div className="flex items-center gap-2.5">
                  <div className={cn("grid h-8 w-8 place-items-center rounded-xl", t.tone)}>
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold leading-tight">{t.name}</p>
                    <p className="text-[10.5px] text-muted-foreground">{t.kind}</p>
                  </div>
                  <span className="tabular-nums text-[11.5px] font-semibold">{t.pct}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)]" style={{ width: `${t.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-[hsl(265_50%_85%)] bg-white/70 px-3 py-2 text-[12px] font-semibold text-[hsl(265_70%_50%)] transition hover:bg-white">
            Continue Learning <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </section>

        {/* PERFORMANCE */}
        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Your Performance</h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Last 30 days</span>
          </header>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {performance.map((p) => (
              <div key={p.label} className="rounded-2xl border border-white/70 bg-white/70 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("grid h-7 w-7 place-items-center rounded-xl", toneBg(p.tone), toneText(p.tone))}>
                      <p.icon className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{p.label}</p>
                  </div>
                </div>
                <p className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none">{p.value}</p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">{p.hint}</p>
                <div className="mt-1 -mx-1"><Spark data={p.spark} tone={p.tone} /></div>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-xl bg-[hsl(150_70%_96%)] px-3 py-2 text-[11.5px] leading-snug text-[hsl(155_55%_30%)]">
            <Smile className="mr-1 inline h-3.5 w-3.5" />
            Session completion above team average — excellent attendance this month!
          </p>
        </section>
      </div>

    </OSShell>
  );
}
