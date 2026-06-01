import {
  buildCanonicalRows,
  calculateSupervision,
  calculateParentTraining,
  calculateAuthorizationUtilization,
  calculateCancellations,
  generateDataQualityFlags,
  type CanonicalRow,
} from "@/lib/os/reportEngine/calculations";
import type { CanonicalField } from "@/lib/os/reportEngine/types";
import {
  type BuildDashboardInput,
  type DashboardSpec,
  type KpiSpec,
  type ChartSpec,
  type RiskTableSpec,
  type DrilldownSpec,
  type DashboardType,
  DASHBOARD_TYPE_LABELS,
} from "./types";

const DIRECT = "97153";
const SUPERVISION = "97155";
const PARENT_TRAINING = "97156";

function fmtHours(n: number) { return `${n.toFixed(1)} hrs`; }
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }
function fmtNum(n: number) { return n.toLocaleString(); }

function presentFieldSet(input: BuildDashboardInput): Set<CanonicalField> {
  const s = new Set<CanonicalField>();
  for (const m of input.mappings) for (const v of Object.values(m)) if (v) s.add(v as CanonicalField);
  return s;
}

function dateRangeAcross(input: BuildDashboardInput) {
  const ranges = input.files.map(f => f.dateRange).filter(Boolean) as { min: string; max: string }[];
  if (!ranges.length) return null;
  return {
    min: ranges.map(r => r.min).sort()[0],
    max: ranges.map(r => r.max).sort().slice(-1)[0],
  };
}

// ---------- KPI builders ----------

function coreKpis(rows: CanonicalRow[]): { kpis: KpiSpec[]; drilldowns: Record<string, DrilldownSpec> } {
  const clients = new Map<string, number>();
  for (const r of rows) {
    if (!r.client_name) continue;
    clients.set(r.client_name, (clients.get(r.client_name) ?? 0) + (r.worked_hours ?? 0));
  }
  const totalWorked = rows.reduce((s, r) => s + (r.worked_hours ?? 0), 0);
  const hoursBy = (code: string) =>
    rows.filter(r => r.procedure_code === code).reduce((s, r) => s + (r.worked_hours ?? 0), 0);

  const drilldowns: Record<string, DrilldownSpec> = {};
  drilldowns.clients = {
    title: "All clients",
    columns: ["Client", "Total worked hrs"],
    rows: [...clients.entries()].sort((a, b) => b[1] - a[1]).map(([c, h]) => [c, Number(h.toFixed(1))]),
  };

  const kpis: KpiSpec[] = [
    { id: "clients", label: "Total clients", value: fmtNum(clients.size), raw: clients.size, drilldown: drilldowns.clients },
    { id: "worked", label: "Total hours", value: fmtHours(totalWorked), raw: totalWorked },
    { id: "97153", label: "97153 (direct)", value: fmtHours(hoursBy(DIRECT)), raw: hoursBy(DIRECT) },
    { id: "97155", label: "97155 (supervision)", value: fmtHours(hoursBy(SUPERVISION)), raw: hoursBy(SUPERVISION) },
    { id: "97156", label: "97156 (parent training)", value: fmtHours(hoursBy(PARENT_TRAINING)), raw: hoursBy(PARENT_TRAINING) },
  ];

  return { kpis, drilldowns };
}

