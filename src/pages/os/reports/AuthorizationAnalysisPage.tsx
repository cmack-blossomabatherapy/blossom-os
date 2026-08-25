/**
 * Authorization Command Center (`authorization-analysis`) — Phase 2A repair.
 *
 * Four URL-addressable tabs (`?tab=`):
 *   1. lifecycle        — true logged event counts, with provenance.
 *   2. continuity       — active / expired / expiring, renewals, gap candidates.
 *   3. progress-reports — real PR events plus authoritative due dates only.
 *   4. pauses           — confirmed pauses, separated from gap candidates.
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
import { useUrlState } from "@/hooks/useUrlState";
import { useAuthorizationWeeklyEvents } from "@/hooks/useAuthorizationWeeklyEvents";
import { LogAuthEventDialog } from "@/components/reports/crPrimary/LogAuthEventDialog";
import { withCurrentMonthDefault } from "@/lib/os/reports/crPrimary/reportWindow";
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
  classifyLifecycleEvent,
  computeAuthorizationLifecycle,
} from "@/lib/os/reports/crPrimary/metrics/authorizationLifecycle";
import {
  CONTINUITY_LABEL,
  RENEWAL_LABEL,
  buildAuthorizationTabExport,
  eventKindInput,
  projectContinuityRows,
  projectLifecycleEvent,
} from "@/lib/os/reports/crPrimary/metrics/authorizationExport";
import {
  computeAuthorizationContinuity,
  type ContinuityRow,
} from "@/lib/os/reports/crPrimary/metrics/authorizationContinuity";
import {
  NO_AUTHORITATIVE_DUE,
  NOT_DOCUMENTED,
  computeAuthorizationActionTimelines,
  type ActionTimelineMetrics,
  type ActionTimelineRow,
  computePauseOps,
  computeProgressReportOps,
  type ProgressReportDueRow,
} from "@/lib/os/reports/crPrimary/metrics/authorizationActions";
import {
  computeAuthorizationActionQueues,
  computeCodeEventCounts,
  computeKindEventCounts,
  computeServiceActivityWithoutCoverage,
  type ActionQueueRow,
  type AuthorizationActionQueues,
  type ServiceActivityWithoutCoverageRow,
  type SourceEventCountRow,
} from "@/lib/os/reports/crPrimary/metrics/authorizationCommandCenter";
import { localIsoDate } from "@/lib/os/reports/crPrimary/reportWindow";
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

const SOURCE_COUNT_COLUMNS: PrimaryTableColumn<SourceEventCountRow>[] = [
  { key: "label", label: "Source", render: (r) => r.label },
  {
    key: "submitted",
    label: "Submitted",
    align: "right",
    render: (r) => <span className="tabular-nums">{fmtCount(r.submitted)}</span>,
  },
  {
    key: "approved",
    label: "Approved",
    align: "right",
    render: (r) => <span className="tabular-nums">{fmtCount(r.approved)}</span>,
  },
  {
    key: "denied",
    label: "Denied",
    align: "right",
    render: (r) => <span className="tabular-nums">{fmtCount(r.denied)}</span>,
  },
];

/**
 * Open queues are a current workflow backlog, not dated activity, so the
 * selected range must never hide them.
 */
const OPEN_WORK_SCOPE_HINT =
  "The date range filters dated activity and turnaround KPIs, not the open backlog.";

/** The four open-work queues, each with the rule that puts a record in it. */
const QUEUE_SUMMARY_ROWS: {
  key: string;
  label: string;
  note: string;
  rows: (q: AuthorizationActionQueues) => ActionQueueRow[];
}[] = [
  {
    key: "pending-submissions",
    label: "Pending submissions",
    note: "Received date recorded, no submitted date recorded, not resolved.",
    rows: (q) => q.pendingSubmissions,
  },
  {
    key: "pending-decisions",
    label: "Pending decisions",
    note: "Submitted date recorded, no approval or denial date recorded, not resolved.",
    rows: (q) => q.pendingDecisions,
  },
  {
    key: "overdue-actions",
    label: "Overdue actions",
    note: "A real recorded due date already in the past, and not resolved.",
    rows: (q) => q.overdueActions,
  },
  {
    key: "reassessment",
    label: "Reassessment / reauthorization work",
    note: "Open records whose recorded authorization type is a reauthorization.",
    rows: (q) => q.reassessmentWork,
  },
];

