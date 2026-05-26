import { OSShell } from "../OSShell";
import {
  HeartHandshake, MessageSquare, AlertTriangle, CalendarDays, ShieldCheck,
  Users, Flame, Activity, Sparkles, ChevronRight,
} from "lucide-react";

/**
 * Case Manager Dashboard — calm, supportive, family-relationship hub.
 * Placeholder cards only; functionality wires in a later phase.
 */

const PLACEHOLDER_SECTIONS: {
  title: string;
  description: string;
  icon: typeof HeartHandshake;
  tone: "warm" | "cool" | "alert" | "calm";
}[] = [
  { title: "Families needing attention", description: "Gentle nudges based on engagement signals and missed touch-points.", icon: HeartHandshake, tone: "warm" },
  { title: "Follow-ups needed",          description: "Conversations to close from this week — parents, BCBAs, and intake.",   icon: Activity,      tone: "calm" },
  { title: "Parent messages",            description: "Recent inbound notes from your assigned families.",                     icon: MessageSquare, tone: "cool" },
  { title: "Staffing concerns",          description: "Visibility into staffing changes that affect your families.",            icon: Users,         tone: "calm" },
  { title: "Scheduling alerts",          description: "Cancellations, gaps, or shifts that may need a family check-in.",        icon: CalendarDays,  tone: "cool" },
  { title: "Authorization risks",        description: "Auths approaching limits or renewals worth flagging early.",             icon: ShieldCheck,   tone: "warm" },
  { title: "Escalations",                description: "Open escalations being coordinated across the team.",                    icon: Flame,         tone: "alert" },
  { title: "Service continuity risks",   description: "Early signals that a family's care might be disrupted.",                  icon: AlertTriangle, tone: "alert" },
];

const TONE: Record<string, string> = {
  warm:  "from-[hsl(330_100%_96%)] to-[hsl(20_100%_96%)] text-[hsl(330_60%_50%)]",
  cool:  "from-[hsl(210_100%_97%)] to-[hsl(195_100%_96%)] text-[hsl(210_70%_50%)]",
  alert: "from-[hsl(15_100%_96%)] to-[hsl(0_100%_97%)] text-[hsl(10_75%_55%)]",
  calm:  "from-[hsl(160_60%_95%)] to-[hsl(180_60%_96%)] text-[hsl(165_55%_38%)]",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function OSCaseManager() {
  return (
    <OSShell>
      {/* HERO */}
      <header className="os-rise relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-[hsl(330_100%_98%)] via-white to-[hsl(265_100%_98%)] p-6 md:p-8 shadow-[0_18px_50px_-30px_hsl(330_40%_50%/0.25)]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-[hsl(330_100%_92%)]/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-24 h-52 w-52 rounded-full bg-[hsl(265_100%_94%)]/70 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(330_70%_55%)]">Case Manager · Family Relationship Hub</p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-tight md:text-[34px]">{greeting()} — your families are looking calm today.</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              A calm view of the relationships you steward — parents, BCBAs, schedules, and care continuity. We surface only what needs your warmth, judgment, or a gentle nudge.
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[hsl(330_80%_88%)] bg-white/80 px-3 py-1.5 text-[11.5px] font-medium text-[hsl(330_60%_45%)] backdrop-blur md:self-end">
            <span className="relative grid h-2 w-2 place-items-center">
              <span className="absolute h-2 w-2 animate-ping rounded-full bg-[hsl(330_85%_70%)] opacity-60" />
              <span className="h-2 w-2 rounded-full bg-[hsl(330_85%_60%)]" />
            </span>
            Role launching — live data arrives next phase
          </div>
        </div>
      </header>

      {/* PLACEHOLDER GRID */}
      <section className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {PLACEHOLDER_SECTIONS.map((s) => (
          <div
            key={s.title}
            className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/75 p-5 shadow-[0_8px_24px_-18px_hsl(265_50%_40%/0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_hsl(265_55%_45%/0.28)]"
          >
            <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${TONE[s.tone]}`}>
              <s.icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <p className="mt-3 text-[14px] font-semibold tracking-tight text-foreground">{s.title}</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{s.description}</p>
            <div className="mt-4 space-y-2">
              <div className="os-skeleton h-2 w-3/4 rounded-full" />
              <div className="os-skeleton h-2 w-1/2 rounded-full" />
              <div className="os-skeleton mt-3 h-10 w-full rounded-xl" />
            </div>
            <div className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-medium text-[hsl(265_60%_55%)]">
              Coming soon <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        ))}
      </section>

      {/* AI PREVIEW */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-[hsl(265_60%_92%)] bg-gradient-to-br from-[hsl(265_100%_98%)] via-white to-[hsl(285_100%_98%)] p-6">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[13.5px] font-semibold tracking-tight">Ask Blossom AI — your operational co-pilot</p>
            <p className="text-[12px] text-muted-foreground">Calm, emotionally aware help for the relationships you steward.</p>
          </div>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Summarize this week's family concerns",
            "Suggest follow-ups for families I haven't touched",
            "Identify service continuity risks across my caseload",
            "Draft a warm check-in message to a parent",
            "Surface escalations that need my attention",
            "Review staffing changes affecting my families",
          ].map((line) => (
            <li
              key={line}
              className="flex items-start gap-2 rounded-xl border border-white/70 bg-white/75 px-3 py-2 text-[12.5px] text-foreground/85 backdrop-blur-sm"
            >
              <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(265_70%_55%)]" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>
    </OSShell>
  );
}