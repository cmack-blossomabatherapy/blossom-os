import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, Flame, ArrowRight, Sparkles, Activity, Users, UserPlus,
  CalendarDays, FileCheck2, ClipboardCheck, MessageSquare, Bot, MapPin,
  Zap, ShieldAlert, Clock, CheckCircle2, ChevronRight, Hash, Radio,
  TrendingUp, PhoneCall, FileText, UserCog, Building2, Inbox, ListChecks,
  PlusCircle, Send, Search, Command,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRole } from "@/contexts/OSRoleContext";
import { cn } from "@/lib/utils";
import { useStateOps } from "@/hooks/useStateOps";
import { weeklySeries, quickStats } from "@/lib/analytics/stateOps";
import { HoursVsClientsChart } from "@/components/state-director/HoursVsClientsChart";

/* ---------- design atoms ---------- */

const STATE_NAMES: Record<string, string> = {
  NC: "North Carolina", GA: "Georgia", VA: "Virginia", TN: "Tennessee", MD: "Maryland",
};

const REGIONS_BY_STATE: Record<string, string[]> = {
  NC: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Wilmington"],
  GA: ["Atlanta", "Savannah", "Augusta", "Columbus", "Athens"],
  VA: ["Richmond", "Norfolk", "Arlington", "Roanoke", "Charlottesville"],
  TN: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville"],
  MD: ["Baltimore", "Bethesda", "Annapolis", "Frederick", "Rockville"],
};

type Urgency = "critical" | "high" | "watch";

function urgencyTone(u: Urgency) {
  if (u === "critical")
    return {
      dot: "bg-[hsl(355_75%_55%)]",
      pill: "bg-[hsl(355_100%_95%)] text-[hsl(355_72%_48%)]",
      glow: "shadow-[0_0_0_1px_hsl(355_75%_70%/0.30),0_20px_50px_-26px_hsl(355_72%_55%/0.45)]",
      label: "Critical",
    };
  if (u === "high")
    return {
      dot: "bg-[hsl(30_90%_55%)]",
      pill: "bg-[hsl(30_100%_94%)] text-[hsl(28_85%_42%)]",
      glow: "shadow-[0_0_0_1px_hsl(30_90%_70%/0.28),0_20px_50px_-26px_hsl(28_85%_50%/0.40)]",
      label: "High",
    };
  return {
    dot: "bg-[hsl(220_60%_60%)]",
    pill: "bg-[hsl(220_70%_95%)] text-[hsl(220_60%_45%)]",
    glow: "shadow-[0_0_0_1px_hsl(220_60%_75%/0.28),0_18px_44px_-26px_hsl(220_60%_50%/0.35)]",
    label: "Watch",
  };
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/70 bg-white/80 backdrop-blur",
        "shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_22px_50px_-34px_hsl(220_40%_30%/0.18)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SectionHeader({ icon: Icon, title, sub, action }: {
  icon: React.ComponentType<{ className?: string }>; title: string; sub?: string; action?: React.ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-3 px-5 pt-5">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_96%)] to-white text-[hsl(265_70%_55%)] ring-1 ring-[hsl(265_60%_88%)]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-[15.5px] font-semibold tracking-tight leading-tight">{title}</h3>
          {sub && <p className="mt-0.5 text-[11.5px] text-muted-foreground leading-snug">{sub}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}

function MiniStat({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "ok" | "warn" | "bad" | "neutral" }) {
  const cls =
    tone === "ok" ? "text-[hsl(155_55%_38%)]" :
    tone === "warn" ? "text-[hsl(28_85%_45%)]" :
    tone === "bad" ? "text-[hsl(355_72%_52%)]" : "text-foreground";
  return (
    <div className="rounded-xl border border-foreground/[0.06] bg-white/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-[20px] font-semibold tracking-tight tabular-nums leading-none", cls)}>{value}</p>
    </div>
  );
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "ok" | "warn" | "bad" | "neutral" }) {
  const cls =
    tone === "ok" ? "bg-[hsl(150_70%_94%)] text-[hsl(155_55%_32%)]" :
    tone === "warn" ? "bg-[hsl(40_100%_94%)] text-[hsl(30_80%_42%)]" :
    tone === "bad" ? "bg-[hsl(355_100%_95%)] text-[hsl(355_70%_48%)]" :
    "bg-foreground/[0.05] text-foreground/70";
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold", cls)}>{children}</span>;
}

