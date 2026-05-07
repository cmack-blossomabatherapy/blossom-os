import { Check, Clock, User, Mail, ExternalLink, Info, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JourneyStep, StepStatus } from "@/data/journey";

interface Props {
  step: JourneyStep;
  status: StepStatus;
  onMarkComplete: () => void;
  /** When false, the complete button is disabled (checklist not finished). */
  canComplete?: boolean;
  /** Progress hint shown next to the button. */
  checklistProgress?: { done: number; total: number };
  /** Per-item checked state, keyed by checklist index. */
  checkedItems?: Record<number, boolean>;
  /** Toggle a single checklist item. When omitted, items render read-only. */
  onToggleChecklistItem?: (idx: number) => void;
}

export function CurrentStagePanel({ step, status, onMarkComplete, canComplete = true, checklistProgress, checkedItems, onToggleChecklistItem }: Props) {
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
          {step.checklist.map((item, i) => {
            const checked = isComplete || !!checkedItems?.[i];
            const interactive = !!onToggleChecklistItem && !isComplete;
            const Wrapper: any = interactive ? "button" : "div";
            return (
              <li key={i}>
                <Wrapper
                  {...(interactive ? { type: "button", onClick: () => onToggleChecklistItem!(i) } : {})}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md text-left text-sm",
                    interactive && "px-1.5 py-1 -mx-1.5 hover:bg-muted/50 transition-colors cursor-pointer",
                    checked ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <div className={cn(
                    "mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                    checked ? "border-primary bg-primary text-primary-foreground" : "border-primary/40",
                  )}>
                    {checked && <Check className="h-2.5 w-2.5" />}
                  </div>
                  <span className={cn(checked && "line-through opacity-70")}>{item}</span>
                </Wrapper>
              </li>
            );
          })}
        </ul>
      </div>

      {step.moreInfo && (
        <div className="mt-5 rounded-xl border border-border/40 bg-muted/30 p-4">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary" /> More information
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{step.moreInfo}</p>
        </div>
      )}

      {step.links && step.links.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-foreground mb-2">Helpful links</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {step.links.map((link) => {
              const internal = link.url.startsWith("/");
              const Wrapper = ({ children }: { children: React.ReactNode }) =>
                internal ? (
                  <Link to={link.url} className="group rounded-lg border border-border/40 p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors block">
                    {children}
                  </Link>
                ) : (
                  <a href={link.url} target="_blank" rel="noreferrer" className="group rounded-lg border border-border/40 p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors block">
                    {children}
                  </a>
                );
              return (
                <Wrapper key={link.url}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{link.label}</p>
                    {internal ? (
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                    )}
                  </div>
                  {link.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{link.description}</p>}
                </Wrapper>
              );
            })}
          </div>
        </div>
      )}

      {step.coordinatorEmail && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-primary font-semibold">Training coordinator</p>
            <p className="text-sm font-medium text-foreground mt-1 truncate">
              {step.coordinatorName ?? step.ownerName}
              {step.coordinatorRole && <span className="text-muted-foreground"> · {step.coordinatorRole}</span>}
            </p>
            <p className="text-xs text-muted-foreground truncate">{step.coordinatorEmail}</p>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-lg shrink-0">
            <a href={`mailto:${step.coordinatorEmail}?subject=${encodeURIComponent(`Question about: ${step.label}`)}`}>
              <Mail className="h-3.5 w-3.5" /> Email coordinator
            </a>
          </Button>
        </div>
      )}

      {!isComplete && (
        <div className="mt-5 space-y-1.5">
          <Button
            onClick={onMarkComplete}
            disabled={!canComplete}
            className="w-full rounded-xl"
          >
            <Check className="h-4 w-4" /> Mark this stage complete
          </Button>
          {!canComplete && checklistProgress && (
            <p className="text-[11px] text-muted-foreground text-center">
              Finish all {checklistProgress.total} checklist items to enable
              {" "}({checklistProgress.done}/{checklistProgress.total} done).
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function formatMinutes(m: number) {
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  return `${h} hour${h === 1 ? "" : "s"}`;
}
