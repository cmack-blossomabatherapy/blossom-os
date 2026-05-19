import {
  ArrowUpRight, ArrowDownRight, Sparkles, AlertTriangle, CalendarDays, ChevronRight,
  Users, Heart, FileCheck2, GraduationCap, Activity, Clock, BadgeCheck, Brain,
  Lightbulb, AlertCircle, CheckCircle2, Radio, Flame, UserPlus, ClipboardCheck,
  BookOpen, Inbox, ArrowRight, Phone, MessageSquare, Mail, Send, FileText,
  ShieldCheck, Smile, Pause, RefreshCw, Upload, StickyNote, Headphones, Hourglass,
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
  { label: "New Leads Today",         value: "9",   delta: "+3",   up: true,  status: "ok",   hint: "vs yesterday",       spark: [3,4,5,5,6,7,8,9,9],         icon: UserPlus },
  { label: "Awaiting Contact",        value: "14",  delta: "+5",   up: false, status: "warn", hint: "8 over 24h",         spark: [6,8,9,10,11,12,13,14,14],   icon: Inbox },
  { label: "Avg Response Time",       value: "16m", delta: "-8m",  up: true,  status: "ok",   hint: "Target ≤ 20m",       spark: [28,26,24,22,20,19,18,17,16],icon: Clock },
  { label: "Forms Sent",              value: "22",  delta: "+6",   up: true,  status: "ok",   hint: "This week",          spark: [10,12,14,16,18,20,21,22,22],icon: Send },
  { label: "Forms Completed",         value: "14",  delta: "64%",  up: true,  status: "ok",   hint: "Of forms sent",      spark: [6,7,9,10,11,12,13,14,14],   icon: FileCheck2 },
  { label: "VOB Pending",             value: "7",   delta: "+2",   up: false, status: "warn", hint: "2 over 3 days",      spark: [3,3,4,5,5,6,7,7,7],         icon: Hourglass },
  { label: "VOB Completed",           value: "11",  delta: "+4",   up: true,  status: "ok",   hint: "This week",          spark: [4,5,6,7,8,9,10,11,11],      icon: BadgeCheck },
  { label: "Intake Conversion",       value: "58%", delta: "+6%",  up: true,  status: "ok",   hint: "Lead → Setup",       spark: [48,50,52,53,54,55,56,57,58],icon: Activity },
  { label: "Leads Stuck in Workflow", value: "6",   delta: "+1",   up: false, status: "warn", hint: "Form Sent stage",    spark: [3,3,4,4,5,5,6,6,6],         icon: AlertTriangle },
  { label: "Follow-Ups Due",          value: "12",  delta: "-3",   up: true,  status: "ok",   hint: "5 due in next hour", spark: [18,17,16,15,14,13,13,12,12],icon: Phone },
  { label: "Parent Response Rate",    value: "71%", delta: "+4%",  up: true,  status: "ok",   hint: "Within 48h",         spark: [62,64,66,67,68,69,70,70,71],icon: Smile },
  { label: "Ready for Next Step",     value: "5",   delta: "+2",   up: true,  status: "ok",   hint: "Awaiting handoff",   spark: [1,2,2,3,3,4,4,5,5],         icon: CheckCircle2 },
];

const stages = [
  { name: "New Lead",            count: 9,  stalled: 0, avg: "0.5h",  tone: "os-tone-violet" },
  { name: "Contact Attempted",   count: 14, stalled: 4, avg: "1d",    tone: "os-tone-sky" },
  { name: "Connected",           count: 11, stalled: 1, avg: "0.7d",  tone: "os-tone-mint" },
  { name: "Form Sent",           count: 22, stalled: 6, avg: "2.4d",  tone: "os-tone-lilac" },
  { name: "Form Received",       count: 14, stalled: 1, avg: "1.1d",  tone: "os-tone-rose" },
  { name: "Missing Information", count: 5,  stalled: 3, avg: "3.2d",  tone: "os-tone-coral" },
  { name: "Sent to VOB",         count: 7,  stalled: 2, avg: "2.0d",  tone: "os-tone-amber" },
  { name: "VOB Completed",       count: 11, stalled: 0, avg: "0.6d",  tone: "os-tone-mint" },
  { name: "Pending Auth",        count: 8,  stalled: 1, avg: "3.8d",  tone: "os-tone-amber" },
  { name: "Ready for Setup",     count: 5,  stalled: 0, avg: "0.4d",  tone: "os-tone-violet" },
];

