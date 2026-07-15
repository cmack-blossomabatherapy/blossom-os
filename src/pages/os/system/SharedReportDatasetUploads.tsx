import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  UploadCloud, Database, Trash2, RefreshCw, FileSpreadsheet,
  ExternalLink, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORTED_EXTENSIONS } from "@/lib/os/dashboardEngine/excelParser";
import {
  listSharedReportDatasets, uploadSharedReportDataset,
  deleteSharedReportDataset, type SharedReportKey, type SharedReportDataset,
} from "@/lib/os/sharedReportDatasets";

interface Slot {
  key: SharedReportKey;
  label: string;
  hint: string;
}

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  reportRoute: string;
  reportLabel: string;
  slots: Slot[];
}

function fmtBytes(n: number | null) {
  if (n === null || n === undefined) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function SlotCard({ slot, onChanged }: { slot: Slot; onChanged: () => void }) {
  const [items, setItems] = useState<SharedReportDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listSharedReportDatasets(slot.key);
      setItems(rows);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Failed to load ${slot.label}: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, [slot.key]);

  async function handleFile(f: File | null) {
    if (!f) return;
    setUploading(true);
    try {
      const ds = await uploadSharedReportDataset(slot.key, f, notes || undefined);
      toast.success(`Uploaded ${ds.fileName}`);
      setNotes("");
      if (inputRef.current) inputRef.current.value = "";
      await refresh();
      onChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Upload failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this dataset? This affects every user.")) return;
    try {
      await deleteSharedReportDataset(id);
      toast.success("Dataset deleted");
      await refresh();
      onChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Delete failed: ${msg}`);
    }
  }

  const active = items.find((i) => i.isActive) || null;

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full text-[10px] font-semibold uppercase tracking-[0.14em]">
              {slot.key}
            </Badge>
            {active && (
              <Badge variant="outline" className="rounded-full border-emerald-200 text-[10px] text-emerald-700">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Active
              </Badge>
            )}
          </div>
          <h2 className="mt-1 text-[16px] font-semibold tracking-tight">{slot.label}</h2>
          <p className="text-[12px] text-muted-foreground">{slot.hint}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className={`mr-1 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes (e.g. period covered)"
          className="min-h-[64px] text-[12.5px]"
        />
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={SUPPORTED_EXTENSIONS}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]"
          >
            <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Upload new dataset"}
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-[12.5px]">
          <thead className="bg-muted/40 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="px-3 py-2">File</th>
              <th className="px-3 py-2">Size</th>
              <th className="px-3 py-2">Uploaded</th>
              <th className="px-3 py-2">Notes</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  No datasets uploaded yet. Uploading one will instantly power the linked report for every user.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-t border-border/50">
                  <td className="px-3 py-2 font-medium">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                      {it.fileName}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtBytes(it.fileSize)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtDate(it.uploadedAt)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{it.notes || "—"}</td>
                  <td className="px-3 py-2">
                    {it.isActive ? (
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Archived</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(it.id)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function SharedReportDatasetUploads({
  eyebrow, title, description, reportRoute, reportLabel, slots,
}: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <OSShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant="secondary" className="rounded-full text-[10px] font-semibold uppercase tracking-[0.18em]">
            <Database className="mr-1 h-3 w-3" /> {eyebrow}
          </Badge>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">{description}</p>
        </div>
        <Link
          to={reportRoute}
          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-muted"
        >
          Open {reportLabel} <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-6 space-y-5" key={refreshKey}>
        {slots.map((slot) => (
          <SlotCard key={slot.key} slot={slot} onChanged={() => setRefreshKey((k) => k + 1)} />
        ))}
      </div>
    </OSShell>
  );
}

export function AuthorizationSharedUploadsPage() {
  return (
    <SharedReportDatasetUploads
      eyebrow="Admin Uploads"
      title="Authorization Dataset Uploads"
      description="Upload the CentralReach authorization export once. Every user opening Authorization Analysis or Authorization Utilization — Hour Based will automatically see the latest active dataset. Users can still upload their own file for a one-off view."
      reportRoute="/reports/authorization-analysis"
      reportLabel="Authorization Analysis"
      slots={[
        {
          key: "authorization",
          label: "Authorization export",
          hint: "CentralReach authorization export (CSV/XLSX) with client, auth #, authorized/worked/pending/remaining hours, dates, payor, service code.",
        },
      ]}
    />
  );
}

export function CancellationSharedUploadsPage() {
  return (
    <SharedReportDatasetUploads
      eyebrow="Admin Uploads"
      title="Cancellation Dataset Uploads"
      description="Upload the three CentralReach exports that power the Cancellation Command Center for every user. Scheduling is required; Billing and Authorization improve accuracy but are optional."
      reportRoute="/reports/cancellation-command-center"
      reportLabel="Cancellation Command Center"
      slots={[
        {
          key: "cancellation-scheduling",
          label: "Scheduling cancellations export (required)",
          hint: "CentralReach scheduling export with StartDateTime, ClientName, Provider, BCBA, Status, CancelledOn, Reason, ProcedureCode, Hours, Location/State, Payor.",
        },
        {
          key: "cancellation-billing",
          label: "Billing export",
          hint: "CentralReach billing export with DateOfService, ClientName, ProcedureCode, TimeWorkedInHours, ClientChargesTotal. Powers lost-revenue math.",
        },
        {
          key: "cancellation-authorization",
          label: "Authorization export",
          hint: "CentralReach authorization export with ClientName, BCBA, StartDate, EndDate. Drives coverage and BCBA attribution.",
        },
      ]}
    />
  );
}
