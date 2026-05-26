import { OSShell } from "../OSShell";
import {
  HeartHandshake, MessageSquare, AlertTriangle, CalendarDays, ShieldCheck,
  Users, Flame, Activity, Sparkles, ChevronRight, Phone, FileText, BookOpen,
  Bot, Clock, ArrowUpRight, Heart, UserCheck, Bell, PlusCircle, Stethoscope,
  CalendarClock, ShieldAlert, Hourglass, Send, Quote, LineChart, Smile,
} from "lucide-react";

/**
 * Case Manager → Home → Dashboard
 * "Family relationship mission control."
 * Calm, premium, future-ready. All data is placeholder until Phase 2 wires it.
 */

const TONE: Record<string, string> = {
  warm:  "from-[hsl(330_100%_96%)] to-[hsl(20_100%_96%)] text-[hsl(330_60%_50%)]",
  cool:  "from-[hsl(210_100%_97%)] to-[hsl(195_100%_96%)] text-[hsl(210_70%_50%)]",
  alert: "from-[hsl(15_100%_96%)] to-[hsl(0_100%_97%)] text-[hsl(10_75%_55%)]",
  calm:  "from-[hsl(160_60%_95%)] to-[hsl(180_60%_96%)] text-[hsl(165_55%_38%)]",
  violet:"from-[hsl(265_100%_97%)] to-[hsl(285_100%_97%)] text-[hsl(265_60%_55%)]",
  amber: "from-[hsl(40_100%_94%)] to-[hsl(28_100%_95%)] text-[hsl(28_85%_45%)]",
};

const SNAPSHOT = [
  { title: "Follow-ups needed",     value: "—", hint: "this week",          icon: Activity,      tone: "calm"  },
  { title: "Families at risk",      value: "—", hint: "early signals",      icon: HeartHandshake,tone: "warm"  },
  { title: "Parent messages",       value: "—", hint: "awaiting response",  icon: MessageSquare, tone: "cool"  },
  { title: "Scheduling issues",     value: "—", hint: "gaps & cancels",     icon: CalendarDays,  tone: "cool"  },
  { title: "Staffing alerts",       value: "—", hint: "RBT / BCBA changes", icon: Users,         tone: "violet"},
  { title: "Auth concerns",         value: "—", hint: "renewals soon",      icon: ShieldCheck,   tone: "amber" },
  { title: "Open escalations",      value: "—", hint: "needs coordination", icon: Flame,         tone: "alert" },
];

const FAMILIES = [
  { initials: "LM", child: "L. Martinez", bcba: "Dr. Reyes",   rbt: "A. Patel",   concern: "Communication gap",  tone: "warm",  health: "Watch"  },
  { initials: "JK", child: "J. Kim",      bcba: "Dr. Patel",   rbt: "M. Lopez",   concern: "Scheduling concern", tone: "cool",  health: "Stable" },
  { initials: "RS", child: "R. Singh",    bcba: "Dr. Chen",    rbt: "Unassigned", concern: "Staffing pairing",   tone: "violet",health: "Watch"  },
  { initials: "EA", child: "E. Adler",    bcba: "Dr. Reyes",   rbt: "T. Brown",   concern: "Parent follow-up",   tone: "amber", health: "Stable" },
];

const MESSAGES = [
  { name: "Sarah M.",   tag: "Waiting for response", time: "2h ago", preview: "Wanted to check in on the new schedule for next week…", tone: "warm"  },
  { name: "David K.",   tag: "Callback requested",   time: "5h ago", preview: "Could someone call me back about the upcoming sessions?", tone: "amber" },
  { name: "Priya S.",   tag: "Concern escalated",    time: "1d ago", preview: "Following up on the RBT pairing — would love an update.",  tone: "alert" },
  { name: "Maya R.",    tag: "Last contacted: 3d",   time: "3d ago", preview: "Thank you for the warm update earlier this week.",         tone: "calm"  },
];

const COORD = [
  { title: "Scheduling",     icon: CalendarClock, tone: "cool",   lines: ["Pending schedules", "Service gaps", "Attendance concerns", "Conflicts"] },
  { title: "Staffing",       icon: UserCheck,     tone: "violet", lines: ["RBT assignment", "Onboarding movement", "Pairing concerns", "Staffing delays"] },
  { title: "Authorizations", icon: ShieldCheck,   tone: "amber",  lines: ["Expiring auths", "Pending approvals", "Missing documentation", "Delayed submissions"] },
];

