import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PHASE_COLORS, type AcademyModule, type AcademyProgress } from "@/lib/academy/types";
import { CheckCircle2, Lock, Play } from "lucide-react";

interface WeekNode {
  id: string;
  week_number: number;
  title: string;
  objective: string | null;
  modules: AcademyModule[];
  phaseColor: string;
  phaseName: string;
}

export function RoadmapTimeline({
  weeks, progress, currentWeekId,
}: { weeks: WeekNode[]; progress: AcademyProgress[]; currentWeekId: string | null }) {
  const completedSet = new Set(progress.filter((p) => p.status === "completed").map((p) => p.module_id));
  let lockFromHere = false;
  return (
    <div className="relative">
      <div className="grid gap-4 lg:grid-cols-5">
        {weeks.map((w, i) => {
          const required = w.modules.filter((m) => m.is_required);
          const done = required.filter((m) => completedSet.has(m.id)).length;
          const pct = required.length === 0 ? 0 : Math.round((done / required.length) * 100);
          const isCurrent = w.id === currentWeekId;
          const isComplete = pct === 100;
          const locked = lockFromHere && !isCurrent && !isComplete;
          if (!isComplete && isCurrent) lockFromHere = true;
          if (!isComplete && !isCurrent && i > 0 && !lockFromHere) lockFromHere = true;
          const c = PHASE_COLORS[w.phaseColor] ?? PHASE_COLORS.primary;
          return (
            <Link
              key={w.id}
              to={locked ? "#" : `/training/academy/week/${w.id}`}
              onClick={(e) => locked && e.preventDefault()}
              className={cn(
                "group relative flex flex-col rounded-2xl border bg-card p-4 shadow-sm transition-all",
                locked ? "opacity-60 cursor-not-allowed" : "hover:shadow-md hover:-translate-y-0.5",
                isCurrent && "ring-2 ring-primary/40"
              )}
            >
              <div className={cn("absolute left-0 top-4 bottom-4 w-1 rounded-r-full", c.bar)} />
              <div className="pl-3 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Week {w.week_number}</span>
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : locked ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                ) : isCurrent ? (
                  <Play className="h-3.5 w-3.5 text-primary" />
                ) : null}
              </div>
              <h3 className="pl-3 mt-1 text-[15px] font-semibold leading-tight tracking-tight">{w.title}</h3>
              <p className="pl-3 mt-1 text-xs text-muted-foreground line-clamp-2">{w.objective}</p>
              <div className="pl-3 mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full transition-all", c.bar)} style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{done}/{required.length} required</span>
                  <span className="tabular-nums">{pct}%</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}