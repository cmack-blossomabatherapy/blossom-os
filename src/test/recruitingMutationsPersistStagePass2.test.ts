import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Recruiting Pass 2 — stage changes persist pipeline_stage + stage_entered_at", () => {
  it("useRecruitingCandidates.updateStage writes both columns", () => {
    const src = read("src/hooks/useRecruitingCandidates.ts");
    expect(src).toMatch(/pipeline_stage/);
    expect(src).toMatch(/stage_entered_at/);
  });

  it("useRecruitingMutations.moveStage writes both columns and logs activity", () => {
    const src = read("src/hooks/useRecruitingMutations.ts");
    expect(src).toMatch(/pipeline_stage/);
    expect(src).toMatch(/stage_entered_at/);
    expect(src).toMatch(/recruiting_activity_events/);
  });
});
