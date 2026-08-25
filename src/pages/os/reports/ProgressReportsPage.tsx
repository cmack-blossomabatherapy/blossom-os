/**
 * Primary report: Progress Reports (`progress-reports`).
 *
 * Clinical documentation status derived from CentralReach authorization rows
 * classified as progress-report work. Missing status is shown only when the
 * CentralReach source explicitly identifies a missing progress report.
 */
import { useMemo, useState } from "react";
import { PrimaryReportShell } from "@/components/reports/crPrimary/PrimaryReportShell";
import { KpiScorecards } from "@/components/reports/crPrimary/KpiScorecards";
import { PrimaryChart } from "@/components/reports/crPrimary/PrimaryChart";
import { PrimaryTable } from "@/components/reports/crPrimary/PrimaryTable";
import { DrilldownDrawer } from "@/components/reports/crPrimary/DrilldownDrawer";
import {
  PrimaryFilterBar,
  type FilterFieldConfig,
} from "@/components/reports/crPrimary/PrimaryFilterBar";
import { useCrPrimaryReport } from "@/hooks/useCrPrimaryReport";
import { applyFilters, optionsFor } from "@/lib/os/reports/crPrimary/filters";
import { EMPTY_FILTERS, type DrilldownRequest, type KpiDefinition } from "@/lib/os/reports/crPrimary/types";
import { fmtCount, fmtDate } from "@/lib/os/reports/crPrimary/format";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import { computeProgressReportMetrics } from "@/lib/os/reports/crPrimary/metrics/progressReports";
import { normalizeCode } from "@/lib/os/reports/crPrimary/metrics/codes";
import { Badge } from "@/components/ui/badge";

const RECORD_COLUMNS = [
  { key: "client", label: "Client" },
  { key: "bcba", label: "Matched BCBA" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "authorizationNumber", label: "Authorization #" },
  { key: "dueDate", label: "Due Date" },
  { key: "status", label: "Status" },
  { key: "daysLate", label: "Days Late" },
  { key: "pauseReason", label: "Pause Reason" },
  { key: "weekStart", label: "Week" },
  { key: "sourceStatus", label: "CR Source Status" },
];

const STATUS_TONE: Record<string, "default" | "secondary" | "destructive"> = {
  approved: "default",
  submitted: "secondary",
  due: "secondary",
  overdue: "destructive",
  missing: "destructive",
  denied: "destructive",
  paused: "destructive",
};

