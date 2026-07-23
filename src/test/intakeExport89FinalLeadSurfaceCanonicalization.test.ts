import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const APP = read("src/App.tsx");
const OS_LEADS = read("src/pages/os/OSLeadsV2.tsx");
const DRAWER = read("src/components/leads/LeadDetailDrawer.tsx");
const KPI = read("src/components/leads/LeadKpiStrip.tsx");
const CONTROL = read("src/components/leads/LeadControlBar.tsx");
const QUEUE = read("src/components/leads/LeadQueueView.tsx");
const TABLE = read("src/components/leads/LeadTableView.tsx");
const PANEL = read("src/components/leads/LeadDetailPanel.tsx");
const TRAINING = read("src/lib/academy/trainingPaths.ts");
const RESOURCES = read("src/lib/resources/resourceData.ts");
const REPORTS = read("src/lib/os/phase3Reports.ts");

/**
 * Export 89 — Final lead surface canonicalization.
 * Guards against any user-facing regression to Monday-era VOB / Sent Form
 * language on the lead surfaces.
 */
describe("Intake Export 89 — final lead surface canonicalization", () => {
  describe("Routes", () => {
    it("/leads routes to OSLeadsV2", () => {
      expect(APP).toMatch(/<Route path="\/leads" element={<OSLeadsV2 \/>}/);
    });
    it("/leads/:id routes to the canonical full-page LeadDetail record", () => {
      expect(APP).toMatch(/path="\/leads\/:id" element={<LeadDetail/);
    });
    it("App.tsx does not keep an unused import of pages/Leads", () => {
      expect(APP).not.toMatch(/from "\.\/pages\/Leads"/);
    });
  });

  describe("LeadDetailDrawer canonical actions", () => {
    it("does not set status to legacy 'Sent to VOB'", () => {
      expect(DRAWER).not.toMatch(/status:\s*"Sent to VOB"/);
    });
    it("does not toast 'Moved to VOB'", () => {
      expect(DRAWER).not.toMatch(/"Moved to VOB"/);
    });
    it("uses 'Benefits Verification' for the move action", () => {
      expect(DRAWER).toMatch(/status:\s*"Benefits Verification"/);
      expect(DRAWER).toMatch(/Moved to Benefits Verification/);
    });
    it("uses 'Packet Follow Up / Missing Info' product language", () => {
      expect(DRAWER).toMatch(/Packet Follow Up \/ Missing Info/);
    });
    it("does not toast the old 'Lead moved to Missing Info' string", () => {
      expect(DRAWER).not.toMatch(/Lead moved to Missing Info/);
    });
  });

  describe("Legacy lead components canonicalization", () => {
    it("LeadQueueView uses canonical helpers, not legacy stage equality", () => {
      expect(QUEUE).toMatch(/canonicalFamilyLeadStage/);
      expect(QUEUE).not.toMatch(/"Sent to VOB"/);
      expect(QUEUE).not.toMatch(/"VOB Completed"/);
      expect(QUEUE).not.toMatch(/"Sent Form"/);
    });
    it("LeadKpiStrip removes Sent to VOB / VOB Completed / Avg Time to VOB labels", () => {
      expect(KPI).not.toMatch(/label:\s*"Sent to VOB"/);
      expect(KPI).not.toMatch(/label:\s*"VOB Completed"/);
      expect(KPI).not.toMatch(/label:\s*"Avg Time to VOB"/);
      expect(KPI).toMatch(/"Benefits Verification"/);
      expect(KPI).toMatch(/"Avg Time to Benefits Verification"/);
      expect(KPI).toMatch(/"Packet Follow Up \/ Missing Info"/);
    });
    it("LeadTableView column header is Benefits, not VOB", () => {
      expect(TABLE).not.toMatch(/label:\s*"VOB"/);
      expect(TABLE).toMatch(/label:\s*"Benefits"/);
    });
    it("LeadControlBar saved views do not say Ready for VOB / VOB Completed", () => {
      expect(CONTROL).not.toMatch(/Ready for VOB/);
      expect(CONTROL).not.toMatch(/label:\s*"VOB Completed"/);
    });
    it("LeadDetailPanel uses Insurance / Benefits and Benefits Status", () => {
      expect(PANEL).toMatch(/Insurance \/ Benefits/);
      expect(PANEL).toMatch(/Benefits Status/);
      expect(PANEL).not.toMatch(/Insurance \/ VOB/);
      expect(PANEL).not.toMatch(/>VOB Status</);
    });
  });

  describe("OSLeadsV2 remaining visible text", () => {
    it("filter section header says Benefits Status, not VOB Status", () => {
      expect(OS_LEADS).toMatch(/title="Benefits Status"/);
      expect(OS_LEADS).not.toMatch(/title="VOB Status"/);
    });
    it("AI prompt says benefits verification pipeline health", () => {
      expect(OS_LEADS).toMatch(/benefits verification pipeline health/);
      expect(OS_LEADS).not.toMatch(/Summarize VOB pipeline health/);
    });
  });

  describe("Intake training path", () => {
    it("intake path is at least 20 lessons", () => {
      const match = TRAINING.match(/slug:\s*"intake"[\s\S]*?lessonCount:\s*(\d+)/);
      expect(match).toBeTruthy();
      expect(Number(match![1])).toBeGreaterThanOrEqual(20);
    });
    it("intake training description uses Benefits Verification language", () => {
      const block = TRAINING.match(/slug:\s*"intake"[^}]*description:\s*"[^"]+"/)?.[0] ?? "";
      expect(block.toLowerCase()).not.toMatch(/vob process/);
      expect(block).toMatch(/benefits verification|packet follow up/i);
    });
  });

  describe("Resource Library", () => {
    it("renames VOB Decision Guide to Benefits Verification Decision Guide", () => {
      expect(RESOURCES).toMatch(/"Benefits Verification Decision Guide"/);
      expect(RESOURCES).not.toMatch(/title:\s*"VOB Decision Guide"/);
    });
    it("renames Missing Information Checklist to Packet Follow Up / Missing Info Checklist", () => {
      expect(RESOURCES).toMatch(/"Packet Follow Up \/ Missing Info Checklist"/);
      expect(RESOURCES).not.toMatch(/title:\s*"Missing Information Checklist"/);
    });
    it("renames VOB / EOB Workflow to Benefits Verification / EOB Workflow", () => {
      expect(RESOURCES).toMatch(/"Benefits Verification \/ EOB Workflow"/);
      expect(RESOURCES).not.toMatch(/title:\s*"VOB \/ EOB Workflow"/);
    });
  });

  describe("Intake reports", () => {
    it("Missing Information report renamed to Packet Follow Up / Missing Info", () => {
      expect(REPORTS).toMatch(/name:\s*"Packet Follow Up \/ Missing Info"/);
      expect(REPORTS).not.toMatch(/name:\s*"Missing Information"/);
    });
    it("Reports catalog exposes a Benefits Verification Queue card", () => {
      expect(REPORTS).toMatch(/name:\s*"Benefits Verification Queue"/);
    });
  });
});