function supervisionKpis(rows: CanonicalRow[]): { kpis: KpiSpec[]; drilldowns: Record<string, DrilldownSpec>; chart: ChartSpec; risk: RiskTableSpec; insights: string[] } {
  const sup = calculateSupervision(rows);
  const low = sup.perClient.filter(r => r.flag !== "ok");
  const drilldownLow: DrilldownSpec = {
    title: "Clients with low or missing supervision",
    columns: ["Client", "97153 hrs", "97155 hrs", "Supervision %", "Flag"],
    rows: low.map(r => [
      r.client,
      Number(r.direct.toFixed(1)),
      Number(r.supervision.toFixed(1)),
      fmtPct(r.supervisionPct),
      r.flag === "missing" ? "Missing 97155" : r.flag === "under_5" ? "Under 5%" : "Under 10%",
    ]),
    emptyMessage: "Every client is meeting supervision targets.",
  };
  const drilldownAll: DrilldownSpec = {
    title: "Supervision % by client",
    columns: ["Client", "97153 hrs", "97155 hrs", "Supervision %", "Status"],
    rows: sup.perClient.map(r => [
      r.client,
      Number(r.direct.toFixed(1)),
      Number(r.supervision.toFixed(1)),
      fmtPct(r.supervisionPct),
      r.flag === "ok" ? "OK" : r.flag,
    ]),
  };
  const kpis: KpiSpec[] = [
    {
      id: "sup_avg",
      label: "Avg supervision %",
      value: fmtPct(sup.averagePct),
      raw: sup.averagePct,
      tone: sup.averagePct < 10 ? "danger" : sup.averagePct < 15 ? "warn" : "success",
      drilldown: drilldownAll,
    },
    {
      id: "sup_low",
      label: "Low supervision clients",
      value: fmtNum(low.length),
      raw: low.length,
      tone: low.length ? "warn" : "success",
      drilldown: drilldownLow,
    },
  ];
  const chart: ChartSpec = {
    id: "sup_by_client",
    title: "Supervision % by client",
    type: "bar",
    labels: sup.perClient.slice(0, 12).map(r => r.client),
    series: [{ name: "Supervision %", data: sup.perClient.slice(0, 12).map(r => Number(r.supervisionPct.toFixed(1))) }],
    span: 2,
    unit: "%",
  };
  const risk: RiskTableSpec = {
    id: "sup_risk",
    title: "Supervision risks",
    severity: low.length > 5 ? "high" : low.length ? "med" : "low",
    columns: drilldownLow.columns,
    rows: drilldownLow.rows.slice(0, 8),
    emptyMessage: drilldownLow.emptyMessage,
  };
  const insights: string[] = [];
  if (sup.perClient.length) {
    insights.push(`Average supervision is ${fmtPct(sup.averagePct)} across ${sup.perClient.length} clients.`);
    const missing = sup.perClient.filter(r => r.flag === "missing").length;
    if (missing) insights.push(`${missing} client(s) have no 97155 supervision recorded this period.`);
    const under5 = sup.perClient.filter(r => r.flag === "under_5").length;
    if (under5) insights.push(`${under5} client(s) are below 5% supervision — escalate immediately.`);
  }
  return { kpis, drilldowns: { sup_low: drilldownLow, sup_avg: drilldownAll }, chart, risk, insights };
}

function parentTrainingKpis(rows: CanonicalRow[]) {
  const pt = calculateParentTraining(rows);
  const without = pt.perClient.filter(r => !r.hasTraining);
  const drilldownMissing: DrilldownSpec = {
    title: "Clients missing parent training",
    columns: ["Client", "97156 hrs"],
    rows: without.map(r => [r.client, Number(r.hours.toFixed(1))]),
    emptyMessage: "Every client received parent training.",
  };
  const drilldownAll: DrilldownSpec = {
    title: "Parent training by client",
    columns: ["Client", "97156 hrs", "Has training"],
    rows: pt.perClient.map(r => [r.client, Number(r.hours.toFixed(1)), r.hasTraining ? "Yes" : "No"]),
  };
  const kpis: KpiSpec[] = [
    {
      id: "pt_missing",
      label: "PT missing",
      value: fmtNum(without.length),
      raw: without.length,
      tone: without.length ? "warn" : "success",
      drilldown: drilldownMissing,
    },
    {
      id: "pt_pct",
      label: "Clients with PT",
      value: fmtPct(pt.withPct),
      raw: pt.withPct,
      tone: pt.withPct < 50 ? "warn" : "success",
      drilldown: drilldownAll,
    },
    { id: "pt_hours", label: "97156 hours", value: fmtHours(pt.totalHours), raw: pt.totalHours },
  ];
  const chart: ChartSpec = {
    id: "pt_split",
    title: "Parent training coverage",
    type: "pie",
    labels: ["With parent training", "Without"],
    series: [{ name: "Clients", data: [pt.withCount, pt.withoutCount] }],
  };
  const risk: RiskTableSpec = {
    id: "pt_risk",
    title: "Clients without parent training",
    severity: without.length > 5 ? "high" : without.length ? "med" : "low",
    columns: drilldownMissing.columns,
    rows: drilldownMissing.rows.slice(0, 8),
    emptyMessage: drilldownMissing.emptyMessage,
  };
  const insights: string[] = [];
  if (pt.perClient.length) {
    insights.push(`${without.length} of ${pt.perClient.length} client(s) had no parent training this period.`);
    insights.push(`Total 97156 hours: ${fmtHours(pt.totalHours)} (${fmtPct(pt.withPct)} coverage).`);
  }
  return { kpis, drilldowns: { pt_missing: drilldownMissing, pt_pct: drilldownAll }, chart, risk, insights };
}

