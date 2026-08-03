/**
 * Shared operator-dashboard model for the 7 non-BCBA primary CentralReach
 * reports (BCBA Productivity V3 keeps its own dedicated page and ownership
 * inference — nothing here touches it).
 *
 * Every report is expressed as: normalized `cr_*` rows -> tolerant facts ->
 * filtered facts -> KPI scorecards + charts + grouped table + drilldown rows.
 * All extraction is tolerant (typed column first, raw payload fallback) so a
 * report never blanks out a value that exists in the CentralReach export.
 */
import { normalizeCode, hoursOf } from "./metrics/codes";
import {
  isCancelledEvent,
  normalizeCancellationReason,
} from "./metrics/cancellation";
import { supervisionBand } from "./metrics/supervision";
import { utilizationPct, utilizationBand } from "./metrics/authorizationUtilization";
import { classifyAuthStatus, classifyPauseReason } from "./metrics/authorizationAnalysis";
import {
  AUTH_DRILLDOWN_COLUMNS,
  BILLING_DRILLDOWN_COLUMNS,
  SCHEDULE_DRILLDOWN_COLUMNS,
  UTILIZATION_DRILLDOWN_COLUMNS,
  projectAuthRows,
  projectBillingRows,
  projectScheduleRows,
  projectUtilizationRows,
} from "./drilldown";
import { classifyAuthKind } from "./metrics/authorizationAnalysis";
import { pickNumber, pickText } from "./tolerant";
import { fmtCount, fmtHours, fmtPct, weekStart } from "./format";
import { matchesFilters } from "./filters";
import type { CrDataset } from "@/hooks/useCrPrimaryReport";
import type {
  ChartDatum,
  CrAuthorizationRow,
  CrBillingSessionRow,
  CrScheduleEventRow,
  CrUtilizationRow,
  KpiDefinition,
  PrimaryReportFilters,
} from "./types";

/** The 7 primary reports served by the shared operator dashboard. */
export const SHARED_PRIMARY_REPORT_IDS = [
  "cancellation-command-center",
  "authorization-analysis",
  "authorization-utilization-hour-based",
  "bcba-performance",
  "bcba-supervision",
  "parent-training",
  "progress-reports",
] as const;

export type SharedPrimaryReportId = (typeof SHARED_PRIMARY_REPORT_IDS)[number];

export function isSharedPrimaryReport(id: string | null | undefined): id is SharedPrimaryReportId {
  return !!id && (SHARED_PRIMARY_REPORT_IDS as readonly string[]).includes(id);
}

/** Dimension a chart / table / drilldown can group by. */
export type FactDim =
  | "state"
  | "client"
  | "provider"
  | "payor"
  | "code"
  | "location"
  | "status"
  | "reason"
  | "week";

/** One normalized CentralReach row projected into a report-agnostic fact. */
export interface ReportFact {
  id: string;
  date: string;
  endDate?: string;
  state: string;
  client: string;
  provider: string;
  payor: string;
  code: string;
  location: string;
  status: string;
  reason: string;
  week: string;
  hours: number;
  authorized: number;
  used: number;
  remaining: number;
  cancelled: boolean;
  /** Source row projected for the drilldown table (raw CR fields + match context). */
  source: Record<string, unknown>;
}

const asRow = (r: unknown) => r as Record<string, unknown>;

function baseFact(over: Partial<ReportFact> & { id: string; source: Record<string, unknown> }): ReportFact {
  return {
    date: "",
    state: "",
    client: "",
    provider: "",
    payor: "",
    code: "",
    location: "",
    status: "",
    reason: "",
    week: "",
    hours: 0,
    authorized: 0,
    used: 0,
    remaining: 0,
    cancelled: false,
    ...over,
  };
}

