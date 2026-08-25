/**
 * Drilldown row projections. Every drilldown shows the raw CentralReach
 * source fields plus the matched Blossom entity context so operators can
 * verify attribution, not just totals.
 */
import type {
  CrAuthorizationRow,
  CrBillingSessionRow,
  CrScheduleCurrentRow,
  CrScheduleEventRow,
  CrUtilizationRow,
} from "./types";
import { normalizeCode } from "./metrics/codes";
import { pickNumber, pickText } from "./tolerant";
import {
  cancellationTruth,
  cleanReasonText,
  clockMinutes,
  dayOfWeekLabel,
  eventDurationHours,
} from "./scheduleTruth";

export const BILLING_DRILLDOWN_COLUMNS = [
  { key: "date", label: "Date of Service" },
  { key: "code", label: "Code" },
  { key: "hours", label: "Hours" },
  { key: "client", label: "CR Client" },
  { key: "clientCrId", label: "CR Client ID" },
  { key: "provider", label: "Rendering Provider" },
  { key: "providerCrId", label: "Provider CR ID" },
  { key: "matchedBcba", label: "Matched BCBA" },
  { key: "matchStatus", label: "Match Status" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "location", label: "Location" },
  { key: "status", label: "Source Status" },
  { key: "batchId", label: "Import Batch" },
];

export function projectBillingRows(
  rows: CrBillingSessionRow[],
  clientToBcba?: Map<string, string>,
): Record<string, unknown>[] {
  return rows.map((r) => {
    // Typed columns win; raw payload columns are the tolerant fallback.
    const client = pickText(r as unknown as Record<string, unknown>, [
      "client_name",
      "clientName",
      "client",
      "patient_name",
    ]);
    const matched = clientToBcba?.get(client);
    return {
      date: pickText(r as unknown as Record<string, unknown>, [
        "date_of_service",
        "dateOfService",
        "service_date",
        "date",
      ]),
      code: normalizeCode(r.procedure_code),
      hours: pickNumber(r as unknown as Record<string, unknown>, [
        "hours",
        "units_hours",
        "billed_hours",
      ]).toFixed(1),
      client: client || "Unknown client",
      clientCrId: r.client_cr_id ?? "",
      provider: pickText(r as unknown as Record<string, unknown>, [
        "rendering_provider_name",
        "renderingProviderName",
        "provider_name",
        "provider",
      ]),
      providerCrId: r.rendering_provider_cr_id ?? "",
      matchedBcba: matched ?? "Unassigned",
      matchStatus: matched ? "Matched to BCBA" : "Unmatched — no 97155/97156 anchor",
      payor: pickText(r as unknown as Record<string, unknown>, ["payor", "payer", "insurance"]),
      state: pickText(r as unknown as Record<string, unknown>, ["state", "service_state"]),
      location: pickText(r as unknown as Record<string, unknown>, ["location", "office", "clinic"]),
      status: r.status ?? "",
      batchId: r.batch_id ?? "",
    };
  });
}

export const SCHEDULE_DRILLDOWN_COLUMNS = [
  { key: "date", label: "Event Date" },
  { key: "code", label: "Code" },
  { key: "hours", label: "Scheduled Hours" },
  { key: "client", label: "CR Client" },
  { key: "provider", label: "Provider" },
  { key: "status", label: "Source Status" },
  { key: "reasonRaw", label: "CR Cancellation Reason" },
  { key: "reasonBucket", label: "Mapped Reason" },
  { key: "cancelledBy", label: "Cancelled By" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "location", label: "Location" },
  { key: "batchId", label: "Import Batch" },
];

