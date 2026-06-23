import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  FAMILY_LEAD_PIPELINE_STAGES,
  canonicalFamilyLeadStage,
  isReadyToStartStage,
  getNextFamilyLeadStage,
} from "@/lib/intake/intakeWorkflow";
import { statusVariant, kpiFilters, calculateKpis, type Lead } from "@/data/leads";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Export 80 — Cleanup Legacy Intake Actions + Metrics", () => {
  const panel = read("src/components/intake/LeadActionPanel.tsx");
  const leadsSrc = read("src/data/leads.ts");
  const dash = read("src/pages/os/intake/IntakeDashboard.tsx");

  it("LeadActionPanel uses canonical family lead stage helpers", () => {
    expect(panel).toContain("getNextFamilyLeadStage");
    expect(panel).toContain("getPreviousFamilyLeadStage");
  });

  it("LeadActionPanel no longer imports legacy intake stage helpers", () => {
    expect(panel).not.toMatch(/getNextIntakeStage/);
    expect(panel).not.toMatch(/getPreviousIntakeStage/);
  });

  it("LeadActionPanel removes the Patient Lifetime Journey shortcut", () => {
    expect(panel).not.toContain("/patient-journey");
  });

  it("LeadActionPanel does not contain the active-care handoff copy", () => {
    expect(panel).not.toContain("Prepare active-care handoff");
  });

  it("LeadActionPanel does not reintroduce 'Log parent contact'", () => {
    expect(panel).not.toMatch(/Log parent contact/i);
  });

  it("leads.ts inline alert no longer says 'Ready to move to Clients'", () => {
    expect(leadsSrc).not.toContain("Ready to move to Clients");
  });

  it("statusVariant supports all 13 canonical Family / Lead Workflow stages", () => {
    for (const stage of FAMILY_LEAD_PIPELINE_STAGES) {
      expect(statusVariant(stage)).not.toBe("muted");
    }
  });

  it("Intake Dashboard aging uses canonical 13-stage workflow", () => {
    expect(dash).toContain("FAMILY_LEAD_PIPELINE_STAGES");
    expect(dash).toContain("canonicalFamilyLeadStage");
    expect(dash).not.toMatch(/AGING_STAGES:\s*LeadStatus\[\]/);
  });

  it("VOB Completed is never treated as ready-to-start", () => {
    expect(isReadyToStartStage("VOB Completed")).toBe(false);
    expect(canonicalFamilyLeadStage("VOB Completed")).toBe("Assessment Scheduling");
    const fakeLead = { status: "VOB Completed" } as Lead;
    expect(kpiFilters.readyToStart(fakeLead)).toBe(false);
  });

  it("Ready to Start Services is the only canonical terminal Intake pipeline stage", () => {
    expect(getNextFamilyLeadStage("Ready to Start Services")).toBeNull();
    const readyLead = { status: "Ready to Start Services" } as Lead;
    expect(kpiFilters.readyToStart(readyLead)).toBe(true);
  });

  it("calculateKpis exposes a readyToStart count", () => {
    const leads = [
      { status: "Ready to Start Services", daysInStage: 1, lastContacted: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { status: "VOB Completed", daysInStage: 1, lastContacted: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ] as unknown as Lead[];
    const k = calculateKpis(leads);
    expect(k.readyToStart).toBe(1);
  });

  it("No automation logic was added in this export", () => {
    // Sentinel: panel/dashboards must not introduce automation runners.
    expect(panel).not.toMatch(/automation\.run|runAutomation/i);
    expect(dash).not.toMatch(/automation\.run|runAutomation/i);
  });
});
