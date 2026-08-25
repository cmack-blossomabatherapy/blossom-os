/**
 * Primary report: Commit to Submit Compliance (`commit-to-submit-compliance`).
 *
 * Staff-facing surface for documentation timeliness. It is deliberately built
 * on two clearly labelled scopes:
 *
 * 1. **Documentation timeliness proxy** — global, client-free, de-identified
 *    date-of-service → documentation lag. The 7-day boundary is ON TIME. This
 *    scope is a *proxy only*: it can never create a formal violation and never
 *    assigns BCBA Category 1.
 * 2. **Program records** — coaching, reviews, notices, disputes and exceptions,
 *    each limited by row-level security to yourself and the people you oversee.
 *    Seeing nothing here is normal and is not a data problem.
 *
 * The program is not active until a configuration is enabled and fully
 * approved. Until then this page reports timeliness and nothing else: no
 * notice, no formal violation, and no employment action can be produced from
 * it. Coaching always precedes any formal step, and a level 3 notice creates an
 * HR review requirement only.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { PrimaryReportShell } from "@/components/reports/crPrimary/PrimaryReportShell";
import { KpiScorecards } from "@/components/reports/crPrimary/KpiScorecards";
import { PrimaryChart } from "@/components/reports/crPrimary/PrimaryChart";
import {
  PrimaryTable,
  type PrimaryTableColumn,
} from "@/components/reports/crPrimary/PrimaryTable";
import { DateRangeFilter } from "@/components/reports/crPrimary/DateRangeFilter";
import { FilterCombobox } from "@/components/reports/crPrimary/FilterCombobox";
import {
  ReportInsufficientData,
  ReportProvenance,
} from "@/components/reports/crPrimary/ReportProvenance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { useUrlFilterState } from "@/hooks/useUrlFilterState";
import { useUrlState } from "@/hooks/useUrlState";
import { withCurrentMonthDefault } from "@/lib/os/reports/crPrimary/reportWindow";
import { fmtCount, fmtDate, fmtPct } from "@/lib/os/reports/crPrimary/format";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import { pushRecent } from "@/lib/os/reportsCatalog";
import {
  C2S_DISPUTE_HOLIDAY_LIMITATION,
  C2S_ON_TIME_MAX_LAG_DAYS,
  buildProviderQueue,
  summarizeGovernance,
  summarizeProxyRows,
  type C2sProgramConfig,
  type C2sProviderQueueRow,
  type C2sProxyRow,
  type C2sTrackerRecord,
} from "@/lib/os/reports/crPrimary/metrics/commitToSubmit";
import {
  fetchC2sActiveConfig,
  fetchIsDirectManager,
  type C2sDisputeRow,
} from "@/lib/os/reports/crPrimary/c2s/source";
import {
  c2sDisplayName,
  useC2sComplianceReport,
} from "@/hooks/useC2sComplianceReport";
import {
  C2sAdjudicateDisputeDialog,
  C2sCoachingDialog,
  C2sDisputeDialog,
  C2sExceptionDialog,
  C2sNoticeDialog,
  C2sReviewRecordDialog,
} from "@/components/reports/c2s/C2sActionDialogs";
import type { KpiDefinition } from "@/lib/os/reports/crPrimary/types";

const REPORT_ID = "commit-to-submit-compliance";

type TabKey = "overview" | "proxy-queue" | "reviewed" | "disputes-exceptions";

/** The four canonical tabs. URL values and visible labels never drift apart. */
export const C2S_TABS: { value: TabKey; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "proxy-queue", label: "Proxy Queue" },
  { value: "reviewed", label: "Reviewed" },
  { value: "disputes-exceptions", label: "Disputes & Exceptions" },
];

const EMPTY_FILTERS = {
  from: "",
  to: "",
  state: "",
  roleGroup: "",
  status: "",
  category: "",
};

const TIMELINESS_LABEL: Record<string, string> = {
  on_time: "On time",
  late: "Late",
  missing: "No documentation date",
  invalid: "Unusable dates",
};

const REVIEW_LABEL: Record<string, string> = {
  unreviewed: "Unreviewed",
  under_review: "Under review",
  upheld: "Upheld",
  not_upheld: "Not upheld",
  withdrawn: "Withdrawn",
};

