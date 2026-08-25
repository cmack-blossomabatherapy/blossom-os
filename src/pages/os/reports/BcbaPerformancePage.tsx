/**
 * Primary report: BCBA Performance (`bcba-performance`) — Phase 2B1 repair B.
 *
 * **No composite score, no average score, no ranking.** Each dimension stands
 * on its own numerator/denominator or event basis, with the source (or the
 * explicitly named proxy) that proves it, and the overall status is the worst
 * applicable dimension. Fewer than three measurable dimensions reads
 * Insufficient Data rather than pretending to be a judgement.
 *
 * The window defaults to the current month and is compared against the
 * immediately prior equal-length window, so hours are read as a trend rather
 * than a single number.
 *
 * "Incentive progress" is a separate tab that reports only the recorded target,
 * actual, and forecast — it never invents an eligible/not-eligible gate.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { localIsoDate, withCurrentMonthDefault } from "@/lib/os/reports/crPrimary/reportWindow";
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
import {
  CODE_DIRECT,
  CODE_PARENT_TRAINING,
  CODE_SUPERVISION,
  hoursOf,
  normalizeCode,
} from "@/lib/os/reports/crPrimary/metrics/codes";
import {
  computeAuthorizationContinuity,
  daysBetween,
} from "@/lib/os/reports/crPrimary/metrics/authorizationContinuity";
import {
  isActionResolved,
  isProgressReportAction,
  validDay,
} from "@/lib/os/reports/crPrimary/metrics/authorizationActions";
import { inDayRange } from "@/lib/os/reports/dateKey";


import { classifyLifecycleEvent } from "@/lib/os/reports/crPrimary/metrics/authorizationLifecycle";
import { computeParentTrainingAnalysis } from "@/lib/os/reports/crPrimary/metrics/parentTrainingV2";
import {
  DOCUMENTATION_LATE_DAYS,
  DOCUMENTATION_PROXY_LABEL,
  PERFORMANCE_STATUS_LABELS,
  REAL_DEADLINE_WINDOW_DAYS,
  SUPERVISION_BENCHMARK_LABEL,
  SUPERVISION_BENCHMARK_PCT,
  computeBcbaPerformanceAnalysis,
  priorEqualWindow,
  resolveIncentiveFigures,
  resolveTargetHours,
  selectApplicableTargets,

  windowElapsedProportion,
  type BcbaPerformanceInput,
  type BcbaPerformanceRow,
  type IncentiveProgressRow,
  type PerformanceStatus,
} from "@/lib/os/reports/crPrimary/metrics/bcbaPerformanceV2";
import { pushRecent } from "@/lib/os/reportsCatalog";

const FILTER_FIELDS = ["state", "client", "payor", "provider"] as const;
const FILTER_LABELS: Record<string, string> = {
  state: "State",
  client: "Client",
  payor: "Payor",
  provider: "Provider",
};

const STATUS_TONE: Record<PerformanceStatus, string> = {
  strong: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
  on_track: "bg-primary/10 text-primary border border-primary/30",
  needs_attention: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  at_risk: "bg-destructive/10 text-destructive border border-destructive/30",
  insufficient_data: "bg-muted text-muted-foreground",
};

const STATUS_COLUMNS = [
  { key: "bcba", label: "BCBA" },
  { key: "status", label: "Overall Status" },
  { key: "currentHours", label: "Owned Hrs (Current)" },
  { key: "priorHours", label: "Owned Hrs (Prior)" },
  { key: "deltaHours", label: "Delta Hrs" },
  { key: "deltaPct", label: "Delta %" },
  { key: "targetHours", label: "Target Hrs" },
  { key: "productivity", label: "Productivity" },
  { key: "supervision", label: "Supervision" },
  { key: "parentTraining", label: "Parent Training Cadence" },
  { key: "readiness", label: "Authorization / PR Readiness" },
  { key: "documentation", label: "Documentation Timeliness" },
  { key: "measurableCount", label: "Measurable Dimensions" },
  { key: "clients", label: "Clients" },
  { key: "rbts", label: "RBTs" },
  { key: "states", label: "States" },
  { key: "drivers", label: "Status Driven By" },
  { key: "reasons", label: "Reasons" },
  { key: "action", label: "Relevant Action" },
];

const INCENTIVE_COLUMNS = [
  { key: "bcba", label: "BCBA" },
  { key: "actualHours", label: "Recorded Actual Hrs" },
  { key: "targetHours", label: "Recorded Target Hrs" },
  { key: "forecastHours", label: "Recorded Forecast Hrs" },
  { key: "actualAttainmentPct", label: "Actual Attainment %" },
  { key: "forecastAttainmentPct", label: "Forecast Attainment %" },
  { key: "note", label: "Notes" },
];

const DIMENSION_COLUMNS = [
  { key: "dimension", label: "Dimension" },
  { key: "status", label: "Status" },
  { key: "pace", label: "Pace %" },
  { key: "basis", label: "Basis" },
  { key: "source", label: "Source / Proxy" },
  { key: "reason", label: "Reason" },
];

const statusOf = (r: BcbaPerformanceRow, key: string) => {
  const d = r.dimensions.find((x) => x.key === key);
  return d ? PERFORMANCE_STATUS_LABELS[d.status] : "Insufficient Data";
};

/** Every reason behind the overall status, in the words of each dimension. */
const statusReasons = (r: BcbaPerformanceRow): string[] =>
  r.dimensions
    .filter((d) => d.status === r.status)
    .map((d) => `${d.label}: ${d.reason}`);

