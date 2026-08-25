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

describe("repair pass — catalog, pagination, authority, and page contract", () => {
  it("PRIMARY_REPORT_IDS is exactly the canonical eight and excludes progress-reports", () => {
    expect([...PRIMARY_REPORT_IDS]).toEqual([
      "bcba-productivity-report-v3",
      "cancellation-command-center",
      "authorization-analysis",
      "authorization-utilization-hour-based",
      "parent-training",
      "bcba-supervision",
      "bcba-performance",
      "commit-to-submit-compliance",
    ]);
    expect(PRIMARY_REPORT_IDS).not.toContain("progress-reports");
  });

  it("keeps the legacy progress-reports card and route without making it primary", () => {
    expect(REPORTS.find((r) => r.id === "progress-reports")?.drilldownPath).toBe(
      "/reports/progress-reports",
    );
    expect(APP).toContain('path="/reports/progress-reports"');
  });

  it("C2S card owner is HR / Operations", () => {
    expect(REPORTS.find((r) => r.id === "commit-to-submit-compliance")?.owner).toBe(
      "HR / Operations",
    );
  });

  it("no primary card copy mentions plumbing, uploads, or revenue claims", () => {
    const forbidden = [
      "data hub",
      "admin",
      "upload",
      "source file",
      "export required",
      "lost revenue",
    ];
    for (const id of PRIMARY_REPORT_IDS) {
      const card = REPORTS.find((r) => r.id === id);
      expect(card, `missing primary card ${id}`).toBeTruthy();
      const copy = [
        card!.title,
        card!.description,
        card!.owner,
        card!.lastUpdated,
        card!.aiInsight ?? "",
        ...(card!.tags ?? []),
      ]
        .join(" | ")
        .toLowerCase();
      for (const word of forbidden) {
        expect(copy, `${id} card copy mentions "${word}"`).not.toContain(word);
      }
    }
  });

  it("uses exactly the four canonical tab labels and URL values", () => {
    const block = PAGE.slice(PAGE.indexOf("export const C2S_TABS"), PAGE.indexOf("const EMPTY_FILTERS"));
    for (const [value, label] of [
      ["overview", "Overview"],
      ["proxy-queue", "Proxy Queue"],
      ["reviewed", "Reviewed"],
      ["disputes-exceptions", "Disputes & Exceptions"],
    ] as const) {
      expect(block).toContain(`value: "${value}"`);
      expect(block).toContain(`label: "${label}"`);
    }
    expect(PAGE).not.toContain('value="providers"');
    expect(PAGE).not.toContain('value="governance"');
  });

  it("uses a status URL filter key, never timeliness", () => {
    expect(PAGE_CODE).toContain('status: ""');
    expect(PAGE_CODE).not.toContain('timeliness: ""');
    expect(PAGE_CODE).toContain('{ key: "status", label: "Status"');
  });

  it("renders exactly the eight required KPI concepts", () => {
    for (const label of [
      "Eligible proxy rows",
      "On-time rate",
      "Late rows",
      "Missing / invalid timestamps",
      "Historical formal records",
      "Active formal records",
      "Open disputes",
      "Active approved exceptions",
    ]) {
      expect(PAGE, `missing KPI ${label}`).toContain(`label: "${label}"`);
    }
    // The zero-formal proxy rule lives in the banner, not as a ninth KPI.
    expect(PAGE).not.toContain('label: "Formal violations from this proxy"');
    expect(PAGE).toContain("Formal violations from this proxy: never");
    expect(PAGE).not.toContain('label: "Coaching recorded"');
  });

  it("takes active formal counts from the aggregate RPC, never from proxy rows", () => {
    expect(SOURCE).toContain("report_c2s_governance_counts");
    expect(PAGE).toContain("data.governanceCounts");
    expect(PAGE).toContain("never inferred from documentation lag");
  });

  it("paginates every read instead of capping at 1000 / 500 rows", () => {
    expect(SOURCE).toContain("report_c2s_documentation_proxy_page");
    expect(SOURCE).toContain("C2S_PAGE_SIZE");
    expect(SOURCE).toContain("C2S_NAME_CHUNK_SIZE");
    expect(SOURCE_CODE).not.toContain(".limit(1000)");
    expect(SOURCE_CODE).not.toContain("slice(0, 500)");
    expect(SOURCE_CODE).toContain("p_offset");
  });

  it("asks the database for HR authority instead of reading user_roles", () => {
    expect(SOURCE_CODE).toContain('rpc("c2s_is_hr_authority")');
    expect(SOURCE_CODE).not.toContain('from("user_roles")');
  });

  it("keeps the exact HR authority role set", () => {
    expect([...C2S_HR_AUTHORITY_ROLES]).toEqual([
      "admin",
      "super_admin",
      "hr",
      "hr_admin",
      "hr_manager",
      "hr_lead",
      "exec",
      "executive",
      "executive_leadership",
      "ceo",
      "coo",
      "cfo",
    ]);
  });

  it("never uses a service role or admin client in browser code", () => {
    for (const file of [SOURCE_CODE, PAGE_CODE, HOOK_CODE, DIALOGS_CODE]) {
      expect(file).not.toContain("service_role");
      expect(file).not.toContain("SERVICE_ROLE");
      expect(file).not.toContain("createClient(");
    }
  });

  it("employee disputes send only the four approved client fields", () => {
    expect([...C2S_DISPUTE_CLIENT_FIELDS].sort()).toEqual(
      ["statement", "notice_id", "subject_employee_id", "tracker_record_id"].sort(),
    );
    for (const server of ["status", "filed_by", "filed_at", "filing_deadline", "decided_at"]) {
      expect(C2S_DISPUTE_CLIENT_FIELDS as readonly string[]).not.toContain(server);
    }
  });

  it("hides formal review/exception/notice controls while the program is inactive", () => {
    expect(PAGE).toContain("data.isHrAuthority && programActive");
    expect(PAGE).toContain("const programActive =");
  });

  it("Proxy Queue shows both the action queue and the client-free row drilldown", () => {
    expect(PAGE).toContain("Provider action queue");
    expect(PAGE).toContain("Documentation rows behind these numbers");
    expect(PAGE).toContain('label: "Provenance"');
  });

  it("labels sensitive totals and tables as visible to you", () => {
    expect(PAGE).toContain("Reviewed program records (Visible to you)");
    expect(PAGE).toContain("Disputes (Visible to you)");
    expect(PAGE).toContain("Exceptions (Visible to you)");
  });

  it("keeps charts unit-honest — percentages and counts never share an axis", () => {
    expect(PAGE).toContain("On-time percentage trend");
    expect(PAGE).toContain("Late rows by state");
    expect(PAGE).toContain("Status counts by role");
    expect(PAGE).toContain("Late rows by proxy category");
    expect(PAGE).toContain("no percentages");
  });

  it("empty states never point staff at admin plumbing", () => {
    for (const word of ["Data Hub", "re-upload", "admin area"]) {
      expect(PAGE).not.toContain(word);
    }
  });
});
