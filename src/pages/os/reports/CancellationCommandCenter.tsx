/**
 * Cancellation Command Center — staff-facing operational report.
 *
 * Reads normalized CentralReach scheduling data straight from the
 * CentralReach Data Hub (`cr_schedule_events`). There are intentionally NO
 * upload controls, requirement checklists, or export-file language on this
 * page: CentralReach files are ingested once in the Data Hub and every report
 * updates automatically.
 *
 * Layout mirrors BCBA Productivity Report V3: KPI scorecards → primary trend
 * visual → supporting visual → actionable breakdown tabs → source-row
 * drilldown, with URL-backed filters so a view survives tab switches, reloads
 * and shared links.
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { PrimaryReportShell } from "@/components/reports/crPrimary/PrimaryReportShell";
import { KpiScorecards } from "@/components/reports/crPrimary/KpiScorecards";
import { PrimaryChart } from "@/components/reports/crPrimary/PrimaryChart";
import { PrimaryFilterBar, type FilterFieldConfig } from "@/components/reports/crPrimary/PrimaryFilterBar";
import { PrimaryTable, type PrimaryTableColumn } from "@/components/reports/crPrimary/PrimaryTable";
import { DrilldownDrawer } from "@/components/reports/crPrimary/DrilldownDrawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportAIButton } from "@/components/ai/ReportAIButton";
import { useCrPrimaryReport } from "@/hooks/useCrPrimaryReport";
import { useUrlFilterState } from "@/hooks/useUrlFilterState";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import { optionsFor, applyFilters } from "@/lib/os/reports/crPrimary/filters";
import { EMPTY_FILTERS } from "@/lib/os/reports/crPrimary/types";
import type { DrilldownRequest, PrimaryReportFilters, CrScheduleEventRow } from "@/lib/os/reports/crPrimary/types";
import { fmtCount, fmtHours, fmtPct, fmtDate } from "@/lib/os/reports/crPrimary/format";
import {
  SCHEDULE_DRILLDOWN_COLUMNS,
  projectScheduleRows,
} from "@/lib/os/reports/crPrimary/drilldown";
import {
  computeCancellationMetrics,
  isCancelledEvent,
  normalizeCancellationReason,
  type CancellationGroup,
} from "@/lib/os/reports/crPrimary/metrics/cancellation";
import { pushRecent } from "@/lib/os/reportsCatalog";
import {
  saveCancellationReport,
  getCancellationSavedReport,
} from "@/lib/os/cancellationSavedReports";
import {
  listRemoteFollowups,
  upsertRemoteFollowup,
} from "@/lib/os/reportPersistence";

const FILTER_FIELDS: FilterFieldConfig["key"][] = [
  "state",
  "client",
  "provider",
  "payor",
  "code",
  "location",
  "status",
];

const FILTER_LABELS: Record<string, string> = {
  state: "State",
  client: "Client",
  provider: "Provider",
  payor: "Payor",
  code: "Code",
  location: "Location",
  status: "Status",
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

const BREAKDOWNS = [
  { key: "reason", label: "Reason", column: "Cancellation Reason" },
  { key: "provider", label: "Provider", column: "Provider" },
  { key: "client", label: "Client", column: "Client" },
  { key: "state", label: "State", column: "State" },
  { key: "payor", label: "Payor", column: "Payor" },
] as const;

type BreakdownKey = (typeof BREAKDOWNS)[number]["key"];

export default function CancellationCommandCenter() {
  const [params] = useSearchParams();
  const savedId = params.get("saved");
  const data = useCrPrimaryReport(["schedule"]);
  const [filters, setFilters] = useUrlFilterState<PrimaryReportFilters>(EMPTY_FILTERS);
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);
  const [tab, setTab] = useState<BreakdownKey>("reason");
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
        setFilters({ ...EMPTY_FILTERS, ...stored });
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

  const allRows = data.schedule;

  const rows = useMemo(
    () =>
      applyFilters(allRows, filters, (r) => ({
        date: r.event_date,
        state: r.state,
        client: r.client_name,
        provider: r.provider_name,
        payor: r.payor,
        code: r.procedure_code,
        location: r.location,
        status: r.status,
      })),
    [allRows, filters],
  );

  const metrics = useMemo(() => computeCancellationMetrics(rows), [rows]);

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
                ? r.procedure_code
                : (r[key as "state" | "payor" | "location" | "status"] as string | null),
        ),
      })),
    [allRows],
  );

  const kpis = useMemo(
    () => [
      {
        id: "cancellation-rate",
        label: "Cancellation rate",
        value: fmtPct(metrics.cancellationRate),
        hint: `${fmtCount(metrics.totalCancellations)} of ${fmtCount(metrics.scheduledSessions)} scheduled`,
        tone:
          metrics.cancellationRate != null && metrics.cancellationRate >= 20
            ? ("bad" as const)
            : metrics.cancellationRate != null && metrics.cancellationRate >= 12
              ? ("warn" as const)
              : ("good" as const),
      },
      {
        id: "cancellations",
        label: "Cancelled sessions",
        value: fmtCount(metrics.totalCancellations),
        hint: metrics.topReason ? `Top reason: ${metrics.topReason}` : "No cancellations in range",
      },
      {
        id: "lost-hours",
        label: "Lost hours",
        value: fmtHours(metrics.lostHours),
        hint: "Scheduled hours never delivered",
        tone: metrics.lostHours > 0 ? ("warn" as const) : ("neutral" as const),
      },
      {
        id: "clients",
        label: "Clients affected",
        value: fmtCount(metrics.affectedClients),
        hint: "Distinct clients with a cancellation",
      },
      {
        id: "providers",
        label: "Providers affected",
        value: fmtCount(metrics.affectedProviders),
        hint: "Distinct BCBAs / RBTs impacted",
      },
      {
        id: "top-reason",
        label: "Leading reason",
        value: metrics.topReason ?? "—",
        hint: metrics.byReason[0]
          ? `${fmtCount(metrics.byReason[0].cancellations)} sessions · ${fmtHours(metrics.byReason[0].lostHours)} hrs`
          : undefined,
      },
    ],
    [metrics],
  );

  const cancelledRows = useMemo(() => rows.filter(isCancelledEvent), [rows]);

  const openDrilldown = (
    title: string,
    subtitle: string,
    sourceRows: CrScheduleEventRow[],
    exportName: string,
  ) => {
    setDrilldown({
      title,
      subtitle,
      rows: projectScheduleRows(sourceRows, (r) =>
        normalizeCancellationReason(r.cancellation_reason, r.cancelled_by),
      ),
      columns: SCHEDULE_DRILLDOWN_COLUMNS,
      exportName,
    });
  };

  const handleKpi = (id: string) => {
    if (id === "cancellation-rate" || id === "cancellations" || id === "lost-hours") {
      openDrilldown(
        "Cancelled sessions",
        "Every cancelled or no-show CentralReach schedule event in the current filters.",
        cancelledRows,
        "cancellations",
      );
      return;
    }
    if (id === "top-reason" && metrics.topReason) {
      const reason = metrics.topReason;
      openDrilldown(
        `Reason · ${reason}`,
        "Cancellations mapped to this reason bucket.",
        cancelledRows.filter(
          (r) => normalizeCancellationReason(r.cancellation_reason, r.cancelled_by) === reason,
        ),
        `cancellations-${reason.toLowerCase().replace(/\s+/g, "-")}`,
      );
      return;
    }
    openDrilldown(
      "Cancelled sessions",
      "Source rows behind this metric.",
      cancelledRows,
      "cancellations",
    );
  };

  const groupsFor = (key: BreakdownKey): CancellationGroup[] =>
    key === "reason"
      ? metrics.byReason
      : key === "provider"
        ? metrics.byProvider
        : key === "client"
          ? metrics.byClient
          : key === "state"
            ? metrics.byState
            : metrics.byPayor;

  const matchesGroup = (row: CrScheduleEventRow, key: BreakdownKey, name: string) => {
    const val =
      key === "reason"
        ? normalizeCancellationReason(row.cancellation_reason, row.cancelled_by)
        : key === "provider"
          ? (row.provider_name ?? "").trim() || "Unknown provider"
          : key === "client"
            ? (row.client_name ?? "").trim() || "Unknown client"
            : key === "state"
              ? (row.state ?? "").trim() || "Unknown"
              : (row.payor ?? "").trim() || "Unknown";
    return val === name;
  };

  const followUpKey = (key: BreakdownKey, name: string) => `${key}:${name}`;

  const cycleFollowUp = (key: BreakdownKey, name: string) => {
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

  const columnsFor = (key: BreakdownKey): PrimaryTableColumn<CancellationGroup>[] => [
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
      key: "lostHours",
      label: "Lost hours",
      align: "right",
      render: (g) => <span className="tabular-nums">{fmtHours(g.lostHours)}</span>,
    },
    {
      key: "clients",
      label: "Clients",
      align: "right",
      render: (g) => <span className="tabular-nums">{fmtCount(g.clients)}</span>,
    },
    {
      key: "share",
      label: "Share of cancellations",
      align: "right",
      render: (g) => (
        <span className="tabular-nums">
          {fmtPct(metrics.totalCancellations ? (g.cancellations / metrics.totalCancellations) * 100 : null)}
        </span>
      ),
    },
    {
      key: "followUp",
      label: "Follow-up",
      align: "right",
      render: (g) => {
        const status = followUps[followUpKey(key, g.name)] ?? "todo";
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cycleFollowUp(key, g.name);
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
    const projected = projectScheduleRows(cancelledRows, (r) =>
      normalizeCancellationReason(r.cancellation_reason, r.cancelled_by),
    );
    downloadCsv("cancellation-command-center", projected, SCHEDULE_DRILLDOWN_COLUMNS);
    toast.success("Exported the current cancellation view.");
  };

  const saveView = async () => {
    const name = window.prompt("Name this view", `Cancellations · ${fmtDate(new Date().toISOString())}`);
    if (!name) return;
    const saved = await saveCancellationReport({
      name,
      scheduleFileName: "CentralReach Data Hub",
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

  const trend = metrics.trend.map((t) => ({
    label: t.label,
    value: t.value,
    secondary: t.secondary,
  }));

  return (
    <PrimaryReportShell
      title="Cancellation Command Center"
      subtitle="Cancelled and no-show sessions from CentralReach scheduling — lost hours, leading reasons, and the clients and providers that need follow-up."
      requiredExports={["Schedule / Appointments export"]}
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
              )}, ${fmtCount(metrics.totalCancellations)} cancellations, ${fmtHours(
                metrics.lostHours,
              )} lost hours.`}
            />
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => void saveView()}>
              <Save className="h-3.5 w-3.5" /> Save view
            </Button>
            <Badge variant="secondary" className="text-[10px]">
              {fmtCount(rows.length)} scheduled events in view
            </Badge>
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
        <KpiScorecards kpis={kpis} onSelect={handleKpi} />

        <PrimaryChart
          title="Cancellations by week"
          subtitle="Cancelled sessions per ISO week, with lost hours as the secondary series."
          type="line"
          data={trend}
          valueLabel="Cancelled sessions"
          secondaryLabel="Lost hours"
          onSelect={(label) =>
            openDrilldown(
              `Week of ${fmtDate(label)}`,
              "Cancellations recorded in this week.",
              cancelledRows.filter((r) => {
                const wk = trend.find((t) => t.label === label)?.label;
                if (!wk) return false;
                const d = (r.event_date ?? "").slice(0, 10);
                if (!d) return false;
                const start = new Date(`${wk}T00:00:00Z`);
                const end = new Date(start);
                end.setUTCDate(end.getUTCDate() + 7);
                const dt = new Date(`${d}T00:00:00Z`);
                return dt >= start && dt < end;
              }),
              `cancellations-week-${label}`,
            )
          }
          height={280}
        />

        <PrimaryChart
          title="Lost hours by reason"
          subtitle="Where the delivered-hours gap is actually coming from."
          type="bar"
          data={metrics.byReason.slice(0, 8).map((g) => ({
            label: g.name,
            value: g.lostHours,
            secondary: g.cancellations,
          }))}
          valueLabel="Lost hours"
          secondaryLabel="Cancellations"
          onSelect={(label) =>
            openDrilldown(
              `Reason · ${label}`,
              "Cancellations mapped to this reason bucket.",
              cancelledRows.filter((r) => matchesGroup(r, "reason", label)),
              `cancellations-${label.toLowerCase().replace(/\s+/g, "-")}`,
            )
          }
        />

        <Tabs value={tab} onValueChange={(v) => setTab(v as BreakdownKey)}>
          <TabsList>
            {BREAKDOWNS.map((b) => (
              <TabsTrigger key={b.key} value={b.key} className="text-xs">
                {b.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {BREAKDOWNS.map((b) => (
            <TabsContent key={b.key} value={b.key} className="mt-3">
              <PrimaryTable<CancellationGroup>
                title={`Cancellations by ${b.label.toLowerCase()}`}
                subtitle="Click a row to open the CentralReach source rows behind it."
                columns={columnsFor(b.key)}
                rows={groupsFor(b.key)}
                rowKey={(g) => g.name}
                onRowClick={(g) =>
                  openDrilldown(
                    `${b.label} · ${g.name}`,
                    `${fmtCount(g.cancellations)} cancellations · ${fmtHours(g.lostHours)} lost hours`,
                    cancelledRows.filter((r) => matchesGroup(r, b.key, g.name)),
                    `cancellations-${b.key}-${g.name.toLowerCase().replace(/\s+/g, "-")}`,
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
