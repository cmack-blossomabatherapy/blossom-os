import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(p), "utf8");

describe("Sprint 15A — Intake Team shell hotfix", () => {
  const leadDetail = read("src/pages/LeadDetail.tsx");
  const app = read("src/App.tsx");

  it("LeadDetail imports OSShell", () => {
    expect(leadDetail).toMatch(/from\s+["']@\/pages\/os\/OSShell["']/);
  });

  it("LeadDetail wraps page with <OSShell>", () => {
    const opens = (leadDetail.match(/<OSShell>/g) || []).length;
    const closes = (leadDetail.match(/<\/OSShell>/g) || []).length;
    expect(opens).toBeGreaterThanOrEqual(2);
    expect(opens).toBe(closes);
  });

  it("/leads/:id remains mounted in App.tsx", () => {
    expect(app).toMatch(/path="\/leads\/:id"\s+element=\{<LeadDetail\s*\/>\}/);
  });

  it("academy routes are no longer mounted inside the legacy AppLayout group", () => {
    const legacyStart = app.indexOf("<ProtectedRoute><AppLayout /></ProtectedRoute>");
    expect(legacyStart).toBeGreaterThan(-1);
    const legacyTail = app.slice(legacyStart);
    expect(legacyTail).not.toMatch(/path="\/academy"\s/);
    expect(legacyTail).not.toMatch(/path="\/academy\/path\/:slug"/);
    expect(legacyTail).not.toMatch(/path="\/my-learning"/);
    expect(legacyTail).not.toMatch(/path="\/catalog"/);
  });

  it("/academy still mounted (under OS shell) and uses OSShellPage wrapper", () => {
    expect(app).toMatch(/path="\/academy"\s+element=\{<OSShellPage><TrainingAcademyHome/);
    expect(app).toMatch(/path="\/academy\/path\/:slug"\s+element=\{<OSShellPage><TrainingPathDetail/);
    expect(app).toMatch(/path="\/my-learning"\s+element=\{<OSShellPage><MyLearning/);
    expect(app).toMatch(/path="\/catalog"\s+element=\{<OSShellPage><TrainingCatalog/);
  });

  it("/training remains mounted unchanged for State Director training", () => {
    expect(app).toMatch(/path="\/training"\s+element=\{<OSTraining\s*\/>\}/);
  });

  it("Intake role menu still contains the expected paths", () => {
    const menu = read("src/lib/os/roleMenus.ts");
    const intakeIdx = menu.indexOf("intake_coordinator");
    expect(intakeIdx).toBeGreaterThan(-1);
    const required = [
      "/intake/missing-information", "/intake/parent-communication",
      "/intake/tasks", "/intake/benefits-cheat-sheets",
      "/academy", "/resource-library", "/reports",
    ];
    for (const p of required) {
      expect(menu).toContain(`"${p}"`);
    }
    // Export 81/82 — Patient Lifetime Journey is Marketing/Admin only.
    const intakeBlock = menu.slice(intakeIdx, menu.indexOf("/* ", intakeIdx + 1));
    expect(intakeBlock).not.toMatch(/\/patient-journey/);
  });
});