function QuickAction({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-foreground/75 transition hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-white hover:text-foreground"
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

/* ---------- mock operational data (scoped by state) ---------- */

type AttentionItem = {
  id: string; urgency: Urgency; title: string; detail: string; owner: string;
  region: string; daysOverdue?: number; impact: string;
  actions: { label: string; icon: React.ComponentType<{ className?: string }> }[];
};

function buildAttention(state: string): AttentionItem[] {
  const r = REGIONS_BY_STATE[state] ?? REGIONS_BY_STATE.NC;
  return [
    {
      id: "a1", urgency: "critical",
      title: "3 unstaffed clients · approved for services",
      detail: "Awaiting RBT assignment > 5 days. Auth clocks ticking.",
      owner: "Scheduling Team", region: r[0], daysOverdue: 5,
      impact: "Lost billable hours: ~62/wk",
      actions: [
        { label: "Open Scheduling", icon: CalendarDays },
        { label: "Escalate", icon: ShieldAlert },
        { label: "Message Team", icon: MessageSquare },
      ],
    },
    {
      id: "a2", urgency: "critical",
      title: "2 authorizations expire in 7 days",
      detail: "Treatment auths approaching cutoff without reauth packet started.",
      owner: "Auth Coordinator", region: r[1], daysOverdue: 0,
      impact: "Service interruption risk: 2 families",
      actions: [
        { label: "Open Auths", icon: FileCheck2 },
        { label: "Assign", icon: UserCog },
        { label: "Create Task", icon: PlusCircle },
      ],
    },
    {
      id: "a3", urgency: "high",
      title: "5 progress reports overdue",
      detail: "BCBA submissions past 48h SLA — 2 over 7 days.",
      owner: "BCBA Team", region: r[2], daysOverdue: 7,
      impact: "QA + billing held",
      actions: [
        { label: "Open QA Queue", icon: ClipboardCheck },
        { label: "Message BCBA", icon: MessageSquare },
        { label: "Escalate", icon: ShieldAlert },
      ],
    },
    {
      id: "a4", urgency: "high",
      title: "4 candidates stalled in onboarding",
      detail: "Background check + orientation incomplete > 10 days.",
      owner: "Recruiting", region: r[0], daysOverdue: 10,
      impact: "Pipeline pressure: 12 open client slots",
      actions: [
        { label: "Open Recruiting", icon: UserPlus },
        { label: "Message Recruiter", icon: MessageSquare },
      ],
    },
    {
      id: "a5", urgency: "watch",
      title: "BCBA overload risk — 2 caseloads > 95% capacity",
      detail: "Supervision quality at risk; coverage flexibility low.",
      owner: "State Director", region: r[3], daysOverdue: 0,
      impact: "Burnout + supervision gaps",
      actions: [
        { label: "Review Caseload", icon: Users },
        { label: "Schedule 1:1", icon: CalendarDays },
      ],
    },
    {
      id: "a6", urgency: "watch",
      title: "Scheduling conflict · 3 sessions double-booked",
      detail: "RBT calendar overlap detected for Tue–Thu.",
      owner: "Scheduling Team", region: r[4], daysOverdue: 0,
      impact: "Family experience risk",
      actions: [
        { label: "Open Scheduling", icon: CalendarDays },
        { label: "Resolve", icon: CheckCircle2 },
      ],
    },
  ];
}

type Task = { id: string; title: string; meta: string; due: string; urgency: Urgency; category: string };
const ACTION_GROUPS: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; tasks: Task[] }[] = [
  {
    id: "today", label: "Due Today", icon: Clock,
    tasks: [
      { id: "t1", title: "Follow up with BCBA — Jordan M.", meta: "Re: Overdue PR for client Liam K.", due: "By 3:00 PM", urgency: "high", category: "Follow-up" },
      { id: "t2", title: "Approve staffing — Greene household", meta: "RBT match #2 ready for sign-off", due: "By 5:00 PM", urgency: "critical", category: "Approval" },
      { id: "t3", title: "Call parent — escalated complaint", meta: "Hernandez family · scheduling dispute", due: "Today", urgency: "high", category: "Escalation" },
    ],
  },
  {
    id: "waiting", label: "Waiting on Others", icon: Inbox,
    tasks: [
      { id: "t4", title: "Reauth packet from BCBA Avery L.", meta: "Requested 2 days ago", due: "Waiting 2d", urgency: "watch", category: "BCBA" },
      { id: "t5", title: "Background check — candidate Riley P.", meta: "Vendor pending", due: "Waiting 4d", urgency: "watch", category: "Recruiting" },
    ],
  },
  {
    id: "approvals", label: "Approvals Needed", icon: CheckCircle2,
    tasks: [
      { id: "t6", title: "PTO request — RBT Casey W.", meta: "5 days · Mar 18–22", due: "Awaiting", urgency: "watch", category: "HR" },
      { id: "t7", title: "Out-of-network exception — Patel client", meta: "Insurance escalation", due: "Awaiting", urgency: "high", category: "Auth" },
    ],
  },
  {
    id: "escalations", label: "Escalations", icon: Flame,
    tasks: [
      { id: "t8", title: "Caseload imbalance — Region East", meta: "2 BCBAs > 95% utilization", due: "Open", urgency: "high", category: "Operations" },
    ],
  },
];

type BCBA = { name: string; caseload: number; supervisionPct: number; overduePRs: number; risk: Urgency; region: string };
const MOCK_BCBAS: BCBA[] = [
  { name: "Jordan Mitchell", caseload: 14, supervisionPct: 11.2, overduePRs: 2, risk: "high", region: "Region A" },
  { name: "Avery Lopez", caseload: 12, supervisionPct: 13.8, overduePRs: 0, risk: "watch", region: "Region B" },
  { name: "Samira Patel", caseload: 16, supervisionPct: 9.4, overduePRs: 3, risk: "critical", region: "Region A" },
  { name: "Marcus Greene", caseload: 10, supervisionPct: 14.1, overduePRs: 0, risk: "watch", region: "Region C" },
  { name: "Elena Ruiz", caseload: 13, supervisionPct: 12.6, overduePRs: 1, risk: "watch", region: "Region D" },
];

const RECRUITING_SNAPSHOT = [
  { label: "Active applicants", value: 28, tone: "neutral" as const },
  { label: "Interviews today", value: 4, tone: "neutral" as const },
  { label: "Onboarding pending", value: 7, tone: "warn" as const },
  { label: "Orientation scheduled", value: 3, tone: "neutral" as const },
  { label: "BCBA pipeline", value: 5, tone: "ok" as const },
  { label: "RBT pipeline", value: 23, tone: "ok" as const },
];

type Risk = { client: string; bcba: string; type: string; daysRemaining: number; urgency: Urgency };
const RISK_ITEMS: Risk[] = [
  { client: "Liam K.", bcba: "Jordan M.", type: "Auth expires", daysRemaining: 6, urgency: "critical" },
  { client: "Emma R.", bcba: "Samira P.", type: "PR overdue", daysRemaining: -7, urgency: "critical" },
  { client: "Noah S.", bcba: "Avery L.", type: "Auth expires", daysRemaining: 12, urgency: "high" },
  { client: "Olivia T.", bcba: "Elena R.", type: "97156 missing", daysRemaining: -3, urgency: "high" },
  { client: "Mia D.", bcba: "Marcus G.", type: "Supervision gap", daysRemaining: -2, urgency: "watch" },
  { client: "Ethan B.", bcba: "Samira P.", type: "Treatment plan missing", daysRemaining: 4, urgency: "high" },
];

const FEED: { id: string; icon: React.ComponentType<{ className?: string }>; text: string; meta: string; tone: "ok" | "warn" | "neutral" }[] = [
  { id: "f1", icon: CheckCircle2, text: "Client Greene staffed — RBT Casey W. assigned", meta: "2m ago · Scheduling", tone: "ok" },
  { id: "f2", icon: FileCheck2, text: "Auth approved — Patel family · 6 mo treatment", meta: "11m ago · Auth", tone: "ok" },
  { id: "f3", icon: FileText, text: "PR uploaded — BCBA Avery L. for client Noah S.", meta: "27m ago · QA", tone: "neutral" },
  { id: "f4", icon: UserPlus, text: "Candidate hired — RBT Morgan T. · start 4/02", meta: "1h ago · Recruiting", tone: "ok" },
  { id: "f5", icon: ShieldAlert, text: "Escalation created — scheduling dispute Hernandez", meta: "2h ago · Director", tone: "warn" },
  { id: "f6", icon: ClipboardCheck, text: "Orientation completed — 3 new RBTs", meta: "3h ago · Recruiting", tone: "ok" },
];

const MESSAGES = [
  { id: "m1", channel: "#state-leadership", from: "Director Ops", preview: "Reviewing Q2 staffing forecast — please confirm regional targets by EOD.", time: "9:14 AM", mentions: 1 },
  { id: "m2", channel: "#staffing", from: "Scheduling Lead", preview: "Greene match approved. Pairing email queued.", time: "8:51 AM", mentions: 0 },
  { id: "m3", channel: "DM · Recruiter", from: "Taylor B.", preview: "Two BCBA candidates onsite Thursday — need your interview slot.", time: "8:32 AM", mentions: 1 },
  { id: "m4", channel: "#escalations", from: "QA Lead", preview: "Patel PR rework needed before billing cycle.", time: "Yesterday", mentions: 0 },
];

const AI_INSIGHTS = [
  { id: "ai1", icon: TrendingUp, text: "Staffing demand increasing in Region A — 3 new approvals this week." },
  { id: "ai2", icon: AlertTriangle, text: "3 progress reports overdue > 7 days. Recommend escalation to BCBA leads." },
  { id: "ai3", icon: Activity, text: "Cancellation trend up 8% vs prior 4 weeks. Mostly Tue/Thu afternoons." },
  { id: "ai4", icon: UserPlus, text: "BCBA recruiting velocity slowing — pipeline 22% below 4w avg." },
  { id: "ai5", icon: ShieldAlert, text: "Auth utilization risk: 2 clients < 60% of approved hours this period." },
];

/* ---------- page ---------- */

export default function OSCommandCenter() {
  const { user } = useAuth();
  const { activeState, role } = useOSRole();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const stateName = STATE_NAMES[activeState] ?? activeState;
  const regions = REGIONS_BY_STATE[activeState] ?? REGIONS_BY_STATE.NC;
  const attention = useMemo(() => buildAttention(activeState), [activeState]);

  const { sessions, hasAnyData } = useStateOps(activeState, "12w");
  const series = useMemo(() => weeklySeries(sessions), [sessions]);
  const stats = useMemo(() => quickStats(sessions), [sessions]);

  const name = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Director").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const criticalCount = attention.filter((a) => a.urgency === "critical").length;
  const highCount = attention.filter((a) => a.urgency === "high").length;

  /* ---------- right rail: AI assistant ---------- */
  const rightRail = (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-[hsl(265_100%_97%)] via-white to-[hsl(285_100%_97%)] px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-white shadow-[0_8px_24px_-10px_hsl(265_85%_55%/0.7)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13.5px] font-semibold tracking-tight">AI State Insights</p>
              <p className="text-[11px] text-muted-foreground">{stateName} · live</p>
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            {AI_INSIGHTS.map((i) => (
              <div key={i.id} className="flex items-start gap-2.5 rounded-xl border border-white/70 bg-white/70 p-2.5">
                <i.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(265_70%_55%)]" />
                <p className="text-[12px] leading-snug text-foreground/85">{i.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-1.5">
            {[
              { label: "Prioritize my day", icon: ListChecks },
              { label: "Find op risks", icon: ShieldAlert },
              { label: "Summarize staffing", icon: Users },
              { label: "Action list", icon: Zap },
            ].map((b) => (
              <button key={b.label} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[hsl(265_60%_88%)] bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold text-[hsl(265_70%_50%)] transition hover:bg-white">
                <b.icon className="h-3 w-3" />
                <span className="truncate">{b.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="px-5 py-5">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-[hsl(355_72%_55%)]" />
          <p className="text-[13px] font-semibold tracking-tight">Urgent now</p>
        </div>
        <p className="mt-1 text-[11.5px] text-muted-foreground">{criticalCount} critical · {highCount} high</p>
        <div className="mt-3 space-y-2">
          {attention.filter((a) => a.urgency === "critical").map((a) => (
            <div key={a.id} className="rounded-xl bg-[hsl(355_100%_97%)] p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(355_75%_55%)]" />
                <p className="text-[12px] font-semibold leading-snug">{a.title}</p>
              </div>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">{a.owner} · {a.region}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  return (
    <OSShell rightRail={rightRail}>
      <div className="space-y-5 pb-24">
        {/* ============ HEADER ============ */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {today} · {stateName} · Command Center
            </p>
            <h1 className="mt-1 text-[26px] font-semibold tracking-tight md:text-[30px]">
              {greet}, {name}.
            </h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              Your operational workspace for {stateName}. <b className="text-foreground">{criticalCount}</b> critical {criticalCount === 1 ? "item" : "items"} · <b className="text-foreground">{highCount}</b> high-priority · {ACTION_GROUPS[0].tasks.length} due today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-foreground/70 backdrop-blur">
              <Activity className="h-3 w-3 text-[hsl(155_55%_45%)]" /> All systems live
            </span>
          </div>
        </header>

        {/* ============ COMMAND BAR ============ */}
        <Card className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 shrink-0 text-foreground/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients, staff, auths, candidates, reports…"
              className="flex-1 bg-transparent text-[13.5px] placeholder:text-foreground/40 focus:outline-none"
            />
            <div className="hidden items-center gap-1 rounded-md border border-foreground/10 bg-foreground/[0.04] px-1.5 py-0.5 text-[10.5px] font-semibold text-foreground/60 sm:flex">
              <Command className="h-3 w-3" /> K
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <QuickAction icon={UserCog} label="Staff Client" />
            <QuickAction icon={UserPlus} label="Add Candidate" />
            <QuickAction icon={ShieldAlert} label="Create Escalation" />
            <QuickAction icon={CalendarDays} label="Open Scheduling" onClick={() => navigate("/scheduling")} />
            <QuickAction icon={MessageSquare} label="Message Team" />
            <QuickAction icon={PlusCircle} label="Create Task" />
            <QuickAction icon={FileText} label="Open Reports" onClick={() => navigate("/reports")} />
          </div>
        </Card>

        {/* ============ OPERATIONAL PULSE ============ */}
        <Card>
          <SectionHeader
            icon={Activity}
            title="Operational Pulse"
            sub="Active clients vs total service hours — operational health at a glance"
            action={<Pill tone="ok">Healthy</Pill>}
          />
          <div className="grid gap-3 px-5 pt-4 sm:grid-cols-2 lg:grid-cols-5">
            <MiniStat label="Active clients" value={hasAnyData ? stats.clientsThisWeek : 47} tone="neutral" />
            <MiniStat label="Hours this week" value={hasAnyData ? stats.hoursThisWeek.toFixed(0) : 728} tone="ok" />
            <MiniStat label="Staffed %" value="86%" tone="ok" />
            <MiniStat label="Recruiting" value="28" tone="neutral" />
            <MiniStat label="Auths at risk" value={5} tone="warn" />
          </div>
          <div className="px-5 pb-5 pt-4">
            <HoursVsClientsChart data={series} />
          </div>
        </Card>

        {/* ============ ATTENTION REQUIRED ============ */}
        <Card>
          <SectionHeader
            icon={AlertTriangle}
            title="Attention Required"
            sub="The operational signals that need a decision today"
            action={<Pill tone="bad">{criticalCount} critical · {highCount} high</Pill>}
          />
          <div className="grid gap-3 px-5 pb-5 pt-4 md:grid-cols-2">
            {attention.map((a) => {
              const t = urgencyTone(a.urgency);
              const Icon = a.urgency === "critical" ? Flame : a.urgency === "high" ? AlertTriangle : Activity;
              return (
                <article
                  key={a.id}
                  className={cn(
                    "group rounded-2xl border border-white/70 bg-white/85 p-4 backdrop-blur transition hover:-translate-y-0.5",
                    t.glow,
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", t.pill)}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", t.pill)}>
                          {t.label}
                        </span>
                        <span className="text-[10.5px] text-muted-foreground">{a.region}</span>
                        {typeof a.daysOverdue === "number" && a.daysOverdue > 0 && (
                          <span className="text-[10.5px] font-semibold text-[hsl(355_72%_55%)]">· {a.daysOverdue}d overdue</span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[13.5px] font-semibold leading-snug">{a.title}</p>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">{a.detail}</p>
                      <div className="mt-2 flex items-center gap-2 text-[10.5px] text-muted-foreground">
                        <UserCog className="h-3 w-3" /> {a.owner}
                        <span>·</span>
                        <TrendingUp className="h-3 w-3" /> {a.impact}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {a.actions.map((act) => (
                          <QuickAction key={act.label} icon={act.icon} label={act.label} />
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </Card>

        {/* ============ MY ACTION QUEUE ============ */}
        <Card>
          <SectionHeader icon={ListChecks} title="My Action Queue" sub="Your daily operational workspace" />
          <div className="grid gap-4 px-5 pb-5 pt-4 md:grid-cols-2 xl:grid-cols-4">
            {ACTION_GROUPS.map((g) => (
              <div key={g.id} className="rounded-2xl border border-foreground/[0.06] bg-white/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <g.icon className="h-3.5 w-3.5 text-foreground/60" />
                    <p className="text-[12px] font-semibold tracking-tight">{g.label}</p>
                  </div>
                  <span className="rounded-full bg-foreground/[0.05] px-1.5 py-0.5 text-[10px] font-semibold text-foreground/70">{g.tasks.length}</span>
                </div>
                <div className="mt-2.5 space-y-2">
                  {g.tasks.map((t) => {
                    const tone = urgencyTone(t.urgency);
                    return (
                      <div key={t.id} className="rounded-xl border border-white/70 bg-white/90 p-2.5 transition hover:shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.category}</span>
                        </div>
                        <p className="mt-1 text-[12.5px] font-semibold leading-snug">{t.title}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{t.meta}</p>
                        <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-muted-foreground">
                          <span>{t.due}</span>
                          <button className="inline-flex items-center gap-0.5 font-semibold text-foreground/80 hover:text-foreground">
                            Open <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ============ STAFFING + BCBA OVERSIGHT ============ */}
        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <SectionHeader
              icon={Users}
              title="Staffing Control Center"
              sub="Live staffing mission control across {stateName}"
              action={<button onClick={() => navigate("/scheduling")} className="inline-flex items-center gap-0.5 text-[11.5px] font-semibold text-foreground/70 hover:text-foreground">Open <ChevronRight className="h-3 w-3" /></button>}
            />
            <div className="grid grid-cols-3 gap-3 px-5 pt-4">
              <MiniStat label="Staffed" value={32} tone="ok" />
              <MiniStat label="Partial" value={9} tone="warn" />
              <MiniStat label="Unstaffed" value={6} tone="bad" />
            </div>
            <div className="px-5 pb-5 pt-4">
              <div className="space-y-2">
                {[
                  { label: "BCBA capacity", pct: 82, tone: "warn" as const },
                  { label: "RBT capacity", pct: 71, tone: "ok" as const },
                  { label: "Urgent staffing", pct: 18, tone: "bad" as const },
                ].map((b) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="text-foreground/80">{b.label}</span>
                      <span className="tabular-nums text-foreground/60">{b.pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                      <div
                        className={cn("h-full rounded-full transition-all",
                          b.tone === "ok" && "bg-[hsl(155_60%_50%)]",
                          b.tone === "warn" && "bg-[hsl(30_90%_55%)]",
                          b.tone === "bad" && "bg-[hsl(355_75%_60%)]")}
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <QuickAction icon={CalendarDays} label="Open Scheduling" onClick={() => navigate("/scheduling")} />
                <QuickAction icon={UserPlus} label="Open Recruiting" onClick={() => navigate("/recruiting")} />
                <QuickAction icon={ShieldAlert} label="Escalate" />
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeader icon={ShieldAlert} title="BCBA Oversight" sub="Caseload, supervision, and overload signals" />
            <div className="px-5 pb-5 pt-4">
              <div className="space-y-2">
                {MOCK_BCBAS.map((b) => {
                  const tone = urgencyTone(b.risk);
                  return (
                    <div key={b.name} className="flex items-center gap-3 rounded-xl border border-foreground/[0.06] bg-white/70 p-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[hsl(265_85%_92%)] to-white text-[11px] font-bold text-[hsl(265_70%_50%)] ring-1 ring-[hsl(265_60%_88%)]">
                        {b.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-[12.5px] font-semibold">{b.name}</p>
                          <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider", tone.pill)}>{tone.label}</span>
                        </div>
                        <p className="text-[10.5px] text-muted-foreground">{b.region} · {b.caseload} clients · {b.supervisionPct}% supervision · {b.overduePRs} overdue PR</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button title="Message" className="grid h-7 w-7 place-items-center rounded-lg bg-foreground/[0.04] text-foreground/70 hover:bg-foreground/[0.08]"><MessageSquare className="h-3 w-3" /></button>
                        <button title="Open caseload" className="grid h-7 w-7 place-items-center rounded-lg bg-foreground/[0.04] text-foreground/70 hover:bg-foreground/[0.08]"><Users className="h-3 w-3" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* ============ RECRUITING + AUTH RISK ============ */}
        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <SectionHeader
              icon={UserPlus}
              title="Recruiting Snapshot"
              sub="Lightweight visibility — not an ATS"
              action={<button onClick={() => navigate("/recruiting")} className="inline-flex items-center gap-0.5 text-[11.5px] font-semibold text-foreground/70 hover:text-foreground">Open <ChevronRight className="h-3 w-3" /></button>}
            />
            <div className="grid grid-cols-2 gap-3 px-5 pb-5 pt-4 sm:grid-cols-3">
              {RECRUITING_SNAPSHOT.map((s) => (
                <MiniStat key={s.label} label={s.label} value={s.value} tone={s.tone} />
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 px-5 pb-5">
              <QuickAction icon={CalendarDays} label="Schedule Interview" />
              <QuickAction icon={UserCog} label="Review Candidate" />
              <QuickAction icon={MessageSquare} label="Message Recruiter" />
            </div>
          </Card>

          <Card>
            <SectionHeader icon={FileCheck2} title="Auth & PR Risk Center" sub="Expirations, overdue PRs, and supervision gaps" />
            <div className="px-5 pb-5 pt-4">
              <div className="divide-y divide-foreground/[0.06] rounded-xl border border-foreground/[0.06] bg-white/60">
                {RISK_ITEMS.map((r) => {
                  const t = urgencyTone(r.urgency);
                  const overdue = r.daysRemaining < 0;
                  return (
                    <div key={`${r.client}-${r.type}`} className="flex items-center gap-3 px-3 py-2.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold leading-tight">{r.client} <span className="font-normal text-muted-foreground">· {r.bcba}</span></p>
                        <p className="text-[10.5px] text-muted-foreground">{r.type}</p>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold tabular-nums", t.pill)}>
                        {overdue ? `${Math.abs(r.daysRemaining)}d overdue` : `${r.daysRemaining}d left`}
                      </span>
                      <button className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-foreground/[0.04] text-foreground/70 hover:bg-foreground/[0.08]"><ArrowRight className="h-3 w-3" /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* ============ FEED + COMMUNICATION ============ */}
        <div className="grid gap-5 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <SectionHeader icon={Radio} title="Live Operations Feed" sub="Everything that moved in your state" />
            <div className="px-5 pb-5 pt-4">
              <div className="space-y-2">
                {FEED.map((f) => (
                  <div key={f.id} className="flex items-start gap-3 rounded-xl border border-foreground/[0.06] bg-white/70 p-3">
                    <div className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                      f.tone === "ok" && "bg-[hsl(150_70%_94%)] text-[hsl(155_55%_38%)]",
                      f.tone === "warn" && "bg-[hsl(30_100%_94%)] text-[hsl(28_85%_42%)]",
                      f.tone === "neutral" && "bg-foreground/[0.05] text-foreground/70",
                    )}>
                      <f.icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold leading-snug">{f.text}</p>
                      <p className="mt-0.5 text-[10.5px] text-muted-foreground">{f.meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="xl:col-span-2">
            <SectionHeader icon={MessageSquare} title="Communication" sub="State channels & mentions" />
            <div className="space-y-2 px-5 pb-3 pt-4">
              {MESSAGES.map((m) => (
                <div key={m.id} className="rounded-xl border border-foreground/[0.06] bg-white/70 p-3 transition hover:shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[hsl(265_70%_50%)]">
                      {m.channel.startsWith("#") ? <Hash className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                      <span className="truncate">{m.channel}</span>
                    </div>
                    <span className="shrink-0 text-[10.5px] text-muted-foreground">{m.time}</span>
                  </div>
                  <p className="mt-1 text-[12px] font-semibold leading-snug">{m.from}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11.5px] text-muted-foreground">{m.preview}</p>
                  {m.mentions > 0 && (
                    <div className="mt-1.5">
                      <Pill tone="warn">@you · {m.mentions}</Pill>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-foreground/[0.06] px-5 py-3">
              <input placeholder="Reply or start a message…" className="flex-1 rounded-lg border border-foreground/[0.08] bg-white/70 px-3 py-1.5 text-[12px] placeholder:text-foreground/40 focus:outline-none" />
              <button className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-white"><Send className="h-3 w-3" /></button>
            </div>
          </Card>
        </div>

        {/* ============ STATE SNAPSHOT ============ */}
        <Card>
          <SectionHeader icon={MapPin} title={`${stateName} Region Snapshot`} sub="Operational health by region" />
          <div className="grid gap-3 px-5 pb-5 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {regions.map((r, idx) => {
              const risk = idx === 0 ? "high" : idx === 2 ? "watch" : "ok";
              const tone = risk === "ok" ? "ok" : risk === "watch" ? "warn" : "bad";
              return (
                <div key={r} className="rounded-2xl border border-foreground/[0.06] bg-white/70 p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold tracking-tight">{r}</p>
                    <Pill tone={tone as any}>{risk === "ok" ? "Healthy" : risk === "watch" ? "Watch" : "Risk"}</Pill>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
                    <div><p className="text-muted-foreground">Clients</p><p className="font-semibold tabular-nums">{12 + idx * 3}</p></div>
                    <div><p className="text-muted-foreground">Staffing</p><p className="font-semibold tabular-nums">{72 + idx * 4}%</p></div>
                    <div><p className="text-muted-foreground">Recruiting</p><p className="font-semibold tabular-nums">{5 + idx}</p></div>
                    <div><p className="text-muted-foreground">Sessions</p><p className="font-semibold tabular-nums">{82 + idx * 2}%</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          <Sparkles className="mr-1 inline h-3 w-3" /> One operational workspace · {stateName} · {role.replace(/_/g, " ")}
        </p>
      </div>

      {/* ============ FLOATING QUICK ACTION BAR ============ */}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-30 hidden -translate-x-1/2 md:block">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/70 bg-white/90 px-2 py-2 shadow-[0_18px_40px_-18px_hsl(220_40%_30%/0.3)] backdrop-blur">
          {[
            { icon: UserCog, label: "Staff" },
            { icon: UserPlus, label: "Candidate" },
            { icon: ShieldAlert, label: "Escalate" },
            { icon: CalendarDays, label: "Schedule", onClick: () => navigate("/scheduling") },
            { icon: MessageSquare, label: "Message" },
            { icon: PlusCircle, label: "Task" },
            { icon: FileText, label: "Reports", onClick: () => navigate("/reports") },
            { icon: Bot, label: "Ask AI" },
          ].map((b) => (
            <button
              key={b.label}
              onClick={b.onClick}
              className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold text-foreground/75 transition hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <b.icon className="h-3.5 w-3.5" />
              <span>{b.label}</span>
            </button>
          ))}
        </div>
      </div>
    </OSShell>
  );
}