import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  INTAKE_STAGES,
  LEGACY_INTAKE_STAGES,
  FAMILY_LEAD_PIPELINE_STAGES,
  getNextIntakeStage,
  getPreviousIntakeStage,
  isStageConverted,
} from "@/lib/intake/intakeWorkflow";
import { kpiFilters, getInlineAlert, type Lead } from "@/data/leads";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

function findMigration(needle: string): string | null {
  const dir = path.join(process.cwd(), "supabase/migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql"));
  for (const f of files) {
    const src = fs.readFileSync(path.join(dir, f), "utf8");
    if (src.includes(needle)) return src;
  }
  return null;
}

describe("Export 86 — backend trigger + shared workflow canonicalization", () => {
  it("shared workflow primary INTAKE_STAGES is canonical, not legacy-first", () => {
    expect(INTAKE_STAGES).toEqual(FAMILY_LEAD_PIPELINE_STAGES);
    expect(INTAKE_STAGES).toContain("Lead Captured");
    expect(INTAKE_STAGES).toContain("Ready to Start Services");
    // legacy preserved separately
    expect(LEGACY_INTAKE_STAGES).toContain("New Lead");
    expect(LEGACY_INTAKE_STAGES).toContain("VOB Completed");
  });

  it("forward/back helpers walk the canonical 13-stage pipeline", () => {
    expect(getNextIntakeStage("Lead Captured")).toBe("First Contact Attempt");
    expect(getPreviousIntakeStage("Ready to Start Services")).toBe("Staffing Match");
    expect(getNextIntakeStage("Ready to Start Services")).toBeNull();
  });

  it("VOB Completed is no longer converted/ready-to-start", () => {
    expect(isStageConverted("VOB Completed")).toBe(false);
    const lead = { status: "VOB Completed" } as unknown as Lead;
    expect(kpiFilters.readyToStart(lead)).toBe(false);
  });

  it("alerts and KPI filters recognize Lead Captured as the primary new-lead stage", () => {
    const captured = {
      status: "Lead Captured",
      daysInStage: 0,
      lastContacted: null,
    } as unknown as Lead;
    expect(kpiFilters.newToday(captured)).toBe(true);
    expect(getInlineAlert(captured)?.message).toMatch(/no contact yet/i);
    // legacy still tolerated
    const legacy = {
      status: "New Lead",
      daysInStage: 0,
      lastContacted: null,
    } as unknown as Lead;
    expect(kpiFilters.newToday(legacy)).toBe(true);
  });

  it("a migration replaces apply_intake_lead_automation with canonical stages", () => {
    const sql = findMigration("CREATE OR REPLACE FUNCTION public.apply_intake_lead_automation");
    expect(sql, "expected a migration that replaces apply_intake_lead_automation").not.toBeNull();
    const latest = newest(["apply_intake_lead_automation"]);
    expect(latest).not.toBeNull();
    // Must not force inserts back to legacy "New Lead".
    expect(latest!).not.toMatch(/NEW\.pipeline_stage\s*:=\s*'New Lead'/);
    // Must write canonical stages.
    expect(latest!).toMatch(/Intake Packet Sent/);
    expect(latest!).toMatch(/Intake Complete/);
    expect(latest!).toMatch(/Benefits Verification/);
    expect(latest!).toMatch(/Assessment Scheduling/);
    expect(latest!).toMatch(/Lead Captured/);
  });

  it("a migration sets the column default to Lead Captured", () => {
    const latest = newest([
      "ALTER TABLE public.intake_leads ALTER COLUMN pipeline_stage SET DEFAULT",
    ]);
    expect(latest, "expected a migration that updates the pipeline_stage default").not.toBeNull();
    expect(latest!).toMatch(/SET DEFAULT\s+'Lead Captured'/);
  });

  it("a migration replaces seed_intake_lead_tasks with canonical stage checks", () => {
    const latest = newest(["CREATE OR REPLACE FUNCTION public.seed_intake_lead_tasks"]);
    expect(latest, "expected a migration that replaces seed_intake_lead_tasks").not.toBeNull();
    expect(latest!).toMatch(/Intake Complete/);
    expect(latest!).toMatch(/Intake Packet Follow Up/);
    expect(latest!).toMatch(/Benefits Verification/);
    // Initial Contact Lead task preserved on insert
    expect(latest!).toMatch(/Contact Lead/);
  });
});

// Find the newest migration file containing all the given needles.
function newest(needles: string[]): string | null {
  const dir = path.join(process.cwd(), "supabase/migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (let i = files.length - 1; i >= 0; i--) {
    const src = fs.readFileSync(path.join(dir, files[i]), "utf8");
    if (needles.every((n) => src.includes(n))) return src;
  }
  return null;
}