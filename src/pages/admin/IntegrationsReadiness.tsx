import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, PlayCircle, RefreshCw, ShieldCheck, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  PROVIDER_READINESS_MANIFEST,
  READINESS_LABELS,
  deriveReadiness,
  type ProviderReadinessEntry,
  type ReadinessRuntimeState,
} from "@/lib/os/integrations/readinessManifest";
import {
  listIntegrationConnections,
  listIntegrationSyncRuns,
  testIntegrationConnection,
  runIntegrationSync,
  type IntegrationConnectionRow,
  type IntegrationSyncRunRow,
} from "@/lib/os/integrations/backend";

/**
 * Super Admin — Integrations Readiness (Slice 3).
 *
 * Read-only, role-gated view of the provider adapter registry. Every
 * provider gets ONE truthful readiness label derived from static
 * capabilities + live backend rows (`integration_connections`,
 * `integration_sync_runs`). Capability-gated controls only:
 *   - Test Connection renders iff `capabilities.probe === true`.
 *   - Sync (dry-run) renders iff `capabilities.pullSync === true`.
 *
 * Sync ALWAYS invokes with `{ dryRun: true }`. Outbound actions,
 * automations, notifications, writebacks, and webhook subscription
 * creation are NEVER surfaced from this view.
 */

const TONE_CLS: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  slate: "bg-muted text-muted-foreground border-border/60",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
};

