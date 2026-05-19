import {
  ArrowUpRight, ArrowDownRight, Sparkles, AlertTriangle, ChevronRight,
  FileCheck2, GraduationCap, Activity, Clock, Brain,
  Lightbulb, AlertCircle, CheckCircle2, Radio, Flame, ClipboardCheck,
  BookOpen, Inbox, ArrowRight, MessageSquare, FileText,
  ShieldCheck, RefreshCw, Upload, StickyNote, CalendarClock,
  FileSignature, TrendingUp, Heart, Users, UserCog,
  Target, Stethoscope, NotebookPen, Baby, LineChart, CalendarDays,
  Smile,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, RadialBarChart, RadialBar,
  LineChart as RLineChart, Line, XAxis, YAxis, Tooltip,
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
  { label: "Active Clients",            value: "18",  delta: "+1",   up: true,  status: "ok",   hint: "Across 2 clinics",   spark: [14,15,15,16,16,17,17,18,18],     icon: Heart },
  { label: "Sessions This Week",        value: "42",  delta: "+6",   up: true,  status: "ok",   hint: "Target 45",          spark: [28,30,32,34,36,38,40,41,42],     icon: CalendarDays },
  { label: "Supervision Hours Done",    value: "9.5h",delta: "+1.2h",up: true,  status: "ok",   hint: "Goal 12h",           spark: [4,5,6,7,7.5,8,8.5,9,9.5],        icon: Stethoscope },
  { label: "Progress Reports Due",      value: "3",   delta: "+1",   up: false, status: "warn", hint: "1 due Friday",       spark: [1,1,2,2,2,3,3,3,3],              icon: NotebookPen },
  { label: "Treatment Plans Pending",   value: "2",   delta: "0",    up: true,  status: "warn", hint: "Awaiting signature", spark: [3,3,2,2,2,2,2,2,2],              icon: FileSignature },
  { label: "Auths Expiring Soon",       value: "4",   delta: "+2",   up: false, status: "crit", hint: "≤ 21 days",          spark: [1,1,2,2,3,3,4,4,4],              icon: FileCheck2 },
  { label: "Parent Trainings",          value: "5",   delta: "+1",   up: true,  status: "ok",   hint: "Scheduled this wk",  spark: [2,3,3,3,4,4,4,5,5],              icon: Baby },
  { label: "RBT Supervision %",         value: "88%", delta: "+11%", up: true,  status: "ok",   hint: "Target ≥ 90%",       spark: [72,74,76,79,82,84,86,87,88],     icon: UserCog },
  { label: "Session Completion Rate",   value: "94%", delta: "+2%",  up: true,  status: "ok",   hint: "Last 30d",           spark: [88,89,90,91,92,93,93,94,94],     icon: CheckCircle2 },
  { label: "Client Progress Score",     value: "82",  delta: "+4",   up: true,  status: "ok",   hint: "Caseload avg",       spark: [74,75,77,78,79,80,81,82,82],     icon: TrendingUp },
  { label: "Overdue Clinical Tasks",    value: "6",   delta: "+2",   up: false, status: "warn", hint: "Notes · plans",      spark: [2,3,3,4,4,5,5,6,6],              icon: AlertTriangle },
  { label: "Caseload Utilization",      value: "87%", delta: "-2%",  up: false, status: "ok",   hint: "Healthy range",      spark: [92,91,90,89,89,88,88,87,87],     icon: Activity },
];

const clients = [
  { name: "Liam Carter",     age: "6 · ASD L2",   rbt: "RBT: Maya · Devon",     auth: "Aetna · 84 units left",   stage: "On Track",   trend: "ok"   as Tone, since: "Next: Today 3 PM" },
  { name: "Aria Johnson",    age: "4 · ASD L1",   rbt: "RBT: Priya",            auth: "BCBS · expires 18d",       stage: "PR due Fri", trend: "warn" as Tone, since: "Goals improving" },
  { name: "Noah Brooks",     age: "8 · ASD L2",   rbt: "RBT: Kenji · Sam",      auth: "Cigna · expires 9d",       stage: "Auth risk",  trend: "crit" as Tone, since: "Attendance 71%" },
  { name: "Mia Reynolds",    age: "5 · ASD L1",   rbt: "RBT: Aisha",            auth: "UHC · 142 units left",     stage: "On Track",   trend: "ok"   as Tone, since: "Next: Tomorrow" },
  { name: "Ethan Walker",    age: "7 · ASD L2",   rbt: "RBT: Devon",            auth: "Humana · 36 units left",   stage: "Plan pending",trend: "warn"as Tone, since: "Signature needed" },
  { name: "Sofia Martinez",  age: "3 · ASD L1",   rbt: "RBT: Maya",             auth: "UHC · 98 units left",      stage: "Declining",  trend: "crit" as Tone, since: "Comm goals -8%" },
];

