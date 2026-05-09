import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/lib/onboarding/steps";
import { getOnboardingState, isPreviewLocked, type OnboardingState } from "@/lib/onboarding/storage";

const BYPASS_ROLES = ["admin", "training_admin", "hr", "hr_admin", "hr_manager", "exec", "ops_manager"];

export type OnboardingStatus = "not_started" | "in_progress" | "completed";

export function useOnboardingStatus() {
  const { roles, isAdmin, loading } = useAuth();
  const [state, setState] = useState<OnboardingState>(() => getOnboardingState());
  const [preview, setPreview] = useState<boolean>(() => isPreviewLocked());

  useEffect(() => {
    const refresh = () => {
      setState(getOnboardingState());
      setPreview(isPreviewLocked());
    };
    window.addEventListener("blossom:onboarding-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("blossom:onboarding-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const bypassReal = isAdmin || roles.some((r) => BYPASS_ROLES.includes(r));
  const bypass = bypassReal && !preview;

  return useMemo(() => {
    const required = ONBOARDING_STEPS.filter((s) => s.id !== "complete");
    const completedCount = required.filter((s) => state.completed.includes(s.id)).length;
    const percent = Math.round((completedCount / required.length) * 100);
    const nextStep: OnboardingStep | undefined =
      ONBOARDING_STEPS.find((s) => !state.completed.includes(s.id));
    const status: OnboardingStatus =
      state.completedAt ? "completed" : completedCount === 0 ? "not_started" : "in_progress";

    return {
      loading,
      bypass,
      bypassReal,
      previewLocked: preview,
      status,
      isComplete: status === "completed" || bypass,
      percent,
      completedCount,
      totalRequired: required.length,
      completedSteps: state.completed,
      acknowledgements: state.acknowledgements,
      completedAt: state.completedAt,
      certificateId: state.certificateId,
      nextStep,
      steps: ONBOARDING_STEPS,
    };
  }, [state, loading, bypass, bypassReal, preview]);
}

export function useOnboardingActions() {
  // Re-export for convenience
  return useCallback(() => import("@/lib/onboarding/storage"), []);
}