import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";
import { useExperienceLab } from "./useExperienceLab";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import {
  useRbtWalkthroughController, useReducedMotion, TOUR_STEPS, TOUR_VERSION,
} from "@/lib/rbt/walkthrough";
import { RbtWalkthroughContext } from "./useRbtWalkthrough";

/**
 * Provider that mounts the walkthrough Dialog exactly once per RBT
 * session (inside RbtAppShell). Exposes an imperative `openTour` for
 * the replay buttons on Home / Learn / Me.
 */
export function RbtWalkthroughProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const osRole = useOSRoleSafe();
  const lab = useExperienceLab();
  const previewActive = Boolean(lab.active || osRole?.isPreviewing);

  const controller = useRbtWalkthroughController({
    userId: user?.id ?? null,
    previewActive,
  });

  const value = useMemo(() => ({
    available: true,
    controller,
    openTour: () => controller.start({ replay: true }),
  }), [controller]);

  return (
    <RbtWalkthroughContext.Provider value={value}>
      {children}
      <RbtWalkthroughDialog />
    </RbtWalkthroughContext.Provider>
  );
}

/**
 * The tour dialog. Radix Dialog handles focus trap, Escape-to-close,
 * body scroll lock, and returning focus to the trigger. We layer arrow-
 * key navigation and reduced-motion handling on top.
 */
export function RbtWalkthroughDialog() {
  const { controller } = useContext(RbtWalkthroughContext);
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);

  const open = controller?.open ?? false;
  const step = controller?.step ?? null;
  const index = controller?.index ?? 0;
  const steps = controller?.steps ?? [];
  const isFirst = controller?.isFirst ?? true;
  const isLast = controller?.isLast ?? false;

  // Move focus to the primary "Next"/"Finish" button when the step changes
  // so keyboard users can continue with a single Enter press.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => { nextBtnRef.current?.focus(); }, reduced ? 0 : 40);
    return () => window.clearTimeout(id);
  }, [open, index, reduced]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!controller) return;
    if (e.key === "ArrowRight") { e.preventDefault(); controller.next(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); controller.prev(); }
  }, [controller]);

  const handleFinish = useCallback(() => {
    controller?.finish();
    if (step) navigate(step.route);
  }, [controller, navigate, step]);

  const handleGo = useCallback(() => { if (step) navigate(step.route); }, [navigate, step]);

  if (!controller || !step) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) controller.dismiss(); }}>
      <DialogContent
        onKeyDown={onKeyDown}
        aria-describedby="rbt-walkthrough-desc"
        data-testid="rbt-walkthrough"
        data-tour-version={TOUR_VERSION}
        data-reduced-motion={reduced ? "true" : "false"}
        className={
          "sm:max-w-[520px] rounded-2xl border-border/70 " +
          (reduced ? "!duration-0 !transition-none !animate-none" : "")
        }
      >
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary text-[11px] font-semibold uppercase tracking-[0.18em]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            <span>Blossom quick tour · Step {index + 1} of {steps.length}</span>
          </div>
          <DialogTitle className="mt-1 text-xl tracking-tight">{step.title}</DialogTitle>
          <DialogDescription id="rbt-walkthrough-desc" className="text-[15px] leading-relaxed">
            {step.body}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div
          className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-label={`Tour progress: step ${index + 1} of ${steps.length}`}
        >
          <div
            className={"h-full bg-primary " + (reduced ? "" : "transition-all")}
            style={{ width: `${((index + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step dots (also serve as keyboard-navigable jump targets) */}
        <ol
          className="mt-3 flex flex-wrap gap-1.5"
          aria-label="Tour steps"
        >
          {steps.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => controller.goTo(i)}
                aria-current={i === index ? "step" : undefined}
                aria-label={`Go to step ${i + 1}: ${s.title}`}
                className={
                  "h-2 w-6 rounded-full transition-colors " +
                  (i === index
                    ? "bg-primary"
                    : i < index
                    ? "bg-primary/40"
                    : "bg-muted-foreground/25 hover:bg-muted-foreground/50")
                }
              />
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={controller.dismiss}
              className="rounded-xl px-3 h-9 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              Skip tour
            </button>
            <button
              type="button"
              onClick={handleGo}
              className="rounded-xl px-3 h-9 text-sm border border-border/70 hover:bg-muted transition"
            >
              Take me there
            </button>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={controller.prev}
              disabled={isFirst}
              aria-label="Previous step"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 h-9 text-sm border border-border/70 hover:bg-muted transition disabled:opacity-40 disabled:pointer-events-none"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back
            </button>
            {isLast ? (
              <button
                type="button"
                ref={nextBtnRef}
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 h-9 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                Finish & go
              </button>
            ) : (
              <button
                type="button"
                ref={nextBtnRef}
                onClick={controller.next}
                aria-label="Next step"
                className="inline-flex items-center gap-1.5 rounded-xl px-4 h-9 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                Next <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
