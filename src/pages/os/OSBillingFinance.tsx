import {
  ArrowUpRight, ArrowDownRight, Sparkles, AlertTriangle, CalendarDays, ChevronRight,
  Users, Heart, FileCheck2, GraduationCap, Activity, Clock, BadgeCheck, Brain,
  Lightbulb, AlertCircle, CheckCircle2, Radio, Flame, UserPlus, ClipboardCheck,
  BookOpen, Inbox, ArrowRight, Phone, MessageSquare, Mail, Send, FileText,
  ShieldCheck, Smile, Pause, RefreshCw, Upload, StickyNote, Headphones, Hourglass,
  CalendarClock, FileWarning, FileSignature, Building2, Stamp, ShieldAlert, TrendingUp,
  Briefcase, UserCheck, Star, Target, Sparkle, Trophy, DollarSign, Wallet, Receipt,
  Banknote, CreditCard, PiggyBank, Coins, LineChart, Calculator, Landmark, Percent,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, RadialBarChart, RadialBar,
} from "recharts";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";

type Tone = "ok" | "warn" | "crit";
type Kpi = {
  label: string; value: string; delta: string; up: boolean; status: Tone;
  hint: string; spark: number[]; icon: React.ElementType;
};

/* ============ MOCK DATA ============ */

const kpis: Kpi[] = [
  { label: "Gross Revenue MTD",       value: "$684K", delta: "+8%",  up: true,  status: "ok",   hint: "vs last month",         spark: [520,540,560,590,610,635,650,670,684], icon: DollarSign },
  { label: "Net Collections",         value: "$612K", delta: "+6%",  up: true,  status: "ok",   hint: "89.4% of billed",       spark: [470,485,500,520,540,560,580,600,612], icon: Banknote },
  { label: "Outstanding Balances",    value: "$82K",  delta: "+$9K", up: false, status: "warn", hint: "44 accounts",           spark: [60,62,66,70,72,75,78,80,82],         icon: Wallet },
  { label: "Claims Denial Rate",      value: "11.2%", delta: "+1.4%",up: false, status: "warn", hint: "Target ≤ 8%",           spark: [8,8.5,9,9.5,10,10.4,10.8,11,11.2],   icon: AlertTriangle },
  { label: "Claims Pending",          value: "186",   delta: "+12",  up: false, status: "warn", hint: "Avg age 14d",           spark: [140,148,156,164,170,176,180,184,186],icon: FileCheck2 },
  { label: "Payment Plans Active",    value: "72",    delta: "+5",   up: true,  status: "ok",   hint: "92% on schedule",       spark: [55,58,61,64,66,68,70,71,72],         icon: CreditCard },
  { label: "Avg Reimbursement Time",  value: "18d",   delta: "-2d",  up: true,  status: "ok",   hint: "Target ≤ 21d",          spark: [26,25,24,23,22,21,20,19,18],         icon: Clock },
  { label: "Client Responsibility",   value: "$41K",  delta: "+$3K", up: true,  status: "ok",   hint: "Collected MTD",         spark: [22,25,28,31,34,36,38,40,41],         icon: Receipt },
  { label: "Open Insurance Issues",   value: "23",    delta: "+4",   up: false, status: "warn", hint: "5 escalations",         spark: [12,14,16,18,19,20,21,22,23],         icon: ShieldAlert },
  { label: "Payroll Total",           value: "$312K", delta: "+2%",  up: true,  status: "ok",   hint: "Bi-weekly",             spark: [285,290,294,298,302,305,308,310,312],icon: Wallet },
  { label: "Revenue per Client",      value: "$3.4K", delta: "+$120",up: true,  status: "ok",   hint: "Trailing 30d",          spark: [3.0,3.05,3.1,3.15,3.2,3.25,3.3,3.35,3.4],icon: PiggyBank },
  { label: "Collection Rate",         value: "89.4%", delta: "+2.1%",up: true,  status: "ok",   hint: "Target ≥ 88%",          spark: [84,85,86,86.5,87,87.5,88,89,89.4],   icon: Percent },
];

