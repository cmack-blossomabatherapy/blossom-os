/**
 * Phase 3A FINAL hardening repair — Commit to Submit (C2S).
 *
 * Covers the six defects confirmed against the live functions:
 *  1. dispute backdating / self-anchoring / notice+tracker link coherence
 *  2. notice UPDATE blocked once a higher level existed; immutable identity
 *  3. tracking_start_date / prior_history_counts / effective window
 *  4. unbounded approved exception acted as a blanket exception
 *  5. active-formal / pure evaluator strictness
 *  6. minimum EXECUTE privileges on internal helpers
 *  7. unmapped provider queue identity (name + role + state)
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  approvedExceptionApplies,
  buildProviderQueue,
  evaluateFormalViolation,
  evaluateNoticeEligibility,
  normalizeProxyRow,
  priorCoachingExists,
  serviceDateInTrackingScope,
  summarizeGovernance,
  unmappedProviderKey,
  type C2sCoachingRecord,
  type C2sProgramConfig,
  type C2sTrackerRecord,
} from "@/lib/os/reports/crPrimary/metrics/commitToSubmit";

const dir = "supabase/migrations";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

/** The FINAL repair migration: the last one that adds the tracking-scope helper. */
const repair = (() => {
  const sql = [...files]
    .reverse()
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .find((s) => s.includes("CREATE OR REPLACE FUNCTION public.c2s_config_allows_service_date"));
  expect(sql, "final repair migration exists").toBeTruthy();
  return sql!;
})();

function fnBody(name: string): string {
  const start = repair.indexOf(`CREATE OR REPLACE FUNCTION public.${name}`);
  expect(start, `${name} defined`).toBeGreaterThan(-1);
  return repair.slice(start, repair.indexOf("$$;", start) + 3);
}

// ------------------------------------------------------- 1. dispute integrity

describe("dispute guard: no backdating, no self-anchor, coherent links", () => {
  const guard = fnBody("c2s_dispute_guard");

  it("forces the filer identity and rejects an unmapped viewer instead of trusting input", () => {
    expect(guard).not.toMatch(/NEW\.filed_by := coalesce\(viewer, NEW\.filed_by\)/);
    expect(guard).toMatch(/IF viewer IS NULL THEN\s+RAISE EXCEPTION/);
    expect(guard).toMatch(/NEW\.filed_by := viewer;/);
  });

  it("forces filed_at to now() for a non-HR filing", () => {
    expect(guard).toMatch(/TG_OP = 'INSERT' AND NOT is_hr/);
    expect(guard).toMatch(/NEW\.filed_at := now\(\);/);
    expect(guard).toMatch(/NEW\.status := 'submitted';/);
    for (const field of ["decided_by", "decided_at", "decision_notes"]) {
      expect(guard).toMatch(new RegExp(`NEW\\.${field} := NULL;`));
    }
  });

  it("anchors only on notice issue date or formal-recorded date and never on filed_at", () => {
    const anchor = guard.slice(guard.indexOf("anchor := coalesce("), guard.indexOf("NEW.filing_deadline :="));
    expect(anchor).toMatch(/n\.issued_at AT TIME ZONE 'UTC'/);
    expect(anchor).toMatch(/t\.formal_violation_recorded_at AT TIME ZONE 'UTC'/);
    expect(anchor).not.toMatch(/filed_at/);
  });

  it("rejects a dispute with no authoritative anchor", () => {
    expect(guard).toMatch(
      /IF anchor IS NULL THEN\s+RAISE EXCEPTION 'C2S: a dispute requires an authoritative anchor/,
    );
  });

  it("requires the notice to reference the same tracker record when both are given", () => {
    expect(guard).toMatch(
      /NEW\.notice_id IS NOT NULL AND NEW\.tracker_record_id IS NOT NULL\s+AND n\.tracker_record_id IS DISTINCT FROM NEW\.tracker_record_id/,
    );
    expect(guard).toMatch(/must reference the same tracker record/);
  });

  it("keeps cross-employee links impossible for HR too (checked before the auth branch)", () => {
    const beforeAuth = guard.slice(0, guard.indexOf("IF auth.uid() IS NULL THEN"));
    expect(beforeAuth).toMatch(/n\.subject_employee_id <> NEW\.subject_employee_id/);
    expect(beforeAuth).toMatch(/t\.subject_employee_id <> NEW\.subject_employee_id/);
    expect(beforeAuth).toMatch(/IS DISTINCT FROM NEW\.tracker_record_id/);
  });

  it("recomputes the deadline from the anchor and rejects a late employee filing", () => {
    expect(guard).toMatch(/NEW\.filing_deadline := public\.c2s_add_business_days\(anchor, window_days\)/);
    expect(guard).toMatch(
      /\(NEW\.filed_at AT TIME ZONE 'UTC'\)::date > NEW\.filing_deadline THEN\s+RAISE EXCEPTION/,
    );
  });
});

