/**
 * Primary report: Clinic Operations (`clinic-operations`).
 *
 * Staff-facing operational surface over delivered billing hours, scheduled
 * hours, strict cancellations, and elapsed-session timesheet conversion,
 * grouped by clinic via the shared `clinicNormalizer` helpers. This report
 * deliberately does NOT measure capacity, staffing coverage, census, or
 * utilization — see `CLINIC_OPS_DATA_GAP_NOTE`.
 */
import { useEffect, useMemo, useState } from "react";
import { PrimaryReportShell } from "@/components/reports/crPrimary/PrimaryReportShell";
import { KpiScorecards } from "@/components/reports/crPrimary/KpiScorecards";
import { PrimaryChart } from "@/components/reports/crPrimary/PrimaryChart";
import { PrimaryTable, type PrimaryTableColumn } from "@/components/reports/crPrimary/PrimaryTable";
import { DrilldownDrawer } from "@/components/reports/crPrimary/DrilldownDrawer";
import {
  PrimaryFilterBar,
  type FilterFieldConfig,
} from "@/components/reports/crPrimary/PrimaryFilterBar";
import { ReportProvenance } from "@/components/reports/crPrimary/ReportProvenance";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrPrimaryReport } from "@/hooks/useCrPrimaryReport";
import { useUrlFilterState } from "@/hooks/useUrlFilterState";
import { useUrlState } from "@/hooks/useUrlState";
import { withCurrentMonthDefault } from "@/lib/os/reports/crPrimary/reportWindow";
import { applyFilters, optionsFor } from "@/lib/os/reports/crPrimary/filters";
import { EMPTY_FILTERS } from "@/lib/os/reports/crPrimary/types";
import type { DrilldownRequest, KpiDefinition, PrimaryReportFilters } from "@/lib/os/reports/crPrimary/types";
import { fmtCount, fmtDate, fmtHours } from "@/lib/os/reports/crPrimary/format";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import { localIsoDate } from "@/lib/os/reports/crPrimary/reportWindow";
import {
  CLINIC_SCOPE_OPTIONS,
  clinicScopeLabel,
  type ClinicKey,
} from "@/lib/os/reports/crPrimary/metrics/clinicNormalizer";
import {
  computeClinicOperations,
  projectBillingFact,
  projectScheduleCurrent,
  type ActionQueueRow,
  type ClinicOperationsMetrics,
} from "@/lib/os/reports/crPrimary/metrics/clinicOperations";
import { pushRecent } from "@/lib/os/reportsCatalog";

const FILTER_FIELDS = ["state", "client", "provider", "payor"] as const;
const FILTER_LABELS: Record<string, string> = {
  state: "State",
  client: "Client",
  provider: "Provider",
  payor: "Payor",
};

type TabKey = "overview" | "clinics" | "service-mix" | "action-queue";

const DEFAULT_FILTERS = withCurrentMonthDefault(EMPTY_FILTERS);

const ACTION_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "kind", label: "Type" },
  { key: "clinicLabel", label: "Clinic" },
  { key: "client", label: "Client" },
  { key: "provider", label: "Provider" },
  { key: "hours", label: "Hours" },
  { key: "reason", label: "Reason" },
];

const projectAction = (rows: ActionQueueRow[]): Record<string, unknown>[] =>
  rows.map((r) => ({
    date: r.date ? fmtDate(r.date) : "Not documented",
    kind: r.kind === "unconverted" ? "Elapsed, not converted" : "Strict cancellation",
    clinicLabel: r.clinicLabel,
    client: r.client,
    provider: r.provider,
    hours: fmtHours(r.hours),
    reason: r.reason ?? "—",
  }));

