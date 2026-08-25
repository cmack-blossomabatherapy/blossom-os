/**
 * Authorization Utilization — Hour Based (`authorization-utilization-hour-based`), Phase 2A.
 *
 * Utilization is computed two ways and both are shown side by side:
 *   - Source used hours   — what the CentralReach authorization snapshot says.
 *   - Recomputed hours    — billing facts joined to the authorization, id-first
 *                           (authorization id → CR client id → client name).
 * The variance between them is the operational signal; we never silently pick
 * one. When the selected date range narrows an authorization window, authorized
 * hours are prorated by the number of covered days, and the factor is shown.
 *
 * Rows we cannot compute (no authorized hours, no coverage dates, nothing
 * joined) are labelled with the reason instead of being rendered as 0%.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { withCurrentMonthDefault } from "@/lib/os/reports/crPrimary/reportWindow";
import { computeAuthorizationTrend, type TrendGrain } from "@/lib/os/reports/crPrimary/metrics/authorizationTrends";
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
  UTILIZATION_DATA_STATE_LABELS,
  computeProratedUtilization,
  type ProratedUtilizationRow,
  type UtilizationDataState,
} from "@/lib/os/reports/crPrimary/metrics/authorizationProration";
import {
  classifyContinuityRow,
  selectCoveragePair,
} from "@/lib/os/reports/crPrimary/metrics/authorizationContinuity";
import {
  UTILIZATION_RISK_LABELS,
  numOrNull,
  snapshotWindowMode,
} from "@/lib/os/reports/crPrimary/metrics/authorizationUtilizationScope";
import { buildUtilizationTabExport } from "@/lib/os/reports/crPrimary/metrics/authorizationUtilizationExport";
import { pushRecent } from "@/lib/os/reportsCatalog";

const FILTER_FIELDS = ["state", "client", "payor", "code"] as const;
const FILTER_LABELS: Record<string, string> = {
  state: "State",
  client: "Client",
  payor: "Payor",
  code: "Service Code",
};

const JOIN_LABEL: Record<ProratedUtilizationRow["joinBasis"], string> = {
  authorization_id: "Authorization id",
  unique_fallback: "Client + code + date (single match)",
  ambiguous: "Ambiguous — held back",
  none: "Not joined",
};

const UTILIZATION_COLUMNS = [
  { key: "authorizationNumber", label: "Authorization #" },
  { key: "client", label: "Client" },
  { key: "clientCrId", label: "CR Client Id" },
  { key: "payor", label: "Payor" },
  { key: "state", label: "State" },
  { key: "code", label: "Service Code" },
  { key: "startDate", label: "Coverage Start" },
  { key: "endDate", label: "Coverage End" },
  { key: "authorizedHours", label: "Authorized Hrs (Full Range)" },
  { key: "sourceWindowAuthorizedHours", label: "Authorized Hrs (Source Window)" },
  { key: "proratedAuthorizedHours", label: "Prorated Authorized Hrs" },
  { key: "prorationFactor", label: "Proration Factor" },
  { key: "overlapDays", label: "Days In Range" },
  { key: "coverageDays", label: "Coverage Days" },
  { key: "sourceUsedHours", label: "Used Hrs (CentralReach)" },
  { key: "recomputedUsedHours", label: "Used Hrs (Recomputed)" },
  { key: "varianceHours", label: "Variance Hrs" },
  { key: "joinedSessions", label: "Joined Sessions" },
  { key: "joinBasis", label: "Joined On" },
  { key: "utilizationPct", label: "Utilization %" },
  { key: "sourceRemainingHours", label: "Remaining Hrs (Source)" },
  { key: "remainingHours", label: "Remaining Hrs (Recomputed)" },
  { key: "scheduledHours", label: "Scheduled Hrs" },
  { key: "pendingHours", label: "Pending Hrs" },
  { key: "projectedDemandHours", label: "Projected Demand Hrs" },
  { key: "riskLevel", label: "Exhaustion Risk" },
  { key: "riskReasons", label: "Why" },
  { key: "dataState", label: "Completeness" },
  { key: "note", label: "What This Means" },
];

function projectRows(rows: ProratedUtilizationRow[]): Record<string, unknown>[] {
  return rows.map((r) => ({
    authorizationNumber: r.authorizationNumber,
    client: r.client,
    clientCrId: r.clientCrId,
    payor: r.payor,
    state: r.state,
    code: r.code,
    startDate: r.startDate ?? "Not documented",
    endDate: r.endDate ?? "Not documented",
    authorizedHours: r.authorizedHours ?? "Not documented",
    sourceWindowAuthorizedHours:
      r.sourceWindowAuthorizedHours ?? "Not available for selected window",
    proratedAuthorizedHours: r.proratedAuthorizedHours ?? "Cannot prorate",
    prorationFactor: r.prorationFactor ?? "—",
    overlapDays: r.overlapDays,
    coverageDays: r.coverageDays ?? "Unknown",
    sourceUsedHours: r.sourceUsedHours ?? "Not documented",
    recomputedUsedHours: r.recomputedUsedHours ?? "Not joined",
    varianceHours: r.varianceHours ?? "—",
    joinedSessions: r.joinedSessions,
    joinBasis: JOIN_LABEL[r.joinBasis],
    utilizationPct: r.utilizationPct ?? "Cannot compute",
    sourceRemainingHours:
      r.sourceRemainingHours ?? "Not available for selected window",
    remainingHours: r.remainingHours ?? "Cannot compute",
    scheduledHours: r.scheduledHours ?? "Not available for selected window",
    pendingHours: r.pendingHours ?? "Not available for selected window",
    projectedDemandHours: r.projectedDemandHours ?? "Cannot compute",
    riskLevel: UTILIZATION_RISK_LABELS[r.riskLevel],
    riskReasons: r.riskReasons.join("; "),
    dataState: UTILIZATION_DATA_STATE_LABELS[r.dataState],
    note: r.note,
  }));
}

/** Null totals are reported as undocumented — never rendered as 0 hours. */
const hrsOrNotDocumented = (value: number | null | undefined) =>
  value == null ? "Not documented" : fmtHours(value);

