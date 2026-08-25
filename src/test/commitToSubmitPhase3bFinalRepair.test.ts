/**
 * Phase 3B final repair guards for the Commit to Submit Compliance report.
 *
 * Each block pins one correctness rule that an independent inspection found
 * broken: unavailable governance aggregates must not read as zero, paging must
 * be complete and deterministic, staff copy must be honest about what is and is
 * not hidden, the current-month trend must actually have shape, sensitive
 * history must be visible and count-consistent, exports must follow the active
 * tab, and multi-series bars must keep one colour per series.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

const PAGE = read("src/pages/os/reports/CommitToSubmitCompliancePage.tsx");
const HOOK = read("src/hooks/useC2sComplianceReport.ts");
const SOURCE = read("src/lib/os/reports/crPrimary/c2s/source.ts");
const METRICS = read("src/lib/os/reports/crPrimary/metrics/commitToSubmit.ts");
const CHART = read("src/components/reports/crPrimary/PrimaryChart.tsx");
const SQL = readdirSync(join(process.cwd(), "supabase/migrations"))
  .filter((f) => f.endsWith(".sql"))
  .map((f) => read(join("supabase/migrations", f)))
  .join("\n");

describe("1 — governance read failures never render as zero", () => {
  it("the source aggregate returns nullable counts plus an error", () => {
    expect(SOURCE).toMatch(/C2sGovernanceCountsResult/);
    expect(SOURCE).toMatch(/counts:\s*C2sGovernanceCounts\s*\|\s*null/);
  });

  it("the hook exposes a nullable aggregate and a governanceError", () => {
    expect(HOOK).toMatch(/governanceCounts:\s*C2sGovernanceCounts\s*\|\s*null/);
    expect(HOOK).toMatch(/governanceError:\s*string\s*\|\s*null/);
  });

  it("the page renders Unavailable instead of a count it could not read", () => {
    expect(PAGE).toMatch(/C2S_UNAVAILABLE\s*=\s*"Unavailable"/);
    for (const kpi of [
      "historicalFormalRecords",
      "activeFormalRecords",
      "openDisputes",
      "activeApprovedExceptions",
    ]) {
      const idx = PAGE.indexOf(kpi);
      expect(idx, `${kpi} KPI not found`).toBeGreaterThan(-1);
      expect(PAGE.slice(idx, idx + 120)).toMatch(/C2S_UNAVAILABLE/);
    }
  });

  it("warns the reader that Unavailable is not zero", () => {
    expect(PAGE).toMatch(/instead of zero/i);
  });
});

describe("2 — complete, deterministic paging", () => {
  it("the paged proxy RPC orders by every column it returns", () => {
    const start = SQL.lastIndexOf(
      "FUNCTION public.report_c2s_documentation_proxy_page(\n  p_from",
    );
    expect(start).toBeGreaterThan(-1);
    const body = SQL.slice(start, SQL.indexOf("$function$;", start) + 11);


    for (const col of [
      "date_of_service",
      "employee_id",
      "provider_display_name",
      "role_group",
      "state",
      "documentation_date",
      "lag_days",
      "timeliness_status",
      "proxy_category",
      "used_authoritative_completion",
      "provenance",
      "source_quality",
      "last_seen_at",
    ]) {
      expect(body.slice(body.indexOf("ORDER BY")), `ORDER BY missing ${col}`).toContain(col);
    }
    expect(body).toMatch(/LIMIT/);
    expect(body).toMatch(/OFFSET/);
  });

  it("an exhausted page ceiling surfaces an error instead of silent truncation", () => {
    expect(SOURCE).toMatch(/C2S_PAGE_LIMIT_ERROR/);
    expect(SOURCE).toMatch(/could not be loaded completely/i);
  });
});

describe("3 — honest staff copy", () => {
  it("never claims the provider-level view is de-identified", () => {
    expect(PAGE).not.toMatch(/is de-identified/i);
    expect(PAGE).not.toMatch(/De-identified provider rows/);
    expect(PAGE).toMatch(/client-free provider-level/i);
  });
});

describe("4 — useful current-month trend", () => {
  it("the summary exposes weekly buckets", () => {
    expect(METRICS).toMatch(/byWeek:\s*C2sBreakdownRow\[\]/);
    expect(METRICS).toMatch(/export function isoWeekStart/);
  });

  it("the trend chart uses weekly percentages when months collapse", () => {
    expect(PAGE).toMatch(/weeklyTrendRows/);
    expect(PAGE).toMatch(/trendIsWeekly/);
    expect(PAGE).toMatch(/by week of service/i);
  });
});

describe("5 — sensitive history and count consistency", () => {
  it("shows RLS-visible coaching and program review tables", () => {
    expect(PAGE).toMatch(/Coaching history \(Visible to you\)/);
    expect(PAGE).toMatch(/Program reviews \(Visible to you\)/);
  });

  it("takes active formal counts from the safe aggregate, not local rows", () => {
    const idx = PAGE.indexOf("Active formal records come only");
    expect(idx).toBeGreaterThan(-1);
    expect(PAGE.slice(idx, idx + 400)).toMatch(/governanceCounts[\s\S]*activeFormalRecords/);
  });

  it("surfaces real sensitive-scope read failures without faking emptiness", () => {
    expect(HOOK).toMatch(/sensitiveScopeWarnings/);
    expect(PAGE).toMatch(/sensitiveScopeWarnings/);
  });
});

describe("6 — exports follow the active tab", () => {
  it("has a distinct export per tab inside the same privacy boundary", () => {
    expect(PAGE).toMatch(/commit-to-submit-visible-activity/);
    expect(PAGE).toMatch(/commit-to-submit-visible-governance/);
    expect(PAGE).toMatch(/commit-to-submit-documentation-rows/);
    expect(PAGE).toMatch(/commit-to-submit-timeliness/);
    expect(PAGE).not.toMatch(/commit-to-submit-program-records/);
  });

  it("no longer collapses two different tabs onto one CSV", () => {
    expect(PAGE).not.toMatch(/activeTab === "reviewed" \|\| activeTab === "disputes-exceptions"/);
  });
});

describe("7 — shared chart series colour", () => {
  it("only colours bars per category for single-series charts", () => {
    expect(CHART).toMatch(/!secondaryLabel\s*&&\s*\n?\s*!tertiaryLabel/);
    expect(CHART).toMatch(/fill=\{COLORS\[0\]\}/);
  });
});

describe("prior constraints still hold", () => {
  it("keeps exactly four canonical tabs", () => {
    for (const tab of ["overview", "proxy-queue", "reviewed", "disputes-exceptions"]) {
      expect(PAGE).toContain(`"${tab}"`);
    }
  });

  it("keeps the eight KPI concepts", () => {
    for (const id of [
      "eligible-rows",
      "on-time-rate",
      "late-rows",
      "missing-invalid",
      "historical-formal",
      "active-formal",
      "open-disputes",
      "active-exceptions",
    ]) {
      expect(PAGE).toContain(`"${id}"`);
    }
  });

  it("never lets the proxy scope produce a formal violation", () => {
    expect(METRICS).toMatch(/formalViolationsFromProxy: 0/);
  });
});
