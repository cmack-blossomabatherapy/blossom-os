import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type IngestResp = {
  processed?: number;
  results?: Array<{ id: string; status: string; chunks: number; error?: string }>;
  remaining?: number;
  error?: string;
};

type StatusRow = { ingest_status: string; count: number };

async function fetchStatusCounts(): Promise<StatusRow[]> {
  // Grouped count via a small select — we materialize client-side.
  const { data, error } = await supabase
    .from("hr_resources")
    .select("ingest_status")
    .not("storage_path", "is", null)
    .neq("storage_path", "");
  if (error) throw error;
  const map = new Map<string, number>();
  for (const row of (data ?? []) as Array<{ ingest_status: string | null }>) {
    const k = row.ingest_status ?? "pending";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([ingest_status, count]) => ({ ingest_status, count }));
}

export function BlossomAIIngestPanel() {
  const [counts, setCounts] = useState<StatusRow[]>([]);
  const [running, setRunning] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [lastBatch, setLastBatch] = useState<IngestResp | null>(null);
  const continuousRef = useRef(false);

  async function refresh() {
    try { setCounts(await fetchStatusCounts()); } catch { /* ignore */ }
  }

  useEffect(() => { void refresh(); }, []);

  async function runBatch(limit = 25): Promise<IngestResp | null> {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke<IngestResp>("blossom-ai-ingest", {
        body: { limit },
      });
      if (error) {
        toast({ title: "Ingest failed", description: error.message, variant: "destructive" });
        return null;
      }
      setLastBatch(data ?? null);
      await refresh();
      return data ?? null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Ingest failed", description: msg, variant: "destructive" });
      return null;
    } finally {
      setRunning(false);
    }
  }

  async function runContinuous() {
    continuousRef.current = true;
    setContinuous(true);
    try {
      // Keep batching until pending is 0 or the user stops.
      // Safety cap: 40 iterations per click (= 1000 resources / click).
      for (let i = 0; i < 40 && continuousRef.current; i++) {
        const resp = await runBatch(25);
        if (!resp || (resp.remaining ?? 0) === 0 || resp.processed === 0) break;
      }
    } finally {
      continuousRef.current = false;
      setContinuous(false);
    }
  }

  function stopContinuous() {
    continuousRef.current = false;
  }

  const pending = counts.find((c) => c.ingest_status === "pending")?.count ?? 0;
  const ingested = counts.find((c) => c.ingest_status === "ingested")?.count ?? 0;
  const errored = counts.find((c) => c.ingest_status === "error")?.count ?? 0;
  const unsupported = counts.find((c) => c.ingest_status === "unsupported_type")?.count ?? 0;
  const transcriptMissing = counts.find((c) => c.ingest_status === "transcript_missing")?.count ?? 0;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[14px] font-semibold">Blossom AI ingestion</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Extract text from Resource Library files, embed, and index for role-aware AI retrieval.
            Videos are marked <span className="font-mono">transcript_missing</span> until a transcript pipeline is added.
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={() => void runBatch(25)}
            disabled={running || continuous || pending === 0}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12.5px] font-medium hover:bg-muted disabled:opacity-50"
          >
            {running && !continuous ? "Running…" : "Ingest 25"}
          </button>
          {continuous ? (
            <button
              type="button"
              onClick={stopContinuous}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[12.5px] font-medium text-rose-800 hover:bg-rose-100"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void runContinuous()}
              disabled={running || pending === 0}
              className="rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Ingest all pending
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
        <StatTile label="Pending" value={pending} tone={pending > 0 ? "amber" : "slate"} />
        <StatTile label="Ingested" value={ingested} tone="emerald" />
        <StatTile label="Errors" value={errored} tone={errored > 0 ? "rose" : "slate"} />
        <StatTile label="Unsupported type" value={unsupported} />
        <StatTile label="Video (no transcript)" value={transcriptMissing} />
      </div>

      {lastBatch && (
        <div className="mt-3 rounded-lg bg-muted/40 p-3 text-[12px]">
          Last batch: {lastBatch.processed ?? 0} processed · {lastBatch.remaining ?? 0} still pending
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, tone = "slate" }: { label: string; value: number; tone?: string }) {
  const toneClass: Record<string, string> = {
    slate: "bg-slate-50 text-slate-800 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    rose: "bg-rose-50 text-rose-800 border-rose-200",
  };
  return (
    <div className={`rounded-xl border p-3 ${toneClass[tone]}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}