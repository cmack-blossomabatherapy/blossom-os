import { Link } from "react-router-dom";
import { Lock, CheckCircle2, Play, ChevronRight, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
 * Days unlock sequentially (a day unlocks when every module in the
 * previous day is completed). Modules inside a day are openable in any order.
 */
export function SDJourneyView({ trainings }: Props) {
  const byId = new Map(trainings.map((t) => [t.id, t]));

  // Compute per-day completion + sequential lock
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
    // previous day in sequence
    const flat = dayStates;
    const idx = flat.findIndex((s) => s.week === week && s.day === day);
    if (idx <= 0) return true;
    const prev = flat[idx - 1];
    return prev.completed === prev.total;
  }

  // Overall stats
  const allIds = dayStates.flatMap((s) => s.ids);
  const totalDone = allIds.filter((id) => getProgress(id).status === "completed").length;
  const overallPct = allIds.length === 0 ? 0 : Math.round((totalDone / allIds.length) * 100);

  // Current week/day = first incomplete day
  const currentDayState = dayStates.find((s) => s.completed < s.total) ?? dayStates[dayStates.length - 1];

  return (
    <div className="space-y-6">
      {/* Journey summary */}
      <div className="rounded-3xl border border-border/70 bg-card p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              5-Week Program · {allIds.length} modules
            </p>
            <h3 className="mt-1 text-[18px] font-semibold tracking-tight">State Director Training Journey</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Currently on <span className="font-medium text-foreground">Week {currentDayState.week}, Day {currentDayState.day}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Completion</p>
            <p className="text-[24px] font-semibold tabular-nums">{overallPct}%</p>
          </div>
        </div>
        <Progress value={overallPct} className="mt-4 h-1.5" />
        <div className="mt-1.5 flex items-center justify-between text-[11.5px] text-muted-foreground">
          <span>{totalDone} of {allIds.length} modules complete</span>
          <span>Days unlock sequentially</span>
        </div>
      </div>

      {/* Weeks */}
      {SD_JOURNEY_STRUCTURE.map((w) => {
        const weekDayStates = dayStates.filter((s) => s.week === w.week);
        const weekDone = weekDayStates.reduce((sum, s) => sum + s.completed, 0);
        const weekTotal = weekDayStates.reduce((sum, s) => sum + s.total, 0);
        const weekPct = weekTotal === 0 ? 0 : Math.round((weekDone / weekTotal) * 100);
        return (
          <section key={w.week} className="rounded-2xl border border-border/70 bg-card p-5">
            <header className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <Calendar className="h-3 w-3" /> Week {w.week}
                </div>
                <h3 className="mt-0.5 text-[16px] font-semibold tracking-tight">{w.title}</h3>
                <p className="mt-1 text-[12.5px] text-muted-foreground">{w.goal}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[18px] font-semibold tabular-nums">{weekPct}%</p>
                <p className="text-[10.5px] text-muted-foreground">
                  {weekDone}/{weekTotal}
                </p>
              </div>
            </header>

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
                          <p className="text-[11px] text-muted-foreground">
                            {state.completed}/{state.total} modules · {d.modules.length} placeholder{d.modules.length === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      {!unlocked && (
                        <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
                          Locked
                        </Badge>
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
                                className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/40"
                              >
                                <span className={cn(
                                  "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px]",
                                  done ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground",
                                )}>
                                  {done ? <CheckCircle2 className="h-3 w-3" /> : <Play className="h-2.5 w-2.5" />}
                                </span>
                                <span className={cn(
                                  "flex-1 truncate text-[12.5px]",
                                  done ? "text-muted-foreground line-through" : "text-foreground",
                                )}>
                                  {m}
                                </span>
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
          </section>
        );
      })}
    </div>
  );
}