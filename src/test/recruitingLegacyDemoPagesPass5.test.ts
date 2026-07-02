import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

// Pass 5/6: The pre-OS demo Recruiting pages must either be deleted or exist
// only as redirect shims. They must never re-introduce local candidate state
// or "Future integration" placeholder copy for wired workflows.

const LEGACY = [
  "src/pages/Recruiting.tsx",
  "src/pages/RecruitingDashboard.tsx",
];

describe("Recruiting Pass 5 — legacy demo pages are redirect-only", () => {
  for (const file of LEGACY) {
    it(`${file} is a redirect shim (or deleted)`, () => {
      const full = path.join(process.cwd(), file);
      if (!fs.existsSync(full)) return; // deleted is acceptable
      const src = read(file);
      expect(src).toMatch(/Navigate|<Navigate/);
      expect(src).not.toMatch(/recruitingCandidates/);
      expect(src).not.toMatch(/from "@\/data\/recruitingDashboard"/);
      expect(src).not.toMatch(/Future integration/i);
      expect(src).not.toMatch(/Bulk update complete/);
      expect(src).not.toMatch(/New candidate shell created/);
      expect(src).not.toMatch(/Export prepared/);
      expect(src).not.toMatch(/Opened Apploi profile/);
    });
  }
});
