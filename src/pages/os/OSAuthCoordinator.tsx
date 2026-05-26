import { Link } from "react-router-dom";
import { useMemo } from "react";
import {
  Sparkles, ChevronRight, Inbox, Send, BadgeCheck, ShieldAlert, CalendarClock,
  FileWarning, ClipboardCheck, UserX, AlertTriangle, FileText, FileSignature,
  ShieldCheck, FilePlus2, Stamp, Brain, ArrowRight, MapPin, Flame, RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import type { Authorization, AuthStage } from "@/data/authorizations";

/* ─────────── tone helpers (calm, not loud) ─────────── */

type Tone = "ok" | "info" | "warn" | "crit";

const toneChip: Record<Tone, string> = {
  ok:   "bg-[hsl(150_60%_94%)] text-[hsl(155_50%_32%)]",
  info: "bg-[hsl(220_80%_96%)] text-[hsl(220_60%_42%)]",
  warn: "bg-[hsl(38_100%_94%)] text-[hsl(30_75%_40%)]",
  crit: "bg-[hsl(355_90%_96%)] text-[hsl(355_65%_48%)]",
};
const toneDot: Record<Tone, string> = {
  ok:   "bg-[hsl(155_55%_48%)]",
  info: "bg-[hsl(220_70%_55%)]",
  warn: "bg-[hsl(35_85%_52%)]",
  crit: "bg-[hsl(355_70%_55%)]",
};
const toneIcon: Record<Tone, string> = {
  ok:   "bg-[hsl(150_60%_94%)] text-[hsl(155_50%_32%)]",
  info: "bg-[hsl(220_80%_96%)] text-[hsl(220_60%_42%)]",
  warn: "bg-[hsl(38_100%_94%)] text-[hsl(30_75%_40%)]",
  crit: "bg-[hsl(355_90%_96%)] text-[hsl(355_65%_48%)]",
};

const aiPrompts = [
  "What auths are at risk this week?",
  "Which PRs need escalation?",
  "Show me cases missing documentation.",
  "What should I work on first today?",
  "Which authorizations are stuck in QA?",
];

const quickActions: { label: string; icon: React.ElementType; to: string }[] = [
  { label: "New Authorization",       icon: FilePlus2,     to: "/authorizations?new=1" },
  { label: "Awaiting Submission",     icon: Inbox,         to: "/authorizations?stage=awaiting" },
  { label: "Expiring Soon",           icon: CalendarClock, to: "/authorizations?stage=expiring" },
  { label: "Missing Documentation",   icon: FileWarning,   to: "/authorizations?stage=missing" },
  { label: "PR Tracking",             icon: FileText,      to: "/authorizations?view=pr" },
  { label: "QA Review",               icon: ClipboardCheck,to: "/qa" },
  { label: "Authorization Reports",   icon: BadgeCheck,    to: "/reports" },
];

/* ─────────── tiny presentational atoms ─────────── */

function SectionHeader({
  eyebrow, title, subtitle, action,
}: { eyebrow?: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>}
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

function CountChip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums", toneChip[tone])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", toneDot[tone])} />
      {children}
    </span>
  );
}

/* ─────────── page ─────────── */

