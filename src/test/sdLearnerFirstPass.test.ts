import { describe, it, expect } from "vitest";
import fs from "node:fs";

const HOME = fs.readFileSync("src/components/training/SDLearnerHome.tsx", "utf8");
const JOURNEY = fs.readFileSync("src/components/training/SDJourneyView.tsx", "utf8");
const DETAIL = fs.readFileSync("src/pages/os/OSTrainingDetail.tsx", "utf8");

describe("SD Learner-first pass — Part 1 (warmth) + Part 2 (day grouping) + Part 6 (module detail)", () => {
  it("learner home renders a warm, personalized header with mentor + launch stats", () => {
    expect(HOME).toContain('data-testid="sd-warm-header"');
    expect(HOME).toMatch(/Welcome back,/);
    // 4 quick-glance stats: Current, Launch, Readiness, Mentor.
    for (const label of ["Current", "Launch", "Readiness", "Mentor"]) {
      expect(HOME).toContain(`label="${label}"`);
    }
    // Warm copy must not leave the learner feeling alone.
    expect(HOME).toMatch(/nothing here has to be\s+solved alone/);
  });

  it("learner home anchors Day 1 with a calm five-step 'start here today' card", () => {
    expect(HOME).toContain('data-testid="sd-start-here-today"');
    expect(HOME).toContain("Five small wins for your first day");
    // The five steps must be present so a new SD has an unambiguous Day-1 path.
    for (const phrase of [
      "Open Welcome to Blossom",
      "Complete the Week 1",
      "Write one short reflection",
      "Ask your mentor one question",
      "Close the laptop",
    ]) {
      expect(HOME).toContain(phrase);
    }
  });

  it("learner home surfaces the Welcome to Blossom anchor with a deep-link CTA", () => {
    expect(HOME).toContain('data-testid="sd-welcome-anchor"');
    expect(HOME).toContain('data-testid="sd-welcome-cta"');
    expect(HOME).toContain('navigate("/training/welcome")');
    // Welcome chips should reflect the 7-module universal onboarding.
    for (const chip of [
      "Welcome Video from Chad",
      "Welcome from Shira",
      "Mission & Vision",
      "Core Values",
      "Meet the Team",
      "How Blossom Works",
    ]) {
      expect(HOME).toContain(chip);
    }
  });

  it("learner home renders a today-focused checklist with next-step highlight", () => {
    expect(HOME).toContain('data-testid="sd-today"');
    expect(HOME).toContain('data-testid="sd-today-next-action"');
    expect(HOME).toContain('data-testid="sd-current-day-modules"');
    expect(HOME).toContain('"sd-day-checklist-next"');
    expect(HOME).toMatch(/Today.{0,3}s day checklist/);
  });

  it("learner home renders the five-week roadmap using the day-grouped journey view", () => {
    expect(HOME).toContain('data-testid="sd-roadmap"');
    expect(HOME).toContain("Five-week roadmap");
    expect(HOME).toContain("<SDJourneyView");
  });

  it("SDJourneyView groups modules under Week → Day with progressive unlock", () => {
    // Week-then-day rendering + per-day state computation.
    expect(JOURNEY).toContain("Week → Day → Module");
    expect(JOURNEY).toMatch(/Day \{d\.day\}/);
    // Day lock — day 1 of week 1 is unlocked, future days unlock as prior complete.
    expect(JOURNEY).toContain("isDayUnlocked");
    expect(JOURNEY).toContain("Opens after prior day");
  });

  it("learner home shows a launch checklist with five-signal day-1 framing", () => {
    expect(HOME).toContain('data-testid="sd-launch-checklist-card"');
    expect(HOME).toContain("Five quiet signals you are on track");
    for (const label of ["Welcome", "Today's modules", "Mentor check-in", "Reflection"]) {
      expect(HOME).toContain(label);
    }
  });

  it("module detail page wires Start + Mark complete to academy progress APIs", () => {
    expect(DETAIL).toContain('data-testid="sd-mark-complete"');
    expect(DETAIL).toContain("startLearnerModule");
    expect(DETAIL).toContain("completeLearnerModule");
    // Both buttons must call the handlers.
    expect(DETAIL).toMatch(/onClick=\{handleStart\}/);
    expect(DETAIL).toMatch(/onClick=\{handleComplete\}/);
  });

  it("module detail page renders the practice scenario panel with situation + prompt + expected response toggle", () => {
    expect(DETAIL).toContain('data-testid="sd-scenario"');
    expect(DETAIL).toContain('data-testid="sd-scenario-toggle"');
    expect(DETAIL).toContain('data-testid="sd-scenario-expected"');
    expect(DETAIL).toMatch(/Practice scenario/);
  });

  it("module detail page renders the knowledge check block", () => {
    expect(DETAIL).toMatch(/Knowledge check/);
    expect(DETAIL).toMatch(/Knowledge check submitted/);
  });

  it("learner-facing files contain no broken href='#' fallbacks or mojibake", () => {
    for (const src of [HOME, JOURNEY, DETAIL]) {
      expect(src).not.toMatch(/href=["']#["']/);
      expect(src).not.toMatch(/â€”|â€“|â€¦|Â·/);
    }
  });
});
