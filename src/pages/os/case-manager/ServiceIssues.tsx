import { useState } from "react";
import {
  AlertTriangle, Heart, MessageSquare, ShieldAlert, Flame, Sparkles,
  ChevronRight, Search, Filter, Clock, Bot, Bell, CheckCircle2,
  ArrowUpRight, Send, PhoneCall, Mail, Users, Eye, PauseCircle,
  LineChart, Smile, Inbox, Activity, Timer, RefreshCw, UserCog,
  CalendarClock, TrendingDown, TrendingUp, FileWarning,
} from "lucide-react";

/**
 * Case Manager → Operations → Service Issues
 * VISIBILITY ONLY — calm service continuity + family impact awareness center.
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

function ComingSoon() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(265_60%_90%)] bg-[hsl(265_100%_98%)] px-2 py-0.5 text-[10px] font-medium text-[hsl(265_60%_50%)]">
      <Sparkles className="h-2.5 w-2.5" /> Coming soon
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

type IssueRow = {
  id: string; initials: string; child: string; family: string; state: string;
  bcba: string; rbt: string | null; avatar: Tone;
  priority: { label: string; tone: Tone };
  issueType: { label: string; tone: Tone };
  concern: string;
  affectedDays: string;
  parentOutreach: string;
  status: { label: string; tone: Tone; icon: typeof Heart };
  continuity: { label: string; tone: Tone; icon: typeof Heart };
};

const ISSUES: IssueRow[] = [
  {
    id: "i1", initials: "NO", child: "Noah", family: "Daniel", state: "TN",
    bcba: "Dr. Chen", rbt: "Priya S.", avatar: "alert",
    priority: { label: "Service interruption", tone: "alert" },
    issueType: { label: "Repeated cancellations", tone: "alert" },
    concern: "Attendance inconsistency detected — services disrupted 3 of last 5 scheduled days.",
    affectedDays: "Mon · Wed · Fri",
    parentOutreach: "Outreach overdue",
    status: { label: "Awaiting operations", tone: "violet", icon: Clock },
    continuity: { label: "At risk", tone: "alert", icon: TrendingDown },
  },
  {
    id: "i2", initials: "ZN", child: "Zoe", family: "Nina", state: "GA",
    bcba: "Dr. Chen", rbt: "Taylor B.", avatar: "warm",
    priority: { label: "Service paused", tone: "amber" },
    issueType: { label: "Services on Pause", tone: "warm" },
    concern: "Services temporarily paused — warm contact maintained, family awaiting restart timeline.",
    affectedDays: "All sessions",
    parentOutreach: "Sent 2d ago",
    status: { label: "Parent contacted", tone: "warm", icon: CheckCircle2 },
    continuity: { label: "Paused", tone: "warm", icon: PauseCircle },
  },
  {
    id: "i3", initials: "EL", child: "Eli", family: "Renee", state: "MD",
    bcba: "Dr. Lee", rbt: "Sam W.", avatar: "violet",
    priority: { label: "Staffing impact", tone: "violet" },
    issueType: { label: "Schedule inconsistency", tone: "violet" },
    concern: "Staffing delay causing repeated session rescheduling — family confidence may weaken.",
    affectedDays: "Tue · Thu",
    parentOutreach: "Sent today",
    status: { label: "Coordination in progress", tone: "violet", icon: RefreshCw },
    continuity: { label: "Fragile", tone: "amber", icon: TrendingDown },
  },
  {
    id: "i4", initials: "LM", child: "Liam", family: "Maria", state: "GA",
    bcba: "Dr. Patel", rbt: "Ana R.", avatar: "amber",
    priority: { label: "Attendance concern", tone: "amber" },
    issueType: { label: "Missed sessions", tone: "amber" },
    concern: "Two consecutive missed sessions — gentle parent outreach recommended to understand needs.",
    affectedDays: "Last Tue · Thu",
    parentOutreach: "Pending today",
    status: { label: "Follow-up needed", tone: "amber", icon: MessageSquare },
    continuity: { label: "Watch", tone: "amber", icon: AlertTriangle },
  },
  {
    id: "i5", initials: "AV", child: "Ava", family: "Jasmine", state: "NC",
    bcba: "Dr. Lee", rbt: "Marcus T.", avatar: "cool",
    priority: { label: "Routine awareness", tone: "cool" },
    issueType: { label: "Stable service", tone: "calm" },
    concern: "Services running consistently — no concerns detected. Family communication cadence healthy.",
    affectedDays: "—",
    parentOutreach: "Not needed",
    status: { label: "Service stable", tone: "calm", icon: CheckCircle2 },
    continuity: { label: "Healthy", tone: "calm", icon: TrendingUp },
  },
  {
    id: "i6", initials: "MI", child: "Mia", family: "Sara", state: "VA",
    bcba: "Dr. Patel", rbt: "Jordan H.", avatar: "calm",
    priority: { label: "Routine awareness", tone: "calm" },
    issueType: { label: "Stable service", tone: "calm" },
    concern: "No service disruptions — attendance strong, family engagement healthy.",
    affectedDays: "—",
    parentOutreach: "Not needed",
    status: { label: "Continuity strong", tone: "calm", icon: Heart },
    continuity: { label: "Consistent", tone: "calm", icon: TrendingUp },
  },
];

const SNAPSHOT = [
  { icon: CheckCircle2,  label: "Service continuity",       value: "Watch · 2",   tone: "amber"  as Tone },
  { icon: AlertTriangle, label: "Unresolved concerns",      value: "3 active",    tone: "alert"  as Tone },
  { icon: PauseCircle,   label: "Services paused",          value: "1 family",    tone: "warm"   as Tone },
  { icon: ShieldAlert,   label: "Family impact risks",      value: "2 fragile",   tone: "violet" as Tone },
];

const CONTINUITY_DISRUPTIONS = [
  { initials: "NO", family: "Daniel · Noah",  issue: "Repeated cancellations",  tone: "alert"  as Tone, hint: "3 of 5 sessions missed" },
  { initials: "ZN", family: "Nina · Zoe",     issue: "Services paused",         tone: "warm"   as Tone, hint: "Awaiting restart date" },
  { initials: "EL", family: "Renee · Eli",    issue: "Schedule inconsistency",  tone: "violet" as Tone, hint: "Staffing-related delays" },
  { initials: "LM", family: "Maria · Liam",   issue: "Missed sessions",         tone: "amber"  as Tone, hint: "2 consecutive absences" },
  { initials: "AV", family: "Jasmine · Ava",  issue: "No disruptions",          tone: "calm"   as Tone, hint: "Consistent attendance" },
  { initials: "MI", family: "Sara · Mia",     issue: "No disruptions",          tone: "calm"   as Tone, hint: "Strong continuity" },
];

const PARENT_IMPACT = [
  { icon: MessageSquare, title: "Parent frustration signals",    desc: "1 family expressing concern after repeated changes.",     tone: "amber"  as Tone },
  { icon: PhoneCall,     title: "Reassurance outreach needed",   desc: "2 families awaiting warm continuity check-in.",        tone: "cool"   as Tone },
  { icon: Heart,         title: "Service pause support",         desc: "1 family needs gentle restart timeline context.",      tone: "warm"   as Tone },
  { icon: Bell,          title: "Follow-up outreach due",        desc: "3 families on this week's service follow-up list.",  tone: "amber"  as Tone },
];

const OPERATIONAL_COORDINATION = [
  { icon: CalendarClock, label: "Scheduling visibility",     count: 2, tone: "amber"  as Tone, hint: "Disruptions detected" },
  { icon: UserCog,       label: "Staffing visibility",       count: 1, tone: "violet" as Tone, hint: "Impact on continuity" },
  { icon: FileWarning,   label: "Authorization visibility",  count: 1, tone: "alert"  as Tone, hint: "Delay affecting service" },
  { icon: Flame,         label: "Escalation awareness",      count: 0, tone: "calm"   as Tone, hint: "No escalations open" },
  { icon: MessageSquare, label: "Communication follow-ups", count: 3, tone: "cool"   as Tone, hint: "Parent outreach pending" },
  { icon: CheckCircle2,  label: "Continuity stable",         count: 2, tone: "calm"   as Tone, hint: "No action needed" },
];

const PAUSE_RISKS = [
  { icon: PauseCircle,   label: "Services on Pause",       count: 1, tone: "warm"   as Tone, hint: "Temporary pause" },
  { icon: AlertTriangle, label: "Flaked risk",             count: 1, tone: "alert"  as Tone, hint: "Repeated cancellations" },
  { icon: Timer,         label: "Delayed start dates",     count: 1, tone: "violet" as Tone, hint: "Onboarding delay" },
  { icon: ShieldAlert,   label: "Unresolved continuity",   count: 2, tone: "amber"  as Tone, hint: "Fragile service" },
  { icon: TrendingDown,  label: "Attendance decline",      count: 2, tone: "amber"  as Tone, hint: "Missing sessions" },
  { icon: Smile,         label: "Parent engagement",       count: 5, tone: "calm"   as Tone, hint: "Healthy engagement" },
];

const QUICK_ACTIONS = [
  { icon: Bell,        label: "Log family follow-up" },
  { icon: Eye,         label: "Review service concerns" },
  { icon: Users,       label: "Open assigned families" },
  { icon: PhoneCall,   label: "Contact parent" },
  { icon: ShieldAlert, label: "View escalations" },
  { icon: Flame,       label: "Review continuity risks" },
  { icon: Bot,         label: "Ask Blossom AI" },
];

const AI_SUGGESTIONS = [
  "2 families may require continuity follow-up",
  "Repeated service disruption identified for Noah",
  "Parent reassurance communication may be needed for Liam",
  "Potential continuity instability detected for Eli",
  "Summarize this week's service awareness calmly",
];

const FUTURE = [
  { icon: ShieldAlert, title: "Predictive continuity risk alerts",  desc: "Early signals before disruption reaches families." },
  { icon: Sparkles,    title: "AI service stability monitoring",    desc: "Quiet awareness of fragile service continuity." },
  { icon: Smile,       title: "Parent sentiment insights",          desc: "Gentle pulse on how families feel about services." },
  { icon: LineChart,   title: "Continuity trend tracking",          desc: "Patterns across weeks and months." },
  { icon: Heart,       title: "Family relationship intelligence",   desc: "How service issues affect family trust over time." },
  { icon: Activity,    title: "Operational stability forecasting",  desc: "A unified stability signal across teams." },
];

/* ---------------- page ---------------- */

