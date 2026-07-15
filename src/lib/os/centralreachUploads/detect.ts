/**
 * CentralReach upload auto-detection.
 *
 * A single unified upload page accepts any CentralReach daily export and
 * routes each file to the correct downstream store based on its column
 * signature.
 */

export type CRUploadKind = "billing" | "scheduling" | "authorization" | "unknown";

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