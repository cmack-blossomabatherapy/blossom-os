import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const OS_LEADS = read("src/pages/os/OSLeadsV2.tsx");
const MISSING_INFO = read("src/pages/os/intake/MissingInformation.tsx");
const LEAD_ACTION_PANEL = read("src/components/intake/LeadActionPanel.tsx");
const INTAKE_MODALS = read("src/components/intake/IntakeModals.tsx");
const PARENT_COMMS = read("src/pages/os/intake/ParentCommunication.tsx");
const INTAKE_DASHBOARD = read("src/pages/os/intake/IntakeDashboard.tsx");

describe("Intake Export 87 — UI canonical stage usage", () => {
  describe("OSLeadsV2 — /leads page", () => {
    it("imports and uses canonicalFamilyLeadStage", () => {
      expect(OS_LEADS).toMatch(/canonicalFamilyLeadStage/);
      expect(OS_LEADS).toMatch(/from\s+"@\/lib\/intake\/intakeWorkflow"/);
    });
    it("imports FAMILY_LEAD_PIPELINE_STAGES and uses it to build pipeline columns", () => {
      expect(OS_LEADS).toMatch(/FAMILY_LEAD_PIPELINE_STAGES/);
      expect(OS_LEADS).toMatch(/FAMILY_LEAD_PIPELINE_STAGES\.map/);
    });
    it("does not manually assign VOB Completed under the Benefits tab/column", () => {
      // The Benefits tab/column must not list legacy "VOB Completed" — it
      // canonically maps to Assessment Scheduling.
      const benefitsLines = OS_LEADS
        .split("\n")
        .map((l) => l.trim())
        .filter((line) => /benefits/i.test(line))
        .filter((line) => !line.startsWith("//") && !line.startsWith("*") && !line.startsWith("/*"));
      const offending = benefitsLines.filter((line) => /VOB Completed/.test(line));
      expect(offending).toEqual([]);
    });
    it("bulk move options are canonical and do not expose the old primary stage list", () => {
      const bulkMatch = OS_LEADS.match(/BULK_STATUS_OPTIONS[^=]*=\s*([\s\S]*?);/);
      expect(bulkMatch).not.toBeNull();
      const block = bulkMatch![1];
      expect(block).toMatch(/FAMILY_LEAD_PIPELINE_STAGES/);
      expect(block).not.toMatch(/"New Lead"/);
      expect(block).not.toMatch(/"Sent Form"/);
      expect(block).not.toMatch(/"Sent to VOB"/);
      expect(block).not.toMatch(/"VOB Completed"/);
      expect(block).not.toMatch(/"Form Received"/);
      expect(block).not.toMatch(/"Missing Information"/);
    });
  });

  describe("MissingInformation", () => {
    it("uses canonicalFamilyLeadStage to detect packet follow-up", () => {
      expect(MISSING_INFO).toMatch(/canonicalFamilyLeadStage/);
      expect(MISSING_INFO).toMatch(/Intake Packet Follow Up/);
    });
  });

  describe("LeadActionPanel", () => {
    it("moves missing-info leads to canonical Intake Packet Follow Up, not legacy Missing Information", () => {
      expect(LEAD_ACTION_PANEL).toMatch(/moveStage\(\[lead\.id\],\s*"Intake Packet Follow Up"\)/);
      // The legacy assignment must be gone.
      expect(LEAD_ACTION_PANEL).not.toMatch(/moveStage\(\[lead\.id\],\s*"Missing Information"\)/);
    });
  });

  describe("IntakeModals", () => {
    it("does not create new leads with legacy status 'New Lead'", () => {
      expect(INTAKE_MODALS).not.toMatch(/status:\s*"New Lead"/);
    });
    it("uses canonical 'Lead Captured' for manually added leads", () => {
      expect(INTAKE_MODALS).toMatch(/status:\s*"Lead Captured"/);
    });
    it("does not show 'Add inquiry' / 'New inquiry' / 'Inquiry added' language", () => {
      expect(INTAKE_MODALS).not.toMatch(/Add inquiry/);
      expect(INTAKE_MODALS).not.toMatch(/New inquiry/);
      expect(INTAKE_MODALS).not.toMatch(/Inquiry added/);
    });
    it("uses 'Add Lead' / 'Lead added' wording", () => {
      expect(INTAKE_MODALS).toMatch(/Add Lead/);
      expect(INTAKE_MODALS).toMatch(/Lead added/);
    });
  });

  describe("ParentCommunication", () => {
    it("does not use status !== 'VOB Completed' as the exclusion rule", () => {
      expect(PARENT_COMMS).not.toMatch(/status\s*!==\s*"VOB Completed"/);
    });
    it("uses the canonical isReadyToStartStage helper", () => {
      expect(PARENT_COMMS).toMatch(/isReadyToStartStage/);
    });
  });

  describe("IntakeDashboard", () => {
    it("uses canonicalFamilyLeadStage for stage-based grouping", () => {
      expect(INTAKE_DASHBOARD).toMatch(/canonicalFamilyLeadStage/);
      expect(INTAKE_DASHBOARD).toMatch(/FAMILY_LEAD_PIPELINE_STAGES/);
    });
  });
});