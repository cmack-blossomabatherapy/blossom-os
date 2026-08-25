/**
 * Cancellation Command Center — staff-facing operational report (Phase 2A).
 *
 * Reads the Phase 1 curated scheduling view (`v_cr_schedule_current`) so every
 * cancellation number comes from the explicit CentralReach cancellation truth
 * columns, with a plain-language provenance line when those columns are absent
 * on older rows.
 *
 * Deliberate product rules:
 * - No upload, file, or export-plumbing UI. This report only reads the curated
 *   CentralReach schedule source.
 * - No revenue or dollar estimates — the scheduling export carries no rate.
 * - Undocumented cancellation reasons are reported as undocumented, never
 *   bucketed into "Other".
 * - All calculations live in pure modules (`scheduleTruth`,
 *   `metrics/cancellationCenter`) so they are unit-testable and consistent.
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { PrimaryReportShell } from "@/components/reports/crPrimary/PrimaryReportShell";
import { KpiScorecards } from "@/components/reports/crPrimary/KpiScorecards";
import { PrimaryChart } from "@/components/reports/crPrimary/PrimaryChart";
import {
  PrimaryFilterBar,
  type FilterFieldConfig,
} from "@/components/reports/crPrimary/PrimaryFilterBar";
import { PrimaryTable, type PrimaryTableColumn } from "@/components/reports/crPrimary/PrimaryTable";
import { DrilldownDrawer } from "@/components/reports/crPrimary/DrilldownDrawer";
import { ReportProvenance } from "@/components/reports/crPrimary/ReportProvenance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportAIButton } from "@/components/ai/ReportAIButton";
import { useCrPrimaryReport } from "@/hooks/useCrPrimaryReport";
import { useUrlFilterState } from "@/hooks/useUrlFilterState";
import { useUrlState } from "@/hooks/useUrlState";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import { optionsFor, applyFilters } from "@/lib/os/reports/crPrimary/filters";
import { EMPTY_FILTERS } from "@/lib/os/reports/crPrimary/types";
import type {
  DrilldownRequest,
  PrimaryReportFilters,
  CrScheduleCurrentRow,
} from "@/lib/os/reports/crPrimary/types";
import { fmtCount, fmtHours, fmtPct, fmtDate } from "@/lib/os/reports/crPrimary/format";
import {
  SCHEDULE_CURRENT_DRILLDOWN_COLUMNS,
  projectScheduleCurrentRows,
} from "@/lib/os/reports/crPrimary/drilldown";
import {
  isCancelledEventStrict,
  isActiveScheduleEvent,
  dayOfWeekLabel,
} from "@/lib/os/reports/crPrimary/scheduleTruth";
import {
  previousWindow,
  withCurrentMonthDefault,
} from "@/lib/os/reports/crPrimary/reportWindow";
import {
  CONVERSION_TIMING_NOTE,
  NOT_DOCUMENTED,
  buildCancellationIdentity,
  cancellationReasonBucket,
  computeCancellationCenter,
  eventCode,
  type CancellationFollowUpEventRow,
  type CancellationFollowUpRow,
  type CancellationGroupRow,
} from "@/lib/os/reports/crPrimary/metrics/cancellationCenter";
import { pushRecent } from "@/lib/os/reportsCatalog";
import {
  saveCancellationReport,
  getCancellationSavedReport,
} from "@/lib/os/cancellationSavedReports";
import { listRemoteFollowups, upsertRemoteFollowup } from "@/lib/os/reportPersistence";

const FILTER_FIELDS = ["state", "client", "provider", "payor", "code", "location"] as const;

const FILTER_LABELS: Record<string, string> = {
  state: "State",
  client: "Client",
  provider: "Provider",
  payor: "Payor",
  code: "Service Code",
  location: "Location",
};

type FollowUpStatus = "todo" | "contacted" | "resolved";

const FOLLOWUP_NEXT: Record<FollowUpStatus, FollowUpStatus> = {
  todo: "contacted",
  contacted: "resolved",
  resolved: "todo",
};

const FOLLOWUP_TONE: Record<FollowUpStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  contacted: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  resolved: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
};

const RISK_TONE: Record<CancellationFollowUpRow["risk"], string> = {
  critical: "bg-destructive/10 text-destructive border border-destructive/30",
  watch: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  monitor: "bg-muted text-muted-foreground",
};

const BREAKDOWNS = [
  { key: "reason", label: "Reason", column: "Cancellation reason" },
  { key: "provider", label: "Provider", column: "Provider" },
  { key: "client", label: "Client", column: "Client" },
  { key: "state", label: "State", column: "State" },
  { key: "payor", label: "Payor", column: "Payor" },
  { key: "code", label: "Service code", column: "Service code" },
] as const;

type BreakdownKey = (typeof BREAKDOWNS)[number]["key"];

/**
 * Filters default to the current calendar month (local dates) so opening the
 * report never scans the whole history, and Reset returns here.
 */
