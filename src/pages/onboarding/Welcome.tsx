import { Sparkles, PlayCircle, ArrowRight, Heart, Compass, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { StepCompleteButton } from "@/components/onboarding/StepCompleteButton";
import { useAuth } from "@/contexts/AuthContext";

const expect = [
  { icon: Heart, title: "Who we are", body: "The mission, vision, and values that guide every decision at Blossom." },
  { icon: Compass, title: "How we work", body: "How families, clinical care, and operations all fit together." },
  { icon: Users, title: "Your team", body: "The people you'll work alongside and how to ask for help." },
];

export default function OnboardingWelcome() {
  const { user } = useAuth();
  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  return (
    <OnboardingShell
      eyebrow="Welcome"
      title={`Welcome to Blossom, ${firstName}`}
      description="Welcome to Blossom ABA Therapy. We are so excited to have you here. Blossom Academy was created to help you feel confident, supported, and prepared as you begin your role. This journey will introduce you to who we are, what we believe, how we serve families, and how we work together as one team."
    >
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="aspect-video w-full bg-[linear-gradient(135deg,hsl(var(--primary)/0.18),hsl(var(--accent)/0.12))] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <PlayCircle className="h-12 w-12 text-primary/70" />
            <p className="text-xs">Leadership welcome video — coming soon</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {expect.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <Icon className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <StepCompleteButton stepId="welcome" label="Start Your Blossom Journey" />
        <Button asChild variant="outline" size="lg" className="gap-2">
          <Link to="/onboarding/mission">Skip ahead to Mission <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </OnboardingShell>
  );
}