import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  UploadCloud, FileSpreadsheet, RefreshCw, CheckCircle2, AlertTriangle,
  Trash2, Database, ExternalLink, X, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORTED_EXTENSIONS, parseAnyFile } from "@/lib/os/dashboardEngine/excelParser";
import {
  detectCentralReachUpload, readCsvHeaderLine,
  type CRUploadDetection, type CRUploadKind,
} from "@/lib/os/centralreachUploads/detect";
import {
  listSharedReportDatasets, uploadSharedReportDataset,
  deleteSharedReportDataset, type SharedReportKey, type SharedReportDataset,
} from "@/lib/os/sharedReportDatasets";
import {
  previewBcbaProductivityUpload, appendBcbaProductivityUpload,
  listBcbaProductivityUploadBatches, getBcbaProductivityDatasetStatus,
  voidBcbaProductivityBatch,
  type BcbaUploadBatch, type BcbaDatasetStatus,
} from "@/lib/os/bcbaProductivityV3/adminUploadStore";
import { runWithSystemToolAudit } from "@/hooks/useSystemTools";

type QueueStatus =
  | "queued" | "detecting" | "detected" | "uploading" | "appending"
  | "done" | "error" | "skipped";

interface QueueItem {
  id: string;
  file: File;
  status: QueueStatus;
  detection?: CRUploadDetection;
  message?: string;
  progressText?: string;
}

