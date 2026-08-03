import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  RefreshCw, Download, Database, AlertTriangle, Search, X, Filter,
  Users, Clock, Activity, ShieldCheck, UserCheck, Layers, FileSpreadsheet,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, Cell, PieChart, Pie, LineChart, Line,
} from "recharts";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilterCombobox, FILTER_ALL_VALUE } from "@/components/reports/crPrimary/FilterCombobox";
import { DateRangeFilter } from "@/components/reports/crPrimary/DateRangeFilter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  getBcbaProductivitySharedRows,
  getBcbaProductivityDatasetStatus,
  invalidateBcbaProductivitySharedCache,
  getBcbaSharedLoadHealth,
  type BcbaDatasetStatus,
  type BcbaSharedLoadHealth,
  type BcbaSharedBillingRow,
} from "@/lib/os/bcbaProductivityV3/adminUploadStore";
import {
  applyFilters, activeFilterCount, buildOwnership, filterOptions,
  fmtCount, fmtHours, fmtPct, toCsv, drilldownRowToCells,
  DRILLDOWN_COLUMNS, EMPTY_FILTERS, OWNERSHIP_REASON_LABELS, UNASSIGNED_LABEL,
  type BcbaProductivityFilters, type OwnedBillingRow, type OwnershipResult,
} from "@/lib/os/bcbaProductivityV3/engine";
import {
  bcbaSupervisionStatus,
  buildBcbaProductivityModelFromOwnedRows,
  type BcbaSupervisionStatus,
} from "@/lib/os/bcbaProductivityV3/model";

/* ---------------- small presentational pieces ---------------- */

const CHART_COLORS = [
  "hsl(var(--primary))", "#14b8a6", "#f59e0b", "#8b5cf6", "#ef4444",
  "#0ea5e9", "#22c55e", "#ec4899", "#64748b", "#a3620b",
];

const SUP_TONE: Record<BcbaSupervisionStatus, string> = {
  none: "bg-muted text-muted-foreground",
  urgent: "bg-destructive/10 text-destructive border border-destructive/30",
  monitor: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  healthy: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
};

function SupervisionBadge({ pct }: { pct: number | null }) {
  const status = bcbaSupervisionStatus(pct);
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", SUP_TONE[status])}>
      {fmtPct(pct)}
    </span>
  );
}

function KpiCard({
  label, value, hint, icon: Icon, tone, onClick,
}: {
  label: string; value: string; hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warn" | "danger";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group text-left rounded-2xl border bg-card/70 backdrop-blur p-4 shadow-sm transition",
        onClick && "hover:shadow-md hover:border-primary/40 cursor-pointer",
        tone === "danger" && "border-destructive/30",
        tone === "warn" && "border-amber-500/30",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={cn(
          "h-4 w-4 text-muted-foreground",
          tone === "danger" && "text-destructive",
          tone === "warn" && "text-amber-500",
        )} />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </button>
  );
}

