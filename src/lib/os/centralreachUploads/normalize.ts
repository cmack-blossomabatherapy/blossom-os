/**
 * CentralReach export → normalized `cr_*` row mappers.
 *
 * Operator exports vary in header casing/wording, so every field is read
 * tolerantly. The mappers return exactly the columns of the normalized table
 * plus a symbol-keyed raw payload used for `cr_raw_rows` provenance (symbol
 * keys are invisible to `Object.keys`, so they never affect the row hash).
 */

import { pickNumber, pickText } from "@/lib/os/reports/crPrimary/tolerant";
import type { CRUploadKind } from "./detect";

export const CR_RAW_PAYLOAD = Symbol("crRawPayload");

export type NormalizedCrRow = Record<string, unknown> & {
  [CR_RAW_PAYLOAD]?: Record<string, unknown>;
};

/** Normalized table for each detected export kind. */
export const CR_TABLE_FOR_KIND: Record<Exclude<CRUploadKind, "unknown">, string> = {
  billing: "cr_billing_sessions",
  scheduling: "cr_schedule_events",
  authorization: "cr_authorizations",
  utilization: "cr_authorization_utilization",
  claims: "cr_claims",
  contacts: "cr_contacts",
};

export function crTableForKind(kind: CRUploadKind): string {
  if (kind === "unknown") throw new Error("Unknown CentralReach export type");
  return CR_TABLE_FOR_KIND[kind];
}

/** Date field used to derive coverage for each export kind. */
export const CR_COVERAGE_FIELD: Record<Exclude<CRUploadKind, "unknown">, string | null> = {
  billing: "date_of_service",
  scheduling: "event_date",
  authorization: "start_date",
  utilization: "week_start",
  claims: "date_of_service",
  contacts: null,
};

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
];

