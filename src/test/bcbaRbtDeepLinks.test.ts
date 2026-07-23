import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const APP = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf8");

// Canonical BCBA + RBT paths that must be mounted (either as <Route path=…>
// or as a <Navigate to=…> alias). These are the destinations referenced by
// role menus, BCBA Home deep links, RBT bottom nav, and the Experience Lab.
const REQUIRED_PATHS = [
  // BCBA
  "/bcba/home", "/bcba/caseload", "/bcba/rbts", "/bcba/trainees",
  "/bcba/supervision", "/bcba/assessments", "/bcba/progress-reports",
  "/bcba/parent-training", "/bcba/productivity", "/bcba/support",
  "/bcba/support-center", "/bcba/academy", "/bcba/me", "/bcba/fellowship",
  "/bcba/clinical", "/bcba/copilot",
  // RBT app
  "/rbt/app/home", "/rbt/app/schedule", "/rbt/app/clients", "/rbt/app/learn",
  "/rbt/app/support", "/rbt/app/me", "/rbt/app/growth", "/rbt/app/hours",
  "/rbt/app/supervision", "/rbt/app/credentials", "/rbt/app/performance",
  "/rbt/app/program", "/rbt/app/welcome", "/rbt/app/first-case",
  "/rbt/app/readiness", "/rbt/app/preboarding", "/rbt/app/journey",
];

describe("BCBA + RBT deep links are mounted in App.tsx", () => {
  for (const p of REQUIRED_PATHS) {
    it(`mounts ${p}`, () => {
      const re = new RegExp(`path=["']${p.replace(/\//g, "\\/")}["']`);
      expect(re.test(APP), `App.tsx is missing a Route for ${p}`).toBe(true);
    });
  }

  it("BCBA Home deep link to My RBTs uses canonical /bcba/rbts (not /bcba/my-rbts)", () => {
    const home = fs.readFileSync(
      path.join(process.cwd(), "src/pages/bcba/home/useBcbaHomeData.ts"),
      "utf8",
    );
    expect(home).not.toMatch(/\/bcba\/my-rbts/);
    expect(home).toMatch(/\/bcba\/rbts/);
  });
});
