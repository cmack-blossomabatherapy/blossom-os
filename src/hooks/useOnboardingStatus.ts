import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/lib/onboarding/steps";
import { getOnboardingState, isPreviewLocked, type OnboardingState } from "@/lib/onboarding/storage";
import { ONBOARDING_PHASES, modulesForPath, requiredModuleKeys, type JourneyPhase } from "@/lib/onboarding/journey";

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

    // Journey progress (modules-based)
    const path = state.path;
    const allRequired = requiredModuleKeys(path);
    const moduleDoneCount = allRequired.filter((k) => state.modules.includes(k)).length;
    const journeyPercent = allRequired.length === 0 ? 0 : Math.round((moduleDoneCount / allRequired.length) * 100);

    const phaseProgress = ONBOARDING_PHASES.map((phase) => {
      const mods = modulesForPath(phase, path);
      const done = mods.filter((m) => state.modules.includes(m.key)).length;
      return {
        phase,
        total: mods.length,
        done,
        percent: mods.length === 0 ? 0 : Math.round((done / mods.length) * 100),
        complete: mods.length > 0 && done === mods.length,
      };
    });

    let nextPhase: JourneyPhase | undefined;
    let nextModuleKey: string | undefined;
    for (const pp of phaseProgress) {
      if (pp.phase.id === "graduation") continue;
      const mods = modulesForPath(pp.phase, path);
      const m = mods.find((mm) => !state.modules.includes(mm.key));
      if (m) { nextPhase = pp.phase; nextModuleKey = m.key; break; }
    }

    const journeyComplete = state.completedAt != null;
    const status: OnboardingStatus =
      journeyComplete ? "completed" : (moduleDoneCount === 0 && completedCount === 0) ? "not_started" : "in_progress";

    return {
      loading,
      bypass,
      bypassReal,
      previewLocked: preview,
      status,
      isComplete: status === "completed" || bypass,
      // legacy step-based
      percent: journeyPercent || percent,
      completedCount: moduleDoneCount || completedCount,
      totalRequired: allRequired.length || required.length,
      completedSteps: state.completed,
      // journey
      path,
      modulesComplete: state.modules,
      journeyPercent,
      moduleDoneCount,
      totalModules: allRequired.length,
      phaseProgress,
      nextPhase,
      nextModuleKey,
      notes: state.notes,
      checkins: state.checkins,
      acknowledgements: state.acknowledgements,
      completedAt: state.completedAt,
      certificateId: state.certificateId,
      nextStep,
      steps: ONBOARDING_STEPS,
      phases: ONBOARDING_PHASES,
    };
  }, [state, loading, bypass, bypassReal, preview]);
}

export function useOnboardingActions() {
  // Re-export for convenience
  return useCallback(() => import("@/lib/onboarding/storage"), []);
}