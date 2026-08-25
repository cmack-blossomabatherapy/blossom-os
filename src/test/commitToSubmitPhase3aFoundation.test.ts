/**
 * Phase 3A — Commit to Submit compliance DATA FOUNDATION.
 *
 * Behavioral tests for the pure metrics rules plus static policy assertions on
 * the migration (repo convention for RLS/RPC contracts).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  C2S_DISPUTE_HOLIDAY_LIMITATION,
  C2S_ON_TIME_MAX_LAG_DAYS,
  addBusinessDays,
  buildProviderQueue,
  classifyLag,
  disputeFilingDeadline,
  evaluateFormalViolation,
  evaluateNoticeEligibility,
  isConfigActive,
  isDisputeWithinWindow,
  normalizeProxyRow,
  proxyCategoryForRole,
  proxyRowIsFormalViolation,
  summarizeGovernance,
  summarizeProxyRows,
  type C2sProgramConfig,
  type C2sProxyRow,
  type C2sTrackerRecord,
} from "@/lib/os/reports/crPrimary/metrics/commitToSubmit";

const dir = "supabase/migrations";
const c2sSql = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => readFileSync(join(dir, f), "utf8"))
  .filter((sql) => sql.includes("c2s_program_config") || sql.includes("report_c2s_documentation_proxy"))
  .join("\n");

const approvedConfig: C2sProgramConfig = {
  id: "cfg-1",
  policyVersion: "v1",
  isEnabled: true,
  hrApprovedAt: "2026-08-01T00:00:00Z",
  legalApprovedAt: "2026-08-01T00:00:00Z",
  trackingStartDate: "2026-09-01",
  priorHistoryCounts: false,
  newHireGraceDays: 30,
  category1QaCriteria: "Reviewed substantive QA criteria v1",
};

const upheldRecord: C2sTrackerRecord = {
  id: "rec-1",
  subjectEmployeeId: "emp-1",
  roleGroup: "rbt",
  serviceDate: "2026-09-02",
  authoritativeCompletedAt: "2026-09-20T12:00:00Z",
  lagDays: 18,
  sourceKind: "authoritative_completion",
  category: "rbt_documentation",
  reviewStatus: "upheld",
  isFormalViolation: true,
};

function row(over: Partial<C2sProxyRow> = {}): C2sProxyRow {
  const lagDays = over.lagDays === undefined ? 3 : over.lagDays;
  return {
    employeeId: "emp-1",
    providerDisplayName: "Provider A",
    roleGroup: "RBT",
    state: "GA",
    dateOfService: "2026-09-02",
    documentationDate: "2026-09-05",
    lagDays,
    timelinessStatus: classifyLag(lagDays),
    proxyCategory: "RBT proxy",
    usedAuthoritativeCompletion: false,
    provenance: "dos_to_billing_creation_proxy",
    sourceQuality: "mapped_by_provider_id",
    lastSeenAt: "2026-09-10T00:00:00Z",
    ...over,
    lagDays,
    timelinessStatus: classifyLag(lagDays),
  };
}

describe("C2S timeliness boundary", () => {
  it("treats exactly 7 days as on time and 8 days as late", () => {
    expect(C2S_ON_TIME_MAX_LAG_DAYS).toBe(7);
    expect(classifyLag(7)).toBe("on_time");
    expect(classifyLag(8)).toBe("late");
    expect(classifyLag(0)).toBe("on_time");
  });

  it("keeps a missing timestamp missing rather than zero", () => {
    expect(classifyLag(null)).toBe("missing");
    expect(classifyLag(undefined)).toBe("missing");
    const normalized = normalizeProxyRow({ role_group: "RBT", lag_days: null });
    expect(normalized.lagDays).toBeNull();
    expect(normalized.timelinessStatus).toBe("missing");
  });

  it("treats a negative lag as invalid, not on time", () => {
    expect(classifyLag(-1)).toBe("invalid");
    expect(normalizeProxyRow({ role_group: "BCBA", lag_days: -4 }).timelinessStatus).toBe("invalid");
  });

  it("recomputes timeliness even when the raw row disagrees", () => {
    const normalized = normalizeProxyRow({ role_group: "RBT", lag_days: 12, timeliness_status: "on_time" });
    expect(normalized.timelinessStatus).toBe("late");
  });
});

describe("C2S role / category separation", () => {
  it("maps role groups to proxy categories and nothing else", () => {
    expect(proxyCategoryForRole("RBT")).toBe("RBT proxy");
    expect(proxyCategoryForRole("BCBA")).toBe("BCBA Category 2 proxy");
    expect(proxyCategoryForRole("Unknown")).toBe("unclassified");
  });

  it("never assigns BCBA Category 1 from a proxy row", () => {
    const categories = [row({ roleGroup: "BCBA" }), row({ roleGroup: "RBT" }), row({ roleGroup: "Unknown" })]
      .map((r) => normalizeProxyRow({ role_group: r.roleGroup, lag_days: r.lagDays }).proxyCategory);
    expect(categories).not.toContain("BCBA Category 1");
    expect(categories).toEqual(["BCBA Category 2 proxy", "RBT proxy", "unclassified"]);
  });

  it("keeps an unknown role out of both proxy buckets", () => {
    const summary = summarizeProxyRows([row({ roleGroup: "Unknown", lagDays: 9 })]);
    expect(summary.byProxyCategory.map((b) => b.key)).toEqual(["unclassified"]);
    expect(summary.byRoleGroup[0].key).toBe("Unknown");
  });

  it("a proxy late occurrence is never a formal violation", () => {
    const late = row({ lagDays: 30 });
    expect(late.timelinessStatus).toBe("late");
    expect(proxyRowIsFormalViolation(late)).toBe(false);
    expect(summarizeProxyRows([late]).formalViolationsFromProxy).toBe(0);
  });
});

describe("C2S aggregates and provider queue", () => {
  const rows = [
    row({ lagDays: 7 }),
    row({ lagDays: 8 }),
    row({ lagDays: null }),
    row({ lagDays: -2 }),
    row({ employeeId: null, providerDisplayName: "Ambiguous Name", lagDays: 9, sourceQuality: "unmapped_provider" }),
    row({ employeeId: "emp-2", providerDisplayName: "Provider B", roleGroup: "BCBA", state: "NC", lagDays: 2, usedAuthoritativeCompletion: true, provenance: "authoritative_completion" }),
  ];

  it("summarizes status counts, comparable rows and trends", () => {
    const s = summarizeProxyRows(rows);
    expect(s.total).toBe(6);
    expect(s.onTime).toBe(2);
    expect(s.late).toBe(2);
    expect(s.missing).toBe(1);
    expect(s.invalid).toBe(1);
    expect(s.comparable).toBe(4);
    expect(s.latePercent).toBe(50);
    expect(s.authoritativeRows).toBe(1);
    expect(s.unmappedRows).toBe(1);
    expect(s.byState.map((b) => b.key).sort()).toEqual(["GA", "NC"]);
    expect(s.byMonth.map((b) => b.key)).toEqual(["2026-09"]);
  });

  it("builds provider rows with no client fields", () => {
    const queue = buildProviderQueue(rows);
    const keys = new Set(Object.keys(queue[0]));
    for (const forbidden of ["clientName", "clientCrId", "hours", "payor", "rate", "procedureCode", "billingLabels"]) {
      expect(keys.has(forbidden)).toBe(false);
    }
    const unmapped = queue.find((q) => q.employeeId === null);
    expect(unmapped?.unmapped).toBe(true);
    const primary = queue.find((q) => q.employeeId === "emp-1")!;
    expect(primary.total).toBe(4);
    expect(primary.maxLagDays).toBe(8);
  });
});

describe("C2S configuration gate", () => {
  it("is inactive by default and while any approval or value is missing", () => {
    expect(isConfigActive(null)).toBe(false);
    expect(isConfigActive({ ...approvedConfig, isEnabled: false })).toBe(false);
    expect(isConfigActive({ ...approvedConfig, hrApprovedAt: null })).toBe(false);
    expect(isConfigActive({ ...approvedConfig, legalApprovedAt: null })).toBe(false);
    expect(isConfigActive({ ...approvedConfig, trackingStartDate: null })).toBe(false);
    expect(isConfigActive({ ...approvedConfig, priorHistoryCounts: null })).toBe(false);
    expect(isConfigActive({ ...approvedConfig, newHireGraceDays: null })).toBe(false);
    expect(isConfigActive({ ...approvedConfig, category1QaCriteria: "  " })).toBe(false);
    expect(isConfigActive(approvedConfig)).toBe(true);
  });

  it("blocks formal violations while the program is disabled", () => {
    const result = evaluateFormalViolation(upheldRecord, { config: { ...approvedConfig, isEnabled: false } });
    expect(result.eligible).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/not active/i);
  });
});

describe("C2S formal violation eligibility", () => {
  it("requires an upheld review", () => {
    const result = evaluateFormalViolation(
      { ...upheldRecord, reviewStatus: "unreviewed" },
      { config: approvedConfig },
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/upheld review/i);
  });

  it("blocks when an approved exception applies", () => {
    const result = evaluateFormalViolation(upheldRecord, {
      config: approvedConfig,
      exceptions: [
        { id: "x1", subjectEmployeeId: "emp-1", trackerRecordId: "rec-1", status: "approved", exceptionType: "approved_leave" },
      ],
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/approved exception/i);
  });

  it("ignores a denied exception", () => {
    const result = evaluateFormalViolation(upheldRecord, {
      config: approvedConfig,
      exceptions: [
        { id: "x1", subjectEmployeeId: "emp-1", trackerRecordId: "rec-1", status: "denied", exceptionType: "system_outage" },
      ],
    });
    expect(result.eligible).toBe(true);
  });

  it("blocks when a dispute was upheld", () => {
    const result = evaluateFormalViolation(upheldRecord, {
      config: approvedConfig,
      disputes: [{ id: "d1", subjectEmployeeId: "emp-1", trackerRecordId: "rec-1", status: "upheld" }],
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/upheld dispute/i);
  });

  it("requires authoritative completion plus reviewed QA criteria for BCBA Category 1", () => {
    const noEvidence = evaluateFormalViolation(
      { ...upheldRecord, roleGroup: "bcba", category: "bcba_category_1", authoritativeCompletedAt: null, sourceKind: "reviewed_tracker" },
      { config: approvedConfig },
    );
    expect(noEvidence.eligible).toBe(false);
    expect(noEvidence.reasons.join(" ")).toMatch(/Category 1/);

    const withEvidence = evaluateFormalViolation(
      { ...upheldRecord, roleGroup: "bcba", category: "bcba_category_1", category1CriteriaReference: "QA-2026-11" },
      { config: approvedConfig },
    );
    expect(withEvidence.eligible).toBe(true);
  });
});

describe("C2S notices", () => {
  const coaching = [{ id: "c1", subjectEmployeeId: "emp-1", coachingDate: "2026-09-10" }];

  it("requires prior coaching", () => {
    const noCoaching = evaluateNoticeEligibility({ level: 1, config: approvedConfig, record: upheldRecord });
    expect(noCoaching.allowed).toBe(false);
    expect(noCoaching.reasons.join(" ")).toMatch(/Coaching must precede/i);

    const withCoaching = evaluateNoticeEligibility({ level: 1, config: approvedConfig, record: upheldRecord, coaching });
    expect(withCoaching.allowed).toBe(true);
  });

  it("only allows a notice with an active approved configuration", () => {
    const result = evaluateNoticeEligibility({ level: 2, config: null, record: upheldRecord, coaching });
    expect(result.allowed).toBe(false);
  });

  it("makes a third notice HR-review-only with no employment action", () => {
    const third = evaluateNoticeEligibility({ level: 3, config: approvedConfig, record: upheldRecord, coaching });
    expect(third.allowed).toBe(true);
    expect(third.hrReviewRequired).toBe(true);
    expect(third.employmentAction).toBeNull();
    const first = evaluateNoticeEligibility({ level: 1, config: approvedConfig, record: upheldRecord, coaching });
    expect(first.hrReviewRequired).toBe(false);
  });
});

describe("C2S dispute window (weekend-aware)", () => {
  it("skips weekends when adding business days", () => {
    // 2026-09-02 is a Wednesday; +5 business days lands on the next Wednesday.
    expect(disputeFilingDeadline("2026-09-02")).toBe("2026-09-09");
    // Friday +1 business day is the following Monday.
    expect(addBusinessDays("2026-09-04", 1)).toBe("2026-09-07");
  });

  it("accepts a filing on the deadline and rejects one after it", () => {
    expect(isDisputeWithinWindow("2026-09-02", "2026-09-09")).toBe(true);
    expect(isDisputeWithinWindow("2026-09-02", "2026-09-10")).toBe(false);
  });

  it("documents that organization holidays are unavailable in the source", () => {
    expect(C2S_DISPUTE_HOLIDAY_LIMITATION).toMatch(/holidays are not available/i);
  });
});

describe("C2S governance counts", () => {
  it("separates reviewed, unreviewed, exception and dispute outcomes", () => {
    const summary = summarizeGovernance({
      records: [upheldRecord, { ...upheldRecord, id: "rec-2", reviewStatus: "unreviewed", isFormalViolation: false }],
      exceptions: [
        { id: "x1", subjectEmployeeId: "emp-1", trackerRecordId: null, status: "approved", exceptionType: "qa_error" },
        { id: "x2", subjectEmployeeId: "emp-1", trackerRecordId: null, status: "requested", exceptionType: "other" },
      ],
      disputes: [
        { id: "d1", subjectEmployeeId: "emp-1", trackerRecordId: "rec-1", status: "upheld" },
        { id: "d2", subjectEmployeeId: "emp-1", trackerRecordId: "rec-2", status: "submitted" },
      ],
    });
    expect(summary).toMatchObject({
      reviewedRecords: 1,
      unreviewedRecords: 1,
      upheldRecords: 1,
      formalViolations: 1,
      approvedExceptions: 1,
      pendingExceptions: 1,
      disputesFiled: 2,
      disputesUpheld: 1,
      disputesPending: 1,
    });
  });
});

describe("C2S migration policy contract", () => {
  it("makes activation impossible without every approval and value", () => {
    expect(c2sSql).toMatch(/c2s_config_activation_requires_approvals/);
    for (const required of [
      "hr_approved_by IS NOT NULL",
      "legal_approved_by IS NOT NULL",
      "tracking_start_date IS NOT NULL",
      "prior_history_counts IS NOT NULL",
      "new_hire_grace_days IS NOT NULL",
      "category1_qa_criteria IS NOT NULL",
    ]) {
      expect(c2sSql).toContain(required);
    }
    expect(c2sSql).toMatch(/is_enabled boolean NOT NULL DEFAULT false/);
  });

  it("requires review provenance for a formal violation and evidence for Category 1", () => {
    expect(c2sSql).toMatch(/c2s_tracker_formal_requires_review/);
    expect(c2sSql).toMatch(/c2s_tracker_category1_requires_evidence/);
    expect(c2sSql).toMatch(/c2s_notice_level3_requires_hr_review/);
  });

  it("enables RLS on every C2S table with explicit grants", () => {
    for (const table of [
      "c2s_program_config",
      "c2s_tracker_records",
      "c2s_coaching_records",
      "c2s_exceptions",
      "c2s_notices",
      "c2s_disputes",
      "c2s_program_reviews",
    ]) {
      expect(c2sSql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      expect(c2sSql).toMatch(new RegExp(`GRANT[^;]*ON public\\.${table} TO authenticated`));
      expect(c2sSql).toMatch(new RegExp(`GRANT ALL ON public\\.${table} TO service_role`));
      // No anon grants on any C2S table.
      expect(c2sSql).not.toMatch(new RegExp(`ON public\\.${table} TO anon`));
    }
  });

  it("uses dedicated helpers, not manages_employee or is_hr_operator", () => {
    expect(c2sSql).toMatch(/FUNCTION public\.c2s_can_read_subject/);
    expect(c2sSql).toMatch(/FUNCTION public\.c2s_is_direct_manager/);
    expect(c2sSql).toMatch(/subject\.manager_id/);
    expect(c2sSql).not.toMatch(/is_people_manager/);
    expect(c2sSql).not.toMatch(/manages_employee/);
    expect(c2sSql).not.toMatch(/is_hr_operator/);
  });

  it("gives every helper a fixed search_path", () => {
    const helpers = c2sSql.match(/CREATE OR REPLACE FUNCTION public\.c2s_[\s\S]*?\$\$;/g) ?? [];
    expect(helpers.length).toBeGreaterThanOrEqual(4);
    for (const helper of helpers) {
      expect(helper).toMatch(/SET search_path = public, pg_temp/);
    }
  });

  it("lets an employee file but not adjudicate their own dispute", () => {
    const insert = c2sSql.slice(c2sSql.indexOf('"c2s_disputes_insert"'));
    expect(insert).toMatch(/c2s_is_subject\(subject_employee_id\)/);
    const update = c2sSql.slice(c2sSql.indexOf('"c2s_disputes_update"'));
    expect(update.slice(0, 300)).not.toMatch(/c2s_is_subject/);
    expect(update).toMatch(/c2s_is_hr_authority\(\)/);
  });

  it("restricts exceptions, notices and formal disposition to HR authority", () => {
    for (const policy of ["c2s_exceptions_insert", "c2s_notices_insert", "c2s_tracker_insert", "c2s_config_update"]) {
      const chunk = c2sSql.slice(c2sSql.indexOf(`"${policy}"`));
      expect(chunk.slice(0, 300)).toMatch(/c2s_is_hr_authority\(\)/);
    }
  });
});

describe("report_c2s_documentation_proxy contract", () => {
  const fn = (() => {
    const start = c2sSql.indexOf("CREATE OR REPLACE FUNCTION public.report_c2s_documentation_proxy");
    expect(start).toBeGreaterThan(-1);
    return c2sSql.slice(start, c2sSql.indexOf("$$;", start) + 3);
  })();

  it("is auth-guarded SECURITY DEFINER with a fixed search_path and no anon access", () => {
    expect(fn).toMatch(/SECURITY DEFINER/);
    expect(fn).toMatch(/SET search_path = public, pg_temp/);
    expect(fn).toMatch(/uid IS NOT NULL/);
    expect(c2sSql).toMatch(/REVOKE ALL ON FUNCTION public\.report_c2s_documentation_proxy\(date, date\) FROM anon/);
    expect(c2sSql).toMatch(/GRANT EXECUTE ON FUNCTION public\.report_c2s_documentation_proxy\(date, date\) TO authenticated/);
  });

  it("inner joins current status rows and excludes void/deleted billing", () => {
    expect(fn).toMatch(/INNER JOIN public\.cr_billing_session_status s ON s\.row_hash = b\.row_hash/);
    expect(fn).toMatch(/coalesce\(s\.is_void, false\) = false/);
    expect(fn).toMatch(/coalesce\(s\.deleted, false\) = false/);
  });

  it("maps by provider id first, then unique normalized name only", () => {
    expect(fn).toMatch(/HAVING count\(DISTINCT l\.employee_id\) = 1/);
    expect(fn).toMatch(/HAVING count\(DISTINCT employee_id\) = 1/);
    expect(fn).toMatch(/normalize_person_name/);
  });

  it("returns only de-identified operational columns", () => {
    const returns = fn.slice(fn.indexOf("RETURNS TABLE"), fn.indexOf("LANGUAGE sql"));
    for (const col of [
      "employee_id uuid",
      "provider_display_name text",
      "role_group text",
      "state text",
      "date_of_service date",
      "documentation_date date",
      "lag_days integer",
      "timeliness_status text",
      "proxy_category text",
      "used_authoritative_completion boolean",
      "provenance text",
      "source_quality text",
      "last_seen_at timestamptz",
    ]) {
      expect(returns).toContain(col);
    }
    for (const forbidden of ["client", "payor", "hours", "rate", "procedure_code", "billing_labels", "provider_role", "location", "payload"]) {
      expect(returns.toLowerCase()).not.toContain(forbidden);
    }
  });

  it("encodes the same 7-day boundary, invalid negatives and missing lags as the metrics module", () => {
    expect(fn).toMatch(/WHEN s\.lag_days IS NULL THEN 'missing'/);
    expect(fn).toMatch(/WHEN s\.lag_days < 0 THEN 'invalid'/);
    expect(fn).toMatch(/WHEN s\.lag_days > 7 THEN 'late'/);
  });

  it("never emits a formal violation or BCBA Category 1", () => {
    expect(fn).not.toMatch(/formal/i);
    expect(fn).not.toMatch(/Category 1/i);
    expect(fn).toMatch(/'BCBA Category 2 proxy'/);
    expect(fn).toMatch(/'dos_to_billing_creation_proxy'/);
    expect(fn).toMatch(/'authoritative_completion'/);
  });
});
