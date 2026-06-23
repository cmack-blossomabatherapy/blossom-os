import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  FAMILY_LEAD_PIPELINE_STAGES,
  canonicalFamilyLeadStage,
  getNextFamilyLeadStage,
  getPreviousFamilyLeadStage,
  isReadyToStartStage,
  FAMILY_LEAD_STAGE_OWNERS,
} from "@/lib/intake/intakeWorkflow";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Export 79 — Operationalize Ready-To-Start pipeline", () => {
  it("LeadStatus union includes all 13 canonical family lead stages", () => {
    const src = read("src/data/leads.ts");
    for (const stage of FAMILY_LEAD_PIPELINE_STAGES) {
      expect(src).toContain(`"${stage}"`);
    }
  });

  it("FAMILY_LEAD_PIPELINE_STAGES still matches the 13-stage workflow", () => {
    expect(FAMILY_LEAD_PIPELINE_STAGES.length).toBe(13);
    expect(FAMILY_LEAD_PIPELINE_STAGES[0]).toBe("Lead Captured");
    expect(FAMILY_LEAD_PIPELINE_STAGES[FAMILY_LEAD_PIPELINE_STAGES.length - 1]).toBe(
      "Ready to Start Services",
    );
  });

  it("VOB Completed maps to Assessment Scheduling, not Ready to Start Services", () => {
    expect(canonicalFamilyLeadStage("VOB Completed")).toBe("Assessment Scheduling");
    expect(isReadyToStartStage("VOB Completed")).toBe(false);
  });

  it("isReadyToStartStage is true only for ready-to-start equivalents", () => {
    expect(isReadyToStartStage("Ready to Start Services")).toBe(true);
    expect(isReadyToStartStage("Pending Start")).toBe(true);
    expect(isReadyToStartStage("Ready for Start")).toBe(true);
    expect(isReadyToStartStage("Staffing Match")).toBe(false);
    expect(isReadyToStartStage("Authorization Pending")).toBe(false);
    expect(isReadyToStartStage(null)).toBe(false);
    expect(isReadyToStartStage(undefined)).toBe(false);
  });

  it("getNextFamilyLeadStage walks the final three stages", () => {
    expect(getNextFamilyLeadStage("QA / Treatment Plan Authorization")).toBe(
      "Authorization Pending",
    );
    expect(getNextFamilyLeadStage("Authorization Pending")).toBe("Staffing Match");
    expect(getNextFamilyLeadStage("Staffing Match")).toBe("Ready to Start Services");
    expect(getNextFamilyLeadStage("Ready to Start Services")).toBeNull();
  });

  it("getNextFamilyLeadStage / getPreviousFamilyLeadStage alias legacy statuses", () => {
    // "VOB Completed" (legacy) → canonical "Assessment Scheduling" → next is QA / TPA.
    expect(getNextFamilyLeadStage("VOB Completed")).toBe(
      "QA / Treatment Plan Authorization",
    );
    expect(getPreviousFamilyLeadStage("Lead Captured")).toBeNull();
    expect(getPreviousFamilyLeadStage("Staffing Match")).toBe("Authorization Pending");
  });

  it("FAMILY_LEAD_STAGE_OWNERS labels every canonical stage", () => {
    for (const stage of FAMILY_LEAD_PIPELINE_STAGES) {
      expect(FAMILY_LEAD_STAGE_OWNERS[stage]).toBeTruthy();
    }
    expect(FAMILY_LEAD_STAGE_OWNERS["Authorization Pending"]).toBe("Authorizations");
    expect(FAMILY_LEAD_STAGE_OWNERS["Staffing Match"]).toBe("Staffing");
    expect(FAMILY_LEAD_STAGE_OWNERS["Ready to Start Services"]).toBe(
      "Scheduling / Operations",
    );
  });

  it("LeadToActivePipeline uses canonical movement (no partial STAGE_TO_LEAD_STATUS map)", () => {
    const src = read("src/pages/os/intake/LeadToActivePipeline.tsx");
    expect(src).not.toMatch(/STAGE_TO_LEAD_STATUS/);
    expect(src).toMatch(/getNextFamilyLeadStage/);
    expect(src).toMatch(/getPreviousFamilyLeadStage/);
    expect(src).toMatch(/FAMILY_LEAD_STAGE_OWNERS/);
    expect(src).toMatch(/managed in a separate workflow/);
  });

  it("IntakeDashboard uses isReadyToStartStage for the Ready to Start (30d) metric", () => {
    const src = read("src/pages/os/intake/IntakeDashboard.tsx");
    expect(src).toMatch(/isReadyToStartStage/);
    expect(src).toMatch(/Ready to Start \(30d\)/);
    // Copy updated away from "active care" language for this pipeline.
    expect(src).toMatch(/ready to start services/);
    expect(src).not.toMatch(/movement from lead to active care/);
    expect(src).not.toMatch(/lead through active care/);
    // VOB Completed must not be the literal handoff-ready filter anymore.
    expect(src).not.toMatch(/l\.status === "VOB Completed"/);
  });

  it("No automation/network logic added to the workflow file in this pass", () => {
    const src = read("src/lib/intake/intakeWorkflow.ts");
    expect(src).not.toMatch(/supabase\./);
    expect(src).not.toMatch(/setInterval\(/);
    expect(src).not.toMatch(/setTimeout\(/);
    expect(src).not.toMatch(/fetch\(/);
  });
});