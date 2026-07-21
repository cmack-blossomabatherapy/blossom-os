import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Training Academy Redesign Pass 2 — learner surface", () => {
  const osTraining = read("src/pages/os/OSTraining.tsx");
  const sdView = read("src/components/training/SDJourneyView.tsx");
  const welcome = read("src/pages/os/OSWelcomeToBlossom.tsx");

  it("OSTraining shows a warm SD greeting and grounding copy", () => {
    expect(osTraining).toMatch(/Welcome back/);
    expect(osTraining).toMatch(/get grounded/i);
    expect(osTraining).toMatch(/Start with Welcome to Blossom/);
  });

  it("OSTraining anchors Welcome to Blossom near the top for SD", () => {
    expect(osTraining).toMatch(/WelcomeAnchor/);
    expect(osTraining).toMatch(/Start Welcome to Blossom/);
    expect(osTraining).toMatch(/Notes from Chad & Shira/);
  });

  it("OSTraining replaces global 'Required Due' / 'Overdue' for SD with a calm Help panel", () => {
    expect(osTraining).toMatch(/<NeedHelpPanel/);
    expect(osTraining).toMatch(/Your launch progress/);
  });

  it("OSTraining uses launch-scoped progress and never the global '133 required' for SD", () => {
    expect(osTraining).toMatch(/launch\.pct/);
    expect(osTraining).toMatch(/launch\.done/);
    // The 2/133 style global counter is not rendered when isSD
    expect(osTraining).toMatch(/isSD \? launch\.pct/);
  });

  it("SDJourneyView collapses future weeks and expands the current week by default", () => {
    expect(sdView).toMatch(/sd-week-toggle/);
    expect(sdView).toMatch(/new Set\(\[currentDayState\.week\]\)/);
    expect(sdView).toMatch(/Opens after prior day/);
    expect(sdView).not.toMatch(/>\s*Locked\s*</);
  });

  it("SDJourneyView labels the current week with a 'Current' chip", () => {
    expect(sdView).toMatch(/Current\s*</);
  });

  it("Resource Library learner links point to /resource-library, never the legacy /resources from OSTraining", () => {
    const learnerResourceLinks = osTraining.match(/to="\/resources"/g) ?? [];
    expect(learnerResourceLinks.length).toBe(0);
    expect(osTraining).toMatch(/\/resource-library/);
  });

  it("OSTraining and SDJourneyView never use href=\"#\" placeholder links", () => {
    expect(osTraining).not.toMatch(/href="#"/);
    expect(sdView).not.toMatch(/href="#"/);
  });

  it("Welcome to Blossom page includes leadership letters from Chad and Shira and a CTA back to the SD journey", () => {
    const content = require("node:fs").readFileSync(
      "src/lib/training/welcomeToBlossomContent.ts",
      "utf8",
    );
    expect(content).toMatch(/Chad Kaufman/);
    expect(content).toMatch(/Shira Lasry/);
    expect(welcome).toMatch(/WELCOME_LEADERSHIP_LETTERS/);
    expect(welcome).toMatch(/A welcome from leadership/);
    // Current contract: role-agnostic CTA that lands on the learner's Journey.
    expect(welcome).toMatch(/Continue to Journey/);
  });

  it("Welcome to Blossom keeps the video first and remains revisitable", () => {
    const videoIdx = welcome.indexOf("<video");
    const lettersIdx = welcome.indexOf("A welcome from leadership");
    expect(videoIdx).toBeGreaterThan(-1);
    expect(lettersIdx).toBeGreaterThan(videoIdx);
    // Revisit affordance — "Mark as watched" remains, video controls present
    expect(welcome).toMatch(/controls/);
  });
});

describe("Shared learner academy model — wired", () => {
  const learnerHome = read("src/lib/academy/learnerHome.ts");

  it("exposes loadLearnerHome, startLearnerModule, completeLearnerModule", () => {
    expect(learnerHome).toMatch(/export async function loadLearnerHome/);
    expect(learnerHome).toMatch(/export async function startLearnerModule/);
    expect(learnerHome).toMatch(/export async function completeLearnerModule/);
  });

  it("delegates module write-through to the same upsertProgress() Training Management consumes", () => {
    expect(learnerHome).toMatch(/upsertProgress\(enrollmentId, moduleId/);
  });

  it("scopes counts to the active enrollment path, not all required modules", () => {
    expect(learnerHome).toMatch(/applies_to === path/);
    expect(learnerHome).toMatch(/launchRequired/);
  });
});
