import { describe, it, expect } from "vitest";
import { ROLE_MENUS, ROLE_PREVIEW_LIST } from "@/lib/os/roleMenus";
import { MODULE_REGISTRY } from "@/lib/os/moduleRegistry";
import { PHASE3_REPORTS } from "@/lib/os/phase3Reports";

describe("Blossom OS alignment", () => {
  it("no role menu item routes to /coming-soon or uses Coming Soon copy", () => {
    const offenders: string[] = [];
    for (const [role, menu] of Object.entries(ROLE_MENUS)) {
      if (!menu) continue;
      for (const section of menu.sections) {
        if (/coming soon|available now/i.test(section.label)) {
          offenders.push(`${role}:section:${section.label}`);
        }
        for (const item of section.items) {
          if (item.path.startsWith("/coming-soon")) {
            offenders.push(`${role}:${item.label}->${item.path}`);
          }
        }
      }
    }
    expect(offenders, `Coming Soon leakage: ${offenders.join(", ")}`).toEqual([]);
  });

  it.skip("View as Role does not expose hidden/business-office roles", () => {
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