const payers = [
  { name: "BCBS",        submitted: 412, denied: 28, paid: 358, delay: "16d", rate: "93%", tone: "os-tone-sky",    status: "ok"   as Tone },
  { name: "Aetna",       submitted: 286, denied: 41, paid: 218, delay: "22d", rate: "76%", tone: "os-tone-coral",  status: "crit" as Tone },
  { name: "Cigna",       submitted: 198, denied: 14, paid: 172, delay: "14d", rate: "87%", tone: "os-tone-violet", status: "ok"   as Tone },
  { name: "United",      submitted: 174, denied: 26, paid: 132, delay: "24d", rate: "76%", tone: "os-tone-amber",  status: "warn" as Tone },
  { name: "Medicaid NC", submitted: 256, denied: 12, paid: 232, delay: "12d", rate: "91%", tone: "os-tone-mint",   status: "ok"   as Tone },
  { name: "Medicaid GA", submitted: 142, denied: 22, paid: 108, delay: "26d", rate: "76%", tone: "os-tone-rose",   status: "warn" as Tone },
];

const balances = [
  { client: "Greene, T.",  amount: "$4,820", plan: "Plan · $400/mo",   payer: "Aetna · Deductible", due: "Overdue 14d",  risk: "crit" as Tone },
  { client: "Reyes, N.",   amount: "$2,640", plan: "Plan · $220/mo",   payer: "BCBS · Coinsurance", due: "Due in 3d",    risk: "warn" as Tone },
  { client: "Patel, P.",   amount: "$1,210", plan: "No plan · invoice",payer: "United · Copay",     due: "Due today",    risk: "warn" as Tone },
  { client: "Brooks, D.",  amount: "$6,140", plan: "Pending setup",    payer: "Aetna · Deductible", due: "Overdue 22d",  risk: "crit" as Tone },
  { client: "Cole, A.",    amount: "$890",   plan: "Plan · $90/mo",    payer: "Medicaid NC",        due: "On schedule",  risk: "ok"   as Tone },
  { client: "Hill, M.",    amount: "$3,420", plan: "Plan · $300/mo",   payer: "Cigna · MOOP",       due: "Due in 6d",    risk: "ok"   as Tone },
];

const tasks = [
  { kind: "Claim",      who: "Greene · Aetna",            time: "9:30 AM",  stage: "Denial appeal due",          priority: "High",   last: "Denied · 2d" },
  { kind: "PaymentPlan",who: "Brooks · setup",            time: "10:30 AM", stage: "Plan creation pending",      priority: "High",   last: "Requested · 1d" },
  { kind: "Insurance",  who: "Patel · verification",      time: "11:15 AM", stage: "VOB re-run",                 priority: "Medium", last: "Auto · 3d" },
  { kind: "Claim",      who: "United batch · 8 claims",   time: "1:00 PM",  stage: "Resubmission ready",         priority: "High",   last: "Held · 4d" },
  { kind: "Payroll",    who: "Bi-weekly · NC region",     time: "3:00 PM",  stage: "Approval before 4pm",        priority: "High",   last: "Draft ready" },
  { kind: "Insurance",  who: "Reyes · coordination",      time: "4:15 PM",  stage: "Primary vs secondary",       priority: "Medium", last: "Reply pending" },
];

const responsibility = [
  { name: "Greene, T. · Aetna",       status: "Deductible 78% met",     pct: 78, days: 0, tone: "warn" as Tone },
  { name: "Brooks, D. · Aetna",       status: "Deductible · large balance",pct: 92, days: 22, tone: "crit" as Tone },
  { name: "Patel, P. · United",       status: "Copay tracking",         pct: 45, days: 0, tone: "ok"   as Tone },
  { name: "Reyes, N. · BCBS",         status: "Coinsurance above target",pct: 65, days: 3, tone: "warn" as Tone },
  { name: "Hill, M. · Cigna",         status: "MOOP nearly reached",    pct: 88, days: 0, tone: "ok"   as Tone },
];

