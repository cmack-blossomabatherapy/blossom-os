import { Link } from "react-router-dom";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ONBOARDING_PHASES } from "@/lib/onboarding/journey";

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
}

export function JourneyTimeline({ phaseProgress, activeId }: Props) {
  // Lock phase N if phase N-1 (excluding graduation) is incomplete
  let priorComplete = true;
  return (
    <ol className="space-y-2">
      {phaseProgress.map((pp, i) => {
        const Icon = pp.phase.icon;
        const locked = !pp.complete && !priorComplete;
        const active = pp.phase.id === activeId;
        const node = (
          <div className={cn(
            "flex items-center gap-3 rounded-xl border p-3 transition-all",
            active ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border/60 bg-card hover:border-primary/30",
            locked && "opacity-60",
          )}>
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
              pp.complete ? "bg-emerald-500/15 text-emerald-600" :
              active ? "bg-primary text-primary-foreground" :
              "bg-muted text-muted-foreground",
            )}>
              {pp.complete ? <Check className="h-4 w-4" /> : locked ? <Lock className="h-3.5 w-3.5" /> : <Icon className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{pp.phase.weekLabel}</p>
                <p className="text-[11px] tabular-nums text-muted-foreground">{pp.done}/{pp.total}</p>
              </div>
              <p className="truncate text-sm font-semibold text-foreground">{pp.phase.title}</p>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full transition-all", pp.complete ? "bg-emerald-500" : "bg-primary")} style={{ width: `${pp.percent}%` }} />
              </div>
            </div>
          </div>
        );
        const out = (
          <li key={pp.phase.id}>
            {locked ? <div>{node}</div> : <Link to={pp.phase.path}>{node}</Link>}
          </li>
        );
        if (!pp.complete) priorComplete = false;
        return out;
      })}
    </ol>
  );
}