export function projectScheduleRows(
  rows: CrScheduleEventRow[],
  mapReason: (r: CrScheduleEventRow) => string,
): Record<string, unknown>[] {
  return rows.map((r) => ({
    date: pickText(r as unknown as Record<string, unknown>, [
      "event_date",
      "eventDate",
      "date",
      "appointment_date",
    ]),
    code: normalizeCode(r.procedure_code),
    hours: pickNumber(r as unknown as Record<string, unknown>, [
      "scheduled_hours",
      "scheduledHours",
      "hours",
    ]).toFixed(1),
    client: pickText(r as unknown as Record<string, unknown>, ["client_name", "clientName", "client"]),
    provider: pickText(r as unknown as Record<string, unknown>, [
      "provider_name",
      "providerName",
      "provider",
    ]),
    status: r.status ?? "",
    reasonRaw: pickText(r as unknown as Record<string, unknown>, [
      "cancellation_reason",
      "cancellationReason",
      "reason",
    ]),
    reasonBucket: mapReason(r),
    cancelledBy: r.cancelled_by ?? "",
    payor: pickText(r as unknown as Record<string, unknown>, ["payor", "payer", "insurance"]),
    state: pickText(r as unknown as Record<string, unknown>, ["state", "service_state"]),
    location: pickText(r as unknown as Record<string, unknown>, ["location", "office", "clinic"]),
    batchId: r.batch_id ?? "",
  }));
}

/**
 * Drilldown over the Phase 1 curated scheduling view. It shows the explicit
 * cancellation truth columns plus which signal decided the answer, so an
 * operator can always see why a row counted as cancelled.
 */
export const SCHEDULE_CURRENT_DRILLDOWN_COLUMNS = [
  { key: "date", label: "Event Date" },
  { key: "dayOfWeek", label: "Day" },
  { key: "code", label: "Service Code" },
  { key: "hours", label: "Hours" },
  { key: "hoursBasis", label: "Hours From" },
  { key: "client", label: "CR Client" },
  { key: "provider", label: "Provider" },
  { key: "status", label: "Source Status" },
  { key: "attendance", label: "Attendance" },
  { key: "cancelledFlag", label: "CR Cancelled Flag" },
  { key: "cancelledBasis", label: "Cancelled Decided By" },
  { key: "reasonRaw", label: "CR Cancellation Reason" },
  { key: "reasonBucket", label: "Mapped Reason" },
  { key: "cancelledByRaw", label: "Cancelled By" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "location", label: "Location" },
];

const TRUTH_SOURCE_LABEL: Record<string, string> = {
  explicit_flag: "CentralReach cancelled flag",
  attendance_text: "Attendance text",
  status_text: "Status text",
  reason_text: "Documented reason text",
  none: "Not cancelled",
};

export function projectScheduleCurrentRows(
  rows: CrScheduleCurrentRow[],
  mapReason: (row: CrScheduleCurrentRow) => string,
): Record<string, unknown>[] {
  return rows.map((r) => {
    const truth = cancellationTruth(r);
    const usedClock = clockMinutes(r.start_time) != null && clockMinutes(r.end_time) != null;
    return {
      date: (r.event_date ?? "").slice(0, 10),
      dayOfWeek: dayOfWeekLabel(r.event_date) ?? "",
      code: cleanReasonText(r.service_code) ?? normalizeCode(r.procedure_code),
      hours: eventDurationHours(r).toFixed(2),
      hoursBasis: usedClock ? "Start/end time" : "Exported scheduled hours",
      client: (r.client_name ?? "").trim(),
      provider: (r.provider_name ?? "").trim(),
      status: r.status ?? "",
      attendance: r.attendance ?? "",
      cancelledFlag: r.cancelled == null ? "Not exported" : r.cancelled ? "Yes" : "No",
      cancelledBasis: TRUTH_SOURCE_LABEL[truth.source] ?? truth.source,
      reasonRaw: cleanReasonText(r.cancellation_reason) ?? "Not documented",
      reasonBucket: mapReason(r),
      cancelledByRaw: cleanReasonText(r.cancelled_by) ?? "",
      payor: r.payor ?? "",
      state: r.state ?? "",
      location: r.location ?? "",
    };
  });
}

/**
 * Filters already-projected drilldown rows by exact (case-insensitive) field
 * values. Used when a KPI, chart segment, or table row narrows the source
 * rows shown inside the drilldown drawer.
 */
