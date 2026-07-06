import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Clinical Director Pass 5 — final workflow hardening", () => {
  const actions = read("src/hooks/useClinicalDirectorActions.ts");
  const panel = read("src/components/clinical/ClinicalWorkItemPanel.tsx");
  const dashboard = read("src/pages/os/clinical/ClinicalDirectorDashboard.tsx");
  const escalations = read("src/pages/os/OSQAEscalations.tsx");
  const bcbas = read("src/pages/os/OSQABCBAs.tsx");
  const supervision = read("src/pages/os/OSQASupervision.tsx");
  const tp = read("src/pages/os/OSQATreatmentPlans.tsx");
  const pr = read("src/pages/os/OSQAProgressReports.tsx");
  const evals = read("src/pages/os/OSEvaluations.tsx");

  it("removes duplicate top-level generic ClinicalDirectorSection panels", () => {
    // Every page-level ClinicalDirectorSection with a plain 'sourceType=...'
    // and no sourceRecordId nearby has been removed.
    for (const src of [bcbas, supervision, tp, pr, escalations, evals]) {
      expect(src).not.toMatch(/ClinicalDirectorSection\s+sourceType="[^"]+"\s+title="Clinical Director workflow"\s*\/>/);
    }
  });

  it("assignOwner normalizes blank/undefined owner_user_id to null (no empty-string UUIDs)", () => {
    expect(actions).toMatch(/assignOwner\s*=\s*\(id:\s*string,\s*ownerUserId:\s*string\s*\|\s*null\s*\|\s*undefined/);
    expect(actions).toMatch(/owner_user_id:\s*uuid/);
    // Panel no longer passes an empty string
    expect(panel).not.toMatch(/actions\.assignOwner\(id,\s*""/);
    expect(panel).toMatch(/actions\.assignOwner\(id,\s*null,\s*name\)/);
  });

  it("adds changeDueDate action + activity log + editable due-date UI", () => {
    expect(actions).toMatch(/changeDueDate/);
    expect(actions).toMatch(/"due_changed"/);
    expect(panel).toMatch(/changeDueDateFor/);
    expect(panel).toMatch(/it\.due_at \? it\.due_at\.slice\(0, 10\) : ""/);
  });

  it("saved views on dashboard expose Apply, Update, Delete and a filter summary", () => {
    expect(dashboard).toMatch(/updateSavedView/);
    expect(dashboard).toMatch(/deleteSavedView/);
    expect(dashboard).toMatch(/Apply —|summary/);
  });

  it("saved views on escalation center expose Apply, Update, Delete and a filter summary", () => {
    expect(escalations).toMatch(/updateSavedView/);
    expect(escalations).toMatch(/deleteSavedView/);
    expect(escalations).toMatch(/statusFilter|priorityFilter|sourceFilter|dueSoon/);
    expect(escalations).toMatch(/Apply —|no filters/);
  });

  it("evaluations page uses Clinical Director wording for clinical_director role", () => {
    expect(evals).toMatch(/isClinicalDirector \? "Clinical Director"/);
    expect(evals).toMatch(/Clinical evaluations for BCBAs and RBTs/);
    // Header no longer hardcodes "State Director"
    expect(evals).not.toMatch(/>\s*State Director · \{activeState\}\s*</);
  });

  it("CentralReach readiness: neutral pending copy, no fake CR fetch", () => {
    expect(panel).toMatch(/CentralReach link pending/);
    expect(panel).not.toMatch(/No CentralReach client id · sync pending/);
    expect(panel).not.toMatch(/fetch\((["']).*centralreach/i);
  });

  it("record-level panels thread centralReachClientId metadata", () => {
    for (const src of [bcbas, supervision, tp, pr, escalations, evals]) {
      expect(src).toMatch(/centralReachClientId/);
    }
  });

  it("ClinicalDirectorEscalationCenter is gated to clinical_director", () => {
    expect(escalations).toMatch(/if \(!ctx \|\| ctx\.role !== "clinical_director"\) return null/);
    expect(escalations).toMatch(/escalated \/ urgent|escalated or urgent/i);
  });

  it("reports remain unified at /reports (no clinical-director-specific reports route)", () => {
    const app = read("src/App.tsx");
    expect(app).not.toMatch(/path="\/clinical\/reports"/);
  });
});