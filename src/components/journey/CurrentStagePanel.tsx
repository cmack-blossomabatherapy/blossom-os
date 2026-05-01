import { Check, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JourneyStep, StepStatus } from "@/data/journey";

interface Props {
  step: JourneyStep;
  status: StepStatus;
  onMarkComplete: () => void;
}

export function CurrentStagePanel({ step, status, onMarkComplete }: Props) {
  const Icon = step.icon;
  const isComplete = status === "completed";
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl shrink-0",
            isComplete ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              {isComplete ? "Completed stage" : "Current stage"}
            </p>
            <h3 className="text-lg font-semibold text-foreground mt-0.5">{step.label}</h3>
          </div>
        </div>
        <span className={cn(
          "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap",
          isComplete ? "bg-primary/10 text-primary border-primary/30" : "bg-warning/10 text-warning border-warning/30",
        )}>
          {isComplete ? "Complete" : "In progress"}
        </span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Owner</p>
          <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" /> {step.ownerName}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{step.ownerRole}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Estimated time</p>
          <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {step.estMinutes ? formatMinutes(step.estMinutes) : "Ongoing"}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-foreground mb-2">What you need to do</p>
        <ul className="space-y-1.5">
          {step.checklist.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <div className="mt-0.5 h-4 w-4 rounded-full border border-primary/40 flex items-center justify-center shrink-0">
                {isComplete && <Check className="h-2.5 w-2.5 text-primary" />}
              </div>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {!isComplete && (
        <Button onClick={onMarkComplete} className="w-full mt-5 rounded-xl">
          <Check className="h-4 w-4" /> Mark this stage complete
        </Button>
      )}
    </div>
  );
}

function formatMinutes(m: number) {
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  return `${h} hour${h === 1 ? "" : "s"}`;
}
