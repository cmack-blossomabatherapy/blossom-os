import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Phase 4A1 (3) — static verification of the reporting access lockdown
 * migration. Live grant/policy state is verified separately against the
 * database; this pins the migration so a later edit cannot silently re-open it.
 */
const MIGRATIONS = "supabase/migrations";

function migrationSql(): string {
  return readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(`${MIGRATIONS}/${f}`, "utf8"))
    .join("\n");
}

const sql = migrationSql();
const lockdown = sql.slice(sql.indexOf("Phase 4A1 (3): lock down reporting data access"));

describe("Phase 4A1 reporting access lockdown migration", () => {
  it("revokes every privilege from PUBLIC and anon on reporting objects", () => {
    expect(lockdown).toContain("REVOKE ALL ON public.%I FROM PUBLIC");
    expect(lockdown).toContain("REVOKE ALL ON public.%I FROM anon");
  });

  it("covers cr_* plus the curated views and authorization/productivity objects", () => {
    for (const name of [
      "v_cr_schedule_current",
      "v_cr_authorization_current",
      "authorization_operational_records",
      "authorization_weekly_events",
      "bcba_productivity_snapshots",
    ]) {
      expect(lockdown).toContain(name);
    }
    expect(lockdown).toContain("c.relname LIKE 'cr\\_%'");
  });

  it("grants authenticated SELECT only on curated views", () => {
    const viewBranch = lockdown.slice(
      lockdown.indexOf("Curated staff-facing views: read-only."),
    );
    expect(viewBranch).toContain("GRANT SELECT ON public.%I TO authenticated");
  });

  it("never grants TRUNCATE, REFERENCES or TRIGGER to authenticated", () => {
    const grants = lockdown.match(/GRANT[^;]*TO authenticated/g) ?? [];
    expect(grants.length).toBeGreaterThan(0);
    for (const grant of grants) {
      expect(grant).not.toMatch(/TRUNCATE|REFERENCES|TRIGGER|GRANT ALL/);
    }
  });

  it("preserves service_role access", () => {
    expect(lockdown).toContain("GRANT ALL ON public.%I TO service_role");
  });

  it("keeps protected V3 compatibility reads for cr_authorizations and cr_import_batches", () => {
    expect(lockdown).toContain("cr_authorizations");
    expect(lockdown).toContain("cr_import_batches");
    // Both are base tables in the loop, which always grants SELECT.
    expect(lockdown).toContain("GRANT SELECT ON public.%I TO authenticated");
  });

  it("restricts helper and reset functions from PUBLIC/anon", () => {
    for (const fn of [
      "cr_reset_report_data",
      "cr_hub_touch_updated_at",
      "cr_touch_updated_at",
      "cr_touch_billing_session_status",
      "cr_hub_can_manage",
    ]) {
      expect(lockdown).toContain(fn);
    }
    expect(lockdown).toMatch(/REVOKE ALL ON FUNCTION[^;]*FROM PUBLIC/);
  });

  it("gates raw, contact, claim and identity-mapping reads behind cr_hub_can_manage()", () => {
    for (const table of [
      "cr_contacts",
      "cr_claims",
      "cr_billing_session_status",
      "cr_client_provider_crosswalk",
      "cr_patient_match_links",
      "cr_provider_match_links",
      "cr_bcba_ownership_inferred",
      "cr_raw_rows",
      "cr_import_backups",
    ]) {
      expect(lockdown).toContain(table);
    }
    expect(lockdown).toContain("cr_hub_can_manage()");
  });

  it("keeps report RPCs executable only by authenticated and service_role", () => {
    for (const fn of [
      "report_authorization_actions",
      "report_authorization_events",
      "report_bcba_performance_targets",
      "report_billing_facts",
    ]) {
      expect(sql).toContain(fn);
      expect(sql).toMatch(
        new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${fn}[^;]*TO authenticated`),
      );
    }
    expect(lockdown).not.toMatch(/GRANT EXECUTE ON FUNCTION[^;]*TO anon/);
  });
});