export default function ProgressReportsPage() {
  const data = useCrPrimaryReport(["authorizations", "billing"]);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);

  const auths = useMemo(
    () =>
      applyFilters(data.authorizations, filters, (r) => ({
        date: r.start_date,
        endDate: r.end_date,
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        code: normalizeCode(r.procedure_code),
        status: r.status,
      })),
    [data.authorizations, filters],
  );

  const sessions = useMemo(
    () =>
      applyFilters(data.billing, filters, (r) => ({
        date: r.date_of_service,
        state: r.state,
        client: r.client_name,
        provider: r.rendering_provider_name,
        payor: r.payor,
        code: normalizeCode(r.procedure_code),
        location: r.location,
        status: r.status,
      })),
    [data.billing, filters],
  );

  const metrics = useMemo(() => computeProgressReportMetrics(auths, sessions), [auths, sessions]);
  const weeklyChart = useMemo(
    () => metrics.weekly.map((week) => ({ ...week, label: fmtDate(week.label) })),
    [metrics.weekly],
  );

  const recordRows = useMemo(
    () =>
      metrics.records.map((r) => ({
        ...r,
        dueDate: r.dueDate ?? "",
        daysLate: r.daysLate ?? "",
        pauseReason: r.pauseReason ?? "",
        weekStart: r.weekStart ?? "",
      })),
    [metrics.records],
  );

  const fields: FilterFieldConfig[] = useMemo(
    () => [
      { key: "state", label: "State", options: optionsFor(data.authorizations, (r) => r.state) },
      { key: "payor", label: "Payor", options: optionsFor(data.authorizations, (r) => r.payor) },
      { key: "client", label: "Client", options: optionsFor(data.authorizations, (r) => r.client_name) },
      { key: "status", label: "Status", options: optionsFor(data.authorizations, (r) => r.status) },
    ],
    [data.authorizations],
  );

  const kpis: KpiDefinition[] = [
    { id: "due", label: "Progress Reports Due", value: fmtCount(metrics.due) },
    { id: "submitted", label: "Submitted", value: fmtCount(metrics.submitted), tone: "neutral" },
    { id: "approved", label: "Approved", value: fmtCount(metrics.approved), tone: "good" },
    {
      id: "denied",
      label: "Denied",
      value: fmtCount(metrics.denied),
      tone: metrics.denied > 0 ? "bad" : "good",
    },
    {
      id: "overdue",
      label: "Overdue",
      value: fmtCount(metrics.overdue),
      hint: `${fmtCount(metrics.avgDaysLate)} avg days late`,
      tone: metrics.overdue > 0 ? "bad" : "good",
    },
    {
      id: "missing",
      label: "Explicitly Missing",
      value: fmtCount(metrics.missing),
      hint: "Flagged missing in CentralReach",
      tone: metrics.missing > 0 ? "bad" : "good",
    },
    {
      id: "paused",
      label: "Paused Due To PR",
      value: fmtCount(metrics.pausedDueToPr),
      tone: metrics.pausedDueToPr > 0 ? "bad" : "good",
    },
    { id: "weeks", label: "Weeks Covered", value: fmtCount(metrics.weekly.length) },
  ];

  const openRecords = (title: string, predicate: (r: (typeof recordRows)[number]) => boolean) =>
    setDrilldown({
      title,
      subtitle: "Progress-report records derived from CentralReach authorization rows.",
      rows: recordRows.filter(predicate),
      columns: RECORD_COLUMNS,
      exportName: `progress-reports-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    });

  const onKpi = (id: string) => {
    const map: Record<string, string> = {
      due: "due",
      submitted: "submitted",
      approved: "approved",
      denied: "denied",
      overdue: "overdue",
      missing: "missing",
      paused: "paused",
    };
    const want = map[id];
    if (want) return openRecords(`Progress reports — ${want}`, (r) => r.status === want);
    return openRecords("All progress report records", () => true);
  };

  return (
    <PrimaryReportShell
      title="Progress Reports"
      subtitle="Progress-report documentation status explicitly identified in CentralReach: due, submitted, approved, denied, overdue, and missing."
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      onRefresh={data.refresh}
      exportDisabled={recordRows.length === 0}
      onExport={() => downloadCsv("progress-reports", recordRows, RECORD_COLUMNS)}
      filters={
        <PrimaryFilterBar
          filters={filters}
          fields={fields}
          onChange={setFilters}
          onReset={() => setFilters({ ...EMPTY_FILTERS })}
        />
      }
    >
      <div className="space-y-4">
        <KpiScorecards kpis={kpis} onSelect={onKpi} />

        <PrimaryChart
          title="Weekly progress report activity"
          subtitle="Submitted progress reports vs overdue by week"
          type="bar"
          data={weeklyChart}
          valueLabel="Submitted"
          secondaryLabel="Overdue"
          height={300}
          onSelect={(label) => openRecords(`Week ${label}`, (r) => fmtDate(r.weekStart) === label)}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <PrimaryChart
            title="Overdue progress reports by BCBA"
            type="bar"
            data={metrics.overdueByBcba.slice(0, 12).map((b) => ({ label: b.name, value: b.value }))}
            valueLabel="Overdue"
            onSelect={(label) => openRecords(`BCBA · ${label}`, (r) => r.bcba === label)}
          />
          <PrimaryChart
            title="Overdue progress reports by state"
            type="pie"
            data={metrics.overdueByState.map((s) => ({ label: s.name, value: s.value }))}
            valueLabel="Overdue"
            onSelect={(label) => openRecords(`State · ${label}`, (r) => r.state === label)}
          />
        </div>

        <PrimaryTable
          title="Progress reports requiring action"
          subtitle="Overdue, missing, denied, and paused records first"
          rows={[...metrics.records].sort((a, b) => (b.daysLate ?? 0) - (a.daysLate ?? 0))}
          rowKey={(r, i) => `${r.client}-${r.authorizationNumber}-${i}`}
          onRowClick={(r) => openRecords(`Client · ${r.client}`, (row) => row.client === r.client)}
          columns={[
            { key: "client", label: "Client", render: (r) => <span className="font-medium">{r.client}</span> },
            { key: "bcba", label: "Matched BCBA", render: (r) => r.bcba || "Unassigned" },
            { key: "payor", label: "Payor", render: (r) => r.payor || "—" },
            { key: "state", label: "State", render: (r) => r.state || "—" },
            { key: "auth", label: "Authorization #", render: (r) => r.authorizationNumber || "—" },
            { key: "due", label: "Due", align: "right", render: (r) => fmtDate(r.dueDate) },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <Badge variant={STATUS_TONE[r.status] ?? "secondary"} className="text-[10px] capitalize">
                  {r.status}
                </Badge>
              ),
            },
            {
              key: "late",
              label: "Days Late",
              align: "right",
              render: (r) => (r.daysLate != null && r.daysLate > 0 ? fmtCount(r.daysLate) : "—"),
            },
            { key: "pause", label: "Pause Reason", render: (r) => r.pauseReason ?? "—" },
          ]}
        />
      </div>

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}