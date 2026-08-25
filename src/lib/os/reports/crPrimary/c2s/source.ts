/**
 * Commit to Submit (C2S) Compliance — data access layer (Phase 3B).
 *
 * TRUSTED SOURCES ONLY:
 * - `report_c2s_documentation_proxy(p_from, p_to)` — global, client-free,
 *   de-identified DOS→documentation proxy rows.
 * - `report_c2s_program_status()` — staff-safe activation status (never exposes
 *   approver identities, notes, or configuration internals).
 * - The six RLS-protected operational tables for sensitive records. Every read
 *   and every write runs through the caller's own Supabase session, so RLS is
 *   the authority. There is no service-role bypass anywhere in this module.
 *
 * Nothing here selects or returns client, payor, service, location, hours,
 * rate, dollar, contact, raw-label, raw-payload, compensation, or
 * employment-action fields. A 0-row RLS result is normal and is never reported
 * as a global data error.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  isConfigActive,
  normalizeProxyRow,
  type C2sCoachingRecord,
  type C2sDisputeRecord,
  type C2sExceptionRecord,
  type C2sProgramConfig,
  type C2sProxyRow,
  type C2sTrackerRecord,
} from "@/lib/os/reports/crPrimary/metrics/commitToSubmit";

/** Staff-safe activation status from `report_c2s_program_status()`. */
export interface C2sProgramStatus {
  configured: boolean;
  enabled: boolean;
  policyVersion: string | null;
  trackingStartDate: string | null;
  approvalsComplete: boolean;
  requiredValuesComplete: boolean;
  activationReady: boolean;
}

/** A notice as visible to the caller under RLS. */
export interface C2sNoticeRecord {
  id: string;
  subjectEmployeeId: string;
  trackerRecordId: string | null;
  configId: string | null;
  noticeLevel: number;
  priorCoachingId: string | null;
  issuedAt: string | null;
  acknowledgedAt: string | null;
  hrReviewRequired: boolean;
}

/** A program review as visible to the caller under RLS. */
export interface C2sProgramReviewRecord {
  id: string;
  subjectEmployeeId: string;
  reviewKind: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  daysOnTime: number | null;
  managerRecommendation: string | null;
  managerRecommendedAt: string | null;
  hrApproved: boolean | null;
  hrApprovedAt: string | null;
  outcome: string | null;
}

/** Dispute row extended with the fields the UI shows (status + deadline). */
export interface C2sDisputeRow extends C2sDisputeRecord {
  noticeId: string | null;
  filedAt: string | null;
  filingDeadline: string | null;
  decidedAt: string | null;
}

/** Exception row extended with the window fields the UI shows. */
export interface C2sExceptionRow extends C2sExceptionRecord {
  appliesFrom: string | null;
  appliesTo: string | null;
  approvedAt: string | null;
}

export interface C2sReadResult<T> {
  rows: T[];
  /** Populated only on a real transport/permission failure, never on 0 rows. */
  error: string | null;
}

/**
 * The exact role set encoded in the database helper `c2s_is_hr_authority`.
 * Used only to decide whether to *offer* an HR control; the database remains
 * the authority for every mutation.
 */
export const C2S_HR_AUTHORITY_ROLES = [
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
] as const;