const ESCALATIONS = [
  { level: "High",   tone: "alert",  title: "Service interruption — Singh family", meta: "Coordinating with scheduling · opened 2d ago" },
  { level: "Medium", tone: "amber",  title: "Parent dissatisfaction — Adler",      meta: "Awaiting callback · opened 1d ago" },
  { level: "Low",    tone: "calm",   title: "Unresolved support thread — Kim",     meta: "Pending QA review · opened 4d ago" },
];

const QUICK_ACTIONS = [
  { label: "Log follow-up",         icon: PlusCircle },
  { label: "Assigned families",     icon: HeartHandshake },
  { label: "Review escalations",    icon: Flame },
  { label: "Send parent message",   icon: Send },
  { label: "Service issues",        icon: ShieldAlert },
  { label: "Resource library",      icon: BookOpen },
  { label: "Ask Blossom AI",        icon: Bot },
];

const TIMELINE = [
  { time: "Today · 2:00 PM",  title: "Parent callback — Sarah M.",      meta: "Communication check-in" },
  { time: "Tomorrow · 10 AM", title: "BCBA sync — Dr. Reyes",            meta: "Caseload review" },
  { time: "Thu · 1:30 PM",    title: "Staffing check-in — Singh family", meta: "Pairing confirmation" },
  { time: "Fri · 9:00 AM",    title: "Auth renewal review",              meta: "Two clients expiring next week" },
];

