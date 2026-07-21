import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Locate the forward-correction migration file by content signature. We do NOT
// hardcode a timestamp because migration filenames are date-derived.
function findMigration(): { path: string; sql: string } {
  const dir = "supabase/migrations";
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));
  for (const f of files) {
    const sql = readFileSync(join(dir, f), "utf8");
    if (
      sql.includes("pg_advisory_xact_lock") &&
      sql.includes("uniq_rbt_pathway_assignment_active_per_employee") &&
      sql.includes("certified_missing_years") &&
      sql.includes("rbt_certified_requires_years")
    ) {
      return { path: join(dir, f), sql };
    }
  }
  throw new Error("Forward-correction migration not found");
}

describe("RBT pathway forward-correction migration", () => {
  const { sql } = findMigration();

  it("logs invalid rows using the REAL DQ column names (candidate_id, employee_id, kind, detail)", () => {
    // Must reference the real columns
    expect(sql).toMatch(/recruiting_pathway_data_quality[\s\S]*\(candidate_id, employee_id, kind, detail\)/);
    // Must NOT reference the phantom columns from the earlier bad migration
    expect(sql).not.toMatch(/\bissue_type\b/);
    expect(sql).not.toMatch(/\bdetails\s+jsonb\b/i);
    expect(sql).not.toMatch(/jsonb_build_object\s*\(\s*'note'/);
  });

  it("uses the correct unique key ON CONFLICT (candidate_id, kind)", () => {
    expect(sql).toMatch(/ON CONFLICT \(candidate_id, kind\)/);
  });

  it("acquires pg_advisory_xact_lock keyed by employee before touching active assignments", () => {
    const lockIdx = sql.indexOf("pg_advisory_xact_lock");
    expect(lockIdx).toBeGreaterThan(-1);
    // The lock must appear BEFORE any UPDATE that deactivates active
    // assignments inside the function body.
    const dedupIdx = sql.indexOf("SET active = false, updated_at = now()\n    WHERE employee_id = v_employee_id AND active = true");
    expect(dedupIdx).toBeGreaterThan(lockIdx);
  });

  it("deterministically deactivates duplicate active rows BEFORE ensuring the partial unique index", () => {
    const dedupIdx = sql.search(/row_number\(\) OVER \(\s*PARTITION BY employee_id/);
    const indexIdx = sql.indexOf("CREATE UNIQUE INDEX IF NOT EXISTS uniq_rbt_pathway_assignment_active_per_employee");
    expect(dedupIdx).toBeGreaterThan(-1);
    expect(indexIdx).toBeGreaterThan(-1);
    expect(dedupIdx).toBeLessThan(indexIdx);
  });

  it("does not swallow VALIDATE CONSTRAINT failure", () => {
    // The VALIDATE line must exist and must NOT be wrapped in an exception handler.
    const validateLine = "ALTER TABLE public.recruiting_candidates\n  VALIDATE CONSTRAINT rbt_certified_requires_years";
    expect(sql).toContain(validateLine);
    // No `EXCEPTION WHEN` in the same DO block as the validate. We check by
    // ensuring the validate is a top-level statement (preceded by `;`, not
    // inside a DO block).
    const idx = sql.indexOf(validateLine);
    const beforeSlice = sql.slice(0, idx);
    const lastDoOpen = beforeSlice.lastIndexOf("DO $$");
    const lastDoClose = beforeSlice.lastIndexOf("END $$");
    expect(lastDoClose).toBeGreaterThan(lastDoOpen);
  });

  it("keeps arbitrary-ID sync RPC revoked from PUBLIC and authenticated", () => {
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.sync_rbt_pathway_assignment\(uuid\) FROM PUBLIC/);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.sync_rbt_pathway_assignment\(uuid\) FROM authenticated/);
  });
});