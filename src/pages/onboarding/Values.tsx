import { useState } from "react";
import { BarChart3, Target, TrendingUp, Heart, Check, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { StepCompleteButton } from "@/components/onboarding/StepCompleteButton";
import { acknowledge, hasAcknowledged } from "@/lib/onboarding/storage";
import { cn } from "@/lib/utils";

interface CoreValue {
  key: string;
  title: string;
  icon: LucideIcon;
  description: string;
  examples: string[];
}

const VALUES: CoreValue[] = [
  {
    key: "value-data",
    title: "Data Over Emotion",
    icon: BarChart3,
    description:
      "We make decisions based on facts, trends, documentation, and measurable outcomes. We care deeply, but we do not guess. We use data to guide action, improve care, and solve problems clearly.",
    examples: [
      "Reviewing session notes and graphs before adjusting a plan",
      "Tracking authorization timelines instead of relying on memory",
      "Citing the SOP or report when escalating an issue",
    ],
  },
  {
    key: "value-ownership",
    title: "Extreme Ownership",
    icon: Target,
    description:
      "We take responsibility for our work, our communication, our follow-through, and our impact. When something needs to be fixed, we do not point fingers. We step up, solve it, and make the system better.",
    examples: [
      "Closing the loop on every family communication",
      "Owning a denial or compliance issue end-to-end",
      "Improving the playbook after a mistake instead of moving on",
    ],
  },
  {
    key: "value-improving",
    title: "Always Improving",
    icon: TrendingUp,
    description:
      "We believe every process, system, and skill can get better. We ask questions, learn from mistakes, accept feedback, and look for ways to improve the experience for families, staff, and the company.",
    examples: [
      "Asking 'why' until you find the root cause",
      "Suggesting workflow improvements during weekly check-ins",
      "Completing optional training to deepen your craft",
    ],
  },
  {
    key: "value-family",
    title: "Family First, Always",
    icon: Heart,
    description:
      "We serve children and families with patience, empathy, and respect. Every task, call, document, schedule, and decision connects back to helping families receive the care and support they need.",
    examples: [
      "Returning every parent call within the day",
      "Treating every document like it impacts a real family — because it does",
      "Slowing down to listen before you respond",
    ],
  },
];

export default function OnboardingValues() {
  const [acks, setAcks] = useState<string[]>(VALUES.map((v) => v.key).filter(hasAcknowledged));
  const ack = (k: string) => {
    acknowledge(k);
    setAcks((s) => (s.includes(k) ? s : [...s, k]));
  };
  const required = VALUES.map((v) => v.key);
  return (
    <OnboardingShell
      eyebrow="Core Values"
      title="The four values that guide us"
      description="Acknowledge each value below. These aren't posters on a wall — they show up in every shift, every note, and every family interaction."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {VALUES.map(({ key, title, icon: Icon, description, examples }) => {
          const done = acks.includes(key);
          return (
            <article
              key={key}
              className={cn(
                "flex flex-col gap-3 rounded-3xl border border-border/60 bg-card p-5 shadow-sm transition-all",
                done && "ring-1 ring-primary/30 border-primary/40",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                {done && <Badge variant="secondary" className="text-[10px]"><Check className="mr-0.5 h-3 w-3" /> Acknowledged</Badge>}
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">What this looks like at Blossom</p>
                <ul className="mt-2 space-y-1 text-xs text-foreground">
                  {examples.map((ex) => (
                    <li key={ex} className="flex gap-2"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />{ex}</li>
                  ))}
                </ul>
              </div>
              <Button
                onClick={() => ack(key)}
                variant={done ? "secondary" : "default"}
                className="mt-auto gap-2"
                disabled={done}
              >
                {done ? <><Check className="h-4 w-4" /> Acknowledged</> : "I commit to this value"}
              </Button>
            </article>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border/70 bg-background/60 p-4">
        <p className="text-xs text-muted-foreground">
          {acks.length}/{VALUES.length} values acknowledged
        </p>
        <StepCompleteButton stepId="values" requiredAcks={required} acknowledged={acks} />
      </div>
    </OnboardingShell>
  );
}