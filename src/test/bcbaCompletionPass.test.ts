// Rewritten in release verification pass to assert the CURRENT shipping BCBA
// contract (mobile-first `/bcba/*` menu + dedicated BcbaShell) instead of the
// legacy sprint substring scans that were previously skipped.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const APP_TSX = readFileSync(path.resolve(__dirname, "../App.tsx"), "utf8");

// Current shipping BCBA workspace paths (source of truth: roleMenus.ts `bcba`).
const REQUIRED_BCBA_MENU_PATHS = [
  "/bcba/home",
  "/bcba/caseload",
  "/bcba/rbts",
  "/bcba/supervision",
  "/bcba/assessments",
  "/bcba/progress-reports",
  "/bcba/parent-training",
  "/bcba/productivity",
  "/bcba/clinical",
  "/bcba/fellowship",
  "/bcba/academy",
  "/bcba/support-center",
  "/bcba/me",
];

describe("BCBA completion pass — current shipping menu contract", () => {
  const menu = ROLE_MENUS.bcba;
  const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));

  it("exposes a BCBA menu", () => {
    expect(menu).toBeDefined();
  });

  it("includes every current BCBA workspace surface", () => {
    for (const required of REQUIRED_BCBA_MENU_PATHS) {
      expect(paths, `BCBA menu missing ${required}`).toContain(required);
    }
  });

  it("does not expose the retired flat operational paths", () => {
    // These lived in the old sprint menu but now belong to non-BCBA roles.
    for (const removed of ["/bcba/clients", "/bcba/workspace", "/bcba/scheduling", "/bcba/authorizations"]) {
      expect(paths, `BCBA menu should no longer expose ${removed}`).not.toContain(removed);
    }
  });

  it("has no /reports link in the BCBA menu (BCBA reports live under /bcba/*)", () => {
    expect(paths.filter((p) => p === "/reports" || p.startsWith("/reports?"))).toEqual([]);
    expect(paths.some((p) => /^\/bcba\/reports/.test(p))).toBe(false);
  });

  it("mounts every BCBA menu path in App.tsx", () => {
    for (const p of REQUIRED_BCBA_MENU_PATHS) {
      expect(APP_TSX, `App.tsx missing route for ${p}`).toContain(`path="${p}"`);
    }
  });

  it("redirects legacy /bcba/* paths to the current experience", () => {
    for (const [from, to] of [
      ["/bcba/workspace", "/bcba/home"],
      ["/bcba/clients", "/bcba/caseload"],
      ["/bcba/scheduling", "/bcba/home"],
      ["/bcba/authorizations", "/bcba/progress-reports"],
    ] as const) {
      const re = new RegExp(`path="${from}"[\\s\\S]{0,180}Navigate to="${to}"`);
      expect(APP_TSX, `expected ${from} → ${to} redirect`).toMatch(re);
    }
  });
});
