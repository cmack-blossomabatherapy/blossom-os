import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Props {
  /** Small chip label above the headline. Defaults to "Welcome to Blossom". */
  eyebrow?: string;
  /** Main headline, e.g. "Welcome to Blossom, Elvis". */
  title: string;
  /** Sub-copy under the headline. */
  description?: string;
  /** Optional progress bar (0-100). */
  progressPercent?: number;
  /** Optional progress label, e.g. "3 of 12 modules complete". */
  progressLabel?: string;
  /** Optional CTA button. Provide either ctaTo (router link) or ctaOnClick. */
  ctaLabel?: string;
  ctaTo?: string;
  ctaOnClick?: () => void;
  /** Optional secondary action node rendered next to the CTA. */
  rightSlot?: React.ReactNode;
}

/**
 * Shared gradient hero used across every onboarding / training surface so the
 * RBT Journey, Welcome page, and Training Catalog all feel like one system.
 */
export function JourneyHero({
  eyebrow = "Welcome to Blossom",
  title,
  description,
  progressPercent,
  progressLabel,
  ctaLabel,
  ctaTo,
  ctaOnClick,
  rightSlot,
}: Props) {
  const showProgress = typeof progressPercent === "number";
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] p-6 text-primary-foreground shadow-lg sm:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" />
      <div className="relative space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">{description}</p>
          )}
        </div>
        {(showProgress || ctaLabel || rightSlot) && (
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            {showProgress ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-primary-foreground/85">
                  <span>{progressLabel ? "Progress" : "Onboarding progress"}</span>
                  <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2 bg-primary-foreground/20" />
                {progressLabel && (
                  <p className="text-[11px] text-primary-foreground/80">{progressLabel}</p>
                )}
              </div>
            ) : <div />}
            <div className="flex flex-wrap gap-2">
              {ctaLabel && ctaTo && (
                <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  <Link to={ctaTo}>
                    {ctaLabel}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              )}
              {ctaLabel && !ctaTo && ctaOnClick && (
                <Button size="lg" onClick={ctaOnClick} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  {ctaLabel}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              )}
              {rightSlot}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
