/**
 * Phase 3B — Commit to Submit Compliance dashboard wiring and policy guards.
 *
 * These tests read the shipped page/source/hook files as text where the claim is
 * structural (no client fields, no employment-action fields, no service-role
 * usage) and exercise real functions where the claim is behavioural.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PRIMARY_REPORT_IDS, REPORTS } from "@/lib/os/reportsCatalog";
import { isValidDateWindow, C2S_HR_AUTHORITY_ROLES, C2S_DISPUTE_CLIENT_FIELDS } from "@/lib/os/reports/crPrimary/c2s/source";
import { c2sDisplayName } from "@/hooks/useC2sComplianceReport";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
/** Code only: documentation comments legitimately *name* the excluded concepts. */
const code = (rel: string) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
const PAGE = read("src/pages/os/reports/CommitToSubmitCompliancePage.tsx");
const SOURCE_ALL = read("src/lib/os/reports/crPrimary/c2s/source.ts");
const HOOK = read("src/hooks/useC2sComplianceReport.ts");
const DIALOGS = read("src/components/reports/c2s/C2sActionDialogs.tsx");
const APP = read("src/App.tsx");
const SOURCE = SOURCE_ALL;
const SOURCE_CODE = code("src/lib/os/reports/crPrimary/c2s/source.ts");
const PAGE_CODE = code("src/pages/os/reports/CommitToSubmitCompliancePage.tsx");
const HOOK_CODE = code("src/hooks/useC2sComplianceReport.ts");
const DIALOGS_CODE = code("src/components/reports/c2s/C2sActionDialogs.tsx");

describe("catalog + route wiring", () => {
  it("registers exactly one card for the report in the canonical primary set", () => {
    const matches = REPORTS.filter((r) => r.id === "commit-to-submit-compliance");
    expect(matches).toHaveLength(1);
    expect(matches[0].drilldownPath).toBe("/reports/commit-to-submit-compliance");
    expect(matches[0].visibleTo).toBe("all");
    expect(PRIMARY_REPORT_IDS.filter((id) => id === "commit-to-submit-compliance")).toHaveLength(1);
  });

  it("routes through the shared report role guard", () => {
    expect(APP).toContain('path="/reports/commit-to-submit-compliance"');
    expect(APP).toContain('reportId="commit-to-submit-compliance"');
  });
});

describe("scope separation and privacy", () => {
  it("reads only the trusted global RPCs for the proxy scope", () => {
    expect(SOURCE).toContain("report_c2s_documentation_proxy");
    expect(SOURCE).toContain("report_c2s_program_status");
  });

  it("never selects client, payor, hours, rate, or dollar fields", () => {
    for (const file of [SOURCE_CODE, PAGE_CODE, HOOK_CODE]) {
      const lowered = file.toLowerCase();
      // Field-shaped identifiers only: staff-facing copy legitimately says
      // "no client, payor, service, or dollar detail".
      for (const forbidden of [
        "client_id",
        "client_name",
        "clientname",
        "payor:",
        "payor_",
        "billed_amount",
        "units",
        "hourly",
      ]) {
        expect(lowered).not.toContain(forbidden);
      }
    }
  });

  it("carries no employment-action, pay, or discipline field in any write", () => {
    const lowered = (SOURCE_CODE + DIALOGS_CODE).toLowerCase();
    for (const forbidden of ["terminat", "suspend", "pay_change", "discipline", "wage", "salary"]) {
      expect(lowered).not.toContain(forbidden);
    }
  });

  it("never uses a service role or admin client", () => {
    for (const file of [SOURCE, HOOK, PAGE, DIALOGS]) {
      expect(file).not.toContain("service_role");
      expect(file).not.toContain("SERVICE_ROLE");
    }
  });
});

describe("employee dispute filing", () => {
  it("sends only the link and the statement; the database owns status and dates", () => {
    expect([...C2S_DISPUTE_CLIENT_FIELDS]).toEqual([
      "subject_employee_id",
      "tracker_record_id",
      "notice_id",
      "statement",
    ]);
    const insert = SOURCE.slice(SOURCE.indexOf("export function fileC2sDispute"));
    const body = insert.slice(0, insert.indexOf("\n}"));
    for (const forbidden of ["status:", "filed_at", "filing_deadline", "decided_at", "filed_by"]) {
      expect(body).not.toContain(forbidden);
    }
  });
});

describe("date window guard", () => {
  it("accepts a valid inclusive window and rejects impossible ones", () => {
    expect(isValidDateWindow("2026-01-01", "2026-01-31")).toBe(true);
    expect(isValidDateWindow("2026-01-31", "2026-01-01")).toBe(false);
    expect(isValidDateWindow("2026-13-01", "2026-13-05")).toBe(false);
    expect(isValidDateWindow("", "2026-01-05")).toBe(false);
  });

  it("does not query the proxy RPC for an invalid window", () => {
    const fn = SOURCE.slice(SOURCE.indexOf("export async function fetchC2sProxyRows"));
    expect(fn.slice(0, fn.indexOf("try {"))).toContain("isValidDateWindow");
  });
});

describe("RLS-empty is not an error", () => {
  it("only global-scope failures become the page error message", () => {
    expect(HOOK).toContain("proxyResult.error ?? statusResult.error");
    expect(HOOK).not.toContain("trackerResult.error ??");
  });

  it("falls back to a non-identifying label when a name is unreadable", () => {
    expect(c2sDisplayName({}, "abc")).toBe("Employee");
    expect(c2sDisplayName({ abc: "Jamie Lee" }, "abc")).toBe("Jamie Lee");
    expect(c2sDisplayName({}, null)).toBe("Employee");
  });
});

describe("activation and proxy honesty on the page", () => {
  it("shows a program-not-activated banner and states the proxy limitation", () => {
    expect(PAGE).toContain("Program not activated");
    expect(PAGE).toContain("Formal violations from this proxy");
    expect(PAGE).toContain("never a formal violation");
  });

  it("reports unmeasurable rows instead of counting them as on time", () => {
    expect(PAGE).toContain("Not measurable");
    expect(PAGE).toContain("excluded from the on-time and late percentages");
  });

  it("offers formal controls only to HR authority and coaching only after a manager check", () => {
    expect(PAGE).toContain("data.isHrAuthority");
    expect(PAGE).toContain("fetchIsDirectManager");
    expect(PAGE).toContain("Only this employee's direct manager or HR can record coaching.");
  });

  it("keeps the level 3 notice an HR review requirement only", () => {
    expect(DIALOGS).toContain("HR review requirement only");
    expect(SOURCE).toContain("hr_review_required: input.noticeLevel === 3");
  });

  it("mirrors the database HR role set without inventing extra roles", () => {
    expect(C2S_HR_AUTHORITY_ROLES).toContain("super_admin");
    expect(C2S_HR_AUTHORITY_ROLES).toContain("hr");
    expect(C2S_HR_AUTHORITY_ROLES).not.toContain("bcba");
    expect(C2S_HR_AUTHORITY_ROLES).not.toContain("rbt");
  });
});
