import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import type { OSRole } from "@/lib/os/permissions";



const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

const legacy = read("routes/legacyRoutes.tsx");
const intake = read("pages/os/intake/IntakeDashboard.tsx");
const app = read("App.tsx");
const menus = read("lib/os/roleMenus.ts");

describe("Authorizations Pass 11 — final stale-route cleanup", () => {
  it("/os/authorizations redirects directly to /authorizations in legacyRoutes", () => {
    expect(legacy).toMatch(/path="\/os\/authorizations"\s+element=\{<Navigate\s+to="\/authorizations"\s+replace/);
  });

  it("legacyRoutes does not redirect /os/authorizations to /ops/authorizations", () => {
    expect(legacy).not.toMatch(/path="\/os\/authorizations"[^>]*to="\/ops\/authorizations"/);
  });

  it("Intake dashboard does not link to /ops/authorizations", () => {
    expect(intake).not.toMatch(/to="\/ops\/authorizations"/);
  });

  it("Intake dashboard links to /authorizations", () => {
    expect(intake).toMatch(/to="\/authorizations"/);
  });

  it("App.tsx keeps compatibility redirects for /ops/* authorizations paths", () => {
    expect(app).toMatch(/path="\/ops\/authorizations"[^>]*to="\/authorizations"/);
    expect(app).toMatch(/path="\/ops\/approved-authorizations"[^>]*to="\/authorizations\?stage=approved"/);
    expect(app).toMatch(/path="\/ops\/denials"[^>]*to="\/authorizations\?stage=denied"/);
  });

  it("Authorizations role menus use canonical /authorizations paths and /reports", () => {
    expect(menus).toMatch(/path:\s*"\/authorizations"/);
    expect(menus).toMatch(/path:\s*"\/authorizations\?stage=approved"/);
    expect(menus).toMatch(/path:\s*"\/authorizations\?stage=denied"/);
    expect(menus).toMatch(/path:\s*"\/reports"/);
  });

  it("Authorizations role menus do not expose /ai/assistant", () => {
    // Read the menu data itself rather than regexing the source file, which
    // over-matched into later role blocks once role menus were reorganized.
    const authRoles = (Object.keys(ROLE_MENUS) as OSRole[]).filter((r) =>
      String(r).includes("auth"),
    );
    expect(authRoles.length).toBeGreaterThan(0);
    for (const role of authRoles) {
      const paths = (ROLE_MENUS[role]?.sections ?? []).flatMap((s) =>
        s.items.map((i) => i.path),
      );
      expect(paths, role).not.toContain("/ai/assistant");
    }
  });
});
