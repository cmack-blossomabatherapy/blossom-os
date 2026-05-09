import { GraduationCap, BookOpen, Library, Award, Compass } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { StepCompleteButton } from "@/components/onboarding/StepCompleteButton";

const sections = [
  { icon: Compass, title: "Onboarding first", body: "You're in it now. This guided journey introduces you to Blossom and confirms the foundations." },
  { icon: GraduationCap, title: "Role training", body: "Once onboarding is complete, you'll work through your role's required courses and skills." },
  { icon: BookOpen, title: "Catalog & growth", body: "Optional courses, leadership tracks, and certifications open up so you can keep growing." },
  { icon: Library, title: "Resources & SOPs", body: "Search and reuse the same playbooks our experienced staff rely on." },
  { icon: Award, title: "Recognition", body: "Earn badges, certificates, and acknowledgement as you progress." },
];

export default function OnboardingHowItWorks() {
  return (
    <OnboardingShell
      eyebrow="How it Works"
      title="How Blossom Academy works"
      description="Blossom Academy is more than a course list — it's the operating system for how you learn, grow, and stay sharp at Blossom."
    >
      <section className="grid gap-3 sm:grid-cols-2">
        {sections.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
            <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
      <StepCompleteButton stepId="how-it-works" />
    </OnboardingShell>
  );
}