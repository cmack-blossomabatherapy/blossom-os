import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  /** Show progress bar in header */
  showProgress?: boolean;
}

export function OnboardingShell({ eyebrow = "Onboarding", title, description, children, showProgress = true }: Props) {
  const { percent, completedCount, totalRequired } = useOnboardingStatus();
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
          <Link to="/onboarding"><ArrowLeft className="h-3.5 w-3.5" /> Roadmap</Link>
        </Button>
      </div>
      <header className="space-y-3 rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary)/0.10),hsl(var(--accent)/0.06))] p-6 sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <Compass className="h-3 w-3 text-primary" /> {eyebrow}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>}
        {showProgress && (
          <div className="space-y-1.5 max-w-md pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Onboarding journey</span>
              <span className="font-semibold text-foreground tabular-nums">{percent}% · {completedCount}/{totalRequired}</span>
            </div>
            <Progress value={percent} className="h-2" />
          </div>
        )}
      </header>
      {children}
    </div>
  );
}