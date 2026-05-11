import { Link } from "react-router-dom";
import { Lock, ArrowRight, Sparkles, Heart, Compass, GraduationCap, Trophy, CheckCircle2, LifeBuoy } from "lucide-react";
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
  const { percent, nextPhase, completedCount, totalRequired, phaseProgress } = status;

  const journeyMilestones = [
    { icon: Heart, label: "Welcome", id: "welcome" },
    { icon: Compass, label: "Week 1", id: "w1" },
    { icon: GraduationCap, label: "Week 2", id: "w2" },
    { icon: CheckCircle2, label: "Week 3", id: "w3" },
    { icon: Trophy, label: "Graduate", id: "graduation" },
  ];

  const completedIds = new Set(
    (phaseProgress || []).filter((pp: any) => pp.complete).map((pp: any) => pp.phase.id),
  );
  const activeId = nextPhase?.id;

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_40px_100px_-40px_hsl(var(--primary)/0.45)]">
        {/* Gradient hero header */}
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] px-6 py-10 text-primary-foreground sm:px-10 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.28),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" />
          <div className="relative flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/15 shadow-lg ring-1 ring-primary-foreground/20 backdrop-blur-md">
              <Lock className="h-7 w-7" />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" /> You're being set up for success
            </span>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {sectionLabel ? `${sectionLabel} unlocks soon` : "This unlocks once you're ready"}
              </h2>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
                {description ||
                  "We're walking you through Welcome to Blossom first — once you're done, everything you need for your role unlocks automatically."}
              </p>
            </div>
          </div>
        </div>

        {/* Journey progress + milestones */}
        <div className="space-y-6 p-6 sm:p-10">
          <div className="space-y-3 rounded-2xl border border-border/60 bg-background/60 p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Your onboarding progress</span>
              <span className="tabular-nums text-muted-foreground">{percent}% · {completedCount}/{totalRequired} steps</span>
            </div>
            <Progress value={percent} className="h-2" />
            {nextPhase && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Next up:</span> {nextPhase.weekLabel} — {nextPhase.title}
              </p>
            )}
          </div>

          {/* Milestone strip */}
          <div className="relative">
            <div className="absolute left-4 right-4 top-5 h-px bg-border" aria-hidden />
            <div className="relative grid grid-cols-5 gap-1">
              {journeyMilestones.map((m) => {
                const Icon = m.icon;
                const isDone = completedIds.has(m.id);
                const isActive = activeId === m.id;
                return (
                  <div key={m.id} className="flex flex-col items-center gap-1.5">
                    <div className={
                      "flex h-10 w-10 items-center justify-center rounded-full ring-1 transition-all " +
                      (isDone
                        ? "bg-emerald-500 text-white ring-emerald-500/30 shadow-sm"
                        : isActive
                          ? "bg-primary text-primary-foreground ring-primary/30 shadow-md"
                          : "bg-background text-muted-foreground ring-border")
                    }>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className={"text-[10px] font-medium " + (isActive ? "text-foreground" : "text-muted-foreground")}>{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 pt-1">
            <Button asChild size="lg" className="w-full gap-2 sm:w-auto">
              <Link to={nextPhase?.path || "/onboarding"}>
                Continue your journey <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Stuck? <Link to="/help" className="font-medium text-primary hover:underline">Help & Support</Link> or ask the Blossom Assistant anytime.
            </p>
          </div>
        </div>

        {/* Bottom support strip */}
        <div className="flex items-center justify-center gap-2 border-t border-border/60 bg-muted/30 px-6 py-3 text-[11px] text-muted-foreground">
          <LifeBuoy className="h-3.5 w-3.5 text-primary" />
          You're not alone — every Blossom team member starts here.
        </div>
      </div>
    </div>
  );
}