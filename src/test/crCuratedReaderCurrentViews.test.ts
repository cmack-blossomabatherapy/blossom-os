/**
 * Final curated-reader reconciliation: the payments, ERA and timesheet
 * documentation RPCs must read the current-snapshot views only, so readiness
 * counts match the views and future daily refreshes cannot leak historical
 * snapshot rows. Claims readers stay on their own path.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const MIGRATION = readFileSync(
  "supabase/migrations/20260825185403_deedd4e5-6c12-4db5-9532-8d82df26652e.sql",
  "utf8",
);

const bodyOf = (name: string) => {
  const start = MIGRATION.indexOf(`CREATE OR REPLACE FUNCTION public.${name}()`);
  expect(start, `${name} redefined`).toBeGreaterThan(-1);
  return MIGRATION.slice(start, MIGRATION.indexOf("$$;", start) + 3);
};

const READERS = [
  ["report_payments_current", "v_cr_payments_current"],
  ["report_era_reconciliation", "v_cr_era_reconciliation"],
  ["report_timesheet_documentation_summary", "v_cr_timesheet_documentation"],
] as const;

describe.each(READERS)("%s reads only %s", (fn, view) => {
  const body = bodyOf(fn);

  it("selects from the curated current view", () => {
    expect(body).toMatch(new RegExp(`FROM public\\.${view}\\b`));
  });

  it("never reads a cr_* base table", () => {
    expect(body).not.toMatch(/FROM public\.cr_/);
    expect(body).not.toMatch(/JOIN public\.cr_/);
  });

  it("keeps SECURITY DEFINER with a fixed safe search_path", () => {
    expect(body).toMatch(/SECURITY DEFINER/);
    expect(body).toMatch(/SET search_path = public, pg_temp/);
  });

  it("keeps the auth.uid() guard and an explicit role check", () => {
    expect(body).toMatch(/auth\.uid\(\) IS NULL/);
    expect(body).toMatch(
      /can_read_payment_reconciliation_report\(auth\.uid\(\)\)|has_any_role\(auth\.uid\(\)\)/,
    );
  });
});

describe("staff-safe projections preserved", () => {
  it("exposes no amounts, references, check numbers, notes or raw payloads", () => {
    for (const forbidden of [
      "amount_raw",
      "paid_amount",
      "check_number",
      "reference",
      "notes",
      "raw_payload",
      "centralreach_payload",
    ]) {
      expect(MIGRATION.toLowerCase(), forbidden).not.toContain(forbidden);
    }
  });

  it("uses the view's already-curated payment flags", () => {
    const body = bodyOf("report_payments_current");
    expect(body).toMatch(/p\.applied_to_billing_entry/);
    expect(body).toMatch(/p\.is_voided/);
    expect(body).not.toMatch(/billing_entry_id|voided_by|voided_date/);
  });

  it("keeps the void filter on documentation readiness", () => {
    expect(bodyOf("report_timesheet_documentation_summary")).toMatch(
      /WHERE t\.is_void IS NOT TRUE/,
    );
  });
});

describe("blast radius", () => {
  it("does not touch claims readers", () => {
    expect(MIGRATION).not.toMatch(/report_claims_status|cr_claims|v_cr_claims_status/);
  });

  it("writes no production rows and drops nothing", () => {
    expect(MIGRATION).not.toMatch(/\b(INSERT INTO|UPDATE public\.|DELETE FROM|DROP (TABLE|VIEW))\b/);
  });

  it("re-applies the same grant model (authenticated + service_role only)", () => {
    expect(MIGRATION).toMatch(/REVOKE ALL ON FUNCTION %s FROM PUBLIC/);
    expect(MIGRATION).toMatch(/REVOKE ALL ON FUNCTION %s FROM anon/);
    expect(MIGRATION).toMatch(/GRANT EXECUTE ON FUNCTION %s TO authenticated/);
    expect(MIGRATION).toMatch(/GRANT EXECUTE ON FUNCTION %s TO service_role/);
    expect(MIGRATION).not.toMatch(/GRANT EXECUTE[^;]*TO anon/);
  });

  it("preserves all three function signatures unchanged", () => {
    expect(bodyOf("report_payments_current")).toContain("applied_to_billing_entry boolean");
    expect(bodyOf("report_era_reconciliation")).toContain("reconcile_status text");
    expect(bodyOf("report_timesheet_documentation_summary")).toContain("locked_rows bigint");
  });
});
