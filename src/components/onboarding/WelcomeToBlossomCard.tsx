import { Link } from "react-router-dom";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";

/**
 * Universal "Welcome to Blossom" entry point — surfaced for every employee
 * regardless of role on top of training/journey pages so Phase 0 is always
 * one click away.
 */
export function WelcomeToBlossomCard({ to = "/training/welcome" }: { to?: string } = {}) {
  return (
    <Link
      to={to}
      className="group relative block overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6"
    >
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Phase 0 · For everyone</p>
            <p className="mt-0.5 text-lg font-semibold text-foreground">Welcome to Blossom</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Meet the team, hear our mission, and watch the welcome video — the same start no matter your role.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform group-hover:translate-x-0.5 sm:self-auto">
          <PlayCircle className="h-4 w-4" /> Start Welcome <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
