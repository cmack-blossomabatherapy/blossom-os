import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JourneyStep, StepStatus } from "@/data/journey";

interface Props {
  steps: JourneyStep[];
  statuses: StepStatus[];
  onSelect: (index: number) => void;
  selectedIndex: number;
}

export function LifecycleTracker({ steps, statuses, onSelect, selectedIndex }: Props) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Your journey</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Click any step to see details and what's required.</p>
        </div>
      </div>

      {/* Desktop: horizontal stepper */}
      <div className="hidden md:block">
        <div className="relative">
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-border/60" aria-hidden />
          <div className="relative grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
            {steps.map((step, i) => {
              const status = statuses[i];
              const Icon = step.icon;
              const isSelected = i === selectedIndex;
              return (
                <button
                  key={step.id}
                  onClick={() => onSelect(i)}
                  className="group flex flex-col items-center gap-2 px-1 text-center"
                >
                  <div
                    className={cn(
                      "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                      status === "completed" && "border-primary bg-primary text-primary-foreground",
                      status === "in_progress" && "border-primary bg-background text-primary ring-4 ring-primary/15",
                      status === "available" && "border-primary/40 bg-background text-primary/70",
                      status === "locked" && "border-border bg-muted text-muted-foreground",
                      isSelected && "scale-110 shadow-lg shadow-primary/20",
                    )}
                  >
                    {status === "completed" ? <Check className="h-4 w-4" />
                      : status === "locked" ? <Lock className="h-3.5 w-3.5" />
                      : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="space-y-0.5 max-w-[110px]">
                    <p className={cn(
                      "text-[11px] font-medium leading-tight",
                      status === "in_progress" ? "text-foreground"
                        : status === "completed" ? "text-foreground"
                        : "text-muted-foreground",
                    )}>
                      {step.shortLabel}
                    </p>
                    <p className={cn(
                      "text-[10px] uppercase tracking-wider",
                      status === "completed" && "text-primary",
                      status === "in_progress" && "text-primary font-semibold",
                      status === "available" && "text-muted-foreground",
                      status === "locked" && "text-muted-foreground/60",
                    )}>
                      {labelFor(status)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: vertical timeline */}
      <div className="md:hidden space-y-3">
        {steps.map((step, i) => {
          const status = statuses[i];
          const Icon = step.icon;
          const isLast = i === steps.length - 1;
          const isSelected = i === selectedIndex;
          return (
            <button
              key={step.id}
              onClick={() => onSelect(i)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                isSelected ? "border-primary/40 bg-primary/5" : "border-border/60 hover:bg-muted/30",
              )}
            >
              <div className="relative flex flex-col items-center">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2",
                  status === "completed" && "border-primary bg-primary text-primary-foreground",
                  status === "in_progress" && "border-primary bg-background text-primary ring-4 ring-primary/15",
                  status === "available" && "border-primary/40 bg-background text-primary/70",
                  status === "locked" && "border-border bg-muted text-muted-foreground",
                )}>
                  {status === "completed" ? <Check className="h-4 w-4" />
                    : status === "locked" ? <Lock className="h-3.5 w-3.5" />
                    : <Icon className="h-4 w-4" />}
                </div>
                {!isLast && <div className="mt-1 h-6 w-0.5 bg-border" aria-hidden />}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-medium text-foreground">{step.label}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{labelFor(status)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function labelFor(s: StepStatus) {
  switch (s) {
    case "completed": return "Completed";
    case "in_progress": return "In progress";
    case "available": return "Up next";
    case "locked": return "Locked";
  }
}
