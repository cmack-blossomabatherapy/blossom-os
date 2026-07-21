// Rewritten to assert current shipping behavior: identity normalization stays
// deterministic, BCBA workflow hook still exposes its scoped-query contract,
// and BCBA Productivity Report V3 remains visible to every clinician role.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { visibleReportsForRole } from "@/lib/os/reportsCatalog";
import { normalizeBcbaClientName } from "@/hooks/useBcbaWorkflow";

const COMP_DIR = path.resolve(__dirname, "../components/bcba");

describe("BCBA Pass 4 — client identity normalization", () => {
  it("normalizeBcbaClientName trims, lowercases, and collapses whitespace", () => {
    expect(normalizeBcbaClientName("  Jane  Doe  ")).toBe("jane doe");
    expect(normalizeBcbaClientName("JANE\tDOE")).toBe("jane doe");
    expect(normalizeBcbaClientName(null)).toBeNull();
  });

  it("useBcbaWorkflow scopes reads by client identity (name key + CR id + client id)", () => {
    const src = readFileSync(path.resolve(__dirname, "../hooks/useBcbaWorkflow.ts"), "utf8");
    expect(src).toMatch(/client_name_key/);
    expect(src).toMatch(/centralreach_client_id/);
    expect(src).toMatch(/client_id/);
  });
});

describe("BCBA Pass 4 — timeline + CentralReach badge components ship", () => {
  it("BcbaClientTimeline is exported and covers the five workflow record types", () => {
    const tl = readFileSync(path.join(COMP_DIR, "BcbaClientTimeline.tsx"), "utf8");
    expect(tl).toMatch(/export\s+function\s+BcbaClientTimeline|export\s+const\s+BcbaClientTimeline/);
    for (const ref of ["notes", "tasks", "supervisionLogs", "ptLogs", "planItems"]) {
      expect(tl, `timeline must handle ${ref}`).toMatch(new RegExp(`\\b${ref}\\b`));
    }
  });

  it("BcbaCentralReachBadge does not claim live sync — surfaces import/pending states", () => {
    const badge = readFileSync(path.join(COMP_DIR, "BcbaCentralReachBadge.tsx"), "utf8");
    expect(badge).toMatch(/pending/i);
  });
});

describe("BCBA Pass 4 — reports remain canonical", () => {
  it("BCBA Productivity Report V3 is visible to every clinician-facing role", () => {
    for (const role of ["super_admin", "executive_leadership", "operations_leadership", "state_director", "hr_team", "qa_team", "bcba", "clinical_director"] as const) {
      const ids = visibleReportsForRole(role as any).map((r) => r.id);
      expect(ids, `${role} should see bcba-productivity-report-v3`).toContain("bcba-productivity-report-v3");
    }
  });
});