const leads = [
  { parent: "Erin Walker",     child: "Ava (5)",     insurance: "BCBS NC", owner: "Michelle", stage: "Form Sent",           since: "3d ago",  urgency: "crit" as Tone },
  { parent: "Devon Pierce",    child: "Liam (4)",    insurance: "Aetna",   owner: "Michelle", stage: "Contact Attempted",   since: "1d ago",  urgency: "warn" as Tone },
  { parent: "Priya Sharma",    child: "Reya (6)",    insurance: "Cigna",   owner: "Michelle", stage: "Sent to VOB",         since: "2d ago",  urgency: "warn" as Tone },
  { parent: "Jordan Hayes",    child: "Mason (3)",   insurance: "UHC",     owner: "Michelle", stage: "Missing Information", since: "4d ago",  urgency: "crit" as Tone },
  { parent: "Camila Ortiz",    child: "Sofia (5)",   insurance: "BCBS NC", owner: "Michelle", stage: "Connected",           since: "5h ago",  urgency: "ok"   as Tone },
  { parent: "Tariq Davis",     child: "Noah (4)",    insurance: "Aetna",   owner: "Michelle", stage: "VOB Completed",       since: "1d ago",  urgency: "ok"   as Tone },
];

const followups = [
  { kind: "Call",  parent: "Erin Walker",   time: "9:30 AM",  stage: "Form Sent",           priority: "High",   last: "Voicemail · 2d" },
  { kind: "Text",  parent: "Devon Pierce",  time: "10:15 AM", stage: "Contact Attempted",   priority: "High",   last: "No reply · 1d" },
  { kind: "Email", parent: "Priya Sharma",  time: "11:00 AM", stage: "Sent to VOB",         priority: "Medium", last: "Sent · 2d" },
  { kind: "Call",  parent: "Jordan Hayes",  time: "1:00 PM",  stage: "Missing Information", priority: "High",   last: "Final attempt" },
  { kind: "Text",  parent: "Maya Bennett",  time: "2:30 PM",  stage: "Form Sent",           priority: "Medium", last: "Viewed · 1d" },
  { kind: "Call",  parent: "Anya Brooks",   time: "3:45 PM",  stage: "Pending Auth",        priority: "Medium", last: "Note · 1d" },
];

const forms = [
  { name: "Erin Walker · Intake Packet",   status: "Viewed",    pct: 60, days: 3, tone: "warn" as Tone },
  { name: "Devon Pierce · Insurance Card", status: "Sent",      pct: 20, days: 2, tone: "warn" as Tone },
  { name: "Priya Sharma · VOB",            status: "Awaiting Solum", pct: 40, days: 2, tone: "warn" as Tone },
  { name: "Camila Ortiz · Intake Packet",  status: "Completed", pct: 100,days: 0, tone: "ok"   as Tone },
  { name: "Tariq Davis · Payment Plan",    status: "Flagged",   pct: 70, days: 1, tone: "crit" as Tone },
];

const comms = [
  { who: "Erin Walker",   what: "Returned call · 2m",        when: "12m", tone: "os-tone-mint",   icon: Phone },
  { who: "Devon Pierce",  what: "Read your text",            when: "35m", tone: "os-tone-sky",    icon: MessageSquare },
  { who: "Priya Sharma",  what: "Replied to email",          when: "1h",  tone: "os-tone-violet", icon: Mail },
  { who: "Jordan Hayes",  what: "Missed call · voicemail",   when: "2h",  tone: "os-tone-coral",  icon: Phone },
  { who: "Maya Bennett",  what: "Opened intake form link",   when: "3h",  tone: "os-tone-lilac",  icon: FileText },
  { who: "Anya Brooks",   what: "Sent insurance card photo", when: "4h",  tone: "os-tone-rose",   icon: Upload },
];

