import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Authorizations Pass 9 — OSShell Super Admin operations menu is canonical", () => {
  const shell = read("src/pages/os/OSShell.tsx");

  it("uses canonical /authorizations, /authorizations?stage=approved and /authorizations?stage=denied", () => {
    expect(shell).toMatch(/to:\s*"\/authorizations",\s*label:\s*"Authorizations"/);
    expect(shell).toMatch(/to:\s*"\/authorizations\?stage=approved",\s*label:\s*"Approved Authorizations"/);
    expect(shell).toMatch(/to:\s*"\/authorizations\?stage=denied",\s*label:\s*"Denials"/);
  });

  it("no longer uses legacy /ops/authorizations, /ops/approved-authorizations, or /ops/denials in the Super Admin menu", () => {
    // Extract SUPER_ADMIN_SECTIONS block (up to next `const `).
    const block = shell.slice(
      shell.indexOf("const SUPER_ADMIN_SECTIONS"),
      shell.indexOf("export const STAGED_ROLE_LIVE_PATHS"),
    );
    expect(block).not.toMatch(/"\/ops\/authorizations"/);
    expect(block).not.toMatch(/"\/ops\/approved-authorizations"/);
    expect(block).not.toMatch(/"\/ops\/denials"/);
  });
});

describe("Authorizations Pass 9 — role live-path sets are canonical", () => {
  const shell = read("src/pages/os/OSShell.tsx");

  function extractSet(role: string): string {
    const start = shell.indexOf(`${role}: new Set<string>([`);
    if (start === -1) throw new Error(`${role} live-path set not found`);
    const end = shell.indexOf("]),", start);
    return shell.slice(start, end);
  }

  for (const role of ["authorization_coordinator", "authorization_manager"]) {
    it(`${role} does not include legacy approved/denied redirect paths`, () => {
      const body = extractSet(role);
      expect(body).not.toMatch(/"\/ops\/approved-authorizations"/);
      expect(body).not.toMatch(/"\/ops\/denials"/);
      // canonical base path must remain
      expect(body).toMatch(/"\/authorizations"/);
      expect(body).toMatch(/"\/authorizations\/handoff"/);
      expect(body).toMatch(/"\/auth-workspace"/);
      expect(body).toMatch(/"\/ops\/expiring-authorizations"/);
      expect(body).toMatch(/"\/ops\/missing-docs"/);
      expect(body).toMatch(/"\/ops\/payer-requirements"/);
    });
  }

  for (const role of ["state_director", "assistant_state_director"]) {
    it(`${role} snapshot live-path uses canonical /authorizations`, () => {
      const body = extractSet(role);
      expect(body).toMatch(/"\/authorizations"/);
      expect(body).not.toMatch(/"\/ops\/authorizations"/);
    });
  }
});

describe("Authorizations Pass 9 — role menus still expose canonical Authorizations routes", () => {
  const menus = read("src/lib/os/roleMenus.ts");

  for (const role of ["authorization_coordinator", "authorization_manager"]) {
    it(`${role} menu references canonical Authorizations paths`, () => {
      const start = menus.indexOf(`${role}: {`);
      const end = menus.indexOf("\n  },", start);
      const block = menus.slice(start, end);
      expect(block).toMatch(/"\/authorizations"/);
      expect(block).toMatch(/"\/authorizations\?stage=approved"/);
      expect(block).toMatch(/"\/authorizations\?stage=denied"/);
      expect(block).toMatch(/"\/auth-workspace"/);
      expect(block).toMatch(/"\/authorizations\/handoff"/);
      expect(block).toMatch(/"\/reports"/);
    });
  }

  it("state_director / assistant_state_director Authorizations menu items no longer point at /ops/authorizations", () => {
    expect(menus).toMatch(/State Authorization Snapshot[^\n]*"\/authorizations"/);
    expect(menus).toMatch(/Authorization Support[^\n]*"\/authorizations"/);
    expect(menus).not.toMatch(/State Authorization Snapshot[^\n]*"\/ops\/authorizations"/);
    expect(menus).not.toMatch(/Authorization Support[^\n]*"\/ops\/authorizations"/);
  });
});

describe("Authorizations Pass 9 — Pass 7 legacy-link test is bounded", () => {
  const t = read("src/test/authorizationsPass7.test.ts");

  it("does not perform an unbounded synchronous walk of src", () => {
    expect(t).not.toMatch(/function walk\(/);
    expect(t).not.toMatch(/readdirSync/);
    expect(t).toMatch(/TARGETED_FILES/);
  });
});