export default function CMServiceIssuesPage() {
  const [filter, setFilter] = useState<"All" | "Active concern" | "Paused" | "Stable">("All");

  return (
    <div className="relative min-h-full bg-gradient-to-b from-[hsl(210_50%_99%)] via-background to-[hsl(38_50%_99%)] pb-28 md:pb-12">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[hsl(210_100%_92%)] opacity-50 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[hsl(38_100%_94%)] opacity-50 blur-3xl" />
        <div className="absolute left-1/3 top-44 h-64 w-64 rounded-full bg-[hsl(265_100%_95%)] opacity-40 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-6 md:px-8 md:pt-10">
        {/* 1. HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-white/70 p-6 backdrop-blur-xl md:p-9">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/60 via-white/30 to-[hsl(210_100%_97%)]/60" />
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(38_85%_88%)] bg-[hsl(38_100%_97%)] px-2.5 py-1 text-[11px] font-medium text-[hsl(28_85%_40%)]">
                <AlertTriangle className="h-3 w-3" strokeWidth={2.25} /> Operations · Visibility
              </div>
              <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-foreground md:text-[32px]">
                Service Issues
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                Stay aware of service disruptions and help families feel informed and supported through operational challenges.
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                <Eye className="h-3 w-3" /> Visibility only — operations teams own resolution workflows.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="alert"  icon={AlertTriangle}>3 service concerns</Pill>
              <Pill tone="amber"  icon={ShieldAlert}>2 continuity risks</Pill>
              <Pill tone="warm"   icon={PauseCircle}>1 service paused</Pill>
              <Pill tone="cool"   icon={MessageSquare}>3 family follow-ups</Pill>
              <Pill tone="violet" icon={Clock}>1 staffing impact</Pill>
            </div>
          </div>
        </section>

        {/* 2. SERVICE STABILITY SNAPSHOT */}
        <section className="space-y-3">
          <SectionHeader title="Service stability" hint="A calm read on continuity health across your caseload." />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {SNAPSHOT.map((c) => (
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

        {/* 3. ACTIVE SERVICE ISSUES FEED */}
        <section className="space-y-3">
          <SectionHeader title="Active service issues" hint="Where service awareness may touch families this week." action="View all" />

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search families, issues, or care teams"
                className="h-10 w-full rounded-2xl border border-border/70 bg-white/70 pl-9 pr-3 text-[13px] outline-none backdrop-blur transition placeholder:text-muted-foreground/70 focus:border-[hsl(210_80%_80%)] focus:ring-2 focus:ring-[hsl(210_80%_92%)]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["All", "Active concern", "Paused", "Stable"] as const).map((f) => (
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
            {ISSUES.map((u) => (
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
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {u.state} · {u.bcba}{u.rbt ? ` · ${u.rbt}` : ""}
                        </div>
                      </div>
                      <Pill tone={u.priority.tone}>{u.priority.label}</Pill>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Pill tone={u.issueType.tone}>{u.issueType.label}</Pill>
                    </div>

                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-foreground/80">{u.concern}</p>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarClock className="h-3 w-3" /> Affected: <span className="font-medium text-foreground">{u.affectedDays}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MessageSquare className="h-3 w-3" /> Outreach: <span className="font-medium text-foreground">{u.parentOutreach}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <Pill tone={u.status.tone} icon={u.status.icon}>{u.status.label}</Pill>
                      <Pill tone={u.continuity.tone} icon={u.continuity.icon}>{u.continuity.label}</Pill>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 4. CONTINUITY DISRUPTION AWARENESS */}
        <section className="space-y-3">
          <SectionHeader title="Continuity disruption awareness" hint="Where each family sits on the service stability spectrum." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {CONTINUITY_DISRUPTIONS.map((d) => (
              <div
                key={d.initials}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/70 p-3.5 backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_hsl(220_30%_50%/0.15)]"
              >
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${AVATAR[d.tone]}`}>
                  {d.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-foreground">{d.family}</div>
                  <div className="text-[11px] text-muted-foreground">{d.hint}</div>
                </div>
                <Pill tone={d.tone}>{d.issue}</Pill>
              </div>
            ))}
          </div>
        </section>

        {/* 5. PARENT IMPACT VISIBILITY */}
        <section className="space-y-3">
          <SectionHeader title="Parent impact visibility" hint="Reassurance and communication needs tied to service disruptions." />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PARENT_IMPACT.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3 rounded-2xl border border-border/60 bg-white/70 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_hsl(220_30%_50%/0.15)]"
              >
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${AVATAR[f.tone]}`}>
                  <f.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-foreground">{f.title}</div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. OPERATIONAL COORDINATION WORKSPACE */}
        <section className="space-y-3">
          <SectionHeader title="Operational coordination" hint="Cross-team visibility into what may be affecting your families." />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {OPERATIONAL_COORDINATION.map((r) => (
              <div
                key={r.label}
                className="relative overflow-hidden rounded-2xl border border-border/60 bg-white/70 p-3.5 text-center backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_hsl(220_30%_50%/0.15)]"
              >
                <div className={`mx-auto grid h-8 w-8 place-items-center rounded-xl ${AVATAR[r.tone]}`}>
                  <r.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className={`mt-2 text-[18px] font-semibold tracking-tight ${r.tone === "alert" ? "text-[hsl(10_75%_45%)]" : r.tone === "amber" ? "text-[hsl(28_85%_40%)]" : r.tone === "violet" ? "text-[hsl(265_60%_50%)]" : r.tone === "warm" ? "text-[hsl(330_60%_45%)]" : "text-[hsl(165_55%_32%)]"}`}>
                  {r.count}
                </div>
                <div className="mt-1 text-[11.5px] font-medium text-foreground">{r.label}</div>
                <div className="mt-0.5 text-[10.5px] text-muted-foreground">{r.hint}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. SERVICE PAUSE & RISK VISIBILITY */}
        <section className="space-y-3">
          <SectionHeader title="Service pause & risk visibility" hint="Calm awareness into what may affect family services." />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {PAUSE_RISKS.map((r) => (
              <div
                key={r.label}
                className="relative overflow-hidden rounded-2xl border border-border/60 bg-white/70 p-3.5 text-center backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_hsl(220_30%_50%/0.15)]"
              >
                <div className={`mx-auto grid h-8 w-8 place-items-center rounded-xl ${AVATAR[r.tone]}`}>
                  <r.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className={`mt-2 text-[18px] font-semibold tracking-tight ${r.tone === "alert" ? "text-[hsl(10_75%_45%)]" : r.tone === "amber" ? "text-[hsl(28_85%_40%)]" : r.tone === "violet" ? "text-[hsl(265_60%_50%)]" : r.tone === "warm" ? "text-[hsl(330_60%_45%)]" : "text-[hsl(165_55%_32%)]"}`}>
                  {r.count}
                </div>
                <div className="mt-1 text-[11.5px] font-medium text-foreground">{r.label}</div>
                <div className="mt-0.5 text-[10.5px] text-muted-foreground">{r.hint}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. QUICK COORDINATION ACTIONS */}
        <section className="space-y-3">
          <SectionHeader title="Quick coordination actions" hint="Warm, supportive next steps you can take right now." />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-white/70 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[hsl(210_80%_85%)] hover:shadow-[0_8px_24px_-12px_hsl(220_30%_50%/0.15)]"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[hsl(210_100%_96%)] to-[hsl(265_100%_96%)] text-[hsl(210_70%_42%)]">
                  <a.icon className="h-4.5 w-4.5" strokeWidth={2} />
                </div>
                <span className="text-center text-[11.5px] font-medium text-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 9. ASK BLOSSOM AI SERVICE ASSISTANT */}
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-[hsl(265_100%_98%)] via-[hsl(210_100%_98%)] to-[hsl(160_100%_98%)] p-6 backdrop-blur-xl md:p-9">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[hsl(265_100%_94%)] opacity-60 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-[hsl(210_100%_94%)] opacity-50 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(265_60%_90%)] bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[hsl(265_60%_50%)]">
                <Sparkles className="h-3 w-3" /> Ask Blossom AI
              </div>
              <h2 className="mt-3 text-[18px] font-semibold tracking-tight text-foreground md:text-[22px]">
                Service continuity assistant
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Blossom AI is learning to surface service-related continuity concerns and suggest warm, supportive family communication.
              </p>
            </div>

            <div className="flex flex-col gap-2 md:min-w-[280px]">
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-white/70 px-3 py-2 text-[12px] text-muted-foreground backdrop-blur">
                <Bot className="h-4 w-4 text-[hsl(265_60%_50%)]" />
                Try asking about service concerns...
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AI_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-white/70 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur transition hover:border-[hsl(265_60%_85%)] hover:text-[hsl(265_60%_50%)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 10. FUTURE SERVICE INTELLIGENCE */}
        <section className="space-y-3">
          <SectionHeader title="Future service intelligence" hint="What's coming to service continuity awareness." />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FUTURE.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white/60 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[hsl(265_60%_85%)] hover:shadow-[0_10px_30px_-16px_hsl(265_60%_40%/0.18)]"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(265_100%_98%)]/40 via-transparent to-[hsl(210_100%_98%)]/30 opacity-0 transition group-hover:opacity-100" />
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[hsl(265_100%_96%)] to-[hsl(210_100%_96%)] text-[hsl(265_60%_50%)]">
                    <f.icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </div>
                  <span className="text-[13px] font-medium text-foreground">{f.title}</span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{f.desc}</p>
                <div className="mt-3">
                  <ComingSoon />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