export default function OSAuthCoordinator() {
  const { user } = useAuth();
  const first = ((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "there").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const { items, loading } = useLiveAuthorizations();

  /** Derive every panel from real Monday-imported authorizations. */
  const live = useMemo(() => deriveAuthStats(items), [items]);
  const { focusItems, lifecycle, expirationWindows, qaItems, blockers, denials, states, prTracking } = live;
  void loading;

  return (
    <OSShell
      rightRail={
        <>
          {/* AI quick prompts */}
          <section className="os-card relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.22)] to-transparent blur-2xl" />
            <header className="mb-3 flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_72%)] text-white">
                <Brain className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold tracking-tight">Ask Blossom AI</h3>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Authorization Operations</p>
              </div>
            </header>
            <ul className="space-y-1.5">
              {aiPrompts.map((p) => (
                <li key={p}>
                  <Link
                    to={`/ask?q=${encodeURIComponent(p)}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-[12px] text-foreground/80 transition hover:-translate-y-0.5 hover:text-foreground hover:shadow-[0_10px_24px_-14px_hsl(265_60%_50%/0.25)]"
                  >
                    <span className="truncate">{p}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* State coverage */}
          <section className="os-card">
            <SectionHeader title="Authorization Coverage" subtitle="By state" />
            <ul className="space-y-1.5">
              {states.map((s) => (
                <li key={s.name}>
                  <Link
                    to={`/authorizations?state=${encodeURIComponent(s.name)}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/60 bg-white/60 px-3 py-2 transition hover:bg-white/80"
                  >
                    <span className="flex items-center gap-2 text-[12.5px] font-medium">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {s.name}
                    </span>
                    <span className="flex items-center gap-2">
                      {s.risk > 0 && <CountChip tone="warn">{s.risk} risk</CountChip>}
                      <span className="text-[12px] font-semibold tabular-nums text-foreground/80">{s.count}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      }
    >
      {/* 1 ── Welcome strip */}
      <header className="os-rise relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-white via-[hsl(220_100%_99%)] to-[hsl(265_100%_99%)] p-6 shadow-[0_20px_50px_-30px_hsl(265_60%_50%/0.18)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-[hsl(265_85%_70%/0.22)] to-transparent blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-muted-foreground backdrop-blur">
              <Stamp className="h-3 w-3 text-[hsl(265_70%_55%)]" /> Authorization Coordinator
            </div>
            <h1 className="mt-3 text-[26px] font-semibold tracking-tight md:text-[30px]">
              {greet}, <span className="capitalize">{first}</span>
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              Here's what needs authorization attention today · {today}
            </p>
          </div>
          <Link
            to="/ask"
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-4 py-2.5 text-[12.5px] font-semibold text-foreground/85 shadow-[0_10px_24px_-14px_hsl(265_60%_50%/0.25)] backdrop-blur transition hover:-translate-y-0.5 hover:text-foreground"
          >
            <Sparkles className="h-4 w-4 text-[hsl(265_70%_55%)]" />
            Ask Blossom AI
          </Link>
        </div>
      </header>

      {/* 2 ── Today's Authorization Focus (primary card) */}
      <section className="os-card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(220_85%_75%/0.18)] to-transparent blur-3xl" />
        <SectionHeader
          eyebrow="Priorities"
          title="Today's Authorization Focus"
          subtitle="What needs attention before it delays services, reimbursement, or client progression."
        />
        <ul className="grid gap-2.5">
          {focusItems.map((f) => {
            const Icon = f.icon;
            return (
              <li key={f.label}>
                <Link
                  to={f.to}
                  className="group flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 p-3.5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_hsl(220_60%_50%/0.22)]"
                >
                  <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", toneIcon[f.tone])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold leading-tight">{f.label}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{f.detail}</p>
                  </div>
                  <span className={cn("hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold sm:inline-flex", toneChip[f.tone])}>
                    {f.cta} <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground sm:hidden" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 3 ── Lifecycle Snapshot */}
      <section className="os-card">
        <SectionHeader
          title="Authorization Lifecycle"
          subtitle="Counts by stage · click to filter the Authorizations page"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {lifecycle.map((s) => (
            <Link
              key={s.name}
              to={s.to}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/60 px-3.5 py-3 transition hover:-translate-y-0.5 hover:bg-white/85"
            >
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-foreground/85">{s.name}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", toneDot[s.tone])} />
                  <span className="text-[10.5px] text-muted-foreground capitalize">{s.tone === "ok" ? "Healthy" : s.tone === "crit" ? "Urgent" : s.tone === "warn" ? "Watch" : "Active"}</span>
                </div>
              </div>
              <span className="text-[22px] font-semibold tabular-nums leading-none">{s.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4 + 5 grid row — Expiration Risk + PR Tracking */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 4 ── Expiration Risk */}
        <section className="os-card">
          <SectionHeader
            title="Expiration Risk"
            subtitle="Act before authorization gaps happen"
            action={
              <Link to="/authorizations?stage=expiring" className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">
                Open Auth Risk Center
              </Link>
            }
          />
          <ul className="space-y-1.5">
            {expirationWindows.map((w) => (
              <li key={w.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/60 bg-white/60 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium">{w.label}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{w.count > 0 ? `e.g. ${w.example}` : "No clients in this window"}</p>
                </div>
                <CountChip tone={w.tone}>{w.count}</CountChip>
              </li>
            ))}
          </ul>
        </section>

        {/* 5 ── PR Tracking */}
        <section className="os-card">
          <SectionHeader
            title="Progress Report Tracking"
            subtitle="GA: BCBA outreach at 9w · loop Shira & Rachel at 6w. Other states: weekly BCBA pings (cc Julianne); escalate to State Director at 6w."
            action={
              <Link to="/authorizations?view=pr" className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">
                Open PR Tracking
              </Link>
            }
          />
          <ul className="space-y-1.5">
            {prTracking.map((p) => (
              <li key={p.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/60 bg-white/60 px-3 py-2.5">
                <p className="truncate text-[12.5px] font-medium">{p.label}</p>
                <CountChip tone={p.tone}>{p.count}</CountChip>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 6 + 7 + 8 grid row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* 6 ── QA Coordination */}
        <section className="os-card">
          <SectionHeader
            title="QA Coordination"
            subtitle="Treatment plan readiness"
            action={
              <Link to="/qa" className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">
                Review QA
              </Link>
            }
          />
          <ul className="space-y-1.5">
            {qaItems.map((q) => (
              <li key={q.label} className="flex items-center justify-between gap-2 rounded-xl border border-white/60 bg-white/60 px-3 py-2">
                <span className="truncate text-[12px] text-foreground/85">{q.label}</span>
                <CountChip tone={q.tone}>{q.count}</CountChip>
              </li>
            ))}
          </ul>
        </section>

        {/* 7 ── Submission Blockers */}
        <section className="os-card">
          <SectionHeader
            title="Submission Blockers"
            subtitle="Missing documentation"
            action={
              <Link to="/authorizations?stage=missing" className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">
                Resolve
              </Link>
            }
          />
          <ul className="space-y-1.5">
            {blockers.map((b) => {
              const Icon = b.icon;
              return (
                <li key={b.label} className="flex items-center justify-between gap-2 rounded-xl border border-white/60 bg-white/60 px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-[12px] text-foreground/85">{b.label}</span>
                  </span>
                  <CountChip tone={b.tone}>{b.count}</CountChip>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 8 ── Denials & Rework */}
        <section className="os-card">
          <SectionHeader
            title="Denials & Rework"
            subtitle="Follow-up status"
            action={
              <Link to="/authorizations?stage=denied" className="text-[11.5px] font-semibold text-[hsl(265_70%_55%)] hover:underline">
                Review
              </Link>
            }
          />
          <ul className="space-y-1.5">
            {denials.map((d) => (
              <li key={d.label} className="flex items-center justify-between gap-2 rounded-xl border border-white/60 bg-white/60 px-3 py-2">
                <span className="truncate text-[12px] text-foreground/85">{d.label}</span>
                <CountChip tone={d.tone}>{d.count}</CountChip>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 11 ── Quick Actions */}
      <section className="os-card">
        <SectionHeader title="Quick Actions" subtitle="Jump into the workspace" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                to={a.to}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-white/70 bg-white/60 p-3 transition hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-[0_14px_28px_-18px_hsl(220_50%_40%/0.2)]"
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[hsl(220_80%_96%)] text-[hsl(220_60%_42%)]">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[12px] font-semibold leading-tight text-foreground/85 group-hover:text-foreground">
                  {a.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </OSShell>
  );
}
