import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  SD_EVIDENCE_PANELS,
  SD_EVIDENCE_PANEL_MODULE_IDS,
  getStateDirectorEvidencePanel,
} from "@/lib/training/stateDirectorEvidencePanels";
import {
  SD_VISUAL_RESOURCE_METADATA,
  SD_VISUAL_RESOURCE_COUNT,
} from "@/lib/training/stateDirectorVisualMetadata";

const EXPECTED_EVIDENCE_IDS = [
  "sd-w4d5-scheduling-shadow",
  "sd-w4d5-recruiting-shadow",
  "sd-w4d5-bcba-shadow",
  "sd-w4d5-state-director-shadow",
  "sd-w5d5-final-knowledge-review",
  "sd-w5d5-readiness-assessment",
  "sd-w5d5-leadership-sign-off",
  "sd-w5d5-state-director-certification",
];

describe("State Director evidence panels", () => {
  it("registers exactly the 8 expected module ids", () => {
    expect(SD_EVIDENCE_PANEL_MODULE_IDS.sort()).toEqual(
      [...EXPECTED_EVIDENCE_IDS].sort(),
    );
    expect(SD_EVIDENCE_PANELS).toHaveLength(8);
  });

  it("each panel has purpose, observe, evidence, mentor review, completion", () => {
    for (const p of SD_EVIDENCE_PANELS) {
      expect(p.title.length).toBeGreaterThan(3);
      expect(p.purpose.length).toBeGreaterThan(20);
      expect(p.whatToObserve.length).toBeGreaterThan(0);
      expect(p.evidenceToCapture.length).toBeGreaterThan(0);
      expect(p.mentorReview.length).toBeGreaterThan(20);
      expect(p.completionCriteria.length).toBeGreaterThan(20);
    }
  });

  it("lookup returns null for non-evidence modules", () => {
    expect(getStateDirectorEvidencePanel("sd-w1d1-orientation")).toBeNull();
    expect(getStateDirectorEvidencePanel(EXPECTED_EVIDENCE_IDS[0])).not.toBeNull();
  });
});

describe("State Director visual resource metadata", () => {
  it("registers 71 expected screenshot resources", () => {
    expect(SD_VISUAL_RESOURCE_COUNT).toBe(71);
    expect(SD_VISUAL_RESOURCE_METADATA).toHaveLength(71);
  });

  it("never includes evidence-panel modules", () => {
    const ids = new Set(SD_VISUAL_RESOURCE_METADATA.map((m) => m.moduleId));
    for (const id of EXPECTED_EVIDENCE_IDS) {
      expect(ids.has(id)).toBe(false);
    }
  });

  it("uses the resource-library storage bucket and does not fake URLs", () => {
    for (const m of SD_VISUAL_RESOURCE_METADATA) {
      expect(m.storageBucket).toBe("resource-library");
      expect(m.expectedStoragePathPrefix).toMatch(/^state-director\/visual\//);
      expect((m as unknown as { url?: string }).url).toBeUndefined();
    }
  });
});

describe("OSTrainingDetail evidence panel rendering", () => {
  const PAGE = fs.readFileSync("src/pages/os/OSTrainingDetail.tsx", "utf8");

  it("imports the evidence panel helper", () => {
    expect(PAGE).toMatch(/getStateDirectorEvidencePanel/);
  });

  it("renders the rich evidence panel test id", () => {
    expect(PAGE).toContain('data-testid="sd-evidence-panel"');
    expect(PAGE).toContain("What to observe");
    expect(PAGE).toContain("Evidence to capture");
    expect(PAGE).toContain("Mentor review");
    expect(PAGE).toContain("Completion criteria");
  });

  it("does not use href=\"#\" placeholders", () => {
    expect(PAGE).not.toMatch(/href="#"/);
  });
});

describe("Training Management visual readiness", () => {
  const PANEL = fs.readFileSync(
    "src/components/training/SDLaunchReadinessPanel.tsx",
    "utf8",
  );
  it("surfaces evidence-panels-ready count alongside screenshots", () => {
    expect(PANEL).toMatch(/evidence panels ready/);
    expect(PANEL).toMatch(/walkthrough screenshots available/);
  });
});