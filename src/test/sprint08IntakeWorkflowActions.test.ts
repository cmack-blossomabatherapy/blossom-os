import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  INTAKE_STAGES,
  getNextIntakeStage,
  getPreviousIntakeStage,
  getStageSlaDays,
  isStageBlocked,
  isStageReadyForVob,
  isStageConverted,
  getMissingInfoFlags,
  getLeadWorkflowRisk,
  getRecommendedNextAction,
  ESCALATION_TYPES,
  ESCALATION_SEVERITIES,
} from "@/lib/intake/intakeWorkflow";
import { STAGED_ROLE_LIVE_PATHS } from "@/pages/os/OSShell";
import type { Lead } from "@/data/leads";

const read = (p: string) => fs.readFileSync(p, "utf8");

// Export 86 — INTAKE_STAGES is now the canonical 13-stage Family / Lead
// pipeline. Legacy Monday-era stages live on LEGACY_INTAKE_STAGES.
const REQUIRED_STAGES = [
  "Lead Captured",
  "First Contact Attempt",
  "Engagement Track",
  "Qualification",
  "Intake Packet Sent",
  "Intake Packet Follow Up",
  "Intake Complete",
  "Benefits Verification",
  "Assessment Scheduling",
  "QA / Treatment Plan Authorization",
  "Authorization Pending",
  "Staffing Match",
  "Ready to Start Services",
];

function mockLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-mock-1",
    childName: "Test Child",
    parentName: "Test Parent",
    phone: "",
    email: "",
    state: "GA",
    source: "Website",
    status: "New Lead",
    owner: "",
    priority: "Warm",
    childAge: "",
    formStatus: "Not Sent",
    consentStatus: "Not Sent",
    vobStatus: "Not Started",
    formReviewStatus: "Pending",
    insurance: "",
    insuranceType: "",
    primaryInsurance: "",
    inNetwork: false,
    outOfNetwork: false,
    deductibleAmount: 0,
    deductibleRemaining: 0,
    coinsurancePercent: 0,
    copay: 0,
    maxOutOfPocket: 0,
    estimatedInsuranceCoveragePercent: 0,
    estimatedClientResponsibility: 0,
    expectedWeeklyHours: 0,
    estimatedMonthlyRevenue: 0,
    financialStatus: "Pending Review",
    financialOwner: "",
    daysInFinancialStage: 0,
    financialBlockers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastContacted: null,
    daysInStage: 0,
    nextAction: "",
    nextTaskDue: null,
    lastActivity: "",
    payor: "",
    coverageType: "",
    paymentPlanNeeded: false,
    paymentPlanSent: false,
    paymentPlanSigned: false,
    paymentPlanAmount: 0,
    paymentPlanStatus: "Not Required",
    timeline: [],
    tasks: [],
    documents: [],
    communications: [],
    automationLog: [],
    ...overrides,
  } as Lead;
}

describe("Sprint 08 — Intake workflow action engine", () => {
  it("exports the full intake stage list", () => {
    const set = new Set(INTAKE_STAGES);
    for (const s of REQUIRED_STAGES) {
      expect(set.has(s as (typeof INTAKE_STAGES)[number]), `missing ${s}`).toBe(true);
    }
  });

  it("getNextIntakeStage / getPreviousIntakeStage walk the happy path", () => {
    expect(getNextIntakeStage("Lead Captured")).toBe("First Contact Attempt");
    expect(getNextIntakeStage("Intake Complete")).toBe("Benefits Verification");
    expect(getNextIntakeStage("Ready to Start Services")).toBeNull();
    expect(getPreviousIntakeStage("First Contact Attempt")).toBe("Lead Captured");
    expect(getPreviousIntakeStage("Lead Captured")).toBeNull();
    // Legacy aliases still walk the canonical pipeline
    expect(getNextIntakeStage("New Lead")).toBe("First Contact Attempt");
  });

  it("stage helpers expose blocked / VOB-ready / converted states", () => {
    expect(isStageBlocked("Missing Information")).toBe(true);
    expect(isStageBlocked("Lead Captured")).toBe(false);
    expect(isStageReadyForVob("Intake Complete")).toBe(true);
    expect(isStageConverted("Ready to Start Services")).toBe(true);
    // VOB Completed now maps to Assessment Scheduling — NOT converted.
    expect(isStageConverted("VOB Completed")).toBe(false);
    expect(getStageSlaDays("Lead Captured")).toBeGreaterThan(0);
  });

  it("missing-info + risk helpers detect operational gaps", () => {
    const lead = mockLead();
    const flags = getMissingInfoFlags(lead);
    expect(flags.any).toBe(true);
    expect(flags.phone && flags.email && flags.insurance && flags.owner).toBe(true);
    const risk = getLeadWorkflowRisk(lead);
    expect(risk.level).toBe("urgent");
    expect(risk.reasons.length).toBeGreaterThan(0);
    expect(getRecommendedNextAction(lead)).toBeTruthy();
  });

  it("escalation model exposes required types and severities", () => {
    expect(ESCALATION_TYPES).toContain("missing_information_blocker");
    expect(ESCALATION_TYPES).toContain("authorization_handoff_risk");
    expect(ESCALATION_SEVERITIES).toEqual(["low", "medium", "high", "urgent"]);
  });

  it("LeadActionPanel exists and uses the shared hooks", () => {
    const src = read("src/components/intake/LeadActionPanel.tsx");
    expect(src).toMatch(/useLeads/);
    expect(src).toMatch(/useLeadJourneyLive/);
    expect(src).toMatch(/moveStage/);
    expect(src).toMatch(/revertStage/);
    expect(src).toMatch(/assignOwner/);
    expect(src).toMatch(/addTag/);
    expect(src).toMatch(/logInteraction/);
    expect(src).toMatch(/addFollowUp/);
  });

  it("intake pages and Patient Lifetime Journey consume the shared panel", () => {
    const pages = [
      "src/pages/os/intake/LeadToActivePipeline.tsx",
      "src/pages/os/intake/MissingInformation.tsx",
      "src/pages/os/intake/ParentCommunication.tsx",
      "src/pages/os/intake/IntakeDashboard.tsx",
      "src/pages/os/growth/PatientLifetimeJourney.tsx",
    ];
    for (const p of pages) {
      const src = read(p);
      expect(src, `${p} should import LeadActionPanel`).toMatch(/LeadActionPanel/);
    }
  });

  it("staged menus still include /training, /academy, /resource-library, /reports", () => {
    expect(STAGED_ROLE_LIVE_PATHS.has("/training")).toBe(true);
    expect(STAGED_ROLE_LIVE_PATHS.has("/academy")).toBe(true);
    expect(STAGED_ROLE_LIVE_PATHS.has("/resource-library")).toBe(true);
    expect(STAGED_ROLE_LIVE_PATHS.has("/reports")).toBe(true);
  });

  it("Patient Lifetime Journey still supports ?lead= deep links", () => {
    const src = read("src/pages/os/growth/PatientLifetimeJourney.tsx");
    expect(src).toMatch(/searchParams\.get\("lead"\)/);
  });
});