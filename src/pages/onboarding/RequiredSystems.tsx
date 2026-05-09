import { Link } from "react-router-dom";
import { Workflow, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { StepCompleteButton } from "@/components/onboarding/StepCompleteButton";

const systems = [
  { title: "CentralReach Basics", minutes: 15 },
  { title: "Blossom CRM Tour", minutes: 10 },
  { title: "Time Clock & Scheduling", minutes: 10 },
];

export default function OnboardingRequiredSystems() {
  return (
    <OnboardingShell
      eyebrow="Required Systems Training"
      title="The tools you'll use daily"
      description="A short tour of the platforms Blossom runs on so your first day feels familiar."
    >
      <ul className="space-y-3">
        {systems.map((c) => (
          <li key={c.title} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Workflow className="h-5 w-5" /></div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{c.title}</p>
                <Badge className="text-[10px]">Required</Badge>
              </div>
              <p className="text-xs text-muted-foreground">~{c.minutes} min</p>
            </div>
            <Link to="/my-learning" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Open <ExternalLink className="h-3 w-3" />
            </Link>
          </li>
        ))}
      </ul>
      <StepCompleteButton stepId="required-systems" label="I've completed systems training" />
    </OnboardingShell>
  );
}