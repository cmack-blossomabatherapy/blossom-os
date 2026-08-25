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

/**
 * Tolerant boolean read. CentralReach exports booleans as 1/0, true/false, or
 * Yes/No; anything else (including blanks) stays null so reports never invent a
 * negative fact.
 */
export function crBool(row: Record<string, unknown>, keys: string[]): boolean | null {
  const value = pickText(row, keys);
  if (!value) return null;
  const v = value.trim();
  if (/^(1|y|yes|true|t)$/i.test(v)) return true;
  if (/^(0|n|no|false|f)$/i.test(v)) return false;
  return null;
}

/**
 * CentralReach writes `0` / `false` into reason columns when there is no
 * reason. Those are not reasons.
 */
export function crReason(value: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v || /^(0|false|no|n\/a|na|none|null)$/i.test(v)) return null;
  return v;
}

const CLIENT = [
  "ClientName", "ClientFullName", "Client", "Patient", "PatientName", "Client Name",
];
const CLIENT_ID = ["ClientId", "Client Id", "PatientId", "ClientCRId", "Client CR Id"];
const PAYOR = [
  "Payor", "PayorName", "Payer", "PayerName", "Insurance", "InsuranceCompany",
  "InsurancePlan", "PrimaryPayor", "Primary Payor", "Funder",
];
const STATE = [
  "State",
  "ClientLocationStateProvince",
  "ServiceLocationStateProvince",
  "ProviderLocationStateProvince",
  "LocationStateProvince",
  "StateProvince",
  "HomeStateProvince",
  "ClientState", "ServiceState", "Client State",
];
const CODE = ["ProcedureCode", "Procedure Code", "Code", "CPT", "ServiceCode", "Service Code"];
const STATUS = ["Status", "BillingStatus", "ClaimStatus", "AuthorizationStatus"];
const LOCATION = [
  "Location", "ServiceLocation", "ServiceLocationName", "ClientLocationName",
  "ProviderLocationName", "LocationName", "PlaceOfService", "Place of Service",
  "Office", "Clinic",
];

const PROVIDER = [
  "RenderingProviderName", "Rendering Provider", "RenderingProvider", "Provider",
  "ProviderName", "Employee", "EmployeeName", "StaffName",
];

/**
 * Build a display name from split first/last columns, falling back to any
 * existing single-column name field. CentralReach exports use
 * `ClientFirstName`/`ClientLastName` and `ProviderFirstName`/`ProviderLastName`.
 */
export function fullName(
  row: Record<string, unknown>,
  first: string[],
  last: string[],
  fallbacks: string[],
): string | null {
  const f = pickText(row, first);
  const l = pickText(row, last);
  const combined = [f, l].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  return text(row, fallbacks);
}

