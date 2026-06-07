import { Link } from "react-router-dom";
import { useState } from "react";
import { Lock, CheckCircle2, Play, ChevronRight, Calendar, Sparkles, ArrowRight, Clock, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  SD_JOURNEY_STRUCTURE,
  getProgress,
  type Training,
} from "@/lib/training/academyData";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}
const sdId = (w: number, d: number, title: string) => `sd-w${w}d${d}-${slugify(title)}`;

interface Props {
  trainings: Training[];
}

/**
 * Week → Day → Module grouped view for the State Director Journey.
 * Only the current week is expanded by default; future weeks collapse into
 * a calm summary row that the learner can open when ready.
 */
export function SDJourneyView({ trainings }: Props) {
  const byId = new Map(trainings.map((t) => [t.id, t]));

  const dayStates = SD_JOURNEY_STRUCTURE.flatMap((w) =>
    w.days.map((d) => {
      const ids = d.modules
        .map((m) => sdId(w.week, d.day, m))
        .filter((id) => byId.has(id));
      const completed = ids.filter((id) => getProgress(id).status === "completed").length;
      return { week: w.week, day: d.day, ids, completed, total: ids.length };
    }),
  );

  function isDayUnlocked(week: number, day: number): boolean {
    if (week === 1 && day === 1) return true;
    const idx = dayStates.findIndex((s) => s.week === week && s.day === day);
    if (idx <= 0) return true;
    const prev = dayStates[idx - 1];
    return prev.completed === prev.total;
  }

  const allIds = dayStates.flatMap((s) => s.ids);
  const totalDone = allIds.filter((id) => getProgress(id).status === "completed").length;
  const overallPct = allIds.length === 0 ? 0 : Math.round((totalDone / allIds.length) * 100);

  const currentDayState = dayStates.find((s) => s.completed < s.total) ?? dayStates[dayStates.length - 1];
  const currentDayDef = SD_JOURNEY_STRUCTURE
    .find((w) => w.week === currentDayState.week)?.days
    .find((d) => d.day === currentDayState.day);
  const currentWeekDef = SD_JOURNEY_STRUCTURE.find((w) => w.week === currentDayState.week);
  const nextModuleId = currentDayState.ids.find((id) => getProgress(id).status !== "completed");
  const nextTraining = nextModuleId ? byId.get(nextModuleId) : undefined;

  // Only current week is expanded by default.
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([currentDayState.week]));
  const toggleWeek = (week: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(week) ? next.delete(week) : next.add(week);
      return next;
    });

  return (
    <div className="space-y-6">
      {/* Journey summary + current focus */}
      <div className="rounded-3xl border border-border/70 bg-card p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              5-Week launch path · {allIds.length} modules
            </p>
            <h3 className="mt-1 text-[18px] font-semibold tracking-tight">State Director launch journey</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Currently on <span className="font-medium text-foreground">Week {currentDayState.week}, Day {currentDayState.day}</span>
              {currentDayDef ? <> · <span className="text-foreground">{currentDayDef.title}</span></> : null}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Launch progress</p>
            <p className="text-[24px] font-semibold tabular-nums">{overallPct}%</p>
          </div>
        </div>
        <Progress value={overallPct} className="mt-4 h-1.5" />
        <div className="mt-1.5 flex items-center justify-between text-[11.5px] text-muted-foreground">
          <span>{totalDone} of {allIds.length} launch modules complete</span>
          <span>Future weeks unlock as you go</span>
        </div>

        <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
          {nextTraining
            ? "Start here. Review with your mentor as you go — nothing here has to be solved alone."
            : "No blockers right now — you're all caught up."}
        </p>

        {(currentWeekDef || nextTraining) && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {currentWeekDef && (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3 w-3" /> Current focus
                </p>
                <p className="mt-1.5 text-[13px] font-semibold text-foreground">
                  Week {currentWeekDef.week} · {currentWeekDef.title}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{currentWeekDef.goal}</p>
              </div>
            )}
            {nextTraining ? (
              <Link
                to={`/training/${nextTraining.id}`}
                className="group rounded-2xl border border-primary/30 bg-primary/[0.04] p-4 transition-colors hover:bg-primary/[0.08]"
              >
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  <ArrowRight className="h-3 w-3" /> Next action
                </p>
                <p className="mt-1.5 text-[13px] font-semibold text-foreground">{nextTraining.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full border border-border/60 bg-background px-2 py-0.5">{nextTraining.type}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {nextTraining.estimatedMinutes} min</span>
                  {nextTraining.required && <span className="text-primary">Required</span>}
                </div>
                <p className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-primary group-hover:underline">
                  Open module <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Link>
            ) : (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> All caught up
                </p>
                <p className="mt-1.5 text-[13px] font-semibold text-foreground">No outstanding modules.</p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  You're up to date on the State Director journey. Reach out to your mentor for next steps.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weeks — only current week expanded by default */}
      {SD_JOURNEY_STRUCTURE.map((w) => {
        const weekDayStates = dayStates.filter((s) => s.week === w.week);
        const weekDone = weekDayStates.reduce((sum, s) => sum + s.completed, 0);
        const weekTotal = weekDayStates.reduce((sum, s) => sum + s.total, 0);
        const weekPct = weekTotal === 0 ? 0 : Math.round((weekDone / weekTotal) * 100);
        const isExpanded = expanded.has(w.week);
        const isCurrent = w.week === currentDayState.week;
        return (
          <section key={w.week} className="rounded-2xl border border-border/70 bg-card p-5">
            <button
              type="button"
              onClick={() => toggleWeek(w.week)}
              aria-expanded={isExpanded}
              data-testid={`sd-week-toggle-${w.week}`}
              className="group flex w-full items-start justify-between gap-4 text-left"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <Calendar className="h-3 w-3" /> Week {w.week}
                  {isCurrent && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9.5px] font-semibold text-primary">
                      Current
                    </span>
                  )}
                </div>
                <h3 className="mt-0.5 text-[16px] font-semibold tracking-tight">{w.title}</h3>
                <p className="mt-1 text-[12.5px] text-muted-foreground">{w.goal}</p>
              </div>
              <div className="flex items-start gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-[18px] font-semibold tabular-nums">{weekPct}%</p>
                  <p className="text-[10.5px] text-muted-foreground">{weekDone}/{weekTotal}</p>
                </div>
                <ChevronDown
                  className={cn(
                    "mt-1 h-4 w-4 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180",
                  )}
                />
              </div>
            </button>

            {isExpanded && (
              <div className="mt-4 space-y-3">
                {w.days.map((d) => {
                  const state = dayStates.find((s) => s.week === w.week && s.day === d.day)!;
                  const unlocked = isDayUnlocked(w.week, d.day);
                  const dayDone = state.completed === state.total && state.total > 0;
                  return (
                    <div
                      key={d.day}
                      className={cn(
                        "rounded-xl border p-4 transition-colors",
                        !unlocked && "border-dashed border-border/50 bg-muted/20 opacity-70",
                        unlocked && !dayDone && "border-border/60 bg-background",
                        dayDone && "border-emerald-200/60 bg-emerald-50/30 dark:bg-emerald-950/10",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                            dayDone ? "bg-emerald-100 text-emerald-700"
                              : unlocked ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}>
                            {dayDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : !unlocked ? <Lock className="h-3 w-3" /> : d.day}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium">Day {d.day} · {d.title}</p>
                            <p className="text-[11px] text-muted-foreground">{state.completed}/{state.total} modules</p>
                          </div>
                        </div>
                        {!unlocked && (
                          <span className="text-[10px] text-muted-foreground">Opens after prior day</span>
                        )}
                      </div>

                      {unlocked && (
                        <ul className="mt-3 space-y-1">
                          {d.modules.map((m, idx) => {
                            const id = state.ids[idx];
                            const training = id ? byId.get(id) : undefined;
                            if (!training) return null;
                            const p = getProgress(training.id);
                            const done = p.status === "completed";
                            return (
                              <li key={training.id}>
                                <Link
                                  to={`/training/${training.id}`}
                                  className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40"
                                >
                                  <span className={cn(
                                    "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px]",
                                    done ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground",
                                  )}>
                                    {done ? <CheckCircle2 className="h-3 w-3" /> : <Play className="h-2.5 w-2.5" />}
                                  </span>
                                  <div className={cn(
                                    "flex min-w-0 flex-1 items-center gap-2 text-[13px]",
                                    done ? "text-muted-foreground line-through" : "text-foreground",
                                  )}>
                                    <span className="truncate font-medium">{m}</span>
                                    <span className="hidden sm:inline-flex shrink-0 rounded-full border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                      {training.type}
                                    </span>
                                    <span className="hidden md:inline text-[10.5px] text-muted-foreground">
                                      {training.estimatedMinutes}m
                                    </span>
                                  </div>
                                  <span className="text-[10.5px] text-muted-foreground tabular-nums">
                                    {p.progressPercent}%
                                  </span>
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}