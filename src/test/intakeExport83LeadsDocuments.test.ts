import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Export 83 — /leads top action wires Add Lead", () => {
  const src = read("src/pages/os/OSLeadsV2.tsx");

  it("imports NewLeadDialog", () => {
    expect(src).toMatch(/from "@\/components\/leads\/NewLeadDialog"/);
    expect(src).toMatch(/NewLeadDialog/);
  });

  it("renders <NewLeadDialog ... onCreated={...} />", () => {
    expect(src).toMatch(/<NewLeadDialog[\s\S]*?onCreated=/);
  });

  it("top action uses 'Add Lead' label (not 'Add Inquiry')", () => {
    expect(src).toMatch(/Add Lead/);
    expect(src).not.toMatch(/Add Inquiry/);
  });

  it("does not contain 'coming soon' placeholders for Add Lead/Inquiry", () => {
    expect(src).not.toMatch(/Add Lead form coming soon/);
    expect(src).not.toMatch(/Add Inquiry form coming soon/);
  });

  it("supports ?new=1 deep link", () => {
    expect(src).toMatch(/searchParams\.get\("new"\)/);
  });
});

describe("Export 83 — /leads pipeline uses canonical Family/Lead Workflow labels", () => {
  const src = read("src/pages/os/OSLeadsV2.tsx");
  const STAGES = [
    "Lead Captured",
    "First Contact Attempt",
    "Engagement Track",
    "Qualification",
    "Intake Packet Sent",
    "Intake Packet Follow up",
    "Intake Complete",
    "Benefits Verification",
    "Assessment Scheduling",
    "QA / Treatment Plan Authorization",
    "Authorization Pending",
    "Staffing Match",
    "Ready to Start Services",
  ];

  it.each(STAGES)("contains canonical visible label %s", (label) => {
    expect(src).toContain(label);
  });

  const LEGACY_VISIBLE_LABELS = [
    '"New Inquiry"',
    '"Initial Contact"',
    '"Forms Received"',
    '"Insurance Verified"',
    '"Financially Cleared"',
    '"Ready for Client Setup"',
    '"Ready for Authorization"',
    '"Ready for Staffing"',
  ];

  it.each(LEGACY_VISIBLE_LABELS)("does not use legacy label %s", (label) => {
    expect(src).not.toContain(label);
  });
});

describe("Export 83 — NewLeadDialog Docs tab is functional", () => {
  const src = read("src/components/leads/NewLeadDialog.tsx");

  it("removes the placeholder copy", () => {
    expect(src).not.toMatch(/Document uploads will open here in a follow-up build/);
  });

  it("ships a file input + upload handler", () => {
    expect(src).toMatch(/type="file"/);
    expect(src).toMatch(/multiple/);
    expect(src).toMatch(/handleFiles|onChange={\(e\) => handleFiles/);
  });

  it("exposes the canonical document types", () => {
    for (const t of [
      "Insurance Card",
      "Diagnosis",
      "Referral",
      "Intake Packet",
      "Consent Form",
      "Parent Provided Document",
      "Other",
    ]) {
      expect(src).toContain(`"${t}"`);
    }
  });

  it("uses pending_storage_connection metadata", () => {
    expect(src).toMatch(/pending_storage_connection/);
  });
});

describe("Export 83 — LeadDetail upload buttons are wired", () => {
  const src = read("src/pages/LeadDetail.tsx");

  it("has handleDocumentUpload + handleVobUpload helpers", () => {
    expect(src).toMatch(/handleDocumentUpload/);
    expect(src).toMatch(/handleVobUpload/);
  });

  it("includes real file inputs", () => {
    expect(src).toMatch(/docInputRef/);
    expect(src).toMatch(/vobInputRef/);
    expect(src).toMatch(/type="file"/);
  });

  it("Upload document and Upload VOB buttons have onClick handlers", () => {
    expect(src).toMatch(/onClick={\(\) => docInputRef\.current\?\.click\(\)}/);
    expect(src).toMatch(/onClick={\(\) => vobInputRef\.current\?\.click\(\)}/);
  });

  it("empty-state dropzone is clickable", () => {
    expect(src).toMatch(/onClick={\(\) => docInputRef\.current\?\.click\(\)}/);
  });

  it("logs Document uploaded automation entries", () => {
    expect(src).toMatch(/Document uploaded:/);
  });
});

describe("Export 83 — Intake Open Leads buttons standardized", () => {
  const files = [
    "src/pages/os/intake/IntakeDashboard.tsx",
    "src/pages/os/intake/ParentCommunication.tsx",
    "src/pages/os/intake/IntakeTasks.tsx",
  ];

  it.each(files)("%s uses { label: 'Open Leads', icon: List, to: '/leads' }", (f) => {
    const src = read(f);
    expect(src).toMatch(/label:\s*"Open Leads",\s*icon:\s*List,\s*to:\s*"\/leads"/);
  });
});
