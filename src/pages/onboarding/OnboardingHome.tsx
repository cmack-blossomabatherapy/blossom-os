import { Link } from "react-router-dom";
import { ArrowRight, Compass, BookOpen, Library, LifeBuoy, Lock, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { JourneyTimeline } from "@/components/onboarding/JourneyTimeline";
import { JourneyHero } from "@/components/onboarding/JourneyHero";

export default function OnboardingHome() {
  const { user } = useAuth();
  const status = useOnboardingStatus();
  const { journeyPercent, moduleDoneCount, totalModules, nextPhase, phaseProgress } = status;
  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    (user?.user_metadata?.display_name as string | undefined)?.split(" ")[0] ||
    (user?.user_metadata?.name as string | undefined)?.split(" ")[0] ||
    user?.email?.split("@")[0]?.split(/[._-]/)[0] ||
    "there";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <JourneyHero
        title={`Welcome to Blossom, ${firstName.charAt(0).toUpperCase()}${firstName.slice(1)}`}
        description="Your home for onboarding, training, and growth at Blossom ABA Therapy. Let's get you ready — start with your guided onboarding journey."
        progressPercent={journeyPercent}
        progressLabel={`${moduleDoneCount} of ${totalModules} modules complete`}
        ctaLabel={moduleDoneCount === 0 ? "Start Your Blossom Journey" : `Continue: ${nextPhase?.weekLabel || "Journey"}`}
        ctaTo={nextPhase?.path || "/onboarding"}
      />

      {/* Show Your Journey CTA */}
      <Link
        to="/onboarding"
        className="group relative block overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6"
      >
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Map className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Your Path</p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">Show Your Journey</p>
              <p className="mt-1 text-sm text-muted-foreground">See every phase, week, and module across your first four weeks at Blossom.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform group-hover:translate-x-0.5 sm:self-auto">
            Open journey <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>

      {/* What's next + locked previews */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Your first 4 weeks</h2>
          </div>
          <JourneyTimeline phaseProgress={phaseProgress} activeId={nextPhase?.id} />
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/onboarding">Open full journey <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </section>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Need a hand?</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Help is one click away.</p>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link to="/help">Open Help & Support</Link>
            </Button>
          </div>

          {[
            { icon: BookOpen, title: "Training Catalog" },
            { icon: Library, title: "Resource Hub" },
          ].map(({ icon: Icon, title }) => (
            <div key={title} className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                <Icon className="h-4 w-4" />
                <p className="text-sm font-medium text-foreground">{title}</p>
                <Badge variant="outline" className="ml-auto text-[10px]">Locked</Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Unlocks after onboarding</p>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}