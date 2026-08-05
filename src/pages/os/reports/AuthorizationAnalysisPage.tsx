/**
 * Primary report: Authorization Analysis (`authorization-analysis`).
 *
 * Reads normalized CentralReach authorization rows and reports the weekly
 * authorization workflow — initial assessments, initial treatment, RAs, and
 * progress reports — plus paused work and its reason.
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
import {
  fmtCount,
  fmtDate,
  fmtPct,
  weekEnd,
  weekRangeLabel,
  weekStart,
} from "@/lib/os/reports/crPrimary/format";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import { AUTH_DRILLDOWN_COLUMNS, projectAuthRows } from "@/lib/os/reports/crPrimary/drilldown";
import {
  classifyAuthKind,
  classifyAuthStatus,
  classifyPauseReason,
  computeAuthorizationAnalysis,
} from "@/lib/os/reports/crPrimary/metrics/authorizationAnalysis";
import { normalizeCode } from "@/lib/os/reports/crPrimary/metrics/codes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOSRole } from "@/contexts/OSRoleContext";
import { useAuthorizationWeeklyEvents } from "@/hooks/useAuthorizationWeeklyEvents";
import { LogAuthEventDialog } from "@/components/reports/crPrimary/LogAuthEventDialog";
import { deriveNoRaPauses } from "@/lib/os/reports/crPrimary/metrics/authorizationPauses";
import {
  AUTH_EVENT_LABELS,
  AUTH_EVENT_TYPES,
  CR_DERIVABLE_EVENT_TYPES,
  computeAuthTrackerWeeks,
  deriveTrackerWeeksFromAuthorizations,
  authorizationTrackerWeek,
  totalTrackerCounts,
  type AuthEventType,
} from "@/lib/os/reports/crPrimary/metrics/authorizationTracker";

const KIND_LABEL: Record<string, string> = {
  initial_assessment: "Initial Assessment",
  initial_treatment: "Initial Treatment",
  reauthorization: "Reauthorization (RA)",
  progress_report: "Progress Report",
  other: "Other",
};

/** Roles allowed to log authorization workflow events. */
const AUTH_EVENT_EDITOR_ROLES = new Set([
  "super_admin",
  "systems_admin",
  "coo",
  "executive_leadership",
  "operations_leadership",
  "authorization_manager",
  "authorization_coordinator",
  "qa_lead",
  "qa_team",
]);

const TRACKER_EXPORT_COLUMNS = [
  { key: "weekStart", label: "Week Start" },
  ...AUTH_EVENT_TYPES.map((t) => ({ key: t, label: AUTH_EVENT_LABELS[t] })),
];

/** CentralReach-derived cells map back to a work type + status pair. */
const DERIVED_CELL_FILTER: Partial<
  Record<AuthEventType, { kind: string; status?: "approved" | "denied" }>
> = {
  initial_assessment_submitted: { kind: "initial_assessment" },
  initial_assessment_approved: { kind: "initial_assessment", status: "approved" },
  initial_assessment_denied: { kind: "initial_assessment", status: "denied" },
  initial_treatment_submitted: { kind: "initial_treatment" },
  initial_treatment_approved: { kind: "initial_treatment", status: "approved" },
  initial_treatment_denied: { kind: "initial_treatment", status: "denied" },
  ra_submitted: { kind: "reauthorization" },
  ra_approved: { kind: "reauthorization", status: "approved" },
  ra_denied: { kind: "reauthorization", status: "denied" },
};

/** Bucket columns prepended to every cell-level drilldown. */
const BUCKET_COLUMNS = [
  { key: "bucketStart", label: "Bucket Start" },
  { key: "bucketEnd", label: "Bucket End" },
  { key: "bucketDate", label: "Date In Bucket" },
];

