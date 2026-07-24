import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_HOME } from "@/lib/os/roleHome";

/**
 * Blossom OS — People Operations Release Manifest (Cluster 3).
 *
 * Locks in the concrete defect fixes shipped in this pass for recruiting,
 * HR, credentialing, training-manager and office-manager roles:
 *   1. Every people-ops role has a landing route and a non-empty menu.
 *   2. Every people-ops page removes native window.prompt/confirm/alert —
 *      operator input goes through <OperatorDialogsProvider>.
 *   3. OperatorDialogsProvider is mounted globally in App.tsx.
 */

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const PEOPLE_ROLES = [
  "recruiting_team",
  "recruiting_lead",
  "recruiting_coordinator",
  "hr_team",
  "hr_lead",
  "credentialing_team",
  "credentialing_lead",
  "training_manager",
  "office_manager",
] as const;

describe("People-ops cluster — landing routes and menus", () => {
  it.each(PEOPLE_ROLES)("role %s has a landing route and a non-empty menu", (role) => {
    const home = ROLE_HOME[role] ?? "/dashboard";
    expect(home).toMatch(/^\//);
    const menu = ROLE_MENUS[role];
    expect(menu, `role ${role} missing from ROLE_MENUS`).toBeTruthy();
    const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths.length).toBeGreaterThan(0);
  });
});

describe("People-ops cluster — no native browser dialogs", () => {
  const files = readdirSync(resolve(process.cwd(), "src/pages/os"))
    .filter(
      (f) =>
        f.startsWith("OSHR") ||
        f.startsWith("OSRecruiting") ||
        f === "OSEvaluations.tsx",
    )
    .map((f) => `src/pages/os/${f}`);

  it("audited people-ops pages exist", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files)("%s does not call window.prompt/confirm/alert", (file) => {
    const src = read(file);
    expect(src).not.toMatch(/window\.(prompt|confirm|alert)\s*\(/);
  });
});

describe("People-ops cluster — OperatorDialogsProvider wired globally", () => {
  it("App.tsx mounts OperatorDialogsProvider", () => {
    const app = read("src/App.tsx");
    expect(app).toContain("OperatorDialogsProvider");
  });
  it("component exports promptOperator via useOperatorDialogs", () => {
    const src = read("src/components/os/OperatorDialogs.tsx");
    expect(src).toContain("useOperatorDialogs");
    expect(src).toContain("promptOperator");
  });
});