const bottlenecks = [
  { severity: "crit", title: "Jordan Hayes — Missing Information for 4 days",  stage: "Missing Information", owner: "Michelle", action: "Final attempt call" },
  { severity: "crit", title: "Erin Walker — Form Sent stalled 3 days",         stage: "Form Sent",           owner: "Michelle", action: "Send SMS reminder" },
  { severity: "warn", title: "Priya Sharma — VOB awaiting Solum response",     stage: "Sent to VOB",         owner: "VOB Team", action: "Ping VOB team" },
  { severity: "warn", title: "Devon Pierce — unreachable after 3 attempts",    stage: "Contact Attempted",   owner: "Michelle", action: "Escalate to lead" },
  { severity: "warn", title: "Tariq Davis — payment plan flag",                stage: "Form Received",       owner: "Billing",  action: "Loop in billing" },
  { severity: "warn", title: "Maya Bennett — insurance card missing",          stage: "Form Sent",           owner: "Michelle", action: "Request photo upload" },
];

const training = [
  { name: "New Intake Workflow SOP",   pct: 100, kind: "SOP",      tone: "os-tone-mint"   },
  { name: "Phone Call Workflow",       pct: 60,  kind: "Training", tone: "os-tone-amber"  },
  { name: "Tango Walkthrough · Forms", pct: 35,  kind: "Walkthru", tone: "os-tone-violet" },
  { name: "VOB Updates · May",         pct: 80,  kind: "SOP",      tone: "os-tone-sky"    },
];

const aiInsights = [
  { icon: AlertCircle,  tone: "os-tone-coral", title: "Conversion at risk",         body: "Lead conversion likely to decline — 5 leads have waited > 24h for first contact.", cta: "View leads" },
  { icon: AlertTriangle,tone: "os-tone-amber", title: "3 leads may need escalation",body: "Jordan, Erin, and Devon are approaching final-attempt thresholds.",               cta: "Open queue" },
  { icon: Brain,        tone: "os-tone-sky",   title: "Aetna converts higher",      body: "Aetna families are converting 12% above your state average this month.",          cta: "See trend" },
  { icon: Lightbulb,    tone: "os-tone-lilac", title: "Form timing",                body: "Forms sent after 5 PM have 22% lower completion. Send earlier when possible.",     cta: "Apply tip" },
  { icon: Activity,     tone: "os-tone-mint",  title: "Workflow optimization",      body: "Auto-text reminder 24h after Form Sent could recover ~4 stalled leads/week.",      cta: "Enable rule" },
];

const calls = [
  { title: "Intake call · Erin Walker",   time: "9:30 – 9:45 AM",   tone: "os-tone-sky" },
  { title: "Family welcome · Camila O.",  time: "10:30 – 10:45",    tone: "os-tone-violet" },
  { title: "1:1 — Intake Lead",           time: "1:00 – 1:30 PM",   tone: "os-tone-rose" },
  { title: "Final attempt · Jordan H.",   time: "3:45 – 4:00 PM",   tone: "os-tone-amber" },
];

const quickActions = [
  { label: "Add Lead",          icon: UserPlus,       tone: "os-tone-rose"   },
  { label: "Call Parent",       icon: Phone,          tone: "os-tone-sky"    },
  { label: "Send Intake Packet",icon: Send,           tone: "os-tone-violet" },
  { label: "Upload Insurance",  icon: Upload,         tone: "os-tone-lilac"  },
  { label: "Send Follow-Up",    icon: MessageSquare,  tone: "os-tone-mint"   },
  { label: "Create Note",       icon: StickyNote,     tone: "os-tone-amber"  },
  { label: "Escalate Issue",    icon: Flame,          tone: "os-tone-coral"  },
  { label: "Open SOP",          icon: BookOpen,       tone: "os-tone-violet" },
];