function fmt(ts: string | null | undefined): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function IntegrationsReadiness() {
  const [connections, setConnections] = useState<IntegrationConnectionRow[]>([]);
  const [runs, setRuns] = useState<IntegrationSyncRunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<Record<string, "probe" | "sync" | null>>({});

  useEffect(() => {
    void reload();
  }, []);

  async function reload() {
    setLoading(true);
    try {
      const [conns, syncRuns] = await Promise.all([
        listIntegrationConnections(),
        listIntegrationSyncRuns(),
      ]);
      setConnections(conns);
      setRuns(syncRuns);
    } finally {
      setLoading(false);
    }
  }

  const runtimeByProvider = useMemo(() => {
    const map = new Map<string, ReadinessRuntimeState>();
    for (const entry of PROVIDER_READINESS_MANIFEST) {
      const conn = connections.find((c) => c.integration_id === entry.id);
      const lastRun = runs.find((r) => r.integration_id === entry.id);
      map.set(entry.id, {
        connectionStatus: conn?.status ?? null,
        lastSuccessAt: conn?.last_success_at ?? null,
        lastErrorAt: conn?.last_error_at ?? null,
        lastError: conn?.last_error ?? null,
        lastSyncAt: lastRun?.completed_at ?? lastRun?.started_at ?? null,
        lastSyncStatus: lastRun?.status ?? null,
      });
    }
    return map;
  }, [connections, runs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PROVIDER_READINESS_MANIFEST;
    return PROVIDER_READINESS_MANIFEST.filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        e.displayName.toLowerCase().includes(q) ||
        e.classification.toLowerCase().includes(q),
    );
  }, [query]);

  async function handleProbe(entry: ProviderReadinessEntry) {
    if (!entry.capabilities.probe) return;
    setBusy((b) => ({ ...b, [entry.id]: "probe" }));
    try {
      const res = await testIntegrationConnection(entry.id);
      toast[res.ok ? "success" : "error"](
        `${entry.displayName}: ${res.status}`,
        { description: res.message },
      );
      await reload();
    } finally {
      setBusy((b) => ({ ...b, [entry.id]: null }));
    }
  }

  async function handleDryRunSync(entry: ProviderReadinessEntry) {
    if (!entry.capabilities.pullSync) return;
    setBusy((b) => ({ ...b, [entry.id]: "sync" }));
    try {
      // ALWAYS dry-run from this view. Never surface writeback controls.
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase.functions.invoke(
        "integration-run-sync",
        { body: { integrationId: entry.id, dryRun: true } },
      );
      if (error) {
        toast.error(`${entry.displayName}: sync failed`, { description: error.message });
      } else {
        const r = data as { ok: boolean; status: string; message?: string };
        toast[r?.ok ? "success" : "error"](
          `${entry.displayName}: dry-run ${r?.status ?? "done"}`,
          { description: r?.message ?? undefined },
        );
      }
      await reload();
    } finally {
      setBusy((b) => ({ ...b, [entry.id]: null }));
    }
  }

  return (
    <div data-testid="integrations-readiness" className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="size-3.5" /> Super Admin
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Integration Readiness</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Truthful, read-only view of every provider adapter in the Blossom OS registry.
            No secret values are exposed. Sync always runs as a dry-run.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search providers"
              className="w-56 pl-8"
              aria-label="Search providers"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
            Refresh
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((entry) => {
          const rt = runtimeByProvider.get(entry.id) ?? {};
          const { label, nextAction } = deriveReadiness(entry, rt);
          const badge = READINESS_LABELS[label];
          const isBusy = busy[entry.id];
          return (
            <Card
              key={entry.id}
              data-testid={`provider-row-${entry.id}`}
              className={cn(
                "rounded-2xl border-border/70 bg-card p-5",
                entry.retired && "opacity-70",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[15px] font-semibold tracking-tight">{entry.displayName}</h3>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{entry.id}</code>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{entry.classification}</p>
                </div>
                <span
                  data-testid={`readiness-label-${entry.id}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
                    TONE_CLS[badge.tone],
                  )}
                >
                  {badge.text}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="capabilities">
                {entry.capabilities.probe && <Badge variant="secondary" className="text-[10px]">probe</Badge>}
                {entry.capabilities.pullSync && <Badge variant="secondary" className="text-[10px]">pull sync</Badge>}
                {entry.capabilities.webhook && <Badge variant="secondary" className="text-[10px]">webhook</Badge>}
                {entry.capabilities.oauth && <Badge variant="secondary" className="text-[10px]">oauth</Badge>}
                {entry.capabilities.localOnly && <Badge variant="secondary" className="text-[10px]">local only</Badge>}
                {entry.capabilities.outboundDisabled && (
                  <Badge variant="secondary" className="text-[10px]">outbound disabled</Badge>
                )}
                {entry.capabilities.operationalState && (
                  <Badge variant="secondary" className="text-[10px]">{entry.capabilities.operationalState}</Badge>
                )}
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Required secrets</dt>
                  <dd className="mt-0.5 break-all font-mono text-[11px]">
                    {entry.requiredSecrets.length ? entry.requiredSecrets.join(", ") : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Optional secrets</dt>
                  <dd className="mt-0.5 break-all font-mono text-[11px]">
                    {entry.optionalSecrets.length ? entry.optionalSecrets.join(", ") : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last probe</dt>
                  <dd className="mt-0.5">{fmt(rt.lastSuccessAt ?? rt.lastErrorAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last sync</dt>
                  <dd className="mt-0.5">
                    {fmt(rt.lastSyncAt)}
                    {rt.lastSyncStatus ? ` · ${rt.lastSyncStatus}` : ""}
                  </dd>
                </div>
                {rt.lastError && (
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Last error</dt>
                    <dd className="mt-0.5 text-rose-600 dark:text-rose-400">{rt.lastError}</dd>
                  </div>
                )}
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Next action</dt>
                  <dd className="mt-0.5">{nextAction}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                <a
                  href={entry.capabilities.documentationUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-3.5" /> Docs
                </a>
                <div className="ml-auto flex items-center gap-2">
                  {entry.capabilities.probe && !entry.retired && (
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`probe-btn-${entry.id}`}
                      onClick={() => void handleProbe(entry)}
                      disabled={!!isBusy}
                    >
                      {isBusy === "probe" ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                      Test connection
                    </Button>
                  )}
                  {entry.capabilities.pullSync && !entry.retired && (
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`sync-btn-${entry.id}`}
                      onClick={() => void handleDryRunSync(entry)}
                      disabled={!!isBusy}
                    >
                      {isBusy === "sync" ? (
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      ) : (
                        <PlayCircle className="mr-1.5 size-3.5" />
                      )}
                      Sync (dry-run)
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
