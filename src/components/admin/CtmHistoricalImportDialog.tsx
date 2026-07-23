/**
 * CTM historical import — safe, read-only backfill with explicit confirm.
 *
 * Flow:
 *   1. Operator picks start/end dates (default: last 30 days).
 *   2. "Preview (dry-run)" issues the same paginated CTM read but does NOT
 *      upsert into Blossom — returns fetched/duplicate counts only.
 *   3. Operator sees preview, then clicks "Confirm import" — that call
 *      creates the job and runs it (checkpointed, resumable).
 *   4. Live status polling shows pages processed, calls upserted, review
 *      queued, rate-limit hits, and errors. "Resume" continues a paused
 *      job. "Cancel" marks it cancelled.
 *
 * INGEST_ONLY guardrails are enforced in the edge function; this dialog
 * exposes no outbound CTM writes.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, PlayCircle, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

type Job = {
  id: string;
  status: "pending" | "running" | "paused" | "completed" | "failed" | "cancelled";
  dry_run: boolean;
  start_date: string;
  end_date: string;
  cursor_page: number;
  pages_processed: number;
  calls_fetched: number;
  calls_upserted: number;
  calls_duplicate: number;
  leads_linked: number;
  leads_created: number;
  review_queued: number;
  rate_limit_hits: number;
  last_error: string | null;
  summary: Record<string, unknown>;
};

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function CtmHistoricalImportDialog({ open, onOpenChange }: {
  open: boolean; onOpenChange: (b: boolean) => void;
}) {
  const [start, setStart] = useState(isoDaysAgo(30));
  const [end, setEnd] = useState(isoDaysAgo(0));
  const [busy, setBusy] = useState<null | "preview" | "start" | "resume" | "cancel">(null);
  const [preview, setPreview] = useState<Job | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const invoke = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("ctm-historical-import", { body });
    const d = (data ?? {}) as { job?: Job; job_id?: string; error?: string };
    // Supabase invoke sets `error` on non-2xx, but the response body may
    // still carry our structured `{ error, job }` payload. Prefer the body.
    const msg = d?.error ?? (error ? error.message : null);
    if (msg && !d?.job) throw new Error(msg);
    if (msg && d?.job) {
      // Surface non-fatal errors but still return the job for the UI.
      setErrorMsg(msg);
    }
    return d;
  }, []);

  const runPreview = async () => {
    setBusy("preview"); setPreview(null); setJob(null); setErrorMsg(null);
    try {
      const res = await invoke({ action: "start", start_date: start, end_date: end, dry_run: true });
      const j = (res.job ?? null) as Job | null;
      setPreview(j);
      if (j?.last_error) {
        setErrorMsg(j.last_error);
        toast.error(`Preview finished with error: ${j.last_error}`);
      } else {
        toast.success("Dry-run complete — no data written");
      }
    } catch (e) {
      const m = (e as Error).message;
      setErrorMsg(m);
      toast.error(`Preview failed: ${m}`);
    }
    finally { setBusy(null); }
  };

  const runConfirm = async () => {
    setBusy("start"); setErrorMsg(null);
    try {
      const res = await invoke({ action: "start", start_date: start, end_date: end, dry_run: false });
      setJob((res.job ?? null) as Job | null);
      toast.success("Import started");
    } catch (e) {
      const m = (e as Error).message;
      setErrorMsg(m);
      toast.error(`Start failed: ${m}`);
    }
    finally { setBusy(null); }
  };

  const resume = async () => {
    if (!job) return;
    setBusy("resume");
    try {
      const res = await invoke({ action: "resume", job_id: job.id });
      setJob((res.job ?? null) as Job | null);
    } catch (e) { toast.error(`Resume failed: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };

  const cancel = async () => {
    if (!job) return;
    setBusy("cancel");
    try {
      await invoke({ action: "cancel", job_id: job.id });
      toast.success("Import cancelled");
      setJob({ ...job, status: "cancelled" });
    } catch (e) { toast.error(`Cancel failed: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };

  // Poll status for active jobs.
  useEffect(() => {
    if (!job || !["pending", "running", "paused"].includes(job.status)) return;
    let cancelled = false;
    const t = setInterval(async () => {
      try {
        const res = await invoke({ action: "status", job_id: job.id });
        if (!cancelled && res.job) setJob(res.job as Job);
      } catch { /* silent */ }
    }, 4000);
    return () => { cancelled = true; clearInterval(t); };
  }, [job, invoke]);

  // Confirm becomes available whenever we have a preview job that finished
  // without a fatal error — including zero-result dry runs.
  const showConfirm = useMemo(
    () => !!preview && !job && !preview.last_error,
    [preview, job],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>CTM historical import (read-only)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 flex gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              INGEST_ONLY — pulls historical calls from CTM into Blossom. Never writes back to CTM.
              Always run a dry-run first, then explicitly confirm.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start">Start date</Label>
              <Input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} disabled={!!job || !!busy} />
            </div>
            <div>
              <Label htmlFor="end">End date</Label>
              <Input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} disabled={!!job || !!busy} />
            </div>
          </div>

          {preview && !job && (
            <div className="rounded-md border p-3 text-xs space-y-1 bg-muted/40">
              <div className="font-medium text-sm">Dry-run summary</div>
              <div>Fetched: <strong>{preview.calls_fetched}</strong></div>
              <div>Would duplicate (already in Blossom): <strong>{preview.calls_duplicate}</strong></div>
              <div>New: <strong>{Math.max(0, preview.calls_fetched - preview.calls_duplicate)}</strong></div>
              <div>Pages processed: {preview.pages_processed} · Rate-limit hits: {preview.rate_limit_hits}</div>
              {preview.calls_fetched === 0 && (
                <div className="text-muted-foreground">
                  No calls in this window. Confirm import will be a safe no-op.
                </div>
              )}
              {preview.last_error && <div className="text-destructive">Error: {preview.last_error}</div>}
            </div>
          )}

          {errorMsg && !preview && !job && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              <div className="font-medium">Preview error</div>
              <div className="mt-1 break-words">{errorMsg}</div>
            </div>
          )}

          {job && (
            <div className="rounded-md border p-3 text-xs space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Badge variant={
                  job.status === "completed" ? "default"
                  : job.status === "failed" || job.status === "cancelled" ? "destructive"
                  : "outline"
                }>{job.status}</Badge>
                <span className="text-muted-foreground">Job {job.id.slice(0, 8)}…</span>
                {(job.status === "running" || job.status === "pending") && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </div>
              <div>Pages processed: {job.pages_processed}</div>
              <div>Fetched: {job.calls_fetched} · Upserted: {job.calls_upserted}</div>
              <div>Leads linked: {job.leads_linked} · Created: {job.leads_created} · Review queued: {job.review_queued}</div>
              <div>Rate-limit hits: {job.rate_limit_hits}</div>
              {job.last_error && <div className="text-destructive">Error: {job.last_error}</div>}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!job && (
            <>
              <Button variant="outline" onClick={runPreview} disabled={!!busy}>
                {busy === "preview" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Preview (dry-run)
              </Button>
              <Button onClick={runConfirm} disabled={!!busy || !showConfirm}>
                <PlayCircle className="h-4 w-4 mr-1" /> Confirm import
              </Button>
            </>
          )}
          {job && job.status === "paused" && (
            <Button onClick={resume} disabled={!!busy}>
              {busy === "resume" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-1" />}
              Resume
            </Button>
          )}
          {job && ["pending","running","paused"].includes(job.status) && (
            <Button variant="destructive" onClick={cancel} disabled={!!busy}>
              <XCircle className="h-4 w-4 mr-1" /> Cancel
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}