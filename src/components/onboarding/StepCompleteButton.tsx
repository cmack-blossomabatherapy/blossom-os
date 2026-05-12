import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { markStepComplete, getOnboardingState } from "@/lib/onboarding/storage";
import { ONBOARDING_STEPS, type OnboardingStepId } from "@/lib/onboarding/steps";
import { REQUIRED_POLICY_KEYS } from "@/lib/onboarding/gates";

interface Props {
  stepId: OnboardingStepId;
  label?: string;
  /** When provided, button is blocked until every key is present in `acknowledged`. */
  requiredAcks?: string[];
  acknowledged?: string[];
}

export function StepCompleteButton({ stepId, label = "Mark complete & continue", requiredAcks, acknowledged }: Props) {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [tick, setTick] = useState(0);

  // Re-render when storage changes so the gate-derived disabled state stays accurate.
  useEffect(() => {
    const refresh = () => setTick((t) => t + 1);
    window.addEventListener("blossom:onboarding-change", refresh);
    return () => window.removeEventListener("blossom:onboarding-change", refresh);
  }, []);

  // Reason gating (UI-level safety net mirroring storage gates).
  let blockReason: string | null = null;
  if (requiredAcks && requiredAcks.some((k) => !(acknowledged || []).includes(k))) {
    blockReason = "Acknowledge each item above to continue.";
  }
  if (!blockReason && stepId === "policies") {
    const state = getOnboardingState();
    const missing = REQUIRED_POLICY_KEYS.filter((k) => !state.acknowledgements.includes(k));
    if (missing.length > 0) blockReason = "Acknowledge all required policies to continue.";
  }
  if (!blockReason && stepId === "final-check") {
    const state = getOnboardingState();
    if (state.quizPassed !== true) blockReason = "Pass the Final Knowledge Check to continue.";
  }
  // touch tick so eslint sees usage
  void tick;

  const handle = () => {
    const ok = markStepComplete(stepId);
    if (!ok) return;
    setDone(true);
    // Always return to the Journey hub after completing a step so the
    // employee can see overall progress and pick the next step intentionally.
    setTimeout(() => navigate("/hr/journey"), 350);
  };

  const button = (
    <Button
      onClick={handle}
      disabled={!!blockReason || done}
      size="lg"
      className="gap-2 rounded-2xl shadow-lg shadow-primary/20"
    >
      {done ? (
        <><Check className="h-4 w-4" /> Saved</>
      ) : blockReason ? (
        <><Lock className="h-4 w-4" /> {label}</>
      ) : (
        <>{label} <ArrowRight className="h-4 w-4" /></>
      )}
    </Button>
  );

  if (!blockReason) return button;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{button}</span>
        </TooltipTrigger>
        <TooltipContent>{blockReason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
