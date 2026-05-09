import { Link } from "react-router-dom";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

interface Props {
  /** Optional override description shown above the progress bar. */
  description?: string;
  /** Optional name of the section being locked (e.g. "Training Catalog"). */
  sectionLabel?: string;
}

export function LockedStateCard({ description, sectionLabel }: Props) {
  const status = useOnboardingStatus();
  const { percent, nextPhase, completedCount, totalRequired } = status;
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center p-4 sm:p-6">
      <div className="relative w-full overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_30px_80px_-40px_hsl(var(--primary)/0.4)]">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(135deg,hsl(var(--primary)/0.18),hsl(var(--accent)/0.12)_60%,transparent)]"
        />
        <div className="relative space-y-6 p-8 sm:p-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> Onboarding required
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {sectionLabel ? `${sectionLabel} is locked` : "This section is locked"}
              </h2>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                {description ||
                  "Complete your Blossom onboarding to unlock this section. You're being guided through everything you need first — it'll feel great on the other side."}
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-border/60 bg-background/60 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Onboarding progress</span>
              <span className="tabular-nums text-muted-foreground">{percent}% · {completedCount}/{totalRequired} steps</span>
            </div>
            <Progress value={percent} className="h-2" />
            {nextPhase && (
              <p className="pt-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Next:</span> {nextPhase.weekLabel} — {nextPhase.title}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={nextPhase?.path || "/onboarding"}>
                Continue Onboarding <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Once your onboarding journey is complete, the full Academy unlocks automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}