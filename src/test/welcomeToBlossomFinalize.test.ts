import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  WELCOME_TO_BLOSSOM_MODULES,
  WELCOME_TO_BLOSSOM_MODULE_TITLES,
  WELCOME_TO_BLOSSOM_PHASE_ID,
  WELCOME_LEADERSHIP_LETTERS,
  isWelcomeNonSopModule,
} from "@/lib/training/welcomeToBlossomContent";
import { ONBOARDING_PHASES } from "@/lib/onboarding/journey";

const REQUIRED_TITLES = [
  "Welcome Video from Blossom",
  "Mission & Vision",
  "Core Values",
  "Meet the Team",
  "How Blossom Works",
  "Welcome Letter from Chad",
  "Welcome Letter from Shira",
];

const FORBIDDEN_WELCOME_TITLES = [
  "HIPAA & Privacy Basics",
  "HIPAA & Compliance",
  "Employee Expectations",
  "Organizational Structure",
  "Systems Overview",
];

const MOJIBAKE = /[ÂÃ]|â€[\u0080-\u00FF]?|â€“|â€”|â€¦|â€œ|â€\u009d/;
const TOUCHED_FILES = [
  "src/lib/training/welcomeToBlossomContent.ts",
  "src/lib/onboarding/journey.ts",
  "src/pages/os/OSWelcomeToBlossom.tsx",
  "src/pages/hr/TrainingManagementCenter.tsx",
];

describe("Welcome to Blossom - finalized 7 universal modules", () => {
  it("has exactly 7 modules in the canonical order", () => {
    expect(WELCOME_TO_BLOSSOM_MODULES.length).toBe(7);
    expect(WELCOME_TO_BLOSSOM_MODULE_TITLES).toEqual(REQUIRED_TITLES);
  });

  it("HIPAA and old generic modules are not part of Welcome to Blossom", () => {
    const titles = WELCOME_TO_BLOSSOM_MODULE_TITLES;
    for (const t of FORBIDDEN_WELCOME_TITLES) {
      expect(titles).not.toContain(t);
    }
    for (const m of WELCOME_TO_BLOSSOM_MODULES) {
      expect(m.id).not.toBe("welcome-hipaa-basics");
    }
  });

  it("only Welcome Video from Blossom is the video module; letters are letter type", () => {
    const videos = WELCOME_TO_BLOSSOM_MODULES.filter((m) => m.moduleType === "video");
    expect(videos.length).toBe(1);
    expect(videos[0].title).toBe("Welcome Video from Blossom");

    const chad = WELCOME_TO_BLOSSOM_MODULES.find((m) => m.id === "welcome-letter-chad")!;
    const shira = WELCOME_TO_BLOSSOM_MODULES.find((m) => m.id === "welcome-letter-shira")!;
    expect(chad.moduleType).toBe("letter");
    expect(shira.moduleType).toBe("letter");
  });

  it("each module has the fields Training Management needs", () => {
    for (const m of WELCOME_TO_BLOSSOM_MODULES) {
      expect(m.id).toBeTruthy();
      expect(m.title).toBeTruthy();
      expect(m.moduleType).toBeTruthy();
      expect(m.estimatedMinutes).toBeGreaterThan(0);
      expect(m.description).toBeTruthy();
      expect(m.learningObjective).toBeTruthy();
      expect(m.whyThisMatters).toBeTruthy();
      expect(m.whatToDo.length).toBeGreaterThan(0);
      expect(m.completionEvidence).toBeTruthy();
    }
  });

  it("WELCOME_TO_BLOSSOM_PHASE_ID is 'welcome'", () => {
    expect(WELCOME_TO_BLOSSOM_PHASE_ID).toBe("welcome");
  });

  it("leadership letters use canonical chad/shira ids and exact display titles", () => {
    const chad = WELCOME_LEADERSHIP_LETTERS.find((l) => l.id === "welcome-letter-chad")!;
    const shira = WELCOME_LEADERSHIP_LETTERS.find((l) => l.id === "welcome-letter-shira")!;
    expect(chad.displayTitle).toBe("Welcome Letter from Chad");
    expect(shira.displayTitle).toBe("Welcome Letter from Shira");
  });

  it("all 7 welcome modules are excluded from SOP coverage", () => {
    for (const m of WELCOME_TO_BLOSSOM_MODULES) {
      expect(isWelcomeNonSopModule(m.id)).toBe(true);
    }
  });
});

