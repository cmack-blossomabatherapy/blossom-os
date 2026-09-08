/**
 * Primary report: Documentation Readiness (`documentation-readiness`).
 *
 * Staff-facing OPERATIONAL readiness surface over the curated, provider-level
 * `timesheetDocs` dataset (`report_timesheet_documentation_summary()`). It is
 * deliberately NOT Commit to Submit's formal documentation-timeliness
 * compliance surface: it reports source lock state, provider signature and
 * task-completion status only, and it never creates or alters a coaching
 * record, formal violation, notice, dispute or exception.
 *
 * Provider-level only — no client details, hours, disciplinary fields, rates
 * or amounts are shown or derivable here.
 */
import { useMemo, useState } from "react";
import { PrimaryReportShell } from "@/components/reports/crPrimary/PrimaryReportShell";
import { KpiScorecards } from "@/components/reports/crPrimary/KpiScorecards";
import { PrimaryChart } from "@/components/reports/crPrimary/PrimaryChart";
import { PrimaryTable, type PrimaryTableColumn } from "@/components/reports/crPrimary/PrimaryTable";
import { DrilldownDrawer } from "@/components/reports/crPrimary/DrilldownDrawer";
import { Input } from "@/components/ui/input";
import { useCrPrimaryReport } from "@/hooks/useCrPrimaryReport";
import type { DrilldownRequest, KpiDefinition } from "@/lib/os/reports/crPrimary/types";
import { fmtCount, fmtDate, fmtPct } from "@/lib/os/reports/crPrimary/format";
import { downloadCsv } from "@/lib/os/reports/crPrimary/csv";
import {
  DOCUMENTATION_READINESS_NOTE,
  summarizeDocumentationReadiness,
  type DocumentationReadinessProviderRow,
} from "@/lib/os/reports/crPrimary/metrics/documentationReadiness";

const PROVIDER_COLUMNS = [
  { key: "provider", label: "Provider" },
  { key: "rowsTotal", label: "Total rows" },
  { key: "locked", label: "Locked" },
  { key: "unlocked", label: "Unlocked" },
  { key: "lockedRatePercent", label: "Locked %" },
  { key: "missingProviderSignature", label: "Missing provider signature" },
  { key: "incompleteTasks", label: "Incomplete tasks" },
  { key: "latestDateOfService", label: "Latest date of service" },
  { key: "latestSeenAt", label: "Latest seen" },
];

const NOT_DOCUMENTED = "Not documented";

const providerCsv = (r: DocumentationReadinessProviderRow) => ({
  ...r,
  lockedRatePercent: r.lockedRatePercent == null ? NOT_DOCUMENTED : fmtPct(r.lockedRatePercent),
  latestDateOfService: r.latestDateOfService ? fmtDate(r.latestDateOfService) : NOT_DOCUMENTED,
  latestSeenAt: r.latestSeenAt ? fmtDate(r.latestSeenAt) : NOT_DOCUMENTED,
});

