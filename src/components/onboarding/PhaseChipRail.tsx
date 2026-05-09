import { Link } from "react-router-dom";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ONBOARDING_PHASES } from "@/lib/onboarding/journey";

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

export function PhaseChipRail({ phaseProgress, activeId }: Props) {
  let priorComplete = true;
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {phaseProgress.map((pp) => {
        const Icon = pp.phase.icon;
        const locked = !pp.complete && !priorComplete;
        const active = pp.phase.id === activeId;
        const chip = (
          <div
            className={cn(
              "group flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              pp.complete && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              !pp.complete && active && "border-primary/60 bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/30",
              !pp.complete && !active && !locked && "border-border/60 bg-card text-foreground hover:border-primary/40",
              locked && "border-dashed border-border/60 bg-muted/40 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums",
                pp.complete ? "bg-emerald-500 text-white" :
                active ? "bg-primary text-primary-foreground" :
                locked ? "bg-muted text-muted-foreground" :
                "bg-foreground/10 text-foreground",
              )}
            >
              {pp.complete ? <Check className="h-3 w-3" /> : locked ? <Lock className="h-2.5 w-2.5" /> : pp.phase.index}
            </span>
            <Icon className="h-3.5 w-3.5 opacity-70" />
            <span className="whitespace-nowrap">{pp.phase.weekLabel}</span>
            {pp.total > 0 && (
              <span className="rounded-full bg-background/60 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                {pp.done}/{pp.total}
              </span>
            )}
          </div>
        );
        const node = locked ? (
          <div key={pp.phase.id}>{chip}</div>
        ) : (
          <Link key={pp.phase.id} to={`#phase-${pp.phase.id}`} onClick={(e) => {
            e.preventDefault();
            document.getElementById(`phase-${pp.phase.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}>
            {chip}
          </Link>
        );
        if (!pp.complete) priorComplete = false;
        return node;
      })}
    </div>
  );
}
