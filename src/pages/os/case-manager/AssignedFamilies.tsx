import { OSShell } from "../OSShell";
import { useState } from "react";
import {
  Users, HeartHandshake, MessageSquare, CalendarDays, ShieldCheck, UserCog,
  AlertTriangle, Flame, Sparkles, ChevronRight, Search, Filter, MapPin,
  Phone, Clock, Activity, Heart, Bot, Quote, X, LineChart, Smile, Bell,
  CalendarClock, ShieldAlert, PauseCircle, CheckCircle2, ArrowUpRight,
  Stethoscope, BookOpen,
} from "lucide-react";

/**
 * Case Manager → Family Relationships → Assigned Families
 * "Relationship intelligence workspace." Calm, premium, future-ready.
 * All data is placeholder until Phase 2 wires it.
 */

type Tone = "warm" | "cool" | "calm" | "amber" | "alert" | "violet";

const TONE_BG: Record<Tone, string> = {
  warm:   "from-[hsl(330_100%_96%)] to-[hsl(20_100%_96%)] text-[hsl(330_60%_50%)]",
  cool:   "from-[hsl(210_100%_97%)] to-[hsl(195_100%_96%)] text-[hsl(210_70%_50%)]",
  calm:   "from-[hsl(160_60%_95%)] to-[hsl(180_60%_96%)] text-[hsl(165_55%_38%)]",
  amber:  "from-[hsl(40_100%_94%)] to-[hsl(28_100%_95%)] text-[hsl(28_85%_45%)]",
  alert:  "from-[hsl(15_100%_96%)] to-[hsl(0_100%_97%)] text-[hsl(10_75%_55%)]",
  violet: "from-[hsl(265_100%_97%)] to-[hsl(285_100%_97%)] text-[hsl(265_60%_55%)]",
};

