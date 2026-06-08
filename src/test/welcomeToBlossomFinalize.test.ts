import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  WELCOME_TO_BLOSSOM_MODULES,
  WELCOME_TO_BLOSSOM_MODULE_TITLES,
  WELCOME_TO_BLOSSOM_PHASE_ID,
  WELCOME_LEADERSHIP_LETTERS,
  isWelcomeNonSopModule,
  WELCOME_HIPAA_CONTENT,
} from "@/lib/training/welcomeToBlossomContent";
import { ONBOARDING_PHASES } from "@/lib/onboarding/journey";

const REQUIRED_TITLES = [
  "Welcome Video from Blossom",
  "Mission & Vision",
  "Core Values",
  "Meet the Team",
  "How Blossom Works",
  "HIPAA & Privacy Basics",
  "Welcome Letter from Chad",
  "Welcome Letter from Shira",
];

const MOJIBAKE = /[ÂÃ]|â€[\u0080-\u00FF]?|â€“|â€”|â€¦|â€œ|â€\u009d/;
const TOUCHED_FILES = [
  "src/lib/training/welcomeToBlossomContent.ts",
  "src/lib/onboarding/journey.ts",
  "src/pages/os/OSWelcomeToBlossom.tsx",
  "src/pages/hr/TrainingManagementCenter.tsx",
];

