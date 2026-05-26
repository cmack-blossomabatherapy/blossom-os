import { useState } from "react";
import {
  ShieldCheck, ShieldAlert, Heart, MessageSquare, AlertTriangle,
  Flame, Sparkles, ChevronRight, Search, Filter, Clock, Bot, Bell,
  CheckCircle2, ArrowUpRight, Send, PhoneCall, Mail, Users, Eye,
  FileText, FileWarning, CalendarClock, ClipboardList, Hourglass,
  LineChart, Activity, Inbox, Smile, RefreshCw,
} from "lucide-react";

/**
 * Case Manager → Operations → Authorizations Visibility
 * VISIBILITY ONLY — calm authorization awareness + service continuity center.
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
        <button className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-foreground/80 backdrop-blur transition hover:border-[hsl(210_80%_82%)] hover:text-[hsl(210_70%_42%)]">
          {action} <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ---------------- placeholder data ---------------- */

type AuthRow = {
  id: string; initials: string; child: string; family: string; state: string;
  bcba: string; avatar: Tone;
  priority: { label: string; tone: Tone };
  authStatus: { label: string; tone: Tone };
  concern: string;
  expiration: string;
  parentOutreach: string;
  status: { label: string; tone: Tone; icon: typeof Heart };
  impact: { label: string; tone: Tone; icon: typeof Heart };
};

const AUTHS: AuthRow[] = [
  {
    id: "a1", initials: "LM", child: "Liam", family: "Maria", state: "GA",
    bcba: "Dr. Patel", avatar: "amber",
    priority: { label: "Expiring soon", tone: "amber" },
    authStatus: { label: "Approved · Expiring", tone: "amber" },
    concern: "Authorization expires in 9 days — reassessment window approaching.",
    expiration: "9 days",
    parentOutreach: "Pending today",
    status: { label: "Auth team aware", tone: "violet", icon: Eye },
    impact: { label: "Continuity at risk", tone: "amber", icon: ShieldAlert },
  },
  {
    id: "a2", initials: "AV", child: "Ava", family: "Jasmine", state: "NC",
    bcba: "Dr. Lee", avatar: "cool",
    priority: { label: "Parent update", tone: "cool" },
    authStatus: { label: "Approved", tone: "calm" },
    concern: "Authorization approved — family update may bring reassurance.",
    expiration: "104 days",
    parentOutreach: "Sent yesterday",
    status: { label: "Parent contacted", tone: "cool", icon: MessageSquare },
    impact: { label: "Stable continuity", tone: "calm", icon: CheckCircle2 },
  },
  {
    id: "a3", initials: "NO", child: "Noah", family: "Daniel", state: "TN",
    bcba: "Dr. Chen", avatar: "alert",
    priority: { label: "Missing info", tone: "alert" },
    authStatus: { label: "Awaiting submission", tone: "alert" },
    concern: "Missing documentation may delay authorization continuity.",
    expiration: "—",
    parentOutreach: "Outreach overdue",
    status: { label: "Awaiting auth team", tone: "violet", icon: Hourglass },
    impact: { label: "Service delay risk", tone: "alert", icon: ShieldAlert },
  },
  {
    id: "a4", initials: "EL", child: "Eli", family: "Renee", state: "MD",
    bcba: "Dr. Lee", avatar: "violet",
    priority: { label: "QA review", tone: "violet" },
    authStatus: { label: "QA review", tone: "violet" },
    concern: "Treatment plan in QA review — gentle awareness only.",
    expiration: "21 days",
    parentOutreach: "Sent today",
    status: { label: "QA review pending", tone: "violet", icon: ClipboardList },
    impact: { label: "Monitoring", tone: "violet", icon: Eye },
  },
  {
    id: "a5", initials: "MI", child: "Mia", family: "Sara", state: "VA",
    bcba: "Dr. Patel", avatar: "calm",
    priority: { label: "Routine awareness", tone: "calm" },
    authStatus: { label: "Approved", tone: "calm" },
    concern: "Authorization stable — no family communication needed.",
    expiration: "168 days",
    parentOutreach: "Not needed",
    status: { label: "Stable", tone: "calm", icon: CheckCircle2 },
    impact: { label: "Healthy continuity", tone: "calm", icon: CheckCircle2 },
  },
  {
    id: "a6", initials: "ZN", child: "Zoe", family: "Nina", state: "GA",
    bcba: "Dr. Chen", avatar: "warm",
    priority: { label: "Reassessment", tone: "amber" },
    authStatus: { label: "Reassessment due", tone: "amber" },
    concern: "Reassessment approaching — family preparation may be helpful.",
    expiration: "28 days",
    parentOutreach: "Sent 2d ago",
    status: { label: "Parent contacted", tone: "warm", icon: MessageSquare },
    impact: { label: "Continuity supported", tone: "warm", icon: Heart },
  },
];