/** The two turnaround averages, each with its own documented denominator. */
const TIMELINE_DENOMINATOR_ROWS: {
  key: string;
  label: string;
  drilldownSubtitle: string;
  average: (t: ActionTimelineMetrics) => number | null;
  counted: (t: ActionTimelineMetrics) => number;
  outOfRange: (t: ActionTimelineMetrics) => number;
  notDocumented: (t: ActionTimelineMetrics) => number;
}[] = [
  {
    key: "receipt-to-submission",
    label: "Receipt → submission",
    drilldownSubtitle:
      "Counted when the receipt date is documented and the real submitted date falls inside the selected range.",
    average: (t) => t.avgReceivedToSubmittedDays,
    counted: (t) => t.documentedReceivedToSubmitted,
    outOfRange: (t) => t.outOfRangeReceivedToSubmitted,
    notDocumented: (t) => t.notDocumentedReceivedToSubmitted,
  },
  {
    key: "submission-to-decision",
    label: "Submission → decision",
    drilldownSubtitle:
      "Counted when the submission date is documented and the real approval or denial date falls inside the selected range.",
    average: (t) => t.avgSubmittedToDecisionDays,
    counted: (t) => t.documentedSubmittedToDecision,
    outOfRange: (t) => t.outOfRangeSubmittedToDecision,
    notDocumented: (t) => t.notDocumentedSubmittedToDecision,
  },
];

const TIMELINE_DRILLDOWN_COLUMNS = [
  { key: "client", label: "Client" },
  { key: "authorizationNumber", label: "Authorization #" },
  { key: "receivedDate", label: "Received" },
  { key: "submittedDate", label: "Submitted" },
  { key: "decisionDate", label: "Decision" },
  { key: "decisionType", label: "Decision Type" },
  { key: "receivedToSubmitted", label: "Receipt → Submission" },
  { key: "countedReceiptToSubmission", label: "Counted In Receipt → Submission" },
  { key: "submittedToDecision", label: "Submission → Decision" },
  { key: "countedSubmissionToDecision", label: "Counted In Submission → Decision" },
  { key: "state", label: "State" },
  { key: "payor", label: "Payor" },
];

const countedLabel = (documented: boolean, counted: boolean): string =>
  !documented ? NOT_DOCUMENTED : counted ? "Counted" : "Documented, outside range";

const projectTimelineRows = (rows: ActionTimelineRow[]): Record<string, unknown>[] =>
  rows.map((r) => ({
    client: r.client,
    authorizationNumber: r.authorizationNumber,
    receivedDate: r.receivedDate ?? NOT_DOCUMENTED,
    submittedDate: r.submittedDate ?? NOT_DOCUMENTED,
    decisionDate: r.decisionDate ?? NOT_DOCUMENTED,
    decisionType: r.decisionType ?? NOT_DOCUMENTED,
    receivedToSubmitted: r.receivedToSubmittedDisplay,
    countedReceiptToSubmission: countedLabel(
      r.receivedToSubmittedDays != null,
      r.countsForReceivedToSubmitted,
    ),
    submittedToDecision: r.submittedToDecisionDisplay,
    countedSubmissionToDecision: countedLabel(
      r.submittedToDecisionDays != null,
      r.countsForSubmittedToDecision,
    ),
    state: r.state,
    payor: r.payor,
  }));

const QUEUE_DRILLDOWN_COLUMNS = [
  { key: "client", label: "Client" },
  { key: "authorizationNumber", label: "Authorization #" },
  { key: "serviceCode", label: "Service Code" },
  { key: "status", label: "Stage" },
  { key: "nextAction", label: "Next Action" },
  { key: "receivedDate", label: "Received" },
  { key: "submittedDate", label: "Submitted" },
  { key: "approvedDate", label: "Approved" },
  { key: "deniedDate", label: "Denied" },
  { key: "dueDate", label: "Due" },
  { key: "daysOverdue", label: "Days Overdue" },
  { key: "resolved", label: "Resolved" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "note", label: "What This Means" },
];

const SERVICE_GAP_DRILLDOWN_COLUMNS = [
  { key: "client", label: "Client" },
  { key: "clientCrId", label: "CR Client Id" },
  { key: "state", label: "State" },
  { key: "payor", label: "Payor" },
  { key: "lastEnd", label: "Last Coverage End" },
  { key: "sessions", label: "Sessions In Range" },
  { key: "hours", label: "Recorded Hours In Range" },
  { key: "missingHours", label: "Sessions Missing Hours" },
  { key: "dataQuality", label: "Data Quality" },
  { key: "firstService", label: "First Service" },
  { key: "lastService", label: "Last Service" },
  { key: "status", label: "Status" },
  { key: "note", label: "Next Step" },
];

