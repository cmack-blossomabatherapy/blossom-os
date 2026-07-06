import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPORTS } from "@/lib/os/reportsCatalog";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Clinical Director Pass 4 — context-aware workflow", () => {
  const panel = read("src/components/clinical/ClinicalWorkItemPanel.tsx");
  const actions = read("src/hooks/useClinicalDirectorActions.ts");
  const dashboard = read("src/pages/os/clinical/ClinicalDirectorDashboard.tsx");
  const escalations = read("src/pages/os/OSQAEscalations.tsx");
  const bcbas = read("src/pages/os/OSQABCBAs.tsx");
  const supervision = read("src/pages/os/OSQASupervision.tsx");
  const tp = read("src/pages/os/OSQATreatmentPlans.tsx");
  const pr = read("src/pages/os/OSQAProgressReports.tsx");
  const evals = read("src/pages/os/OSEvaluations.tsx");

  it("ClinicalWorkItemPanel adds defaultTitle, defaultPriority, defaultDueAt, metadata", () => {
    expect(panel).toMatch(/defaultTitle/);
    expect(panel).toMatch(/defaultPriority/);
    expect(panel).toMatch(/defaultDueAt/);
    expect(panel).toMatch(/metadata/);
  });

  it("ClinicalWorkItemPanel exposes owner, note, priority, due, reviewed, escalate, resolve, reopen, archive", () => {
    expect(panel).toMatch(/assignOwnerFor|assignOwner/);
    expect(panel).toMatch(/addNoteFor|addNote/);
    expect(panel).toMatch(/changePriorityFor|changePriority/);
    expect(panel).toMatch(/type="date"/);
    expect(panel).toMatch(/"reviewed"/);
    expect(panel).toMatch(/"escalated"/);
    expect(panel).toMatch(/"resolved"/);
    // reopen: pass "open" back to updateStatus
    expect(panel).toMatch(/updateStatus\(it\.id, "open"\)/);
    expect(panel).toMatch(/"archived"/);
  });

  it("ClinicalWorkItemPanel labels record-level vs page-level", () => {
    expect(panel).toMatch(/Record-level workflow/);
    expect(panel).toMatch(/Page-level workflow/);
  });

  it("ClinicalWorkItemPanel is CentralReach integration-ready (no fake API calls)", () => {
    expect(panel).toMatch(/CentralReach linked|centralReachClientId/);
    expect(panel).not.toMatch(/fetch\((["']).*centralreach/i);
  });

  it("/assigned-bcbas passes sourceRecordId and bcbaName in the drawer", () => {
    expect(bcbas).toMatch(/sourceType="bcba"[\s\S]*sourceRecordId=\{b\.id\}[\s\S]*bcbaName=\{b\.name\}/);
    expect(bcbas).toMatch(/BCBA oversight:/);
  });

  it("/supervision-visibility passes sourceRecordId, clientName, bcbaName, supervision metadata", () => {
    expect(supervision).toMatch(/sourceType="supervision"[\s\S]*sourceRecordId=/);
    expect(supervision).toMatch(/clientName=\{r\.clientName\}/);
    expect(supervision).toMatch(/bcbaName=\{r\.bcba\}/);
    expect(supervision).toMatch(/lastBcbaSession/);
    expect(supervision).toMatch(/daysSinceSupervision/);
  });

  it("/treatment-plan-reviews passes authorization sourceRecordId + tp metadata", () => {
    expect(tp).toMatch(/sourceType="authorization"[\s\S]*sourceRecordId=\{a\.id\}/);
    expect(tp).toMatch(/treatmentPlanReceived/);
  });

  it("/progress-reports passes authorization sourceRecordId + pr metadata", () => {
    expect(pr).toMatch(/sourceType="authorization"[\s\S]*sourceRecordId=\{a\.id\}/);
    expect(pr).toMatch(/progressReportStatus/);
  });

  it("/evaluations is role-aware and passes evaluation row context for clinical_director", () => {
    expect(evals).toMatch(/isClinicalDirector/);
    expect(evals).toMatch(/sourceType="evaluation"[\s\S]*sourceRecordId=\{selectedEmployee\.id\}/);
    expect(evals).toMatch(/Clinical evaluation follow-up:/);
  });

  it("/escalations-followups reads clinical_work_items and adds a Clinical Director escalation center", () => {
    expect(escalations).toMatch(/useClinicalDirectorData/);
    expect(escalations).toMatch(/ClinicalDirectorEscalationCenter/);
    expect(escalations).toMatch(/escalated or urgent|escalated \/ urgent/i);
  });

  it("escalation slideout mounts record-level Clinical Director section on the auth id", () => {
    expect(escalations).toMatch(/sourceType="authorization"[\s\S]*sourceRecordId=\{e\.auth\.id\}/);
  });

  it("saved views read/write clinical_saved_views via actions hook", () => {
    expect(actions).toMatch(/listSavedViews/);
    expect(actions).toMatch(/updateSavedView/);
    expect(actions).toMatch(/deleteSavedView/);
    expect(actions).toMatch(/from\("clinical_saved_views"\)/);
    expect(dashboard).toMatch(/listSavedViews/);
    expect(dashboard).toMatch(/saveView\(/);
    expect(escalations).toMatch(/saveView\(/);
  });

  it("/reports remains the only Reports page and /clinical/reports is not mounted", () => {
    const app = read("src/App.tsx");
    expect(app).not.toMatch(/path="\/clinical\/reports"/);
    const items = ROLE_MENUS.clinical_director.sections.flatMap((s) => s.items);
    const reportsItems = items.filter((i) => /^\/reports(\/|$)/.test(i.path));
    expect(reportsItems.length).toBe(1);
    expect(reportsItems[0].path).toBe("/reports");
  });

  it("Clinical Director menu has no AI and no Phone", () => {
    const items = ROLE_MENUS.clinical_director.sections.flatMap((s) => s.items);
    for (const i of items) {
      expect(i.path).not.toMatch(/^\/ai(\/|$)/);
      expect(i.path).not.toBe("/phone");
      expect(i.label.toLowerCase()).not.toMatch(/ask blossom|ai assistant/);
    }
  });

  it("BCBA Productivity Report V3 remains visible to Clinical Director", () => {
    const visible = REPORTS.filter(
      (r) => r.visibleTo === "all" || (r.visibleTo as readonly string[]).includes("clinical_director"),
    );
    expect(visible.some((r) => r.id === "bcba-productivity-report-v3")).toBe(true);
  });

  it("Pass 4 files changed vs Pass 3 behavior (upgraded panel + record-level mounts)", () => {
    // Pass 3 tests only asserted generic ClinicalDirectorSection with sourceType.
    // Pass 4 requires record-level `sourceRecordId` on every workflow drawer.
    expect(bcbas.match(/sourceRecordId/g)?.length ?? 0).toBeGreaterThan(0);
    expect(supervision.match(/sourceRecordId/g)?.length ?? 0).toBeGreaterThan(0);
    expect(tp.match(/sourceRecordId/g)?.length ?? 0).toBeGreaterThan(0);
    expect(pr.match(/sourceRecordId/g)?.length ?? 0).toBeGreaterThan(0);
    expect(evals.match(/sourceRecordId/g)?.length ?? 0).toBeGreaterThan(0);
    expect(escalations.match(/sourceRecordId/g)?.length ?? 0).toBeGreaterThan(0);
  });
});