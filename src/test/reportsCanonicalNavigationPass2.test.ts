import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

// Files whose visible nav must not surface legacy /xxx/reports destinations.
const NAV_SOURCES = [
  "src/lib/os/roleMenus.ts",
  "src/lib/os/workspaces.ts",
  "src/lib/navigationAccess.ts",
  "src/components/layout/AppSidebar.tsx",
  "src/pages/AdminHub.tsx",
];

const BANNED_NAV_PATHS = [
  "/hr/reports",
  "/marketing/reports",
  "/credentialing/reports",
  "/blossom/reports",
  "/intelligence/reports",
  "/admin/hr/reports",
];

const REDIRECT_ONLY = [
  "/blossom/reports",
  "/intelligence/reports",
  "/admin/hr/reports",
];

describe("Reports — canonical /reports nav (Pass 2)", () => {
  for (const file of NAV_SOURCES) {
    it(`${file} does not list legacy report routes in visible nav`, () => {
      const src = read(file);
      for (const p of BANNED_NAV_PATHS) {
        // Allow as redirect targets / comments only; nav entries use quoted path strings
        // immediately after a label / `path:` key. We use a loose check for quoted occurrences.
        const quoted = new RegExp(`["']${p}["']`);
        expect(src).not.toMatch(quoted);
      }
    });
  }

  it("OSShell live paths use canonical /reports", () => {
    const src = read("src/pages/os/OSShell.tsx");
    expect(src).not.toMatch(/["']\/marketing\/reports["']/);
  });

  it("/reports route remains mounted in App.tsx", () => {
    const app = read("src/App.tsx");
    expect(app).toContain('path="/reports"');
  });

  for (const p of REDIRECT_ONLY) {
    it(`legacy route ${p} is only mounted as a Navigate redirect`, () => {
      const app = read("src/App.tsx");
      const route = new RegExp(`<Route\\s+path="${p.replace(/\//g, "\\/")}"\\s+element=\\{<Navigate`);
      expect(app).toMatch(route);
    });
  }
});
