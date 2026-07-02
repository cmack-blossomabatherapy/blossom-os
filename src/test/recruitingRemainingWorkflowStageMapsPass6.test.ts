import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

// Pass 6: Active Recruiting workflow pages must no longer hold local-only
// stageMap / setStageMap workflow state. Persistence flows through
// runPageStageMove / useRecruitingMutations against Supabase.
const ACTIVE_WORKFLOW_PAGES = [
  "src/pages/os/OSRecruitingInterviews.tsx",
  "src/pages/os/OSRecruitingOffers.tsx",
  "src/pages/os/OSRecruitingBackgroundChecks.tsx",
  "src/pages/os/OSRecruitingOrientation.tsx",
  "src/pages/os/OSRecruitingOnboarding.tsx",
  "src/pages/os/OSRecruitingRBT.tsx",
  "src/pages/os/OSRecruitingBCBA.tsx",
  "src/pages/os/OSRecruitingEscalations.tsx",
];

describe("Recruiting Pass 6 — no local workflow stageMap in active pages", () => {
  for (const file of ACTIVE_WORKFLOW_PAGES) {
    it(`${file}: no setStageMap / local stageMap declaration`, () => {
      const src = read(file);
      expect(src).not.toMatch(/\bsetStageMap\b/);
      // Only the stageMapping helper import may mention "stageMap" — the local
      // workflow variable must be gone.
      expect(src).not.toMatch(/\bconst\s+\[stageMap\b/);
      expect(src).not.toMatch(/useState<Record<string, StageKey>>/);
    });
  }
});
