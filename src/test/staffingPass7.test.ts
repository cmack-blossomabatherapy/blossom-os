import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { applyPreferenceScoring } from "@/lib/os/staffing/preferenceScoring";
import type { FamilyStaffingPreferenceRow } from "@/lib/os/staffing/types";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Staffing Pass 7 - transactional audit honesty", () => {
  const hook = read("src/hooks/useStaffingWorkspace.ts");

  it("setStatus accepts hydrated client_name for the audit row", () => {
    expect(hook).toMatch(/client_name\?:\s*string/);
    expect(hook).toMatch(/client_id\?:\s*string\s*\|\s*null/);
  });

  it("audit row no longer labels client_name as the RBT name", () => {
    expect(hook).not.toMatch(/client_name:\s*row\.rbt_name/);
  });

  it("audit row falls back to Unknown client (id) when client_name missing", () => {
    expect(hook).toMatch(/Unknown client/);
  });
});

describe("Staffing Pass 7 - Match Queue uses structured preference scoring", () => {
  const src = read("src/pages/os/OSStaffingWorkspace.tsx");

  it("evaluateMatchFit helper exists and drives fit label", () => {
    expect(src).toContain("function evaluateMatchFit");
    expect(src).toContain("applyPreferenceScoring");
  });

  it("Match Queue no longer infers conflict from notes text", () => {
    // No inline notes-text preference sniffing survives in the queue.
    expect(src).not.toMatch(/notesLow\.includes\(\s*["']avoid["']/);
    expect(src).not.toMatch(/notesLow\.includes\(\s*["']conflict["']/);
  });

  it("Match Queue exposes Open case action + drawer", () => {
    expect(src).toMatch(/setDrawerClient/);
    expect(src).toMatch(/>Open case</);
  });

  it("Match Queue passes client_name into setStatus for audit", () => {
    expect(src).toMatch(/client_name:\s*clientLabel/);
  });
});

describe("Staffing Pass 7 - Coverage Needs is a persisted workflow", () => {
  const src = read("src/pages/os/OSStaffingWorkspace.tsx");
  it("shows persisted workflow columns", () => {
    expect(src).toContain("Latest workflow");
    expect(src).toContain("Risk");
  });
  it("wires direct persisted actions", () => {
    expect(src).toContain("saveActivity");
    expect(src).toMatch(/Coverage case set to watching/);
    expect(src).toMatch(/Coverage case marked blocked/);
    expect(src).toMatch(/Coverage case escalated/);
    expect(src).toMatch(/Coverage case resolved/);
  });
  it("supports Propose match from a coverage row", () => {
    expect(src).toMatch(/setProposeFor/);
  });
});

describe("Staffing Pass 7 - Live Map has case + per-RBT actions", () => {
  const src = read("src/pages/os/OSStaffingWorkspace.tsx");
  it("exposes Open case, Match Queue, and Propose match on the selected case", () => {
    expect(src).toMatch(/setDrawerClient\(selectedNeed\.client\)/);
    expect(src).toMatch(/Match Queue/);
  });
  it("per-RBT row includes a Propose button that preselects the RBT", () => {
    expect(src).toMatch(/setPreselectRbtId\(r\.id\)/);
    expect(src).toContain("initialRbtId={preselectRbtId}");
  });
});

describe("Staffing Pass 7 - Apploi handoff filters", () => {
  const src = read("src/pages/os/OSStaffingWorkspace.tsx");
  it("adds search input for candidate/role/record id/owner", () => {
    expect(src).toMatch(/Search candidate, role, record id, owner/);
  });
  it("adds state filter dropdown", () => {
    expect(src).toMatch(/setStateFilter/);
  });
});

describe("Staffing Pass 7 - scoring stays deterministic", () => {
  const basePref = (o: Partial<FamilyStaffingPreferenceRow>): FamilyStaffingPreferenceRow => ({
    id: "p", client_id: "c1", client_name: "T", state: "GA",
    preference_type: "family_request", preference_detail: "",
    importance: "nice_to_have", status: "active", notes: null,
    linked_match_id: null, created_at: "", updated_at: "", ...o,
  });
  it("blocked flag is set for AVOID match", () => {
    const r = applyPreferenceScoring(80, [basePref({ preference_detail: "AVOID: Bob" })], { rbtName: "Bob" });
    expect(r.blocked).toBe(true);
  });
  it("no active preferences => no impact recorded", () => {
    const r = applyPreferenceScoring(50, [], { rbtName: "Bob" });
    expect(r.applied.length).toBe(0);
    expect(r.blocked).toBe(false);
  });
});