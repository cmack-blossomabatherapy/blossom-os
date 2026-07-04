import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const src = readFileSync(
  resolve(__dirname, "../pages/os/OSRecruitingEscalations.tsx"),
  "utf8",
);

describe("Recruiting Escalations — Pass 10 no synthetic fallback", () => {
  it("does not fall back to synthetic when live is empty", () => {
    expect(src).not.toMatch(/liveBase\.length\s*>\s*0\s*\?\s*liveBase\s*:\s*synthetic/);
    expect(src).not.toMatch(/still demonstrates the operational shape/);
  });

  it("primary base is assigned from liveBase only", () => {
    expect(src).toMatch(/const\s+base\s*=\s*useMemo<Esc\[\]>\(\(\)\s*=>\s*liveBase,\s*\[liveBase\]\)/);
  });

  it("keeps a separate candidate-derived suggested section", () => {
    expect(src).toMatch(/const\s+suggested\s*=\s*useMemo/);
    expect(src).toMatch(/Suggested escalations/);
  });

  it("shows a polished empty state for zero live escalations", () => {
    expect(src).toMatch(/No active recruiting escalations/);
    expect(src).toMatch(/Create Escalation/);
  });
});