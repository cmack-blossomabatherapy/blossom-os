import { describe, it, expect } from "vitest";
import {
  SD_JOURNEY_STRUCTURE,
  getTrainings,
  type Training,
} from "@/lib/training/academyData";
import { getStateDirectorFullContent } from "@/lib/training/stateDirectorFullTraining";
import {
  SD_W45_FULL_CONTENT,
  SD_W45_TRAINING_SPECS,
} from "@/lib/training/sdWeek45Content";

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

describe("State Director Weeks 4 & 5 — full content pass", () => {
  const weeks = [4, 5] as const;

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

    it(`SD_W45_FULL_CONTENT covers every Week ${weekNum} module`, () => {
      for (const d of week.days) {
        for (const title of d.modules) {
          const id = moduleIdFor(weekNum, d.day, title);
          expect(SD_W45_FULL_CONTENT[id], `curated full content missing: ${id}`).toBeTruthy();
        }
      }
    });

    it(`SD_W45_TRAINING_SPECS covers every Week ${weekNum} module title`, () => {
      for (const d of week.days) {
        for (const title of d.modules) {
          expect(
            SD_W45_TRAINING_SPECS[title],
            `Training spec missing for: ${title}`,
          ).toBeTruthy();
        }
      }
    });
  }

  it("every Week 4 shadowing module is typed Shadowing and carries observation + sign-off language", () => {
    const shadowTitles = [
      "Scheduling Shadow",
      "Recruiting Shadow",
      "BCBA Shadow",
      "State Director Shadow",
    ];
    const trainings = getTrainings();
    for (const title of shadowTitles) {
      const id = moduleIdFor(4, 5, title);
      const t = trainings.find((x) => x.id === id)!;
      expect(t.type).toBe("Shadowing");
      const c = SD_W45_FULL_CONTENT[id];
      const blob = JSON.stringify(c).toLowerCase();
      expect(blob).toMatch(/observ/);
      expect(blob).toMatch(/pre-shadow|pre shadow/);
      expect(blob).toMatch(/debrief|post-shadow|reflection/);
      expect(blob).toMatch(/mentor sign-off|sign-off/);
    }
  });

  it("final readiness modules include readiness/sign-off/certification language", () => {
    const finalTitles = [
      "Final Knowledge Review",
      "Readiness Assessment",
      "Leadership Sign-Off",
      "State Director Certification",
    ];
    for (const title of finalTitles) {
      const id = moduleIdFor(5, 5, title);
      const c = SD_W45_FULL_CONTENT[id];
      expect(c, `missing curated content for ${id}`).toBeTruthy();
      const blob = JSON.stringify(c).toLowerCase();
      expect(blob).toMatch(/readiness|sign-off|certification/);
    }
  });
});