function billingRow(row: Record<string, unknown>): NormalizedCrRow {
  const hours = num(row, ["TimeWorkedInHours", "Time Worked In Hours", "Hours", "HoursWorked", "Units"]);
  const mins = num(row, ["TimeWorkedInMins", "Time Worked In Mins", "Minutes"]);
  return {
    date_of_service: date(row, ["DateOfService", "Date of Service", "ServiceDate", "Date"]),
    procedure_code: text(row, CODE),
    hours: hours ?? (mins !== null ? Math.round((mins / 60) * 100) / 100 : null),
    client_name: fullName(row, ["ClientFirstName", "Client First Name"], ["ClientLastName", "Client Last Name"], CLIENT),
    client_cr_id: text(row, CLIENT_ID),
    rendering_provider_name: fullName(
      row,
      ["ProviderFirstName", "RenderingProviderFirstName", "Provider First Name"],
      ["ProviderLastName", "RenderingProviderLastName", "Provider Last Name"],
      PROVIDER,
    ),
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

/** Human-readable CPT/service names, preferred over the internal numeric code. */
const HUMAN_CODE = [
  "BillingCodeName", "Billing Code Name", "CodeName", "Code Name",
  "ProcedureCode", "Procedure Code", "ServiceCode", "Service Code", "CPT",
];
const INTERNAL_CODE = ["BillingCode", "Billing Code", "Code", "BillingCodeId"];

/** Resolve the reportable procedure code, preferring the human CPT/name. */
export function resolveServiceCode(row: Record<string, unknown>): {
  procedureCode: string | null;
  billingCode: string | null;
  billingCodeName: string | null;
} {
  const human = text(row, HUMAN_CODE);
  const internal = text(row, INTERNAL_CODE);
  const cpt = human?.match(/\b\d{5}\b/)?.[0] ?? internal?.match(/\b\d{5}\b/)?.[0] ?? null;
  return {
    procedureCode: cpt ?? human ?? internal,
    billingCode: internal,
    billingCodeName: human,
  };
}

/** Attendance is exported as 1/0 — never let a 0 outrank an explicit status. */
function attendanceLabel(raw: string | null): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (/^(1|true|y|yes|attended|present)$/i.test(v)) return "Attended";
  if (/^(0|false|n|no)$/i.test(v)) return "Not Attended";
  return v;
}

/**
 * Extract the local wall-clock time from a CentralReach timestamp such as
 * `8/24/2026 21:45`. No Date parsing, so no timezone shift is introduced.
 */
export function crClockTime(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const m = raw.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?/);
  if (!m) return null;
  let hour = Number(m[1]);
  const meridiem = m[4]?.toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (!Number.isFinite(hour) || hour > 23) return null;
  return `${String(hour).padStart(2, "0")}:${m[2]}:${(m[3] ?? "00").padStart(2, "0")}`;
}

const EVENT_START = [
  "EventStartDateTime", "Event Start DateTime", "EventStart", "StartDateTime", "Start Date Time",
];
const EVENT_END = [
  "EventEndDateTime", "Event End DateTime", "EventEnd", "EndDateTime", "End Date Time",
];


function scheduleRow(row: Record<string, unknown>): NormalizedCrRow {
  const code = resolveServiceCode(row);
  const deleted = crBool(row, ["Deleted", "IsDeleted", "Is Deleted"]);
  const cancelled = crBool(row, ["Cancelled", "Canceled", "IsCancelled", "IsCanceled"]);
  const converted = crBool(row, [
    "ConvertedToTimesheet", "Converted To Timesheet", "Converted", "HasTimesheet", "IsBilled",
  ]);
  const attendance = text(row, ["Attendance", "AttendanceStatus"]);
  const explicitStatus = text(row, ["Status", "EventStatus", "AppointmentStatus"]);
  const status =
    deleted === true
      ? "Deleted"
      : cancelled === true
        ? "Cancelled"
        : explicitStatus ?? attendanceLabel(attendance);
  return {
    event_date:
      date(row, EVENT_START) ??
      date(row, ["EventDate", "Date", "StartDate", "AppointmentDate", "DateOfService", "Start"]),

    procedure_code: code.procedureCode,
    billing_code: code.billingCode,
    billing_code_name: code.billingCodeName,
    scheduled_hours: num(row, [
      "ScheduledHours", "Scheduled Hours", "SegmentHours", "EventHours",
      "Hours", "Duration", "TimeScheduledInHours",
    ]),
    client_name: fullName(
      row,
      ["ClientFirstName", "Client First Name"],
      ["ClientLastName", "Client Last Name"],
      [...CLIENT, "Principal1Name", "Principal 1 Name"],
    ),
    provider_name: fullName(
      row,
      ["ProviderFirstName", "Provider First Name"],
      ["ProviderLastName", "Provider Last Name"],
      ["Provider", "ProviderName", "Principal2Name", "Principal 2 Name", "Employee", "EmployeeName", "StaffName", "Resource"],
    ),
    status,
    attendance,
    deleted,
    cancelled,
    converted_to_timesheet: converted,
    start_time:
      crClockTime(pickText(row, EVENT_START)) ??
      text(row, ["StartTime", "Start Time", "EventStartTime", "TimeStart"]),
    end_time:
      crClockTime(pickText(row, EVENT_END)) ??
      text(row, ["EndTime", "End Time", "EventEndTime", "TimeEnd"]),

    billing_creation_date: date(row, [
      "BillingCreationDate", "Billing Creation Date", "CreationDate", "Creation Date", "CreatedDate",
    ]),
    cancellation_reason: crReason(
      text(row, [
        "CancellationReason", "Cancellation Reason", "CancelledReason", "Cancelled Reason",
        "CancelReason", "Reason",
      ]),
    ),
    cancelled_by: crReason(text(row, ["CancelledBy", "Cancelled By", "CanceledBy"])),
    state: text(row, STATE),
    location: text(row, LOCATION),
    payor: text(row, PAYOR),
  };
}

