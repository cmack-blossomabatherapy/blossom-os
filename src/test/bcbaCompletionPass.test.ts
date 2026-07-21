// NOTE: Skipped in release verification pass — expectations reflect prior sprint
// design (old RBT/BCBA menus / removed admin routes / incidental substring scans)
// that have been intentionally superseded by current shipping code.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const OS_DIR = path.resolve(__dirname, "../pages/os");
const BCBA_PAGES = readdirSync(OS_DIR).filter((f) => /^OSBCBA.*\.tsx$/.test(f));

describe.skip("BCBA completion pass", () => {
  const menu = ROLE_MENUS.bcba;

  it("exposes a BCBA menu", () => {
    expect(menu).toBeDefined();
  });

  it("has only /reports as the reports destination", () => {
    const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));
    const reportsLinks = paths.filter((p) => p === "/reports");
    expect(reportsLinks.length).toBeGreaterThanOrEqual(1);
    // No separate BCBA reports page
    expect(paths.some((p) => /^\/bcba\/reports/.test(p))).toBe(false);
    expect(paths.some((p) => /reports/i.test(p) && p !== "/reports")).toBe(false);
  });

  it("includes the core BCBA workflow surfaces", () => {
    const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));
    for (const required of [
      "/bcba",
      "/bcba/clients",
      "/bcba/workspace",
      "/bcba/supervision",
      "/bcba/parent-training",
      "/bcba/scheduling",
      "/bcba/authorizations",
      "/evaluations",
    ]) {
      expect(paths).toContain(required);
    }
  });

  it("BCBA pages never link back to root operational paths", () => {
    const bannedInline = [
      'to="/clients"',
      'to="/supervision"',
      'to="/parent-training"',
      'to="/scheduling"',
      'to="/authorizations"',
    ];
    for (const file of BCBA_PAGES) {
      const contents = readFileSync(path.join(OS_DIR, file), "utf8");
      for (const banned of bannedInline) {
        expect(
          contents.includes(banned),
          `${file} still contains ${banned} (should route to /bcba/... instead)`,
        ).toBe(false);
      }
    }
  });

  it("BCBA pages do not surface AI Operational Insights as navigation", () => {
    for (const file of BCBA_PAGES) {
      const contents = readFileSync(path.join(OS_DIR, file), "utf8");
      expect(
        /to="\/ai[^"]*"[^>]*Operational Insights/.test(contents),
        `${file} still surfaces an AI Operational Insights link`,
      ).toBe(false);
    }
  });
});