function Panel({ title, subtitle, children, action }: {
  title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border bg-card/70 backdrop-blur p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle ? <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

/* ---------------- page ---------------- */

interface Drilldown {
  title: string;
  subtitle?: string;
  rows: OwnedBillingRow[];
}

interface AuthContextRow {
  client_name: string | null;
  payor: string | null;
  state: string | null;
  procedure_code: string | null;
  start_date: string | null;
  end_date: string | null;
  authorized_hours: number | null;
  status: string | null;
}

export default function BcbaProductivityReportV3() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [source, setSource] = useState<BcbaDatasetStatus | null>(null);
  const [rawRows, setRawRows] = useState<BcbaSharedBillingRow[]>([]);
  const [authContext, setAuthContext] = useState<AuthContextRow[]>([]);
  const [authLatestUpload, setAuthLatestUpload] = useState<string | null>(null);
  const [loadHealth, setLoadHealth] = useState<BcbaSharedLoadHealth | null>(null);
  const [filters, setFilters] = useState<BcbaProductivityFilters>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [drilldown, setDrilldown] = useState<Drilldown | null>(null);
  const deferredSearch = useDeferredValue(searchInput);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      if (force) invalidateBcbaProductivitySharedCache();
      const [status, rows] = await Promise.all([
        getBcbaProductivityDatasetStatus(),
        getBcbaProductivitySharedRows({
          force,
          onProgress: (loaded, total) => setProgress({ loaded, total }),
        }),
      ]);
      setSource(status);
      setRawRows(rows);
      setLoadHealth(getBcbaSharedLoadHealth());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CentralReach billing rows.");
    } finally {
      setProgress(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(false); }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // The Data API caps responses at 1,000 rows, so the audit/fallback
      // context has to be paged — a single `.limit(5000)` silently truncated it.
      const PAGE = 1000;
      const CAP = 50000;
      const acc: AuthContextRow[] = [];
      for (let offset = 0; offset < CAP; ) {
        const { data, error } = await supabase
          .from("cr_authorizations")
          .select("client_name,payor,state,procedure_code,start_date,end_date,authorized_hours,status")
          .order("start_date", { ascending: true })
          .range(offset, offset + PAGE - 1);
        if (error) break;
        const arr = (data ?? []) as AuthContextRow[];
        acc.push(...arr);
        if (arr.length === 0) break;
        offset += arr.length;
      }
      const { data: lastAuthUpload } = await supabase
        .from("cr_import_batches")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);
      if (!cancelled) {
        setAuthContext(acc);
        setAuthLatestUpload(lastAuthUpload?.[0]?.created_at ?? null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ---- ownership + aggregation ---- */

  const ownership: OwnershipResult = useMemo(
    () => buildOwnership(rawRows.map((r) => ({
      clientId: r.clientId,
      clientName: r.clientName,
      renderingProvider: r.renderingProvider,
      providerLabels: r.providerLabels,
      code: r.code,
      hours: r.hours,
      date: r.date,
      state: r.state,
      payor: r.payor,
      location: r.location ?? "",
    }))),
    [rawRows],
  );

  const options = useMemo(() => filterOptions(ownership.rows), [ownership.rows]);

  const effectiveFilters = useMemo(
    () => ({ ...filters, search: deferredSearch }),
    [filters, deferredSearch],
  );

  const filteredRows = useMemo(
    () => applyFilters(ownership.rows, effectiveFilters),
    [ownership.rows, effectiveFilters],
  );

  const model = useMemo(
    () => buildBcbaProductivityModelFromOwnedRows(filteredRows, ownership),
    [filteredRows, ownership],
  );
  const kpis = model.kpis;
  const filterCount = activeFilterCount(effectiveFilters);

  const setFilter = (key: keyof BcbaProductivityFilters) => (value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value === FILTER_ALL_VALUE ? "" : value }));

  const resetFilters = () => { setFilters(EMPTY_FILTERS); setSearchInput(""); };

  /* ---- drilldowns ---- */

  const openDrilldown = (title: string, predicate: (r: OwnedBillingRow) => boolean, subtitle?: string) => {
    const rows = filteredRows.filter(predicate);
    setDrilldown({ title, subtitle, rows });
  };

  const exportDrilldown = () => {
    if (!drilldown) return;
    const csv = toCsv(DRILLDOWN_COLUMNS, drilldown.rows.map(drilldownRowToCells));
    downloadText(`${slug(drilldown.title)}-source-rows.csv`, csv);
    toast.success(`Exported ${drilldown.rows.length.toLocaleString("en-US")} source rows`);
  };

  const exportFiltered = () => {
    const csv = toCsv(DRILLDOWN_COLUMNS, filteredRows.map(drilldownRowToCells));
    downloadText("bcba-productivity-source-rows.csv", csv);
    toast.success(`Exported ${filteredRows.length.toLocaleString("en-US")} rows`);
  };

  /* ---- chart data ---- */

  const hoursByBcba = useMemo(
    () => model.bcbaSummaries.slice(0, 15).map((b) => ({
      name: b.bcba, hours: b.totalHours, key: b.bcba,
    })),
    [model.bcbaSummaries],
  );

  const top10 = useMemo(
    () => model.bcbaSummaries.filter((b) => !b.isUnassigned).slice(0, 10),
    [model.bcbaSummaries],
  );

  const compositionData = useMemo(() => ([
    { name: "97153 (RBT direct)", value: kpis.hours97153 },
    { name: "97155 (Supervision)", value: kpis.hours97155 },
    { name: "Other direct BCBA", value: Math.max(0, Math.round((kpis.directBcbaHours - kpis.hours97155) * 10) / 10) },
  ]), [kpis]);

  const supervisionByBcba = useMemo(
    () => model.supervisionSummaries
      .filter((b) => !b.isUnassigned && b.supervisionPct !== null)
      .slice(0, 15)
      .map((b) => ({ name: b.bcba, pct: b.supervisionPct as number, status: b.status })),
    [model.supervisionSummaries],
  );

  const codeMix = useMemo(
    () => model.codeSummaries.slice(0, 8).map((c) => ({ name: c.normalizedCode, value: c.hours })),
    [model.codeSummaries],
  );

  const unassignedClients = useMemo(() => {
    const names = new Set(model.unassignedAudit.clients.map((c) => c.clientName.toLowerCase()));
    return authContext.filter((a) => names.has(String(a.client_name ?? "").toLowerCase()));
  }, [authContext, model.unassignedAudit.clients]);

  /* ---- render ---- */

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">BCBA Productivity</h1>
              <Badge variant="secondary" className="rounded-full">CentralReach Data Hub</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Billing rows are the source of truth for hours. Ownership is inferred month-first
              from BCBA anchor rows — client contact labels are never used.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportFiltered} disabled={!filteredRows.length}>
              <Download className="h-4 w-4 mr-1.5" /> Export source rows
            </Button>
            <Button size="sm" onClick={() => void load(true)} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} /> Refresh
            </Button>
          </div>
        </div>

        {/* Source strip */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border bg-muted/30 px-4 py-2.5 text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <Database className="h-3.5 w-3.5" />
            {source?.sourceLabel ?? "CentralReach Data Hub billing"}
          </span>
          <span className="text-muted-foreground">
            Billing rows loaded: <strong className="text-foreground">{fmtCount(rawRows.length)}</strong>
          </span>
          <span className="text-muted-foreground">
            Coverage: <strong className="text-foreground">
              {source?.earliestServiceDate ?? "—"} → {source?.latestServiceDate ?? "—"}
            </strong>
          </span>
          <span className="text-muted-foreground">
            In view: <strong className="text-foreground">{fmtCount(filteredRows.length)}</strong> rows
          </span>
          {progress ? (
            <span className="text-muted-foreground">Loading {fmtCount(progress.loaded)}…</span>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>{error}</div>
          </div>
        ) : null}

        {!loading && !error && rawRows.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground" />
            <h3 className="mt-3 font-semibold">No CentralReach billing rows yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload the billing export in the CentralReach Data Hub. This report never accepts
              report-side uploads.
            </p>
          </div>
        ) : null}

        {/* Filters */}
        <Card className="rounded-2xl border bg-card/70 backdrop-blur p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4" /> Filters
              {filterCount > 0 ? (
                <Badge variant="secondary" className="rounded-full">{filterCount} active</Badge>
              ) : null}
            </div>
            {filterCount > 0 ? (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear all
              </Button>
            ) : null}
          </div>
          <DateRangeFilter
            from={filters.from}
            to={filters.to}
            onChange={({ from, to }) => setFilters((p) => ({ ...p, from, to }))}
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {([
              ["State", "state", options.states],
              ["BCBA", "bcba", options.bcbas],
              ["Client", "client", options.clients],
              ["Provider / RBT", "provider", options.providers],
              ["Payor", "payor", options.payors],
              ["Code", "code", options.codes],
              ["Location", "location", options.locations],
            ] as [string, keyof BcbaProductivityFilters, string[]][]).map(([label, key, opts]) => (
              <div key={key} className="min-w-0 space-y-1.5">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {label}
                </span>
                <FilterCombobox
                  label={label}
                  value={String(filters[key] ?? "")}
                  options={opts}
                  onChange={setFilter(key)}
                  className="h-9 w-full"
                />
              </div>
            ))}
            <div className="min-w-0 space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Search
              </span>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="h-9 pl-8 text-xs"
                  placeholder="Client, BCBA, provider, code, payor…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <KpiCard label="Total Hours" value={fmtHours(kpis.totalHours)} icon={Clock}
            hint={`${fmtCount(kpis.rowCount)} billing rows`}
            onClick={() => openDrilldown("Total Hours", () => true)} />
          <KpiCard label="97153 Hours" value={fmtHours(kpis.hours97153)} icon={Activity}
            hint="RBT direct service"
            onClick={() => openDrilldown("97153 Hours", (r) => r.normalizedCode === "97153")} />
          <KpiCard label="97155 Supervision" value={fmtHours(kpis.hours97155)} icon={ShieldCheck}
            onClick={() => openDrilldown("97155 Supervision Hours", (r) => r.normalizedCode === "97155")} />
          <KpiCard label="Direct BCBA Hours" value={fmtHours(kpis.directBcbaHours)} icon={UserCheck}
            hint="Non-97153 rendered by BCBAs"
            onClick={() => openDrilldown("Direct BCBA Hours", (r) => r.isAnchor)} />
          <KpiCard label="Supervision %" value={fmtPct(kpis.supervisionPct)} icon={ShieldCheck}
            tone={kpis.supervisionStatus === "urgent" ? "danger" : kpis.supervisionStatus === "monitor" ? "warn" : "default"}
            hint="97155 ÷ 97153"
            onClick={() => openDrilldown("Supervision inputs (97153 + 97155)",
              (r) => r.normalizedCode === "97153" || r.normalizedCode === "97155")} />
          <KpiCard label="Active BCBAs" value={fmtCount(kpis.activeBcbas)} icon={Users}
            onClick={() => openDrilldown("Rows with an inferred BCBA owner", (r) => !!r.owner)} />
          <KpiCard label="Active Clients" value={fmtCount(kpis.activeClients)} icon={Users}
            onClick={() => openDrilldown("All client rows", () => true)} />
          <KpiCard label="Active RBTs" value={fmtCount(kpis.activeRbts)} icon={Users}
            onClick={() => openDrilldown("97153 rows by RBT", (r) => r.normalizedCode === "97153")} />
          <KpiCard label="Unassigned Hours" value={fmtHours(kpis.unassignedHours)} icon={AlertTriangle}
            tone={kpis.unassignedHours > 0 ? "warn" : "default"}
            hint={`${fmtCount(kpis.unassignedRowCount)} rows without an anchor`}
            onClick={() => openDrilldown("Unassigned hours", (r) => !r.owner)} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bcba">BCBA Summary</TabsTrigger>
            <TabsTrigger value="codes">Code Breakdown</TabsTrigger>
            <TabsTrigger value="supervision">Supervision</TabsTrigger>
            <TabsTrigger value="clients">Clients &amp; RBTs</TabsTrigger>
            <TabsTrigger value="audit">Ownership Audit</TabsTrigger>
            <TabsTrigger value="rows">Source Rows</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Hours by BCBA" subtitle="Top 15 owners in the current filter — click a bar to drill down">
                <ChartFrame>
                  <BarChart data={hoursByBcba} layout="vertical" margin={{ left: 24, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tickFormatter={(v) => fmtHours(v)} fontSize={11} />
                    <YAxis type="category" dataKey="name" width={140} fontSize={11} />
                    <Tooltip formatter={(v: number) => fmtHours(v)} />
                    <Bar dataKey="hours" radius={[0, 4, 4, 0]} cursor="pointer"
                      onClick={(d: { key?: string }) => d?.key && openDrilldown(
                        `Hours — ${d.key}`,
                        (r) => (r.owner ?? UNASSIGNED_LABEL) === d.key,
                      )}>
                      {hoursByBcba.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ChartFrame>
              </Panel>

              <Panel title="97153 vs 97155 vs other direct BCBA" subtitle="Hour composition — click a slice for source rows">
                <ChartFrame>
                  <PieChart>
                    <Pie data={compositionData} dataKey="value" nameKey="name" outerRadius={110} label
                      onClick={(d: { name?: string }) => {
                        if (d?.name?.startsWith("97153")) openDrilldown("97153 rows", (r) => r.normalizedCode === "97153");
                        else if (d?.name?.startsWith("97155")) openDrilldown("97155 rows", (r) => r.normalizedCode === "97155");
                        else openDrilldown("Other direct BCBA rows", (r) => r.isAnchor && r.normalizedCode !== "97155");
                      }}>
                      {compositionData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtHours(v)} />
                    <Legend />
                  </PieChart>
                </ChartFrame>
              </Panel>

              <Panel title="Top 10 BCBAs" subtitle="By total attributed hours">
                <ChartFrame>
                  <BarChart data={top10.map((b) => ({ name: b.bcba, hours: b.totalHours }))} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={10} interval={0} angle={-25} textAnchor="end" height={70} />
                    <YAxis tickFormatter={(v) => fmtHours(v)} fontSize={11} />
                    <Tooltip formatter={(v: number) => fmtHours(v)} />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} cursor="pointer"
                      onClick={(d: { name?: string }) => d?.name && openDrilldown(
                        `Hours — ${d.name}`, (r) => r.owner === d.name)} />
                  </BarChart>
                </ChartFrame>
              </Panel>

              <Panel title="Code mix" subtitle="Normalized procedure code families">
                <ChartFrame>
                  <PieChart>
                    <Pie data={codeMix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={110} label
                      onClick={(d: { name?: string }) => d?.name && openDrilldown(
                        `Code ${d.name}`, (r) => r.normalizedCode === d.name)}>
                      {codeMix.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtHours(v)} />
                    <Legend />
                  </PieChart>
                </ChartFrame>
              </Panel>
            </div>

            <Panel title="Monthly trend" subtitle="97153, 97155 and other hours by service month">
              <ChartFrame height={260}>
                <LineChart data={model.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="monthKey" fontSize={11} />
                  <YAxis tickFormatter={(v) => fmtHours(v)} fontSize={11} />
                  <Tooltip formatter={(v: number) => fmtHours(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="hours97153" name="97153" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="hours97155" name="97155" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="other" name="Other" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} />
                </LineChart>
              </ChartFrame>
            </Panel>
          </TabsContent>

          {/* BCBA summary */}
          <TabsContent value="bcba">
            <Panel title="BCBA summary" subtitle="Every BCBA in the current filter. Click a row for the exact source rows.">
              <DataTable
                headers={["BCBA", "Total hrs", "97153", "97155", "Direct BCBA", "Supervision %", "Clients", "RBTs", "Rows", "States"]}
                rows={model.bcbaSummaries.map((b) => ({
                  key: b.bcba,
                  onClick: () => openDrilldown(`Source rows — ${b.bcba}`,
                    (r) => (r.owner ?? UNASSIGNED_LABEL) === b.bcba),
                  cells: [
                    <span className={cn("font-medium", b.isUnassigned && "text-amber-600")}>{b.bcba}</span>,
                    fmtHours(b.totalHours), fmtHours(b.hours97153), fmtHours(b.hours97155),
                    fmtHours(b.directBcbaHours), <SupervisionBadge pct={b.supervisionPct} />,
                    fmtCount(b.clientCount), fmtCount(b.rbtCount), fmtCount(b.rowCount),
                    b.states.join(", ") || "—",
                  ],
                }))}
              />
            </Panel>
          </TabsContent>

          {/* Code breakdown */}
          <TabsContent value="codes">
            <Panel title="Code breakdown" subtitle="Normalized by prefix; raw codes preserved in the drilldown.">
              <DataTable
                headers={["Normalized code", "Hours", "Rows", "BCBAs", "Clients", "Raw code variants"]}
                rows={model.codeSummaries.map((c) => ({
                  key: c.normalizedCode,
                  onClick: () => openDrilldown(`Code ${c.normalizedCode}`,
                    (r) => r.normalizedCode === c.normalizedCode),
                  cells: [
                    <span className="font-medium">{c.normalizedCode}</span>,
                    fmtHours(c.hours), fmtCount(c.rowCount), fmtCount(c.bcbaCount), fmtCount(c.clientCount),
                    <span className="text-xs text-muted-foreground">{c.rawCodes.slice(0, 6).join(", ")}</span>,
                  ],
                }))}
              />
            </Panel>
          </TabsContent>

          {/* Supervision */}
          <TabsContent value="supervision" className="space-y-4">
            <Panel title="Supervision % by BCBA" subtitle="97155 ÷ 97153 × 100 · red <5% · yellow 5–9.9% · green ≥10%">
              <ChartFrame>
                <BarChart data={supervisionByBcba} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" fontSize={10} interval={0} angle={-25} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(v) => `${v}%`} fontSize={11} />
                  <Tooltip formatter={(v: number) => fmtPct(v)} />
                  <Bar dataKey="pct" radius={[4, 4, 0, 0]} cursor="pointer"
                    onClick={(d: { name?: string }) => d?.name && openDrilldown(
                      `Supervision inputs — ${d.name}`,
                      (r) => r.owner === d.name && (r.normalizedCode === "97153" || r.normalizedCode === "97155"))}>
                    {supervisionByBcba.map((d, i) => (
                      <Cell key={i} fill={d.status === "urgent" ? "#ef4444" : d.status === "monitor" ? "#f59e0b" : "#22c55e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartFrame>
            </Panel>
            <Panel title="Supervision compliance" subtitle="Dash means the BCBA has no 97153 hours in this filter.">
              <DataTable
                headers={["BCBA", "97155 hrs", "97153 hrs", "Supervision %", "Status", "Clients"]}
                rows={model.supervisionSummaries.map((b) => ({
                  key: b.bcba,
                  onClick: () => openDrilldown(`Supervision inputs — ${b.bcba}`,
                    (r) => (r.owner ?? UNASSIGNED_LABEL) === b.bcba &&
                      (r.normalizedCode === "97153" || r.normalizedCode === "97155")),
                  cells: [
                    <span className="font-medium">{b.bcba}</span>,
                    fmtHours(b.supervisionHours), fmtHours(b.direct97153Hours),
                    <SupervisionBadge pct={b.supervisionPct} />,
                    b.status === "none" ? "No 97153" :
                      b.status === "urgent" ? "Urgent (below 5%)" :
                        b.status === "monitor" ? "Monitor (5–9.9%)" : "Healthy (10%+)",
                    fmtCount(b.clientCount),
                  ],
                }))}
              />
            </Panel>
          </TabsContent>

          {/* Clients & RBTs */}
          <TabsContent value="clients" className="grid gap-4 lg:grid-cols-2">
            <Panel title="Clients" subtitle="Attributed to the inferred BCBA owner at DOS.">
              <DataTable
                headers={["Client", "Client ID", "Owner", "Total hrs", "97153", "Sup %", "RBTs", "State"]}
                rows={model.clientSummaries.slice(0, 500).map((c) => ({
                  key: c.clientKey,
                  onClick: () => openDrilldown(`Source rows — ${c.clientName}`, (r) => r.clientKey === c.clientKey),
                  cells: [
                    <span className="font-medium">{c.clientName || "—"}</span>,
                    c.clientId || "—",
                    c.owner ?? <span className="text-amber-600">Unassigned</span>,
                    fmtHours(c.totalHours), fmtHours(c.hours97153),
                    <SupervisionBadge pct={c.supervisionPct} />,
                    fmtCount(c.rbtCount), c.state || "—",
                  ],
                }))}
              />
            </Panel>
            <Panel title="RBTs" subtitle="97153 direct hours by rendering provider.">
              <DataTable
                headers={["RBT", "97153 hrs", "Clients", "BCBAs", "Rows"]}
                rows={model.rbtSummaries.slice(0, 500).map((rb) => ({
                  key: rb.rbt,
                  onClick: () => openDrilldown(`97153 rows — ${rb.rbt}`,
                    (r) => r.normalizedCode === "97153" && r.renderingProvider === rb.rbt),
                  cells: [
                    <span className="font-medium">{rb.rbt}</span>,
                    fmtHours(rb.hours97153), fmtCount(rb.clientCount),
                    rb.bcbas.slice(0, 3).join(", ") || "—", fmtCount(rb.rowCount),
                  ],
                }))}
              />
            </Panel>
          </TabsContent>

          {/* Ownership audit */}
          <TabsContent value="audit" className="space-y-4">
            <Panel title="Ownership segments" subtitle="Month-first inference from BCBA anchor rows.">
              <DataTable
                headers={["Client", "Month", "BCBA", "From", "To", "Reason", "Anchors"]}
                rows={model.ownershipAudit.segments.slice(0, 800).map((s, i) => ({
                  key: `${s.clientKey}-${s.monthKey}-${s.bcba}-${i}`,
                  onClick: () => openDrilldown(`${s.clientName} — ${s.monthKey}`,
                    (r) => r.clientKey === s.clientKey && r.date >= s.startDate &&
                      (!s.endDate || r.date <= s.endDate)),
                  cells: [
                    <span className="font-medium">{s.clientName}</span>, s.monthKey, s.bcba,
                    s.startDate, s.endDate ?? "open",
                    <span className="text-xs">{OWNERSHIP_REASON_LABELS[s.reason]}</span>,
                    fmtCount(s.anchorCount),
                  ],
                }))}
              />
            </Panel>
            <Panel title="Same-month conflicts" subtitle="Months where more than one BCBA anchored the client.">
              <DataTable
                headers={["Client", "Month", "BCBAs (first anchor date)"]}
                rows={model.ownershipAudit.conflicts.slice(0, 400).map((c, i) => ({
                  key: `${c.clientKey}-${c.monthKey}-${i}`,
                  onClick: () => openDrilldown(`${c.clientName} — ${c.monthKey}`,
                    (r) => r.clientKey === c.clientKey && r.monthKey === c.monthKey),
                  cells: [
                    <span className="font-medium">{c.clientName}</span>, c.monthKey,
                    c.bcbas.map((b) => `${b.bcba} (${b.firstAnchorDate})`).join(" → "),
                  ],
                }))}
              />
            </Panel>
            <Panel title="Gaps & carried-forward months" subtitle="Months with no anchor, backfilled months, and clients with no anchor at all.">
              <DataTable
                headers={["Client", "Month", "Owner applied", "Hours", "Reason"]}
                rows={model.ownershipAudit.gaps.slice(0, 400).map((g, i) => ({
                  key: `${g.clientKey}-${g.monthKey}-${i}`,
                  onClick: () => openDrilldown(`${g.clientName} — ${g.monthKey}`,
                    (r) => r.clientKey === g.clientKey && r.monthKey === g.monthKey),
                  cells: [
                    <span className="font-medium">{g.clientName}</span>, g.monthKey,
                    g.owner ?? <span className="text-amber-600">Unassigned</span>,
                    fmtHours(g.hours),
                    <span className="text-xs">{OWNERSHIP_REASON_LABELS[g.reason]}</span>,
                  ],
                }))}
              />
            </Panel>
            <Panel
              title="Authorization context (fallback only)"
              subtitle="Shown for clients with no BCBA anchor. Authorizations never override a valid billing anchor."
            >
              {unassignedClients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No authorization context needed — every client with hours in view has a billing anchor.
                </p>
              ) : (
                <DataTable
                  headers={["Client", "Payor", "State", "Code", "Start", "End", "Authorized hrs", "Status"]}
                  rows={unassignedClients.slice(0, 200).map((a, i) => ({
                    key: `${a.client_name}-${i}`,
                    cells: [
                      <span className="font-medium">{a.client_name ?? "—"}</span>,
                      a.payor ?? "—", a.state ?? "—", a.procedure_code ?? "—",
                      a.start_date ?? "—", a.end_date ?? "—",
                      fmtHours(Number(a.authorized_hours ?? 0)), a.status ?? "—",
                    ],
                  }))}
                />
              )}
            </Panel>
          </TabsContent>

          {/* Source rows */}
          <TabsContent value="rows">
            <Panel
              title="Source rows"
              subtitle={`${fmtCount(filteredRows.length)} rows match the current filters.`}
              action={
                <Button variant="outline" size="sm" onClick={exportFiltered} disabled={!filteredRows.length}>
                  <Download className="h-4 w-4 mr-1.5" /> CSV
                </Button>
              }
            >
              <SourceRowTable rows={filteredRows.slice(0, 1000)} />
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      {/* Drilldown dialog */}
      <Dialog open={!!drilldown} onOpenChange={(o) => !o && setDrilldown(null)}>
        <DialogContent className="max-w-[95vw] xl:max-w-[1300px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4" /> {drilldown?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {fmtCount(drilldown?.rows.length ?? 0)} source rows ·{" "}
              {fmtHours((drilldown?.rows ?? []).reduce((s, r) => s + (r.hours || 0), 0))} hours
              {drilldown?.subtitle ? ` · ${drilldown.subtitle}` : ""}
            </span>
            <Button variant="outline" size="sm" onClick={exportDrilldown} disabled={!drilldown?.rows.length}>
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
          </div>
          <div className="max-h-[65vh] overflow-auto rounded-lg border">
            <SourceRowTable rows={(drilldown?.rows ?? []).slice(0, 2000)} />
          </div>
        </DialogContent>
      </Dialog>
    </OSShell>
  );
}

/* ---------------- shared table helpers ---------------- */

function ChartFrame({ children, height = 320 }: { children: React.ReactElement; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}

function DataTable({ headers, rows }: {
  headers: string[];
  rows: { key: string; cells: React.ReactNode[]; onClick?: () => void }[];
}) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No rows for the current filters.</p>;
  }
  return (
    <div className="overflow-auto rounded-lg border max-h-[600px]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-20 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="bg-card px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-[0.1em] text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.key}
              onClick={r.onClick}
              className={cn("border-t", r.onClick && "cursor-pointer hover:bg-muted/40")}
            >
              {r.cells.map((c, i) => (
                <td key={i} className="px-3 py-2 whitespace-nowrap tabular-nums">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourceRowTable({ rows }: { rows: OwnedBillingRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No source rows.</p>;
  }
  return (
    <div className="overflow-auto max-h-[600px]">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-20 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
          <tr>
            {DRILLDOWN_COLUMNS.map((h) => (
              <th key={h} className="bg-card px-2.5 py-2 text-left font-semibold uppercase tracking-[0.1em] text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.clientKey}-${r.date}-${i}`} className="border-t hover:bg-muted/30">
              {drilldownRowToCells(r).map((c, j) => (
                <td key={j} className="px-2.5 py-1.5 whitespace-nowrap tabular-nums">
                  {j === 7 ? fmtHours(Number(c)) : String(c || "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "drilldown";
}

function downloadText(name: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
