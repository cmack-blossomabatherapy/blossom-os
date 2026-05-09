import { getOnboardingState, type OnboardingState } from "./storage";

/** Canonical keys for the policy acknowledgements required to pass onboarding. */
export const REQUIRED_POLICY_KEYS = [
  "policy-hipaa",
  "policy-conduct",
  "policy-handbook",
  "policy-safety",
] as const;

export type RequiredPolicyKey = (typeof REQUIRED_POLICY_KEYS)[number];

export function policiesAcknowledged(state?: OnboardingState): boolean {
  const s = state ?? getOnboardingState();
  return REQUIRED_POLICY_KEYS.every((k) => s.acknowledgements.includes(k));
}

export function quizPassed(state?: OnboardingState): boolean {
  const s = state ?? getOnboardingState();
  return s.quizPassed === true;
}

export function missingPolicyAcks(state?: OnboardingState): RequiredPolicyKey[] {
  const s = state ?? getOnboardingState();
  return REQUIRED_POLICY_KEYS.filter((k) => !s.acknowledgements.includes(k));
}
