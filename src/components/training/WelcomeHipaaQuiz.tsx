import { useMemo, useState } from "react";
import { CheckCircle2, ShieldCheck, XCircle, RefreshCcw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WELCOME_HIPAA_QUIZ } from "@/lib/training/welcomeToBlossomContent";
import { markModuleComplete, unmarkModule } from "@/lib/onboarding/storage";

interface Props {
  /** Whether the learner has already passed in a previous session. */
  passed: boolean;
}

/**
 * Short HIPAA knowledge check. Threshold is WELCOME_HIPAA_QUIZ.passingScore
 * out of WELCOME_HIPAA_QUIZ.questions.length. Persists pass state via
 * onboarding storage under WELCOME_HIPAA_QUIZ.moduleKey so the rest of the
 * page can gate "Continue" actions on it.
 */
export function WelcomeHipaaQuiz({ passed }: Props) {
  const quiz = WELCOME_HIPAA_QUIZ;
  const total = quiz.questions.length;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = quiz.questions.every((q) => answers[q.id] !== undefined);
  const score = useMemo(
    () => quiz.questions.reduce((n, q) => (answers[q.id] === q.correctIndex ? n + 1 : n), 0),
    [answers, quiz.questions],
  );
  const pass = submitted && score >= quiz.passingScore;

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
    if (score >= quiz.passingScore) {
      markModuleComplete(quiz.moduleKey);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setSubmitted(false);
    unmarkModule(quiz.moduleKey);
  };

  return (
    <div
      data-testid="welcome-hipaa-quiz"
      data-passed={passed || pass ? "true" : "false"}
      className="mt-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13.5px] font-semibold text-foreground">HIPAA knowledge check</p>
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] uppercase tracking-wider">
              Required
            </Badge>
            {(passed || pass) && (
              <Badge className="h-5 gap-1 bg-primary/15 px-1.5 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/15">
                <CheckCircle2 className="h-3 w-3" /> Passed
              </Badge>
            )}
          </div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            Answer all {total} questions. You need at least {quiz.passingScore} correct to pass and
            continue to your launch path. You can retake the check as many times as you need.
          </p>
        </div>
      </div>

      <ol className="mt-5 space-y-4">
        {quiz.questions.map((q, qi) => {
          const chosen = answers[q.id];
          return (
            <li
              key={q.id}
              data-testid={`hipaa-quiz-question-${q.id}`}
              className="rounded-xl border border-border/50 bg-muted/20 p-4"
            >
              <p className="text-[13px] font-semibold text-foreground">
                {qi + 1}. {q.prompt}
              </p>
              <div className="mt-3 grid gap-2">
                {q.options.map((opt, oi) => {
                  const isChosen = chosen === oi;
                  const isCorrect = oi === q.correctIndex;
                  const showState = submitted && isChosen;
                  return (
                    <label
                      key={oi}
                      className={cn(
                        "flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/50 bg-card px-3 py-2 text-[12.5px] leading-relaxed transition",
                        !submitted && "hover:border-primary/40 hover:bg-primary/[0.04]",
                        isChosen && !submitted && "border-primary/50 bg-primary/[0.05]",
                        showState && isCorrect && "border-emerald-500/50 bg-emerald-500/10",
                        showState && !isCorrect && "border-rose-500/50 bg-rose-500/10",
                      )}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={oi}
                        checked={isChosen}
                        disabled={submitted}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                        className="mt-0.5 h-3.5 w-3.5 accent-primary"
                      />
                      <span className="flex-1 text-foreground">{opt}</span>
                      {submitted && isCorrect && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Correct" />
                      )}
                      {submitted && isChosen && !isCorrect && (
                        <XCircle className="h-4 w-4 text-rose-600" aria-label="Incorrect" />
                      )}
                    </label>
                  );
                })}
              </div>
              {submitted && (
                <p className="mt-2 rounded-md bg-background/60 px-3 py-2 text-[12px] leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Why:</span> {q.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        <div className="text-[12.5px] text-muted-foreground">
          {submitted ? (
            <>
              You scored <span className="font-semibold text-foreground">{score} / {total}</span>.
              {pass ? (
                <span className="ml-1 text-emerald-600">Passed - you can continue to your launch path.</span>
              ) : (
                <span className="ml-1 text-rose-600">
                  Below the {quiz.passingScore}/{total} passing threshold. Review the HIPAA section above and retake.
                </span>
              )}
            </>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3" /> Passing this check is required to continue.
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!submitted && (
            <Button
              size="sm"
              className="rounded-full"
              disabled={!allAnswered}
              onClick={handleSubmit}
              data-testid="hipaa-quiz-submit"
            >
              Submit answers
            </Button>
          )}
          {submitted && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full gap-1.5"
              onClick={handleRetake}
              data-testid="hipaa-quiz-retake"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Retake the check
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}