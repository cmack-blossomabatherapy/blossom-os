import { Link } from "react-router-dom";
import { BookOpen, ExternalLink, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { StepCompleteButton } from "@/components/onboarding/StepCompleteButton";

const courses = [
  { title: "Blossom Systems Overview", minutes: 20, required: true },
  { title: "Family Communication Essentials", minutes: 25, required: true },
  { title: "Documentation Standards", minutes: 15, required: true },
];

export default function OnboardingRequiredRole() {
  return (
    <OnboardingShell
      eyebrow="Required Role Training"
      title="The core training for your role"
      description="These short courses give you the foundation you need before you start day-to-day work. They're already assigned to you in My Learning."
    >
      <ul className="space-y-3">
        {courses.map((c) => (
          <li key={c.title} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{c.title}</p>
                {c.required && <Badge className="text-[10px]">Required</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">~{c.minutes} min</p>
            </div>
            <Link to="/my-learning" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Open <ExternalLink className="h-3 w-3" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-4 text-xs text-muted-foreground">
        When you've completed all required role courses in My Learning, mark this step complete to continue.
      </div>
      <StepCompleteButton stepId="required-role" label="I've completed required role training" />
    </OnboardingShell>
  );
}