function fmtBytes(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function readableError(error: unknown): string {
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

const SHARED_KEYS: SharedReportKey[] = [
  "cancellation-scheduling",
  "cancellation-billing",
  "cancellation-authorization",
  "authorization",
];

const SHARED_LABELS: Record<SharedReportKey, { label: string; reports: string }> = {
  "cancellation-scheduling": { label: "Scheduling (Cancellation)", reports: "Cancellation Command Center" },
  "cancellation-billing":    { label: "Billing (Cancellation)",    reports: "Cancellation Command Center" },
  "cancellation-authorization": { label: "Auth (Cancellation)", reports: "Cancellation Command Center" },
  "authorization":           { label: "Authorizations",            reports: "Authorization Analysis + Utilization" },
};

function StatusPill({ status }: { status: QueueStatus }) {
  const map: Record<QueueStatus, string> = {
    queued: "bg-muted text-muted-foreground",
    detecting: "bg-sky-50 text-sky-700",
    detected: "bg-indigo-50 text-indigo-700",
    uploading: "bg-amber-50 text-amber-700",
    appending: "bg-amber-50 text-amber-700",
    done: "bg-emerald-50 text-emerald-700",
    error: "bg-destructive/10 text-destructive",
    skipped: "bg-muted text-muted-foreground",
  };
  const label: Record<QueueStatus, string> = {
    queued: "Queued", detecting: "Detecting…", detected: "Detected",
    uploading: "Uploading…", appending: "Appending…", done: "Done",
    error: "Error", skipped: "Skipped",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status]}`}>
      {label[status]}
    </span>
  );
}

/* ---------------- upload helpers ---------------- */

async function detectFile(file: File): Promise<CRUploadDetection> {
  const headerLine = await readCsvHeaderLine(file);
  if (headerLine && headerLine.length) return detectCentralReachUpload(headerLine);
  // XLSX or unknown — parse first sheet lazily.
  try {
    const parsed = await parseAnyFile(file);
    if (parsed[0]?.headers?.length) return detectCentralReachUpload(parsed[0].headers);
  } catch {
    /* fall through */
  }
  return { kind: "unknown", confidence: 0, label: "Unknown format", targets: [] };
}

/* ---------------- page ---------------- */

export default function CentralReachUploads({ embedded = false }: { embedded?: boolean } = {}) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared dataset state
  const [sharedByKey, setSharedByKey] = useState<Record<SharedReportKey, SharedReportDataset[]>>({
    "authorization": [],
    "cancellation-scheduling": [],
    "cancellation-billing": [],
    "cancellation-authorization": [],
  });

  // BCBA productivity dataset state
  const [bcbaBatches, setBcbaBatches] = useState<BcbaUploadBatch[]>([]);
  const [bcbaStatus, setBcbaStatus] = useState<BcbaDatasetStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const [b, s, ...shared] = await Promise.allSettled([
        listBcbaProductivityUploadBatches(),
        getBcbaProductivityDatasetStatus(),
        ...SHARED_KEYS.map((k) => listSharedReportDatasets(k)),
      ]);
      const failures: string[] = [];

      if (b.status === "fulfilled") {
        setBcbaBatches(b.value);
      } else {
        failures.push(`BCBA productivity batches: ${readableError(b.reason)}`);
      }

      if (s.status === "fulfilled") {
        setBcbaStatus(s.value);
      } else {
        failures.push(`BCBA productivity status: ${readableError(s.reason)}`);
      }

      const map: Record<SharedReportKey, SharedReportDataset[]> = {
        ...sharedByKey,
      };
      SHARED_KEYS.forEach((k, i) => {
        const result = shared[i];
        if (result?.status === "fulfilled") {
          map[k] = result.value as SharedReportDataset[];
        } else if (result?.status === "rejected") {
          failures.push(`${SHARED_LABELS[k].label}: ${readableError(result.reason)}`);
        }
      });
      setSharedByKey(map);
      if (failures.length) {
        toast.error(`Failed to load upload history: ${failures.join(" | ")}`);
      }
    } catch (e) {
      toast.error(`Failed to load upload history: ${readableError(e)}`);
    } finally {
      setRefreshing(false);
    }
  }
  useEffect(() => { void refresh(); }, []);

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const arr = Array.from(list);
    if (!arr.length) return;
    setQueue((prev) => [
      ...prev,
      ...arr.map<QueueItem>((f) => ({
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        status: "queued",
      })),
    ]);
  }

  function updateItem(id: string, patch: Partial<QueueItem>) {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function removeItem(id: string) {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }

  async function processQueue() {
    setProcessing(true);
    try {
      // Snapshot ids at start; process sequentially so BCBA batches don't collide.
      const ids = queue.filter((q) => q.status === "queued" || q.status === "detected").map((q) => q.id);
      for (const id of ids) {
        const item = queueRef.current.find((q) => q.id === id);
        if (!item) continue;
        try {
          // 1. Detect if not already detected.
          let det = item.detection;
          if (!det) {
            updateItem(id, { status: "detecting" });
            det = await detectFile(item.file);
            updateItem(id, { detection: det, status: "detected" });
          }
          if (det.kind === "unknown") {
            updateItem(id, {
              status: "skipped",
              message: "Could not recognize this CentralReach export.",
            });
            continue;
          }

          // 2. Route by kind.
          if (det.kind === "scheduling") {
            updateItem(id, { status: "uploading", progressText: "Saving scheduling dataset…" });
            await uploadSharedReportDataset("cancellation-scheduling", item.file, notes || undefined);
            updateItem(id, { status: "done", message: "Live in Cancellation Command Center." });
          } else if (det.kind === "authorization") {
            updateItem(id, { status: "uploading", progressText: "Saving authorization dataset…" });
            await uploadSharedReportDataset("authorization", item.file, notes || undefined);
            // Same file also feeds cancellation coverage.
            await uploadSharedReportDataset("cancellation-authorization", item.file, notes || undefined);
            updateItem(id, { status: "done", message: "Live in Authorization + Cancellation reports." });
          } else if (det.kind === "billing") {
            updateItem(id, { status: "uploading", progressText: "Saving billing dataset (Cancellation)…" });
            await uploadSharedReportDataset("cancellation-billing", item.file, notes || undefined);

            // Append into BCBA productivity billing rows (dedupes automatically).
            updateItem(id, { status: "appending", progressText: "Parsing for BCBA Productivity…" });
            const preview = await previewBcbaProductivityUpload(item.file);
            if (preview.missingColumns.length) {
              updateItem(id, {
                status: "done",
                message: `Cancellation ready. BCBA Productivity skipped: missing ${preview.missingColumns.join(", ")}`,
              });
              continue;
            }
            const res = await runWithSystemToolAudit({
              mutation: () => appendBcbaProductivityUpload({
                file: item.file,
                uploadLabel: item.file.name,
                notes,
                parsed: preview,
                onProgress: (ev) => {
                  if (ev.phase === "append_rows") {
                    const pct = ev.total > 0 ? Math.round((ev.inserted / ev.total) * 100) : 0;
                    updateItem(id, {
                      progressText: `Appending BCBA rows — ${ev.inserted.toLocaleString()} / ${ev.total.toLocaleString()} (${pct}%)`,
                    });
                  } else if (ev.phase === "check_duplicates") {
                    updateItem(id, { progressText: "Checking duplicates…" });
                  } else if (ev.phase === "create_batch") {
                    updateItem(id, { progressText: "Creating batch…" });
                  } else if (ev.phase === "finalize_batch") {
                    updateItem(id, { progressText: "Finalizing batch…" });
                  }
                },
              }),
              audit: (r) => ({
                tool_area: "centralreach_uploads",
                action: "append_billing",
                entity_table: "bcba_productivity_upload_batches",
                entity_id: r?.batchId ?? null,
                new_value: {
                  appendedRowCount: r?.appendedRowCount ?? 0,
                  duplicateRowCount: r?.duplicateRowCount ?? 0,
                },
                metadata: { fileName: item.file.name },
              }),
            });
            updateItem(id, {
              status: "done",
              message: `Appended ${res.appendedRowCount.toLocaleString()} rows · ${res.duplicateRowCount.toLocaleString()} duplicates skipped.`,
            });
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          updateItem(id, { status: "error", message: msg });
        }
      }
      await refresh();
      toast.success("Upload batch complete");
    } finally {
      setProcessing(false);
    }
  }

  // Keep a ref of the queue so processQueue can read latest snapshots.
  const queueRef = useRef(queue);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  async function handleDeleteShared(id: string) {
    if (!confirm("Delete this dataset? This affects every user.")) return;
    try {
      await deleteSharedReportDataset(id);
      toast.success("Dataset deleted");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleVoidBatch(batchId: string) {
    if (!confirm("Void this BCBA productivity batch?")) return;
    try {
      await voidBcbaProductivityBatch(batchId, "Voided from CentralReach Uploads");
      toast.success("Batch voided");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  const hasQueued = queue.some((q) => q.status === "queued" || q.status === "detected");

  const historyRows = useMemo(() => {
    type Row = { key: string; label: string; fileName: string; uploaded: string; size: number | null; badge: string; onDelete?: () => void; report: string };
    const rows: Row[] = [];
    for (const k of SHARED_KEYS) {
      for (const it of sharedByKey[k]) {
        rows.push({
          key: `s-${it.id}`,
          label: SHARED_LABELS[k].label,
          fileName: it.fileName,
          uploaded: it.uploadedAt,
          size: it.fileSize,
          badge: it.isActive ? "Active" : "Archived",
          report: SHARED_LABELS[k].reports,
          onDelete: () => void handleDeleteShared(it.id),
        });
      }
    }
    for (const b of bcbaBatches) {
      rows.push({
        key: `b-${b.id}`,
        label: "Billing (BCBA Productivity batch)",
        fileName: b.fileName,
        uploaded: b.createdAt,
        size: b.fileSize,
        badge: b.status === "active" ? "Active" : b.status,
        report: "BCBA Productivity + Parent Training + Supervision",
        onDelete: b.status === "active" ? () => void handleVoidBatch(b.id) : undefined,
      });
    }
    rows.sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());
    return rows;
  }, [sharedByKey, bcbaBatches]);

  const body = (
      <div className={embedded ? "space-y-8" : "px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-8"}>
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <UploadCloud className="h-3.5 w-3.5" /> System Tools
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">CentralReach Uploads</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-3xl">
              Drop any CentralReach daily export here. Billing, scheduling, and authorization files are auto-detected and
              distributed to every report that needs them — no more separate upload pages per report.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button size="sm" asChild variant="outline">
              <Link to="/reports">Open Reports <ExternalLink className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        </header>

        {/* Drop / choose */}
        <Card className="p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            className="rounded-2xl border-2 border-dashed border-border bg-card/40 p-8 text-center"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="text-[15px] font-semibold">Drop CentralReach exports here</div>
            <div className="text-[12.5px] text-muted-foreground mt-1">
              Billing · Scheduling · Authorization · CSV or XLSX · multiple files at once
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                accept={SUPPORTED_EXTENSIONS}
                onChange={(e) => { addFiles(e.target.files); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={processing}>
                <UploadCloud className="mr-1.5 h-4 w-4" /> Choose files
              </Button>
              <div className="w-full sm:w-80 text-left">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes for this batch (e.g. 'Daily 07/15')"
                  className="min-h-[52px] text-[12.5px]"
                />
              </div>
            </div>
          </div>

          {queue.length > 0 && (
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Queue</div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => setQueue((q) => q.filter((it) => it.status !== "done" && it.status !== "skipped"))}
                    disabled={processing}
                  >Clear completed</Button>
                  <Button size="sm" onClick={processQueue} disabled={processing || !hasQueued}>
                    {processing ? "Processing…" : "Process queue"}
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full text-[12.5px]">
                  <thead className="bg-muted/40 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">File</th>
                      <th className="px-3 py-2">Size</th>
                      <th className="px-3 py-2">Detected</th>
                      <th className="px-3 py-2">Feeds</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((it) => (
                      <tr key={it.id} className="border-t border-border/50 align-top">
                        <td className="px-3 py-2 font-medium">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate max-w-[280px]" title={it.file.name}>{it.file.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{fmtBytes(it.file.size)}</td>
                        <td className="px-3 py-2">
                          {it.detection ? (
                            <Badge variant="outline" className={
                              it.detection.kind === "unknown"
                                ? "border-destructive/40 text-destructive"
                                : "border-emerald-200 text-emerald-700"
                            }>
                              {it.detection.label}
                            </Badge>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {it.detection?.targets.length
                            ? it.detection.targets.join(", ")
                            : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <StatusPill status={it.status} />
                            {it.progressText && <span className="text-[11px] text-muted-foreground">{it.progressText}</span>}
                            {it.message && (
                              <span className={`text-[11px] ${it.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                                {it.status === "done" && <CheckCircle2 className="inline mr-1 h-3 w-3 text-emerald-600" />}
                                {it.status === "error" && <AlertTriangle className="inline mr-1 h-3 w-3" />}
                                {it.message}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button variant="ghost" size="sm" onClick={() => removeItem(it.id)} disabled={processing}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>

        {/* Status */}
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Report readiness</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {SHARED_KEYS.map((k) => {
              const active = sharedByKey[k].find((d) => d.isActive) || null;
              return (
                <div key={k} className="rounded-xl border border-border/60 p-3">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {SHARED_LABELS[k].label}
                  </div>
                  <div className="mt-1 text-[13px] font-semibold tracking-tight">
                    {active ? "Active" : "Not connected"}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground truncate" title={active?.fileName}>
                    {active ? active.fileName : "Upload one file to activate"}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Feeds: {SHARED_LABELS[k].reports}
                  </div>
                </div>
              );
            })}
            <div className="rounded-xl border border-border/60 p-3">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                BCBA Productivity billing
              </div>
              <div className="mt-1 text-[13px] font-semibold tracking-tight">
                {(bcbaStatus?.activeRowCount ?? 0).toLocaleString()} active rows
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                {bcbaStatus?.earliestServiceDate ?? "—"} → {bcbaStatus?.latestServiceDate ?? "—"}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Feeds: BCBA Productivity + Parent Training + Supervision
              </div>
            </div>
          </div>
        </Card>

        {/* History */}
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Upload history</h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-[12.5px]">
              <thead className="bg-muted/40 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">File</th>
                  <th className="px-3 py-2">Dataset</th>
                  <th className="px-3 py-2">Feeds</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Uploaded</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {historyRows.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    No uploads yet. Drop a CentralReach export above to get started.
                  </td></tr>
                ) : historyRows.map((r) => (
                  <tr key={r.key} className="border-t border-border/50">
                    <td className="px-3 py-2 font-medium">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate max-w-[320px]" title={r.fileName}>{r.fileName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{r.label}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.report}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtBytes(r.size)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtDate(r.uploaded)}</td>
                    <td className="px-3 py-2">
                      <Badge variant={r.badge === "Active" ? "outline" : "secondary"}
                        className={r.badge === "Active" ? "border-emerald-200 text-emerald-700" : ""}>
                        {r.badge}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.onDelete && (
                        <Button variant="ghost" size="sm" onClick={r.onDelete}>
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
  );
  return embedded ? body : <OSShell>{body}</OSShell>;
}

// Suppress unused-import warning for the CRUploadKind re-export.
export type { CRUploadKind };