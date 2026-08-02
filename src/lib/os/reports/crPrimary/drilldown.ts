/**
 * Drilldown row projections. Every drilldown shows the raw CentralReach
 * source fields plus the matched Blossom entity context so operators can
 * verify attribution, not just totals.
 */
import type {
  CrAuthorizationRow,
  CrBillingSessionRow,
  CrScheduleEventRow,
  CrUtilizationRow,
} from "./types";
import { normalizeCode } from "./metrics/codes";

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
    const client = (r.client_name ?? "").trim();
    const matched = clientToBcba?.get(client);
    return {
      date: r.date_of_service ?? "",
      code: normalizeCode(r.procedure_code),
      hours: Number(r.hours ?? 0).toFixed(1),
      client: client || "Unknown client",
      clientCrId: r.client_cr_id ?? "",
      provider: r.rendering_provider_name ?? "",
      providerCrId: r.rendering_provider_cr_id ?? "",
      matchedBcba: matched ?? "Unassigned",
      matchStatus: matched ? "Matched to BCBA" : "Unmatched — no 97155/97156 anchor",
      payor: r.payor ?? "",
      state: r.state ?? "",
      location: r.location ?? "",
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
    date: r.event_date ?? "",
    code: normalizeCode(r.procedure_code),
    hours: Number(r.scheduled_hours ?? 0).toFixed(1),
    client: r.client_name ?? "",
    provider: r.provider_name ?? "",
    status: r.status ?? "",
    reasonRaw: r.cancellation_reason ?? "",
    reasonBucket: mapReason(r),
    cancelledBy: r.cancelled_by ?? "",
    payor: r.payor ?? "",
    state: r.state ?? "",
    location: r.location ?? "",
    batchId: r.batch_id ?? "",
  }));
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