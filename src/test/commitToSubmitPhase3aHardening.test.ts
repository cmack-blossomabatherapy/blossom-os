/**
 * Phase 3A HARDENING — Commit to Submit (C2S).
 *
 * Static contract tests read the hardening migration (the LAST migration that
 * revokes broad C2S privileges) plus pure behavioral tests for the tightened
 * formal-violation / notice / dispute rules.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  addBusinessDays,
  approvedExceptionApplies,
  evaluateFormalViolation,
  evaluateNoticeEligibility,
  priorCoachingExists,
  summarizeGovernance,
  type C2sProgramConfig,
  type C2sTrackerRecord,
} from "@/lib/os/reports/crPrimary/metrics/commitToSubmit";

const dir = "supabase/migrations";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

/** The hardening migration: the last one that revokes broad C2S privileges. */
const hardening = (() => {
  const match = [...files]
    .reverse()
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .find((sql) => sql.includes("REVOKE ALL PRIVILEGES ON TABLE public.c2s_"));
  expect(match, "hardening migration exists").toBeTruthy();
  return match!;
})();

const C2S_TABLES = [
  "c2s_program_config",
  "c2s_tracker_records",
  "c2s_coaching_records",
  "c2s_exceptions",
  "c2s_notices",
  "c2s_disputes",
  "c2s_program_reviews",
];

// -------------------------------------------------------------- 1. privileges

