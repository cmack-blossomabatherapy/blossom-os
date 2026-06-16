import { describe, it, expect } from "vitest";
import { ROLE_MENUS, ROLE_PREVIEW_LIST } from "@/lib/os/roleMenus";
import { findModuleByName, MODULE_REGISTRY } from "@/lib/os/moduleRegistry";
import { PHASE3_REPORTS } from "@/lib/os/phase3Reports";

describe("Blossom OS alignment", () => {
  it("every comingSoon menu label resolves to a module wireframe", () => {
    const missing: string[] = [];
    for (const [role, menu] of Object.entries(ROLE_MENUS)) {
      if (!menu) continue;
      for (const item of menu.comingSoon) {
        const params = new URL("http://x" + item.path).searchParams;
        const mod = params.get("module") || item.label;
        if (!findModuleByName(mod)) missing.push(`${role}:${mod}`);
      }
    }
    expect(missing, `Unmapped Coming Soon labels: ${missing.join(", ")}`).toEqual([]);
  });

  it("View as Role does not expose hidden/business-office roles", () => {
    const forbidden = new Set([
      "viewer",
      "payroll_coordinator",
      "billing_finance",
      "systems_admin",
      "coo",
      "executive",
    ]);
    for (const r of ROLE_PREVIEW_LIST) {
      expect(forbidden.has(r.role as string)).toBe(false);
    }
  });

  it("BCBA Productivity Report v3 is live and visible to all roles", () => {
    const r = PHASE3_REPORTS.find((x) => x.id === "bcba-productivity-report-v3");
    expect(r).toBeDefined();
    expect(r!.status).toBe("live");
    expect(r!.visibleTo).toBe("all");
  });

  it("module registry has no duplicate ids", () => {
    const ids = MODULE_REGISTRY.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});