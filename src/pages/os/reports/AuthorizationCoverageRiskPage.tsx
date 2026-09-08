/**
 * Authorization Coverage Risk (`authorization-coverage-risk`).
 *
 * A staff-facing "confirm before it becomes a problem" queue. Every row here
 * is a CANDIDATE gap that needs human confirmation — this page never asserts
 * a confirmed service pause, and it never invents an authorization lifecycle
 * event (submitted / approved / denied / paused). Lifecycle counts live only
 * on the Authorization Command Center and are intentionally not duplicated
 * here.
 */
import { useEffect, useMemo, useState } from "react";
import { PrimaryReportShell } from "@/components/reports/crPrimary/PrimaryReportShell";
import { KpiScorecards } from "@/components/reports/crPrimary/KpiScorecards";
import { PrimaryTable, type PrimaryTableColumn } from "@/components/reports/crPrimary/PrimaryTable";
import { DrilldownDrawer } from "@/components/reports/crPrimary/DrilldownDrawer";
import {
  PrimaryFilterBar,
  type FilterFieldConfig,
} from "@/components/reports/crPrimary/PrimaryFilterBar";
import { ReportProvenance } from "@/components/reports/crPrimary/ReportProvenance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrPrimaryReport } from "@/hooks/useCrPrimaryReport";
import { useUrlFilterState } from "@/hooks/useUrlFilterState";
import { useUrlState } from "@/hooks/useUrlState";
import { applyFilters, optionsFor } from "@/lib/os/reports/crPrimary/filters";
import { EMPTY_FILTERS, type DrilldownRequest, type KpiDefinition } from "@/lib/os/reports/crPrimary/types";
import { fmtCount, fmtDate, fmtHours } from "@/lib/os/reports/crPrimary/format";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import { localIsoDate } from "@/lib/os/reports/crPrimary/reportWindow";
import {
  computeAuthorizationCoverageRisk,
  NOT_DOCUMENTED,
  type BillingCoverageGapRow,
  type ScheduledCoverageGapRow,
} from "@/lib/os/reports/crPrimary/metrics/authorizationCoverageRisk";
import type { ContinuityRow, CoverageGapRow } from "@/lib/os/reports/crPrimary/metrics/authorizationContinuity";
import { pushRecent } from "@/lib/os/reportsCatalog";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "expiring-expired", label: "Expiring & Expired" },
  { key: "activity-gaps", label: "Activity Gaps" },
  { key: "scheduled-gaps", label: "Scheduled Gaps" },
  { key: "data-gaps", label: "Data Gaps" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const CONTINUITY_COLUMNS: PrimaryTableColumn<ContinuityRow>[] = [
  { key: "authorizationNumber", label: "Authorization #", render: (r) => r.authorizationNumber },
  {
    key: "client",
    label: "Client",
    render: (r) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{r.client}</p>
        <p className="truncate text-[10px] text-muted-foreground">{r.payor} · {r.state}</p>
      </div>
    ),
  },
  { key: "code", label: "Code", render: (r) => r.code },
  { key: "endDate", label: "End date", render: (r) => (r.endDate ? fmtDate(r.endDate) : NOT_DOCUMENTED) },
  {
    key: "daysToExpiry",
    label: "Days",
    align: "right",
    render: (r) => (r.daysToExpiry == null ? NOT_DOCUMENTED : <span className="tabular-nums">{r.daysToExpiry}</span>),
  },
  {
    key: "remainingHours",
    label: "Remaining hrs",
    align: "right",
    render: (r) =>
      r.remainingHours == null ? (
        <span className="text-amber-600">{NOT_DOCUMENTED}</span>
      ) : (
        <span className="tabular-nums">{fmtHours(r.remainingHours)}</span>
      ),
  },
  { key: "note", label: "Candidate — confirm", render: (r) => <span className="text-amber-600">{r.note}</span> },
];

const CONTINUITY_EXPORT_COLUMNS = [
  { key: "authorizationNumber", label: "Authorization #" },
  { key: "client", label: "Client" },
  { key: "clientCrId", label: "CR Client Id" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "code", label: "Service Code" },
  { key: "startDate", label: "Start" },
  { key: "endDate", label: "End" },
  { key: "daysToExpiry", label: "Days To Expiry" },
  { key: "continuity", label: "Coverage" },
  { key: "remainingHours", label: "Remaining Hrs" },
  { key: "note", label: "Candidate — Confirm" },
];