function authorizationKpis(rows: CanonicalRow[]) {
  const auth = calculateAuthorizationUtilization(rows);
  const risks = auth.filter(r => r.flag !== "ok");
  const drilldownRisks: DrilldownSpec = {
    title: "Authorization risks",
    columns: ["Client", "Auth #", "CPT", "Authorized", "Worked", "Remaining", "Utilization %", "Flag"],
    rows: risks.map(r => [
      r.client, r.authNumber || "—", r.procedure || "—",
      Number(r.authorized.toFixed(1)),
      Number(r.worked.toFixed(1)),
      Number(r.remaining.toFixed(1)),
      fmtPct(r.utilizationPct),
      r.flag.replace("_", " "),
    ]),
    emptyMessage: "No authorization risks detected.",
  };
  const drilldownAll: DrilldownSpec = {
    title: "All authorizations",
    columns: ["Client", "Auth #", "CPT", "Authorized", "Worked", "Pending", "Remaining", "Utilization %", "Flag"],
    rows: auth.map(r => [
      r.client, r.authNumber || "—", r.procedure || "—",
      Number(r.authorized.toFixed(1)),
      Number(r.worked.toFixed(1)),
      Number(r.pending.toFixed(1)),
      Number(r.remaining.toFixed(1)),
      fmtPct(r.utilizationPct),
      r.flag === "ok" ? "OK" : r.flag.replace("_", " "),
    ]),
  };
  const kpis: KpiSpec[] = [
    {
      id: "auth_risks",
      label: "Authorization risks",
      value: fmtNum(risks.length),
      raw: risks.length,
      tone: risks.length > 5 ? "danger" : risks.length ? "warn" : "success",
      drilldown: drilldownRisks,
    },
    {
      id: "auth_total",
      label: "Total authorizations",
      value: fmtNum(auth.length),
      raw: auth.length,
      drilldown: drilldownAll,
    },
  ];
  const chart: ChartSpec = {
    id: "auth_utilization",
    title: "Utilization % (lowest first)",
    type: "bar",
    labels: auth.slice(0, 12).map(r => r.client),
    series: [{ name: "Utilization %", data: auth.slice(0, 12).map(r => Number(r.utilizationPct.toFixed(1))) }],
    span: 2,
    unit: "%",
  };
  const risk: RiskTableSpec = {
    id: "auth_risk",
    title: "Authorizations needing attention",
    severity: risks.length > 5 ? "high" : risks.length ? "med" : "low",
    columns: drilldownRisks.columns,
    rows: drilldownRisks.rows.slice(0, 8),
    emptyMessage: drilldownRisks.emptyMessage,
  };
  const insights: string[] = [];
  if (auth.length) {
    const low = auth.filter(r => r.flag === "low").length;
    const over = auth.filter(r => r.flag === "over").length;
    const near = auth.filter(r => r.flag === "near_max").length;
    if (over) insights.push(`${over} authorization(s) are over 100% utilization — compliance review needed.`);
    if (near) insights.push(`${near} authorization(s) at 90%+ utilization — likely to exhaust soon.`);
    if (low) insights.push(`${low} authorization(s) under 50% utilized — schedule review.`);
  }
  return { kpis, drilldowns: { auth_risks: drilldownRisks, auth_total: drilldownAll }, chart, risk, insights };
}