const bandOf = (pctValue: number | null): "under" | "on_track" | "over" | "unknown" =>
  pctValue == null ? "unknown" : pctValue > 105 ? "over" : pctValue < 80 ? "under" : "on_track";

const BAND_TONE: Record<"under" | "on_track" | "over" | "unknown", string> = {
  under: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  on_track: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
  over: "bg-destructive/10 text-destructive border border-destructive/30",
  unknown: "bg-muted text-muted-foreground",
};

const BAND_LABEL: Record<"under" | "on_track" | "over" | "unknown", string> = {
  under: "Under-utilized",
  on_track: "On track",
  over: "Over-utilized",
  unknown: "Cannot compute",
};

type TabKey = "utilization" | "trends" | "reconciliation" | "gaps";

/** Reports open on the current calendar month; Reset returns here. */
const DEFAULT_FILTERS = withCurrentMonthDefault(EMPTY_FILTERS);

export default function AuthorizationUtilizationPage() {
  const data = useCrPrimaryReport(["authCurrent", "billingFacts"]);
  const [filters, setFilters] = useUrlFilterState<PrimaryReportFilters>(DEFAULT_FILTERS);
  const [tabParam, setTabParam] = useUrlState("tab", "utilization");
  const TAB_KEYS: TabKey[] = ["utilization", "trends", "reconciliation", "gaps"];
  const tab = (TAB_KEYS.includes(tabParam as TabKey) ? tabParam : "utilization") as TabKey;
  const setTab = (next: TabKey) => setTabParam(next);
  const [scope, setScope] = useUrlState("scope", "active");
  const [grain, setGrain] = useUrlState("grain", "week");
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);

  useEffect(() => {
    pushRecent("authorization-utilization-hour-based");
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  /**
   * The one matched coverage pair used for scoping, filtering, display and
   * trends. It is the exact same selector call the allocator and the proration
   * make, so allocation, denominator, display and trend always reconcile.
   */
  const pairOf = useCallback(
    (r: CrAuthorizationCurrentRow) =>
      selectCoveragePair(r, { from: filters.from, to: filters.to, today }),
    [filters.from, filters.to, today],
  );

  const scopedAuths = useMemo(() => {
    if (scope === "all") return data.authCurrent;
    /**
     * Default scope is current coverage only, straight from the shared
     * continuity classification: active, or expiring today. Explicitly
     * inactive, future, expired, malformed and unknown-date rows are not
     * active and cannot be utilized inside the selected window.
     */
    return data.authCurrent.filter((r) => {
      const continuity = classifyContinuityRow(r, today).continuity;
      return continuity === "active" || continuity === "expiring";
    });
  }, [data.authCurrent, scope, today]);

  const auths = useMemo(
    () =>
      applyFilters(scopedAuths, filters, (r) => ({
        date: pairOf(r)?.start ?? null,
        endDate: pairOf(r)?.end ?? null,
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        code: r.service_codes ?? r.procedure_code,
      })),
    [scopedAuths, filters, pairOf],
  );

  const billing = useMemo(
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

  const result = useMemo(
    () =>
      computeProratedUtilization(auths, billing, {
        from: filters.from,
        to: filters.to,
        today,
        snapshotWindow: snapshotWindowMode(
          { from: filters.from, to: filters.to },
          today,
          !filters.from && !filters.to,
        ),
      }),
    [auths, billing, filters.from, filters.to, today],
  );

  const trend = useMemo(
    () =>
      computeAuthorizationTrend(
        auths.map((a) => ({
          startDate: pairOf(a)?.start ?? null,
          endDate: pairOf(a)?.end ?? null,
          // Full authorization-range hours, null-safe: never `Number(null)`.
          authorizedHours:
            numOrNull(a.authorized_hours_auth_range) ??
            numOrNull(a.authorized_hours_all) ??
            numOrNull(a.authorized_hours),
        })),
        // Only cleanly allocated billing rows feed the trend: an ambiguous or
        // unjoined row cannot be proven to belong to any authorization.
        result.allocations
          .filter((a) => a.basis === "authorization_id" || a.basis === "unique_fallback")
          .map((a) => ({ date: a.date, hours: a.hours })),
        { from: filters.from, to: filters.to, grain: grain as TrendGrain },
      ),
    [auths, result.allocations, filters.from, filters.to, grain, pairOf],
  );

  const filterFields = useMemo<FilterFieldConfig[]>(
    () =>
      FILTER_FIELDS.map((key) => ({
        key,
        label: FILTER_LABELS[key] ?? key,
        options: optionsFor(scopedAuths, (r: CrAuthorizationCurrentRow) =>
          key === "client"
            ? r.client_name
            : key === "code"
              ? (r.service_codes ?? r.procedure_code)
              : (r[key as "state" | "payor"] as string | null),
        ),
      })),
    [scopedAuths],
  );

  /**
   * Trend pace points that actually have a percentage. An incomplete period is
   * reported as a count, never drawn as a 0% point.
   */
  const pacePoints = useMemo(
    () =>
      trend.pace
        .filter((p) => p.value != null)
        .map((p) => ({ label: p.label, value: p.value as number })),
    [trend.pace],
  );
  const incompletePacePeriods = trend.pace.length - pacePoints.length;

  const totals = result.totals;
  const computable = result.rows.filter((r) => r.dataState === "ok");
  const overUtilized = computable.filter((r) => bandOf(r.utilizationPct) === "over");
  const underUtilized = computable.filter((r) => bandOf(r.utilizationPct) === "under");
  const notJoined = result.rows.filter((r) => r.joinBasis === "none");
  const variances = computable.filter(
    (r) => r.varianceHours != null && Math.abs(r.varianceHours) >= 1,
  );

  const kpis = useMemo(
    () => [
      {
        id: "authorizations",
        label: "Authorizations in view",
        value: fmtCount(totals.authorizations),
        hint: `${fmtCount(totals.complete)} fully computable · ${fmtCount(totals.incomplete)} incomplete`,
      },
      {
        id: "authorized",
        label: result.prorationApplied ? "Prorated authorized hrs" : "Authorized hrs",
        value: hrsOrNotDocumented(
          result.prorationApplied ? totals.proratedAuthorizedHours : totals.authorizedHours,
        ),
        hint: result.prorationApplied
          ? `Prorated to the selected range from ${hrsOrNotDocumented(totals.authorizedHours)} of full-range authorized hours`
          : "Full authorization windows — no proration needed for this range",
      },
      {
        id: "utilization",
        label: "Utilization",
        value: fmtPct(totals.utilizationPct),
        hint: `${fmtCount(totals.comparableAuthorizations)} comparable authorization(s) with both authorized and used hours · ${hrsOrNotDocumented(totals.comparableUsedHours)} used of ${hrsOrNotDocumented(totals.comparableAuthorizedHours)} authorized`,
        tone:
          totals.utilizationPct == null
            ? ("neutral" as const)
            : totals.utilizationPct > 105
              ? ("bad" as const)
              : totals.utilizationPct < 80
                ? ("warn" as const)
                : ("good" as const),
      },
      {
        id: "over",
        label: "Over-utilized",
        value: fmtCount(overUtilized.length),
        hint: "Above 105% of authorized hours",
        tone: overUtilized.length > 0 ? ("bad" as const) : ("good" as const),
      },
      {
        id: "under",
        label: "Under-utilized",
        value: fmtCount(underUtilized.length),
        hint: "Below 80% of authorized hours",
        tone: underUtilized.length > 0 ? ("warn" as const) : ("good" as const),
      },
      {
        id: "variance",
        label: "Hours variance",
        value:
          totals.varianceHours == null
            ? "Not documented"
            : fmtHours(Math.abs(totals.varianceHours)),
        hint:
          totals.variancePct == null
            ? "No comparable hours to reconcile"
            : `${fmtPct(Math.abs(totals.variancePct))} difference between CentralReach and recomputed hours`,
        tone:
          totals.variancePct != null && Math.abs(totals.variancePct) >= 10
            ? ("bad" as const)
            : totals.variancePct != null && Math.abs(totals.variancePct) >= 3
              ? ("warn" as const)
              : ("good" as const),
      },
      {
        id: "not-joined",
        label: "No billing joined",
        value: fmtCount(notJoined.length),
        hint: "Utilization cannot be independently verified for these",
        tone: notJoined.length > 0 ? ("warn" as const) : ("good" as const),
      },
      {
        id: "exhausted",
        label: "Exhausted",
        value: fmtCount(totals.exhausted),
        hint: "No usable authorized hours remain",
        tone: totals.exhausted > 0 ? ("bad" as const) : ("good" as const),
      },
      {
        id: "exhaustion-risk",
        label: "Exhaustion risk",
        value: fmtCount(totals.exhaustionRisk),
        hint: "Projected demand exceeds authorized hours, or 90%+ used with over 14 days left",
        tone: totals.exhaustionRisk > 0 ? ("warn" as const) : ("good" as const),
      },
      {
        id: "projected-demand",
        label: "Projected demand",
        value: hrsOrNotDocumented(totals.projectedDemandHours),
        hint: "Used plus scheduled plus pending hours",
      },
      {
        id: "scheduled",
        label: "Scheduled hrs",
        value: hrsOrNotDocumented(totals.scheduledHours),
        hint: "Booked but not yet billed, for the selected window",
      },
      {
        id: "pending",
        label: "Pending hrs",
        value: hrsOrNotDocumented(totals.pendingHours),
        hint: "Billed but not yet reconciled, for the selected window",
      },
      {
        id: "source-remaining",
        label: "Remaining hrs (source)",
        value: hrsOrNotDocumented(totals.sourceRemainingHours),
        hint: "As CentralReach reports it for the selected window",
      },
      {
        id: "expiring-60",
        label: "Expiring ≤ 60 days",
        value: fmtCount(totals.expiringWithin60),
        hint: "Coverage ends within 60 days",
        tone: totals.expiringWithin60 > 0 ? ("warn" as const) : ("good" as const),
      },
      {
        id: "expiring-30",
        label: "Expiring ≤ 30 days",
        value: fmtCount(totals.expiringWithin30),
        hint: "Coverage ends within 30 days",
        tone: totals.expiringWithin30 > 0 ? ("warn" as const) : ("good" as const),
      },
      {
        id: "incomplete",
        label: "Incomplete rows",
        value: fmtCount(totals.incomplete),
        hint: "Missing authorized hours or coverage dates — shown, never counted as 0%",
        tone: totals.incomplete > 0 ? ("warn" as const) : ("good" as const),
      },
    ],
    [totals, result.prorationApplied, overUtilized.length, underUtilized.length, notJoined.length],
  );

  const open = (title: string, subtitle: string, rows: ProratedUtilizationRow[], name: string) => {
    setDrilldown({
      title,
      subtitle,
      rows: projectRows(rows),
      columns: UTILIZATION_COLUMNS,
      exportName: name,
    });
  };

  const handleKpi = (id: string) => {
    if (id === "over") return open("Over-utilized authorizations", "Above 105% of authorized hours.", overUtilized, "authorization-over-utilized");
    if (id === "under") return open("Under-utilized authorizations", "Below 80% of authorized hours.", underUtilized, "authorization-under-utilized");
    if (id === "not-joined") {
      setTab("gaps");
      return open("Authorizations with no billing joined", "No billing session could be matched to these authorizations, so used hours cannot be verified independently.", notJoined, "authorization-not-joined");
    }
    if (id === "incomplete") {
      setTab("gaps");
      return open("Incomplete authorizations", "These rows are missing the data needed to compute utilization.", result.rows.filter((r) => r.dataState !== "ok"), "authorization-incomplete");
    }
    if (id === "variance") {
      setTab("reconciliation");
      return open("Hours variance", "Authorizations where CentralReach used hours and recomputed billing hours disagree by an hour or more.", variances, "authorization-variance");
    }
    return open("Authorizations", "Every authorization in the current filters.", result.rows, "authorization-utilization");
  };

  const columns: PrimaryTableColumn<ProratedUtilizationRow>[] = [
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
    {
      key: "window",
      label: "Coverage",
      render: (r) => (
        <span className="text-[11px] text-muted-foreground">
          {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
        </span>
      ),
    },
    {
      key: "authorized",
      label: result.prorationApplied ? "Prorated auth hrs" : "Authorized hrs",
      align: "right",
      render: (r) => {
        const value = result.prorationApplied ? r.proratedAuthorizedHours : r.authorizedHours;
        return (
          <span className="tabular-nums">{value == null ? "—" : fmtHours(value)}</span>
        );
      },
    },
    {
      key: "used",
      label: "Used hrs (CR)",
      align: "right",
      render: (r) => (
        <span className="tabular-nums">
          {r.sourceUsedHours == null ? "—" : fmtHours(r.sourceUsedHours)}
        </span>
      ),
    },
    {
      key: "recomputed",
      label: "Used hrs (recomputed)",
      align: "right",
      render: (r) => (
        <span className="tabular-nums">
          {r.recomputedUsedHours == null ? "—" : fmtHours(r.recomputedUsedHours)}
        </span>
      ),
    },
    {
      key: "utilization",
      label: "Utilization",
      align: "right",
      render: (r) => (
        <span className="tabular-nums">
          {r.utilizationPct == null ? "—" : fmtPct(r.utilizationPct)}
        </span>
      ),
    },
    {
      key: "sourceRemaining",
      label: "Remaining (source)",
      align: "right",
      render: (r) => (
        <span className="tabular-nums" title="As CentralReach reports it for this window">
          {r.sourceRemainingHours == null ? "—" : fmtHours(r.sourceRemainingHours)}
        </span>
      ),
    },
    {
      key: "recomputedRemaining",
      label: "Remaining (recomputed)",
      align: "right",
      render: (r) => (
        <span className="tabular-nums" title="Prorated authorized hours minus the used hours">
          {r.remainingHours == null ? "—" : fmtHours(r.remainingHours)}
        </span>
      ),
    },
    {
      key: "scheduled",
      label: "Scheduled",
      align: "right",
      render: (r) => (
        <span className="tabular-nums">
          {r.scheduledHours == null ? "—" : fmtHours(r.scheduledHours)}
        </span>
      ),
    },
    {
      key: "pending",
      label: "Pending",
      align: "right",
      render: (r) => (
        <span className="tabular-nums">
          {r.pendingHours == null ? "—" : fmtHours(r.pendingHours)}
        </span>
      ),
    },
    {
      key: "projected",
      label: "Projected demand",
      align: "right",
      render: (r) => (
        <span className="tabular-nums" title="Used plus scheduled plus pending hours">
          {r.projectedDemandHours == null ? "—" : fmtHours(r.projectedDemandHours)}
        </span>
      ),
    },
    {
      key: "expiry",
      label: "Expires",
      align: "right",
      render: (r) => (
        <span className="text-[11px] text-muted-foreground">
          {r.endDate ? fmtDate(r.endDate) : "Not documented"}
          {r.daysToExpiry != null && (
            <span className="ml-1 tabular-nums">({r.daysToExpiry}d)</span>
          )}
        </span>
      ),
    },
    {
      key: "risk",
      label: "Risk",
      align: "right",
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            r.riskLevel === "exhausted"
              ? "bg-destructive/10 text-destructive border border-destructive/30"
              : r.riskLevel === "at_risk"
                ? "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                : r.riskLevel === "on_track"
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                  : "bg-muted text-muted-foreground"
          }`}
          title={r.riskReasons.join(" ")}
        >
          {UTILIZATION_RISK_LABELS[r.riskLevel]}
        </span>
      ),
    },
    {
      key: "riskWhy",
      label: "Why",
      render: (r) => (
        <span
          className="line-clamp-2 text-[10px] text-muted-foreground"
          title={r.riskReasons.join(" ")}
        >
          {r.riskReasons.join(" ") || "—"}
        </span>
      ),
    },
    {
      key: "band",
      label: "Status",
      align: "right",
      render: (r) => {
        const band = bandOf(r.utilizationPct);
        return (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${BAND_TONE[band]}`}>
            {BAND_LABEL[band]}
          </span>
        );
      },
    },
  ];

  const reconciliationColumns: PrimaryTableColumn<ProratedUtilizationRow>[] = [
    ...columns.slice(0, 3),
    {
      key: "source",
      label: "CentralReach hrs",
      align: "right",
      render: (r) => (
        <span className="tabular-nums">
          {r.sourceUsedHours == null ? "—" : fmtHours(r.sourceUsedHours)}
        </span>
      ),
    },
    {
      key: "recomputed",
      label: "Recomputed hrs",
      align: "right",
      render: (r) => (
        <span className="tabular-nums">
          {r.recomputedUsedHours == null ? "—" : fmtHours(r.recomputedUsedHours)}
        </span>
      ),
    },
    {
      key: "variance",
      label: "Variance",
      align: "right",
      render: (r) => (
        <span
          className={`tabular-nums ${
            r.varianceHours != null && Math.abs(r.varianceHours) >= 5 ? "text-destructive" : ""
          }`}
        >
          {r.varianceHours == null ? "—" : fmtHours(r.varianceHours)}
        </span>
      ),
    },
    {
      key: "sessions",
      label: "Joined sessions",
      align: "right",
      render: (r) => <span className="tabular-nums">{fmtCount(r.joinedSessions)}</span>,
    },
    {
      key: "joinBasis",
      label: "Joined on",
      align: "right",
      render: (r) => (
        <span className="text-[10px] text-muted-foreground">{JOIN_LABEL[r.joinBasis]}</span>
      ),
    },
  ];

  const gapColumns: PrimaryTableColumn<ProratedUtilizationRow>[] = [
    ...columns.slice(0, 3),
    {
      key: "state",
      label: "Why it cannot be computed",
      render: (r) => (
        <div className="min-w-0">
          <p className="text-[11px] font-medium">
            {UTILIZATION_DATA_STATE_LABELS[r.dataState]}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">{r.note}</p>
        </div>
      ),
    },
  ];

  const exportView = () => {
    const projection = buildUtilizationTabExport(tab, {
      utilizationRows: projectRows(result.rows),
      utilizationColumns: UTILIZATION_COLUMNS,
      reconciliationRows: projectRows(variances),
      gapRows: projectRows(result.rows.filter((r) => r.dataState !== "ok")),
      trend,
    });
    downloadCsv(projection.name, projection.rows, projection.columns);
    toast.success("Exported the current utilization view.");
  };

  const dataStateChart = (Object.keys(UTILIZATION_DATA_STATE_LABELS) as UtilizationDataState[])
    .map((key) => ({ label: UTILIZATION_DATA_STATE_LABELS[key], value: result.dataStateCounts[key] }))
    .filter((d) => d.value > 0);

  return (
    <PrimaryReportShell
      title="Authorization Utilization — Hour Based"
      subtitle="Authorized versus used hours per authorization, prorated to the selected range, with CentralReach hours reconciled against hours recomputed from billing."
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      onRefresh={data.refresh}
      onExport={exportView}
      exportDisabled={result.rows.length === 0}
      filters={
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {fmtCount(result.rows.length)} authorizations in view
            </Badge>
            {result.prorationApplied && (
              <Badge variant="outline" className="text-[10px]">
                Prorated to the selected date range
              </Badge>
            )}
            <div className="flex items-center gap-1 rounded-full border border-border/60 p-0.5">
              {(["active", "all"] as const).map((s) => (
                <Button
                  key={s}
                  variant={scope === s ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 rounded-full px-3 text-[11px]"
                  onClick={() => setScope(s)}
                >
                  {s === "active" ? "Active authorizations" : "All authorizations"}
                </Button>
              ))}
            </div>
            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Link to="/reports/authorization-analysis">
                Authorization Command Center <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Link to="/reports/parent-training?code=97156">
                Parent Training · 97156 <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Link to="/reports/bcba-supervision?code=97155">
                BCBA Supervision · 97155 <ArrowUpRight className="h-3.5 w-3.5" />
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
          Authorized hours come from the current authorization snapshot. When your date range covers
          only part of an authorization window, authorized hours are prorated by covered days and the
          factor is shown on every row. Used hours are reported twice — as CentralReach reports them
          and as recomputed from billing sessions matched authorization-id first, then CR client id,
          then client name — so a mismatch is visible rather than hidden.
        </ReportProvenance>

        {(result.allocation.ambiguous > 0 || result.allocation.unjoined > 0) && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-amber-700">
            <p className="font-semibold">Billing allocation notes</p>
            <p>
              {fmtCount(result.allocation.exact)} sessions matched on authorization id,{" "}
              {fmtCount(result.allocation.uniqueFallback)} matched on client, code, and date.{" "}
              {fmtCount(result.allocation.ambiguous)} could match more than one authorization and{" "}
              {fmtCount(result.allocation.unjoined)} matched none, so their hours are held back
              rather than counted against every authorization for that client.
            </p>
          </div>
        )}

        <KpiScorecards kpis={kpis} onSelect={handleKpi} />

        {result.rows.length > 0 && computable.length === 0 ? (
          <ReportInsufficientData
            title="Utilization cannot be computed for any authorization in view"
            detail="Every authorization in this range is missing authorized hours, coverage dates, or joined billing. The Data gaps tab lists the exact reason for each one."
            action={
              <Button size="sm" variant="outline" onClick={() => setTab("gaps")}>
                See data gaps
              </Button>
            }
          />
        ) : null}

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="h-9">
            <TabsTrigger value="utilization" className="text-xs">
              Utilization
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-xs">
              Hour Trends
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="text-xs">
              Reconciliation
            </TabsTrigger>
            <TabsTrigger value="gaps" className="text-xs">
              Data gaps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="utilization" className="mt-3 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <PrimaryChart
                title="Utilization by client · percent"
                subtitle="Percent only, and only rows that actually have a percentage — a missing utilization is omitted rather than drawn as 0%."
                type="bar"
                data={computable
                  .filter((r) => r.utilizationPct != null)
                  .sort((a, b) => (b.utilizationPct as number) - (a.utilizationPct as number))
                  .slice(0, 12)
                  .map((r) => ({ label: r.client, value: r.utilizationPct as number }))}
                valueLabel="Utilization %"
                height={300}
                onSelect={(label) =>
                  open(
                    `Client · ${label}`,
                    "Authorizations for this client in the current filters.",
                    result.rows.filter((r) => r.client === label),
                    `authorization-utilization-${label.toLowerCase().replace(/\s+/g, "-")}`,
                  )
                }
              />
              <PrimaryChart
                title="Hours by client · authorized vs used"
                subtitle="Hours only, and only authorizations where both values are real — a missing side is omitted rather than charted as 0 hours."
                type="bar"
                data={computable
                  .map((r) => ({
                    label: r.client,
                    value: r.proratedAuthorizedHours ?? r.authorizedHours,
                    secondary: r.recomputedUsedHours ?? r.sourceUsedHours,
                  }))
                  .filter(
                    (d): d is { label: string; value: number; secondary: number } =>
                      d.value != null && d.secondary != null,
                  )
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 12)}
                valueLabel="Authorized hours"
                secondaryLabel="Used hours"
                height={300}
                onSelect={(label) =>
                  open(
                    `Client · ${label}`,
                    "Authorizations for this client in the current filters.",
                    result.rows.filter((r) => r.client === label),
                    `authorization-hours-${label.toLowerCase().replace(/\s+/g, "-")}`,
                  )
                }
              />
              <PrimaryChart
                title="Hours by client · authorized vs projected demand"
                subtitle="Hours only. Projected demand is used plus scheduled plus pending; rows missing either side are omitted rather than charted as 0 hours."
                type="bar"
                data={computable
                  .map((r) => ({
                    label: r.client,
                    value: r.proratedAuthorizedHours ?? r.authorizedHours,
                    secondary: r.projectedDemandHours,
                  }))
                  .filter(
                    (d): d is { label: string; value: number; secondary: number } =>
                      d.value != null && d.secondary != null,
                  )
                  .sort((a, b) => b.secondary - a.secondary)
                  .slice(0, 12)}
                valueLabel="Authorized hours"
                secondaryLabel="Projected demand hours"
                height={300}
                onSelect={(label) =>
                  open(
                    `Client · ${label}`,
                    "Authorizations for this client in the current filters.",
                    result.rows.filter((r) => r.client === label),
                    `authorization-demand-${label.toLowerCase().replace(/\s+/g, "-")}`,
                  )
                }
              />
            </div>
            <PrimaryTable
              title="Authorization utilization"
              subtitle="Click any row for the full authorization record, proration factor, and join basis."
              rows={result.rows}
              rowKey={(r) => r.key}
              columns={columns}
              emptyLabel="No authorizations match these filters."
              onRowClick={(r) => open(`${r.client} · ${r.authorizationNumber}`, r.note, [r], `authorization-${r.authorizationNumber.toLowerCase()}`)}
            />
          </TabsContent>

          <TabsContent value="trends" className="mt-3 space-y-4">
            <div className="flex items-center gap-1 rounded-full border border-border/60 p-0.5 w-fit">
              {(["week", "month"] as const).map((g) => (
                <Button
                  key={g}
                  variant={grain === g ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 rounded-full px-3 text-[11px]"
                  onClick={() => setGrain(g)}
                >
                  {g === "week" ? "Weekly" : "Monthly"}
                </Button>
              ))}
            </div>
            {trend.points.length === 0 ? (
              <ReportInsufficientData
                title="No authorized or worked hours to trend"
                detail="A trend needs authorization coverage dates and billed sessions inside the selected range. Neither is present, so no line is drawn."
              />
            ) : (
              <>
                <PrimaryChart
                  title={`Authorized vs used hours · ${trend.grain === "week" ? "weekly" : "monthly"}`}
                  subtitle="Both series are hours, so they share one axis — used hours as bars, authorized hours as the line."
                  type="bar"
                  data={trend.hours}
                  valueLabel="Used hours"
                  secondaryLabel="Authorized hours"
                  height={300}
                />
                <PrimaryChart
                  title="Utilization pace"
                  subtitle={`Percent only. ${pacePoints.length} of ${trend.pace.length} periods have a real pace; ${incompletePacePeriods} period${incompletePacePeriods === 1 ? "" : "s"} could not be calculated and ${incompletePacePeriods === 1 ? "is" : "are"} left off the line rather than drawn as 0%.`}
                  type="line"
                  data={pacePoints}
                  valueLabel="Utilization %"
                  height={240}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="reconciliation" className="mt-3">
            <PrimaryTable
              title="CentralReach hours vs recomputed hours"
              subtitle="Authorizations where the two calculations disagree by an hour or more. Each row shows what the hours were matched on."
              rows={variances}
              rowKey={(r) => r.key}
              columns={reconciliationColumns}
              emptyLabel="CentralReach used hours agree with recomputed billing hours for every authorization in view."
              onRowClick={(r) => open(`${r.client} · ${r.authorizationNumber}`, r.note, [r], `authorization-variance-${r.authorizationNumber.toLowerCase()}`)}
            />
          </TabsContent>

          <TabsContent value="gaps" className="mt-3 space-y-4">
            {dataStateChart.length > 0 && (
              <PrimaryChart
                title="Completeness of the authorization data"
                subtitle="What is stopping a utilization number from being calculated."
                type="bar"
                data={dataStateChart}
                valueLabel="Authorizations"
              />
            )}
            <PrimaryTable
              title="Authorizations that cannot be computed"
              subtitle="Reported explicitly rather than rendered as 0% utilization."
              rows={result.rows.filter((r) => r.dataState !== "ok")}
              rowKey={(r) => r.key}
              columns={gapColumns}
              emptyLabel="Every authorization in view has the data needed to compute utilization."
              onRowClick={(r) => open(`${r.client} · ${r.authorizationNumber}`, r.note, [r], `authorization-gap-${r.authorizationNumber.toLowerCase()}`)}
            />
          </TabsContent>
        </Tabs>
      </div>

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}
