/**
 * Primary report: BCBA Performance (`bcba-performance`) — Phase 2B1 rebuild.
 *
 * Five dimensions, each proven by its own source: productivity against the
 * recorded target, supervision ratio (97155 ÷ 97153 vs. 5%), parent-training
 * cadence, authorization readiness, and documentation timeliness.
 *
 * The overall status is the **worst** dimension — a BCBA carrying an At Risk
 * dimension is never averaged up into Strong. A dimension with no source data
 * reads "Insufficient Data" instead of 0%.
 *
 * Incentive eligibility is a **separate** panel on purpose: support and
 * compensation are different conversations, and a missing target blocks
 * eligibility rather than silently defaulting to a number.
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
  endDateOf,
  daysBetween,
} from "@/lib/os/reports/crPrimary/metrics/authorizationContinuity";
import { isProgressReportAction } from "@/lib/os/reports/crPrimary/metrics/authorizationActions";
import {
  PERFORMANCE_STATUS_LABELS,
  computeBcbaPerformanceAnalysis,
  type BcbaPerformanceInput,
  type BcbaPerformanceRow,
  type IncentiveRow,
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

const SCORECARD_COLUMNS = [
  { key: "bcba", label: "BCBA" },
  { key: "status", label: "Overall Status" },
  { key: "score", label: "Score" },
  { key: "billableHours", label: "Billable Hrs" },
  { key: "targetHours", label: "Target Hrs" },
  { key: "productivityPct", label: "Productivity %" },
  { key: "supervisionRatioPct", label: "Supervision %" },
  { key: "ptCadencePct", label: "PT Cadence %" },
  { key: "authActionCount", label: "Auth Actions" },
  { key: "progressReportsOverdue", label: "PRs Overdue" },
  { key: "clients", label: "Clients" },
  { key: "rbts", label: "RBTs" },
  { key: "states", label: "States" },
  { key: "drivers", label: "Status Driven By" },
];

const INCENTIVE_COLUMNS = [
  { key: "bcba", label: "BCBA" },
  { key: "billableHours", label: "Billable Hrs" },
  { key: "targetHours", label: "Target Hrs" },
  { key: "attainmentPct", label: "Attainment %" },
  { key: "eligible", label: "Eligible" },
  { key: "note", label: "Why" },
];

const projectRows = (rows: BcbaPerformanceRow[]): Record<string, unknown>[] =>
  rows.map((r) => ({
    bcba: r.bcba,
    status: PERFORMANCE_STATUS_LABELS[r.status],
    score: r.score ?? "Not scored",
    billableHours: r.billableHours,
    targetHours: r.targetHours ?? "No target",
    productivityPct: r.productivityPct ?? "No target",
    supervisionRatioPct: r.supervisionRatioPct ?? "Insufficient data",
    ptCadencePct: r.ptCadencePct ?? "Insufficient data",
    authActionCount: r.authActionCount,
    progressReportsOverdue: r.progressReportsOverdue,
    clients: r.clients,
    rbts: r.rbts,
    states: r.states.join(", "),
    drivers: r.drivers.join(", "),
  }));

const projectIncentives = (rows: IncentiveRow[]): Record<string, unknown>[] =>
  rows.map((r) => ({
    bcba: r.bcba,
    billableHours: r.billableHours,
    targetHours: r.targetHours ?? "No target",
    attainmentPct: r.attainmentPct ?? "Not scored",
    eligible: r.eligible ? "Yes" : "No",
    note: r.note,
  }));

const DEFAULT_FILTERS = withCurrentMonthDefault(EMPTY_FILTERS);

export default function BcbaPerformancePage() {
  const data = useCrPrimaryReport([
    "billingFacts",
    "authCurrent",
    "authActions",
    "bcbaTargets",
  ]);
  const ownership = useBcbaOwnershipV3();
  const [filters, setFilters] = useUrlFilterState<PrimaryReportFilters>(DEFAULT_FILTERS);
  const [tabParam, setTabParam] = useUrlState("tab", "scorecard");
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);
  const tab = tabParam === "incentives" ? "incentives" : "scorecard";

  useEffect(() => {
    pushRecent("bcba-performance");
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

  const resolveOwner = useMemo(() => {
    const index = ownership.data;
    return (s: { clientName?: string | null; clientCrId?: string | null; date?: string | null }) =>
      index?.resolve({ clientCrId: s.clientCrId, clientName: s.clientName, date: s.date }).bcba ?? null;
  }, [ownership.data]);

  const analysis = useMemo(() => {
    interface Acc {
      billable: number;
      direct: number;
      supervision: number;
      clients: Set<string>;
      ptClients: Set<string>;
      rbts: Set<string>;
      states: Set<string>;
    }
    const acc = new Map<string, Acc>();
    const clientOwner = new Map<string, string>();

    const ensure = (bcba: string): Acc => {
      if (!acc.has(bcba)) {
        acc.set(bcba, {
          billable: 0,
          direct: 0,
          supervision: 0,
          clients: new Set(),
          ptClients: new Set(),
          rbts: new Set(),
          states: new Set(),
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
      clientOwner.set(client.toLowerCase(), owner);
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
        a.billable += hours;
        if (code === CODE_SUPERVISION) a.supervision += hours;
        if (code === CODE_PARENT_TRAINING) a.ptClients.add(client);
      }
    }

    // Authorization readiness: expiring within 30 days or already expired.
    const authActionByBcba = new Map<string, number>();
    for (const auth of data.authCurrent) {
      const client = String(auth.client_name ?? "").trim();
      if (!client) continue;
      const owner = clientOwner.get(client.toLowerCase());
      if (!owner) continue;
      const end = endDateOf(auth);
      const days = end ? daysBetween(today, end) : null;
      const needsAction = days == null ? false : days <= 30;
      if (needsAction) authActionByBcba.set(owner, (authActionByBcba.get(owner) ?? 0) + 1);
    }

    // Documentation timeliness: true progress-report records only.
    const prDue = new Map<string, number>();
    const prOverdue = new Map<string, number>();
    for (const action of data.authActions) {
      if (!isProgressReportAction(action)) continue;
      const client = String(action.client_name ?? "").trim();
      const owner = clientOwner.get(client.toLowerCase());
      if (!owner) continue;
      const due = action.next_action_due_date
        ? String(action.next_action_due_date).slice(0, 10)
        : null;
      prDue.set(owner, (prDue.get(owner) ?? 0) + 1);
      if (due && due < today) prOverdue.set(owner, (prOverdue.get(owner) ?? 0) + 1);
    }

    const targetByBcba = new Map<string, { target: number | null; forecast: number | null }>();
    for (const t of data.bcbaTargets) {
      const name = String(t.bcba_name ?? "").trim();
      if (!name) continue;
      const existing = targetByBcba.get(name);
      // Sum only real target rows; when none exist the value stays null so the
      // report says "No target" instead of scoring against a fabricated zero.
      const summed =
        t.mtd_target_hours == null
          ? existing?.target ?? null
          : (existing?.target ?? 0) + t.mtd_target_hours;
      targetByBcba.set(name, {
        target: summed,
        forecast: t.forecast_hours ?? existing?.forecast ?? null,
      });
    }

    const inputs: BcbaPerformanceInput[] = [...acc.entries()].map(([bcba, a]) => {
      const target = targetByBcba.get(bcba);
      return {
        bcba,
        states: [...a.states].sort(),
        clients: a.clients.size,
        rbts: a.rbts.size,
        billableHours: Math.round(a.billable * 10) / 10,
        directHours: Math.round(a.direct * 10) / 10,
        supervisionHours: Math.round(a.supervision * 10) / 10,
        targetHours: target?.target ?? null,
        forecastHours: target?.forecast ?? null,
        clientsWithParentTraining: a.ptClients.size,
        authActionCount: authActionByBcba.get(bcba) ?? 0,
        progressReportsDue: prDue.get(bcba) ?? 0,
        progressReportsOverdue: prOverdue.get(bcba) ?? 0,
      };
    });

    return computeBcbaPerformanceAnalysis(inputs);
  }, [billing, data.authCurrent, data.authActions, data.bcbaTargets, resolveOwner, today]);

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
        hint: `${fmtHours(analysis.totalBillableHours)} billable hours attributed`,
      },
      {
        id: "at_risk",
        label: "At risk",
        value: fmtCount(analysis.counts.at_risk),
        hint: "At least one dimension is At Risk",
        tone: analysis.counts.at_risk > 0 ? "bad" : "good",
      },
      {
        id: "needs_attention",
        label: "Needs attention",
        value: fmtCount(analysis.counts.needs_attention),
        hint: "Worst dimension needs attention",
        tone: analysis.counts.needs_attention > 0 ? "warn" : "good",
      },
      {
        id: "strong",
        label: "Strong or on track",
        value: fmtCount(analysis.counts.strong + analysis.counts.on_track),
        hint: "Every dimension at or near target",
        tone: "good",
      },
      {
        id: "no_target",
        label: "No recorded target",
        value: fmtCount(analysis.withoutTargets),
        hint: "Productivity is not scored without a target — never treated as 0%",
        tone: analysis.withoutTargets > 0 ? "warn" : "good",
      },
      {
        id: "score",
        label: "Average score",
        value: analysis.avgScore == null ? "Not scored" : String(analysis.avgScore),
        hint: "Mean of the computable dimension scores",
      },
    ],
    [analysis],
  );

  const columns: PrimaryTableColumn<BcbaPerformanceRow>[] = [
    { key: "bcba", label: "BCBA", render: (r) => <span className="font-medium">{r.bcba}</span> },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Badge variant="outline" className={STATUS_TONE[r.status]}>
          {PERFORMANCE_STATUS_LABELS[r.status]}
        </Badge>
      ),
    },
    { key: "score", label: "Score", align: "right", render: (r) => r.score ?? "—" },
    { key: "billable", label: "Billable Hrs", align: "right", render: (r) => fmtHours(r.billableHours) },
    {
      key: "productivity",
      label: "Productivity",
      align: "right",
      render: (r) =>
        r.productivityPct == null ? (
          <span className="text-muted-foreground">No target</span>
        ) : (
          fmtPct(r.productivityPct)
        ),
    },
    {
      key: "supervision",
      label: "Supervision",
      align: "right",
      render: (r) =>
        r.supervisionRatioPct == null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          fmtPct(r.supervisionRatioPct)
        ),
    },
    {
      key: "pt",
      label: "PT Cadence",
      align: "right",
      render: (r) =>
        r.ptCadencePct == null ? <span className="text-muted-foreground">—</span> : fmtPct(r.ptCadencePct),
    },
    { key: "auth", label: "Auth Actions", align: "right", render: (r) => fmtCount(r.authActionCount) },
    {
      key: "docs",
      label: "PRs Overdue",
      align: "right",
      render: (r) => fmtCount(r.progressReportsOverdue),
    },
    { key: "clients", label: "Clients", align: "right", render: (r) => fmtCount(r.clients) },
  ];

  const incentiveColumns: PrimaryTableColumn<IncentiveRow>[] = [
    { key: "bcba", label: "BCBA", render: (r) => <span className="font-medium">{r.bcba}</span> },
    { key: "hours", label: "Billable Hrs", align: "right", render: (r) => fmtHours(r.billableHours) },
    {
      key: "target",
      label: "Target Hrs",
      align: "right",
      render: (r) => (r.targetHours == null ? "No target" : fmtHours(r.targetHours)),
    },
    {
      key: "attainment",
      label: "Attainment",
      align: "right",
      render: (r) => (r.attainmentPct == null ? "Not scored" : fmtPct(r.attainmentPct)),
    },
    {
      key: "eligible",
      label: "Eligible",
      render: (r) => (
        <Badge
          variant="outline"
          className={r.eligible ? STATUS_TONE.strong : STATUS_TONE.insufficient_data}
        >
          {r.eligible ? "Eligible" : "Not eligible"}
        </Badge>
      ),
    },
    { key: "note", label: "Why", render: (r) => <span className="text-muted-foreground">{r.note}</span> },
  ];

  return (
    <PrimaryReportShell
      title="BCBA Performance"
      subtitle="Productivity, supervision, parent training, authorization readiness, and documentation — worst dimension sets the status."
      freshness={data.freshness}
      loading={data.loading || ownership.isLoading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      dataQualityWarnings={[
        analysis.withoutTargets > 0
          ? `${analysis.withoutTargets} BCBA(s) have no recorded productivity target, so their productivity is reported as "No target" rather than scored.`
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
          ? downloadCsv("bcba-incentive-eligibility", projectIncentives(analysis.incentives), INCENTIVE_COLUMNS)
          : downloadCsv("bcba-performance", projectRows(analysis.rows), SCORECARD_COLUMNS)
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
        Each dimension is judged against its own source: billed hours against the recorded target,
        97155 ÷ 97153 against 5%, 97156 coverage of the caseload, authorizations expiring within 30
        days, and true progress-report work. A dimension with no source data reads Insufficient Data —
        it is never shown as 0%.
      </ReportProvenance>

      <Tabs value={tab} onValueChange={setTabParam}>
        <TabsList>
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="incentives">Incentive eligibility</TabsTrigger>
        </TabsList>
      </Tabs>

      <KpiScorecards
        kpis={kpis}
        onSelect={(id) => {
          const rows =
            id === "at_risk"
              ? analysis.rows.filter((r) => r.status === "at_risk")
              : id === "needs_attention"
                ? analysis.rows.filter((r) => r.status === "needs_attention")
                : id === "no_target"
                  ? analysis.rows.filter((r) => r.targetHours == null)
                  : analysis.rows;
          setDrilldown({
            title: "BCBA performance",
            subtitle: `${rows.length.toLocaleString("en-US")} BCBA(s)`,
            rows: projectRows(rows),
            columns: SCORECARD_COLUMNS,
            exportName: "bcba-performance",
          });
        }}
      />

      {tab === "scorecard" ? (
        <>
          <PrimaryChart
            title="Billable hours by BCBA"
            subtitle="Hours attributed through the same ownership logic as BCBA Productivity."
            type="bar"
            data={analysis.rows.slice(0, 15).map((r) => ({ label: r.bcba, value: r.billableHours }))}
            valueLabel="Hours"
          />
          <PrimaryTable
            title="BCBA scorecard"
            subtitle="Click a BCBA to see every dimension and what drove the status."
            columns={columns}
            rows={analysis.rows}
            rowKey={(r) => r.bcba}
            onRowClick={(r) =>
              setDrilldown({
                title: `${r.bcba} — performance dimensions`,
                subtitle: `Overall: ${PERFORMANCE_STATUS_LABELS[r.status]} · driven by ${r.drivers.join(", ")}`,
                rows: r.dimensions.map((d) => ({
                  dimension: d.label,
                  status: PERFORMANCE_STATUS_LABELS[d.status],
                  value: d.value ?? "Not computable",
                  target: d.target ?? "—",
                  detail: d.detail,
                })),
                columns: [
                  { key: "dimension", label: "Dimension" },
                  { key: "status", label: "Status" },
                  { key: "value", label: "Value" },
                  { key: "target", label: "Target" },
                  { key: "detail", label: "What This Means" },
                ],
                exportName: "bcba-performance-dimensions",
              })
            }
            maxRows={200}
          />
        </>
      ) : (
        <PrimaryTable
          title="Incentive eligibility"
          subtitle="Separate from performance status. A missing target blocks eligibility instead of assuming one."
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
