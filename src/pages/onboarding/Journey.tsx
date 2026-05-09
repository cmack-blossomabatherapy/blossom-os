import { Link } from "react-router-dom";
import { ArrowRight, Compass, Sparkles, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { JourneyTimeline } from "@/components/onboarding/JourneyTimeline";
import { PathSwitcher } from "@/components/onboarding/PathSwitcher";
import { totalMinutes } from "@/lib/onboarding/journey";

export default function Journey() {
  const status = useOnboardingStatus();
  const minutes = totalMinutes(status.path);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary)/0.16),hsl(var(--accent)/0.10))] p-6 sm:p-10">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <Compass className="h-3 w-3 text-primary" /> Your Blossom Journey
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Your First 5 Weeks at <span className="text-gradient-brand">Blossom</span>
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            A guided journey through who we are, how we work, and how you'll grow into ownership. Move at your own pace — the rest of the Academy unlocks at the finish line.
          </p>
          <div className="space-y-1.5 max-w-md pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Overall progress</span>
              <span className="font-semibold text-foreground tabular-nums">{status.journeyPercent}% · {status.moduleDoneCount}/{status.totalModules}</span>
            </div>
            <Progress value={status.journeyPercent} className="h-2" />
            <p className="text-[11px] text-muted-foreground">~{Math.round(minutes / 60)}h estimated across all phases</p>
          </div>
          {!status.isComplete && status.nextPhase && (
            <Button asChild size="lg" className="mt-3 gap-2 rounded-2xl shadow-lg shadow-primary/20">
              <Link to={status.nextPhase.path}>
                <Sparkles className="h-4 w-4" />
                {status.moduleDoneCount === 0 ? "Start Your Blossom Journey" : `Continue: ${status.nextPhase.weekLabel} — ${status.nextPhase.title}`}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {status.isComplete && (
            <Button asChild size="lg" className="mt-3 gap-2 rounded-2xl">
              <Link to="/onboarding/graduation"><Award className="h-4 w-4" /> View certificate</Link>
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <JourneyTimeline phaseProgress={status.phaseProgress} activeId={status.nextPhase?.id} />
        <aside className="space-y-3">
          <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your path</p>
            <p className="mt-1 mb-3 text-xs text-muted-foreground">Choose the path that matches your role. Some Week 1 and Week 3 modules adjust accordingly.</p>
            <PathSwitcher path={status.path} />
          </section>
        </aside>
      </div>
    </div>
  );
}