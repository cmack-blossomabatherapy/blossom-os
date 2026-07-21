import { describe, it, expect } from "vitest";
import fs from "node:fs";

const SD_HOME = fs.readFileSync("src/components/training/SDLearnerHome.tsx", "utf8");
const WELCOME = fs.readFileSync("src/pages/os/OSWelcomeToBlossom.tsx", "utf8");
const DETAIL = fs.readFileSync("src/pages/os/OSTrainingDetail.tsx", "utf8");

describe("Training Academy visual upgrade — State Director first", () => {
  it("SD home renders a Today's Launch Plan section", () => {
    expect(SD_HOME).toMatch(/data-testid="sd-today-launch-plan"/);
    expect(SD_HOME).toMatch(/Today.s Launch Plan/);
  });

  it("SD home highlights a single next action and a checklist next-up row", () => {
    expect(SD_HOME).toMatch(/data-testid="sd-today-next-action"/);
    expect(SD_HOME).toMatch(/sd-day-checklist-next/);
    expect(SD_HOME).toMatch(/Your next step/);
  });

  it("SD home uses warmer day-checklist copy (no mechanical 'clicks shut')", () => {
    expect(SD_HOME).not.toMatch(/clicks shut/);
    expect(SD_HOME).toMatch(/state director\s+instincts/i);
    expect(SD_HOME).toMatch(/use in the field/i);
  });

  it("SD home roadmap is framed as a launch path", () => {
    expect(SD_HOME).toMatch(/Your launch path/);
    expect(SD_HOME).toMatch(/Five-week roadmap/);
  });

  it("Welcome to Blossom hero includes 'Start here'", () => {
    expect(WELCOME).toMatch(/Start here\./);
  });

  it("Welcome to Blossom renders a dedicated reflection prompt section", () => {
    expect(WELCOME).toMatch(/data-testid="welcome-reflection-prompt"/);
    expect(WELCOME).toMatch(/eyebrow="Reflection"/);
  });

  it("Welcome to Blossom completion CTA points to the launch path", () => {
    // Current contract: role-agnostic CTA label with stable testid.
    expect(WELCOME).toMatch(/Continue to Journey/);
    expect(WELCOME).toMatch(/data-testid="welcome-continue-launch-path"/);
  });

  it("Welcome video pending copy stays calm — no harsh wording", () => {
    // user-facing copy only — never tell the learner anything is broken / coming soon
    expect(WELCOME).toMatch(/welcome video is being prepared/i);
    expect(WELCOME).not.toMatch(/coming soon/i);
    expect(WELCOME).not.toMatch(/something went wrong/i);
    expect(WELCOME).not.toMatch(/video failed/i);
  });

  it("SD module detail includes Start here, Why this matters, Walkthrough, Practice scenario, Completion evidence", () => {
    expect(DETAIL).toMatch(/data-testid="sd-module-hero"/);
    expect(DETAIL).toMatch(/data-testid="sd-why-matters"/);
    expect(DETAIL).toMatch(/data-testid="sd-walkthrough"/);
    expect(DETAIL).toMatch(/data-testid="sd-scenario"/);
    expect(DETAIL).toMatch(/Practice scenario/);
    // Completion evidence rides on sd-signoff
    expect(DETAIL).toMatch(/Completion evidence/);
  });

  it("SD module detail renders a sticky progress strip", () => {
    expect(DETAIL).toMatch(/data-testid="sd-progress-strip"/);
  });

  it("Pending SOP/resource copy stays calm — no broken/error/placeholder/coming soon", () => {
    expect(DETAIL).not.toMatch(/\bbroken\b/i);
    expect(DETAIL).not.toMatch(/coming soon/i);
  });
});