const STABILITY = [
  { icon: CheckCircle2,  label: "Authorization health", value: "Healthy",      tone: "calm"   as Tone },
  { icon: CalendarClock, label: "Expiring within 30d",  value: "2 families",    tone: "amber"  as Tone },
  { icon: FileWarning,   label: "Missing information",  value: "1 family",      tone: "alert"  as Tone },
  { icon: ShieldAlert,   label: "Continuity risks",     value: "2 fragile",     tone: "violet" as Tone },
];

const EXPIRING = [
  { initials: "LM", family: "Maria · Liam",  days: "9 days",   tone: "amber"  as Tone, hint: "Reassessment window opening" },
  { initials: "EL", family: "Renee · Eli",   days: "21 days",  tone: "violet" as Tone, hint: "QA review pending" },
  { initials: "ZN", family: "Nina · Zoe",    days: "28 days",  tone: "amber"  as Tone, hint: "Reassessment approaching" },
  { initials: "AV", family: "Jasmine · Ava", days: "104 days", tone: "calm"   as Tone, hint: "Comfortably ahead" },
  { initials: "MI", family: "Sara · Mia",    days: "168 days", tone: "calm"   as Tone, hint: "Stable horizon" },
];

const MISSING = [
  { icon: FileWarning,   title: "Missing treatment plan",   desc: "1 family — gently awaiting BCBA upload.",     tone: "alert" as Tone, count: 1 },
  { icon: FileText,      title: "Outstanding forms",        desc: "2 families — intake forms not yet returned.", tone: "amber" as Tone, count: 2 },
  { icon: ClipboardList, title: "Documentation gaps",       desc: "1 family — QA noted a small gap.",            tone: "violet" as Tone, count: 1 },
  { icon: Hourglass,     title: "Awaiting payer info",      desc: "1 family — payer follow-up in progress.",     tone: "cool" as Tone, count: 1 },
];

const FAMILY_IMPACT = [
  { icon: MessageSquare, title: "Parent reassurance needed",   desc: "2 families may benefit from a calm auth update.", tone: "amber"  as Tone },
  { icon: PhoneCall,     title: "Warm continuity outreach",    desc: "1 family awaiting a check-in about timelines.",    tone: "cool"   as Tone },
  { icon: Heart,         title: "Authorization concern voiced", desc: "1 family expressed concern after recent delay.",  tone: "violet" as Tone },
  { icon: Bell,          title: "Follow-up outreach due",      desc: "3 families on this week's follow-up list.",        tone: "amber"  as Tone },
];

const CONTINUITY_RISKS = [
  { icon: CalendarClock, label: "Start date may slip",        count: 1, tone: "amber"  as Tone, hint: "Pending treatment auth" },
  { icon: ShieldAlert,   label: "Service interruption risk",  count: 1, tone: "alert"  as Tone, hint: "Auth expiring soon" },
  { icon: Hourglass,     label: "Reassessment delays",        count: 2, tone: "violet" as Tone, hint: "BCBA scheduling reassessment" },
  { icon: FileWarning,   label: "Missing info blocking auth", count: 1, tone: "alert"  as Tone, hint: "Documentation gap" },
  { icon: RefreshCw,     label: "Pending initial auth",       count: 1, tone: "cool"   as Tone, hint: "New family in pipeline" },
  { icon: CheckCircle2,  label: "Stable continuity",          count: 4, tone: "calm"   as Tone, hint: "No action needed" },
];

const QUICK_ACTIONS = [
  { icon: Bell,        label: "Log follow-up" },
  { icon: Eye,         label: "Review visibility" },
  { icon: Users,       label: "Assigned families" },
  { icon: PhoneCall,   label: "Contact parent" },
  { icon: ShieldAlert, label: "Service concerns" },
  { icon: Flame,       label: "View escalations" },
  { icon: Bot,         label: "Ask Blossom AI" },
];

const AI_SUGGESTIONS = [
  "2 authorizations may impact service continuity soon",
  "Missing documentation detected for Noah",
  "Reassessment window opening for Liam in 9 days",
  "Parent communication may be helpful for Eli",
  "Summarize this week's authorization concerns calmly",
];

const FUTURE = [
  { icon: ShieldAlert, title: "Predictive authorization risk alerts", desc: "Early signals before disruption reaches families." },
  { icon: Sparkles,    title: "AI continuity monitoring",             desc: "Quiet awareness of fragile authorization continuity." },
  { icon: MessageSquare,title: "Parent communication intelligence",   desc: "Suggested updates for delicate auth moments." },
  { icon: CalendarClock,title: "Expiration forecasting",              desc: "See where authorizations will land months ahead." },
  { icon: LineChart,   title: "Authorization stability tracking",     desc: "Trends across families, regions, and payers." },
  { icon: Activity,    title: "Service continuity insights",          desc: "Unified continuity signal across teams." },
];

