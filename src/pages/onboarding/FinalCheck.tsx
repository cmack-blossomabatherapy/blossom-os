import { useMemo, useState } from "react";
import { ClipboardCheck, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { StepCompleteButton } from "@/components/onboarding/StepCompleteButton";
import { cn } from "@/lib/utils";

interface Q {
  q: string;
  options: string[];
  answer: number;
}

const QUESTIONS: Q[] = [
  {
    q: "Which value reminds us to make decisions based on facts, not feelings?",
    options: ["Family First, Always", "Data Over Emotion", "Always Improving", "Extreme Ownership"],
    answer: 1,
  },
  {
    q: "What is Blossom's mission focused on?",
    options: [
      "Maximizing billable hours",
      "Compassionate, individualized, evidence-based ABA therapy for families",
      "Acquiring new locations",
      "Reducing staff turnover",
    ],
    answer: 1,
  },
  {
    q: "When something needs to be fixed, the Blossom way is to…",
    options: [
      "Find who's at fault",
      "Wait for leadership to escalate",
      "Step up, solve it, and improve the system",
      "Document it for the next quarter",
    ],
    answer: 2,
  },
  {
    q: "Which platform area unlocks AFTER onboarding is complete?",
    options: ["Welcome to Blossom", "Mission & Vision", "Full Training Catalog & Resource Hub", "Your Profile"],
    answer: 2,
  },
];

export default function OnboardingFinalCheck() {
  const [answers, setAnswers] = useState<(number | null)[]>(QUESTIONS.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const score = useMemo(
    () => answers.reduce<number>((s, a, i) => s + (a === QUESTIONS[i].answer ? 1 : 0), 0),
    [answers],
  );
  const passed = submitted && score === QUESTIONS.length;

  return (
    <OnboardingShell
      eyebrow="Final Knowledge Check"
      title="Confirm what you've learned"
      description="A short check on the foundations. You'll need every answer correct to pass — retakes are allowed."
    >
      <ol className="space-y-4">
        {QUESTIONS.map((q, qi) => (
          <li key={qi} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">{qi + 1}</div>
              <p className="text-sm font-medium text-foreground">{q.q}</p>
            </div>
            <div className="grid gap-2">
              {q.options.map((opt, oi) => {
                const selected = answers[qi] === oi;
                const correctAfter = submitted && oi === q.answer;
                const wrongAfter = submitted && selected && oi !== q.answer;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={passed}
                    onClick={() => setAnswers((s) => s.map((v, i) => (i === qi ? oi : v)))}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-left text-sm transition-all hover:border-primary/40",
                      selected && !submitted && "border-primary bg-primary/5",
                      correctAfter && "border-success/60 bg-success/10 text-foreground",
                      wrongAfter && "border-destructive/60 bg-destructive/10",
                    )}
                  >
                    <span>{opt}</span>
                    {correctAfter && <Check className="h-4 w-4 text-success" />}
                    {wrongAfter && <X className="h-4 w-4 text-destructive" />}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border/70 bg-background/60 p-4">
        <div className="text-xs text-muted-foreground">
          {submitted ? (
            <>Score: <span className="font-semibold text-foreground">{score}/{QUESTIONS.length}</span> · {passed ? <Badge className="ml-1 text-[10px]">Passed</Badge> : <Badge variant="destructive" className="ml-1 text-[10px]">Try again</Badge>}</>
          ) : (
            <>Answer all {QUESTIONS.length} questions to submit.</>
          )}
        </div>
        <div className="flex gap-2">
          {!passed && (
            <Button
              onClick={() => setSubmitted(true)}
              disabled={answers.some((a) => a === null)}
              className="gap-2"
            >
              <ClipboardCheck className="h-4 w-4" /> {submitted ? "Re-check" : "Submit answers"}
            </Button>
          )}
          {passed && <StepCompleteButton stepId="final-check" label="Continue to completion" />}
        </div>
      </div>
    </OnboardingShell>
  );
}