// Rewritten to assert current shipping contracts: runtime tick still passes
// the runtimeCtx, RBT role remains blocked from sensitive routes, and
// /rbt/reports is redirect-only.

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { canAccessRouteForRoles } from "@/lib/navigationAccess";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("RBT Pass 10 - runtime ctx + shared reports access", () => {
  it("TrainingModuleRuntime passes runtimeCtx to tickRuntime and has no bare 2-arg tick", () => {
    const src = read("src/pages/academy/TrainingModuleRuntime.tsx");
    expect(src).toMatch(/tickRuntime\(\s*decodedId\s*,\s*1\s*,\s*runtimeCtx\s*\)/);
    expect(src).not.toMatch(/tickRuntime\(\s*decodedId\s*,\s*1\s*\)/);
  });

  it("RBT stays blocked from sensitive routes", () => {
    for (const p of ["/clients", "/authorizations", "/payroll", "/admin", "/integrations", "/permissions"]) {
      expect(canAccessRouteForRoles(p, ["rbt"])).toBe(false);
    }
  });

  it("/rbt/reports is redirect-only and no separate RBT reports page exists", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path="\/rbt\/reports"\s+element=\{<Navigate to="\/reports\?audience=rbt" replace \/>\}/);
    const reportsDir = path.join(process.cwd(), "src/pages/os/reports");
    const rbtPage = fs.readdirSync(reportsDir).find((f) => /^rbt/i.test(f));
    expect(rbtPage).toBeUndefined();
  });

  it("RBT menu does not surface /reports as a mobile tab (RBT reports are redirect-only)", () => {
    const paths = ROLE_MENUS.rbt!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths.filter((p) => p === "/reports" || p.startsWith("/reports?"))).toEqual([]);
    expect(paths).not.toContain("/rbt/reports");
  });
});