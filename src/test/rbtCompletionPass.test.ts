// Rewritten to assert the CURRENT shipping RBT contract: a mobile-first
// `/rbt/app/*` menu (Home/Schedule/Learn/Support/Me), with the legacy
// `/rbt/*` paths still mounted for redirect/back-compat coverage.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const APP_TSX = readFileSync(path.resolve(__dirname, "../App.tsx"), "utf8");

// Current shipping mobile-first RBT menu paths.
const RBT_APP_PATHS = [
  "/rbt/app/home",
  "/rbt/app/schedule",
  "/rbt/app/learn",
  "/rbt/app/support",
  "/rbt/app/me",
];

// Sub-routes rendered under the /rbt/app shell that must remain mounted.
const RBT_APP_SUBROUTES = [
  "home", "schedule", "learn", "support", "me",
  "clients", "hours", "supervision", "performance", "readiness",
];

describe("RBT completion pass — current mobile-first shipping contract", () => {
  const menu = ROLE_MENUS.rbt;
  const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));

  it("exposes an RBT menu with the mobile-first tabs only", () => {
    expect(menu).toBeDefined();
    for (const required of RBT_APP_PATHS) {
      expect(paths, `RBT menu missing ${required}`).toContain(required);
    }
  });

  it("does not surface /reports, AI, or coming-soon links in the RBT menu", () => {
    expect(paths.filter((p) => p === "/reports" || p.startsWith("/reports?"))).toEqual([]);
    for (const p of paths) {
      expect(p).not.toMatch(/^\/ai(\/|$)/);
      expect(p).not.toMatch(/coming-soon/i);
    }
  });

  it("does not surface global Academy or Resource Library entries", () => {
    expect(paths).not.toContain("/academy");
    expect(paths).not.toContain("/training");
    expect(paths).not.toContain("/resource-library");
  });

  it("mounts every /rbt/app child route inside the RbtAppShell", () => {
    for (const sub of RBT_APP_SUBROUTES) {
      expect(APP_TSX, `App.tsx missing /rbt/app child route "${sub}"`).toMatch(
        new RegExp(`<Route\\s+path="${sub}"`),
      );
    }
  });

  it("redirects legacy /rbt/reports to the shared /reports page", () => {
    expect(APP_TSX).toMatch(/path="\/rbt\/reports"[\s\S]{0,180}to="\/reports\?audience=rbt"/);
  });

  it("exposes the useRbtWorkflow hook for self-scoped RBT data", async () => {
    const mod = await import("@/hooks/useRbtWorkflow");
    expect(typeof mod.useRbtWorkflow).toBe("function");
  });
});