/* ---------------- page ---------------- */

export default function CMAuthorizationsVisibilityPage() {
  const [filter, setFilter] = useState<"All" | "Expiring" | "Missing info" | "Stable">("All");

  return (
    <div className="relative min-h-full bg-gradient-to-b from-[hsl(210_50%_99%)] via-background to-[hsl(160_50%_99%)] pb-28 md:pb-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[hsl(210_100%_92%)] opacity-50 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[hsl(265_100%_95%)] opacity-50 blur-3xl" />
        <div className="absolute left-1/3 top-44 h-64 w-64 rounded-full bg-[hsl(160_70%_94%)] opacity-40 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-6 md:px-8 md:pt-10">
        {/* 1. HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-white/70 p-6 backdrop-blur-xl md:p-9">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/60 via-white/30 to-[hsl(265_100%_98%)]/60" />
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(265_85%_90%)] bg-[hsl(265_100%_97%)] px-2.5 py-1 text-[11px] font-medium text-[hsl(265_60%_50%)]">
                <ShieldCheck className="h-3 w-3" strokeWidth={2.25} /> Operations · Visibility
              </div>
              <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-foreground md:text-[32px]">
                Authorizations Visibility
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                Stay aware of authorization-related service risks and help families stay informed.
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                <Eye className="h-3 w-3" /> Visibility only — the authorizations team owns submissions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="amber"  icon={CalendarClock}>2 expiring soon</Pill>
              <Pill tone="violet" icon={Hourglass}>1 pending auth</Pill>
              <Pill tone="alert"  icon={FileWarning}>1 missing info</Pill>
              <Pill tone="cool"   icon={ShieldAlert}>2 continuity risks</Pill>
              <Pill tone="warm"   icon={MessageSquare}>3 family follow-ups</Pill>
            </div>
          </div>
        </section>

        {/* 2. STABILITY SNAPSHOT */}
        <section className="space-y-3">
          <SectionHeader title="Authorization stability" hint="A calm read on auth health across your caseload." />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {STABILITY.map((c) => (
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

        {/* 3. AUTHORIZATION VISIBILITY FEED */}
        <section className="space-y-3">
          <SectionHeader title="Authorization visibility" hint="Where auth awareness may touch families this week." action="View all" />

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search families, concerns, or auth status"
                className="h-10 w-full rounded-2xl border border-border/70 bg-white/70 pl-9 pr-3 text-[13px] outline-none backdrop-blur transition placeholder:text-muted-foreground/70 focus:border-[hsl(265_70%_82%)] focus:ring-2 focus:ring-[hsl(265_80%_94%)]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["All", "Expiring", "Missing info", "Stable"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11.5px] font-medium transition ${
                    filter === f
                      ? "border-[hsl(265_70%_82%)] bg-[hsl(265_100%_97%)] text-[hsl(265_60%_50%)]"
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
            {AUTHS.map((u) => (
              <article
                key={u.id}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white/75 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_85%)] hover:shadow-[0_10px_30px_-16px_hsl(265_60%_40%/0.18)]"
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
                          {u.state} · {u.bcba}
                        </div>
                      </div>
                      <Pill tone={u.priority.tone}>{u.priority.label}</Pill>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Pill tone={u.authStatus.tone} icon={ShieldCheck}>Auth · {u.authStatus.label}</Pill>
                    </div>

                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-foreground/80">{u.concern}</p>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-2 text-[11px]">
                      <div>
                        <div className="text-muted-foreground">Expiration</div>
                        <div className="mt-0.5 font-medium text-foreground/85">{u.expiration}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Parent outreach</div>
                        <div className="mt-0.5 font-medium text-foreground/85">{u.parentOutreach}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Pill tone={u.status.tone} icon={u.status.icon}>{u.status.label}</Pill>
                      <Pill tone={u.impact.tone} icon={u.impact.icon}>{u.impact.label}</Pill>
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

        {/* 4. EXPIRING SOON */}
        <section className="space-y-3">
          <SectionHeader title="Expiring soon" hint="A proactive, supportive look at the horizon." />
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-white/70 backdrop-blur-xl">
            <div className="hidden grid-cols-12 gap-3 border-b border-border/60 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:grid">
              <div className="col-span-5">Family</div>
              <div className="col-span-3">Expires in</div>
              <div className="col-span-4">Awareness</div>
            </div>
            <ul className="divide-y divide-border/60">
              {EXPIRING.map((p) => (
                <li key={p.family} className="grid grid-cols-2 items-center gap-3 px-4 py-3 md:grid-cols-12">
                  <div className="col-span-2 flex items-center gap-3 md:col-span-5">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${AVATAR[p.tone]}`}>
                      {p.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-foreground">{p.family}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{p.hint}</div>
                    </div>
                  </div>
                  <div className="col-span-1 text-[11.5px] text-muted-foreground md:hidden">Expires</div>
                  <div className="col-span-1 text-right text-[12px] font-medium text-foreground/85 md:col-span-3 md:text-left">{p.days}</div>
                  <div className="col-span-1 text-[11.5px] text-muted-foreground md:hidden">Awareness</div>
                  <div className="col-span-1 md:col-span-4"><Pill tone={p.tone} icon={CalendarClock}>{p.hint}</Pill></div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. MISSING INFO */}
        <section className="space-y-3">
          <SectionHeader title="Missing information" hint="Where small gaps may block authorization continuity." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {MISSING.map((c) => (
              <div key={c.title} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-white/70 p-4 backdrop-blur-xl transition hover:-translate-y-0.5">
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${AVATAR[c.tone]}`}>
                  <c.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13px] font-semibold text-foreground">{c.title}</div>
                    <Pill tone={c.tone}>{c.count}</Pill>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6 + 7. FAMILY IMPACT + CONTINUITY RISKS */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <SectionHeader title="Family impact coordination" hint="Where reassurance or outreach may be needed." />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {FAMILY_IMPACT.map((c) => (
                <div key={c.title} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-white/70 p-4 backdrop-blur-xl">
                  <div className={`grid h-9 w-9 place-items-center rounded-xl ${AVATAR[c.tone]}`}>
                    <c.icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-foreground">{c.title}</div>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <SectionHeader title="Continuity risks" hint="Quiet awareness — not crisis." />
            <div className="rounded-2xl border border-border/60 bg-white/70 backdrop-blur-xl">
              <ul className="divide-y divide-border/60">
                {CONTINUITY_RISKS.map((s) => (
                  <li key={s.label} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`grid h-8 w-8 place-items-center rounded-xl ${AVATAR[s.tone]}`}>
                        <s.icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-medium text-foreground">{s.label}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">{s.hint}</div>
                      </div>
                    </div>
                    <Pill tone={s.tone}>{s.count}</Pill>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 8. QUICK ACTIONS */}
        <section className="space-y-3">
          <SectionHeader title="Quick actions" hint="One tap to coordinate calmly." />
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 lg:grid-cols-7">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-white/70 p-3 text-center backdrop-blur transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_82%)] hover:shadow-[0_8px_24px_-12px_hsl(265_60%_40%/0.18)]"
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_100%_96%)] to-[hsl(210_100%_96%)] text-[hsl(265_60%_50%)] transition group-hover:scale-105">
                  <a.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <span className="text-[11.5px] font-medium text-foreground/85">{a.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 9. ASK BLOSSOM AI */}
        <section className="space-y-3">
          <SectionHeader title="Ask Blossom AI" hint="A quiet assistant for authorization awareness." />
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
                  <ComingSoon />
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  Soon, Blossom will surface authorization risks, suggest family communication, and prepare calm continuity summaries.
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
          <SectionHeader title="On the roadmap" hint="The future of authorization continuity intelligence." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {FUTURE.map((f) => (
              <div key={f.title} className="relative overflow-hidden rounded-2xl border border-border/60 bg-white/55 p-5 backdrop-blur-xl">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/30 to-[hsl(265_100%_97%)]/40" />
                <div className="flex items-center justify-between">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_100%_96%)] to-[hsl(210_100%_96%)] text-[hsl(265_60%_50%)]">
                    <f.icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <ComingSoon />
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
          <div className="mt-3 text-[13.5px] font-semibold text-foreground">No urgent authorization continuity concerns currently detected.</div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Authorization visibility and family coordination insights will appear here.
          </p>
          <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Smile className="h-3 w-3" /> You're caught up.
          </div>
        </section>
      </div>

      {/* MOBILE STICKY BAR */}
      <div className="fixed inset-x-3 bottom-3 z-30 md:hidden">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-white/85 px-3 py-2 shadow-[0_10px_30px_-10px_hsl(265_60%_40%/0.25)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_100%_94%)] to-[hsl(210_100%_94%)] text-[hsl(265_60%_50%)]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-[12px] font-medium text-foreground">Auth visibility</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="grid h-9 w-9 place-items-center rounded-full bg-muted/70 text-foreground/80"><PhoneCall className="h-4 w-4" /></button>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-muted/70 text-foreground/80"><Mail className="h-4 w-4" /></button>
            <button className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[hsl(265_70%_55%)] to-[hsl(210_75%_55%)] px-3 py-2 text-[12px] font-medium text-white shadow-sm">
              <Send className="h-3.5 w-3.5" /> Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}