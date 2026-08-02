/**
 * Primary report: BCBA Performance (`bcba-performance`).
 *
 * One comparable scorecard per BCBA combining billable productivity,
 * supervision coverage, parent-training coverage, assessment load, caseload,
 * RBT span, and authorization risk — all derived from CentralReach data.
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
import { computeBcbaPerformance } from "@/lib/os/reports/crPrimary/metrics/bcbaPerformance";
import { buildClientBcbaMap } from "@/lib/os/reports/crPrimary/metrics/supervision";
import { normalizeCode } from "@/lib/os/reports/crPrimary/metrics/codes";
import { Badge } from "@/components/ui/badge";

const SCORECARD_COLUMNS = [
  { key: "bcba", label: "BCBA" },
  { key: "score", label: "Score" },
  { key: "billableHours", label: "Billable Hours" },
  { key: "directHours", label: "97153 Direct Hours" },
  { key: "supervisionHours", label: "97155 Supervision Hours" },
  { key: "supervisionPct", label: "Supervision %" },
  { key: "parentTrainingHours", label: "97156 PT Hours" },
  { key: "ptCoveragePct", label: "PT Coverage %" },
  { key: "assessmentHours", label: "97151 Assessment Hours" },
  { key: "clientLoad", label: "Clients" },
  { key: "rbtLoad", label: "RBTs" },
  { key: "authRiskCount", label: "Auth Risk" },
  { key: "states", label: "States" },
  { key: "flags", label: "Flags" },
];

export default function BcbaPerformancePage() {
  const data = useCrPrimaryReport(["billing", "authorizations"]);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);

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

  const auths = useMemo(
    () =>
      applyFilters(data.authorizations, filters, (r) => ({
        date: r.start_date ?? r.end_date,
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        code: normalizeCode(r.procedure_code),
      })),
    [data.authorizations, filters],
  );

  const metrics = useMemo(() => computeBcbaPerformance(sessions, auths), [sessions, auths]);
  const clientToBcba = useMemo(() => buildClientBcbaMap(sessions), [sessions]);
  const projected = useMemo(() => projectBillingRows(sessions, clientToBcba), [sessions, clientToBcba]);

  const scorecardExportRows = useMemo(
    () =>
      metrics.scorecards.map((s) => ({
        ...s,
        supervisionPct: `${s.supervisionPct.toFixed(1)}%`,
        ptCoveragePct: `${s.ptCoveragePct.toFixed(1)}%`,
        states: s.states.join(" / "),
        flags: s.flags.join("; "),
      })),
    [metrics.scorecards],
  );

  const fields: FilterFieldConfig[] = useMemo(
    () => [
      { key: "state", label: "State", options: optionsFor(data.billing, (r) => r.state) },
      { key: "provider", label: "Provider", options: optionsFor(data.billing, (r) => r.rendering_provider_name) },
      { key: "client", label: "Client", options: optionsFor(data.billing, (r) => r.client_name) },
      { key: "payor", label: "Payor", options: optionsFor(data.billing, (r) => r.payor) },
      { key: "code", label: "Service Code", options: optionsFor(data.billing, (r) => normalizeCode(r.procedure_code)) },
    ],
    [data.billing],
  );

  const kpis: KpiDefinition[] = [
    { id: "bcbas", label: "BCBAs", value: fmtCount(metrics.bcbaCount) },
    { id: "hours", label: "Billable Hours", value: fmtHours(metrics.totalBillableHours) },
    { id: "clients", label: "Clients Served", value: fmtCount(metrics.clientCount) },
    { id: "rbts", label: "RBTs Supervised", value: fmtCount(metrics.rbtCount) },
    {
      id: "avg-score",
      label: "Avg Performance Score",
      value: fmtCount(metrics.avgScore),
      hint: "0-100 composite",
      tone: metrics.avgScore >= 80 ? "good" : metrics.avgScore >= 60 ? "warn" : "bad",
    },
    {
      id: "avg-supervision",
      label: "Avg Supervision %",
      value: fmtPct(metrics.avgSupervisionPct),
      tone: metrics.avgSupervisionPct >= 10 ? "good" : metrics.avgSupervisionPct >= 5 ? "warn" : "bad",
    },
    { id: "avg-pt", label: "Avg PT Coverage", value: fmtPct(metrics.avgPtCoveragePct) },
    {
      id: "flagged",
      label: "BCBAs With Flags",
      value: fmtCount(metrics.bcbasWithFlags),
      hint: `${fmtCount(metrics.authRiskTotal)} auth risks`,
      tone: metrics.bcbasWithFlags > 0 ? "bad" : "good",
    },
  ];

  const openBcba = (name: string) =>
    setDrilldown({
      title: `BCBA · ${name}`,
      subtitle: "CentralReach sessions attributed to this BCBA via 97155/97156 ownership.",
      rows: projected.filter(
        (_, i) => (clientToBcba.get((sessions[i].client_name ?? "").trim()) ?? "Unassigned") === name,
      ),
      columns: BILLING_DRILLDOWN_COLUMNS,
      exportName: `bcba-performance-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    });

  const onKpi = (id: string) => {
    if (id === "flagged") {
      const flagged = metrics.scorecards.filter((s) => s.flags.length > 0);
      return setDrilldown({
        title: "BCBAs with performance flags",
        subtitle: "Composite scorecard rows raising supervision, parent-training, or authorization flags.",
        rows: flagged.map((s) => ({
          ...s,
          supervisionPct: `${s.supervisionPct.toFixed(1)}%`,
          ptCoveragePct: `${s.ptCoveragePct.toFixed(1)}%`,
          states: s.states.join(" / "),
          flags: s.flags.join("; "),
        })),
        columns: SCORECARD_COLUMNS,
        exportName: "bcba-performance-flagged",
      });
    }
    return setDrilldown({
      title: "All BCBA session rows in scope",
      subtitle: "CentralReach session rows behind this report.",
      rows: projected,
      columns: BILLING_DRILLDOWN_COLUMNS,
      exportName: "bcba-performance-sessions",
    });
  };

  return (
    <PrimaryReportShell
      title="BCBA Performance"
      subtitle="Comparable BCBA scorecards built from CentralReach billing and authorization data: productivity, supervision, parent training, caseload, RBT span, and authorization risk."
      requiredExports={["Billing / session export", "Authorizations export"]}
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      onRefresh={data.refresh}
      exportDisabled={scorecardExportRows.length === 0}
      onExport={() => downloadCsv("bcba-performance", scorecardExportRows, SCORECARD_COLUMNS)}
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
          title="Performance score by BCBA"
          subtitle="Composite 0-100 score — lowest first"
          type="bar"
          data={[...metrics.scorecards]
            .sort((a, b) => a.score - b.score)
            .slice(0, 14)
            .map((s) => ({ label: s.bcba, value: s.score }))}
          valueLabel="Score"
          height={300}
          onSelect={openBcba}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <PrimaryChart
            title="Billable hours by BCBA"
            type="bar"
            data={[...metrics.scorecards]
              .sort((a, b) => b.billableHours - a.billableHours)
              .slice(0, 12)
              .map((s) => ({ label: s.bcba, value: s.billableHours, secondary: s.supervisionHours }))}
            valueLabel="Billable hours"
            secondaryLabel="Supervision hours"
            onSelect={openBcba}
          />
          <PrimaryChart
            title="Caseload vs RBT span"
            type="bar"
            data={[...metrics.scorecards]
              .sort((a, b) => b.clientLoad - a.clientLoad)
              .slice(0, 12)
              .map((s) => ({ label: s.bcba, value: s.clientLoad, secondary: s.rbtLoad }))}
            valueLabel="Clients"
            secondaryLabel="RBTs"
            onSelect={openBcba}
          />
        </div>

        <PrimaryTable
          title="BCBA scorecards"
          subtitle="Click a row to open the CentralReach sessions behind the score"
          rows={metrics.scorecards}
          rowKey={(r) => r.bcba}
          onRowClick={(r) => openBcba(r.bcba)}
          columns={[
            { key: "bcba", label: "BCBA", render: (r) => <span className="font-medium">{r.bcba}</span> },
            {
              key: "score",
              label: "Score",
              align: "right",
              render: (r) => (
                <Badge variant={r.score >= 80 ? "default" : r.score >= 60 ? "secondary" : "destructive"} className="text-[10px]">
                  {fmtCount(r.score)}
                </Badge>
              ),
            },
            { key: "billable", label: "Billable Hrs", align: "right", render: (r) => fmtHours(r.billableHours) },
            { key: "sup", label: "Supervision %", align: "right", render: (r) => fmtPct(r.supervisionPct) },
            { key: "pt", label: "PT Coverage", align: "right", render: (r) => fmtPct(r.ptCoveragePct) },
            { key: "assess", label: "97151 Hrs", align: "right", render: (r) => fmtHours(r.assessmentHours) },
            { key: "clients", label: "Clients", align: "right", render: (r) => fmtCount(r.clientLoad) },
            { key: "rbts", label: "RBTs", align: "right", render: (r) => fmtCount(r.rbtLoad) },
            { key: "risk", label: "Auth Risk", align: "right", render: (r) => fmtCount(r.authRiskCount) },
            {
              key: "flags",
              label: "Flags",
              render: (r) =>
                r.flags.length === 0 ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <span className="flex flex-wrap gap-1">
                    {r.flags.map((f) => (
                      <Badge key={f} variant="destructive" className="text-[10px]">
                        {f}
                      </Badge>
                    ))}
                  </span>
                ),
            },
          ]}
        />
      </div>

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}