const COVERAGE_GAP_COLUMNS: PrimaryTableColumn<CoverageGapRow>[] = [
  {
    key: "client",
    label: "Client",
    render: (r) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{r.client}</p>
        <p className="truncate text-[10px] text-muted-foreground">{r.payor} · {r.state}</p>
      </div>
    ),
  },
  { key: "lastEnd", label: "Last known end", render: (r) => (r.lastEnd ? fmtDate(r.lastEnd) : NOT_DOCUMENTED) },
  { key: "note", label: "Candidate — confirm", render: (r) => <span className="text-amber-600">{r.note}</span> },
];

const COVERAGE_GAP_EXPORT_COLUMNS = [
  { key: "client", label: "Client" },
  { key: "clientCrId", label: "CR Client Id" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "lastEnd", label: "Last Coverage End" },
  { key: "note", label: "Candidate — Confirm" },
];

const BILLING_GAP_COLUMNS: PrimaryTableColumn<BillingCoverageGapRow>[] = [
  { key: "dateOfService", label: "Date of service", render: (r) => fmtDate(r.dateOfService) },
  {
    key: "client",
    label: "Client",
    render: (r) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{r.client}</p>
        <p className="truncate text-[10px] text-muted-foreground">{r.payor} · {r.state}</p>
      </div>
    ),
  },
  { key: "code", label: "Code", render: (r) => r.code },
  { key: "note", label: "Candidate — confirm", render: (r) => <span className="text-amber-600">{r.note}</span> },
];

const BILLING_GAP_EXPORT_COLUMNS = [
  { key: "dateOfService", label: "Date Of Service" },
  { key: "client", label: "Client" },
  { key: "clientCrId", label: "CR Client Id" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "code", label: "Service Code" },
  { key: "note", label: "Candidate — Confirm" },
];

const SCHEDULED_GAP_COLUMNS: PrimaryTableColumn<ScheduledCoverageGapRow>[] = [
  { key: "eventDate", label: "Scheduled date", render: (r) => fmtDate(r.eventDate) },
  {
    key: "client",
    label: "Client",
    render: (r) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{r.client}</p>
        <p className="truncate text-[10px] text-muted-foreground">{r.payor} · {r.state}</p>
      </div>
    ),
  },
  { key: "code", label: "Code", render: (r) => r.code },
  { key: "note", label: "Candidate — confirm", render: (r) => <span className="text-amber-600">{r.note}</span> },
];

const SCHEDULED_GAP_EXPORT_COLUMNS = [
  { key: "eventDate", label: "Scheduled Date" },
  { key: "client", label: "Client" },
  { key: "clientCrId", label: "CR Client Id" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "code", label: "Service Code" },
  { key: "note", label: "Candidate — Confirm" },
];

const continuityCsv = (r: ContinuityRow) => ({
  ...r,
  startDate: r.startDate ?? NOT_DOCUMENTED,
  endDate: r.endDate ?? NOT_DOCUMENTED,
  daysToExpiry: r.daysToExpiry ?? NOT_DOCUMENTED,
  remainingHours: r.remainingHours ?? NOT_DOCUMENTED,
});

/**
 * Explicit, flat projections for the drilldown drawer and CSV export. The
 * shared drawer/export API takes plain records, so each queue row is projected
 * field by field rather than widening the metric row types themselves.
 */
const coverageGapCsv = (r: CoverageGapRow): Record<string, unknown> => ({
  client: r.client,
  clientCrId: r.clientCrId,
  payor: r.payor,
  state: r.state,
  lastEnd: r.lastEnd ?? NOT_DOCUMENTED,
  note: r.note,
});

const billingGapCsv = (r: BillingCoverageGapRow): Record<string, unknown> => ({
  dateOfService: r.dateOfService,
  client: r.client,
  clientCrId: r.clientCrId,
  payor: r.payor,
  state: r.state,
  code: r.code,
  note: r.note,
});

const scheduledGapCsv = (r: ScheduledCoverageGapRow): Record<string, unknown> => ({
  eventDate: r.eventDate,
  client: r.client,
  clientCrId: r.clientCrId,
  payor: r.payor,
  state: r.state,
  code: r.code,
  note: r.note,
});