export default function AuthorizationAnalysisPage() {
  const data = useCrPrimaryReport(["authorizations", "billing"]);
  const tracker = useAuthorizationWeeklyEvents();
  const { role } = useOSRole();
  const canLog = AUTH_EVENT_EDITOR_ROLES.has(role);
  const [logOpen, setLogOpen] = useState(false);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);

  const rows = useMemo(
    () =>
      applyFilters(data.authorizations, filters, (r) => ({
        date: r.start_date,
        endDate: r.end_date,
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        code: normalizeCode(r.procedure_code),
        status: r.status,
      })),
    [data.authorizations, filters],
  );

  const metrics = useMemo(() => computeAuthorizationAnalysis(rows), [rows]);

  // Derived "Services Paused — No RA": active client weeks with no service and
  // no covering authorization window.
  const derivedPauses = useMemo(
    () => deriveNoRaPauses(data.billing, rows),
    [data.billing, rows],
  );

  const trackerEvents = useMemo(
    () =>
      applyFilters(tracker.events, filters, (e) => ({
        date: e.event_date,
        state: e.state,
        client: e.client_name,
        payor: e.payor,
      })),
    [tracker.events, filters],
  );

  const crTrackerWeeks = useMemo(() => deriveTrackerWeeksFromAuthorizations(rows), [rows]);

  const trackerWeeks = useMemo(
    () =>
      computeAuthTrackerWeeks(
        trackerEvents,
        derivedPauses.map((p) => ({ weekStart: p.weekStart, clientKey: p.clientKey })),
        crTrackerWeeks,
      ),
    [trackerEvents, derivedPauses, crTrackerWeeks],
  );
  const trackerTotals = useMemo(() => totalTrackerCounts(trackerWeeks), [trackerWeeks]);

  const projected = useMemo(
    () =>
      projectAuthRows(rows, {
        kind: (r) => KIND_LABEL[classifyAuthKind(r)] ?? "Other",
        status: (r) => classifyAuthStatus(r),
      }),
    [rows],
  );

  const fields: FilterFieldConfig[] = useMemo(
    () => [
      { key: "state", label: "State", options: optionsFor(data.authorizations, (r) => r.state) },
      { key: "payor", label: "Payor", options: optionsFor(data.authorizations, (r) => r.payor) },
      { key: "client", label: "Client", options: optionsFor(data.authorizations, (r) => r.client_name) },
      {
        key: "code",
        label: "Service Code",
        options: optionsFor(data.authorizations, (r) => normalizeCode(r.procedure_code)),
      },
      { key: "status", label: "Status", options: optionsFor(data.authorizations, (r) => r.status) },
    ],
    [data.authorizations],
  );

  const kpis: KpiDefinition[] = [
    { id: "total", label: "Authorizations", value: fmtCount(metrics.totalAuthorizations), hint: "Rows in scope" },
    { id: "submitted", label: "Submitted", value: fmtCount(metrics.submitted), hint: "Includes approved + denied" },
    {
      id: "approved",
      label: "Approved",
      value: fmtCount(metrics.approved),
      hint: `${fmtPct(metrics.approvalRate)} approval rate`,
      tone: metrics.approvalRate >= 85 ? "good" : "warn",
    },
    {
      id: "denied",
      label: "Denied",
      value: fmtCount(metrics.denied),
      hint: `${fmtPct(metrics.denialRate)} denial rate`,
      tone: metrics.denied > 0 ? "bad" : "good",
    },
    {
      id: "paused",
      label: "Paused Work",
      value: fmtCount(metrics.paused),
      hint: "Authorization work on hold",
      tone: metrics.paused > 0 ? "warn" : "good",
    },
    {
      id: "paused-no-ra",
      label: "Paused — No RA",
      value: fmtCount(trackerTotals.services_paused_no_ra),
      hint: "Logged + derived from authorization coverage",
      tone: trackerTotals.services_paused_no_ra > 0 ? "bad" : "good",
    },
    {
      id: "paused-late-pr",
      label: "Paused — Late/Missing PR",
      value: fmtCount(trackerTotals.services_paused_late_pr),
      hint: "Logged by the authorization team, with reason",
      tone: trackerTotals.services_paused_late_pr > 0 ? "bad" : "good",
    },
    { id: "weeks", label: "Weeks Tracked", value: fmtCount(trackerWeeks.length) },
  ];

  const openDrilldown = (
    title: string,
    predicate: (index: number) => boolean,
    subtitle?: string,
    cellFilters?: { label: string; value: string }[],
  ) => {
    const filtered = projected.filter((_, i) => predicate(i));
    setDrilldown({
      title,
      subtitle: subtitle ?? "CentralReach authorization source rows with matched Blossom context.",
      filters: cellFilters,
      rows: filtered,
      columns: AUTH_DRILLDOWN_COLUMNS,
      exportName: `authorization-analysis-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    });
  };

  /** Derived no-RA pause weeks (client weeks with no service and no coverage). */
  const openPauseDrilldown = (week?: string) => {
    const list = week ? derivedPauses.filter((p) => p.weekStart === week) : derivedPauses;
    setDrilldown({
      title: week ? `Paused — no RA · week of ${fmtDate(week)}` : "Paused — no reauthorization",
      subtitle:
        "Derived from authorization coverage: client weeks with no billed service and no authorization covering the week.",
      filters: [
        { label: "Metric", value: AUTH_EVENT_LABELS.services_paused_no_ra },
        { label: "Source", value: "Derived from authorization coverage" },
        ...(week
          ? [
              { label: "Bucket", value: weekRangeLabel(week) },
              { label: "Bucket start", value: week },
              { label: "Bucket end", value: weekEnd(week) ?? "—" },
            ]
          : [{ label: "Bucket", value: "All tracked weeks" }]),
      ],
      rows: list.map((p) => ({
        weekStart: p.weekStart,
        weekEnd: weekEnd(p.weekStart) ?? "",
        client: p.clientName,
        state: p.state ?? "",
        payor: p.payor ?? "",
        lastAuthEnd: p.lastAuthEnd ?? "No authorization on file",
        source: "Derived from authorization coverage",
      })),
      columns: [
        { key: "weekStart", label: "Week Start" },
        { key: "weekEnd", label: "Week End" },
        { key: "client", label: "Client" },
        { key: "state", label: "State" },
        { key: "payor", label: "Payor" },
        { key: "lastAuthEnd", label: "Last Auth End" },
        { key: "source", label: "Source" },
      ],
      exportName: "authorization-analysis-paused-no-ra",
    });
  };

  /** Logged tracker events of one type, optionally limited to a single week. */
  const openEventDrilldown = (type: AuthEventType, week?: string) => {
    const list = trackerEvents.filter(
      (e) => e.event_type === type && (!week || weekStart(e.event_date) === week),
    );
    setDrilldown({
      title: `${AUTH_EVENT_LABELS[type]}${week ? ` · week of ${fmtDate(week)}` : ""}`,
      subtitle: "Authorization-team logged workflow events.",
      filters: [
        { label: "Metric", value: AUTH_EVENT_LABELS[type] },
        { label: "Source", value: "Authorization-team logged events" },
        ...(week
          ? [
              { label: "Bucket", value: weekRangeLabel(week) },
              { label: "Bucket start", value: week },
              { label: "Bucket end", value: weekEnd(week) ?? "—" },
            ]
          : [{ label: "Bucket", value: "All tracked weeks" }]),
      ],
      rows: list.map((e) => ({
        bucketStart: week ?? weekStart(e.event_date) ?? "",
        bucketEnd: weekEnd(week ?? weekStart(e.event_date)) ?? "",
        eventDate: e.event_date,
        client: e.client_name ?? "",
        authNumber: e.authorization_number ?? "",
        payor: e.payor ?? "",
        state: e.state ?? "",
        pauseReason: e.pause_reason ?? "",
        pauseDetail: e.pause_reason_detail ?? "",
        notes: e.notes ?? "",
      })),
      columns: [
        ...BUCKET_COLUMNS.filter((c) => c.key !== "bucketDate"),
        { key: "eventDate", label: "Event Date" },
        { key: "client", label: "Client" },
        { key: "authNumber", label: "Authorization #" },
        { key: "payor", label: "Payor" },
        { key: "state", label: "State" },
        { key: "pauseReason", label: "Pause Reason" },
        { key: "pauseDetail", label: "Reason Detail" },
        { key: "notes", label: "Notes" },
      ],
      exportName: `authorization-analysis-${type.replace(/_/g, "-")}`,
    });
  };

  /**
   * CentralReach-derived tracker cell: the authorization rows of that work type
   * (and status) whose week matches.
   */
  const openDerivedCellDrilldown = (type: AuthEventType, week: string) => {
    const spec = DERIVED_CELL_FILTER[type];
    if (!spec) return;
    const matched = rows.filter((row) => {
      if (authorizationTrackerWeek(row) !== week) return false;
      if (classifyAuthKind(row) !== spec.kind) return false;
      if (spec.status && classifyAuthStatus(row) !== spec.status) return false;
      return true;
    });
    const projectedMatched = projectAuthRows(matched, {
      kind: (r) => KIND_LABEL[classifyAuthKind(r)] ?? "Other",
      status: (r) => classifyAuthStatus(r),
    }).map((r, i) => ({
      bucketStart: week,
      bucketEnd: weekEnd(week) ?? "",
      bucketDate:
        matched[i].actual_start_date ??
        matched[i].start_date ??
        matched[i].followup_start_date ??
        "",
      ...r,
    }));
    setDrilldown({
      title: `${AUTH_EVENT_LABELS[type]} · week of ${fmtDate(week)}`,
      subtitle:
        "Only the CentralReach authorization rows that produced this count, classified from client labels and service codes.",
      filters: [
        { label: "Metric", value: AUTH_EVENT_LABELS[type] },
        { label: "Bucket", value: weekRangeLabel(week) },
        { label: "Bucket start", value: week },
        { label: "Bucket end", value: weekEnd(week) ?? "—" },
        { label: "Work type", value: KIND_LABEL[spec.kind] ?? spec.kind },
        { label: "Mapped status", value: spec.status ?? "Any (submitted)" },
        { label: "Bucketed by", value: "Actual start date, else start date, else follow-up start" },
        { label: "Source", value: "CentralReach authorizations export" },
      ],
      rows: projectedMatched,
      columns: [...BUCKET_COLUMNS, ...AUTH_DRILLDOWN_COLUMNS],
      exportName: `authorization-analysis-${type.replace(/_/g, "-")}-${week}`,
    });
  };

  const onKpi = (id: string) => {
    const byStatus = (want: string) => (i: number) => classifyAuthStatus(rows[i]) === want;
    if (id === "approved") return openDrilldown("Approved authorizations", byStatus("approved"));
    if (id === "denied") return openDrilldown("Denied authorizations", byStatus("denied"));
    if (id === "paused") return openDrilldown("Paused authorizations", byStatus("paused"));
    if (id === "paused-no-ra") return openPauseDrilldown();
    if (id === "paused-late-pr") return openEventDrilldown("services_paused_late_pr");
    if (id === "submitted")
      return openDrilldown("Submitted authorization work", (i) =>
        ["submitted", "pending", "approved", "denied"].includes(classifyAuthStatus(rows[i])),
      );
    return openDrilldown("All authorizations in scope", () => true);
  };

  const weeklyChart = trackerWeeks.map((w) => ({
    label: fmtDate(w.weekStart),
    value:
      w.initial_assessment_submitted +
      w.initial_treatment_submitted +
      w.ra_submitted +
      w.progress_report_submitted,
    secondary: w.services_paused_no_ra + w.services_paused_late_pr,
  }));

  return (
    <PrimaryReportShell
      title="Authorization Analysis"
      subtitle="Weekly authorization workflow from CentralReach: initial assessments, initial treatment, reauthorizations, progress reports, and paused work with reasons."
      requiredExports={["Authorizations export"]}
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      onRefresh={data.refresh}
      exportDisabled={projected.length === 0}
      onExport={() => {
        downloadCsv("authorization-analysis", projected, AUTH_DRILLDOWN_COLUMNS);
        if (trackerWeeks.length) {
          downloadCsv(
            "authorization-weekly-tracking",
            trackerWeeks as unknown as Record<string, unknown>[],
            TRACKER_EXPORT_COLUMNS,
          );
        }
      }}
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

        <PrimaryTable
          title="Weekly authorization tracking"
          subtitle="Every tracked authorization event by week. Click a cell value to open its source rows."
          rows={[...trackerWeeks].reverse()}
          rowKey={(w) => w.weekStart}
          actions={
            canLog ? (
              <Button size="sm" onClick={() => setLogOpen(true)}>
                Log event
              </Button>
            ) : undefined
          }
          columns={[
            {
              key: "weekStart",
              label: "Week of",
              render: (w) => <span className="font-medium">{fmtDate(w.weekStart)}</span>,
            },
            ...AUTH_EVENT_TYPES.map((t) => ({
              key: t,
              label: AUTH_EVENT_LABELS[t],
              align: "right" as const,
              render: (w: (typeof trackerWeeks)[number]) =>
                w[t] ? (
                  <button
                    type="button"
                    className="font-medium underline-offset-2 hover:underline"
                    onClick={() =>
                      w.sources[t] === "centralreach"
                        ? openDerivedCellDrilldown(t, w.weekStart)
                        : w.sources[t] === "derived"
                          ? openPauseDrilldown(w.weekStart)
                          : openEventDrilldown(t, w.weekStart)
                    }
                  >
                    {fmtCount(w[t])}
                  </button>
                ) : canLog && !CR_DERIVABLE_EVENT_TYPES.has(t) ? (
                  <button
                    type="button"
                    className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                    onClick={() => setLogOpen(true)}
                  >
                    Log
                  </button>
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            })),
          ]}
          emptyLabel="No authorization activity in this range. Clear the filters or upload a CentralReach authorization export."
          maxRows={60}
        />

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Initial Assessment, Initial Treatment, and RA rows are derived from the CentralReach
          authorization export (client labels + service codes, one work type per authorization).
          Progress Report events and service pauses are not in any CentralReach export, so they are
          logged by the Authorization team — cells marked “Log” are awaiting entry. Logged numbers
          always replace the derived number for that week. “Services Paused — No RA” also includes
          weeks detected automatically from authorization coverage gaps.
        </p>

        <PrimaryChart
          title="Weekly authorization workflow"
          subtitle="Submitted authorization work vs paused work, by week"
          type="bar"
          data={weeklyChart}
          valueLabel="Submitted"
          secondaryLabel="Paused"
          height={300}
          onSelect={(label) =>
            openDrilldown(
              `Week of ${label}`,
              (i) => fmtDate(weekStart(rows[i].start_date) ?? weekStart(rows[i].end_date)) === label,
            )
          }
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <PrimaryChart
            title="Paused work by reason"
            type="pie"
            data={metrics.pauseReasons}
            valueLabel="Paused"
            onSelect={(label) =>
              openDrilldown(`Paused — ${label}`, (i) => {
                const reason = classifyPauseReason(rows[i]);
                if (label.toLowerCase().includes("reauthorization")) return reason === "no_reauthorization";
                if (label.toLowerCase().includes("progress")) return reason === "late_or_missing_pr";
                return reason === "other";
              })
            }
          />
          <PrimaryChart
            title="Approvals by payor"
            subtitle="Approved vs denied authorizations"
            type="bar"
            data={metrics.byPayor.slice(0, 10).map((p) => ({
              label: p.name,
              value: p.approved,
              secondary: p.denied,
            }))}
            valueLabel="Approved"
            secondaryLabel="Denied"
            onSelect={(label) =>
              openDrilldown(`Payor · ${label}`, (i) => (rows[i].payor ?? "Unknown") === label)
            }
          />
        </div>

        <PrimaryTable
          title="Authorization workload by payor"
          subtitle="Click a row to open its CentralReach source rows"
          rows={metrics.byPayor}
          rowKey={(r) => r.name}
          onRowClick={(r) =>
            openDrilldown(`Payor · ${r.name}`, (i) => (rows[i].payor ?? "Unknown") === r.name)
          }
          columns={[
            { key: "name", label: "Payor", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "submitted", label: "Submitted", align: "right", render: (r) => fmtCount(r.submitted) },
            { key: "approved", label: "Approved", align: "right", render: (r) => fmtCount(r.approved) },
            { key: "denied", label: "Denied", align: "right", render: (r) => fmtCount(r.denied) },
            { key: "paused", label: "Paused", align: "right", render: (r) => fmtCount(r.paused) },
            {
              key: "rate",
              label: "Approval Rate",
              align: "right",
              render: (r) => (
                <Badge variant={r.approvalRate >= 85 ? "secondary" : "destructive"} className="text-[10px]">
                  {fmtPct(r.approvalRate)}
                </Badge>
              ),
            },
          ]}
        />
      </div>

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />

      {canLog && (
        <LogAuthEventDialog
          open={logOpen}
          onOpenChange={setLogOpen}
          onSubmit={tracker.logEvent}
          clients={optionsFor(data.authorizations, (r) => r.client_name)}
          payors={optionsFor(data.authorizations, (r) => r.payor)}
        />
      )}
    </PrimaryReportShell>
  );
}