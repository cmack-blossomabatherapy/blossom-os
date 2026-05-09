import { ONBOARDING_STEPS, type OnboardingStepId } from "./steps";

const STORAGE_KEY = "blossom.onboarding.v1";
const PREVIEW_KEY = "blossom.onboarding.previewLocked";

export interface OnboardingState {
  completed: OnboardingStepId[];
  acknowledgements: string[];
  completedAt?: string;
  certificateId?: string;
}

function read(): OnboardingState {
  if (typeof window === "undefined") return { completed: [], acknowledgements: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: [], acknowledgements: [] };
    const parsed = JSON.parse(raw) as OnboardingState;
    return { completed: parsed.completed || [], acknowledgements: parsed.acknowledgements || [], completedAt: parsed.completedAt, certificateId: parsed.certificateId };
  } catch {
    return { completed: [], acknowledgements: [] };
  }
}

function write(state: OnboardingState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("blossom:onboarding-change"));
}

export function getOnboardingState(): OnboardingState {
  return read();
}

export function markStepComplete(id: OnboardingStepId) {
  const s = read();
  if (!s.completed.includes(id)) s.completed = [...s.completed, id];
  // If all required steps (everything except `complete`) are done, mark complete & generate cert id.
  const required = ONBOARDING_STEPS.filter((x) => x.id !== "complete").map((x) => x.id);
  const allDone = required.every((r) => s.completed.includes(r));
  if (allDone && !s.completedAt) {
    s.completedAt = new Date().toISOString();
    s.certificateId = `BL-${Date.now().toString(36).toUpperCase()}`;
    if (!s.completed.includes("complete")) s.completed = [...s.completed, "complete"];
  }
  write(s);
}

export function unmarkStep(id: OnboardingStepId) {
  const s = read();
  s.completed = s.completed.filter((x) => x !== id);
  s.completedAt = undefined;
  s.certificateId = undefined;
  write(s);
}

export function acknowledge(key: string) {
  const s = read();
  if (!s.acknowledgements.includes(key)) {
    s.acknowledgements = [...s.acknowledgements, key];
    write(s);
  }
}

export function hasAcknowledged(key: string): boolean {
  return read().acknowledgements.includes(key);
}

export function resetOnboarding() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("blossom:onboarding-change"));
}

export function setPreviewLocked(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) window.localStorage.setItem(PREVIEW_KEY, "1");
  else window.localStorage.removeItem(PREVIEW_KEY);
  window.dispatchEvent(new CustomEvent("blossom:onboarding-change"));
}

export function isPreviewLocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PREVIEW_KEY) === "1";
}