export default function ClinicOperationsPage() {
  const [filters, setFilters] = useUrlFilterState<PrimaryReportFilters>(DEFAULT_FILTERS);
  // The selected window is pushed to the database before pagination, so a
  // current-month view never pages years of history.
  const data = useCrPrimaryReport(["billingFacts", "scheduleCurrent", "authCurrent"], {
    from: filters.from || null,
    to: filters.to || null,
  });
  const [tabParam, setTabParam] = useUrlState("tab", "overview");
  const [clinicParam, setClinicParam] = useUrlState("clinic", "all");
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);
  const tab = tabParam as TabKey;
  const clinicScope = clinicParam as ClinicKey | "all";

  useEffect(() => {
    pushRecent("clinic-operations");
  }, []);

  const today = useMemo(() => localIsoDate(), []);

  const billing = useMemo(
    () =>
      applyFilters(data.billingFacts, filters, (r) => ({
        date: r.date_of_service,
        state: r.state,
        client: r.client_name,
        provider: r.provider_name,
        payor: r.payor,
      })).map(projectBillingFact),
    [data.billingFacts, filters],
  );

  const schedule = useMemo(
    () =>
      applyFilters(data.scheduleCurrent, filters, (r) => ({
        date: r.event_date,
        state: r.state,
        client: r.client_name,
        provider: r.provider_name,
        payor: r.payor,
      })).map(projectScheduleCurrent),
    [data.scheduleCurrent, filters],
  );

  const metrics: ClinicOperationsMetrics = useMemo(
    () =>
      computeClinicOperations({
        billing,
        schedule,
        clinicScope,
        today,
        scheduleCoverageEnd: data.freshness.coverageEnd,
        scheduleCoverageStart: data.freshness.coverageStart,
        windowTo: filters.to || null,
        windowFrom: filters.from || null,
      }),
    [
      billing,
      schedule,
      clinicScope,
      today,
      data.freshness.coverageEnd,
      data.freshness.coverageStart,
      filters.to,
      filters.from,
    ],
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () =>
      FILTER_FIELDS.map((key) => ({
        key: key as FilterFieldConfig["key"],
        label: FILTER_LABELS[key] ?? key,
        options: [
          ...new Set([
            ...optionsFor(data.billingFacts, (r) =>
              key === "client" ? r.client_name : key === "provider" ? r.provider_name : (r[key] as string | null),
            ),
            ...optionsFor(data.scheduleCurrent, (r) =>
              key === "client" ? r.client_name : key === "provider" ? r.provider_name : (r[key] as string | null),
            ),
          ]),
        ].sort((a, b) => a.localeCompare(b)),
      })),
    [data.billingFacts, data.scheduleCurrent],
  );

  const kpis = useMemo<KpiDefinition[]>(
    () => [
      {
        id: "active-clients",
        label: "Active clients",
        value: fmtCount(metrics.activeClients),
        hint: "Proven by billed or scheduled activity in range",
      },
      {
        id: "providers",
        label: "Providers",
        value: fmtCount(metrics.providers),
        hint: "Distinct rendering/provider names on billed or scheduled rows",
      },
      {
        id: "delivered-hours",
        label: "Delivered hours",
        value: fmtHours(metrics.deliveredHours),
        hint: "Nonvoid, nondeleted billing facts",
      },
      {
        id: "upcoming-hours",
        label: "Upcoming scheduled hours",
        value: fmtHours(metrics.upcomingScheduledHours),
        hint: metrics.scheduleCoverageIncomplete
          ? "Incomplete — window extends past the schedule snapshot"
          : "Kept, future, nondeleted events",
        tone: metrics.scheduleCoverageIncomplete ? "warn" : "neutral",
      },
      {
        id: "cancellations",
        label: "Strict cancellations",
        value: fmtCount(metrics.strictCancellations),
        hint: metrics.scheduleCoverageIncomplete ? "Incomplete for dates past snapshot coverage" : "Explicit cancellation truth",
        tone: metrics.strictCancellations > 0 ? "warn" : "good",
      },
      {
        id: "unconverted",
        label: "Elapsed, not converted",
        value: fmtCount(metrics.elapsedUnconverted),
        hint: "Past-due sessions not yet converted to a timesheet",
        tone: metrics.elapsedUnconverted > 0 ? "bad" : "good",
      },
    ],
    [metrics],
  );

  const clinicColumns: PrimaryTableColumn<ClinicOperationsMetrics["clinics"][number]>[] = [
    { key: "clinic", label: "Clinic", render: (r) => <span className="font-medium">{r.clinicLabel}</span> },
    { key: "clients", label: "Active clients", align: "right", render: (r) => fmtCount(r.activeClients) },
    { key: "providers", label: "Providers", align: "right", render: (r) => fmtCount(r.providers) },
    { key: "delivered", label: "Delivered hrs", align: "right", render: (r) => fmtHours(r.deliveredHours) },
    { key: "upcoming", label: "Upcoming hrs", align: "right", render: (r) => fmtHours(r.upcomingScheduledHours) },
    { key: "cancellations", label: "Cancellations", align: "right", render: (r) => fmtCount(r.strictCancellations) },
    { key: "unconverted", label: "Unconverted", align: "right", render: (r) => fmtCount(r.elapsedUnconverted) },
  ];

  const actionColumns: PrimaryTableColumn<ActionQueueRow>[] = [
    { key: "date", label: "Date", render: (r) => (r.date ? fmtDate(r.date) : "Not documented") },
    {
      key: "kind",
      label: "Type",
      render: (r) => (
        <Badge variant="outline" className={r.kind === "unconverted" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-amber-500/30 bg-amber-500/10 text-amber-600"}>
          {r.kind === "unconverted" ? "Elapsed, not converted" : "Strict cancellation"}
        </Badge>
      ),
    },
    { key: "clinic", label: "Clinic", render: (r) => r.clinicLabel },
    { key: "client", label: "Client", render: (r) => r.client },
    { key: "provider", label: "Provider", render: (r) => r.provider },
    { key: "hours", label: "Hours", align: "right", render: (r) => fmtHours(r.hours) },
    { key: "reason", label: "Reason", render: (r) => r.reason ?? "—" },
  ];

  const exportForTab = () => {
    if (tab === "action-queue") {
      downloadCsv("clinic-operations-action-queue", projectAction(metrics.actionQueue), ACTION_COLUMNS);
      return;
    }
    if (tab === "clinics") {
      downloadCsv(
        "clinic-operations-clinics",
        metrics.clinics.map((c) => ({
          clinic: c.clinicLabel,
          activeClients: c.activeClients,
          providers: c.providers,
          deliveredHours: c.deliveredHours,
          upcomingScheduledHours: c.upcomingScheduledHours,
          strictCancellations: c.strictCancellations,
          elapsedUnconverted: c.elapsedUnconverted,
        })),
        [
          { key: "clinic", label: "Clinic" },
          { key: "activeClients", label: "Active clients" },
          { key: "providers", label: "Providers" },
          { key: "deliveredHours", label: "Delivered hrs" },
          { key: "upcomingScheduledHours", label: "Upcoming hrs" },
          { key: "strictCancellations", label: "Cancellations" },
          { key: "elapsedUnconverted", label: "Unconverted" },
        ],
      );
      return;
    }
    downloadCsv(
      "clinic-operations-service-mix",
      metrics.codeMix.map((c) => ({ code: c.label, hours: c.hours })),
      [
        { key: "code", label: "Code" },
        { key: "hours", label: "Hours" },
      ],
    );
  };

  return (
    <PrimaryReportShell
      title="Clinic Operations"
      subtitle="Delivered and scheduled hours, strict cancellations, and timesheet-conversion status by clinic. Not a capacity, staffing, or census report."
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      dataQualityWarnings={metrics.dataQualityWarnings}
      onRefresh={data.refresh}
      onExport={exportForTab}
      exportDisabled={
        tab === "action-queue"
          ? metrics.actionQueue.length === 0
          : tab === "clinics"
            ? metrics.clinics.length === 0
            : metrics.codeMix.length === 0
      }
      filters={
        <PrimaryFilterBar
          filters={filters}
          fields={filterFields}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      }
    >
      <ReportProvenance>
        Delivered hours are nonvoid, nondeleted billing facts. Upcoming scheduled hours count only
        kept, nondeleted, noncancelled future events. Cancellations use the explicit CentralReach
        cancellation truth. Timesheet-conversion status applies only to sessions whose event date is
        strictly before today — a future session is not yet due for conversion. Clinic grouping uses
        the shared clinic normalizer; anything that does not resolve to Riverdale or Peachtree Corners
        is labeled Other / Unmapped and never shown as a raw address.
      </ReportProvenance>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={setTabParam}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clinics">Clinics</TabsTrigger>
            <TabsTrigger value="service-mix">Service Mix</TabsTrigger>
            <TabsTrigger value="action-queue">Action Queue</TabsTrigger>
          </TabsList>
        </Tabs>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Clinic
          <select
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
            value={clinicScope}
            onChange={(e) => setClinicParam(e.target.value)}
          >
            {CLINIC_SCOPE_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <KpiScorecards
        kpis={kpis}
        onSelect={(id) => {
          if (id === "unconverted" || id === "cancellations") setTabParam("action-queue");
          else if (id === "delivered-hours" || id === "upcoming-hours") setTabParam("clinics");
          else setTabParam("overview");
        }}
      />

      {tab === "overview" && (
        <>
          <PrimaryChart
            title="Delivered hours by clinic"
            subtitle={clinicScopeLabel(clinicScope)}
            type="bar"
            data={metrics.clinics.map((c) => ({ label: c.clinicLabel, value: c.deliveredHours, secondary: c.upcomingScheduledHours }))}
            valueLabel="Delivered hrs"
            secondaryLabel="Upcoming hrs"
            onSelect={() => setTabParam("clinics")}
          />
        </>
      )}

      {tab === "clinics" && (
        <PrimaryTable
          title="Clinics"
          subtitle="Click a clinic to see its action-queue items."
          columns={clinicColumns}
          rows={metrics.clinics}
          rowKey={(r) => r.clinicKey}
          onRowClick={(r) =>
            setDrilldown({
              title: `${r.clinicLabel} — action queue`,
              subtitle: "Elapsed unconverted sessions and strict cancellations for this clinic.",
              rows: projectAction(metrics.actionQueue.filter((a) => a.clinicKey === r.clinicKey)),
              columns: ACTION_COLUMNS,
              exportName: "clinic-operations-clinic-detail",
            })
          }
        />
      )}

      {tab === "service-mix" && (
        <>
          <PrimaryChart
            title="97153 / 97155 / 97156 hour mix"
            subtitle="Delivered billing hours by procedure code."
            type="pie"
            data={metrics.codeMix.map((c) => ({ label: c.label, value: c.hours }))}
            valueLabel="Hours"
          />
          <PrimaryTable
            title="Service mix"
            columns={[
              { key: "code", label: "Code", render: (r) => r.label },
              { key: "hours", label: "Hours", align: "right", render: (r) => fmtHours(r.hours) },
            ]}
            rows={metrics.codeMix}
            rowKey={(r) => r.key}
          />
        </>
      )}

      {tab === "action-queue" && (
        <PrimaryTable
          title="Action queue"
          subtitle="Elapsed sessions not yet converted to a timesheet and strict cancellations needing follow-up, largest backlog first."
          columns={actionColumns}
          rows={metrics.actionQueue}
          rowKey={(r) => r.key}
          maxRows={300}
        />
      )}

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}
