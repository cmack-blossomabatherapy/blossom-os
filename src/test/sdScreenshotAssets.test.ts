import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  getStateDirectorScreenshots,
  getStateDirectorScreenshotById,
  isScreenshotPiiSafe,
  SD_PRIORITY_SCREENSHOT_MODULES,
  SD_SCREENSHOT_PII_KEYWORDS,
  type SDScreenshotAsset,
} from "@/lib/training/stateDirectorFullTraining";

const src = fs.readFileSync(
  path.join(process.cwd(), "src/pages/os/OSTrainingDetail.tsx"),
  "utf8",
);

const PRIORITY = [
  // Week 2
  "sd-w2d1-cr-overview","sd-w2d1-navigation","sd-w2d1-calendar-basics",
  "sd-w2d2-calendar-views","sd-w2d2-session-tracking",
  "sd-w2d3-converted-sessions","sd-w2d3-non-converted-sessions",
  "sd-w2d4-lead-lifecycle","sd-w2d4-intake-workflow",
  "sd-w2d5-vob-process","sd-w2d5-client-workflow",
  // Week 3
  "sd-w3d1-authorization-lifecycle","sd-w3d1-auth-statuses","sd-w3d1-submission-process",
  "sd-w3d2-progress-reports","sd-w3d3-utilization",
  "sd-w3d4-expiring-auths","sd-w3d4-missing-prs",
  "sd-w3d5-utilization-management",
  // Week 4
  "sd-w4d1-staffing-structure","sd-w4d2-coverage-gaps","sd-w4d2-cancellations",
  "sd-w4d3-recruiting-workflow","sd-w4d3-candidate-pipeline",
  "sd-w4d3-interview-process","sd-w4d3-hiring-flow",
  "sd-w4d4-viventium-workflow",
  // Week 5
  "sd-w5d1-utilization-kpis","sd-w5d1-staffing-kpis",
  "sd-w5d1-client-kpis","sd-w5d1-recruiting-kpis",
  "sd-w5d2-weekly-meetings","sd-w5d2-escalation-tracking",
  "sd-w5d4-state-health-monitoring",
];

describe("State Director screenshot assets", () => {
  it("registers at least one screenshot for each priority module", () => {
    for (const id of PRIORITY) {
      const shots = getStateDirectorScreenshots(id);
      expect(shots.length, `missing screenshot for ${id}`).toBeGreaterThanOrEqual(1);
    }
    // sanity: registry contains the priority modules
    for (const id of PRIORITY) {
      expect(SD_PRIORITY_SCREENSHOT_MODULES).toContain(id);
    }
  });

  it("every screenshot has alt text and 2-4 callouts", () => {
    for (const id of SD_PRIORITY_SCREENSHOT_MODULES) {
      for (const shot of getStateDirectorScreenshots(id)) {
        expect(shot.alt.length, `alt missing for ${shot.id}`).toBeGreaterThan(10);
        expect(shot.callouts?.length ?? 0).toBeGreaterThanOrEqual(2);
        expect(shot.callouts?.length ?? 0).toBeLessThanOrEqual(4);
      }
    }
  });

  it("all default registered screenshots are pending_upload (no broken imageUrl)", () => {
    for (const id of SD_PRIORITY_SCREENSHOT_MODULES) {
      for (const shot of getStateDirectorScreenshots(id)) {
        expect(shot.resourceStatus).toBe("pending_upload");
        expect(shot.imageUrl).toBeUndefined();
      }
    }
  });

  it("isScreenshotPiiSafe rejects training_safe assets containing PII keywords", () => {
    const bad: SDScreenshotAsset = {
      id: "x", moduleId: "sd-w2d1-cr-overview",
      title: "Client DOB and member ID view",
      description: "Shows client phone and email.",
      alt: "screenshot",
      resourceStatus: "available",
      sensitivity: "training_safe",
    };
    expect(isScreenshotPiiSafe(bad)).toBe(false);

    const ok: SDScreenshotAsset = {
      id: "y", moduleId: "sd-w2d1-cr-overview",
      title: "Calendar month view",
      description: "Coverage triage view.",
      alt: "calendar",
      resourceStatus: "available",
      sensitivity: "training_safe",
    };
    expect(isScreenshotPiiSafe(ok)).toBe(true);
  });

  it("no registered training_safe screenshot contains PII keywords in metadata", () => {
    for (const id of SD_PRIORITY_SCREENSHOT_MODULES) {
      for (const shot of getStateDirectorScreenshots(id)) {
        if (shot.sensitivity === "training_safe") {
          expect(isScreenshotPiiSafe(shot), `${shot.id} appears unsafe`).toBe(true);
        }
      }
    }
  });

  it("PII keyword list covers core identifiers", () => {
    for (const kw of ["dob", "ssn", "address", "phone", "email"]) {
      expect(SD_SCREENSHOT_PII_KEYWORDS).toContain(kw);
    }
  });

  it("getStateDirectorScreenshotById round-trips registered assets", () => {
    const shots = getStateDirectorScreenshots("sd-w2d1-calendar-basics");
    expect(shots.length).toBeGreaterThan(0);
    const a = shots[0];
    expect(getStateDirectorScreenshotById(a.id)?.id).toBe(a.id);
    expect(getStateDirectorScreenshotById("does-not-exist")).toBeNull();
  });

  it("OSTrainingDetail renders pending + held-for-redaction copy and avoids broken images", () => {
    expect(src).toContain("Screenshot pending");
    expect(src).toContain("Screenshot held for redaction");
    // Renderer must only show <img> when safeToShow is true (guards imageUrl)
    expect(src).toContain("safeToShow");
    expect(src).toMatch(/data-testid="sd-screenshot"/);
  });
});