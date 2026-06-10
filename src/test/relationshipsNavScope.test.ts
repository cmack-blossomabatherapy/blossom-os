import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const shellSrc = readFileSync(
  resolve(__dirname, "../pages/os/OSShell.tsx"),
  "utf8",
);

const appSrc = readFileSync(
  resolve(__dirname, "../App.tsx"),
  "utf8",
);

// These tests are source-level guards that lock in the access rules for the
// Relationships menu group. They intentionally read OSShell.tsx as text so we
// catch accidental regressions (duplicate sections, placeholder hrefs,
// leaking to other roles) without needing to render the full app shell.
describe("Relationships nav scope", () => {
  it("declares the Relationships section in the default NAV_SECTIONS (Super Admin path)", () => {
    const matches = shellSrc.match(/id:\s*"relationships"/g) ?? [];
    // Exactly two declarations remain: the default NAV_SECTIONS list (super
    // admin + fallback) and the Marketing role's own MARKETING_TEAM_SECTIONS.
    // Any drift here means we either lost or duplicated the section.
    expect(matches.length).toBe(2);
  });

  it("is hidden from non-marketing / non-super-admin roles in the fallback", () => {
    expect(shellSrc).toMatch(
      /s\.id !== "relationships" \|\| role === "super_admin"/,
    );
  });

  it("is wired into the Marketing role's menu", () => {
    // Marketing role uses its own section list — confirm Referrals (and the
    // Relationships group) live there so marketing users see it naturally.
    expect(shellSrc).toMatch(/MARKETING_TEAM_SECTIONS[\s\S]*id:\s*"relationships"/);
    expect(shellSrc).toMatch(/MARKETING_TEAM_SECTIONS[\s\S]*\/marketing\/referral-crm/);
  });

  it("does not appear in any other role's curated section list", () => {
    const otherRoleLists = [
      "EXEC_LEADERSHIP_SECTIONS",
      "OPS_LEADERSHIP_SECTIONS",
      "SCHEDULING_TEAM_SECTIONS",
      "BCBA_SECTIONS",
      "RBT_SECTIONS",
      "PAYROLL_SECTIONS",
      "STATE_DIRECTOR_SECTIONS",
      "CASE_MANAGER_SECTIONS",
      "HR_TEAM_SECTIONS",
      "QA_TEAM_SECTIONS",
    ];
    for (const name of otherRoleLists) {
      const decl = new RegExp(`const ${name}[\\s\\S]*?\\n  \\];`, "m");
      const block = shellSrc.match(decl)?.[0];
      if (!block) continue;
      expect(block, `${name} should not declare a Relationships section`).not.toMatch(/id:\s*"relationships"/);
    }
  });

  it("has no broken placeholder href=\"#\" links inside the Relationships entries", () => {
    // Pull every NAV_SECTIONS-style block tagged 'relationships' and assert
    // each `to:` points to a real /marketing/* route, never '#'.
    const groups = [
      ...shellSrc.matchAll(
        /id:\s*"relationships",\s*label:\s*"Relationships",\s*items:\s*\[([\s\S]*?)\],/g,
      ),
    ];
    expect(groups.length).toBe(2);
    for (const g of groups) {
      const body = g[1];
      expect(body).not.toMatch(/to:\s*"#"/);
      const tos = [...body.matchAll(/to:\s*"([^"]+)"/g)].map((m) => m[1]);
      expect(tos.length).toBeGreaterThan(0);
      for (const to of tos) {
        expect(to.startsWith("/marketing/")).toBe(true);
      }
    }
  });

  it("route-gates the Relationships pages to Marketing + Super Admin (App.tsx)", () => {
    const relRoutes = [
      "/marketing/referral-crm",
      "/marketing/recruiting",
      "/marketing/outreach",
      "/marketing/reputation",
    ];
    for (const path of relRoutes) {
      // Each route must be wrapped in a PermissionRoute that allows the
      // "marketing" app role. Super Admin (isAdmin) bypasses inside
      // PermissionRoute, so no extra wiring is needed there.
      const re = new RegExp(
        `path="${path}"\\s+element=\\{<PermissionRoute allowedRoles=\\{\\["marketing"\\]\\}>`,
      );
      expect(appSrc, `${path} must be gated by PermissionRoute`).toMatch(re);
      // No duplicate route declaration for any of these paths.
      const occurrences = appSrc.split(`path="${path}"`).length - 1;
      expect(occurrences, `${path} should only be declared once`).toBe(1);
    }
  });
});