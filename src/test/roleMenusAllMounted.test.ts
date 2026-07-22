import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { ROLE_MENUS, DEFAULT_ROLE_MENU } from "@/lib/os/roleMenus";
import { isPathLiveForRole } from "@/pages/os/OSShell";

/**
 * Stabilization pass — generated regression test.
 *
 * Guarantees:
 * 1. Every path referenced by every ROLE_MENUS entry (and DEFAULT_ROLE_MENU)
 *    resolves to a mounted <Route path="..."> in App.tsx / route modules.
 *    Base path is the path minus its query string, and mounted routes may
 *    contain `:param` placeholders.
 * 2. No menu item is `/coming-soon` or a `Coming Soon` label.
 * 3. `isPathLiveForRole` is unconditionally true — the staged Soon gate is
 *    retired. Menu items visible today must be clickable today.
 * 4. There are no duplicate <Route path="..."> mounts in App.tsx.
 */

const APP_SOURCES = [
  "src/App.tsx",
  "src/routes/legacyRoutes.tsx",
  "src/routes/publicRoutes.tsx",
]
  .filter((p) => fs.existsSync(p))
  .map((p) => fs.readFileSync(p, "utf8"))
  .join("\n");

const MOUNTED_ROUTES = Array.from(
  APP_SOURCES.matchAll(/path="([^"]+)"/g)
).map((m) => m[1]);

function baseOf(p: string): string {
  return p.split("?")[0].split("#")[0];
}

function isMounted(path: string): boolean {
  const b = baseOf(path);
  if (MOUNTED_ROUTES.includes(b)) return true;
  const parts = b.replace(/^\//, "").split("/");
  for (const route of MOUNTED_ROUTES) {
    const rp = route.replace(/^\//, "").split("/");
    if (rp.length !== parts.length) continue;
    let ok = true;
    for (let i = 0; i < rp.length; i++) {
      if (rp[i].startsWith(":") || rp[i] === "*") continue;
      if (rp[i] !== parts[i]) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

describe("Stabilization pass — role menus map to mounted routes", () => {
  const menus: Array<{ role: string; menu: typeof DEFAULT_ROLE_MENU }> = [
    ...Object.entries(ROLE_MENUS)
      .filter(([, m]) => Boolean(m))
      .map(([role, m]) => ({ role, menu: m as typeof DEFAULT_ROLE_MENU })),
    { role: "__default__", menu: DEFAULT_ROLE_MENU },
  ];

  for (const { role, menu } of menus) {
    for (const section of menu.sections) {
      it(`${role} section "${section.label}" has no Soon/Coming Soon label`, () => {
        expect(section.label).not.toMatch(/coming\s*soon/i);
      });
      for (const item of section.items) {
        it(`${role} → "${item.label}" (${item.path}) points at a mounted route`, () => {
          expect(item.path.startsWith("/coming-soon")).toBe(false);
          expect(item.label).not.toMatch(/coming\s*soon/i);
          expect(isMounted(item.path)).toBe(true);
        });
        it(`${role} → "${item.label}" is live (isPathLiveForRole = true)`, () => {
          expect(isPathLiveForRole(role, baseOf(item.path))).toBe(true);
        });
      }
    }
  }

  it("App.tsx has no duplicate mounted route paths", () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const r of MOUNTED_ROUTES) {
      if (seen.has(r)) dupes.push(r); else seen.add(r);
    }
    expect(dupes, `Duplicate <Route path=...>: ${dupes.join(", ")}`).toEqual([]);
  });
});