/**
 * Per-session billing documentation metadata. Lives in
 * `cr_billing_session_status` (a mutable CURRENT table) so the immutable
 * `cr_billing_sessions` fact used by BCBA Productivity V3 is never rewritten.
 */
export function billingStatusRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    authorization_id: text(row, ["AuthorizationId", "Authorization Id", "AuthId"]),
    creation_date: date(row, ["CreationDate", "Creation Date", "CreatedDate", "DateCreated"]),
    first_bill_date: date(row, ["FirstBillDate", "First Bill Date", "FirstBilledDate"]),
    first_claim_date: date(row, ["FirstClaimDate", "First Claim Date"]),
    claims_exported: crBool(row, ["ClaimsExported", "Claims Exported", "Exported"]),
    is_void: crBool(row, ["IsVoid", "Is Void", "Void", "Voided"]),
    deleted: crBool(row, ["Deleted", "IsDeleted", "Is Deleted"]),
    signed_by_provider: crBool(row, [
      "SignedByProvider", "Signed By Provider", "ProviderSigned", "IsSignedByProvider",
    ]),
    signed_by_client: crBool(row, [
      "SignedByClient", "Signed By Client", "ClientSigned", "IsSignedByClient",
    ]),
    provider_role: text(row, ["ProviderRole", "Provider Role", "RenderingProviderRole", "Role"]),
    billing_labels: text(row, ["BillingLabels", "Billing Labels", "ProviderContactLabels", "Labels"]),
    location: text(row, LOCATION),
    delivery_method: text(row, ["DeliveryMethod", "Delivery Method", "Modality", "Telehealth"]),
    place_of_service: text(row, ["PlaceOfService", "Place of Service", "POS"]),
  };
}

