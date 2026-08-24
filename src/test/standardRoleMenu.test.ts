import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { STANDARD_ROLE_MENU, resolveRoleMenu, ROLE_PREVIEW_LIST } from "@/lib/os/roleMenus";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

/**
 * Company directive (Aug 2026): every role except Super Admin sees exactly
 * one standard menu.
 */
describe("Standard role menu", () => {
  it("has the exact required structure", () => {
    expect(STANDARD_ROLE_MENU.sections.map((s) => s.label)).toEqual(["Main", "Resources"]);
    expect(STANDARD_ROLE_MENU.sections[0].items.map((i) => [i.label, i.path])).toEqual([
      ["Company Home", "/home"],
      ["Reports", "/reports"],
      ["Blossom AI", "/ai/assistant"],
    ]);
    expect(STANDARD_ROLE_MENU.sections[1].items.map((i) => [i.label, i.path])).toEqual([
      ["Resource Library", "/resource-library"],
      ["Training Academy", "/academy"],
    ]);
  });

  it("resolves to the standard menu for every previewable non-super-admin role", () => {
    for (const { role } of ROLE_PREVIEW_LIST) {
      if (role === "super_admin") continue;
      expect(resolveRoleMenu(role)).toBe(STANDARD_ROLE_MENU);
    }
  });

  it("the shell and sidebar both resolve menus through resolveRoleMenu", () => {
    expect(read("src/pages/os/OSShell.tsx")).toMatch(/resolveRoleMenu\(role\)/);
    expect(read("src/components/layout/AppSidebar.tsx")).toMatch(/resolveRoleMenu\(effectiveOSRole\)/);
  });

  it("Super Admin keeps its own full navigation", () => {
    expect(read("src/pages/os/OSShell.tsx")).toMatch(
      /role === "super_admin"\)\s*return SUPER_ADMIN_SECTIONS/,
    );
  });
});
