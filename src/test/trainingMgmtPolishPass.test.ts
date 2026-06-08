import { describe, it, expect } from "vitest";
import fs from "node:fs";

const SHELL = fs.readFileSync("src/pages/os/OSShell.tsx", "utf8");
const TMC = fs.readFileSync("src/pages/hr/TrainingManagementCenter.tsx", "utf8");
const RUC = fs.readFileSync("src/pages/hr/ResourceUploadCenter.tsx", "utf8");

describe("Training Management polish + count truth pass", () => {
  it("every /hr/training-center nav entry uses module: 'training', not 'hr'", () => {
    const re = /to:\s*"\/hr\/training-center"[^}]*module:\s*"([^"]+)"/g;
    const matches = [...SHELL.matchAll(re)];
    expect(matches.length).toBeGreaterThan(0);
    for (const m of matches) expect(m[1]).toBe("training");
    expect(SHELL).not.toMatch(/to:\s*"\/hr\/training-center"[^}]*module:\s*"hr"/);
  });

  it("Training Management Control Room sources counts from useAdminResources + shared helpers", () => {
    expect(TMC).toContain("useAdminResources");
    expect(TMC).toContain("computeSdSopCoverageFromResources");
    expect(TMC).toContain("computeSdScreenshotCoverage");
    expect(TMC).toContain("computeSdWelcomeVideoState");
  });

  it("renders the counts explanation and three separate count groups", () => {
    expect(TMC).toContain('data-testid="tmc-counts-panel"');
    expect(TMC).toContain('data-testid="tmc-counts-explanation"');
    expect(TMC).toContain('data-testid="tmc-counts-company-library"');
    expect(TMC).toContain('data-testid="tmc-counts-sd-sops"');
    expect(TMC).toContain('data-testid="tmc-counts-week1-assets"');
    expect(TMC).toContain("Resource Upload Center");
    expect(TMC).toContain("uploaded company resources");
    expect(TMC).toContain("State Director launch path");
    expect(TMC).toContain("learner-visible");
  });

  it("Control Room hides the right AI/progress rail", () => {
    expect(TMC).toContain('nav !== "control-room"');
  });

  it("Resource Upload Center summary includes new clarifying labels", () => {
    expect(RUC).toContain("All company resources");
    expect(RUC).toContain("Learner-visible published");
    expect(RUC).toContain("State Director SOPs connected");
    expect(RUC).toContain("Week 1 screenshots matched");
    expect(RUC).toContain("Needs action");
  });

  it("Resource Upload Center sources Week 1 screenshot counts from shared helper", () => {
    expect(RUC).toContain("computeSdScreenshotCoverage");
  });

  it("Control Room does not import or render the legacy TrainingControlRoom", () => {
    expect(TMC).not.toMatch(/from\s+"@\/components\/training\/TrainingControlRoom"/);
    expect(TMC).not.toMatch(/<TrainingControlRoom\s*\/?>/);
  });

  it("Control Room renders the two named top-level sections with test ids", () => {
    expect(TMC).toContain('data-testid="tmc-launch-readiness-section"');
    expect(TMC).toContain('data-testid="tmc-resource-asset-coverage-section"');
    expect(TMC).toContain("State Director Launch Readiness");
    expect(TMC).toContain("Resource & Asset Coverage");
  });

  it("Control Room renders the four-card launch status row", () => {
    expect(TMC).toContain('data-testid="tmc-launch-status-row"');
    expect(TMC).toContain("Week 1 modules");
    expect(TMC).toContain("SOPs connected");
    expect(TMC).toContain("Screenshots matched");
    expect(TMC).toContain("Welcome video");
  });

  it("Resource Upload Center SD Launch SOPs panel has What to fix next", () => {
    expect(RUC).toContain('data-testid="sd-launch-sops-fix-next"');
    expect(RUC).toContain("What to fix next");
    expect(RUC).toContain("Missing titles");
    expect(RUC).toContain("File repairs");
    expect(RUC).toContain("Title cleanup");
    expect(RUC).toContain("Held review");
  });
});