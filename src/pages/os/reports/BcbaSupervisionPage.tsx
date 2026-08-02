/**
 * Primary report: BCBA Supervision (`bcba-supervision`).
 *
 * 97155 supervision hours measured against 97153 direct hours, per BCBA and
 * per client, with the locked clinical bands (<5% red, 5-10% yellow,
 * >=10% green) and drilldowns into CentralReach session rows.
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
import { fmtCount, fmtHours, fmtPct } from "@/lib/os/reports/crPrimary/format";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import { BILLING_DRILLDOWN_COLUMNS, projectBillingRows } from "@/lib/os/reports/crPrimary/drilldown";
import {
  SUPERVISION_TARGET_PCT,
  buildClientBcbaMap,
  computeSupervisionMetrics,
  type SupervisionBand,
} from "@/lib/os/reports/crPrimary/metrics/supervision";
import { CODE_SUPERVISION, normalizeCode } from "@/lib/os/reports/crPrimary/metrics/codes";
import { Badge } from "@/components/ui/badge";

const BAND_VARIANT: Record<SupervisionBand, "destructive" | "secondary" | "default"> = {
  red: "destructive",
  yellow: "secondary",
  green: "default",
};

export default function BcbaSupervisionPage() {
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

  const metrics = useMemo(() => computeSupervisionMetrics(rows), [rows]);
  const clientToBcba = useMemo(() => buildClientBcbaMap(rows), [rows]);
  const projected = useMemo(() => projectBillingRows(rows, clientToBcba), [rows, clientToBcba]);

  const fields: FilterFieldConfig[] = useMemo(
    () => [
      { key: "state", label: "State", options: optionsFor(data.billing, (r) => r.state) },
      { key: "client", label: "Client", options: optionsFor(data.billing, (r) => r.client_name) },
      { key: "provider", label: "Provider", options: optionsFor(data.billing, (r) => r.rendering_provider_name) },
      { key: "payor", label: "Payor", options: optionsFor(data.billing, (r) => r.payor) },
      { key: "code", label: "Service Code", options: optionsFor(data.billing, (r) => normalizeCode(r.procedure_code)) },
    ],
    [data.billing],
  );

  const kpis: KpiDefinition[] = [
    {
      id: "supervision-pct",
      label: "Supervision %",
      value: fmtPct(metrics.supervisionPct),
      hint: `Target ≥ ${SUPERVISION_TARGET_PCT}% of direct hours`,
      tone: metrics.supervisionPct >= 10 ? "good" : metrics.supervisionPct >= 5 ? "warn" : "bad",
    },
    { id: "h97155", label: "97155 Supervision Hours", value: fmtHours(metrics.hours97155) },
    { id: "h97153", label: "97153 Direct Hours", value: fmtHours(metrics.hours97153) },
    { id: "h97156", label: "97156 Parent Training Hours", value: fmtHours(metrics.hours97156) },
    { id: "bcbas", label: "BCBAs Supervising", value: fmtCount(metrics.bcbaCount) },
    { id: "clients", label: "Clients In Scope", value: fmtCount(metrics.clientCount) },
    {
      id: "bcbas-below",
      label: "BCBAs Below Target",
      value: fmtCount(metrics.bcbasBelowThreshold),
      tone: metrics.bcbasBelowThreshold > 0 ? "bad" : "good",
    },
    {
      id: "clients-below",
      label: "Clients Below Target",
      value: fmtCount(metrics.clientsBelowThreshold),
      tone: metrics.clientsBelowThreshold > 0 ? "bad" : "good",
    },
  ];

  const open = (title: string, predicate: (index: number) => boolean, subtitle?: string) => {
    setDrilldown({
      title,
      subtitle: subtitle ?? "CentralReach session rows with the matched supervising BCBA.",
      rows: projected.filter((_, i) => predicate(i)),
      columns: BILLING_DRILLDOWN_COLUMNS,
      exportName: `bcba-supervision-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    });
  };

  const onKpi = (id: string) => {
    if (id === "h97155")
      return open("97155 supervision sessions", (i) => normalizeCode(rows[i].procedure_code) === CODE_SUPERVISION);
    if (id === "h97153")
      return open("97153 direct sessions", (i) => normalizeCode(rows[i].procedure_code) === "97153");
    if (id === "h97156")
      return open("97156 parent training sessions", (i) => normalizeCode(rows[i].procedure_code) === "97156");
    if (id === "bcbas-below") {
      const below = new Set(
        metrics.byBcba.filter((b) => b.hours97153 > 0 && b.supervisionPct < SUPERVISION_TARGET_PCT).map((b) => b.name),
      );
      return open("Sessions for BCBAs below supervision target", (i) => {
        const client = (rows[i].client_name ?? "").trim();
        return below.has(clientToBcba.get(client) ?? "Unassigned");
      });
    }
    if (id === "clients-below") {
      const below = new Set(
        metrics.byClient.filter((c) => c.hours97153 > 0 && c.supervisionPct < SUPERVISION_TARGET_PCT).map((c) => c.name),
      );
      return open("Sessions for clients below supervision target", (i) =>
        below.has((rows[i].client_name ?? "Unknown client").trim() || "Unknown client"),
      );
    }
    return open("All session rows in scope", () => true);
  };

  return (
    <PrimaryReportShell
      title="BCBA Supervision"
      subtitle="97155 supervision coverage against 97153 direct hours by BCBA and client, with clinical banding and the exact CentralReach sessions behind each number."
      requiredExports={["Billing / session export"]}
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      onRefresh={data.refresh}
      exportDisabled={projected.length === 0}
      onExport={() => downloadCsv("bcba-supervision", projected, BILLING_DRILLDOWN_COLUMNS)}
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
          title="Supervision vs direct hours over time"
          subtitle="Monthly 97153 direct hours and 97155 supervision hours"
          type="line"
          data={metrics.trend}
          valueLabel="Direct hours"
          secondaryLabel="Supervision hours"
          height={300}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <PrimaryChart
            title="Supervision % by BCBA"
            subtitle="Lowest coverage first — anything under 5% needs intervention"
            type="bar"
            data={[...metrics.byBcba]
              .filter((b) => b.hours97153 > 0)
              .sort((a, b) => a.supervisionPct - b.supervisionPct)
              .slice(0, 12)
              .map((b) => ({ label: b.name, value: b.supervisionPct }))}
            valueLabel="Supervision %"
            onSelect={(label) =>
              open(`BCBA · ${label}`, (i) => (clientToBcba.get((rows[i].client_name ?? "").trim()) ?? "Unassigned") === label)
            }
          />
          <PrimaryChart
            title="Highest-risk clients"
            subtitle="High direct hours with low supervision coverage"
            type="bar"
            data={metrics.highRiskClients.slice(0, 12).map((c) => ({
              label: c.name,
              value: c.hours97153,
              secondary: c.hours97155,
            }))}
            valueLabel="Direct hours"
            secondaryLabel="Supervision hours"
            onSelect={(label) => open(`Client · ${label}`, (i) => (rows[i].client_name ?? "").trim() === label)}
          />
        </div>

        <PrimaryTable
          title="Supervision scorecard by BCBA"
          subtitle="Click a row to open the underlying CentralReach sessions"
          rows={metrics.byBcba}
          rowKey={(r) => r.name}
          onRowClick={(r) =>
            open(`BCBA · ${r.name}`, (i) => (clientToBcba.get((rows[i].client_name ?? "").trim()) ?? "Unassigned") === r.name)
          }
          columns={[
            { key: "name", label: "BCBA", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "clients", label: "Clients", align: "right", render: (r) => fmtCount(r.clients) },
            { key: "rbts", label: "RBTs", align: "right", render: (r) => fmtCount(r.rbts) },
            { key: "direct", label: "97153 Hours", align: "right", render: (r) => fmtHours(r.hours97153) },
            { key: "sup", label: "97155 Hours", align: "right", render: (r) => fmtHours(r.hours97155) },
            {
              key: "pct",
              label: "Supervision %",
              align: "right",
              render: (r) => (
                <Badge variant={BAND_VARIANT[r.band]} className="text-[10px]">
                  {fmtPct(r.supervisionPct)}
                </Badge>
              ),
            },
          ]}
        />

        <PrimaryTable
          title="Clients below the supervision target"
          subtitle={`Clients with direct hours and less than ${SUPERVISION_TARGET_PCT}% supervision`}
          rows={metrics.byClient.filter((c) => c.hours97153 > 0 && c.supervisionPct < SUPERVISION_TARGET_PCT)}
          rowKey={(r) => r.name}
          onRowClick={(r) => open(`Client · ${r.name}`, (i) => (rows[i].client_name ?? "").trim() === r.name)}
          emptyLabel="Every client in scope is meeting the supervision target."
          columns={[
            { key: "name", label: "Client", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "direct", label: "97153 Hours", align: "right", render: (r) => fmtHours(r.hours97153) },
            { key: "sup", label: "97155 Hours", align: "right", render: (r) => fmtHours(r.hours97155) },
            { key: "pct", label: "Supervision %", align: "right", render: (r) => fmtPct(r.supervisionPct) },
            { key: "rbts", label: "RBTs", align: "right", render: (r) => fmtCount(r.rbts) },
          ]}
        />
      </div>

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}