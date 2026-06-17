import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { ROLE_MENUS, DEFAULT_ROLE_MENU } from "@/lib/os/roleMenus";

const appSources = [
  "src/App.tsx",
  "src/routes/publicRoutes.tsx",
  "src/routes/legacyRoutes.tsx",
]
  .filter((p) => fs.existsSync(p))
  .map((p) => fs.readFileSync(p, "utf8"))
  .join("\n");

function basePath(p: string): string {
  return p.split("?")[0].split("#")[0];
}

function routeIsMounted(path: string): boolean {
  const escaped = path.replace(/[/]/g, "\\/");
  const re = new RegExp(`path="${escaped}"`);
  return re.test(appSources);
}

describe("Phase B — every role menu item routes to a live page", () => {
  const menus = [
    ...Object.entries(ROLE_MENUS).map(([role, menu]) => ({ role, menu: menu! })),
    { role: "__default__", menu: DEFAULT_ROLE_MENU },
  ];

  for (const { role, menu } of menus) {
    for (const section of menu.sections) {
      for (const item of section.items) {
        it(`${role} → "${item.label}" (${item.path}) is mounted`, () => {
          expect(basePath(item.path).startsWith("/coming-soon")).toBe(false);
          expect(routeIsMounted(basePath(item.path))).toBe(true);
        });
      }

      it(`${role} section label "${section.label}" is not a Coming Soon / Available Now bucket`, () => {
        expect(section.label).not.toMatch(/coming\s*soon/i);
        expect(section.label).not.toMatch(/available\s*now/i);
      });
    }
  }
});