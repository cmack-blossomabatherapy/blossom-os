import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { applyPreferenceScoring } from "@/lib/os/staffing/preferenceScoring";
import { haversineMiles, resolveCoords } from "@/lib/os/staffing/mapAdapter";
import type { FamilyStaffingPreferenceRow } from "@/lib/os/staffing/types";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Pass 2 — Staffing role menu is canonical", () => {
  const menu = ROLE_MENUS.staffing_team!;
  const paths = menu.sections.flatMap((s) => s.items.map((i) => i.path));

  it("includes the canonical workspace tabs", () => {
    for (const p of [
      "/ops/staffing",
      "/ops/staffing?tab=open-cases",
      "/ops/staffing?tab=match-queue",
      "/ops/staffing?tab=coverage",
      "/ops/staffing?tab=preferences",
      "/ops/staffing?tab=map",
      "/ops/staffing?tab=apploi",
      "/reports",
    ]) {
      expect(paths).toContain(p);
    }
  });

  it("does NOT include legacy split paths", () => {
    expect(paths).not.toContain("/staffing");
    expect(paths).not.toContain("/ops/rbt-match-queue");
    expect(paths).not.toContain("/ops/family-staffing-preferences");
  });

  it("does NOT include a role-specific reports path", () => {
    for (const p of paths) {
      if (p === "/reports") continue;
      expect(p).not.toMatch(/\/reports$/);
    }
  });

  it("does NOT include any AI menu sections", () => {
    const labels = menu.sections.flatMap((s) => s.items.map((i) => i.label.toLowerCase()));
    for (const l of labels) {
      expect(l).not.toMatch(/\bai\b/);
      expect(l).not.toMatch(/blossom ai/);
    }
  });
});

describe("Pass 2 — legacy Staffing routes redirect into the canonical workspace", () => {
  const app = read("src/App.tsx");

  it("/staffing → /ops/staffing?tab=open-cases", () => {
    const m = app.match(/path="\/staffing"[^\n]*/);
    expect(m).toBeTruthy();
    expect(m![0]).toMatch(/Navigate to="\/ops\/staffing\?tab=open-cases"/);
  });

  it("/ops/rbt-match-queue → /ops/staffing?tab=match-queue", () => {
    const m = app.match(/path="\/ops\/rbt-match-queue"[^\n]*/);
    expect(m).toBeTruthy();
    expect(m![0]).toMatch(/Navigate to="\/ops\/staffing\?tab=match-queue"/);
  });

  it("/ops/family-staffing-preferences → /ops/staffing?tab=preferences", () => {
    const m = app.match(/path="\/ops\/family-staffing-preferences"[^\n]*/);
    expect(m).toBeTruthy();
    expect(m![0]).toMatch(/Navigate to="\/ops\/staffing\?tab=preferences"/);
  });

  it("legacy report routes redirect to /reports", () => {
    expect(app).toMatch(/path="\/staffing\/reports"[^\n]*Navigate to="\/reports"/);
    expect(app).toMatch(/path="\/ops\/staffing\/reports"[^\n]*Navigate to="\/reports"/);
  });
});

describe("Pass 2 — Match queue uses the Supabase-backed workspace, not localStorage", () => {
  const workspace = read("src/pages/os/OSStaffingWorkspace.tsx");

  it("uses useStaffingWorkspace hook (Supabase-backed)", () => {
    expect(workspace).toContain("useStaffingWorkspace");
  });

  it("does NOT use window.prompt for rejection reasons", () => {
    expect(workspace).not.toContain("window.prompt");
  });

  it("renders a rejection Dialog with a Reason textarea", () => {
    expect(workspace).toMatch(/DialogTitle>Reject match/);
    expect(workspace).toContain("rejection_reason");
  });

  it("does NOT read OPS_STORE_KEYS.rbtMatchQueue as the live queue", () => {
    expect(workspace).not.toContain("rbtMatchQueue");
    expect(workspace).not.toContain("OPS_STORE_KEYS");
  });
});

describe("Pass 2 — Family preferences support client linking + lifecycle", () => {
  const workspace = read("src/pages/os/OSStaffingWorkspace.tsx");

  it("preferences form exposes a client picker that sets client_id", () => {
    expect(workspace).toMatch(/Link to client/);
    expect(workspace).toMatch(/client_id:/);
  });

  it("preferences row supports Resolve + Remove actions", () => {
    expect(workspace).toContain(">Resolve<");
    expect(workspace).toContain(">Remove<");
  });
});

describe("Pass 2 — Preference-aware match scoring", () => {
  const basePref = (overrides: Partial<FamilyStaffingPreferenceRow>): FamilyStaffingPreferenceRow => ({
    id: "p", client_id: "c1", client_name: "Test", state: "GA",
    preference_type: "family_request", preference_detail: "",
    importance: "nice_to_have", status: "active", notes: null,
    linked_match_id: null, created_at: "", updated_at: "", ...overrides,
  });

  it("must-have match boosts score", () => {
    const result = applyPreferenceScoring(50, [
      basePref({ importance: "must_have", preference_detail: "Prefers Alice" }),
    ], { rbtName: "Alice" });
    expect(result.score).toBeGreaterThan(50);
    expect(result.blocked).toBe(false);
  });

  it("must-have miss penalizes and blocks", () => {
    const result = applyPreferenceScoring(50, [
      basePref({ importance: "must_have", preference_detail: "Prefers Alice" }),
    ], { rbtName: "Bob" });
    expect(result.score).toBeLessThan(50);
    expect(result.blocked).toBe(true);
  });

  it("AVOID conflict blocks the match", () => {
    const result = applyPreferenceScoring(80, [
      basePref({ preference_detail: "AVOID: Bob" }),
    ], { rbtName: "Bob" });
    expect(result.blocked).toBe(true);
  });

  it("nice-to-have match adds a small boost", () => {
    const result = applyPreferenceScoring(50, [
      basePref({ preference_detail: "Loves morning shifts with Carol" }),
    ], { rbtName: "Carol" });
    expect(result.score).toBe(54);
  });
});

describe("Pass 2 — Map adapter", () => {
  it("resolves coords via explicit lat/lon", () => {
    expect(resolveCoords({ lat: 33.7, lon: -84.4 })).toEqual([33.7, -84.4]);
  });
  it("falls back to state centroid", () => {
    expect(resolveCoords({ state: "GA" })).not.toBeNull();
  });
  it("haversine returns ~0 for the same point", () => {
    expect(haversineMiles([33.7, -84.4], [33.7, -84.4])).toBeLessThan(0.001);
  });
});

describe("Pass 2 — Apploi tab reads normalized integration records", () => {
  const workspace = read("src/pages/os/OSStaffingWorkspace.tsx");
  it("imports listNormalizedRecords", () => {
    expect(workspace).toContain("listNormalizedRecords");
  });
  it("does not mark feature as unfinished", () => {
    expect(workspace).not.toMatch(/Apploi sync not yet active/);
  });
});

describe("Pass 2 — BCBA Productivity Report still mounted", () => {
  const app = read("src/App.tsx");
  it("/reports/bcba-productivity-report-v3 is still in App.tsx", () => {
    expect(app).toContain('path="/reports/bcba-productivity-report-v3"');
  });
});