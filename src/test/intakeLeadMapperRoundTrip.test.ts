import { describe, it, expect } from "vitest";
import { intakeLeadRowToLead, type IntakeLeadRow } from "@/lib/leads/intakeLeadMapper";

describe("intakeLeadRowToLead round-trip (Phase D)", () => {
  it("surfaces Monday-style extended columns on lead.intake", () => {
    const row: IntakeLeadRow = {
      id: "lead-1",
      child_name: "Jamie Doe",
      parent_name: "Sam Doe",
      phone: "555-0100",
      email: "sam@example.com",
      state: "GA",
      lead_source: "Facebook",
      pipeline_stage: "New Lead",
      assigned_intake_coordinator: "Sarah",
      priority: "Hot",
      notes: null,
      insurance: "Aetna",
      insurance_type: "PPO",
      next_action: null,
      next_task_due: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      stage_entered_at: null,
      monday_item_id: null,
      monday_group: null,
      tags: ["Blossom OS"],
      source_metadata: { foo: "bar" },
      original_column_data: { raw: "x" },
      patient_first_name: "Jamie",
      patient_last_name: "Doe",
      dob: "2018-06-15",
      parent_first_name: "Sam",
      parent_last_name: "Doe",
      parent_2_name: "Alex Doe",
      parent_2_email: "alex@example.com",
      parent_cell_phone: "555-0101",
      home_phone: "555-0102",
      preferred_contact_method: "SMS",
      lead_type: "Self-referred",
      utm_source: "facebook",
      utm_medium: "cpc",
      utm_campaign: "spring",
      referral_source: "Pediatric clinic",
      referral_partner: "Dr. Lee",
      origination_date: "2026-01-01",
      last_contact_date: "2026-01-02",
      regular_call_log: "Voicemail",
      et_call_log: "Reached parent",
      message_comments: "Wants morning sessions",
      secondary_insurance: "BCBS",
      diagnosis_status: "Diagnosed",
      dx_needed: false,
    };
    const lead = intakeLeadRowToLead(row);
    const i = lead.intake;
    expect(i).toBeDefined();
    expect(i?.patientFirstName).toBe("Jamie");
    expect(i?.patientLastName).toBe("Doe");
    expect(i?.dob).toBe("2018-06-15");
    expect(i?.parent2Name).toBe("Alex Doe");
    expect(i?.parent2Email).toBe("alex@example.com");
    expect(i?.parentCellPhone).toBe("555-0101");
    expect(i?.homePhone).toBe("555-0102");
    expect(i?.preferredContactMethod).toBe("SMS");
    expect(i?.leadType).toBe("Self-referred");
    expect(i?.utmSource).toBe("facebook");
    expect(i?.utmMedium).toBe("cpc");
    expect(i?.utmCampaign).toBe("spring");
    expect(i?.referralSource).toBe("Pediatric clinic");
    expect(i?.referralPartner).toBe("Dr. Lee");
    expect(i?.originationDate).toBe("2026-01-01");
    expect(i?.lastContactDate).toBe("2026-01-02");
    expect(i?.regularCallLog).toBe("Voicemail");
    expect(i?.etCallLog).toBe("Reached parent");
    expect(i?.messageComments).toBe("Wants morning sessions");
    expect(i?.secondaryInsurance).toBe("BCBS");
    expect(i?.diagnosisStatus).toBe("Diagnosed");
    expect(i?.dxNeeded).toBe(false);
    expect(i?.sourceMetadata).toEqual({ foo: "bar" });
    expect(i?.originalColumnData).toEqual({ raw: "x" });
    expect(lead.secondaryInsurance).toBe("BCBS");
    expect(lead.lastContacted).toBe("2026-01-02");
  });
});