const text = (v: unknown): string | null => {
  const raw = v === null || v === undefined ? "" : String(v).trim();
  return raw === "" ? null : raw;
};
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** `YYYY-MM-DD` calendar-day guard: an invalid window must never be queried. */
export function isValidDateWindow(from: string, to: string): boolean {
  const ok = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
  if (!ok(from) || !ok(to)) return false;
  return from <= to;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase as any;

async function readC2sTable<T>(
  table: string,
  columns: string,
  map: (row: Record<string, unknown>) => T,
): Promise<C2sReadResult<T>> {
  try {
    const { data, error } = await db()
      .from(table)
      .select(columns)
      .order("created_at", { ascending: false })
      .limit(1000);
    // A permission/RLS restriction yields zero rows, not an error. Only a real
    // transport error is surfaced, and even then only for this table.
    if (error) return { rows: [], error: error.message };
    return { rows: ((data ?? []) as Record<string, unknown>[]).map(map), error: null };
  } catch (err) {
    return { rows: [], error: err instanceof Error ? err.message : `Failed to read ${table}` };
  }
}

/** Staff-safe program status. A missing row means "not configured". */
export async function fetchC2sProgramStatus(): Promise<{
  status: C2sProgramStatus;
  error: string | null;
}> {
  const fallback: C2sProgramStatus = {
    configured: false,
    enabled: false,
    policyVersion: null,
    trackingStartDate: null,
    approvalsComplete: false,
    requiredValuesComplete: false,
    activationReady: false,
  };
  try {
    const { data, error } = await db().rpc("report_c2s_program_status");
    if (error) return { status: fallback, error: error.message };
    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
    if (!row) return { status: fallback, error: null };
    return {
      status: {
        configured: Boolean(row.configured),
        enabled: Boolean(row.enabled),
        policyVersion: text(row.policy_version),
        trackingStartDate: text(row.tracking_start_date),
        approvalsComplete: Boolean(row.approvals_complete),
        requiredValuesComplete: Boolean(row.required_values_complete),
        activationReady: Boolean(row.activation_ready),
      },
      error: null,
    };
  } catch (err) {
    return {
      status: fallback,
      error: err instanceof Error ? err.message : "Failed to read program status",
    };
  }
}

/** Global client-free proxy rows for the window. Always normalized here. */
export async function fetchC2sProxyRows(
  from: string,
  to: string,
): Promise<C2sReadResult<C2sProxyRow>> {
  if (!isValidDateWindow(from, to)) {
    return { rows: [], error: null };
  }
  try {
    const { data, error } = await db().rpc("report_c2s_documentation_proxy", {
      p_from: from,
      p_to: to,
    });
    if (error) return { rows: [], error: error.message };
    return {
      rows: ((data ?? []) as Record<string, unknown>[]).map(normalizeProxyRow),
      error: null,
    };
  } catch (err) {
    return {
      rows: [],
      error: err instanceof Error ? err.message : "Failed to read documentation proxy rows",
    };
  }
}

export function fetchC2sTrackerRecords(): Promise<C2sReadResult<C2sTrackerRecord>> {
  return readC2sTable<C2sTrackerRecord>(
    "c2s_tracker_records",
    "id,subject_employee_id,role_group,state,service_date,documentation_due_date,authoritative_completed_at,lag_days,source_kind,category,review_status,reviewed_at,is_formal_violation,category1_criteria_reference,formal_violation_recorded_at,config_id,created_at",
    (r) => ({
      id: String(r.id),
      subjectEmployeeId: String(r.subject_employee_id),
      roleGroup: (text(r.role_group) ?? "unknown").toLowerCase() as C2sTrackerRecord["roleGroup"],
      serviceDate: text(r.service_date),
      authoritativeCompletedAt: text(r.authoritative_completed_at),
      lagDays: num(r.lag_days),
      sourceKind: (text(r.source_kind) ?? "reviewed_tracker") as C2sTrackerRecord["sourceKind"],
      category: (text(r.category) ?? "unclassified") as C2sTrackerRecord["category"],
      reviewStatus: (text(r.review_status) ?? "unreviewed") as C2sTrackerRecord["reviewStatus"],
      isFormalViolation: Boolean(r.is_formal_violation),
      category1CriteriaReference: text(r.category1_criteria_reference),
      formalViolationRecordedAt: text(r.formal_violation_recorded_at),
    }),
  );
}

export function fetchC2sCoachingRecords(): Promise<
  C2sReadResult<C2sCoachingRecord & { topic: string | null; summary: string | null }>
> {
  return readC2sTable(
    "c2s_coaching_records",
    "id,subject_employee_id,coaching_date,topic,summary,acknowledged_at,created_at",
    (r) => ({
      id: String(r.id),
      subjectEmployeeId: String(r.subject_employee_id),
      coachingDate: text(r.coaching_date),
      topic: text(r.topic),
      summary: text(r.summary),
    }),
  );
}

export function fetchC2sNotices(): Promise<C2sReadResult<C2sNoticeRecord>> {
  return readC2sTable<C2sNoticeRecord>(
    "c2s_notices",
    "id,subject_employee_id,tracker_record_id,config_id,notice_level,prior_coaching_id,issued_at,acknowledged_at,hr_review_required,created_at",
    (r) => ({
      id: String(r.id),
      subjectEmployeeId: String(r.subject_employee_id),
      trackerRecordId: text(r.tracker_record_id),
      configId: text(r.config_id),
      noticeLevel: num(r.notice_level) ?? 1,
      priorCoachingId: text(r.prior_coaching_id),
      issuedAt: text(r.issued_at),
      acknowledgedAt: text(r.acknowledged_at),
      hrReviewRequired: Boolean(r.hr_review_required),
    }),
  );
}

export function fetchC2sDisputes(): Promise<C2sReadResult<C2sDisputeRow>> {
  return readC2sTable<C2sDisputeRow>(
    "c2s_disputes",
    "id,subject_employee_id,tracker_record_id,notice_id,filed_at,filing_deadline,status,decided_at,created_at",
    (r) => ({
      id: String(r.id),
      subjectEmployeeId: String(r.subject_employee_id),
      trackerRecordId: text(r.tracker_record_id),
      noticeId: text(r.notice_id),
      status: (text(r.status) ?? "submitted") as C2sDisputeRow["status"],
      filedAt: text(r.filed_at),
      filingDeadline: text(r.filing_deadline),
      decidedAt: text(r.decided_at),
    }),
  );
}

export function fetchC2sExceptions(): Promise<C2sReadResult<C2sExceptionRow>> {
  return readC2sTable<C2sExceptionRow>(
    "c2s_exceptions",
    "id,subject_employee_id,tracker_record_id,exception_type,status,applies_from,applies_to,approved_at,created_at",
    (r) => ({
      id: String(r.id),
      subjectEmployeeId: String(r.subject_employee_id),
      trackerRecordId: text(r.tracker_record_id),
      exceptionType: text(r.exception_type) ?? "unspecified",
      status: (text(r.status) ?? "requested") as C2sExceptionRow["status"],
      appliesFrom: text(r.applies_from),
      appliesTo: text(r.applies_to),
      approvedAt: text(r.approved_at),
    }),
  );
}

export function fetchC2sProgramReviews(): Promise<C2sReadResult<C2sProgramReviewRecord>> {
  return readC2sTable<C2sProgramReviewRecord>(
    "c2s_program_reviews",
    "id,subject_employee_id,review_kind,window_start,window_end,days_on_time,manager_recommendation,manager_recommended_at,hr_approved,hr_approved_at,outcome,created_at",
    (r) => ({
      id: String(r.id),
      subjectEmployeeId: String(r.subject_employee_id),
      reviewKind: text(r.review_kind),
      windowStart: text(r.window_start),
      windowEnd: text(r.window_end),
      daysOnTime: num(r.days_on_time),
      managerRecommendation: text(r.manager_recommendation),
      managerRecommendedAt: text(r.manager_recommended_at),
      hrApproved: r.hr_approved === null || r.hr_approved === undefined ? null : Boolean(r.hr_approved),
      hrApprovedAt: text(r.hr_approved_at),
      outcome: text(r.outcome),
    }),
  );
}

/**
 * Best-effort display names for subject employees, read through normal RLS.
 * An unreadable or absent employee falls back to "Employee" — never a leak and
 * never a page failure.
 */
export const C2S_EMPLOYEE_FALLBACK_NAME = "Employee";

export async function fetchC2sEmployeeNames(
  ids: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  try {
    const { data, error } = await db()
      .from("employees")
      .select("id,first_name,last_name")
      .in("id", unique.slice(0, 500));
    if (error) return {};
    const out: Record<string, string> = {};
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      const name = [text(row.first_name), text(row.last_name)].filter(Boolean).join(" ").trim();
      if (row.id) out[String(row.id)] = name || C2S_EMPLOYEE_FALLBACK_NAME;
    }
    return out;
  } catch {
    return {};
  }
}

