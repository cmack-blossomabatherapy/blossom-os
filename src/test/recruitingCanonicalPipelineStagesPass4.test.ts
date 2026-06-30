import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const STAGE_PAGES = [
  "src/pages/os/OSRecruitingOffers.tsx",
  "src/pages/os/OSRecruitingBackgroundChecks.tsx",
  "src/pages/os/OSRecruitingOrientation.tsx",
  "src/pages/os/OSRecruitingOnboarding.tsx",
  "src/pages/os/OSRecruitingRBT.tsx",
  "src/pages/os/OSRecruitingBCBA.tsx",
  "src/pages/os/OSRecruitingInterviews.tsx",
];

describe("Recruiting Pass 4 — canonical pipeline stages only", () => {
  for (const file of STAGE_PAGES) {
    it(`${file} does not cast board substages onto pipeline_stage`, () => {
      const src = read(file);
      expect(src).not.toMatch(/as unknown as any/);
      // Only allowed `as any` is the narrow live* type-coerce we use in
      // small filter callbacks; ensure moveStage path is clean.
      const move = src.match(/function moveStage\([^)]*\)\s*\{([\s\S]*?)\n\s*\}/);
      expect(move, "moveStage function").toBeTruthy();
      const body = move![1];
      expect(body).not.toMatch(/\bas any\b/);
      expect(body).not.toMatch(/pipeline_stage\s*:/);
      // Goes through the canonical mapper helper.
      expect(body).toMatch(/runPageStageMove\(mutations/);
    });
  }

  it("RBT page imports an explicit canonical mapper", () => {
    const src = read("src/pages/os/OSRecruitingRBT.tsx");
    expect(src).toMatch(/mapRbtStageToCanonical/);
  });

  it("BCBA page imports an explicit canonical mapper", () => {
    const src = read("src/pages/os/OSRecruitingBCBA.tsx");
    expect(src).toMatch(/mapBcbaStageToCanonical/);
  });

  it("stage mapping module exposes mappers for every workflow page", () => {
    const src = read("src/lib/recruiting/stageMapping.ts");
    for (const fn of [
      "mapOffersStageToCanonical",
      "mapBackgroundStageToCanonical",
      "mapOrientationStageToCanonical",
      "mapOnboardingStageToCanonical",
      "mapInterviewStageToCanonical",
      "mapRbtStageToCanonical",
      "mapBcbaStageToCanonical",
      "runPageStageMove",
    ]) {
      expect(src, `missing ${fn}`).toMatch(new RegExp(`\\b${fn}\\b`));
    }
  });
});