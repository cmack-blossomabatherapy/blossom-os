import {
  ArrowUpRight, ArrowDownRight, Sparkles, AlertTriangle, ChevronRight,
  FileCheck2, GraduationCap, Activity, Clock, Brain,
  Lightbulb, AlertCircle, CheckCircle2, Radio, Flame, ClipboardCheck,
  BookOpen, Inbox, ArrowRight, MessageSquare, FileText,
  ShieldCheck, Pause, RefreshCw, Upload, StickyNote, CalendarClock,
  FileWarning, FileSignature, ShieldAlert, TrendingUp, ScrollText,
  Target, Stamp, Eye, Send, UserCheck, Gavel,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, RadialBarChart, RadialBar,
} from "recharts";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type Tone = "ok" | "warn" | "crit";

type Kpi = {
  label: string; value: string; delta: string; up: boolean;
  status: Tone; hint: string; spark: number[]; icon: React.ElementType;
};

const kpis: Kpi[] = [
  { label: "QA Reviews Pending",       value: "14",  delta: "+3",   up: false, status: "warn", hint: "5 due today",          spark: [6,7,8,9,10,11,12,13,14],            icon: ClipboardCheck },
  { label: "Treatment Plans Received", value: "22",  delta: "+5",   up: true,  status: "ok",   hint: "Last 7 days",          spark: [12,14,15,17,18,19,20,21,22],        icon: FileText },
  { label: "Treatment Plans Ready",    value: "17",  delta: "+4",   up: true,  status: "ok",   hint: "Ready to submit",      spark: [9,10,11,12,13,14,15,16,17],         icon: Stamp },
  { label: "Avg QA Turnaround",        value: "1.8d",delta: "-11%", up: true,  status: "ok",   hint: "Target ≤ 2d",          spark: [2.6,2.5,2.4,2.3,2.1,2.0,1.9,1.9,1.8], icon: Clock },
  { label: "Progress Reports Pending", value: "12",  delta: "+2",   up: false, status: "warn", hint: "4 overdue",            spark: [6,7,8,9,10,11,11,12,12],            icon: ScrollText },
  { label: "Compliance Issues Open",   value: "3",   delta: "+1",   up: false, status: "crit", hint: "1 needs escalation",   spark: [1,1,2,2,2,3,3,3,3],                 icon: ShieldAlert },
  { label: "Documentation Errors",     value: "9",   delta: "-2",   up: true,  status: "warn", hint: "Across 6 charts",      spark: [13,12,12,11,11,10,10,9,9],          icon: FileWarning },
  { label: "QA Completion Rate",       value: "92%", delta: "+3%",  up: true,  status: "ok",   hint: "30d rolling",          spark: [85,86,87,88,89,90,91,92,92],        icon: TrendingUp },
  { label: "Auths Awaiting QA",        value: "7",   delta: "+1",   up: false, status: "warn", hint: "BCBS · Aetna · Cigna", spark: [3,4,4,5,5,6,6,7,7],                 icon: FileCheck2 },
  { label: "Overdue Reviews",          value: "4",   delta: "+1",   up: false, status: "crit", hint: ">48h past due",        spark: [1,2,2,2,3,3,4,4,4],                 icon: AlertTriangle },
  { label: "BCBA Response Delays",     value: "6",   delta: "+2",   up: false, status: "warn", hint: "Awaiting reply",       spark: [2,3,3,4,4,5,5,6,6],                 icon: MessageSquare },
  { label: "QA Risk Alerts",           value: "2",   delta: "+1",   up: false, status: "crit", hint: "GA · TN trending",     spark: [0,0,1,1,1,2,2,2,2],                 icon: Flame },
];