describe("Welcome to Blossom - finalized 7 universal modules", () => {
  it("has exactly 8 modules in the canonical order (HIPAA added before letters)", () => {
    expect(WELCOME_TO_BLOSSOM_MODULES.length).toBe(8);
    expect(WELCOME_TO_BLOSSOM_MODULE_TITLES).toEqual(REQUIRED_TITLES);
  });

  it("only Welcome Video from Blossom is the video module; letters are letter type", () => {
    const videos = WELCOME_TO_BLOSSOM_MODULES.filter((m) => m.moduleType === "video");
    expect(videos.length).toBe(1);
    expect(videos[0].title).toBe("Welcome Video from Blossom");

    const chad = WELCOME_TO_BLOSSOM_MODULES.find((m) => m.id === "welcome-letter-chad")!;
    const shira = WELCOME_TO_BLOSSOM_MODULES.find((m) => m.id === "welcome-letter-shira")!;
    expect(chad.moduleType).toBe("letter");
    expect(shira.moduleType).toBe("letter");
    expect(chad.title).toBe("Welcome Letter from Chad");
    expect(shira.title).toBe("Welcome Letter from Shira");
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

  it("welcome phase has exactly 8 modules", () => {
    expect(welcome).toBeTruthy();
    expect(welcome.modules.length).toBe(8);
  });

  it("module keys align with canonical welcome ids", () => {
    const expectedKeys = [
      "welcome-video-from-blossom",
      "welcome-mission-vision",
      "welcome-core-values",
      "welcome-meet-the-team",
      "welcome-how-blossom-works",
      "welcome-hipaa-basics",
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

  it("two leader-letter modules are present (Chad and Shira), neither is a video", () => {
    const leaders = welcome.modules.filter((m) => m.kind === "leader");
    expect(leaders.length).toBe(2);
    expect(leaders.map((m) => m.title).sort()).toEqual([
      "Welcome Letter from Chad",
      "Welcome Letter from Shira",
    ]);
    for (const m of leaders) {
      expect(m.video).toBeUndefined();
    }
  });

  it("removed HIPAA & Compliance and Employee Expectations from the welcome phase", () => {
    const titles = welcome.modules.map((m) => m.title);
    // The old generic "HIPAA & Compliance" module is gone; replaced by the
    // detailed "HIPAA & Privacy Basics" module placed before the letters.
    expect(titles).not.toContain("HIPAA & Compliance");
    expect(titles).not.toContain("Employee Expectations");
    expect(titles).toContain("HIPAA & Privacy Basics");
    const hipaaIdx = titles.indexOf("HIPAA & Privacy Basics");
    const chadIdx = titles.indexOf("Welcome Letter from Chad");
    expect(hipaaIdx).toBeGreaterThan(-1);
    expect(chadIdx).toBeGreaterThan(hipaaIdx);
  });
});

describe("HIPAA & Privacy Basics - content depth + resource links", () => {
  it("has all the structured content fields filled in", () => {
    expect(WELCOME_HIPAA_CONTENT.whatIsHipaa).toMatch(/Health Insurance Portability and Accountability Act/i);
    expect(WELCOME_HIPAA_CONTENT.whyItMattersAtBlossom).toMatch(/HIPAA-covered entity/i);
    expect(WELCOME_HIPAA_CONTENT.phiDefinition.examples.length).toBeGreaterThanOrEqual(5);
    expect(WELCOME_HIPAA_CONTENT.threeMainRules.map((r) => r.title)).toEqual([
      "Privacy Rule",
      "Security Rule",
      "Breach Notification Rule",
    ]);
    expect(WELCOME_HIPAA_CONTENT.minimumNecessary).toMatch(/Minimum Necessary/);
    expect(WELCOME_HIPAA_CONTENT.dailyRules.length).toBeGreaterThanOrEqual(8);
    expect(WELCOME_HIPAA_CONTENT.breachExamples.length).toBeGreaterThanOrEqual(5);
    expect(WELCOME_HIPAA_CONTENT.whatToDoIfMistake.length).toBeGreaterThanOrEqual(4);
  });

  it("includes at least 3 video resource links and at least 1 official HHS reference", () => {
    const videos = WELCOME_HIPAA_CONTENT.resourceLinks.filter((l) => l.kind === "video");
    const refs = WELCOME_HIPAA_CONTENT.resourceLinks.filter((l) => l.kind === "reference");
    expect(videos.length).toBeGreaterThanOrEqual(3);
    expect(refs.length).toBeGreaterThanOrEqual(1);
    for (const v of videos) {
      expect(v.url).toMatch(/youtube\.com/);
    }
    for (const r of refs) {
      expect(r.url).toMatch(/hhs\.gov/);
    }
  });

  it("learner page renders the HIPAA section and resource block", () => {
    const PAGE = require("node:fs").readFileSync("src/pages/os/OSWelcomeToBlossom.tsx", "utf8");
    expect(PAGE).toMatch(/welcome-hipaa-section/);
    expect(PAGE).toMatch(/welcome-hipaa-resources/);
    expect(PAGE).toMatch(/WELCOME_HIPAA_CONTENT/);
  });
});

describe("Training Management welcome view + learner page + clean encoding", () => {
  const TMC = fs.readFileSync("src/pages/hr/TrainingManagementCenter.tsx", "utf8");
  const PAGE = fs.readFileSync("src/pages/os/OSWelcomeToBlossom.tsx", "utf8");

  it("Training Management reads from ONBOARDING_PHASES welcome and shows Steps stat", () => {
    expect(TMC).toMatch(/ONBOARDING_PHASES\.find\(\(p\) => p\.id === "welcome"\)/);
    expect(TMC).toMatch(/label="Steps"/);
    expect(TMC).toMatch(/welcome\.modules\.length/);
    expect(TMC).toMatch(/phase_id: "welcome"/);
    expect(TMC).toMatch(/Universal onboarding for every Blossom employee/);
  });

  it("Training Management surfaces an admin status row (video loaded + letters)", () => {
    expect(TMC).toMatch(/welcome-admin-status/);
    expect(TMC).toMatch(/Welcome video/);
    expect(TMC).toMatch(/leadership letters present/);
  });

  it("learner page renders the 7-module sequence with letter type chips", () => {
    expect(PAGE).toMatch(/welcome-module-sequence/);
    expect(PAGE).toMatch(/WELCOME_TO_BLOSSOM_MODULES\.map/);
    expect(PAGE).toMatch(/data-module-type=\{m\.moduleType\}/);
    expect(PAGE).toMatch(/Welcome Letter from Chad|displayTitle/);
  });

  for (const f of TOUCHED_FILES) {
    it(`no mojibake artifacts in ${f}`, () => {
      const src = fs.readFileSync(f, "utf8");
      expect(MOJIBAKE.test(src)).toBe(false);
    });
  }
});