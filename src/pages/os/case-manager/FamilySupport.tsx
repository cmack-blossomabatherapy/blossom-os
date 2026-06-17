import { useState } from "react";
import {
  HeartHandshake, Heart, MessageSquare, AlertTriangle, Flame, Sparkles,
  ChevronRight, Search, Filter, Clock, Activity, Bot, Bell, CalendarClock,
  CheckCircle2, ArrowUpRight, Send, PhoneCall, Mail, Users, ShieldAlert,
  LineChart, Smile, Inbox, MapPin, PauseCircle, UserCog, BookOpen,
} from "lucide-react";

/**
 * Case Manager → Family Relationships → Family Support
 * Calm, premium "family support and relationship stability center."
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

type SupportFamily = {
  id: string; initials: string; child: string; parent: string;
  state: string; bcba: string; rbt: string; avatar: Tone;
  priority: { label: string; tone: Tone };
  concern: string;
  lastContact: string; nextFollowUp: string;
  health: { label: string; tone: Tone };
  status: { label: string; tone: Tone; icon: typeof Heart };
};

const FAMILIES: SupportFamily[] = [
  {
    id: "f1", initials: "LM", child: "Liam", parent: "Maria", state: "GA",
    bcba: "Dr. Patel", rbt: "Ana R.", avatar: "warm",
    priority: { label: "Parent overwhelmed", tone: "amber" },
    concern: "Parent requested additional support communication after a heavy week.",
    lastContact: "2 days ago", nextFollowUp: "Tomorrow",
    health: { label: "Watch", tone: "amber" },
    status: { label: "Follow-up due", tone: "amber", icon: Clock },
  },
  {
    id: "f2", initials: "AV", child: "Ava", parent: "Jasmine", state: "NC",
    bcba: "Dr. Lee", rbt: "Marcus T.", avatar: "cool",
    priority: { label: "Schedule inconsistency", tone: "cool" },
    concern: "Scheduling inconsistency impacting family confidence — needs reassurance.",
    lastContact: "Yesterday", nextFollowUp: "This week",
    health: { label: "Stable", tone: "calm" },
    status: { label: "Awaiting response", tone: "cool", icon: MessageSquare },
  },
  {
    id: "f3", initials: "NO", child: "Noah", parent: "Daniel", state: "TN",
    bcba: "Dr. Chen", rbt: "Priya S.", avatar: "alert",
    priority: { label: "Authorization delay", tone: "alert" },
    concern: "Authorization delays causing frustration — escalation review in progress.",
    lastContact: "3 days ago", nextFollowUp: "Today",
    health: { label: "At risk", tone: "alert" },
    status: { label: "Escalation review", tone: "alert", icon: Flame },
  },
  {
    id: "f4", initials: "MI", child: "Mia", parent: "Sara", state: "VA",
    bcba: "Dr. Patel", rbt: "Jordan H.", avatar: "calm",
    priority: { label: "Routine check-in", tone: "calm" },
    concern: "Follow-up after a positive staffing discussion — relationship feels strong.",
    lastContact: "4 days ago", nextFollowUp: "Next week",
    health: { label: "Stable", tone: "calm" },
    status: { label: "Support stable", tone: "calm", icon: CheckCircle2 },
  },
  {
    id: "f5", initials: "EL", child: "Eli", parent: "Renee", state: "MD",
    bcba: "Dr. Lee", rbt: "Sam W.", avatar: "violet",
    priority: { label: "Staffing concern", tone: "violet" },
    concern: "Staffing transition impacting trust — parent wants more updates.",
    lastContact: "Today", nextFollowUp: "Friday",
    health: { label: "Watch", tone: "amber" },
    status: { label: "Leadership reviewed", tone: "violet", icon: ShieldAlert },
  },
  {
    id: "f6", initials: "ZN", child: "Zoe", parent: "Nina", state: "GA",
    bcba: "Dr. Chen", rbt: "Taylor B.", avatar: "warm",
    priority: { label: "Service pause", tone: "amber" },
    concern: "Services on pause — gentle check-in needed to maintain relationship.",
    lastContact: "1 week ago", nextFollowUp: "Tomorrow",
    health: { label: "Watch", tone: "amber" },
    status: { label: "Follow-up due", tone: "amber", icon: PauseCircle },
  },
];

const ACTIVE_SITUATIONS = [
  { icon: MessageSquare, label: "Communication support",  count: 4, tone: "cool"   as Tone, hint: "Outreach in progress" },
  { icon: UserCog,       label: "Staffing support",       count: 2, tone: "violet" as Tone, hint: "Transitions being communicated" },
  { icon: CalendarClock, label: "Schedule support",       count: 3, tone: "amber"  as Tone, hint: "Reassurance after changes" },
  { icon: ShieldAlert,   label: "Authorization concerns", count: 1, tone: "alert"  as Tone, hint: "Delay communicated to family" },
  { icon: BookOpen,      label: "Parent education",       count: 2, tone: "calm"   as Tone, hint: "Resources being shared" },
  { icon: PauseCircle,   label: "Service pause support",  count: 1, tone: "warm"   as Tone, hint: "Maintaining warm contact" },
  { icon: Activity,      label: "Transition support",     count: 1, tone: "violet" as Tone, hint: "BCBA hand-off in motion" },
];

const STRESS_SIGNALS = [
  { icon: PhoneCall,     title: "Repeated parent outreach",  desc: "2 families reaching out more than usual.",        tone: "amber"  as Tone },
  { icon: AlertTriangle, title: "Unresolved concerns",        desc: "3 open concerns past their gentle threshold.",   tone: "alert"  as Tone },
  { icon: Clock,         title: "Communication gaps",         desc: "1 family without contact in 14+ days.",          tone: "violet" as Tone },
  { icon: UserCog,       title: "Staffing instability",       desc: "2 families experiencing team changes.",          tone: "cool"   as Tone },
  { icon: CalendarClock, title: "Schedule disruptions",       desc: "Repeated changes across 2 caseloads.",           tone: "amber"  as Tone },
  { icon: Smile,         title: "Parent frustration signals", desc: "Tone shift detected in 1 recent conversation.",  tone: "alert"  as Tone },
];

const REQUESTS = [
  { icon: PhoneCall,     label: "Callback request",            family: "Maria · Liam",   tone: "amber"  as Tone, when: "Today" },
  { icon: UserCog,       label: "Staffing update request",     family: "Renee · Eli",    tone: "violet" as Tone, when: "This week" },
  { icon: CalendarClock, label: "Schedule adjustment concern", family: "Jasmine · Ava",  tone: "cool"   as Tone, when: "This week" },
  { icon: ShieldAlert,   label: "Authorization question",      family: "Daniel · Noah",  tone: "alert"  as Tone, when: "Overdue · 1d" },
  { icon: PauseCircle,   label: "Service pause concern",       family: "Nina · Zoe",     tone: "warm"   as Tone, when: "Tomorrow" },
  { icon: HeartHandshake,label: "General support request",     family: "Sara · Mia",     tone: "calm"   as Tone, when: "Next week" },
];

const ESCALATIONS = [
  { icon: Flame,         title: "Authorization delay · Noah",        desc: "Family awaiting a leadership update.",        tone: "alert"  as Tone, owner: "Ops Leadership" },
  { icon: AlertTriangle, title: "Recurring staffing change · Eli",   desc: "Repeated transitions — parent needs context.", tone: "amber" as Tone, owner: "BCBA + CM" },
  { icon: ShieldAlert,   title: "Service interruption · Zoe",        desc: "Services paused — maintaining warm contact.",  tone: "violet" as Tone, owner: "Case Manager" },
];

const AI_SUGGESTIONS = [
  "Summarize this family's open concerns",
  "Suggest the next supportive outreach for Liam's family",
  "Identify families showing early stress signals",
  "Draft a warm message acknowledging the auth delay",
  "Surface relationships that may need leadership awareness",
];

const FUTURE = [
  { icon: Heart,       title: "Family relationship health scores", desc: "A calm, single-number relationship signal." },
  { icon: ShieldAlert, title: "Predictive support risk alerts",    desc: "Gentle, early signals before stress grows." },
  { icon: Smile,       title: "Parent satisfaction insights",      desc: "Pulse on how families are feeling." },
  { icon: Sparkles,    title: "AI follow-up recommendations",      desc: "Suggested next-step outreach per family." },
  { icon: LineChart,   title: "Communication stability tracking",  desc: "Consistency patterns over time." },
  { icon: Activity,    title: "Service continuity intelligence",   desc: "Quiet awareness of fragile continuity." },
];

/* ---------------- page ---------------- */