function cancellationKpis(rows: CanonicalRow[]) {
  const c = calculateCancellations(rows);
  const drilldownAll: DrilldownSpec = {
    title: "Cancellations",
    columns: ["Client", "Provider", "Date", "Reason", "Classification"],
    rows: c.rows.map(r => [r.client, r.provider, r.date, r.reason, r.classification]),
    emptyMessage: "No cancellations in the dataset.",
  };
  const drilldownRepeats: DrilldownSpec = {
    title: "Repeat offenders (3+ cancellations)",
    columns: ["Client", "Cancellations"],
    rows: c.repeatOffenders.map(r => [r.client, r.count]),
    emptyMessage: "No clients with 3+ cancellations.",
  };
  const kpis: KpiSpec[] = [
    {
      id: "cx_total",
      label: "Cancellations",
      value: fmtNum(c.total),
      raw: c.total,
      tone: c.total > 50 ? "warn" : "default",
      drilldown: drilldownAll,
    },
    {
      id: "cx_repeat",
      label: "Repeat offenders",
      value: fmtNum(c.repeatOffenders.length),
      raw: c.repeatOffenders.length,
      tone: c.repeatOffenders.length ? "warn" : "success",
      drilldown: drilldownRepeats,
    },
  ];
  const chart: ChartSpec = {
    id: "cx_reasons",
    title: "Top cancellation reasons",
    type: "bar",
    labels: c.byReason.slice(0, 8).map(r => r.reason),
    series: [{ name: "Cancellations", data: c.byReason.slice(0, 8).map(r => r.count) }],
    span: 2,
  };
  const risk: RiskTableSpec = {
    id: "cx_risk",
    title: "Top reasons",
    severity: c.total > 50 ? "med" : "low",
    columns: ["Reason", "Classification", "Count"],
    rows: c.byReason.slice(0, 8).map(r => [r.reason, r.classification, r.count]),
  };
  const insights: string[] = [];
  if (c.total) {
    insights.push(`${c.total} cancelled session(s) across ${c.byClient.length} clients.`);
    if (c.topReasons.length) insights.push(`Top cancellation reasons: ${c.topReasons.slice(0, 3).join(", ")}.`);
    if (c.repeatOffenders.length) insights.push(`${c.repeatOffenders.length} client(s) with 3+ cancellations.`);
  }
  return { kpis, drilldowns: { cx_total: drilldownAll, cx_repeat: drilldownRepeats }, chart, risk, insights };
}

function codeBreakdownChart(rows: CanonicalRow[]): ChartSpec | null {
  const byCode = new Map<string, number>();
  for (const r of rows) {
    if (!r.procedure_code) continue;
    byCode.set(r.procedure_code, (byCode.get(r.procedure_code) ?? 0) + (r.worked_hours ?? 0));
  }
  const entries = [...byCode.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!entries.length) return null;
  return {
    id: "code_hours",
    title: "Hours by procedure code",
    type: "bar",
    labels: entries.map(([c]) => c),
    series: [{ name: "Hours", data: entries.map(([, h]) => Number(h.toFixed(1))) }],
    unit: " hrs",
  };
}

function recommendationsFor(type: DashboardType, rows: CanonicalRow[]): string[] {
  const recs: string[] = [];
  switch (type) {
    case "supervision":
      recs.push("Schedule supervision sessions for clients flagged below 10%.");
      recs.push("Pair under-supervised clients with their assigned BCBA in this week's case review.");
      break;
    case "parent_training":
      recs.push("Outreach to families missing parent training to schedule a 97156 session.");
      recs.push("Add parent training cadence to monthly case reviews.");
      break;
    case "authorization":
      recs.push("Submit reauthorization requests for any auth above 90% utilization.");
      recs.push("Reach out to families whose authorization is expiring within 30 days.");
      break;
    case "cancellation":
      recs.push("Run a make-up session push for clients with 3+ cancellations.");
      recs.push("Review provider-side cancellations with HR for coaching opportunities.");
      break;
    default:
      recs.push("Review the highest-risk items in the risk tables and assign owners.");
      recs.push("Re-run this dashboard weekly to track trend changes.");
  }
  return recs;
}

