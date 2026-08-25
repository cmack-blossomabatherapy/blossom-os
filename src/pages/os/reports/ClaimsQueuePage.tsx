/**
 * Primary report: Claims Submission & Error Queue (`claims-submission-queue`).
 *
 * Staff-facing claims workflow surface over the curated `v_cr_claims_status`
 * snapshot. Dollar amounts are deliberately suppressed — the CentralReach claims
 * export does not confirm the unit of its amount columns.
 */
import { useMemo, useState } from "react";
import { PrimaryReportShell } from "@/components/reports/crPrimary/PrimaryReportShell";
import { KpiScorecards } from "@/components/reports/crPrimary/KpiScorecards";
import { PrimaryChart } from "@/components/reports/crPrimary/PrimaryChart";
import { PrimaryTable, type PrimaryTableColumn } from "@/components/reports/crPrimary/PrimaryTable";
import { DrilldownDrawer } from "@/components/reports/crPrimary/DrilldownDrawer";
import {
  PrimaryFilterBar,
  type FilterFieldConfig,
} from "@/components/reports/crPrimary/PrimaryFilterBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrPrimaryReport } from "@/hooks/useCrPrimaryReport";
import { applyFilters, optionsFor } from "@/lib/os/reports/crPrimary/filters";
import { EMPTY_FILTERS, type DrilldownRequest, type KpiDefinition } from "@/lib/os/reports/crPrimary/types";
import { fmtCount, fmtDate } from "@/lib/os/reports/crPrimary/format";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import { normalizeCode } from "@/lib/os/reports/crPrimary/metrics/codes";
import {
  computeClaimsQueue,
  NOT_DOCUMENTED,
  type ClaimsQueueRow,
} from "@/lib/os/reports/crPrimary/metrics/claimsQueue";

const EXPORT_COLUMNS = [
  { key: "claimNumber", label: "Claim #" },
  { key: "client", label: "Client" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "dateOfService", label: "Date of service" },
  { key: "procedureCode", label: "Service code" },
  { key: "status", label: "Status" },
  { key: "responseStatus", label: "Response status" },
  { key: "submitReason", label: "Submit reason" },
  { key: "errorCount", label: "Errors" },
  { key: "exportState", label: "Export state" },
  { key: "actionDate", label: "Action date" },
  { key: "actionAgeDays", label: "Action age (days)" },
  { key: "actionBy", label: "Action by" },
  { key: "followUpReason", label: "Follow-up reason" },
];

const BREAKDOWNS = [
  { key: "response", label: "Response status" },
  { key: "payor", label: "Payor" },
  { key: "reason", label: "Submit reason" },
] as const;

type BreakdownKey = (typeof BREAKDOWNS)[number]["key"];

const csvRow = (r: ClaimsQueueRow) => ({
  ...r,
  dateOfService: r.dateOfService ?? NOT_DOCUMENTED,
  actionDate: r.actionDate ?? NOT_DOCUMENTED,
  actionAgeDays: r.actionAgeDays ?? NOT_DOCUMENTED,
  errorCount: r.errorCount ?? NOT_DOCUMENTED,
  followUpReason: r.followUpReason ?? "",
});