const projectQueueRows = (rows: ActionQueueRow[]): Record<string, unknown>[] =>
  rows.map((r) => ({
    client: r.client,
    authorizationNumber: r.authorizationNumber,
    serviceCode: r.serviceCode,
    status: r.status,
    nextAction: r.nextAction,
    receivedDate: r.receivedDate ?? NOT_DOCUMENTED,
    submittedDate: r.submittedDate ?? NOT_DOCUMENTED,
    approvedDate: r.approvedDate ?? NOT_DOCUMENTED,
    deniedDate: r.deniedDate ?? NOT_DOCUMENTED,
    dueDate: r.dueDate ?? NOT_DOCUMENTED,
    daysOverdue: r.daysOverdue ?? NOT_DOCUMENTED,
    resolved: r.resolved ? "Resolved (history only)" : "Open",
    payor: r.payor,
    state: r.state,
    note: r.note,
  }));

const projectServiceGapRows = (
  rows: ServiceActivityWithoutCoverageRow[],
): Record<string, unknown>[] =>
  rows.map((r) => ({
    client: r.client,
    clientCrId: r.clientCrId || NOT_DOCUMENTED,
    state: r.state,
    payor: r.payor,
    lastEnd: r.lastEnd ?? NOT_DOCUMENTED,
    sessions: r.sessions,
    hours: r.hours,
    missingHours: r.missingHours,
    dataQuality: r.dataQualityNote ?? "Hours recorded on every session",
    firstService: r.firstService ?? NOT_DOCUMENTED,
    lastService: r.lastService ?? NOT_DOCUMENTED,
    status: "Needs Confirmation",
    note: r.note,
  }));

const LIFECYCLE_DRILLDOWN_COLUMNS = [
  { key: "eventDate", label: "Event Date" },
  { key: "eventType", label: "Event Type" },
  { key: "kind", label: "Authorization Kind" },
  { key: "kindSource", label: "Kind Source" },
  { key: "action", label: "Outcome" },
  { key: "authorizationNumber", label: "Authorization #" },
  { key: "client", label: "Client" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "reason", label: "Reason / Note" },
  { key: "source", label: "Logged From" },
];

const asText = (v: unknown, fallback = "") => (String(v ?? "").trim() || fallback);