export default function AuthorizationCoverageRiskPage() {
  const data = useCrPrimaryReport(["authCurrent", "billingFacts", "scheduleCurrent"]);
  const [filters, setFilters] = useUrlFilterState({ ...EMPTY_FILTERS });
  const [tabParam, setTabParam] = useUrlState("tab", "overview");
  const tab = (TABS.some((t) => t.key === tabParam) ? tabParam : "overview") as TabKey;
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);
  const today = useMemo(() => localIsoDate(), []);

  useEffect(() => {
    pushRecent("authorization-coverage-risk");
  }, []);

  // This is a *current* risk queue, not dated activity — a selected date
  // range must never hide a coverage gap that exists right now.
  const nonDateFilters = useMemo(() => ({ ...filters, from: "", to: "" }), [filters]);

  const authRows = useMemo(
    () =>
      applyFilters(data.authCurrent, nonDateFilters, (r) => ({
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        code: r.service_codes ?? r.procedure_code,
      })),
    [data.authCurrent, nonDateFilters],
  );

  const billingRows = useMemo(
    () =>
      applyFilters(data.billingFacts, nonDateFilters, (r) => ({
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        code: r.procedure_code,
      })),
    [data.billingFacts, nonDateFilters],
  );

  const scheduleRows = useMemo(
    () =>
      applyFilters(data.scheduleCurrent, nonDateFilters, (r) => ({
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        code: r.service_code ?? r.procedure_code ?? r.billing_code,
      })),
    [data.scheduleCurrent, nonDateFilters],
  );

  const metrics = useMemo(
    () => computeAuthorizationCoverageRisk(authRows, billingRows, scheduleRows, today),
    [authRows, billingRows, scheduleRows, today],
  );

  const filterFields: FilterFieldConfig[] = useMemo(
    () => [
      { key: "state", label: "State", options: optionsFor(data.authCurrent, (r) => r.state) },
      { key: "client", label: "Client", options: optionsFor(data.authCurrent, (r) => r.client_name) },
      { key: "payor", label: "Payor", options: optionsFor(data.authCurrent, (r) => r.payor) },
      {
        key: "code",
        label: "Service Code",
        options: optionsFor(data.authCurrent, (r) => r.service_codes ?? r.procedure_code),
      },
    ],
    [data.authCurrent],
  );

  const kpis: KpiDefinition[] = [
    {
      id: "no-coverage",
      label: "No active coverage today",
      value: fmtCount(metrics.clientsWithoutCoverage.length),
      hint: "Needs confirmation — not a confirmed pause.",
      tone: metrics.clientsWithoutCoverage.length > 0 ? "warn" : "good",
    },
    {
      id: "expired",
      label: "Expired authorizations",
      value: fmtCount(metrics.expired.length),
      tone: metrics.expired.length > 0 ? "warn" : "good",
    },
    {
      id: "expiring-14",
      label: "Expiring within 14 days",
      value: fmtCount(metrics.expiring14.length),
      tone: metrics.expiring14.length > 0 ? "warn" : "good",
    },
    {
      id: "zero-hours",
      label: "Zero / exhausted remaining hours",
      value: fmtCount(metrics.zeroRemainingHours.length),
      hint: "Documented remaining hours only.",
      tone: metrics.zeroRemainingHours.length > 0 ? "warn" : "good",
    },
    {
      id: "billing-gaps",
      label: "Billing with no matched coverage",
      value: fmtCount(metrics.billingGaps.length),
      tone: metrics.billingGaps.length > 0 ? "warn" : "good",
    },
    {
      id: "scheduled-gaps",
      label: "Future kept sessions with no matched coverage",
      value: fmtCount(metrics.scheduledGaps.length),
      tone: metrics.scheduledGaps.length > 0 ? "warn" : "good",
    },
    {
      id: "unknown-dates",
      label: "Unknown / malformed authorization dates",
      value: fmtCount(metrics.unknownDates.length),
      tone: metrics.unknownDates.length > 0 ? "warn" : "good",
    },
  ];

  const openContinuity = (title: string, subtitle: string, rows: ContinuityRow[], exportName: string) =>
    setDrilldown({
      title,
      subtitle,
      rows: rows.map(continuityCsv),
      columns: CONTINUITY_EXPORT_COLUMNS,
      exportName,
    });

  const openCoverageGaps = (title: string, subtitle: string, rows: CoverageGapRow[], exportName: string) =>
    setDrilldown({ title, subtitle, rows, columns: COVERAGE_GAP_EXPORT_COLUMNS, exportName });

  const openBillingGaps = (title: string, subtitle: string, rows: BillingCoverageGapRow[], exportName: string) =>
    setDrilldown({ title, subtitle, rows, columns: BILLING_GAP_EXPORT_COLUMNS, exportName });

  const openScheduledGaps = (
    title: string,
    subtitle: string,
    rows: ScheduledCoverageGapRow[],
    exportName: string,
  ) => setDrilldown({ title, subtitle, rows, columns: SCHEDULED_GAP_EXPORT_COLUMNS, exportName });

  const exportForTab = () => {
    if (tab === "activity-gaps") {
      downloadCsv("authorization-coverage-risk-billing-gaps", metrics.billingGaps, BILLING_GAP_EXPORT_COLUMNS);
    } else if (tab === "scheduled-gaps") {
      downloadCsv("authorization-coverage-risk-scheduled-gaps", metrics.scheduledGaps, SCHEDULED_GAP_EXPORT_COLUMNS);
    } else if (tab === "data-gaps") {
      downloadCsv(
        "authorization-coverage-risk-data-gaps",
        metrics.unknownDates.map(continuityCsv),
        CONTINUITY_EXPORT_COLUMNS,
      );
    } else if (tab === "expiring-expired") {
      downloadCsv(
        "authorization-coverage-risk-expiring-expired",
        [...metrics.expired, ...metrics.expiring14].map(continuityCsv),
        CONTINUITY_EXPORT_COLUMNS,
      );
    } else {
      downloadCsv(
        "authorization-coverage-risk-overview",
        metrics.clientsWithoutCoverage,
        COVERAGE_GAP_EXPORT_COLUMNS,
      );
    }
  };

  const exportDisabled =
    tab === "activity-gaps"
      ? metrics.billingGaps.length === 0
      : tab === "scheduled-gaps"
        ? metrics.scheduledGaps.length === 0
        : tab === "data-gaps"
          ? metrics.unknownDates.length === 0
          : tab === "expiring-expired"
            ? metrics.expired.length === 0 && metrics.expiring14.length === 0
            : metrics.clientsWithoutCoverage.length === 0;

  return (
    <PrimaryReportShell
      title="Authorization Coverage Risk"
      subtitle="Coverage gap candidates surfaced from the current authorization snapshot, billed activity, and kept scheduled activity. Every row here needs staff confirmation — nothing on this page asserts a confirmed service pause or a service delivered without authorization."
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      onRefresh={data.refresh}
      onExport={exportForTab}
      exportDisabled={exportDisabled}
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
            if (id === "no-coverage") {
              openCoverageGaps(
                "Clients with no active coverage today",
                "Latest known end date is strictly before today and no authorization currently covers today. Needs confirmation, not a confirmed pause.",
                metrics.clientsWithoutCoverage,
                "coverage-risk-no-coverage",
              );
            } else if (id === "expired") {
              openContinuity(
                "Expired authorizations",
                "Authorizations whose latest documented end date is in the past.",
                metrics.expired,
                "coverage-risk-expired",
              );
            } else if (id === "expiring-14") {
              openContinuity(
                "Expiring within 14 days",
                "Currently active authorizations ending within 14 days.",
                metrics.expiring14,
                "coverage-risk-expiring-14",
              );
            } else if (id === "zero-hours") {
              openContinuity(
                "Zero / exhausted remaining hours",
                "Only authorizations with a documented remaining-hours value of zero or less. A missing value is never counted as zero.",
                metrics.zeroRemainingHours,
                "coverage-risk-zero-hours",
              );
            } else if (id === "billing-gaps") {
              openBillingGaps(
                "Billing with no matched coverage",
                "Billed activity whose date of service has no matched active authorization on the current snapshot.",
                metrics.billingGaps,
                "coverage-risk-billing-gaps",
              );
            } else if (id === "scheduled-gaps") {
              openScheduledGaps(
                "Future kept sessions with no matched coverage",
                "Future, not-cancelled scheduled activity with no matched active authorization on the current snapshot.",
                metrics.scheduledGaps,
                "coverage-risk-scheduled-gaps",
              );
            } else if (id === "unknown-dates") {
              openContinuity(
                "Unknown / malformed authorization dates",
                "Authorization rows with no usable start/end date pair on the current snapshot.",
                metrics.unknownDates,
                "coverage-risk-unknown-dates",
              );
            }
          }}
        />

        <Tabs value={tab} onValueChange={(v) => setTabParam(v)}>
          <TabsList className="h-9 flex-wrap">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="text-xs">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-3 space-y-4">
            <ReportProvenance>
              Source: the current CentralReach authorization snapshot. Coverage gaps are computed with the same
              continuity logic used on the Authorization Command Center — every gap is a candidate for staff
              confirmation, never a confirmed pause.
            </ReportProvenance>
            <PrimaryTable
              title="Clients with no active coverage today"
              subtitle="Latest known coverage ended before today and no authorization currently covers today."
              rows={metrics.clientsWithoutCoverage}
              rowKey={(r) => r.clientKey}
              columns={COVERAGE_GAP_COLUMNS}
              emptyLabel="No clients are missing active coverage in the current filters."
              onRowClick={(r) =>
                openCoverageGaps(`Coverage gap · ${r.client}`, "Source detail for this candidate gap.", [r], "coverage-risk-detail")
              }
            />
          </TabsContent>

          <TabsContent value="expiring-expired" className="mt-3 space-y-4">
            <ReportProvenance>
              Source: the current CentralReach authorization snapshot (`v_cr_authorization_current`).
            </ReportProvenance>
            <PrimaryTable
              title="Expired authorizations"
              subtitle="Latest documented end date is strictly before today."
              rows={metrics.expired}
              rowKey={(r) => r.key}
              columns={CONTINUITY_COLUMNS}
              emptyLabel="No expired authorizations in the current filters."
              onRowClick={(r) => openContinuity(`Authorization · ${r.client}`, "Source detail.", [r], "coverage-risk-detail")}
            />
            <PrimaryTable
              title="Expiring within 14 days"
              subtitle="Currently active authorizations ending within 14 days."
              rows={metrics.expiring14}
              rowKey={(r) => r.key}
              columns={CONTINUITY_COLUMNS}
              emptyLabel="No authorizations expiring within 14 days in the current filters."
              onRowClick={(r) => openContinuity(`Authorization · ${r.client}`, "Source detail.", [r], "coverage-risk-detail")}
            />
          </TabsContent>

          <TabsContent value="activity-gaps" className="mt-3 space-y-4">
            <ReportProvenance>
              Source: curated billing facts (`report_billing_facts`) matched against the current authorization
              snapshot by CR client id first, unambiguous name second, and service code where documented.
            </ReportProvenance>
            <PrimaryTable
              title="Billing with no matched coverage"
              subtitle="Billed activity whose date of service has no matched active authorization."
              rows={metrics.billingGaps}
              rowKey={(r) => r.key}
              columns={BILLING_GAP_COLUMNS}
              emptyLabel="No billing coverage gaps in the current filters."
              onRowClick={(r) => openBillingGaps(`Billing gap · ${r.client}`, "Source detail.", [r], "coverage-risk-detail")}
            />
          </TabsContent>

          <TabsContent value="scheduled-gaps" className="mt-3 space-y-4">
            <ReportProvenance>
              Source: the current schedule snapshot (`v_cr_schedule_current`), future kept entries only, matched
              against the current authorization snapshot the same way as billing.
            </ReportProvenance>
            <PrimaryTable
              title="Future kept sessions with no matched coverage"
              subtitle="Not cancelled, not deleted, scheduled after today."
              rows={metrics.scheduledGaps}
              rowKey={(r) => r.key}
              columns={SCHEDULED_GAP_COLUMNS}
              emptyLabel="No scheduled coverage gaps in the current filters."
              onRowClick={(r) => openScheduledGaps(`Scheduled gap · ${r.client}`, "Source detail.", [r], "coverage-risk-detail")}
            />
          </TabsContent>

          <TabsContent value="data-gaps" className="mt-3 space-y-4">
            <ReportProvenance tone="warn">
              These authorization rows have no usable start/end date pair on the current snapshot. Coverage cannot
              be evaluated for them until the dates are corrected in CentralReach.
            </ReportProvenance>
            <PrimaryTable
              title="Unknown / malformed authorization dates"
              subtitle="No usable matched start/end pair on the current snapshot."
              rows={metrics.unknownDates}
              rowKey={(r) => r.key}
              columns={CONTINUITY_COLUMNS}
              emptyLabel="No authorizations with unknown or malformed dates in the current filters."
              onRowClick={(r) => openContinuity(`Authorization · ${r.client}`, "Source detail.", [r], "coverage-risk-detail")}
            />
          </TabsContent>
        </Tabs>
      </div>

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}
