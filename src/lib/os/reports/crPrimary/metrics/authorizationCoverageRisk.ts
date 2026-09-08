/**
 * Authorization Coverage Risk (`authorization-coverage-risk`).
 *
 * A staff-facing "confirm before it becomes a problem" queue built entirely
 * on top of the existing authorization continuity engine
 * (`authorizationContinuity.ts`) plus two new, honest cross-checks:
 *
 * - billed activity whose date of service has no matched active coverage on
 *   the current snapshot;
 * - future *kept* scheduled activity with no matched active coverage.
 *
 * Every gap produced here is a CANDIDATE that needs staff confirmation. This
 * module never asserts a confirmed service pause and never invents an
 * authorization lifecycle event — it only compares dates and codes that are
 * already present on the curated snapshots.
 */
import { localIsoDate } from "../reportWindow";
import { strictDay } from "./calendarDate";
import { normalizeCode } from "./codes";
import { buildClientIdentityResolver } from "./clientIdentity";
import {
  computeAuthorizationContinuity,
  coveragePairsOf,
  type ContinuityAuthRow,
  type ContinuityMetrics,
  type ContinuityRow,
  type CoverageGapRow,
} from "./authorizationContinuity";

export const NOT_DOCUMENTED = "Not documented";

export interface CoverageRiskBillingRow {
  id?: string;
  date_of_service?: string | null;
  procedure_code?: string | null;
  client_name?: string | null;
  client_cr_id?: string | null;
  payor?: string | null;
  state?: string | null;
  status?: string | null;
  is_void?: boolean | null;
  deleted?: boolean | null;
}

export interface CoverageRiskScheduleRow {
  id?: string;
  event_date?: string | null;
  service_code?: string | null;
  procedure_code?: string | null;
  billing_code?: string | null;
  client_name?: string | null;
  client_cr_id?: string | null;
  payor?: string | null;
  state?: string | null;
  status?: string | null;
  cancelled?: boolean | null;
  deleted?: boolean | null;
}

export interface BillingCoverageGapRow {
  key: string;
  client: string;
  clientCrId: string;
  payor: string;
  state: string;
  code: string;
  dateOfService: string;
  note: string;
}

export interface ScheduledCoverageGapRow {
  key: string;
  client: string;
  clientCrId: string;
  payor: string;
  state: string;
  code: string;
  eventDate: string;
  note: string;
}

export interface CoverageRiskMetrics {
  today: string;
  continuity: ContinuityMetrics;
  clientsWithoutCoverage: CoverageGapRow[];
  expired: ContinuityRow[];
  expiring14: ContinuityRow[];
  zeroRemainingHours: ContinuityRow[];
  unknownDates: ContinuityRow[];
  billingGaps: BillingCoverageGapRow[];
  scheduledGaps: ScheduledCoverageGapRow[];
}

const VOID_LIKE = /void|deleted|cancel/;

/**
 * True when at least one of a client's authorization rows carries a matched
 * coverage pair (see `coveragePairsOf`) spanning `date`. Code-aware: when
 * both the activity and the authorization row carry a normalized code, they
 * must agree. An authorization row with no documented code is still eligible
 * coverage, so an undocumented code column can never manufacture a gap.
 */
function authCandidatesCoverDate(
  authRows: ContinuityAuthRow[],
  date: string,
  code: string,
): boolean {
  return authRows.some((row) => {
    if (row.is_active === false) return false;
    const authCode = normalizeCode(row.procedure_code ?? row.service_codes ?? "");
    if (code && authCode && authCode !== code) return false;
    return coveragePairsOf(row).some((p) => p.start <= date && date <= p.end);
  });
}

