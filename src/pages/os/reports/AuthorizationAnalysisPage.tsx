/**
 * Authorization Command Center (`authorization-analysis`) — Phase 2A.
 *
 * Three operational questions, three tabs:
 *   1. Lifecycle    — what happened to submissions (logged events only).
 *   2. Continuity    — who is expiring, expired, or has no coverage.
 *   3. Coverage gaps — clients with no active authorization today.
 *
 * Rules enforced here:
 * - Lifecycle numbers come only from logged authorization events. When no
 *   events exist we say so explicitly instead of rendering zeros that look
 *   like "nothing was submitted".
 * - Renewal readiness is never asserted from a snapshot — rows are marked
 *   "needs confirmation", which is an action, not a claim.
 * - Hour-based utilization lives in its own report; this page links to it
 *   rather than recomputing it.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { PrimaryReportShell } from "@/components/reports/crPrimary/PrimaryReportShell";
import { KpiScorecards } from "@/components/reports/crPrimary/KpiScorecards";
import { PrimaryChart } from "@/components/reports/crPrimary/PrimaryChart";
import { PrimaryTable, type PrimaryTableColumn } from "@/components/reports/crPrimary/PrimaryTable";
import { DrilldownDrawer } from "@/components/reports/crPrimary/DrilldownDrawer";
import {
  PrimaryFilterBar,
  type FilterFieldConfig,
} from "@/components/reports/crPrimary/PrimaryFilterBar";
import {
  ReportProvenance,
  ReportInsufficientData,
} from "@/components/reports/crPrimary/ReportProvenance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrPrimaryReport } from "@/hooks/useCrPrimaryReport";
import { useUrlFilterState } from "@/hooks/useUrlFilterState";
import { applyFilters, optionsFor } from "@/lib/os/reports/crPrimary/filters";
import { EMPTY_FILTERS } from "@/lib/os/reports/crPrimary/types";
import type {
  CrAuthorizationCurrentRow,
  DrilldownRequest,
  PrimaryReportFilters,
} from "@/lib/os/reports/crPrimary/types";
import { fmtCount, fmtDate, fmtHours, fmtPct } from "@/lib/os/reports/crPrimary/format";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import {
  LIFECYCLE_KIND_LABELS,
  classifyLifecycleEvent,
  computeAuthorizationLifecycle,
} from "@/lib/os/reports/crPrimary/metrics/authorizationLifecycle";
import {
  computeAuthorizationContinuity,
  endDateOf,
  startDateOf,
  type ContinuityRow,
} from "@/lib/os/reports/crPrimary/metrics/authorizationContinuity";
import { pushRecent } from "@/lib/os/reportsCatalog";

const FILTER_FIELDS = ["state", "client", "payor", "code"] as const;
const FILTER_LABELS: Record<string, string> = {
  state: "State",
  client: "Client",
  payor: "Payor",
  code: "Service Code",
};

const CONTINUITY_TONE: Record<ContinuityRow["continuity"], string> = {
  active: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
  expiring: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  expired: "bg-destructive/10 text-destructive border border-destructive/30",
  not_started: "bg-sky-500/10 text-sky-600 border border-sky-500/30",
  unknown_dates: "bg-muted text-muted-foreground",
};

const CONTINUITY_LABEL: Record<ContinuityRow["continuity"], string> = {
  active: "Active",
  expiring: "Expiring",
  expired: "Expired",
  not_started: "Not started",
  unknown_dates: "Dates missing",
};

const RENEWAL_LABEL: Record<ContinuityRow["renewal"], string> = {
  needs_confirmation: "Confirm renewal",
  no_action: "No action",
  overdue: "Overdue",
};

const CONTINUITY_DRILLDOWN_COLUMNS = [
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
  { key: "renewal", label: "Renewal" },
  { key: "authorizedHours", label: "Authorized Hrs" },
  { key: "usedHours", label: "Used Hrs" },
  { key: "remainingHours", label: "Remaining Hrs" },
  { key: "note", label: "What This Means" },
];

const LIFECYCLE_DRILLDOWN_COLUMNS = [
  { key: "eventDate", label: "Event Date" },
  { key: "eventType", label: "Event Type" },
  { key: "kind", label: "Authorization Kind" },
  { key: "action", label: "Outcome" },
  { key: "authorizationNumber", label: "Authorization #" },
  { key: "client", label: "Client" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "reason", label: "Reason / Note" },
  { key: "source", label: "Logged From" },
];

const asText = (v: unknown, fallback = "") => (String(v ?? "").trim() || fallback);

function projectContinuityRows(rows: ContinuityRow[]): Record<string, unknown>[] {
  return rows.map((r) => ({
    authorizationNumber: r.authorizationNumber,
    client: r.client,
    clientCrId: r.clientCrId,
    payor: r.payor,
    state: r.state,
    code: r.code,
    startDate: r.startDate ?? "Not documented",
    endDate: r.endDate ?? "Not documented",
    daysToExpiry: r.daysToExpiry ?? "Unknown",
    continuity: CONTINUITY_LABEL[r.continuity],
    renewal: RENEWAL_LABEL[r.renewal],
    authorizedHours: r.authorizedHours ?? "Not documented",
    usedHours: r.usedHours ?? "Not documented",
    remainingHours: r.remainingHours ?? "Not documented",
    note: r.note,
  }));
}

type TabKey = "lifecycle" | "continuity" | "gaps";

export default function AuthorizationCommandCenterPage() {
  const data = useCrPrimaryReport(["authCurrent", "authEvents"]);
  const [filters, setFilters] = useUrlFilterState<PrimaryReportFilters>(EMPTY_FILTERS);
  const [tab, setTab] = useState<TabKey>("continuity");
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);

  useEffect(() => {
    pushRecent("authorization-analysis");
  }, []);

  const auths = useMemo(
    () =>
      applyFilters(data.authCurrent, filters, (r) => ({
        date: startDateOf(r),
        endDate: endDateOf(r),
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        code: r.service_codes ?? r.procedure_code,
      })),
    [data.authCurrent, filters],
  );

  const events = useMemo(
    () =>
      applyFilters(data.authEvents, filters, (r) => ({
        date: r.event_date,
        state: r.state,
        client: r.client_name,
        payor: r.payor,
      })),
    [data.authEvents, filters],
  );

  const lifecycle = useMemo(() => computeAuthorizationLifecycle(events), [events]);
  const continuity = useMemo(() => computeAuthorizationContinuity(auths), [auths]);

  const filterFields = useMemo<FilterFieldConfig[]>(
    () =>
      FILTER_FIELDS.map((key) => ({
        key,
        label: FILTER_LABELS[key] ?? key,
        options: optionsFor(data.authCurrent, (r: CrAuthorizationCurrentRow) =>
          key === "client"
            ? r.client_name
            : key === "code"
              ? (r.service_codes ?? r.procedure_code)
              : (r[key as "state" | "payor"] as string | null),
        ),
      })),
    [data.authCurrent],
  );

  const kpis = useMemo(
    () => [
      {
        id: "authorizations",
        label: "Authorizations in view",
        value: fmtCount(continuity.total),
        hint: `${fmtCount(continuity.active)} currently active`,
      },
      {
        id: "expiring",
        label: "Expiring soon",
        value: fmtCount(continuity.expiringSoon),
        hint: "Ends within 60 days — renewal needs confirmation",
        tone: continuity.expiringSoon > 0 ? ("warn" as const) : ("good" as const),
      },
      {
        id: "expired",
        label: "Already expired",
        value: fmtCount(continuity.expired),
        hint: "End date has passed with no later authorization in view",
        tone: continuity.expired > 0 ? ("bad" as const) : ("good" as const),
      },
      {
        id: "gaps",
        label: "Clients without coverage",
        value: fmtCount(continuity.clientsWithoutCoverage.length),
        hint: "No active authorization today — confirm before scheduling",
        tone: continuity.clientsWithoutCoverage.length > 0 ? ("bad" as const) : ("good" as const),
      },
      {
        id: "remaining",
        label: "Remaining hours",
        value: fmtHours(continuity.remainingHours),
        hint: `${fmtHours(continuity.authorizedHours)} authorized · ${fmtHours(continuity.usedHours)} used`,
      },
      {
        id: "unknown-dates",
        label: "Missing coverage dates",
        value: fmtCount(continuity.unknownDates),
        hint: "Cannot be assessed for expiry until dates are documented",
        tone: continuity.unknownDates > 0 ? ("warn" as const) : ("good" as const),
      },
      {
        id: "submitted",
        label: "Submissions logged",
        value: lifecycle.hasEvents ? fmtCount(lifecycle.submitted) : "No events",
        hint: lifecycle.hasEvents
          ? `${fmtPct(lifecycle.approvalRate)} approved · ${fmtPct(lifecycle.denialRate)} denied`
          : "No authorization events have been logged in this range",
        tone: lifecycle.hasEvents ? ("neutral" as const) : ("warn" as const),
      },
      {
        id: "denied",
        label: "Denials logged",
        value: lifecycle.hasEvents ? fmtCount(lifecycle.denied) : "No events",
        hint: lifecycle.hasEvents
          ? `${fmtCount(lifecycle.resubmitted)} resubmitted after a denial`
          : "Denial tracking starts once events are logged",
        tone: lifecycle.denied > 0 ? ("bad" as const) : ("neutral" as const),
      },
    ],
    [continuity, lifecycle],
  );

  const openContinuity = (
    title: string,
    subtitle: string,
    rows: ContinuityRow[],
    exportName: string,
  ) => {
    setDrilldown({
      title,
      subtitle,
      rows: projectContinuityRows(rows),
      columns: CONTINUITY_DRILLDOWN_COLUMNS,
      exportName,
    });
  };

  const openLifecycle = (
    title: string,
    subtitle: string,
    predicate: (e: (typeof events)[number]) => boolean,
    exportName: string,
  ) => {
    setDrilldown({
      title,
      subtitle,
      rows: events.filter(predicate).map((e) => {
        const c = classifyLifecycleEvent(e.event_type);
        return {
          eventDate: asText(e.event_date).slice(0, 10),
          eventType: asText(e.event_type, "Not documented"),
          kind: LIFECYCLE_KIND_LABELS[c.kind],
          action: c.action,
          authorizationNumber: asText(e.authorization_number, "Not documented"),
          client: asText(e.client_name, "Unknown client"),
          payor: asText(e.payor),
          state: asText(e.state),
          reason: asText(e.reason, "Not documented"),
          source: asText(e.source, "Not documented"),
        };
      }),
      columns: LIFECYCLE_DRILLDOWN_COLUMNS,
      exportName,
    });
  };

  const handleKpi = (id: string) => {
    if (id === "submitted" || id === "denied") {
      setTab("lifecycle");
      if (!lifecycle.hasEvents) return;
      return openLifecycle(
        id === "denied" ? "Denials logged" : "Submissions logged",
        "Authorization events behind this number.",
        (e) =>
          classifyLifecycleEvent(e.event_type).action ===
          (id === "denied" ? "denied" : "submitted"),
        `authorization-${id}`,
      );
    }
    if (id === "gaps") {
      setTab("gaps");
      return;
    }
    setTab("continuity");
    const rows =
      id === "expiring"
        ? continuity.rows.filter((r) => r.continuity === "expiring")
        : id === "expired"
          ? continuity.rows.filter((r) => r.continuity === "expired")
          : id === "unknown-dates"
            ? continuity.rows.filter((r) => r.continuity === "unknown_dates")
            : continuity.rows;
    openContinuity(
      "Authorizations",
      "Current authorization snapshot rows behind this number.",
      rows,
      `authorizations-${id}`,
    );
  };

  const continuityColumns: PrimaryTableColumn<ContinuityRow>[] = [
    {
      key: "client",
      label: "Client",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.client}</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {r.authorizationNumber} · {r.code}
          </p>
        </div>
      ),
    },
    { key: "payor", label: "Payor", render: (r) => r.payor },
    { key: "state", label: "State", render: (r) => r.state },
    { key: "start", label: "Start", render: (r) => fmtDate(r.startDate) },
    { key: "end", label: "End", render: (r) => fmtDate(r.endDate) },
    {
      key: "days",
      label: "Days left",
      align: "right",
      render: (r) => (
        <span className="tabular-nums">{r.daysToExpiry == null ? "—" : r.daysToExpiry}</span>
      ),
    },
    {
      key: "authorized",
      label: "Authorized hrs",
      align: "right",
      render: (r) => <span className="tabular-nums">{fmtHours(r.authorizedHours ?? 0)}</span>,
    },
    {
      key: "remaining",
      label: "Remaining hrs",
      align: "right",
      render: (r) => <span className="tabular-nums">{fmtHours(r.remainingHours ?? 0)}</span>,
    },
    {
      key: "coverage",
      label: "Coverage",
      align: "right",
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CONTINUITY_TONE[r.continuity]}`}
        >
          {CONTINUITY_LABEL[r.continuity]}
        </span>
      ),
    },
    {
      key: "renewal",
      label: "Renewal",
      align: "right",
      render: (r) => (
        <span className="text-[10px] text-muted-foreground">{RENEWAL_LABEL[r.renewal]}</span>
      ),
    },
  ];

  const exportView = () => {
    if (tab === "lifecycle") {
      downloadCsv(
        "authorization-lifecycle",
        lifecycle.byKind.map((k) => ({ ...k })),
        [
          { key: "label", label: "Authorization Kind" },
          { key: "submitted", label: "Submitted" },
          { key: "approved", label: "Approved" },
          { key: "denied", label: "Denied" },
          { key: "resubmitted", label: "Resubmitted" },
          { key: "paused", label: "Paused" },
          { key: "approvalRate", label: "Approval %" },
          { key: "denialRate", label: "Denial %" },
        ],
      );
    } else {
      downloadCsv(
        "authorization-continuity",
        projectContinuityRows(continuity.rows),
        CONTINUITY_DRILLDOWN_COLUMNS,
      );
    }
    toast.success("Exported the current authorization view.");
  };

  return (
    <PrimaryReportShell
      title="Authorization Command Center"
      subtitle="Authorization lifecycle, coverage continuity, and the clients whose renewals need confirmation — read live from normalized CentralReach authorization data."
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      onRefresh={data.refresh}
      onExport={exportView}
      exportDisabled={continuity.total === 0 && !lifecycle.hasEvents}
      filters={
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {fmtCount(continuity.total)} authorizations in view
            </Badge>
            {lifecycle.hasEvents && (
              <Badge variant="outline" className="text-[10px]">
                {fmtCount(lifecycle.totalEvents)} logged events
              </Badge>
            )}
            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Link to="/reports/authorization-utilization-hour-based">
                Hour-based utilization <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <PrimaryFilterBar
            filters={filters}
            fields={filterFields}
            onChange={(next) => setFilters(next)}
            onReset={() => setFilters(EMPTY_FILTERS)}
          />
        </>
      }
    >
      <div className="space-y-5">
        <ReportProvenance>
          Coverage, hours, and expiry come from the current authorization snapshot — the latest
          version of each authorization, not a history of edits. Lifecycle outcomes come only from
          logged authorization events; where no event exists, this report says so instead of
          assuming an approval. Renewal readiness is always shown as something to confirm, never as
          a fact.
        </ReportProvenance>

        <KpiScorecards kpis={kpis} onSelect={handleKpi} />

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="h-9">
            <TabsTrigger value="continuity" className="text-xs">
              Coverage &amp; renewals
            </TabsTrigger>
            <TabsTrigger value="lifecycle" className="text-xs">
              Lifecycle
            </TabsTrigger>
            <TabsTrigger value="gaps" className="text-xs">
              Coverage gaps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="continuity" className="mt-3 space-y-4">
            <PrimaryChart
              title="Authorizations by expiry window"
              subtitle="How much of the book needs renewal attention, and when."
              type="bar"
              data={continuity.byWindow.map((w) => ({ label: w.label, value: w.value }))}
              valueLabel="Authorizations"
              onSelect={(label) =>
                openContinuity(
                  `Expiry window · ${label}`,
                  "Authorizations whose end date falls in this window.",
                  continuity.rows.filter(
                    (r) => continuity.byWindow.find((w) => w.key === r.window)?.label === label,
                  ),
                  `authorizations-window-${label.toLowerCase().replace(/\s+/g, "-")}`,
                )
              }
            />
            <PrimaryTable
              title="Authorization coverage"
              subtitle="Current snapshot per authorization. Click a row for the full record and what the status means."
              rows={continuity.rows}
              rowKey={(r) => r.key}
              columns={continuityColumns}
              emptyLabel="No authorizations match these filters."
              onRowClick={(r) =>
                openContinuity(
                  `${r.client} · ${r.authorizationNumber}`,
                  r.note,
                  [r],
                  `authorization-${r.authorizationNumber.toLowerCase()}`,
                )
              }
            />
          </TabsContent>

          <TabsContent value="lifecycle" className="mt-3 space-y-4">
            {!lifecycle.hasEvents ? (
              <ReportInsufficientData
                title="No authorization events have been logged for this range"
                detail="Submission, approval, and denial rates are computed only from logged authorization events. Nothing has been logged for the selected filters, so these rates cannot be calculated — they are not zero. Coverage and expiry on the other tabs are unaffected."
                action={
                  <Button size="sm" variant="outline" onClick={() => setTab("continuity")}>
                    View coverage instead
                  </Button>
                }
              />
            ) : (
              <>
                <PrimaryChart
                  title="Submissions and outcomes by week"
                  subtitle="Logged authorization activity — submissions against approvals."
                  type="line"
                  data={lifecycle.weekly.map((w) => ({
                    label: w.weekStart,
                    value: w.submitted,
                    secondary: w.approved,
                  }))}
                  valueLabel="Submitted"
                  secondaryLabel="Approved"
                  height={280}
                />
                <div className="grid gap-4 lg:grid-cols-2">
                  <PrimaryChart
                    title="Denial reasons"
                    subtitle="Only reasons documented on the event are shown."
                    type="bar"
                    data={lifecycle.denialReasons}
                    valueLabel="Denials"
                  />
                  <PrimaryChart
                    title="Pause reasons"
                    subtitle="Why authorizations were paused, as logged."
                    type="bar"
                    data={lifecycle.pauseReasons}
                    valueLabel="Pauses"
                  />
                </div>
                <PrimaryTable
                  title="Lifecycle by authorization kind"
                  subtitle="Initial, reauthorization, assessment, and amendment activity side by side."
                  rows={lifecycle.byKind}
                  rowKey={(k) => k.kind}
                  columns={[
                    { key: "label", label: "Kind", render: (k) => k.label },
                    {
                      key: "submitted",
                      label: "Submitted",
                      align: "right",
                      render: (k) => <span className="tabular-nums">{fmtCount(k.submitted)}</span>,
                    },
                    {
                      key: "approved",
                      label: "Approved",
                      align: "right",
                      render: (k) => <span className="tabular-nums">{fmtCount(k.approved)}</span>,
                    },
                    {
                      key: "denied",
                      label: "Denied",
                      align: "right",
                      render: (k) => <span className="tabular-nums">{fmtCount(k.denied)}</span>,
                    },
                    {
                      key: "resubmitted",
                      label: "Resubmitted",
                      align: "right",
                      render: (k) => (
                        <span className="tabular-nums">{fmtCount(k.resubmitted)}</span>
                      ),
                    },
                    {
                      key: "approvalRate",
                      label: "Approval %",
                      align: "right",
                      render: (k) => <span className="tabular-nums">{fmtPct(k.approvalRate)}</span>,
                    },
                    {
                      key: "denialRate",
                      label: "Denial %",
                      align: "right",
                      render: (k) => <span className="tabular-nums">{fmtPct(k.denialRate)}</span>,
                    },
                  ]}
                  onRowClick={(k) =>
                    openLifecycle(
                      `Lifecycle · ${k.label}`,
                      "Logged events for this authorization kind.",
                      (e) => classifyLifecycleEvent(e.event_type).kind === k.kind,
                      `authorization-lifecycle-${k.kind}`,
                    )
                  }
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="gaps" className="mt-3">
            <PrimaryTable
              title="Clients with no active authorization today"
              subtitle="Each row needs confirmation before further sessions are scheduled — a missing snapshot row is not proof that coverage lapsed."
              rows={continuity.clientsWithoutCoverage}
              rowKey={(r) => r.client}
              columns={[
                { key: "client", label: "Client", render: (r) => r.client },
                { key: "state", label: "State", render: (r) => r.state },
                { key: "payor", label: "Payor", render: (r) => r.payor },
                {
                  key: "lastEnd",
                  label: "Last coverage end",
                  align: "right",
                  render: (r) => fmtDate(r.lastEnd),
                },
                {
                  key: "note",
                  label: "Next step",
                  render: (r) => (
                    <span className="text-[11px] text-muted-foreground">{r.note}</span>
                  ),
                },
              ]}
              emptyLabel="Every client in view has active authorization coverage today."
            />
          </TabsContent>
        </Tabs>
      </div>

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}
