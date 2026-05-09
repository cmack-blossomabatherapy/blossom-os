import { ONBOARDING_STEPS, type OnboardingStepId } from "./steps";
import { requiredModuleKeys, type OnboardingPath } from "./journey";
import { REQUIRED_POLICY_KEYS } from "./gates";

const STORAGE_KEY = "blossom.onboarding.v1";
const PREVIEW_KEY = "blossom.onboarding.previewLocked";

export interface OnboardingState {
  completed: OnboardingStepId[];
  modules: string[];
  notes: Record<string, string>;
  checkins: { chad: string[]; shira: string[] };
  path: OnboardingPath;
  acknowledgements: string[];
  quizPassed?: boolean;
  completedAt?: string;
  certificateId?: string;
}

function read(): OnboardingState {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as OnboardingState;
    return {
      completed: parsed.completed || [],
      modules: parsed.modules || [],
      notes: parsed.notes || {},
      checkins: { chad: parsed.checkins?.chad || [], shira: parsed.checkins?.shira || [] },
      path: parsed.path === "new_state" ? "new_state" : "existing_state",
      acknowledgements: parsed.acknowledgements || [],
      quizPassed: parsed.quizPassed === true,
      completedAt: parsed.completedAt,
      certificateId: parsed.certificateId,
    };
  } catch {
    return defaults();
  }
}

function defaults(): OnboardingState {
  return { completed: [], modules: [], notes: {}, checkins: { chad: [], shira: [] }, path: "existing_state", acknowledgements: [], quizPassed: false };
}

function write(state: OnboardingState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("blossom:onboarding-change"));
}

export function getOnboardingState(): OnboardingState {
  return read();
}

function maybeMarkAllComplete(s: OnboardingState) {
  const required = requiredModuleKeys(s.path);
  const allDone = required.length > 0 && required.every((k) => s.modules.includes(k));
  const policiesOk = REQUIRED_POLICY_KEYS.every((k) => s.acknowledgements.includes(k));
  const quizOk = s.quizPassed === true;
  if (allDone && policiesOk && quizOk && !s.completedAt) {
    s.completedAt = new Date().toISOString();
    s.certificateId = `BL-${Date.now().toString(36).toUpperCase()}`;
  }
}

/** Returns true if the step was marked complete; false if a gate blocked it. */
export function markStepComplete(id: OnboardingStepId): boolean {
  const s = read();
  // Hard gates: policies require all acknowledgements; final-check requires quiz pass.
  if (id === "policies") {
    const ok = REQUIRED_POLICY_KEYS.every((k) => s.acknowledgements.includes(k));
    if (!ok) return false;
  }
  if (id === "final-check" && s.quizPassed !== true) {
    return false;
  }
  if (!s.completed.includes(id)) s.completed = [...s.completed, id];
  // If all required steps (everything except `complete`) are done, mark complete & generate cert id.
  const required = ONBOARDING_STEPS.filter((x) => x.id !== "complete").map((x) => x.id);
  const allDone = required.every((r) => s.completed.includes(r));
  const policiesOk = REQUIRED_POLICY_KEYS.every((k) => s.acknowledgements.includes(k));
  const quizOk = s.quizPassed === true;
  if (allDone && policiesOk && quizOk && !s.completedAt) {
    s.completedAt = new Date().toISOString();
    s.certificateId = `BL-${Date.now().toString(36).toUpperCase()}`;
    if (!s.completed.includes("complete")) s.completed = [...s.completed, "complete"];
  }
  write(s);
  return true;
}

export function unmarkStep(id: OnboardingStepId) {
  const s = read();
  s.completed = s.completed.filter((x) => x !== id);
  s.completedAt = undefined;
  s.certificateId = undefined;
  write(s);
}

export function markModuleComplete(key: string) {
  const s = read();
  if (!s.modules.includes(key)) s.modules = [...s.modules, key];
  maybeMarkAllComplete(s);
  write(s);
}

export function unmarkModule(key: string) {
  const s = read();
  s.modules = s.modules.filter((k) => k !== key);
  s.completedAt = undefined;
  s.certificateId = undefined;
  write(s);
}

export function setOnboardingPath(p: OnboardingPath) {
  const s = read();
  s.path = p;
  // Recompute completion in case path change unlocks more required items
  s.completedAt = undefined;
  s.certificateId = undefined;
  maybeMarkAllComplete(s);
  write(s);
}

export function setNote(key: string, text: string) {
  const s = read();
  s.notes = { ...s.notes, [key]: text };
  write(s);
}

export function toggleCheckIn(who: "chad" | "shira", date: string) {
  const s = read();
  const arr = s.checkins[who];
  s.checkins = {
    ...s.checkins,
    [who]: arr.includes(date) ? arr.filter((d) => d !== date) : [...arr, date],
  };
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

export function unacknowledge(key: string) {
  const s = read();
  if (s.acknowledgements.includes(key)) {
    s.acknowledgements = s.acknowledgements.filter((k) => k !== key);
    // Unchecking an item may invalidate completion gating
    s.completedAt = undefined;
    s.certificateId = undefined;
    write(s);
  }
}

export function toggleAcknowledge(key: string) {
  if (hasAcknowledged(key)) unacknowledge(key);
  else acknowledge(key);
}

/** Wipe local onboarding state entirely (used when admin resets a user). */
export function clearLocalOnboarding() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("blossom:onboarding-change"));
}

export function markQuizPassed() {
  const s = read();
  if (!s.quizPassed) {
    s.quizPassed = true;
    write(s);
  }
}

export function resetQuiz() {
  const s = read();
  if (s.quizPassed) {
    s.quizPassed = false;
    // Revoke final-check completion + certificate if user invalidates the quiz.
    s.completed = s.completed.filter((id) => id !== "final-check" && id !== "complete");
    s.completedAt = undefined;
    s.certificateId = undefined;
    write(s);
  }
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