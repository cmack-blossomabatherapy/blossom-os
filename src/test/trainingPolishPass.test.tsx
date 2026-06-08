import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { cleanResourceTitle, inferResourceCategoryFromTitle } from "@/lib/resources/resourceDisplay";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Training polish pass — Need Help mentor/HR routing", () => {
  const needHelp = read("src/components/training/NeedHelpPanel.tsx");
  const sdLearner = read("src/components/training/SDLearnerHome.tsx");
  const osTraining = read("src/pages/os/OSTraining.tsx");

  it("NeedHelpPanel uses mentor email mailto and HR mailto, not /messages", () => {
    expect(needHelp).toMatch(/mailto:\$\{mentor\.email\}/);
    expect(needHelp).toMatch(/HR@blossomabatherapy\.com/);
    expect(needHelp).not.toMatch(/to="\/messages"/);
  });

  it("Need Help panels are no longer hardcoded to /messages in either page", () => {
    expect(sdLearner).not.toMatch(/label:\s*"Ask my mentor".*\/messages/);
    expect(osTraining).not.toMatch(/label:\s*"Ask my mentor".*\/messages/);
    expect(sdLearner).toMatch(/<NeedHelpPanel/);
    expect(osTraining).toMatch(/<NeedHelpPanel/);
  });

  it("Missing-mentor calm state is wired", () => {
    expect(needHelp).toMatch(/Mentor not assigned yet/);
    expect(needHelp).toMatch(/Assign a mentor in User Management/);
  });
});

describe("Training polish pass — User Management mentor selector", () => {
  const file = read("src/pages/os/users/EmployeeProfile.tsx");
  it("renders a Mentor selector in Employment that saves mentor_id", () => {
    expect(file).toMatch(/data-testid="employment-mentor"/);
    expect(file).toMatch(/saveMentor/);
    expect(file).toMatch(/mentor_id:\s*nextId/);
    expect(file).toMatch(/Used by Training Academy for mentor help/);
  });
  it("blocks selecting self as mentor", () => {
    expect(file).toMatch(/An employee can't mentor themselves/);
  });
});

describe("Training polish pass — Resource title cleanup", () => {
  it("cleanResourceTitle strips order + W#D# + extension", () => {
    expect(cleanResourceTitle("34 W2D4 Operational Prioritization SOP.pdf"))
      .toBe("Operational Prioritization SOP");
    expect(cleanResourceTitle("W1D1 Mission & Vision.docx")).toBe("Mission & Vision");
    expect(cleanResourceTitle("07-W3D2 Auth Statuses SOP")).toBe("Auth Statuses SOP");
    expect(cleanResourceTitle("W2 · D4 - Recruiting Pipeline")).toBe("Recruiting Pipeline");
  });
  it("inferResourceCategoryFromTitle routes SD content to leadership", () => {
    expect(inferResourceCategoryFromTitle("W2D4 Operational Prioritization SOP"))
      .toBe("leadership");
    expect(inferResourceCategoryFromTitle("Employee Handbook")).toBe("hr");
    expect(inferResourceCategoryFromTitle("Auth Renewal Checklist")).toBe("insurance");
  });
  it("ResourceBulkUploadPanel defaults candidate titles to cleaned names", () => {
    const file = read("src/components/resources/ResourceBulkUploadPanel.tsx");
    expect(file).toMatch(/cleanResourceTitle\(name\)/);
    expect(file).toMatch(/inferResourceCategoryFromTitle/);
  });
  it("Resource Library renders cleaned titles, not raw W/D prefixes", () => {
    const file = read("src/pages/os/OSResourceLibrary.tsx");
    expect(file).toMatch(/cleanResourceTitle\(r\.title\)/);
    expect(file).not.toMatch(/>\{r\.title\}</);
  });
});

describe("Training polish pass — SD module detail hero", () => {
  const file = read("src/pages/os/OSTrainingDetail.tsx");
  it("renders a single SD hero — no duplicate Start here intro + summary cards", () => {
    expect(file).toMatch(/data-testid="sd-module-hero"/);
    expect(file).toMatch(/data-testid="sd-module-hero-title"/);
    expect(file).not.toMatch(/data-testid="sd-start-here"/);
    // Only one rendering of `displayTitle` in the hero region — the duplicate
    // h2 summary card has been removed.
    const matches = file.match(/\{displayTitle\}/g) ?? [];
    expect(matches.length).toBeLessThanOrEqual(1);
  });
  it("calmer copy when no enrollment is linked", () => {
    expect(file).toMatch(/Progress will sync once enrollment is linked\./);
    expect(file).not.toMatch(/Local-only progress \(no enrollment linked\)/);
  });
});