export function billingFacts(rows: CrBillingSessionRow[]): ReportFact[] {
  const source = projectBillingRows(rows);
  return rows.map((r, i) => {
    const date = pickText(asRow(r), ["date_of_service", "dateOfService", "service_date", "date"]);
    return baseFact({
      id: r.id ?? `billing-${i}`,
      source: source[i] ?? {},
      date,
      week: weekStart(date) ?? "",
      state: pickText(asRow(r), ["state", "service_state"]),
      client: pickText(asRow(r), ["client_name", "clientName", "client", "patient_name"]) || "Unknown client",
      provider:
        pickText(asRow(r), ["rendering_provider_name", "renderingProviderName", "provider_name", "provider"]) ||
        "Unassigned provider",
      payor: pickText(asRow(r), ["payor", "payer", "insurance"]),
      code: normalizeCode(pickText(asRow(r), ["procedure_code", "procedureCode", "code", "cpt"])),
      location: pickText(asRow(r), ["location", "office", "clinic"]),
      status: pickText(asRow(r), ["status"]),
      hours: hoursOf(pickNumber(asRow(r), ["hours", "units_hours", "billed_hours"])),
    });
  });
}

export function scheduleFacts(rows: CrScheduleEventRow[]): ReportFact[] {
  const source = projectScheduleRows(rows, (r) =>
    normalizeCancellationReason(r.cancellation_reason, r.cancelled_by),
  );
  return rows.map((r, i) => {
    const date = pickText(asRow(r), ["event_date", "eventDate", "date", "appointment_date"]);
    return baseFact({
      id: r.id ?? `schedule-${i}`,
      source: source[i] ?? {},
      date,
      week: weekStart(date) ?? "",
      state: pickText(asRow(r), ["state", "service_state"]),
      client: pickText(asRow(r), ["client_name", "clientName", "client"]) || "Unknown client",
      provider: pickText(asRow(r), ["provider_name", "providerName", "provider"]) || "Unassigned provider",
      payor: pickText(asRow(r), ["payor", "payer", "insurance"]),
      code: normalizeCode(pickText(asRow(r), ["procedure_code", "procedureCode", "code"])),
      location: pickText(asRow(r), ["location", "office", "clinic"]),
      status: pickText(asRow(r), ["status"]),
      reason: normalizeCancellationReason(r.cancellation_reason, r.cancelled_by),
      hours: hoursOf(pickNumber(asRow(r), ["scheduled_hours", "scheduledHours", "hours"])),
      cancelled: isCancelledEvent(r),
    });
  });
}

export function authorizationFacts(rows: CrAuthorizationRow[]): ReportFact[] {
  const source = projectAuthRows(rows, {
    kind: (r) => classifyAuthKind(r),
    status: (r) => classifyAuthStatus(r),
  });
  return rows.map((r, i) => {
    const authorized = pickNumber(asRow(r), ["authorized_hours", "authorizedHours", "units_authorized"]);
    const used = pickNumber(asRow(r), ["worked_hours", "used_hours", "usedHours"]);
    const remaining = pickNumber(asRow(r), ["remaining_hours", "remainingHours"], authorized - used);
    const date = pickText(asRow(r), ["start_date", "startDate", "date"]);
    const pause = classifyPauseReason(r);
    return baseFact({
      id: r.id ?? `auth-${i}`,
      source: source[i] ?? {},
      date,
      endDate: pickText(asRow(r), ["end_date", "endDate", "expiration_date"]),
      week: weekStart(date) ?? "",
      state: pickText(asRow(r), ["state", "service_state"]),
      client: pickText(asRow(r), ["client_name", "clientName", "client"]) || "Unknown client",
      provider: String(source[i]?.matchedBcba ?? "Unassigned"),
      payor: pickText(asRow(r), ["payor", "payer", "insurance"]),
      code: normalizeCode(pickText(asRow(r), ["procedure_code", "procedureCode", "code"])),
      status: classifyAuthStatus(r),
      reason: pause ?? "",
      hours: used,
      authorized,
      used,
      remaining,
    });
  });
}

export function utilizationFacts(rows: CrUtilizationRow[]): ReportFact[] {
  const source = projectUtilizationRows(rows);
  return rows.map((r, i) => {
    const authorized = pickNumber(asRow(r), ["authorized_hours", "authorizedHours"]);
    const used = pickNumber(asRow(r), ["used_hours", "usedHours", "worked_hours"]);
    const date = pickText(asRow(r), ["week_start", "weekStart", "date"]);
    return baseFact({
      id: r.id ?? `util-${i}`,
      source: source[i] ?? {},
      date,
      week: weekStart(date) ?? date,
      state: pickText(asRow(r), ["state"]),
      client: pickText(asRow(r), ["client_name", "clientName", "client"]) || "Unknown client",
      payor: pickText(asRow(r), ["payor", "payer", "insurance"]),
      code: normalizeCode(pickText(asRow(r), ["procedure_code", "procedureCode", "code"])),
      hours: used,
      authorized,
      used,
      remaining: authorized - used,
    });
  });
}

