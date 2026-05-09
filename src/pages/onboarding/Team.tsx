import { Users, HeartHandshake, ShieldCheck, Compass } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { StepCompleteButton } from "@/components/onboarding/StepCompleteButton";

const groups = [
  { icon: ShieldCheck, name: "Clinical Leadership", body: "BCBAs, Clinical Directors, and QA who guide care quality." },
  { icon: HeartHandshake, name: "Family Support", body: "Intake, scheduling, and authorizations — the people who keep families covered and on the calendar." },
  { icon: Compass, name: "Operations & HR", body: "The team that builds systems, supports staff, and keeps Blossom running." },
];

export default function OnboardingTeam() {
  return (
    <OnboardingShell
      eyebrow="Meet the Team"
      title="The people you'll work with"
      description="Blossom runs on tight collaboration between clinical, operations, and family-support teams. Here's a quick orientation — you'll meet specific teammates throughout your first weeks."
    >
      <section className="grid gap-3 sm:grid-cols-3">
        {groups.map(({ icon: Icon, name, body }) => (
          <div key={name} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
            <p className="mt-3 text-sm font-semibold text-foreground">{name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Your first week</h2>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-foreground">
          <li className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" /> Your manager will introduce you to your direct team.</li>
          <li className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" /> HR will walk you through onboarding paperwork and benefits.</li>
          <li className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" /> You'll get a buddy from your department for questions.</li>
        </ul>
      </section>
      <StepCompleteButton stepId="team" />
    </OnboardingShell>
  );
}