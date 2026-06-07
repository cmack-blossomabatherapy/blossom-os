import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  getStateDirectorFullContent,
  isStateDirectorModule,
  SD_CURATED_MODULE_IDS,
} from "@/lib/training/stateDirectorFullTraining";
import type { Training } from "@/lib/training/academyData";

const src = fs.readFileSync(
  path.join(process.cwd(), "src/pages/os/OSTrainingDetail.tsx"),
  "utf8",
);

function makeSdTraining(id: string, title: string): Training {
  return {
    id, title, description: "",
    type: "SOP", estimatedMinutes: 20, required: true,
    category: "role", department: "state_operations",
  };
}

describe("State Director full module content", () => {
  it("isStateDirectorModule recognizes sd- ids and state_operations department", () => {
    expect(isStateDirectorModule({ id: "sd-w1d1-x" })).toBe(true);
    expect(isStateDirectorModule({ id: "x", department: "state_operations" })).toBe(true);
    expect(isStateDirectorModule({ id: "intake-foundations", department: "intake" })).toBe(false);
  });

  it("returns full content for every SD module — curated or derived", () => {
    const samples = [
      "sd-w1d1-welcome-video-from-blossom",
      "sd-w1d1-mission-vision",
      "sd-w2d4-lead-lifecycle",
      "sd-w3d1-authorization-lifecycle",
      "sd-w4d2-coverage-gaps",
      "sd-w5d3-parent-escalations",
    ];
    for (const id of samples) {
      const t = makeSdTraining(id, `W? · D? — ${id}`);
      const c = getStateDirectorFullContent(t);
      expect(c, `missing content for ${id}`).toBeTruthy();
      expect(c!.learningObjective.length).toBeGreaterThan(10);
      expect(c!.stateDirectorLens.length).toBeGreaterThan(10);
      expect(c!.stepByStep.length).toBeGreaterThanOrEqual(5);
      for (const s of c!.stepByStep) {
        expect(s.action.length).toBeGreaterThan(5);
        expect(s.lookFor.length).toBeGreaterThan(3);
        expect(s.owner.length).toBeGreaterThan(0);
      }
      expect(c!.sop.purpose.length).toBeGreaterThan(10);
      expect(c!.sop.process.length).toBeGreaterThanOrEqual(3);
      expect(c!.sop.escalationTriggers.length).toBeGreaterThanOrEqual(1);
      expect(c!.sop.qualityStandard.length).toBeGreaterThan(5);
      expect(c!.sop.reviewRhythm.length).toBeGreaterThan(5);
      expect(c!.scenario.situation.length).toBeGreaterThan(10);
      expect(c!.scenario.prompt.length).toBeGreaterThan(5);
      expect(c!.scenario.expectedResponse.length).toBeGreaterThan(10);
      expect(c!.scenario.escalationPath.length).toBeGreaterThan(5);
      expect(c!.knowledgeCheck.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("returns null for non-SD modules", () => {
    const t: Training = {
      id: "intake-foundations", title: "Intake", description: "",
      type: "SOP", estimatedMinutes: 10, category: "role", department: "intake",
    };
    expect(getStateDirectorFullContent(t)).toBeNull();
  });

  it("exposes curated module ids", () => {
    expect(SD_CURATED_MODULE_IDS.length).toBeGreaterThan(0);
    expect(SD_CURATED_MODULE_IDS).toContain("sd-w1d1-welcome-video-from-blossom");
  });
});

describe("SD module detail page rendering", () => {
  it("imports the full-content helper", () => {
    expect(src).toMatch(/getStateDirectorFullContent/);
    expect(src).toMatch(/stateDirectorFullTraining/);
  });

  it("renders all required full-content section testids", () => {
    for (const id of [
      "sd-state-director-lens",
      "sd-walkthrough",
      "sd-sop",
      "sd-scenario",
      "sd-knowledge-check",
      "sd-notes",
      "sd-resources",
      "sd-signoff",
    ]) {
      expect(src, `missing ${id}`).toMatch(new RegExp(`data-testid="${id}"`));
    }
  });

  it("prefers full-content knowledge check over generic default", () => {
    // The quizQs chain must consult fullContent.knowledgeCheck before defaultKnowledgeCheck
    expect(src).toMatch(/fullContent\?\.knowledgeCheck[\s\S]{0,120}defaultKnowledgeCheck\(training\)/);
  });

  it("renders SOP fields (purpose, owner, inputs, process, escalation, quality, rhythm)", () => {
    for (const label of [
      ">Purpose<",
      ">Owner<",
      ">Inputs<",
      ">Process<",
      "Escalation triggers",
      "Quality standard",
      "State Director review rhythm",
    ]) {
      expect(src, `missing SOP label ${label}`).toContain(label);
    }
  });

  it("scenario practice can hide/show expected response", () => {
    expect(src).toMatch(/data-testid="sd-scenario-toggle"/);
    expect(src).toMatch(/data-testid="sd-scenario-expected"/);
    expect(src).toMatch(/showExpected/);
  });

  it("walkthrough renders action / look for / owner / escalation", () => {
    expect(src).toContain("Look for:");
    expect(src).toContain("Owner:");
    expect(src).toContain("Escalate when:");
  });

  it("completion still routes through DB-backed helpers and resource library link", () => {
    expect(src).toMatch(/completeLearnerModule\(/);
    expect(src).toMatch(/startLearnerModule\(/);
    expect(src).toMatch(/to="\/resource-library"/);
  });

  it("pending resources render as pending, not broken links", () => {
    expect(src).toMatch(/isPendingResource\(r\)/);
    expect(src).toMatch(/data-testid="resource-pending"/);
  });
});