/** Aggregate of the facts sharing one dimension value. */
export interface FactGroup {
  label: string;
  rows: number;
  hours: number;
  clients: number;
  providers: number;
  cancellations: number;
  authorized: number;
  used: number;
  remaining: number;
  hoursDirect: number;
  hoursSupervision: number;
  hoursParentTraining: number;
  supervisionPct: number;
  utilizationPct: number;
}

export function groupFacts(facts: ReportFact[], dim: FactDim): FactGroup[] {
  const map = new Map<string, { facts: ReportFact[] }>();
  for (const f of facts) {
    const key = (f[dim] || "Not reported").toString();
    const bucket = map.get(key) ?? { facts: [] };
    bucket.facts.push(f);
    map.set(key, bucket);
  }
  const groups: FactGroup[] = [];
  for (const [label, bucket] of map) {
    const direct = sumHours(bucket.facts, "97153");
    const supervision = sumHours(bucket.facts, "97155");
    const authorized = sum(bucket.facts, (f) => f.authorized);
    const used = sum(bucket.facts, (f) => f.used);
    groups.push({
      label,
      rows: bucket.facts.length,
      hours: sum(bucket.facts, (f) => f.hours),
      clients: distinct(bucket.facts, (f) => f.client),
      providers: distinct(bucket.facts, (f) => f.provider),
      cancellations: bucket.facts.filter((f) => f.cancelled).length,
      authorized,
      used,
      remaining: sum(bucket.facts, (f) => f.remaining),
      hoursDirect: direct,
      hoursSupervision: supervision,
      hoursParentTraining: sumHours(bucket.facts, "97156"),
      supervisionPct: direct > 0 ? (supervision / direct) * 100 : 0,
      utilizationPct: utilizationPct(used, authorized),
    });
  }
  return groups;
}

function sum(facts: ReportFact[], pick: (f: ReportFact) => number): number {
  return facts.reduce((acc, f) => acc + (Number.isFinite(pick(f)) ? pick(f) : 0), 0);
}

function sumHours(facts: ReportFact[], code: string): number {
  return facts.filter((f) => f.code === code).reduce((acc, f) => acc + f.hours, 0);
}

function distinct(facts: ReportFact[], pick: (f: ReportFact) => string): number {
  return new Set(facts.map((f) => pick(f)).filter(Boolean)).size;
}

export function filterFacts(facts: ReportFact[], filters: PrimaryReportFilters): ReportFact[] {
  return facts.filter((f) => matchesFilters(f, filters));
}

/** Facts behind a chart segment / table row for the given dimension value. */
export function factsForDim(facts: ReportFact[], dim: FactDim, value: string): ReportFact[] {
  const wanted = value.trim().toLowerCase();
  return facts.filter(
    (f) => (f[dim] || "Not reported").toString().trim().toLowerCase() === wanted,
  );
}

export type FactMeasure =
  | "hours"
  | "rows"
  | "clients"
  | "providers"
  | "cancellations"
  | "authorized"
  | "used"
  | "remaining"
  | "supervisionPct"
  | "utilizationPct"
  | "hoursParentTraining";

export function chartData(
  facts: ReportFact[],
  dim: FactDim,
  measure: FactMeasure,
  limit = 10,
): ChartDatum[] {
  const groups = groupFacts(facts, dim);
  const sorted =
    dim === "week"
      ? groups.sort((a, b) => a.label.localeCompare(b.label))
      : groups.sort((a, b) => b[measure] - a[measure]).slice(0, limit);
  return sorted.map((g) => ({ label: g.label, value: round1(g[measure]) }));
}

function round1(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 10) / 10;
}

/** Table column descriptor resolved by the shared dashboard. */
export interface SharedTableColumn {
  key: keyof FactGroup | "label";
  label: string;
  kind: "text" | "count" | "hours" | "pct";
  align?: "left" | "right";
}

