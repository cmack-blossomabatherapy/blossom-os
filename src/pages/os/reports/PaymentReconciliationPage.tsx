/**
 * Primary report: Payment Reconciliation (`payment-reconciliation`).
 *
 * Finance-staff surface over the curated payments and ERA remittance snapshots.
 * It reports posting volume, date coverage, source-proven application status and
 * remittance reconciliation status. It is NOT a revenue-cycle or denial
 * dashboard, and it never renders a dollar value: the CentralReach exports do
 * not confirm the unit of their amount columns. Check numbers, payment
 * references and notes are restricted and never read here.
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
import {
  computePaymentReconciliation,
  NOT_DOCUMENTED,
  type EraRow,
  type PaymentRow,
} from "@/lib/os/reports/crPrimary/metrics/paymentReconciliation";

const PAYMENT_COLUMNS = [
  { key: "recordDate", label: "Posted" },
  { key: "dateOfService", label: "Date of service" },
  { key: "client", label: "Client" },
  { key: "payor", label: "Payor" },
  { key: "paymentType", label: "Payment type" },
  { key: "department", label: "Department" },
  { key: "location", label: "Location" },
  { key: "labels", label: "Labels" },
  { key: "application", label: "Application status" },
  { key: "voidedLabel", label: "Voided" },
];

const ERA_COLUMNS = [
  { key: "receivedDate", label: "Received" },
  { key: "payor", label: "Payor" },
  { key: "labels", label: "ERA labels" },
  { key: "claimCount", label: "Claims" },
  { key: "clientCount", label: "Clients" },
  { key: "reconcileState", label: "Reconcile status" },
  { key: "sourceStatus", label: "Source status" },
];

const paymentCsv = (r: PaymentRow) => ({
  ...r,
  recordDate: r.recordDate ?? NOT_DOCUMENTED,
  dateOfService: r.dateOfService ?? NOT_DOCUMENTED,
  voidedLabel: r.voided == null ? NOT_DOCUMENTED : r.voided ? "Yes" : "No",
});

const eraCsv = (r: EraRow) => ({
  ...r,
  receivedDate: r.receivedDate ?? NOT_DOCUMENTED,
  claimCount: r.claimCount ?? NOT_DOCUMENTED,
  clientCount: r.clientCount ?? NOT_DOCUMENTED,
});

export default function PaymentReconciliationPage() {
  const data = useCrPrimaryReport(["payments", "eraPayments"]);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);
  const [tab, setTab] = useState<"payments" | "era">("payments");

  const payments = useMemo(
    () =>
      applyFilters(data.payments, filters, (r) => ({
        date: r.record_date ?? r.creation_date,
        client: r.client_name,
        payor: r.payor,
        location: r.primary_location,
        status: r.payment_type,
      })),
    [data.payments, filters],
  );

  const era = useMemo(
    () =>
      applyFilters(data.eraPayments, filters, (r) => ({
        date: r.received_date,
        payor: r.payor,
        status: r.reconcile_status,
      })),
    [data.eraPayments, filters],
  );

  const metrics = useMemo(() => computePaymentReconciliation(payments, era), [payments, era]);

  const filterFields: FilterFieldConfig[] = useMemo(
    () => [
      { key: "payor", label: "Payor", options: optionsFor(data.payments, (r) => r.payor) },
      { key: "client", label: "Client", options: optionsFor(data.payments, (r) => r.client_name) },
      {
        key: "location",
        label: "Location",
        options: optionsFor(data.payments, (r) => r.primary_location),
      },
      {
        key: "status",
        label: "Payment type",
        options: optionsFor(data.payments, (r) => r.payment_type),
      },
    ],
    [data.payments],
  );

  const openPayments = (
    title: string,
    subtitle: string,
    rows: PaymentRow[],
    exportName: string,
    chips?: { label: string; value: string }[],
  ) =>
    setDrilldown({
      title,
      subtitle,
      filters: chips,
      rows: rows.map(paymentCsv),
      columns: PAYMENT_COLUMNS,
      exportName,
    });

  const openEra = (
    title: string,
    subtitle: string,
    rows: EraRow[],
    exportName: string,
    chips?: { label: string; value: string }[],
  ) =>
    setDrilldown({
      title,
      subtitle,
      filters: chips,
      rows: rows.map(eraCsv),
      columns: ERA_COLUMNS,
      exportName,
    });

  const coverage =
    metrics.paymentsCoverageStart && metrics.paymentsCoverageEnd
      ? `${fmtDate(metrics.paymentsCoverageStart)} – ${fmtDate(metrics.paymentsCoverageEnd)}`
      : NOT_DOCUMENTED;

  const kpis: KpiDefinition[] = [
    {
      id: "payments",
      label: "Payments posted",
      value: fmtCount(metrics.totalPayments),
      hint: `Date coverage ${coverage} · amounts not shown`,
    },
    {
      id: "applied",
      label: "Applied to billing",
      value: fmtCount(metrics.appliedPayments),
      hint: `${fmtCount(metrics.applicationNotDocumented)} not documented`,
      tone: "neutral",
    },
    {
      id: "unapplied",
      label: "Not applied",
      value: fmtCount(metrics.unappliedPayments),
      hint: "Source states no billing-entry link",
      tone: metrics.unappliedPayments > 0 ? "warn" : "good",
    },
    {
      id: "voided",
      label: "Voided payments",
      value: fmtCount(metrics.voidedPayments),
      hint: `${fmtCount(metrics.copayPayments)} flagged copay`,
      tone: metrics.voidedPayments > 0 ? "warn" : "good",
    },
    {
      id: "era",
      label: "ERA remittances",
      value: fmtCount(metrics.totalEraRemittances),
      hint:
        metrics.eraClaimsCovered == null
          ? "Claim counts not documented"
          : `${fmtCount(metrics.eraClaimsCovered)} claims covered`,
    },
    {
      id: "era-exceptions",
      label: "ERA exceptions",
      value: fmtCount(metrics.eraExceptionQueue.length),
      hint: `${fmtCount(metrics.eraFully)} fully reconciled · ${fmtCount(metrics.eraNotDocumented)} status not documented`,
      tone: metrics.eraExceptionQueue.length > 0 ? "warn" : "good",
    },
  ];

  const paymentColumns: PrimaryTableColumn<PaymentRow>[] = [
    {
      key: "posted",
      label: "Posted",
      render: (r) =>
        r.recordDate ? fmtDate(r.recordDate) : <span className="text-amber-600">{NOT_DOCUMENTED}</span>,
    },
    {
      key: "client",
      label: "Client",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.client}</p>
          <p className="truncate text-[10px] text-muted-foreground">{r.payor}</p>
        </div>
      ),
    },
    { key: "type", label: "Payment type", render: (r) => r.paymentType },
    { key: "department", label: "Department", render: (r) => r.department },
    { key: "location", label: "Location", render: (r) => r.location },
    {
      key: "application",
      label: "Application",
      render: (r) => (
        <span className={r.application === "Applied to a billing entry" ? "" : "text-amber-600"}>
          {r.application}
        </span>
      ),
    },
    {
      key: "voided",
      label: "Voided",
      render: (r) => (r.voided == null ? NOT_DOCUMENTED : r.voided ? "Yes" : "No"),
    },
  ];

  const eraColumns: PrimaryTableColumn<EraRow>[] = [
    {
      key: "received",
      label: "Received",
      render: (r) =>
        r.receivedDate ? fmtDate(r.receivedDate) : <span className="text-amber-600">{NOT_DOCUMENTED}</span>,
    },
    { key: "payor", label: "Payor", render: (r) => r.payor },
    { key: "labels", label: "ERA labels", render: (r) => r.labels },
    {
      key: "claims",
      label: "Claims",
      align: "right",
      render: (r) =>
        r.claimCount == null ? (
          <span className="text-amber-600">{NOT_DOCUMENTED}</span>
        ) : (
          <span className="tabular-nums">{fmtCount(r.claimCount)}</span>
        ),
    },
    {
      key: "clients",
      label: "Clients",
      align: "right",
      render: (r) =>
        r.clientCount == null ? (
          <span className="text-amber-600">{NOT_DOCUMENTED}</span>
        ) : (
          <span className="tabular-nums">{fmtCount(r.clientCount)}</span>
        ),
    },
    {
      key: "status",
      label: "Reconcile status",
      render: (r) => (
        <div className="min-w-0">
          <p
            className={
              r.reconcileState === "Fully reconciled" ? "truncate font-medium" : "truncate font-medium text-amber-600"
            }
          >
            {r.reconcileState}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">{r.sourceStatus}</p>
        </div>
      ),
    },
  ];

  return (
    <PrimaryReportShell
      title="Payment Reconciliation"
      subtitle="Payment posting volume, date coverage, source-proven application status and ERA remittance reconciliation. Amounts, check numbers, references and notes are intentionally not shown."
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      dataQualityWarnings={metrics.dataQualityWarnings}
      onRefresh={data.refresh}
      onExport={() =>
        tab === "payments"
          ? downloadCsv("payment-reconciliation-payments", metrics.paymentRows.map(paymentCsv), PAYMENT_COLUMNS)
          : downloadCsv("payment-reconciliation-era", metrics.eraRows.map(eraCsv), ERA_COLUMNS)
      }
      exportDisabled={tab === "payments" ? metrics.paymentRows.length === 0 : metrics.eraRows.length === 0}
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
            if (id === "unapplied") {
              openPayments(
                "Payments not applied to a billing entry",
                "Only payments whose source row states there is no billing-entry link.",
                metrics.unappliedQueue,
                "payments-not-applied",
              );
            } else if (id === "voided") {
              openPayments(
                "Voided payments",
                "Payments the source marks as voided.",
                metrics.paymentRows.filter((r) => r.voided === true),
                "payments-voided",
              );
            } else if (id === "era-exceptions") {
              openEra(
                "ERA reconciliation exceptions",
                "Remittances the source states are unreconciled, partially reconciled or over reconciled.",
                metrics.eraExceptionQueue,
                "era-exceptions",
              );
            }
          }}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <PrimaryChart
            title="Payment type mix"
            subtitle="Counts only — payment amounts are not shown."
            type="pie"
            valueLabel="Payments"
            data={metrics.paymentTypeMix.slice(0, 7).map((b) => ({ label: b.name, value: b.count }))}
            onSelect={(label) =>
              openPayments(
                `Payment type · ${label}`,
                "Payments of this type in the current filters.",
                metrics.paymentRows.filter((r) => r.paymentType === label),
                `payments-type-${label.toLowerCase().replace(/\s+/g, "-")}`,
                [{ label: "Payment type", value: label }],
              )
            }
          />
          <PrimaryChart
            title="ERA reconciliation status"
            subtitle="Remittance counts by documented reconcile status."
            type="bar"
            valueLabel="Remittances"
            data={metrics.eraStatusMix.map((b) => ({ label: b.name, value: b.count }))}
            onSelect={(label) =>
              openEra(
                `Reconcile status · ${label}`,
                "Remittances with this documented status.",
                metrics.eraRows.filter((r) => r.reconcileState === label),
                `era-${label.toLowerCase().replace(/\s+/g, "-")}`,
                [{ label: "Reconcile status", value: label }],
              )
            }
          />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "payments" | "era")}>
          <TabsList className="h-9">
            <TabsTrigger value="payments" className="text-xs">
              Payments
            </TabsTrigger>
            <TabsTrigger value="era" className="text-xs">
              ERA remittances
            </TabsTrigger>
          </TabsList>
          <TabsContent value="payments" className="mt-3">
            <PrimaryTable
              title="Posted payments"
              subtitle="Every payment in the current filters. Application status is shown only when the source proves it."
              rows={metrics.paymentRows}
              rowKey={(r) => r.key}
              columns={paymentColumns}
              emptyLabel="No payments match the current filters."
              onRowClick={(r) =>
                openPayments(
                  `Payment · ${r.client}`,
                  "Source payment detail. References, notes and amounts are restricted.",
                  [r],
                  "payment-detail",
                  [{ label: "Client", value: r.client }],
                )
              }
            />
          </TabsContent>
          <TabsContent value="era" className="mt-3">
            <PrimaryTable
              title="ERA remittances"
              subtitle="Remittance reconciliation status as stated by the source. Check numbers are not shown."
              rows={metrics.eraRows}
              rowKey={(r) => r.key}
              columns={eraColumns}
              emptyLabel="No ERA remittances match the current filters."
              onRowClick={(r) =>
                openEra(
                  `Remittance · ${r.payor}`,
                  "Source remittance detail. Check identifiers are restricted.",
                  [r],
                  "era-detail",
                  [{ label: "Payor", value: r.payor }],
                )
              }
            />
          </TabsContent>
        </Tabs>
      </div>

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}
