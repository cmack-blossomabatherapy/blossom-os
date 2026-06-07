import { describe, it, expect } from "vitest";
import {
  SD_JOURNEY_STRUCTURE,
  getTrainings,
  type Training,
} from "@/lib/training/academyData";
import { getStateDirectorFullContent } from "@/lib/training/stateDirectorFullTraining";
import {
  SD_W1_FULL_CONTENT,
  SD_W1_TRAINING_SPECS,
} from "@/lib/training/sdWeek1Content";
import {
  WELCOME_LEADERSHIP_LETTERS,
  WELCOME_TO_BLOSSOM_MODULES,
} from "@/lib/training/welcomeToBlossomContent";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

function moduleIdFor(week: number, day: number, title: string): string {
  return `sd-w${week}d${day}-${slugify(title)}`;
}

const PLACEHOLDER_FALLBACK = "A State Director does not perform every task";

describe("State Director Week 1 — full content pass", () => {
  const week1 = SD_JOURNEY_STRUCTURE.find((w) => w.week === 1)!;
  const week1Modules: Training[] = week1.days.flatMap((d) =>
    d.modules.map((title) => {
      const id = moduleIdFor(1, d.day, title);
      const t = getTrainings().find((x: Training) => x.id === id);
      if (!t) throw new Error(`Week 1 training missing: ${id}`);
      return t;
    }),
  );

  it("every Week 1 module has a curated SDFullContent payload", () => {
    for (const t of week1Modules) {
      const c = getStateDirectorFullContent(t);
      expect(c, `missing full content for ${t.id}`).toBeTruthy();
      expect(c!.learningObjective.length).toBeGreaterThan(10);
      expect(c!.stepByStep.length).toBeGreaterThanOrEqual(5);
      expect(c!.sop.process.length).toBeGreaterThanOrEqual(3);
      expect(c!.scenario.situation.length).toBeGreaterThan(10);
      expect(c!.knowledgeCheck.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every Week 1 module has whyItMatters, whatToDo, completionEvidence, reflectionPrompt", () => {
    for (const t of week1Modules) {
      expect(t.whyItMatters, `whyItMatters missing for ${t.id}`).toBeTruthy();
      expect(t.whatToDo, `whatToDo missing for ${t.id}`).toBeTruthy();
      expect(t.completionEvidence, `completionEvidence missing for ${t.id}`).toBeTruthy();
      expect(t.reflectionPrompt, `reflectionPrompt missing for ${t.id}`).toBeTruthy();
    }
  });

  it("no Week 1 module uses the generic placeholder language only", () => {
    for (const t of week1Modules) {
      expect(t.whyItMatters ?? "").not.toContain(PLACEHOLDER_FALLBACK);
      // whyItMatters must be at least 40 chars of real content
      expect((t.whyItMatters ?? "").length).toBeGreaterThan(40);
    }
  });

  it("SD_W1_FULL_CONTENT covers Day 2–Day 5 modules", () => {
    for (const day of [2, 3, 4, 5]) {
      const d = week1.days.find((x) => x.day === day)!;
      for (const title of d.modules) {
        const id = moduleIdFor(1, day, title);
        expect(SD_W1_FULL_CONTENT[id], `curated full content missing: ${id}`).toBeTruthy();
      }
    }
  });

  it("SD_W1_TRAINING_SPECS covers every Week 1 module title", () => {
    for (const d of week1.days) {
      for (const title of d.modules) {
        expect(SD_W1_TRAINING_SPECS[title], `Training spec missing for: ${title}`).toBeTruthy();
      }
    }
  });
});

describe("Welcome to Blossom — leadership letters", () => {
  it("includes a full Chad Kaufman letter", () => {
    const chad = WELCOME_LEADERSHIP_LETTERS.find((l) => l.id === "ceo");
    expect(chad).toBeTruthy();
    expect(chad!.name).toMatch(/Chad Kaufman/);
    expect(chad!.paragraphs.length).toBeGreaterThanOrEqual(5);
    expect(chad!.signoff).toMatch(/Chad Kaufman/);
  });

  it("includes a full Shira Lasry letter", () => {
    const shira = WELCOME_LEADERSHIP_LETTERS.find((l) => l.id === "doo");
    expect(shira).toBeTruthy();
    expect(shira!.name).toMatch(/Shira Lasry/);
    expect(shira!.paragraphs.length).toBeGreaterThanOrEqual(5);
    expect(shira!.signoff).toMatch(/Shira Lasry/);
  });

  it("welcome modules include CEO and DOO letter entries", () => {
    const ceo = WELCOME_TO_BLOSSOM_MODULES.find((m) => m.id === "welcome-letter-ceo");
    const doo = WELCOME_TO_BLOSSOM_MODULES.find((m) => m.id === "welcome-letter-doo");
    expect(ceo).toBeTruthy();
    expect(doo).toBeTruthy();
  });
});