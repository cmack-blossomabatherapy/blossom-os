import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const REACHABLE = [
  "src/pages/os/OSRecruitingPipeline.tsx",
  "src/pages/os/OSRecruitingBCBA.tsx",
  "src/pages/os/OSRecruitingRBT.tsx",
  "src/pages/os/OSRecruitingInterviews.tsx",
  "src/pages/os/OSRecruitingMessages.tsx",
  "src/components/recruiting/RecruitingControlBar.tsx",
  "src/pages/Recruiting.tsx",
];

const BANNED = [
  /Synced to Apploi/,
  /Apploi sync queued/i,
  /Apploi sync is simulated/i,
  /simulated for demo operations/i,
];

describe("Recruiting Pass 2 — no fake Apploi sync language", () => {
  for (const file of REACHABLE) {
    it(`${file} contains no fake Apploi sync strings`, () => {
      const src = read(file);
      for (const pat of BANNED) expect(src).not.toMatch(pat);
    });
  }

  it("centralized Apploi helper exists and exposes notifyApploiNotConnected", () => {
    const src = read("src/lib/recruiting/apploi.ts");
    expect(src).toMatch(/notifyApploiNotConnected/);
    expect(src).toMatch(/not connected/i);
  });
});