/** Normalize a spreadsheet date cell to an ISO `YYYY-MM-DD` string. */
export function toIsoDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;

  const us = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (us) {
    const year = us[3].length === 2 ? `20${us[3]}` : us[3];
    return `${year}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  }

  const textual = raw.match(/^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})/);
  if (textual) {
    const month = MONTHS.indexOf(textual[1].slice(0, 3).toLowerCase());
    if (month >= 0) {
      return `${textual[3]}-${String(month + 1).padStart(2, "0")}-${textual[2].padStart(2, "0")}`;
    }
  }

  // Excel serial date (days since 1899-12-30).
  if (/^\d{5}$/.test(raw)) {
    const ms = (Number(raw) - 25569) * 86400000;
    if (Number.isFinite(ms)) return new Date(ms).toISOString().slice(0, 10);
  }
  return null;
}

const text = (row: Record<string, unknown>, keys: string[]): string | null => {
  const value = pickText(row, keys);
  return value ? value : null;
};
const num = (row: Record<string, unknown>, keys: string[]): number | null => {
  const value = pickNumber(row, keys, Number.NaN);
  return Number.isFinite(value) ? value : null;
};
const date = (row: Record<string, unknown>, keys: string[]): string | null =>
  toIsoDate(pickText(row, keys));

const CLIENT = ["ClientName", "Client", "Patient", "PatientName", "Client Name"];
const CLIENT_ID = ["ClientId", "Client Id", "PatientId", "ClientCRId", "Client CR Id"];
const PAYOR = ["Payor", "Payer", "Insurance", "PrimaryPayor", "Primary Payor", "Funder"];
const STATE = ["State", "ClientState", "ServiceState", "Client State"];
const CODE = ["ProcedureCode", "Procedure Code", "Code", "CPT", "ServiceCode", "Service Code"];
const STATUS = ["Status", "BillingStatus", "ClaimStatus", "AuthorizationStatus"];
const LOCATION = ["Location", "ServiceLocation", "PlaceOfService", "Place of Service", "Office", "Clinic"];

function billingRow(row: Record<string, unknown>): NormalizedCrRow {
  const hours = num(row, ["TimeWorkedInHours", "Time Worked In Hours", "Hours", "HoursWorked", "Units"]);
  const mins = num(row, ["TimeWorkedInMins", "Time Worked In Mins", "Minutes"]);
  return {
    date_of_service: date(row, ["DateOfService", "Date of Service", "ServiceDate", "Date"]),
    procedure_code: text(row, CODE),
    hours: hours ?? (mins !== null ? Math.round((mins / 60) * 100) / 100 : null),
    client_name: text(row, CLIENT),
    client_cr_id: text(row, CLIENT_ID),
    rendering_provider_name: text(row, [
      "RenderingProviderName", "Rendering Provider", "RenderingProvider", "Provider",
      "ProviderName", "Employee", "EmployeeName", "StaffName",
    ]),
    rendering_provider_cr_id: text(row, [
      "RenderingProviderId", "ProviderId", "Provider Id", "EmployeeId", "StaffId",
    ]),
    provider_contact_labels: text(row, ["ProviderContactLabels", "ContactLabels", "Labels"]),
    payor: text(row, PAYOR),
    state: text(row, STATE),
    location: text(row, LOCATION),
    status: text(row, STATUS),
  };
}

function scheduleRow(row: Record<string, unknown>): NormalizedCrRow {
  return {
    event_date: date(row, ["EventDate", "Date", "StartDate", "AppointmentDate", "DateOfService", "Start"]),
    procedure_code: text(row, CODE),
    scheduled_hours: num(row, ["ScheduledHours", "Scheduled Hours", "Hours", "Duration", "TimeScheduledInHours"]),
    client_name: text(row, CLIENT),
    provider_name: text(row, ["Provider", "ProviderName", "Employee", "EmployeeName", "StaffName", "Resource"]),
    status: text(row, ["Status", "Attendance", "EventStatus", "Cancelled"]),
    cancellation_reason: text(row, ["CancellationReason", "Cancellation Reason", "CancelReason", "Reason"]),
    cancelled_by: text(row, ["CancelledBy", "Cancelled By", "CanceledBy"]),
    state: text(row, STATE),
    location: text(row, LOCATION),
    payor: text(row, PAYOR),
  };
}

function authorizationRow(row: Record<string, unknown>): NormalizedCrRow {
  const authorized = num(row, [
    "AuthorizedHours", "Authorized Hours", "AuthorizedHoursAll", "AuthorizedHoursMonth",
  ]);
  const worked = num(row, ["WorkedHours", "Worked Hours", "UsedHours", "HoursWorked"]);
  const remaining = num(row, ["RemainingHours", "Remaining Hours", "HoursRemaining"]);
  return {
    authorization_number: text(row, ["AuthorizationNumber", "Authorization Number", "AuthNumber", "AuthId"]),
    client_name: text(row, CLIENT),
    client_cr_id: text(row, CLIENT_ID),
    payor: text(row, PAYOR),
    state: text(row, STATE),
    procedure_code: text(row, CODE),
    start_date: date(row, ["StartDate", "Start Date", "AuthStartDate", "AuthorizationStart"]),
    end_date: date(row, ["EndDate", "End Date", "AuthEndDate", "AuthorizationEnd", "ExpirationDate"]),
    authorized_hours: authorized,
    worked_hours: worked,
    remaining_hours:
      remaining ?? (authorized !== null && worked !== null ? authorized - worked : null),
    status: text(row, STATUS),
  };
}

function utilizationRow(row: Record<string, unknown>): NormalizedCrRow {
  const authorized = num(row, ["AuthorizedHours", "Authorized Hours", "AuthorizedHoursWeek"]);
  const used = num(row, ["UsedHours", "Used Hours", "WorkedHours", "Hours"]);
  const pct = num(row, ["UtilizationPercent", "Utilization %", "UtilizationPct", "Utilization"]);
  return {
    authorization_number: text(row, ["AuthorizationNumber", "Authorization Number", "AuthNumber"]),
    client_name: text(row, CLIENT),
    payor: text(row, PAYOR),
    state: text(row, STATE),
    procedure_code: text(row, CODE),
    week_start: date(row, ["WeekStart", "Week Start", "WeekOf", "Week Of"]),
    week_end: date(row, ["WeekEnd", "Week End", "WeekEnding", "Week Ending"]),
    authorized_hours: authorized,
    used_hours: used,
    utilization_percent:
      pct ?? (authorized ? Math.round((((used ?? 0) / authorized) * 100) * 10) / 10 : null),
  };
}

function claimRow(row: Record<string, unknown>): NormalizedCrRow {
  return {
    claim_number: text(row, ["ClaimNumber", "Claim Number", "ClaimId", "Claim Id"]),
    client_name: text(row, CLIENT),
    payor: text(row, PAYOR),
    state: text(row, STATE),
    date_of_service: date(row, ["DateOfService", "Date of Service", "ServiceDate", "Date"]),
    procedure_code: text(row, CODE),
    billed_amount: num(row, ["BilledAmount", "Billed Amount", "Charge", "Billed"]),
    paid_amount: num(row, ["PaidAmount", "Paid Amount", "Paid"]),
    status: text(row, STATUS),
  };
}

function contactRow(row: Record<string, unknown>): NormalizedCrRow {
  return {
    cr_contact_id: text(row, ["ContactId", "Contact Id", "ContactID", "CrContactId"]),
    contact_name: text(row, ["ContactName", "Contact Name", "Name", "FullName"]),
    contact_type: text(row, ["ContactType", "Contact Type", "Type"]),
    labels: text(row, ["ContactLabels", "Contact Labels", "Labels", "Tags"]),
    state: text(row, STATE),
    email: text(row, ["Email", "EmailAddress", "Email Address"]),
  };
}

const MAPPERS: Record<Exclude<CRUploadKind, "unknown">, (row: Record<string, unknown>) => NormalizedCrRow> = {
  billing: billingRow,
  scheduling: scheduleRow,
  authorization: authorizationRow,
  utilization: utilizationRow,
  claims: claimRow,
  contacts: contactRow,
};

/** Map one raw export row into its normalized shape, carrying raw provenance. */
export function normalizeCrRow(kind: CRUploadKind, row: Record<string, unknown>): NormalizedCrRow {
  if (kind === "unknown") throw new Error("Unknown CentralReach export type");
  const mapped = MAPPERS[kind](row);
  Object.defineProperty(mapped, CR_RAW_PAYLOAD, {
    value: row,
    enumerable: false,
    configurable: true,
    writable: true,
  });
  return mapped;
}

/** Map a whole parsed file, dropping rows that carry no usable values. */
export function normalizeCrRows(kind: CRUploadKind, rows: Record<string, unknown>[]): NormalizedCrRow[] {
  return rows
    .map((row) => normalizeCrRow(kind, row))
    .filter((row) => Object.values(row).some((v) => v !== null && v !== ""));
}

/** Coverage window for a normalized set of rows. */
export function crCoverage(
  kind: CRUploadKind,
  rows: NormalizedCrRow[],
): { start: string | null; end: string | null } {
  const field = kind === "unknown" ? null : CR_COVERAGE_FIELD[kind];
  if (!field) return { start: null, end: null };
  let start: string | null = null;
  let end: string | null = null;
  for (const row of rows) {
    const value = typeof row[field] === "string" ? (row[field] as string) : null;
    if (!value) continue;
    if (!start || value < start) start = value;
    if (!end || value > end) end = value;
  }
  return { start, end };
}

/** Deterministic content hash for an uploaded file (no crypto dependency). */
export async function hashUploadedFile(file: File): Promise<string> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < buffer.length; i += 1) {
    h1 = Math.imul(h1 ^ buffer[i], 16777619) >>> 0;
    h2 = Math.imul(h2 + buffer[i] + i, 2246822519) >>> 0;
  }
  const size = (file.size >>> 0).toString(16).padStart(8, "0");
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}${size}`;
}
