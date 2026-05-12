/**
 * Onboarding unlock logic for the centralized employee directory.
 * Drives which Blossom Academy surfaces a user can access based on their
 * `directory_onboarding_status` and `unlock_level` (admin override).
 *
 * Status progression: not_started → welcome → mission → orientation → training → complete
 */
export type OnboardingStage =
  | "not_started" | "welcome" | "mission" | "orientation" | "training" | "complete";

export const STAGE_ORDER: OnboardingStage[] = [
  "not_started", "welcome", "mission", "orientation", "training", "complete",
];

/** Routes (or feature keys) and the minimum stage required to unlock them. */
export const UNLOCK_MAP: Record<string, OnboardingStage> = {
  "team-directory":      "welcome",
  "org-chart":           "mission",
  "department-training": "orientation",
  "hr-tools":            "complete",
};

export function stageIndex(s: OnboardingStage | null | undefined): number {
  if (!s) return 0;
  return Math.max(0, STAGE_ORDER.indexOf(s));
}

/** Whether a feature is unlocked for a given current stage + admin override level. */
export function isUnlocked(
  feature: keyof typeof UNLOCK_MAP,
  stage: OnboardingStage | null | undefined,
  unlockLevel = 0,
): boolean {
  const required = UNLOCK_MAP[feature];
  if (!required) return true;
  const requiredIdx = STAGE_ORDER.indexOf(required);
  return stageIndex(stage) >= requiredIdx || unlockLevel >= requiredIdx;
}
