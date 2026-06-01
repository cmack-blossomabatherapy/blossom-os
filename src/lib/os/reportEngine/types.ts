/**
 * Canonical fields the engine understands. The column mapper translates raw
 * CSV headers into these.
 */
export type CanonicalField =
  | "client_name"
  | "client_id"
  | "provider_name"
  | "procedure_code"
  | "service_date"
  | "worked_hours"
  | "authorized_hours"
  | "pending_hours"
  | "remaining_hours"
  | "cancellation_reason"
  | "session_status"
  | "authorization_number"
  | "payor"
  | "state";

export const ALL_CANONICAL_FIELDS: CanonicalField[] = [
  "client_name", "client_id", "provider_name", "procedure_code",
  "service_date", "worked_hours", "authorized_hours", "pending_hours",
  "remaining_hours", "cancellation_reason", "session_status",
  "authorization_number", "payor", "state",
];

export const FIELD_LABELS: Record<CanonicalField, string> = {
  client_name: "Client",
  client_id: "Client ID",
  provider_name: "Provider / BCBA / RBT",
  procedure_code: "Procedure code (CPT)",
  service_date: "Service date",
  worked_hours: "Worked / billed hours",
  authorized_hours: "Authorized hours",
  pending_hours: "Pending hours",
  remaining_hours: "Remaining hours",
  cancellation_reason: "Cancellation reason",
  session_status: "Session status",
  authorization_number: "Authorization #",
  payor: "Payor",
  state: "State",
};

/** Map of original header → canonical field (or "" for unmapped/ignored). */
export type ColumnMapping = Record<string, CanonicalField | "">;

export interface ParsedFile {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  dateRange?: { min: string; max: string } | null;
}

export interface InspectionResult {
  fileName: string;
  detected: Partial<Record<CanonicalField, string>>; // canonical → original header
  missing: CanonicalField[];
  dateRange: { min: string; max: string } | null;
  rowCount: number;
  columnCount: number;
  /** Suggested mapping (header → canonical). User can override. */
  mapping: ColumnMapping;
}

export type PresetKey =
  | "monthly_ops"
  | "auth_utilization"
  | "cancellation"
  | "supervision"
  | "parent_training"
  | "billing"
  | "custom";

export interface Preset {
  key: PresetKey;
  title: string;
  description: string;
  /** Canonical fields required to fully compute this report. */
  required: CanonicalField[];
  /** Prompt template auto-filled into the prompt area. */
  prompt: string;
}

export interface CalculationFlag {
  severity: "low" | "med" | "high";
  label: string;
  note?: string;
}

export interface DataQualityIssue {
  label: string;
  detail: string;
  rowsAffected?: number;
}

export interface ComputedKpi {
  label: string;
  value: string;
  raw?: number;
  hint?: string;
}

export interface ComputedTable {
  columns: string[];
  rows: (string | number)[][];
}

export interface ComputedSection {
  id: string;
  title: string;
  narrative?: string;
  table?: ComputedTable;
  chart?: {
    type: "bar" | "line" | "pie" | "stacked-bar" | "area";
    labels: string[];
    series: { name: string; data: number[] }[];
  };
  insights?: string[];
  /** Set when section could not be computed due to missing columns. */
  unavailable?: string;
}

export interface ReportComputation {
  presetKey: PresetKey;
  presetTitle: string;
  totalRows: number;
  totalFiles: number;
  dateRange: { min: string; max: string } | null;
  kpis: ComputedKpi[];
  sections: ComputedSection[];
  dataQuality: DataQualityIssue[];
  missingFields: CanonicalField[];
  /** Inline notes the AI should mention (e.g. "Auth utilization unavailable"). */
  notes: string[];
}