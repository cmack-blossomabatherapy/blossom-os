import { useState } from "react";
import {
  Flame, Heart, MessageSquare, ShieldAlert, AlertTriangle, Sparkles,
  ChevronRight, Search, Filter, Clock, Bot, Bell, CheckCircle2,
  PhoneCall, Users, Eye, PauseCircle, Smile, Timer,
  CalendarClock, TrendingDown, TrendingUp, FileWarning, UserCog,
  LineChart, Activity, ShieldCheck, Compass,
} from "lucide-react";

/**
 * Case Manager → Operations → Escalations
 * VISIBILITY ONLY — calm escalation awareness + family stability center.
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

type EscalationRow = {
  id: string; initials: string; child: string; family: string; state: string;
  bcba: string; caseManager: string; avatar: Tone;
  visibility: { label: string; tone: Tone };
  category: { label: string; tone: Tone };
  concern: string;
  opened: string;
  outreach: string;
  status: { label: string; tone: Tone; icon: typeof Heart };
  continuity: { label: string; tone: Tone; icon: typeof Heart };
};

const ESCALATIONS: EscalationRow[] = [
  {
    id: "e1", initials: "NO", child: "Noah", family: "Daniel", state: "TN",
    bcba: "Dr. Chen", caseManager: "Avery R.", avatar: "alert",
    visibility: { label: "Leadership aware", tone: "violet" },
    category: { label: "Parent dissatisfaction", tone: "alert" },
    concern: "Family expressed ongoing frustration regarding service continuity — reassurance outreach recommended.",
    opened: "4d ago",
    outreach: "Pending today",
    status: { label: "Follow-up needed", tone: "amber", icon: Clock },
    continuity: { label: "Fragile", tone: "alert", icon: TrendingDown },
  },
  {
    id: "e2", initials: "ZN", child: "Zoe", family: "Nina", state: "GA",
    bcba: "Dr. Chen", caseManager: "Avery R.", avatar: "warm",
    visibility: { label: "Family contacted", tone: "warm" },
    category: { label: "Service continuity concern", tone: "warm" },
    concern: "Repeated scheduling shifts may be affecting family trust — warm continuity check-in in progress.",
    opened: "2d ago",
    outreach: "Sent 1d ago",
    status: { label: "Stability improving", tone: "calm", icon: CheckCircle2 },
    continuity: { label: "Steadying", tone: "warm", icon: TrendingUp },
  },
  {
    id: "e3", initials: "EL", child: "Eli", family: "Renee", state: "MD",
    bcba: "Dr. Lee", caseManager: "Jordan P.", avatar: "violet",
    visibility: { label: "Leadership review", tone: "violet" },
    category: { label: "Communication breakdown", tone: "violet" },
    concern: "Parent has noted missed callbacks — leadership visibility recommended to restore communication cadence.",
    opened: "6d ago",
    outreach: "Sent today",
    status: { label: "Coordination in progress", tone: "violet", icon: Activity },
    continuity: { label: "Watch", tone: "amber", icon: AlertTriangle },
  },
  {
    id: "e4", initials: "LM", child: "Liam", family: "Maria", state: "GA",
    bcba: "Dr. Patel", caseManager: "Sam K.", avatar: "amber",
    visibility: { label: "Open · Awareness", tone: "amber" },
    category: { label: "Staffing instability", tone: "amber" },
    concern: "Repeated RBT changes weakening family confidence — gentle outreach with stability context recommended.",
    opened: "3d ago",
    outreach: "Pending today",
    status: { label: "Family contacted", tone: "warm", icon: MessageSquare },
    continuity: { label: "Fragile", tone: "amber", icon: TrendingDown },
  },
  {
    id: "e5", initials: "AV", child: "Ava", family: "Jasmine", state: "NC",
    bcba: "Dr. Lee", caseManager: "Avery R.", avatar: "cool",
    visibility: { label: "Resolved · Monitoring", tone: "calm" },
    category: { label: "Service interruption concern", tone: "cool" },
    concern: "Brief pause resolved — family reassured, continuity restored. Awareness monitoring continues.",
    opened: "8d ago",
    outreach: "Not needed",
    status: { label: "Stability restored", tone: "calm", icon: CheckCircle2 },
    continuity: { label: "Healthy", tone: "calm", icon: TrendingUp },
  },
  {
    id: "e6", initials: "MI", child: "Mia", family: "Sara", state: "VA",
    bcba: "Dr. Patel", caseManager: "Jordan P.", avatar: "calm",
    visibility: { label: "Resolved · Stable", tone: "calm" },
    category: { label: "Escalated support request", tone: "calm" },
    concern: "Additional support resources shared — family expressed gratitude. Relationship trending strong.",
    opened: "11d ago",
    outreach: "Not needed",
    status: { label: "Stable & supported", tone: "calm", icon: Heart },
    continuity: { label: "Consistent", tone: "calm", icon: TrendingUp },
  },
];

const SNAPSHOT = [
  { icon: Flame,         label: "Open escalations",        value: "4 active",   tone: "amber"  as Tone },
  { icon: Heart,         label: "Family concerns",         value: "2 unresolved", tone: "warm" as Tone },
  { icon: MessageSquare, label: "Follow-ups needed",       value: "3 today",    tone: "cool"   as Tone },
  { icon: ShieldAlert,   label: "Continuity at risk",      value: "2 fragile",  tone: "alert"  as Tone },
];

const PARENT_CONCERNS = [
  { icon: MessageSquare, title: "Repeated outreach attempts",   desc: "1 family with multiple touch-points pending response.",   tone: "amber"  as Tone },
  { icon: Heart,         title: "Reassurance needs",            desc: "2 families awaiting warm continuity check-in.",            tone: "warm"   as Tone },
  { icon: PhoneCall,     title: "Communication gaps",           desc: "1 family experiencing callback delays.",                   tone: "violet" as Tone },
  { icon: Smile,         title: "Service satisfaction signals", desc: "Most families trending stable this week.",                 tone: "calm"   as Tone },
];

const RELATIONSHIP_RISK = [
  { initials: "NO", family: "Daniel · Noah",  signal: "Aging concern",         tone: "alert"  as Tone, hint: "Open 4 days" },
  { initials: "EL", family: "Renee · Eli",    signal: "Communication gap",     tone: "violet" as Tone, hint: "Leadership review" },
  { initials: "LM", family: "Maria · Liam",   signal: "Staffing instability",  tone: "amber"  as Tone, hint: "Trust weakening" },
  { initials: "ZN", family: "Nina · Zoe",     signal: "Steadying",             tone: "warm"   as Tone, hint: "Family reassured" },
  { initials: "AV", family: "Jasmine · Ava",  signal: "Stable",                tone: "calm"   as Tone, hint: "Recently resolved" },
  { initials: "MI", family: "Sara · Mia",     signal: "Strong",                tone: "calm"   as Tone, hint: "Engagement healthy" },
];

const FOLLOW_THROUGH = [
  { icon: CalendarClock, label: "Scheduling visibility",       count: 2, tone: "amber"  as Tone, hint: "Disruptions noted" },
  { icon: UserCog,       label: "Staffing visibility",         count: 1, tone: "violet" as Tone, hint: "Affecting trust" },
  { icon: FileWarning,   label: "Authorization visibility",    count: 1, tone: "alert"  as Tone, hint: "Delay concern" },
  { icon: AlertTriangle, label: "Service issue visibility",    count: 3, tone: "amber"  as Tone, hint: "Linked concerns" },
  { icon: MessageSquare, label: "Parent follow-through",       count: 3, tone: "cool"   as Tone, hint: "Outreach pending" },
  { icon: ShieldCheck,   label: "Leadership follow-through",   count: 2, tone: "violet" as Tone, hint: "Visibility active" },
];

const CONTINUITY_RISKS = [
  { icon: PauseCircle,   label: "Services on Pause",       count: 1, tone: "warm"   as Tone, hint: "Temporary pause" },
  { icon: AlertTriangle, label: "Flaked risk",             count: 1, tone: "alert"  as Tone, hint: "Repeated cancellations" },
  { icon: Timer,         label: "Delayed service starts",  count: 1, tone: "violet" as Tone, hint: "Onboarding delay" },
  { icon: UserCog,       label: "Staffing instability",    count: 2, tone: "amber"  as Tone, hint: "RBT changes" },
  { icon: FileWarning,   label: "Authorization delays",    count: 1, tone: "alert"  as Tone, hint: "Affecting service" },
  { icon: TrendingDown,  label: "Attendance decline",      count: 2, tone: "amber"  as Tone, hint: "Missed sessions" },
];

const QUICK_ACTIONS = [
  { icon: Bell,        label: "Log escalation follow-up" },
  { icon: Heart,       label: "Review family concerns" },
  { icon: PhoneCall,   label: "Contact parent" },
  { icon: Users,       label: "Open assigned families" },
  { icon: AlertTriangle, label: "Review service issues" },
  { icon: UserCog,     label: "View staffing visibility" },
  { icon: Bot,         label: "Ask Blossom AI" },
];

const AI_SUGGESTIONS = [
  "2 escalations may require follow-up",
  "Family communication instability identified",
  "Parent reassurance outreach recommended for Noah",
  "Potential continuity risk increasing for Liam",
  "Summarize this week's escalation awareness calmly",
];

const FUTURE = [
  { icon: ShieldAlert, title: "Predictive escalation alerts",    desc: "Early signals before concerns reach families." },
  { icon: Sparkles,    title: "AI relationship risk monitoring", desc: "Quiet awareness of fragile family trust." },
  { icon: Smile,       title: "Parent sentiment intelligence",   desc: "Gentle pulse on how families feel between sessions." },
  { icon: LineChart,   title: "Communication stability tracking", desc: "Patterns across weeks of family conversations." },
  { icon: Heart,       title: "Family continuity insights",      desc: "How escalations affect long-term family trust." },
  { icon: Compass,     title: "Escalation resolution forecasting", desc: "Predicted paths to calm, stable resolution." },
];

/* ---------------- page ---------------- */

