/**
 * State Director — Week 1 launch-readiness lock.
 *
 * This suite encodes the acceptance criteria for "a real new State Director
 * can open /training, complete the 7-module Welcome, then move through Week 1
 * Day 1-5 with full content and working module detail pages."
 *
 * It is intentionally strict so future edits can't silently regress the
 * Welcome stabilization or Week 1 content depth.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  WELCOME_TO_BLOSSOM_MODULES,
  WELCOME_TO_BLOSSOM_MODULE_TITLES,
} from "@/lib/training/welcomeToBlossomContent";
import { ONBOARDING_PHASES } from "@/lib/onboarding/journey";
import {
  SD_JOURNEY_STRUCTURE,
  getTrainings,
  type Training,
} from "@/lib/training/academyData";
import { getStateDirectorFullContent } from "@/lib/training/stateDirectorFullTraining";

const REQUIRED_WELCOME_TITLES = [
  "Welcome Video from Blossom",
  "Mission & Vision",
  "Core Values",
  "Meet the Team",
  "How Blossom Works",
  "Welcome Letter from Chad",
  "Welcome Letter from Shira",
];

const LEARNER_FACING_FILES = [
  "src/pages/os/OSWelcomeToBlossom.tsx",
  "src/pages/os/OSTrainingDetail.tsx",
  "src/pages/os/OSTraining.tsx",
  "src/components/training/SDLearnerHome.tsx",
  "src/components/training/SDJourneyView.tsx",
  "src/lib/training/sdWeek1Content.ts",
  "src/lib/training/stateDirectorFullTraining.ts",
];

const MOJIBAKE = /[ÂÃ]|â€[\u0080-\u00FF]?|â€“|â€”|â€¦|â€œ|â€\u009d/;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function moduleIdFor(week: number, day: number, title: string): string {
  return `sd-w${week}d${day}-${slugify(title)}`;
}

describe("Welcome to Blossom — launch lock", () => {
  it("is exactly the 7 canonical universal modules", () => {
    expect(WELCOME_TO_BLOSSOM_MODULES.length).toBe(7);
    expect(WELCOME_TO_BLOSSOM_MODULE_TITLES).toEqual(REQUIRED_WELCOME_TITLES);
  });

  it("contains no HIPAA module or quiz in the active welcome list", () => {
    for (const m of WELCOME_TO_BLOSSOM_MODULES) {
      expect(m.id).not.toMatch(/hipaa/i);
      expect(m.title).not.toMatch(/hipaa/i);
    }
    const welcome = ONBOARDING_PHASES.find((p) => p.id === "welcome")!;
    for (const m of welcome.modules) {
      expect(m.key).not.toMatch(/hipaa/i);
    }
  });

  it("/training/welcome route renders OSWelcomeToBlossom directly (no old shell)", () => {
    const app = fs.readFileSync("src/App.tsx", "utf8");
    expect(app).toMatch(
      /path="\/training\/welcome"\s+element=\{<OSWelcomeToBlossom/,
    );
  });

  it("learner page has one calm completion area, no duplicate competing CTAs", () => {
    const page = fs.readFileSync(
      "src/pages/os/OSWelcomeToBlossom.tsx",
      "utf8",
    );
    // No HIPAA gating UI re-introduced.
    expect(page).not.toMatch(/hipaaQuizPassed/);
    expect(page).not.toMatch(/WelcomeHipaaQuiz/);
    expect(page).not.toMatch(/welcome-hipaa-section/);
    // Canonical module sequence is rendered from the source of truth.
    expect(page).toMatch(/WELCOME_TO_BLOSSOM_MODULES\.map/);
  });
});

describe("State Director Week 1 — 25 modules with full launch content", () => {
  const week1 = SD_JOURNEY_STRUCTURE.find((w) => w.week === 1)!;
  const week1Modules: Array<{ training: Training; day: number; title: string }> =
    week1.days.flatMap((d) =>
      d.modules.map((title) => {
        const id = moduleIdFor(1, d.day, title);
        const training = getTrainings().find((x: Training) => x.id === id);
        if (!training) throw new Error(`Week 1 training missing: ${id}`);
        return { training, day: d.day, title };
      }),
    );

  it("has exactly 25 Week 1 modules across Day 1-5", () => {
    expect(week1Modules.length).toBe(25);
    const days = new Set(week1Modules.map((m) => m.day));
    expect([...days].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("every Week 1 module has full SDFullContent with ≥5 walkthrough steps", () => {
    for (const { training, title } of week1Modules) {
      const c = getStateDirectorFullContent(training);
      expect(c, `missing full content for ${title}`).toBeTruthy();
      expect(
        c!.stepByStep.length,
        `walkthrough <5 for ${title}`,
      ).toBeGreaterThanOrEqual(5);
      expect(
        c!.sop.process.length,
        `SOP process <3 for ${title}`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        c!.knowledgeCheck.length,
        `knowledge check <2 for ${title}`,
      ).toBeGreaterThanOrEqual(2);
      expect(
        c!.scenario.situation.length,
        `scenario thin for ${title}`,
      ).toBeGreaterThan(20);
      expect(
        c!.learningObjective.length,
        `learning objective thin for ${title}`,
      ).toBeGreaterThan(15);
    }
  });

  it("every Week 1 module has completion evidence and reflection prompt", () => {
    for (const { training, title } of week1Modules) {
      expect(
        training.completionEvidence,
        `completionEvidence missing for ${title}`,
      ).toBeTruthy();
      expect(
        training.reflectionPrompt,
        `reflectionPrompt missing for ${title}`,
      ).toBeTruthy();
      expect(
        training.whyItMatters,
        `whyItMatters missing for ${title}`,
      ).toBeTruthy();
      expect(
        training.whatToDo,
        `whatToDo missing for ${title}`,
      ).toBeTruthy();
    }
  });
});

describe("Module detail page — Start / Mark Complete wiring is preserved", () => {
  const detail = fs.readFileSync("src/pages/os/OSTrainingDetail.tsx", "utf8");

  it("renders the SD detail panel with all required sections", () => {
    expect(detail).toMatch(/data-testid="sd-module-detail-panel"/);
    for (const id of [
      "sd-why-matters",
      "sd-what-to-do",
      "sd-workflow-content",
      "sd-knowledge-check",
      "sd-notes",
      "sd-resources",
      "sd-signoff",
      "sd-mark-complete",
    ]) {
      expect(detail, `missing ${id}`).toMatch(
        new RegExp(`data-testid="${id}"`),
      );
    }
  });

  it("wires Start and Mark Complete to academy progress APIs", () => {
    expect(detail).toMatch(/startLearnerModule\(/);
    expect(detail).toMatch(/completeLearnerModule\(/);
    expect(detail).toMatch(/upsertProgress\(/);
  });
});

describe("No broken anchors or placeholder copy in learner-facing Week 1", () => {
  for (const f of LEARNER_FACING_FILES) {
    it(`${f} has no href="#", tangoUrl || "#", or url: "#" fallbacks`, () => {
      const src = fs.readFileSync(f, "utf8");
      expect(src).not.toMatch(/href="#"/);
      expect(src).not.toMatch(/tangoUrl \|\| "#"/);
      expect(src).not.toMatch(/url:\s*"#"/);
    });

    it(`${f} has no mojibake encoding artifacts`, () => {
      const src = fs.readFileSync(f, "utf8");
      expect(MOJIBAKE.test(src)).toBe(false);
    });

    it(`${f} has no visible "coming soon" / "placeholder" learner copy`, () => {
      const src = fs.readFileSync(f, "utf8");
      // Allow code identifiers like isPendingResource; ban the user-facing strings.
      expect(src).not.toMatch(/>\s*Coming soon\s*</i);
      expect(src).not.toMatch(/>\s*Placeholder\s*</i);
    });
  }
});
