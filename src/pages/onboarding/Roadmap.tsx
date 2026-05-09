import { Link } from "react-router-dom";
import { Check, Lock, ArrowRight, Clock, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { ONBOARDING_STEPS, ONBOARDING_TOTAL_MINUTES } from "@/lib/onboarding/steps";

export default function OnboardingRoadmap() {
  const { completedSteps, percent, completedCount, totalRequired, nextStep, isComplete } = useOnboardingStatus();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary)/0.14),hsl(var(--accent)/0.08))] p-6 sm:p-10">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <Compass className="h-3 w-3 text-primary" /> Your Blossom Journey
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Welcome to <span className="text-gradient-brand">Blossom Academy</span>
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            This guided journey introduces you to who we are, what we believe, and how we work. Move through it at your own pace — the rest of the academy unlocks when you finish.
          </p>
          <div className="space-y-1.5 max-w-md pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-foreground tabular-nums">{percent}% · {completedCount}/{totalRequired}</span>
            </div>
            <Progress value={percent} className="h-2" />
            <p className="text-[11px] text-muted-foreground">~{ONBOARDING_TOTAL_MINUTES} min total estimated time</p>
          </div>
          {nextStep && !isComplete && (
            <Button asChild size="lg" className="mt-3 gap-2 rounded-2xl shadow-lg shadow-primary/20">
              <Link to={nextStep.path}>
                <Sparkles className="h-4 w-4" />
                {completedCount === 0 ? "Start Your Blossom Journey" : `Continue: ${nextStep.title}`}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </header>

      <ol className="space-y-3">
        {ONBOARDING_STEPS.map((step, idx) => {
          const done = completedSteps.includes(step.id);
          const prevDone = idx === 0 || completedSteps.includes(ONBOARDING_STEPS[idx - 1].id);
          const locked = !done && !prevDone;
          const Icon = step.icon;
          return (
            <li key={step.id}>
              <Link
                to={locked ? "#" : step.path}
                onClick={(e) => locked && e.preventDefault()}
                className={cn(
                  "flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all sm:p-5",
                  !locked && "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                  locked && "opacity-60",
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold tabular-nums",
                  done ? "bg-primary text-primary-foreground" : locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
                )}>
                  {done ? <Check className="h-5 w-5" /> : locked ? <Lock className="h-4 w-4" /> : idx + 1}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground sm:text-base">{step.title}</p>
                    {done && <Badge variant="secondary" className="text-[10px]">Complete</Badge>}
                    {!done && !locked && <Badge variant="outline" className="text-[10px]">Available</Badge>}
                    {locked && <Badge variant="outline" className="text-[10px]"><Lock className="mr-0.5 h-2.5 w-2.5" />Locked</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground sm:text-sm">{step.blurb}</p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> ~{step.estMinutes} min · {step.requirement}
                  </p>
                </div>
                {!locked && (
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}