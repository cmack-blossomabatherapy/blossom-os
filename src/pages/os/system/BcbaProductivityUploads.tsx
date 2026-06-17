import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  UploadCloud, FileSpreadsheet, BarChart3, Download, RefreshCw, AlertTriangle,
  CheckCircle2, X, Database, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORTED_EXTENSIONS } from "@/lib/os/dashboardEngine/excelParser";
import {
  previewBcbaProductivityUpload, appendBcbaProductivityUpload,
  listBcbaProductivityUploadBatches, getBcbaProductivityDatasetStatus,
  voidBcbaProductivityBatch, getBcbaProductivityBatchRows,
  type BcbaUploadBatch, type BcbaDatasetStatus, type BcbaUploadPreview,
} from "@/lib/os/bcbaProductivityV3/adminUploadStore";

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined || !isFinite(Number(n))) return "—";
  return Number(n).toLocaleString();
}
function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    voided: "bg-muted text-muted-foreground border-border",
    failed: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${map[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
  );
}

function downloadCsv(name: string, columns: string[], rows: (string | number)[][]) {
  const esc = (v: any) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const text = [columns.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default function BcbaProductivityUploads() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadLabel, setUploadLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<BcbaUploadPreview | null>(null);
  const [appending, setAppending] = useState(false);

  const [batches, setBatches] = useState<BcbaUploadBatch[]>([]);
  const [status, setStatus] = useState<BcbaDatasetStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const [b, s] = await Promise.all([
        listBcbaProductivityUploadBatches(),
        getBcbaProductivityDatasetStatus(),
      ]);
      setBatches(b);
      setStatus(s);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load admin upload dataset");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function handleFileSelected(f: File | null) {
    setFile(f);
    setPreview(null);
    if (!f) return;
    setPreviewing(true);
    try {
      const p = await previewBcbaProductivityUpload(f);
      setPreview(p);
      if (p.missingColumns.length) {
        toast.error(`Missing required columns: ${p.missingColumns.join(", ")}`);
      } else {
        toast.success(`Parsed ${p.parsedRows.length.toLocaleString()} rows · ${p.newRowCount.toLocaleString()} new, ${p.duplicateRowCount.toLocaleString()} duplicate`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to parse file");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleAppend() {
    if (!file || !preview) return;
    if (preview.missingColumns.length) {
      toast.error("Cannot append: required columns are missing.");
      return;
    }
    setAppending(true);
    try {
      const res = await appendBcbaProductivityUpload({
        file, uploadLabel, notes,
        parsed: preview,
      });
      toast.success(
        `Appended ${res.appendedRowCount.toLocaleString()} rows · ${res.duplicateRowCount.toLocaleString()} duplicates skipped`,
      );
      setFile(null);
      setPreview(null);
      setUploadLabel("");
      setNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to append upload");
    } finally {
      setAppending(false);
    }
  }

  async function handleVoid(batchId: string) {
    if (!confirm("Void this batch? Its rows will be excluded from the active dataset.")) return;
    try {
      await voidBcbaProductivityBatch(batchId, "Voided from admin upload center");
      toast.success("Batch voided");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to void batch");
    }
  }

  async function handleDownloadDataset() {
    try {
      toast.message("Preparing dataset CSV…");
      const { getBcbaProductivitySharedRows } = await import("@/lib/os/bcbaProductivityV3/adminUploadStore");
      const rows = await getBcbaProductivitySharedRows();
      downloadCsv(
        `bcba-productivity-shared-dataset-${new Date().toISOString().slice(0, 10)}.csv`,
        ["date", "clientId", "clientName", "code", "hours", "renderingProvider", "state", "payor"],
        rows.map((r) => [r.date, r.clientId, r.clientName, r.code, r.hours, r.renderingProvider, r.state, r.payor]),
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to download dataset");
    }
  }

  async function handleDownloadBatch(batch: BcbaUploadBatch) {
    try {
      const rows = await getBcbaProductivityBatchRows(batch.id);
      downloadCsv(
        `bcba-productivity-batch-${batch.id}.csv`,
        ["date", "clientId", "clientName", "code", "hours", "renderingProvider", "state", "payor"],
        rows.map((r) => [r.date, r.clientId, r.clientName, r.code, r.hours, r.renderingProvider, r.state, r.payor]),
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to download batch rows");
    }
  }

  const previewSummary = useMemo(() => {
    if (!preview) return null;
    return [
      { label: "Parsed rows", value: fmt(preview.parsedRows.length) },
      { label: "Raw rows in file", value: fmt(preview.rawRowCount) },
      { label: "New rows to append", value: fmt(preview.newRowCount) },
      { label: "Duplicates detected", value: fmt(preview.duplicateRowCount) },
      { label: "Date min", value: preview.serviceDateMin ?? "—" },
      { label: "Date max", value: preview.serviceDateMax ?? "—" },
    ];
  }, [preview]);

  return (
    <OSShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <UploadCloud className="h-3.5 w-3.5" /> System Tools
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">BCBA Productivity Uploads</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-3xl">
              Upload CentralReach billing exports here so the BCBA Productivity Report can use a shared admin dataset.
              This does not replace manual report uploads.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadDataset}>
              <Download className="mr-2 h-4 w-4" /> Download Current Dataset
            </Button>
            <Button size="sm" asChild>
              <Link to="/reports/bcba-productivity-report-v3">
                <BarChart3 className="mr-2 h-4 w-4" /> View BCBA Productivity Report
              </Link>
            </Button>
          </div>
        </header>

        {/* Dataset status */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Shared admin dataset</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Stat label="Active rows" value={fmt(status?.activeRowCount ?? 0)} />
            <Stat label="Upload batches" value={fmt(status?.batchCount ?? 0)} />
            <Stat label="Earliest service date" value={status?.earliestServiceDate ?? "—"} />
            <Stat label="Latest service date" value={status?.latestServiceDate ?? "—"} />
            <Stat label="Last upload" value={fmtDate(status?.lastUploadAt)} />
            <Stat label="Last uploaded by" value={status?.lastUploadedByEmail ?? "—"} />
          </div>
        </Card>

        {/* Upload card */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <UploadCloud className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Upload CentralReach File</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3">
              <div className="rounded-2xl border-2 border-dashed border-border bg-card/40 p-6 flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3 text-primary"><FileSpreadsheet className="h-6 w-6" /></div>
                <div className="flex-1">
                  <div className="font-medium">
                    {file ? file.name : "Choose a CentralReach billing export (CSV or XLSX)"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {file
                      ? `${(file.size / 1024).toFixed(1)} KB`
                      : "Same column format as the BCBA Productivity Report."}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept={SUPPORTED_EXTENSIONS}
                  onChange={(e) => void handleFileSelected(e.target.files?.[0] ?? null)}
                />
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={previewing}>
                  {previewing ? "Parsing…" : file ? "Replace file" : "Choose file"}
                </Button>
              </div>

              {preview && (
                <div className="rounded-xl border bg-card/60 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Upload preview
                    </div>
                    <div className="text-xs text-muted-foreground">{preview.fileName}</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {previewSummary?.map((p) => (
                      <Stat key={p.label} label={p.label} value={p.value} />
                    ))}
                  </div>
                  {preview.missingColumns.length > 0 && (
                    <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
                      Missing required columns: {preview.missingColumns.join(", ")}
                    </div>
                  )}
                  {Object.keys(preview.dropReasons).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {Object.entries(preview.dropReasons).map(([k, v]) => (
                        <Badge key={k} variant="outline" className="font-normal">
                          <AlertTriangle className="mr-1 h-3 w-3 text-warning" />
                          {k}: {v.toLocaleString()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Optional label</label>
                <Input
                  value={uploadLabel}
                  onChange={(e) => setUploadLabel(e.target.value)}
                  placeholder="e.g. Daily 06/17 — CR billing"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes (date range, source export, etc.)"
                  rows={3}
                />
              </div>
              <Button
                className="w-full"
                disabled={!preview || !!preview.missingColumns.length || appending}
                onClick={handleAppend}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                {appending ? "Appending…" : "Append Upload"}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Re-uploading the same file is safe — duplicate rows are skipped.
              </p>
            </div>
          </div>
        </Card>

        {/* History */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Upload History</h2>
            <span className="text-xs text-muted-foreground">{batches.length} batch{batches.length === 1 ? "" : "es"}</span>
          </div>
          {batches.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No uploads yet. Use the upload card above to append the first CentralReach export.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b">
                    <th className="py-2 pr-3">Uploaded</th>
                    <th className="py-2 pr-3">File</th>
                    <th className="py-2 pr-3">By</th>
                    <th className="py-2 pr-3 text-right">Parsed</th>
                    <th className="py-2 pr-3 text-right">Appended</th>
                    <th className="py-2 pr-3 text-right">Dupes</th>
                    <th className="py-2 pr-3">Date range</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-3 whitespace-nowrap text-xs">{fmtDate(b.createdAt)}</td>
                      <td className="py-2 pr-3">
                        <div className="font-medium">{b.fileName}</div>
                        {b.uploadLabel && <div className="text-[11px] text-muted-foreground">{b.uploadLabel}</div>}
                        {b.notes && <div className="text-[11px] text-muted-foreground italic">{b.notes}</div>}
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{b.uploadedByEmail ?? "—"}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{fmt(b.parsedRowCount)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{fmt(b.appendedRowCount)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{fmt(b.duplicateRowCount)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs">
                        {b.serviceDateMin && b.serviceDateMax
                          ? `${b.serviceDateMin} → ${b.serviceDateMax}`
                          : "—"}
                      </td>
                      <td className="py-2 pr-3"><StatusPill status={b.status} /></td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleDownloadBatch(b)} title="Download batch rows">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          {b.status === "active" && (
                            <Button size="sm" variant="ghost" onClick={() => handleVoid(b.id)} title="Void batch">
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" asChild title="Open report using shared dataset">
                            <Link to="/reports/bcba-productivity-report-v3?source=shared">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Active batches feed the BCBA Productivity Report's shared admin dataset.
          </div>
        </Card>
      </div>
    </OSShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground tabular-nums break-all">{value}</div>
    </div>
  );
}