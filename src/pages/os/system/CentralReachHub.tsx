import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  UploadCloud, Users, Stethoscope, LayoutDashboard, ShieldCheck,
  History, Gauge, FileSpreadsheet, AlertTriangle, ExternalLink, Link2,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import CentralReachUploads from "./CentralReachUploads";
import CrSyncCenter from "@/pages/admin/CrSyncCenter";
import {
  fetchCrMappingDiagnostics,
  reconcileEmployeeCentralreachIds,
  previewCrReconciliation,
  applyCrReconciliation,
  fetchCrIdentityQueue,
  confirmCrProviderMapping,
  rejectCrProviderMapping,
  unlinkCrProviderMapping,
  type CrMappingDiagnosticRow,
  type CrReconcilePreviewRow,
  type CrIdentityQueueRow,
} from "@/lib/os/clinicianIdentity";
import { toast } from "@/hooks/use-toast";

type HubTab =
  | "overview"
  | "reporting"
  | "workforce-clinical"
  | "history"
  | "freshness"
  | "data-quality"
  | "identity"
  | "audit";

const TABS: { key: HubTab; label: string; icon: any; help: string }[] = [
  { key: "overview",            label: "Overview",             icon: LayoutDashboard, help: "Freshness heatmap + last runs across every CentralReach import." },
  { key: "reporting",           label: "Reporting Imports",    icon: UploadCloud,     help: "Billing, scheduling, authorization, cancellation, utilization." },
  { key: "workforce-clinical",  label: "Workforce & Clinical", icon: Users,           help: "Employees, clients, assignments, schedule, timesheets, auths, documentation, dashboard audit." },
  { key: "history",             label: "Import History",       icon: History,         help: "Every upload from every path in one list." },
  { key: "freshness",           label: "Freshness",            icon: Gauge,           help: "Configurable staleness thresholds per import type." },
  { key: "data-quality",        label: "Data Quality",         icon: AlertTriangle,   help: "Unknown clients, orphan appointments, mismatches — triage queue." },
  { key: "identity",            label: "Clinician Identity",   icon: Link2,           help: "Reconcile employees to CentralReach provider IDs — the source of truth for RBT/BCBA scoping." },
  { key: "audit",               label: "Audit Log",            icon: ShieldCheck,     help: "Append-only audit of every commit / rollback / config change." },
];

export default function CentralReachHub() {
  const [params, setParams] = useSearchParams();
  const raw = (params.get("tab") as HubTab) || "overview";
  const tab: HubTab = TABS.some((t) => t.key === raw) ? raw : "overview";
  const setTab = (t: HubTab) => setParams((p) => { const n = new URLSearchParams(p); n.set("tab", t); return n; }, { replace: true });

  return (
    <OSShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <UploadCloud className="h-3.5 w-3.5" /> CentralReach Data Hub
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">CentralReach Data Hub</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-3xl">
              One place for every CentralReach import — reporting exports, workforce data, and clinical operations —
              plus freshness, history, data quality, and audit. Replaces the old scattered upload pages.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" asChild variant="outline">
              <Link to="/reports">Open Reports <ExternalLink className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        </header>

        <nav className="flex gap-1 border-b border-border/70 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition ${
                  active
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            );
          })}
        </nav>

        <p className="text-xs text-muted-foreground -mt-3">{TABS.find((t) => t.key === tab)?.help}</p>

        {tab === "overview"           && <OverviewTab onGoto={setTab} />}
        {tab === "reporting"          && <CentralReachUploads embedded />}
        {tab === "workforce-clinical" && <CrSyncCenter />}
        {tab === "history"            && <UnifiedHistoryTab />}
        {tab === "freshness"          && <FreshnessTab />}
        {tab === "data-quality"       && <DataQualityTab />}
        {tab === "identity"           && <IdentityTab />}
        {tab === "audit"              && <AuditTab />}
      </div>
    </OSShell>
  );
}