const stages = [
  { name: "Today's Sessions",   count: 6, stalled: 0, avg: "—",   tone: "os-tone-sky" },
  { name: "Supervision Due",    count: 4, stalled: 1, avg: "2d",  tone: "os-tone-violet" },
  { name: "PRs Due",            count: 3, stalled: 1, avg: "5d",  tone: "os-tone-amber" },
  { name: "Tx Plans Pending",   count: 2, stalled: 0, avg: "1.4d",tone: "os-tone-rose" },
  { name: "Parent Trainings",   count: 5, stalled: 0, avg: "—",   tone: "os-tone-mint" },
  { name: "Auths Renewing",     count: 4, stalled: 2, avg: "9d",  tone: "os-tone-coral" },
  { name: "QA Requests",        count: 2, stalled: 0, avg: "0.8d",tone: "os-tone-lilac" },
];

const tasks = [
  { kind: "Report",      parent: "Progress Report · Aria Johnson",    time: "Due Fri",  stage: "Q4 reassessment",            priority: "High",   last: "Draft saved · 1d" },
  { kind: "Supervision", parent: "RBT Supervision · Maya Thompson",   time: "Tomorrow", stage: "1.0h direct observation",    priority: "High",   last: "Scheduled" },
  { kind: "Plan",        parent: "Treatment Plan · Ethan Walker",     time: "Today",    stage: "Awaiting parent signature",  priority: "High",   last: "Sent · 2d" },
  { kind: "Parent",      parent: "Parent Training · Mia Reynolds",    time: "Thu 4 PM", stage: "Generalization · Wk 2",      priority: "Medium", last: "Confirmed" },
  { kind: "Note",        parent: "Session Note · Liam Carter",        time: "Overdue",  stage: "Goal data entry pending",    priority: "Medium", last: "Auto-save 1h" },
  { kind: "QA",          parent: "QA Request · Noah Brooks",          time: "Mon",      stage: "Auth packet review",         priority: "Medium", last: "Routed to QA" },
];

const docs = [
  { name: "Aria Johnson · Q4 Progress Report",       status: "Draft 70% · due Fri",         pct: 70, days: 1, tone: "warn" as Tone },
  { name: "Ethan Walker · Treatment Plan v3",        status: "Awaiting parent signature",   pct: 85, days: 2, tone: "warn" as Tone },
  { name: "Mia Reynolds · Reassessment packet",      status: "Ready for QA",                pct: 100,days: 0, tone: "ok"   as Tone },
  { name: "Liam Carter · Session note (today)",      status: "Data entry pending",          pct: 40, days: 0, tone: "warn" as Tone },
  { name: "Noah Brooks · Auth renewal packet",       status: "BCBS · expires 9d",           pct: 30, days: 4, tone: "crit" as Tone },
];

const team = [
  { who: "RBT Maya Thompson",  what: "supervision complete · Liam Carter",    when: "1h",  tone: "os-tone-mint",   icon: ShieldCheck },
  { who: "RBT Devon Reyes",    what: "session note submitted · Ethan Walker", when: "2h",  tone: "os-tone-sky",    icon: NotebookPen },
  { who: "RBT Priya Shah",     what: "requests overlap session · Aria",        when: "3h",  tone: "os-tone-amber",  icon: AlertTriangle },
  { who: "RBT Kenji Park",     what: "training overdue · ETP refresher",       when: "4h",  tone: "os-tone-rose",   icon: GraduationCap },
  { who: "RBT Aisha Cole",     what: "completed RBT compass module 4",         when: "5h",  tone: "os-tone-violet", icon: CheckCircle2 },
  { who: "RBT Sam Webb",       what: "availability updated for next week",     when: "6h",  tone: "os-tone-lilac",  icon: CalendarClock },
];

