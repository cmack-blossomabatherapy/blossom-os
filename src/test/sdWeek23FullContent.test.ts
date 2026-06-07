import { describe, it, expect } from "vitest";
import {
  SD_JOURNEY_STRUCTURE,
  getTrainings,
  type Training,
} from "@/lib/training/academyData";
import { getStateDirectorFullContent } from "@/lib/training/stateDirectorFullTraining";
import {
  SD_W23_FULL_CONTENT,
  SD_W23_TRAINING_SPECS,
} from "@/lib/training/sdWeek23Content";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

function moduleIdFor(week: number, day: number, title: string): string {
  return `sd-w${week}d${day}-${slugify(title)}`;
}

const GENERIC_FALLBACK_PHRASES = [
  "is load-bearing for week",
  "Weak here, weak everywhere downstream",
];

describe("State Director Weeks 2 & 3 — full content pass", () => {
  const weeks = [2, 3] as const;

  for (const weekNum of weeks) {
    const week = SD_JOURNEY_STRUCTURE.find((w) => w.week === weekNum)!;
    const modules: Training[] = week.days.flatMap((d) =>
      d.modules.map((title) => {
        const id = moduleIdFor(weekNum, d.day, title);
        const t = getTrainings().find((x) => x.id === id);
        if (!t) throw new Error(`Week ${weekNum} training missing: ${id}`);
        return t;
      }),
    );

    it(`every Week ${weekNum} module has a curated SDFullContent payload`, () => {
      for (const t of modules) {
        const c = getStateDirectorFullContent(t);
        expect(c, `missing full content for ${t.id}`).toBeTruthy();
        expect(c!.learningObjective.length).toBeGreaterThan(10);
        expect(c!.stepByStep.length).toBeGreaterThanOrEqual(1);
        expect(c!.sop.process.length).toBeGreaterThanOrEqual(3);
        expect(c!.scenario.situation.length).toBeGreaterThan(10);
        expect(c!.scenario.expectedResponse.length).toBeGreaterThan(10);
        expect(c!.knowledgeCheck.length).toBeGreaterThanOrEqual(2);
      }
    });

    it(`every Week ${weekNum} module has whyItMatters, whatToDo, completionEvidence, reflectionPrompt`, () => {
      for (const t of modules) {
        expect(t.whyItMatters, `whyItMatters missing for ${t.id}`).toBeTruthy();
        expect(t.whatToDo, `whatToDo missing for ${t.id}`).toBeTruthy();
        expect(t.completionEvidence, `completionEvidence missing for ${t.id}`).toBeTruthy();
        expect(t.reflectionPrompt, `reflectionPrompt missing for ${t.id}`).toBeTruthy();
      }
    });

    it(`no Week ${weekNum} module uses the generic fallback language`, () => {
      for (const t of modules) {
        for (const phrase of GENERIC_FALLBACK_PHRASES) {
          expect(t.whyItMatters ?? "", `${t.id} uses generic fallback`).not.toContain(phrase);
        }
        expect((t.whyItMatters ?? "").length).toBeGreaterThan(40);
      }
    });

    it(`SD_W23_FULL_CONTENT covers every Week ${weekNum} module`, () => {
      for (const d of week.days) {
        for (const title of d.modules) {
          const id = moduleIdFor(weekNum, d.day, title);
          expect(SD_W23_FULL_CONTENT[id], `curated full content missing: ${id}`).toBeTruthy();
        }
      }
    });

    it(`SD_W23_TRAINING_SPECS covers every Week ${weekNum} module title`, () => {
      for (const d of week.days) {
        for (const title of d.modules) {
          expect(
            SD_W23_TRAINING_SPECS[title],
            `Training spec missing for: ${title}`,
          ).toBeTruthy();
        }
      }
    });
  }
});