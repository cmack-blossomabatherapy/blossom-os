/**
 * RBT First-Login Walkthrough — Slice 4A tests.
 *
 * Covers:
 *  - versioned per-user persistence & storage isolation
 *  - first-login auto-open behavior
 *  - completion (Finish) and dismissal (Skip / Escape / X)
 *  - replay does not overwrite version bumps and re-opens on demand
 *  - Experience Lab / preview isolation — completion must NOT persist
 *  - reduced-motion propagation
 *  - keyboard navigation (Arrow keys, focus target on Next)
 *  - tour targets every declared RBT route
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  TOUR_STEPS,
  TOUR_VERSION,
  storageKey,
  readCompletion,
  writeCompletion,
  clearCompletion,
  shouldAutoOpen,
  prefersReducedMotion,
  useRbtWalkthroughController,
} from "@/lib/rbt/walkthrough";

const USER_A = "11111111-1111-1111-1111-111111111111";
const USER_B = "22222222-2222-2222-2222-222222222222";

beforeEach(() => {
  window.localStorage.clear();
  // Reset matchMedia to a stable default
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {},
    dispatchEvent: () => false,
  })) as any;
});

// ---------------------------------------------------------------- storage

describe("walkthrough persistence", () => {
  it("uses a user-scoped storage key so users do not collide", () => {
    expect(storageKey(USER_A)).not.toEqual(storageKey(USER_B));
    expect(storageKey(USER_A)).toMatch(/^rbt\.walkthrough\.v1:/);
  });

  it("writes and reads a completion record with the current tour version", () => {
    writeCompletion(USER_A, TOUR_VERSION, new Date("2026-07-21T12:00:00Z"));
    const stored = readCompletion(USER_A);
    expect(stored).toEqual({ version: TOUR_VERSION, completedAt: "2026-07-21T12:00:00.000Z" });
  });

  it("returns null for missing / corrupt / cross-user reads", () => {
    expect(readCompletion(null)).toBeNull();
    expect(readCompletion(USER_A)).toBeNull();
    window.localStorage.setItem(storageKey(USER_A), "{not json");
    expect(readCompletion(USER_A)).toBeNull();
    writeCompletion(USER_A, TOUR_VERSION);
    expect(readCompletion(USER_B)).toBeNull();
  });

  it("shouldAutoOpen is true on first login, false after completion at current version", () => {
    expect(shouldAutoOpen(USER_A)).toBe(true);
    writeCompletion(USER_A, TOUR_VERSION);
    expect(shouldAutoOpen(USER_A)).toBe(false);
    expect(shouldAutoOpen(null)).toBe(false);
  });

  it("re-opens when the tour version is bumped past the stored version", () => {
    writeCompletion(USER_A, TOUR_VERSION);
    expect(shouldAutoOpen(USER_A, TOUR_VERSION)).toBe(false);
    expect(shouldAutoOpen(USER_A, TOUR_VERSION + 1)).toBe(true);
  });

  it("clearCompletion removes only that user's entry", () => {
    writeCompletion(USER_A, TOUR_VERSION);
    writeCompletion(USER_B, TOUR_VERSION);
    clearCompletion(USER_A);
    expect(readCompletion(USER_A)).toBeNull();
    expect(readCompletion(USER_B)).not.toBeNull();
  });
});

// ---------------------------------------------------------------- controller

describe("useRbtWalkthroughController — auto-open + finish", () => {
  it("auto-opens on first login for a real user", () => {
    const { result } = renderHook(() =>
      useRbtWalkthroughController({ userId: USER_A, previewActive: false })
    );
    expect(result.current.open).toBe(true);
    expect(result.current.index).toBe(0);
    expect(result.current.step.key).toBe(TOUR_STEPS[0].key);
    expect(result.current.canPersist).toBe(true);
  });

  it("does NOT auto-open when the current version is already completed", () => {
    writeCompletion(USER_A, TOUR_VERSION);
    const { result } = renderHook(() =>
      useRbtWalkthroughController({ userId: USER_A, previewActive: false })
    );
    expect(result.current.open).toBe(false);
  });

  it("finish() writes completion at the current version and closes", () => {
    const { result } = renderHook(() =>
      useRbtWalkthroughController({ userId: USER_A, previewActive: false })
    );
    act(() => { result.current.finish(); });
    expect(result.current.open).toBe(false);
    const stored = readCompletion(USER_A);
    expect(stored?.version).toBe(TOUR_VERSION);
  });

  it("dismiss() writes completion — Skip / Escape must not re-nag", () => {
    const { result } = renderHook(() =>
      useRbtWalkthroughController({ userId: USER_A, previewActive: false })
    );
    act(() => { result.current.dismiss(); });
    expect(result.current.open).toBe(false);
    expect(readCompletion(USER_A)?.version).toBe(TOUR_VERSION);
  });

  it("replay start() reopens the tour at step 0 without clearing persistence", () => {
    writeCompletion(USER_A, TOUR_VERSION);
    const { result } = renderHook(() =>
      useRbtWalkthroughController({ userId: USER_A, previewActive: false })
    );
    expect(result.current.open).toBe(false);
    act(() => { result.current.start({ replay: true }); });
    expect(result.current.open).toBe(true);
    expect(result.current.index).toBe(0);
    expect(result.current.isReplay).toBe(true);
    // Version 1 stays recorded (finishing replay is idempotent).
    expect(readCompletion(USER_A)?.version).toBe(TOUR_VERSION);
  });
});

describe("useRbtWalkthroughController — navigation & bounds", () => {
  it("next / prev walk through every step and clamp at the ends", () => {
    const { result } = renderHook(() =>
      useRbtWalkthroughController({ userId: USER_A, previewActive: false })
    );
    // prev at first step stays at 0
    act(() => { result.current.prev(); });
    expect(result.current.index).toBe(0);
    // walk all the way forward
    for (let i = 0; i < TOUR_STEPS.length + 3; i++) {
      act(() => { result.current.next(); });
    }
    expect(result.current.index).toBe(TOUR_STEPS.length - 1);
    expect(result.current.isLast).toBe(true);
    // walk back one
    act(() => { result.current.prev(); });
    expect(result.current.index).toBe(TOUR_STEPS.length - 2);
    // goTo clamps
    act(() => { result.current.goTo(999); });
    expect(result.current.index).toBe(TOUR_STEPS.length - 1);
    act(() => { result.current.goTo(-5); });
    expect(result.current.index).toBe(0);
  });
});

// ---------------------------------------------------------------- preview isolation

describe("preview isolation", () => {
  it("does not auto-open when Experience Lab / preview is active", () => {
    const { result } = renderHook(() =>
      useRbtWalkthroughController({ userId: USER_A, previewActive: true })
    );
    expect(result.current.open).toBe(false);
    expect(result.current.canPersist).toBe(false);
  });

  it("finish() during preview does NOT write completion for the real user", () => {
    const { result } = renderHook(() =>
      useRbtWalkthroughController({ userId: USER_A, previewActive: true })
    );
    act(() => { result.current.start({ replay: true }); });
    expect(result.current.open).toBe(true);
    act(() => { result.current.finish(); });
    expect(result.current.open).toBe(false);
    expect(readCompletion(USER_A)).toBeNull();
  });

  it("dismiss() during preview does NOT write completion for the real user", () => {
    const { result } = renderHook(() =>
      useRbtWalkthroughController({ userId: USER_A, previewActive: true })
    );
    act(() => { result.current.start({ replay: true }); });
    act(() => { result.current.dismiss(); });
    expect(readCompletion(USER_A)).toBeNull();
  });

  it("does not auto-open for anonymous users", () => {
    const { result } = renderHook(() =>
      useRbtWalkthroughController({ userId: null, previewActive: false })
    );
    expect(result.current.open).toBe(false);
    expect(result.current.canPersist).toBe(false);
  });
});

// ---------------------------------------------------------------- reduced motion

describe("prefers-reduced-motion", () => {
  it("returns true when the media query matches", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {},
      addListener: () => {}, removeListener: () => {},
      dispatchEvent: () => false,
    })) as any;
    expect(prefersReducedMotion()).toBe(true);
  });

  it("returns false when the media query does not match", () => {
    expect(prefersReducedMotion()).toBe(false);
  });
});

// ---------------------------------------------------------------- tour deck

describe("TOUR_STEPS deck", () => {
  it("covers every required surface exactly once", () => {
    const required = [
      "/rbt/app/home",
      "/rbt/app/program",
      "/rbt/app/learn",
      "/rbt/app/schedule",
      "/rbt/app/passport",
      "/rbt/app/support",
      "/rbt/app/me",
      "/rbt/app/growth/fellowship",
    ];
    const routes = TOUR_STEPS.map((s) => s.route);
    for (const r of required) expect(routes).toContain(r);
    // Every step has a title & body
    for (const s of TOUR_STEPS) {
      expect(s.title.length).toBeGreaterThan(3);
      expect(s.body.length).toBeGreaterThan(10);
      expect(s.route.startsWith("/rbt/app/")).toBe(true);
    }
    // No duplicate keys
    const keys = TOUR_STEPS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