const FUTURE_FEATURES = [
  { title: "Family relationship health",   icon: Heart,       desc: "Composite signal across attendance, parent sentiment, and staffing stability." },
  { title: "AI follow-up recommendations", icon: Sparkles,    desc: "Suggested outreach based on engagement and care continuity." },
  { title: "Predictive risk alerts",       icon: LineChart,   desc: "Early warnings before service disruption or churn." },
  { title: "Parent satisfaction monitor",  icon: Smile,       desc: "Lightweight sentiment trend across recent interactions." },
  { title: "Staffing stability insights",  icon: UserCheck,   desc: "See which families have stable vs. shifting clinical teams." },
  { title: "Communication intelligence",   icon: MessageSquare,desc: "Response patterns, gaps, and recommended cadences." },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function today() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function ToneBadge({ tone, children }: { tone: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    alert:  "bg-[hsl(10_85%_96%)] text-[hsl(10_75%_45%)] border-[hsl(10_85%_88%)]",
    amber:  "bg-[hsl(38_100%_94%)] text-[hsl(28_85%_40%)] border-[hsl(38_85%_85%)]",
    warm:   "bg-[hsl(330_100%_96%)] text-[hsl(330_60%_45%)] border-[hsl(330_85%_90%)]",
    cool:   "bg-[hsl(210_100%_96%)] text-[hsl(210_70%_42%)] border-[hsl(210_85%_88%)]",
    calm:   "bg-[hsl(160_50%_94%)] text-[hsl(165_55%_32%)] border-[hsl(160_50%_85%)]",
    violet: "bg-[hsl(265_100%_97%)] text-[hsl(265_60%_50%)] border-[hsl(265_85%_90%)]",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${map[tone] ?? map.calm}`}>
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

export default function OSCaseManager() {
  return (
    <OSShell>
      {/* HERO */}
      <header className="os-rise relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-[hsl(330_100%_98%)] via-white to-[hsl(265_100%_98%)] p-6 md:p-8 shadow-[0_18px_50px_-30px_hsl(330_40%_50%/0.25)]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-[hsl(330_100%_92%)]/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-24 h-52 w-52 rounded-full bg-[hsl(265_100%_94%)]/70 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(330_70%_55%)]">Case Manager · Family Relationship Hub</p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-tight md:text-[36px]">{greeting()}, Rachel.</h1>
            <p className="mt-1.5 text-[14px] text-muted-foreground">{today()} — here's what gently needs your attention today.</p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {[
                { label: "Follow-ups",        value: "—" },
                { label: "Pending messages",  value: "—" },
                { label: "Service risks",     value: "—" },
                { label: "Staffing concerns", value: "—" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2.5 backdrop-blur">
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  <p className="mt-0.5 text-[18px] font-semibold tracking-tight text-foreground/90">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[hsl(330_80%_88%)] bg-white/80 px-3 py-1.5 text-[11.5px] font-medium text-[hsl(330_60%_45%)] backdrop-blur md:self-end">
            <span className="relative grid h-2 w-2 place-items-center">
              <span className="absolute h-2 w-2 animate-ping rounded-full bg-[hsl(330_85%_70%)] opacity-60" />
              <span className="h-2 w-2 rounded-full bg-[hsl(330_85%_60%)]" />
            </span>
            Live data arrives next phase
          </div>
        </div>
      </header>

      {/* 2. OPERATIONAL SNAPSHOT */}
      <section className="mt-6">
        <SectionHeader title="Operational snapshot" hint="A calm, glanceable view of what's moving today." />
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {SNAPSHOT.map((s) => (
            <div key={s.title} className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/75 p-3.5 shadow-[0_6px_20px_-16px_hsl(265_50%_40%/0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5">
              <div className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${TONE[s.tone]}`}>
                <s.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </div>
              <p className="mt-2.5 text-[12px] font-medium text-muted-foreground">{s.title}</p>
              <p className="mt-0.5 text-[22px] font-semibold tracking-tight text-foreground/90">{s.value}</p>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">{s.hint}</p>
              <div className="mt-2"><ComingSoon /></div>
            </div>
          ))}
        </div>
      </section>

      {/* 3 + 4 — TWO COLUMN ON LG */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* FAMILIES REQUIRING ATTENTION */}
        <section className="lg:col-span-2">
          <SectionHeader title="Families requiring attention" hint="People — not tickets. Surfaced with care." action="Open all" />
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FAMILIES.map((f) => (
              <div key={f.child} className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_8px_24px_-18px_hsl(330_40%_45%/0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-start gap-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${TONE[f.tone]} text-[12px] font-semibold`}>
                    {f.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13.5px] font-semibold tracking-tight">{f.child}</p>
                      <ToneBadge tone={f.health === "Watch" ? "amber" : "calm"}>{f.health}</ToneBadge>
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">BCBA · {f.bcba} • RBT · {f.rbt}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <ToneBadge tone={f.tone}>{f.concern}</ToneBadge>
                      <span className="text-[10.5px] text-muted-foreground">Follow-up suggested</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                  <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> Relationship</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Scheduling</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> Staffing</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PARENT COMMUNICATION CENTER */}
        <section>
          <SectionHeader title="Parent communication" hint="Conversations that need warmth." action="Open inbox" />
          <div className="mt-3 overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-[0_8px_24px_-18px_hsl(210_50%_40%/0.18)] backdrop-blur-md">
            {MESSAGES.map((m, i) => (
              <div key={m.name} className={`flex items-start gap-3 p-3.5 ${i < MESSAGES.length - 1 ? "border-b border-border/60" : ""}`}>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[hsl(210_100%_94%)] to-[hsl(265_100%_96%)] text-[11px] font-semibold text-[hsl(210_70%_45%)]">
                  {m.name.split(" ").map((p) => p[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[12.5px] font-semibold">{m.name}</p>
                    <span className="shrink-0 text-[10.5px] text-muted-foreground">{m.time}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">{m.preview}</p>
                  <div className="mt-1.5"><ToneBadge tone={m.tone}>{m.tag}</ToneBadge></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 5. OPERATIONAL COORDINATION */}
      <section className="mt-8">
        <SectionHeader title="Operational coordination" hint="Visibility into the moving parts around your families." />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {COORD.map((c) => (
            <div key={c.title} className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_8px_24px_-18px_hsl(265_50%_40%/0.16)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${TONE[c.tone]}`}>
                    <c.icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <p className="text-[13.5px] font-semibold tracking-tight">{c.title}</p>
                </div>
                <ComingSoon />
              </div>
              <ul className="mt-3 space-y-1.5">
                {c.lines.map((l) => (
                  <li key={l} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[12px] text-foreground/80 hover:bg-muted/60">
                    <span>{l}</span>
                    <span className="text-[10.5px] text-muted-foreground">—</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 6 + 7 — TWO COLUMN */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ESCALATIONS */}
        <section className="lg:col-span-2">
          <SectionHeader title="Escalations & risks" hint="Calmly tracked. Nothing slips." action="Open queue" />
          <div className="mt-3 overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-[0_8px_24px_-18px_hsl(10_50%_45%/0.18)] backdrop-blur-md">
            {ESCALATIONS.map((e, i) => (
              <div key={e.title} className={`flex items-center gap-3 p-4 ${i < ESCALATIONS.length - 1 ? "border-b border-border/60" : ""}`}>
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${TONE[e.tone]}`}>
                  <Flame className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <ToneBadge tone={e.tone}>{e.level}</ToneBadge>
                    <p className="truncate text-[13px] font-semibold">{e.title}</p>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">{e.meta}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            ))}
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section>
          <SectionHeader title="Quick actions" hint="One tap to the next right step." />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                className="group flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 p-3 text-left shadow-[0_6px_18px_-14px_hsl(265_50%_40%/0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[hsl(330_80%_88%)]"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[hsl(330_100%_96%)] to-[hsl(265_100%_97%)] text-[hsl(330_60%_50%)]">
                  <a.icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <span className="text-[12.5px] font-medium tracking-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* 8. ASK BLOSSOM AI */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-[hsl(265_60%_92%)] bg-gradient-to-br from-[hsl(265_100%_98%)] via-white to-[hsl(285_100%_98%)] p-6">
        <div className="pointer-events-none absolute" />
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-white shadow-[0_8px_24px_-10px_hsl(265_70%_55%/0.5)]">
              <Sparkles className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-[hsl(285_85%_70%)]" />
            </div>
            <div>
              <p className="text-[14px] font-semibold tracking-tight">Ask Blossom AI — your operational co-pilot</p>
              <p className="text-[12px] text-muted-foreground">Calm, emotionally aware help for the relationships you steward.</p>
            </div>
          </div>
          <ComingSoon />
        </div>
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "3 families may need outreach today",
            "2 scheduling risks detected this week",
            "1 authorization expiration approaching",
            "Parent communication delays identified",
            "Suggest a warm check-in for the Singh family",
            "Summarize this week's escalations",
          ].map((line) => (
            <div key={line} className="flex items-start gap-2 rounded-xl border border-white/70 bg-white/75 px-3 py-2.5 text-[12.5px] text-foreground/85 backdrop-blur-sm transition hover:border-[hsl(265_60%_85%)]">
              <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(265_70%_55%)]" />
              <span className="leading-snug">{line}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 9. UPCOMING FOLLOW-UPS */}
      <section className="mt-8">
        <SectionHeader title="Upcoming follow-ups" hint="A gentle timeline of what's next." />
        <div className="mt-3 rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_8px_24px_-18px_hsl(210_50%_40%/0.16)] backdrop-blur-md">
          <ol className="relative space-y-4 border-l border-border/60 pl-5">
            {TIMELINE.map((t) => (
              <li key={t.title} className="relative">
                <span className="absolute -left-[27px] top-1 grid h-4 w-4 place-items-center rounded-full border border-white bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(330_85%_70%)] shadow-[0_0_0_3px_hsl(265_100%_97%)]" />
                <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{t.time}</p>
                <p className="mt-0.5 text-[13px] font-semibold tracking-tight">{t.title}</p>
                <p className="text-[11.5px] text-muted-foreground">{t.meta}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 10. FUTURE FEATURES */}
      <section className="mt-8 mb-2">
        <SectionHeader title="Future dashboard features" hint="What's quietly being built next." />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FUTURE_FEATURES.map((f) => (
            <div key={f.title} className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-5 backdrop-blur-md">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_100%_97%)] to-[hsl(330_100%_97%)] text-[hsl(265_60%_55%)]">
                    <f.icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <ComingSoon />
                </div>
                <p className="mt-3 text-[13.5px] font-semibold tracking-tight">{f.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{f.desc}</p>
                <div className="mt-3 space-y-1.5 opacity-70">
                  <div className="os-skeleton h-2 w-3/4 rounded-full" />
                  <div className="os-skeleton h-2 w-1/2 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </OSShell>
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