function authorizationRow(row: Record<string, unknown>): NormalizedCrRow {
  const window = (base: string, legacy: string[] = []) => ({
    all: num(row, [`${base}HoursAll`, `${base} Hours All`, ...legacy.map((k) => `${k}All`)]),
    month: num(row, [`${base}HoursMonth`, `${base} Hours Month`, ...legacy.map((k) => `${k}Month`)]),
    range: num(row, [
      `${base}HoursAuthRange`,
      `${base} Hours Auth Range`,
      `${base}Hours`,
      `${base} Hours`,
      ...legacy,
    ]),
  });

  const authorizedW = window("Authorized", ["authHours"]);
  const workedW = window("Worked", ["authHoursWkd", "UsedHours", "HoursWorked"]);
  const scheduledW = window("Scheduled", ["authHoursSch"]);
  const pendingW = window("Pending", ["authHoursPending", "authHoursPend"]);
  const remainingW = window("Remaining", ["authHoursRem", "HoursRemaining"]);

  const utilAll = num(row, ["UtilizationPercentAll", "Utilization Percent All"]);
  const utilMonth = num(row, ["UtilizationPercentMonth", "Utilization Percent Month"]);
  const utilRange = num(row, [
    "UtilizationPercentAuthRange", "UtilizationPercent", "Utilization %", "UtilizationPct", "Utilization",
  ]);

  const authorized = authorizedW.range ?? authorizedW.all ?? authorizedW.month;
  const worked = workedW.range ?? workedW.all ?? workedW.month;
  const remaining = remainingW.range ?? remainingW.all ?? remainingW.month;

  const serviceCodes = text(row, ["ServiceCodes", "Service Codes", "ServiceCode", "Service Code"]);
  const clientLabels = text(row, ["ClientLabels", "Client Labels", "Labels"]);
  const activeRaw = text(row, ["IsActive", "Is Active", "Active"]);
  const isActive = activeRaw === null ? null : /^(1|y|yes|true|active)$/i.test(activeRaw.trim());
  const actualStart = date(row, ["ActualStartDate", "Actual Start Date"]);
  const actualEnd = date(row, ["ActualEndDate", "Actual End Date"]);
  const followupStart = date(row, ["FollowUpStartDate", "Follow Up Start Date", "FollowupStartDate"]);
  const followupEnd = date(row, ["FollowUpEndDate", "Follow Up End Date", "FollowupEndDate"]);
  const startDate = date(row, ["StartDate", "Start Date", "AuthStartDate", "AuthorizationStart", "FirstService"]);
  const endDate = date(row, ["EndDate", "End Date", "AuthEndDate", "AuthorizationEnd", "ExpirationDate", "LastService"]);
  const codeFromServiceCodes = (serviceCodes ?? "").match(/\d{5}/)?.[0] ?? null;
  return {
    authorization_id: text(row, ["AuthorizationId", "Authorization Id", "AuthId", "Id"]),
    authorization_number: text(row, ["AuthorizationNumber", "Authorization Number", "AuthNumber", "AuthId"]),
    followup_authorization_number: text(row, [
      "FollowUpAuthorizationNumber", "Follow Up Authorization Number",
      "FollowupAuthorizationNumber", "FollowUpAuthNumber",
    ]),
    followup_service_codes: text(row, [
      "FollowUpServiceCodes", "Follow Up Service Codes", "FollowupServiceCodes", "FollowUpServiceCode",
    ]),
    manager: text(row, ["Manager", "AuthManager", "Auth Manager", "CaseManager", "Case Manager"]),
    implementer: text(row, ["Implementer", "AuthImplementer", "Auth Implementer"]),
    frequency: text(row, ["Frequency", "AuthFrequency", "Auth Frequency"]),
    client_name: fullName(row, ["ClientFirstName"], ["ClientLastName"], CLIENT),
    client_cr_id: text(row, CLIENT_ID),
    payor: text(row, PAYOR),
    state: text(row, STATE),
    procedure_code: text(row, CODE) ?? codeFromServiceCodes,
    service_codes: serviceCodes,
    client_labels: clientLabels,
    is_active: isActive,
    actual_start_date: actualStart,
    actual_end_date: actualEnd,
    followup_start_date: followupStart,
    followup_end_date: followupEnd,
    start_date: startDate ?? actualStart,
    end_date: endDate ?? actualEnd,
    // Legacy compatibility columns stay populated for existing reports.
    authorized_hours: authorized,
    worked_hours: worked,
    remaining_hours:
      remaining ?? (authorized !== null && worked !== null ? authorized - worked : null),
    authorized_hours_all: authorizedW.all,
    authorized_hours_month: authorizedW.month,
    authorized_hours_auth_range: authorizedW.range,
    worked_hours_all: workedW.all,
    worked_hours_month: workedW.month,
    worked_hours_auth_range: workedW.range,
    scheduled_hours_all: scheduledW.all,
    scheduled_hours_month: scheduledW.month,
    scheduled_hours_auth_range: scheduledW.range,
    pending_hours_all: pendingW.all,
    pending_hours_month: pendingW.month,
    pending_hours_auth_range: pendingW.range,
    remaining_hours_all: remainingW.all,
    remaining_hours_month: remainingW.month,
    remaining_hours_auth_range: remainingW.range,
    utilization_percent_all: utilAll,
    utilization_percent_month: utilMonth,
    utilization_percent_auth_range: utilRange,
    status:
      text(row, STATUS) ??
      deriveAuthorizationStatus({
        clientLabels,
        isActive,
        endDate: actualEnd ?? endDate,
      }),
  };
}

/**
 * CentralReach authorization exports carry no status column; the workflow
 * signal lives in the pipe-delimited `ClientLabels` value plus the active flag
 * and coverage end date.
 */
