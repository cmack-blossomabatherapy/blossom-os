import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  SD_NO_SCREENSHOT_DECISIONS,
  getStateDirectorNoScreenshotDecision,
  getStateDirectorScreenshots,
  getStateDirectorFullContent,
  classifyStateDirectorModule,
  isScreenshotPiiSafe,
  SD_ALL_SCREENSHOTS,
} from "@/lib/training/stateDirectorFullTraining";
import {
  SD_JOURNEY_MODULE_IDS,
  SD_JOURNEY_STRUCTURE,
  getTraining,
} from "@/lib/training/academyData";

const ACADEMY = fs.readFileSync("src/lib/training/academyData.ts", "utf8");

describe("SD_JOURNEY_STRUCTURE comment is no longer marked placeholder", () => {
  it("removes the 'placeholder' / 'intentionally empty' language", () => {
    const head = ACADEMY.split("export const SD_JOURNEY_STRUCTURE")[0];
    expect(head).not.toMatch(/placeholder structure/i);
    expect(head).not.toMatch(/intentionally\s+empty/i);
    expect(head).toMatch(/5-week framework \(stable\)/);
    expect(head).toMatch(/stateDirectorFullTraining\.ts/);
    expect(head).toMatch(/welcomeToBlossomContent\.ts/);
  });
});

describe("State Director journey shape is unchanged", () => {
  it("remains 5 weeks · 25 days · 104 modules", () => {
    expect(SD_JOURNEY_STRUCTURE).toHaveLength(5);
    const days = SD_JOURNEY_STRUCTURE.flatMap((w) => w.days);
    expect(days).toHaveLength(25);
    expect(SD_JOURNEY_MODULE_IDS).toHaveLength(104);
  });
});

describe("Every SD module resolves to curated, welcome, or intentional content", () => {
  it("104/104 modules have full content with a populated learningObjective", () => {
    let resolved = 0;
    for (const id of SD_JOURNEY_MODULE_IDS) {
      const t = getTraining(id);
      if (!t) continue;
      const c = getStateDirectorFullContent(t);
      if (c && c.learningObjective.length > 0) resolved += 1;
    }
    expect(resolved).toBe(104);
  });

  it("every module has either a screenshot, a no-screenshot decision, or curated/welcome content", () => {
    const orphans: string[] = [];
    for (const id of SD_JOURNEY_MODULE_IDS) {
      const t = getTraining(id);
      if (!t) continue;
      const cls = classifyStateDirectorModule(t);
      const hasShot = getStateDirectorScreenshots(id).length > 0;
      const hasDecision = !!getStateDirectorNoScreenshotDecision(id);
      const acceptable =
        hasShot ||
        hasDecision ||
        cls?.status === "curated" ||
        cls?.status === "welcome_non_sop";
      if (!acceptable) orphans.push(id);
    }
    expect(orphans).toEqual([]);
  });
});

describe("SD_NO_SCREENSHOT_DECISIONS registry", () => {
  it("exists and includes shadowing, sign-off, and certification modules", () => {
    expect(SD_NO_SCREENSHOT_DECISIONS.length).toBeGreaterThanOrEqual(8);
    const ids = new Set(SD_NO_SCREENSHOT_DECISIONS.map((d) => d.moduleId));
    for (const expected of [
      "sd-w4d5-scheduling-shadow",
      "sd-w4d5-recruiting-shadow",
      "sd-w4d5-bcba-shadow",
      "sd-w4d5-state-director-shadow",
      "sd-w5d5-final-knowledge-review",
      "sd-w5d5-readiness-assessment",
      "sd-w5d5-leadership-sign-off",
      "sd-w5d5-state-director-certification",
    ]) {
      expect(ids.has(expected)).toBe(true);
    }
  });

  it("every decision points at a real module id and has reason + replacementEvidence", () => {
    const valid = new Set(SD_JOURNEY_MODULE_IDS);
    for (const d of SD_NO_SCREENSHOT_DECISIONS) {
      expect(valid.has(d.moduleId)).toBe(true);
      expect(d.reason.length).toBeGreaterThan(10);
      expect(d.replacementEvidence.length).toBeGreaterThan(10);
    }
  });

  it("no-screenshot decisions are NOT applied to operational system modules", () => {
    const forbidden = [
      "user-permissions",
      "labels-filters",
      "scheduling-oversight",
      "session-integrity",
      "schedule-monitoring",
      "phone-calls-workflow",
      "consent-workflow",
      "assessment-process",
      "active-client-lifecycle",
      "initial-auths",
      "treatment-auths",
      "reassessments",
      "actual-hours",
      "pending-hours",
      "remaining-hours",
      "coverage-risks",
      "revenue-awareness",
      "operational-visibility",
      "bcba-oversight",
      "rbt-oversight",
      "capacity-management",
      "pairing-process",
      "schedule-optimization",
      "orientation-process",
      "background-checks",
      "workforce-readiness",
      "department-follow-up",
      "accountability-reviews",
      "parent-escalations",
      "bcba-escalations",
      "staffing-escalations",
      "operational-issues",
      "cross-department-management",
      "operational-prioritization",
      "leadership-decision-making",
    ];
    for (const d of SD_NO_SCREENSHOT_DECISIONS) {
      for (const slug of forbidden) {
        expect(d.moduleId.includes(slug)).toBe(false);
      }
    }
  });
});

describe("Screenshot metadata is PII-safe where marked training_safe", () => {
  it("no training_safe asset contains PII keywords", () => {
    const unsafe = SD_ALL_SCREENSHOTS.filter((s) => !isScreenshotPiiSafe(s));
    expect(unsafe).toEqual([]);
  });
});

describe("OSTrainingDetail renders the evidence panel for no-screenshot modules", () => {
  const SOURCE = fs.readFileSync("src/pages/os/OSTrainingDetail.tsx", "utf8");
  it("imports the no-screenshot decision helper", () => {
    expect(SOURCE).toMatch(/getStateDirectorNoScreenshotDecision/);
  });
  it("renders an evidence panel with calm learner copy", () => {
    expect(SOURCE).toMatch(/data-testid="sd-evidence-instead-of-screenshot"/);
    expect(SOURCE).toMatch(/Evidence instead of a screenshot/);
    expect(SOURCE).toMatch(/written guidance and mentor evidence instead of a screenshot/);
    // Learner copy must not say "missing".
    expect(SOURCE).not.toMatch(/Screenshot missing/);
  });
});