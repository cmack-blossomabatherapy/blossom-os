import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_HOME } from "@/lib/os/roleHome";

const OPERATIONS_ROLES = [
  "coo",
  "operations_leadership",
  "state_director",
  "assistant_state_director",
  "regional_state_director",
  "state_va",
  "scheduling_team",
  "staffing_team",
] as const;

function menuPathsFor(role: string): string[] {
  const menu = (ROLE_MENUS as any)[role];
  if (!menu) return [];
  const out: string[] = [];
  for (const s of menu.sections ?? []) {
    for (const it of s.items ?? []) if (it.path) out.push(String(it.path).split("?")[0]);
  }
  return out;
}

const APP = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

describe("Operations cluster release manifest", () => {
  it("every operations role has a landing route", () => {
    for (const r of OPERATIONS_ROLES) {
      expect((ROLE_HOME as any)[r], `ROLE_HOME missing for ${r}`).toBeTruthy();
    }
  });

  it("every unique operations menu path is mounted in App.tsx", () => {
    const paths = new Set<string>();
    for (const r of OPERATIONS_ROLES) menuPathsFor(r).forEach((p) => paths.add(p));
    const missing: string[] = [];
    for (const p of paths) {
      if (!APP.includes(`"${p}"`) && !APP.includes(`'${p}'`)) missing.push(p);
    }
    expect(missing, `unmounted operations routes: ${missing.join(", ")}`).toEqual([]);
  });

  it("operator surfaces do not surface raw error messages", () => {
    const files = [
      "src/pages/os/operations/OpsRecordsWorkspace.tsx",
      "src/pages/os/operations/MissingDocs.tsx",
      "src/pages/os/operations/PayerRequirements.tsx",
      "src/pages/os/operations/ExpiringAuthorizations.tsx",
      "src/pages/os/stateDirector/StateDirectorPages.tsx",
    ];
    for (const rel of files) {
      const src = readFileSync(resolve(process.cwd(), rel), "utf8");
      // Guard: no raw `e.message` / `err.message` toast surfacing.
      expect(
        /toast\.[a-z]+\([^)]*\b(e|err|error)\?\.message/.test(src),
        `${rel} still leaks raw error to toast`,
      ).toBe(false);
      expect(
        /toast\.[a-z]+\([^)]*\binstanceof\s+Error\s*\?\s*\w+\.message/.test(src),
        `${rel} still leaks Error.message to toast`,
      ).toBe(false);
      // Guard: no `{error}` rendered directly in JSX for these files, except
      // in StateDirectorPages where `error` is a local, sanitized string.
      if (!rel.endsWith("StateDirectorPages.tsx")) {
        expect(
          />\s*\{\s*error\s*\}\s*</.test(src),
          `${rel} renders raw {error} in JSX`,
        ).toBe(false);
      }
    }
  });

  it("staffing queue confirms/notifies on assign action", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/components/staffing/StaffingQueueView.tsx"),
      "utf8",
    );
    expect(src).toMatch(/toast\.success\(/);
    expect(src).toMatch(/toast\.error\(/);
    expect(/console\.(error|log)\(/.test(src)).toBe(false);
  });

  it("no operator ops page uses alert/prompt/confirm", () => {
    const files = [
      "src/pages/os/operations/OpsRecordsWorkspace.tsx",
      "src/pages/os/operations/MissingDocs.tsx",
      "src/pages/os/operations/PayerRequirements.tsx",
      "src/pages/os/operations/ExpiringAuthorizations.tsx",
      "src/pages/os/operations/MakeUpSessions.tsx",
      "src/pages/os/operations/OpsCommandCenter.tsx",
      "src/pages/os/operations/OpsExecutiveDashboard.tsx",
      "src/pages/os/operations/OpsEscalations.tsx",
      "src/pages/os/operations/OpsStaffingCapacity.tsx",
      "src/pages/os/work-queue/WorkQueuePage.tsx",
      "src/pages/os/work-queue/EscalationCenter.tsx",
      "src/pages/os/stateDirector/StateDirectorPages.tsx",
    ];
    for (const rel of files) {
      const src = readFileSync(resolve(process.cwd(), rel), "utf8");
      expect(/window\.(alert|prompt|confirm)\(/.test(src), `${rel} uses window.alert/prompt/confirm`).toBe(false);
    }
  });
});