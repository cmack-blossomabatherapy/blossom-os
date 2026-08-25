import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const MIGRATION = readFileSync(
  "supabase/migrations/20260825183243_4e4f9dc2-1345-46ba-acaf-abc12bb6b5fb.sql",
  "utf8",
);

const VIEWS = [
  "v_cr_schedule_current",
  "v_cr_authorization_current",
  "v_cr_timesheet_documentation",
  "v_cr_payments_current",
  "v_cr_era_reconciliation",
] as const;

describe("current-snapshot views recognize finalized 'active' batches", () => {
  it("defines latest batch with status IN ('active','success') for all five views", () => {
    const matches = MIGRATION.match(/status IN \('active', 'success'\)/g) ?? [];
    expect(matches.length).toBe(5);
    expect(MIGRATION).not.toMatch(/b\.status = 'success'/);
  });

  it("requires upsert_snapshot strategy and active batches", () => {
    expect((MIGRATION.match(/import_strategy = 'upsert_snapshot'/g) ?? []).length).toBe(5);
    expect((MIGRATION.match(/b\.is_active/g) ?? []).length).toBe(5);
  });

  it("recreates exactly the five current views", () => {
    for (const v of VIEWS) {
      expect(MIGRATION).toMatch(new RegExp(`CREATE VIEW public\\.${v}\\b`));
    }
  });

  it("does not redefine v_cr_claims_status", () => {
    expect(MIGRATION).not.toMatch(/(CREATE|DROP|ALTER)[^;]*v_cr_claims_status/);
  });

});

describe("latest-batch row filtering", () => {
  it("filters every view by COALESCE(last_seen_batch_id, batch_id)", () => {
    const filters = MIGRATION.match(
      /COALESCE\([a-z]\.last_seen_batch_id, [a-z]\.batch_id\) = \(SELECT id FROM latest_batch\)/g,
    ) ?? [];
    expect(filters.length).toBe(5);
  });

  it("keeps a fallback when no snapshot batch exists", () => {
    expect((MIGRATION.match(/NOT EXISTS \(SELECT 1 FROM latest_batch\)/g) ?? []).length).toBe(5);
  });

  it("scopes each view to its own export types", () => {
    expect(MIGRATION).toMatch(/'scheduling', 'schedule', 'schedule_events'/);
    expect(MIGRATION).toMatch(/'authorization', 'authorizations'/);
    expect(MIGRATION).toMatch(/'timesheet', 'timesheets', 'documentation'/);
    expect(MIGRATION).toMatch(/'payments', 'payment'/);
    expect(MIGRATION).toMatch(/'era_payments', 'era', 'era_payment_detail'/);
  });
});

describe("access model preserved", () => {
  it("keeps security_invoker on every view", () => {
    expect((MIGRATION.match(/security_invoker = on/g) ?? []).length).toBe(5);
  });

  it("grants SELECT only to authenticated and revokes PUBLIC/anon", () => {
    for (const v of VIEWS) {
      expect(MIGRATION).toMatch(new RegExp(`GRANT SELECT ON public\\.${v} TO authenticated`));
      expect(MIGRATION).toMatch(new RegExp(`REVOKE ALL ON public\\.${v} FROM anon`));
      expect(MIGRATION).toMatch(new RegExp(`REVOKE ALL ON public\\.${v} FROM PUBLIC`));
    }
    expect(MIGRATION).not.toMatch(/GRANT[^;]*TO (anon|PUBLIC)/);
  });

  it("performs no writes to production rows", () => {
    expect(MIGRATION).not.toMatch(/\b(INSERT INTO|UPDATE public\.|DELETE FROM)\b/);
    expect(MIGRATION).not.toMatch(/DROP TABLE/);
  });

  it("preserves staff-safe projections (no reference/check/notes/amount leakage)", () => {
    expect(MIGRATION).not.toMatch(/p\.reference|p\.notes|p\.amount_raw|e\.check_number|e\.paid_amount/);
  });
});

describe("Data Hub readiness maps snapshot kinds to curated current views", () => {
  const store = readFileSync("src/lib/os/centralreachUploads/supabaseStore.ts", "utf8");

  it("counts scheduling/authorization/payments/ERA/timesheet from current views", () => {
    expect(store).toMatch(/\["scheduling", "v_cr_schedule_current"\]/);
    expect(store).toMatch(/\["authorization", "v_cr_authorization_current"\]/);
    expect(store).toMatch(/\["payments", "v_cr_payments_current"\]/);
    expect(store).toMatch(/\["eraPayments", "v_cr_era_reconciliation"\]/);
    expect(store).toMatch(/\["timesheet", "v_cr_timesheet_documentation"\]/);
  });

  it("leaves billing and claims counting their base tables", () => {
    expect(store).toMatch(/\["billing", "cr_billing_sessions"\]/);
    expect(store).toMatch(/\["claims", "cr_claims"\]/);
  });

  it("no longer counts historical base tables for snapshot kinds", () => {
    expect(store).not.toMatch(/\["scheduling", "cr_schedule_events"\]/);
    expect(store).not.toMatch(/\["authorization", "cr_authorizations"\]/);
    expect(store).not.toMatch(/\["payments", "cr_payments"\]/);
    expect(store).not.toMatch(/\["eraPayments", "cr_era_payments"\]/);
    expect(store).not.toMatch(/\["timesheet", "cr_timesheet_status"\]/);
  });
});