// ---------- Overview ----------
function OverviewTab({ onGoto }: { onGoto: (t: HubTab) => void }) {
  const [freshness, setFreshness] = useState<any[]>([]);
  const [counts, setCounts] = useState<{ runs: number; shared: number; bcba: number; exceptions: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let f: any[] = [];
      try { const r = await supabase.rpc("cr_sync_freshness"); f = (r.data as any[]) ?? []; } catch { /* ignore */ }
      const [{ count: runs }, { count: shared }, { count: bcba }, { count: exc }] = await Promise.all([
        supabase.from("cr_sync_runs").select("id", { count: "exact", head: true }),
        supabase.from("shared_report_datasets").select("id", { count: "exact", head: true }),
        supabase.from("bcba_productivity_upload_batches").select("id", { count: "exact", head: true }),
        supabase.from("cr_data_quality_exceptions" as any).select("id", { count: "exact", head: true }).eq("status", "open"),
      ]);
      if (cancelled) return;
      setFreshness(f);
      setCounts({ runs: runs ?? 0, shared: shared ?? 0, bcba: bcba ?? 0, exceptions: exc ?? 0 });
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Workforce/clinical runs" value={counts?.runs ?? "—"} onClick={() => onGoto("history")} />
        <StatCard label="Reporting datasets"      value={counts?.shared ?? "—"} onClick={() => onGoto("reporting")} />
        <StatCard label="BCBA productivity batches" value={counts?.bcba ?? "—"} onClick={() => onGoto("reporting")} />
        <StatCard label="Open data-quality issues"  value={counts?.exceptions ?? "—"} tone={(counts?.exceptions ?? 0) > 0 ? "warn" : "ok"} onClick={() => onGoto("data-quality")} />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Freshness by import type</h3>
          <Button size="sm" variant="ghost" onClick={() => onGoto("freshness")}>Configure</Button>
        </div>
        {freshness.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workforce or clinical imports have been run yet. Reporting uploads appear under their own tab.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {freshness.map((row) => (
              <div key={row.type_key} className="p-3 rounded-lg border border-border/60 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{row.type_label ?? row.type_key}</div>
                  <div className="text-xs text-muted-foreground">Last {row.last_success_at ? new Date(row.last_success_at).toLocaleString() : "—"}</div>
                </div>
                <FreshnessBadge level={row.level} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value, onClick, tone = "neutral" }: { label: string; value: any; onClick?: () => void; tone?: "neutral" | "warn" | "ok" }) {
  const toneClass = tone === "warn" ? "text-amber-700" : tone === "ok" ? "text-emerald-700" : "text-foreground";
  return (
    <button onClick={onClick} className="text-left">
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold mt-1 ${toneClass}`}>{value}</div>
      </Card>
    </button>
  );
}

function FreshnessBadge({ level }: { level?: string }) {
  const map: Record<string, string> = {
    current:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    aging:    "bg-amber-50 text-amber-700 border-amber-200",
    stale:    "bg-orange-50 text-orange-700 border-orange-200",
    critical: "bg-red-50 text-red-700 border-red-200",
    no_data:  "bg-muted text-muted-foreground border-border/60",
  };
  const cls = map[level ?? "no_data"] ?? map.no_data;
  return <Badge variant="outline" className={cls}>{level ?? "no_data"}</Badge>;
}

// ---------- Unified History ----------
type HistoryRow = {
  id: string;
  source: "cr_sync" | "shared_report" | "bcba_productivity";
  label: string;
  type: string;
  uploaded: string;
  rows?: number | null;
  status?: string | null;
};

function readableHistoryError(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  const maybe = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
  const parts = [maybe.message, maybe.details, maybe.hint, maybe.code]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0);
  if (parts.length) return parts.join(" — ");
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

async function settledQuery<T>(query: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<PromiseSettledResult<T[]>> {
  try {
    const { data, error } = await query;
    if (error) throw error;
    return { status: "fulfilled", value: data ?? [] };
  } catch (reason) {
    return { status: "rejected", reason };
  }
}

function UnifiedHistoryTab() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [a, b, c] = await Promise.all([
        settledQuery(supabase.from("cr_sync_runs").select("id,type_key,file_name,row_count_total,status,created_at").order("created_at", { ascending: false }).limit(50)),
        settledQuery(supabase.from("shared_report_datasets").select("id,report_key,file_name,uploaded_at,is_active").order("uploaded_at", { ascending: false }).limit(50)),
        settledQuery(supabase.from("bcba_productivity_upload_batches").select("id,file_name,created_at,parsed_row_count,status").order("created_at", { ascending: false }).limit(50)),
      ]);
      if (cancelled) return;
      const merged: HistoryRow[] = [];
      const nextErrors: string[] = [];
      if (a.status === "fulfilled") {
        a.value.forEach((r: any) => merged.push({ id: `crs-${r.id}`, source: "cr_sync", label: r.file_name ?? "—", type: r.type_key, uploaded: r.created_at, rows: r.row_count_total, status: r.status }));
      } else {
        nextErrors.push(`Workforce/clinical imports: ${readableHistoryError(a.reason)}`);
      }
      if (b.status === "fulfilled") {
        b.value.forEach((r: any) => merged.push({ id: `srd-${r.id}`, source: "shared_report", label: r.file_name ?? "—", type: r.report_key, uploaded: r.uploaded_at, rows: null, status: r.is_active ? "active" : "archived" }));
      } else {
        nextErrors.push(`Reporting datasets: ${readableHistoryError(b.reason)}`);
      }
      if (c.status === "fulfilled") {
        c.value.forEach((r: any) => merged.push({ id: `bcba-${r.id}`, source: "bcba_productivity", label: r.file_name ?? "—", type: "bcba_productivity", uploaded: r.created_at, rows: r.parsed_row_count, status: r.status }));
      } else {
        nextErrors.push(`BCBA productivity: ${readableHistoryError(c.reason)}`);
      }
      merged.sort((x, y) => new Date(y.uploaded).getTime() - new Date(x.uploaded).getTime());
      setRows(merged);
      setErrors(nextErrors);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold mb-3">Unified import history</h3>
      {errors.length > 0 && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {errors.map((error) => <div key={error}>{error}</div>)}
        </div>
      )}
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No imports yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b">
              <tr><th className="text-left py-2">When</th><th className="text-left">Source</th><th className="text-left">Type</th><th className="text-left">File</th><th className="text-right">Rows</th><th className="text-left">Status</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/40">
                  <td className="py-2">{new Date(r.uploaded).toLocaleString()}</td>
                  <td><Badge variant="outline" className="text-xs">{r.source}</Badge></td>
                  <td className="text-muted-foreground">{r.type}</td>
                  <td>{r.label}</td>
                  <td className="text-right">{r.rows ?? "—"}</td>
                  <td>{r.status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ---------- Freshness (config) ----------
function FreshnessTab() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { supabase.rpc("cr_sync_freshness").then(({ data }) => setRows((data as any[]) ?? [])); }, []);
  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold mb-3">Freshness levels</h3>
      <p className="text-xs text-muted-foreground mb-4">Thresholds are configured per import type. Edit values via the Workforce &amp; Clinical Imports tab &rarr; Freshness sub-tab (existing CR Sync tooling).</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No freshness data available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((r) => (
            <div key={r.type_key} className="p-3 rounded-lg border border-border/60">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{r.type_label ?? r.type_key}</div>
                <FreshnessBadge level={r.level} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">Age: {r.age_minutes != null ? `${Math.round(r.age_minutes)}m` : "—"}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------- Data Quality ----------
function DataQualityTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("cr_data_quality_exceptions" as any)
      .select("*").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => { setRows((data as any[]) ?? []); setLoading(false); });
  }, []);
  const grouped = useMemo(() => {
    const g: Record<string, number> = {};
    rows.forEach((r) => { g[r.category] = (g[r.category] ?? 0) + 1; });
    return g;
  }, [rows]);
  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-sm font-semibold">Data quality exceptions</h3>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open exceptions. Row-level import errors are logged automatically to <code>cr_sync_run_errors</code> and, when actionable, promoted here.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {Object.entries(grouped).map(([k, v]) => (
              <Badge key={k} variant="outline" className="text-xs">{k}: {v}</Badge>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr><th className="text-left py-2">When</th><th className="text-left">Type</th><th className="text-left">Category</th><th className="text-left">Message</th><th className="text-left">Status</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/40">
                    <td className="py-2">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="text-muted-foreground">{r.type_key}</td>
                    <td>{r.category}</td>
                    <td>{r.message}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

// ---------- Audit ----------
function AuditTab() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("cr_sync_audit").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setRows((data as any[]) ?? []));
  }, []);
  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold mb-3">Audit log</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No audit entries.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b">
              <tr><th className="text-left py-2">When</th><th className="text-left">Action</th><th className="text-left">Actor</th><th className="text-left">Details</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/40">
                  <td className="py-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="font-medium">{r.action}</td>
                  <td className="text-muted-foreground">{r.actor_id ?? "—"}</td>
                  <td className="text-xs text-muted-foreground">{JSON.stringify(r.details ?? {})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ---------- Clinician Identity ----------
function IdentityTab() {
  const [rows, setRows] = useState<CrMappingDiagnosticRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "linked" | "ambiguous" | "candidate" | "unmatched">("all");

  const load = async () => {
    setLoading(true); setError(null);
    try { setRows(await fetchCrMappingDiagnostics()); }
    catch (e: any) { setError(e?.message ?? String(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const totals = useMemo(() => {
    const t = { linked: 0, ambiguous: 0, candidate: 0, unmatched: 0 };
    rows.forEach((r) => { t[r.mapping_status] += 1; });
    return t;
  }, [rows]);

  const visible = filter === "all" ? rows : rows.filter((r) => r.mapping_status === filter);

  const runReconcile = async () => {
    setBusy(true);
    try {
      const res = await reconcileEmployeeCentralreachIds();
      toast({ title: "Reconcile complete", description: `Linked ${res.linked}, ambiguous ${res.ambiguous}, unmatched ${res.unmatched} of ${res.total_employees}.` });
      await load();
    } catch (e: any) {
      toast({ title: "Reconcile failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Clinician ↔ CentralReach identity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Employees are linked to imported CentralReach providers by stable ID first. Name-only matches remain marked so admins can verify before RBT/BCBA experiences trust them.</p>
        </div>
        <Button size="sm" onClick={runReconcile} disabled={busy}>{busy ? "Reconciling…" : "Run reconcile"}</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["all","linked","candidate","ambiguous","unmatched"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full border px-3 py-1 text-xs ${filter === k ? "bg-foreground text-background border-foreground" : "border-border/70 text-muted-foreground hover:text-foreground"}`}
          >
            {k === "all" ? `All (${rows.length})` : `${k} (${totals[k]})`}
          </button>
        ))}
      </div>
      {error && <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing to show for this filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b">
              <tr>
                <th className="text-left py-2">Employee</th>
                <th className="text-left">Credential</th>
                <th className="text-left">Status</th>
                <th className="text-left">CR provider_id</th>
                <th className="text-left">Candidate</th>
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, 400).map((r) => (
                <tr key={r.employee_id} className="border-b border-border/40">
                  <td className="py-2">{[r.first_name, r.last_name].filter(Boolean).join(" ") || r.email || "—"}</td>
                  <td className="text-muted-foreground">{r.credential ?? "—"}</td>
                  <td>
                    <Badge variant="outline" className={
                      r.mapping_status === "linked"    ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                      r.mapping_status === "candidate" ? "border-sky-200 bg-sky-50 text-sky-700" :
                      r.mapping_status === "ambiguous" ? "border-amber-200 bg-amber-50 text-amber-700" :
                                                        "border-border/60 text-muted-foreground"
                    }>
                      {r.mapping_status}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground">{r.centralreach_id ?? "—"}</td>
                  <td className="text-xs text-muted-foreground">{r.candidate_provider_name ? `${r.candidate_provider_name} · ${r.candidate_provider_id}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}