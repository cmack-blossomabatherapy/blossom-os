import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

function extractSet(shell: string, role: string): string {
  const start = shell.indexOf(`${role}: new Set<string>([`);
  if (start === -1) throw new Error(`${role} live-path set not found`);
  const end = shell.indexOf("]),", start);
  return shell.slice(start, end);
}

describe("Authorizations Pass 10 — State Director / Assistant State Director live paths", () => {
  const shell = read("src/pages/os/OSShell.tsx");

  for (const role of ["state_director", "assistant_state_director"]) {
    it(`${role} includes canonical /authorizations`, () => {
      expect(extractSet(shell, role)).toMatch(/"\/authorizations"/);
    });
    it(`${role} no longer includes legacy /ops/authorizations`, () => {
      expect(extractSet(shell, role)).not.toMatch(/"\/ops\/authorizations"/);
    });
  }
});

describe("Authorizations Pass 10 — Authorizations roles can reach Ask Blossom", () => {
  const shell = read("src/pages/os/OSShell.tsx");

  for (const role of ["authorization_coordinator", "authorization_manager"]) {
    it(`${role} live-path set includes /ai/assistant`, () => {
      expect(extractSet(shell, role)).toMatch(/"\/ai\/assistant"/);
    });

    it(`${role} role menu does NOT expose /ai/assistant as a visible menu item`, () => {
      const menu = ROLE_MENUS[role as keyof typeof ROLE_MENUS];
      expect(menu).toBeDefined();
      const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));
      expect(paths).not.toContain("/ai/assistant");
    });
  }
});

describe("Authorizations Pass 10 — Ask Blossom CTA links to canonical route", () => {
  const ws = read("src/pages/os/OSAuthWorkspace.tsx");

  it("links to /ai/assistant?context=authorizations", () => {
    expect(ws).toMatch(/to="\/ai\/assistant\?context=authorizations"/);
  });

  it("does not link to legacy /ai-assistant?context=authorizations", () => {
    expect(ws).not.toMatch(/to="\/ai-assistant\?context=authorizations"/);
  });
});

describe("Authorizations Pass 10 — legacy /ops auth routes are redirect-only, not role-owned", () => {
  const app = read("src/App.tsx");

  it("legacy /ops/approved-authorizations is a Navigate redirect", () => {
    const m = app.match(/path="\/ops\/approved-authorizations"[^\n]*/);
    expect(m).toBeTruthy();
    expect(m![0]).toMatch(/<Navigate to="\/authorizations\?stage=approved" replace \/>/);
  });

  it("legacy /ops/denials is a Navigate redirect", () => {
    const m = app.match(/path="\/ops\/denials"[^\n]*/);
    expect(m).toBeTruthy();
    expect(m![0]).toMatch(/<Navigate to="\/authorizations\?stage=denied" replace \/>/);
  });

  it("Authorizations role menus do not include legacy /ops/approved-authorizations or /ops/denials", () => {
    for (const role of ["authorization_coordinator", "authorization_manager"] as const) {
      const paths = ROLE_MENUS[role]!.sections.flatMap((s) => s.items.map((i) => i.path));
      expect(paths).not.toContain("/ops/approved-authorizations");
      expect(paths).not.toContain("/ops/denials");
    }
  });
});

describe("Authorizations Pass 10 — Reports remains unified", () => {
  it("Authorizations role menus use /reports, not a role-specific reports route", () => {
    for (const role of ["authorization_coordinator", "authorization_manager"] as const) {
      const paths = ROLE_MENUS[role]!.sections.flatMap((s) => s.items.map((i) => i.path));
      expect(paths).toContain("/reports");
      expect(paths).not.toContain("/authorizations/reports");
      expect(paths).not.toContain("/auth-workspace/reports");
    }
  });
});