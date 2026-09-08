/**
 * Claims current-snapshot reconciliation.
 *
 * `cr_claims` retains 20,000 historical/current rows across several snapshot
 * imports. The staff-facing Claims Submission & Error Queue must read only the
 * newest active claims snapshot batch (2,082 rows on the live smoke test) while
 * every historical row stays stored in `cr_claims`.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

const DIR = "supabase/migrations";
const MIGRATION_FILE = readdirSync(DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .reverse()
  .map((f) => `${DIR}/${f}`)
  .find((p) => readFileSync(p, "utf8").includes("v_cr_claims_current"));

const SQL = readFileSync(MIGRATION_FILE as string, "utf8");

describe("v_cr_claims_current migration", () => {
  it("exists as a forward migration", () => {
    expect(MIGRATION_FILE, "claims current-view migration").toBeTruthy();
  });

  it("selects only the newest active/success upsert_snapshot claims batch", () => {
    expect(SQL).toMatch(/CREATE OR REPLACE VIEW public\.v_cr_claims_current/);
    expect(SQL).toMatch(/is_active/);
    expect(SQL).toMatch(/status = ANY \(ARRAY\['active','success'\]\)/);
    expect(SQL).toMatch(/import_strategy = 'upsert_snapshot'/);
    expect(SQL).toMatch(/lower\(b\.export_type\) = ANY \(ARRAY\['claims','claim'\]\)/);
    expect(SQL).toMatch(/ORDER BY b\.created_at DESC, b\.id DESC\s+LIMIT 1/);
    expect(SQL).toMatch(/COALESCE\(c\.last_seen_batch_id, c\.batch_id\) =/);
  });

  it("keeps history: no deletes, drops or truncates of cr_claims", () => {
    expect(SQL).not.toMatch(/DELETE FROM public\.cr_claims/i);
    expect(SQL).not.toMatch(/TRUNCATE/i);
    expect(SQL).not.toMatch(/DROP TABLE/i);
  });

  it("uses security_invoker and staff-safe grants only", () => {
    expect(SQL).toMatch(/SET \(security_invoker = true\)/);
    expect(SQL).toMatch(/GRANT SELECT ON public\.v_cr_claims_current TO authenticated/);
    expect(SQL).toMatch(/REVOKE ALL ON public\.v_cr_claims_current FROM anon/);
    expect(SQL).not.toMatch(/GRANT SELECT ON public\.v_cr_claims_current TO anon/);
  });

  it("hides raw/restricted amount fields", () => {
    for (const forbidden of ["amount_raw", "paid_amount_raw", "billed_amount", "paid_amount"]) {
      expect(SQL, forbidden).not.toContain(forbidden);
    }
  });

  it("indexes the current-batch expression for performance", () => {
    expect(SQL).toMatch(
      /CREATE INDEX IF NOT EXISTS cr_claims_current_batch_idx\s+ON public\.cr_claims \(\(COALESCE\(last_seen_batch_id, batch_id\)\)\)/,
    );
  });
});

describe("report_claims_status reader", () => {
  const body = SQL.slice(
    SQL.indexOf("CREATE OR REPLACE FUNCTION public.report_claims_status()"),
  );

  it("reads the current view, never the all-history table or view", () => {
    expect(body).toMatch(/FROM public\.v_cr_claims_current c;/);
    expect(body).not.toMatch(/FROM public\.cr_claims\b/);
    expect(body).not.toMatch(/v_cr_claims_status/);
  });

  it("keeps the auth guard, role check and search_path", () => {
    expect(body).toMatch(/auth\.uid\(\) IS NULL/);
    expect(body).toMatch(/can_read_claims_report\(auth\.uid\(\)\)/);
    expect(body).toMatch(/SECURITY DEFINER/);
    expect(body).toMatch(/SET search_path = public, pg_temp/);
  });

  it("keeps grants to authenticated + service_role only", () => {
    expect(body).toMatch(/GRANT EXECUTE ON FUNCTION public\.report_claims_status\(\) TO authenticated/);
    expect(body).toMatch(/GRANT EXECUTE ON FUNCTION public\.report_claims_status\(\) TO service_role/);
    expect(body).not.toMatch(/GRANT EXECUTE[^;]*TO anon/);
  });
});

describe("Data Hub readiness counts", () => {
  const store = readFileSync("src/lib/os/centralreachUploads/supabaseStore.ts", "utf8");

  it("counts claims from the current view and payments from the payments current view", () => {
    expect(store).toMatch(/\["claims", "v_cr_claims_current"\]/);
    expect(store).toMatch(/\["payments", "v_cr_payments_current"\]/);
    expect(store).not.toMatch(/\["claims", "cr_claims"\]/);
  });
});