/** The single next step staff should take for this BCBA. */
const relevantAction = (r: BcbaPerformanceRow): string => {
  if (r.status === "at_risk") {
    return "Review with the BCBA now — confirm coverage, documentation, and reporting before scheduling more hours.";
  }
  if (r.status === "needs_attention") {
    return "Check in this week on the flagged dimension and the nearest documented deadline.";
  }
  if (r.status === "insufficient_data") {
    return "Complete the missing source records so this BCBA can be measured.";
  }
  return "No action needed — keep the current cadence.";
};

const projectRows = (rows: BcbaPerformanceRow[]): Record<string, unknown>[] =>
  rows.map((r) => ({
    bcba: r.bcba,
    status: PERFORMANCE_STATUS_LABELS[r.status],
    currentHours: r.currentHours,
    priorHours: r.priorHours,
    deltaHours: r.deltaHours,
    deltaPct: r.deltaPct ?? "No prior hours",
    targetHours: r.targetHours ?? "No applicable target",
    productivity: statusOf(r, "productivity"),
    supervision: statusOf(r, "supervision"),
    parentTraining: statusOf(r, "parent_training"),
    readiness: statusOf(r, "authorization_readiness"),
    documentation: statusOf(r, "documentation"),
    measurableCount: r.measurableCount,
    clients: r.clients,
    rbts: r.rbts,
    states: r.states.join(", "),
    drivers: r.drivers.join(", "),
    reasons: statusReasons(r).join(" · ") || "No blocking reason recorded",
    action: relevantAction(r),
  }));

const projectIncentives = (rows: IncentiveProgressRow[]): Record<string, unknown>[] =>
  rows.map((r) => ({
    bcba: r.bcba,
    actualHours: r.actualHours ?? "Not recorded",
    targetHours: r.targetHours ?? "Not recorded",
    forecastHours: r.forecastHours ?? "Not recorded",
    actualAttainmentPct: r.actualAttainmentPct ?? "Not recorded",
    forecastAttainmentPct: r.forecastAttainmentPct ?? "Not recorded",
    note: r.note,
  }));

const DEFAULT_FILTERS = withCurrentMonthDefault(EMPTY_FILTERS);

