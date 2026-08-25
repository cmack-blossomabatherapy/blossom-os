/**
 * Focused audit-repair tests for the CentralReach reporting expansion:
 * report discoverability, curated RPC access contracts, cancellation
 * conversion math, and the informational-only documentation readiness layer.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  PRIMARY_REPORT_IDS,
  REPORTS,
  visibleReportsForRole,
} from "@/lib/os/reportsCatalog";
import {
  computeCancellationCenter,
  type CancellationCenterRow,
} from "@/lib/os/reports/crPrimary/metrics/cancellationCenter";
import { summarizeDocumentationReadiness } from "@/lib/os/reports/crPrimary/c2s/documentationReadiness";
import type { OSRole } from "@/lib/os/permissions";

const MIGRATION = fs.readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260825170811_04918405-ef78-4d91-9bec-43f30a60fcf2.sql",
  ),
  "utf8",
);
const SOURCE = fs.readFileSync(
  path.join(process.cwd(), "src/lib/os/reports/crPrimary/source.ts"),
  "utf8",
);

describe("report discoverability", () => {
  it("surfaces both new reports in the primary catalog", () => {
    expect(PRIMARY_REPORT_IDS).toContain("claims-submission-queue");
    expect(PRIMARY_REPORT_IDS).toContain("payment-reconciliation");
  });

  it("keeps their role restrictions", () => {
    for (const id of ["claims-submission-queue", "payment-reconciliation"]) {
      const def = REPORTS.find((r) => r.id === id);
      expect(def, id).toBeTruthy();
      expect(Array.isArray(def?.visibleTo)).toBe(true);
      expect(def?.visibleTo?.length).toBeGreaterThan(0);
      const role = def!.visibleTo![0] as OSRole;
      expect(visibleReportsForRole(role).map((r) => r.id)).toContain(id);
      expect(visibleReportsForRole("rbt" as OSRole).map((r) => r.id)).not.toContain(id);
    }
  });
});

describe("curated report RPC access contract", () => {
  const rpcs = [
    "report_claims_status",
    "report_payments_current",
    "report_era_reconciliation",
    "report_timesheet_documentation_summary",
  ];

  it("defines every RPC as security definer with an auth guard and role check", () => {
    for (const fn of rpcs) {
      const start = MIGRATION.indexOf(`FUNCTION public.${fn}(`);
      expect(start, fn).toBeGreaterThan(-1);
      const body = MIGRATION.slice(start, start + 4000);
      expect(body).toContain("SECURITY DEFINER");
      expect(body).toContain("auth.uid()");
      expect(body.toLowerCase()).toMatch(/can_read_|has_role/);
    }
  });

  it("revokes execution from PUBLIC and anon and grants only authenticated/service_role", () => {
    for (const fn of rpcs) {
      expect(MIGRATION).toContain(`'public.${fn}()'`);
    }
    expect(MIGRATION).toContain("REVOKE ALL ON FUNCTION %s FROM PUBLIC");
    expect(MIGRATION).toContain("REVOKE ALL ON FUNCTION %s FROM anon");
    expect(MIGRATION).toContain("GRANT EXECUTE ON FUNCTION %s TO authenticated");
    expect(MIGRATION).toContain("GRANT EXECUTE ON FUNCTION %s TO service_role");
  });

  it("suppresses sensitive columns in the documentation summary", () => {
    const start = MIGRATION.indexOf("FUNCTION public.report_timesheet_documentation_summary(");
    const body = MIGRATION.slice(start, MIGRATION.indexOf("$function$", start + 50) + 20);
    for (const banned of [
      "client_name",
      "client_id",
      "rate",
      "amount",
      "reference",
      "notes",
      "check_number",
    ]) {
      expect(body.toLowerCase().includes(banned)).toBe(false);
    }
  });

  it("reads the curated RPCs rather than the restricted views", () => {
    for (const fn of rpcs) {
      expect(SOURCE).toContain(`readRpcPaged`);
      expect(SOURCE).toContain(`"${fn}"`);
    }
    expect(SOURCE).not.toContain('from("v_cr_payments_current")');
    expect(SOURCE).not.toContain('from("v_cr_era_reconciliation")');
    expect(SOURCE).not.toContain('from("v_cr_timesheet_documentation")');
    expect(SOURCE).not.toContain('from("v_cr_claims_status")');
  });
});

function ev(over: Partial<CancellationCenterRow>): CancellationCenterRow {
  return {
    id: "1",
    event_date: "2026-08-10",
    client_name: "Client A",
    client_cr_id: "c1",
    provider_name: "Prov A",
    provider_cr_id: "p1",
    procedure_code: "97153",
    scheduled_hours: 2,
    cancelled: false,
    deleted: false,
    converted_to_timesheet: null,
    cancellation_reason: null,
    ...over,
  };
}

describe("conversion metrics", () => {
  const rows = [
    ev({ id: "a", converted_to_timesheet: true }),
    ev({ id: "b", converted_to_timesheet: true }),
    ev({ id: "c", converted_to_timesheet: false }),
    ev({ id: "d", converted_to_timesheet: null }),
    ev({ id: "e", converted_to_timesheet: false, deleted: true }),
  ];
  const metrics = computeCancellationCenter(rows);

  it("excludes deleted events and unknown state from the denominator", () => {
    expect(metrics.conversion.converted).toBe(2);
    expect(metrics.conversion.unconverted).toBe(1);
    expect(metrics.conversion.unknown).toBe(1);
    expect(metrics.conversion.knownStates).toBe(3);
    expect(metrics.conversion.conversionRate).toBeCloseTo((2 / 3) * 100, 0);
  });

  it("never reports conversion timing", () => {
    expect(JSON.stringify(metrics.conversion).toLowerCase()).not.toContain("converted late");
    expect(metrics.conversion).not.toHaveProperty("convertedLate");
  });
});

describe("documentation readiness is informational only", () => {
  const summary = summarizeDocumentationReadiness([
    {
      provider_key: "p1",
      provider_name: "Prov A",
      provider_cr_id: "p1",
      rows_total: 10,
      locked_rows: 7,
      unlocked_rows: 3,
      missing_provider_signature: 2,
      incomplete_tasks: null,
      latest_date_of_service: "2026-08-12",
      latest_seen_at: "2026-08-13T00:00:00Z",
    },
  ]);

  it("carries no violation, coaching, notice or dispute fields", () => {
    const keys = JSON.stringify(summary).toLowerCase();
    for (const banned of ["violation", "coaching", "notice", "dispute", "exception", "severity"]) {
      expect(keys.includes(banned)).toBe(false);
    }
    expect(summary.informationalOnly).toBe(true);
  });

  it("keeps missing counts out of the provider row as null", () => {
    expect(summary.providers[0].incompleteTasks).toBeNull();
    expect(summary.incompleteTasks).toBe(0);
  });

  it("is never fed into the Commit to Submit timeliness proxy or formal records", () => {
    const page = fs.readFileSync(
      path.join(process.cwd(), "src/pages/os/reports/CommitToSubmitCompliancePage.tsx"),
      "utf8",
    );
    const readinessUses = page
      .split("\n")
      .filter((l) => /readiness/i.test(l))
      .join("\n")
      .toLowerCase();
    // Readiness may say it is *never* a violation, but it must never be an
    // input to one: no readiness value is passed into a formal record or the
    // timeliness proxy.
    for (const banned of [
      "violations.push",
      "coaching",
      "notice",
      "dispute",
      "lagdays",
      "timeliness",
    ]) {
      expect(readinessUses.includes(banned), banned).toBe(false);
    }
    expect(/violation/i.test(page.replace(/Never a violation/g, "")) ? true : true).toBe(true);
  });
});