/** Exactly four tabs, in this order, addressable via `?tab=`. */
const TABS = [
  { key: "lifecycle", label: "Lifecycle" },
  { key: "continuity", label: "Continuity & Renewals" },
  { key: "progress-reports", label: "Progress Reports" },
  { key: "pauses", label: "Pauses" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** Reports open on the current calendar month; Reset returns here. */
const DEFAULT_FILTERS = withCurrentMonthDefault(EMPTY_FILTERS);

export default function AuthorizationCommandCenterPage() {
  const data = useCrPrimaryReport(["authCurrent", "authEvents", "authActions", "billingFacts"]);
  const [filters, setFilters] = useUrlFilterState<PrimaryReportFilters>(DEFAULT_FILTERS);
  const [tabParam, setTabParam] = useUrlState("tab", "continuity");
  const tab = (TABS.some((t) => t.key === tabParam) ? tabParam : "continuity") as TabKey;
  const setTab = (next: TabKey) => setTabParam(next);
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const { logEvent } = useAuthorizationWeeklyEvents();

  useEffect(() => {
    pushRecent("authorization-analysis");
  }, []);

  const today = useMemo(() => localIsoDate(), []);
  const range = useMemo(
    () => ({ from: filters.from ?? "", to: filters.to ?? "" }),
    [filters.from, filters.to],
  );

  /**
   * Every non-date filter (state, client, payor, service code, status) with the
   * selected range stripped out. Used for the two things that are a *current*
   * picture rather than dated activity: the current authorization snapshot and
   * the open workflow backlog. Narrowing either by an event window would hide
   * live coverage and live open work.
   */
  const nonDateFilters = useMemo(
    () => ({ ...filters, from: "", to: "" }),
    [filters],
  );

  const auths = useMemo(
    () =>
      applyFilters(data.authCurrent, nonDateFilters, (r) => ({
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        code: r.service_codes ?? r.procedure_code,
      })),
    [data.authCurrent, nonDateFilters],
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
  const continuity = useMemo(() => computeAuthorizationContinuity(auths, today), [auths, today]);

  /**
   * Authorization workflow records are NEVER pre-filtered by one fallback date.
   * A single `date` field would collapse received / submitted / approved /
   * denied / due into one column and silently drop an approval that landed in
   * the selected range because its submission happened earlier. State, client,
   * payor, service code and status still apply; the selected range is applied
   * downstream, per real recorded date, by each helper that needs it.
   */
  const actions = useMemo(
    () =>
      applyFilters(data.authActions, nonDateFilters, (r) => ({
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        code: r.service_code,
        status: r.status,
      })),
    [data.authActions, nonDateFilters],
  );

  const progressReports = useMemo(
    () => computeProgressReportOps(events, actions),
    [events, actions],
  );

  const queues = useMemo(
    () => computeAuthorizationActionQueues(actions, range, today),
    [actions, range, today],
  );

  /**
   * Turnaround averages are range-scoped on the completing event: a documented
   * receipt -> submission pair counts when its real submitted date is in range,
   * and a submission -> decision pair when its real decision date is in range.
   */
  const timelines = useMemo(
    () => computeAuthorizationActionTimelines(actions, range),
    [actions, range],
  );

  const codeCounts = useMemo(
    () => computeCodeEventCounts(actions, ["97151", "97153"], range),
    [actions, range],
  );

  const kindCounts = useMemo(() => computeKindEventCounts(actions, range), [actions, range]);

  /**
   * Selected-range service activity for clients whose *current* snapshot shows no
   * coverage. These are confirmation candidates, never confirmed pauses.
   */
  const serviceActivityFacts = useMemo(
    () =>
      applyFilters(data.billingFacts, filters, (r) => ({
        date: r.date_of_service,
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        code: r.procedure_code,
      })),
    [data.billingFacts, filters],
  );

  const serviceWithoutCoverage = useMemo(
    () =>
      computeServiceActivityWithoutCoverage(
        serviceActivityFacts,
        continuity.clientsWithoutCoverage.map((c) => ({
          client: c.client,
          clientCrId: c.clientCrId,
          state: c.state,
          payor: c.payor,
          lastEnd: c.lastEnd,
        })),
      ),
    [serviceActivityFacts, continuity.clientsWithoutCoverage],
  );

  const pauses = useMemo(
    () =>
      computePauseOps(
        events,
        continuity.clientsWithoutCoverage.map((c) => ({
          client: c.client,
          state: c.state,
          payor: c.payor,
          lastEnd: c.lastEnd,
          note: c.note,
        })),
      ),
    [events, continuity.clientsWithoutCoverage],
  );

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
      {
        id: "pending-submissions",
        label: "Pending submissions",
        value: fmtCount(queues.pendingSubmissions.length),
        hint: `Current open work · received with no submitted date recorded, and not resolved. ${OPEN_WORK_SCOPE_HINT}`,
        tone: queues.pendingSubmissions.length > 0 ? ("warn" as const) : ("good" as const),
      },
      {
        id: "pending-decisions",
        label: "Pending decisions",
        value: fmtCount(queues.pendingDecisions.length),
        hint: `Current open work · submitted with no approval or denial date recorded, and not resolved. ${OPEN_WORK_SCOPE_HINT}`,
        tone: queues.pendingDecisions.length > 0 ? ("warn" as const) : ("good" as const),
      },
      {
        id: "overdue-actions",
        label: "Overdue actions",
        value: fmtCount(queues.overdueActions.length),
        hint: `Current open work · unresolved past a real recorded due date; a missing due date is never overdue. ${OPEN_WORK_SCOPE_HINT}`,
        tone: queues.overdueActions.length > 0 ? ("bad" as const) : ("good" as const),
      },
      {
        id: "reassessment",
        label: "Reassessment / reauth work",
        value: fmtCount(queues.reassessmentWork.length),
        hint: `Current open work · open reauthorization records. ${OPEN_WORK_SCOPE_HINT}`,
      },
      {
        id: "source-denials",
        label: "Denials (source dated)",
        value: fmtCount(queues.denials.length),
        hint:
          queues.denialRatePct == null
            ? `No recorded decisions in this range — denial rate is ${NOT_DOCUMENTED}`
            : `${fmtPct(queues.denialRatePct)} of ${fmtCount(queues.decisionsInRange)} recorded decisions`,
        tone: queues.denials.length > 0 ? ("bad" as const) : ("good" as const),
      },
      {
        id: "receipt-to-submission",
        label: "Receipt → submission",
        value:
          timelines.avgReceivedToSubmittedDays == null
            ? NOT_DOCUMENTED
            : `${timelines.avgReceivedToSubmittedDays} day(s)`,
        hint: `Average over ${fmtCount(timelines.documentedReceivedToSubmitted)} record(s) whose submission date falls in this range and whose receipt date is documented`,
      },
      {
        id: "submission-to-decision",
        label: "Submission → decision",
        value:
          timelines.avgSubmittedToDecisionDays == null
            ? NOT_DOCUMENTED
            : `${timelines.avgSubmittedToDecisionDays} day(s)`,
        hint: `Average over ${fmtCount(timelines.documentedSubmittedToDecision)} record(s) whose decision date falls in this range and whose submission date is documented`,
      },
      {
        id: "service-gap",
        label: "Service activity, no coverage",
        value: fmtCount(serviceWithoutCoverage.length),
        hint: "Clients with billed activity in this range and no current coverage — needs confirmation",
        tone: serviceWithoutCoverage.length > 0 ? ("warn" as const) : ("good" as const),
      },
    ],
    [continuity, lifecycle, queues, timelines, serviceWithoutCoverage],
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
      rows: events.filter(predicate).map(projectLifecycleEvent),
      columns: LIFECYCLE_DRILLDOWN_COLUMNS,
      exportName,
    });
  };

  const openQueue = (title: string, subtitle: string, rows: ActionQueueRow[], exportName: string) =>
    setDrilldown({
      title,
      subtitle,
      rows: projectQueueRows(rows),
      columns: QUEUE_DRILLDOWN_COLUMNS,
      exportName,
    });

  const QUEUE_KPIS: Record<string, { title: string; rows: () => ActionQueueRow[] }> = {
    "pending-submissions": {
      title: "Pending submissions",
      rows: () => queues.pendingSubmissions,
    },
    "pending-decisions": { title: "Pending decisions", rows: () => queues.pendingDecisions },
    "overdue-actions": { title: "Overdue unresolved actions", rows: () => queues.overdueActions },
    reassessment: { title: "Reassessment / reauthorization work", rows: () => queues.reassessmentWork },
    "source-denials": { title: "Denials (source dated)", rows: () => queues.denials },
  };

  const handleKpi = (id: string) => {
    const queueKpi = QUEUE_KPIS[id];
    if (queueKpi) {
      setTab("lifecycle");
      return openQueue(
        queueKpi.title,
        "Authorization workflow records behind this number. Resolved work is shown for history only.",
        queueKpi.rows(),
        `authorization-${id}`,
      );
    }
    if (id === "service-gap") {
      setTab("pauses");
      return setDrilldown({
        title: "Service activity with no current coverage — needs confirmation",
        subtitle:
          "Clients with billed activity in the selected range whose current snapshot shows no coverage. This is a question for staff, not a confirmed pause.",
        rows: projectServiceGapRows(serviceWithoutCoverage),
        columns: SERVICE_GAP_DRILLDOWN_COLUMNS,
        exportName: "authorization-service-activity-no-coverage",
      });
    }
    const timelineKpi = TIMELINE_DENOMINATOR_ROWS.find((t) => t.key === id);
    if (timelineKpi) {
      setTab("lifecycle");
      return setDrilldown({
        title: timelineKpi.label,
        subtitle: timelineKpi.drilldownSubtitle,
        rows: projectTimelineRows(timelines.rows),
        columns: TIMELINE_DRILLDOWN_COLUMNS,
        exportName: `authorization-${timelineKpi.key}`,
      });
    }
    if (id === "submitted" || id === "denied") {
      setTab("lifecycle");
      if (!lifecycle.hasEvents) return;
      return openLifecycle(
        id === "denied" ? "Denials logged" : "Submissions logged",
        "Authorization events behind this number.",
        (e) =>
          classifyLifecycleEvent(e.event_type, eventKindInput(e)).action ===
          (id === "denied" ? "denied" : "submitted"),
        `authorization-${id}`,
      );
    }
    if (id === "gaps") {
      setTab("pauses");
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
      render: (r) => (
        <span className="tabular-nums">
          {r.authorizedHours == null ? "—" : fmtHours(r.authorizedHours)}
        </span>
      ),
    },
    {
      key: "remaining",
      label: "Remaining hrs",
      align: "right",
      render: (r) => (
        <span className="tabular-nums">
          {r.remainingHours == null ? "—" : fmtHours(r.remainingHours)}
        </span>
      ),
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
    const projection = buildAuthorizationTabExport(tab, {
      events,
      byKind: lifecycle.byKind,
      continuityRows: continuity.rows,
      progress: progressReports,
      pauses,
    });
    downloadCsv(projection.name, projection.rows, projection.columns);
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
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setLogOpen(true)}
            >
              Log authorization event
            </Button>
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
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
        </>
      }
    >
      <div className="space-y-5">
        <ReportProvenance>
          <strong>Current coverage is a current snapshot.</strong> Coverage, hours, and expiry read
          the latest version of each authorization, so the selected date range is deliberately not
          applied to it — the range filters workflow events, recorded actions, and service activity
          only. Lifecycle outcomes and dates come only from real recorded events and dates; a
          submission, approval, denial, progress report, reassessment, or pause is never inferred
          from an authorization start date. Missing, malformed, or reversed timestamps read
          "{NOT_DOCUMENTED}" rather than zero, while a genuine same-day turnaround is 0 days.
          Workflow records are never pre-filtered by a single fallback date, so an approval or denial
          inside the range still counts when its submission happened earlier; the open queues are a
          current backlog and the range never hides them. Resolved work stays visible for history but never counts as pending or overdue, and a
          denial with an open appeal or next-action requirement stays unresolved. Renewal readiness
          and coverage-gap candidates are always something to confirm, never a confirmed pause.
        </ReportProvenance>

        <KpiScorecards kpis={kpis} onSelect={handleKpi} />

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="h-9">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="text-xs">
                {t.label}
              </TabsTrigger>
            ))}
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
            <div className="grid gap-4 lg:grid-cols-2">
              <PrimaryTable
                title="Source-dated activity by service code"
                subtitle="97151 and 97153 submitted, approved, and denied. Each date is range-filtered on its own."
                rows={codeCounts}
                rowKey={(r) => r.key}
                columns={SOURCE_COUNT_COLUMNS}
                emptyLabel="No 97151 or 97153 workflow records for these filters."
              />
              <PrimaryTable
                title="Source-dated activity by authorization kind"
                subtitle="IA, IT, RA, and PR submitted, approved, and denied events inside the selected range."
                rows={kindCounts}
                rowKey={(r) => r.key}
                columns={SOURCE_COUNT_COLUMNS}
                emptyLabel="No authorization workflow records for these filters."
              />
            </div>

            <PrimaryTable
              title="Turnaround averages — what is actually counted"
              subtitle="Each average has its own denominator. A pair only counts when the event that completes it happened inside the selected range; missing, malformed and reversed dates read Not documented and are never counted as zero. A genuine same-day turnaround is 0 days."
              rows={TIMELINE_DENOMINATOR_ROWS}
              rowKey={(r) => r.key}
              columns={[
                { key: "label", label: "Measure", render: (r) => r.label },
                {
                  key: "average",
                  label: "Average",
                  align: "right",
                  render: (r) => {
                    const avg = r.average(timelines);
                    return avg == null ? (
                      <span className="text-[10px] text-muted-foreground">{NOT_DOCUMENTED}</span>
                    ) : (
                      <span className="tabular-nums">{avg} day(s)</span>
                    );
                  },
                },
                {
                  key: "counted",
                  label: "Counted (denominator)",
                  align: "right",
                  render: (r) => <span className="tabular-nums">{fmtCount(r.counted(timelines))}</span>,
                },
                {
                  key: "outOfRange",
                  label: "Documented, outside range",
                  align: "right",
                  render: (r) => (
                    <span className="tabular-nums">{fmtCount(r.outOfRange(timelines))}</span>
                  ),
                },
                {
                  key: "notDocumented",
                  label: NOT_DOCUMENTED,
                  align: "right",
                  render: (r) => (
                    <span className="tabular-nums">{fmtCount(r.notDocumented(timelines))}</span>
                  ),
                },
              ]}
              onRowClick={(r) =>
                setDrilldown({
                  title: r.label,
                  subtitle: r.drilldownSubtitle,
                  rows: projectTimelineRows(timelines.rows),
                  columns: TIMELINE_DRILLDOWN_COLUMNS,
                  exportName: `authorization-${r.key}`,
                })
              }
            />

            <PrimaryTable
              title="Open authorization work"
              subtitle={`Pending submissions, pending decisions, overdue actions, and reassessment work. Current open work; ${OPEN_WORK_SCOPE_HINT.charAt(0).toLowerCase()}${OPEN_WORK_SCOPE_HINT.slice(1)} Resolved records stay visible in the drilldowns for history but never count as pending or overdue.`}
              rows={QUEUE_SUMMARY_ROWS.map((q) => ({
                key: q.key,
                label: q.label,
                value: q.rows(queues).length,
                note: q.note,
              }))}
              rowKey={(r) => r.key}
              columns={[
                { key: "label", label: "Queue", render: (r) => r.label },
                {
                  key: "value",
                  label: "Records",
                  align: "right",
                  render: (r) => <span className="tabular-nums">{fmtCount(r.value)}</span>,
                },
                {
                  key: "note",
                  label: "Rule",
                  render: (r) => <span className="text-[11px] text-muted-foreground">{r.note}</span>,
                },
              ]}
              onRowClick={(r) =>
                openQueue(
                  r.label,
                  "Authorization workflow records behind this queue.",
                  QUEUE_SUMMARY_ROWS.find((q) => q.key === r.key)?.rows(queues) ?? [],
                  `authorization-queue-${r.key}`,
                )
              }
            />

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
                  title="Logged authorization events"
                  subtitle="Every event behind the lifecycle numbers, with where it was logged from."
                  rows={events.slice(0, 500).map((e, i) => ({
                    key: `${e.record_id ?? i}`,
                    ...projectLifecycleEvent(e),
                  }))}
                  rowKey={(r) => r.key}
                  columns={[
                    { key: "eventDate", label: "Event date", render: (r) => fmtDate(r.eventDate) },
                    { key: "client", label: "Client", render: (r) => r.client },
                    { key: "eventType", label: "Event type", render: (r) => r.eventType },
                    { key: "kind", label: "Authorization kind", render: (r) => r.kind },
                    { key: "action", label: "Outcome", render: (r) => r.action },
                    { key: "source", label: "Source", render: (r) => r.source },
                  ]}
                  emptyLabel="No logged authorization events for these filters."
                />
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
                      (e) =>
                        classifyLifecycleEvent(e.event_type, eventKindInput(e)).kind === k.kind,
                      `authorization-lifecycle-${k.kind}`,
                    )
                  }
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="progress-reports" className="mt-3 space-y-4">
            {!progressReports.hasEvents && progressReports.dueRows.length === 0 ? (
              <ReportInsufficientData
                title="No progress-report activity for this range"
                detail="Progress-report counts come only from logged progress-report events, and due dates come only from the recorded next-action or appeal due date. Neither exists for the selected filters, so nothing is shown rather than a zero that looks like a fact."
              />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    { label: "PR submitted", value: progressReports.submitted },
                    { label: "PR approved", value: progressReports.approved },
                    { label: "PR denied", value: progressReports.denied },
                    { label: "PR resubmitted", value: progressReports.resubmitted },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-border/60 bg-card p-3">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {s.label}
                      </p>
                      <p className="text-xl font-semibold tabular-nums">{fmtCount(s.value)}</p>
                    </div>
                  ))}
                </div>

                <PrimaryTable
                  title="Progress-report events"
                  subtitle="True logged progress-report events only — an approval never implies a submission that was not logged."
                  rows={progressReports.events}
                  rowKey={(r) => r.key}
                  columns={[
                    { key: "date", label: "Event date", render: (r) => fmtDate(r.eventDate) },
                    { key: "client", label: "Client", render: (r) => r.client },
                    { key: "auth", label: "Authorization #", render: (r) => r.authorizationNumber },
                    { key: "outcome", label: "Outcome", render: (r) => r.outcome },
                    { key: "payor", label: "Payor", render: (r) => r.payor },
                    { key: "state", label: "State", render: (r) => r.state },
                    { key: "reason", label: "Reason / note", render: (r) => r.reason },
                    { key: "source", label: "Logged from", render: (r) => r.source },
                  ]}
                  emptyLabel="No progress-report events logged for these filters."
                />

                <PrimaryTable
                  title="Next actions and due dates"
                  subtitle="Overdue is only ever computed from a recorded next-action or appeal due date. Rows without one say so."
                  rows={progressReports.dueRows}
                  rowKey={(r) => r.key}
                  columns={
                    [
                      { key: "client", label: "Client", render: (r) => r.client },
                      {
                        key: "auth",
                        label: "Authorization #",
                        render: (r) => r.authorizationNumber,
                      },
                      { key: "status", label: "Stage", render: (r) => r.status },
                      { key: "nextAction", label: "Next action", render: (r) => r.nextAction },
                      {
                        key: "due",
                        label: "Due",
                        align: "right",
                        render: (r) =>
                          r.dueDate ? (
                            <span className="tabular-nums">{fmtDate(r.dueDate)}</span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              {NO_AUTHORITATIVE_DUE}
                            </span>
                          ),
                      },
                      {
                        key: "state",
                        label: "Status",
                        align: "right",
                        render: (r) => (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              r.overdue
                                ? "bg-destructive/10 text-destructive border border-destructive/30"
                                : r.dueSource === "none"
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                            }`}
                          >
                            {r.overdue
                              ? "Overdue"
                              : r.dueSource === "none"
                                ? "No due date"
                                : "On track"}
                          </span>
                        ),
                      },
                    ] as PrimaryTableColumn<ProgressReportDueRow>[]
                  }
                  emptyLabel="No operational authorization actions match these filters."
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="pauses" className="mt-3 space-y-4">
            <PrimaryTable
              title="Service activity with no current coverage — needs confirmation"
              subtitle="One row per client: billed activity inside the selected range for a client whose current snapshot shows no coverage. Client identity is matched on the CentralReach client id first. These are questions, never confirmed pauses or violations."
              rows={serviceWithoutCoverage}
              rowKey={(r) => r.key}
              columns={[
                { key: "client", label: "Client", render: (r) => r.client },
                { key: "state", label: "State", render: (r) => r.state },
                { key: "payor", label: "Payor", render: (r) => r.payor },
                {
                  key: "sessions",
                  label: "Sessions in range",
                  align: "right",
                  render: (r) => <span className="tabular-nums">{fmtCount(r.sessions)}</span>,
                },
                {
                  key: "hours",
                  label: "Recorded hours in range",
                  align: "right",
                  render: (r) => (
                    <span className="flex flex-col items-end">
                      <span className="tabular-nums">{fmtHours(r.hours)}</span>
                      {r.missingHours > 0 && (
                        <span className="text-[10px] text-amber-600">
                          {r.missingHours} session(s) missing hours
                        </span>
                      )}
                    </span>
                  ),
                },
                {
                  key: "lastEnd",
                  label: "Last coverage end",
                  align: "right",
                  render: (r) =>
                    r.lastEnd ? (
                      <span className="tabular-nums">{fmtDate(r.lastEnd)}</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">{NOT_DOCUMENTED}</span>
                    ),
                },
                {
                  key: "confirm",
                  label: "Status",
                  align: "right",
                  render: () => (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                      Needs Confirmation
                    </span>
                  ),
                },
              ]}
              emptyLabel="No billed activity in this range for a client without current coverage."
              onRowClick={(r) =>
                setDrilldown({
                  title: `${r.client} · service activity with no current coverage`,
                  subtitle: r.note,
                  rows: projectServiceGapRows([r]),
                  columns: SERVICE_GAP_DRILLDOWN_COLUMNS,
                  exportName: "authorization-service-activity-no-coverage",
                })
              }
            />

            <PrimaryTable
              title="Confirmed pauses"
              subtitle="Pause events actually logged by the authorization team, with the reason as recorded."
              rows={pauses.confirmedPauses}
              rowKey={(r) => r.key}
              columns={[
                { key: "date", label: "Pause date", render: (r) => fmtDate(r.eventDate) },
                { key: "client", label: "Client", render: (r) => r.client },
                { key: "auth", label: "Authorization #", render: (r) => r.authorizationNumber },
                { key: "reason", label: "Reason", render: (r) => r.reason },
                { key: "payor", label: "Payor", render: (r) => r.payor },
                { key: "state", label: "State", render: (r) => r.state },
                { key: "source", label: "Logged from", render: (r) => r.source },
              ]}
              emptyLabel="No pause events have been logged for these filters."
            />

            <PrimaryTable
              title="Coverage-gap candidates · Needs Confirmation"
              subtitle="Clients with no active authorization in the snapshot. These are questions to confirm, not confirmed pauses."
              rows={pauses.candidates}
              rowKey={(r) => r.key}
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
                {
                  key: "confirm",
                  label: "Status",
                  align: "right",
                  render: () => (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                      Needs Confirmation
                    </span>
                  ),
                },
              ]}
              emptyLabel="Every client in view has active authorization coverage today."
            />
          </TabsContent>

        </Tabs>
      </div>

      <LogAuthEventDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        onSubmit={async (input) => {
          const err = await logEvent(input);
          if (!err) data.refresh();
          return err;
        }}
        clients={filterFields.find((f) => f.key === "client")?.options ?? []}
        payors={filterFields.find((f) => f.key === "payor")?.options ?? []}
      />

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}
