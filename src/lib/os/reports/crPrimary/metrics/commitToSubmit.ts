/**
 * Commit to Submit (C2S) Compliance — pure metrics layer (Phase 3A foundation).
 *
 * POLICY TRUTH encoded here:
 * - The program is NOT activated. A disabled or incompletely approved
 *   configuration can never authorize a notice or a formal violation.
 * - The exact 7-day boundary is ON TIME. Strictly more than 7 days is late.
 * - A DOS-to-billing-creation lag is a PROXY ONLY. It can never become a
 *   formal violation, and it can never assign BCBA Category 1.
 * - BCBA Category 1 requires an authoritative completion source plus reviewed
 *   substantive QA criteria; it is never inferred from billing lag.
 * - Coaching precedes any formal step. Notices require an active approved
 *   configuration, prior coaching, and an upheld formal violation with no
 *   approved exception and no upheld dispute.
 * - A third notice creates an HR review requirement only. Nothing in this
 *   module automates pay, discipline, termination, or any employment action.
 *
 * No client, payor, service, hours, rate, raw label, raw payload, contact,
 * compensation, or employment-action fields appear in any output type.
 */

export const C2S_ON_TIME_MAX_LAG_DAYS = 7;
export const C2S_DISPUTE_WINDOW_BUSINESS_DAYS = 5;

/**
 * Known source limitation: organization holidays are NOT available in any
 * source system, so the dispute window helper is weekend-aware only. Holidays
 * must be reconciled manually by HR.
 */
export const C2S_DISPUTE_HOLIDAY_LIMITATION =
  "Business-day math excludes weekends only. Organization holidays are not available in the source, so a deadline that falls near a holiday must be confirmed manually.";

export type C2sRoleGroup = "RBT" | "BCBA" | "Unknown";
export type C2sTimelinessStatus = "on_time" | "late" | "missing" | "invalid";
export type C2sProxyCategory =
  | "RBT proxy"
  | "BCBA Category 2 proxy"
  | "unclassified";
export type C2sFormalCategory =
  | "rbt_documentation"
  | "bcba_category_1"
  | "bcba_category_2"
  | "unclassified";

/** One de-identified proxy row as returned by report_c2s_documentation_proxy. */
export interface C2sProxyRow {
  employeeId: string | null;
  providerDisplayName: string | null;
  roleGroup: C2sRoleGroup;
  state: string | null;
  dateOfService: string | null;
  documentationDate: string | null;
  lagDays: number | null;
  timelinessStatus: C2sTimelinessStatus;
  proxyCategory: C2sProxyCategory;
  usedAuthoritativeCompletion: boolean;
  provenance: string | null;
  sourceQuality: string | null;
  lastSeenAt: string | null;
}

export interface C2sProgramConfig {
  id: string;
  policyVersion: string | null;
  isEnabled: boolean;
  hrApprovedAt: string | null;
  legalApprovedAt: string | null;
  trackingStartDate: string | null;
  priorHistoryCounts: boolean | null;
  newHireGraceDays: number | null;
  category1QaCriteria: string | null;
  onTimeMaxLagDays?: number | null;
}

export interface C2sTrackerRecord {
  id: string;
  subjectEmployeeId: string;
  roleGroup: "rbt" | "bcba" | "unknown";
  serviceDate: string | null;
  authoritativeCompletedAt: string | null;
  lagDays: number | null;
  sourceKind: "authoritative_completion" | "reviewed_tracker";
  category: C2sFormalCategory;
  reviewStatus:
    | "unreviewed"
    | "under_review"
    | "upheld"
    | "not_upheld"
    | "withdrawn";
  isFormalViolation: boolean;
  category1CriteriaReference?: string | null;
}

export interface C2sExceptionRecord {
  id: string;
  subjectEmployeeId: string;
  trackerRecordId: string | null;
  status: "requested" | "approved" | "denied" | "withdrawn";
  exceptionType: string;
}

export interface C2sDisputeRecord {
  id: string;
  subjectEmployeeId: string;
  trackerRecordId: string | null;
  status: "submitted" | "under_review" | "upheld" | "denied" | "withdrawn";
}

export interface C2sCoachingRecord {
  id: string;
  subjectEmployeeId: string;
  coachingDate: string | null;
}

// ---------------------------------------------------------------- timeliness

/** Missing stays missing (never zero). Negative lag is invalid, not on time. */
export function classifyLag(lagDays: number | null | undefined): C2sTimelinessStatus {
  if (lagDays === null || lagDays === undefined || !Number.isFinite(lagDays)) {
    return "missing";
  }
  if (lagDays < 0) return "invalid";
  return lagDays > C2S_ON_TIME_MAX_LAG_DAYS ? "late" : "on_time";
}