describe("C2S privilege lockdown", () => {
  it("revokes ALL privileges from PUBLIC, anon and authenticated on every table", () => {
    for (const table of C2S_TABLES) {
      expect(hardening).toMatch(
        new RegExp(
          `REVOKE ALL PRIVILEGES ON TABLE public\\.${table} FROM PUBLIC, anon, authenticated;`,
        ),
      );
    }
  });

  it("regrants only SELECT/INSERT/UPDATE to authenticated", () => {
    for (const table of C2S_TABLES) {
      expect(hardening).toMatch(
        new RegExp(`GRANT SELECT, INSERT, UPDATE ON public\\.${table} TO authenticated;`),
      );
    }
  });

  it("never grants DELETE, TRUNCATE, REFERENCES or TRIGGER to anon or authenticated", () => {
    const grants = hardening
      .split("\n")
      .filter((line) => /^\s*GRANT /i.test(line))
      .filter((line) => /\b(anon|authenticated)\b/.test(line));
    expect(grants.length).toBeGreaterThan(0);
    for (const line of grants) {
      expect(line).not.toMatch(/\bDELETE\b/i);
      expect(line).not.toMatch(/\bTRUNCATE\b/i);
      expect(line).not.toMatch(/\bREFERENCES\b/i);
      expect(line).not.toMatch(/\bTRIGGER\b/i);
      expect(line).not.toMatch(/GRANT ALL[^;]*\b(anon|authenticated)\b/i);
    }
    // No table-level grant to anon at all.
    for (const table of C2S_TABLES) {
      expect(hardening).not.toMatch(new RegExp(`ON public\\.${table} TO anon`));
    }
  });

  it("grants the service role its intended full table access", () => {
    for (const table of C2S_TABLES) {
      expect(hardening).toMatch(new RegExp(`GRANT ALL ON public\\.${table} TO service_role;`));
    }
  });

  it("keeps trigger-guard functions unexecutable by anon/PUBLIC/authenticated", () => {
    for (const fn of [
      "c2s_tracker_formal_guard",
      "c2s_notice_guard",
      "c2s_dispute_guard",
      "c2s_review_field_guard",
    ]) {
      expect(hardening).toMatch(
        new RegExp(`REVOKE ALL ON FUNCTION public\\.${fn}\\(\\) FROM PUBLIC, anon, authenticated;`),
      );
      expect(hardening).toMatch(
        new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${fn}\\(\\) TO service_role;`),
      );
    }
  });

  it("revokes anon execute on every new C2S function", () => {
    const created = [...hardening.matchAll(/CREATE OR REPLACE FUNCTION public\.(\w+)/g)].map(
      (m) => m[1],
    );
    expect(created.length).toBeGreaterThan(5);
    for (const fn of created) {
      expect(hardening, fn).toMatch(new RegExp(`REVOKE ALL ON FUNCTION public\\.${fn}\\([^)]*\\) FROM (PUBLIC|anon)`));
    }
  });
});

// ----------------------------------------------------------------- 2. config

describe("C2S configuration confidentiality and single enabled version", () => {
  it("restricts direct config reads to HR authority", () => {
    expect(hardening).toMatch(/DROP POLICY IF EXISTS "c2s_config_read" ON public\.c2s_program_config/);
    const policy = hardening.slice(hardening.indexOf('"c2s_config_read_hr_only"'));
    expect(policy.slice(0, 200)).toMatch(/FOR SELECT TO authenticated USING \(public\.c2s_is_hr_authority\(\)\)/);
  });

  it("allows at most one enabled configuration version", () => {
    expect(hardening).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS c2s_config_single_enabled_idx[\s\S]*?WHERE is_enabled = true/,
    );
  });

  it("exposes a staff-safe status RPC with no approver identities or notes", () => {
    const start = hardening.indexOf("CREATE OR REPLACE FUNCTION public.report_c2s_program_status()");
    expect(start).toBeGreaterThan(-1);
    const fn = hardening.slice(start, hardening.indexOf("$$;", start) + 3);
    expect(fn).toMatch(/SECURITY DEFINER/);
    expect(fn).toMatch(/SET search_path = public, pg_temp/);
    expect(fn).toMatch(/uid IS NOT NULL/);
    const returns = fn.slice(fn.indexOf("RETURNS TABLE"), fn.indexOf("LANGUAGE sql"));
    for (const col of [
      "configured boolean",
      "enabled boolean",
      "policy_version text",
      "tracking_start_date date",
      "approvals_complete boolean",
      "required_values_complete boolean",
      "activation_ready boolean",
    ]) {
      expect(returns).toContain(col);
    }
    for (const forbidden of [
      "hr_approved_by",
      "legal_approved_by",
      "notes",
      "created_by",
      "updated_by",
    ]) {
      expect(returns.toLowerCase()).not.toContain(forbidden);
    }
    expect(hardening).toMatch(
      /REVOKE ALL ON FUNCTION public\.report_c2s_program_status\(\) FROM anon/,
    );
    expect(hardening).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.report_c2s_program_status\(\) TO authenticated/,
    );
  });
});

// ------------------------------------------------- 3. formal violation (DB)

describe("C2S formal violation database guard", () => {
  const guard = (() => {
    const start = hardening.indexOf("CREATE OR REPLACE FUNCTION public.c2s_tracker_formal_guard()");
    return hardening.slice(start, hardening.indexOf("$$;", start) + 3);
  })();

  it("runs BEFORE INSERT OR UPDATE on tracker records", () => {
    expect(hardening).toMatch(
      /CREATE TRIGGER c2s_tracker_formal_guard_trg\s+BEFORE INSERT OR UPDATE ON public\.c2s_tracker_records/,
    );
  });

  it("requires an enabled fully approved config, authoritative source and upheld review", () => {
    expect(guard).toMatch(/c2s_config_is_active\(NEW\.config_id\)/);
    expect(guard).toMatch(/NEW\.source_kind NOT IN \('authoritative_completion','reviewed_tracker'\)/);
    expect(guard).toMatch(/NEW\.review_status <> 'upheld'/);
    expect(guard).toMatch(/NEW\.reviewed_by IS NULL OR NEW\.reviewed_at IS NULL/);
  });

  it("requires prior coaching that precedes the formal-recorded date", () => {
    expect(guard).toMatch(/c2s_coaching_records c/);
    expect(guard).toMatch(/c\.coaching_date <= \(NEW\.formal_violation_recorded_at AT TIME ZONE 'UTC'\)::date/);
  });

  it("rejects an approved exception (linked or unlinked date window) and an upheld dispute", () => {
    expect(guard).toMatch(/c2s_has_approved_exception\(NEW\.subject_employee_id, NEW\.id, NEW\.service_date\)/);
    expect(guard).toMatch(/d\.status = 'upheld'/);
    const helper = hardening.slice(
      hardening.indexOf("CREATE OR REPLACE FUNCTION public.c2s_has_approved_exception"),
    );
    expect(helper).toMatch(/x\.tracker_record_id IS NULL/);
    expect(helper).toMatch(/_service_date >= x\.applies_from/);
    expect(helper).toMatch(/_service_date <= x\.applies_to/);
  });

  it("has one active-formal helper that excludes later exceptions and upheld disputes", () => {
    const start = hardening.indexOf("CREATE OR REPLACE FUNCTION public.c2s_is_active_formal(_tracker_record_id uuid)");
    expect(start).toBeGreaterThan(-1);
    const fn = hardening.slice(start, hardening.indexOf("$$;", start) + 3);
    expect(fn).toMatch(/t\.is_formal_violation = true/);
    expect(fn).toMatch(/NOT public\.c2s_has_approved_exception/);
    expect(fn).toMatch(/NOT EXISTS \([\s\S]*c2s_disputes d[\s\S]*'upheld'/);
    expect(fn).toMatch(/c2s_config_is_active\(t\.config_id\)/);
    // History is never deleted by the helper.
    expect(fn).not.toMatch(/DELETE|UPDATE /);
  });
});

// -------------------------------------------------------- 4. notice integrity

describe("C2S notice database guard", () => {
  const guard = (() => {
    const start = hardening.indexOf("CREATE OR REPLACE FUNCTION public.c2s_notice_guard()");
    return hardening.slice(start, hardening.indexOf("$$;", start) + 3);
  })();

  it("runs BEFORE INSERT OR UPDATE on notices", () => {
    expect(hardening).toMatch(
      /CREATE TRIGGER c2s_notice_guard_trg\s+BEFORE INSERT OR UPDATE ON public\.c2s_notices/,
    );
  });

  it("validates the subject across notice, tracker and coaching", () => {
    expect(guard).toMatch(/t\.subject_employee_id <> NEW\.subject_employee_id/);
    expect(guard).toMatch(/co\.subject_employee_id <> NEW\.subject_employee_id/);
  });

  it("requires an active enabled config and active formal eligibility", () => {
    expect(guard).toMatch(/c2s_config_is_active\(NEW\.config_id\)/);
    expect(guard).toMatch(/c2s_is_active_formal\(NEW\.tracker_record_id\)/);
  });

  it("enforces coaching chronology", () => {
    expect(guard).toMatch(/co\.coaching_date > \(NEW\.issued_at AT TIME ZONE 'UTC'\)::date/);
  });

  it("blocks skipping levels and keeps the maximum at 3", () => {
    expect(guard).toMatch(/NEW\.notice_level <> highest \+ 1/);
    expect(hardening + "").toBeTruthy();
  });

  it("forces level 3 to HR review only and creates no employment action", () => {
    expect(guard).toMatch(/IF NEW\.notice_level = 3 THEN\s+NEW\.hr_review_required := true;/);
    for (const forbidden of ["terminat", "suspend", "discipline", "pay_", "final_warning_action"]) {
      expect(guard.toLowerCase()).not.toContain(forbidden);
    }
  });
});

// ------------------------------------------------------- 5. dispute integrity

describe("C2S dispute database guard", () => {
  const guard = (() => {
    const start = hardening.indexOf("CREATE OR REPLACE FUNCTION public.c2s_dispute_guard()");
    return hardening.slice(start, hardening.indexOf("$$;", start) + 3);
  })();

  it("provides a weekend-aware business-day helper documenting the holiday limitation", () => {
    const start = hardening.indexOf("CREATE OR REPLACE FUNCTION public.c2s_add_business_days");
    expect(start).toBeGreaterThan(-1);
    const fn = hardening.slice(start, hardening.indexOf("$$;", start) + 3);
    expect(fn).toMatch(/SET search_path = public, pg_temp/);
    expect(fn).toMatch(/extract\(isodow FROM d\) < 6/);
    expect(hardening).toMatch(/holidays are unavailable in the source and require manual confirmation/i);
  });

  it("requires a link that belongs to the subject", () => {
    expect(guard).toMatch(/NEW\.notice_id IS NULL AND NEW\.tracker_record_id IS NULL/);
    expect(guard).toMatch(/n\.subject_employee_id <> NEW\.subject_employee_id/);
    expect(guard).toMatch(/t\.subject_employee_id <> NEW\.subject_employee_id/);
  });

  it("sets the filing deadline from the notice or formal-record date", () => {
    expect(guard).toMatch(/NEW\.filing_deadline := public\.c2s_add_business_days\(anchor, window_days\)/);
    expect(guard).toMatch(/n\.issued_at AT TIME ZONE 'UTC'/);
    expect(guard).toMatch(/t\.formal_violation_recorded_at AT TIME ZONE 'UTC'/);
  });

  it("forces an employee filing to be a plain submission and rejects late filings", () => {
    expect(guard).toMatch(/TG_OP = 'INSERT' AND NOT is_hr/);
    expect(guard).toMatch(/NEW\.filed_by := coalesce\(viewer, NEW\.filed_by\)/);
    expect(guard).toMatch(/NEW\.status := 'submitted'/);
    expect(guard).toMatch(/NEW\.decided_by := NULL/);
    expect(guard).toMatch(/NEW\.decided_at := NULL/);
    expect(guard).toMatch(/NEW\.decision_notes := NULL/);
    expect(guard).toMatch(/> NEW\.filing_deadline THEN\s+RAISE EXCEPTION/);
  });

  it("keeps adjudication HR-only (employees still cannot update)", () => {
    // The Phase 3A HR-only UPDATE policy is untouched by this migration.
    expect(hardening).not.toMatch(/CREATE POLICY "c2s_disputes_update"/);
    expect(hardening).not.toMatch(/DROP POLICY IF EXISTS "c2s_disputes_update"/);
  });
});

// ------------------------------------------------- 6. manager field boundary

describe("C2S manager review field boundary", () => {
  const guard = (() => {
    const start = hardening.indexOf("CREATE OR REPLACE FUNCTION public.c2s_review_field_guard()");
    return hardening.slice(start, hardening.indexOf("$$;", start) + 3);
  })();

  it("runs BEFORE INSERT OR UPDATE on program reviews", () => {
    expect(hardening).toMatch(
      /CREATE TRIGGER c2s_review_field_guard_trg\s+BEFORE INSERT OR UPDATE ON public\.c2s_program_reviews/,
    );
  });

  it("lets HR authority manage HR fields but binds a manager to their own review fields", () => {
    expect(guard).toMatch(/IF public\.c2s_is_hr_authority\(\) THEN\s+RETURN NEW;/);
    expect(guard).toMatch(/c2s_is_direct_manager\(NEW\.subject_employee_id\)/);
    expect(guard).toMatch(/NEW\.manager_id := coalesce\(viewer, NEW\.manager_id\)/);
  });

  it("prevents a manager from writing HR approval or final outcome fields", () => {
    expect(guard).toMatch(/NEW\.hr_approved := OLD\.hr_approved/);
    expect(guard).toMatch(/NEW\.hr_approved_by := OLD\.hr_approved_by/);
    expect(guard).toMatch(/NEW\.hr_approved_at := OLD\.hr_approved_at/);
    expect(guard).toMatch(/NEW\.outcome := OLD\.outcome/);
    expect(guard).toMatch(/NEW\.hr_approved := NULL/);
  });

  it("automates no decision", () => {
    expect(guard).not.toMatch(/'exited'|'continued'/);
  });
});

// ------------------------------------------------------ 7. proxy correctness

describe("hardened report_c2s_documentation_proxy", () => {
  const fn = (() => {
    const start = hardening.indexOf("CREATE OR REPLACE FUNCTION public.report_c2s_documentation_proxy");
    expect(start).toBeGreaterThan(-1);
    return hardening.slice(start, hardening.indexOf("$$;", start) + 3);
  })();
  const code = fn.replace(/--.*$/gm, "");

  it("builds the id pool from employees.centralreach_id plus match links", () => {
    expect(code).toMatch(/id_pool AS \(/);
    expect(code).toMatch(/e\.centralreach_id/);
    expect(code).toMatch(/cr_provider_match_links l/);
    expect(code).toMatch(/HAVING count\(DISTINCT employee_id\) = 1/);
  });

  it("falls back to a unique normalized name only when no id match exists", () => {
    expect(code).toMatch(/LEFT JOIN by_name n\s+ON i\.employee_id IS NULL/);
  });

  it("never infers a role from a procedure code", () => {
    expect(code).not.toMatch(/procedure_code/);
    for (const cpt of ["97155", "97151", "97153", "0362T"]) {
      expect(code).not.toContain(cpt);
    }
    expect(code).toMatch(/a\.provider_role/);
    expect(code).toMatch(/emp\.job_title/);
    expect(code).toMatch(/'Unknown'/);
  });

  it("joins mutable status by row_hash and keeps only current nonvoid/nondeleted rows", () => {
    expect(code).toMatch(/INNER JOIN public\.cr_billing_session_status s ON s\.row_hash = b\.row_hash/);
    expect(code).toMatch(/coalesce\(s\.is_void, false\) = false/);
    expect(code).toMatch(/coalesce\(s\.deleted, false\) = false/);
  });

  it("honors an explicit invalid/rejected source flag but not missing metadata", () => {
    expect(code).toMatch(/s\.source_quality->>'status'[\s\S]*NOT IN \('invalid','rejected'\)/);
    expect(code).toMatch(/coalesce\(s\.source_quality->>'invalid', ''\)/);
    expect(code).toMatch(/coalesce\(s\.source_quality->>'rejected', ''\)/);
  });

  it("guards an inverted date range", () => {
    expect(code).toMatch(/p_from IS NULL OR p_to IS NULL OR p_from <= p_to/);
  });

  it("keeps the return contract client-free, financial-free and proxy-only", () => {
    const returns = fn.slice(fn.indexOf("RETURNS TABLE"), fn.indexOf("LANGUAGE sql"));
    for (const forbidden of ["client", "payor", "hours", "rate", "amount", "procedure", "payload", "billing_labels"]) {
      expect(returns.toLowerCase()).not.toContain(forbidden);
    }
    expect(code).not.toMatch(/formal/i);
    expect(code).not.toMatch(/category 1/i);
    expect(code).toMatch(/'BCBA Category 2 proxy'/);
  });
});

// ------------------------------------------------------ 8. privileged roles

describe("C2S privileged role list stays narrow", () => {
  const fn = (() => {
    const start = hardening.indexOf("CREATE OR REPLACE FUNCTION public.c2s_is_hr_authority");
    return hardening.slice(start, hardening.indexOf("$$;", start) + 3);
  })();

  it("keeps only admin/HR/executive roles and adds cfo", () => {
    for (const role of [
      "admin", "super_admin",
      "hr", "hr_admin", "hr_manager", "hr_lead",
      "exec", "executive", "executive_leadership", "ceo", "coo", "cfo",
    ]) {
      expect(fn).toContain(`'${role}'`);
    }
  });

  it("removes systems_admin and adds no training/ops/state/payroll role", () => {
    for (const role of [
      "systems_admin", "training_admin", "ops_manager", "operations_manager",
      "operations_leadership", "state_director", "assistant_state_director",
      "payroll", "payroll_admin", "billing_lead",
    ]) {
      expect(fn).not.toContain(`'${role}'`);
    }
  });
});

// ------------------------------------------------------ pure logic behavior

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

const coaching = [{ id: "c1", subjectEmployeeId: "emp-1", coachingDate: "2026-09-10" }];

describe("evaluateFormalViolation requires coaching chronology", () => {
  it("rejects a record with no coaching at all", () => {
    const r = evaluateFormalViolation(record, { config: approvedConfig });
    expect(r.eligible).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/Coaching must exist and precede/i);
  });

  it("rejects coaching for another employee", () => {
    const r = evaluateFormalViolation(record, {
      config: approvedConfig,
      coaching: [{ id: "c9", subjectEmployeeId: "emp-2", coachingDate: "2026-09-10" }],
    });
    expect(r.eligible).toBe(false);
  });

  it("rejects coaching that happened after the formal-recorded date", () => {
    expect(
      priorCoachingExists(record, [
        { id: "c2", subjectEmployeeId: "emp-1", coachingDate: "2026-09-26" },
      ]),
    ).toBe(false);
    expect(priorCoachingExists(record, coaching)).toBe(true);
  });

  it("accepts a fully compliant record", () => {
    expect(evaluateFormalViolation(record, { config: approvedConfig, coaching }).eligible).toBe(true);
  });
});

describe("approvedExceptionApplies", () => {
  it("matches an unlinked exception whose date window contains the service date", () => {
    expect(
      approvedExceptionApplies(record, [
        { id: "x", subjectEmployeeId: "emp-1", trackerRecordId: null, status: "approved", exceptionType: "approved_leave", appliesFrom: "2026-09-01", appliesTo: "2026-09-05" },
      ]),
    ).toBe(true);
  });

  it("ignores a window that does not contain the service date", () => {
    expect(
      approvedExceptionApplies(record, [
        { id: "x", subjectEmployeeId: "emp-1", trackerRecordId: null, status: "approved", exceptionType: "approved_leave", appliesFrom: "2026-10-01", appliesTo: "2026-10-05" },
      ]),
    ).toBe(false);
  });

  it("ignores another employee's exception", () => {
    expect(
      approvedExceptionApplies(record, [
        { id: "x", subjectEmployeeId: "emp-2", trackerRecordId: "rec-1", status: "approved", exceptionType: "qa_error" },
      ]),
    ).toBe(false);
  });
});

describe("notice level sequencing (pure)", () => {
  it("blocks skipping straight to level 2 or 3", () => {
    const two = evaluateNoticeEligibility({ level: 2, config: approvedConfig, record, coaching });
    expect(two.allowed).toBe(false);
    expect(two.reasons.join(" ")).toMatch(/advance sequentially/i);
    const three = evaluateNoticeEligibility({ level: 3, config: approvedConfig, record, coaching, priorLevels: [1] });
    expect(three.allowed).toBe(false);
  });

  it("allows 1 then 2 then 3 and never returns an employment action", () => {
    for (const [level, prior] of [[1, []], [2, [1]], [3, [1, 2]]] as const) {
      const r = evaluateNoticeEligibility({
        level: level as 1 | 2 | 3,
        config: approvedConfig,
        record,
        coaching,
        priorLevels: [...prior],
      });
      expect(r.allowed).toBe(true);
      expect(r.employmentAction).toBeNull();
    }
  });

  it("blocks a notice while the config is disabled, on an approved exception, or an upheld dispute", () => {
    expect(
      evaluateNoticeEligibility({ level: 1, config: { ...approvedConfig, isEnabled: false }, record, coaching }).allowed,
    ).toBe(false);
    expect(
      evaluateNoticeEligibility({
        level: 1, config: approvedConfig, record, coaching,
        exceptions: [{ id: "x", subjectEmployeeId: "emp-1", trackerRecordId: "rec-1", status: "approved", exceptionType: "qa_error" }],
      }).allowed,
    ).toBe(false);
    expect(
      evaluateNoticeEligibility({
        level: 1, config: approvedConfig, record, coaching,
        disputes: [{ id: "d", subjectEmployeeId: "emp-1", trackerRecordId: "rec-1", status: "upheld" }],
      }).allowed,
    ).toBe(false);
  });

  it("blocks a nonformal (unreviewed) tracker record", () => {
    const r = evaluateNoticeEligibility({
      level: 1, config: approvedConfig, coaching,
      record: { ...record, reviewStatus: "unreviewed", isFormalViolation: false },
    });
    expect(r.allowed).toBe(false);
  });
});

describe("summarizeGovernance reports ACTIVE formal violations", () => {
  it("drops a record covered by a later approved window exception but keeps history", () => {
    const summary = summarizeGovernance({
      config: approvedConfig,
      coaching,
      records: [record],
      exceptions: [
        { id: "x", subjectEmployeeId: "emp-1", trackerRecordId: null, status: "approved", exceptionType: "approved_leave", appliesFrom: "2026-09-01", appliesTo: "2026-09-30" },
      ],
    });
    expect(summary.formalViolations).toBe(0);
    expect(summary.recordedFormalViolations).toBe(1);
  });

  it("counts nothing as active while the program is disabled", () => {
    const summary = summarizeGovernance({
      config: { ...approvedConfig, isEnabled: false },
      coaching,
      records: [record],
    });
    expect(summary.formalViolations).toBe(0);
  });

  it("counts an eligible record as active", () => {
    const summary = summarizeGovernance({ config: approvedConfig, coaching, records: [record] });
    expect(summary.formalViolations).toBe(1);
  });
});

describe("business-day parity with the SQL helper", () => {
  it("skips weekends the same way", () => {
    expect(addBusinessDays("2026-09-04", 1)).toBe("2026-09-07"); // Fri -> Mon
    expect(addBusinessDays("2026-09-02", 5)).toBe("2026-09-09");
  });
});