const bottlenecks = [
  { severity: "crit", title: "Noah Brooks — auth expires in 9 days",            stage: "Authorizations", owner: "You",       action: "Submit renewal packet" },
  { severity: "crit", title: "Sofia Martinez — communication goals trending down",stage: "Clinical",      owner: "You",       action: "Adjust treatment plan" },
  { severity: "crit", title: "Aria Johnson — PR due Friday, 30% complete",      stage: "Progress Rpt",   owner: "You",       action: "Resume draft" },
  { severity: "warn", title: "Ethan Walker — parent signature outstanding 2d",  stage: "Treatment Plan", owner: "Front desk",action: "Trigger e-sign reminder" },
  { severity: "warn", title: "RBT Priya needs additional supervision this wk",  stage: "Supervision",    owner: "You",       action: "Add overlap block" },
  { severity: "warn", title: "Attendance inconsistency · Noah Brooks (71%)",    stage: "Engagement",     owner: "Scheduling",action: "Loop in parent" },
];

const sops = [
  { name: "Progress Report SOP v3.1 · Published",     pct: 92, kind: "SOP Update",    tone: "os-tone-mint"   },
  { name: "Parent Training Workflow · Refreshed",     pct: 74, kind: "Clinical",      tone: "os-tone-amber"  },
  { name: "Auth Renewal Packet · QA Checklist",       pct: 58, kind: "Authorizations",tone: "os-tone-violet" },
  { name: "Tango Walkthrough · Session Note Entry",   pct: 81, kind: "Training",      tone: "os-tone-sky"    },
];

const aiInsights = [
  { icon: AlertCircle,   tone: "os-tone-coral", title: "Sofia Martinez — progress trend declining", body: "Communication goals down 8% over 14 days. Consider revising acquisition targets.", cta: "Open client" },
  { icon: AlertTriangle, tone: "os-tone-amber", title: "Auth expiration risk · Noah Brooks",        body: "Cigna auth expires in 9 days — submit renewal by Thursday to avoid gap.",         cta: "Open auth" },
  { icon: Brain,         tone: "os-tone-sky",   title: "Session consistency may impact outcomes",   body: "Noah's attendance 71% — outcomes correlate with ≥85%. Loop in parent.",           cta: "Open attendance" },
  { icon: Lightbulb,     tone: "os-tone-lilac", title: "Parent training below target",              body: "3 families need parent training this month — schedule by Friday to stay on plan.",cta: "Open trainings" },
  { icon: Activity,      tone: "os-tone-mint",  title: "Caseload progress improving",               body: "Avg client progress score up 4 pts this month — keep current programming.",       cta: "See trend" },
];

const calls = [
  { title: "Session · Liam Carter (3 PM)",          time: "3:00 – 4:00 PM",   tone: "os-tone-sky" },
  { title: "RBT Supervision · Maya Thompson",       time: "4:15 – 5:00 PM",   tone: "os-tone-violet" },
  { title: "Parent Training · Mia Reynolds",        time: "Thu 4:00 PM",      tone: "os-tone-mint" },
  { title: "Treatment Plan review · Ethan Walker",  time: "Fri 11:00 AM",     tone: "os-tone-amber" },
];

const quickActions = [
  { label: "Open Client",            icon: Heart,          tone: "os-tone-rose"   },
  { label: "Create Progress Report", icon: NotebookPen,    tone: "os-tone-violet" },
  { label: "Upload Treatment Plan",  icon: Upload,         tone: "os-tone-lilac"  },
  { label: "Schedule Supervision",   icon: Stethoscope,    tone: "os-tone-sky"    },
  { label: "Add Session Note",       icon: FileText,       tone: "os-tone-mint"   },
  { label: "Message Team",           icon: MessageSquare,  tone: "os-tone-amber"  },
  { label: "Open SOP",               icon: BookOpen,       tone: "os-tone-violet" },
  { label: "View Reports",           icon: LineChart,      tone: "os-tone-coral"  },
];

const activity = [
  { who: "You",              what: "completed supervision · Maya Thompson",   when: "12m", tone: "os-tone-violet", icon: ShieldCheck },
  { who: "System",           what: "auth approved · BCBS · Liam Carter",       when: "32m", tone: "os-tone-mint",   icon: FileCheck2 },
  { who: "RBT Devon",        what: "session note submitted · Ethan Walker",    when: "55m", tone: "os-tone-sky",    icon: NotebookPen },
  { who: "Parent · Reynolds",what: "signed updated treatment plan",            when: "1h",  tone: "os-tone-amber",  icon: FileSignature },
  { who: "QA Team",          what: "approved PR · Mia Reynolds",               when: "2h",  tone: "os-tone-rose",   icon: CheckCircle2 },
  { who: "You",              what: "started parent training · Mia Reynolds",   when: "3h",  tone: "os-tone-lilac",  icon: Baby },
];

