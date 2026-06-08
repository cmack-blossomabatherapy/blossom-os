import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowRight, Play, CheckCircle2, Clock, ChevronRight, BookMarked,
  Library, Users as UsersIcon, Heart, Compass, GraduationCap, MessageSquare,
  FileText, BookOpen, Workflow as WorkflowIcon, ShieldCheck, Award, ListChecks,
  Calendar,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  SD_JOURNEY_STRUCTURE,
  getProgress,
  type Training,
  type TrainingType,
} from "@/lib/training/academyData";
import { SDJourneyView } from "./SDJourneyView";
import type { LearnerHome } from "@/lib/academy/learnerHome";
import { useAdminResources } from "@/hooks/useAdminResources";
import {
  computeSdWelcomeVideoState,
} from "@/lib/training/sdRuntimeReadiness";
import { computeSdSopCoverageFromResources } from "@/lib/resources/sdSopCoverage";
import { SDDayOneReadinessPanel } from "./SDDayOneReadinessPanel";

const TYPE_ICON: Record<TrainingType, typeof FileText> = {
  SOP: FileText, Workflow: WorkflowIcon, Tango: Play, Video: Play,
  Checklist: CheckCircle2, "Quick Guide": BookOpen, Training: GraduationCap,
  Task: CheckCircle2, Meeting: MessageSquare, Shadowing: Compass,
  Quiz: BookMarked, Reflection: BookOpen,
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}
const sdId = (w: number, d: number, title: string) => `sd-w${w}d${d}-${slugify(title)}`;

/** Pick an operating-simulation flow for the current day. Returns null when no flow fits. */
function pickFlow(dayTitle: string, weekTitle: string): { label: string; steps: string[] } | null {
  const t = `${weekTitle} ${dayTitle}`.toLowerCase();
  if (/(lead|intake|client lifecycle|vob)/.test(t)) {
    return {
      label: "How a lead becomes an active client",
      steps: ["Lead", "Intake", "VOB", "BCBA Assignment", "Assessment", "Auth", "Staffing", "Treatment", "Utilization"],
    };
  }
  if (/(recruit|onboard|hiring|orientation)/.test(t)) {
    return {
      label: "How a candidate becomes an active staff member",
      steps: ["Candidate", "Apploi", "Cert Check", "Interview", "Offer", "Viventium", "Orientation", "Training"],
    };
  }
  if (/(auth|utilization|progress report)/.test(t)) {
    return {
      label: "Authorization lifecycle",
      steps: ["Awaiting Submission", "Submitted", "Approved", "Expiring Soon", "QA Review"],
    };
  }
  return null;
}

/** Why this matters — operational, plain-language. */
function whyItMatters(dayTitle: string): string {
  const map: Record<string, string> = {
    "Welcome to Blossom": "Today you meet the company, the leaders, and how Blossom is built. By the end you should be able to explain what we do and why it matters.",
    "Understanding Blossom Operations": "Today you learn how Blossom is structured. By the end you should know who owns what and how decisions flow.",
    "Blossom Ecosystem": "Today you map every department that touches a client. By the end you should know who to call when something is stuck.",
    "Communication & Accountability": "Today you learn how leaders communicate and escalate. By the end you should be able to handle an upset parent or a missing PR with calm.",
    "The Winning State Philosophy": "Today you learn the philosophy behind running a winning state. By the end you should understand: CR is truth, utilization is everything, the State Director is the architect.",
    "Lead & Intake Flow": "Today you are learning how a lead becomes an active client. By the end of the day you should be able to look at the intake board and tell who's stuck and who owns the next move.",
    "Client Lifecycle": "Today you walk the full client journey from VOB to active treatment. By the end you should be able to spot a client that's stalled and know which team to nudge.",
    "Authorization Foundations": "Today you learn how an authorization moves from request to approval. By the end you should be able to read an auth and know if it's healthy.",
    "Utilization Tracking": "Today you learn how to read utilization. By the end you should be able to identify the top underutilized clients in your state.",
    "Recruiting Overview": "Today you learn how candidates move into the company. By the end you should know where most candidates drop off and why.",
    "KPI Management": "Today you learn the operational KPIs of a state. By the end you should know your numbers and what they mean.",
  };
  return map[dayTitle] ?? "Today you build the operational instincts you'll use to run your state.";
}