describe("Onboarding journey - welcome phase mirrors the universal modules", () => {
  const welcome = ONBOARDING_PHASES.find((p) => p.id === "welcome")!;

  it("welcome phase has exactly 7 modules", () => {
    expect(welcome).toBeTruthy();
    expect(welcome.modules.length).toBe(7);
  });

  it("module keys align with canonical welcome ids", () => {
    const expectedKeys = [
      "welcome-video-from-blossom",
      "welcome-mission-vision",
      "welcome-core-values",
      "welcome-meet-the-team",
      "welcome-how-blossom-works",
      "welcome-letter-chad",
      "welcome-letter-shira",
    ];
    expect(welcome.modules.map((m) => m.key)).toEqual(expectedKeys);
  });

  it("module titles match the required learner-facing titles", () => {
    expect(welcome.modules.map((m) => m.title)).toEqual(REQUIRED_TITLES);
  });

  it("only one video module, and it has a loaded video url", () => {
    const videos = welcome.modules.filter((m) => m.kind === "video");
    expect(videos.length).toBe(1);
    expect(videos[0].video?.url).toBeTruthy();
  });

  it("Chad and Shira are kind: 'letter', not videos", () => {
    const chad = welcome.modules.find((m) => m.key === "welcome-letter-chad")!;
    const shira = welcome.modules.find((m) => m.key === "welcome-letter-shira")!;
    expect(chad.kind).toBe("letter");
    expect(shira.kind).toBe("letter");
    expect(chad.video).toBeUndefined();
    expect(shira.video).toBeUndefined();
  });

  it("HIPAA and old generic modules are not in the welcome phase", () => {
    const titles = welcome.modules.map((m) => m.title);
    for (const t of FORBIDDEN_WELCOME_TITLES) {
      expect(titles).not.toContain(t);
    }
    expect(welcome.modules.find((m) => m.key === "welcome-hipaa-basics")).toBeUndefined();
  });
});

describe("Training Management welcome view + learner page + clean encoding", () => {
  const TMC = fs.readFileSync("src/pages/hr/TrainingManagementCenter.tsx", "utf8");
  const PAGE = fs.readFileSync("src/pages/os/OSWelcomeToBlossom.tsx", "utf8");
  const APP = fs.readFileSync("src/App.tsx", "utf8");

  it("Training Management reads from canonical Welcome phase (not a drifting hardcoded list)", () => {
    expect(TMC).toMatch(/ONBOARDING_PHASES\.find\(\(p\) => p\.id === "welcome"\)/);
    expect(TMC).toMatch(/label="Steps"/);
    expect(TMC).toMatch(/welcome\.modules\.length/);
    expect(TMC).toMatch(/phase_id: "welcome"/);
  });

  it("Training Management surfaces an admin status row (video loaded + letters)", () => {
    expect(TMC).toMatch(/welcome-admin-status/);
    expect(TMC).toMatch(/Welcome video/);
  });

  it("learner page renders the 7-module sequence and has no HIPAA section or gating", () => {
    expect(PAGE).toMatch(/welcome-module-sequence/);
    expect(PAGE).toMatch(/WELCOME_TO_BLOSSOM_MODULES\.map/);
    expect(PAGE).toMatch(/data-module-type=\{m\.moduleType\}/);
    expect(PAGE).not.toMatch(/welcome-hipaa-section/);
    expect(PAGE).not.toMatch(/welcome-hipaa-resources/);
    expect(PAGE).not.toMatch(/hipaaQuizPassed/);
    expect(PAGE).not.toMatch(/WelcomeHipaaQuiz/);
  });

  it("/training/welcome renders OSWelcomeToBlossom directly (no old onboarding shell)", () => {
    expect(APP).toMatch(/path="\/training\/welcome"\s+element={<OSWelcomeToBlossom/);
  });

  for (const f of TOUCHED_FILES) {
    it(`no mojibake artifacts in ${f}`, () => {
      const src = fs.readFileSync(f, "utf8");
      expect(MOJIBAKE.test(src)).toBe(false);
    });
  }
});
