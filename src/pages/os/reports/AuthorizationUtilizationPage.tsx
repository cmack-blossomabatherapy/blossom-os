/**
 * Primary report: Hour-Based Authorization Utilization
 * (`authorization-utilization-hour-based`).
 *
 * Tracks authorized vs used hours per authorization, surfaces expiring,
 * over-utilized, and under-utilized authorizations, and drills into the
 * CentralReach source rows behind every number.
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
import { fmtCount, fmtDate, fmtHours, fmtPct } from "@/lib/os/reports/crPrimary/format";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import {
  AUTH_DRILLDOWN_COLUMNS,
  UTILIZATION_DRILLDOWN_COLUMNS,
  projectAuthRows,
  projectUtilizationRows,
} from "@/lib/os/reports/crPrimary/drilldown";
import {
  EXPIRING_SOON_DAYS,
  computeUtilizationMetrics,
  utilizationBand,
} from "@/lib/os/reports/crPrimary/metrics/authorizationUtilization";
import {
  classifyAuthKind,
  classifyAuthStatus,
} from "@/lib/os/reports/crPrimary/metrics/authorizationAnalysis";
import { normalizeCode } from "@/lib/os/reports/crPrimary/metrics/codes";
import { Badge } from "@/components/ui/badge";

const BAND_TONE = {
  under: "destructive",
  on_track: "secondary",
  over: "destructive",
} as const;

export default function AuthorizationUtilizationPage() {
  const data = useCrPrimaryReport(["authorizations", "utilization"]);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);

  const auths = useMemo(
    () =>
      applyFilters(data.authorizations, filters, (r) => ({
        date: r.start_date ?? r.end_date,
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        code: normalizeCode(r.procedure_code),
        status: r.status,
      })),
    [data.authorizations, filters],
  );

  const utilRows = useMemo(
    () =>
      applyFilters(data.utilization, filters, (r) => ({
        date: r.week_start,
        state: r.state,
        client: r.client_name,
        payor: r.payor,
        code: normalizeCode(r.procedure_code),
      })),
    [data.utilization, filters],
  );

  const metrics = useMemo(() => computeUtilizationMetrics(auths, utilRows), [auths, utilRows]);

  const projectedAuths = useMemo(
    () =>
      projectAuthRows(auths, {
        kind: (r) => classifyAuthKind(r),
        status: (r) => classifyAuthStatus(r),
      }),
    [auths],
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
    ],
    [data.authorizations],
  );

  const kpis: KpiDefinition[] = [
    { id: "authorized", label: "Authorized Hours", value: fmtHours(metrics.authorizedHours) },
    { id: "used", label: "Used Hours", value: fmtHours(metrics.usedHours) },
    { id: "remaining", label: "Remaining Hours", value: fmtHours(metrics.remainingHours) },
    {
      id: "utilization",
      label: "Utilization",
      value: fmtPct(metrics.utilizationPct),
      hint: "Used ÷ authorized hours",
      tone: metrics.utilizationPct > 100 ? "bad" : metrics.utilizationPct < 70 ? "warn" : "good",
    },
    { id: "auths", label: "Authorizations", value: fmtCount(metrics.authCount) },
    {
      id: "expiring",
      label: `Expiring ≤ ${EXPIRING_SOON_DAYS}d`,
      value: fmtCount(metrics.expiringSoon),
      tone: metrics.expiringSoon > 0 ? "warn" : "good",
    },
    {
      id: "over",
      label: "Over-Utilized",
      value: fmtCount(metrics.overUtilized),
      tone: metrics.overUtilized > 0 ? "bad" : "good",
    },
    {
      id: "under",
      label: "Under-Utilized",
      value: fmtCount(metrics.underUtilized),
      tone: metrics.underUtilized > 0 ? "warn" : "good",
    },
  ];

  const openAuthDrilldown = (title: string, predicate: (index: number) => boolean) => {
    setDrilldown({
      title,
      subtitle: "CentralReach authorization rows with hour totals and matched Blossom context.",
      rows: projectedAuths.filter((_, i) => predicate(i)),
      columns: AUTH_DRILLDOWN_COLUMNS,
      exportName: `authorization-utilization-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    });
  };

  const onKpi = (id: string) => {
    if (id === "expiring") {
      const risky = new Set(
        metrics.riskAuths
          .filter((r) => r.daysToExpiry != null && r.daysToExpiry >= 0 && r.daysToExpiry <= EXPIRING_SOON_DAYS)
          .map((r) => r.authorizationNumber),
      );
      return openAuthDrilldown("Expiring authorizations", (i) =>
        risky.has(auths[i].authorization_number ?? "—"),
      );
    }
    if (id === "over" || id === "under") {
      const want = id === "over" ? "over" : "under";
      return openAuthDrilldown(
        id === "over" ? "Over-utilized authorizations" : "Under-utilized authorizations",
        (i) => {
          const a = auths[i];
          const authorized = Number(a.authorized_hours ?? 0);
          const used = Number(a.worked_hours ?? 0);
          if (!authorized) return false;
          return utilizationBand(Math.round((used / authorized) * 1000) / 10) === want;
        },
      );
    }
    if (id === "utilization" && utilRows.length) {
      return setDrilldown({
        title: "Weekly utilization source rows",
        subtitle: "CentralReach authorization utilization export.",
        rows: projectUtilizationRows(utilRows),
        columns: UTILIZATION_DRILLDOWN_COLUMNS,
        exportName: "authorization-utilization-weekly",
      });
    }
    return openAuthDrilldown("All authorizations in scope", () => true);
  };

  return (
    <PrimaryReportShell
      title="Authorization Utilization — Hour Based"
      subtitle="Authorized vs used hours per authorization, with expiring, over-utilized, and under-utilized authorizations ranked by operational risk."
      requiredExports={["Authorizations export", "Authorization utilization export"]}
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      onRefresh={data.refresh}
      exportDisabled={projectedAuths.length === 0}
      onExport={() => downloadCsv("authorization-utilization-hour-based", projectedAuths, AUTH_DRILLDOWN_COLUMNS)}
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

        <PrimaryChart
          title="Weekly hour utilization"
          subtitle="Used hours vs authorized hours by week"
          type="line"
          data={metrics.weeklyTrend}
          valueLabel="Used hours"
          secondaryLabel="Authorized hours"
          height={300}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <PrimaryChart
            title="Utilization by payor"
            type="bar"
            data={metrics.byPayor.slice(0, 10).map((p) => ({
              label: p.name,
              value: p.usedHours,
              secondary: p.authorizedHours,
            }))}
            valueLabel="Used hours"
            secondaryLabel="Authorized hours"
            onSelect={(label) => openAuthDrilldown(`Payor · ${label}`, (i) => (auths[i].payor ?? "Unknown") === label)}
          />
          <PrimaryChart
            title="Utilization by state"
            type="bar"
            data={metrics.byState.slice(0, 10).map((s) => ({ label: s.name, value: s.utilizationPct }))}
            valueLabel="Utilization %"
            onSelect={(label) => openAuthDrilldown(`State · ${label}`, (i) => (auths[i].state ?? "Unknown") === label)}
          />
        </div>

        <PrimaryTable
          title="Authorizations requiring attention"
          subtitle="Sorted by risk — expiring soon, over-utilized, and under-utilized first"
          rows={metrics.riskAuths}
          rowKey={(r, i) => `${r.authorizationNumber}-${i}`}
          onRowClick={(r) =>
            openAuthDrilldown(`Authorization ${r.authorizationNumber}`, (i) =>
              (auths[i].authorization_number ?? "—") === r.authorizationNumber,
            )
          }
          columns={[
            { key: "auth", label: "Authorization #", render: (r) => <span className="font-medium">{r.authorizationNumber}</span> },
            { key: "client", label: "Client", render: (r) => r.client },
            { key: "payor", label: "Payor", render: (r) => r.payor || "—" },
            { key: "state", label: "State", render: (r) => r.state || "—" },
            { key: "code", label: "Code", render: (r) => r.code || "—" },
            { key: "authHours", label: "Authorized", align: "right", render: (r) => fmtHours(r.authorizedHours) },
            { key: "usedHours", label: "Used", align: "right", render: (r) => fmtHours(r.usedHours) },
            { key: "remaining", label: "Remaining", align: "right", render: (r) => fmtHours(r.remainingHours) },
            {
              key: "pct",
              label: "Utilization",
              align: "right",
              render: (r) => (
                <Badge variant={BAND_TONE[r.band]} className="text-[10px]">
                  {fmtPct(r.utilizationPct)}
                </Badge>
              ),
            },
            {
              key: "end",
              label: "Ends",
              align: "right",
              render: (r) => (
                <span className={r.daysToExpiry != null && r.daysToExpiry <= EXPIRING_SOON_DAYS ? "font-semibold text-destructive" : ""}>
                  {fmtDate(r.endDate)}
                  {r.daysToExpiry != null && r.daysToExpiry >= 0 ? ` · ${fmtCount(r.daysToExpiry)}d` : ""}
                </span>
              ),
            },
          ]}
        />
      </div>

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}