export default function BcbaPerformancePage() {
  const data = useCrPrimaryReport([
    "billingFacts",
    "authCurrent",
    "authActions",
    "authEvents",
    "bcbaTargets",
  ]);
  const ownership = useBcbaOwnershipV3();
  const [filters, setFilters] = useUrlFilterState<PrimaryReportFilters>(DEFAULT_FILTERS);
  const [tabParam, setTabParam] = useUrlState("tab", "status");
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);
  const tab = tabParam === "incentives" ? "incentives" : "status";

  useEffect(() => {
    pushRecent("bcba-performance");
  }, []);

  const today = useMemo(() => localIsoDate(), []);

  const window = useMemo(
    () => ({
      from: filters.from || DEFAULT_FILTERS.from || today,
      to: filters.to || DEFAULT_FILTERS.to || today,
    }),
    [filters.from, filters.to, today],
  );
  const prior = useMemo(() => priorEqualWindow(window), [window]);
  const elapsed = useMemo(() => windowElapsedProportion(window, today), [window, today]);

  const project = (r: ReportBillingFactRow) => ({
    date: r.date_of_service,
    state: r.state,
    client: r.client_name,
    payor: r.payor,
    provider: r.provider_name,
    code: r.procedure_code,
  });

  // Non-date filters are applied identically to both periods; only the window moves.
  const billing = useMemo(
    () => applyFilters(data.billingFacts, filters, project),
    [data.billingFacts, filters],
  );
  const priorBilling = useMemo(
    () => applyFilters(data.billingFacts, { ...filters, from: prior.from, to: prior.to }, project),
    [data.billingFacts, filters, prior],
  );

  const resolveOwner = useMemo(() => {
    const index = ownership.data;
    return (s: { clientName?: string | null; clientCrId?: string | null; date?: string | null }) =>
      index?.resolve({ clientCrId: s.clientCrId, clientName: s.clientName, date: s.date }).bcba ?? null;
  }, [ownership.data]);

  /**
   * Filters must reach every source, not just billing. Auth current/action/event
   * rows and target rows all carry state/client/payor, so a state filter can
   * never leave unfiltered auth-only clients or readiness facts in the result.
   * These sources carry no rendering provider, so a provider filter can only be
   * honoured by constraining them to clients proven in the filtered billing set.
   */
  const providerFilterActive = Boolean((filters.provider ?? "").trim());
  const eqLower = (a: string | null | undefined, b: string | null | undefined) =>
    String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

  const filteredBillingClientKeys = useMemo(() => {
    const set = new Set<string>();
    for (const r of billing) {
      if (r.is_void || r.deleted) continue;
      const crId = String(r.client_cr_id ?? "").trim().toLowerCase();
      if (crId) set.add(`cr:${crId}`);
      const name = String(r.client_name ?? "").trim().toLowerCase();
      if (name) set.add(`nm:${name}`);
    }
    return set;
  }, [billing]);

  const clientProvenInBilling = useCallback(
    (clientCrId: string | null | undefined, clientName: string | null | undefined) => {
      const crId = String(clientCrId ?? "").trim().toLowerCase();
      if (crId && filteredBillingClientKeys.has(`cr:${crId}`)) return true;
      const name = String(clientName ?? "").trim().toLowerCase();
      return Boolean(name && filteredBillingClientKeys.has(`nm:${name}`));
    },
    [filteredBillingClientKeys],
  );

  const matchesNonDateFilters = useCallback(
    (row: {
      state?: string | null;
      client_name?: string | null;
      client_cr_id?: string | null;
      payor?: string | null;
    }) => {
      if (filters.state && !eqLower(row.state, filters.state)) return false;
      if (filters.client && !eqLower(row.client_name, filters.client)) return false;
      if (filters.payor && !eqLower(row.payor, filters.payor)) return false;
      // Provider-less sources are constrained to the filtered billing clients.
      if (providerFilterActive && !clientProvenInBilling(row.client_cr_id, row.client_name)) {
        return false;
      }
      return true;
    },
    [filters.state, filters.client, filters.payor, providerFilterActive, clientProvenInBilling],
  );

  const authCurrent = useMemo(
    () => data.authCurrent.filter((a) => matchesNonDateFilters(a)),
    [data.authCurrent, matchesNonDateFilters],
  );
  const authActions = useMemo(
    () => data.authActions.filter((a) => matchesNonDateFilters(a)),
    [data.authActions, matchesNonDateFilters],
  );
  const authEvents = useMemo(
    () =>
      data.authEvents.filter(
        (e) =>
          matchesNonDateFilters(e) &&
          // Only pauses recorded inside the selected window count.
          inDayRange(e.event_date, window.from, window.to),
      ),
    [data.authEvents, matchesNonDateFilters, window],
  );
  const bcbaTargets = useMemo(
    () =>
      data.bcbaTargets.filter((t) => !filters.state || eqLower(t.state, filters.state)),
    [data.bcbaTargets, filters.state],
  );

  const analysis = useMemo(() => {
    interface Acc {
      owned: number;
      direct: number;
      supervision: number;
      clients: Set<string>;
      rbts: Set<string>;
      states: Set<string>;
      documentedRows: number;
      lateRows: number;
      missingCreation: number;
    }
    const acc = new Map<string, Acc>();
    const priorHours = new Map<string, number>();

    const ensure = (bcba: string): Acc => {
      if (!acc.has(bcba)) {
        acc.set(bcba, {
          owned: 0,
          direct: 0,
          supervision: 0,
          clients: new Set(),
          rbts: new Set(),
          states: new Set(),
          documentedRows: 0,
          lateRows: 0,
          missingCreation: 0,
        });
      }
      return acc.get(bcba)!;
    };

    for (const r of billing) {
      if (r.is_void || r.deleted) continue;
      const client = String(r.client_name ?? "").trim() || "Unknown client";
      const owner =
        resolveOwner({ clientName: client, clientCrId: r.client_cr_id, date: r.date_of_service }) ??
        "Unassigned";
      const a = ensure(owner);
      const code = normalizeCode(r.procedure_code);
      const hours = hoursOf(r.hours);
      a.clients.add(client);
      if (r.state) a.states.add(String(r.state));

      if (code === CODE_DIRECT) {
        a.direct += hours;
        const provider = String(r.provider_name ?? "").trim();
        if (provider) a.rbts.add(provider);
      } else {
        a.owned += hours;
        if (code === CODE_SUPERVISION) a.supervision += hours;
      }

      // Documentation timeliness proxy: DOS -> billing creation lag.
      const dos = r.date_of_service ? String(r.date_of_service).slice(0, 10) : null;
      const created = r.creation_date ? String(r.creation_date).slice(0, 10) : null;
      if (!dos || !created || Number.isNaN(Date.parse(created))) a.missingCreation += 1;
      else {
        a.documentedRows += 1;
        if (daysBetween(dos, created) > DOCUMENTATION_LATE_DAYS) a.lateRows += 1;
      }
    }

    for (const r of priorBilling) {
      if (r.is_void || r.deleted) continue;
      const code = normalizeCode(r.procedure_code);
      if (code === CODE_DIRECT) continue;
      const client = String(r.client_name ?? "").trim() || "Unknown client";
      const owner =
        resolveOwner({ clientName: client, clientCrId: r.client_cr_id, date: r.date_of_service }) ??
        "Unassigned";
      priorHours.set(owner, (priorHours.get(owner) ?? 0) + hoursOf(r.hours));
    }

    /**
     * Ownership for every readiness record is resolved independently at that
     * record's own relevant date through the canonical V3 adapter, so mid-month
     * ownership changes are preserved. A current-billing owner map would have
     * attributed a March lapse to whoever bills the client today.
     */
    const ownerAt = (
      clientName: string | null | undefined,
      clientCrId: string | null | undefined,
      date: string | null | undefined,
    ): { owner: string | null; fallbackDate: boolean } => {
      const applicable = date ? String(date).slice(0, 10) : null;
      const owner = resolveOwner({
        clientName,
        clientCrId,
        date: applicable ?? window.to,
      });
      return { owner, fallbackDate: !applicable };
    };

    /**
     * Authorization readiness reads the FULL current authorization snapshot
     * through the shared continuity engine.
     *
     * A lapse is **one client identity with no current coverage today**, not one
     * row per historical authorization, and ownership is resolved at that
     * client's actual last valid coverage end date. Only rows classified as real
     * current coverage (active or expiring) can carry a deadline, so future,
     * unknown, inactive, malformed and historical rows never become coverage.
     */
    const continuity = computeAuthorizationContinuity(authCurrent, today);
    const lapses = new Map<string, number>();
    const nearestDeadline = new Map<string, { days: number; basis: string }>();
    const measurable = new Set<string>();

    for (const gap of continuity.clientsWithoutCoverage) {
      const { owner } = ownerAt(gap.client, gap.clientCrId, gap.lastEnd);
      if (!owner) continue;
      measurable.add(owner);
      lapses.set(owner, (lapses.get(owner) ?? 0) + 1);
    }

    for (const row of continuity.rows) {
      if (row.continuity !== "active" && row.continuity !== "expiring") continue;
      const end = validDay(row.endDate);
      if (!end) continue;
      const days = daysBetween(today, end);
      if (days == null || days < 0) continue;
      const { owner, fallbackDate } = ownerAt(row.client, row.clientCrId, end);
      if (!owner) continue;
      measurable.add(owner);
      const suffix = fallbackDate ? " (ownership resolved at window end — fallback)" : "";
      const prev = nearestDeadline.get(owner);
      if (!prev || days < prev.days) {
        nearestDeadline.set(owner, {
          days,
          basis: `${row.client} authorization ends ${end}${suffix}`,
        });
      }
    }

    /**
     * Progress reports: true PR records only, and only a real source-recorded
     * due date. A missing, malformed or impossible date is not a deadline, and
     * resolved work is never overdue.
     */
    const prOverdue = new Map<string, number>();
    for (const action of authActions) {
      if (!isProgressReportAction(action)) continue;
      const client = String(action.client_name ?? "").trim();
      if (!client) continue;
      const due = validDay(action.next_action_due_date) ?? validDay(action.appeal_due_date);
      const recorded =
        validDay(action.submitted_date) ??
        validDay(action.approved_date) ??
        validDay(action.denied_date) ??
        validDay(action.received_date) ??
        validDay(action.updated_at);
      const { owner, fallbackDate } = ownerAt(client, action.client_cr_id, due ?? recorded);
      if (!owner) continue;
      measurable.add(owner);
      const suffix = fallbackDate ? " (ownership resolved at window end — fallback)" : "";
      if (!due) continue;
      const days = daysBetween(today, due);
      if (days == null) continue;
      if (days < 0) {
        if (!isActionResolved(action)) {
          prOverdue.set(owner, (prOverdue.get(owner) ?? 0) + 1);
        }
      } else if (!isActionResolved(action)) {
        const prev = nearestDeadline.get(owner);
        if (!prev || days < prev.days) {
          nearestDeadline.set(owner, {
            days,
            basis: `${client} progress report due ${due}${suffix}`,
          });
        }
      }
    }


    // Confirmed pauses only — a logged pause event, never an inferred gap.
    const pauses = new Map<string, number>();
    for (const e of authEvents) {
      const { action } = classifyLifecycleEvent(e.event_type, e.lifecycle_kind ?? e.auth_type);
      if (action !== "paused") continue;
      const client = String(e.client_name ?? "").trim();
      if (!client) continue;
      const { owner } = ownerAt(client, e.client_cr_id, e.event_date);
      if (!owner) continue;
      measurable.add(owner);
      pauses.set(owner, (pauses.get(owner) ?? 0) + 1);
    }

    // Parent-training cadence uses the source-driven client target model.
    const ptAnalysis = computeParentTrainingAnalysis({
      billed: billing
        .filter((r) => !r.is_void && !r.deleted && normalizeCode(r.procedure_code) === CODE_PARENT_TRAINING)
        .map((r) => ({
          date: r.date_of_service,
          procedureCode: r.procedure_code,
          hours: r.hours,
          clientName: r.client_name,
          clientCrId: r.client_cr_id,
          providerName: r.provider_name,
          payor: r.payor,
          state: r.state,
        })),
      scheduled: [],
      authorizations: authCurrent.map((a) => ({
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
        isActive: a.is_active,
      })),
      activeClients: [],
      resolveOwner,
      window: { from: window.from, to: window.to },
      today,
    });
    const ptWithTarget = new Map<string, number>();
    const ptAtPace = new Map<string, number>();
    for (const c of ptAnalysis.clientRows) {
      if (!c.hasTarget) continue;
      ptWithTarget.set(c.bcba, (ptWithTarget.get(c.bcba) ?? 0) + 1);
      if (!c.belowTarget) ptAtPace.set(c.bcba, (ptAtPace.get(c.bcba) ?? 0) + 1);
    }

    /**
     * Population = union of current-window owners, prior-window owners, BCBAs
     * with an applicable target row, and owners resolved for readiness records.
     * A BCBA with a target or prior hours but no current hours stays visible.
     */
    const population = new Set<string>([...acc.keys(), ...priorHours.keys(), ...measurable]);
    for (const t of selectApplicableTargets(bcbaTargets, window)) {
      const name = String(t.bcba_name ?? "").trim();
      if (name) population.add(name);
    }
    for (const name of ptWithTarget.keys()) population.add(name);

    const inputs: BcbaPerformanceInput[] = [...population].map((bcba) => {
      const a = acc.get(bcba);
      const deadline = nearestDeadline.get(bcba);
      const incentive = resolveIncentiveFigures(bcbaTargets, bcba, window);
      return {
        bcba,
        states: a ? [...a.states].sort() : [],
        clients: a?.clients.size ?? 0,
        rbts: a?.rbts.size ?? 0,
        currentHours: Math.round((a?.owned ?? 0) * 10) / 10,
        priorHours: Math.round((priorHours.get(bcba) ?? 0) * 10) / 10,
        targetHours: resolveTargetHours(bcbaTargets, bcba, window),
        elapsedProportion: elapsed,
        directHours: Math.round((a?.direct ?? 0) * 10) / 10,
        supervisionHours: Math.round((a?.supervision ?? 0) * 10) / 10,
        ptClientsWithTarget: ptWithTarget.get(bcba) ?? 0,
        ptClientsAtPace: ptAtPace.get(bcba) ?? 0,
        readinessMeasurable: measurable.has(bcba),
        nearestDeadlineDays: deadline?.days ?? null,
        nearestDeadlineBasis: deadline?.basis ?? null,
        authLapses: lapses.get(bcba) ?? 0,
        overdueProgressReports: prOverdue.get(bcba) ?? 0,
        confirmedPauses: pauses.get(bcba) ?? 0,
        documentedBillingRows: a?.documentedRows ?? 0,
        lateBillingRows: a?.lateRows ?? 0,
        missingCreationRows: a?.missingCreation ?? 0,
        incentiveActualHours: incentive.actualHours,
        incentiveTargetHours: incentive.targetHours,
        incentiveForecastHours: incentive.forecastHours,
      };
    });

    return computeBcbaPerformanceAnalysis(inputs);
  }, [
    billing,
    priorBilling,
    authCurrent,
    authActions,
    authEvents,
    bcbaTargets,
    resolveOwner,
    window,
    elapsed,
    today,
  ]);


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
        id: "bcbas",
        label: "BCBAs in view",
        value: fmtCount(analysis.rows.length),
        hint: `${fmtHours(analysis.totalCurrentHours)} owned hours attributed`,
      },
      {
        id: "delta",
        label: "Owned hours vs. prior period",
        value: `${analysis.totalDeltaHours >= 0 ? "+" : ""}${fmtHours(analysis.totalDeltaHours)}`,
        hint: `${fmtHours(analysis.totalPriorHours)} in ${prior.from} → ${prior.to}${
          analysis.totalDeltaPct == null ? "" : ` · ${fmtPct(analysis.totalDeltaPct)}`
        }`,
        tone: analysis.totalDeltaHours >= 0 ? "good" : "warn",
      },
      {
        id: "at_risk",
        label: "At risk",
        value: fmtCount(analysis.counts.at_risk),
        hint: "Pace under 75%, late documentation proxy, overdue reporting, auth lapse, or confirmed pause",
        tone: analysis.counts.at_risk > 0 ? "bad" : "good",
      },
      {
        id: "needs_attention",
        label: "Needs attention",
        value: fmtCount(analysis.counts.needs_attention),
        hint: `Pace 75–89.9% or a real deadline within ${REAL_DEADLINE_WINDOW_DAYS} days`,
        tone: analysis.counts.needs_attention > 0 ? "warn" : "good",
      },
      {
        id: "strong",
        label: "Strong or on track",
        value: fmtCount(analysis.counts.strong + analysis.counts.on_track),
        hint: "Every measured dimension at or near its documented target",
        tone: "good",
      },
      {
        id: "insufficient",
        label: "Insufficient data",
        value: fmtCount(analysis.counts.insufficient_data),
        hint: "Fewer than three measurable dimensions, so no status is claimed",
      },
    ],
    [analysis, prior.from, prior.to],
  );

  const dimensionCell = (r: BcbaPerformanceRow, key: string) => {
    const d = r.dimensions.find((x) => x.key === key);
    if (!d) return <span className="text-muted-foreground">—</span>;
    return (
      <Badge variant="outline" className={STATUS_TONE[d.status]}>
        {PERFORMANCE_STATUS_LABELS[d.status]}
        {d.pacePct == null ? "" : ` · ${d.pacePct}%`}
      </Badge>
    );
  };

  const columns: PrimaryTableColumn<BcbaPerformanceRow>[] = [
    { key: "bcba", label: "BCBA", render: (r) => <span className="font-medium">{r.bcba}</span> },
    {
      key: "status",
      label: "Overall",
      render: (r) => (
        <Badge variant="outline" className={STATUS_TONE[r.status]}>
          {PERFORMANCE_STATUS_LABELS[r.status]}
        </Badge>
      ),
    },
    { key: "current", label: "Owned Hrs", align: "right", render: (r) => fmtHours(r.currentHours) },
    { key: "prior", label: "Prior Hrs", align: "right", render: (r) => fmtHours(r.priorHours) },
    {
      key: "delta",
      label: "Delta",
      align: "right",
      render: (r) => (
        <span className={r.deltaHours < 0 ? "text-destructive" : "text-emerald-600"}>
          {r.deltaHours >= 0 ? "+" : ""}
          {fmtHours(r.deltaHours)}
          {r.deltaPct == null ? "" : ` (${fmtPct(r.deltaPct)})`}
        </span>
      ),
    },
    {
      key: "target",
      label: "Target Hrs",
      align: "right",
      render: (r) =>
        r.targetHours == null ? (
          <span className="text-muted-foreground">No applicable target</span>
        ) : (
          fmtHours(r.targetHours)
        ),
    },
    { key: "productivity", label: "Productivity", render: (r) => dimensionCell(r, "productivity") },
    { key: "supervision", label: "Supervision", render: (r) => dimensionCell(r, "supervision") },
    { key: "pt", label: "PT Cadence", render: (r) => dimensionCell(r, "parent_training") },
    { key: "auth", label: "Auth / PR", render: (r) => dimensionCell(r, "authorization_readiness") },
    { key: "docs", label: "Documentation", render: (r) => dimensionCell(r, "documentation") },
    { key: "clients", label: "Clients", align: "right", render: (r) => fmtCount(r.clients) },
    {
      key: "reasons",
      label: "Reasons & action",
      render: (r) => (
        <div className="min-w-[16rem] max-w-[26rem] space-y-1">
          <p className="text-[11px] leading-snug text-muted-foreground">
            {statusReasons(r).join(" · ") || "No blocking reason recorded."}
          </p>
          <p className="text-[11px] font-medium leading-snug">{relevantAction(r)}</p>
        </div>
      ),
    },
  ];

  const incentiveColumns: PrimaryTableColumn<IncentiveProgressRow>[] = [
    { key: "bcba", label: "BCBA", render: (r) => <span className="font-medium">{r.bcba}</span> },
    {
      key: "actual",
      label: "Recorded Actual",
      align: "right",
      render: (r) => (r.actualHours == null ? "Not recorded" : fmtHours(r.actualHours)),
    },
    {
      key: "target",
      label: "Recorded Target",
      align: "right",
      render: (r) => (r.targetHours == null ? "Not recorded" : fmtHours(r.targetHours)),
    },
    {
      key: "forecast",
      label: "Recorded Forecast",
      align: "right",
      render: (r) => (r.forecastHours == null ? "Not recorded" : fmtHours(r.forecastHours)),
    },
    {
      key: "actualAttainment",
      label: "Actual Attainment",
      align: "right",
      render: (r) =>
        r.actualAttainmentPct == null ? "Not recorded" : fmtPct(r.actualAttainmentPct),
    },
    {
      key: "forecastAttainment",
      label: "Forecast Attainment",
      align: "right",
      render: (r) =>
        r.forecastAttainmentPct == null ? "Not recorded" : fmtPct(r.forecastAttainmentPct),
    },
    {
      key: "note",
      label: "Notes",
      render: (r) => <span className="text-muted-foreground">{r.note}</span>,
    },
  ];

  const openDimensions = (r: BcbaPerformanceRow) =>
    setDrilldown({
      title: `${r.bcba} — performance dimensions`,
      subtitle: `Overall: ${PERFORMANCE_STATUS_LABELS[r.status]} · driven by ${r.drivers.join(", ")}`,
      rows: r.dimensions.map((d) => ({
        dimension: d.label,
        status: PERFORMANCE_STATUS_LABELS[d.status],
        pace: d.pacePct ?? "Not paced",
        basis: d.basis,
        source: d.sourceLabel,
        reason: d.reason,
      })),
      columns: DIMENSION_COLUMNS,
      exportName: "bcba-performance-dimensions",
    });

  return (
    <PrimaryReportShell
      title="BCBA Performance"
      subtitle="Productivity, supervision, parent-training cadence, authorization/PR readiness, and documentation timeliness — the worst measured dimension sets the status."
      freshness={data.freshness}
      loading={data.loading || ownership.isLoading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      dataQualityWarnings={[
        analysis.withoutTargets > 0
          ? `${analysis.withoutTargets} BCBA(s) have no target row whose period applies to this window, so their productivity reads Insufficient Data rather than 0%.`
          : "",
        ownership.data?.health?.truncated
          ? "Some billing history could not be loaded, so a few clients may be attributed to Unassigned."
          : "",
      ].filter(Boolean)}
      onRefresh={() => {
        data.refresh();
        ownership.refetch();
      }}
      onExport={() =>
        tab === "incentives"
          ? downloadCsv(
              "bcba-incentive-progress",
              projectIncentives(analysis.incentives),
              INCENTIVE_COLUMNS,
            )
          : downloadCsv("bcba-performance-status", projectRows(analysis.rows), STATUS_COLUMNS)
      }
      exportDisabled={analysis.rows.length === 0}
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
        No composite score is calculated: each dimension reports its own numerator and denominator or
        event basis, and the worst measured dimension sets the overall status. Hours are compared with
        the immediately prior equal-length window ({prior.from} → {prior.to}), attributed to the
        canonical BCBA owner at each date of service. Supervision uses 97155 ÷ 97153 against the{" "}
        {SUPERVISION_BENCHMARK_PCT}% {SUPERVISION_BENCHMARK_LABEL}. Documentation timeliness is a{" "}
        {DOCUMENTATION_PROXY_LABEL} — date of service to billing creation, late beyond{" "}
        {DOCUMENTATION_LATE_DAYS} calendar days — and is not a formal Commit to Submit finding.
        Fewer than three measurable dimensions reads Insufficient Data. Authorization, progress-report,
        and pause facts are attributed to the owner at each record's own relevant date (coverage end
        date, due date, or event date). An authorization lapse is counted once per client with no
        current coverage today — never once per historical authorization row — and only authorizations
        classified as current (active or expiring) create a deadline. Progress-report deadlines come
        only from a real recorded due date; resolved work is never overdue. Coverage-gap candidates
        are never reported as a confirmed service pause: only a logged pause event is.
        {providerFilterActive ? (
          <>
            {" "}
            <strong>Provider filter limitation:</strong> authorization, progress-report, and pause
            records carry no rendering provider, so while a provider filter is active they are shown
            only for clients proven in the filtered billing rows.
          </>
        ) : null}
      </ReportProvenance>


      <Tabs value={tab} onValueChange={setTabParam}>
        <TabsList>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="incentives">Incentive progress</TabsTrigger>
        </TabsList>
      </Tabs>

      <KpiScorecards
        kpis={kpis}
        onSelect={(id) => {
          const rows =
            id === "at_risk"
              ? analysis.atRiskQueue
              : id === "needs_attention"
                ? analysis.attentionQueue
                : id === "insufficient"
                  ? analysis.rows.filter((r) => r.status === "insufficient_data")
                  : analysis.rows;
          setDrilldown({
            title: "BCBA performance",
            subtitle: `${rows.length.toLocaleString("en-US")} BCBA(s) · reasons are shown per dimension in each row`,
            rows: projectRows(rows),
            columns: STATUS_COLUMNS,
            exportName: "bcba-performance-status",
          });
        }}
      />

      {tab === "status" ? (
        <>
          <PrimaryChart
            title="Owned hours by BCBA · current vs. prior period"
            subtitle="Hours only, attributed through the canonical ownership adapter at each date of service."
            type="bar"
            data={analysis.rows
              .slice(0, 15)
              .map((r) => ({ label: r.bcba, value: r.currentHours, secondary: r.priorHours }))}
            valueLabel="Current hours"
            secondaryLabel="Prior period hours"
          />
          <PrimaryTable
            title="BCBA status table"
            subtitle="Sorted worst status first. Click a BCBA for every dimension, its basis, and its reason."
            columns={columns}
            rows={analysis.rows}
            rowKey={(r) => r.bcba}
            onRowClick={openDimensions}
            maxRows={200}
          />
        </>
      ) : (
        <PrimaryTable
          title="Incentive progress"
          subtitle="Recorded target, actual, and forecast only. Eligibility is not decided here."
          columns={incentiveColumns}
          rows={analysis.incentives}
          rowKey={(r) => r.bcba}
          maxRows={200}
        />
      )}

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}
