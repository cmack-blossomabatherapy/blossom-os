import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

// Each operational Recruiting page must import the matching live read hook
// and the centralized mutations hook, so writes go to Supabase tables rather
// than living only in local React state.
const PAGES: Array<{ file: string; hooks: string[] }> = [
  { file: "src/pages/os/OSRecruitingOffers.tsx",           hooks: ["useRecruitingOffers", "useRecruitingMutations"] },
  { file: "src/pages/os/OSRecruitingBackgroundChecks.tsx", hooks: ["useRecruitingBackgroundChecks", "useRecruitingMutations"] },
  { file: "src/pages/os/OSRecruitingOrientation.tsx",      hooks: ["useRecruitingOrientation", "useRecruitingMutations"] },
  { file: "src/pages/os/OSRecruitingOnboarding.tsx",       hooks: ["useRecruitingOnboarding", "useRecruitingMutations"] },
  { file: "src/pages/os/OSRecruitingFollowUps.tsx",        hooks: ["useRecruitingFollowups", "useRecruitingMutations"] },
  { file: "src/pages/os/OSRecruitingMessages.tsx",         hooks: ["useRecruitingMessages", "useRecruitingMutations"] },
  { file: "src/pages/os/OSRecruitingEscalations.tsx",      hooks: ["useRecruitingEscalations", "useRecruitingMutations"] },
  { file: "src/pages/os/OSRecruitingStaffingNeeds.tsx",    hooks: ["useRecruitingStaffingNeeds", "useRecruitingMutations"] },
  { file: "src/pages/os/OSRecruitingInterviews.tsx",       hooks: ["useRecruitingInterviews", "useRecruitingMutations"] },
];

describe("Recruiting Pass 3 — operational pages use live tables", () => {
  for (const { file, hooks } of PAGES) {
    for (const h of hooks) {
      it(`${file} imports ${h}`, () => {
        const src = read(file);
        expect(src).toMatch(new RegExp(h));
      });
    }
  }

  it("useRecruitingMutations exposes the Pass 3 helper surface", () => {
    const src = read("src/hooks/useRecruitingMutations.ts");
    for (const fn of [
      "logActivity", "updateCandidateAndLog", "archiveCandidate",
      "upsertInterviewForCandidate", "completeInterview", "markInterviewNoShow",
      "upsertOfferForCandidate", "sendOfferInternal",
      "upsertBackgroundForCandidate", "startBackgroundCheck",
      "upsertOrientationForCandidate", "markOrientationMissed",
      "createOnboardingTask", "ensureDefaultOnboardingTasks",
      "createFollowup", "createEscalation",
      "updateMessage", "markMessageRead", "markMessageHandled",
    ]) {
      expect(src).toMatch(new RegExp(`\\b${fn}\\b`));
    }
  });

  it("performance page references live Recruiting tables (not just static metrics)", () => {
    const src = read("src/pages/os/OSRecruitingPerformance.tsx");
    expect(src).toMatch(/useRecruitingCandidates|useRecruitingInterviews/);
    expect(src).toMatch(/useRecruitingOffers/);
  });
});
