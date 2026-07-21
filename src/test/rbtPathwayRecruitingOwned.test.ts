import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  classifyRbtPathway,
  checkAdvancementReadiness,
  isRbtLikeRole,
} from "@/lib/recruiting/rbtPathwayClassifier";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("classifyRbtPathway — three canonical mappings", () => {
  it("not_certified -> new_rbt_certification", () => {
    expect(classifyRbtPathway({ role: "RBT", rbt_certification_status: "not_certified" }))
      .toBe("new_rbt_certification");
    expect(classifyRbtPathway({ role: "BT", rbt_certification_status: "not_certified" }))
      .toBe("new_rbt_certification");
  });

  it("certified + years < 2 -> under_2_years", () => {
    expect(classifyRbtPathway({ role: "RBT", rbt_certification_status: "certified", rbt_years_experience_direct: 0 }))
      .toBe("under_2_years");
    expect(classifyRbtPathway({ role: "RBT", rbt_certification_status: "certified", rbt_years_experience_direct: 1.5 }))
      .toBe("under_2_years");
  });

  it("certified + years >= 2 -> experienced_rbt", () => {
    expect(classifyRbtPathway({ role: "RBT", rbt_certification_status: "certified", rbt_years_experience_direct: 2 }))
      .toBe("experienced_rbt");
    expect(classifyRbtPathway({ role: "RBT", rbt_certification_status: "certified", rbt_years_experience_direct: 8 }))
      .toBe("experienced_rbt");
  });

  it("non-RBT roles are rejected", () => {
    expect(isRbtLikeRole("BCBA")).toBe(false);
    expect(classifyRbtPathway({ role: "BCBA", rbt_certification_status: "certified", rbt_years_experience_direct: 5 }))
      .toBeNull();
    expect(classifyRbtPathway({ role: "Other", rbt_certification_status: "not_certified" }))
      .toBeNull();
  });

  it("certified without years is blocked (returns null)", () => {
    expect(classifyRbtPathway({ role: "RBT", rbt_certification_status: "certified", rbt_years_experience_direct: null }))
      .toBeNull();
  });

  it("unknown status is blocked (returns null)", () => {
    expect(classifyRbtPathway({ role: "RBT", rbt_certification_status: "unknown" }))
      .toBeNull();
  });
});

describe("checkAdvancementReadiness — gates orientation/onboarding/ready-to-staff", () => {
  const gated = ["Orientation Scheduled", "Onboarding", "Ready to Staff"];

  it("blocks RBT/BT candidates without cert status", () => {
    for (const stage of gated) {
      const r = checkAdvancementReadiness({ role: "RBT" }, stage);
      expect(r.ok).toBe(false);
      expect(r.reason).toBe("cert_status_missing");
    }
  });

  it("blocks certified RBT missing years", () => {
    const r = checkAdvancementReadiness(
      { role: "RBT", rbt_certification_status: "certified" },
      "Onboarding",
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("years_missing_when_certified");
  });

  it("allows classified RBT candidates", () => {
    const r = checkAdvancementReadiness(
      { role: "RBT", rbt_certification_status: "certified", rbt_years_experience_direct: 3 },
      "Ready to Staff",
    );
    expect(r.ok).toBe(true);
  });

  it("never blocks non-RBT roles", () => {
    const r = checkAdvancementReadiness({ role: "BCBA" }, "Ready to Staff");
    expect(r.ok).toBe(true);
  });

  it("does not gate non-advancement stages", () => {
    const r = checkAdvancementReadiness({ role: "RBT" }, "Phone Screen");
    expect(r.ok).toBe(true);
  });
});

describe("Corrective migration — recruiting-owned RBT pathway", () => {
  const migrationFile = "supabase/migrations/20260721200604_6b8ac326-412f-442f-a074-8f53bc7cba9e.sql";
  const src = read(migrationFile);

  it("only assigns for RBT/BT roles", () => {
    expect(src).toMatch(/v_role\s+NOT IN\s*\(\s*'RBT'\s*,\s*'BT'\s*\)/);
  });

  it("rejects negative years and requires years when certified", () => {
    expect(src).toMatch(/rbt_years_experience_direct\s*<\s*0/);
    expect(src).toMatch(/'missing_years_certified'/);
    expect(src).toMatch(/recruiting_candidates_rbt_years_nonneg/);
  });

  it("enforces one active assignment per employee via a partial unique index", () => {
    expect(src).toMatch(/uniq_rbt_pathway_assignment_active_per_employee/);
    expect(src).toMatch(/WHERE\s+active\s*=\s*true/i);
  });

  it("revokes arbitrary-ID sync from PUBLIC and authenticated", () => {
    expect(src).toMatch(/REVOKE ALL ON FUNCTION public\.sync_rbt_pathway_assignment\(uuid\) FROM PUBLIC/);
    expect(src).toMatch(/REVOKE ALL ON FUNCTION public\.sync_rbt_pathway_assignment\(uuid\) FROM authenticated/);
  });

  it("exposes a parameter-less scoped self-service function", () => {
    expect(src).toMatch(/CREATE OR REPLACE FUNCTION public\.ensure_my_rbt_pathway_assignment\(\)/);
    expect(src).toMatch(/GRANT EXECUTE ON FUNCTION public\.ensure_my_rbt_pathway_assignment\(\) TO authenticated/);
    expect(src).toMatch(/auth\.uid\(\)/);
  });

  it("is concurrency-safe (row-level lock) and idempotent (no-op when already correct)", () => {
    expect(src).toMatch(/FOR UPDATE/);
    expect(src).toMatch(/pathway_id\s*=\s*v_pathway_id/);
  });

  it("dedupes data-quality items and preserves audit history", () => {
    expect(src).toMatch(/ON CONFLICT \(candidate_id, kind\) DO UPDATE/);
    expect(src).toMatch(/rbt_pathway_assignment_audit/);
  });

  it("backfills eligible linked candidates", () => {
    expect(src).toMatch(/FROM public\.recruiting_candidates[\s\S]+linked_employee_id IS NOT NULL[\s\S]+role IN \('RBT','BT'\)/);
    expect(src).toMatch(/PERFORM public\.sync_rbt_pathway_assignment\(r\.id\)/);
  });
});

describe("Recruiter UI captures required RBT fields", () => {
  it("Pipeline slideout renders the RBT classification editor", () => {
    const src = read("src/pages/os/OSRecruitingPipeline.tsx");
    expect(src).toMatch(/RBT classification \(recruiter\)/);
    expect(src).toMatch(/rbt_certification_status/);
    expect(src).toMatch(/rbt_years_experience_direct/);
    expect(src).toMatch(/isRbtLikeRole/);
  });

  it("useRecruitingCandidates gates stage advancement on classification data", () => {
    const src = read("src/hooks/useRecruitingCandidates.ts");
    expect(src).toMatch(/checkAdvancementReadiness/);
    expect(src).toMatch(/rbt_certification_status/);
    expect(src).toMatch(/rbt_years_experience_direct/);
    expect(src).toMatch(/linked_employee_id/);
  });
});