// ---------- Main entry ----------

export function buildDashboard(input: BuildDashboardInput): DashboardSpec {
  const rows = buildCanonicalRows(input.files, input.mappings);
  const present = presentFieldSet(input);
  const dateRange = dateRangeAcross(input);

  const kpis: KpiSpec[] = [];
  const charts: ChartSpec[] = [];
  const risks: RiskTableSpec[] = [];
  const drilldowns: Record<string, DrilldownSpec> = {};
  const insights: string[] = [];
  const notes: string[] = [];

  // Always include core KPIs
  const core = coreKpis(rows);
  kpis.push(...core.kpis);
  Object.assign(drilldowns, core.drilldowns);

  const canSup = present.has("procedure_code") && present.has("worked_hours") && present.has("client_name");
  const canAuth = present.has("authorized_hours") && present.has("worked_hours") && present.has("client_name");
  const canCancel = present.has("session_status");

  // Add type-specific KPIs, charts, risks
  const include: DashboardType[] = (() => {
    switch (input.type) {
      case "leadership":
      case "operations":
        return ["supervision", "parent_training", "authorization", "cancellation"];
      case "supervision":
        return ["supervision", "parent_training"];
      case "parent_training":
        return ["parent_training", "supervision"];
      case "authorization":
        return ["authorization"];
      case "cancellation":
        return ["cancellation"];
      case "billing":
      case "scheduling":
      case "state":
      case "bcba":
      case "custom":
      default:
        return ["supervision", "parent_training", "authorization", "cancellation"];
    }
  })();

  if (include.includes("supervision")) {
    if (canSup) {
      const s = supervisionKpis(rows);
      kpis.push(...s.kpis); charts.push(s.chart); risks.push(s.risk);
      Object.assign(drilldowns, s.drilldowns); insights.push(...s.insights);
    } else notes.push("Supervision metrics unavailable — need client, procedure code, and worked hours columns.");
  }
  if (include.includes("parent_training")) {
    if (canSup) {
      const s = parentTrainingKpis(rows);
      kpis.push(...s.kpis); charts.push(s.chart); risks.push(s.risk);
      Object.assign(drilldowns, s.drilldowns); insights.push(...s.insights);
    } else notes.push("Parent training metrics unavailable — need procedure code and worked hours columns.");
  }
  if (include.includes("authorization")) {
    if (canAuth) {
      const s = authorizationKpis(rows);
      kpis.push(...s.kpis); charts.push(s.chart); risks.push(s.risk);
      Object.assign(drilldowns, s.drilldowns); insights.push(...s.insights);
    } else notes.push("Authorization utilization unavailable — need authorized hours and worked hours columns.");
  }
  if (include.includes("cancellation")) {
    if (canCancel) {
      const s = cancellationKpis(rows);
      kpis.push(...s.kpis); charts.push(s.chart); risks.push(s.risk);
      Object.assign(drilldowns, s.drilldowns); insights.push(...s.insights);
    } else notes.push("Cancellation metrics unavailable — need session status column.");
  }

  // Always add a billing breakdown chart if we have codes + hours
  const codeChart = codeBreakdownChart(rows);
  if (codeChart) charts.push(codeChart);

  const dq = generateDataQualityFlags(rows, input.mappings, ["client_name", "procedure_code", "worked_hours"]);

  const recommendedActions = recommendationsFor(input.type, rows);

  return {
    type: input.type,
    title: DASHBOARD_TYPE_LABELS[input.type],
    subtitle: dateRange ? `${dateRange.min} → ${dateRange.max}` : undefined,
    kpis,
    charts,
    risks,
    drilldowns,
    executiveInsights: insights.slice(0, 6),
    recommendedActions,
    notes,
    dataQuality: dq,
    totalRows: rows.length,
    totalFiles: input.files.length,
    dateRange,
  };
}