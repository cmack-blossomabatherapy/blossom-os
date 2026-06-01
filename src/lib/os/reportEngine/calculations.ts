import type {
  CanonicalField, ColumnMapping, ComputedKpi, ComputedSection,
  DataQualityIssue, ParsedFile, Preset, ReportComputation,
} from "./types";
import { inverseMapping, validateRequiredFields } from "./mapper";
import { num } from "./csv";

/** Normalize procedure codes to a 5-digit CPT when possible. */
export function normalizeProcedureCode(raw: string | undefined | null): string {
  if (!raw) return "";
  const s = String(raw).toUpperCase().trim();
  const m = s.match(/\b(\d{5})\b/);
  return m ? m[1] : s;
}

/** Build a flat row stream across all files using each file's mapping. */
export interface CanonicalRow {
  client_name?: string;
  client_id?: string;
  provider_name?: string;
  procedure_code?: string;
  service_date?: string;
  worked_hours?: number;
  authorized_hours?: number;
  pending_hours?: number;
  remaining_hours?: number;
  cancellation_reason?: string;
  session_status?: string;
  authorization_number?: string;
  payor?: string;
  state?: string;
  __file: string;
}

export function buildCanonicalRows(
  files: ParsedFile[],
  mappings: ColumnMapping[],
): CanonicalRow[] {
  const out: CanonicalRow[] = [];
  files.forEach((f, idx) => {
    const mapping = mappings[idx] ?? {};
    const inv = inverseMapping(mapping);
    for (const r of f.rows) {
      const cr: CanonicalRow = { __file: f.fileName };
      for (const [canon, header] of Object.entries(inv) as [CanonicalField, string][]) {
        const val = r[header];
        if (val == null || val === "") continue;
        if (canon === "procedure_code") cr.procedure_code = normalizeProcedureCode(val);
        else if (canon === "worked_hours" || canon === "authorized_hours" || canon === "pending_hours" || canon === "remaining_hours") {
          (cr as any)[canon] = num(val);
        } else {
          (cr as any)[canon] = String(val).trim();
        }
      }
      out.push(cr);
    }
  });
  return out;
}

// ============================================================================
// Calculation primitives
// ============================================================================

const SUPERVISION_CODE = "97155";
const DIRECT_CODE = "97153";
const PARENT_TRAINING_CODE = "97156";

function pct(n: number, d: number) {
  if (!d) return 0;
  return (n / d) * 100;
}
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }
function fmtHours(n: number) { return `${n.toFixed(1)} hrs`; }

export interface SupervisionRow {
  client: string;
  direct: number;
  supervision: number;
  supervisionPct: number;
  flag: "ok" | "missing" | "under_5" | "under_10";
}

export function calculateSupervision(rows: CanonicalRow[]): {
  perClient: SupervisionRow[];
  averagePct: number;
  totalDirect: number;
  totalSupervision: number;
} {
  const byClient = new Map<string, { direct: number; supervision: number }>();
  for (const r of rows) {
    const client = r.client_name;
    const code = r.procedure_code;
    const hours = r.worked_hours ?? 0;
    if (!client || !code) continue;
    const cur = byClient.get(client) ?? { direct: 0, supervision: 0 };
    if (code === DIRECT_CODE) cur.direct += hours;
    if (code === SUPERVISION_CODE) cur.supervision += hours;
    byClient.set(client, cur);
  }
  const perClient: SupervisionRow[] = [];
  let totalDirect = 0, totalSupervision = 0, pctSum = 0, pctCount = 0;
  for (const [client, { direct, supervision }] of byClient) {
    if (direct === 0 && supervision === 0) continue;
    totalDirect += direct;
    totalSupervision += supervision;
    const p = pct(supervision, direct);
    let flag: SupervisionRow["flag"] = "ok";
    if (supervision === 0) flag = "missing";
    else if (p < 5) flag = "under_5";
    else if (p < 10) flag = "under_10";
    if (direct > 0) { pctSum += p; pctCount++; }
    perClient.push({ client, direct, supervision, supervisionPct: p, flag });
  }
  perClient.sort((a, b) => a.supervisionPct - b.supervisionPct);
  return {
    perClient,
    averagePct: pctCount ? pctSum / pctCount : 0,
    totalDirect,
    totalSupervision,
  };
}

export interface ParentTrainingRow {
  client: string;
  hours: number;
  hasTraining: boolean;
}

