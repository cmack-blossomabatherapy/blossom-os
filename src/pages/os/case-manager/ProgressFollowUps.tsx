import { useState } from "react";
import {
  Activity, Heart, MessageSquare, AlertTriangle, Flame, Sparkles,
  ChevronRight, Search, Filter, Clock, Bot, Bell, CalendarClock,
  CheckCircle2, ArrowUpRight, Send, PhoneCall, Mail, Users, ShieldAlert,
  LineChart, Smile, Inbox, PauseCircle, UserCog, BookOpen, HeartHandshake,
  Timer, RefreshCcw,
} from "lucide-react";

/**
 * Case Manager → Family Relationships → Progress & Follow-Ups
 * Calm operational continuity + relationship follow-through center.
 * All data placeholder. Mobile-first. Future-ready.
 */

type Tone = "warm" | "cool" | "calm" | "amber" | "alert" | "violet";

const PILL: Record<Tone, string> = {
  warm:   "bg-[hsl(330_100%_96%)] text-[hsl(330_60%_45%)] border-[hsl(330_85%_90%)]",
  cool:   "bg-[hsl(210_100%_96%)] text-[hsl(210_70%_42%)] border-[hsl(210_85%_88%)]",
  calm:   "bg-[hsl(160_50%_94%)] text-[hsl(165_55%_32%)] border-[hsl(160_50%_85%)]",
  amber:  "bg-[hsl(38_100%_94%)] text-[hsl(28_85%_40%)] border-[hsl(38_85%_85%)]",
  alert:  "bg-[hsl(10_85%_96%)] text-[hsl(10_75%_45%)] border-[hsl(10_85%_88%)]",
  violet: "bg-[hsl(265_100%_97%)] text-[hsl(265_60%_50%)] border-[hsl(265_85%_90%)]",
};

const AVATAR: Record<Tone, string> = {
  warm:   "bg-gradient-to-br from-[hsl(330_100%_94%)] to-[hsl(20_100%_94%)] text-[hsl(330_60%_45%)]",
  cool:   "bg-gradient-to-br from-[hsl(210_100%_94%)] to-[hsl(195_100%_94%)] text-[hsl(210_70%_42%)]",
  calm:   "bg-gradient-to-br from-[hsl(160_60%_92%)] to-[hsl(180_60%_93%)] text-[hsl(165_55%_32%)]",
  amber:  "bg-gradient-to-br from-[hsl(40_100%_92%)] to-[hsl(28_100%_93%)] text-[hsl(28_85%_40%)]",
  alert:  "bg-gradient-to-br from-[hsl(15_100%_93%)] to-[hsl(0_100%_94%)] text-[hsl(10_75%_45%)]",
  violet: "bg-gradient-to-br from-[hsl(265_100%_94%)] to-[hsl(285_100%_94%)] text-[hsl(265_60%_50%)]",
};

