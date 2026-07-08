/**
 * Executive Leadership completion pass — final hardening tests.
 * Covers: org-chart routing, executive live-path allowlist, no duplicate
 * report links in menu, ExecResourceLibrary "coming soon" removal, and
 * Make.com internalOnly registry flag.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_SPECIFIC_LIVE_PATHS, STAGED_ROLE_LIVE_PATHS } from "@/pages/os/OSShell";
import { BLOSSOM_INTEGRATIONS } from "@/lib/os/integrations/integrationRegistry";

const appSrc = fs.readFileSync("src/App.tsx", "utf8");
const execRlSrc = fs.readFileSync(
  "src/pages/os/executive/ExecResourceLibrary.tsx",
  "utf8",
);

describe("Executive Leadership completion pass", () => {
  const execMenu = ROLE_MENUS.executive_leadership!;
  const execItems = execMenu.sections.flatMap((s) => s.items);
  const execPaths = execItems.map((i) => i.path);

  it("Executive Leadership menu includes /org-chart", () => {
    expect(execPaths).toContain("/org-chart");
  });

  it("every Executive Leadership menu path is live for the role", () => {
    const live = ROLE_SPECIFIC_LIVE_PATHS.executive_leadership!;
    for (const p of execPaths) {
      const isLive = STAGED_ROLE_LIVE_PATHS.has(p) || live.has(p);
      expect(isLive, `expected ${p} to be live for executive_leadership`).toBe(true);
    }
  });

  it("top-level /org-chart is not a redirect (canonical route)", () => {
    // The canonical /org-chart mounts <OrgChartPage />, not a <Navigate />.
    expect(appSrc).toMatch(/path="\/org-chart"[\s\S]{0,1200}OrgChartPage/);
    expect(appSrc).not.toMatch(
      /path="\/org-chart"\s+element=\{<Navigate\s+to="\/hr\/org-chart"/,
    );
  });

  it("no Executive menu item points to a deep report route", () => {
    for (const p of execPaths) {
      expect(p).not.toMatch(/^\/reports\/.+/);
    }
  });

  it("ExecResourceLibrary has no visible coming-soon text", () => {
    expect(execRlSrc).not.toMatch(/coming soon/i);
  });

  it("Make.com is flagged internalOnly in the integration registry", () => {
    const make = BLOSSOM_INTEGRATIONS.find((i) => i.id === "make");
    expect(make?.internalOnly).toBe(true);
  });

  it("Go Integrate Nava is present in the integration registry", () => {
    expect(BLOSSOM_INTEGRATIONS.some((i) => i.id === "go-integrate-nava")).toBe(true);
  });
});
