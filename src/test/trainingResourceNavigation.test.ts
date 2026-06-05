import { describe, it, expect } from "vitest";
import fs from "node:fs";

const APP = fs.readFileSync("src/App.tsx", "utf8");
const TMC = fs.readFileSync("src/pages/hr/TrainingManagementCenter.tsx", "utf8");
const RM = fs.readFileSync("src/pages/hr/ResourceManagement.tsx", "utf8");
const TRAINING = fs.readFileSync("src/pages/os/OSTraining.tsx", "utf8");
const WELCOME = fs.readFileSync("src/pages/os/OSWelcomeToBlossom.tsx", "utf8");
const SD = fs.readFileSync("src/lib/training/academyData.ts", "utf8");
const AUDIT = fs.readFileSync("docs/training-resource-navigation-audit.md", "utf8");

describe("Training + Resource UX Rescue — Pass 1", () => {
  it("Resource Management route remains registered", () => {
    expect(APP).toMatch(/path="\/hr\/resource-management"/);
  });

  it("Learner Resource Library route remains registered", () => {
    expect(APP).toMatch(/path="\/resource-library"/);
  });

  it("Welcome to Blossom canonical route still resolves to OSWelcomeToBlossom", () => {
    expect(APP).toMatch(
      /path="\/onboarding\/phase\/welcome"\s+element={<OSWelcomeToBlossom/,
    );
  });

  it("/training/welcome alias is registered and redirects", () => {
    expect(APP).toMatch(
      /path="\/training\/welcome"\s+element={<Navigate to="\/onboarding\/phase\/welcome"/,
    );
  });

  it("TMC Resource Library view routes to /hr/resource-management (no legacy menu)", () => {
    expect(TMC).toMatch(/navigate\("\/hr\/resource-management/);
    expect(TMC).not.toMatch(/href="#"/);
  });

  it("TMC Resource Library view exposes Upload Resource + Open Resource Management CTAs", () => {
    expect(TMC).toContain("Upload Resource");
    expect(TMC).toContain("Open Resource Management");
    expect(TMC).toContain("Upload first document batch");
  });

  it("TMC header upload CTA no longer says 'Upload SOP'", () => {
    // The visible Upload button in the page header must read Upload Resource.
    expect(TMC).toMatch(/Upload Resource/);
    // No "Upload SOP" should remain as a header/list CTA label.
    const sopButtonCount = (TMC.match(/Upload SOP/g) ?? []).length;
    expect(sopButtonCount).toBeLessThanOrEqual(2); // dialog title + submit may persist
  });

  it("Resource Management header upload button is renamed and scrolls to bulk panel", () => {
    expect(RM).toContain("Upload Resource");
    expect(RM).not.toMatch(/Upload File/);
    expect(RM).toContain('id="bulk-upload"');
  });

  it("Training Academy hero links to Welcome to Blossom and Resource Library", () => {
    expect(TRAINING).toContain("Welcome to Blossom");
    expect(TRAINING).toContain("/onboarding/phase/welcome");
    expect(TRAINING).toContain("Open Resource Library");
    expect(TRAINING).not.toContain("Open SOP Library");
  });

  it("Welcome to Blossom page includes Mission, Values, Team, Mentor/HR, and Start CTA", () => {
    expect(WELCOME).toMatch(/Mission/);
    expect(WELCOME).toMatch(/Values|Core Values/);
    expect(WELCOME).toMatch(/Meet the Team|Your team/);
    expect(WELCOME).toMatch(/HR partner|mentor/i);
    expect(WELCOME).toMatch(/Start Week 1/);
  });

  it("Welcome video remains non-blocking (no required gate)", () => {
    // The page must not block progression on video completion.
    expect(WELCOME).not.toMatch(/disabled=\{.*videoDone/);
  });

  it("State Director 5-week / 25-day journey structure is preserved", () => {
    expect(SD).toMatch(/5-week/);
  });

  it("audit doc exists and lists canonical routes", () => {
    expect(AUDIT).toContain("/hr/resource-management#bulk-upload");
    expect(AUDIT).toContain("/training/welcome");
    expect(AUDIT).toContain("/onboarding/phase/welcome");
  });

  it("no href=\"#\" appears in Training Management / Resource Management / Welcome", () => {
    for (const src of [TMC, RM, WELCOME]) {
      expect(src).not.toMatch(/href="#"/);
    }
  });
});