export default function ClaimsQueuePage() {
  const data = useCrPrimaryReport(["claimsStatus"]);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);
  const [tab, setTab] = useState<BreakdownKey>("response");

  const rows = useMemo(
    () =>
      applyFilters(data.claimsStatus, filters, (r) => ({
        date: r.date_of_service,
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        code: normalizeCode(r.procedure_code),
        status: r.responses_status ?? r.status,
      })),
    [data.claimsStatus, filters],
  );

  const metrics = useMemo(() => computeClaimsQueue(rows), [rows]);

  const filterFields: FilterFieldConfig[] = useMemo(
    () => [
      { key: "state", label: "State", options: optionsFor(data.claimsStatus, (r) => r.state) },
      { key: "payor", label: "Payor", options: optionsFor(data.claimsStatus, (r) => r.payor) },
      { key: "client", label: "Client", options: optionsFor(data.claimsStatus, (r) => r.client_name) },
      {
        key: "code",
        label: "Service code",
        options: optionsFor(data.claimsStatus, (r) => normalizeCode(r.procedure_code)),
      },
      {
        key: "status",
        label: "Response status",
        options: optionsFor(data.claimsStatus, (r) => r.responses_status ?? r.status),
      },
    ],
    [data.claimsStatus],
  );

  const openDrilldown = (
    title: string,
    subtitle: string,
    queue: ClaimsQueueRow[],
    exportName: string,
    chips?: { label: string; value: string }[],
  ) =>
    setDrilldown({
      title,
      subtitle,
      filters: chips,
      rows: queue.map(csvRow),
      columns: EXPORT_COLUMNS,
      exportName,
    });

  const kpis: KpiDefinition[] = [
    {
      id: "total",
      label: "Claims in range",
      value: fmtCount(metrics.totalClaims),
      hint: "Dollar amounts are intentionally not shown",
    },
    {
      id: "errors",
      label: "Claims with errors",
      value: fmtCount(metrics.withErrors),
      hint: `${fmtCount(metrics.totalErrors)} source-reported errors`,
      tone: metrics.withErrors > 0 ? "bad" : "good",
    },
    {
      id: "not-exported",
      label: "Not exported",
      value: fmtCount(metrics.notExported),
      hint: `${fmtCount(metrics.exportStateNotDocumented)} with no export flag`,
      tone: metrics.notExported > 0 ? "warn" : "good",
    },
    {
      id: "response",
      label: "With response status",
      value: fmtCount(metrics.withResponseStatus),
      hint: `${fmtCount(metrics.totalClaims - metrics.withResponseStatus)} not documented`,
      tone: "neutral",
    },
    {
      id: "age",
      label: "Avg action age",
      value: metrics.avgActionAgeDays == null ? NOT_DOCUMENTED : `${metrics.avgActionAgeDays} d`,
      hint:
        metrics.oldestActionAgeDays == null
          ? "No documented action dates"
          : `Oldest ${metrics.oldestActionAgeDays} d · ${fmtCount(metrics.actionDateNotDocumented)} not documented`,
      tone: (metrics.avgActionAgeDays ?? 0) > 30 ? "warn" : "neutral",
    },
    {
      id: "followup",
      label: "Follow-up queue",
      value: fmtCount(metrics.followUpQueue.length),
      hint: "Errored or unexported claims",
      tone: metrics.followUpQueue.length > 0 ? "warn" : "good",
    },
  ];

  const columns: PrimaryTableColumn<ClaimsQueueRow>[] = [
    {
      key: "claim",
      label: "Claim",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.claimNumber}</p>
          <p className="truncate text-[10px] text-muted-foreground">{r.client}</p>
        </div>
      ),
    },
    { key: "payor", label: "Payor", render: (r) => r.payor },
    { key: "state", label: "State", render: (r) => r.state },
    {
      key: "dos",
      label: "Date of service",
      render: (r) => (r.dateOfService ? fmtDate(r.dateOfService) : <span className="text-amber-600">{NOT_DOCUMENTED}</span>),
    },
    { key: "code", label: "Service code", render: (r) => r.procedureCode },
    {
      key: "response",
      label: "Response",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.responseStatus}</p>
          <p className="truncate text-[10px] text-muted-foreground">{r.submitReason}</p>
        </div>
      ),
    },
    {
      key: "errors",
      label: "Errors",
      align: "right",
      render: (r) =>
        r.errorCount == null ? (
          <span className="text-amber-600">{NOT_DOCUMENTED}</span>
        ) : (
          <span className={r.errorCount > 0 ? "font-medium text-destructive tabular-nums" : "tabular-nums"}>
            {r.errorCount}
          </span>
        ),
    },
    {
      key: "export",
      label: "Export",
      render: (r) => (
        <span className={r.exportState === "Not exported" ? "text-amber-600" : ""}>{r.exportState}</span>
      ),
    },
    {
      key: "age",
      label: "Action age",
      align: "right",
      render: (r) =>
        r.actionAgeDays == null ? (
          <span className="text-amber-600">{NOT_DOCUMENTED}</span>
        ) : (
          <span className="tabular-nums">{r.actionAgeDays} d</span>
        ),
    },
    { key: "actionBy", label: "Action by", render: (r) => r.actionBy },
  ];

  const buckets = tab === "response" ? metrics.responseMix : tab === "payor" ? metrics.payors : metrics.submitReasons;

  const bucketMatch = (r: ClaimsQueueRow, name: string) =>
    (tab === "response" ? r.responseStatus : tab === "payor" ? r.payor : r.submitReason) === name;

  return (
    <PrimaryReportShell
      title="Claims Submission & Error Queue"
      subtitle="Claim submission state, source-reported errors, response mix and the follow-up work behind them. Claim dollar amounts are not shown because the source does not confirm their unit."
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      dataQualityWarnings={metrics.dataQualityWarnings}
      onRefresh={data.refresh}
      onExport={() => downloadCsv("claims-submission-queue", metrics.rows.map(csvRow), EXPORT_COLUMNS)}
      exportDisabled={metrics.rows.length === 0}
      filters={
        <PrimaryFilterBar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters({ ...EMPTY_FILTERS })}
          fields={filterFields}
        />
      }
    >
      <div className="space-y-5">
        <KpiScorecards
          kpis={kpis}
          onSelect={(id) => {
            if (id === "errors") {
              openDrilldown(
                "Claims with source-reported errors",
                "Every claim whose source row reports one or more errors.",
                metrics.rows.filter((r) => r.hasErrors),
                "claims-with-errors",
              );
            } else if (id === "not-exported") {
              openDrilldown(
                "Claims not exported",
                "Claims the source states have not been exported. Claims with no export flag are excluded.",
                metrics.rows.filter((r) => r.exportState === "Not exported"),
                "claims-not-exported",
              );
            } else if (id === "followup") {
              openDrilldown(
                "Claims follow-up queue",
                "Errored or unexported claims, oldest documented action first.",
                metrics.followUpQueue,
                "claims-follow-up",
              );
            }
          }}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <PrimaryChart
            title="Response / status mix"
            subtitle="Counts only — claim amounts are not shown."
            type="pie"
            valueLabel="Claims"
            data={metrics.responseMix.slice(0, 7).map((b) => ({ label: b.name, value: b.claims }))}
            onSelect={(label) =>
              openDrilldown(
                `Response · ${label}`,
                "Claims with this source response status.",
                metrics.rows.filter((r) => r.responseStatus === label),
                `claims-response-${label.toLowerCase().replace(/\s+/g, "-")}`,
                [{ label: "Response", value: label }],
              )
            }
          />
          <PrimaryChart
            title="Errors by payor"
            subtitle="Claims with source-reported errors, by payor."
            type="bar"
            valueLabel="Claims with errors"
            secondaryLabel="Claims"
            data={metrics.payors
              .slice(0, 8)
              .map((b) => ({ label: b.name, value: b.withErrors, secondary: b.claims }))}
            onSelect={(label) =>
              openDrilldown(
                `Payor · ${label}`,
                "Claims for this payor in the current filters.",
                metrics.rows.filter((r) => r.payor === label),
                `claims-payor-${label.toLowerCase().replace(/\s+/g, "-")}`,
                [{ label: "Payor", value: label }],
              )
            }
          />
        </div>

        <PrimaryTable
          title="Follow-up queue"
          subtitle="Claims with source-reported errors or an unexported state, oldest documented action first."
          rows={metrics.followUpQueue}
          rowKey={(r) => r.key}
          columns={columns}
          emptyLabel="No claim in this range has a source-reported error or an unexported state."
          onRowClick={(r) =>
            openDrilldown(
              `Claim · ${r.claimNumber}`,
              r.followUpReason ?? "Claim detail.",
              [r],
              `claim-${r.claimNumber.toLowerCase().replace(/\s+/g, "-")}`,
              [{ label: "Claim", value: r.claimNumber }],
            )
          }
        />

        <Tabs value={tab} onValueChange={(v) => setTab(v as BreakdownKey)}>
          <TabsList className="h-9">
            {BREAKDOWNS.map((b) => (
              <TabsTrigger key={b.key} value={b.key} className="text-xs">
                {b.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {BREAKDOWNS.map((b) => (
            <TabsContent key={b.key} value={b.key} className="mt-3">
              <PrimaryTable
                title={`Claims by ${b.label.toLowerCase()}`}
                subtitle="Click a row to open the exact source claims behind it."
                rows={buckets}
                rowKey={(g) => g.key}
                columns={[
                  { key: "name", label: b.label, render: (g) => g.name },
                  { key: "claims", label: "Claims", align: "right", render: (g) => <span className="tabular-nums">{fmtCount(g.claims)}</span> },
                  { key: "withErrors", label: "With errors", align: "right", render: (g) => <span className="tabular-nums">{fmtCount(g.withErrors)}</span> },
                  { key: "notExported", label: "Not exported", align: "right", render: (g) => <span className="tabular-nums">{fmtCount(g.notExported)}</span> },
                ]}
                onRowClick={(g) =>
                  openDrilldown(
                    `${b.label} · ${g.name}`,
                    "Source claims behind this row.",
                    metrics.rows.filter((r) => bucketMatch(r, g.name)),
                    `claims-${b.key}-${g.name.toLowerCase().replace(/\s+/g, "-")}`,
                    [{ label: b.label, value: g.name }],
                  )
                }
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}
