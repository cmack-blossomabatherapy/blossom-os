import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { intakeLeadRowToLead, extractAttachedDocuments, type IntakeLeadRow } from "@/lib/leads/intakeLeadMapper";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Export 84 — attached document metadata round-trips through source_metadata", () => {
  it("extractAttachedDocuments reads sanitized rows", () => {
    const docs = extractAttachedDocuments({
      attached_documents: [
        { name: "card.png", type: "Insurance Card", uploadedAt: "2026-06-23T00:00:00Z", storageStatus: "pending_storage_connection" },
        { name: "dx.pdf", type: "Diagnosis" },
      ],
    });
    expect(docs).toHaveLength(2);
    expect(docs[0].name).toBe("card.png");
    expect(docs[0].type).toBe("Insurance Card");
    expect(docs[0].uploadedAt).toBe("2026-06-23T00:00:00Z");
    expect(docs[1].type).toBe("Diagnosis");
  });

  it("intakeLeadRowToLead surfaces attached_documents in lead.documents", () => {
    const row: IntakeLeadRow = {
      id: "00000000-0000-0000-0000-000000000001",
      child_name: "Test Child", parent_name: "Parent", phone: "", email: "",
      state: "GA", lead_source: "Website", pipeline_stage: "New Lead",
      assigned_intake_coordinator: null, priority: "Warm", notes: null,
      insurance: null, insurance_type: null, next_action: null, next_task_due: null,
      created_at: null, updated_at: null, stage_entered_at: null,
      monday_item_id: null, monday_group: null, tags: null,
      source_metadata: {
        attached_documents: [
          { name: "intake.pdf", type: "Intake Packet", uploadedAt: "2026-06-23T00:00:00Z", storageStatus: "pending_storage_connection" },
        ],
      },
      original_column_data: null,
    };
    const lead = intakeLeadRowToLead(row);
    expect(lead.documents).toHaveLength(1);
    expect(lead.documents[0].name).toBe("intake.pdf");
    expect(lead.documents[0].type).toBe("Intake Packet");
  });
});

describe("Export 84 — LeadsContext.createLead persists docs into source_metadata", () => {
  const src = read("src/contexts/LeadsContext.tsx");

  it("sanitizes attached docs into source_metadata.attached_documents", () => {
    expect(src).toMatch(/sanitizedAttachedDocs/);
    expect(src).toMatch(/attached_documents:\s*sanitizedAttachedDocs/);
    expect(src).toMatch(/pending_storage_connection/);
  });

  it("preserves caller-provided sourceMetadata", () => {
    expect(src).toMatch(/\.\.\.\(input\.sourceMetadata \?\? \{\}\)/);
  });

  it("CreateLeadInput accepts documents", () => {
    expect(src).toMatch(/documents\?\:\s*Array</);
  });
});

describe("Export 84 — LeadDetailDrawer Documents tab renders lead.documents", () => {
  const src = read("src/components/leads/LeadDetailDrawer.tsx");

  it("merges lead.documents alongside Monday URL fields", () => {
    expect(src).toMatch(/lead\.documents/);
    expect(src).toMatch(/attachedDocs/);
    expect(src).toMatch(/mondayDocs/);
  });

  it("shows a 'Storage pending' pill for docs without URL", () => {
    expect(src).toContain("Storage pending");
  });
});

describe("Export 84 — OSIntakeOperations no longer uses 'Add Inquiry'", () => {
  const src = read("src/pages/os/OSIntakeOperations.tsx");

  it("uses the 'Add Lead' label", () => {
    expect(src).not.toMatch(/Add Inquiry/);
    expect(src).toMatch(/Add Lead/);
  });

  it("routes Add Lead to /leads?new=1", () => {
    expect(src).toMatch(/\/leads\?new=1/);
  });
});

describe("Export 84 — naming cleanup (user-facing)", () => {
  it("phase3Reports uses 'Lead to Ready-to-Start Conversion'", () => {
    const src = read("src/lib/os/phase3Reports.ts");
    expect(src).not.toMatch(/"Lead To Active Conversion"/);
    expect(src).toContain("Lead to Ready-to-Start Conversion");
  });

  it("AI knowledgeBase title is updated", () => {
    const src = read("src/lib/ai/knowledgeBase.ts");
    expect(src).not.toMatch(/Intake Lead to Active Client Flow/);
    expect(src).toMatch(/Intake Lead to Ready-to-Start Flow/);
  });
});

describe("Export 84 — Intake Open Leads buttons use the List icon", () => {
  const files = [
    "src/pages/os/OSIntakeAuthorizations.tsx",
    "src/pages/os/OSIntakeClients.tsx",
  ];
  it.each(files)("%s uses <List/> with the Open Leads button", (f) => {
    const src = read(f);
    expect(src).toMatch(/<Link to="\/leads"><List className="mr-1\.5 h-4 w-4" \/> Open Leads<\/Link>/);
  });
});

describe("Export 84 — Intake sources do not expose /patient-journey shortcuts", () => {
  const files = [
    "src/pages/os/OSIntakeOperations.tsx",
    "src/pages/os/OSIntakeAuthorizations.tsx",
    "src/pages/os/OSIntakeClients.tsx",
    "src/pages/os/OSIntakeCoordinator.tsx",
    "src/pages/os/OSIntakeWorkspace.tsx",
  ];
  it.each(files)("%s contains no /patient-journey link", (f) => {
    const src = read(f);
    expect(src).not.toMatch(/\/patient-journey/);
  });
});