export function formatGroupCell(group: FactGroup, column: SharedTableColumn): string {
  const value = group[column.key as keyof FactGroup];
  if (column.kind === "text") return String(value ?? "—");
  if (column.kind === "hours") return fmtHours(Number(value));
  if (column.kind === "pct") return fmtPct(Number(value));
  return fmtCount(Number(value));
}

export interface SharedChartSpec {
  title: string;
  subtitle?: string;
  type: "bar" | "line" | "pie";
  dim: FactDim;
  measure: FactMeasure;
  valueLabel: string;
}

export interface SharedReportConfig {
  id: SharedPrimaryReportId;
  title: string;
  subtitle: string;
  datasets: CrDataset[];
  requiredExports: string[];
  /** Which normalized dataset drives the report facts. */
  factSource: CrDataset;
  /** Optional row-level restriction (e.g. only 97156 rows for Parent Training). */
  factFilter?: (fact: ReportFact) => boolean;
  filterFields: ("state" | "client" | "provider" | "payor" | "code" | "location" | "status")[];
  groupDim: FactDim;
  groupLabel: string;
  tableTitle: string;
  columns: SharedTableColumn[];
  charts: SharedChartSpec[];
  drilldownColumns: { key: string; label: string }[];
  kpis: (facts: ReportFact[]) => (KpiDefinition & { dim?: FactDim; dimValue?: string; onlyCancelled?: boolean })[];
}

const BILLING_FILTERS = ["state", "client", "provider", "payor", "code", "location", "status"] as const;

