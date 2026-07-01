import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), "utf8");

describe("Marketing Pass 109 - route/menu guards", () => {
  it("no MarketingReports.tsx page exists", () => {
    expect(fs.existsSync("src/pages/os/marketing/MarketingReports.tsx")).toBe(false);
  });

  it("App.tsx does not import MarketingReports", () => {
    expect(read("src/App.tsx")).not.toMatch(/MarketingReports/);
  });

  it("/marketing/reports is redirect-only to /reports?category=marketing", () => {
    expect(read("src/App.tsx")).toMatch(
      /path="\/marketing\/reports"\s+element=\{<Navigate to="\/reports\?category=marketing"/,
    );
  });

  it("/patient-journey uses MARKETING_ROLES (no BD)", () => {
    const app = read("src/App.tsx");
    // The wrapper for /patient-journey must reference MARKETING_ROLES but NOT MARKETING_ROLES_WITH_BD.
    const seg = app.match(/path="\/patient-journey"[\s\S]{0,400}<\/PermissionRoute>/);
    expect(seg, "patient-journey route block").toBeTruthy();
    expect(seg![0]).toContain("MARKETING_ROLES");
    expect(seg![0]).not.toContain("MARKETING_ROLES_WITH_BD");
  });

  it("Business Development menu does not include /patient-journey", () => {
    const menus = read("src/lib/os/roleMenus.ts");
    const bd = menus.match(/business_development:\s*\{[\s\S]*?\n\s{2}\},/);
    expect(bd, "business_development menu block").toBeTruthy();
    expect(bd![0]).not.toContain("/patient-journey");
  });

  it("Business Development dashboard does not link to /patient-journey", () => {
    const bdPage = "src/pages/os/business-development/BusinessDevelopment.tsx";
    if (fs.existsSync(bdPage)) {
      expect(read(bdPage)).not.toContain("/patient-journey");
    }
  });

  it("Marketing menu includes Patient Lifetime Journey", () => {
    const menus = read("src/lib/os/roleMenus.ts");
    expect(menus).toMatch(/Patient Lifetime Journey[\s\S]{0,80}\/patient-journey/);
  });

  it("Lead Source Inbox route uses Marketing roles only", () => {
    const app = read("src/App.tsx");
    const seg = app.match(/path="\/marketing\/lead-source-inbox"[\s\S]{0,300}\/PermissionRoute>/);
    expect(seg, "lead-source-inbox route block").toBeTruthy();
    expect(seg![0]).not.toContain("MARKETING_ROLES_WITH_BD");
    expect(seg![0]).toContain("MARKETING_ROLES");
  });

  it("Referral CRM route may use Marketing + BD roles", () => {
    const app = read("src/App.tsx");
    const seg = app.match(/path="\/marketing\/referral-crm"[\s\S]{0,300}\/PermissionRoute>/);
    expect(seg, "referral-crm route block").toBeTruthy();
    expect(seg![0]).toContain("MARKETING_ROLES_WITH_BD");
  });
});
