/**
 * Primary report: Authorization Analysis (`authorization-analysis`).
 *
 * Reads normalized CentralReach authorization rows and reports the weekly
 * authorization workflow — initial assessments, initial treatment, RAs, and
 * progress reports — plus paused work and its reason.
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
import { fmtCount, fmtDate, fmtPct } from "@/lib/os/reports/crPrimary/format";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import { AUTH_DRILLDOWN_COLUMNS, projectAuthRows } from "@/lib/os/reports/crPrimary/drilldown";
import {
  classifyAuthKind,
  classifyAuthStatus,
  classifyPauseReason,
  computeAuthorizationAnalysis,
} from "@/lib/os/reports/crPrimary/metrics/authorizationAnalysis";
import { normalizeCode } from "@/lib/os/reports/crPrimary/metrics/codes";
import { Badge } from "@/components/ui/badge";

const KIND_LABEL: Record<string, string> = {
  initial_assessment: "Initial Assessment",
  initial_treatment: "Initial Treatment",
  reauthorization: "Reauthorization (RA)",
  progress_report: "Progress Report",
  other: "Other",
};

export default function AuthorizationAnalysisPage() {
  const data = useCrPrimaryReport(["authorizations"]);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);

  const rows = useMemo(
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

  const metrics = useMemo(() => computeAuthorizationAnalysis(rows), [rows]);
  const projected = useMemo(
    () =>
      projectAuthRows(rows, {
        kind: (r) => KIND_LABEL[classifyAuthKind(r)] ?? "Other",
        status: (r) => classifyAuthStatus(r),
      }),
    [rows],
  );

  const fields: FilterFieldConfig[] = useMemo(
    () => [
      { key: "state", label: "State", options: optionsFor(data.authorizations, (r) => r.state) },
      { key: "payor", label: "Payor", options: optionsFor(data.authorizations, (r) => r.payor) },
      { key: "client", label: "Client", options: optionsFor(data.authorizations, (r) => r.client_name) },
      {
        key: "code",
        label: "Service Code",
        options: optionsFor(data.authorizations, (r) => normalizeCode(r.procedure_code)),
      },
      { key: "status", label: "Status", options: optionsFor(data.authorizations, (r) => r.status) },
    ],
    [data.authorizations],
  );

  const kpis: KpiDefinition[] = [
    { id: "total", label: "Authorizations", value: fmtCount(metrics.totalAuthorizations), hint: "Rows in scope" },
    { id: "submitted", label: "Submitted", value: fmtCount(metrics.submitted), hint: "Includes approved + denied" },
    {
      id: "approved",
      label: "Approved",
      value: fmtCount(metrics.approved),
      hint: `${fmtPct(metrics.approvalRate)} approval rate`,
      tone: metrics.approvalRate >= 85 ? "good" : "warn",
    },
    {
      id: "denied",
      label: "Denied",
      value: fmtCount(metrics.denied),
      hint: `${fmtPct(metrics.denialRate)} denial rate`,
      tone: metrics.denied > 0 ? "bad" : "good",
    },
    {
      id: "paused",
      label: "Paused Work",
      value: fmtCount(metrics.paused),
      hint: "Authorization work on hold",
      tone: metrics.paused > 0 ? "warn" : "good",
    },
    {
      id: "paused-no-ra",
      label: "Paused — No RA",
      value: fmtCount(metrics.pausedNoRa),
      tone: metrics.pausedNoRa > 0 ? "bad" : "good",
    },
    {
      id: "paused-late-pr",
      label: "Paused — Late/Missing PR",
      value: fmtCount(metrics.pausedLatePr),
      tone: metrics.pausedLatePr > 0 ? "bad" : "good",
    },
    { id: "weeks", label: "Weeks Covered", value: fmtCount(metrics.weekly.length) },
  ];

  const openDrilldown = (
    title: string,
    predicate: (index: number) => boolean,
    subtitle?: string,
  ) => {
    const filtered = projected.filter((_, i) => predicate(i));
    setDrilldown({
      title,
      subtitle: subtitle ?? "CentralReach authorization source rows with matched Blossom context.",
      rows: filtered,
      columns: AUTH_DRILLDOWN_COLUMNS,
      exportName: `authorization-analysis-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    });
  };

  const onKpi = (id: string) => {
    const byStatus = (want: string) => (i: number) => classifyAuthStatus(rows[i]) === want;
    if (id === "approved") return openDrilldown("Approved authorizations", byStatus("approved"));
    if (id === "denied") return openDrilldown("Denied authorizations", byStatus("denied"));
    if (id === "paused") return openDrilldown("Paused authorizations", byStatus("paused"));
    if (id === "paused-no-ra")
      return openDrilldown("Paused — no reauthorization", (i) => classifyPauseReason(rows[i]) === "no_reauthorization");
    if (id === "paused-late-pr")
      return openDrilldown("Paused — late or missing progress report", (i) => classifyPauseReason(rows[i]) === "late_or_missing_pr");
    if (id === "submitted")
      return openDrilldown("Submitted authorization work", (i) =>
        ["submitted", "pending", "approved", "denied"].includes(classifyAuthStatus(rows[i])),
      );
    return openDrilldown("All authorizations in scope", () => true);
  };

  const weeklyChart = metrics.weekly.map((w) => ({
    label: fmtDate(w.weekStart),
    value: w.initialAssessmentSubmitted + w.initialTreatmentSubmitted + w.raSubmitted + w.prSubmitted,
    secondary: w.pausedNoRa + w.pausedLatePr,
  }));

  return (
    <PrimaryReportShell
      title="Authorization Analysis"
      subtitle="Weekly authorization workflow from CentralReach: initial assessments, initial treatment, reauthorizations, progress reports, and paused work with reasons."
      requiredExports={["Authorizations export"]}
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      onRefresh={data.refresh}
      exportDisabled={projected.length === 0}
      onExport={() => downloadCsv("authorization-analysis", projected, AUTH_DRILLDOWN_COLUMNS)}
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
          title="Weekly authorization workflow"
          subtitle="Submitted authorization work vs paused work, by week"
          type="bar"
          data={weeklyChart}
          valueLabel="Submitted"
          secondaryLabel="Paused"
          height={300}
          onSelect={(label) =>
            openDrilldown(`Week of ${label}`, (i) => fmtDate(rows[i].start_date ?? rows[i].end_date) === label)
          }
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <PrimaryChart
            title="Paused work by reason"
            type="pie"
            data={metrics.pauseReasons}
            valueLabel="Paused"
            onSelect={(label) =>
              openDrilldown(`Paused — ${label}`, (i) => {
                const reason = classifyPauseReason(rows[i]);
                if (label.toLowerCase().includes("reauthorization")) return reason === "no_reauthorization";
                if (label.toLowerCase().includes("progress")) return reason === "late_or_missing_pr";
                return reason === "other";
              })
            }
          />
          <PrimaryChart
            title="Approvals by payor"
            subtitle="Approved vs denied authorizations"
            type="bar"
            data={metrics.byPayor.slice(0, 10).map((p) => ({
              label: p.name,
              value: p.approved,
              secondary: p.denied,
            }))}
            valueLabel="Approved"
            secondaryLabel="Denied"
            onSelect={(label) =>
              openDrilldown(`Payor · ${label}`, (i) => (rows[i].payor ?? "Unknown") === label)
            }
          />
        </div>

        <PrimaryTable
          title="Authorization workload by payor"
          subtitle="Click a row to open its CentralReach source rows"
          rows={metrics.byPayor}
          rowKey={(r) => r.name}
          onRowClick={(r) =>
            openDrilldown(`Payor · ${r.name}`, (i) => (rows[i].payor ?? "Unknown") === r.name)
          }
          columns={[
            { key: "name", label: "Payor", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "submitted", label: "Submitted", align: "right", render: (r) => fmtCount(r.submitted) },
            { key: "approved", label: "Approved", align: "right", render: (r) => fmtCount(r.approved) },
            { key: "denied", label: "Denied", align: "right", render: (r) => fmtCount(r.denied) },
            { key: "paused", label: "Paused", align: "right", render: (r) => fmtCount(r.paused) },
            {
              key: "rate",
              label: "Approval Rate",
              align: "right",
              render: (r) => (
                <Badge variant={r.approvalRate >= 85 ? "secondary" : "destructive"} className="text-[10px]">
                  {fmtPct(r.approvalRate)}
                </Badge>
              ),
            },
          ]}
        />
      </div>

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}