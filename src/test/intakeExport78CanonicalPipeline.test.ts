import { describe, it, expect } from "vitest";
import fs from "node:fs";
import {
  FAMILY_LEAD_PIPELINE_STAGES,
  REFERRAL_PARTNER_PIPELINE_STAGES,
  canonicalFamilyLeadStage,
} from "@/lib/intake/intakeWorkflow";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Export 78 — canonical lead pipeline alignment", () => {
  it("FAMILY_LEAD_PIPELINE_STAGES equals the canonical 13-stage workflow", () => {
    expect([...FAMILY_LEAD_PIPELINE_STAGES]).toEqual([
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
    ]);
  });

  it("REFERRAL_PARTNER_PIPELINE_STAGES equals the canonical 7-stage workflow", () => {
    expect([...REFERRAL_PARTNER_PIPELINE_STAGES]).toEqual([
      "Referral Submitted",
      "Family Contacted",
      "Assessment Scheduled",
      "Authorization Pending",
      "Services Started",
      "Referral Partner Success Update",
      "Marketing Nurture",
    ]);
  });

  it("legacy LeadStatus values map to the correct canonical stages", () => {
    expect(canonicalFamilyLeadStage("New Lead")).toBe("Lead Captured");
    expect(canonicalFamilyLeadStage("In Contact")).toBe("First Contact Attempt");
    expect(canonicalFamilyLeadStage("Sent Form")).toBe("Intake Packet Sent");
    expect(canonicalFamilyLeadStage("Missing Information")).toBe("Intake Packet Follow Up");
    expect(canonicalFamilyLeadStage("Can't Reach")).toBe("Engagement Track");
    expect(canonicalFamilyLeadStage("Non-Qualified")).toBe("Qualification");
    expect(canonicalFamilyLeadStage("Form Received")).toBe("Intake Complete");
    expect(canonicalFamilyLeadStage("Sent to VOB")).toBe("Benefits Verification");
    expect(canonicalFamilyLeadStage("VOB Completed")).toBe("Assessment Scheduling");
    expect(canonicalFamilyLeadStage("Assessment Scheduled")).toBe("Assessment Scheduling");
    expect(canonicalFamilyLeadStage("QA Review")).toBe("QA / Treatment Plan Authorization");
    expect(canonicalFamilyLeadStage("Authorization Pending")).toBe("Authorization Pending");
    expect(canonicalFamilyLeadStage("Staffing Needed")).toBe("Staffing Match");
    expect(canonicalFamilyLeadStage("Pending Start")).toBe("Ready to Start Services");
    expect(canonicalFamilyLeadStage("Ready for Start")).toBe("Ready to Start Services");
    // Unknown values fall back without throwing.
    expect(canonicalFamilyLeadStage(undefined)).toBe("Lead Captured");
    expect(canonicalFamilyLeadStage("Made-up Stage")).toBe("Lead Captured");
  });

  it("LeadToActivePipeline renders the canonical family lead stages", () => {
    const src = read("src/pages/os/intake/LeadToActivePipeline.tsx");
    expect(src).toMatch(/FAMILY_LEAD_PIPELINE_STAGES/);
    expect(src).toMatch(/canonicalFamilyLeadStage/);
    expect(src).toMatch(/Ready to Start Services/);
    expect(src).toMatch(/Family lead workflow/);
  });

  it("IntakeDashboard uses Ready to Start (not Converted) for endpoint metric and keeps top buttons", () => {
    const src = read("src/pages/os/intake/IntakeDashboard.tsx");
    expect(src).toMatch(/Ready to Start \(30d\)/);
    expect(src).not.toMatch(/label="Converted \(30d\)"/);
    expect(src).toMatch(/Open Family Pipeline/);
    expect(src).toMatch(/Benefits Verification/);
    // Post-redesign: primary Add Lead + Open Pipeline cluster is in the
    // welcome band, not as duplicate GrowthPageShell actions.
    expect(src).toMatch(/Add Lead/);
    expect(src).toMatch(/Open Pipeline/);
    expect(src).not.toMatch(/Send Missing Info Reminder/);
    expect(src).not.toMatch(/label:\s*"Intake Communications"/);
  });

  it("Referral partner workflow stage labels appear on marketing surfaces", () => {
    const bd = read("src/pages/os/growth/BusinessDevelopmentDashboard.tsx");
    expect(bd).toMatch(/REFERRAL_PARTNER_PIPELINE_STAGES/);
    expect(bd).toMatch(/Referral Partner Workflow/);

    const crm = read("src/pages/os/marketing/ReferralCRM.tsx");
    expect(crm).toMatch(/REFERRAL_PARTNER_PIPELINE_STAGES/);
    expect(crm).toMatch(/Referral Partner Workflow/);
  });

  it("No automation logic was added in this pass (canonical pipeline file remains declarative)", () => {
    const src = read("src/lib/intake/intakeWorkflow.ts");
    // No fetch/supabase/setTimeout-driven automations introduced for the canonical pipeline.
    expect(src).not.toMatch(/supabase\./);
    expect(src).not.toMatch(/setInterval\(/);
    expect(src).not.toMatch(/setTimeout\(/);
  });
});