const PILL: Record<Tone, string> = {
  warm:   "bg-[hsl(330_100%_96%)] text-[hsl(330_60%_45%)] border-[hsl(330_85%_90%)]",
  cool:   "bg-[hsl(210_100%_96%)] text-[hsl(210_70%_42%)] border-[hsl(210_85%_88%)]",
  calm:   "bg-[hsl(160_50%_94%)] text-[hsl(165_55%_32%)] border-[hsl(160_50%_85%)]",
  amber:  "bg-[hsl(38_100%_94%)] text-[hsl(28_85%_40%)] border-[hsl(38_85%_85%)]",
  alert:  "bg-[hsl(10_85%_96%)] text-[hsl(10_75%_45%)] border-[hsl(10_85%_88%)]",
  violet: "bg-[hsl(265_100%_97%)] text-[hsl(265_60%_50%)] border-[hsl(265_85%_90%)]",
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

type Family = {
  id: string;
  initials: string;
  child: string;
  bcba: string;
  rbt: string;
  state: string;
  avatar: Tone;
  chips: { label: string; tone: Tone }[];
  health: "Stable" | "Watch" | "At risk";
  healthTone: Tone;
  lastContact: string;
  nextFollowUp: string;
  openConcerns: number;
  continuity: "Strong" | "Mixed" | "Fragile";
};

const FAMILIES: Family[] = [
  {
    id: "f1", initials: "LM", child: "Liam Martinez", bcba: "Dr. Reyes", rbt: "A. Patel",
    state: "GA", avatar: "warm", health: "Watch", healthTone: "amber",
    chips: [{ label: "Follow-up needed", tone: "amber" }, { label: "Services active", tone: "calm" }],
    lastContact: "3 days ago", nextFollowUp: "Today · 2:00 PM", openConcerns: 1, continuity: "Mixed",
  },
  {
    id: "f2", initials: "JK", child: "Jin Kim", bcba: "Dr. Patel", rbt: "M. Lopez",
    state: "NC", avatar: "cool", health: "Stable", healthTone: "calm",
    chips: [{ label: "Schedule concern", tone: "cool" }, { label: "Services active", tone: "calm" }],
    lastContact: "Yesterday", nextFollowUp: "Thu · 1:30 PM", openConcerns: 0, continuity: "Strong",
  },
  {
    id: "f3", initials: "RS", child: "Ravi Singh", bcba: "Dr. Chen", rbt: "Unassigned",
    state: "TN", avatar: "violet", health: "At risk", healthTone: "alert",
    chips: [{ label: "Needs RBT", tone: "alert" }, { label: "Parent callback", tone: "warm" }],
    lastContact: "5 days ago", nextFollowUp: "Tomorrow · 10:00 AM", openConcerns: 2, continuity: "Fragile",
  },
  {
    id: "f4", initials: "EA", child: "Eva Adler", bcba: "Dr. Reyes", rbt: "T. Brown",
    state: "VA", avatar: "amber", health: "Stable", healthTone: "calm",
    chips: [{ label: "Authorization pending", tone: "amber" }, { label: "Services active", tone: "calm" }],
    lastContact: "Today", nextFollowUp: "Fri · 9:00 AM", openConcerns: 0, continuity: "Strong",
  },
  {
    id: "f5", initials: "NB", child: "Noah Bennett", bcba: "Dr. Howard", rbt: "S. Cole",
    state: "MD", avatar: "calm", health: "Watch", healthTone: "amber",
    chips: [{ label: "Communication gap", tone: "amber" }, { label: "Staffing stable", tone: "calm" }],
    lastContact: "8 days ago", nextFollowUp: "Today · 4:30 PM", openConcerns: 1, continuity: "Mixed",
  },
  {
    id: "f6", initials: "AO", child: "Amara Obi", bcba: "Dr. Patel", rbt: "K. Diaz",
    state: "GA", avatar: "warm", health: "Stable", healthTone: "calm",
    chips: [{ label: "Services active", tone: "calm" }, { label: "Routine check-in", tone: "cool" }],
    lastContact: "2 days ago", nextFollowUp: "Mon · 11:00 AM", openConcerns: 0, continuity: "Strong",
  },
  {
    id: "f7", initials: "MC", child: "Mateo Castro", bcba: "Dr. Chen", rbt: "J. Park",
    state: "NC", avatar: "violet", health: "Watch", healthTone: "amber",
    chips: [{ label: "Schedule gaps", tone: "cool" }, { label: "Follow-up needed", tone: "amber" }],
    lastContact: "4 days ago", nextFollowUp: "Wed · 3:15 PM", openConcerns: 1, continuity: "Mixed",
  },
  {
    id: "f8", initials: "ZW", child: "Zoe Walker", bcba: "Dr. Reyes", rbt: "L. Nguyen",
    state: "TN", avatar: "cool", health: "At risk", healthTone: "alert",
    chips: [{ label: "Services paused", tone: "alert" }, { label: "Escalation open", tone: "alert" }],
    lastContact: "6 days ago", nextFollowUp: "Today · 5:00 PM", openConcerns: 3, continuity: "Fragile",
  },
];

const RELATIONSHIP_OVERVIEW = [
  { title: "Relationship stability", value: "—", hint: "Trust signals across caseload",  icon: Heart,          tone: "warm"   as Tone },
  { title: "Communication cadence",  value: "—", hint: "Outreach rhythm health",         icon: MessageSquare,  tone: "cool"   as Tone },
  { title: "Engagement trend",       value: "—", hint: "Parent + family engagement",     icon: Activity,       tone: "calm"   as Tone },
  { title: "Continuity signal",      value: "—", hint: "Service continuity awareness",   icon: ShieldCheck,    tone: "violet" as Tone },
];

const COMMUNICATION = [
  { name: "Sarah M.",  tag: "Callback requested",       tone: "amber" as Tone, time: "2h ago", preview: "Wanted to talk about the new schedule for next week…" },
  { name: "David K.",  tag: "Follow-up due tomorrow",   tone: "cool"  as Tone, time: "1d ago", preview: "Following up on the RBT pairing — appreciate an update." },
  { name: "Priya S.",  tag: "No communication 14 days", tone: "amber" as Tone, time: "14d",     preview: "Last touch-point was the orientation packet confirmation." },
  { name: "Maya R.",   tag: "Concern escalated",        tone: "alert" as Tone, time: "3d ago",  preview: "Parent raised continuity concern — escalation opened." },
];

const VISIBILITY = [
  { title: "Scheduling visibility",  icon: CalendarClock, tone: "cool"   as Tone, lines: ["Schedule consistency", "Attendance concerns", "Session interruptions", "Reschedule gaps"] },
  { title: "Staffing visibility",    icon: UserCog,       tone: "violet" as Tone, lines: ["RBT assignment status", "Staffing gaps", "Onboarding movement", "Pairing concerns"] },
  { title: "Authorization visibility",icon: ShieldCheck,  tone: "amber"  as Tone, lines: ["Pending authorizations", "Expiring authorizations", "Missing documentation", "QA review items"] },
];

const ATTENTION = [
  { title: "Parent callback — Sarah M.",       meta: "Liam Martinez · today",        tone: "warm"  as Tone, icon: Phone        },
  { title: "Staffing concern — Singh family",  meta: "Awaiting RBT pairing",          tone: "alert" as Tone, icon: UserCog      },
  { title: "Scheduling review — Walker",       meta: "2 sessions interrupted",        tone: "cool"  as Tone, icon: CalendarDays },
  { title: "Service pause review — Walker",    meta: "Paused 6 days",                 tone: "alert" as Tone, icon: PauseCircle  },
  { title: "Escalation pending — Singh",       meta: "Awaiting leadership reply",     tone: "alert" as Tone, icon: Flame        },
  { title: "Follow-up due — Bennett",          meta: "Communication gap · 8d",        tone: "amber" as Tone, icon: Bell         },
];

const FUTURE = [
  { title: "Family relationship health scores", icon: Heart,         desc: "A gentle composite signal across engagement, communication, and continuity." },
  { title: "AI follow-up suggestions",          icon: Sparkles,      desc: "Recommended next outreach based on engagement patterns." },
  { title: "Parent satisfaction tracking",      icon: Smile,         desc: "Lightweight sentiment trend across recent interactions." },
  { title: "Predictive service risk monitoring",icon: LineChart,     desc: "Early warning before service interruption or churn." },
  { title: "Staffing stability trends",         icon: UserCog,       desc: "See which families have stable vs. shifting clinical teams." },
  { title: "Communication intelligence",        icon: MessageSquare, desc: "Response patterns, gaps, and recommended cadences." },
];

const FILTERS = ["All", "Needs attention", "Follow-up due", "Schedule concerns", "Staffing risks", "Auth concerns", "Escalations"];

export default function CMAssignedFamiliesPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [openFamily, setOpenFamily] = useState<Family | null>(null);

  return (
    <OSShell>
      {/* HERO */}
      <header className="os-rise relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-[hsl(330_100%_98%)] via-white to-[hsl(265_100%_98%)] p-6 md:p-8 shadow-[0_18px_50px_-30px_hsl(330_40%_50%/0.25)]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-[hsl(330_100%_92%)]/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-24 h-52 w-52 rounded-full bg-[hsl(265_100%_94%)]/70 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(330_70%_55%)]">Case Manager · Family Relationships</p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-tight md:text-[34px]">Assigned Families</h1>
            <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              Monitor relationships, support continuity, and stay ahead of family needs — calmly.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {[
                { label: "Follow-ups needed",     tone: "amber" as Tone },
                { label: "Requiring attention",   tone: "warm"  as Tone },
                { label: "Scheduling concerns",   tone: "cool"  as Tone },
                { label: "Staffing risks",        tone: "violet" as Tone },
                { label: "Communication gaps",    tone: "amber" as Tone },
              ].map((c) => <Pill key={c.label} tone={c.tone}>{c.label} · —</Pill>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 self-start sm:grid-cols-2 md:self-end md:gap-3">
            <div className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2.5 backdrop-blur">
              <p className="text-[11px] text-muted-foreground">Assigned</p>
              <p className="mt-0.5 text-[20px] font-semibold tracking-tight text-foreground/90">{FAMILIES.length}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2.5 backdrop-blur">
              <p className="text-[11px] text-muted-foreground">Health</p>
              <p className="mt-0.5 text-[20px] font-semibold tracking-tight text-foreground/90">Calm</p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. RELATIONSHIP OVERVIEW */}
      <section className="mt-6">
        <SectionHeader title="Family relationship overview" hint="A calm, glanceable view of relationship intelligence." />
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {RELATIONSHIP_OVERVIEW.map((r) => (
            <div key={r.title} className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_6px_20px_-16px_hsl(265_50%_40%/0.18)] backdrop-blur-md transition hover:-translate-y-0.5">
              <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${TONE_BG[r.tone]}`}>
                <r.icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <p className="mt-3 text-[12.5px] font-medium text-muted-foreground">{r.title}</p>
              <p className="mt-0.5 text-[18px] font-semibold tracking-tight text-foreground/90">{r.value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{r.hint}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SEARCH + FILTERS */}
      <section className="mt-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/80 p-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 sm:max-w-sm sm:flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search families, BCBA, RBT, state…"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition ${
                  activeFilter === f
                    ? "border-[hsl(330_80%_85%)] bg-[hsl(330_100%_97%)] text-[hsl(330_60%_45%)]"
                    : "border-border/70 bg-white/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
            <button className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-white/70 px-2.5 py-1.5 text-[11.5px] font-medium text-muted-foreground hover:text-foreground">
              <Filter className="h-3 w-3" /> More
            </button>
          </div>
        </div>
      </section>

      {/* 3. ASSIGNED FAMILIES GRID */}
      <section className="mt-6">
        <SectionHeader title="Your families" hint="Human-centered cards. Tap one to open a relationship workspace." action="Open all" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FAMILIES.map((f) => (
            <button
              key={f.id}
              onClick={() => setOpenFamily(f)}
              className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-4 text-left shadow-[0_8px_24px_-18px_hsl(330_40%_45%/0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[hsl(330_80%_88%)] hover:shadow-[0_18px_40px_-22px_hsl(330_55%_45%/0.25)]"
            >
              {/* TOP */}
              <div className="flex items-start gap-3">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br ${TONE_BG[f.avatar]} text-[13px] font-semibold`}>
                  {f.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[14px] font-semibold tracking-tight">{f.child}</p>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      <MapPin className="h-2.5 w-2.5" /> {f.state}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">BCBA · {f.bcba}</p>
                  <p className="truncate text-[11.5px] text-muted-foreground">RBT · {f.rbt}</p>
                </div>
              </div>

              {/* MIDDLE */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill tone={f.healthTone} icon={Heart}>{f.health}</Pill>
                {f.chips.map((c) => <Pill key={c.label} tone={c.tone}>{c.label}</Pill>)}
              </div>

              {/* BOTTOM */}
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-[10.5px]">
                <div>
                  <p className="text-muted-foreground">Last contact</p>
                  <p className="mt-0.5 font-medium text-foreground/80">{f.lastContact}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Next follow-up</p>
                  <p className="mt-0.5 font-medium text-foreground/80">{f.nextFollowUp}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Open concerns</p>
                  <p className="mt-0.5 font-medium text-foreground/80">{f.openConcerns}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Continuity</p>
                  <p className={`mt-0.5 font-medium ${f.continuity === "Fragile" ? "text-[hsl(10_75%_45%)]" : f.continuity === "Mixed" ? "text-[hsl(28_85%_45%)]" : "text-[hsl(165_55%_38%)]"}`}>{f.continuity}</p>
                </div>
              </div>

              <div className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/80 opacity-0 shadow-sm backdrop-blur transition-all group-hover:translate-x-0 group-hover:opacity-100">
                <ChevronRight className="h-3.5 w-3.5 text-foreground/70" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 6 + 8 — TWO COLUMN */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* COMMUNICATION SNAPSHOT */}
        <section className="lg:col-span-2">
          <SectionHeader title="Communication snapshot" hint="Where parent conversations need warmth." action="Open inbox" />
          <div className="mt-3 overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-[0_8px_24px_-18px_hsl(210_50%_40%/0.16)] backdrop-blur-md">
            {COMMUNICATION.map((m, i) => (
              <div key={m.name} className={`flex items-start gap-3 p-4 ${i < COMMUNICATION.length - 1 ? "border-b border-border/60" : ""}`}>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[hsl(210_100%_94%)] to-[hsl(265_100%_96%)] text-[11px] font-semibold text-[hsl(210_70%_45%)]">
                  {m.name.split(" ").map((p) => p[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[12.5px] font-semibold">{m.name}</p>
                    <span className="shrink-0 text-[10.5px] text-muted-foreground">{m.time}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">{m.preview}</p>
                  <div className="mt-1.5"><Pill tone={m.tone}>{m.tag}</Pill></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOLLOW-UP & ATTENTION */}
        <section>
          <SectionHeader title="Attention needed" hint="Calmly tracked next steps." />
          <div className="mt-3 space-y-2">
            {ATTENTION.map((a) => (
              <div key={a.title} className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 p-3 backdrop-blur-md transition hover:-translate-y-0.5">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${TONE_BG[a.tone]}`}>
                  <a.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold tracking-tight">{a.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{a.meta}</p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 7. OPERATIONAL VISIBILITY */}
      <section className="mt-8">
        <SectionHeader title="Operational visibility" hint="Visibility only — the people who own these will act." />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {VISIBILITY.map((v) => (
            <div key={v.title} className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_8px_24px_-18px_hsl(265_50%_40%/0.16)] backdrop-blur-md transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${TONE_BG[v.tone]}`}>
                    <v.icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <p className="text-[13.5px] font-semibold tracking-tight">{v.title}</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {v.lines.map((l) => (
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

      {/* 9. ASK BLOSSOM AI PREVIEW */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-[hsl(265_60%_92%)] bg-gradient-to-br from-[hsl(265_100%_98%)] via-white to-[hsl(285_100%_98%)] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-white shadow-[0_8px_24px_-10px_hsl(265_70%_55%/0.5)]">
              <Sparkles className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-[hsl(285_85%_70%)]" />
            </div>
            <div>
              <p className="text-[14px] font-semibold tracking-tight">Relationship insights from Blossom AI</p>
              <p className="text-[12px] text-muted-foreground">Calm, family-aware nudges across your caseload.</p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "3 families may require follow-up this week",
            "Scheduling instability detected for 2 families",
            "Communication delay identified — Bennett family",
            "Potential service continuity risk — Singh family",
            "Draft a warm check-in message for Sarah M.",
            "Summarize Walker family's last 30 days",
          ].map((line) => (
            <div key={line} className="flex items-start gap-2 rounded-xl border border-white/70 bg-white/75 px-3 py-2.5 text-[12.5px] text-foreground/85 backdrop-blur-sm transition hover:border-[hsl(265_60%_85%)]">
              <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(265_70%_55%)]" />
              <span className="leading-snug">{line}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 10. FUTURE FEATURES */}
      <section className="mt-8 mb-6">
        <SectionHeader title="Coming soon" hint="What's quietly being built next." />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FUTURE.map((f) => (
            <div key={f.title} className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-5 backdrop-blur-md">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_100%_97%)] to-[hsl(330_100%_97%)] text-[hsl(265_60%_55%)]">
                    <f.icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
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

      {/* MOBILE STICKY FOLLOW-UP BAR */}
      <div className="sticky bottom-3 z-30 mx-auto mt-4 flex max-w-md items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3 py-2 shadow-[0_12px_32px_-16px_hsl(330_40%_45%/0.35)] backdrop-blur-md md:hidden">
        <Bell className="h-4 w-4 text-[hsl(330_60%_55%)]" />
        <p className="flex-1 truncate text-[12px] font-medium">Next follow-up · Today 2:00 PM</p>
        <button className="rounded-full bg-gradient-to-br from-[hsl(330_85%_65%)] to-[hsl(265_85%_70%)] px-3 py-1 text-[11.5px] font-semibold text-white">
          Open
        </button>
      </div>

      {/* DETAIL PANEL */}
      {openFamily && <FamilyDetailPanel family={openFamily} onClose={() => setOpenFamily(null)} />}
    </OSShell>
  );
}

function FamilyDetailPanel({ family, onClose }: { family: Family; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="os-rise relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/70 bg-gradient-to-b from-white via-white to-[hsl(330_100%_99%)] p-6 shadow-[0_30px_80px_-40px_hsl(330_50%_40%/0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-white/80 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>

        {/* HEADER */}
        <div className="flex items-start gap-3">
          <div className={`grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br ${TONE_BG[family.avatar]} text-[16px] font-semibold`}>
            {family.initials}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Family workspace</p>
            <h3 className="mt-0.5 text-[20px] font-semibold tracking-tight">{family.child}</h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Pill tone={family.healthTone} icon={Heart}>{family.health}</Pill>
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/60 px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" /> {family.state}
              </span>
            </div>
          </div>
        </div>

        {/* SECTIONS */}
        <div className="mt-6 space-y-4">
          <PanelBlock icon={Heart} title="Relationship summary" tone="warm">
            <p>Trust signals, engagement trends, and parent communication overview will live here.</p>
          </PanelBlock>

          <PanelBlock icon={Stethoscope} title="Assigned team" tone="cool">
            <ul className="space-y-1.5">
              <li className="flex justify-between"><span className="text-muted-foreground">BCBA</span><span className="font-medium">{family.bcba}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">RBT</span><span className="font-medium">{family.rbt}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Scheduler</span><span className="font-medium">Coming soon</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Authorization</span><span className="font-medium">Coming soon</span></li>
            </ul>
          </PanelBlock>

          <PanelBlock icon={ShieldCheck} title="Service continuity" tone="violet">
            <ul className="space-y-1.5">
              <li className="flex justify-between"><span className="text-muted-foreground">Continuity</span><span className="font-medium">{family.continuity}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Attendance concerns</span><span className="font-medium">—</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Staffing stability</span><span className="font-medium">—</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Pause history</span><span className="font-medium">—</span></li>
            </ul>
          </PanelBlock>

          <PanelBlock icon={BookOpen} title="Family notes" tone="calm">
            <p>Operational notes, support context, and reminders will live here. Premium note editor is on its way.</p>
          </PanelBlock>

          <PanelBlock icon={Flame} title="Escalations" tone="alert">
            <p>Open concerns, parent frustrations, and operational risks tracked calmly. {family.openConcerns} open today.</p>
          </PanelBlock>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button className="rounded-xl bg-gradient-to-br from-[hsl(330_85%_65%)] to-[hsl(265_85%_70%)] px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-10px_hsl(330_60%_50%/0.5)]">
            Send check-in
          </button>
          <button className="rounded-xl border border-border/70 bg-white/80 px-4 py-2.5 text-[12.5px] font-semibold text-foreground/85 backdrop-blur hover:border-[hsl(330_80%_85%)]">
            Log follow-up
          </button>
        </div>
      </aside>
    </div>
  );
}

function PanelBlock({ icon: Icon, title, tone, children }: { icon: typeof Heart; title: string; tone: Tone; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_6px_18px_-14px_hsl(265_50%_40%/0.16)] backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${TONE_BG[tone]}`}>
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          </div>
          <p className="text-[12.5px] font-semibold tracking-tight">{title}</p>
        </div>
      </div>
      <div className="mt-3 text-[12px] leading-relaxed text-foreground/80">{children}</div>
    </div>
  );
}