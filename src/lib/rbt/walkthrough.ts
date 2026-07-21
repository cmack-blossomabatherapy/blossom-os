/**
 * RBT First-Login Walkthrough — Slice 4A
 *
 * A versioned, per-user product tour that warmly introduces every corner
 * of the RBT app: Home, My Program, Learn, Schedule, Skill Passport,
 * Support, Me, and the BCBA Fellowship path.
 *
 * Persistence rules
 * -----------------
 * - Completion is persisted in `localStorage` under
 *   `rbt.walkthrough.v1:<userId>` as { version, completedAt }.
 * - Persistence is keyed on the CURRENT `TOUR_VERSION`. Bumping the
 *   version re-opens the walkthrough for everyone at next login.
 * - Completion is NEVER written when the RBT Experience Lab is active
 *   or when a super-admin is previewing another employee. Preview
 *   sessions must not permanently dismiss the tour for a real user.
 * - Read + write are namespaced per real auth user id. Users cannot
 *   dismiss the tour for one another.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------- version + storage

export const TOUR_VERSION = 1;
const STORAGE_PREFIX = "rbt.walkthrough.v1";

export interface StoredCompletion {
  version: number;
  completedAt: string;
}

export function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function readCompletion(userId: string | null | undefined): StoredCompletion | null {
  if (!userId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.version !== "number") return null;
    if (typeof parsed.completedAt !== "string") return null;
    return { version: parsed.version, completedAt: parsed.completedAt };
  } catch {
    return null;
  }
}

export function writeCompletion(userId: string, version: number, at: Date = new Date()): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKey(userId),
      JSON.stringify({ version, completedAt: at.toISOString() } satisfies StoredCompletion),
    );
  } catch {
    /* ignore */
  }
}

export function clearCompletion(userId: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(storageKey(userId)); } catch { /* ignore */ }
}

/**
 * Should the tour auto-open on this login? True iff:
 *  - we have a real user id (never for anonymous)
 *  - no stored completion, OR stored completion is for an older version
 */
export function shouldAutoOpen(
  userId: string | null | undefined,
  version: number = TOUR_VERSION,
): boolean {
  if (!userId) return false;
  const stored = readCompletion(userId);
  if (!stored) return true;
  return stored.version < version;
}

// ---------------------------------------------------------------- steps

export type TourRoute =
  | "/rbt/app/home"
  | "/rbt/app/program"
  | "/rbt/app/learn"
  | "/rbt/app/schedule"
  | "/rbt/app/passport"
  | "/rbt/app/support"
  | "/rbt/app/me"
  | "/rbt/app/growth/fellowship";

export interface TourStep {
  key: string;
  title: string;
  body: string;
  route: TourRoute;
}

/**
 * Ordered tour deck. Ordering: everyday first, growth last.
 */
export const TOUR_STEPS: readonly TourStep[] = [
  {
    key: "welcome",
    title: "Welcome to Blossom",
    body: "We're glad you're here. This quick tour shows where everything lives, so you can focus on what matters — great sessions and steady growth.",
    route: "/rbt/app/home",
  },
  {
    key: "home",
    title: "Home — your day at a glance",
    body: "Home shows today's schedule, your next best action, and gentle reminders. Start here every morning.",
    route: "/rbt/app/home",
  },
  {
    key: "program",
    title: "My Program — your training path",
    body: "Your certification or development pathway lives here. Every step is actionable and paced to you.",
    route: "/rbt/app/program",
  },
  {
    key: "learn",
    title: "Learn — courses and progress",
    body: "Access your assigned courses, resume where you left off, and see everything you've completed.",
    route: "/rbt/app/learn",
  },
  {
    key: "schedule",
    title: "Schedule — sessions and coverage",
    body: "See upcoming sessions, cancellations, and coverage requests. Tap a session for client and location details.",
    route: "/rbt/app/schedule",
  },
  {
    key: "passport",
    title: "Skill Passport — competencies",
    body: "Track evaluated skills, feedback, and evidence over time. Share it with your supervisor whenever you like.",
    route: "/rbt/app/passport",
  },
  {
    key: "support",
    title: "Support — we've got you",
    body: "Ask for help, flag a concern, or escalate anything sensitive. A teammate follows up quickly.",
    route: "/rbt/app/support",
  },
  {
    key: "me",
    title: "Me — your profile & journey",
    body: "See your current stage, history, credentials, and preferences — plus quick links to everything about you.",
    route: "/rbt/app/me",
  },
  {
    key: "fellowship",
    title: "Grow — BCBA Fellowship",
    body: "Curious about becoming a BCBA? The Fellowship path shows coursework, mentorship, and supervised hours all in one place.",
    route: "/rbt/app/growth/fellowship",
  },
] as const;

