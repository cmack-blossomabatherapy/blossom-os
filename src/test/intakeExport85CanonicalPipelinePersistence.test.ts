import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FAMILY_LEAD_PIPELINE_STAGES } from "@/lib/intake/intakeWorkflow";
import { intakeLeadRowToLead, type IntakeLeadRow } from "@/lib/leads/intakeLeadMapper";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

function makeRow(stage: string): IntakeLeadRow {
  return {
    id: "00000000-0000-0000-0000-000000000abc",
    child_name: "Child", parent_name: "Parent", phone: "", email: "",
    state: "GA", lead_source: "Website", pipeline_stage: stage,
    assigned_intake_coordinator: null, priority: "Warm", notes: null,
    insurance: null, insurance_type: null, next_action: null, next_task_due: null,
    created_at: null, updated_at: null, stage_entered_at: null,
    monday_item_id: null, monday_group: null, tags: null,
    source_metadata: null, original_column_data: null,
  };
}

describe("Export 85 — NewLeadDialog uses canonical pipeline", () => {
  const src = read("src/components/leads/NewLeadDialog.tsx");

  it("imports FAMILY_LEAD_PIPELINE_STAGES from intakeWorkflow", () => {
    expect(src).toMatch(/from\s+"@\/lib\/intake\/intakeWorkflow"/);
    expect(src).toMatch(/FAMILY_LEAD_PIPELINE_STAGES/);
  });

  it("manual creation dropdown is wired to the canonical stages, not the old Monday list", () => {
    expect(src).toMatch(/const\s+PIPELINE_STAGES\s*=\s*FAMILY_LEAD_PIPELINE_STAGES/);
    // The old Monday list inline array must be gone.
    expect(src).not.toMatch(/"New Lead",\s*"In Contact",\s*"Sent Form"/);
  });

  it("EMPTY.pipelineStage defaults to 'Lead Captured'", () => {
    expect(src).toMatch(/pipelineStage:\s*"Lead Captured"/);
    expect(src).not.toMatch(/pipelineStage:\s*"New Lead"/);
  });
});

describe("Export 85 — intakeLeadRowToLead preserves every canonical stage", () => {
  it.each(FAMILY_LEAD_PIPELINE_STAGES.map((s) => [s] as const))(
    "canonical stage '%s' survives the row mapper 1:1",
    (stage) => {
      const lead = intakeLeadRowToLead(makeRow(stage));
      expect(lead.status).toBe(stage);
    },
  );

  it("null / unknown stage defaults to 'Lead Captured' (NOT 'New Lead')", () => {
    expect(intakeLeadRowToLead(makeRow(null as unknown as string)).status).toBe("Lead Captured");
    expect(intakeLeadRowToLead(makeRow("Made-up stage")).status).toBe("Lead Captured");
  });

  it("legacy Monday-era stages still map 1:1 for backward compatibility", () => {
    expect(intakeLeadRowToLead(makeRow("Sent Form")).status).toBe("Sent Form");
    expect(intakeLeadRowToLead(makeRow("Missing Information")).status).toBe("Missing Information");
    expect(intakeLeadRowToLead(makeRow("VOB Completed")).status).toBe("VOB Completed");
    expect(intakeLeadRowToLead(makeRow("Can't Reach")).status).toBe("Can't Reach");
  });
});

describe("Export 85 — Supabase enum/type layer includes canonical stages", () => {
  const typesSrc = read("src/integrations/supabase/types.ts");

  it.each(FAMILY_LEAD_PIPELINE_STAGES.map((s) => [s] as const))(
    "types.ts mentions canonical stage '%s'",
    (stage) => {
      expect(typesSrc.includes(`"${stage}"`)).toBe(true);
    },
  );
});

describe("Export 85 — migration adds canonical values to intake_pipeline_stage enum", () => {
  // Find any migration file that includes the canonical ALTER TYPE block.
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
  const migrationFiles = fs.existsSync(migrationsDir)
    ? fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"))
    : [];
  const combined = migrationFiles
    .map((f) => fs.readFileSync(path.join(migrationsDir, f), "utf8"))
    .join("\n");

  it.each(FAMILY_LEAD_PIPELINE_STAGES.map((s) => [s] as const))(
    "ALTER TYPE ... ADD VALUE IF NOT EXISTS exists for '%s'",
    (stage) => {
      const re = new RegExp(
        `ALTER TYPE\\s+public\\.intake_pipeline_stage\\s+ADD VALUE IF NOT EXISTS\\s+'${stage.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        )}'`,
        "i",
      );
      expect(re.test(combined)).toBe(true);
    },
  );
});

describe("Export 85 — LeadsContext does not duplicate attached documents on create", () => {
  const src = read("src/contexts/LeadsContext.tsx");

  it("dedupes documents by stable name+type+uploadedAt key", () => {
    expect(src).toMatch(/dedupeKey/);
    expect(src).toMatch(/name\}\|\$\{[^}]*type\}\|\$\{[^}]*uploadedAt/);
  });

  it("no longer naively concatenates baseLead.documents + input.documents", () => {
    // The old shape was: `documents: [ ...(baseLead.documents ?? []), ...input.documents.map(...) ]`
    // After the fix, the array literal must run through mergedDocs.
    expect(src).toMatch(/documents:\s*mergedDocs/);
  });
});

describe("Export 85 — FollowUpView recognises canonical workflow stages", () => {
  const src = read("src/pages/os/OSLeadsV2.tsx");

  it("Waiting Parent queue includes canonical Intake Packet Sent / Follow Up stages", () => {
    expect(src).toMatch(/"Intake Packet Sent"/);
    expect(src).toMatch(/"Intake Packet Follow Up"/);
  });

  it("Engagement queue covers Lead Captured, First Contact Attempt and Engagement Track", () => {
    expect(src).toMatch(/"Lead Captured"/);
    expect(src).toMatch(/"First Contact Attempt"/);
    expect(src).toMatch(/"Engagement Track"/);
  });
});

describe("Export 85 — withIntakeAutomation outputs canonical stages, not legacy", () => {
  const src = read("src/contexts/LeadsContext.tsx");

  it("form sent moves the lead to canonical 'Intake Packet Sent', not legacy 'Sent Form'", () => {
    expect(src).toMatch(/next\.status\s*=\s*"Intake Packet Sent"/);
    expect(src).not.toMatch(/next\.status\s*=\s*"Sent Form"/);
  });

  it("form complete moves to canonical 'Intake Complete', not legacy 'Form Received'", () => {
    expect(src).toMatch(/next\.status\s*=\s*"Intake Complete"/);
    expect(src).not.toMatch(/next\.status\s*=\s*"Form Received"/);
  });

  it("missing info moves to canonical 'Intake Packet Follow Up', not legacy 'Missing Information'", () => {
    expect(src).toMatch(/next\.status\s*=\s*"Intake Packet Follow Up"/);
    expect(src).not.toMatch(/next\.status\s*=\s*"Missing Information"/);
  });

  it("VOB / financial paths move to canonical 'Benefits Verification' or 'Assessment Scheduling', not legacy 'VOB Completed'", () => {
    expect(src).toMatch(/next\.status\s*=\s*"Benefits Verification"/);
    expect(src).toMatch(/next\.status\s*=\s*"Assessment Scheduling"/);
    expect(src).not.toMatch(/next\.status\s*=\s*"VOB Completed"/);
  });
});