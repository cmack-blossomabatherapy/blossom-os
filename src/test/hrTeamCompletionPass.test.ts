import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_HOME } from "@/lib/os/roleHome";
import { ROLE_SPECIFIC_LIVE_PATHS } from "@/pages/os/OSShell";

const REQUIRED_HR_PATHS = [
  "/hr-team",
  "/hr/workspace",
  "/hr/new-hires",
  "/hr/orientation-queue",
  "/hr/training-certifications",
  "/hr/compliance",
  "/hr/employee-support",
  "/hr/requests",
  "/hr/evaluations",
  "/hr/messages",
  "/hr/team-resources",
  "/user-management",
  "/device-requests",
  "/device-inventory",
  "/phone",
  "/academy",
  "/resource-library",
  "/reports",
];

const BANNED_HR_PATHS = [
  "/hr/reports",
  "/admin/hr/reports",
  "/user-logins-vault",
  "/admin/login-vault",
  "/nfc-badges",
  "/hr/nfc-badge-support",
  "/ai/assistant",
];

const HR_PAGE_DIR = join(process.cwd(), "src/pages/os");
const HR_PAGE_FILES = readdirSync(HR_PAGE_DIR)
  .filter((f) => /^OSHR[A-Za-z]+\.tsx$/.test(f))
  .map((f) => join(HR_PAGE_DIR, f));

describe("HR Team completion pass — menu, live paths, AI cleanup", () => {
  for (const role of ["hr_team", "hr_lead"] as const) {
    const menu = ROLE_MENUS[role];
    const items = menu?.sections.flatMap((s) => s.items) ?? [];
    const paths = items.map((i) => i.path);
    const labels = items.map((i) => i.label);

    it(`${role} home is /hr-team`, () => {
      expect(ROLE_HOME[role]).toBe("/hr-team");
    });

    it(`${role} menu includes every required HR path`, () => {
      for (const p of REQUIRED_HR_PATHS) {
        expect(paths, `${role} missing ${p}`).toContain(p);
      }
    });

    it(`${role} menu contains no banned HR paths`, () => {
      for (const p of BANNED_HR_PATHS) {
        expect(paths, `${role} should not link to ${p}`).not.toContain(p);
      }
    });

    it(`${role} menu does not label anything "HR Reports"`, () => {
      expect(labels).not.toContain("HR Reports");
      // The shared Reports label may appear once
      const reports = items.filter((i) => i.path === "/reports");
      for (const r of reports) expect(r.label).toBe("Reports");
    });

    it(`${role} exposes every menu path in ROLE_SPECIFIC_LIVE_PATHS`, () => {
      const live = ROLE_SPECIFIC_LIVE_PATHS[role];
      expect(live, `${role} missing live-path entry`).toBeDefined();
      for (const p of paths) {
        expect(live!.has(p), `${role} live path missing ${p}`).toBe(true);
      }
    });
  }
});

describe("HR pages — no visible AI assistant CTAs", () => {
  it("has at least one HR page under audit", () => {
    expect(HR_PAGE_FILES.length).toBeGreaterThan(0);
  });

  for (const file of HR_PAGE_FILES) {
    const name = file.split("/").pop();
    const src = readFileSync(file, "utf8");

    it(`${name} has no visible /ai/assistant links`, () => {
      expect(src, `${name} still links to /ai/assistant`).not.toMatch(/["'`]\/ai\/assistant/);
    });

    it(`${name} has no "Operational Insights" section labels`, () => {
      expect(src, `${name} still labels a section "Operational Insights"`).not.toMatch(/Operational Insights/);
    });
  }
});