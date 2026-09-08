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
  NO_TARGET_LABEL,
  PT_STATUS_LABELS,
  buildProvenClientProof,
  computeParentTrainingAnalysis,
  scopeParentTrainingToBcba,
  type PtClientRow,
  type PtEventRow,
} from "@/lib/os/reports/crPrimary/metrics/parentTrainingV2";
import {
  computeParentTrainingCompliance,
  NO_TARGET_LABEL as PTC_NO_TARGET_LABEL,
  NEEDS_PAYOR_REVIEW_LABEL,
  type PtcClientRow,
  type PtcBcbaRow,
} from "@/lib/os/reports/crPrimary/metrics/parentTrainingCompliance";
import { pushRecent } from "@/lib/os/reportsCatalog";

const FILTER_FIELDS = ["state", "client", "payor", "provider"] as const;
const FILTER_LABELS: Record<string, string> = {
  state: "State",
  client: "Client",
  payor: "Payor",
  provider: "Provider",
};

type TabKey =
  | "clients"
  | "completed"
  | "upcoming"
  | "cancelled"
  | "no-upcoming"
  | "below-target"
  | "needs-reschedule"
  | "data-gaps"
  | "compliance";

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
  { key: "authorizedMonthlyHours", label: "Authorized Hrs / Month" },
  { key: "expectedCadence", label: "Expected Cadence" },
  { key: "targetType", label: "Target Type" },
  { key: "targetValue", label: "Target Value / Month" },
  { key: "windowTarget", label: "Window Target" },
  { key: "pacePct", label: "Pace %" },
  { key: "lastCompleted", label: "Last Completed" },
  { key: "nextScheduled", label: "Next Scheduled" },
  { key: "status", label: "Status" },
  { key: "reason", label: "Why" },
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
    authorizedMonthlyHours: r.authorizedMonthlyHours ?? NO_TARGET_LABEL,
    expectedCadence: r.expectedCadence,
    targetType: r.targetType ?? NO_TARGET_LABEL,
    targetValue: r.targetValue ?? NO_TARGET_LABEL,
    windowTarget: r.windowTarget ?? NO_TARGET_LABEL,
    pacePct: r.pacePct ?? NO_TARGET_LABEL,
    lastCompleted: r.lastCompleted ?? "None",
    nextScheduled: r.nextScheduled ?? "None",
    status: PT_STATUS_LABELS[r.status],
    reason: r.reason,
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

const COMPLIANCE_BCBA_COLUMNS = [
  { key: "bcba", label: "BCBA" },
  { key: "completed97156Hours", label: "Completed 97156 Hrs" },
  { key: "completed97153Hours", label: "Completed 97153 Hrs" },
  { key: "status", label: "Status" },
];

const COMPLIANCE_CLIENT_COLUMNS = [
  { key: "client", label: "Client" },
  { key: "clientCrId", label: "CR Client Id" },
  { key: "bcba", label: "BCBA" },
  { key: "payor", label: "Payor" },
  { key: "thresholdHours", label: "Required Hrs / Month" },
  { key: "completed97156Hours", label: "Completed 97156 Hrs" },
  { key: "gapHours", label: "Gap Hrs" },
  { key: "status", label: "Status" },
  { key: "reason", label: "Why" },
];

const COMPLIANCE_STATUS_LABEL: Record<PtcClientRow["status"], string> = {
  healthy: "Healthy",
  monitor: "Monitor",
  no_target: PTC_NO_TARGET_LABEL,
  needs_payor_review: NEEDS_PAYOR_REVIEW_LABEL,
};

const COMPLIANCE_BCBA_STATUS_LABEL: Record<PtcBcbaRow["status"], string> = {
  healthy: "Healthy",
  monitor: "Monitor",
  no_target: PTC_NO_TARGET_LABEL,
};

const projectComplianceBcba = (rows: PtcBcbaRow[]): Record<string, unknown>[] =>
  rows.map((r) => ({
    bcba: r.bcba,
    completed97156Hours: r.completed97156Hours,
    completed97153Hours: r.completed97153Hours,
    status: COMPLIANCE_BCBA_STATUS_LABEL[r.status],
  }));

const projectComplianceClients = (rows: PtcClientRow[]): Record<string, unknown>[] =>
  rows.map((r) => ({
    client: r.client,
    clientCrId: r.clientCrId || "\u2014",
    bcba: r.bcba,
    payor: r.payor ?? "\u2014",
    thresholdHours: r.thresholdHours ?? PTC_NO_TARGET_LABEL,
    completed97156Hours: r.completed97156Hours,
    gapHours: r.gapHours ?? "\u2014",
    status: COMPLIANCE_STATUS_LABEL[r.status],
    reason: r.reason,
  }));

