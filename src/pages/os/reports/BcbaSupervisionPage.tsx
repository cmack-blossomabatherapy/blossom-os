/**
 * Primary report: BCBA Supervision (`bcba-supervision`) — Phase 2B1 rebuild.
 *
 * The ratio is one definition only: **97155 supervision hours ÷ 97153 direct
 * hours**, against a 5% expectation.
 *
 * Two URL-addressable tabs:
 *   - **Past**      — billed facts that already happened.
 *   - **Projected** — past plus every kept future session on the calendar.
 *
 * Grouping (BCBA / Client / RBT) is URL state too, so a shared link reproduces
 * exactly what the sender was looking at. Ownership comes from the canonical V3
 * ownership adapter, so this report always agrees with BCBA Productivity V3.
 * Groups with no direct hours read "Insufficient data" — never 0%.
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
import { Button } from "@/components/ui/button";
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
import { fmtCount, fmtHours, fmtPct } from "@/lib/os/reports/crPrimary/format";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import { isActiveScheduleEvent, eventDurationHours } from "@/lib/os/reports/crPrimary/scheduleTruth";
import { CODE_DIRECT, CODE_SUPERVISION, normalizeCode } from "@/lib/os/reports/crPrimary/metrics/codes";
import {
  SUPERVISION_STATUS_LABELS,
  SUPERVISION_TARGET_PCT,
  computeSupervisionAnalysis,
  type SupervisionGroupRow,
  type SupervisionGrouping,
  type SupervisionRatioStatus,
  type SupervisionSessionInput,
} from "@/lib/os/reports/crPrimary/metrics/bcbaSupervisionV2";
import { pushRecent } from "@/lib/os/reportsCatalog";

const FILTER_FIELDS = ["state", "client", "payor", "provider"] as const;
const FILTER_LABELS: Record<string, string> = {
  state: "State",
  client: "Client",
  payor: "Payor",
  provider: "Provider",
};

const STATUS_TONE: Record<SupervisionRatioStatus, string> = {
  meets_target: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
  approaching: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  below_target: "bg-destructive/10 text-destructive border border-destructive/30",
  insufficient_data: "bg-muted text-muted-foreground",
};

const GROUPINGS: { key: SupervisionGrouping; label: string }[] = [
  { key: "bcba", label: "By BCBA" },
  { key: "client", label: "By Client" },
  { key: "rbt", label: "By RBT" },
];

const EXPORT_COLUMNS = [
  { key: "label", label: "Group" },
  { key: "bcba", label: "Owning BCBA" },
  { key: "directHours", label: "Direct Hrs (97153)" },
  { key: "supervisionHours", label: "Supervision Hrs (97155)" },
  { key: "ratioPct", label: "Supervision Ratio %" },
  { key: "status", label: "Status" },
  { key: "hoursToTarget", label: "Hrs To 5% Target" },
  { key: "clients", label: "Clients" },
  { key: "rbts", label: "RBTs" },
  { key: "states", label: "States" },
  { key: "note", label: "What This Means" },
];

function projectGroups(rows: SupervisionGroupRow[]): Record<string, unknown>[] {
  return rows.map((r) => ({
    label: r.label,
    bcba: r.bcba,
    directHours: r.directHours,
    supervisionHours: r.supervisionHours,
    ratioPct: r.ratioPct ?? "Cannot compute",
    status: SUPERVISION_STATUS_LABELS[r.status],
    hoursToTarget: r.hoursToTarget ?? "—",
    clients: r.clients,
    rbts: r.rbts,
    states: r.states.join(", "),
    note: r.note,
  }));
}

const DEFAULT_FILTERS = withCurrentMonthDefault(EMPTY_FILTERS);

export default function BcbaSupervisionPage() {
  const data = useCrPrimaryReport(["billingFacts", "scheduleCurrent"]);
  const ownership = useBcbaOwnershipV3();
  const [filters, setFilters] = useUrlFilterState<PrimaryReportFilters>(DEFAULT_FILTERS);
  const [viewParam, setViewParam] = useUrlState("view", "past");
  const [groupParam, setGroupParam] = useUrlState("group", "bcba");
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);

  const view = viewParam === "projected" ? "projected" : "past";
  const grouping = (GROUPINGS.find((g) => g.key === groupParam)?.key ?? "bcba") as SupervisionGrouping;

  useEffect(() => {
    pushRecent("bcba-supervision");
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
    const past: SupervisionSessionInput[] = billing
      .filter((r) => !r.is_void && !r.deleted)
      .map((r: ReportBillingFactRow) => ({
        date: r.date_of_service,
        procedureCode: r.procedure_code,
        hours: r.hours,
        clientName: r.client_name,
        clientCrId: r.client_cr_id,
        providerName: r.provider_name,
        state: r.state,
        payor: r.payor,
      }));

    // Projected adds only kept sessions still ahead of today.
    const projected: SupervisionSessionInput[] = schedule
      .filter((r) => isActiveScheduleEvent(r) && (r.event_date ?? "") >= today)
      .map((r) => ({
        date: r.event_date,
        procedureCode: r.service_code ?? r.procedure_code ?? r.billing_code,
        hours: eventDurationHours(r),
        clientName: r.client_name,
        clientCrId: null,
        providerName: r.provider_name,
        state: r.state,
        payor: r.payor,
      }));

    return computeSupervisionAnalysis({ past, projected, grouping, resolveOwner });
  }, [billing, schedule, grouping, resolveOwner, today]);

  const active = view === "projected" ? analysis.projected : analysis.past;

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

  const kpis = useMemo<KpiDefinition[]>(
    () => [
      {
        id: "ratio",
        label: view === "projected" ? "Projected supervision ratio" : "Supervision ratio",
        value: active.ratioPct == null ? "Insufficient data" : fmtPct(active.ratioPct),
        hint: `97155 ÷ 97153 · ${SUPERVISION_TARGET_PCT}% expected`,
        tone:
          active.ratioPct == null
            ? "neutral"
            : active.ratioPct >= SUPERVISION_TARGET_PCT
              ? "good"
              : "bad",
      },
      {
        id: "direct",
        label: "Direct hours (97153)",
        value: fmtHours(active.directHours),
        hint: "The denominator of the ratio",
      },
      {
        id: "supervision",
        label: "Supervision hours (97155)",
        value: fmtHours(active.supervisionHours),
        hint: "The numerator of the ratio",
      },
      {
        id: "below",
        label: "Groups below target",
        value: fmtCount(active.groupsBelowTarget),
        hint: "At or approaching the 5% floor",
        tone: active.groupsBelowTarget > 0 ? "bad" : "good",
      },
      {
        id: "insufficient",
        label: "Insufficient data",
        value: fmtCount(active.groupsInsufficientData),
        hint: "No direct hours, so no ratio exists",
        tone: active.groupsInsufficientData > 0 ? "warn" : "good",
      },
      {
        id: "delta",
        label: "Projected change",
        value:
          analysis.ratioDeltaPct == null
            ? "—"
            : `${analysis.ratioDeltaPct > 0 ? "+" : ""}${analysis.ratioDeltaPct} pts`,
        hint: "Where the ratio lands if every scheduled session is delivered",
        tone:
          analysis.ratioDeltaPct == null
            ? "neutral"
            : analysis.ratioDeltaPct >= 0
              ? "good"
              : "warn",
      },
    ],
    [active, analysis.ratioDeltaPct, view],
  );

  const openGroups = (title: string, rows: SupervisionGroupRow[]) =>
    setDrilldown({
      title,
      subtitle: `${rows.length.toLocaleString("en-US")} group(s) · ${view === "projected" ? "projected" : "past"} view`,
      rows: projectGroups(rows),
      columns: EXPORT_COLUMNS,
      exportName: "bcba-supervision",
    });

  const columns: PrimaryTableColumn<SupervisionGroupRow>[] = [
    { key: "label", label: GROUPINGS.find((g) => g.key === grouping)?.label ?? "Group", render: (r) => (
      <span className="font-medium">{r.label}</span>
    ) },
    ...(grouping === "bcba"
      ? []
      : [{ key: "bcba", label: "Owning BCBA", render: (r: SupervisionGroupRow) => r.bcba }]),
    { key: "direct", label: "Direct Hrs", align: "right" as const, render: (r) => fmtHours(r.directHours) },
    {
      key: "supervision",
      label: "Supervision Hrs",
      align: "right" as const,
      render: (r) => fmtHours(r.supervisionHours),
    },
    {
      key: "ratio",
      label: "Ratio",
      align: "right" as const,
      render: (r) =>
        r.ratioPct == null ? <span className="text-muted-foreground">—</span> : fmtPct(r.ratioPct),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Badge variant="outline" className={STATUS_TONE[r.status]}>
          {SUPERVISION_STATUS_LABELS[r.status]}
        </Badge>
      ),
    },
    {
      key: "gap",
      label: "Hrs To Target",
      align: "right" as const,
      render: (r) => (r.hoursToTarget == null ? "—" : fmtHours(r.hoursToTarget)),
    },
    { key: "clients", label: "Clients", align: "right" as const, render: (r) => fmtCount(r.clients) },
    { key: "rbts", label: "RBTs", align: "right" as const, render: (r) => fmtCount(r.rbts) },
  ];

  const chartData = active.rows
    .filter((r) => r.ratioPct != null)
    .slice(0, 15)
    .map((r) => ({ label: r.label, value: r.ratioPct as number }));

  const codeCoverage = useMemo(() => {
    const codes = new Set(
      billing.map((r) => normalizeCode(r.procedure_code)).filter((c) => c === CODE_DIRECT || c === CODE_SUPERVISION),
    );
    return codes.size;
  }, [billing]);

  return (
    <PrimaryReportShell
      title="BCBA Supervision"
      subtitle="97155 supervision hours as a percentage of 97153 direct hours, against a 5% expectation."
      freshness={data.freshness}
      loading={data.loading || ownership.isLoading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      dataQualityWarnings={[
        codeCoverage === 0
          ? "No 97153 or 97155 hours are present for the selected filters, so no ratio can be calculated."
          : "",
        ownership.data?.health?.truncated
          ? "Some billing history could not be loaded, so a few sessions may be attributed to Unassigned."
          : "",
      ].filter(Boolean)}
      onRefresh={() => {
        data.refresh();
        ownership.refetch();
      }}
      onExport={() =>
        downloadCsv("bcba-supervision", projectGroups(active.rows), EXPORT_COLUMNS)
      }
      exportDisabled={active.rows.length === 0}
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
        Past hours come from billed CentralReach sessions. Projected hours add every session still on
        the calendar that has not been cancelled — a scheduled session is never counted as delivered.
        Ownership matches the BCBA Productivity report.
      </ReportProvenance>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onValueChange={setViewParam}>
          <TabsList>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="projected">Projected</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-1.5">
          {GROUPINGS.map((g) => (
            <Button
              key={g.key}
              size="sm"
              variant={grouping === g.key ? "default" : "outline"}
              className="h-8 text-xs"
              onClick={() => setGroupParam(g.key)}
            >
              {g.label}
            </Button>
          ))}
        </div>
      </div>

      <KpiScorecards
        kpis={kpis}
        onSelect={(id) =>
          openGroups(
            id === "below"
              ? "Groups below the 5% supervision target"
              : id === "insufficient"
                ? "Groups with no direct hours"
                : "Supervision groups",
            id === "below"
              ? active.rows.filter((r) => r.status === "below_target" || r.status === "approaching")
              : id === "insufficient"
                ? active.rows.filter((r) => r.status === "insufficient_data")
                : active.rows,
          )
        }
      />

      <PrimaryChart
        title="Supervision ratio by group"
        subtitle="Groups with no direct hours are omitted — they have no ratio."
        type="bar"
        data={chartData}
        valueLabel="Ratio %"
      />

      <PrimaryTable
        title={`Supervision — ${GROUPINGS.find((g) => g.key === grouping)?.label}`}
        subtitle="Click a row to open the group detail."
        columns={columns}
        rows={active.rows}
        rowKey={(r) => r.key}
        onRowClick={(r) => openGroups(`${r.label} — supervision detail`, [r])}
        maxRows={200}
      />

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}
