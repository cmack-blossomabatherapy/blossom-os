import { useState } from "react";
import {
  MessageSquare, HeartHandshake, Activity, AlertTriangle, Flame,
  Sparkles, ChevronRight, Search, Filter, Phone, Clock, Heart, Bot,
  Bell, CalendarClock, CheckCircle2, ArrowUpRight, Send, FileText,
  PhoneCall, Mail, Users, ShieldAlert, LineChart, Smile, Inbox,
} from "lucide-react";

/**
 * Case Manager → Family Relationships → Parent Communication
 * Calm, premium "communication intelligence center."
 * All data is placeholder. Mobile-first, future-ready.
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

type Thread = {
  id: string;
  initials: string;
  parent: string;
  child: string;
  avatar: Tone;
  timestamp: string;
  priority: { label: string; tone: Tone };
  summary: string;
  status: { label: string; tone: Tone; icon: typeof Heart };
  health: { label: string; tone: Tone };
};

const THREADS: Thread[] = [
  {
    id: "t1", initials: "MR", parent: "Maria", child: "Liam", avatar: "warm",
    timestamp: "2h ago",
    priority: { label: "Parent concern", tone: "amber" },
    summary: "Parent requested an update regarding staffing timeline for next week.",
    status: { label: "Follow-up due", tone: "amber", icon: Clock },
    health: { label: "Watch", tone: "amber" },
  },
  {
    id: "t2", initials: "JT", parent: "Jasmine", child: "Ava", avatar: "cool",
    timestamp: "Yesterday",
    priority: { label: "Service continuity", tone: "violet" },
    summary: "Follow-up needed after a missed session — parent open to reschedule.",
    status: { label: "Awaiting parent response", tone: "cool", icon: MessageSquare },
    health: { label: "Stable", tone: "calm" },
  },
  {
    id: "t3", initials: "DC", parent: "Daniel", child: "Noah", avatar: "alert",
    timestamp: "2d ago",
    priority: { label: "Escalation review", tone: "alert" },
    summary: "Authorization delay communicated — family asking for a leadership update.",
    status: { label: "Escalation needed", tone: "alert", icon: Flame },
    health: { label: "At risk", tone: "alert" },
  },
  {
    id: "t4", initials: "SP", parent: "Sara", child: "Mia", avatar: "calm",
    timestamp: "3d ago",
    priority: { label: "Routine follow-up", tone: "calm" },
    summary: "General parent check-in — schedule consistency feels strong this month.",
    status: { label: "Communication stable", tone: "calm", icon: CheckCircle2 },
    health: { label: "Stable", tone: "calm" },
  },
  {
    id: "t5", initials: "RH", parent: "Renee", child: "Eli", avatar: "violet",
    timestamp: "4d ago",
    priority: { label: "Staffing concern", tone: "amber" },
    summary: "Schedule adjustment follow-up needed — parent prefers afternoons.",
    status: { label: "Leadership reviewed", tone: "violet", icon: ShieldAlert },
    health: { label: "Watch", tone: "amber" },
  },
];

const FOLLOWUPS = [
  { label: "Call Maria tomorrow",                  due: "Tomorrow · 10:00am", tone: "amber"  as Tone },
  { label: "Review staffing update with Jasmine",  due: "This week",          tone: "cool"   as Tone },
  { label: "Confirm schedule adjustment for Eli",  due: "This week",          tone: "violet" as Tone },
  { label: "Follow up after BCBA discussion · Noah", due: "Overdue · 1d",     tone: "alert"  as Tone },
  { label: "Recheck authorization update · Mia",   due: "Next Mon",           tone: "calm"   as Tone },
];

const RISKS = [
  { icon: Clock,        title: "No communication in 14+ days", desc: "1 family approaching the quiet threshold.", tone: "amber"  as Tone },
  { icon: AlertTriangle,title: "Repeated parent concern",      desc: "Recurring topic detected across 2 threads.", tone: "alert" as Tone },
  { icon: LineChart,    title: "Escalation trend detected",     desc: "Slight uptick over the last 30 days.",      tone: "violet" as Tone },
  { icon: Smile,        title: "Service instability signal",    desc: "Coverage changes may need a warm check-in.", tone: "cool"  as Tone },
];

const TEMPLATES = [
  { icon: MessageSquare, title: "Parent follow-up",            desc: "Warm, brief, and human.",                 tone: "warm"   as Tone },
  { icon: Clock,         title: "Staffing delay update",        desc: "Honest, calm, and reassuring.",           tone: "amber"  as Tone },
  { icon: CalendarClock, title: "Schedule adjustment",          desc: "Clear options without pressure.",         tone: "cool"   as Tone },
  { icon: ShieldAlert,   title: "Authorization delay message",  desc: "Transparent, family-first framing.",      tone: "violet" as Tone },
  { icon: HeartHandshake,title: "General check-in",             desc: "Quick warmth — no agenda.",               tone: "calm"   as Tone },
  { icon: Flame,         title: "Escalation follow-up",         desc: "Structured, sensitive, and clear.",       tone: "alert"  as Tone },
];

const AI_SUGGESTIONS = [
  "Draft a parent follow-up for Maria",
  "Summarize unresolved concerns across my caseload",
  "Identify families that may need outreach this week",
  "Review communication stability for at-risk families",
  "Prepare an escalation summary for Noah's family",
];

const FUTURE = [
  { icon: Sparkles,   title: "AI communication summaries",      desc: "Auto-summaries of every family thread." },
  { icon: Smile,      title: "Parent satisfaction monitoring",  desc: "Gentle pulse on how families feel." },
  { icon: Heart,      title: "Relationship health scores",      desc: "A calm, single-number relationship signal." },
  { icon: LineChart,  title: "Communication trend tracking",    desc: "Patterns across weeks and months." },
  { icon: ShieldAlert,title: "Predictive escalation alerts",    desc: "Quiet, early signals before things escalate." },
  { icon: Activity,   title: "Outreach consistency monitoring", desc: "Stay consistent across every family." },
];

/* ---------------- page ---------------- */

