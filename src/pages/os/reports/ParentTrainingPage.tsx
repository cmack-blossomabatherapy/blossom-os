/**
 * Primary report: Parent Training (`parent-training`).
 *
 * 97156 parent-training coverage per BCBA, client, payor, and state, plus the
 * gap list of active clients receiving direct hours with no parent training.
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
import { fmtCount, fmtDate, fmtHours, fmtPct } from "@/lib/os/reports/crPrimary/format";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import { BILLING_DRILLDOWN_COLUMNS, projectBillingRows } from "@/lib/os/reports/crPrimary/drilldown";
import { computeParentTrainingMetrics } from "@/lib/os/reports/crPrimary/metrics/parentTraining";
import { buildClientBcbaMap } from "@/lib/os/reports/crPrimary/metrics/supervision";
import {
  CODE_PARENT_TRAINING,
  normalizeCode,
} from "@/lib/os/reports/crPrimary/metrics/codes";
import { Badge } from "@/components/ui/badge";

export default function ParentTrainingPage() {
  const data = useCrPrimaryReport(["billing"]);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);

  const rows = useMemo(
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

  const metrics = useMemo(() => computeParentTrainingMetrics(rows), [rows]);
  const clientToBcba = useMemo(() => buildClientBcbaMap(rows), [rows]);
  const projected = useMemo(() => projectBillingRows(rows, clientToBcba), [rows, clientToBcba]);

  const fields: FilterFieldConfig[] = useMemo(
    () => [
      { key: "state", label: "State", options: optionsFor(data.billing, (r) => r.state) },
      { key: "client", label: "Client", options: optionsFor(data.billing, (r) => r.client_name) },
      { key: "provider", label: "BCBA / Provider", options: optionsFor(data.billing, (r) => r.rendering_provider_name) },
      { key: "payor", label: "Payor", options: optionsFor(data.billing, (r) => r.payor) },
    ],
    [data.billing],
  );

  const kpis: KpiDefinition[] = [
    {
      id: "coverage",
      label: "PT Coverage",
      value: fmtPct(metrics.coveragePct),
      hint: "Active clients with 97156 hours",
      tone: metrics.coveragePct >= 80 ? "good" : metrics.coveragePct >= 60 ? "warn" : "bad",
    },
    { id: "pt-hours", label: "97156 Hours", value: fmtHours(metrics.ptHours) },
    { id: "active", label: "Active Clients", value: fmtCount(metrics.activeClients) },
    { id: "with-pt", label: "Clients With PT", value: fmtCount(metrics.clientsWithPt), tone: "good" },
    {
      id: "missing",
      label: "Clients Missing PT",
      value: fmtCount(metrics.clientsMissingPt),
      tone: metrics.clientsMissingPt > 0 ? "bad" : "good",
    },
    { id: "bcbas", label: "BCBAs Delivering PT", value: fmtCount(metrics.bcbaCount) },
    {
      id: "gaps",
      label: "Gap Clients",
      value: fmtCount(metrics.gapClients.length),
      hint: "Direct hours, no parent training",
      tone: metrics.gapClients.length > 0 ? "warn" : "good",
    },
    { id: "months", label: "Months Covered", value: fmtCount(metrics.trend.length) },
  ];

  const open = (title: string, predicate: (index: number) => boolean, subtitle?: string) => {
    setDrilldown({
      title,
      subtitle: subtitle ?? "CentralReach session rows with the matched supervising BCBA.",
      rows: projected.filter((_, i) => predicate(i)),
      columns: BILLING_DRILLDOWN_COLUMNS,
      exportName: `parent-training-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    });
  };

  const onKpi = (id: string) => {
    if (id === "pt-hours" || id === "coverage" || id === "with-pt")
      return open("97156 parent training sessions", (i) => normalizeCode(rows[i].procedure_code) === CODE_PARENT_TRAINING);
    if (id === "missing" || id === "gaps") {
      const gapNames = new Set(metrics.gapClients.map((g) => g.name));
      return open("Sessions for clients missing parent training", (i) =>
        gapNames.has((rows[i].client_name ?? "").trim()),
      );
    }
    return open("All session rows in scope", () => true);
  };

  return (
    <PrimaryReportShell
      title="Parent Training"
      subtitle="97156 parent-training delivery and coverage from CentralReach, with the clients who have active services but no parent training on record."
      requiredExports={["Billing / session export"]}
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      onRefresh={data.refresh}
      exportDisabled={projected.length === 0}
      onExport={() => downloadCsv("parent-training", projected, BILLING_DRILLDOWN_COLUMNS)}
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
          title="Parent training hours over time"
          subtitle="Monthly 97156 hours delivered"
          type="line"
          data={metrics.trend}
          valueLabel="97156 hours"
          height={300}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <PrimaryChart
            title="PT coverage by BCBA"
            subtitle="Share of each BCBA's clients with parent training"
            type="bar"
            data={[...metrics.byBcba]
              .sort((a, b) => a.coveragePct - b.coveragePct)
              .slice(0, 12)
              .map((b) => ({ label: b.name, value: b.coveragePct, secondary: b.hours }))}
            valueLabel="Coverage %"
            secondaryLabel="97156 hours"
            onSelect={(label) =>
              open(`BCBA · ${label}`, (i) => (clientToBcba.get((rows[i].client_name ?? "").trim()) ?? "Unassigned") === label)
            }
          />
          <PrimaryChart
            title="PT coverage by state"
            type="bar"
            data={metrics.byState.map((s) => ({ label: s.name, value: s.coveragePct }))}
            valueLabel="Coverage %"
            onSelect={(label) => open(`State · ${label}`, (i) => (rows[i].state ?? "Unknown") === label)}
          />
        </div>

        <PrimaryTable
          title="Clients with a parent training gap"
          subtitle="Active direct services with little or no 97156 — action required"
          rows={metrics.gapClients}
          rowKey={(r) => r.name}
          onRowClick={(r) => open(`Client · ${r.name}`, (i) => (rows[i].client_name ?? "").trim() === r.name)}
          emptyLabel="No parent-training gaps in the current scope."
          columns={[
            { key: "name", label: "Client", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "bcba", label: "Matched BCBA", render: (r) => r.bcba || "Unassigned" },
            { key: "direct", label: "Direct Hours", align: "right", render: (r) => fmtHours(r.directHours) },
            {
              key: "pt",
              label: "97156 Hours",
              align: "right",
              render: (r) => (
                <Badge variant={r.ptHours > 0 ? "secondary" : "destructive"} className="text-[10px]">
                  {fmtHours(r.ptHours)}
                </Badge>
              ),
            },
          ]}
        />

        <PrimaryTable
          title="Parent training by client"
          subtitle="Click a row to open its CentralReach sessions"
          rows={metrics.byClient}
          rowKey={(r) => r.name}
          onRowClick={(r) => open(`Client · ${r.name}`, (i) => (rows[i].client_name ?? "").trim() === r.name)}
          columns={[
            { key: "name", label: "Client", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "bcba", label: "Matched BCBA", render: (r) => r.bcba || "Unassigned" },
            { key: "hours", label: "97156 Hours", align: "right", render: (r) => fmtHours(r.hours) },
            { key: "last", label: "Last PT Session", align: "right", render: (r) => fmtDate(r.lastSession) },
          ]}
        />
      </div>

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}