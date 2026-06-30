import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

// These operational pages historically held the workflow in local-only state
// (stageMap / readMap / synthetic builders). Pass 3 requires they also write
// to live tables via useRecruitingMutations.
const STAGE_PAGES = [
  "src/pages/os/OSRecruitingOffers.tsx",
  "src/pages/os/OSRecruitingBackgroundChecks.tsx",
  "src/pages/os/OSRecruitingOrientation.tsx",
  "src/pages/os/OSRecruitingOnboarding.tsx",
  "src/pages/os/OSRecruitingStaffingNeeds.tsx",
  "src/pages/os/OSRecruitingInterviews.tsx",
  "src/pages/os/OSRecruitingRBT.tsx",
  "src/pages/os/OSRecruitingBCBA.tsx",
];

describe("Recruiting Pass 3 — no local-only workflow regressions", () => {
  for (const file of STAGE_PAGES) {
    it(`${file}: moveStage persists via mutations (not setStageMap only)`, () => {
      const src = read(file);
      // Capture the moveStage function body
      const m = src.match(/function moveStage\([^)]*\)\s*\{([\s\S]*?)\n\s*\}/);
      expect(m, "moveStage function not found").toBeTruthy();
      const body = m![1];
      expect(body).toMatch(/setStageMap/);
      // Must also reach a real mutation call OR the canonical-mapper helper
      // (runPageStageMove internally invokes mutations.moveStage / child-table
      // upserts and is the Pass 4 standard pattern).
      expect(body).toMatch(
        /(mutations\.(moveStage|createFollowup|resolveEscalation|markMessageRead|markStaffingNeedWorking|updateStaffingNeed|closeStaffingNeed|linkCandidateToStaffingNeed)|runPageStageMove\(mutations)/,
      );
      // Pass 4 invariants: no unsafe casts of board substage keys onto candidate stages.
      expect(body).not.toMatch(/as unknown as any/);
      expect(body).not.toMatch(/\bas any\b/);
    });
  }

  it("Follow-ups page does not rely solely on buildFollowUps(candidates)", () => {
    const src = read("src/pages/os/OSRecruitingFollowUps.tsx");
    expect(src).toMatch(/useRecruitingFollowups/);
    expect(src).toMatch(/useRecruitingMutations/);
  });

  it("Messages page does not rely solely on buildMessages(candidates)", () => {
    const src = read("src/pages/os/OSRecruitingMessages.tsx");
    expect(src).toMatch(/useRecruitingMessages/);
    expect(src).toMatch(/useRecruitingMutations/);
    // read/handled actions must persist, not stay in readMap only.
    expect(src).toMatch(/markMessageRead|markMessageHandled/);
  });

  it("Escalations page wires real escalation resolution", () => {
    const src = read("src/pages/os/OSRecruitingEscalations.tsx");
    expect(src).toMatch(/useRecruitingEscalations/);
    expect(src).toMatch(/mutations\.resolveEscalation/);
  });
});