export function calculateParentTraining(rows: CanonicalRow[]): {
  perClient: ParentTrainingRow[];
  totalHours: number;
  withCount: number;
  withoutCount: number;
  withPct: number;
} {
  const byClient = new Map<string, number>();
  // Seed all clients seen anywhere so "without parent training" is meaningful
  for (const r of rows) {
    if (r.client_name) byClient.set(r.client_name, byClient.get(r.client_name) ?? 0);
  }
  for (const r of rows) {
    if (r.client_name && r.procedure_code === PARENT_TRAINING_CODE) {
      byClient.set(r.client_name, (byClient.get(r.client_name) ?? 0) + (r.worked_hours ?? 0));
    }
  }
  const perClient: ParentTrainingRow[] = [];
  let totalHours = 0, withCount = 0;
  for (const [client, hours] of byClient) {
    perClient.push({ client, hours, hasTraining: hours > 0 });
    totalHours += hours;
    if (hours > 0) withCount++;
  }
  perClient.sort((a, b) => Number(a.hasTraining) - Number(b.hasTraining) || a.client.localeCompare(b.client));
  const total = perClient.length;
  return {
    perClient,
    totalHours,
    withCount,
    withoutCount: total - withCount,
    withPct: total ? (withCount / total) * 100 : 0,
  };
}

export interface AuthRow {
  client: string;
  authNumber: string;
  procedure: string;
  authorized: number;
  worked: number;
  pending: number;
  remaining: number;
  utilizationPct: number;
  flag: "ok" | "low" | "near_max" | "over" | "missing_auth";
}

export function calculateAuthorizationUtilization(rows: CanonicalRow[]): AuthRow[] {
  const key = (r: CanonicalRow) =>
    `${r.client_name ?? "?"}\u0001${r.authorization_number ?? ""}\u0001${r.procedure_code ?? ""}`;
  const agg = new Map<string, AuthRow>();
  for (const r of rows) {
    if (!r.client_name) continue;
    const k = key(r);
    const cur = agg.get(k) ?? {
      client: r.client_name,
      authNumber: r.authorization_number ?? "",
      procedure: r.procedure_code ?? "",
      authorized: 0, worked: 0, pending: 0, remaining: 0,
      utilizationPct: 0, flag: "ok" as AuthRow["flag"],
    };
    cur.authorized += r.authorized_hours ?? 0;
    cur.worked += r.worked_hours ?? 0;
    cur.pending += r.pending_hours ?? 0;
    cur.remaining += r.remaining_hours ?? 0;
    agg.set(k, cur);
  }
  const out: AuthRow[] = [];
  for (const row of agg.values()) {
    if (row.authorized === 0 && row.worked === 0) continue;
    if (!row.authNumber && row.authorized === 0) { row.flag = "missing_auth"; }
    row.utilizationPct = row.authorized > 0 ? pct(row.worked, row.authorized) : 0;
    if (row.flag !== "missing_auth") {
      if (row.utilizationPct > 100) row.flag = "over";
      else if (row.utilizationPct >= 90) row.flag = "near_max";
      else if (row.utilizationPct < 50 && row.authorized > 0) row.flag = "low";
    }
    out.push(row);
  }
  out.sort((a, b) => a.utilizationPct - b.utilizationPct);
  return out;
}

export interface CancellationStats {
  total: number;
  byReason: { reason: string; count: number; classification: string }[];
  byClient: { client: string; count: number }[];
  topReasons: string[];
  repeatOffenders: { client: string; count: number }[];
  rows: { client: string; provider: string; procedure: string; date: string; reason: string; classification: string }[];
}

function classifyReason(reason: string): string {
  const r = reason.toLowerCase();
  if (!r) return "other";
  if (/no.?show|nogo/.test(r)) return "no-show";
  if (/sick|ill|fever|covid|flu|hospital/.test(r)) return "illness";
  if (/weather|storm|snow|hurric|rain/.test(r)) return "weather";
  if (/client|parent|family|caregiver/.test(r)) return "client";
  if (/provider|rbt|bcba|staff|therapist|callout|call.?out/.test(r)) return "provider";
  return "other";
}