function pctOf(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

function topLabel(facts: ReportFact[], dim: FactDim, measure: FactMeasure): string {
  const [top] = chartData(facts, dim, measure, 1);
  return top?.label ?? "—";
}

/** Per-report labels, metrics, charts, and drilldown wiring. */
export const SHARED_REPORT_CONFIGS: Record<SharedPrimaryReportId, SharedReportConfig> = {
  "cancellation-command-center": {
    id: "cancellation-command-center",
    title: "Cancellation Command Center",
    subtitle:
      "Cancelled and no-show sessions from CentralReach scheduling, with lost hours by reason, state, payor, and provider.",
    datasets: ["schedule"],
    requiredExports: ["Schedule / Appointments export"],
    factSource: "schedule",
    filterFields: ["state", "client", "provider", "payor", "code", "location", "status"],
    groupDim: "reason",
    groupLabel: "Cancellation Reason",
    tableTitle: "Cancellations by reason",
    columns: [
      { key: "label", label: "Cancellation Reason", kind: "text" },
      { key: "cancellations", label: "Cancellations", kind: "count", align: "right" },
      { key: "hours", label: "Lost Hours", kind: "hours", align: "right" },
      { key: "clients", label: "Clients", kind: "count", align: "right" },
      { key: "providers", label: "Providers", kind: "count", align: "right" },
    ],
    charts: [
      {
        title: "Reason mix",
        subtitle: "Cancellations by mapped CentralReach reason",
        type: "pie",
        dim: "reason",
        measure: "cancellations",
        valueLabel: "Cancellations",
      },
      {
        title: "Lost hours by state",
        subtitle: "Scheduled hours lost to cancellations",
        type: "bar",
        dim: "state",
        measure: "hours",
        valueLabel: "Lost hours",
      },
    ],
    drilldownColumns: SCHEDULE_DRILLDOWN_COLUMNS,
    kpis: (facts) => {
      const cancelled = facts.filter((f) => f.cancelled);
      const lostHours = sum(cancelled, (f) => f.hours);
      const rate = pctOf(cancelled.length, facts.length);
      return [
        { id: "total", label: "Total cancellations", value: fmtCount(cancelled.length), onlyCancelled: true, tone: "bad" },
        {
          id: "rate",
          label: "Cancellation rate",
          value: fmtPct(rate),
          hint: `${fmtCount(facts.length)} scheduled events`,
          onlyCancelled: true,
          tone: rate >= 15 ? "bad" : rate >= 10 ? "warn" : "good",
        },
        { id: "hours", label: "Lost hours", value: fmtHours(lostHours), onlyCancelled: true, tone: "warn" },
        {
          id: "clients",
          label: "Affected clients",
          value: fmtCount(distinct(cancelled, (f) => f.client)),
          hint: `${fmtCount(distinct(cancelled, (f) => f.provider))} providers affected`,
          onlyCancelled: true,
        },
        {
          id: "topReason",
          label: "Top reason",
          value: topLabel(cancelled, "reason", "cancellations"),
          dim: "reason",
          dimValue: topLabel(cancelled, "reason", "cancellations"),
          onlyCancelled: true,
        },
      ];
    },
  },

  "authorization-analysis": {
    id: "authorization-analysis",
    title: "Authorization Analysis",
    subtitle:
      "Assessment, treatment, and reauthorization activity from CentralReach authorizations — submissions, approvals, denials, and paused services.",
    datasets: ["authorizations"],
    requiredExports: ["Authorizations export"],
    factSource: "authorizations",
    filterFields: ["state", "client", "payor", "code", "status"],
    groupDim: "status",
    groupLabel: "Authorization Status",
    tableTitle: "Authorizations by status",
    columns: [
      { key: "label", label: "Status", kind: "text" },
      { key: "rows", label: "Authorizations", kind: "count", align: "right" },
      { key: "clients", label: "Clients", kind: "count", align: "right" },
      { key: "authorized", label: "Authorized Hours", kind: "hours", align: "right" },
      { key: "used", label: "Used Hours", kind: "hours", align: "right" },
    ],
    charts: [
      {
        title: "Weekly authorization activity",
        subtitle: "Authorizations by start week",
        type: "line",
        dim: "week",
        measure: "rows",
        valueLabel: "Authorizations",
      },
      {
        title: "Status mix by payor",
        subtitle: "Authorization volume by payor",
        type: "bar",
        dim: "payor",
        measure: "rows",
        valueLabel: "Authorizations",
      },
    ],
    drilldownColumns: AUTH_DRILLDOWN_COLUMNS,
    kpis: (facts) => {
      const by = (status: string) => facts.filter((f) => f.status === status);
      const paused = facts.filter((f) => !!f.reason);
      const approved = by("approved");
      const denied = by("denied");
      return [
        { id: "total", label: "Authorizations", value: fmtCount(facts.length) },
        { id: "submitted", label: "Submitted", value: fmtCount(by("submitted").length), dim: "status", dimValue: "submitted" },
        {
          id: "approved",
          label: "Approved",
          value: fmtCount(approved.length),
          hint: fmtPct(pctOf(approved.length, facts.length)),
          dim: "status",
          dimValue: "approved",
          tone: "good",
        },
        {
          id: "denied",
          label: "Denied",
          value: fmtCount(denied.length),
          hint: fmtPct(pctOf(denied.length, facts.length)),
          dim: "status",
          dimValue: "denied",
          tone: denied.length ? "bad" : "neutral",
        },
        {
          id: "paused",
          label: "Services paused",
          value: fmtCount(paused.length),
          hint: "No reauthorization or late / missing progress report",
          tone: paused.length ? "warn" : "neutral",
        },
      ];
    },
  },

  "authorization-utilization-hour-based": {
    id: "authorization-utilization-hour-based",
    title: "Authorization Utilization (Hour-Based)",
    subtitle:
      "Authorized versus used hours from CentralReach utilization data, with over- and under-utilized authorizations surfaced for action.",
    datasets: ["utilization", "authorizations"],
    requiredExports: ["Authorization utilization export", "Authorizations export"],
    factSource: "utilization",
    filterFields: ["state", "client", "payor", "code"],
    groupDim: "client",
    groupLabel: "Client",
    tableTitle: "Utilization by client",
    columns: [
      { key: "label", label: "Client", kind: "text" },
      { key: "authorized", label: "Authorized Hours", kind: "hours", align: "right" },
      { key: "used", label: "Used Hours", kind: "hours", align: "right" },
      { key: "remaining", label: "Remaining Hours", kind: "hours", align: "right" },
      { key: "utilizationPct", label: "Utilization", kind: "pct", align: "right" },
    ],
    charts: [
      {
        title: "Utilization by client",
        subtitle: "Highest utilization percentage first",
        type: "bar",
        dim: "client",
        measure: "utilizationPct",
        valueLabel: "Utilization %",
      },
      {
        title: "Used hours by payor",
        subtitle: "Hours consumed against authorizations",
        type: "bar",
        dim: "payor",
        measure: "used",
        valueLabel: "Used hours",
      },
    ],
    drilldownColumns: UTILIZATION_DRILLDOWN_COLUMNS,
    kpis: (facts) => {
      const authorized = sum(facts, (f) => f.authorized);
      const used = sum(facts, (f) => f.used);
      const pct = utilizationPct(used, authorized);
      const groups = groupFacts(facts, "client");
      const over = groups.filter((g) => utilizationBand(g.utilizationPct) === "over");
      const under = groups.filter((g) => utilizationBand(g.utilizationPct) === "under");
      return [
        { id: "authorized", label: "Authorized hours", value: fmtHours(authorized) },
        { id: "used", label: "Used hours", value: fmtHours(used) },
        { id: "remaining", label: "Remaining hours", value: fmtHours(authorized - used) },
        {
          id: "pct",
          label: "Utilization",
          value: fmtPct(pct),
          hint: `${fmtCount(over.length)} over · ${fmtCount(under.length)} under`,
          tone: utilizationBand(pct) === "over" ? "bad" : utilizationBand(pct) === "under" ? "warn" : "good",
        },
      ];
    },
  },

  "bcba-performance": {
    id: "bcba-performance",
    title: "BCBA Performance",
    subtitle:
      "Executive roll-up of billed productivity, 97155 supervision, and 97156 parent training per BCBA from CentralReach billing data.",
    datasets: ["billing"],
    requiredExports: ["Billing / Sessions export"],
    factSource: "billing",
    filterFields: [...BILLING_FILTERS],
    groupDim: "provider",
    groupLabel: "BCBA",
    tableTitle: "Performance scorecard by BCBA",
    columns: [
      { key: "label", label: "BCBA", kind: "text" },
      { key: "hours", label: "Billed Hours", kind: "hours", align: "right" },
      { key: "clients", label: "Clients", kind: "count", align: "right" },
      { key: "hoursSupervision", label: "97155 Hours", kind: "hours", align: "right" },
      { key: "hoursParentTraining", label: "97156 Hours", kind: "hours", align: "right" },
      { key: "supervisionPct", label: "Supervision %", kind: "pct", align: "right" },
    ],
    charts: [
      {
        title: "Billed hours by BCBA",
        subtitle: "Top BCBAs by billed hours",
        type: "bar",
        dim: "provider",
        measure: "hours",
        valueLabel: "Billed hours",
      },
      {
        title: "Parent training hours by BCBA",
        subtitle: "97156 coverage per BCBA",
        type: "bar",
        dim: "provider",
        measure: "hoursParentTraining",
        valueLabel: "97156 hours",
      },
    ],
    drilldownColumns: BILLING_DRILLDOWN_COLUMNS,
    kpis: (facts) => {
      const direct = facts.filter((f) => f.code === "97153");
      const supervision = facts.filter((f) => f.code === "97155");
      const pt = facts.filter((f) => f.code === "97156");
      const supHours = sum(supervision, (f) => f.hours);
      const supPct = pctOf(supHours, sum(direct, (f) => f.hours));
      return [
        { id: "hours", label: "Billed hours", value: fmtHours(sum(facts, (f) => f.hours)) },
        { id: "bcbas", label: "BCBAs with activity", value: fmtCount(distinct(facts, (f) => f.provider)) },
        { id: "clients", label: "Clients served", value: fmtCount(distinct(facts, (f) => f.client)) },
        {
          id: "supervision",
          label: "Supervision (97155)",
          value: fmtPct(supPct),
          hint: `${fmtHours(supHours)} supervision hours`,
          dim: "code",
          dimValue: "97155",
          tone: supervisionBand(supPct) === "green" ? "good" : supervisionBand(supPct) === "yellow" ? "warn" : "bad",
        },
        {
          id: "pt",
          label: "Parent training (97156)",
          value: fmtHours(sum(pt, (f) => f.hours)),
          hint: `${fmtCount(distinct(pt, (f) => f.client))} clients with PT`,
          dim: "code",
          dimValue: "97156",
        },
      ];
    },
  },

  "bcba-supervision": {
    id: "bcba-supervision",
    title: "BCBA Supervision (97155 vs 97153)",
    subtitle:
      "Supervision compliance from CentralReach billing: 97155 supervision hours against 97153 direct hours. Under 5% red, 5–10% yellow, 10%+ green.",
    datasets: ["billing"],
    requiredExports: ["Billing / Sessions export"],
    factSource: "billing",
    factFilter: (f) => f.code === "97153" || f.code === "97155",
    filterFields: [...BILLING_FILTERS],
    groupDim: "provider",
    groupLabel: "Provider",
    tableTitle: "Supervision ratio by provider",
    columns: [
      { key: "label", label: "Provider", kind: "text" },
      { key: "hoursDirect", label: "97153 Hours", kind: "hours", align: "right" },
      { key: "hoursSupervision", label: "97155 Hours", kind: "hours", align: "right" },
      { key: "supervisionPct", label: "Supervision %", kind: "pct", align: "right" },
      { key: "clients", label: "Clients", kind: "count", align: "right" },
    ],
    charts: [
      {
        title: "Supervision % by provider",
        subtitle: "97155 hours as a share of 97153 hours",
        type: "bar",
        dim: "provider",
        measure: "supervisionPct",
        valueLabel: "Supervision %",
      },
      {
        title: "Weekly supervision hours",
        subtitle: "97155 + 97153 hours by week",
        type: "line",
        dim: "week",
        measure: "hours",
        valueLabel: "Hours",
      },
    ],
    drilldownColumns: BILLING_DRILLDOWN_COLUMNS,
    kpis: (facts) => {
      const directHours = sum(facts.filter((f) => f.code === "97153"), (f) => f.hours);
      const supHours = sum(facts.filter((f) => f.code === "97155"), (f) => f.hours);
      const pct = pctOf(supHours, directHours);
      const groups = groupFacts(facts, "provider");
      const red = groups.filter((g) => g.hoursDirect > 0 && supervisionBand(g.supervisionPct) === "red");
      return [
        { id: "direct", label: "97153 direct hours", value: fmtHours(directHours), dim: "code", dimValue: "97153" },
        { id: "supervision", label: "97155 supervision hours", value: fmtHours(supHours), dim: "code", dimValue: "97155" },
        {
          id: "pct",
          label: "Supervision ratio",
          value: fmtPct(pct),
          tone: supervisionBand(pct) === "green" ? "good" : supervisionBand(pct) === "yellow" ? "warn" : "bad",
        },
        {
          id: "belowTarget",
          label: "Providers below 5%",
          value: fmtCount(red.length),
          hint: `${fmtCount(groups.length)} providers with activity`,
          tone: red.length ? "bad" : "good",
        },
      ];
    },
  },

  "parent-training": {
    id: "parent-training",
    title: "Parent Training (97156)",
    subtitle:
      "Parent training delivery from CentralReach billing code 97156 — hours, client coverage, and clients with no parent training on file.",
    datasets: ["billing"],
    requiredExports: ["Billing / Sessions export"],
    factSource: "billing",
    filterFields: [...BILLING_FILTERS],
    groupDim: "client",
    groupLabel: "Client",
    tableTitle: "Parent training by client",
    columns: [
      { key: "label", label: "Client", kind: "text" },
      { key: "hoursParentTraining", label: "97156 Hours", kind: "hours", align: "right" },
      { key: "rows", label: "Sessions", kind: "count", align: "right" },
      { key: "providers", label: "BCBAs", kind: "count", align: "right" },
    ],
    charts: [
      {
        title: "Parent training hours by client",
        subtitle: "Top clients by 97156 hours",
        type: "bar",
        dim: "client",
        measure: "hoursParentTraining",
        valueLabel: "97156 hours",
      },
      {
        title: "Weekly parent training hours",
        subtitle: "97156 hours by week",
        type: "line",
        dim: "week",
        measure: "hoursParentTraining",
        valueLabel: "97156 hours",
      },
    ],
    drilldownColumns: BILLING_DRILLDOWN_COLUMNS,
    kpis: (facts) => {
      const pt = facts.filter((f) => f.code === "97156");
      const ptClients = new Set(pt.map((f) => f.client).filter(Boolean));
      const allClients = new Set(facts.map((f) => f.client).filter(Boolean));
      const missing = [...allClients].filter((c) => !ptClients.has(c));
      return [
        { id: "hours", label: "Parent training hours", value: fmtHours(sum(pt, (f) => f.hours)), dim: "code", dimValue: "97156" },
        { id: "clients", label: "Clients with PT", value: fmtCount(ptClients.size), dim: "code", dimValue: "97156" },
        {
          id: "missing",
          label: "Clients missing PT",
          value: fmtCount(missing.length),
          tone: missing.length ? "warn" : "good",
        },
        {
          id: "coverage",
          label: "PT coverage",
          value: fmtPct(pctOf(ptClients.size, allClients.size)),
          hint: `${fmtCount(distinct(pt, (f) => f.provider))} BCBAs delivering PT`,
          tone: pctOf(ptClients.size, allClients.size) >= 80 ? "good" : "warn",
        },
      ];
    },
  },

  "progress-reports": {
    id: "progress-reports",
    title: "Progress Reports",
    subtitle:
      "Progress report status derived from CentralReach authorizations — submitted, approved, denied, and services paused on late or missing reports.",
    datasets: ["authorizations"],
    requiredExports: ["Authorizations export"],
    factSource: "authorizations",
    filterFields: ["state", "client", "payor", "code", "status"],
    groupDim: "client",
    groupLabel: "Client",
    tableTitle: "Progress report status by client",
    columns: [
      { key: "label", label: "Client", kind: "text" },
      { key: "rows", label: "Reports Tracked", kind: "count", align: "right" },
      { key: "authorized", label: "Authorized Hours", kind: "hours", align: "right" },
      { key: "used", label: "Used Hours", kind: "hours", align: "right" },
      { key: "providers", label: "BCBAs", kind: "count", align: "right" },
    ],
    charts: [
      {
        title: "Report status mix",
        subtitle: "Progress report outcomes on file",
        type: "pie",
        dim: "status",
        measure: "rows",
        valueLabel: "Reports",
      },
      {
        title: "Weekly report activity",
        subtitle: "Reports tracked by week",
        type: "line",
        dim: "week",
        measure: "rows",
        valueLabel: "Reports",
      },
    ],
    drilldownColumns: AUTH_DRILLDOWN_COLUMNS,
    kpis: (facts) => {
      const by = (status: string) => facts.filter((f) => f.status === status);
      const latePr = facts.filter((f) => f.reason === "late_or_missing_pr");
      const paused = facts.filter((f) => !!f.reason);
      return [
        { id: "tracked", label: "Reports tracked", value: fmtCount(facts.length) },
        { id: "submitted", label: "Submitted", value: fmtCount(by("submitted").length), dim: "status", dimValue: "submitted" },
        { id: "approved", label: "Approved", value: fmtCount(by("approved").length), dim: "status", dimValue: "approved", tone: "good" },
        {
          id: "denied",
          label: "Denied",
          value: fmtCount(by("denied").length),
          dim: "status",
          dimValue: "denied",
          tone: by("denied").length ? "bad" : "neutral",
        },
        {
          id: "late",
          label: "Late / missing reports",
          value: fmtCount(latePr.length),
          hint: `${fmtCount(paused.length)} services paused`,
          tone: latePr.length ? "bad" : "good",
        },
      ];
    },
  },
};

export function sharedReportConfig(id: SharedPrimaryReportId): SharedReportConfig {
  return SHARED_REPORT_CONFIGS[id];
}

/** Report-level CSV columns for the grouped operator table. */
export function groupExportColumns(config: SharedReportConfig) {
  return config.columns.map((c) => ({ key: String(c.key), label: c.label }));
}

export function groupExportRows(
  groups: FactGroup[],
  config: SharedReportConfig,
): Record<string, unknown>[] {
  return groups.map((g) => {
    const row: Record<string, unknown> = {};
    for (const c of config.columns) row[String(c.key)] = formatGroupCell(g, c);
    return row;
  });
}