const DEFAULT_FILTERS = withCurrentMonthDefault(EMPTY_FILTERS);

export default function ParentTrainingPage() {
  const [filters, setFilters] = useUrlFilterState<PrimaryReportFilters>(DEFAULT_FILTERS);
  // The selected window is pushed to the database before pagination, so a
  // current-month view never pages years of history.
  const data = useCrPrimaryReport(["billingFacts", "scheduleCurrent", "authCurrent"], {
    from: filters.from || null,
    to: filters.to || null,
  });
  const ownership = useBcbaOwnershipV3();
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

  /**
   * Clients proven by the provider-filtered activity. When a provider filter is
   * on, auth-only clients are constrained to this set: an authorization row has
   * no provider, so keeping all of them would leak unfiltered clients into a
   * provider-scoped view.
   */
  const provenClients = useMemo(
    () =>
      buildProvenClientProof([
        // CR client id first, from BOTH sources: a schedule-only client keeps
        // its id-based proof instead of falling back to name-only matching.
        ...billing.map((r) => ({ clientCrId: r.client_cr_id, clientName: r.client_name })),
        ...schedule.map((r) => ({ clientCrId: r.client_cr_id, clientName: r.client_name })),
      ]),
    [billing, schedule],
  );

  const providerFiltered = filters.provider.length > 0;

  const authRows = useMemo(
    () =>
      data.authCurrent.filter((a) => {
        if (filters.state.length && !filters.state.includes(String(a.state ?? ""))) return false;
        if (filters.payor.length && !filters.payor.includes(String(a.payor ?? ""))) return false;
        if (filters.client.length && !filters.client.includes(String(a.client_name ?? ""))) return false;
        if (
          providerFiltered &&
          !provenClients.passes({ clientCrId: a.client_cr_id, clientName: a.client_name })
        )
          return false;
        return true;
      }),
    [
      data.authCurrent,
      filters.state,
      filters.payor,
      filters.client,
      providerFiltered,
      provenClients,
    ],
  );

  const resolveOwner = useMemo(() => {
    const index = ownership.data;
    return (s: { clientName?: string | null; clientCrId?: string | null; date?: string | null }) =>
      index?.resolve({ clientCrId: s.clientCrId, clientName: s.clientName, date: s.date }).bcba ?? null;
  }, [ownership.data]);


  const fullAnalysis = useMemo(() => {
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
          clientCrId: r.client_cr_id ?? null,
          providerName: r.provider_name,
          payor: r.payor,
          state: r.state,
          cancelled: truth.cancelled,
          cancellationReason: r.cancellation_reason,
        };
      });

    /**
     * Every client with billed OR scheduled activity in the window, so a
     * schedule-only client still appears in the no-upcoming and reschedule
     * workflows. Identity is keyed CR-id first, then normalized name.
     */
    const activeClients = new Map<
      string,
      { client: string; clientCrId?: string | null; payor?: string | null; state?: string | null }
    >();
    const addActive = (row: {
      client_name?: string | null;
      client_cr_id?: string | null;
      payor?: string | null;
      state?: string | null;
    }) => {
      const name = String(row.client_name ?? "").trim();
      if (!name) return;
      const id = String(row.client_cr_id ?? "").trim();
      const key = id ? `cr:${id}` : `nm:${name.toLowerCase()}`;
      const existing = activeClients.get(key);
      if (!existing) {
        activeClients.set(key, {
          client: name,
          clientCrId: id || null,
          payor: row.payor,
          state: row.state,
        });
        return;
      }
      if (!existing.clientCrId && id) existing.clientCrId = id;
    };
    for (const r of billing) addActive(r);
    for (const r of schedule) addActive(r);

    const authorizations = authRows.map((a) => ({
      clientName: a.client_name,
      clientCrId: a.client_cr_id,
      payor: a.payor,
      state: a.state,
      procedureCode: a.procedure_code,
      serviceCodes: a.service_codes,
      frequency: a.frequency,
      authorizedHoursMonth: a.authorized_hours_month,
      startDate: a.start_date,
      endDate: a.end_date,
      actualStartDate: a.actual_start_date,
      actualEndDate: a.actual_end_date,
      followupStartDate: a.followup_start_date,
      followupEndDate: a.followup_end_date,
      isActive: a.is_active,
    }));

    return computeParentTrainingAnalysis({
      billed,
      scheduled,
      authorizations,
      activeClients: [...activeClients.values()],
      resolveOwner,
      window: { from: filters.from, to: filters.to },
      today,
    });
  }, [billing, schedule, authRows, resolveOwner, filters.from, filters.to, today]);

  const bcbaOptions = useMemo(
    () => [...new Set(fullAnalysis.clientRows.map((r) => r.bcba))].sort((a, b) => a.localeCompare(b)),
    [fullAnalysis.clientRows],
  );

  /**
   * The BCBA selection rescopes the entire analysis — KPIs, chart, queues,
   * drilldowns, and exports — not only the visible table rows.
   */
  const analysis = useMemo(
    () => scopeParentTrainingToBcba(fullAnalysis, bcbaParam),
    [fullAnalysis, bcbaParam],
  );

  const clientRows = analysis.clientRows;
  const eventRows = analysis.events;

  /**
   * Compliance is a SEPARATE payer-policy view: completed, nonvoid, nondeleted
   * billed 97156 in the selected calendar month against a per-client payor
   * threshold. 97153 is shown for activity context only and is never a
   * denominator here. This intentionally ignores the authorization-target /
   * cadence machinery above — it has its own payor rule.
   */
  const complianceAnalysis = useMemo(
    () =>
      computeParentTrainingCompliance({
        billed: billing.map((r) => ({
          date: r.date_of_service,
          procedureCode: r.procedure_code,
          hours: r.hours,
          clientName: r.client_name,
          clientCrId: r.client_cr_id,
          isVoid: r.is_void,
          deleted: r.deleted,
        })),
        authorizations: authRows.map((a) => ({
          clientName: a.client_name,
          clientCrId: a.client_cr_id,
          payor: a.payor,
          procedureCode: a.procedure_code,
          serviceCodes: a.service_codes,
          isActive: a.is_active,
          actualStartDate: a.actual_start_date,
          actualEndDate: a.actual_end_date,
          startDate: a.start_date,
          endDate: a.end_date,
        })),
        resolveOwner,
        window: { from: filters.from, to: filters.to },
      }),
    [billing, authRows, resolveOwner, filters.from, filters.to],
  );

  const complianceClientColumns: PrimaryTableColumn<PtcClientRow>[] = [
    { key: "client", label: "Client", render: (r) => <span className="font-medium">{r.client}</span> },
    { key: "payor", label: "Payor", render: (r) => r.payor ?? "\u2014" },
    {
      key: "required",
      label: "Required Hrs / Month",
      align: "right",
      render: (r) => (r.thresholdHours == null ? PTC_NO_TARGET_LABEL : fmtHours(r.thresholdHours)),
    },
    {
      key: "completed",
      label: "Completed 97156 Hrs",
      align: "right",
      render: (r) => fmtHours(r.completed97156Hours),
    },
    {
      key: "gap",
      label: "Gap Hrs",
      align: "right",
      render: (r) => (r.gapHours == null ? "\u2014" : fmtHours(r.gapHours)),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Badge
          variant="outline"
          className={
            r.status === "healthy"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
              : r.status === "monitor"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                : r.status === "needs_payor_review"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-border bg-muted text-muted-foreground"
          }
        >
          {COMPLIANCE_STATUS_LABEL[r.status]}
        </Badge>
      ),
    },
    { key: "reason", label: "Why", render: (r) => r.reason },
  ];

  const complianceBcbaColumns: PrimaryTableColumn<PtcBcbaRow>[] = [
    { key: "bcba", label: "BCBA", render: (r) => r.bcba },
    {
      key: "completed97156",
      label: "Completed 97156 Hrs",
      align: "right",
      render: (r) => fmtHours(r.completed97156Hours),
    },
    {
      key: "completed97153",
      label: "Completed 97153 Hrs",
      align: "right",
      render: (r) => fmtHours(r.completed97153Hours),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Badge
          variant="outline"
          className={
            r.status === "healthy"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
              : r.status === "monitor"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                : "border-border bg-muted text-muted-foreground"
          }
        >
          {COMPLIANCE_BCBA_STATUS_LABEL[r.status]}
        </Badge>
      ),
    },
  ];


  const filterFields = useMemo<FilterFieldConfig[]>(
    () =>
      FILTER_FIELDS.map((key) => ({
        key: key as FilterFieldConfig["key"],
        label: FILTER_LABELS[key] ?? key,
        // Union of billing and schedule values so a schedule-only future
        // client, provider, state or payor is still selectable.
        options: [
          ...new Set([
            ...optionsFor(data.billingFacts, (r: ReportBillingFactRow) =>
              key === "client"
                ? r.client_name
                : key === "provider"
                  ? r.provider_name
                  : (r[key as "state" | "payor"] as string | null),
            ),
            ...optionsFor(data.scheduleCurrent, (r) =>
              key === "client"
                ? r.client_name
                : key === "provider"
                  ? r.provider_name
                  : (r[key as "state" | "payor"] as string | null),
            ),
          ]),
        ].sort((a, b) => a.localeCompare(b)),
      })),
    [data.billingFacts, data.scheduleCurrent],
  );

  const noUpcoming = clientRows.filter((r) => r.noUpcoming);
  const belowTarget = clientRows.filter((r) => r.belowTarget);
  const needsReschedule = clientRows.filter((r) => r.needsReschedule);
  const dataGaps = clientRows.filter((r) => r.ownershipGap || r.targetConflict);

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
        id: "no-upcoming",
        label: "No upcoming appointment",
        value: fmtCount(noUpcoming.length),
        hint: "No future kept 97156 session on the calendar",
        tone: noUpcoming.length > 0 ? "bad" : "good",
      },
      {
        id: "below-target",
        label: "Below target pace",
        value: fmtCount(belowTarget.length),
        hint: `${fmtCount(analysis.clientsWithTarget)} client(s) have a documented target · ${fmtCount(analysis.clientsWithoutTarget)} have ${NO_TARGET_LABEL.toLowerCase()}`,
        tone: belowTarget.length > 0 ? "warn" : "good",
      },
    ],
    [analysis, noUpcoming.length, belowTarget.length],
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
    {
      key: "target",
      label: "Target / Month",
      align: "right",
      render: (r) =>
        r.targetValue == null
          ? NO_TARGET_LABEL
          : `${r.targetValue} ${r.targetType === "sessions" ? "session(s)" : "hr"}`,
    },
    { key: "cadence", label: "Expected Cadence", render: (r) => r.expectedCadence },
    {
      key: "pace",
      label: "Pace",
      align: "right",
      render: (r) => (r.pacePct == null ? NO_TARGET_LABEL : fmtPct(r.pacePct)),
    },
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
      render: (r) => (
        <Badge
          variant="outline"
          className={
            r.status === "no_appointment"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : r.status === "below_target" || r.status === "needs_reschedule"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                : r.status === "no_target"
                  ? "border-border bg-muted text-muted-foreground"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
          }
        >
          {PT_STATUS_LABELS[r.status]}
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
    if (tab === "compliance") {
      downloadCsv(
        "parent-training-compliance-bcba",
        projectComplianceBcba(complianceAnalysis.bcbaRows),
        COMPLIANCE_BCBA_COLUMNS,
      );
      return;
    }
    if (tab === "completed" || tab === "upcoming" || tab === "cancelled") {
      const bucket = tab as PtEventRow["bucket"];
      downloadCsv(`parent-training-${tab}`, projectEvents(bucketRows(bucket)), EVENT_COLUMNS);
      return;
    }
    const rows =
      tab === "no-upcoming"
        ? noUpcoming
        : tab === "below-target"
          ? belowTarget
          : tab === "needs-reschedule"
            ? needsReschedule
            : tab === "data-gaps"
              ? dataGaps
              : clientRows;
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
        providerFiltered
          ? "A provider filter is active. Authorizations carry no rendering provider, so authorization-only clients are limited to clients proven by the filtered activity."
          : "",

      ].filter(Boolean)}
      onRefresh={() => {
        data.refresh();
        ownership.refetch();
      }}
      onExport={exportForTab}
      exportDisabled={
        clientRows.length === 0 && eventRows.length === 0 && complianceAnalysis.bcbaRows.length === 0
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
        Completed parent training is billed 97156 only. Upcoming counts sessions still ahead of today
        that have not been cancelled; a scheduled session is never counted as delivered. Targets come
        only from the source: active 97156 authorized monthly hours, or an unambiguous documented
        cadence. Clients with neither show "{NO_TARGET_LABEL}" and are never counted below target.
        The selected window spans {analysis.monthsInWindow} calendar month(s).
      </ReportProvenance>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={setTabParam}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            <TabsTrigger value="no-upcoming">No upcoming</TabsTrigger>
            <TabsTrigger value="below-target">Below target</TabsTrigger>
            <TabsTrigger value="needs-reschedule">Needs reschedule</TabsTrigger>
            <TabsTrigger value="data-gaps">Data gaps</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
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
          if (id === "no-upcoming") setTabParam("no-upcoming");
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
            rowKey={(r) => r.clientKey}
            onRowClick={(r) =>
              setDrilldown({
                title: `${r.client} — parent training`,
                subtitle: r.reason,
                rows: projectEvents(eventRows.filter((e) => e.clientKey === r.clientKey)),
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

      {(tab === "no-upcoming" ||
        tab === "below-target" ||
        tab === "needs-reschedule" ||
        tab === "data-gaps") && (
        <PrimaryTable
          title={
            tab === "no-upcoming"
              ? "No upcoming parent-training appointment"
              : tab === "below-target"
                ? "Below documented target pace"
                : tab === "needs-reschedule"
                  ? "Cancelled and not yet rescheduled"
                  : "Data gaps"
          }
          subtitle={
            tab === "no-upcoming"
              ? "Zero future kept 97156 sessions on the calendar, even if a session was completed earlier."
              : tab === "below-target"
                ? "Behind the pace their documented authorized hours or cadence requires."
                : tab === "needs-reschedule"
                  ? "A cancelled 97156 session with no later replacement on the calendar."
                  : "No canonical BCBA owner could be resolved at these dates, or the snapshot documents conflicting 97156 target requirements. Clients with simply no documented requirement stay No target and are not listed here."
          }
          columns={clientColumns}
          rows={
            tab === "no-upcoming"
              ? noUpcoming
              : tab === "below-target"
                ? belowTarget
                : tab === "needs-reschedule"
                  ? needsReschedule
                  : dataGaps
          }
          rowKey={(r) => r.clientKey}
          onRowClick={(r) =>
            setDrilldown({
              title: `${r.client} — parent training`,
              subtitle: r.reason,
              rows: projectEvents(eventRows.filter((e) => e.clientKey === r.clientKey)),
              columns: EVENT_COLUMNS,
              exportName: "parent-training-client",
            })
          }
          maxRows={300}
        />
      )}

      {tab === "compliance" && !complianceAnalysis.singleMonth && (
        <ReportProvenance>{complianceAnalysis.unavailableReason}</ReportProvenance>
      )}

      {tab === "compliance" && complianceAnalysis.singleMonth && (
        <>
          <ReportProvenance>
            Compliance is a separate payer-policy view: completed, nonvoid, nondeleted billed 97156
            in the selected calendar month against each client's payor threshold (2.0 hr/month for
            Peachstate, 0.25 hr/month for any other single documented payor). The client list
            includes every client with an active, in-month 97156 authorization, so a client with an
            authorization and no delivered hours still appears. 97153 is shown for activity context
            only and is never a denominator here. Clients with no documented 97156 payor show "
            {PTC_NO_TARGET_LABEL}"; clients with more than one distinct active 97156 authorization
            payor show "{NEEDS_PAYOR_REVIEW_LABEL}" rather than an arbitrary pick.
          </ReportProvenance>
          <PrimaryTable
            title="Parent training compliance by BCBA"
            subtitle="A BCBA is Healthy only when every resolvable client meets their own threshold; Monitor when any resolvable client is below. Click a BCBA to see client-level detail."
            columns={complianceBcbaColumns}
            rows={complianceAnalysis.bcbaRows}
            rowKey={(r) => r.bcba}
            onRowClick={(r) =>
              setDrilldown({
                title: `${r.bcba} — parent training compliance`,
                subtitle: "Payor rule, required hours, completed hours, gap, and reason per client.",
                rows: projectComplianceClients(
                  complianceAnalysis.clientRows.filter((c) => r.clientKeys.includes(c.clientKey)),
                ),
                columns: COMPLIANCE_CLIENT_COLUMNS,
                exportName: "parent-training-compliance-clients",
              })
            }
            maxRows={300}
          />
          <PrimaryTable
            title="Parent training compliance by client"
            subtitle="Click a client to see the exact payor rule, required hours, completed hours, gap, and reason."
            columns={complianceClientColumns}
            rows={complianceAnalysis.clientRows}
            rowKey={(r) => r.clientKey}
            onRowClick={(r) =>
              setDrilldown({
                title: `${r.client} — parent training compliance`,
                subtitle: r.reason,
                rows: projectComplianceClients([r]),
                columns: COMPLIANCE_CLIENT_COLUMNS,
                exportName: "parent-training-compliance-client",
              })
            }
            maxRows={300}
          />
        </>
      )}

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}