function Pill({ tone, children, icon: Icon }: { tone: Tone; children: React.ReactNode; icon?: typeof Heart }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${PILL[tone]}`}>
      {Icon && <Icon className="h-2.5 w-2.5" strokeWidth={2} />}
      {children}
    </span>
  );
}


function SectionHeader({ title, hint, action }: { title: string; hint?: string; action?: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[16px] font-semibold tracking-tight text-foreground">{title}</h2>
        {hint && <p className="mt-0.5 text-[12px] text-muted-foreground">{hint}</p>}
      </div>
      {action && (
        <button className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-foreground/80 backdrop-blur transition hover:border-[hsl(330_80%_85%)] hover:text-[hsl(330_60%_45%)]">
          {action} <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ---------------- placeholder data ---------------- */

type FollowUp = {
  id: string; initials: string; child: string; family: string; avatar: Tone;
  type: string;
  category: { label: string; tone: Tone };
  priority: { label: string; tone: Tone };
  summary: string;
  due: string;
  lastComm: string;
  status: { label: string; tone: Tone; icon: typeof Heart };
  relationship: { label: string; tone: Tone };
};

const FOLLOWUPS: FollowUp[] = [
  {
    id: "u1", initials: "LM", child: "Liam", family: "Maria", avatar: "warm",
    type: "Parent callback",
    category: { label: "Communication",  tone: "cool"  },
    priority: { label: "Today",          tone: "amber" },
    summary: "Follow-up needed after schedule disruption — parent expecting a call.",
    due: "Today · 3:00pm",
    lastComm: "2 days ago",
    status: { label: "Due today", tone: "amber", icon: Clock },
    relationship: { label: "Watch", tone: "amber" },
  },
  {
    id: "u2", initials: "AV", child: "Ava", family: "Jasmine", avatar: "cool",
    type: "Staffing update",
    category: { label: "Staffing",       tone: "violet" },
    priority: { label: "This week",      tone: "cool"   },
    summary: "Parent requested update regarding RBT consistency for the coming month.",
    due: "Thu",
    lastComm: "Yesterday",
    status: { label: "Awaiting parent", tone: "cool", icon: MessageSquare },
    relationship: { label: "Stable", tone: "calm" },
  },
  {
    id: "u3", initials: "NO", child: "Noah", family: "Daniel", avatar: "alert",
    type: "Authorization clarification",
    category: { label: "Authorizations", tone: "alert"  },
    priority: { label: "Overdue",        tone: "alert"  },
    summary: "Authorization delay requires family update — leadership reviewing.",
    due: "Overdue · 1d",
    lastComm: "3 days ago",
    status: { label: "Escalated", tone: "alert", icon: Flame },
    relationship: { label: "At risk", tone: "alert" },
  },
  {
    id: "u4", initials: "MI", child: "Mia", family: "Sara", avatar: "calm",
    type: "Schedule adjustment review",
    category: { label: "Scheduling",     tone: "amber"  },
    priority: { label: "This week",      tone: "cool"   },
    summary: "Confirm new afternoon availability and share warm summary with family.",
    due: "Fri",
    lastComm: "4 days ago",
    status: { label: "Internal coord. pending", tone: "violet", icon: RefreshCcw },
    relationship: { label: "Stable", tone: "calm" },
  },
  {
    id: "u5", initials: "ZN", child: "Zoe", family: "Nina", avatar: "warm",
    type: "Service pause check-in",
    category: { label: "Service continuity", tone: "violet" },
    priority: { label: "Tomorrow",       tone: "amber"  },
    summary: "Warm check-in while services remain on pause — maintain relationship trust.",
    due: "Tomorrow",
    lastComm: "1 week ago",
    status: { label: "Due soon", tone: "amber", icon: PauseCircle },
    relationship: { label: "Watch", tone: "amber" },
  },
  {
    id: "u6", initials: "EL", child: "Eli", family: "Renee", avatar: "violet",
    type: "BCBA coordination",
    category: { label: "Coordination",   tone: "violet" },
    priority: { label: "Next week",      tone: "calm"   },
    summary: "Loop back after BCBA discussion — confirm next steps with parent.",
    due: "Next Mon",
    lastComm: "Today",
    status: { label: "Relationship stable", tone: "calm", icon: CheckCircle2 },
    relationship: { label: "Stable", tone: "calm" },
  },
];

const PROGRESS_FAMILIES = [
  { initials: "LM", child: "Liam", parent: "Maria",   avatar: "warm"   as Tone, comm: "Steady",     rel: "Watch",  responsive: "Healthy",  trend: "Improving" },
  { initials: "AV", child: "Ava",  parent: "Jasmine", avatar: "cool"   as Tone, comm: "Consistent", rel: "Stable", responsive: "Strong",   trend: "Stable" },
  { initials: "NO", child: "Noah", parent: "Daniel",  avatar: "alert"  as Tone, comm: "Gaps",       rel: "At risk",responsive: "Slowing",  trend: "Needs care" },
  { initials: "MI", child: "Mia",  parent: "Sara",    avatar: "calm"   as Tone, comm: "Consistent", rel: "Stable", responsive: "Strong",   trend: "Stable" },
  { initials: "EL", child: "Eli",  parent: "Renee",   avatar: "violet" as Tone, comm: "Recovering", rel: "Watch",  responsive: "Healthy",  trend: "Improving" },
];

const OPEN_CONCERNS = [
  { icon: UserCog,       title: "Staffing instability",     desc: "2 families experiencing team changes.",  tone: "violet" as Tone, count: 2 },
  { icon: CalendarClock, title: "Scheduling disruptions",   desc: "Repeated changes across 2 caseloads.",   tone: "amber"  as Tone, count: 2 },
  { icon: ShieldAlert,   title: "Authorization delays",     desc: "1 active delay — leadership notified.",  tone: "alert"  as Tone, count: 1 },
  { icon: PauseCircle,   title: "Service interruptions",    desc: "1 service paused — warm contact open.",  tone: "warm"   as Tone, count: 1 },
  { icon: AlertTriangle, title: "Unresolved parent concerns", desc: "3 concerns past gentle threshold.",     tone: "alert"  as Tone, count: 3 },
  { icon: PhoneCall,     title: "Repeated outreach attempts", desc: "2 families reaching out more than usual.", tone: "amber" as Tone, count: 2 },
];

const COMM_CONTINUITY = [
  { initials: "ZN", family: "Nina · Zoe",     last: "1 week ago", tone: "warm"   as Tone, status: "Outreach due" },
  { initials: "NO", family: "Daniel · Noah",  last: "3 days ago", tone: "alert"  as Tone, status: "Escalation in flight" },
  { initials: "LM", family: "Maria · Liam",   last: "2 days ago", tone: "amber"  as Tone, status: "Callback today" },
  { initials: "MI", family: "Sara · Mia",     last: "4 days ago", tone: "calm"   as Tone, status: "Cadence healthy" },
  { initials: "EL", family: "Renee · Eli",    last: "Today",      tone: "violet" as Tone, status: "Recently re-engaged" },
];

const ESCALATIONS = [
  { icon: Flame,         title: "Authorization delay · Noah", desc: "Family awaiting leadership update.",        tone: "alert"  as Tone, owner: "Ops Leadership", age: "3d" },
  { icon: AlertTriangle, title: "Recurring staffing · Eli",   desc: "Repeated transitions — needs context.",     tone: "amber"  as Tone, owner: "BCBA + CM",       age: "5d" },
  { icon: ShieldAlert,   title: "Service pause · Zoe",        desc: "Maintaining warm contact while paused.",    tone: "violet" as Tone, owner: "Case Manager",    age: "7d" },
];

const QUICK_ACTIONS = [
  { icon: Bell,          label: "Log follow-up" },
  { icon: AlertTriangle, label: "Review concerns" },
  { icon: PhoneCall,     label: "Contact parent" },
  { icon: Flame,         label: "Escalate concern" },
  { icon: Users,         label: "Assigned families" },
  { icon: BookOpen,      label: "Service issues" },
  { icon: Bot,           label: "Operational Insights" },
];

const AI_SUGGESTIONS = [
  "Summarize my unresolved follow-ups",
  "Identify families with stalled communication",
  "Suggest outreach priorities for today",
  "Surface follow-ups likely to escalate this week",
  "Prepare a calm summary for leadership review",
];

const FUTURE = [
  { icon: Sparkles,    title: "AI follow-up prioritization",   desc: "The right follow-ups, surfaced at the right time." },
  { icon: Heart,       title: "Relationship continuity scores", desc: "A calm signal for relationship health." },
  { icon: Smile,       title: "Parent engagement tracking",     desc: "Gentle visibility into family engagement." },
  { icon: ShieldAlert, title: "Predictive escalation alerts",   desc: "Early signals before situations escalate." },
  { icon: Activity,    title: "Service stability monitoring",   desc: "Awareness of fragile service continuity." },
  { icon: LineChart,   title: "Communication trend intelligence", desc: "Patterns of communication over time." },
];

/* ---------------- page ---------------- */

export default function CMProgressFollowUpsPage() {
  const [filter, setFilter] = useState<"All" | "Today" | "This week" | "Overdue">("All");

  return (
    <div className="relative min-h-full bg-gradient-to-b from-[hsl(210_50%_99%)] via-background to-[hsl(330_60%_99%)] pb-28 md:pb-12">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[hsl(210_100%_92%)] opacity-50 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[hsl(330_100%_94%)] opacity-50 blur-3xl" />
        <div className="absolute left-1/3 top-44 h-64 w-64 rounded-full bg-[hsl(265_100%_95%)] opacity-40 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-6 md:px-8 md:pt-10">
        {/* 1. HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-white/70 p-6 backdrop-blur-xl md:p-9">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/60 via-white/30 to-[hsl(210_100%_97%)]/60" />
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(210_85%_88%)] bg-[hsl(210_100%_97%)] px-2.5 py-1 text-[11px] font-medium text-[hsl(210_70%_42%)]">
                <Activity className="h-3 w-3" strokeWidth={2.25} /> Family Relationships
              </div>
              <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-foreground md:text-[32px]">
                Progress & Follow-Ups
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                Keep communication moving, concerns resolved, and family support consistent.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="amber"  icon={Clock}>6 follow-ups open</Pill>
              <Pill tone="cool"   icon={MessageSquare}>3 parent responses pending</Pill>
              <Pill tone="violet" icon={AlertTriangle}>2 service concerns</Pill>
              <Pill tone="alert"  icon={Flame}>1 escalation review</Pill>
              <Pill tone="warm"   icon={Timer}>1 communication delay</Pill>
            </div>
          </div>
        </section>

        {/* 2. HEALTH SNAPSHOT */}
        <section className="space-y-3">
          <SectionHeader title="Follow-up health" hint="A calm read on operational continuity this week." />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { icon: Clock,         label: "Overdue follow-ups",     value: "1",       tone: "alert"  as Tone },
              { icon: Bell,          label: "Due today",              value: "2",       tone: "amber"  as Tone },
              { icon: MessageSquare, label: "Communication gaps",     value: "1",       tone: "violet" as Tone },
              { icon: CheckCircle2,  label: "Continuity health",      value: "Healthy", tone: "calm"   as Tone },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-border/60 bg-white/70 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_hsl(220_30%_50%/0.15)]">
                <div className={`grid h-8 w-8 place-items-center rounded-xl ${AVATAR[c.tone]}`}>
                  <c.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="mt-3 text-[18px] font-semibold tracking-tight text-foreground">{c.value}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">{c.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. ACTIVE FOLLOW-UP FEED */}
        <section className="space-y-3">
          <SectionHeader title="Active follow-ups" hint="Today, this week, and a gentle nudge for what's overdue." action="View all" />

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search families, follow-ups, or operational categories"
                className="h-10 w-full rounded-2xl border border-border/70 bg-white/70 pl-9 pr-3 text-[13px] outline-none backdrop-blur transition placeholder:text-muted-foreground/70 focus:border-[hsl(210_80%_80%)] focus:ring-2 focus:ring-[hsl(210_80%_92%)]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["All", "Today", "This week", "Overdue"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11.5px] font-medium transition ${
                    filter === f
                      ? "border-[hsl(210_80%_82%)] bg-[hsl(210_100%_97%)] text-[hsl(210_70%_42%)]"
                      : "border-border/70 bg-white/70 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "All" && <Filter className="h-3 w-3" />}
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {FOLLOWUPS.map((u) => (
              <article
                key={u.id}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white/75 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[hsl(210_80%_85%)] hover:shadow-[0_10px_30px_-16px_hsl(210_60%_40%/0.18)]"
              >
                <div className="flex items-start gap-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${AVATAR[u.avatar]}`}>
                    {u.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-semibold text-foreground">
                          {u.child} <span className="font-normal text-muted-foreground">· {u.family}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">{u.type}</div>
                      </div>
                      <Pill tone={u.priority.tone}>{u.priority.label}</Pill>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Pill tone={u.category.tone}>{u.category.label}</Pill>
                    </div>

                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-foreground/80">{u.summary}</p>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-[11px]">
                      <div>
                        <div className="text-muted-foreground">Due</div>
                        <div className="mt-0.5 font-medium text-foreground/85">{u.due}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Last comm.</div>
                        <div className="mt-0.5 font-medium text-foreground/85">{u.lastComm}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Pill tone={u.status.tone} icon={u.status.icon}>{u.status.label}</Pill>
                      <Pill tone={u.relationship.tone} icon={Heart}>{u.relationship.label}</Pill>
                    </div>
                  </div>
                </div>
                <button className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-muted/70">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* 4. FAMILY PROGRESS TRACKING */}
        <section className="space-y-3">
          <SectionHeader title="Family progress tracking" hint="Relationship continuity — not clinical progress." />
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-white/70 backdrop-blur-xl">
            <div className="hidden grid-cols-12 gap-3 border-b border-border/60 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:grid">
              <div className="col-span-4">Family</div>
              <div className="col-span-2">Communication</div>
              <div className="col-span-2">Relationship</div>
              <div className="col-span-2">Responsiveness</div>
              <div className="col-span-2">Trend</div>
            </div>
            <ul className="divide-y divide-border/60">
              {PROGRESS_FAMILIES.map((p) => (
                <li key={p.initials} className="grid grid-cols-2 items-center gap-3 px-4 py-3 md:grid-cols-12">
                  <div className="col-span-2 flex items-center gap-3 md:col-span-4">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${AVATAR[p.avatar]}`}>
                      {p.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-foreground">{p.child}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{p.parent}</div>
                    </div>
                  </div>
                  <div className="col-span-1 text-[11.5px] text-muted-foreground md:hidden">Communication</div>
                  <div className="col-span-1 text-right text-[12px] text-foreground/85 md:col-span-2 md:text-left">{p.comm}</div>
                  <div className="col-span-1 text-[11.5px] text-muted-foreground md:hidden">Relationship</div>
                  <div className="col-span-1 md:col-span-2"><Pill tone={p.rel === "At risk" ? "alert" : p.rel === "Watch" ? "amber" : "calm"}>{p.rel}</Pill></div>
                  <div className="col-span-1 text-[11.5px] text-muted-foreground md:hidden">Responsiveness</div>
                  <div className="col-span-1 text-right text-[12px] text-foreground/85 md:col-span-2 md:text-left">{p.responsive}</div>
                  <div className="col-span-1 text-[11.5px] text-muted-foreground md:hidden">Trend</div>
                  <div className="col-span-1 md:col-span-2">
                    <Pill tone={p.trend === "Needs care" ? "alert" : p.trend === "Improving" ? "violet" : "calm"}>{p.trend}</Pill>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. OPEN OPERATIONAL CONCERNS */}
        <section className="space-y-3">
          <SectionHeader title="Open operational concerns" hint="Controlled visibility into what's unresolved." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {OPEN_CONCERNS.map((c) => (
              <div key={c.title} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-white/70 p-4 backdrop-blur-xl transition hover:-translate-y-0.5">
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${AVATAR[c.tone]}`}>
                  <c.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13px] font-semibold text-foreground">{c.title}</div>
                    <Pill tone={c.tone}>{c.count} open</Pill>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6 + 7. COMMUNICATION CONTINUITY + ESCALATION FOLLOW-THROUGH */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <SectionHeader title="Communication continuity" hint="Who you've spoken with — and who deserves a warm check-in." />
            <div className="rounded-2xl border border-border/60 bg-white/70 backdrop-blur-xl">
              <ul className="divide-y divide-border/60">
                {COMM_CONTINUITY.map((c) => (
                  <li key={c.family} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`grid h-9 w-9 place-items-center rounded-full text-[11.5px] font-semibold ${AVATAR[c.tone]}`}>
                        {c.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-foreground">{c.family}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">Last contact · {c.last}</div>
                      </div>
                    </div>
                    <Pill tone={c.tone}>{c.status}</Pill>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <SectionHeader title="Escalation follow-through" hint="Calm visibility into sensitive situations." />
            <div className="space-y-2.5">
              {ESCALATIONS.map((e) => (
                <div key={e.title} className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-white/80 to-[hsl(10_100%_98%)] p-4 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div className={`grid h-9 w-9 place-items-center rounded-xl ${AVATAR[e.tone]}`}>
                      <e.icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <Pill tone={e.tone}>Open · {e.age}</Pill>
                  </div>
                  <div className="mt-3 text-[13px] font-semibold text-foreground">{e.title}</div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{e.desc}</p>
                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Users className="h-3 w-3" /> {e.owner}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. QUICK ACTIONS */}
        <section className="space-y-3">
          <SectionHeader title="Quick actions" hint="One tap to do the next caring thing." />
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 lg:grid-cols-7">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-white/70 p-3 text-center backdrop-blur transition hover:-translate-y-0.5 hover:border-[hsl(210_80%_82%)] hover:shadow-[0_8px_24px_-12px_hsl(210_60%_40%/0.18)]"
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(210_100%_96%)] to-[hsl(195_100%_96%)] text-[hsl(210_70%_42%)] transition group-hover:scale-105">
                  <a.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <span className="text-[11.5px] font-medium text-foreground/85">{a.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 9. ASK BLOSSOM AI */}
        <section className="space-y-3">
          <SectionHeader title="Operational Insights" hint="A quiet assistant for follow-through work." />
          <div className="relative overflow-hidden rounded-3xl border border-[hsl(265_60%_90%)] bg-gradient-to-br from-[hsl(265_100%_98%)] via-white/70 to-[hsl(210_100%_98%)] p-5 backdrop-blur-xl md:p-7">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[hsl(265_100%_92%)] opacity-60 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-[hsl(210_100%_94%)] opacity-50 blur-3xl" />

            <div className="relative flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(265_80%_88%)] to-[hsl(210_80%_88%)] text-[hsl(265_60%_40%)]">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-[14px] font-semibold text-foreground">Blossom AI</div>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  Soon, Blossom will help you prioritize follow-ups, summarize unresolved concerns, and prepare calm leadership updates.
                </p>
              </div>
            </div>

            <div className="relative mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
              {AI_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="group flex items-center justify-between gap-2 rounded-2xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-left text-[12.5px] text-foreground/85 backdrop-blur transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_85%)] hover:text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-[hsl(265_60%_55%)]" />
                    {s}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 10. ROADMAP */}
        <section className="space-y-3">
          <SectionHeader title="On the roadmap" hint="The future of family follow-through at Blossom." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {FUTURE.map((f) => (
              <div key={f.title} className="relative overflow-hidden rounded-2xl border border-border/60 bg-white/55 p-5 backdrop-blur-xl">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/30 to-[hsl(265_100%_97%)]/40" />
                <div className="flex items-center justify-between">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_100%_96%)] to-[hsl(210_100%_96%)] text-[hsl(265_60%_50%)]">
                    <f.icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                </div>
                <div className="mt-3 text-[13.5px] font-semibold text-foreground">{f.title}</div>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{f.desc}</p>
                <div className="os-skeleton mt-4 h-1.5 w-2/3 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        {/* EMPTY STATE */}
        <section className="rounded-3xl border border-dashed border-border/70 bg-white/40 px-5 py-7 text-center backdrop-blur-xl">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(160_60%_94%)] to-[hsl(180_60%_95%)] text-[hsl(165_55%_35%)]">
            <Inbox className="h-5 w-5" />
          </div>
          <div className="mt-3 text-[13.5px] font-semibold text-foreground">No urgent follow-ups detected.</div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Family continuity insights and follow-up coordination will appear here.
          </p>
        </section>
      </div>

      {/* MOBILE STICKY FOLLOW-UP BAR */}
      <div className="fixed inset-x-3 bottom-3 z-30 md:hidden">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-white/85 px-3 py-2 shadow-[0_10px_30px_-10px_hsl(210_60%_40%/0.25)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(210_100%_94%)] to-[hsl(195_100%_94%)] text-[hsl(210_70%_42%)]">
              <Activity className="h-4 w-4" />
            </div>
            <div className="text-[12px] font-medium text-foreground">Next follow-up</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="grid h-9 w-9 place-items-center rounded-full bg-muted/70 text-foreground/80"><PhoneCall className="h-4 w-4" /></button>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-muted/70 text-foreground/80"><Mail className="h-4 w-4" /></button>
            <button className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[hsl(210_80%_55%)] to-[hsl(225_80%_60%)] px-3 py-2 text-[12px] font-medium text-white shadow-sm">
              <Send className="h-3.5 w-3.5" /> Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}