export function proxyCategoryForRole(role: C2sRoleGroup): C2sProxyCategory {
  if (role === "RBT") return "RBT proxy";
  if (role === "BCBA") return "BCBA Category 2 proxy";
  return "unclassified";
}

function normalizeRole(value: unknown): C2sRoleGroup {
  const raw = String(value ?? "").trim().toUpperCase();
  if (raw === "RBT") return "RBT";
  if (raw === "BCBA") return "BCBA";
  return "Unknown";
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function textOrNull(value: unknown): string | null {
  const raw = value === null || value === undefined ? "" : String(value).trim();
  return raw === "" ? null : raw;
}

/**
 * Normalize a raw RPC row. Timeliness and proxy category are always recomputed
 * from the rule here so the application never trusts a stale/derived value.
 */
export function normalizeProxyRow(raw: Record<string, unknown>): C2sProxyRow {
  const roleGroup = normalizeRole(raw.role_group ?? raw.roleGroup);
  const lagDays = numberOrNull(raw.lag_days ?? raw.lagDays);
  return {
    employeeId: textOrNull(raw.employee_id ?? raw.employeeId),
    providerDisplayName: textOrNull(
      raw.provider_display_name ?? raw.providerDisplayName,
    ),
    roleGroup,
    state: textOrNull(raw.state),
    dateOfService: textOrNull(raw.date_of_service ?? raw.dateOfService),
    documentationDate: textOrNull(raw.documentation_date ?? raw.documentationDate),
    lagDays,
    timelinessStatus: classifyLag(lagDays),
    proxyCategory: proxyCategoryForRole(roleGroup),
    usedAuthoritativeCompletion: Boolean(
      raw.used_authoritative_completion ?? raw.usedAuthoritativeCompletion,
    ),
    provenance: textOrNull(raw.provenance),
    sourceQuality: textOrNull(raw.source_quality ?? raw.sourceQuality),
    lastSeenAt: textOrNull(raw.last_seen_at ?? raw.lastSeenAt),
  };
}

// ---------------------------------------------------------------- aggregates

export interface C2sStatusCounts {
  total: number;
  onTime: number;
  late: number;
  missing: number;
  invalid: number;
}

export interface C2sBreakdownRow extends C2sStatusCounts {
  key: string;
  /** Late share of rows with a usable lag only. Null when none are comparable. */
  latePercent: number | null;
  comparable: number;
}

export interface C2sProviderQueueRow extends C2sStatusCounts {
  employeeId: string | null;
  providerDisplayName: string | null;
  roleGroup: C2sRoleGroup;
  state: string | null;
  proxyCategory: C2sProxyCategory;
  comparable: number;
  latePercent: number | null;
  maxLagDays: number | null;
  authoritativeRows: number;
  proxyRows: number;
  unmapped: boolean;
}

export interface C2sProxySummary extends C2sStatusCounts {
  comparable: number;
  latePercent: number | null;
  byState: C2sBreakdownRow[];
  byRoleGroup: C2sBreakdownRow[];
  byProxyCategory: C2sBreakdownRow[];
  byMonth: C2sBreakdownRow[];
  authoritativeRows: number;
  proxyRows: number;
  unmappedRows: number;
  /** Proxy output can never contain formal violations. Always zero. */
  formalViolationsFromProxy: 0;
}

function emptyCounts(): C2sStatusCounts {
  return { total: 0, onTime: 0, late: 0, missing: 0, invalid: 0 };
}

function tally(counts: C2sStatusCounts, status: C2sTimelinessStatus): void {
  counts.total += 1;
  if (status === "on_time") counts.onTime += 1;
  else if (status === "late") counts.late += 1;
  else if (status === "missing") counts.missing += 1;
  else counts.invalid += 1;
}

function toBreakdown(map: Map<string, C2sStatusCounts>): C2sBreakdownRow[] {
  return [...map.entries()]
    .map(([key, counts]) => {
      const comparable = counts.onTime + counts.late;
      return {
        key,
        ...counts,
        comparable,
        latePercent: comparable > 0 ? (counts.late / comparable) * 100 : null,
      };
    })
    .sort((a, b) => (b.late - a.late) || a.key.localeCompare(b.key));
}

function bump(map: Map<string, C2sStatusCounts>, key: string, status: C2sTimelinessStatus) {
  if (!map.has(key)) map.set(key, emptyCounts());
  tally(map.get(key)!, status);
}

/** Safe aggregate rows. No client-level fields exist in the output. */
export function summarizeProxyRows(rows: C2sProxyRow[]): C2sProxySummary {
  const overall = emptyCounts();
  const byState = new Map<string, C2sStatusCounts>();
  const byRole = new Map<string, C2sStatusCounts>();
  const byCategory = new Map<string, C2sStatusCounts>();
  const byMonth = new Map<string, C2sStatusCounts>();
  let authoritativeRows = 0;
  let proxyRows = 0;
  let unmappedRows = 0;

  for (const row of rows) {
    const status = row.timelinessStatus;
    tally(overall, status);
    bump(byState, row.state ?? "Unknown state", status);
    bump(byRole, row.roleGroup, status);
    bump(byCategory, row.proxyCategory, status);
    bump(byMonth, (row.dateOfService ?? "").slice(0, 7) || "Unknown month", status);
    if (row.usedAuthoritativeCompletion) authoritativeRows += 1;
    else if (row.lagDays !== null) proxyRows += 1;
    if (!row.employeeId) unmappedRows += 1;
  }

  const comparable = overall.onTime + overall.late;
  return {
    ...overall,
    comparable,
    latePercent: comparable > 0 ? (overall.late / comparable) * 100 : null,
    byState: toBreakdown(byState),
    byRoleGroup: toBreakdown(byRole),
    byProxyCategory: toBreakdown(byCategory),
    byMonth: toBreakdown(byMonth).sort((a, b) => a.key.localeCompare(b.key)),
    authoritativeRows,
    proxyRows,
    unmappedRows,
    formalViolationsFromProxy: 0,
  };
}

/** Provider-level queue rows. Never includes any client field. */
export function buildProviderQueue(rows: C2sProxyRow[]): C2sProviderQueueRow[] {
  const map = new Map<string, C2sProviderQueueRow>();
  for (const row of rows) {
    const key = row.employeeId ?? `name:${row.providerDisplayName ?? "unknown"}`;
    if (!map.has(key)) {
      map.set(key, {
        employeeId: row.employeeId,
        providerDisplayName: row.providerDisplayName,
        roleGroup: row.roleGroup,
        state: row.state,
        proxyCategory: row.proxyCategory,
        ...emptyCounts(),
        comparable: 0,
        latePercent: null,
        maxLagDays: null,
        authoritativeRows: 0,
        proxyRows: 0,
        unmapped: !row.employeeId,
      });
    }
    const entry = map.get(key)!;
    tally(entry, row.timelinessStatus);
    if (row.lagDays !== null && (entry.maxLagDays === null || row.lagDays > entry.maxLagDays)) {
      entry.maxLagDays = row.lagDays;
    }
    if (row.usedAuthoritativeCompletion) entry.authoritativeRows += 1;
    else if (row.lagDays !== null) entry.proxyRows += 1;
    if (entry.roleGroup === "Unknown" && row.roleGroup !== "Unknown") {
      entry.roleGroup = row.roleGroup;
      entry.proxyCategory = proxyCategoryForRole(row.roleGroup);
    }
  }
  return [...map.values()]
    .map((entry) => {
      const comparable = entry.onTime + entry.late;
      return {
        ...entry,
        comparable,
        latePercent: comparable > 0 ? (entry.late / comparable) * 100 : null,
      };
    })
    .sort((a, b) => (b.late - a.late) || (b.total - a.total));
}

// ------------------------------------------------------- formal / governance

/** Configuration is only usable when enabled AND fully approved/valued. */
export function isConfigActive(config: C2sProgramConfig | null | undefined): boolean {
  if (!config) return false;
  return Boolean(
    config.isEnabled &&
      config.hrApprovedAt &&
      config.legalApprovedAt &&
      config.trackingStartDate &&
      config.priorHistoryCounts !== null &&
      config.priorHistoryCounts !== undefined &&
      config.newHireGraceDays !== null &&
      config.newHireGraceDays !== undefined &&
      config.category1QaCriteria &&
      String(config.category1QaCriteria).trim() !== "",
  );
}

export interface C2sFormalEligibility {
  eligible: boolean;
  reasons: string[];
}

/**
 * A formal violation may come only from an authoritative completion timestamp
 * or an explicitly reviewed tracker record, and only after an upheld review
 * with no approved exception and no upheld dispute. BCBA Category 1 further
 * requires authoritative completion plus reviewed QA criteria.
 */
export function evaluateFormalViolation(
  record: C2sTrackerRecord,
  context: {
    config?: C2sProgramConfig | null;
    exceptions?: C2sExceptionRecord[];
    disputes?: C2sDisputeRecord[];
  } = {},
): C2sFormalEligibility {
  const reasons: string[] = [];
  if (!isConfigActive(context.config)) {
    reasons.push("Program configuration is not active and fully approved.");
  }
  if (record.reviewStatus !== "upheld") {
    reasons.push("Record has no upheld review disposition.");
  }
  if (
    record.sourceKind !== "reviewed_tracker" &&
    !(record.sourceKind === "authoritative_completion" && record.authoritativeCompletedAt)
  ) {
    reasons.push("No authoritative completion timestamp or reviewed tracker record.");
  }
  if (
    record.category === "bcba_category_1" &&
    (!record.authoritativeCompletedAt ||
      !String(record.category1CriteriaReference ?? "").trim())
  ) {
    reasons.push(
      "BCBA Category 1 requires an authoritative completion source and reviewed QA criteria.",
    );
  }
  const approvedException = (context.exceptions ?? []).some(
    (e) =>
      e.status === "approved" &&
      e.subjectEmployeeId === record.subjectEmployeeId &&
      (e.trackerRecordId === null || e.trackerRecordId === record.id),
  );
  if (approvedException) reasons.push("An approved exception applies to this record.");
  const upheldDispute = (context.disputes ?? []).some(
    (d) => d.status === "upheld" && d.trackerRecordId === record.id,
  );
  if (upheldDispute) reasons.push("An upheld dispute overturns this record.");
  return { eligible: reasons.length === 0, reasons };
}

/** A proxy occurrence is never a formal violation. */
export function proxyRowIsFormalViolation(_row: C2sProxyRow): false {
  return false;
}

export interface C2sNoticeEligibility {
  allowed: boolean;
  reasons: string[];
  /** Level 3 requires HR review only. Never an employment action. */
  hrReviewRequired: boolean;
  employmentAction: null;
}

export function evaluateNoticeEligibility(input: {
  level: 1 | 2 | 3;
  config?: C2sProgramConfig | null;
  record: C2sTrackerRecord;
  coaching?: C2sCoachingRecord[];
  exceptions?: C2sExceptionRecord[];
  disputes?: C2sDisputeRecord[];
}): C2sNoticeEligibility {
  const reasons: string[] = [];
  const formal = evaluateFormalViolation(input.record, {
    config: input.config,
    exceptions: input.exceptions,
    disputes: input.disputes,
  });
  if (!formal.eligible) reasons.push(...formal.reasons);
  const hasCoaching = (input.coaching ?? []).some(
    (c) => c.subjectEmployeeId === input.record.subjectEmployeeId,
  );
  if (!hasCoaching) reasons.push("Coaching must precede a formal notice.");
  return {
    allowed: reasons.length === 0,
    reasons,
    hrReviewRequired: input.level === 3,
    employmentAction: null,
  };
}

// ---------------------------------------------------------- dispute deadline

function parseDay(value: string | Date): Date | null {
  const d = value instanceof Date ? new Date(value.getTime()) : new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Weekend-aware business-day addition. Holidays are unavailable (documented). */
export function addBusinessDays(from: string | Date, days: number): string | null {
  const start = parseDay(from);
  if (!start) return null;
  let remaining = Math.max(0, Math.trunc(days));
  const cursor = new Date(start.getTime());
  while (remaining > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) remaining -= 1;
  }
  return cursor.toISOString().slice(0, 10);
}

export function disputeFilingDeadline(
  noticeDate: string | Date,
  businessDays: number = C2S_DISPUTE_WINDOW_BUSINESS_DAYS,
): string | null {
  return addBusinessDays(noticeDate, businessDays);
}

export function isDisputeWithinWindow(
  noticeDate: string | Date,
  filedOn: string | Date,
  businessDays: number = C2S_DISPUTE_WINDOW_BUSINESS_DAYS,
): boolean {
  const deadline = disputeFilingDeadline(noticeDate, businessDays);
  const filed = parseDay(filedOn);
  if (!deadline || !filed) return false;
  return filed.toISOString().slice(0, 10) <= deadline;
}

// ------------------------------------------------------------- review counts

export interface C2sGovernanceSummary {
  reviewedRecords: number;
  unreviewedRecords: number;
  upheldRecords: number;
  formalViolations: number;
  approvedExceptions: number;
  pendingExceptions: number;
  disputesFiled: number;
  disputesUpheld: number;
  disputesDenied: number;
  disputesPending: number;
}

export function summarizeGovernance(input: {
  records?: C2sTrackerRecord[];
  exceptions?: C2sExceptionRecord[];
  disputes?: C2sDisputeRecord[];
}): C2sGovernanceSummary {
  const records = input.records ?? [];
  const exceptions = input.exceptions ?? [];
  const disputes = input.disputes ?? [];
  return {
    reviewedRecords: records.filter((r) => r.reviewStatus !== "unreviewed").length,
    unreviewedRecords: records.filter((r) => r.reviewStatus === "unreviewed").length,
    upheldRecords: records.filter((r) => r.reviewStatus === "upheld").length,
    formalViolations: records.filter((r) => r.isFormalViolation).length,
    approvedExceptions: exceptions.filter((e) => e.status === "approved").length,
    pendingExceptions: exceptions.filter((e) => e.status === "requested").length,
    disputesFiled: disputes.length,
    disputesUpheld: disputes.filter((d) => d.status === "upheld").length,
    disputesDenied: disputes.filter((d) => d.status === "denied").length,
    disputesPending: disputes.filter(
      (d) => d.status === "submitted" || d.status === "under_review",
    ).length,
  };
}