export function calculateCancellations(rows: CanonicalRow[]): CancellationStats {
  const cancelled = rows.filter(r => {
    const s = (r.session_status ?? "").toLowerCase();
    return /cancel|no.?show/.test(s);
  });
  const byReasonMap = new Map<string, number>();
  const byClientMap = new Map<string, number>();
  const outRows: CancellationStats["rows"] = [];
  for (const r of cancelled) {
    const reason = (r.cancellation_reason ?? "Unspecified").trim() || "Unspecified";
    byReasonMap.set(reason, (byReasonMap.get(reason) ?? 0) + 1);
    const client = r.client_name ?? "Unknown";
    byClientMap.set(client, (byClientMap.get(client) ?? 0) + 1);
    outRows.push({
      client,
      provider: r.provider_name ?? "",
      procedure: r.procedure_code ?? "",
      date: r.service_date ?? "",
      reason,
      classification: classifyReason(reason),
    });
  }
  const byReason = [...byReasonMap.entries()]
    .map(([reason, count]) => ({ reason, count, classification: classifyReason(reason) }))
    .sort((a, b) => b.count - a.count);
  const byClient = [...byClientMap.entries()]
    .map(([client, count]) => ({ client, count }))
    .sort((a, b) => b.count - a.count);
  const repeatOffenders = byClient.filter(c => c.count >= 3);
  return {
    total: cancelled.length,
    byReason,
    byClient,
    topReasons: byReason.slice(0, 5).map(r => r.reason),
    repeatOffenders,
    rows: outRows,
  };
}

// ============================================================================
// Data quality
// ============================================================================

export function generateDataQualityFlags(
  rows: CanonicalRow[],
  mappings: ColumnMapping[],
  required: CanonicalField[],
): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];
  // Combine all detected canonicals across files
  const presentFields = new Set<string>();
  for (const m of mappings) {
    for (const v of Object.values(m)) if (v) presentFields.add(v);
  }
  for (const f of required) {
    if (!presentFields.has(f)) {
      issues.push({
        label: `Missing column for "${f}"`,
        detail: `Unable to calculate metrics that depend on ${f}. Map the correct column or upload a CSV that contains it.`,
      });
    }
  }
  const missingClient = rows.filter(r => !r.client_name).length;
  const missingDate = rows.filter(r => !r.service_date).length;
  const missingCode = rows.filter(r => !r.procedure_code).length;
  if (missingClient) issues.push({ label: "Rows missing client name", detail: `${missingClient} row(s) excluded from per-client calculations.`, rowsAffected: missingClient });
  if (missingDate) issues.push({ label: "Rows missing service date", detail: `${missingDate} row(s) without a usable date.`, rowsAffected: missingDate });
  if (missingCode) issues.push({ label: "Rows missing procedure code", detail: `${missingCode} row(s) excluded from CPT-based calculations.`, rowsAffected: missingCode });
  return issues;
}

// ============================================================================
// Section builders
// ============================================================================

function unavailableSection(id: string, title: string, missing: CanonicalField[]): ComputedSection {
  return {
    id,
    title,
    unavailable: `Unable to calculate because the uploaded CSV does not contain: ${missing.join(", ")}.`,
  };
}

function execSummaryKpis(rows: CanonicalRow[]): ComputedKpi[] {
  const clients = new Set(rows.map(r => r.client_name).filter(Boolean) as string[]);
  const totalWorked = rows.reduce((s, r) => s + (r.worked_hours ?? 0), 0);
  const hoursBy = (code: string) =>
    rows.filter(r => r.procedure_code === code).reduce((s, r) => s + (r.worked_hours ?? 0), 0);
  return [
    { label: "Clients reviewed", value: String(clients.size), raw: clients.size },
    { label: "Total worked hours", value: fmtHours(totalWorked), raw: totalWorked },
    { label: "97153 (direct)", value: fmtHours(hoursBy(DIRECT_CODE)), raw: hoursBy(DIRECT_CODE) },
    { label: "97155 (supervision)", value: fmtHours(hoursBy(SUPERVISION_CODE)), raw: hoursBy(SUPERVISION_CODE) },
    { label: "97156 (parent training)", value: fmtHours(hoursBy(PARENT_TRAINING_CODE)), raw: hoursBy(PARENT_TRAINING_CODE) },
  ];
}

function supervisionSection(rows: CanonicalRow[], presentFields: Set<string>): ComputedSection {
  const required: CanonicalField[] = ["client_name", "procedure_code", "worked_hours"];
  const missing = required.filter(f => !presentFields.has(f));
  if (missing.length) return unavailableSection("supervision", "Supervision (97155 / 97153)", missing);
  const sup = calculateSupervision(rows);
  const tableRows = sup.perClient.slice(0, 100).map(r => [
    r.client,
    Number(r.direct.toFixed(1)),
    Number(r.supervision.toFixed(1)),
    fmtPct(r.supervisionPct),
    r.flag === "ok" ? "✓" : r.flag === "missing" ? "Missing 97155" : r.flag === "under_5" ? "Under 5%" : "Under 10%",
  ]);
  const flagged = sup.perClient.filter(r => r.flag !== "ok");
  return {
    id: "supervision",
    title: "Supervision (97155 / 97153)",
    narrative: `Average supervision % across ${sup.perClient.length} clients is ${fmtPct(sup.averagePct)}. ${flagged.length} client(s) flagged.`,
    table: { columns: ["Client", "97153 hrs", "97155 hrs", "Supervision %", "Flag"], rows: tableRows },
    chart: {
      type: "bar",
      labels: sup.perClient.slice(0, 12).map(r => r.client),
      series: [{ name: "Supervision %", data: sup.perClient.slice(0, 12).map(r => Number(r.supervisionPct.toFixed(1))) }],
    },
    insights: [
      `${sup.perClient.filter(r => r.flag === "missing").length} client(s) have no 97155 supervision recorded.`,
      `${sup.perClient.filter(r => r.flag === "under_5").length} client(s) under 5% supervision.`,
      `${sup.perClient.filter(r => r.flag === "under_10").length} client(s) under 10% supervision.`,
    ],
  };
}

