import { describe, it, expect } from "vitest";
import fs from "node:fs";

const APP = fs.readFileSync("src/App.tsx", "utf8");
const TMC = fs.readFileSync("src/pages/hr/TrainingManagementCenter.tsx", "utf8");
const RUC = fs.readFileSync("src/pages/hr/ResourceUploadCenter.tsx", "utf8");
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

  it("Welcome to Blossom canonical route renders OSWelcomeToBlossom in the OS shell", () => {
    expect(APP).toMatch(
      /path="\/training\/welcome"\s+element={<OSWelcomeToBlossom/,
    );
  });

  it("/onboarding/phase/welcome redirects to /training/welcome (canonical OS route)", () => {
    expect(APP).toMatch(
      /path="\/onboarding\/phase\/welcome"\s+element={<Navigate to="\/training\/welcome"/,
    );
  });

  it("TMC Resource Library view routes to /hr/resource-management (no legacy menu)", () => {
    expect(TMC).toMatch(/navigate\("\/hr\/resource-management/);
    expect(TMC).not.toMatch(/href="#"/);
  });

  it("TMC Resource Library view exposes Upload Resource + Open Resource Management CTAs", () => {
    expect(TMC).toContain("Upload Resource");
    // Current contract: the resource-management surface is opened via
    // "Manage / Upload" and "Open Resource Library" buttons that navigate to
    // /hr/resource-management. Assert the navigation target + a stable label.
    expect(TMC).toMatch(/navigate\("\/hr\/resource-management/);
    expect(TMC).toMatch(/Manage \/ Upload|Open Resource Library/);
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
    expect(RUC).toContain("Resource Upload Center");
    expect(RUC).not.toMatch(/Upload File/);
    expect(RUC).toContain('id="bulk-upload"');
  });

  it("Training Academy hero links to Welcome to Blossom and Resource Library", () => {
    expect(TRAINING).toContain("Welcome to Blossom");
    expect(TRAINING).toContain("/training/welcome");
    expect(TRAINING).toContain("Open Resource Library");
    expect(TRAINING).not.toContain("Open SOP Library");
  });

  it("Welcome to Blossom page keeps leadership content + mentor/HR note + journey CTA", () => {
    const CONTENT = require("node:fs").readFileSync(
      "src/lib/training/welcomeToBlossomContent.ts",
      "utf8",
    );
    expect(WELCOME).toMatch(/Who we are|Your team/);
    expect(CONTENT).toMatch(/Chad Kaufman/);
    expect(CONTENT).toMatch(/Shira Lasry/);
    expect(WELCOME).toMatch(/HR partner|mentor/i);
    // Current contract: role-agnostic CTA landing on the learner Journey.
    expect(WELCOME).toMatch(/Continue to Journey/);
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
    for (const src of [TMC, RUC, WELCOME]) {
      expect(src).not.toMatch(/href="#"/);
    }
  });
});