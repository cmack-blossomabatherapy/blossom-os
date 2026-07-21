import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Sparkles, LifeBuoy, Award, GraduationCap, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Interactive "Program setup" experience shown when an RBT does not yet have
 * an active pathway assignment. Replaces the previous dead-end empty state.
 * Users always have something they can do:
 *   • Start Welcome to Blossom (no pathway required)
 *   • Open Skill Passport
 *   • Retry loading (in case recruiting just linked them)
 *   • Contact support (deep-links into training-category support form)
 *
 * The three checkpoint chips reflect what recruiting owns: identity link,
 * certification status, years-of-experience — the exact inputs that decide
 * which of the three pathways is assigned. Copy stays RBT-appropriate; no
 * technical/source-health language.
 */
export interface ProgramSetupJourneyProps {
  employeeLinked: boolean;
  onRetry: () => void;
  retrying?: boolean;
}

export function ProgramSetupJourney({ employeeLinked, onRetry, retrying }: ProgramSetupJourneyProps) {
  const steps = [
    {
      key: "profile",
      title: "Your profile is linked",
      description: "Connects you to your training path.",
      done: employeeLinked,
    },
    {
      key: "path",
      title: "Your path is being assigned",
      description: "Based on your RBT certification and experience.",
      done: false,
      active: employeeLinked,
    },
    {
      key: "start",
      title: "You can start Welcome to Blossom now",
      description: "The first module is available while your path finishes setting up.",
      done: false,
      active: true,
    },
  ] as const;

  return (
    <div className="space-y-5" data-testid="rbt-program-setup">
      <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-primary/15 p-2.5 text-primary">
            <Sparkles className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-primary">Program setup</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">Your training path is almost ready</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We're finishing your personalized RBT pathway. While that wraps up, you can start Welcome to Blossom
              and explore your Skill Passport.
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Setup checkpoints" className="rounded-3xl border border-border/70 bg-card p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">What's happening</p>
        <ol className="space-y-3">
          {steps.map((s) => {
            const Icon = s.done ? CheckCircle2 : Circle;
            return (
              <li key={s.key} className="flex items-start gap-3">
                <Icon
                  className={`h-5 w-5 shrink-0 mt-0.5 ${
                    s.done ? "text-emerald-600" : (s as any).active ? "text-primary" : "text-muted-foreground"
                  }`}
                  strokeWidth={1.75}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${retrying ? "animate-spin" : ""}`} />
            {retrying ? "Checking…" : "Check again"}
          </Button>
          <span className="text-xs text-muted-foreground">This usually finishes within a day.</span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Things you can do now">
        <Link
          to="/rbt/app/welcome"
          className="group rounded-2xl border border-border/70 bg-card p-4 hover:bg-muted/50 transition flex items-center gap-3"
        >
          <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Welcome to Blossom</p>
            <p className="text-xs text-muted-foreground">Get to know your company · ~20 min</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
        </Link>
        <Link
          to="/rbt/app/passport"
          className="group rounded-2xl border border-border/70 bg-card p-4 hover:bg-muted/50 transition flex items-center gap-3"
        >
          <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Award className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Skill Passport</p>
            <p className="text-xs text-muted-foreground">Track skills as you learn</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
        </Link>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-5 flex items-start gap-3">
        <span className="rounded-xl bg-muted p-2 text-muted-foreground">
          <LifeBuoy className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Need help getting started?</p>
          <p className="text-xs text-muted-foreground">
            Our team is happy to walk you through it. We usually respond the same day.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/rbt/app/support/new?category=training">Ask a question</Link>
        </Button>
      </section>
    </div>
  );
}

export default ProgramSetupJourney;