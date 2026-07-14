import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const OS_LEADS = read("src/pages/os/OSLeadsV2.tsx");
const INTAKE_DASHBOARD = read("src/pages/os/intake/IntakeDashboard.tsx");
const MISSING_INFO = read("src/pages/os/intake/MissingInformation.tsx");
const LEAD_ACTION_PANEL = read("src/components/intake/LeadActionPanel.tsx");
const PARENT_COMMS = read("src/pages/os/intake/ParentCommunication.tsx");
const ROLE_MENUS = read("src/lib/os/roleMenus.ts");
const INTAKE_WORKFLOW = read("src/lib/intake/intakeWorkflow.ts");
const NEW_LEAD_DIALOG = read("src/components/leads/NewLeadDialog.tsx");
const LEAD_DETAIL_DRAWER = read("src/components/leads/LeadDetailDrawer.tsx");
const LEADS_CONTEXT = read("src/contexts/LeadsContext.tsx");
const REPORTS = read("src/pages/Reports.tsx");
const RESOURCE_LIBRARY = read("src/pages/os/OSResourceLibrary.tsx");

/**
 * Export 88 — full Intake department launch. These assertions guard against
 * silent regressions back to Monday-era stage labels and product language.
 */
describe("Intake Export 88 — full department launch", () => {
  /* --------------------- 1. Pipeline canonicalization -------------------- */
  describe("Canonical pipeline usage", () => {
    it("intakeWorkflow exposes the helpers the rest of the system depends on", () => {
      expect(INTAKE_WORKFLOW).toMatch(/export function canonicalFamilyLeadStage/);
      expect(INTAKE_WORKFLOW).toMatch(/export function isReadyToStartStage/);
      expect(INTAKE_WORKFLOW).toMatch(/export function isNonQualifiedStatus/);
      expect(INTAKE_WORKFLOW).toMatch(/export function isCannotReachStatus/);
      expect(INTAKE_WORKFLOW).toMatch(/export function isLeadOutOfPipeline/);
      expect(INTAKE_WORKFLOW).toMatch(/export function hasMissingFormReview/);
    });

    it("OSLeadsV2 follow-up queues are computed via canonicalFamilyLeadStage / canonical helpers", () => {
      const followUpStart = OS_LEADS.indexOf("function FollowUpView");
      const followUpEnd = OS_LEADS.indexOf("function ", followUpStart + 20);
      const slice = OS_LEADS.slice(followUpStart, followUpEnd > 0 ? followUpEnd : OS_LEADS.length);
      expect(slice).toMatch(/canonicalFamilyLeadStage/);
      expect(slice).toMatch(/isCannotReachStatus|isLeadOutOfPipeline/);
    });

    it("OSLeadsV2 follow-up queues do not group by legacy primary labels", () => {
      const followUpStart = OS_LEADS.indexOf("function FollowUpView");
      const followUpEnd = OS_LEADS.indexOf("function ", followUpStart + 20);
      const slice = OS_LEADS.slice(followUpStart, followUpEnd > 0 ? followUpEnd : OS_LEADS.length);
      // Direct equality against any of these is forbidden inside FollowUpView.
      const legacyLabels = [
        '"New Lead"', '"In Contact"', '"Sent Form"', '"Form Received"',
        '"Missing Information"', '"Sent to VOB"', '"VOB Completed"',
      ];
      for (const label of legacyLabels) {
        expect(slice.includes(`l.status === ${label}`)).toBe(false);
        expect(slice.includes(`status === ${label}`)).toBe(false);
      }
    });

    it("OSLeadsV2 missing-only filter uses canonical Intake Packet Follow Up", () => {
      expect(OS_LEADS).toMatch(/canonicalFamilyLeadStage\(l\.status\)/);
      expect(OS_LEADS).toMatch(/"Intake Packet Follow Up"/);
      expect(OS_LEADS).toMatch(/hasMissingFormReview/);
      // Old check must be gone.
      expect(OS_LEADS).not.toMatch(
        /filters\.missingOnly\s*&&\s*l\.status\s*!==\s*"Missing Information"/,
      );
    });

    it("OSLeadsV2 StatusChip styles by canonical stage, not raw legacy labels", () => {
      const chipStart = OS_LEADS.indexOf("function StatusChip");
      const chipEnd = OS_LEADS.indexOf("function ", chipStart + 20);
      const slice = OS_LEADS.slice(chipStart, chipEnd);
      expect(slice).toMatch(/canonicalFamilyLeadStage|isReadyToStartStage|isNonQualifiedStatus/);
    });
  });

  /* ----------------------- 2. Intake Dashboard --------------------------- */
  describe("Intake Dashboard canonical counts", () => {
    it("does not define MISSING_STAGES / AWAITING_VOB_STAGES / LEAD_CAPTURED_STAGES sets", () => {
      expect(INTAKE_DASHBOARD).not.toMatch(/MISSING_STAGES\s*=/);
      expect(INTAKE_DASHBOARD).not.toMatch(/AWAITING_VOB_STAGES\s*=/);
      expect(INTAKE_DASHBOARD).not.toMatch(/LEAD_CAPTURED_STAGES\s*=/);
    });
    it("computes counts via canonicalFamilyLeadStage", () => {
      expect(INTAKE_DASHBOARD).toMatch(/canonicalFamilyLeadStage\(l\.status\)\s*===\s*"Lead Captured"/);
      expect(INTAKE_DASHBOARD).toMatch(/canonicalFamilyLeadStage\(l\.status\)\s*===\s*"Intake Packet Follow Up"/);
      expect(INTAKE_DASHBOARD).toMatch(/canonicalFamilyLeadStage\(l\.status\)\s*===\s*"Benefits Verification"/);
    });
    it("Open Family Pipeline hint says Lead Captured -> Ready to Start Services", () => {
      expect(INTAKE_DASHBOARD).toMatch(/Lead Captured\s*->\s*Ready to Start Services/);
    });
    it("Packet Follow Up / Missing Info card label replaces 'Missing Information'", () => {
      expect(INTAKE_DASHBOARD).toMatch(/Packet Follow Up \/ Missing Info/);
    });
    it("workspace card links to /intake/missing-information with new label", () => {
      expect(INTAKE_DASHBOARD).toMatch(/Packet Follow Up \/ Missing Info[\s\S]*\/intake\/missing-information/);
    });
  });

  /* ---------------------- 3. Missing Information page -------------------- */
  describe("Packet Follow Up / Missing Info page", () => {
    it("title and section use the new product language", () => {
      expect(MISSING_INFO).toMatch(/title="Packet Follow Up \/ Missing Info"/);
      expect(MISSING_INFO).toMatch(/Packet follow-up queue/);
      expect(MISSING_INFO).toMatch(/No packet follow-up items are blocked right now/);
    });
  });

  /* ---------------------- 4. Lead action panel --------------------------- */
  describe("LeadActionPanel canonical checks", () => {
    it("computes blocked-already via canonical stage, not legacy label equality", () => {
      expect(LEAD_ACTION_PANEL).toMatch(/canonicalCurrent\s*===\s*"Intake Packet Follow Up"/);
    });
    it("dialog title and toast use new product language", () => {
      expect(LEAD_ACTION_PANEL).toMatch(/Flag Packet Follow Up \/ Missing Info/);
      expect(LEAD_ACTION_PANEL).toMatch(/Moved to Intake Packet Follow Up|Packet follow-up flagged/);
    });
  });

  /* ------------------ 5. Parent Communication language ------------------- */
  describe("Parent Communication", () => {
    it("uses Benefits Verification language for the VOB template label", () => {
      expect(PARENT_COMMS).toMatch(/Benefits Verification Update/);
    });
    it("excludes out-of-pipeline leads via isLeadOutOfPipeline", () => {
      expect(PARENT_COMMS).toMatch(/isLeadOutOfPipeline/);
    });
    it("does not contain the old void canon dead-code pattern", () => {
      expect(PARENT_COMMS).not.toMatch(/void canon;/);
    });
  });

  /* --------------------- 6. Add Lead / lead detail ----------------------- */
  describe("Add Lead + Lead Detail", () => {
    it("new manual leads start at Lead Captured", () => {
      expect(NEW_LEAD_DIALOG).toMatch(/pipelineStage:\s*"Lead Captured"/);
    });
    it("Add Lead supports document upload metadata", () => {
      expect(NEW_LEAD_DIALOG).toMatch(/documents:\s*PendingLeadDocument\[\]/);
      expect(LEADS_CONTEXT).toMatch(/documents/);
    });
    it("Lead Detail drawer surfaces documents", () => {
      expect(LEAD_DETAIL_DRAWER).toMatch(/document/i);
    });
    it("no 'Add inquiry' / 'New inquiry' / 'Inquiry added' visible Intake language", () => {
      const filesToCheck = [NEW_LEAD_DIALOG, LEAD_DETAIL_DRAWER, INTAKE_DASHBOARD, MISSING_INFO, PARENT_COMMS, OS_LEADS];
      for (const f of filesToCheck) {
        expect(f).not.toMatch(/Add inquiry|New inquiry|Inquiry added/);
      }
    });
  });

  /* ----------------------- 7. Role / menu visibility --------------------- */
  describe("Intake role menu", () => {
    const intakeBlock = (() => {
      const start = ROLE_MENUS.indexOf("intake_coordinator: {");
      const end = ROLE_MENUS.indexOf("recruiting_team", start);
      return ROLE_MENUS.slice(start, end > 0 ? end : ROLE_MENUS.length);
    })();

    it("includes the canonical Intake routes", () => {
      const required = [
        "/intake/dashboard",
        "/leads",
        "/leads?view=pipeline",
        "/intake/missing-information",
        "/intake/parent-communication",
        "/intake/tasks",
        "/intake/benefits-cheat-sheets",
        "/phone/ai-calls",
      ];
      for (const r of required) expect(intakeBlock).toContain(r);
    });

    it("uses 'Packet Follow Up / Missing Info' (not 'Missing Information') as the label", () => {
      expect(intakeBlock).toMatch(/Packet Follow Up \/ Missing Info/);
      expect(intakeBlock).not.toMatch(/label:\s*"Missing Information"/);
    });

    it("does not include the full phone system, Patient Lifetime Journey, or AI dashboards", () => {
      expect(intakeBlock).not.toMatch(/"\/phone"\b/);
      expect(intakeBlock).not.toMatch(/Patient Lifetime Journey|\/patient-journey/);
      expect(intakeBlock).not.toMatch(/\/ai\/dashboard|AI Dashboard/);
    });

    it("appends the shared Training / Resources / Reports section", () => {
      expect(intakeBlock).toMatch(/TRAINING_AND_RESOURCES/);
    });
  });

  /* ----------------------- 8. Phase 2 drawer + surfaces ------------------ */
  describe("Lead Detail Drawer canonical labels (Phase 2)", () => {
    it("uses Benefits Verification language, not raw VOB chrome", () => {
      expect(LEAD_DETAIL_DRAWER).toMatch(/Insurance \/ Benefits/);
      expect(LEAD_DETAIL_DRAWER).toMatch(/Benefits Verification/);
      expect(LEAD_DETAIL_DRAWER).toMatch(/Benefits status/);
      expect(LEAD_DETAIL_DRAWER).toMatch(/Move to Benefits Verification/);
      expect(LEAD_DETAIL_DRAWER).not.toMatch(/"Insurance \/ VOB"/);
      expect(LEAD_DETAIL_DRAWER).not.toMatch(/label="Move to VOB"/);
    });
    it("uses Packet Follow Up / Missing Info language for the missing-info action", () => {
      expect(LEAD_DETAIL_DRAWER).toMatch(/Flag Packet Follow Up \/ Missing Info/);
      expect(LEAD_DETAIL_DRAWER).not.toMatch(/label="Request Missing Info"/);
    });
  });

  describe("Intake-aware Reports + Resource Library", () => {
    it("Reports exposes an Intake view with per-coordinator and per-state breakdowns", () => {
      expect(REPORTS).toMatch(/activeView === "intake"/);
      expect(REPORTS).toMatch(/intakeKpis/);
      expect(REPORTS).toMatch(/leadSourcePerformance/);
      expect(REPORTS).toMatch(/intakeByState/);
      expect(REPORTS).toMatch(/intakeCoordinatorPerf/);
    });
    it("Resource Library page renders role-aware smart collections (Intake learners see role guides)", () => {
      expect(RESOURCE_LIBRARY).toMatch(/smartCollections|SmartCollection|my-role-guides|MY_ROLE|roleVisible/);
    });
  });
});