export function filterDrilldownRows(
  rows: Record<string, unknown>[],
  matchers: Record<string, string | undefined>,
): Record<string, unknown>[] {
  const active = Object.entries(matchers).filter(([, v]) => !!v && String(v).trim() !== "");
  if (!active.length) return rows;
  return rows.filter((row) =>
    active.every(
      ([key, value]) =>
        String(row[key] ?? "").trim().toLowerCase() === String(value).trim().toLowerCase(),
    ),
  );
}

export const AUTH_DRILLDOWN_COLUMNS = [
  { key: "authNumber", label: "Authorization #" },
  { key: "client", label: "CR Client" },
  { key: "clientCrId", label: "CR Client ID" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "code", label: "Code" },
  { key: "startDate", label: "Start" },
  { key: "endDate", label: "End" },
  { key: "authorizedHours", label: "Authorized Hours" },
  { key: "usedHours", label: "Used Hours" },
  { key: "remainingHours", label: "Remaining Hours" },
  { key: "utilizationPct", label: "Utilization %" },
  { key: "kind", label: "Work Type" },
  { key: "statusBucket", label: "Mapped Status" },
  { key: "status", label: "Source Status" },
  { key: "matchedBcba", label: "Matched BCBA" },
  { key: "batchId", label: "Import Batch" },
];

export function projectAuthRows(
  rows: CrAuthorizationRow[],
  meta: {
    kind: (r: CrAuthorizationRow) => string;
    status: (r: CrAuthorizationRow) => string;
    clientToBcba?: Map<string, string>;
  },
): Record<string, unknown>[] {
  return rows.map((r) => {
    const authorized = Number(r.authorized_hours ?? 0);
    const used = Number(r.worked_hours ?? 0);
    const client = (r.client_name ?? "").trim();
    return {
      authNumber: r.authorization_number ?? "",
      client: client || "Unknown client",
      clientCrId: r.client_cr_id ?? "",
      payor: r.payor ?? "",
      state: r.state ?? "",
      code: normalizeCode(r.procedure_code),
      startDate: r.start_date ?? "",
      endDate: r.end_date ?? "",
      authorizedHours: authorized.toFixed(1),
      usedHours: used.toFixed(1),
      remainingHours: Number(
        r.remaining_hours != null ? r.remaining_hours : authorized - used,
      ).toFixed(1),
      utilizationPct: authorized ? `${((used / authorized) * 100).toFixed(1)}%` : "—",
      kind: meta.kind(r),
      statusBucket: meta.status(r),
      status: r.status ?? "",
      matchedBcba: meta.clientToBcba?.get(client) ?? "Unassigned",
      batchId: r.batch_id ?? "",
    };
  });
}

export const UTILIZATION_DRILLDOWN_COLUMNS = [
  { key: "weekStart", label: "Week Start" },
  { key: "weekEnd", label: "Week End" },
  { key: "authNumber", label: "Authorization #" },
  { key: "client", label: "CR Client" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "code", label: "Code" },
  { key: "authorizedHours", label: "Authorized Hours" },
  { key: "usedHours", label: "Used Hours" },
  { key: "utilizationPct", label: "Utilization %" },
  { key: "batchId", label: "Import Batch" },
];

export function projectUtilizationRows(
  rows: CrUtilizationRow[],
): Record<string, unknown>[] {
  return rows.map((r) => ({
    weekStart: r.week_start ?? "",
    weekEnd: r.week_end ?? "",
    authNumber: r.authorization_number ?? "",
    client: r.client_name ?? "",
    payor: r.payor ?? "",
    state: r.state ?? "",
    code: normalizeCode(r.procedure_code),
    authorizedHours: Number(r.authorized_hours ?? 0).toFixed(1),
    usedHours: Number(r.used_hours ?? 0).toFixed(1),
    utilizationPct:
      r.utilization_percent != null
        ? `${Number(r.utilization_percent).toFixed(1)}%`
        : "—",
    batchId: r.batch_id ?? "",
  }));
}