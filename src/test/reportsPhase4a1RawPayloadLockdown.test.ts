import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Phase 4A1 audit repair (1): raw payload access lockdown.
 * Static verification of the additive migration; live policy state is verified
 * separately against the database.
 */
const MIGRATIONS = "supabase/migrations";

const sql = readdirSync(MIGRATIONS)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(`${MIGRATIONS}/${f}`, "utf8"))
  .join("\n");

const repair = sql.slice(
  sql.indexOf("Phase 4A1 audit repair (1): raw payload access lockdown"),
);

describe("cr_external_records raw payload lockdown", () => {
  it("drops the scheduling-role policy", () => {
    expect(repair).toContain('DROP POLICY IF EXISTS "cr_ext admin" ON public.cr_external_records');
  });

  it("has no scheduling-role read predicate anywhere in the repair", () => {
    expect(repair).not.toMatch(/'scheduling'::app_role/);
  });

  it("gates select and writes behind cr_hub_can_manage()", () => {
    expect(repair).toMatch(
      /CREATE POLICY cr_external_records_read_admin[\s\S]*USING \(public\.cr_hub_can_manage\(\)\)/,
    );
    expect(repair).toMatch(
      /CREATE POLICY cr_external_records_manage[\s\S]*WITH CHECK \(public\.cr_hub_can_manage\(\)\)/,
    );
  });

  it("keeps anon and PUBLIC out and preserves service_role", () => {
    expect(repair).toContain("REVOKE ALL ON public.cr_external_records FROM anon");
    expect(repair).toContain("REVOKE ALL ON public.cr_external_records FROM PUBLIC");
    expect(repair).toContain("GRANT ALL ON public.cr_external_records TO service_role");
  });

  it("does not weaken any other sensitive cr_* policy", () => {
    for (const table of [
      "cr_claims",
      "cr_contacts",
      "cr_raw_rows",
      "cr_import_backups",
      "cr_sync_run_errors",
      "cr_patient_match_links",
      "cr_provider_match_links",
      "cr_bcba_ownership_inferred",
    ]) {
      expect(repair).not.toContain(`ON public.${table}`);
    }
  });

  it("leaves the guarded upsert RPC in place", () => {
    expect(repair).not.toContain("cr_upsert_external_record");
    expect(sql).toContain("cr_upsert_external_record");
  });
});