const stages = [
  { name: "TP Received",          count: 22, stalled: 0, avg: "0.6d", tone: "os-tone-sky" },
  { name: "QA Review",            count: 14, stalled: 3, avg: "1.8d", tone: "os-tone-violet" },
  { name: "Ready to Submit",      count: 17, stalled: 0, avg: "0.4d", tone: "os-tone-mint" },
  { name: "Awaiting Corrections", count: 8,  stalled: 2, avg: "3.2d", tone: "os-tone-amber" },
  { name: "Awaiting PR",          count: 12, stalled: 4, avg: "4.1d", tone: "os-tone-rose" },
  { name: "Compliance Escalation",count: 3,  stalled: 1, avg: "5.6d", tone: "os-tone-coral" },
  { name: "Approved",             count: 41, stalled: 0, avg: "—",    tone: "os-tone-lilac" },
];

const charts = [
  { parent: "Liam Carter",      child: "Tx Plan · BCBS · GA",   insurance: "Aetna",       owner: "BCBA: Renee",  stage: "QA Review",        since: "Due today",     urgency: "crit" as Tone },
  { parent: "Aria Johnson",     child: "Tx Plan · Aetna · TN",  insurance: "Aetna",       owner: "BCBA: Wilson", stage: "Awaiting Corrections", since: "Returned 2d",   urgency: "crit" as Tone },
  { parent: "Noah Brooks",      child: "PR · Cigna · NC",       insurance: "Cigna",       owner: "BCBA: Daylis", stage: "Awaiting PR",      since: "Overdue 7d",    urgency: "crit" as Tone },
  { parent: "Mia Reynolds",     child: "Tx Plan · BCBS · VA",   insurance: "BCBS",        owner: "BCBA: Park",   stage: "Ready to Submit",  since: "Approved 1h",   urgency: "ok"   as Tone },
  { parent: "Ethan Walker",     child: "Reassessment · GA",     insurance: "Humana",      owner: "BCBA: Cole",   stage: "QA Review",        since: "Sig missing",   urgency: "warn" as Tone },
  { parent: "Sofia Martinez",   child: "Tx Plan · UHC · TN",    insurance: "UHC",         owner: "BCBA: Shah",   stage: "Compliance Escalation", since: "State Dir flagged", urgency: "crit" as Tone },
];

const tasks = [
  { kind: "Review",   parent: "Tx Plan · Liam Carter",         time: "9:30 AM",  stage: "Due today · Aetna",        priority: "High",   last: "Assigned · 1d" },
  { kind: "Correction", parent: "Return · Aria Johnson",       time: "11:00 AM", stage: "Assessment incomplete",    priority: "High",   last: "BCBA notified · 2d" },
  { kind: "Escalation", parent: "Compliance · Sofia Martinez", time: "12:30 PM", stage: "State Director loop-in",   priority: "High",   last: "Flagged · 3h" },
  { kind: "PR Request", parent: "PR overdue · Noah Brooks",    time: "1:00 PM",  stage: "BCBA Daylis · 7d late",    priority: "High",   last: "Reminder · 1h" },
  { kind: "Review",   parent: "Tx Plan · Mia Reynolds",        time: "3:00 PM",  stage: "Ready · final pass",       priority: "Medium", last: "Self-review pending" },
  { kind: "Note",     parent: "Signature · Ethan Walker",      time: "4:15 PM",  stage: "Parent signature missing", priority: "Medium", last: "Email sent · 1d" },
];

const docs = [
  { name: "Liam Carter · Treatment Plan packet",   status: "In QA review",          pct: 70, days: 1, tone: "warn" as Tone },
  { name: "Aria Johnson · Assessment + signature", status: "Stalled · 4d",          pct: 35, days: 4, tone: "crit" as Tone },
  { name: "Mia Reynolds · Tx Plan final",          status: "Ready to submit",       pct: 100,days: 0, tone: "ok"   as Tone },
  { name: "Ethan Walker · Parent signature",       status: "Awaiting signature",    pct: 50, days: 2, tone: "warn" as Tone },
  { name: "Sofia Martinez · UHC packet",           status: "Compliance escalation", pct: 25, days: 5, tone: "crit" as Tone },
];

