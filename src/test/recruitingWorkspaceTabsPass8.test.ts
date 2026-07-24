import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const REQUIRED_TABS = [
  "/recruiting/workspace",
  "/recruiting/pipeline",
  "/recruiting/rbt",
  "/recruiting/bcba",
  "/recruiting/interviews",
  "/recruiting/offers",
  "/recruiting/background",
  "/recruiting/onboarding",
  "/recruiting/orientation",
  "/recruiting/staffing-needs",
  "/recruiting/map",
  "/recruiting/follow-ups",
  "/recruiting/messages",
  "/recruiting/escalations",
  "/recruiting/performance",
  "/recruiting/resources",
];

const FORBIDDEN_IN_MENUS = [
  "/coming-soon",
  "/reports/hr-recruiting-pipeline",
  "/reports/ai/new",
  "/reports/ai/:id",
];

describe("Recruiting Pass 8 — workspace tabs cover the full active surface", () => {
  const workspaces = read("src/lib/os/workspaces.ts");

  // Extract the recruiting workspace tabs block.
  const start = workspaces.indexOf('id: "recruiting"');
  expect(start).toBeGreaterThan(-1);
  const tabsIdx = workspaces.indexOf("tabs:", start);
  const end = workspaces.indexOf("],", tabsIdx);
  const block = workspaces.slice(tabsIdx, end);

  for (const path of REQUIRED_TABS) {
    it(`workspace tab includes ${path}`, () => {
      expect(block).toContain(`"${path}"`);
    });
  }

  for (const bad of FORBIDDEN_IN_MENUS) {
    it(`workspace tab does not include ${bad}`, () => {
      expect(block).not.toContain(`"${bad}"`);
    });
  }
});

describe("Recruiting Pass 8 — mounted routes and menus stay aligned", () => {
  const app = read("src/App.tsx");
  const menus = read("src/lib/os/roleMenus.ts");
  const workspaces = read("src/lib/os/workspaces.ts");

  for (const path of REQUIRED_TABS) {
    it(`App.tsx mounts ${path}`, () => {
      expect(app).toContain(`path="${path}"`);
    });
  }

  for (const bad of FORBIDDEN_IN_MENUS) {
    it(`roleMenus.ts does not reference ${bad}`, () => {
      expect(menus).not.toContain(`"${bad}"`);
    });
    it(`workspaces.ts does not reference ${bad}`, () => {
      expect(workspaces).not.toContain(`"${bad}"`);
    });
  }
});

describe("Recruiting Pass 8 — Pass 7 guarantees are preserved", () => {
  it("OSRecruitingPerformance does not import removed static demo data", () => {
    const src = read("src/pages/os/OSRecruitingPerformance.tsx");
    expect(src).not.toMatch(/@\/data\/recruitingDashboard/);
    expect(src).not.toMatch(/mockRBTProfiles/);
    expect(src).not.toMatch(/getClientStaffingNeeds/);
  });

  const workflowPages = [
    "src/pages/os/OSRecruitingInterviews.tsx",
    "src/pages/os/OSRecruitingOffers.tsx",
    "src/pages/os/OSRecruitingBackgroundChecks.tsx",
    "src/pages/os/OSRecruitingOrientation.tsx",
    "src/pages/os/OSRecruitingOnboarding.tsx",
    "src/pages/os/OSRecruitingRBT.tsx",
    "src/pages/os/OSRecruitingBCBA.tsx",
    "src/pages/os/OSRecruitingEscalations.tsx",
  ];

  for (const file of workflowPages) {
    it(`${file} does not use local-only stageMap state`, () => {
      let src = "";
      try { src = read(file); } catch { return; }
      expect(src).not.toMatch(/setStageMap/);
      expect(src).not.toMatch(/const\s*\[\s*stageMap\s*,/);
    });
  }
});