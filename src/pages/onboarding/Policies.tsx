import { useState } from "react";
import { ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { StepCompleteButton } from "@/components/onboarding/StepCompleteButton";
import { acknowledge, hasAcknowledged } from "@/lib/onboarding/storage";
import { REQUIRED_POLICY_KEYS } from "@/lib/onboarding/gates";

const POLICIES: { key: (typeof REQUIRED_POLICY_KEYS)[number]; title: string; body: string }[] = [
  { key: "policy-hipaa", title: "HIPAA & Privacy", body: "Protect every family's health information. Never share PHI outside approved systems." },
  { key: "policy-conduct", title: "Code of Conduct", body: "Show up with integrity, respect, and professionalism — toward families, teammates, and yourself." },
  { key: "policy-handbook", title: "Employee Handbook", body: "Time, attendance, leave, and benefits expectations are documented in the handbook." },
  { key: "policy-safety", title: "Client Safety & Reporting", body: "Know how to escalate any concern about client wellbeing immediately." },
];

export default function OnboardingPolicies() {
  const [acks, setAcks] = useState<string[]>(POLICIES.map((p) => p.key).filter(hasAcknowledged));
  const toggle = (k: string) => {
    if (acks.includes(k)) return;
    acknowledge(k);
    setAcks((s) => [...s, k]);
  };
  const required = POLICIES.map((p) => p.key);
  return (
    <OnboardingShell
      eyebrow="Policies"
      title="Policies & Acknowledgements"
      description="Read each policy and acknowledge that you understand and agree to follow it."
    >
      <ul className="space-y-3">
        {POLICIES.map(({ key, title, body }) => {
          const done = acks.includes(key);
          return (
            <li key={key} className={cn(
              "rounded-2xl border border-border/60 bg-card p-5 shadow-sm",
              done && "ring-1 ring-primary/30 border-primary/40",
            )}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    {done && <Badge variant="secondary" className="text-[10px]"><Check className="mr-0.5 h-3 w-3" /> Acknowledged</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{body}</p>
                </div>
                <Button size="sm" variant={done ? "secondary" : "default"} onClick={() => toggle(key)} disabled={done}>
                  {done ? "Acknowledged" : "I acknowledge"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border/70 bg-background/60 p-4">
        <p className="text-xs text-muted-foreground">{acks.length}/{POLICIES.length} policies acknowledged</p>
        <StepCompleteButton stepId="policies" requiredAcks={required} acknowledged={acks} />
      </div>
    </OnboardingShell>
  );
}