export default function CMParentCommunicationPage() {
  const [filter, setFilter] = useState<"All" | "Follow-up" | "Concerns" | "Escalations">("All");

  return (
    <div className="relative min-h-full bg-gradient-to-b from-[hsl(20_50%_99%)] via-background to-[hsl(330_60%_99%)] pb-28 md:pb-12">
      {/* soft floating background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[hsl(330_100%_90%)] opacity-50 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[hsl(210_100%_92%)] opacity-50 blur-3xl" />
        <div className="absolute left-1/3 top-40 h-64 w-64 rounded-full bg-[hsl(265_100%_94%)] opacity-40 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-6 md:px-8 md:pt-10">
        {/* 1. HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-white/70 p-6 backdrop-blur-xl md:p-9">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/60 via-white/30 to-[hsl(330_100%_97%)]/60" />
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(330_85%_90%)] bg-[hsl(330_100%_97%)] px-2.5 py-1 text-[11px] font-medium text-[hsl(330_60%_45%)]">
                <Heart className="h-3 w-3" strokeWidth={2.25} /> Family Relationships
              </div>
              <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-foreground md:text-[32px]">
                Parent Communication
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                Keep communication clear, supportive, and consistent across every family.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="amber"  icon={Clock}>4 follow-ups</Pill>
              <Pill tone="alert"  icon={Flame}>2 unresolved</Pill>
              <Pill tone="cool"   icon={PhoneCall}>3 callbacks</Pill>
              <Pill tone="violet" icon={MessageSquare}>1 gap</Pill>
              <Pill tone="warm"   icon={ShieldAlert}>1 escalation</Pill>
            </div>
          </div>
        </section>

        {/* 2. COMMUNICATION HEALTH SNAPSHOT */}
        <section className="space-y-3">
          <SectionHeader title="Communication snapshot" hint="A calm read on where your families are this week." />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { icon: Clock,         label: "Awaiting follow-up", value: "4",  tone: "amber"  as Tone },
              { icon: MessageSquare, label: "Open conversations", value: "12", tone: "cool"   as Tone },
              { icon: AlertTriangle, label: "Unresolved concerns", value: "2", tone: "alert"  as Tone },
              { icon: CheckCircle2,  label: "Stable this week",    value: "9", tone: "calm"   as Tone },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-border/60 bg-white/70 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_hsl(220_30%_50%/0.15)]">
                <div className={`grid h-8 w-8 place-items-center rounded-xl ${AVATAR[c.tone]}`}>
                  <c.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="mt-3 text-[22px] font-semibold tracking-tight text-foreground">{c.value}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">{c.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. PARENT COMMUNICATION FEED */}
        <section className="space-y-3">
          <SectionHeader title="Parent communication feed" hint="The conversations that matter most, surfaced calmly." action="View all" />

          {/* search + filter */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search families, concerns, or threads"
                className="h-10 w-full rounded-2xl border border-border/70 bg-white/70 pl-9 pr-3 text-[13px] outline-none backdrop-blur transition placeholder:text-muted-foreground/70 focus:border-[hsl(330_80%_85%)] focus:ring-2 focus:ring-[hsl(330_80%_92%)]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["All", "Follow-up", "Concerns", "Escalations"] as const).map((f) => (
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
            {THREADS.map((t) => (
              <article
                key={t.id}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white/75 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[hsl(330_80%_88%)] hover:shadow-[0_10px_30px_-16px_hsl(330_60%_40%/0.18)]"
              >
                <div className="flex items-start gap-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${AVATAR[t.avatar]}`}>
                    {t.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-semibold text-foreground">
                          {t.parent} <span className="font-normal text-muted-foreground">· {t.child}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">{t.timestamp}</div>
                      </div>
                      <Pill tone={t.priority.tone}>{t.priority.label}</Pill>
                    </div>

                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-foreground/80">
                      {t.summary}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Pill tone={t.status.tone} icon={t.status.icon}>{t.status.label}</Pill>
                      <Pill tone={t.health.tone} icon={Heart}>{t.health.label}</Pill>
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

        {/* 4 + 5. FOLLOW-UPS + PRIORITY */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <SectionHeader title="Follow-up queue" hint="Today, this week, and a gentle nudge for what's overdue." />
            <div className="rounded-2xl border border-border/60 bg-white/70 backdrop-blur-xl">
              <ul className="divide-y divide-border/60">
                {FOLLOWUPS.map((f) => (
                  <li key={f.label} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`grid h-8 w-8 place-items-center rounded-xl ${AVATAR[f.tone]}`}>
                        <Bell className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-foreground">{f.label}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">{f.due}</div>
                      </div>
                    </div>
                    <Pill tone={f.tone}>{f.tone === "alert" ? "Overdue" : "Open"}</Pill>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <SectionHeader title="Conversation priority" hint="Lightweight priority — never alarming." />
            <div className="rounded-2xl border border-border/60 bg-white/70 p-4 backdrop-blur-xl">
              <div className="flex flex-wrap gap-1.5">
                <Pill tone="calm">Routine follow-up</Pill>
                <Pill tone="amber">Parent concern</Pill>
                <Pill tone="violet">Service continuity</Pill>
                <Pill tone="cool">Staffing concern</Pill>
                <Pill tone="alert">Escalation review</Pill>
                <Pill tone="warm">Urgent callback</Pill>
              </div>
              <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
                Priorities help you sort the day calmly. AI-assisted prioritization is on the way.
              </p>
            </div>
          </div>
        </section>

        {/* 6. RELATIONSHIP RISK SIGNALS */}
        <section className="space-y-3">
          <SectionHeader title="Relationship risk signals" hint="Quiet awareness — not alarms." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {RISKS.map((r) => (
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

        {/* 7. QUICK OUTREACH ACTIONS */}
        <section className="space-y-3">
          <SectionHeader title="Quick outreach" hint="One tap to do the next caring thing." />
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 lg:grid-cols-7">
            {[
              { icon: FileText,      label: "Log follow-up" },
              { icon: Send,          label: "Send check-in" },
              { icon: Flame,         label: "Review escalations" },
              { icon: Users,         label: "Assigned families" },
              { icon: AlertTriangle, label: "Service concerns" },
              { icon: PhoneCall,     label: "Schedule callback" },
              { icon: Bot,           label: "Operational Insights" },
            ].map((a) => (
              <button
                key={a.label}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-white/70 p-3 text-center backdrop-blur transition hover:-translate-y-0.5 hover:border-[hsl(330_80%_85%)] hover:shadow-[0_8px_24px_-12px_hsl(330_60%_40%/0.18)]"
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(330_100%_96%)] to-[hsl(20_100%_96%)] text-[hsl(330_60%_45%)] transition group-hover:scale-105">
                  <a.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <span className="text-[11.5px] font-medium text-foreground/85">{a.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 8. COMMUNICATION TEMPLATES PREVIEW */}
        <section className="space-y-3">
          <SectionHeader title="Communication templates" hint="Warm, on-brand starting points for common moments." action="Preview all" />
          <div className="relative">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((t) => (
                <div key={t.title} className="relative overflow-hidden rounded-2xl border border-border/60 bg-white/60 p-4 backdrop-blur-xl">
                  <div className={`grid h-8 w-8 place-items-center rounded-xl ${AVATAR[t.tone]}`}>
                    <t.icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-[13px] font-semibold text-foreground">{t.title}</div>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{t.desc}</p>
                  <button disabled className="mt-3 inline-flex cursor-not-allowed items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                    Use template <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. ASK BLOSSOM AI */}
        <section className="space-y-3">
          <SectionHeader title="Operational Insights" hint="A quiet assistant for the relationship work." />
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
                  Soon, Blossom will help you write, summarize, and prioritize family communication — always in your voice.
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

        {/* 10. COMING SOON FUTURE FEATURES */}
        <section className="space-y-3">
          <SectionHeader title="On the roadmap" hint="The future of family communication at Blossom." />
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

        {/* empty state hint (calm) */}
        <section className="rounded-3xl border border-dashed border-border/70 bg-white/40 px-5 py-7 text-center backdrop-blur-xl">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(160_60%_94%)] to-[hsl(180_60%_95%)] text-[hsl(165_55%_35%)]">
            <Inbox className="h-5 w-5" />
          </div>
          <div className="mt-3 text-[13.5px] font-semibold text-foreground">You're caught up where it matters.</div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            No urgent parent communication needs detected. Insights and follow-ups will appear here.
          </p>
        </section>
      </div>

      {/* MOBILE STICKY OUTREACH BAR */}
      <div className="fixed inset-x-3 bottom-3 z-30 md:hidden">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-white/85 px-3 py-2 shadow-[0_10px_30px_-10px_hsl(330_60%_40%/0.25)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(330_100%_94%)] to-[hsl(20_100%_94%)] text-[hsl(330_60%_45%)]">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="text-[12px] font-medium text-foreground">Quick outreach</div>
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