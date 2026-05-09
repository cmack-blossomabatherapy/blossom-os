import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markStepComplete } from "@/lib/onboarding/storage";
import { ONBOARDING_STEPS, type OnboardingStepId } from "@/lib/onboarding/steps";

interface Props {
  stepId: OnboardingStepId;
  label?: string;
  /** When true, requires `requiredAcks` to all be acknowledged before enabling. */
  requiredAcks?: string[];
  acknowledged?: string[];
}

export function StepCompleteButton({ stepId, label = "Mark complete & continue", requiredAcks, acknowledged }: Props) {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const blocked = requiredAcks && requiredAcks.some((k) => !(acknowledged || []).includes(k));
  const handle = () => {
    markStepComplete(stepId);
    setDone(true);
    const idx = ONBOARDING_STEPS.findIndex((s) => s.id === stepId);
    const next = ONBOARDING_STEPS[idx + 1];
    setTimeout(() => navigate(next ? next.path : "/onboarding/complete"), 350);
  };
  return (
    <Button onClick={handle} disabled={blocked || done} size="lg" className="gap-2 rounded-2xl shadow-lg shadow-primary/20">
      {done ? <><Check className="h-4 w-4" /> Saved</> : <>{label} <ArrowRight className="h-4 w-4" /></>}
    </Button>
  );
}