const compliance = [
  { who: "Georgia (GA)",     what: "documentation error rate up 18% (WoW)",  when: "1h",  tone: "os-tone-coral", icon: AlertTriangle },
  { who: "Virginia (VA)",    what: "PR backlog detected — 4 overdue",         when: "2h",  tone: "os-tone-amber", icon: FileWarning },
  { who: "Tennessee (TN)",   what: "Aetna submission risk trending up",       when: "3h",  tone: "os-tone-rose",  icon: ShieldAlert },
  { who: "North Carolina",   what: "audit readiness 96% · on track",          when: "4h",  tone: "os-tone-mint",  icon: ShieldCheck },
  { who: "All states",       what: "HIPAA cert refresh due in 14 days",       when: "6h",  tone: "os-tone-sky",   icon: BookOpen },
  { who: "Florida (FL)",     what: "1 chart returned for missing assessment", when: "7h",  tone: "os-tone-violet",icon: FileText },
];

const bottlenecks = [
  { severity: "crit", title: "Sofia Martinez — compliance escalation triggered",  stage: "Compliance",   owner: "Amanda", action: "Loop in State Director" },
  { severity: "crit", title: "Noah Brooks — PR overdue by 7 days",                stage: "Progress Rpt", owner: "Daylis", action: "Escalate to leadership" },
  { severity: "crit", title: "Aria Johnson — Tx plan returned, no BCBA reply",    stage: "Corrections",  owner: "Wilson", action: "Send 2nd reminder" },
  { severity: "warn", title: "GA documentation errors trending upward (+18%)",    stage: "Quality",      owner: "Amanda", action: "Open trend report" },
  { severity: "warn", title: "Parent signature missing · Ethan Walker",           stage: "Documents",    owner: "Renee",  action: "Trigger e-sign packet" },
  { severity: "warn", title: "3 RBT charts missing session note attestations",    stage: "Documentation",owner: "Park",   action: "Flag for correction" },
];

const sops = [
  { name: "QA Review SOP v4.2 · Published",          pct: 88, kind: "SOP Update",    tone: "os-tone-mint"   },
  { name: "Progress Report Standards · Updated",     pct: 72, kind: "Documentation", tone: "os-tone-amber"  },
  { name: "Compliance Workflow · GA/TN Refresh",     pct: 54, kind: "Compliance",    tone: "os-tone-violet" },
  { name: "Tango Walkthrough · QA Submission Flow",  pct: 81, kind: "Training",      tone: "os-tone-sky"    },
];

const aiInsights = [
  { icon: AlertCircle,   tone: "os-tone-coral", title: "Documentation errors trending up in TN",    body: "TN error rate up 22% over 14 days — risk to Aetna submissions next week.",      cta: "Open TN trend" },
  { icon: AlertTriangle, tone: "os-tone-amber", title: "QA turnaround may delay auth submissions",  body: "7 auths awaiting QA — if not cleared by Friday, expect 2 expiration risks.",     cta: "Open auths queue" },
  { icon: Brain,         tone: "os-tone-sky",   title: "Repeated BCBA delays detected",             body: "BCBA Wilson has 4 charts past 3d — recommend coaching loop or reassignment.",     cta: "View reviewer load" },
  { icon: Lightbulb,     tone: "os-tone-lilac", title: "Compliance risk increasing for one payor",  body: "BCBS error rate up 9% — packet template may need updating.",                      cta: "Open payor view" },
  { icon: Activity,      tone: "os-tone-mint",  title: "QA velocity improving",                     body: "Avg turnaround dropped from 2.6d to 1.8d this month — automations are working.", cta: "See trend" },
];

const calls = [
  { title: "QA review block · Liam Carter Tx Plan", time: "9:00 – 9:45 AM",   tone: "os-tone-sky" },
  { title: "Compliance loop · Sofia Martinez",      time: "11:00 – 11:30",    tone: "os-tone-coral" },
  { title: "BCBA sync · Wilson (corrections)",      time: "1:00 – 1:30 PM",   tone: "os-tone-violet" },
  { title: "Audit readiness review · NC",           time: "3:30 – 4:00 PM",   tone: "os-tone-mint" },
];

