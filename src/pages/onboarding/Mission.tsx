import { useState } from "react";
import { Heart, Eye, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { StepCompleteButton } from "@/components/onboarding/StepCompleteButton";
import { acknowledge, hasAcknowledged } from "@/lib/onboarding/storage";

const ACK = "mission-vision";

export default function OnboardingMission() {
  const [ack, setAck] = useState<string[]>(hasAcknowledged(ACK) ? [ACK] : []);
  const handleAck = () => {
    acknowledge(ACK);
    setAck([ACK]);
  };
  return (
    <OnboardingShell
      eyebrow="Mission & Vision"
      title="Why we exist"
      description="Every role at Blossom — clinical, operations, scheduling, intake, authorizations, training, leadership — supports one mission and one vision. Take a moment to read both."
    >
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Heart className="h-5 w-5" /></div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Our Mission</p>
          </div>
          <p className="mt-4 text-lg font-medium leading-relaxed text-foreground">
            At Blossom ABA Therapy, our mission is to provide compassionate, individualized, evidence-based ABA therapy that helps children and families grow with confidence.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Every role at Blossom supports that mission, from clinical care to operations, scheduling, intake, authorizations, training, and leadership.
          </p>
        </article>

        <article className="overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent"><Eye className="h-5 w-5" /></div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Our Vision</p>
          </div>
          <p className="mt-4 text-lg font-medium leading-relaxed text-foreground">
            Our vision is to build a company where families feel supported, employees feel empowered, and every system is designed to help us deliver excellent care with consistency, compassion, and accountability.
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-5">
        <p className="text-sm text-muted-foreground">
          By acknowledging below, you confirm you've read and understood our mission and vision and agree to let them guide your work.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={handleAck} variant={ack.length ? "secondary" : "default"} size="lg" className="gap-2">
            {ack.length ? <><Check className="h-4 w-4" /> Acknowledged</> : "I acknowledge"}
          </Button>
          <StepCompleteButton stepId="mission" requiredAcks={[ACK]} acknowledged={ack} />
        </div>
      </section>
    </OnboardingShell>
  );
}