function parentTrainingSection(rows: CanonicalRow[], presentFields: Set<string>): ComputedSection {
  const required: CanonicalField[] = ["client_name", "procedure_code", "worked_hours"];
  const missing = required.filter(f => !presentFields.has(f));
  if (missing.length) return unavailableSection("parent_training", "Parent Training (97156)", missing);
  const pt = calculateParentTraining(rows);
  const tableRows = pt.perClient.slice(0, 100).map(r => [
    r.client, Number(r.hours.toFixed(1)), r.hasTraining ? "Yes" : "No",
  ]);
  return {
    id: "parent_training",
    title: "Parent Training (97156)",
    narrative: `${pt.withCount} of ${pt.perClient.length} client(s) had parent training (${fmtPct(pt.withPct)}). Total 97156 hours: ${fmtHours(pt.totalHours)}.`,
    table: { columns: ["Client", "97156 hrs", "Has training"], rows: tableRows },
    chart: {
      type: "pie",
      labels: ["With parent training", "Without"],
      series: [{ name: "Clients", data: [pt.withCount, pt.withoutCount] }],
    },
    insights: [
      `${pt.withoutCount} client(s) had no parent training in the dataset.`,
      `Total 97156 hours: ${fmtHours(pt.totalHours)}.`,
    ],
  };
}