export function computeAuthorizationCoverageRisk(
  authRows: ContinuityAuthRow[],
  billingRows: CoverageRiskBillingRow[],
  scheduleRows: CoverageRiskScheduleRow[],
  today: string = localIsoDate(),
): CoverageRiskMetrics {
  const continuity = computeAuthorizationContinuity(authRows, today);

  // Client identity is resolved across ALL three sources up front so an
  // unambiguous normalized name can bridge an id-less billing/schedule row to
  // its authorization, and an ambiguous name never merges two clients.
  const identity = buildClientIdentityResolver(
    authRows.map((r) => ({ client_name: r.client_name, client_cr_id: r.client_cr_id })),
    billingRows.map((r) => ({ client_name: r.client_name, client_cr_id: r.client_cr_id })),
    scheduleRows.map((r) => ({ client_name: r.client_name, client_cr_id: r.client_cr_id })),
  );

  const authByClient = new Map<string, ContinuityAuthRow[]>();
  for (const row of authRows) {
    const key = identity.keyFor(row.client_cr_id, row.client_name);
    if (!authByClient.has(key)) authByClient.set(key, []);
    authByClient.get(key)!.push(row);
  }

  const billingGaps: BillingCoverageGapRow[] = [];
  billingRows.forEach((row, index) => {
    if (row.is_void === true || row.deleted === true) return;
    if (VOID_LIKE.test((row.status ?? "").trim().toLowerCase())) return;
    const date = strictDay(row.date_of_service);
    if (!date) return;
    const key = identity.keyFor(row.client_cr_id, row.client_name);
    const code = normalizeCode(row.procedure_code);
    const candidates = authByClient.get(key) ?? [];
    if (authCandidatesCoverDate(candidates, date, code)) return;
    billingGaps.push({
      key: `${row.id ?? "billing"}-${index}`,
      client: (row.client_name ?? "").trim() || "Unknown client",
      clientCrId: (row.client_cr_id ?? "").trim(),
      payor: (row.payor ?? "").trim() || "Unknown",
      state: (row.state ?? "").trim() || "Unknown",
      code: code || "Not specified",
      dateOfService: date,
      note:
        "Billed activity on this date has no matched active authorization on the current snapshot — needs confirmation, not a claim of service without authorization.",
    });
  });

  const scheduledGaps: ScheduledCoverageGapRow[] = [];
  scheduleRows.forEach((row, index) => {
    if (row.cancelled === true || row.deleted === true) return;
    if (VOID_LIKE.test((row.status ?? "").trim().toLowerCase())) return;
    const date = strictDay(row.event_date);
    if (!date || date <= today) return; // future kept schedule entries only
    const key = identity.keyFor(row.client_cr_id, row.client_name);
    const code = normalizeCode(row.service_code ?? row.procedure_code ?? row.billing_code);
    const candidates = authByClient.get(key) ?? [];
    if (authCandidatesCoverDate(candidates, date, code)) return;
    scheduledGaps.push({
      key: `${row.id ?? "sched"}-${index}`,
      client: (row.client_name ?? "").trim() || "Unknown client",
      clientCrId: (row.client_cr_id ?? "").trim(),
      payor: (row.payor ?? "").trim() || "Unknown",
      state: (row.state ?? "").trim() || "Unknown",
      code: code || "Not specified",
      eventDate: date,
      note:
        "Future kept schedule entry has no matched active authorization on the current snapshot — confirm before the appointment, not a confirmed lapse.",
    });
  });

  return {
    today,
    continuity,
    clientsWithoutCoverage: continuity.clientsWithoutCoverage,
    expired: continuity.rows.filter((r) => r.continuity === "expired"),
    expiring14: continuity.rows.filter((r) => r.window === "0_14"),
    // Documented only: a missing remaining-hours value is "Not documented",
    // never a fabricated zero (see `computeAuthorizationContinuity`).
    zeroRemainingHours: continuity.rows.filter(
      (r) => r.remainingHours != null && r.remainingHours <= 0,
    ),
    unknownDates: continuity.rows.filter((r) => r.continuity === "unknown_dates"),
    billingGaps,
    scheduledGaps,
  };
}
