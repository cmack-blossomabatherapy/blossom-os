/**
 * Phase 4B4 — reporting access hardening.
 *
 * Static verification of the forward-only migration that removes leftover
 * PUBLIC/anon privileges on the curated reporting views and on the canonical
 * report RPCs. Live grant state is verified separately against the database;
 * this pins the migration so a later edit cannot silently re-open access.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "supabase/migrations";
const files = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
const allSql = files.map((f) => readFileSync(join(DIR, f), "utf8")).join("\n");

const migration = (() => {
  const hit = files
    .slice()
    .reverse()
    .find((f) => readFileSync(join(DIR, f), "utf8").includes("Phase 4B4"));
  expect(hit, "Phase 4B4 access hardening migration exists").toBeTruthy();
  return readFileSync(join(DIR, hit!), "utf8");
})();

const VIEWS = [
  "v_cr_authorization_current",
  "v_cr_schedule_current",
  "v_cr_billing_documentation_status",
  "v_cr_canonical_sessions",
  "v_cr_claims_status",
  "v_cr_provider_mapping",
];

const FUNCTIONS = [
  "canonical_report_totals",
  "canonical_report_client_hours",
  "canonical_report_billing_rows",
  "canonical_report_provider_hours",
  "can_manage_authorization_events",
];

describe("Phase 4B4 curated view lockdown", () => {
  it("covers all six curated reporting views", () => {
    for (const view of VIEWS) expect(migration).toContain(view);
  });

  it("revokes every privilege from PUBLIC and anon", () => {
    expect(migration).toContain("REVOKE ALL ON public.%I FROM PUBLIC");
    expect(migration).toContain("REVOKE ALL ON public.%I FROM anon");
  });

  it("leaves authenticated with SELECT only", () => {
    expect(migration).toMatch(
      /REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public\.%I FROM authenticated/,
    );
    expect(migration).toContain("GRANT SELECT ON public.%I TO authenticated");
    const grants = migration.match(/GRANT[^;']*TO authenticated/g) ?? [];
    expect(grants.length).toBeGreaterThan(0);
    for (const grant of grants) {
      expect(grant).not.toMatch(/INSERT|UPDATE|DELETE|TRUNCATE|REFERENCES|TRIGGER|GRANT ALL/);
    }
  });

  it("preserves service_role operation", () => {
    expect(migration).toContain("GRANT ALL ON public.%I TO service_role");
  });
});

describe("Phase 4B4 canonical report RPC lockdown", () => {
  it("covers all five function names", () => {
    for (const fn of FUNCTIONS) expect(migration).toContain(fn);
  });

  it("is catalog-driven over pg_proc so every overload is covered by exact signature", () => {
    expect(migration).toMatch(/FROM pg_proc/);
    expect(migration).toMatch(/oid::regprocedure/);
    expect(migration).toMatch(/p\.proname = ANY/);
  });

  it("revokes EXECUTE from PUBLIC and anon", () => {
    expect(migration).toMatch(/REVOKE ALL ON FUNCTION %s FROM PUBLIC/);
    expect(migration).toMatch(/REVOKE ALL ON FUNCTION %s FROM anon/);
  });

  it("grants EXECUTE to authenticated and service_role only", () => {
    expect(migration).toMatch(/GRANT EXECUTE ON FUNCTION %s TO authenticated/);
    expect(migration).toMatch(/GRANT EXECUTE ON FUNCTION %s TO service_role/);
    expect(migration).not.toMatch(/GRANT EXECUTE ON FUNCTION[^;]*TO anon/);
    expect(migration).not.toMatch(/GRANT EXECUTE ON FUNCTION[^;]*TO PUBLIC/);
  });

  it("does not redefine function bodies or search_path", () => {
    expect(migration).not.toMatch(/CREATE (OR REPLACE )?FUNCTION/i);
    expect(migration).not.toMatch(/ALTER FUNCTION/i);
    expect(migration).not.toMatch(/SET search_path/i);
  });
});

describe("Phase 4B4 stays inside its boundary", () => {
  it("is additive: no table/RLS/policy changes and no data mutation", () => {
    expect(migration).not.toMatch(/CREATE POLICY|DROP POLICY/i);
    expect(migration).not.toMatch(/ALTER TABLE/i);
    expect(migration).not.toMatch(/\b(INSERT INTO|UPDATE\s+public\.|DELETE FROM|TRUNCATE\s+public\.)/i);
    expect(migration).not.toMatch(/CREATE (OR REPLACE )?VIEW/i);
    expect(migration).not.toMatch(/DROP (TABLE|VIEW|FUNCTION)/i);
  });

  it("does not touch the protected BCBA Productivity V3 surface", () => {
    for (const token of [
      "bcbaProductivityV3",
      "bcba_productivity_snapshots",
      "commit_to_submit",
    ]) {
      expect(migration).not.toContain(token);
    }
  });

  it("does not modify earlier access-lockdown migrations", () => {
    expect(allSql).toContain("Phase 4A1 (3): lock down reporting data access");
    expect(allSql).toContain("Phase 4A1 audit repair (1): raw payload access lockdown");
  });
});

/**
 * Follow-up: the initial hardening revoked an explicit privilege list from
 * `authenticated`, which left PG17's MAINTAIN privilege in place on the four
 * legacy views. The follow-up migration revokes ALL then re-grants SELECT so
 * `authenticated` ends with read-only access on every curated view.
 */
const residualMigration = (() => {
  const hit = files
    .slice()
    .reverse()
    .find((f) => {
      const sql = readFileSync(join(DIR, f), "utf8");
      return (
        sql.includes("REVOKE ALL ON public.%I FROM authenticated") &&
        sql.includes("GRANT SELECT ON public.%I TO authenticated")
      );
    });
  expect(hit, "residual authenticated-privilege migration exists").toBeTruthy();
  return readFileSync(join(DIR, hit!), "utf8");
})();

describe("Phase 4B4 follow-up: authenticated keeps SELECT only", () => {
  it("covers all six curated views", () => {
    for (const view of VIEWS) expect(residualMigration).toContain(view);
  });

  it("revokes every privilege from PUBLIC, anon and authenticated, then re-grants SELECT only", () => {
    expect(residualMigration).toContain("REVOKE ALL ON public.%I FROM PUBLIC");
    expect(residualMigration).toContain("REVOKE ALL ON public.%I FROM anon");
    expect(residualMigration).toContain("REVOKE ALL ON public.%I FROM authenticated");
    expect(residualMigration).toContain("GRANT SELECT ON public.%I TO authenticated");
    expect(residualMigration).not.toMatch(/GRANT\s+(INSERT|UPDATE|DELETE|ALL)[^\n]*TO (anon|authenticated)/i);
  });

  it("preserves service_role operation", () => {
    expect(residualMigration).toContain("GRANT ALL ON public.%I TO service_role");
  });

  it("is catalog-guarded, additive and leaves protected surfaces alone", () => {
    expect(residualMigration).toMatch(/FROM pg_class c/);
    expect(residualMigration).not.toMatch(/CREATE (OR REPLACE )?(VIEW|FUNCTION)/i);
    expect(residualMigration).not.toMatch(/ALTER (TABLE|FUNCTION)/i);
    expect(residualMigration).not.toMatch(/\b(INSERT INTO|DELETE FROM|TRUNCATE\s+public\.)/i);
    for (const token of ["bcbaProductivityV3", "commit_to_submit"]) {
      expect(residualMigration).not.toContain(token);
    }
  });
});