export default function CMFamilySupportPage() {
  const [filter, setFilter] = useState<"All" | "Needs support" | "Watch" | "At risk">("All");

  return (
    <div className="relative min-h-full bg-gradient-to-b from-[hsl(20_50%_99%)] via-background to-[hsl(265_60%_99%)] pb-28 md:pb-12">
      {/* soft floating background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[hsl(330_100%_92%)] opacity-50 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[hsl(160_70%_92%)] opacity-50 blur-3xl" />
        <div className="absolute left-1/3 top-44 h-64 w-64 rounded-full bg-[hsl(265_100%_95%)] opacity-40 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-6 md:px-8 md:pt-10">
        {/* 1. HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-white/70 p-6 backdrop-blur-xl md:p-9">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/60 via-white/30 to-[hsl(330_100%_97%)]/60" />
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(330_85%_90%)] bg-[hsl(330_100%_97%)] px-2.5 py-1 text-[11px] font-medium text-[hsl(330_60%_45%)]">
                <HeartHandshake className="h-3 w-3" strokeWidth={2.25} /> Family Relationships
              </div>
              <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-foreground md:text-[32px]">
                Family Support
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                Help families feel informed, supported, and connected throughout their care journey.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="amber"  icon={Heart}>5 need support</Pill>
              <Pill tone="alert"  icon={AlertTriangle}>3 open concerns</Pill>
              <Pill tone="cool"   icon={MessageSquare}>4 follow-ups</Pill>
              <Pill tone="violet" icon={ShieldAlert}>1 escalation</Pill>
              <Pill tone="warm"   icon={PauseCircle}>2 continuity risks</Pill>
            </div>
          </div>
        </section>

        {/* 2. SUPPORT HEALTH OVERVIEW */}
        <section className="space-y-3">
          <SectionHeader title="Support health" hint="A calm read on how families are feeling this week." />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { icon: Heart,         label: "Relationship stability", value: "Strong",  tone: "calm"  as Tone },
              { icon: AlertTriangle, label: "Unresolved concerns",     value: "3",       tone: "amber" as Tone },
              { icon: MessageSquare, label: "Communication consistency", value: "Steady", tone: "cool"  as Tone },
              { icon: Activity,      label: "Support responsiveness",  value: "Healthy", tone: "violet" as Tone },
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

        {/* 3. FAMILIES NEEDING SUPPORT */}
        <section className="space-y-3">
          <SectionHeader title="Families needing support" hint="Surfaced gently — based on signals across the week." action="View all" />

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search families, concerns, or care teams"
                className="h-10 w-full rounded-2xl border border-border/70 bg-white/70 pl-9 pr-3 text-[13px] outline-none backdrop-blur transition placeholder:text-muted-foreground/70 focus:border-[hsl(330_80%_85%)] focus:ring-2 focus:ring-[hsl(330_80%_92%)]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["All", "Needs support", "Watch", "At risk"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11.5px] font-medium transition ${
                    filter === f
                      ? "border-[hsl(330_80%_85%)] bg-[hsl(330_100%_97%)] text-[hsl(330_60%_45%)]"
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
            {FAMILIES.map((f) => (
              <article
                key={f.id}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white/75 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[hsl(330_80%_88%)] hover:shadow-[0_10px_30px_-16px_hsl(330_60%_40%/0.18)]"
              >
                <div className="flex items-start gap-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${AVATAR[f.avatar]}`}>
                    {f.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-semibold text-foreground">
                          {f.child} <span className="font-normal text-muted-foreground">· {f.parent}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {f.state} · {f.bcba} · {f.rbt}
                        </div>
                      </div>
                      <Pill tone={f.priority.tone}>{f.priority.label}</Pill>
                    </div>

                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-foreground/80">{f.concern}</p>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-[11px]">
                      <div>
                        <div className="text-muted-foreground">Last contact</div>
                        <div className="mt-0.5 font-medium text-foreground/85">{f.lastContact}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Next follow-up</div>
                        <div className="mt-0.5 font-medium text-foreground/85">{f.nextFollowUp}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Pill tone={f.status.tone} icon={f.status.icon}>{f.status.label}</Pill>
                      <Pill tone={f.health.tone} icon={Heart}>{f.health.label}</Pill>
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

        {/* 4. ACTIVE SUPPORT SITUATIONS */}
        <section className="space-y-3">
          <SectionHeader title="Active support situations" hint="A calm view of what's in motion across your caseload." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ACTIVE_SITUATIONS.map((s) => (
              <div key={s.label} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-white/70 p-4 backdrop-blur-xl transition hover:-translate-y-0.5">
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${AVATAR[s.tone]}`}>
                  <s.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13px] font-semibold text-foreground">{s.label}</div>
                    <Pill tone={s.tone}>{s.count} active</Pill>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{s.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. FAMILY STRESS INDICATORS */}
        <section className="space-y-3">
          <SectionHeader title="Family stress signals" hint="Quiet awareness — never alarming." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {STRESS_SIGNALS.map((r) => (
              <div key={r.title} className="rounded-2xl border border-border/60 bg-white/70 p-4 backdrop-blur-xl transition hover:-translate-y-0.5">
                <div className={`grid h-8 w-8 place-items-center rounded-xl ${AVATAR[r.tone]}`}>
                  <r.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="mt-3 text-[13px] font-semibold text-foreground">{r.title}</div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6 + 7. COORDINATION WORKSPACE + REQUESTS */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <SectionHeader title="Support coordination" hint="Notes, timelines, and the people supporting each family." />
            <div className="rounded-2xl border border-border/60 bg-white/70 p-5 backdrop-blur-xl">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  { icon: BookOpen,       title: "Support notes",         desc: "Shared, gentle context across the support team." },
                  { icon: Clock,          title: "Follow-up timeline",     desc: "What's next — and when — for each family." },
                  { icon: Users,          title: "Assigned internal teams", desc: "BCBAs, RBTs, and leaders looped in." },
                  { icon: Activity,       title: "Operational visibility", desc: "Quiet view into the moving parts behind care." },
                  { icon: Heart,          title: "Relationship health",    desc: "Tracking the warmth and trust over time." },
                  { icon: HeartHandshake, title: "Family handoffs",        desc: "Calm continuity through every transition." },
                ].map((c) => (
                  <div key={c.title} className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/30 p-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/70 text-[hsl(265_60%_50%)]">
                      <c.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-[12.5px] font-semibold text-foreground">{c.title}</div>
                      </div>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <SectionHeader title="Parent needs & requests" hint="What families are asking for, organized calmly." />
            <div className="rounded-2xl border border-border/60 bg-white/70 backdrop-blur-xl">
              <ul className="divide-y divide-border/60">
                {REQUESTS.map((r) => (
                  <li key={r.label + r.family} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`grid h-8 w-8 place-items-center rounded-xl ${AVATAR[r.tone]}`}>
                        <r.icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-medium text-foreground">{r.label}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">{r.family} · {r.when}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 8. ESCALATION AWARENESS */}
        <section className="space-y-3">
          <SectionHeader title="Escalation awareness" hint="Controlled, calm visibility into sensitive situations." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {ESCALATIONS.map((e) => (
              <div key={e.title} className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-white/80 to-[hsl(10_100%_98%)] p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className={`grid h-9 w-9 place-items-center rounded-xl ${AVATAR[e.tone]}`}>
                    <e.icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <Pill tone={e.tone}>{e.tone === "alert" ? "Active" : "Monitoring"}</Pill>
                </div>
                <div className="mt-3 text-[13px] font-semibold text-foreground">{e.title}</div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{e.desc}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Users className="h-3 w-3" /> {e.owner}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 9. ASK BLOSSOM AI */}
        <section className="space-y-3">
          <SectionHeader title="Operational Insights" hint="A quiet assistant for family support work." />
          <div className="relative overflow-hidden rounded-3xl border border-[hsl(265_60%_90%)] bg-gradient-to-br from-[hsl(265_100%_98%)] via-white/70 to-[hsl(330_100%_98%)] p-5 backdrop-blur-xl md:p-7">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[hsl(265_100%_92%)] opacity-60 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-[hsl(330_100%_94%)] opacity-50 blur-3xl" />

            <div className="relative flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(265_80%_88%)] to-[hsl(330_80%_88%)] text-[hsl(265_60%_40%)]">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-[14px] font-semibold text-foreground">Blossom AI</div>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  Soon, Blossom will help summarize concerns, surface relationship risks, and draft warm outreach — always in your voice.
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

        {/* 10. FUTURE FEATURES */}
        <section className="space-y-3">
          <SectionHeader title="On the roadmap" hint="The future of family support at Blossom." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {FUTURE.map((f) => (
              <div key={f.title} className="relative overflow-hidden rounded-2xl border border-border/60 bg-white/55 p-5 backdrop-blur-xl">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/30 to-[hsl(265_100%_97%)]/40" />
                <div className="flex items-center justify-between">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_100%_96%)] to-[hsl(330_100%_96%)] text-[hsl(265_60%_50%)]">
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

        {/* CALM EMPTY STATE */}
        <section className="rounded-3xl border border-dashed border-border/70 bg-white/40 px-5 py-7 text-center backdrop-blur-xl">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(160_60%_94%)] to-[hsl(180_60%_95%)] text-[hsl(165_55%_35%)]">
            <Inbox className="h-5 w-5" />
          </div>
          <div className="mt-3 text-[13.5px] font-semibold text-foreground">Families are feeling supported.</div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            No urgent family support concerns currently detected. Insights and relationship awareness will appear here.
          </p>
        </section>
      </div>

      {/* MOBILE STICKY SUPPORT BAR */}
      <div className="fixed inset-x-3 bottom-3 z-30 md:hidden">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-white/85 px-3 py-2 shadow-[0_10px_30px_-10px_hsl(330_60%_40%/0.25)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(330_100%_94%)] to-[hsl(20_100%_94%)] text-[hsl(330_60%_45%)]">
              <HeartHandshake className="h-4 w-4" />
            </div>
            <div className="text-[12px] font-medium text-foreground">Support action</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="grid h-9 w-9 place-items-center rounded-full bg-muted/70 text-foreground/80"><PhoneCall className="h-4 w-4" /></button>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-muted/70 text-foreground/80"><Mail className="h-4 w-4" /></button>
            <button className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[hsl(330_80%_60%)] to-[hsl(345_80%_62%)] px-3 py-2 text-[12px] font-medium text-white shadow-sm">
              <Send className="h-3.5 w-3.5" /> Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}