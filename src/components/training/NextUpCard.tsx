import { Link } from "react-router-dom";
import { ArrowRight, Circle, PlayCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  useAcademy,
  getProgress,
  getJourneyForRole,
  getJourneyModules,
  type Training,
  type TrainingProgress,
} from "@/lib/training/academyData";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";

type Row = { training: Training; progress: TrainingProgress };

function pickNextUp(role: string, limit = 3): Row[] {
  // useAcademy is called by the parent to keep this pure — read live via getters.
  const journey = getJourneyForRole(role);
  const modules = getJourneyModules(journey);
  const rows: Row[] = modules.map((t) => ({ training: t, progress: getProgress(t.id) }));
  const inProgress = rows.filter((r) => r.progress.status === "in_progress" || r.progress.status === "overdue");
  const requiredNotStarted = rows.filter(
    (r) => r.progress.status === "not_started" && r.training.required,
  );
  const otherNotStarted = rows.filter(
    (r) => r.progress.status === "not_started" && !r.training.required,
  );
  return [...inProgress, ...requiredNotStarted, ...otherNotStarted].slice(0, limit);
}

export function NextUpCard({ className }: { className?: string }) {
  // Subscribe so hydration + completions re-render.
  useAcademy();
  const roleCtx = useOSRoleSafe();
  const role = roleCtx?.role ?? "operations_leadership";
  const rows = pickNextUp(role);

  if (rows.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-border/60 bg-card p-6", className)}>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> You’re all caught up
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          No open modules in your journey. Nice work.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card p-6 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">What’s next</h2>
          <p className="text-xs text-muted-foreground">Pick up where you left off in your training journey.</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/academy">Academy <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
        </Button>
      </div>
      <ul className="space-y-2">
        {rows.map(({ training, progress }) => {
          const Icon =
            progress.status === "completed" ? CheckCircle2
              : progress.status === "in_progress" || progress.status === "overdue" ? PlayCircle
              : Circle;
          return (
            <li key={training.id}>
              <Link
                to={`/academy/path/${training.id}`}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/60 px-3 py-2.5 hover:bg-muted/40 transition-colors"
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    progress.status === "completed" && "text-emerald-500",
                    (progress.status === "in_progress" || progress.status === "overdue") && "text-primary",
                    progress.status === "not_started" && "text-muted-foreground",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{training.title}</span>
                    {training.required && (
                      <span className="text-[10px] rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {training.estimatedMinutes ? `${training.estimatedMinutes} min · ` : ""}
                    {progress.status === "in_progress"
                      ? `${progress.progressPercent}% complete`
                      : progress.status === "overdue" ? "Overdue"
                      : progress.status === "completed" ? "Done"
                      : "Not started"}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default NextUpCard;