// -------------------------------------------------------- 2. notice integrity

describe("notice guard: sequential on INSERT only, immutable identity on UPDATE", () => {
  const guard = fnBody("c2s_notice_guard");
  const updateBranch = guard.slice(
    guard.indexOf("IF TG_OP = 'UPDATE' THEN"),
    guard.indexOf("SELECT * INTO t FROM public.c2s_tracker_records"),
  );

  it("returns from the UPDATE branch before any sequence check", () => {
    expect(updateBranch).toMatch(/RETURN NEW;/);
    expect(updateBranch).not.toMatch(/max\(n\.notice_level\)/);
    // The sequence check lives only after the UPDATE branch (INSERT path).
    const insertPath = guard.slice(guard.indexOf("-- Levels must advance sequentially"));
    expect(insertPath).toMatch(/SELECT coalesce\(max\(n\.notice_level\), 0\) INTO highest/);
  });

  it("makes identity fields immutable on UPDATE", () => {
    for (const field of [
      "subject_employee_id",
      "tracker_record_id",
      "config_id",
      "prior_coaching_id",
      "notice_level",
      "issued_by",
      "issued_at",
    ]) {
      expect(updateBranch).toMatch(new RegExp(`NEW\\.${field} IS DISTINCT FROM OLD\\.${field}`));
    }
    expect(updateBranch).toMatch(/is immutable/);
  });

  it("still lets an authorized update touch acknowledgment and HR review fields", () => {
    for (const field of ["acknowledged_at", "hr_review_required", "hr_review_id"]) {
      expect(updateBranch).not.toMatch(new RegExp(`NEW\\.${field} IS DISTINCT FROM OLD\\.${field}`));
    }
    // Level 3 stays an HR review requirement on update, with no employment action.
    expect(updateBranch).toMatch(/IF NEW\.notice_level = 3 THEN\s+NEW\.hr_review_required := true;/);
    for (const forbidden = "terminat", lowered = updateBranch.toLowerCase(); ; ) {
      expect(lowered).not.toContain(forbidden);
      expect(lowered).not.toContain("suspend");
      break;
    }
  });

  it("keeps INSERT integrity: active config, effective window, active formal", () => {
    const insertPath = guard.slice(guard.indexOf("SELECT * INTO t FROM public.c2s_tracker_records"));
    expect(insertPath).toMatch(/c2s_config_is_active\(NEW\.config_id\)/);
    expect(insertPath).toMatch(/c2s_config_window_contains\(\s*NEW\.config_id/);
    expect(insertPath).toMatch(/c2s_is_active_formal\(NEW\.tracker_record_id\)/);
  });

  it("never deletes or rewrites historical notice rows", () => {
    expect(guard).not.toMatch(/DELETE FROM public\.c2s_notices/);
    expect(guard).not.toMatch(/UPDATE public\.c2s_notices/);
  });
});

// -------------------------------------------- 3. tracking start / config window

describe("tracking start and effective window (database)", () => {
  it("adds a fixed-search_path service-date scope helper", () => {
    const fn = fnBody("c2s_config_allows_service_date");
    expect(fn).toMatch(/SET search_path = public, pg_temp/);
    expect(fn).toMatch(/_service_date >= c\.tracking_start_date/);
    expect(fn).toMatch(/coalesce\(c\.prior_history_counts, false\) = true/);
    expect(fn).toMatch(/c\.tracking_start_date IS NOT NULL/);
  });

  it("adds a fixed-search_path effective-window helper", () => {
    const fn = fnBody("c2s_config_window_contains");
    expect(fn).toMatch(/SET search_path = public, pg_temp/);
    expect(fn).toMatch(/c\.effective_from IS NULL OR _on >= c\.effective_from/);
    expect(fn).toMatch(/c\.effective_to IS NULL OR _on <= c\.effective_to/);
  });

  it("validates a formal tracker record against both rules", () => {
    const guard = fnBody("c2s_tracker_formal_guard");
    expect(guard).toMatch(/c2s_config_is_active\(NEW\.config_id\)/);
    expect(guard).toMatch(/c2s_config_window_contains\(\s*NEW\.config_id, \(NEW\.formal_violation_recorded_at AT TIME ZONE 'UTC'\)::date\)/);
    expect(guard).toMatch(/c2s_config_allows_service_date\(NEW\.config_id, NEW\.service_date\)/);
    expect(guard).toMatch(/precedes the program tracking start date/);
  });

  it("requires the notice issue date to sit inside the effective window", () => {
    expect(fnBody("c2s_notice_guard")).toMatch(
      /c2s_config_window_contains\(\s*NEW\.config_id, \(coalesce\(NEW\.issued_at, now\(\)\) AT TIME ZONE 'UTC'\)::date\)/,
    );
  });

  it("applies the same rules to active formal counts", () => {
    const fn = fnBody("c2s_is_active_formal");
    expect(fn).toMatch(/c2s_config_window_contains\(/);
    expect(fn).toMatch(/c2s_config_allows_service_date\(t\.config_id, t\.service_date\)/);
  });
});

// -------------------------------------------------- 4. exception scope (database)

describe("approved exception scope (database)", () => {
  const guard = fnBody("c2s_exception_scope_guard");

  it("runs BEFORE INSERT OR UPDATE on exceptions", () => {
    expect(repair).toMatch(
      /CREATE TRIGGER c2s_exception_scope_guard_trg\s+BEFORE INSERT OR UPDATE ON public\.c2s_exceptions/,
    );
  });

  it("rejects a linked tracker record belonging to another subject", () => {
    expect(guard).toMatch(/t\.subject_employee_id <> NEW\.subject_employee_id/);
    expect(guard).toMatch(/same employee/);
  });

  it("requires a bounded window for an approved unlinked exception", () => {
    expect(guard).toMatch(/NEW\.status = 'approved' AND NEW\.tracker_record_id IS NULL/);
    expect(guard).toMatch(/NEW\.applies_from IS NULL OR NEW\.applies_to IS NULL/);
    expect(guard).toMatch(/NEW\.applies_to < NEW\.applies_from/);
  });

  it("makes the matcher ignore an unbounded exception", () => {
    const fn = fnBody("c2s_has_approved_exception");
    expect(fn).toMatch(/x\.applies_from IS NOT NULL/);
    expect(fn).toMatch(/x\.applies_to IS NOT NULL/);
    expect(fn).not.toMatch(/x\.applies_from IS NULL OR/);
  });
});

// ------------------------------------------ 6. minimum function execution (DB)

describe("minimum EXECUTE privileges", () => {
  const internal = [
    ["c2s_add_business_days", "date, integer"],
    ["c2s_config_is_active", "uuid"],
    ["c2s_has_approved_exception", "uuid, uuid, date"],
    ["c2s_is_active_formal", "uuid"],
  ] as const;

  it("revokes PUBLIC/anon/authenticated on every internal helper", () => {
    for (const [name, args] of internal) {
      expect(repair).toMatch(
        new RegExp(`REVOKE ALL ON FUNCTION public\\.${name}\\(${args}\\) FROM PUBLIC, anon, authenticated;`),
      );
      expect(repair).toMatch(
        new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${name}\\(${args}\\) TO service_role;`),
      );
      expect(repair).not.toMatch(
        new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${name}\\(${args}\\) TO authenticated`),
      );
    }
  });

  it("also locks the two new window helpers and the trigger functions", () => {
    for (const sig of [
      "c2s_config_window_contains\\(uuid, date\\)",
      "c2s_config_allows_service_date\\(uuid, date\\)",
      "c2s_tracker_formal_guard\\(\\)",
      "c2s_notice_guard\\(\\)",
      "c2s_dispute_guard\\(\\)",
      "c2s_exception_scope_guard\\(\\)",
    ]) {
      expect(repair).toMatch(new RegExp(`REVOKE ALL ON FUNCTION public\\.${sig} FROM PUBLIC, anon, authenticated;`));
    }
  });

  it("keeps authenticated EXECUTE only on policy helpers and the two staff report RPCs", () => {
    for (const sig of [
      "c2s_is_subject\\(uuid, uuid\\)",
      "c2s_is_direct_manager\\(uuid, uuid\\)",
      "c2s_can_read_subject\\(uuid, uuid\\)",
      "c2s_is_hr_authority\\(uuid\\)",
      "report_c2s_program_status\\(\\)",
      "report_c2s_documentation_proxy\\(date, date\\)",
    ]) {
      expect(repair).toMatch(new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${sig} TO authenticated;`));
    }
  });
});

// ------------------------------------------------------- pure evaluator truth

const config: C2sProgramConfig = {
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

const coaching: C2sCoachingRecord[] = [
  { id: "c1", subjectEmployeeId: "emp-1", coachingDate: "2026-09-10" },
];

const record: C2sTrackerRecord = {
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
  formalViolationRecordedAt: "2026-09-25T00:00:00Z",
};

describe("tracking start scope (pure)", () => {
  it("rejects the day before tracking start when prior history does not count", () => {
    const dayBefore = { ...record, serviceDate: "2026-08-31" };
    expect(serviceDateInTrackingScope(dayBefore, config)).toBe(false);
    const r = evaluateFormalViolation(dayBefore, { config, coaching });
    expect(r.eligible).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/outside the program tracking scope/i);
  });

  it("accepts the day before tracking start when prior history counts", () => {
    const priorConfig = { ...config, priorHistoryCounts: true };
    const dayBefore = { ...record, serviceDate: "2026-08-31" };
    expect(serviceDateInTrackingScope(dayBefore, priorConfig)).toBe(true);
    expect(evaluateFormalViolation(dayBefore, { config: priorConfig, coaching }).eligible).toBe(true);
  });

  it("accepts the day of tracking start under both settings", () => {
    const dayOf = { ...record, serviceDate: "2026-09-01" };
    expect(evaluateFormalViolation(dayOf, { config, coaching }).eligible).toBe(true);
    expect(
      evaluateFormalViolation(dayOf, { config: { ...config, priorHistoryCounts: true }, coaching })
        .eligible,
    ).toBe(true);
  });

  it("is false without a tracking start date or a service date", () => {
    expect(serviceDateInTrackingScope(record, { ...config, trackingStartDate: null })).toBe(false);
    expect(serviceDateInTrackingScope({ ...record, serviceDate: null }, config)).toBe(false);
  });
});

describe("approvedExceptionApplies bounded-window truth", () => {
  const base = {
    id: "x",
    subjectEmployeeId: "emp-1",
    trackerRecordId: null,
    status: "approved" as const,
    exceptionType: "approved_leave",
  };

  it("ignores an approved exception with no window at all", () => {
    expect(approvedExceptionApplies(record, [base])).toBe(false);
  });

  it("ignores a one-sided window in either direction", () => {
    expect(approvedExceptionApplies(record, [{ ...base, appliesFrom: "2026-09-01" }])).toBe(false);
    expect(approvedExceptionApplies(record, [{ ...base, appliesTo: "2026-09-30" }])).toBe(false);
  });

  it("applies a valid bounded window that contains the service date", () => {
    expect(
      approvedExceptionApplies(record, [
        { ...base, appliesFrom: "2026-09-01", appliesTo: "2026-09-30" },
      ]),
    ).toBe(true);
    expect(
      approvedExceptionApplies(record, [
        { ...base, appliesFrom: "2026-10-01", appliesTo: "2026-10-31" },
      ]),
    ).toBe(false);
  });

  it("ignores a linked exception whose subject does not match the record", () => {
    expect(
      approvedExceptionApplies(record, [
        { ...base, subjectEmployeeId: "emp-2", trackerRecordId: "rec-1" },
      ]),
    ).toBe(false);
    expect(approvedExceptionApplies(record, [{ ...base, trackerRecordId: "rec-1" }])).toBe(true);
  });
});

describe("active formal / pure evaluator strictness", () => {
  it("requires isFormalViolation, upheld review and a recorded date", () => {
    expect(evaluateFormalViolation({ ...record, isFormalViolation: false }, { config, coaching }).eligible).toBe(false);
    expect(evaluateFormalViolation({ ...record, reviewStatus: "under_review" }, { config, coaching }).eligible).toBe(false);
    const noDate = evaluateFormalViolation(
      { ...record, formalViolationRecordedAt: null },
      { config, coaching },
    );
    expect(noDate.eligible).toBe(false);
    expect(noDate.reasons.join(" ")).toMatch(/recorded formal disposition date/i);
  });

  it("requires an active config, coaching chronology, no exception and no upheld dispute", () => {
    expect(evaluateFormalViolation(record, { config: null, coaching }).eligible).toBe(false);
    expect(
      evaluateFormalViolation(record, {
        config,
        coaching: [{ id: "late", subjectEmployeeId: "emp-1", coachingDate: "2026-09-26" }],
      }).eligible,
    ).toBe(false);
    expect(
      evaluateFormalViolation(record, {
        config,
        coaching,
        exceptions: [
          { id: "x", subjectEmployeeId: "emp-1", trackerRecordId: "rec-1", status: "approved", exceptionType: "qa_error" },
        ],
      }).eligible,
    ).toBe(false);
    expect(
      evaluateFormalViolation(record, {
        config,
        coaching,
        disputes: [{ id: "d", subjectEmployeeId: "emp-1", trackerRecordId: "rec-1", status: "upheld" }],
      }).eligible,
    ).toBe(false);
    expect(evaluateFormalViolation(record, { config, coaching }).eligible).toBe(true);
  });

  it("makes priorCoachingExists false when the formal-recorded date is missing", () => {
    expect(priorCoachingExists({ ...record, formalViolationRecordedAt: null }, coaching)).toBe(false);
    expect(priorCoachingExists({ ...record, formalViolationRecordedAt: undefined }, coaching)).toBe(false);
    expect(priorCoachingExists(record, coaching)).toBe(true);
  });

  it("never allows a notice on a nonformal record even when the review is upheld", () => {
    const r = evaluateNoticeEligibility({
      level: 1,
      config,
      coaching,
      record: { ...record, isFormalViolation: false },
    });
    expect(r.allowed).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/no recorded formal violation disposition/i);
    expect(r.employmentAction).toBeNull();
  });

  it("keeps recorded violations historical while active counts follow the rules", () => {
    const outOfScope = { ...record, id: "rec-2", serviceDate: "2026-08-01" };
    const summary = summarizeGovernance({ config, coaching, records: [record, outOfScope] });
    expect(summary.recordedFormalViolations).toBe(2);
    expect(summary.formalViolations).toBe(1);
  });
});

// ------------------------------------------------- 7. unmapped provider queue

describe("unmapped provider queue identity", () => {
  const row = (over: Record<string, unknown>) =>
    normalizeProxyRow({
      employee_id: null,
      provider_display_name: "Jordan Smith",
      role_group: "RBT",
      state: "GA",
      date_of_service: "2026-09-02",
      lag_days: 9,
      ...over,
    });

  it("never merges equal names across role group or state", () => {
    const rows = [
      row({}),
      row({ role_group: "BCBA" }),
      row({ state: "NC" }),
    ];
    const queue = buildProviderQueue(rows);
    expect(queue).toHaveLength(3);
    expect(queue.every((q) => q.unmapped)).toBe(true);
    expect(new Set(rows.map(unmappedProviderKey)).size).toBe(3);
  });

  it("merges the same unmapped person deterministically regardless of name casing/spacing", () => {
    const queue = buildProviderQueue([row({}), row({ provider_display_name: "  jordan   smith " })]);
    expect(queue).toHaveLength(1);
    expect(queue[0].total).toBe(2);
  });

  it("still groups mapped rows by employee id, not by name", () => {
    const queue = buildProviderQueue([
      row({ employee_id: "emp-1" }),
      row({ employee_id: "emp-1", provider_display_name: "Jordan A Smith", state: "NC" }),
      row({ employee_id: "emp-2" }),
    ]);
    expect(queue).toHaveLength(2);
    expect(queue.every((q) => q.unmapped === false)).toBe(true);
  });

  it("exposes no new output fields", () => {
    const [entry] = buildProviderQueue([row({})]);
    expect(Object.keys(entry).sort()).toEqual(
      [
        "authoritativeRows",
        "comparable",
        "employeeId",
        "invalid",
        "late",
        "latePercent",
        "maxLagDays",
        "missing",
        "onTime",
        "providerDisplayName",
        "proxyCategory",
        "proxyRows",
        "roleGroup",
        "state",
        "total",
        "unmapped",
      ].sort(),
    );
  });
});