const PROVIDER_EXPORT_COLUMNS = [
  { key: "provider", label: "Provider" },
  { key: "roleGroup", label: "Role Group" },
  { key: "state", label: "State" },
  { key: "proxyCategory", label: "Proxy Category" },
  { key: "total", label: "Rows" },
  { key: "onTime", label: "On Time" },
  { key: "late", label: "Late" },
  { key: "missing", label: "No Doc Date" },
  { key: "invalid", label: "Unusable" },
  { key: "latePercent", label: "Late % of Comparable" },
  { key: "maxLagDays", label: "Max Lag Days" },
  { key: "mapped", label: "Mapped To Employee" },
];

const PROXY_ROW_EXPORT_COLUMNS = [
  { key: "provider", label: "Provider" },
  { key: "roleGroup", label: "Role" },
  { key: "state", label: "State" },
  { key: "serviceDate", label: "Date Of Service" },
  { key: "documentationDate", label: "Documentation Timestamp" },
  { key: "lagDays", label: "Lag Days" },
  { key: "status", label: "Status" },
  { key: "proxyCategory", label: "Proxy Category" },
  { key: "provenance", label: "Provenance" },
];

const RECORD_EXPORT_COLUMNS = [
  { key: "employee", label: "Employee" },
  { key: "serviceDate", label: "Service Date" },
  { key: "roleGroup", label: "Role Group" },
  { key: "category", label: "Category" },
  { key: "lagDays", label: "Lag Days" },
  { key: "source", label: "Source" },
  { key: "reviewStatus", label: "Review Status" },
  { key: "formal", label: "Formal Violation Recorded" },
];