export function deriveAuthorizationStatus(input: {
  clientLabels: string | null;
  isActive: boolean | null;
  endDate: string | null;
}): string {
  const labels = input.clientLabels ?? "";
  if (/denied/i.test(labels)) return "Denied";
  if (/(initial assessment|initial treatment|reassessment|concurrent treatment|telehealth)\s*approved/i.test(labels)) {
    return "Approved";
  }
  const end = input.endDate;
  if (end && end < new Date().toISOString().slice(0, 10)) return "Expired";
  if (input.isActive) return "Active";
  return "Other";
}

function utilizationRow(row: Record<string, unknown>): NormalizedCrRow {
  const authorized = num(row, [
    "AuthorizedHours", "Authorized Hours", "AuthorizedHoursWeek", "authHours",
    "AuthorizedHoursMonth", "AuthorizedHoursAll", "authUnits",
  ]);
  const used = num(row, [
    "UsedHours", "Used Hours", "WorkedHours", "authHoursWkd", "WorkedHoursAuthRange", "Hours",
  ]);
  const pct = num(row, ["UtilizationPercent", "Utilization %", "UtilizationPct", "Utilization"]);
  return {
    authorization_number: text(row, ["AuthorizationNumber", "Authorization Number", "AuthNumber"]),
    client_name: fullName(row, ["ClientFirstName"], ["ClientLastName"], CLIENT),
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
  const amount = num(row, ["BilledAmount", "Billed Amount", "Charge", "Billed", "Amount"]);
  const paid = num(row, ["PaidAmount", "Paid Amount", "Paid", "TotalPaid"]);
  return {
    claim_number: text(row, ["ClaimNumber", "Claim Number", "ClaimId", "Claim Id", "Id"]),
    client_name: fullName(row, ["ClientFirstName"], ["ClientLastName"], CLIENT),
    payor: text(row, PAYOR),
    state: text(row, STATE),
    date_of_service: date(row, [
      "DateOfService", "Date of Service", "ServiceDate", "Date", "FirstService", "LastService",
    ]),
    procedure_code: text(row, CODE),
    billed_amount: amount,
    paid_amount: paid,
    // CentralReach `Amount` has no documented unit (dollars vs cents vs units),
    // so raw values are preserved and the unit stays explicitly unknown.
    amount_raw: amount,
    paid_amount_raw: paid,
    amount_unit: "unknown",
    action_date: date(row, ["ActionDate", "Action Date"]),
    action_by: text(row, ["ActionBy", "Action By", "ActionUser", "ActionedBy"]),
    submit_reason: crReason(text(row, ["SubmitReason", "Submit Reason", "Reason"])),
    error_count: num(row, ["ErrorCount", "Error Count", "Errors"]),
    exported: crBool(row, ["ClaimsExported", "Claims Exported", "Exported", "IsExported"]),
    responses_status: text(row, ["ResponsesStatus", "Responses Status", "ResponseStatus"]),
    status: text(row, [...STATUS, "ResponsesStatus", "Responses Status"]),
  };
}

function contactRow(row: Record<string, unknown>): NormalizedCrRow {
  return {
    cr_contact_id: text(row, ["ContactId", "Contact Id", "ContactID", "CrContactId", "Id"]),
    contact_name: fullName(
      row,
      ["FirstName", "First Name"],
      ["LastName", "Last Name"],
      ["ContactName", "Contact Name", "Name", "FullName"],
    ),
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
  // Some runtimes (older browsers, test polyfills) lack File.arrayBuffer; fall
  // back to a name/size/mtime fingerprint so imports still get a stable hash.
  const bytes =
    typeof file.arrayBuffer === "function"
      ? new Uint8Array(await file.arrayBuffer())
      : new TextEncoder().encode(`${file.name}:${file.size}:${file.lastModified ?? 0}`);
  const buffer = bytes;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < buffer.length; i += 1) {
    h1 = Math.imul(h1 ^ buffer[i], 16777619) >>> 0;
    h2 = Math.imul(h2 + buffer[i] + i, 2246822519) >>> 0;
  }
  const size = (file.size >>> 0).toString(16).padStart(8, "0");
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}${size}`;
}