function authSection(rows: CanonicalRow[], presentFields: Set<string>): ComputedSection {
  const required: CanonicalField[] = ["client_name", "authorized_hours", "worked_hours"];
  const missing = required.filter(f => !presentFields.has(f));
  if (missing.length) return unavailableSection("auth_utilization", "Authorization Utilization", missing);
  const auth = calculateAuthorizationUtilization(rows);
  const tableRows = auth.slice(0, 100).map(r => [
    r.client, r.authNumber || "—", r.procedure || "—",
    Number(r.authorized.toFixed(1)), Number(r.worked.toFixed(1)),
    Number(r.pending.toFixed(1)), Number(r.remaining.toFixed(1)),
    fmtPct(r.utilizationPct),
    r.flag === "ok" ? "✓" : r.flag.replace("_", " "),
  ]);
  const flagCounts = auth.reduce((acc, r) => {
    acc[r.flag] = (acc[r.flag] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return {
    id: "auth_utilization",
    title: "Authorization Utilization",
    narrative: `${auth.length} authorization rows. ${(flagCounts.low ?? 0)} low, ${(flagCounts.near_max ?? 0)} near-max, ${(flagCounts.over ?? 0)} over, ${(flagCounts.missing_auth ?? 0)} missing auth.`,
    table: {
      columns: ["Client", "Auth #", "CPT", "Authorized", "Worked", "Pending", "Remaining", "Utilization %", "Flag"],
      rows: tableRows,
    },
    chart: {
      type: "bar",
      labels: auth.slice(0, 12).map(r => `${r.client}${r.procedure ? " · " + r.procedure : ""}`),
      series: [{ name: "Utilization %", data: auth.slice(0, 12).map(r => Number(r.utilizationPct.toFixed(1))) }],
    },
    insights: [
      `${flagCounts.low ?? 0} auth(s) under 50% utilization.`,
      `${flagCounts.near_max ?? 0} auth(s) at or above 90%.`,
      `${flagCounts.over ?? 0} auth(s) over 100% — review for compliance.`,
    ],
  };
}

function cancellationSection(rows: CanonicalRow[], presentFields: Set<string>): ComputedSection {
  const required: CanonicalField[] = ["session_status"];
  const missing = required.filter(f => !presentFields.has(f));
  if (missing.length) return unavailableSection("cancellations", "Cancellations", missing);
  const c = calculateCancellations(rows);
  const tableRows = c.byReason.slice(0, 50).map(r => [r.reason, r.classification, r.count]);
  return {
    id: "cancellations",
    title: "Cancellations",
    narrative: `${c.total} cancelled session(s). ${c.repeatOffenders.length} client(s) with 3 or more cancellations.`,
    table: { columns: ["Reason", "Classification", "Count"], rows: tableRows },
    chart: {
      type: "bar",
      labels: c.byReason.slice(0, 8).map(r => r.reason),
      series: [{ name: "Cancellations", data: c.byReason.slice(0, 8).map(r => r.count) }],
    },
    insights: [
      c.topReasons.length ? `Top reasons: ${c.topReasons.join(", ")}.` : "No reasons captured in data.",
      c.repeatOffenders.length
        ? `Repeat offenders: ${c.repeatOffenders.slice(0, 5).map(r => `${r.client} (${r.count})`).join(", ")}.`
        : "No clients with 3+ cancellations.",
    ],
  };
}

function codeBreakdownSection(rows: CanonicalRow[], presentFields: Set<string>): ComputedSection {
  const required: CanonicalField[] = ["procedure_code", "worked_hours"];
  const missing = required.filter(f => !presentFields.has(f));
  if (missing.length) return unavailableSection("billing", "Hours by procedure code", missing);
  const byCode = new Map<string, number>();
  for (const r of rows) {
    if (!r.procedure_code) continue;
    byCode.set(r.procedure_code, (byCode.get(r.procedure_code) ?? 0) + (r.worked_hours ?? 0));
  }
  const entries = [...byCode.entries()].sort((a, b) => b[1] - a[1]);
  return {
    id: "billing",
    title: "Hours by procedure code",
    narrative: `${entries.length} distinct procedure code(s). Totals across all files.`,
    table: {
      columns: ["Procedure code", "Hours"],
      rows: entries.map(([code, hrs]) => [code, Number(hrs.toFixed(1))]),
    },
    chart: {
      type: "bar",
      labels: entries.slice(0, 12).map(([c]) => c),
      series: [{ name: "Hours", data: entries.slice(0, 12).map(([, h]) => Number(h.toFixed(1))) }],
    },
  };
}

// ============================================================================
// Top-level
// ============================================================================

export function runReport({
  files,
  mappings,
  preset,
}: {
  files: ParsedFile[];
  mappings: ColumnMapping[];
  preset: Preset;
}): ReportComputation {
  const rows = buildCanonicalRows(files, mappings);
  const presentFields = new Set<string>();
  for (const m of mappings) for (const v of Object.values(m)) if (v) presentFields.add(v);

  // Date range across all files
  const ranges = files.map(f => f.dateRange).filter(Boolean) as { min: string; max: string }[];
  const dateRange = ranges.length
    ? {
        min: ranges.map(r => r.min).sort()[0],
        max: ranges.map(r => r.max).sort().slice(-1)[0],
      }
    : null;

  const kpis = execSummaryKpis(rows);
  const sections: ComputedSection[] = [];

  switch (preset.key) {
    case "supervision":
      sections.push(supervisionSection(rows, presentFields));
      break;
    case "parent_training":
      sections.push(parentTrainingSection(rows, presentFields));
      break;
    case "auth_utilization":
      sections.push(authSection(rows, presentFields));
      break;
    case "cancellation":
      sections.push(cancellationSection(rows, presentFields));
      break;
    case "billing":
      sections.push(codeBreakdownSection(rows, presentFields));
      break;
    case "monthly_ops":
    case "custom":
    default:
      sections.push(supervisionSection(rows, presentFields));
      sections.push(parentTrainingSection(rows, presentFields));
      sections.push(authSection(rows, presentFields));
      sections.push(cancellationSection(rows, presentFields));
      sections.push(codeBreakdownSection(rows, presentFields));
      break;
  }

  const { missing } = validateRequiredFields(mappings[0] ?? {}, preset.required);
  // Aggregate across all mappings — preset is satisfied if any file provides each field
  const aggregateMissing = preset.required.filter(f => !presentFields.has(f));

  const dq = generateDataQualityFlags(rows, mappings, preset.required);

  const notes: string[] = [];
  for (const s of sections) {
    if (s.unavailable) notes.push(`${s.title}: ${s.unavailable}`);
  }

  return {
    presetKey: preset.key,
    presetTitle: preset.title,
    totalRows: rows.length,
    totalFiles: files.length,
    dateRange,
    kpis,
    sections,
    dataQuality: dq,
    missingFields: aggregateMissing.length ? aggregateMissing : missing,
    notes,
  };
}

/** Convenience helpers used by callers. */
export {
  // re-export normalize for callers
  normalizeProcedureCode as normalizeProcedureCodes,
};