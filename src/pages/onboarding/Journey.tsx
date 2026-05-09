import { Link } from "react-router-dom";
import { ArrowRight, Compass, Sparkles, Award, Clock, CheckCircle2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useAuth } from "@/contexts/AuthContext";
import { PremiumJourneyTimeline } from "@/components/onboarding/PremiumJourneyTimeline";
import { PhaseChipRail } from "@/components/onboarding/PhaseChipRail";
import { PathSwitcher } from "@/components/onboarding/PathSwitcher";
import { totalMinutes } from "@/lib/onboarding/journey";

export default function Journey() {
  const status = useOnboardingStatus();
  const { newStateEmployee } = useAuth();
  const minutes = totalMinutes(status.path);
  const totalHours = Math.max(1, Math.round(minutes / 60));
  const completedPhases = status.phaseProgress.filter((p) => p.complete && p.phase.id !== "graduation").length;
  const totalPhases = status.phaseProgress.filter((p) => p.phase.id !== "graduation").length;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-16">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary)/0.18),hsl(var(--accent)/0.10)_60%,transparent)] p-6 sm:p-10">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_85%_-10%,hsl(var(--primary)/0.25),transparent_55%),radial-gradient(circle_at_-10%_110%,hsl(var(--accent)/0.18),transparent_50%)]" />
        <div className="relative space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
            <Compass className="h-3 w-3 text-primary" /> Your Blossom Journey
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Your First 5 Weeks at <span className="text-gradient-brand">Blossom</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              A guided journey through who we are, how we work, and how you'll grow into ownership. Move at your own pace — the rest of the Academy unlocks at the finish line.
            </p>
          </div>

          {/* Stat strip */}
          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> Progress
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{status.journeyPercent}%</p>
              <p className="text-[11px] text-muted-foreground">{status.moduleDoneCount}/{status.totalModules} modules</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Map className="h-3 w-3 text-primary" /> Phases
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{completedPhases}<span className="text-sm font-normal text-muted-foreground">/{totalPhases}</span></p>
              <p className="text-[11px] text-muted-foreground">complete</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3 w-3 text-primary" /> Estimated
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">~{totalHours}h</p>
              <p className="text-[11px] text-muted-foreground">across all phases</p>
            </div>
          </div>

          <div className="space-y-1.5 max-w-2xl pt-1">
            <Progress value={status.journeyPercent} className="h-2" />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!status.isComplete && status.nextPhase && (
              <Button asChild size="lg" className="gap-2 rounded-2xl shadow-lg shadow-primary/20">
                <Link to={status.nextPhase.path}>
                  <Sparkles className="h-4 w-4" />
                  {status.moduleDoneCount === 0 ? "Start Your Blossom Journey" : `Continue: ${status.nextPhase.weekLabel} — ${status.nextPhase.title}`}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {status.isComplete && (
              <Button asChild size="lg" className="gap-2 rounded-2xl">
                <Link to="/onboarding/graduation"><Award className="h-4 w-4" /> View certificate</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="lg" className="gap-2 rounded-2xl">
              <Link to="/onboarding/roadmap"><CheckCircle2 className="h-4 w-4" /> Required steps</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Phase chip rail (sticky for quick nav) */}
      <div className="sticky top-2 z-20 -mx-1 rounded-2xl border border-border/60 bg-background/85 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-sm">
        <PhaseChipRail phaseProgress={status.phaseProgress} activeId={status.nextPhase?.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <PremiumJourneyTimeline
          phaseProgress={status.phaseProgress}
          activeId={status.nextPhase?.id}
          path={status.path}
          completedKeys={status.modulesComplete}
        />
        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your path</p>
            <p className="mt-1 mb-3 text-xs text-muted-foreground">
              {newStateEmployee
                ? "You're set up as a New State employee — extra Week 1 and Week 3 modules are unlocked for you."
                : "Choose the path that matches your role. Some Week 1 and Week 3 modules adjust accordingly."}
            </p>
            <PathSwitcher
              path={status.path}
              lockedReason={newStateEmployee ? "Set by your admin via your employee profile (New State employee)." : undefined}
            />
          </section>
          {status.nextPhase && !status.isComplete && (
            <section className="rounded-2xl border border-primary/30 bg-[linear-gradient(135deg,hsl(var(--primary)/0.08),transparent)] p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Up next</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{status.nextPhase.weekLabel} — {status.nextPhase.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{status.nextPhase.objective}</p>
              <Button asChild size="sm" className="mt-3 w-full gap-1 rounded-xl">
                <Link to={status.nextPhase.path}>Open phase <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}