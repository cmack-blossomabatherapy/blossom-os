import { Link } from "react-router-dom";
import { Check, Lock, ArrowRight, Clock, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { modulesForPath, type ONBOARDING_PHASES, type OnboardingPath } from "@/lib/onboarding/journey";

interface PhaseProgress {
  phase: typeof ONBOARDING_PHASES[number];
  total: number;
  done: number;
  percent: number;
  complete: boolean;
}

interface Props {
  phaseProgress: PhaseProgress[];
  activeId?: string;
  path: OnboardingPath;
  completedKeys: string[];
}

function fmtTime(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.round(min / 60);
  return `${h}h`;
}

export function PremiumJourneyTimeline({ phaseProgress, activeId, path, completedKeys }: Props) {
  let priorComplete = true;
  return (
    <ol className="relative space-y-4">
      {phaseProgress.map((pp, i) => {
        const Icon = pp.phase.icon;
        const isLast = i === phaseProgress.length - 1;
        const locked = !pp.complete && !priorComplete;
        const active = pp.phase.id === activeId;
        const mods = modulesForPath(pp.phase, path);
        const totalMin = mods.reduce((s, m) => s + m.estMinutes, 0);
        const cta = pp.complete
          ? "Review phase"
          : active
            ? (pp.done === 0 ? "Start phase" : "Continue phase")
            : locked ? "Locked" : "Open phase";

        const done = pp.done;
        const total = pp.total;

        const out = (
          <li key={pp.phase.id} id={`phase-${pp.phase.id}`} className="relative scroll-mt-24">
            <div className="flex gap-4">
              {/* Rail with node */}
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-all",
                    pp.complete && "border-emerald-500/40 bg-emerald-500/15 text-emerald-600",
                    !pp.complete && active && "border-primary/50 bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))] text-primary-foreground shadow-md shadow-primary/30",
                    !pp.complete && !active && !locked && "border-border/60 bg-card text-foreground",
                    locked && "border-dashed border-border/60 bg-muted text-muted-foreground",
                  )}
                >
                  {pp.complete ? <Check className="h-5 w-5" /> : locked ? <Lock className="h-4 w-4" /> : <Icon className="h-5 w-5" />}
                  {active && !pp.complete && (
                    <span className="absolute inset-0 -z-10 rounded-2xl bg-primary/30 blur-md animate-pulse" />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-px flex-1 my-1 min-h-[3rem]",
                      pp.complete ? "bg-gradient-to-b from-emerald-500/60 to-border" : "bg-border/70",
                    )}
                  />
                )}
              </div>

              {/* Card */}
              <div
                className={cn(
                  "mb-2 flex-1 rounded-2xl border p-4 sm:p-5 transition-all",
                  active && !pp.complete && "border-primary/40 bg-[linear-gradient(135deg,hsl(var(--primary)/0.06),hsl(var(--accent)/0.04))] shadow-sm",
                  pp.complete && "border-emerald-500/30 bg-emerald-500/5",
                  !active && !pp.complete && !locked && "border-border/60 bg-card hover:border-primary/30 hover:shadow-sm",
                  locked && "border-dashed border-border/60 bg-muted/30",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {pp.phase.weekLabel}
                      </span>
                      {pp.complete && (
                        <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300">Complete</Badge>
                      )}
                      {!pp.complete && active && (
                        <Badge className="bg-primary text-primary-foreground text-[10px]">In progress</Badge>
                      )}
                      {locked && (
                        <Badge variant="outline" className="border-dashed text-[10px] text-muted-foreground">Locked</Badge>
                      )}
                    </div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{pp.phase.title}</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground sm:text-[13px]">{pp.phase.objective}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold tabular-nums text-foreground">{pp.percent}%</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{done}/{total} done</p>
                  </div>
                </div>

                {/* Segmented progress */}
                {total > 0 && (
                  <div className="mt-4 flex gap-1">
                    {mods.map((m) => {
                      const isDone = completedKeys.includes(m.key);
                      return (
                        <span
                          key={m.key}
                          title={m.title}
                          className={cn(
                            "h-1.5 flex-1 rounded-full transition-colors",
                            isDone ? (pp.complete ? "bg-emerald-500" : "bg-primary") : "bg-muted",
                          )}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Module preview */}
                {mods.length > 0 && (
                  <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                    {mods.slice(0, 4).map((m) => {
                      const isDone = completedKeys.includes(m.key);
                      const ModIcon = m.icon;
                      return (
                        <li key={m.key} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                          <span className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-full",
                            isDone ? "bg-emerald-500/20 text-emerald-600" : "bg-muted text-muted-foreground",
                          )}>
                            {isDone ? <Check className="h-2.5 w-2.5" /> : <ModIcon className="h-2.5 w-2.5" />}
                          </span>
                          <span className={cn("truncate", isDone && "line-through opacity-70")}>{m.title}</span>
                        </li>
                      );
                    })}
                    {mods.length > 4 && (
                      <li className="text-[11px] text-muted-foreground">+ {mods.length - 4} more</li>
                    )}
                  </ul>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-3">
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" /> {total} module{total === 1 ? "" : "s"}</span>
                    {totalMin > 0 && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> ~{fmtTime(totalMin)}</span>}
                  </div>
                  {locked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Lock className="h-3 w-3" /> Finish previous phase to unlock
                    </span>
                  ) : (
                    <Link
                      to={pp.phase.path}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                        active && !pp.complete
                          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                          : pp.complete
                            ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300"
                            : "border border-border/60 bg-background hover:border-primary/40 hover:text-primary",
                      )}
                    >
                      {cta} <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
        if (!pp.complete) priorComplete = false;
        return out;
      })}
    </ol>
  );
}
