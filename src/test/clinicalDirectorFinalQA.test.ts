import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Clinical Director Final QA Pass", () => {
  const roleMenus = read("src/lib/os/roleMenus.ts");
  const app = read("src/App.tsx");
  const panel = read("src/components/clinical/ClinicalWorkItemPanel.tsx");
  const dashboard = read("src/pages/os/clinical/ClinicalDirectorDashboard.tsx");
  const escalations = read("src/pages/os/OSQAEscalations.tsx");

  const cdBlockMatch = roleMenus.match(/clinical_director:\s*\{[\s\S]*?\n  \},/);
  const cdBlock = cdBlockMatch ? cdBlockMatch[0] : "";

  it("has a clinical_director menu block", () => {
    expect(cdBlock.length).toBeGreaterThan(0);
  });

  it("includes every required Clinical Director menu label", () => {
    const required = [
      "Clinical Director Dashboard",
      "BCBA Oversight",
      "Supervision Health",
      "Treatment Plan Reviews",
      "Progress Reports",
      "Evaluations",
      "Clinical Escalations",
      "QA Dashboard",
    ];
    for (const label of required) {
      expect(cdBlock).toContain(label);
    }
  });

  it("Clinical Director menu has no Phone or AI items", () => {
    expect(cdBlock).not.toMatch(/Phone System|Phone Center|Phone Admin/i);
    expect(cdBlock).not.toMatch(/Ask Blossom|AI Center|AI Admin/i);
  });

  it("every Clinical Director menu path has a matching route in App.tsx", () => {
    const paths = [...cdBlock.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      const re = new RegExp(`path="${p.replace(/\//g, "\\/")}"`);
      expect(app, `missing route for ${p}`).toMatch(re);
    }
  });

  it("QA Dashboard route allows clinical_director", () => {
    const routeMatch = app.match(/<Route path="\/qa-team"[^>]*allowedRoles=\{\[([^\]]+)\]/);
    expect(routeMatch).not.toBeNull();
    expect(routeMatch![1]).toContain('"clinical_director"');
  });

  it("Reports remain unified — no clinical-specific reports route", () => {
    expect(app).not.toMatch(/path="\/clinical\/reports"/);
    expect(app).not.toMatch(/path="\/clinical-director\/reports"/);
    expect(cdBlock).not.toMatch(/\/clinical\/reports|\/clinical-director\/reports/);
  });

  it("record workflow controls still exist on the ClinicalWorkItemPanel", () => {
    for (const token of [
      "assignOwner",
      "changeDueDateFor",
      "addNote",
      "setPriority",
      "markReviewed",
      "escalate",
      "resolve",
      "reopen",
      "archive",
    ]) {
      expect(panel, `missing ${token}`).toMatch(new RegExp(token));
    }
  });

  it("saved view controls still exist on dashboard and escalations", () => {
    for (const src of [dashboard, escalations]) {
      expect(src).toMatch(/savedView/i);
      expect(src).toMatch(/updateSavedView/);
      expect(src).toMatch(/deleteSavedView/);
    }
  });

  it("CentralReach copy stays honest and neutral", () => {
    expect(panel).toMatch(/CentralReach link pending/);
    expect(panel).not.toMatch(/fetch\((["']).*centralreach/i);
  });
});