const DEFAULT_FILTERS = withCurrentMonthDefault(EMPTY_FILTERS);

export default function CancellationCommandCenter() {
  const [params] = useSearchParams();
  const savedId = params.get("saved");
  const data = useCrPrimaryReport(["scheduleCurrent"]);
  const [filters, setFilters] = useUrlFilterState<PrimaryReportFilters>(DEFAULT_FILTERS);
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);
  const [tabParam, setTabParam] = useUrlState("tab", "reason");
  const tab = (BREAKDOWNS.some((b) => b.key === tabParam) ? tabParam : "reason") as BreakdownKey;
  const setTab = (next: BreakdownKey) => setTabParam(next);
  const [followUps, setFollowUps] = useState<Record<string, FollowUpStatus>>({});

  useEffect(() => {
    pushRecent("cancellation-command-center");
  }, []);

  // Restore a saved view (filter set) when arriving from Reports home.
  useEffect(() => {
    if (!savedId) return;
    let cancelled = false;
    void (async () => {
      const saved = await getCancellationSavedReport(savedId);
      if (cancelled || !saved) return;
      try {
        const stored = JSON.parse(saved.insights?.[0] ?? "{}") as Partial<PrimaryReportFilters>;
        setFilters({ ...DEFAULT_FILTERS, ...stored });
        toast.success(`Restored view "${saved.name}"`);
      } catch {
        /* saved entry predates filter-only views — nothing to restore */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedId]);

  // Follow-up state follows the operator across devices.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const remote = await listRemoteFollowups("cancellation_command_center");
      if (cancelled || remote.length === 0) return;
      setFollowUps((prev) => {
        const next = { ...prev };
        for (const r of remote) {
          if (r.status === "todo" || r.status === "contacted" || r.status === "resolved") {
            next[r.rowKey] = r.status;
          }
        }
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allRows = data.scheduleCurrent;

  const project = (r: CrScheduleCurrentRow) => ({
    date: r.event_date,
    state: r.state,
    client: r.client_name,
    provider: r.provider_name,
    payor: r.payor,
    code: eventCode(r),
    location: r.location,
    status: r.status,
  });

  const rows = useMemo(() => applyFilters(allRows, filters, project), [allRows, filters]);

  const previousRows = useMemo(() => {
    const window = previousWindow({ from: filters.from, to: filters.to });
    if (!window) return undefined;
    return applyFilters(allRows, { ...filters, ...window }, project);
  }, [allRows, filters]);

  /**
   * Identity is resolved CR-ID first over the FULL schedule snapshot, not just
   * the filtered rows, so grouping never changes when a filter narrows the view
   * and two people who share a name are never merged.
   */
  const identity = useMemo(() => buildCancellationIdentity(allRows), [allRows]);

  const metrics = useMemo(
    () => computeCancellationCenter(rows, { previous: previousRows, identity }),
    [rows, previousRows, identity],
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () =>
      FILTER_FIELDS.map((key) => ({
        key,
        label: FILTER_LABELS[key] ?? key,
        options: optionsFor(allRows, (r) =>
          key === "client"
            ? r.client_name
            : key === "provider"
              ? r.provider_name
              : key === "code"
                ? eventCode(r)
                : (r[key as "state" | "payor" | "location"] as string | null),
        ),
      })),
    [allRows],
  );

  const cancelledRows = useMemo(
    () => rows.filter((r) => isActiveScheduleEvent(r) && isCancelledEventStrict(r)),
    [rows],
  );

  const comparisonHint = metrics.comparison
    ? metrics.comparison.rateDelta == null
      ? "No comparable prior period"
      : `${metrics.comparison.rateDelta > 0 ? "▲" : metrics.comparison.rateDelta < 0 ? "▼" : "="} ${fmtPct(
          Math.abs(metrics.comparison.rateDelta),
        )} vs prior period`
    : "Select a date range to compare periods";

  const kpis = useMemo(
    () => [
      {
        id: "cancellation-rate",
        label: "Cancellation rate",
        value: fmtPct(metrics.cancellationRate),
        hint: `${fmtCount(metrics.cancelledEvents)} of ${fmtCount(metrics.activeScheduleEvents)} active schedule events · ${comparisonHint}`,
        tone:
          metrics.cancellationRate == null
            ? ("neutral" as const)
            : metrics.cancellationRate >= 20
              ? ("bad" as const)
              : metrics.cancellationRate >= 12
                ? ("warn" as const)
                : ("good" as const),
      },
      {
        id: "active-schedule-events",
        label: "Active schedule events",
        value: fmtCount(metrics.activeScheduleEvents),
        hint: "Every nondeleted event in range — the cancellation-rate denominator",
      },
      {
        id: "cancellations",
        label: "Cancelled sessions",
        value: fmtCount(metrics.cancelledEvents),
        hint: metrics.topReason ? `Top reason: ${metrics.topReason}` : "No cancellations in range",
      },
      {
        id: "cancelled-hours",
        label: "Cancelled hours",
        value: fmtHours(metrics.cancelledHours),
        hint: "Scheduled hours that were not delivered",
        tone: metrics.cancelledHours > 0 ? ("warn" as const) : ("neutral" as const),
      },
      {
        id: "kept-events",
        label: "Kept sessions",
        value: fmtCount(metrics.keptEvents),
        hint: `${fmtHours(metrics.keptHours)} hrs retained`,
        tone: "good" as const,
      },
      {
        id: "no-shows",
        label: "No-shows",
        value: fmtCount(metrics.noShowEvents),
        hint: "Cancellations recorded as a no-show",
        tone: metrics.noShowEvents > 0 ? ("bad" as const) : ("good" as const),
      },
      {
        id: "clients",
        label: "Clients affected",
        value: fmtCount(metrics.affectedClients),
        hint: `${fmtCount(metrics.affectedProviders)} providers impacted`,
      },
      {
        id: "undocumented",
        label: "Undocumented reasons",
        value: fmtCount(metrics.undocumentedReasons),
        hint:
          metrics.documentedPct != null
            ? `${fmtPct(metrics.documentedPct)} of cancellations have a reason`
            : "No cancellations to document",
        tone: metrics.undocumentedReasons > 0 ? ("warn" as const) : ("good" as const),
      },
      {
        id: "follow-ups",
        label: "Clients to follow up",
        value: fmtCount(metrics.followUps.length),
        hint: "2+ cancellations in the selected range",
        tone: metrics.followUps.length > 0 ? ("warn" as const) : ("good" as const),
      },
      {
        id: "conversion-rate",
        label: "Timesheet conversion",
        value: fmtPct(metrics.conversion.conversionRate),
        hint: `${fmtCount(metrics.conversion.converted)} converted of ${fmtCount(metrics.conversion.knownStates)} events with a reported state · ${fmtCount(metrics.conversion.unknown)} not reported`,
        tone:
          metrics.conversion.conversionRate == null
            ? ("neutral" as const)
            : metrics.conversion.conversionRate >= 95
              ? ("good" as const)
              : metrics.conversion.conversionRate >= 85
                ? ("warn" as const)
                : ("bad" as const),
      },
      {
        id: "not-converted",
        label: "Not converted",
        value: fmtCount(metrics.conversion.unconverted),
        hint: "Active events the source reports as not converted to a timesheet",
        tone: metrics.conversion.unconverted > 0 ? ("warn" as const) : ("good" as const),
      },
      {
        id: "conversion-unknown",
        label: "Conversion not reported",
        value: fmtCount(metrics.conversion.unknown),
        hint: "No conversion flag on the source event — excluded from the rate",
        tone: metrics.conversion.unknown > 0 ? ("warn" as const) : ("good" as const),
      },
    ],
    [metrics, comparisonHint],
  );

  const openDrilldown = (
    title: string,
    subtitle: string,
    sourceRows: CrScheduleCurrentRow[],
    exportName: string,
    chips?: { label: string; value: string }[],
  ) => {
    setDrilldown({
      title,
      subtitle,
      filters: chips,
      rows: projectScheduleCurrentRows(sourceRows, cancellationReasonBucket),
      columns: SCHEDULE_CURRENT_DRILLDOWN_COLUMNS,
      exportName,
    });
  };

  const handleKpi = (id: string) => {
    if (id === "kept-events") {
      return openDrilldown(
        "Kept sessions",
        "Scheduled events that were neither cancelled nor deleted in CentralReach.",
        rows.filter((r) => isActiveScheduleEvent(r) && !isCancelledEventStrict(r)),
        "kept-sessions",
      );
    }
    if (id === "no-shows") {
      return openDrilldown(
        "No-show cancellations",
        "Cancellations recorded as a no-show in status, attendance, or reason text.",
        cancelledRows.filter((r) =>
          /no[\s-]?show|did not attend|dna\b/i.test(
            `${r.attendance ?? ""} ${r.status ?? ""} ${r.cancellation_reason ?? ""}`,
          ),
        ),
        "no-shows",
      );
    }
    if (id === "not-converted") {
      return openDrilldown(
        "Active events not converted to a timesheet",
        "The source reports these nondeleted events as not converted. Conversion timing is not available from this source, so this is a state, not a lateness measure.",
        rows.filter((r) => isActiveScheduleEvent(r) && r.converted_to_timesheet === false),
        "events-not-converted",
      );
    }
    if (id === "conversion-unknown") {
      return openDrilldown(
        "Active events with no reported conversion state",
        "The source carries no conversion flag for these events, so they are excluded from the conversion rate rather than counted as unconverted.",
        rows.filter((r) => isActiveScheduleEvent(r) && r.converted_to_timesheet == null),
        "events-conversion-not-reported",
      );
    }
    if (id === "conversion-rate") {
      return openDrilldown(
        "Active events converted to a timesheet",
        "Converted ÷ (converted + not converted). Events with no reported state are excluded from the denominator.",
        rows.filter((r) => isActiveScheduleEvent(r) && r.converted_to_timesheet === true),
        "events-converted",
      );
    }
    if (id === "undocumented") {
      return openDrilldown(
        "Cancellations without a documented reason",
        "These cancellations have no usable reason text in CentralReach — the documentation gap is the action.",
        cancelledRows.filter((r) => cancellationReasonBucket(r) === NOT_DOCUMENTED),
        "cancellations-undocumented",
      );
    }
    return openDrilldown(
      "Cancelled sessions",
      "Every cancelled CentralReach schedule event in the current filters.",
      cancelledRows,
      "cancellations",
    );
  };

  /** Drilldown for one ISO week label, shared by all three weekly series. */
  const openWeek = (label: string) =>
    openDrilldown(
      `Week of ${fmtDate(label)}`,
      "Cancellations recorded in this week.",
      cancelledRows.filter((r) => {
        const date = String(r.event_date ?? "").slice(0, 10);
        if (!date) return false;
        const start = new Date(`${label}T00:00:00Z`);
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 7);
        const dt = new Date(`${date}T00:00:00Z`);
        return dt >= start && dt < end;
      }),
      `cancellations-week-${label}`,
      [{ label: "Week", value: label }],
    );

  /** Drilldown for one weekday label, shared by the count and rate series. */
  const openWeekday = (label: string) =>
    openDrilldown(
      `${label} cancellations`,
      "Cancellations that fell on this weekday.",
      cancelledRows.filter((r) => dayOfWeekLabel(r.event_date) === label),
      `cancellations-${label.toLowerCase()}`,
      [{ label: "Weekday", value: label }],
    );

  const groupsFor = (key: BreakdownKey): CancellationGroupRow[] =>
    key === "reason"
      ? metrics.byReason
      : key === "provider"
        ? metrics.byProvider
        : key === "client"
          ? metrics.byClient
          : key === "state"
            ? metrics.byState
            : key === "payor"
              ? metrics.byPayor
              : metrics.byCode;

  /**
   * The grouping value for a source row. Clients and providers use the resolved
   * CR-ID-first identity key, so a drilldown for one person never picks up a
   * different person who happens to share their name.
   */
  const groupValue = (row: CrScheduleCurrentRow, key: BreakdownKey): string =>
    key === "reason"
      ? cancellationReasonBucket(row)
      : key === "provider"
        ? identity.providerKeyOf(row)
        : key === "client"
          ? identity.clientKeyOf(row)
          : key === "state"
            ? (row.state ?? "").trim() || "Unknown"
            : key === "payor"
              ? (row.payor ?? "").trim() || "Unknown"
              : eventCode(row);

  const followUpKey = (key: string, name: string) => `${key}:${name}`;

  const cycleFollowUp = (key: string, name: string) => {
    const rowKey = followUpKey(key, name);
    const status = FOLLOWUP_NEXT[followUps[rowKey] ?? "todo"];
    setFollowUps((prev) => ({ ...prev, [rowKey]: status }));
    void (async () => {
      try {
        await upsertRemoteFollowup("cancellation_command_center", rowKey, status);
      } catch (err) {
        console.warn("[CancellationCommandCenter] remote follow-up sync failed", err);
        toast.warning("Follow-up updated locally — cloud sync failed.");
      }
    })();
  };

  const breakdownColumns = (key: BreakdownKey): PrimaryTableColumn<CancellationGroupRow>[] => [
    {
      key: "label",
      label: BREAKDOWNS.find((b) => b.key === key)!.column,
      render: (g) => <span className="font-medium">{g.name}</span>,
    },
    {
      key: "cancellations",
      label: "Cancellations",
      align: "right",
      render: (g) => <span className="tabular-nums">{fmtCount(g.cancellations)}</span>,
    },
    {
      key: "cancelledHours",
      label: "Cancelled hrs",
      align: "right",
      render: (g) => <span className="tabular-nums">{fmtHours(g.cancelledHours)}</span>,
    },
    {
      key: "rate",
      label: "Own cancel rate",
      align: "right",
      render: (g) => <span className="tabular-nums">{fmtPct(g.cancellationRate)}</span>,
    },
    {
      key: "share",
      label: "Share of cancellations",
      align: "right",
      render: (g) => <span className="tabular-nums">{fmtPct(g.share)}</span>,
    },
    {
      key: "clients",
      label: "Clients",
      align: "right",
      render: (g) => <span className="tabular-nums">{fmtCount(g.clients)}</span>,
    },
  ];

  const followUpColumns: PrimaryTableColumn<CancellationFollowUpRow>[] = [
    {
      key: "client",
      label: "Client",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.client}</p>
          <p className="truncate text-[10px] text-muted-foreground">{r.reason}</p>
        </div>
      ),
    },
    { key: "provider", label: "Provider", render: (r) => r.provider },
    { key: "state", label: "State", render: (r) => r.state },
    {
      key: "cancellations",
      label: "Cancellations",
      align: "right",
      render: (r) => <span className="tabular-nums">{fmtCount(r.cancellations)}</span>,
    },
    {
      key: "rate",
      label: "Cancel rate",
      align: "right",
      render: (r) => <span className="tabular-nums">{fmtPct(r.cancellationRate)}</span>,
    },
    {
      key: "hours",
      label: "Cancelled hrs",
      align: "right",
      render: (r) => <span className="tabular-nums">{fmtHours(r.cancelledHours)}</span>,
    },
    {
      key: "weeks",
      label: "Weeks affected",
      align: "right",
      render: (r) => <span className="tabular-nums">{fmtCount(r.weeksAffected)}</span>,
    },
    {
      key: "last",
      label: "Last cancellation",
      align: "right",
      render: (r) => fmtDate(r.lastCancellation),
    },
    {
      key: "risk",
      label: "Risk",
      align: "right",
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${RISK_TONE[r.risk]}`}
        >
          {r.risk}
        </span>
      ),
    },
    {
      key: "followUp",
      label: "Follow-up",
      align: "right",
      render: (r) => {
        const status = followUps[followUpKey("client", r.client)] ?? "todo";
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cycleFollowUp("client", r.client);
            }}
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${FOLLOWUP_TONE[status]}`}
          >
            {status}
          </button>
        );
      },
    },
  ];

  const followUpEventColumns: PrimaryTableColumn<CancellationFollowUpEventRow>[] = [
    {
      key: "eventDate",
      label: "Event date",
      render: (r) => <span className="tabular-nums">{fmtDate(r.eventDate)}</span>,
    },
    {
      key: "client",
      label: "Client",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.client}</p>
          <p className="truncate text-[10px] text-muted-foreground">{r.provider}</p>
        </div>
      ),
    },
    {
      key: "hours",
      label: "Cancelled hrs",
      align: "right",
      render: (r) => <span className="tabular-nums">{fmtHours(r.cancelledHours)}</span>,
    },
    {
      key: "reason",
      label: "Reason",
      render: (r) => (
        <span className={r.reasonDocumented ? "" : "text-amber-600"}>{r.reason}</span>
      ),
    },
    { key: "conversion", label: "Conversion", render: (r) => r.conversionState },
    { key: "state", label: "State", render: (r) => r.state },
    { key: "payor", label: "Payor", render: (r) => r.payor },
    { key: "code", label: "Service code", render: (r) => r.code },
    {
      key: "followUpStatus",
      label: "Follow-up",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.followUpStatus}</p>
          <p className="truncate text-[10px] text-muted-foreground">{r.action}</p>
        </div>
      ),
    },
    {
      key: "action",
      label: "Status",
      align: "right",
      render: (r) => {
        const status = followUps[followUpKey("event", r.key)] ?? "todo";
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cycleFollowUp("event", r.key);
            }}
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${FOLLOWUP_TONE[status]}`}
          >
            {status}
          </button>
        );
      },
    },
  ];

  const exportView = () => {
    downloadCsv(
      "cancellation-command-center",
      projectScheduleCurrentRows(cancelledRows, cancellationReasonBucket),
      SCHEDULE_CURRENT_DRILLDOWN_COLUMNS,
    );
    toast.success("Exported the current cancellation view.");
  };

  const saveView = async () => {
    const name = window.prompt(
      "Name this view",
      `Cancellations · ${fmtDate(new Date().toISOString())}`,
    );
    if (!name) return;
    const saved = await saveCancellationReport({
      name,
      scheduleFileName: "CentralReach schedule source",
      authFileNames: [],
      scheduleRaws: [],
      billingRaws: [],
      authRecords: [],
      insights: [JSON.stringify(filters)],
    });
    if (saved.remoteSyncError) {
      toast.warning(
        "View saved on this device, but cloud sync failed, so it may not appear on other devices yet.",
      );
      return;
    }
    toast.success(`Saved view "${saved.name}"`);
  };

  return (
    <PrimaryReportShell
      title="Cancellation Command Center"
      subtitle="Cancelled sessions from CentralReach scheduling — rate, lost hours, leading reasons, and the clients who need a follow-up call."
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      onRefresh={data.refresh}
      onExport={exportView}
      exportDisabled={cancelledRows.length === 0}
      filters={
        <>
          <div className="flex flex-wrap items-center gap-2">
            <ReportAIButton
              preset="cancellation"
              contextExtra={`Filters: ${JSON.stringify(filters)}. Cancellation rate ${fmtPct(
                metrics.cancellationRate,
              )}, ${fmtCount(metrics.cancelledEvents)} cancellations, ${fmtHours(
                metrics.cancelledHours,
              )} cancelled hours, ${metrics.undocumentedReasons} undocumented reasons.`}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => void saveView()}
            >
              <Save className="h-3.5 w-3.5" /> Save view
            </Button>
            <Badge variant="secondary" className="text-[10px]">
              {fmtCount(metrics.activeScheduleEvents)} active schedule events in view
            </Badge>
            {metrics.deletedEvents > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {fmtCount(metrics.deletedEvents)} deleted events excluded
              </Badge>
            )}
          </div>
          <PrimaryFilterBar
            filters={filters}
            fields={filterFields}
            onChange={(next) => setFilters(next)}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
        </>
      }
    >
      <div className="space-y-5">
        <ReportProvenance tone={metrics.truth.mode === "explicit" ? "info" : "warn"}>
          {metrics.truth.label} Deleted events are excluded from every count, and every nondeleted
          event in range — cancellations included — is the cancellation-rate denominator. Clients and
          providers are grouped by CentralReach id first, so two people who share a name stay
          separate. Hours come from the scheduled duration on each event, and this report shows no
          revenue estimates because the scheduling data carries no rate. {CONVERSION_TIMING_NOTE}
        </ReportProvenance>

        <KpiScorecards kpis={kpis} onSelect={handleKpi} />

        <div className="grid gap-4 lg:grid-cols-2">
          <PrimaryChart
            title="Timesheet conversion of active events"
            subtitle="Counts only — converted, not converted, and events with no reported state."
            type="bar"
            data={[
              { label: "Converted", value: metrics.conversion.converted },
              { label: "Not converted", value: metrics.conversion.unconverted },
              { label: "Not reported", value: metrics.conversion.unknown },
            ].filter((d) => d.value > 0)}
            valueLabel="Active schedule events"
            onSelect={(label) =>
              openDrilldown(
                `Conversion · ${label}`,
                "Active nondeleted events in this conversion state.",
                rows.filter(
                  (r) =>
                    isActiveScheduleEvent(r) &&
                    (label === "Converted"
                      ? r.converted_to_timesheet === true
                      : label === "Not converted"
                        ? r.converted_to_timesheet === false
                        : r.converted_to_timesheet == null),
                ),
                `events-conversion-${label.toLowerCase().replace(/\s+/g, "-")}`,
                [{ label: "Conversion", value: label }],
              )
            }
            height={240}
          />
          <div className="rounded-xl border border-border/60 bg-card/40 p-4">
            <p className="text-xs font-semibold">Conversion, stated honestly</p>
            <dl className="mt-3 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Converted to timesheet</dt>
                <dd className="tabular-nums font-medium">{fmtCount(metrics.conversion.converted)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Not converted</dt>
                <dd className="tabular-nums font-medium">
                  {fmtCount(metrics.conversion.unconverted)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">
                  Not reported (excluded from the rate)
                </dt>
                <dd className="tabular-nums font-medium">{fmtCount(metrics.conversion.unknown)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-1.5">
                <dt className="font-medium">
                  Conversion rate · {fmtCount(metrics.conversion.knownStates)} known states
                </dt>
                <dd className="tabular-nums font-semibold">
                  {fmtPct(metrics.conversion.conversionRate)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[10px] leading-snug text-muted-foreground">
              {CONVERSION_TIMING_NOTE}
            </p>
          </div>
        </div>

        {/*
          Three separate weekly series. Counts, hours and percentages never share
          an axis, and a week with no active events has no rate point at all
          rather than a misleading 0%.
        */}
        <div className="grid gap-4 lg:grid-cols-2">
          <PrimaryChart
            title="Cancelled sessions by week"
            subtitle="Counts only — cancelled sessions per ISO week."
            type="line"
            data={metrics.weeklyCancellations}
            valueLabel="Cancelled sessions"
            onSelect={(label) => openWeek(label)}
            height={260}
          />
          <PrimaryChart
            title="Cancelled hours by week"
            subtitle="Hours only — the scheduled hours lost in each ISO week."
            type="line"
            data={metrics.weeklyCancelledHours}
            valueLabel="Cancelled hours"
            onSelect={(label) => openWeek(label)}
            height={260}
          />
        </div>

        <PrimaryChart
          title="Cancellation rate by week"
          subtitle="Percent only — each week's cancellations divided by that week's active nondeleted events. Weeks with no active events are omitted rather than drawn as 0%."
          type="line"
          data={metrics.weeklyCancellationRate
            .filter((p) => p.value != null)
            .map((p) => ({ label: p.label, value: p.value as number }))}
          valueLabel="Cancel rate %"
          onSelect={(label) => openWeek(label)}
          height={240}
        />


        <div className="grid gap-4 lg:grid-cols-2">
          <PrimaryChart
            title="Cancelled sessions by weekday"
            subtitle="Counts only — where in the week sessions are lost."
            type="bar"
            data={metrics.byDayOfWeek}
            valueLabel="Cancelled sessions"
            onSelect={(label) => openWeekday(label)}
          />
          <PrimaryChart
            title="Cancellation rate by weekday"
            subtitle="Percent only — that weekday's cancellations over its active nondeleted events. Weekdays with no active events are omitted."
            type="bar"
            data={metrics.byDayOfWeekRate
              .filter((p) => p.value != null)
              .map((p) => ({ label: p.label, value: p.value as number }))}
            valueLabel="Cancel rate %"
            onSelect={(label) => openWeekday(label)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <PrimaryChart
            title="Cancellations by reason"
            subtitle="Counts only — the reason table below carries cancellations, rate and hours in separate columns."
            type="bar"
            data={metrics.byReason.slice(0, 8).map((g) => ({
              label: g.name,
              value: g.cancellations,
            }))}
            valueLabel="Cancellations"
            onSelect={(label) =>
              openDrilldown(
                `Reason · ${label}`,
                "Cancellations mapped to this reason bucket.",
                cancelledRows.filter((r) => cancellationReasonBucket(r) === label),
                `cancellations-reason-${label.toLowerCase().replace(/\s+/g, "-")}`,
                [{ label: "Reason", value: label }],
              )
            }
          />
        </div>

        <PrimaryTable
          title="Follow-up queue"
          subtitle="Clients with repeat cancellations in the selected range, ranked by operational impact. Click a row for the source sessions."
          rows={metrics.followUps}
          rowKey={(r) => r.key}
          columns={followUpColumns}
          emptyLabel="No client has more than one cancellation in this range."
          onRowClick={(r) =>
            openDrilldown(
              `Client · ${r.client}`,
              "Every cancelled session for this client in the current filters.",
              cancelledRows.filter((row) => identity.clientKeyOf(row) === r.key),
              `cancellations-client-${r.client.toLowerCase().replace(/\s+/g, "-")}`,
              [{ label: "Client", value: r.client }],
            )
          }
        />

        <PrimaryTable
          title="Cancellation follow-up queue"
          subtitle="Every cancelled source event in the current filters, with the reason, conversion state, and the action staff should take."
          rows={metrics.followUpEvents}
          rowKey={(r) => r.key}
          columns={followUpEventColumns}
          emptyLabel="No cancelled events in this range."
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
                title={`Cancellations by ${b.label.toLowerCase()}`}
                subtitle="Click a row to open the exact CentralReach source events behind it."
                rows={groupsFor(b.key)}
                rowKey={(g) => g.key}
                columns={breakdownColumns(b.key)}
                onRowClick={(g) =>
                  openDrilldown(
                    `${b.label} · ${g.name}`,
                    "Cancelled CentralReach events behind this row.",
                    cancelledRows.filter((r) => groupValue(r, b.key) === g.key),
                    `cancellations-${b.key}-${g.name.toLowerCase().replace(/\s+/g, "-")}`,
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
