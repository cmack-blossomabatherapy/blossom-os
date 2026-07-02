import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

// Pass 5: Recruiting workflow pages that expose an operational board must
// derive from live Supabase rows / persisted candidate fields — NOT synthetic
// demo builders.

describe("Recruiting Pass 5 — rendered data sources", () => {
  it("Staffing Needs active board is live, not from getClientStaffingNeeds()", () => {
    const src = read("src/pages/os/OSRecruitingStaffingNeeds.tsx");
    expect(src).not.toMatch(/\bgetClientStaffingNeeds\s*\(/);
    expect(src).not.toMatch(/\bmockRBTProfiles\b/);
    expect(src).toMatch(/useRecruitingStaffingNeeds/);
    expect(src).toMatch(/liveStaffingNeeds/);
  });

  it("Follow-ups page keeps live rows as the rendered base", () => {
    const src = read("src/pages/os/OSRecruitingFollowUps.tsx");
    expect(src).toMatch(/useRecruitingFollowups/);
  });

  it("Messages page keeps live rows as the rendered base", () => {
    const src = read("src/pages/os/OSRecruitingMessages.tsx");
    expect(src).toMatch(/useRecruitingMessages/);
  });
});
