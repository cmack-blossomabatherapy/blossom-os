/**
 * Definition/access guards for the staff-safe C2S aggregate RPCs.
 *
 * These read the deployed migration SQL so the contract cannot silently drift:
 * aggregate counts only, auth required, every counted row constrained by
 * `c2s_can_read_subject`, deterministic paging for the proxy, and EXECUTE
 * limited to signed-in staff.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "supabase/migrations";
const SQL = readdirSync(join(process.cwd(), DIR))
  .filter((f) => f.endsWith(".sql"))
  .map((f) => readFileSync(join(process.cwd(), DIR, f), "utf8"))
  .join("\n");

const fnBody = (name: string) => {
  const start = SQL.indexOf(`FUNCTION public.${name}`);
  expect(start, `function ${name} not found in migrations`).toBeGreaterThan(-1);
  return SQL.slice(start, SQL.indexOf("$$;", start) + 3);
};

describe("report_c2s_governance_counts", () => {
  const body = fnBody("report_c2s_governance_counts");

  it("is a SECURITY DEFINER function with a fixed search_path", () => {
    expect(body).toMatch(/SECURITY DEFINER/i);
    expect(body).toMatch(/SET search_path = public/i);
  });

  it("requires an authenticated caller", () => {
    expect(body).toMatch(/auth\.uid\(\)/);
  });

  it("constrains every counted row with c2s_can_read_subject", () => {
    expect(body).toMatch(/c2s_can_read_subject\s*\(/);
  });

  it("exposes aggregate counts only — no subject or client detail", () => {
    expect(body).toMatch(/historical_formal_records/);
    expect(body).toMatch(/active_formal_records/);
    expect(body).toMatch(/open_disputes/);
    expect(body).toMatch(/active_approved_exceptions/);
    for (const forbidden of ["client_id", "client_name", "payor", "amount", "rate"]) {
      expect(body.toLowerCase()).not.toContain(forbidden);
    }
  });

  it("revokes public/anon and grants EXECUTE only to authenticated", () => {
    expect(SQL).toMatch(
      /REVOKE ALL ON FUNCTION public\.report_c2s_governance_counts\(\) FROM PUBLIC/i,
    );
    expect(SQL).toMatch(
      /REVOKE ALL ON FUNCTION public\.report_c2s_governance_counts\(\) FROM anon/i,
    );
    expect(SQL).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.report_c2s_governance_counts\(\) TO authenticated/i,
    );
  });
});

describe("report_c2s_documentation_proxy_page", () => {
  const body = fnBody("report_c2s_documentation_proxy_page");

  it("orders deterministically before paging", () => {
    expect(body).toMatch(/ORDER BY/i);
    expect(body).toMatch(/LIMIT/i);
    expect(body).toMatch(/OFFSET/i);
  });

  it("is authenticated-only", () => {
    expect(SQL).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.report_c2s_documentation_proxy_page\([\s\S]{0,80}\) TO authenticated/i,
    );
  });
});

describe("c2s_is_hr_authority()", () => {
  it("has a no-argument, session-scoped form granted only to authenticated", () => {
    expect(SQL).toMatch(/FUNCTION public\.c2s_is_hr_authority\(\)/);
    expect(SQL).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.c2s_is_hr_authority\(\) TO authenticated/i,
    );
    expect(SQL).toMatch(/REVOKE ALL ON FUNCTION public\.c2s_is_hr_authority\(\) FROM anon/i);
  });
});