export default function DocumentationReadinessPage() {
  const data = useCrPrimaryReport(["timesheetDocs"]);
  const [providerSearch, setProviderSearch] = useState("");
  const [drilldown, setDrilldown] = useState<DrilldownRequest | null>(null);

  const summary = useMemo(
    () => summarizeDocumentationReadiness(data.timesheetDocs),
    [data.timesheetDocs],
  );

  const filteredProviders = useMemo(() => {
    const q = providerSearch.trim().toLowerCase();
    if (!q) return summary.providers;
    return summary.providers.filter((p) => p.provider.toLowerCase().includes(q));
  }, [summary.providers, providerSearch]);

  const openProviders = (
    title: string,
    subtitle: string,
    rows: DocumentationReadinessProviderRow[],
    exportName: string,
    chips?: { label: string; value: string }[],
  ) =>
    setDrilldown({
      title,
      subtitle,
      filters: chips,
      rows: rows.map(providerCsv),
      columns: PROVIDER_COLUMNS,
      exportName,
    });

  const kpis: KpiDefinition[] = [
    {
      id: "rows-total",
      label: "Source rows",
      value: fmtCount(summary.rowsTotal),
      hint: "Timesheet documentation rows across every provider",
    },
    {
      id: "locked",
      label: "Locked rows",
      value: fmtCount(summary.locked),
      hint:
        summary.lockedRatePercent == null
          ? "Locked rate not measurable"
          : `${fmtPct(summary.lockedRatePercent)} locked rate`,
      tone: "good",
    },
    {
      id: "unlocked",
      label: "Unlocked rows",
      value: fmtCount(summary.unlocked),
      hint: "Not yet locked by the source system",
      tone: summary.unlocked > 0 ? "warn" : "good",
    },
    {
      id: "missing-signature",
      label: "Missing provider signatures",
      value: fmtCount(summary.missingProviderSignature),
      hint: "Overlaps with unlocked and incomplete-task counts — do not sum these into one total",
      tone: summary.missingProviderSignature > 0 ? "warn" : "good",
    },
    {
      id: "incomplete-tasks",
      label: "Incomplete tasks",
      value: fmtCount(summary.incompleteTasks),
      hint: "Overlaps with unlocked and missing-signature counts — do not sum these into one total",
      tone: summary.incompleteTasks > 0 ? "warn" : "good",
    },
    {
      id: "providers-needing-action",
      label: "Providers needing action",
      value: fmtCount(summary.providersNeedingAction),
      hint: "Has at least one unlocked, missing-signature or incomplete-task row",
      tone: summary.providersNeedingAction > 0 ? "warn" : "good",
    },
  ];

  const columns: PrimaryTableColumn<DocumentationReadinessProviderRow>[] = [
    {
      key: "provider",
      label: "Provider",
      render: (r) => <span className="font-medium">{r.provider}</span>,
    },
    { key: "total", label: "Total rows", align: "right", render: (r) => fmtCount(r.rowsTotal) },
    { key: "locked", label: "Locked", align: "right", render: (r) => fmtCount(r.locked) },
    {
      key: "unlocked",
      label: "Unlocked",
      align: "right",
      render: (r) => (
        <span className={(r.unlocked ?? 0) > 0 ? "text-amber-600" : ""}>{fmtCount(r.unlocked)}</span>
      ),
    },
    {
      key: "lockedPct",
      label: "Locked %",
      align: "right",
      render: (r) => (r.lockedRatePercent == null ? NOT_DOCUMENTED : fmtPct(r.lockedRatePercent)),
    },
    {
      key: "missingSig",
      label: "Missing signature",
      align: "right",
      render: (r) => (
        <span className={(r.missingProviderSignature ?? 0) > 0 ? "text-amber-600" : ""}>
          {fmtCount(r.missingProviderSignature)}
        </span>
      ),
    },
    {
      key: "incompleteTasks",
      label: "Incomplete tasks",
      align: "right",
      render: (r) => (
        <span className={(r.incompleteTasks ?? 0) > 0 ? "text-amber-600" : ""}>
          {fmtCount(r.incompleteTasks)}
        </span>
      ),
    },
    {
      key: "latestDos",
      label: "Latest date of service",
      render: (r) => (r.latestDateOfService ? fmtDate(r.latestDateOfService) : NOT_DOCUMENTED),
    },
    {
      key: "freshness",
      label: "Latest seen",
      render: (r) => (r.latestSeenAt ? fmtDate(r.latestSeenAt) : NOT_DOCUMENTED),
    },
  ];

  const chartData = useMemo(
    () =>
      summary.providers
        .filter((p) => (p.unlocked ?? 0) > 0)
        .slice(0, 10)
        .map((p) => ({ label: p.provider, value: p.unlocked ?? 0 })),
    [summary.providers],
  );

  return (
    <PrimaryReportShell
      title="Documentation Readiness"
      subtitle="Operational readiness for provider timesheet documentation — lock state, provider signatures and task completion. This is NOT Commit to Submit's formal documentation-timeliness compliance surface, and it never creates a coaching record, formal violation, notice, dispute or exception."
      freshness={data.freshness}
      loading={data.loading}
      empty={data.empty}
      errorMessage={data.errorMessage}
      dataQualityWarnings={[DOCUMENTATION_READINESS_NOTE]}
      onRefresh={data.refresh}
      onExport={() =>
        downloadCsv("documentation-readiness-providers", filteredProviders.map(providerCsv), PROVIDER_COLUMNS)
      }
      exportDisabled={filteredProviders.length === 0}
      filters={
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search provider…"
            value={providerSearch}
            onChange={(e) => setProviderSearch(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      }
    >
      <div className="space-y-5">
        <KpiScorecards
          kpis={kpis}
          onSelect={(id) => {
            if (id === "unlocked") {
              openProviders(
                "Providers with unlocked rows",
                "Providers with at least one unlocked timesheet documentation row.",
                summary.providers.filter((p) => (p.unlocked ?? 0) > 0),
                "documentation-readiness-unlocked",
              );
            } else if (id === "missing-signature") {
              openProviders(
                "Providers with missing provider signatures",
                "Providers with at least one row missing a provider signature.",
                summary.providers.filter((p) => (p.missingProviderSignature ?? 0) > 0),
                "documentation-readiness-missing-signature",
              );
            } else if (id === "incomplete-tasks") {
              openProviders(
                "Providers with incomplete tasks",
                "Providers with at least one row carrying incomplete tasks.",
                summary.providers.filter((p) => (p.incompleteTasks ?? 0) > 0),
                "documentation-readiness-incomplete-tasks",
              );
            } else if (id === "providers-needing-action") {
              openProviders(
                "Providers needing action",
                "Providers with at least one unlocked, missing-signature or incomplete-task row.",
                summary.providers.filter((p) => p.needsAction),
                "documentation-readiness-needs-action",
              );
            }
          }}
        />

        <PrimaryChart
          title="Top providers by unlocked backlog"
          subtitle="Unlocked row counts only — overlaps with other issue types are not netted out."
          type="bar"
          valueLabel="Unlocked rows"
          data={chartData}
          onSelect={(label) =>
            openProviders(
              `Provider · ${label}`,
              "Documentation readiness detail for this provider.",
              summary.providers.filter((p) => p.provider === label),
              `documentation-readiness-${label.toLowerCase().replace(/\s+/g, "-")}`,
              [{ label: "Provider", value: label }],
            )
          }
        />

        <PrimaryTable
          title="Provider action queue"
          subtitle="Sorted by largest actionable backlog first (unlocked + missing signature + incomplete tasks)."
          rows={filteredProviders}
          rowKey={(r) => r.key}
          columns={columns}
          emptyLabel="No providers match the current search."
          onRowClick={(r) =>
            openProviders(
              `Provider · ${r.provider}`,
              "Documentation readiness detail for this provider.",
              [r],
              "documentation-readiness-detail",
              [{ label: "Provider", value: r.provider }],
            )
          }
        />
      </div>

      <DrilldownDrawer request={drilldown} onClose={() => setDrilldown(null)} />
    </PrimaryReportShell>
  );
}
