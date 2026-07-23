/**
 * CTM operations health panel — admin-only diagnostics.
 *
 * Renders:
 *   • live "Test connection" button that invokes the read-only
 *     `ctm-test-connection` edge function (safe, no writes to CTM);
 *   • aggregate sync-run counts (ok / error / running) + last run and lag;
 *   • unmapped tracking numbers surfaced by `ctm_unmatched_tracking_numbers`;
 *   • the last 5 sync-run errors so operators can triage without shelling
 *     into edge logs.
 *
 * INGEST_ONLY: this panel never enables outbound actions. The "Test
 * connection" button issues a single GET to CTM's Accounts endpoint.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Activity, RefreshCw, ShieldAlert } from "lucide-react";

type Verdict = "connected" | "degraded" | "disconnected" | "unknown";

interface ConnectionResult {
  status: Verdict;
  reason: string | null;
  http_status?: number;
  latency_ms?: number;
  account?: { id?: string | number; name?: string | null; status?: string | null; timezone?: string | null } | null;
  secrets?: Record<string, boolean>;
  missing?: string[];
  checked_at?: string;
}

interface SyncRunRow {
  id: string;
  kind: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  calls_fetched: number;
  calls_upserted: number;
  error: string | null;
}

interface UnmappedRow {
  tracking_number: string;
  call_count: number;
  last_seen: string | null;
}

function VerdictBadge({ status }: { status: Verdict }) {
  const map: Record<Verdict, { label: string; cls: string }> = {
    connected:    { label: "Connected",    cls: "bg-emerald-100 text-emerald-800" },
    degraded:     { label: "Degraded",     cls: "bg-amber-100 text-amber-800" },
    disconnected: { label: "Disconnected", cls: "bg-destructive/10 text-destructive" },
    unknown:      { label: "Unknown",      cls: "bg-slate-100 text-slate-700" },
  };
  const v = map[status];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v.cls}`}>{v.label}</span>;
}

export function CtmOperationsPanel() {
  const [result, setResult] = useState<ConnectionResult>({ status: "unknown", reason: null });
  const [testing, setTesting] = useState(false);
  const [runs, setRuns] = useState<SyncRunRow[]>([]);
  const [unmapped, setUnmapped] = useState<UnmappedRow[]>([]);
  const [loading, setLoading] = useState(true);

  const testConnection = useCallback(async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("ctm-test-connection", { body: {} });
    setTesting(false);
    if (error) {
      setResult({ status: "disconnected", reason: error.message });
      toast.error(`CTM check failed: ${error.message}`);
      return;
    }
    setResult((data ?? { status: "unknown", reason: null }) as ConnectionResult);
    toast.success(`CTM status: ${(data as ConnectionResult)?.status ?? "unknown"}`);
  }, []);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    const [{ data: r }, { data: u }] = await Promise.all([
      supabase.from("ctm_sync_runs")
        .select("id,kind,status,started_at,finished_at,calls_fetched,calls_upserted,error")
        .order("started_at", { ascending: false })
        .limit(20),
      supabase.from("ctm_call_events")
        .select("tracking_number,called_at")
        .is("intake_lead_id", null)
        .not("tracking_number", "is", null)
        .order("called_at", { ascending: false, nullsFirst: false })
        .limit(100),
    ]);
    setRuns((r ?? []) as SyncRunRow[]);
    // Client-side aggregate for unmapped tracking numbers.
    const byNumber = new Map<string, UnmappedRow>();
    for (const row of (u ?? []) as Array<{ tracking_number: string | null; called_at: string | null }>) {
      if (!row.tracking_number) continue;
      const cur = byNumber.get(row.tracking_number) ?? { tracking_number: row.tracking_number, call_count: 0, last_seen: null };
      cur.call_count += 1;
      if (!cur.last_seen || (row.called_at && row.called_at > cur.last_seen)) cur.last_seen = row.called_at;
      byNumber.set(row.tracking_number, cur);
    }
    setUnmapped(Array.from(byNumber.values()).sort((a, b) => b.call_count - a.call_count).slice(0, 10));
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadHealth();
    void testConnection();
  }, [loadHealth, testConnection]);

  const lastOk = runs.find((r) => r.status === "ok");
  const okCount = runs.filter((r) => r.status === "ok").length;
  const errCount = runs.filter((r) => r.status === "error").length;
  const running  = runs.filter((r) => r.status === "running").length;
  const totalFetched  = runs.reduce((n, r) => n + (r.calls_fetched ?? 0), 0);
  const totalUpserted = runs.reduce((n, r) => n + (r.calls_upserted ?? 0), 0);
  const lagMinutes = lastOk?.finished_at ? Math.round((Date.now() - new Date(lastOk.finished_at).getTime()) / 60000) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-0.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" /> CTM operations health
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Read-only health check. Never enables outbound actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { void loadHealth(); }} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => { void testConnection(); }} disabled={testing}>
            {testing ? "Testing…" : "Test connection"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs uppercase text-muted-foreground">Connection</div>
            <div className="mt-1 flex items-center gap-2"><VerdictBadge status={result.status} /></div>
            <div className="mt-1 text-xs text-muted-foreground truncate">
              {result.status === "connected" && result.account?.name
                ? `Account: ${result.account.name} · HTTP ${result.http_status} · ${result.latency_ms}ms`
                : result.reason ?? "Not yet checked"}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs uppercase text-muted-foreground">Sync runs</div>
            <div className="mt-1 text-xl font-semibold">{runs.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {okCount} ok · {errCount} error · {running} running
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs uppercase text-muted-foreground">Calls processed</div>
            <div className="mt-1 text-xl font-semibold">{totalUpserted}</div>
            <div className="mt-1 text-xs text-muted-foreground">Fetched {totalFetched}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs uppercase text-muted-foreground">Ingestion lag</div>
            <div className="mt-1 text-xl font-semibold">{lagMinutes == null ? "—" : `${lagMinutes}m`}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {lastOk?.finished_at ? `Last success ${new Date(lastOk.finished_at).toLocaleString()}` : "No successful run yet"}
            </div>
          </div>
        </div>

        {result.missing && result.missing.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <ShieldAlert className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-xs">
              Missing secrets prevent CTM ingestion:{" "}
              {result.missing.map((s) => (
                <Badge key={s} variant="destructive" className="mr-1">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Recent sync errors</div>
          <div className="rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-left uppercase text-muted-foreground">
                <tr><th className="p-2">When</th><th className="p-2">Kind</th><th className="p-2">Status</th><th className="p-2">Error</th></tr>
              </thead>
              <tbody>
                {runs.filter((r) => r.status === "error").slice(0, 5).map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{new Date(r.started_at).toLocaleString()}</td>
                    <td className="p-2">{r.kind}</td>
                    <td className="p-2">{r.status}</td>
                    <td className="p-2 text-destructive break-all">{r.error ?? "—"}</td>
                  </tr>
                ))}
                {runs.filter((r) => r.status === "error").length === 0 && (
                  <tr><td colSpan={4} className="p-3 text-center text-muted-foreground">No sync errors recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Top unmapped tracking numbers</div>
          <div className="rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-left uppercase text-muted-foreground">
                <tr><th className="p-2">Tracking #</th><th className="p-2">Unlinked calls</th><th className="p-2">Last seen</th></tr>
              </thead>
              <tbody>
                {unmapped.map((r) => (
                  <tr key={r.tracking_number} className="border-t">
                    <td className="p-2 font-mono">{r.tracking_number}</td>
                    <td className="p-2">{r.call_count}</td>
                    <td className="p-2">{r.last_seen ? new Date(r.last_seen).toLocaleString() : "—"}</td>
                  </tr>
                ))}
                {unmapped.length === 0 && (
                  <tr><td colSpan={3} className="p-3 text-center text-muted-foreground">All recent CTM calls are linked to leads.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}