const progressTrend = [
  { wk: "W1", comm: 62, behavior: 71, social: 58 },
  { wk: "W2", comm: 65, behavior: 73, social: 60 },
  { wk: "W3", comm: 68, behavior: 74, social: 63 },
  { wk: "W4", comm: 71, behavior: 76, social: 66 },
  { wk: "W5", comm: 74, behavior: 78, social: 68 },
  { wk: "W6", comm: 76, behavior: 80, social: 71 },
  { wk: "W7", comm: 78, behavior: 81, social: 73 },
  { wk: "W8", comm: 80, behavior: 83, social: 75 },
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
          <linearGradient id={`bcba-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.32} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.75} fill={`url(#bcba-${tone})`} dot={false} />
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
  Report: NotebookPen, Supervision: Stethoscope, Plan: FileSignature,
  Parent: Baby, Note: FileText, QA: ShieldCheck,
};
const kindTone: Record<string, string> = {
  Report: "os-tone-violet", Supervision: "os-tone-sky", Plan: "os-tone-amber",
  Parent: "os-tone-mint", Note: "os-tone-lilac", QA: "os-tone-rose",
};

export default function OSBCBA() {
  const { user } = useAuth();
  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Jennifer").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const score = 89;

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
                <h3 className="text-[14px] font-semibold tracking-tight">AI Clinical Insights</h3>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Predictive · Care-first</p>
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
              <h3 className="text-[14px] font-semibold tracking-tight">Clinical Health Score</h3>
              <p className="text-[10.5px] text-muted-foreground">Progress · Adherence · Supervision</p>
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
              <div className="rounded-lg bg-[hsl(150_70%_94%)] py-1.5 font-semibold text-[hsl(155_55%_32%)]">Prg 82</div>
              <div className="rounded-lg bg-[hsl(40_100%_94%)] py-1.5 font-semibold text-[hsl(30_80%_42%)]">Adh 94</div>
              <div className="rounded-lg bg-[hsl(265_100%_95%)] py-1.5 font-semibold text-[hsl(265_70%_50%)]">Sup 88</div>
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
                <h3 className="text-[14px] font-semibold tracking-tight">Training & Clinical Resources</h3>
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
                <h3 className="text-[14px] font-semibold tracking-tight">Recent Clinical Activity</h3>
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
              <Stethoscope className="h-3 w-3 text-[hsl(265_70%_55%)]" /> BCBA · Clinical Mission Control
            </div>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[34px]">
              {greet}, <span className="capitalize">{name}</span> <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {today} · Here's what's happening across your caseload today.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(265_100%_95%)] px-2.5 py-1 font-semibold text-[hsl(265_70%_50%)]">
                <Heart className="h-3 w-3" /> 18 active clients
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(355_100%_94%)] px-2.5 py-1 font-semibold text-[hsl(355_70%_48%)]">
                <AlertTriangle className="h-3 w-3" /> 3 progress reports due
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(40_100%_92%)] px-2.5 py-1 font-semibold text-[hsl(30_80%_42%)]">
                <Stethoscope className="h-3 w-3" /> 9.5h supervision logged
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(150_70%_92%)] px-2.5 py-1 font-semibold text-[hsl(155_55%_32%)]">
                <TrendingUp className="h-3 w-3" /> Progress +4 pts
              </span>
            </div>
          </div>

          <div className="relative w-full max-w-md shrink-0 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_14px_36px_-20px_hsl(265_60%_50%/0.35)] backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-none tracking-tight">Clinical AI Briefing</p>
                <p className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Updated 2 min ago</p>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/85">
              <span className="font-semibold">Two progress reports</span> are due this week and one client's
              <span className="font-semibold text-[hsl(355_72%_52%)]"> treatment goals show declining trends</span>. Supervision is on pace and parent training scheduled.
            </p>
            <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.55)] transition hover:opacity-95">
              Open Clinical Insights <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* KPI GRID */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h2 className="text-[15px] font-semibold tracking-tight">Clinical KPIs</h2>
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

      {/* CASELOAD + WORKFLOW STAGES */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Caseload Overview</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Sessions, supervision, plans and renewals — every client at a glance</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {["All", "Urgent", "On Track", "Declining", "GA", "TN", "NC"].map((t, i) => (
              <button key={t} className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-semibold",
                i === 0 ? "bg-foreground text-background" : "bg-foreground/[0.05] text-foreground/70 hover:bg-foreground/[0.08]"
              )}>{t}</button>
            ))}
          </div>
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
          {clients.map((l) => (
            <button key={l.name} className="group flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_hsl(265_60%_50%/0.28)]">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_70%/0.18)] to-[hsl(210_85%_75%/0.18)] text-[hsl(265_70%_45%)] font-semibold">
                {l.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-semibold leading-tight">{l.name}</p>
                  <Dot tone={l.trend} />
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{l.age} · {l.rbt}</p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">{l.auth}</p>
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

      {/* TASKS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Tasks & Clinical Workflow</h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {["All", "Reports", "Parent Trainings", "Treatment Plans", "Supervision", "QA", "Documentation"].map((t, i) => (
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
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Upload"><Upload className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Message"><MessageSquare className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Reassign"><RefreshCw className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(150_70%_92%)] text-[hsl(155_55%_35%)] hover:bg-[hsl(150_70%_88%)]" title="Quick complete"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* PROGRESS INTELLIGENCE + DOCS */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="os-card lg:col-span-2">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Client Progress Intelligence</h3>
            </div>
            <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[hsl(265_85%_62%)]" /> Communication</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[hsl(155_60%_45%)]" /> Behavior</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[hsl(35_90%_55%)]" /> Social</span>
            </div>
          </header>
          <div className="h-[220px] w-full">
            <ResponsiveContainer>
              <RLineChart data={progressTrend} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                <XAxis dataKey="wk" stroke="hsl(240 6% 55%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(240 6% 55%)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(240 10% 90%)", fontSize: 12 }} />
                <Line type="monotone" dataKey="comm"     stroke="hsl(265 85% 62%)" strokeWidth={2.25} dot={false} />
                <Line type="monotone" dataKey="behavior" stroke="hsl(155 60% 45%)" strokeWidth={2.25} dot={false} />
                <Line type="monotone" dataKey="social"   stroke="hsl(35 90% 55%)"  strokeWidth={2.25} dot={false} />
              </RLineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="rounded-xl bg-[hsl(265_100%_96%)] px-2 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Communication</p>
              <p className="mt-0.5 font-semibold text-[hsl(265_70%_50%)]">+18 pts · 8 wk</p>
            </div>
            <div className="rounded-xl bg-[hsl(150_70%_94%)] px-2 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Behavior</p>
              <p className="mt-0.5 font-semibold text-[hsl(155_55%_32%)]">+12 pts · 8 wk</p>
            </div>
            <div className="rounded-xl bg-[hsl(40_100%_94%)] px-2 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Social</p>
              <p className="mt-0.5 font-semibold text-[hsl(30_80%_42%)]">+17 pts · 8 wk</p>
            </div>
          </div>
        </section>

        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Reports & Authorizations</h3>
            </div>
            <Pill tone="warn">5 open</Pill>
          </header>
          <ul className="space-y-2.5">
            {docs.map((f) => (
              <li key={f.name} className={cn(
                "rounded-2xl border border-white/70 bg-white/70 p-3",
                f.tone === "crit" && "shadow-[inset_3px_0_0_hsl(355_75%_58%)]",
                f.tone === "warn" && "shadow-[inset_3px_0_0_hsl(35_90%_55%)]",
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl", toneBg(f.tone), toneText(f.tone))}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold leading-tight">{f.name}</p>
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
      </div>

      {/* RBT TEAM + BOTTLENECKS */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="os-card">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">RBT Supervision & Team</h3>
            </div>
            <Pill tone="ok">88% on track</Pill>
          </header>
          <ul className="space-y-3">
            {team.map((c, i) => (
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
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><Stethoscope className="mr-1 inline h-3 w-3" />Schedule</button>
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><MessageSquare className="mr-1 inline h-3 w-3" />Message</button>
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><GraduationCap className="mr-1 inline h-3 w-3" />Training</button>
          </div>
        </section>

        <section className="os-card lg:col-span-2">
          <header className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[hsl(355_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Urgent Clinical Items</h3>
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