const activityFeed = [
  { who: "System",      what: "12 claims submitted to BCBS",         when: "8m",  tone: "os-tone-sky",    icon: Send },
  { who: "Aetna",       what: "denied 3 claims · Greene batch",      when: "22m", tone: "os-tone-coral",  icon: AlertTriangle },
  { who: "Patient · Hill", what: "payment received · $300",          when: "45m", tone: "os-tone-mint",   icon: DollarSign },
  { who: "Kaylynne",    what: "created payment plan · Reyes",        when: "1h",  tone: "os-tone-violet", icon: CreditCard },
  { who: "VOB Bot",     what: "verified insurance · 4 new clients",  when: "2h",  tone: "os-tone-amber",  icon: ShieldCheck },
  { who: "Payroll",     what: "GA bi-weekly run completed",          when: "3h",  tone: "os-tone-rose",   icon: Wallet },
];

const alerts = [
  { severity: "crit", title: "Brooks, D. — $6,140 balance overdue 22 days",  stage: "Outstanding",   owner: "Kaylynne", action: "Escalate to manager" },
  { severity: "crit", title: "Aetna denial rate up 14% week-over-week",      stage: "Claims",        owner: "Jordan",   action: "Audit denial codes" },
  { severity: "warn", title: "United reimbursement avg 24d (target 21)",     stage: "Collections",   owner: "Kaylynne", action: "Open payer escalation" },
  { severity: "warn", title: "8 claims held pending auth resubmission",      stage: "Claims",        owner: "Renee",    action: "Coordinate with auths" },
  { severity: "warn", title: "Payment plan defaults rising · GA region",     stage: "Plans",         owner: "Jordan",   action: "Run retention outreach" },
  { severity: "warn", title: "Scheduling labor cost exceeded budget 4%",     stage: "Payroll",       owner: "Daylis",   action: "Review OT report" },
];

const training = [
  { name: "EOB Workflow SOP · v4",          pct: 100, kind: "SOP",      tone: "os-tone-mint"   },
  { name: "Aetna Appeals Process",          pct: 65,  kind: "Training", tone: "os-tone-coral"  },
  { name: "Payment Plan Setup Walkthrough", pct: 45,  kind: "Walkthru", tone: "os-tone-violet" },
  { name: "VOB Re-run Procedure · v2",      pct: 82,  kind: "SOP",      tone: "os-tone-sky"    },
];

const aiInsights = [
  { icon: AlertCircle,  tone: "os-tone-coral", title: "Aetna denial rate projected to keep rising", body: "Modeled trajectory shows 13.8% denials by EOM unless code 97155 is corrected.",   cta: "View denial codes" },
  { icon: AlertTriangle,tone: "os-tone-amber", title: "High-risk balances detected",                body: "3 balances over $4K aged 14d+ — projected write-off risk $9.2K.",                cta: "Open escalations" },
  { icon: Brain,        tone: "os-tone-sky",   title: "Payment plan defaults rising · GA",          body: "GA plan default rate up 9% — recommend earlier outreach at day 5.",              cta: "Adjust workflow" },
  { icon: Lightbulb,    tone: "os-tone-lilac", title: "Revenue trend slowing in VA",                body: "VA gross revenue MTD trailing forecast by 6% — staffing gaps likely cause.",     cta: "Open VA scorecard" },
  { icon: Activity,     tone: "os-tone-mint",  title: "Collections velocity improving",             body: "NC collections cycle dropped 3.4 days this month — automation rules working.",  cta: "See trend" },
];

const today = [
  { title: "Payroll approval · NC region",     time: "8:30 – 9:00 AM",  tone: "os-tone-sky" },
  { title: "Aetna appeals batch review",       time: "10:30 – 11:15",   tone: "os-tone-coral" },
  { title: "1:1 · Brooks balance escalation",  time: "1:00 – 1:30 PM",  tone: "os-tone-rose" },
  { title: "Weekly revenue sync · Leadership", time: "3:30 – 4:00 PM",  tone: "os-tone-amber" },
];

