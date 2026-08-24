/**
 * Shared operator dashboard for the 7 non-BCBA primary CentralReach reports.
 *
 * Renders real operator chrome — data-freshness indicator, working filters,
 * KPI scorecards, Recharts sections, a grouped action table, a source-row
 * drilldown drawer, and CSV export — from the normalized `cr_*` tables with
 * tolerant field extraction. When no CentralReach rows exist it renders the
 * Data Hub empty state instead of fabricated numbers.
 *
 * There are intentionally NO upload controls here: CentralReach files are
 * ingested once in the CentralReach Data Hub.
 */
import { useMemo, useState } from "react";
import { PrimaryReportShell } from "@/components/reports/crPrimary/PrimaryReportShell";
import { KpiScorecards } from "@/components/reports/crPrimary/KpiScorecards";
import { PrimaryChart } from "@/components/reports/crPrimary/PrimaryChart";
import { PrimaryFilterBar, type FilterFieldConfig } from "@/components/reports/crPrimary/PrimaryFilterBar";
import { PrimaryTable, type PrimaryTableColumn } from "@/components/reports/crPrimary/PrimaryTable";
import { DrilldownDrawer } from "@/components/reports/crPrimary/DrilldownDrawer";
import { useCrPrimaryReport } from "@/hooks/useCrPrimaryReport";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import { optionsFor } from "@/lib/os/reports/crPrimary/filters";
import { EMPTY_FILTERS } from "@/lib/os/reports/crPrimary/types";
import type { DrilldownRequest, PrimaryReportFilters } from "@/lib/os/reports/crPrimary/types";
import {
  authorizationFacts,
  billingFacts,
  chartData,
  factsForDim,
  filterFacts,
  formatGroupCell,
  groupExportColumns,
  groupExportRows,
  groupFacts,
  scheduleFacts,
  sharedReportConfig,
  utilizationFacts,
  type FactGroup,
  type ReportFact,
  type SharedPrimaryReportId,
} from "@/lib/os/reports/crPrimary/sharedReport";

const FILTER_LABELS: Record<string, string> = {
  state: "State",
  client: "Client",
  provider: "Provider",
  payor: "Payor",
  code: "Code",
  location: "Location",
  status: "Status",
};

export interface CentralReachPrimaryReportProps {
  reportId: SharedPrimaryReportId;
}

export function CentralReachPrimaryReport({ reportId }: CentralReachPrimaryReportProps) {
  const config = sharedReportConfig(reportId);
  const data = useCrPrimaryReport(config.datasets);
  // URL-backed so filters survive remounts, reloads, and shared links.
  const [filters, setFilters] = useUrlFilterState<PrimaryReportFilters>(EMPTY_FILTERS);

  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);

  // Normalized cr_* rows -> tolerant facts for the report's driving dataset.
  const allFacts = useMemo<ReportFact[]>(() => {
    const facts =
      config.factSource === "billing"
        ? billingFacts(data.billing)
        : config.factSource === "schedule"
          ? scheduleFacts(data.schedule)
          : config.factSource === "authorizations"
            ? authorizationFacts(data.authorizations)
            : utilizationFacts(data.utilization);
    return config.factFilter ? facts.filter(config.factFilter) : facts;
  }, [config, data.billing, data.schedule, data.authorizations, data.utilization]);

  const facts = useMemo(() => filterFacts(allFacts, filters), [allFacts, filters]);
  const groups = useMemo(() => {
    const sortKey = config.columns[1]?.key ?? "rows";
    return groupFacts(facts, config.groupDim).sort(
      (a, b) => Number(b[sortKey as keyof FactGroup] ?? 0) - Number(a[sortKey as keyof FactGroup] ?? 0),
    );
  }, [facts, config]);

  const kpis = useMemo(() => config.kpis(facts), [config, facts]);

  const filterFields = useMemo<FilterFieldConfig[]>(
    () =>
      config.filterFields.map((key) => ({
        key,
        label: FILTER_LABELS[key] ?? key,
        options: optionsFor(allFacts, (f) => f[key]),
      })),
    [config.filterFields, allFacts],
  );

  const openDrilldown = (
    title: string,
    subtitle: string,
    rows: ReportFact[],
    exportName: string,
  ) => {
    setDrilldown({
      title,
      subtitle,
      rows: rows.map((f) => f.source),
      columns: config.drilldownColumns,
      exportName,
    });
  };

  const handleKpi = (id: string) => {
    const kpi = kpis.find((k) => k.id === id);
    if (!kpi) return;
    let rows = facts;
    if (kpi.onlyCancelled) rows = rows.filter((f) => f.cancelled);
    if (kpi.dim && kpi.dimValue) rows = factsForDim(rows, kpi.dim, kpi.dimValue);
    openDrilldown(
      `${kpi.label}: ${kpi.value}`,
      "CentralReach source rows behind this metric, with matched Blossom context.",
      rows,
      `${reportId}-${id}`,
    );
  };

  const handleSegment = (dim: typeof config.groupDim, label: string) => {
    openDrilldown(
      `${FILTER_LABELS[dim] ?? config.groupLabel}: ${label}`,
      "Filtered CentralReach source rows for this selection.",
      factsForDim(facts, dim, label),
      `${reportId}-${dim}-${label}`,
    );
  };

  const tableColumns = useMemo<PrimaryTableColumn<FactGroup>[]>(
    () =>
      config.columns.map((c) => ({
        key: String(c.key),
        label: c.label,
        align: c.align,
        render: (group: FactGroup) => formatGroupCell(group, c),
      })),
    [config.columns],
  );

  return (
    <>
      <PrimaryReportShell
        title={config.title}
        subtitle={config.subtitle}
        requiredExports={config.requiredExports}
        freshness={data.freshness}
        loading={data.loading}
        empty={data.empty || allFacts.length === 0}
        errorMessage={data.errorMessage}
        onRefresh={data.refresh}
        onExport={() =>
          downloadCsv(reportId, groupExportRows(groups, config), groupExportColumns(config))
        }
        exportDisabled={groups.length === 0}
        filters={
          <PrimaryFilterBar
            filters={filters}
            fields={filterFields}
            onChange={setFilters}
            onReset={() => setFilters(EMPTY_FILTERS)}
          />
        }
      >
        <div className="space-y-5">
          <KpiScorecards kpis={kpis} onSelect={handleKpi} />

          <section className="grid gap-3 lg:grid-cols-2">
            {config.charts.map((chart) => (
              <PrimaryChart
                key={chart.title}
                title={chart.title}
                subtitle={chart.subtitle}
                type={chart.type}
                data={chartData(facts, chart.dim, chart.measure)}
                valueLabel={chart.valueLabel}
                onSelect={(label) => handleSegment(chart.dim, label)}
              />
            ))}
          </section>

          <PrimaryTable<FactGroup>
            title={config.tableTitle}
            subtitle={`Grouped by ${config.groupLabel.toLowerCase()} · click a row for CentralReach source rows`}
            columns={tableColumns}
            rows={groups}
            rowKey={(g) => g.label}
            onRowClick={(g) => handleSegment(config.groupDim, g.label)}
          />
        </div>
      </PrimaryReportShell>

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </>
  );
}

export default CentralReachPrimaryReport;