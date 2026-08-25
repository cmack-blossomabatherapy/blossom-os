/**
 * CentralReach upload auto-detection.
 *
 * A single unified upload page accepts any CentralReach daily export and
 * routes each file to the correct downstream store based on its column
 * signature.
 */

export type CRUploadKind =
  | "billing"
  | "scheduling"
  | "authorization"
  | "utilization"
  | "claims"
  | "contacts"
  | "payments"
  | "era_payments"
  | "timesheet"
  | "unknown";

export interface CRUploadDetection {
  kind: CRUploadKind;
  confidence: number;
  label: string;
  targets: string[]; // human-facing list of reports this file will power
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

function hasAll(set: Set<string>, cands: string[]) {
  return cands.every((c) => set.has(norm(c)));
}
function hasAny(set: Set<string>, cands: string[]) {
  return cands.some((c) => set.has(norm(c)));
}

/**
 * Detect the CentralReach export type from a header row.
 */
export function detectCentralReachUpload(headers: string[]): CRUploadDetection {
  const set = new Set(headers.map(norm));

  // ERA payment detail export — remittance-level reconciliation summary.
  if (
    hasAny(set, ["ERA Labels", "ERALabels"]) ||
    (hasAny(set, ["Reconcile Status", "ReconcileStatus"]) &&
      hasAny(set, ["Check Number", "CheckNumber"]))
  ) {
    return {
      kind: "era_payments",
      confidence: 0.95,
      label: "ERA payment detail export",
      targets: ["Payment Reconciliation"],
    };
  }

  // Payments export — payment-level ledger keyed by CentralReach payment Id.
  if (
    hasAny(set, ["PaymentType", "Payment Type"]) &&
    hasAny(set, ["RecordDate", "Record Date", "Amount", "IsCopay", "BillingEntryId"])
  ) {
    return {
      kind: "payments",
      confidence: 0.94,
      label: "Payments export",
      targets: ["Payment Reconciliation"],
    };
  }

  // Timesheet / documentation export. MUST be checked before the generic
  // billing detector: it shares DateOfService/ProcedureCode/TimeWorkedInHours
  // but is documentation status only and never a billing fact.
  if (
    hasAny(set, ["TimeWorkedInHours", "Time Worked In Hours", "TimeWorkedInMins"]) &&
    hasAny(set, [
      "ClientSignature",
      "ProviderSignature",
      "IsLocked",
      "IsVoid",
      "TasksCompleted",
      "Tasks",
    ])
  ) {
    return {
      kind: "timesheet",
      confidence: 0.95,
      label: "Timesheet / documentation export",
      targets: ["Documentation status (Commit to Submit readiness)"],
    };
  }

  // Authorization utilization export — hour-based utilization by week.
  if (
    hasAny(set, ["UtilizationPercent", "Utilization %", "UtilizationPct"]) &&
    hasAny(set, ["WeekStart", "Week Start", "WeekOf", "WeekEnding"])
  ) {
    return {
      kind: "utilization",
      confidence: 0.94,
      label: "Authorization utilization export",
      targets: ["Authorization Utilization - Hour Based"],
    };
  }

  // Claims export — claim identifiers + billed/paid amounts.
  if (
    hasAny(set, ["ClaimNumber", "Claim Number", "ClaimId"]) &&
    hasAny(set, ["BilledAmount", "Billed Amount", "PaidAmount", "Paid Amount"])
  ) {
    return {
      kind: "claims",
      confidence: 0.93,
      label: "Claims export",
      targets: ["Authorization Analysis (claim coverage)"],
    };
  }

  // Claims export (live CentralReach headers) — client + amounts + service window.
  if (
    hasAny(set, ["ClientName", "ClientFullName"]) &&
    hasAny(set, ["TotalPaid", "Amount"]) &&
    hasAny(set, ["FirstService", "LastService", "ResponsesStatus"])
  ) {
    return {
      kind: "claims",
      confidence: 0.9,
      label: "Claims export",
      targets: ["Authorization Analysis (claim coverage)"],
    };
  }

  // Scheduling export — has Course/Segment/Event columns.
  if (
    hasAll(set, ["Course", "Segment", "Event"]) &&
    hasAny(set, ["Cancelled", "CancelledOn", "Attendance"])
  ) {
    return {
      kind: "scheduling",
      confidence: 0.95,
      label: "Scheduling / Cancellation export",
      targets: ["Cancellation Command Center"],
    };
  }

  // Authorization export — has AuthorizationNumber + WorkedHours + AuthorizedHours.
  if (
    hasAny(set, ["AuthorizationNumber", "Authorization Number"]) &&
    hasAny(set, ["AuthorizedHoursMonth", "AuthorizedHoursAll"])
  ) {
    return {
      kind: "authorization",
      confidence: 0.95,
      label: "Authorization export",
      targets: [
        "Authorization Analysis",
        "Authorization Utilization - Hour Based",
        "Cancellation Command Center (auth coverage)",
      ],
    };
  }

  // Billing export — has DateOfService + TimeWorkedInHours + ProcedureCode.
  if (
    hasAny(set, ["DateOfService", "Date of Service"]) &&
    hasAny(set, ["TimeWorkedInHours", "Time Worked In Hours", "TimeWorkedInMins"]) &&
    hasAny(set, ["ProcedureCode", "Procedure Code"])
  ) {
    return {
      kind: "billing",
      confidence: 0.95,
      label: "Billing export",
      targets: [
        "BCBA Productivity Report V3",
        "Parent Training",
        "BCBA Supervision",
        "Cancellation Command Center (lost revenue)",
      ],
    };
  }

  // Payor-level authorization utilization summary (no WeekStart column).
  if (
    hasAny(set, ["PayorName", "Payor"]) &&
    hasAny(set, ["authHours", "authHoursWkd", "authHoursRem", "authUnits", "authAmount"])
  ) {
    return {
      kind: "utilization",
      confidence: 0.88,
      label: "Authorization utilization summary export",
      targets: ["Authorization Utilization - Hour Based"],
    };
  }

  // Contacts export — CentralReach contact directory.
  if (
    hasAny(set, ["ContactId", "Contact Id", "ContactID"]) &&
    hasAny(set, ["ContactType", "Contact Type", "ContactLabels", "Labels"])
  ) {
    return {
      kind: "contacts",
      confidence: 0.9,
      label: "Contacts export",
      targets: ["Client & staff match queues"],
    };
  }

  // Contacts export (live CentralReach headers) — split names + type/labels/email.
  if (
    hasAll(set, ["FirstName", "LastName"]) &&
    hasAny(set, ["Type", "Labels", "Email", "TypeId", "PermissionId", "IsActive"])
  ) {
    return {
      kind: "contacts",
      confidence: hasAny(set, ["PermissionId", "TypeId", "IsActive"]) ? 0.9 : 0.82,
      label: "Contacts export",
      targets: ["Client & staff match queues"],
    };
  }

  return {
    kind: "unknown",
    confidence: 0,
    label: "Unknown format",
    targets: [],
  };
}

/**
 * Read the first CSV line without loading the whole file — enough to auto-detect.
 * For XLSX we fall back to letting the caller parse a small preview.
 */
export async function readCsvHeaderLine(file: File): Promise<string[] | null> {
  if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") return null;
  const slice = file.slice(0, 32 * 1024);
  const text = await slice.text();
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  if (!firstLine) return null;
  // Split on commas but respect simple quoted values.
  const cols: string[] = [];
  let cur = "";
  let inQ = false;
  for (const ch of firstLine) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { cols.push(cur); cur = ""; continue; }
    cur += ch;
  }
  cols.push(cur);
  return cols.map((c) => c.trim().replace(/^"|"$/g, ""));
}