const quickActions = [
  { label: "Create Payment Plan", icon: CreditCard,   tone: "os-tone-rose"   },
  { label: "Verify Insurance",    icon: ShieldCheck,  tone: "os-tone-sky"    },
  { label: "Submit Claim",        icon: Send,         tone: "os-tone-violet" },
  { label: "Add Financial Note",  icon: StickyNote,   tone: "os-tone-lilac"  },
  { label: "Export Report",       icon: Upload,       tone: "os-tone-mint"   },
  { label: "Escalate Balance",    icon: AlertTriangle,tone: "os-tone-amber"  },
  { label: "Open SOP",            icon: BookOpen,     tone: "os-tone-violet" },
  { label: "View Analytics",      icon: LineChart,    tone: "os-tone-coral"  },
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
          <linearGradient id={`fin-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.32} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.75} fill={`url(#fin-${tone})`} dot={false} />
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

const kindIcon: Record<string, React.ElementType> = { Claim: FileCheck2, PaymentPlan: CreditCard, Insurance: ShieldCheck, Payroll: Wallet };
const kindTone: Record<string, string> = { Claim: "os-tone-violet", PaymentPlan: "os-tone-rose", Insurance: "os-tone-sky", Payroll: "os-tone-amber" };

/* ============ PAGE ============ */

export default function OSBillingFinance() {
  const { user } = useAuth();
  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Kaylynne").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const score = 87;

  /* ────── live operational signals (real data) ────── */
  const { items: authItems, loading: authsLoading } = useLiveAuthorizations();
  const [openPayrollIssues, setOpenPayrollIssues] = useState<number | null>(null);
  const [openPayrollRuns, setOpenPayrollRuns] = useState<number | null>(null);
  const [pendingAdjustments, setPendingAdjustments] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [issues, runs, adj] = await Promise.all([
        supabase.from("payroll_issues").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"] as never[]),
        supabase.from("payroll_runs").select("id", { count: "exact", head: true }).in("status", ["draft", "in_review", "ready"] as never[]),
        supabase.from("payroll_adjustments").select("id", { count: "exact", head: true }).in("status", ["pending", "submitted"] as never[]),
      ]);
      if (cancelled) return;
      setOpenPayrollIssues(issues.count ?? 0);
      setOpenPayrollRuns(runs.count ?? 0);
      setPendingAdjustments(adj.count ?? 0);
    })();
    return () => { cancelled = true; };
  }, []);

  const liveDenials = authItems.filter((a) => a.stage === "Denied").length;
  const liveExpiring = authItems.filter((a) => a.stage === "Expiring Soon").length;
  const liveApproved = authItems.filter((a) => a.stage === "Approved").length;
  const liveInQa = authItems.filter((a) => a.stage === "In QA Review").length;

  const liveSignals: { label: string; value: string; tone: Tone; hint: string }[] = [
    { label: "Denied authorizations",  value: authsLoading ? "…" : String(liveDenials),  tone: liveDenials > 20 ? "crit" : "warn", hint: "Affects reimbursement" },
    { label: "Expiring soon",          value: authsLoading ? "…" : String(liveExpiring), tone: liveExpiring > 0 ? "warn" : "ok",   hint: "Reauth pipeline" },
    { label: "Approved auths",         value: authsLoading ? "…" : String(liveApproved), tone: "ok",                                hint: "Billable coverage" },
    { label: "In QA review",           value: authsLoading ? "…" : String(liveInQa),     tone: "warn" as Tone,                       hint: "Pre-submission" },
    { label: "Open payroll issues",    value: openPayrollIssues == null ? "…" : String(openPayrollIssues), tone: (openPayrollIssues ?? 0) > 0 ? "warn" : "ok", hint: "Needs resolution" },
    { label: "Payroll runs in flight", value: openPayrollRuns == null ? "…" : String(openPayrollRuns),   tone: "ok" as Tone,                              hint: "Awaiting finalization" },
    { label: "Pending adjustments",    value: pendingAdjustments == null ? "…" : String(pendingAdjustments), tone: (pendingAdjustments ?? 0) > 0 ? "warn" : "ok", hint: "Bonuses / corrections" },
  ];

  return (
    <OSShell
      rightRail={
        <>
          {/* AI FINANCE INSIGHTS */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.28)] to-transparent blur-2xl" />
            <header className="mb-3 flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                <Brain className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold tracking-tight">AI Finance Insights</h3>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Predictive · Reimbursement</p>
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

          {/* FINANCE SCORE */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(155_70%_70%/0.25)] to-transparent blur-2xl" />
            <header className="mb-2">
              <h3 className="text-[14px] font-semibold tracking-tight">Financial Health Score</h3>
              <p className="text-[10.5px] text-muted-foreground">Collections · Denials · Aging</p>
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
              <div className="rounded-lg bg-[hsl(150_70%_94%)] py-1.5 font-semibold text-[hsl(155_55%_32%)]">Col 89</div>
              <div className="rounded-lg bg-[hsl(40_100%_94%)] py-1.5 font-semibold text-[hsl(30_80%_42%)]">Den 11</div>
              <div className="rounded-lg bg-[hsl(265_100%_95%)] py-1.5 font-semibold text-[hsl(265_70%_50%)]">Age 18d</div>
            </div>
          </section>

          {/* TODAY */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold tracking-tight">Today</h3>
              <span className="text-[11px] text-muted-foreground">{todayLabel}</span>
            </header>
            <ul className="space-y-3">
              {today.map((m) => (
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

          {/* TRAINING & SOP */}
          <section className="os-card">
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
                <h3 className="text-[14px] font-semibold tracking-tight">Training & SOPs</h3>
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
                <h3 className="text-[14px] font-semibold tracking-tight">Recent Billing Activity</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[hsl(155_55%_38%)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(155_60%_50%)]" /> Live
              </span>
            </header>
            <ul className="space-y-3">
              {activityFeed.map((a, i) => (
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
              <Landmark className="h-3 w-3 text-[hsl(265_70%_55%)]" /> Billing & Finance · Mission Control
            </div>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[34px]">
              {greet}, <span className="capitalize">{name}</span> <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {todayLabel} · Here's what's happening across Billing & Finance today.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(150_70%_92%)] px-2.5 py-1 font-semibold text-[hsl(155_55%_32%)]">
                <DollarSign className="h-3 w-3" /> $684K gross MTD
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(355_100%_94%)] px-2.5 py-1 font-semibold text-[hsl(355_70%_48%)]">
                <Wallet className="h-3 w-3" /> $82K outstanding
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(40_100%_92%)] px-2.5 py-1 font-semibold text-[hsl(30_80%_42%)]">
                <AlertTriangle className="h-3 w-3" /> 23 claims at risk
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(265_100%_95%)] px-2.5 py-1 font-semibold text-[hsl(265_70%_50%)]">
                <TrendingUp className="h-3 w-3" /> 89% collection rate
              </span>
            </div>
          </div>

          {/* AI Finance Briefing */}
          <div className="relative w-full max-w-md shrink-0 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_14px_36px_-20px_hsl(265_60%_50%/0.35)] backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-none tracking-tight">Finance AI Briefing</p>
                <p className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Updated 2 min ago</p>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/85">
              <span className="font-semibold text-[hsl(355_70%_52%)]">Claims denial rate</span> increased 6% this week. Payment plan
              collections improved, however <span className="font-semibold">4 large balances</span> require review.
            </p>
            <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_24px_-12px_hsl(265_85%_60%/0.55)] transition hover:opacity-95">
              Open Financial Insights <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* KPI GRID */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h2 className="text-[15px] font-semibold tracking-tight">Revenue & Billing KPIs</h2>
            <Pill tone="default">{kpis.length} metrics</Pill>
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[hsl(40_100%_92%)] px-2 py-0.5 text-[10px] font-semibold text-[hsl(30_80%_42%)]">
              Sample — claims/payer data not yet imported
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">MTD</button>
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">QTD</button>
            <button className="os-glass-input rounded-xl px-3 py-1.5 text-[11.5px] font-medium">YTD</button>
          </div>
        </div>

        {/* LIVE OPERATIONAL SIGNALS — real data */}
        <div className="mb-4 rounded-3xl border border-white/70 bg-gradient-to-br from-[hsl(150_70%_98%)] via-white to-[hsl(220_100%_99%)] p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(150_70%_92%)] px-2 py-0.5 text-[10px] font-semibold text-[hsl(155_55%_32%)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(155_60%_50%)]" /> Live
            </span>
            <h3 className="text-[13px] font-semibold tracking-tight">Live Operational Signals</h3>
            <span className="text-[10.5px] text-muted-foreground">Real data from authorizations & payroll</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {liveSignals.map((s) => (
              <div key={s.label} className={cn("rounded-2xl border border-white/70 bg-white/80 p-3", toneGlow(s.tone))}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{s.label}</p>
                <p className={cn("mt-1 text-[22px] font-semibold tabular-nums leading-none", toneText(s.tone))}>{s.value}</p>
                <p className="mt-1 text-[10.5px] text-muted-foreground">{s.hint}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kpis.map((k) => <KpiCard key={k.label} k={k} />)}
        </div>
      </section>

      {/* CLAIMS & INSURANCE INTELLIGENCE */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Claims & Insurance Intelligence</h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Payer performance, denial trends, and reimbursement delays</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Pill tone="crit">1 escalation</Pill>
            <Pill tone="warn">2 watch</Pill>
          </div>
        </header>
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-3 px-1">
            {payers.map((p) => (
              <div key={p.name} className={cn(
                "w-[210px] shrink-0 rounded-2xl border border-white/70 bg-white/70 p-3.5",
                p.status === "crit" && "shadow-[inset_3px_0_0_hsl(355_75%_58%)]",
                p.status === "warn" && "shadow-[inset_3px_0_0_hsl(35_90%_55%)]",
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("grid h-8 w-8 place-items-center rounded-xl", p.tone)}>
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <p className="text-[12.5px] font-semibold leading-tight">{p.name}</p>
                  </div>
                  <Dot tone={p.status} />
                </div>
                <p className="mt-3 text-[20px] font-semibold tabular-nums leading-none">{p.rate}</p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">Paid rate · Avg {p.delay}</p>
                <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[10px]">
                  <div className="rounded-lg bg-foreground/[0.04] py-1 font-semibold">{p.submitted}<span className="ml-1 text-muted-foreground font-normal">sub</span></div>
                  <div className="rounded-lg bg-[hsl(150_70%_94%)] py-1 font-semibold text-[hsl(155_55%_32%)]">{p.paid}<span className="ml-1 font-normal">paid</span></div>
                  <div className="rounded-lg bg-[hsl(355_100%_94%)] py-1 font-semibold text-[hsl(355_70%_48%)]">{p.denied}<span className="ml-1 font-normal">den</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUTSTANDING BALANCES & PAYMENT PLANS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Outstanding Balances & Payment Plans</h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {["All", "Overdue", "Plans", "No Plan", "High Risk"].map((t, i) => (
              <button key={t} className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-semibold",
                i === 0 ? "bg-foreground text-background" : "bg-foreground/[0.05] text-foreground/70 hover:bg-foreground/[0.08]"
              )}>{t}</button>
            ))}
          </div>
        </header>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {balances.map((b) => (
            <button key={b.client} className="group flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_hsl(265_60%_50%/0.28)]">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_70%/0.18)] to-[hsl(210_85%_75%/0.18)] text-[hsl(265_70%_45%)] font-semibold">
                {b.client.split(",")[0][0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-semibold leading-tight">{b.client}</p>
                  <Dot tone={b.risk} />
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{b.payer} · {b.plan}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-foreground text-background px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums">{b.amount}</span>
                  <span className="text-[10.5px] text-muted-foreground">{b.due}</span>
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
            <h3 className="text-[15px] font-semibold tracking-tight">Tasks & Finance Workflow Hub</h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {["All", "Claims", "Plans", "Balances", "Insurance", "Payroll", "Escalations"].map((t, i) => (
              <button key={t} className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-semibold",
                i === 0 ? "bg-foreground text-background" : "bg-foreground/[0.05] text-foreground/70 hover:bg-foreground/[0.08]"
              )}>{t}</button>
            ))}
          </div>
        </header>
        <ul className="divide-y divide-foreground/[0.06]">
          {tasks.map((f) => {
            const Icon = kindIcon[f.kind] ?? FileCheck2;
            const prio = f.priority === "High" ? "high" : f.priority === "Medium" ? "med" : "low";
            return (
              <li key={f.who + f.time} className="group flex items-center gap-3 py-3">
                <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", kindTone[f.kind] ?? "os-tone-sky")}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold leading-tight">{f.who}</p>
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground">{f.stage} · Last: {f.last} · {f.time}</p>
                </div>
                <Pill tone={prio as any}>{f.priority}</Pill>
                <div className="ml-1 hidden items-center gap-1 md:flex">
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Note"><StickyNote className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Message"><MessageSquare className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Reassign"><RefreshCw className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.08]" title="Escalate"><AlertTriangle className="h-3.5 w-3.5" /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(150_70%_92%)] text-[hsl(155_55%_35%)] hover:bg-[hsl(150_70%_88%)]" title="Complete"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* CLIENT RESPONSIBILITY + PAYROLL */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="os-card lg:col-span-2">
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Client Financial Responsibility</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <Pill tone="warn">2 above target</Pill>
              <Pill tone="crit">1 escalated</Pill>
            </div>
          </header>
          <ul className="space-y-2.5">
            {responsibility.map((f) => (
              <li key={f.name} className={cn(
                "rounded-2xl border border-white/70 bg-white/70 p-3.5",
                f.tone === "crit" && "shadow-[inset_3px_0_0_hsl(355_75%_58%)]",
                f.tone === "warn" && "shadow-[inset_3px_0_0_hsl(35_90%_55%)]",
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", toneBg(f.tone), toneText(f.tone))}>
                    <Percent className="h-4 w-4" />
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
              <Wallet className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[15px] font-semibold tracking-tight">Payroll & Costs</h3>
            </div>
            <Pill tone="ok">on track</Pill>
          </header>
          <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-white via-[hsl(265_100%_99%)] to-white p-3.5">
            <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Bi-weekly payroll</p>
            <p className="mt-1 text-[26px] font-semibold tabular-nums leading-none">$312K</p>
            <p className="mt-1 text-[10.5px] text-muted-foreground">+2% vs prior · 248 employees</p>
          </div>
          <ul className="mt-3 space-y-2.5">
            {[
              { dept: "Clinical · BCBA",     val: "$118K", pct: 38, tone: "os-tone-violet" },
              { dept: "Direct Care · RBT",   val: "$142K", pct: 46, tone: "os-tone-sky"    },
              { dept: "Scheduling",          val: "$18K",  pct: 6,  tone: "os-tone-amber"  },
              { dept: "Operations & Admin",  val: "$34K",  pct: 10, tone: "os-tone-rose"   },
            ].map((r) => (
              <li key={r.dept}>
                <div className="flex items-center justify-between text-[11.5px]">
                  <div className="flex items-center gap-2">
                    <div className={cn("grid h-6 w-6 place-items-center rounded-lg", r.tone)}>
                      <Building2 className="h-3 w-3" />
                    </div>
                    <span className="font-semibold">{r.dept}</span>
                  </div>
                  <span className="tabular-nums text-muted-foreground">{r.val}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)]" style={{ width: `${r.pct * 2}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><Upload className="mr-1 inline h-3 w-3" />Export</button>
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><Calculator className="mr-1 inline h-3 w-3" />Run</button>
            <button className="rounded-xl bg-foreground/[0.05] py-1.5 text-[11px] font-semibold hover:bg-foreground/[0.08]"><RefreshCw className="mr-1 inline h-3 w-3" />Sync</button>
          </div>
        </section>
      </div>

      {/* FINANCIAL RISK & ALERTS */}
      <section className="os-card">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-[hsl(355_70%_55%)]" />
            <h3 className="text-[15px] font-semibold tracking-tight">Financial Risk & Alerts</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <Pill tone="crit">2 critical</Pill>
            <Pill tone="warn">4 watch</Pill>
          </div>
        </header>
        <ul className="space-y-2">
          {alerts.map((b) => (
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