/** The signed-in user's own employee id, when one is readable under RLS. */
export async function fetchViewerEmployeeId(): Promise<string | null> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return null;
    const { data, error } = await db()
      .from("employees")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
    if (error) return null;
    const row = (data ?? [])[0] as Record<string, unknown> | undefined;
    return row?.id ? String(row.id) : null;
  } catch {
    return null;
  }
}

/**
 * Does the signed-in user hold one of the roles encoded in the database helper
 * `c2s_is_hr_authority`? Read from `user_roles` under normal RLS.
 */
export async function fetchIsC2sHrAuthority(): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return false;
    const { data, error } = await db().from("user_roles").select("role").eq("user_id", userId);
    if (error) return false;
    const roles = ((data ?? []) as Record<string, unknown>[]).map((r) => String(r.role));
    return roles.some((r) => (C2S_HR_AUTHORITY_ROLES as readonly string[]).includes(r));
  } catch {
    return false;
  }
}

/** Does the database consider this viewer the subject's direct manager? */
export async function fetchIsDirectManager(subjectEmployeeId: string): Promise<boolean> {
  try {
    const { data, error } = await db().rpc("c2s_is_direct_manager", {
      _subject_employee_id: subjectEmployeeId,
    });
    if (error) return false;
    return Boolean(Array.isArray(data) ? data[0] : data);
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ mutations

export interface C2sMutationResult {
  ok: boolean;
  error: string | null;
}

const mutation = async (run: () => Promise<{ error: { message: string } | null }>): Promise<C2sMutationResult> => {
  try {
    const { error } = await run();
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "The change could not be saved." };
  }
};

/**
 * Employee dispute filing. The client deliberately sends ONLY the link and the
 * statement: `filed_by`, `filed_at`, `status`, the decision fields, and the
 * filing deadline are all supplied and validated by the database guard.
 */
export const C2S_DISPUTE_CLIENT_FIELDS = [
  "subject_employee_id",
  "tracker_record_id",
  "notice_id",
  "statement",
] as const;

export function fileC2sDispute(input: {
  subjectEmployeeId: string;
  trackerRecordId: string | null;
  noticeId: string | null;
  statement: string;
}): Promise<C2sMutationResult> {
  return mutation(() =>
    db()
      .from("c2s_disputes")
      .insert({
        subject_employee_id: input.subjectEmployeeId,
        tracker_record_id: input.trackerRecordId,
        notice_id: input.noticeId,
        statement: input.statement.trim(),
      }),
  );
}

/** Direct-manager (or HR) coaching record. Coaching precedes any formal step. */
export function recordC2sCoaching(input: {
  subjectEmployeeId: string;
  coachingDate: string;
  topic: string;
  summary: string;
}): Promise<C2sMutationResult> {
  return mutation(() =>
    db().from("c2s_coaching_records").insert({
      subject_employee_id: input.subjectEmployeeId,
      coaching_date: input.coachingDate,
      topic: input.topic.trim(),
      summary: input.summary.trim(),
    }),
  );
}

/** Direct-manager (or HR) program review. HR-owned fields are never sent. */
export function recordC2sProgramReview(input: {
  subjectEmployeeId: string;
  reviewKind: string;
  windowStart: string;
  windowEnd: string;
  managerRecommendation: string;
}): Promise<C2sMutationResult> {
  return mutation(() =>
    db().from("c2s_program_reviews").insert({
      subject_employee_id: input.subjectEmployeeId,
      review_kind: input.reviewKind,
      window_start: input.windowStart,
      window_end: input.windowEnd,
      manager_recommendation: input.managerRecommendation.trim(),
    }),
  );
}

/** HR review disposition on an existing tracker record. */
export function reviewC2sTrackerRecord(input: {
  id: string;
  reviewStatus: "under_review" | "upheld" | "not_upheld" | "withdrawn";
  reviewNotes: string;
}): Promise<C2sMutationResult> {
  return mutation(() =>
    db()
      .from("c2s_tracker_records")
      .update({
        review_status: input.reviewStatus,
        review_notes: input.reviewNotes.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", input.id),
  );
}

/** HR exception linked to a specific tracker record (never a blanket window). */
export function recordC2sException(input: {
  subjectEmployeeId: string;
  trackerRecordId: string;
  exceptionType: string;
  status: "requested" | "approved";
  reason: string;
}): Promise<C2sMutationResult> {
  return mutation(() =>
    db().from("c2s_exceptions").insert({
      subject_employee_id: input.subjectEmployeeId,
      tracker_record_id: input.trackerRecordId,
      exception_type: input.exceptionType,
      status: input.status,
      reason: input.reason.trim(),
    }),
  );
}

/**
 * HR notice issuance. Level 3 sets an HR review requirement only — there is no
 * employment-action field anywhere in this payload or in this module.
 */
export function issueC2sNotice(input: {
  subjectEmployeeId: string;
  trackerRecordId: string;
  configId: string;
  noticeLevel: 1 | 2 | 3;
  priorCoachingId: string;
}): Promise<C2sMutationResult> {
  return mutation(() =>
    db().from("c2s_notices").insert({
      subject_employee_id: input.subjectEmployeeId,
      tracker_record_id: input.trackerRecordId,
      config_id: input.configId,
      notice_level: input.noticeLevel,
      prior_coaching_id: input.priorCoachingId,
      hr_review_required: input.noticeLevel === 3,
    }),
  );
}

/** HR dispute adjudication. */
export function adjudicateC2sDispute(input: {
  id: string;
  status: "under_review" | "upheld" | "denied";
  decisionNotes: string;
}): Promise<C2sMutationResult> {
  return mutation(() =>
    db()
      .from("c2s_disputes")
      .update({
        status: input.status,
        decision_notes: input.decisionNotes.trim() || null,
        decided_at: input.status === "under_review" ? null : new Date().toISOString(),
      })
      .eq("id", input.id),
  );
}

// ------------------------------------------------- configuration for gating

/**
 * The HR-readable active configuration. Staff without HR authority get nothing
 * back (RLS), which correctly leaves every formal control unavailable to them.
 * Returns null when there is no enabled, fully valued configuration.
 */
export async function fetchC2sActiveConfig(): Promise<C2sProgramConfig | null> {
  try {
    const { data, error } = await db()
      .from("c2s_program_config")
      .select(
        "id,policy_version,is_enabled,hr_approved_at,legal_approved_at,tracking_start_date,prior_history_counts,new_hire_grace_days,category1_qa_criteria,on_time_max_lag_days",
      )
      .eq("is_enabled", true)
      .limit(1);
    if (error) return null;
    const row = (data ?? [])[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    const config: C2sProgramConfig = {
      id: String(row.id),
      policyVersion: text(row.policy_version),
      isEnabled: Boolean(row.is_enabled),
      hrApprovedAt: text(row.hr_approved_at),
      legalApprovedAt: text(row.legal_approved_at),
      trackingStartDate: text(row.tracking_start_date),
      priorHistoryCounts:
        row.prior_history_counts === null || row.prior_history_counts === undefined
          ? null
          : Boolean(row.prior_history_counts),
      newHireGraceDays: num(row.new_hire_grace_days),
      category1QaCriteria: text(row.category1_qa_criteria),
      onTimeMaxLagDays: num(row.on_time_max_lag_days),
    };
    return isConfigActive(config) ? config : null;
  } catch {
    return null;
  }
}
