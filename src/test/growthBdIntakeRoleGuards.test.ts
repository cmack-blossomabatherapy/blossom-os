import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * Growth / Business Development / Intake role-cluster audit — regression
 * tests for the "menu shows the item but route guard blocks it" class of
 * dead-click bugs. Static-file assertions so they run without a DOM.
 */

const app = fs.readFileSync("src/App.tsx", "utf8");

function guardListFor(routePath: string): string {
  // Grab the Route line for this path and pull out its allowedRoles array.
  const routeRe = new RegExp(`path="${routePath.replace(/[/]/g, "\\/")}"[^\\n]+`);
  const line = app.match(routeRe)?.[0] ?? "";
  const rolesRe = /allowedRoles=\{\[\.\.\.(\w+)\]\}/;
  const constName = line.match(rolesRe)?.[1];
  if (!constName) return line;
  const constRe = new RegExp(`const ${constName} = \\[([\\s\\S]*?)\\] as const;`);
  const body = app.match(constRe)?.[1] ?? "";
  // Expand any spread of other role constants.
  return body.replace(/\.\.\.(\w+),?/g, (_, n) => {
    const nested = app.match(new RegExp(`const ${n} = \\[([\\s\\S]*?)\\] as const;`))?.[1] ?? "";
    return nested;
  });
}

function guardIncludes(routePath: string, role: string): boolean {
  return new RegExp(`"${role}"`).test(guardListFor(routePath));
}

describe("Growth/BD/Intake role guards match role menus", () => {
  for (const role of ["business_development", "clinic_growth", "state_director"]) {
    it(`${role} may reach /marketing/state-growth (linked from its own menu)`, () => {
      expect(guardIncludes("/marketing/state-growth", role)).toBe(true);
    });
  }

  it("business_development may reach /marketing/campaigns (State Campaign Support menu item)", () => {
    expect(guardIncludes("/marketing/campaigns", "business_development")).toBe(true);
  });

  it("business_development may reach /marketing/referral-crm (Referral Partners menu item)", () => {
    expect(guardIncludes("/marketing/referral-crm", "business_development")).toBe(true);
  });

  it("business_development may reach /business-development", () => {
    expect(guardIncludes("/business-development", "business_development")).toBe(true);
  });
});