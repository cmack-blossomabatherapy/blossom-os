/**
 * Primary report: Parent Training (`parent-training`) — Phase 2B1 rebuild.
 *
 * 97156 parent training in three honest buckets, each from the source that can
 * prove it:
 *   - **Completed** — billed 97156 facts.
 *   - **Upcoming**  — kept 97156 schedule events still ahead of today.
 *   - **Cancelled** — 97156 events the source explicitly cancelled.
 *
 * Two action queues make this a working surface rather than a coverage
 * percentage: clients with **no appointment at all**, and clients **below the
 * monthly target**. Tabs, date window, BCBA, and payor all live in the URL so a
 * link reproduces the exact view. Ownership comes from the canonical V3 adapter.
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
import { useBcbaOwnershipV3 } from "@/hooks/useBcbaOwnershipV3";
import { useUrlFilterState } from "@/hooks/useUrlFilterState";
import { useUrlState } from "@/hooks/useUrlState";
import { withCurrentMonthDefault } from "@/lib/os/reports/crPrimary/reportWindow";
import { applyFilters, optionsFor } from "@/lib/os/reports/crPrimary/filters";
import { EMPTY_FILTERS } from "@/lib/os/reports/crPrimary/types";
import type {
  DrilldownRequest,
  KpiDefinition,
  PrimaryReportFilters,
  ReportBillingFactRow,
} from "@/lib/os/reports/crPrimary/types";
import { fmtCount, fmtDate, fmtHours, fmtPct } from "@/lib/os/reports/crPrimary/format";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import {
  cancellationTruth,
  eventDurationHours,
  isDeletedEvent,
} from "@/lib/os/reports/crPrimary/scheduleTruth";
import { CODE_PARENT_TRAINING, normalizeCode } from "@/lib/os/reports/crPrimary/metrics/codes";
import {
  PT_MONTHLY_TARGET_HOURS,
  computeParentTrainingAnalysis,
  type PtClientRow,
  type PtEventRow,
} from "@/lib/os/reports/crPrimary/metrics/parentTrainingV2";
import { pushRecent } from "@/lib/os/reportsCatalog";

const FILTER_FIELDS = ["state", "client", "payor", "provider"] as const;
const FILTER_LABELS: Record<string, string> = {
  state: "State",
  client: "Client",
  payor: "Payor",
  provider: "Provider",
};

type TabKey = "clients" | "completed" | "upcoming" | "cancelled" | "no-appointment" | "below-target";

const CLIENT_COLUMNS = [
  { key: "client", label: "Client" },
  { key: "clientCrId", label: "CR Client Id" },
  { key: "bcba", label: "BCBA" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "completedHours", label: "Completed Hrs" },
  { key: "completedSessions", label: "Completed Sessions" },
  { key: "upcomingSessions", label: "Upcoming Sessions" },
  { key: "cancelledSessions", label: "Cancelled Sessions" },
  { key: "targetHours", label: "Target Hrs" },
  { key: "lastCompleted", label: "Last Completed" },
  { key: "nextScheduled", label: "Next Scheduled" },
  { key: "note", label: "What This Means" },
];

const EVENT_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "bucket", label: "Bucket" },
  { key: "client", label: "Client" },
  { key: "bcba", label: "BCBA" },
  { key: "provider", label: "Provider" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "hours", label: "Hours" },
  { key: "reason", label: "Cancellation Reason" },
];

const BUCKET_LABEL: Record<PtEventRow["bucket"], string> = {
  completed: "Completed",
  upcoming: "Upcoming",
  cancelled: "Cancelled",
};

const projectClients = (rows: PtClientRow[]): Record<string, unknown>[] =>
  rows.map((r) => ({
    client: r.client,
    clientCrId: r.clientCrId || "—",
    bcba: r.bcba,
    payor: r.payor,
    state: r.state,
    completedHours: r.completedHours,
    completedSessions: r.completedSessions,
    upcomingSessions: r.upcomingSessions,
    cancelledSessions: r.cancelledSessions,
    targetHours: r.targetHours,
    lastCompleted: r.lastCompleted ?? "None",
    nextScheduled: r.nextScheduled ?? "None",
    note: r.note,
  }));

const projectEvents = (rows: PtEventRow[]): Record<string, unknown>[] =>
  rows.map((r) => ({
    date: r.date ?? "Not documented",
    bucket: BUCKET_LABEL[r.bucket],
    client: r.client,
    bcba: r.bcba,
    provider: r.provider || "—",
    payor: r.payor,
    state: r.state,
    hours: r.hours,
    reason: r.reason ?? "—",
  }));

const DEFAULT_FILTERS = withCurrentMonthDefault(EMPTY_FILTERS);

export default function ParentTrainingPage() {
  const data = useCrPrimaryReport(["billingFacts", "scheduleCurrent"]);
  const ownership = useBcbaOwnershipV3();
  const [filters, setFilters] = useUrlFilterState<PrimaryReportFilters>(DEFAULT_FILTERS);
  const [tabParam, setTabParam] = useUrlState("tab", "clients");
  const [bcbaParam, setBcbaParam] = useUrlState("bcba", "");
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);
  const tab = tabParam as TabKey;

  useEffect(() => {
    pushRecent("parent-training");
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const billing = useMemo(
    () =>
      applyFilters(data.billingFacts, filters, (r) => ({
        date: r.date_of_service,
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        provider: r.provider_name,
        code: r.procedure_code,
      })),
    [data.billingFacts, filters],
  );

  const schedule = useMemo(
    () =>
      applyFilters(data.scheduleCurrent, filters, (r) => ({
        date: r.event_date,
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        provider: r.provider_name,
        code: r.service_code ?? r.procedure_code,
      })),
    [data.scheduleCurrent, filters],
  );

  const resolveOwner = useMemo(() => {
    const index = ownership.data;
    return (s: { clientName?: string | null; clientCrId?: string | null; date?: string | null }) =>
      index?.resolve({ clientCrId: s.clientCrId, clientName: s.clientName, date: s.date }).bcba ?? null;
  }, [ownership.data]);

  const analysis = useMemo(() => {
    const billed = billing
      .filter((r) => !r.is_void && !r.deleted)
      .map((r: ReportBillingFactRow) => ({
        date: r.date_of_service,
        procedureCode: r.procedure_code,
        hours: r.hours,
        clientName: r.client_name,
        clientCrId: r.client_cr_id,
        providerName: r.provider_name,
        payor: r.payor,
        state: r.state,
      }));

    const scheduled = schedule
      .filter((r) => !isDeletedEvent(r))
      .map((r) => {
        const truth = cancellationTruth(r);
        return {
          date: r.event_date,
          procedureCode: r.service_code ?? r.procedure_code ?? r.billing_code,
          hours: eventDurationHours(r),
          clientName: r.client_name,
          clientCrId: null,
          providerName: r.provider_name,
          payor: r.payor,
          state: r.state,
          cancelled: truth.cancelled,
          cancellationReason: r.cancellation_reason,
        };
      });

    // Every client with any activity in the window, so gaps are visible.
    const activeClients = new Map<
      string,
      { client: string; clientCrId?: string | null; payor?: string | null; state?: string | null }
    >();
    for (const r of billing) {
      const name = String(r.client_name ?? "").trim();
      if (!name) continue;
      if (!activeClients.has(name.toLowerCase())) {
        activeClients.set(name.toLowerCase(), {
          client: name,
          clientCrId: r.client_cr_id,
          payor: r.payor,
          state: r.state,
        });
      }
    }

    return computeParentTrainingAnalysis({
      billed,
      scheduled,
      activeClients: [...activeClients.values()],
      resolveOwner,
      window: { from: filters.from, to: filters.to },
      today,
    });
  }, [billing, schedule, resolveOwner, filters.from, filters.to, today]);

  const bcbaOptions = useMemo(
    () => [...new Set(analysis.clientRows.map((r) => r.bcba))].sort((a, b) => a.localeCompare(b)),
    [analysis.clientRows],
  );

  const clientRows = useMemo(
    () => (bcbaParam ? analysis.clientRows.filter((r) => r.bcba === bcbaParam) : analysis.clientRows),
    [analysis.clientRows, bcbaParam],
  );
  const eventRows = useMemo(
    () => (bcbaParam ? analysis.events.filter((r) => r.bcba === bcbaParam) : analysis.events),
    [analysis.events, bcbaParam],
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () =>
      FILTER_FIELDS.map((key) => ({
        key: key as FilterFieldConfig["key"],
        label: FILTER_LABELS[key] ?? key,
        options: optionsFor(data.billingFacts, (r: ReportBillingFactRow) =>
          key === "client"
            ? r.client_name
            : key === "provider"
              ? r.provider_name
              : (r[key as "state" | "payor"] as string | null),
        ),
      })),
    [data.billingFacts],
  );

  const noAppointment = clientRows.filter((r) => r.noAppointment);
  const belowTarget = clientRows.filter((r) => r.belowTarget);

  const kpis = useMemo<KpiDefinition[]>(
    () => [
      {
        id: "completed",
        label: "Completed 97156 hrs",
        value: fmtHours(analysis.completedHours),
        hint: `${fmtCount(analysis.completedSessions)} billed session(s)`,
      },
      {
        id: "coverage",
        label: "Clients with parent training",
        value: analysis.coveragePct == null ? "No clients in view" : fmtPct(analysis.coveragePct),
        hint: `${fmtCount(analysis.clientsWithCompleted)} of ${fmtCount(analysis.clients)} clients`,
        tone:
          analysis.coveragePct == null
            ? "neutral"
            : analysis.coveragePct >= 80
              ? "good"
              : analysis.coveragePct >= 50
                ? "warn"
                : "bad",
      },
      {
        id: "upcoming",
        label: "Upcoming sessions",
        value: fmtCount(analysis.upcomingSessions),
        hint: `${fmtHours(analysis.upcomingHours)} still on the calendar`,
      },
      {
        id: "cancelled",
        label: "Cancelled sessions",
        value: fmtCount(analysis.cancelledSessions),
        hint:
          analysis.cancellationRatePct == null
            ? "No completed or cancelled sessions to compare"
            : `${fmtPct(analysis.cancellationRatePct)} of parent-training sessions`,
        tone: analysis.cancelledSessions > 0 ? "warn" : "good",
      },
      {
        id: "no-appointment",
        label: "No appointment",
        value: fmtCount(noAppointment.length),
        hint: "Nothing completed and nothing scheduled",
        tone: noAppointment.length > 0 ? "bad" : "good",
      },
      {
        id: "below-target",
        label: "Below target",
        value: fmtCount(belowTarget.length),
        hint: `Target is ${PT_MONTHLY_TARGET_HOURS} hr per client per month (${analysis.monthsInWindow} month window)`,
        tone: belowTarget.length > 0 ? "warn" : "good",
      },
    ],
    [analysis, noAppointment.length, belowTarget.length],
  );

  const clientColumns: PrimaryTableColumn<PtClientRow>[] = [
    { key: "client", label: "Client", render: (r) => <span className="font-medium">{r.client}</span> },
    { key: "bcba", label: "BCBA", render: (r) => r.bcba },
    { key: "payor", label: "Payor", render: (r) => r.payor },
    {
      key: "completed",
      label: "Completed Hrs",
      align: "right",
      render: (r) => fmtHours(r.completedHours),
    },
    { key: "target", label: "Target Hrs", align: "right", render: (r) => fmtHours(r.targetHours) },
    { key: "upcoming", label: "Upcoming", align: "right", render: (r) => fmtCount(r.upcomingSessions) },
    {
      key: "cancelled",
      label: "Cancelled",
      align: "right",
      render: (r) => fmtCount(r.cancelledSessions),
    },
    {
      key: "last",
      label: "Last Completed",
      render: (r) => (r.lastCompleted ? fmtDate(r.lastCompleted) : "None"),
    },
    {
      key: "status",
      label: "Status",
      render: (r) =>
        r.noAppointment ? (
          <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
            No appointment
          </Badge>
        ) : r.belowTarget ? (
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600">
            Below target
          </Badge>
        ) : (
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
            On track
          </Badge>
        ),
    },
  ];

  const eventColumns: PrimaryTableColumn<PtEventRow>[] = [
    { key: "date", label: "Date", render: (r) => (r.date ? fmtDate(r.date) : "Not documented") },
    { key: "client", label: "Client", render: (r) => r.client },
    { key: "bcba", label: "BCBA", render: (r) => r.bcba },
    { key: "provider", label: "Provider", render: (r) => r.provider || "—" },
    { key: "hours", label: "Hours", align: "right", render: (r) => fmtHours(r.hours) },
    { key: "reason", label: "Reason", render: (r) => r.reason ?? "—" },
  ];

  const bucketRows = (bucket: PtEventRow["bucket"]) => eventRows.filter((r) => r.bucket === bucket);

  const exportForTab = () => {
    if (tab === "completed" || tab === "upcoming" || tab === "cancelled") {
      const bucket = tab as PtEventRow["bucket"];
      downloadCsv(`parent-training-${tab}`, projectEvents(bucketRows(bucket)), EVENT_COLUMNS);
      return;
    }
    const rows =
      tab === "no-appointment" ? noAppointment : tab === "below-target" ? belowTarget : clientRows;
    downloadCsv(`parent-training-${tab}`, projectClients(rows), CLIENT_COLUMNS);
  };

  return (
    <PrimaryReportShell
      title="Parent Training"
      subtitle="97156 parent training delivered, scheduled, and cancelled — with the clients who need an appointment."
      freshness={data.freshness}
      loading={data.loading || ownership.isLoading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      dataQualityWarnings={[
        billing.some((r) => normalizeCode(r.procedure_code) === CODE_PARENT_TRAINING)
          ? ""
          : "No billed 97156 hours for the selected filters — completed parent training will read zero.",
      ].filter(Boolean)}
      onRefresh={() => {
        data.refresh();
        ownership.refetch();
      }}
      onExport={exportForTab}
      exportDisabled={clientRows.length === 0 && eventRows.length === 0}
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
        Completed parent training is billed 97156 only. Upcoming counts sessions still ahead of today
        that have not been cancelled; a scheduled session is never counted as delivered. The target is{" "}
        {PT_MONTHLY_TARGET_HOURS} hour per client per month, giving {analysis.monthsInWindow * PT_MONTHLY_TARGET_HOURS} hour(s)
        for the selected window.
      </ReportProvenance>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={setTabParam}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            <TabsTrigger value="no-appointment">No appointment</TabsTrigger>
            <TabsTrigger value="below-target">Below target</TabsTrigger>
          </TabsList>
        </Tabs>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          BCBA
          <select
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
            value={bcbaParam}
            onChange={(e) => setBcbaParam(e.target.value)}
          >
            <option value="">All BCBAs</option>
            {bcbaOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </div>

      <KpiScorecards
        kpis={kpis}
        onSelect={(id) => {
          if (id === "no-appointment") setTabParam("no-appointment");
          else if (id === "below-target") setTabParam("below-target");
          else if (id === "upcoming") setTabParam("upcoming");
          else if (id === "cancelled") setTabParam("cancelled");
          else setTabParam("clients");
        }}
      />

      {tab === "clients" && (
        <>
          <PrimaryChart
            title="Completed parent-training hours by BCBA"
            type="bar"
            data={analysis.byBcba.slice(0, 15).map((g) => ({ label: g.name, value: g.completedHours }))}
            valueLabel="Hours"
          />
          <PrimaryTable
            title="Parent training by client"
            subtitle="Click a client to see every parent-training event."
            columns={clientColumns}
            rows={clientRows}
            rowKey={(r) => r.client}
            onRowClick={(r) =>
              setDrilldown({
                title: `${r.client} — parent training`,
                subtitle: r.note,
                rows: projectEvents(eventRows.filter((e) => e.client === r.client)),
                columns: EVENT_COLUMNS,
                exportName: "parent-training-client",
              })
            }
            maxRows={300}
          />
        </>
      )}

      {(tab === "completed" || tab === "upcoming" || tab === "cancelled") && (
        <PrimaryTable
          title={`${BUCKET_LABEL[tab as PtEventRow["bucket"]]} parent-training sessions`}
          subtitle={
            tab === "completed"
              ? "Billed 97156 facts."
              : tab === "upcoming"
                ? "Kept 97156 events still ahead of today."
                : "97156 events the source explicitly cancelled."
          }
          columns={eventColumns}
          rows={bucketRows(tab as PtEventRow["bucket"])}
          rowKey={(r) => r.key}
          maxRows={300}
        />
      )}

      {(tab === "no-appointment" || tab === "below-target") && (
        <PrimaryTable
          title={tab === "no-appointment" ? "Needs a parent-training appointment" : "Below parent-training target"}
          subtitle={
            tab === "no-appointment"
              ? "No completed and no scheduled 97156 in this window."
              : `Completed fewer than ${analysis.monthsInWindow * PT_MONTHLY_TARGET_HOURS} target hour(s).`
          }
          columns={clientColumns}
          rows={tab === "no-appointment" ? noAppointment : belowTarget}
          rowKey={(r) => r.client}
          onRowClick={(r) =>
            setDrilldown({
              title: `${r.client} — parent training`,
              subtitle: r.note,
              rows: projectEvents(eventRows.filter((e) => e.client === r.client)),
              columns: EVENT_COLUMNS,
              exportName: "parent-training-client",
            })
          }
          maxRows={300}
        />
      )}

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}