const uniqueSorted = (values: (string | null | undefined)[]): string[] =>
  [...new Set(values.map((v) => (v ?? "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );

export default function CommitToSubmitCompliancePage() {
  const defaults = useMemo(() => withCurrentMonthDefault(EMPTY_FILTERS), []);
  const [filters, setFilters] = useUrlFilterState(defaults);
  const [tab, setTab] = useUrlState("tab", "overview");
  const activeTab = C2S_TABS.some((t) => t.value === tab)
    ? (tab as TabKey)
    : "overview";

  const data = useC2sComplianceReport(filters.from, filters.to);
  const [config, setConfig] = useState<C2sProgramConfig | null>(null);

  useEffect(() => {
    pushRecent(REPORT_ID);
  }, []);

  useEffect(() => {
    let cancelled = false;
    // HR-only read. Non-HR staff get null, which correctly leaves every formal
    // control unavailable rather than silently enabled.
    if (!data.isHrAuthority) {
      setConfig(null);
      return;
    }
    fetchC2sActiveConfig().then((c) => {
      if (!cancelled) setConfig(c);
    });
    return () => {
      cancelled = true;
    };
  }, [data.isHrAuthority]);

  /**
   * Formal review / exception / notice workflows exist only once the program is
   * enabled AND fully approved. Coaching and employee disputes stay available.
   */
  const programActive = data.status.enabled && data.status.activationReady;

  // ------------------------------------------------------------ proxy scope
  const filteredProxy = useMemo<C2sProxyRow[]>(() => {
    return data.proxyRows.filter((row) => {
      if (filters.state && (row.state ?? "Unknown state") !== filters.state) return false;
      if (filters.roleGroup && row.roleGroup !== filters.roleGroup) return false;
      if (filters.status && row.timelinessStatus !== filters.status) return false;
      if (filters.category && row.proxyCategory !== filters.category) return false;
      return true;
    });
  }, [data.proxyRows, filters.state, filters.roleGroup, filters.status, filters.category]);

  const summary = useMemo(() => summarizeProxyRows(filteredProxy), [filteredProxy]);
  const providerQueue = useMemo(() => buildProviderQueue(filteredProxy), [filteredProxy]);

  const governance = useMemo(
    () =>
      summarizeGovernance({
        records: data.tracker,
        exceptions: data.exceptions,
        disputes: data.disputes,
        coaching: data.coaching,
        config,
      }),
    [data.tracker, data.exceptions, data.disputes, data.coaching, config],
  );

  const options = useMemo(
    () => ({
      state: uniqueSorted(data.proxyRows.map((r) => r.state ?? "Unknown state")),
      roleGroup: uniqueSorted(data.proxyRows.map((r) => r.roleGroup)),
      status: uniqueSorted(data.proxyRows.map((r) => r.timelinessStatus)),
      category: uniqueSorted(data.proxyRows.map((r) => r.proxyCategory)),
    }),
    [data.proxyRows],
  );

  const kpis = useMemo<KpiDefinition[]>(() => {
    const onTimePct =
      summary.comparable > 0 ? (summary.onTime / summary.comparable) * 100 : null;
    const counts = data.governanceCounts;
    return [
      {
        id: "eligible-rows",
        label: "Eligible proxy rows",
        value: fmtCount(summary.comparable),
        hint: `Rows with a usable lag — the honest denominator · ${fmtCount(summary.total)} row(s) in the window · ${fmtCount(summary.authoritativeRows)} from an authoritative completion time`,
      },
      {
        id: "on-time-rate",
        label: "On-time rate",
        value: onTimePct == null ? "Not measurable" : fmtPct(onTimePct),
        hint:
          summary.comparable > 0
            ? `${fmtCount(summary.onTime)} of ${fmtCount(summary.comparable)} eligible rows · exactly ${C2S_ON_TIME_MAX_LAG_DAYS} days counts as on time`
            : "No rows have both a service date and a documentation date",
        tone:
          onTimePct == null ? "neutral" : onTimePct >= 90 ? "good" : onTimePct >= 75 ? "warn" : "bad",
      },
      {
        id: "late-rows",
        label: "Late rows",
        value: fmtCount(summary.late),
        hint: `More than ${C2S_ON_TIME_MAX_LAG_DAYS} days from service date to documentation`,
        tone: summary.late > 0 ? "warn" : "good",
      },
      {
        id: "missing-invalid",
        label: "Missing / invalid timestamps",
        value: fmtCount(summary.missing + summary.invalid),
        hint: `${fmtCount(summary.missing)} with no documentation date · ${fmtCount(summary.invalid)} unusable · never counted as on time · ${fmtCount(summary.unmappedRows)} row(s) not matched to an employee`,
        tone: summary.missing + summary.invalid > 0 ? "warn" : "neutral",
      },
      {
        id: "historical-formal",
        label: "Historical formal records",
        value: fmtCount(counts.historicalFormalRecords),
        hint: "Visible to you · recorded formal history, kept even when later excused",
      },
      {
        id: "active-formal",
        label: "Active formal records",
        value: fmtCount(counts.activeFormalRecords),
        hint: "Visible to you · counted by the database, never inferred from documentation lag",
        tone: counts.activeFormalRecords > 0 ? "bad" : "good",
      },
      {
        id: "open-disputes",
        label: "Open disputes",
        value: fmtCount(counts.openDisputes),
        hint: "Visible to you · filed and awaiting an HR decision",
        tone: counts.openDisputes > 0 ? "warn" : "neutral",
      },
      {
        id: "active-exceptions",
        label: "Active approved exceptions",
        value: fmtCount(counts.activeApprovedExceptions),
        hint: "Visible to you · an approved exception removes a record from active formal counts",
      },
    ];
  }, [summary, data.governanceCounts]);

  // --------------------------------------------------------------- dialogs
  const [coachingFor, setCoachingFor] = useState<{ id: string; name: string } | null>(null);
  const [disputeFor, setDisputeFor] = useState<{
    subjectEmployeeId: string;
    trackerRecordId: string | null;
    noticeId: string | null;
    noticeIssuedAt: string | null;
  } | null>(null);
  const [reviewFor, setReviewFor] = useState<C2sTrackerRecord | null>(null);
  const [noticeFor, setNoticeFor] = useState<C2sTrackerRecord | null>(null);
  const [exceptionFor, setExceptionFor] = useState<C2sTrackerRecord | null>(null);
  const [adjudicateFor, setAdjudicateFor] = useState<C2sDisputeRow | null>(null);

  /**
   * Coaching is offered to HR authority directly; anyone else must be confirmed
   * by the database as the subject's direct manager before the form opens.
   */
  const openCoaching = useCallback(
    async (employeeId: string | null, name: string) => {
      if (!employeeId) {
        toast.error("This provider is not matched to an employee record yet.");
        return;
      }
      if (!data.isHrAuthority) {
        const isManager = await fetchIsDirectManager(employeeId);
        if (!isManager) {
          toast.error("Only this employee's direct manager or HR can record coaching.");
          return;
        }
      }
      setCoachingFor({ id: employeeId, name });
    },
    [data.isHrAuthority],
  );

  // ---------------------------------------------------------------- tables
  const providerColumns: PrimaryTableColumn<C2sProviderQueueRow>[] = [
    {
      key: "provider",
      label: "Provider",
      render: (r) => (
        <span className="font-medium">
          {r.providerDisplayName || "Unnamed provider"}
          {r.unmapped && (
            <Badge variant="outline" className="ml-2 text-[10px]">
              Not matched
            </Badge>
          )}
        </span>
      ),
    },
    { key: "role", label: "Role", render: (r) => r.roleGroup },
    { key: "state", label: "State", render: (r) => r.state ?? "Unknown" },
    { key: "total", label: "Rows", align: "right", render: (r) => fmtCount(r.total) },
    { key: "late", label: "Late", align: "right", render: (r) => fmtCount(r.late) },
    {
      key: "latePct",
      label: "Late %",
      align: "right",
      render: (r) => (r.latePercent == null ? "Not comparable" : fmtPct(r.latePercent)),
    },
    {
      key: "maxLag",
      label: "Max Lag",
      align: "right",
      render: (r) => (r.maxLagDays == null ? "—" : `${r.maxLagDays}d`),
    },
    {
      key: "notMeasurable",
      label: "Not Measurable",
      align: "right",
      render: (r) => fmtCount(r.missing + r.invalid),
    },
    {
      key: "action",
      label: "",
      render: (r) => (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px]"
          onClick={() => openCoaching(r.employeeId, r.providerDisplayName || "this employee")}
        >
          Record coaching
        </Button>
      ),
    },
  ];

  const recordColumns: PrimaryTableColumn<C2sTrackerRecord>[] = [
    {
      key: "employee",
      label: "Employee",
      render: (r) => (
        <span className="font-medium">
          {c2sDisplayName(data.employeeNames, r.subjectEmployeeId)}
        </span>
      ),
    },
    { key: "service", label: "Service Date", render: (r) => fmtDate(r.serviceDate) },
    { key: "role", label: "Role", render: (r) => r.roleGroup.toUpperCase() },
    { key: "category", label: "Category", render: (r) => r.category.replace(/_/g, " ") },
    {
      key: "lag",
      label: "Lag",
      align: "right",
      render: (r) => (r.lagDays == null ? "—" : `${r.lagDays}d`),
    },
    {
      key: "source",
      label: "Source",
      render: (r) =>
        r.sourceKind === "authoritative_completion" ? "Authoritative completion" : "Reviewed tracker",
    },
    {
      key: "review",
      label: "Review",
      render: (r) => (
        <Badge
          variant="outline"
          className={
            r.reviewStatus === "upheld"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : r.reviewStatus === "unreviewed"
                ? "border-border"
                : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          }
        >
          {REVIEW_LABEL[r.reviewStatus] ?? r.reviewStatus}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <div className="flex flex-wrap justify-end gap-1.5">
          {r.subjectEmployeeId === data.viewerEmployeeId && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              onClick={() =>
                setDisputeFor({
                  subjectEmployeeId: r.subjectEmployeeId,
                  trackerRecordId: r.id,
                  noticeId:
                    data.notices.find((n) => n.trackerRecordId === r.id)?.id ?? null,
                  noticeIssuedAt:
                    data.notices.find((n) => n.trackerRecordId === r.id)?.issuedAt ?? null,
                })
              }
            >
              Dispute
            </Button>
          )}
          {data.isHrAuthority && programActive && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                onClick={() => setReviewFor(r)}
              >
                Review
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                onClick={() => setExceptionFor(r)}
              >
                Exception
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                onClick={() => setNoticeFor(r)}
              >
                Notice
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const disputeColumns: PrimaryTableColumn<C2sDisputeRow>[] = [
    {
      key: "employee",
      label: "Employee",
      render: (r) => c2sDisplayName(data.employeeNames, r.subjectEmployeeId),
    },
    { key: "filed", label: "Filed", render: (r) => fmtDate(r.filedAt) },
    { key: "deadline", label: "Deadline", render: (r) => fmtDate(r.filingDeadline) },
    { key: "status", label: "Status", render: (r) => r.status.replace(/_/g, " ") },
    { key: "decided", label: "Decided", render: (r) => (r.decidedAt ? fmtDate(r.decidedAt) : "—") },
    {
      key: "actions",
      label: "",
      render: (r) =>
        data.isHrAuthority ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            onClick={() => setAdjudicateFor(r)}
          >
            Record decision
          </Button>
        ) : null,
    },
  ];

  // ---------------------------------------------------------------- export
  const providerExportRows = useMemo(
    () =>
      providerQueue.map((r) => ({
        provider: r.providerDisplayName || "Unnamed provider",
        roleGroup: r.roleGroup,
        state: r.state ?? "Unknown",
        proxyCategory: r.proxyCategory,
        total: r.total,
        onTime: r.onTime,
        late: r.late,
        missing: r.missing,
        invalid: r.invalid,
        latePercent: r.latePercent == null ? "Not comparable" : r.latePercent.toFixed(1),
        maxLagDays: r.maxLagDays ?? "",
        mapped: r.unmapped ? "No" : "Yes",
      })),
    [providerQueue],
  );

  const recordExportRows = useMemo(
    () =>
      data.tracker.map((r) => ({
        employee: c2sDisplayName(data.employeeNames, r.subjectEmployeeId),
        serviceDate: r.serviceDate ?? "",
        roleGroup: r.roleGroup,
        category: r.category,
        lagDays: r.lagDays ?? "",
        source: r.sourceKind,
        reviewStatus: r.reviewStatus,
        formal: r.isFormalViolation ? "Yes" : "No",
      })),
    [data.tracker, data.employeeNames],
  );

  /** Row-level export for the Proxy Queue tab — same privacy boundary, every row. */
  const proxyRowExportRows = useMemo(
    () =>
      filteredProxy.map((r) => ({
        provider: r.providerDisplayName ?? "Unmatched provider",
        roleGroup: r.roleGroup,
        state: r.state ?? "Unknown state",
        serviceDate: r.dateOfService ?? "",
        documentationDate: r.documentationDate ?? "",
        lagDays: r.lagDays ?? "",
        status: TIMELINESS_LABEL[r.timelinessStatus] ?? r.timelinessStatus,
        proxyCategory: r.proxyCategory,
        provenance: r.provenance ?? (r.usedAuthoritativeCompletion ? "Authoritative completion time" : "Proxy timestamp"),
      })),
    [filteredProxy],
  );

  const onExport = useCallback(() => {
    if (activeTab === "reviewed" || activeTab === "disputes-exceptions") {
      downloadCsv("commit-to-submit-program-records", recordExportRows, RECORD_EXPORT_COLUMNS);
      return;
    }
    if (activeTab === "proxy-queue") {
      downloadCsv("commit-to-submit-documentation-rows", proxyRowExportRows, PROXY_ROW_EXPORT_COLUMNS);
      return;
    }
    downloadCsv("commit-to-submit-timeliness", providerExportRows, PROVIDER_EXPORT_COLUMNS);
  }, [activeTab, providerExportRows, recordExportRows, proxyRowExportRows]);

  // --------------------------------------------------------------- warnings
  const warnings = useMemo(() => {
    const out: string[] = [];
    if (!data.status.enabled || !data.status.activationReady) {
      out.push(
        "The Commit to Submit program is not active yet. This page reports documentation timeliness only — no notice, formal violation, or employment action can come from it until a configuration is enabled and fully approved.",
      );
    }
    if (summary.missing + summary.invalid > 0) {
      out.push(
        `${fmtCount(summary.missing + summary.invalid)} row(s) cannot be measured because a documentation date is missing or unusable. They are excluded from the on-time and late percentages rather than counted as on time.`,
      );
    }
    if (summary.unmappedRows > 0) {
      out.push(
        `${fmtCount(summary.unmappedRows)} row(s) are not matched to an employee record, so they stay as separate provider rows and cannot be coached or reviewed until identity is reconciled.`,
      );
    }
    if (data.stale) {
      out.push(
        "The underlying documentation data has not refreshed recently, so recent service dates may look worse than they are.",
      );
    }
    if (filters.from && filters.to && data.invalidWindow) {
      out.push("The selected date range is not usable, so no timeliness data was loaded.");
    }
    return out;
  }, [data.status, data.stale, data.invalidWindow, summary, filters.from, filters.to]);

  const activeFilterCount = [
    filters.state,
    filters.roleGroup,
    filters.status,
    filters.category,
  ].filter(Boolean).length;

  const filterBar = (
    <section
      data-testid="c2s-filters"
      className="space-y-3 rounded-2xl border border-border/60 bg-card p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4 text-primary" /> Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="rounded-full text-[10px]">
              {activeFilterCount} active
            </Badge>
          )}
        </span>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setFilters({ ...defaults, from: filters.from, to: filters.to })}
          >
            <X className="h-3.5 w-3.5" /> Clear all
          </Button>
        )}
      </div>
      <DateRangeFilter
        from={filters.from}
        to={filters.to}
        onChange={({ from, to }) => setFilters({ ...filters, from, to })}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            { key: "state", label: "State", options: options.state },
            { key: "roleGroup", label: "Role group", options: options.roleGroup },
            { key: "status", label: "Status", options: options.status },
            { key: "category", label: "Proxy category", options: options.category },
          ] as const
        ).map((field) => (
          <div key={field.key} className="min-w-0 space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {field.label}
            </span>
            <FilterCombobox
              label={field.label}
              value={filters[field.key] || ""}
              options={field.options}
              onChange={(v) => setFilters({ ...filters, [field.key]: v })}
              className="h-9 w-full"
            />
          </div>
        ))}
      </div>
    </section>
  );

  /** Row-level drilldown, capped for rendering only — exports carry every row. */
  const visibleProxyRows = useMemo(
    () =>
      [...filteredProxy]
        .sort((a, b) => (b.lagDays ?? -1) - (a.lagDays ?? -1))
        .slice(0, 300),
    [filteredProxy],
  );

  const proxyRowColumns = useMemo<PrimaryTableColumn<C2sProxyRow>[]>(
    () => [
      {
        key: "provider",
        label: "Provider",
        render: (r) => r.providerDisplayName ?? "Unmatched provider",
      },
      { key: "roleGroup", label: "Role", render: (r) => r.roleGroup },
      { key: "state", label: "State", render: (r) => r.state ?? "Unknown state" },
      {
        key: "dos",
        label: "Date of service",
        render: (r) => (r.dateOfService ? fmtDate(r.dateOfService) : "—"),
      },
      {
        key: "documented",
        label: "Documented",
        render: (r) => (r.documentationDate ? fmtDate(r.documentationDate) : "No date"),
      },
      { key: "lag", label: "Lag (days)", align: "right", render: (r) => r.lagDays ?? "—" },
      {
        key: "status",
        label: "Status",
        render: (r) => TIMELINESS_LABEL[r.timelinessStatus] ?? r.timelinessStatus,
      },
      { key: "category", label: "Proxy category", render: (r) => r.proxyCategory },
      {
        key: "provenance",
        label: "Provenance",
        render: (r) =>
          r.usedAuthoritativeCompletion
            ? (r.provenance ?? "Authoritative completion time")
            : (r.provenance ?? "Proxy timestamp"),
      },
    ],
    [],
  );

  /**
   * Four unit-honest charts. A percentage chart never carries counts, and a
   * count chart never carries percentages or hours.
   */
  const onTimeTrendChart = summary.byMonth
    .filter((row) => row.comparable > 0)
    .map((row) => ({
      label: row.key,
      value: Number((((row.onTime / row.comparable) * 100)).toFixed(1)),
    }));
  const lateByStateChart = summary.byState.map((row) => ({ label: row.key, value: row.late }));
  const statusByRoleChart = summary.byRoleGroup.map((row) => ({
    label: row.key,
    value: row.onTime,
    secondary: row.late,
    tertiary: row.missing + row.invalid,
  }));
  const lateByCategoryChart = summary.byProxyCategory.map((row) => ({
    label: row.key,
    value: row.late,
  }));

  return (
    <PrimaryReportShell
      title="Commit to Submit Compliance"
      subtitle="Documentation timeliness, coaching, and program governance — measured from the source that can prove it."
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      dataQualityWarnings={warnings}
      onRefresh={data.refresh}
      onExport={onExport}
      exportDisabled={providerQueue.length === 0 && data.tracker.length === 0}
      filters={filterBar}
    >
      <div className="space-y-4">
        {(!data.status.enabled || !data.status.activationReady) && (
          <div
            data-testid="c2s-program-banner"
            className="flex items-start gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/[0.06] p-4"
          >
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="text-xs leading-relaxed">
              <p className="text-sm font-semibold">Program not activated</p>
              <p className="mt-1 text-muted-foreground">
                Commit to Submit is in measurement mode. Timeliness below is a documentation lag
                proxy only — it is never a formal violation, never assigns BCBA Category 1, and
                cannot trigger a notice, a pay change, or any employment action. Coaching stays
                available and always comes first. Formal violations from this proxy: never — not
                one, in any window, for any provider.
              </p>
              <p className="mt-1.5 text-muted-foreground">
                {data.status.configured
                  ? `Configuration present${data.status.policyVersion ? ` (policy ${data.status.policyVersion})` : ""} · approvals ${
                      data.status.approvalsComplete ? "complete" : "incomplete"
                    } · required values ${
                      data.status.requiredValuesComplete ? "complete" : "incomplete"
                    }.`
                  : "No program configuration exists yet."}
              </p>
            </div>
          </div>
        )}

        <ReportProvenance>
          Timeliness is computed from date of service to the documentation timestamp, with{" "}
          {C2S_ON_TIME_MAX_LAG_DAYS} days or fewer counting as on time. This view is de-identified
          at the provider level and contains no client, payor, service, or dollar detail. Program
          records — coaching, reviews, notices, disputes, exceptions — are limited to yourself and
          the people you oversee, so an empty list here is normal.
        </ReportProvenance>

        <Tabs value={activeTab} onValueChange={setTab}>
          <TabsList>
            {C2S_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {data.invalidWindow ? (
          <ReportInsufficientData
            title="That date range cannot be used"
            detail="Pick a start date on or before the end date, then this report will load timeliness for that window."
          />
        ) : (
          <>
            <KpiScorecards kpis={kpis} onSelect={() => setTab("proxy-queue")} />

            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <PrimaryChart
                    title="On-time percentage trend"
                    subtitle="Percent of eligible rows documented on time, by month of service"
                    type="line"
                    data={onTimeTrendChart}
                    valueLabel="On time %"
                  />
                  <PrimaryChart
                    title="Late rows by state"
                    subtitle="Counts only — where late documentation is concentrated"
                    type="bar"
                    data={lateByStateChart}
                    valueLabel="Late rows"
                  />
                  <PrimaryChart
                    title="Status counts by role"
                    subtitle="On-time, late, and not-measurable row counts — no percentages"
                    type="bar"
                    data={statusByRoleChart}
                    valueLabel="On time"
                    secondaryLabel="Late"
                    tertiaryLabel="Not measurable"
                  />
                  <PrimaryChart
                    title="Late rows by proxy category"
                    subtitle="Counts only — which documentation category is running late"
                    type="bar"
                    data={lateByCategoryChart}
                    valueLabel="Late rows"
                  />
                </div>
              </div>
            )}

            {activeTab === "proxy-queue" && (
              <div className="space-y-3">
                <PrimaryTable
                  title="Provider action queue"
                  subtitle="De-identified provider rows. Rows without a matched employee cannot be coached until identity is reconciled."
                  columns={providerColumns}
                  rows={providerQueue}
                  rowKey={(r, i) => r.employeeId ?? `unmapped-${i}`}
                  emptyLabel="No documentation rows match the current filters."
                />
                <PrimaryTable
                  title="Documentation rows behind these numbers"
                  subtitle="Client-free drilldown: provider, role, state, date of service, documentation timestamp, lag, status, category, and provenance. No client, payor, service code, hours, or dollar detail exists in this view."
                  columns={proxyRowColumns}
                  rows={visibleProxyRows}
                  rowKey={(r, i) => `${r.employeeId ?? "unmapped"}-${r.dateOfService ?? "no-dos"}-${i}`}
                  emptyLabel="No documentation rows match the current filters."
                />
                {filteredProxy.length > visibleProxyRows.length && (
                  <ReportProvenance>
                    Showing the {fmtCount(visibleProxyRows.length)} rows with the longest lag out of{" "}
                    {fmtCount(filteredProxy.length)} matching rows. Export the tab to get every row.
                  </ReportProvenance>
                )}
              </div>
            )}

            {activeTab === "reviewed" && (
              <div className="space-y-3">
                <PrimaryTable
                  title="Reviewed program records (Visible to you)"
                  subtitle="Reviewed documentation records you are permitted to see. A record only supports a formal step after review, with coaching first."
                  columns={recordColumns}
                  rows={data.tracker}
                  rowKey={(r) => r.id}
                  emptyLabel="No program records are visible to you. That is expected unless you are the subject, their manager, or HR."
                />
                <ReportProvenance>
                  {fmtCount(governance.unreviewedRecords)} record(s) are unreviewed and{" "}
                  {fmtCount(governance.upheldRecords)} are upheld. Only{" "}
                  {fmtCount(governance.formalViolations)} count as an active formal violation today —
                  an approved exception or an upheld dispute removes a record from that count
                  without erasing its history.
                </ReportProvenance>
              </div>
            )}

            {activeTab === "disputes-exceptions" && (
              <div className="space-y-4">
                <PrimaryTable
                  title="Disputes (Visible to you)"
                  subtitle="Employees file a dispute; the system records the filing date and deadline."
                  columns={disputeColumns}
                  rows={data.disputes}
                  rowKey={(r) => r.id}
                  emptyLabel="No disputes are visible to you."
                />
                <PrimaryTable
                  title="Exceptions (Visible to you)"
                  subtitle="Approved exceptions remove a record from active formal counts."
                  columns={[
                    {
                      key: "employee",
                      label: "Employee",
                      render: (r) => c2sDisplayName(data.employeeNames, r.subjectEmployeeId),
                    },
                    { key: "type", label: "Type", render: (r) => r.exceptionType.replace(/_/g, " ") },
                    { key: "status", label: "Status", render: (r) => r.status },
                    {
                      key: "window",
                      label: "Window",
                      render: (r) =>
                        r.appliesFrom && r.appliesTo
                          ? `${fmtDate(r.appliesFrom)} – ${fmtDate(r.appliesTo)}`
                          : r.trackerRecordId
                            ? "Linked to one record"
                            : "No window recorded",
                    },
                  ]}
                  rows={data.exceptions}
                  rowKey={(r) => r.id}
                  emptyLabel="No exceptions are visible to you."
                />
                <PrimaryTable
                  title="Notices"
                  subtitle="Levels advance one at a time. A level 3 notice creates an HR review requirement only."
                  columns={[
                    {
                      key: "employee",
                      label: "Employee",
                      render: (r) => c2sDisplayName(data.employeeNames, r.subjectEmployeeId),
                    },
                    { key: "level", label: "Level", render: (r) => `Level ${r.noticeLevel}` },
                    { key: "issued", label: "Issued", render: (r) => fmtDate(r.issuedAt) },
                    {
                      key: "ack",
                      label: "Acknowledged",
                      render: (r) => (r.acknowledgedAt ? fmtDate(r.acknowledgedAt) : "Not yet"),
                    },
                    {
                      key: "hr",
                      label: "HR review",
                      render: (r) => (r.hrReviewRequired ? "Required" : "Not required"),
                    },
                    {
                      key: "actions",
                      label: "",
                      render: (r) =>
                        r.subjectEmployeeId === data.viewerEmployeeId ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px]"
                            onClick={() =>
                              setDisputeFor({
                                subjectEmployeeId: r.subjectEmployeeId,
                                trackerRecordId: r.trackerRecordId,
                                noticeId: r.id,
                                noticeIssuedAt: r.issuedAt,
                              })
                            }
                          >
                            Dispute
                          </Button>
                        ) : null,
                    },
                  ]}
                  rows={data.notices}
                  rowKey={(r) => r.id}
                  emptyLabel="No notices are visible to you."
                />
                <ReportProvenance tone="warn">
                  {C2S_DISPUTE_HOLIDAY_LIMITATION}
                </ReportProvenance>
              </div>
            )}
          </>
        )}
      </div>

      {coachingFor && (
        <C2sCoachingDialog
          open
          onOpenChange={(o) => !o && setCoachingFor(null)}
          onSaved={data.refresh}
          subjectEmployeeId={coachingFor.id}
          subjectName={coachingFor.name}
        />
      )}
      {disputeFor && (
        <C2sDisputeDialog
          open
          onOpenChange={(o) => !o && setDisputeFor(null)}
          onSaved={data.refresh}
          subjectEmployeeId={disputeFor.subjectEmployeeId}
          trackerRecordId={disputeFor.trackerRecordId}
          noticeId={disputeFor.noticeId}
          noticeIssuedAt={disputeFor.noticeIssuedAt}
        />
      )}
      {reviewFor && (
        <C2sReviewRecordDialog
          open
          onOpenChange={(o) => !o && setReviewFor(null)}
          onSaved={data.refresh}
          record={reviewFor}
        />
      )}
      {exceptionFor && (
        <C2sExceptionDialog
          open
          onOpenChange={(o) => !o && setExceptionFor(null)}
          onSaved={data.refresh}
          record={exceptionFor}
        />
      )}
      {noticeFor && (
        <C2sNoticeDialog
          open
          onOpenChange={(o) => !o && setNoticeFor(null)}
          onSaved={data.refresh}
          record={noticeFor}
          config={config}
          coaching={data.coaching}
          exceptions={data.exceptions}
          disputes={data.disputes}
          priorLevels={data.notices
            .filter((n) => n.subjectEmployeeId === noticeFor.subjectEmployeeId)
            .map((n) => n.noticeLevel)}
        />
      )}
      {adjudicateFor && (
        <C2sAdjudicateDisputeDialog
          open
          onOpenChange={(o) => !o && setAdjudicateFor(null)}
          onSaved={data.refresh}
          disputeId={adjudicateFor.id}
        />
      )}
    </PrimaryReportShell>
  );
}
