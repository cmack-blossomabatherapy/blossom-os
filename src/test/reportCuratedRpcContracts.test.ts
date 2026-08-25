/**
 * Phase 2A repair — curated report RPC contracts.
 *
 * Both RPCs must be SECURITY DEFINER with a fixed safe search_path, reject
 * unauthenticated callers, be callable by any authenticated employee, expose
 * only minimum operational fields, and leave base-table RLS untouched.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = "supabase/migrations";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));
const allSql = files.map((f) => readFileSync(join(dir, f), "utf8")).join("\n");

const bodyOf = (name: string) => {
  const start = allSql.indexOf(`CREATE OR REPLACE FUNCTION public.${name}()`);
  expect(start, `${name} migration exists`).toBeGreaterThan(-1);
  return allSql.slice(start, allSql.indexOf("$$;", start) + 3);
};

const FORBIDDEN = [
  "email",
  "phone",
  "address",
  "rate",
  "centralreach_payload",
  "raw_payload",
  "notes",
  "assigned_auth_coordinator",
  "created_by",
  "updated_by",
];

describe.each([
  ["report_authorization_actions"],
  ["report_billing_facts"],
])("%s()", (name) => {
  const fn = bodyOf(name);

  it("is SECURITY DEFINER with a fixed safe search_path", () => {
    expect(fn).toMatch(/SECURITY DEFINER/i);
    expect(fn).toMatch(/SET search_path = public, pg_temp/i);
  });

  it("rejects unauthenticated callers and is revoked from anon", () => {
    expect(fn).toMatch(/auth\.uid\(\) IS NOT NULL/);
    expect(allSql).toMatch(
      new RegExp(`REVOKE ALL ON FUNCTION public\\.${name}\\(\\) FROM anon`, "i"),
    );
  });

  it("is callable by every authenticated employee", () => {
    expect(allSql).toMatch(
      new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${name}\\(\\) TO authenticated`, "i"),
    );
  });

  it("exposes no contact info, rates, payloads, notes, or admin fields", () => {
    for (const forbidden of FORBIDDEN) {
      expect(fn.toLowerCase(), forbidden).not.toContain(forbidden.toLowerCase());
    }
  });
});

describe("report_authorization_actions() operational contract", () => {
  const fn = bodyOf("report_authorization_actions");

  it("returns the curated operational fields staff need", () => {
    for (const col of [
      "record_id uuid",
      "client_name text",
      "client_cr_id text",
      "authorization_number text",
      "state text",
      "payor text",
      "service_code text",
      "status text",
      "submitted_date date",
      "approved_date date",
      "denied_date date",
      "next_action text",
      "next_action_due_date date",
      "appeal_due_date date",
    ]) {
      expect(fn).toContain(col);
    }
  });

  it("reads only the authorization operational records table", () => {
    expect(fn).toMatch(/public\.authorization_operational_records/);
    expect(fn.match(/FROM public\.\w+/g)).toHaveLength(1);
  });
});

describe("report_billing_facts() operational contract", () => {
  const fn = bodyOf("report_billing_facts");

  it("joins billing sessions to their mutable status by row identity", () => {
    expect(fn).toMatch(/public\.cr_billing_sessions/);
    expect(fn).toMatch(/public\.cr_billing_session_status/);
    expect(fn).toMatch(/row_hash/);
  });

  it("returns the curated billing fields, including source identity", () => {
    for (const col of [
      "source_row_id text",
      "date_of_service date",
      "procedure_code text",
      "hours numeric",
      "client_cr_id text",
      "provider_name text",
      "payor text",
      "state text",
      "authorization_id text",
    ]) {
      expect(fn).toContain(col);
    }
  });
});

describe("curated RPC migrations leave base-table RLS unchanged", () => {
  it("does not create policies or alter base tables", () => {
    const migration = files
      .sort()
      .reverse()
      .map((f) => readFileSync(join(dir, f), "utf8"))
      .find((sql) => sql.includes("report_billing_facts"))!;
    expect(migration).not.toMatch(/CREATE POLICY/i);
    expect(migration).not.toMatch(/ALTER TABLE public\.cr_billing_sessions/i);
    expect(migration).not.toMatch(/ALTER TABLE public\.authorization_operational_records/i);
  });
});
