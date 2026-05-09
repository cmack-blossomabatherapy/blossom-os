import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

interface Props {
  variant?: "topbar" | "sidebar" | "mobile";
  className?: string;
  onNavigate?: () => void;
}

/**
 * Always-visible CTA that routes the user to their next unfinished onboarding step.
 * Hidden when onboarding is complete (and the user is not previewing the locked state).
 */
export function ResumeOnboardingButton({ variant = "topbar", className, onNavigate }: Props) {
  const navigate = useNavigate();
  const status = useOnboardingStatus();

  if (status.loading) return null;
  // Hide once onboarding is done and the user is not previewing the locked experience.
  if (status.isComplete && !status.previewLocked) return null;

  // Resolve the next route: prefer the journey (modules) path, fall back to legacy steps.
  const nextPath =
    status.nextPhase?.path ||
    status.nextStep?.path ||
    "/onboarding";

  const label = status.status === "not_started" ? "Start onboarding" : "Resume onboarding";
  const subLabel = status.nextPhase?.title || status.nextStep?.title;
  const percent = status.percent ?? 0;

  const go = () => {
    onNavigate?.();
    navigate(nextPath);
  };

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={go}
        className={cn(
          "group relative w-full overflow-hidden rounded-xl border border-sidebar-border/60 bg-sidebar-accent/30 px-3 py-2.5 text-left transition-all hover:border-primary/50 hover:bg-sidebar-accent/60",
          className,
        )}
        aria-label={`${label}${subLabel ? `: ${subLabel}` : ""}`}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-sidebar-foreground">{label}</p>
            {subLabel && (
              <p className="truncate text-[11px] text-sidebar-muted">{subLabel}</p>
            )}
          </div>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-sidebar-muted transition-transform group-hover:translate-x-0.5" />
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-sidebar-border/40">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.max(4, percent)}%` }}
          />
        </div>
      </button>
    );
  }

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={go}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-left transition-colors hover:bg-primary/10",
          className,
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{label}</p>
          {subLabel && <p className="truncate text-[11px] text-muted-foreground">{subLabel} · {percent}%</p>}
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    );
  }

  // topbar
  return (
    <Button
      onClick={go}
      size="sm"
      variant="default"
      className={cn(
        "hidden h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold shadow-sm sm:inline-flex",
        className,
      )}
      title={subLabel ? `${label}: ${subLabel}` : label}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span className="hidden md:inline">{label}</span>
      <span className="md:hidden">Resume</span>
      <span className="ml-1 rounded-full bg-primary-foreground/15 px-1.5 py-px text-[10px] font-medium tabular-nums">
        {percent}%
      </span>
    </Button>
  );
}