const activity = [
  { who: "Maya B.",       what: "submitted intake form",              when: "4m",  tone: "os-tone-violet", icon: FileCheck2 },
  { who: "VOB Team",      what: "completed VOB for Tariq D.",         when: "18m", tone: "os-tone-mint",   icon: BadgeCheck },
  { who: "Camila O.",     what: "uploaded insurance card",            when: "32m", tone: "os-tone-sky",    icon: Upload },
  { who: "System",        what: "moved Anya B. to Pending Auth",      when: "55m", tone: "os-tone-amber",  icon: ArrowRight },
  { who: "Erin W.",       what: "opened intake packet link",          when: "1h",  tone: "os-tone-lilac",  icon: FileText },
  { who: "System",        what: "new lead received · BCBS NC",        when: "2h",  tone: "os-tone-rose",   icon: UserPlus },
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

const kindIcon: Record<string, React.ElementType> = { Call: Phone, Text: MessageSquare, Email: Mail };
const kindTone: Record<string, string> = { Call: "os-tone-sky", Text: "os-tone-violet", Email: "os-tone-lilac" };

/* ============ PAGE ============ */

export default function OSIntakeCoordinator() {
  const { user } = useAuth();
  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Michelle").split(" ")[0];
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
                <h3 className="text-[14px] font-semibold tracking-tight">AI Intake Insights</h3>
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
              <h3 className="text-[14px] font-semibold tracking-tight">Your Intake Score</h3>
              <p className="text-[10.5px] text-muted-foreground">Response · Conversion · Cleanliness</p>
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
              <div className="rounded-lg bg-[hsl(150_70%_94%)] py-1.5 font-semibold text-[hsl(155_55%_32%)]">Resp 92</div>
              <div className="rounded-lg bg-[hsl(40_100%_94%)] py-1.5 font-semibold text-[hsl(30_80%_42%)]">Conv 84</div>
              <div className="rounded-lg bg-[hsl(265_100%_95%)] py-1.5 font-semibold text-[hsl(265_70%_50%)]">Clean 88</div>
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
              <Headphones className="h-3 w-3 text-[hsl(265_70%_55%)]" /> Intake Coordinator · Mission Control
            </div>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[34px]">
              {greet}, <span className="capitalize">{name}</span> <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {today} · Here's what's happening in Intake today.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(265_100%_95%)] px-2.5 py-1 font-semibold text-[hsl(265_70%_50%)]">
                <UserPlus className="h-3 w-3" /> 9 new leads
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(40_100%_92%)] px-2.5 py-1 font-semibold text-[hsl(30_80%_42%)]">
                <Phone className="h-3 w-3" /> 12 follow-ups due
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(355_100%_94%)] px-2.5 py-1 font-semibold text-[hsl(355_70%_48%)]">
                <FileText className="h-3 w-3" /> 8 forms pending
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(150_70%_92%)] px-2.5 py-1 font-semibold text-[hsl(155_55%_32%)]">
                <ShieldCheck className="h-3 w-3" /> Avg response 16m
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
                <p className="text-[13px] font-semibold leading-none tracking-tight">Intake AI Briefing</p>
                <p className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Updated 2 min ago</p>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/85">
              <span className="font-semibold text-[hsl(355_70%_52%)]">5 leads</span> are awaiting follow-up today.
              Two <span className="font-semibold">VOBs</span> have not been returned within expected timeframe.
            </p>
            <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.55)] transition hover:opacity-95">
              Open Intake Insights <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* KPI GRID */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h2 className="text-[15px] font-semibold tracking-tight">Daily Intake KPIs</h2>
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
            <h3 className="text-[15px] font-semibold tracking-tight">Lead Pipeline</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Every stage from new lead to client setup</p>
          </div>
          <button className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">Open kanban</button>
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
            <Phone className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Follow-Ups & Tasks</h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {["All", "Calls", "Texts", "Emails", "Final Attempts", "Missing Info", "Escalations"].map((t, i) => (
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
              <FileText className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Forms & VOB Tracking</h3>
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
              <MessageSquare className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Communication Hub</h3>
            </div>
            <Pill tone="ok">71% reply</Pill>
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
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><Mail className="mr-1 inline h-3 w-3" />Email</button>
          </div>
        </section>
      </div>

      {/* INTAKE BOTTLENECKS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-[hsl(355_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Intake Bottlenecks</h3>
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