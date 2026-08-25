import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = "supabase/migrations";
const allSql = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => readFileSync(join(dir, f), "utf8"))
  .join("\n");

const fn = (() => {
  const start = allSql.lastIndexOf("FUNCTION public.report_authorization_events()");
  expect(start).toBeGreaterThan(-1);
  return allSql.slice(start, allSql.indexOf("$$;", start) + 3);
})();

describe("report_authorization_events() — curated authorization event read", () => {
  it("is SECURITY DEFINER with a fixed safe search_path", () => {
    expect(fn).toMatch(/SECURITY DEFINER/i);
    expect(fn).toMatch(/SET search_path = public, pg_temp/i);
  });

  it("rejects unauthenticated callers", () => {
    expect(fn).toMatch(/auth\.uid\(\) IS NOT NULL/);
    expect(allSql).toMatch(
      /REVOKE ALL ON FUNCTION public\.report_authorization_events\(\) FROM anon/i,
    );
  });

  it("is callable by every authenticated employee across states", () => {
    expect(allSql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.report_authorization_events\(\) TO authenticated/i,
    );
    // No state scoping in the curated read — org-wide by policy decision.
    expect(fn).not.toMatch(/current_user_state\(/);
  });

  it("returns only the curated report contract", () => {
    for (const col of [
      "record_id uuid",
      "source text",
      "event_type text",
      "event_date date",
      "client_name text",
      "client_cr_id text",
      "authorization_number text",
      "payor text",
      "state text",
      "reason text",
      "created_at timestamptz",
    ]) {
      expect(fn).toContain(col);
    }
  });

  it("exposes no contact info, rates, payloads, admin or disciplinary fields", () => {
    for (const forbidden of [
      "email",
      "phone",
      "address",
      "rate",
      "pay_",
      "centralreach_payload",
      "metadata",
      "created_by",
      "updated_by",
      "assigned_auth_coordinator",
      "commit_to_submit",
      "disciplinary",
      "e.notes",
    ]) {
      expect(fn.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });

  it("never synthesizes lifecycle dates from authorization start/effective dates", () => {
    expect(fn).not.toMatch(/r\.start_date/);
    expect(fn).not.toMatch(/effective_date/);
    expect(fn).toMatch(/r\.submitted_date/);
    expect(fn).toMatch(/r\.approved_date/);
    expect(fn).toMatch(/r\.denied_date/);
    expect(fn).toMatch(/v\.event_date IS NOT NULL/);
  });

  it("reads only the two approved operational event sources", () => {
    expect(fn).toMatch(/public\.authorization_weekly_events/);
    expect(fn).toMatch(/public\.authorization_operational_records/);
    expect(fn.match(/FROM public\.\w+/g)).toHaveLength(2);
  });

  it("does not alter base-table RLS", () => {
    const migration = readFileSync(
      join(dir, readdirSync(dir).sort().reverse().find((f) =>
        readFileSync(join(dir, f), "utf8").includes("report_authorization_events"),
      )!),
      "utf8",
    );
    expect(migration).not.toMatch(/CREATE POLICY/i);
    expect(migration).not.toMatch(/ALTER TABLE public\.authorization_/i);
  });
});
