import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Sparkles, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { NextUpCard } from "@/components/training/NextUpCard";

export default function MyLearning() {
  const { user } = useAuth();
  const status = useOnboardingStatus();
  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    user?.email?.split("@")[0]?.split(/[._-]/)[0] ||
    "there";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] p-6 text-primary-foreground shadow-lg sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" />
        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> My Learning
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back, <span className="capitalize">{firstName}</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/85 sm:text-base">
              Your active learning lives here. Right now your focus is finishing the Welcome to Blossom journey.
            </p>
          </div>
          <div className="grid gap-4 sm:max-w-md">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-primary-foreground/85">
                <span>Onboarding journey</span>
                <span>{status.journeyPercent}%</span>
              </div>
              <Progress value={status.journeyPercent} className="h-2 bg-primary-foreground/20" />
            </div>
            <Button asChild size="lg" className="w-fit bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Link to={status.nextPhase?.path || "/onboarding"}>
                {status.moduleDoneCount === 0 ? "Start your journey" : "Continue your journey"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <NextUpCard />

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Live trainings are coming soon</h2>
            <p className="text-sm text-muted-foreground">
              The Blossom Academy course library is being built. Once courses go live, your assignments,
              progress, and certifications will all appear right here.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild variant="outline" size="sm">
                <Link to="/onboarding">View onboarding</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <Link to="/help"><LifeBuoy className="h-3.5 w-3.5" /> Help & Support</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}