const quickActions = [
  { label: "Start QA Review",        icon: ClipboardCheck, tone: "os-tone-violet" },
  { label: "Request Corrections",    icon: RefreshCw,      tone: "os-tone-amber"  },
  { label: "Escalate Compliance",    icon: ShieldAlert,    tone: "os-tone-coral"  },
  { label: "Request Progress Report",icon: ScrollText,     tone: "os-tone-rose"   },
  { label: "Approve Submission",     icon: Stamp,          tone: "os-tone-mint"   },
  { label: "Open SOP",               icon: BookOpen,       tone: "os-tone-sky"    },
  { label: "View Reports",           icon: Activity,       tone: "os-tone-lilac"  },
  { label: "Assign Reviewer",        icon: UserCheck,      tone: "os-tone-violet" },
];

const activity = [
  { who: "Amanda",          what: "approved Tx Plan · Mia Reynolds",        when: "4m",  tone: "os-tone-violet", icon: CheckCircle2 },
  { who: "System",          what: "Tx Plan received · Liam Carter (BCBS)",  when: "18m", tone: "os-tone-mint",   icon: FileText },
  { who: "BCBA Daylis",     what: "uploaded PR · Noah Brooks",              when: "32m", tone: "os-tone-sky",    icon: ScrollText },
  { who: "QA System",       what: "compliance issue escalated · Sofia M.",  when: "55m", tone: "os-tone-coral",  icon: ShieldAlert },
  { who: "Auth Team",       what: "auth approved · BCBS · Liam Carter",     when: "1h",  tone: "os-tone-amber",  icon: Gavel },
  { who: "BCBA Wilson",     what: "submitted corrections · Aria Johnson",   when: "2h",  tone: "os-tone-rose",   icon: FileSignature },
];

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
          <linearGradient id={`qa-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.32} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.75} fill={`url(#qa-${tone})`} dot={false} />
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

const kindIcon: Record<string, React.ElementType> = {
  Review: ClipboardCheck, Correction: RefreshCw, Escalation: ShieldAlert,
  "PR Request": ScrollText, Note: StickyNote,
};
const kindTone: Record<string, string> = {
  Review: "os-tone-violet", Correction: "os-tone-amber", Escalation: "os-tone-coral",
  "PR Request": "os-tone-rose", Note: "os-tone-lilac",
};

export default function OSQATeam() {
  const { user } = useAuth();
  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Amanda").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const score = 93;

  return (
    <OSShell
      rightRail={
        <>
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.28)] to-transparent blur-2xl" />
            <header className="mb-3 flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                <Brain className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold tracking-tight">AI QA Insights</h3>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Predictive · Quality-first</p>
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

          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(155_70%_70%/0.25)] to-transparent blur-2xl" />
            <header className="mb-2">
              <h3 className="text-[14px] font-semibold tracking-tight">QA Health Score</h3>
              <p className="text-[10.5px] text-muted-foreground">Quality · Turnaround · Compliance</p>
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
              <div className="rounded-lg bg-[hsl(150_70%_94%)] py-1.5 font-semibold text-[hsl(155_55%_32%)]">Qty 92</div>
              <div className="rounded-lg bg-[hsl(40_100%_94%)] py-1.5 font-semibold text-[hsl(30_80%_42%)]">TAT 88</div>
              <div className="rounded-lg bg-[hsl(265_100%_95%)] py-1.5 font-semibold text-[hsl(265_70%_50%)]">Cmp 94</div>
            </div>
          </section>

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

          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
                <h3 className="text-[14px] font-semibold tracking-tight">Training & SOPs</h3>
              </div>
              <Pill tone="med">{sops.length}</Pill>
            </header>
            <ul className="space-y-2.5">
              {sops.map((t) => (
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

          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
                <h3 className="text-[14px] font-semibold tracking-tight">Recent QA Activity</h3>
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
              <ShieldCheck className="h-3 w-3 text-[hsl(265_70%_55%)]" /> QA Team · Quality Mission Control
            </div>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[34px]">
              {greet}, <span className="capitalize">{name}</span> <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {today} · Here's what's happening across QA today.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(265_100%_95%)] px-2.5 py-1 font-semibold text-[hsl(265_70%_50%)]">
                <ClipboardCheck className="h-3 w-3" /> 14 QA reviews pending
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(355_100%_94%)] px-2.5 py-1 font-semibold text-[hsl(355_70%_48%)]">
                <AlertTriangle className="h-3 w-3" /> 4 overdue reviews
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(40_100%_92%)] px-2.5 py-1 font-semibold text-[hsl(30_80%_42%)]">
                <ShieldAlert className="h-3 w-3" /> 3 compliance issues open
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(150_70%_92%)] px-2.5 py-1 font-semibold text-[hsl(155_55%_32%)]">
                <TrendingUp className="h-3 w-3" /> TAT improved 11%
              </span>
            </div>
          </div>

          <div className="relative w-full max-w-md shrink-0 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_14px_36px_-20px_hsl(265_60%_50%/0.35)] backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-none tracking-tight">QA AI Briefing</p>
                <p className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Updated 2 min ago</p>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/85">
              <span className="font-semibold text-[hsl(155_55%_38%)]">Treatment plan turnaround</span> improved this week, however{" "}
              <span className="font-semibold">4 progress reports</span> remain overdue and{" "}
              <span className="font-semibold text-[hsl(355_72%_52%)]">one compliance issue</span> requires escalation.
            </p>
            <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.55)] transition hover:opacity-95">
              Open QA Insights <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* KPI GRID */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h2 className="text-[15px] font-semibold tracking-tight">QA Operations KPIs</h2>
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

      {/* QA WORKFLOW PIPELINE */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">QA Review Workflow</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Treatment plan received through approved — every stage tracked</p>
          </div>
          <button className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">Open queue</button>
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

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {charts.map((l) => (
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

      {/* TASKS & WORKFLOW HUB */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">QA Tasks & Workflow Hub</h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {["All", "Reviews Due", "Awaiting BCBA", "Escalations", "Missing Docs", "Overdue PRs", "Ready"].map((t, i) => (
              <button key={t} className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-semibold",
                i === 0 ? "bg-foreground text-background" : "bg-foreground/[0.05] text-foreground/70 hover:bg-foreground/[0.08]"
              )}>{t}</button>
            ))}
          </div>
        </header>
        <ul className="divide-y divide-foreground/[0.06]">
          {tasks.map((f) => {
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
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Reassign"><RefreshCw className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(40_100%_92%)] text-[hsl(30_80%_42%)] hover:bg-[hsl(40_100%_88%)]" title="Return for correction"><Send className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(150_70%_92%)] text-[hsl(155_55%_35%)] hover:bg-[hsl(150_70%_88%)]" title="Approve"><Stamp className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* DOCUMENTATION + COMPLIANCE */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="os-card lg:col-span-2">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Treatment Plan & Documentation Tracking</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <Pill tone="warn">2 stalled</Pill>
              <Pill tone="crit">2 flagged</Pill>
            </div>
          </header>
          <ul className="space-y-2.5">
            {docs.map((f) => (
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
              <ShieldAlert className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Compliance & Risk Intelligence</h3>
            </div>
            <Pill tone="warn">3 open</Pill>
          </header>
          <ul className="space-y-3">
            {compliance.map((c, i) => (
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
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><Eye className="mr-1 inline h-3 w-3" />Audit</button>
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><Upload className="mr-1 inline h-3 w-3" />Upload</button>
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><Target className="mr-1 inline h-3 w-3" />Trend</button>
          </div>
        </section>
      </div>

      {/* PROGRESS REPORT COORDINATION / BOTTLENECKS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-[hsl(355_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Progress Reports, Escalations & Urgent QA Items</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <Pill tone="crit">3 critical</Pill>
            <Pill tone="warn">3 watch</Pill>
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
