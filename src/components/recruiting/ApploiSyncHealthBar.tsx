import { RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useApploiSyncHealth, syncApploiNow } from "@/hooks/useApploiIntegration";
import { cn } from "@/lib/utils";

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/**
 * Compact, operator-safe Apploi sync health strip for Recruiting pages.
 * Shows only connection state, last refresh, and ingested counts — no
 * credentials, no upstream error bodies, no raw diagnostics.
 */
export function ApploiSyncHealthBar({ className }: { className?: string }) {
  const { health, loading, refetch } = useApploiSyncHealth();
  const [syncing, setSyncing] = useState(false);

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-[11px] text-muted-foreground", className)}>
        <Loader2 className="h-3 w-3 animate-spin" /> Checking Apploi…
      </div>
    );
  }
  if (!health) return null;

  const connected = health.connection_status === "connected" && health.enabled;

  const onSync = async () => {
    setSyncing(true);
    await syncApploiNow();
    await refetch();
    setSyncing(false);
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-border/70 bg-card px-3 py-2",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
        {connected ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
        )}
        Apploi {connected ? "connected" : "not connected"}
      </span>
      <span className="text-[11px] text-muted-foreground">
        Last refresh {timeAgo(health.last_synced_at)}
      </span>
      <span className="text-[11px] text-muted-foreground">
        {health.jobs_count} job postings · {health.candidates_count} applicants
      </span>
      {connected && !health.applicant_scope_available && (
        <span className="text-[11px] text-amber-700 dark:text-amber-400">
          Applicant records are not yet shared with Blossom by Apploi — job postings only.
        </span>
      )}
      <button
        onClick={onSync}
        disabled={syncing || !connected}
        className="ml-auto inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border/70 text-[11px] font-medium hover:bg-muted/40 transition disabled:opacity-50"
      >
        {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        Sync now
      </button>
    </div>
  );
}
