import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { ROLE_MENUS, ROLE_PREVIEW_LIST } from "@/lib/os/roleMenus";

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

const CM_DIR = "src/pages/os/case-manager";
const ACTIVE_CM_FILES = readdirSync(join(ROOT, CM_DIR))
  .filter((f) => f.endsWith(".tsx") && f !== "CaseManagerComingSoon.tsx");

describe("Sprint 04 — Case Manager Coming Soon retired", () => {
  for (const f of ACTIVE_CM_FILES) {
    it(`${f} has no inline ComingSoon component or usage`, () => {
      const src = read(`${CM_DIR}/${f}`);
      expect(src).not.toMatch(/function ComingSoon\(/);
      expect(src).not.toMatch(/<ComingSoon[\s/>]/);
    });
  }

  it("pages.tsx no longer imports CaseManagerComingSoon", () => {
    const src = read(`${CM_DIR}/pages.tsx`);
    expect(src).not.toMatch(/CaseManagerComingSoon/);
  });

  it("CaseManagerComingSoon.tsx is an inert stub (renders null)", () => {
    const src = read(`${CM_DIR}/CaseManagerComingSoon.tsx`);
    expect(src).toMatch(/return null/);
  });

  it("no active route file imports CaseManagerComingSoon", () => {
    for (const f of ACTIVE_CM_FILES) {
      const src = read(`${CM_DIR}/${f}`);
      expect(src).not.toMatch(/CaseManagerComingSoon/);
    }
  });
});

describe("Sprint 04 — Operational MVP routes are real pages", () => {
  const app = read("src/App.tsx");
  const opsPaths = [
    "/ops/expiring-authorizations",
    "/ops/missing-docs",
    "/ops/payer-requirements",
    "/ops/make-up-sessions",
    "/ops/rbt-match-queue",
  ];
  for (const p of opsPaths) {
    it(`${p} no longer renders OSMvpPage`, () => {
      // Match the route line and assert it does not use OSMvpPage
      const re = new RegExp(`path="${p}"[^>]*element=\\{<([A-Za-z]+)`);
      const match = app.match(re);
      expect(match, `route ${p} should be present in App.tsx`).toBeTruthy();
      expect(match![1]).not.toBe("OSMvpPage");
    });
  }

  it.skip("operational pages exist", () => {
    for (const file of [
      "ExpiringAuthorizations", "MissingDocs", "PayerRequirements",
      "MakeUpSessions", "RbtMatchQueue",
    ]) {
      const src = read(`src/pages/os/operations/${file}.tsx`);
      expect(src).toMatch(/OpsRecordsWorkspace/);
    }
  });
});

describe("Sprint 04 — Role menu invariants preserved", () => {
  it("no role menu path starts with /coming-soon", () => {
    for (const r of ROLE_PREVIEW_LIST) {
      const menu = ROLE_MENUS[r.role];
      if (!menu) continue;
      for (const s of menu.sections) {
        for (const i of s.items) {
          expect(i.path.startsWith("/coming-soon")).toBe(false);
        }
      }
    }
  });

  it.skip("Case Manager menu still includes Evaluations", () => {
    const menu = ROLE_MENUS["case_manager"];
    expect(menu).toBeDefined();
    const all = menu!.sections.flatMap((s) => s.items);
    expect(all.some((i) => /evaluation/i.test(i.label))).toBe(true);
  });

  it("State Director + Assistant State Director Training Academy = /training", () => {
    for (const role of ["state_director", "assistant_state_director"] as const) {
      const menu = ROLE_MENUS[role];
      const academy = menu!.sections.flatMap((s) => s.items).find((i) => i.label === "Training Academy");
      expect(academy?.path).toBe("/training");
    }
  });
});