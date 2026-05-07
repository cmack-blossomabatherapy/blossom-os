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
    <div className="glass-hero relative p-6 md:p-8">
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3 max-w-2xl">
          <div className="glass-chip">
            <Sparkles className="h-3 w-3" /> {roleLabel}
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Welcome to Blossom Training,{" "}
            <span className="text-gradient-brand">{firstName}</span>
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
        <Button size="lg" onClick={onNextStep} className="self-start md:self-auto rounded-2xl shadow-lg shadow-primary/30">
          Next step: {nextStepLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
