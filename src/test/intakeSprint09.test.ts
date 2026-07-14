import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  INTAKE_STAGES,
  getNextIntakeStage,
  getPreviousIntakeStage,
  getStageSlaDays,
  isStageBlocked,
  isStageReadyForVob,
  isStageConverted,
  getRecommendedNextAction,
  getLeadWorkflowRisk,
  getMissingInfoFlags,
  getEscalationReason,
  getLeadAgeDays,
  getDaysInCurrentStage,
  getLeadPriority,
} from "@/lib/intake/intakeWorkflow";
import type { Lead } from "@/data/leads";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const baseLead = (overrides: Partial<Lead> = {}): Lead =>
  ({
    id: "x",
    childName: "Test Child",
    parentName: "Test Parent",
    phone: "",
    email: "",
    state: "GA",
    source: "Website",
    status: "New Lead",
    owner: "Unassigned",
    priority: "Warm",
    createdAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    updatedAt: new Date().toISOString(),
    daysInStage: 6,
    tasks: [],
    timeline: [],
    automationLog: [],
    documents: [],
    tags: [],
    nextAction: "",
    ...overrides,
  } as unknown as Lead);

describe("Sprint 09 — intake workflow helpers", () => {
  it("exports all required stage helpers", () => {
    // Export 86 — canonical Family / Lead pipeline is now primary.
    expect(INTAKE_STAGES).toContain("Lead Captured");
    expect(INTAKE_STAGES).toContain("Ready to Start Services");
    expect(getNextIntakeStage("Lead Captured")).toBe("First Contact Attempt");
    expect(getPreviousIntakeStage("First Contact Attempt")).toBe("Lead Captured");
    expect(getStageSlaDays("Lead Captured")).toBeGreaterThan(0);
    expect(isStageBlocked("Missing Information")).toBe(true);
    expect(isStageReadyForVob("Intake Complete")).toBe(true);
    expect(isStageConverted("Ready to Start Services")).toBe(true);
    expect(isStageConverted("VOB Completed")).toBe(false);
  });

  it("computes risk, missing info, escalation, age, days-in-stage, and priority", () => {
    const lead = baseLead();
    const risk = getLeadWorkflowRisk(lead);
    expect(risk.level).toBe("urgent");
    const missing = getMissingInfoFlags(lead);
    expect(missing.any).toBe(true);
    expect(getEscalationReason(lead)).toBeTruthy();
    expect(getRecommendedNextAction(lead)).toBeTruthy();
    expect(getLeadAgeDays(lead)).toBeGreaterThanOrEqual(4);
    expect(getDaysInCurrentStage(lead)).toBe(6);
    const prio = getLeadPriority(lead);
    expect(["hot", "warm", "cold"]).toContain(prio.level);
  });
});

describe("Sprint 09 — intake page wiring (static)", () => {
  const intakePages = [
    "src/pages/os/intake/IntakeDashboard.tsx",
    "src/pages/os/intake/LeadToActivePipeline.tsx",
    "src/pages/os/intake/MissingInformation.tsx",
    "src/pages/os/intake/ParentCommunication.tsx",
    "src/pages/os/intake/IntakeTasks.tsx",
  ];

  it("every intake page references the shared LeadActionPanel or shared task hook", () => {
    intakePages.forEach((p) => {
      const src = read(p);
      const ok =
        src.includes("LeadActionPanel") ||
        src.includes("useIntakeTasksLive");
      expect(ok, `${p} must use the shared action surface`).toBe(true);
    });
  });

  it("LeadActionPanel exposes the canonical operational actions", () => {
    const src = read("src/components/intake/LeadActionPanel.tsx");
    [
      "Log Contact",
      "Follow-Up",
      "Move Forward",
      "Assign Owner",
      "Missing Info",
      "Escalate",
      "Journey",
      "Open Lead",
    ].forEach((label) => expect(src).toContain(label));
  });

  it("NewLeadDialog captures key source / intake fields", () => {
    const src = read("src/components/leads/NewLeadDialog.tsx");
    ["leadSource", "utmCampaign", "referralPartner", "insurance", "pipelineStage", "priority"].forEach((f) =>
      expect(src).toContain(f),
    );
  });

  it("Patient Lifetime Journey accepts a lead focus query param", () => {
    const src = read("src/pages/os/growth/PatientLifetimeJourney.tsx");
    expect(src).toMatch(/searchParams\.get\(["']lead["']\)/);
  });

  it("/leads/:id route is mounted to LeadDetail", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/path="\/leads\/:id"[\s\S]*LeadDetail/);
  });

  it("preserves protected routes from prior sprints", () => {
    const app = read("src/App.tsx");
    [
      "/training",
      "/academy",
      "/resource-library",
      "/reports",
      "/reports/bcba-productivity-report-v3",
      "/system/bcba-productivity-uploads",
      "/user-logins-vault",
      "/admin/login-vault",
      "/nfc-badges",
      "/evaluations",
      "/patient-journey",
    ].forEach((r) => expect(app, `route ${r} missing`).toContain(r));
  });
});