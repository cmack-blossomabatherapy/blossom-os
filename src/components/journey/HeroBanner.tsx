import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Props {
  viewerName: string;
  roleLabel: string;
  currentStageLabel: string;
  percent: number;
  nextStepLabel: string;
  onNextStep: () => void;
}

export function HeroBanner({ viewerName, roleLabel, currentStageLabel, percent, nextStepLabel, onNextStep }: Props) {
  const firstName = viewerName.split(" ")[0];
  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-background p-6 md:p-8">
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/60 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary backdrop-blur">
            <Sparkles className="h-3 w-3" /> {roleLabel}
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Welcome to Blossom Training, {firstName}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            You're currently on <span className="font-medium text-foreground">{currentStageLabel}</span>. Here's everything you need to keep moving.
          </p>
          <div className="space-y-1.5 max-w-md pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Journey progress</span>
              <span className="font-semibold text-foreground tabular-nums">{percent}%</span>
            </div>
            <Progress value={percent} className="h-2" />
          </div>
        </div>
        <Button size="lg" onClick={onNextStep} className="self-start md:self-auto rounded-xl shadow-lg shadow-primary/20">
          Next step: {nextStepLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