// ---------------------------------------------------------------- reduced motion

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  catch { return false; }
}

/** React hook variant that stays in sync with media-query changes. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => prefersReducedMotion());
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    let mq: MediaQueryList;
    try { mq = window.matchMedia("(prefers-reduced-motion: reduce)"); } catch { return; }
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    // Some older jsdom builds only expose addListener/removeListener.
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", handler);
    else if (typeof (mq as any).addListener === "function") (mq as any).addListener(handler);
    return () => {
      if (typeof mq.removeEventListener === "function") mq.removeEventListener("change", handler);
      else if (typeof (mq as any).removeListener === "function") (mq as any).removeListener(handler);
    };
  }, []);
  return reduced;
}

// ---------------------------------------------------------------- controller

export interface UseRbtWalkthroughOptions {
  userId: string | null | undefined;
  /** Any of: Experience Lab active, OSRole preview active, no real user, etc. */
  previewActive: boolean;
  version?: number;
}

export interface UseRbtWalkthrough {
  open: boolean;
  index: number;
  step: TourStep;
  steps: readonly TourStep[];
  canPersist: boolean;
  isReplay: boolean;
  isFirst: boolean;
  isLast: boolean;
  start: (opts?: { replay?: boolean }) => void;
  next: () => void;
  prev: () => void;
  goTo: (i: number) => void;
  finish: () => void;
  dismiss: () => void;
}

export function useRbtWalkthroughController(opts: UseRbtWalkthroughOptions): UseRbtWalkthrough {
  const { userId, previewActive } = opts;
  const version = opts.version ?? TOUR_VERSION;
  const canPersist = Boolean(userId) && !previewActive;

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [isReplay, setIsReplay] = useState(false);

  // Auto-open on first login for eligible users only. Never for previews.
  useEffect(() => {
    if (!canPersist) return;
    if (!shouldAutoOpen(userId, version)) return;
    setIsReplay(false);
    setIndex(0);
    setOpen(true);
  }, [userId, previewActive, version, canPersist]);

  const start = useCallback((startOpts?: { replay?: boolean }) => {
    setIsReplay(Boolean(startOpts?.replay));
    setIndex(0);
    setOpen(true);
  }, []);

  const goTo = useCallback((i: number) => {
    setIndex((prev) => {
      if (i < 0) return 0;
      if (i > TOUR_STEPS.length - 1) return TOUR_STEPS.length - 1;
      return i;
    });
  }, []);

  const next = useCallback(() => {
    setIndex((i) => Math.min(TOUR_STEPS.length - 1, i + 1));
  }, []);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const finish = useCallback(() => {
    if (canPersist && userId) writeCompletion(userId, version);
    setOpen(false);
  }, [userId, version, canPersist]);

  const dismiss = useCallback(() => {
    // Dismiss = same durability guarantee as finish. Users who dismiss
    // early should NOT see the tour re-auto-open. Replay is always
    // available from Home / Learn / Me.
    if (canPersist && userId) writeCompletion(userId, version);
    setOpen(false);
  }, [userId, version, canPersist]);

  const step = TOUR_STEPS[Math.min(Math.max(index, 0), TOUR_STEPS.length - 1)];
  const isFirst = index === 0;
  const isLast = index === TOUR_STEPS.length - 1;

  return useMemo<UseRbtWalkthrough>(() => ({
    open,
    index,
    step,
    steps: TOUR_STEPS,
    canPersist,
    isReplay,
    isFirst,
    isLast,
    start,
    next,
    prev,
    goTo,
    finish,
    dismiss,
  }), [open, index, step, canPersist, isReplay, isFirst, isLast, start, next, prev, goTo, finish, dismiss]);
}