export default function CMEscalationsPage() {
  const [filter, setFilter] = useState<"All" | "Open" | "Follow-up" | "Resolved">("All");

  return (
    <div className="relative min-h-full bg-gradient-to-b from-[hsl(265_50%_99%)] via-background to-[hsl(330_50%_99%)] pb-28 md:pb-12">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[hsl(265_100%_94%)] opacity-50 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[hsl(330_100%_95%)] opacity-50 blur-3xl" />
        <div className="absolute left-1/3 top-44 h-64 w-64 rounded-full bg-[hsl(210_100%_95%)] opacity-40 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-6 md:px-8 md:pt-10">
        {/* 1. HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-white/70 p-6 backdrop-blur-xl md:p-9">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/60 via-white/30 to-[hsl(265_100%_97%)]/60" />
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(265_85%_90%)] bg-[hsl(265_100%_98%)] px-2.5 py-1 text-[11px] font-medium text-[hsl(265_60%_50%)]">
                <Flame className="h-3 w-3" strokeWidth={2.25} /> Operations · Visibility
              </div>
              <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-foreground md:text-[32px]">
                Escalations
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                Stay aware of unresolved family concerns and help maintain calm, clear communication during sensitive situations.
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                <Eye className="h-3 w-3" /> Visibility only — leadership and operations own resolution workflows.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="amber"  icon={Flame}>4 open escalations</Pill>
              <Pill tone="warm"   icon={Heart}>2 family concerns</Pill>
              <Pill tone="cool"   icon={MessageSquare}>3 follow-ups</Pill>
              <Pill tone="alert"  icon={ShieldAlert}>2 continuity risks</Pill>
              <Pill tone="violet" icon={ShieldCheck}>2 leadership aware</Pill>
            </div>
          </div>
        </section>

        {/* 2. ESCALATION STABILITY SNAPSHOT */}
        <section className="space-y-3">
          <SectionHeader title="Escalation stability" hint="A calm read on unresolved concerns and family trust." />
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

        {/* 3. ACTIVE ESCALATIONS FEED */}
        <section className="space-y-3">
          <SectionHeader title="Active escalations" hint="Sensitive situations where calm, clear communication matters most." action="View all" />

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search families, escalations, or care teams"
                className="h-10 w-full rounded-2xl border border-border/70 bg-white/70 pl-9 pr-3 text-[13px] outline-none backdrop-blur transition placeholder:text-muted-foreground/70 focus:border-[hsl(265_80%_82%)] focus:ring-2 focus:ring-[hsl(265_80%_92%)]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["All", "Open", "Follow-up", "Resolved"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11.5px] font-medium transition ${
                    filter === f
                      ? "border-[hsl(265_80%_82%)] bg-[hsl(265_100%_97%)] text-[hsl(265_60%_50%)]"
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
            {ESCALATIONS.map((u) => (
              <article
                key={u.id}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white/75 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[hsl(265_80%_85%)] hover:shadow-[0_10px_30px_-16px_hsl(265_60%_40%/0.18)]"
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
                          {u.state} · {u.bcba} · CM {u.caseManager}
                        </div>
                      </div>
                      <Pill tone={u.visibility.tone}>{u.visibility.label}</Pill>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Pill tone={u.category.tone}>{u.category.label}</Pill>
                    </div>

                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-foreground/80">{u.concern}</p>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3 w-3" /> Opened: <span className="font-medium text-foreground">{u.opened}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MessageSquare className="h-3 w-3" /> Outreach: <span className="font-medium text-foreground">{u.outreach}</span>
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

        {/* 4. PARENT CONCERN AWARENESS */}
        <section className="space-y-3">
          <SectionHeader title="Parent concern awareness" hint="Where families may need a warm, supportive touch-point." />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PARENT_CONCERNS.map((f) => (
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

        {/* 5. RELATIONSHIP RISK VISIBILITY */}
        <section className="space-y-3">
          <SectionHeader title="Relationship risk visibility" hint="Where family trust may need gentle attention." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {RELATIONSHIP_RISK.map((d) => (
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
                <Pill tone={d.tone}>{d.signal}</Pill>
              </div>
            ))}
          </div>
        </section>

        {/* 6. OPERATIONAL FOLLOW-THROUGH */}
        <section className="space-y-3">
          <SectionHeader title="Operational follow-through" hint="Cross-team visibility into how escalations are being supported." />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {FOLLOW_THROUGH.map((r) => (
              <div
                key={r.label}
                className="relative overflow-hidden rounded-2xl border border-border/60 bg-white/70 p-3.5 text-center backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_hsl(220_30%_50%/0.15)]"
              >
                <div className={`mx-auto grid h-8 w-8 place-items-center rounded-xl ${AVATAR[r.tone]}`}>
                  <r.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className={`mt-2 text-[18px] font-semibold tracking-tight ${r.tone === "alert" ? "text-[hsl(10_75%_45%)]" : r.tone === "amber" ? "text-[hsl(28_85%_40%)]" : r.tone === "violet" ? "text-[hsl(265_60%_50%)]" : r.tone === "warm" ? "text-[hsl(330_60%_45%)]" : r.tone === "cool" ? "text-[hsl(210_70%_42%)]" : "text-[hsl(165_55%_32%)]"}`}>
                  {r.count}
                </div>
                <div className="mt-1 text-[11.5px] font-medium text-foreground">{r.label}</div>
                <div className="mt-0.5 text-[10.5px] text-muted-foreground">{r.hint}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. SERVICE CONTINUITY ESCALATION AWARENESS */}
        <section className="space-y-3">
          <SectionHeader title="Service continuity awareness" hint="Continuity signals that may be driving family concern." />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {CONTINUITY_RISKS.map((r) => (
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
                className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-white/70 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[hsl(265_80%_85%)] hover:shadow-[0_8px_24px_-12px_hsl(220_30%_50%/0.15)]"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[hsl(265_100%_96%)] to-[hsl(330_100%_96%)] text-[hsl(265_60%_50%)]">
                  <a.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <span className="text-center text-[11.5px] font-medium text-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 9. ASK BLOSSOM AI ESCALATION ASSISTANT */}
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-[hsl(265_100%_98%)] via-[hsl(330_100%_98%)] to-[hsl(210_100%_98%)] p-6 backdrop-blur-xl md:p-9">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[hsl(265_100%_94%)] opacity-60 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-[hsl(330_100%_94%)] opacity-50 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(265_60%_90%)] bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[hsl(265_60%_50%)]">
                <Sparkles className="h-3 w-3" /> Ask Blossom AI
              </div>
              <h2 className="mt-3 text-[18px] font-semibold tracking-tight text-foreground md:text-[22px]">
                Escalation awareness assistant
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Blossom AI is learning to surface unresolved family concerns and suggest warm, supportive communication paths.
              </p>
            </div>

            <div className="flex flex-col gap-2 md:min-w-[280px]">
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-white/70 px-3 py-2 text-[12px] text-muted-foreground backdrop-blur">
                <Bot className="h-4 w-4 text-[hsl(265_60%_50%)]" />
                Try asking about escalation awareness...
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

        {/* 10. FUTURE ESCALATION INTELLIGENCE */}
        <section className="space-y-3">
          <SectionHeader title="Future escalation intelligence" hint="What's coming to escalation and relationship awareness." />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FUTURE.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white/60 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[hsl(265_60%_85%)] hover:shadow-[0_10px_30px_-16px_hsl(265_60%_40%/0.18)]"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(265_100%_98%)]/40 via-transparent to-[hsl(330_100%_98%)]/30 opacity-0 transition group-hover:opacity-100" />
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[hsl(265_100%_96%)] to-[hsl(330_100%_96%)] text-[hsl(265_60%_50%)]">
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