interface Props {
  firstName: string;
  trainings: Training[];           // SD journey modules from local seed
  learnerHome: LearnerHome;        // DB-backed model when an enrollment exists
}

export function SDLearnerHome({ firstName, trainings, learnerHome }: Props) {
  const navigate = useNavigate();
  const byId = useMemo(() => new Map(trainings.map((t) => [t.id, t])), [trainings]);
  const { resources } = useAdminResources();
  const welcomeVideo = computeSdWelcomeVideoState(resources);
  const sopCoverage = useMemo(
    () => computeSdSopCoverageFromResources(resources),
    [resources],
  );

  // Use SD_JOURNEY_STRUCTURE for current-week/day computation against local progress.
  const dayStates = useMemo(() =>
    SD_JOURNEY_STRUCTURE.flatMap((w) =>
      w.days.map((d) => {
        const ids = d.modules.map((m) => sdId(w.week, d.day, m)).filter((id) => byId.has(id));
        const completed = ids.filter((id) => getProgress(id).status === "completed").length;
        return { week: w.week, day: d.day, ids, completed, total: ids.length };
      }),
    ),
  [byId, trainings]);

  const allIds = dayStates.flatMap((s) => s.ids);
  const totalDone = allIds.filter((id) => getProgress(id).status === "completed").length;
  const localPct = allIds.length === 0 ? 0 : Math.round((totalDone / allIds.length) * 100);
  const currentDayState = dayStates.find((s) => s.completed < s.total) ?? dayStates[0];
  const currentWeekDef = SD_JOURNEY_STRUCTURE.find((w) => w.week === currentDayState.week)!;
  const currentDayDef = currentWeekDef.days.find((d) => d.day === currentDayState.day)!;
  const nextModuleId = currentDayState.ids.find((id) => getProgress(id).status !== "completed");
  const nextTraining = nextModuleId ? byId.get(nextModuleId) : undefined;
  const currentDayModules = currentDayState.ids.map((id) => byId.get(id)).filter(Boolean) as Training[];

  // Prefer DB launch progress + week when present.
  const hasDb = !!learnerHome.enrollment;
  const launchPct = hasDb ? learnerHome.launchProgress.pct : localPct;
  const launchDone = hasDb ? learnerHome.launchProgress.requiredCompleted : totalDone;
  const launchTotal = hasDb ? learnerHome.launchProgress.requiredTotal : allIds.length;
  const readinessPct = learnerHome.readiness ? Math.round(learnerHome.readiness.overall) : null;
  const mentorName = learnerHome.mentor
    ? [learnerHome.mentor.first_name, learnerHome.mentor.last_name].filter(Boolean).join(" ").trim()
    : "";
  const mentorLabel = mentorName
    ? mentorName
    : learnerHome.employee?.state
      ? `Mentor · ${learnerHome.employee.state}`
      : "Not assigned";

  const welcomeComplete = hasDb ? learnerHome.welcomeComplete : false;

  const flow = pickFlow(currentDayDef.title, currentWeekDef.title);

  // Small launch checklist — calm, operational, no clutter.
  const launchChecklist = [
    {
      label: "Welcome",
      done: welcomeComplete,
      hint: welcomeVideo.ok ? "Video ready" : "Written guidance ready",
    },
    {
      label: "Today's modules",
      done: currentDayState.completed === currentDayState.total && currentDayState.total > 0,
      hint: `${currentDayState.completed}/${currentDayState.total} done`,
    },
    {
      label: "SOPs connected",
      done: sopCoverage.total > 0 && sopCoverage.published === sopCoverage.total,
      hint: `${sopCoverage.published}/${sopCoverage.total} live`,
    },
    {
      label: "Mentor check-in",
      done: learnerHome.checkinCount > 0,
      hint: learnerHome.mentor ? "Mentor assigned" : "Pending mentor",
    },
    {
      label: "Reflection",
      done: currentDayState.completed > 0,
      hint: currentDayState.completed > 0 ? "Captured today" : "Add one tonight",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-10">
        {/* 1 · Warm top header */}
        <header
          data-testid="sd-warm-header"
          className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/[0.05] via-card to-card p-6 md:p-8 shadow-sm"
        >
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>Training Academy · State Director</span>
              </div>
              <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">
                Welcome back, <span className="capitalize">{firstName}</span>.
              </h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
                Today is a guided day. Begin with Welcome to Blossom, then follow your launch path one
                module at a time. Your mentor and leadership move with you — nothing here has to be
                solved alone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:w-[340px] shrink-0">
              <HeaderStat label="Current" value={`W${currentDayState.week} · D${currentDayState.day}`} />
              <HeaderStat label="Launch" value={`${launchPct}%`} />
              <HeaderStat label="Readiness" value={readinessPct !== null ? `${readinessPct}%` : "Building"} />
              <HeaderStat label="Mentor" value={mentorLabel} />
            </div>
          </div>
        </header>

        {/* 1.5 · Start here today — day-one anchor */}
        <section
          data-testid="sd-start-here-today"
          className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Start here today
              </p>
              <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-foreground">
                Five small wins for your first day
              </h2>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
                You do not have to finish the journey today. Take these five steps and you have
                had a strong first day — really.
              </p>
            </div>
          </div>
          <ol className="mt-4 grid gap-2 md:grid-cols-2">
            {[
              "Open Welcome to Blossom and read both leadership letters.",
              "Complete the Week 1 · Day 1 modules.",
              "Write one short reflection on what stood out.",
              "Ask your mentor one question — any question.",
              "Close the laptop. Do not worry about future weeks yet.",
            ].map((step, idx) => (
              <li
                key={step}
                className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/60 px-3 py-2.5"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[11.5px] font-semibold text-primary">
                  {idx + 1}
                </span>
                <span className="text-[13px] leading-snug text-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* 1.6 · Day-One readiness — local evidence panel */}
        <SDDayOneReadinessPanel welcomeReviewedFromAcademy={welcomeComplete} />

        {/* 2 · Welcome to Blossom anchor */}
        <section data-testid="sd-welcome-anchor">
          <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] via-card to-card p-6 sm:p-7">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" aria-hidden />
            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Phase 0 · Always accessible
                  </p>
                  <h2 className="mt-0.5 text-[19px] font-semibold tracking-tight text-foreground">Welcome to Blossom</h2>
                  <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground">
                    Meet the company, the leaders, and how we work. Begin here — you can come back to it any time.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                    {[
                      "Welcome Video from Chad", "Welcome from Shira", "Mission & Vision",
                      "Core Values", "Meet the Team", "How Blossom Works",
                    ].map((m) => (
                      <span key={m} className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => navigate("/training/welcome")}
                className="rounded-full"
                data-testid="sd-welcome-cta"
              >
                {welcomeComplete ? "Revisit Welcome" : "Start Welcome to Blossom"}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </section>

        {/* 3 · Today's Launch Plan */}
        <section data-testid="sd-today-launch-plan" className="space-y-4">
          {/* Launch checklist — small calm operational card */}
          <div
            data-testid="sd-launch-checklist-card"
            className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Launch checklist
                </p>
                <h3 className="mt-0.5 text-[14.5px] font-semibold tracking-tight text-foreground">
                  Five quiet signals you are on track
                </h3>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {launchChecklist.filter((c) => c.done).length}/{launchChecklist.length}
              </span>
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-5">
              {launchChecklist.map((c) => (
                <li
                  key={c.label}
                  className={cn(
                    "rounded-xl border bg-background/60 px-3 py-2 text-[12px]",
                    c.done
                      ? "border-emerald-200/60 bg-emerald-50/40 dark:bg-emerald-950/10"
                      : "border-border/60",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {c.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40" />
                    )}
                    <span className="font-medium text-foreground">{c.label}</span>
                  </div>
                  <p className="mt-0.5 pl-5 text-[11px] text-muted-foreground">{c.hint}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Today&apos;s Launch Plan
              </p>
              <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
                One day at a time — here is yours.
              </h2>
            </div>
            <span className="hidden text-[11px] text-muted-foreground sm:inline">
              W{currentDayState.week} · D{currentDayState.day}
            </span>
          </div>
          <div data-testid="sd-today">
          <div className="rounded-3xl border border-border/70 bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Today&apos;s focus</p>
                <h2 className="mt-1 text-[18px] font-semibold tracking-tight">
                  Week {currentDayState.week}, Day {currentDayState.day} · {currentDayDef.title}
                </h2>
                <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">{whyItMatters(currentDayDef.title)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Day progress</p>
                <p className="text-[20px] font-semibold tabular-nums">
                  {currentDayState.completed}/{currentDayState.total}
                </p>
              </div>
            </div>

            {nextTraining ? (
              <Link
                to={`/training/${nextTraining.id}`}
                className="mt-5 block rounded-2xl border-2 border-primary/40 bg-primary/[0.06] p-5 shadow-[0_8px_24px_-16px_hsl(var(--primary)/0.35)] transition-all hover:-translate-y-0.5 hover:bg-primary/[0.10]"
                data-testid="sd-today-next-action"
              >
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  <ArrowRight className="h-3 w-3" /> Your next step
                </p>
                <p className="mt-1.5 text-[15px] font-semibold text-foreground">{nextTraining.title}</p>
                {nextTraining.description && (
                  <p className="mt-1 line-clamp-2 text-[12.5px] text-muted-foreground">{nextTraining.description}</p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
                  <span className="rounded-full border border-border/60 bg-background px-2 py-0.5">{nextTraining.type}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {nextTraining.estimatedMinutes} min</span>
                  {nextTraining.required && <span className="text-primary">Required</span>}
                </div>
                <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
                  Start now <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ) : (
              <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-[12.5px] text-foreground">
                You're caught up for today — reach out to your mentor for what's next.
              </div>
            )}
          </div>
          </div>
        </section>

        {/* 4 · Operating simulation card */}
        {flow && (
          <section data-testid="sd-operating-sim">
            <div className="rounded-3xl border border-border/70 bg-card p-6">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Operating simulation</p>
              <h2 className="mt-1 text-[17px] font-semibold tracking-tight">{flow.label}</h2>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Walk this flow. By the end of the day you should be able to point at any step and say who owns it.
              </p>
              <div className="mt-5 -mx-1 flex flex-wrap items-center gap-y-3 overflow-x-auto pb-1">
                {flow.steps.map((step, idx) => (
                  <div key={step} className="flex items-center">
                    <div className="rounded-2xl border border-border/70 bg-background px-3 py-2 text-[12.5px] font-medium text-foreground shadow-[0_1px_0_oklch(1_0_0/0.6)_inset]">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1.5">{String(idx + 1).padStart(2, "0")}</span>
                      {step}
                    </div>
                    {idx < flow.steps.length - 1 && (
                      <ChevronRight className="mx-1.5 h-4 w-4 shrink-0 text-muted-foreground/70" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5 · Current day modules */}
        {currentDayModules.length > 0 && (
          <section data-testid="sd-current-day-modules">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-[17px] font-semibold tracking-tight">Today&apos;s day checklist</h2>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  Complete today&apos;s modules before moving ahead. Each day builds the state director
                  instincts you&apos;ll use in the field.
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground">{currentDayModules.length} module{currentDayModules.length === 1 ? "" : "s"}</span>
            </div>
            <ol className="space-y-2">
              {currentDayModules.slice(0, 8).map((t, idx) => {
                const Icon = TYPE_ICON[t.type] ?? FileText;
                const p = getProgress(t.id);
                const done = p.status === "completed";
                const isNext = !done && t.id === nextModuleId;
                const cta = done ? "Review" : p.progressPercent > 0 ? "Continue" : "Start";
                const purpose = (t.description ?? "").split(/[.!?]/)[0]?.trim();
                return (
                  <li key={t.id}>
                  <Link
                    key={t.id}
                    to={`/training/${t.id}`}
                    className={cn(
                      "group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5",
                      done && "border-emerald-200/60 bg-emerald-50/40 dark:bg-emerald-950/10",
                      isNext && "border-primary/40 bg-primary/[0.04] shadow-[0_6px_20px_-14px_hsl(var(--primary)/0.4)]",
                      !done && !isNext && "border-border/70",
                    )}
                    data-testid={isNext ? "sd-day-checklist-next" : undefined}
                  >
                    <span className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold",
                      done ? "bg-emerald-100 text-emerald-700"
                        : isNext ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-1.5 py-0.5">
                          <Icon className="h-3 w-3" /> {t.type}
                        </span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {t.estimatedMinutes} min</span>
                        {done && <span className="text-emerald-700">Complete</span>}
                        {isNext && <span className="font-semibold text-primary">Next up</span>}
                      </div>
                      <p className={cn(
                        "mt-1 truncate text-[14px] font-semibold leading-snug",
                        done && "text-muted-foreground",
                      )}>{t.title}</p>
                      {purpose && (
                        <p className="mt-0.5 line-clamp-1 text-[12px] text-muted-foreground">{purpose}.</p>
                      )}
                    </div>
                    <span className={cn(
                      "ml-2 inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium",
                      isNext ? "bg-primary text-primary-foreground" : "text-primary",
                    )}>
                      {cta} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                  </li>
                );
              })}
            </ol>
            {/* Hidden legacy markup kept for compatibility */}
            <div className="hidden">
              {currentDayModules.slice(0, 6).map((t) => {
                const Icon = TYPE_ICON[t.type] ?? FileText;
                const p = getProgress(t.id);
                const done = p.status === "completed";
                const cta = done ? "Review" : p.progressPercent > 0 ? "Continue" : "Start";
                return (
                  <Link
                    key={t.id}
                    to={`/training/${t.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      {done ? (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">Complete</Badge>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" /> {t.estimatedMinutes} min
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 truncate text-[14px] font-semibold leading-snug">{t.title}</h3>
                    <p className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-[12px] text-muted-foreground">{t.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10.5px] text-muted-foreground">
                      <span className="rounded-full border border-border/60 bg-background px-1.5 py-0.5">{t.type}</span>
                      {t.resources && t.resources.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-1.5 py-0.5">
                          <BookMarked className="h-3 w-3" /> {t.resources.length} resource{t.resources.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto pt-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{p.progressPercent}% complete</span>
                        <span className="inline-flex items-center gap-1 font-medium text-primary">
                          {cta} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 6 · Five-week roadmap (current week expanded; future collapsed) */}
        <section data-testid="sd-roadmap">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Your launch path</p>
              <h2 className="text-[17px] font-semibold tracking-tight">Five-week roadmap</h2>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">A calm map of your launch — current week open, future weeks waiting for you.</p>
            </div>
          </div>
          <SDJourneyView trainings={trainings} />
        </section>
      </div>

      {/* Right sidebar */}
      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div data-testid="sd-launch-progress" className="rounded-2xl border border-border/70 bg-card p-5">
          <div className="flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">Your launch progress</h3>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-muted-foreground">Launch path</span>
              <span className="text-[22px] font-semibold tabular-nums">{launchPct}%</span>
            </div>
            <Progress value={launchPct} className="mt-2 h-1.5" />
            <p className="mt-1.5 text-[11px] text-muted-foreground">{launchDone} of {launchTotal} modules complete</p>
          </div>
          <div className="mt-4 space-y-1.5 text-[12px]">
            <SideRow icon={<Compass className="h-3.5 w-3.5 text-muted-foreground" />} label="Shadow hours" value={`${Math.round(learnerHome.shadowHours)}h`} />
            <SideRow icon={<MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />} label="Check-ins" value={learnerHome.checkinCount} />
            <SideRow
              icon={<Award className="h-3.5 w-3.5 text-muted-foreground" />}
              label="Certification"
              value={readinessPct !== null && readinessPct >= 90 ? "Ready" : "In progress"}
            />
          </div>
        </div>

        <div data-testid="sd-need-help" className="rounded-2xl border border-border/70 bg-card p-5">
          <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">Need help?</h3>
          <p className="mt-1 text-[11.5px] text-muted-foreground">Nothing here has to be solved alone.</p>
          <div className="mt-3 space-y-1 text-[12.5px]">
            {[
              { label: "Ask my mentor", icon: UsersIcon, to: "/messages" },
              { label: "HR partner", icon: Heart, to: "/messages" },
              { label: "Resource Library", icon: BookMarked, to: "/resource-library" },
              { label: "Ask Blossom AI", icon: Sparkles, to: "/ai/assistant" },
            ].map(({ label, icon: Icon, to }) => (
              <Link key={label} to={to} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-foreground hover:bg-muted/50">
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {label}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2.5 backdrop-blur">
      <p className="text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-[13.5px] font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SideRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-2 py-1.5">
      <span className="inline-flex items-center gap-2 text-muted-foreground">{icon}{label}</span>
      <span className="font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}
