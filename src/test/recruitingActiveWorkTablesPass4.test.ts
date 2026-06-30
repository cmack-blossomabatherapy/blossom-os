import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Recruiting Pass 4 — active work backed by real tables", () => {
  it("FollowUps active list comes from useRecruitingFollowups and no synthetic builder powers it", () => {
    const src = read("src/pages/os/OSRecruitingFollowUps.tsx");
    expect(src).toMatch(/useRecruitingFollowups/);
    expect(src).toMatch(/liveFollowups/);
    // Synthetic builder, if present at all, must be a "Suggested" helper, not the active source.
    expect(src).not.toMatch(/\bbuildFollowUps\s*\(/);
  });

  it("Messages active list comes from useRecruitingMessages and readMap is gone", () => {
    const src = read("src/pages/os/OSRecruitingMessages.tsx");
    expect(src).toMatch(/useRecruitingMessages/);
    expect(src).toMatch(/liveMessages/);
    expect(src).not.toMatch(/\bbuildMessages\s*\(/);
    expect(src).not.toMatch(/\breadMap\b/);
    // Real persistence helpers wired:
    expect(src).toMatch(/markMessageRead|markMessageHandled/);
  });

  it("Escalations page does not use useWorkflowStages", () => {
    const src = read("src/pages/os/OSRecruitingEscalations.tsx");
    expect(src).not.toMatch(/useWorkflowStages/);
    expect(src).toMatch(/useRecruitingEscalations/);
    expect(src).toMatch(/resolveEscalation/);
  });

  it("StaffingNeeds page wires real Recruiting staffing-need helpers", () => {
    const src = read("src/pages/os/OSRecruitingStaffingNeeds.tsx");
    expect(src).toMatch(/useRecruitingStaffingNeeds/);
    expect(src).toMatch(/liveStaffingNeeds/);
    for (const fn of [
      "createStaffingNeed",
      "updateStaffingNeed",
      "markStaffingNeedWorking",
      "closeStaffingNeed",
      "linkCandidateToStaffingNeed",
    ]) {
      expect(src, `${fn} reference`).toMatch(new RegExp(fn));
    }
  });

  it("useRecruitingMutations exposes the Pass 4 staffing-need helpers", () => {
    const src = read("src/hooks/useRecruitingMutations.ts");
    for (const fn of [
      "createStaffingNeed",
      "updateStaffingNeed",
      "markStaffingNeedWorking",
      "closeStaffingNeed",
      "linkCandidateToStaffingNeed",
    ]) {
      expect(src, `${fn} export`).toMatch(new RegExp(`\\b${fn}\\b`));
    }
  });
});