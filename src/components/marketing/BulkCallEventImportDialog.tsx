import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  useMarketingCallEvents,
  type MarketingCallEventInsert,
} from "@/hooks/useMarketingCallEvents";
import {
  validateDisposition,
  validateDirection,
  validateCategory,
} from "@/lib/marketing/callDispositions";

const IMPORT_FIELDS = [
  "source_system",
  "external_id",
  "occurred_at",
  "direction",
  "status",
  "caller_name",
  "caller_phone",
  "state",
  "duration_seconds",
  "call_category",
  "disposition",
  "lead_id",
  "source_id",
  "campaign_id",
  "transcript_summary",
  "recording_url",
  "notes",
] as const;
type ImportField = (typeof IMPORT_FIELDS)[number];
const IGNORE = "__ignore__";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported?: (count: number) => void;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else {
      if (c === '"') quoted = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

function autoMap(header: string): ImportField | typeof IGNORE {
  const h = header.trim().toLowerCase().replace(/\s+/g, "_");
  const m: Record<string, ImportField> = {
    source: "source_system", source_system: "source_system", provider: "source_system",
    external_id: "external_id", call_id: "external_id", id: "external_id",
    occurred_at: "occurred_at", occurred: "occurred_at", date: "occurred_at", timestamp: "occurred_at", start_time: "occurred_at",
    direction: "direction",
    status: "status",
    caller_name: "caller_name", name: "caller_name", from_name: "caller_name",
    caller_phone: "caller_phone", phone: "caller_phone", from: "caller_phone", from_number: "caller_phone",
    state: "state",
    duration_seconds: "duration_seconds", duration: "duration_seconds", seconds: "duration_seconds",
    call_category: "call_category", category: "call_category",
    disposition: "disposition",
    lead_id: "lead_id",
    source_id: "source_id",
    campaign_id: "campaign_id",
    transcript_summary: "transcript_summary", transcript: "transcript_summary", summary: "transcript_summary",
    recording_url: "recording_url", recording: "recording_url",
    notes: "notes", note: "notes", comments: "notes",
  };
  return m[h] ?? IGNORE;
}

/** Bulk CSV importer for marketing_call_events. */
export function BulkCallEventImportDialog({ open, onOpenChange, onImported }: Props) {
  const { bulkImportCallEvents } = useMarketingCallEvents({ limit: 1 });
  const [csvText, setCsvText] = useState("");
  const [defaultSource, setDefaultSource] = useState("manual");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null);

  const parsed = useMemo(() => (csvText.trim() ? parseCsv(csvText) : []), [csvText]);
  const [headers, dataRows] = useMemo(
    () => (parsed.length ? [parsed[0], parsed.slice(1)] : [[] as string[], [] as string[][]]),
    [parsed],
  );
  const [mapping, setMapping] = useState<Record<number, ImportField | typeof IGNORE>>({});
  const activeMapping = useMemo(() => {
    const out: Record<number, ImportField | typeof IGNORE> = {};
    headers.forEach((h, i) => { out[i] = mapping[i] ?? autoMap(h); });
    return out;
  }, [headers, mapping]);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setCsvText(await file.text());
    setResult(null);
  };

  const buildRows = (): { rows: MarketingCallEventInsert[]; errors: string[] } => {
    const rows: MarketingCallEventInsert[] = [];
    const errors: string[] = [];
    for (let r = 0; r < dataRows.length; r++) {
      const row = dataRows[r];
      const rec: Record<string, unknown> = {};
      const raw: Record<string, unknown> = {};
      let notes: string | null = null;
      for (let i = 0; i < headers.length; i++) {
        const field = activeMapping[i];
        const val = row[i]?.trim();
        if (!val) continue;
        if (field === IGNORE) {
          raw[headers[i] || `col_${i}`] = val;
          continue;
        }
        if (field === "occurred_at") {
          const d = new Date(val);
          if (isNaN(d.getTime())) { errors.push(`Row ${r + 2}: invalid occurred_at "${val}"`); continue; }
          rec.occurred_at = d.toISOString();
        } else if (field === "duration_seconds") {
          const n = Number(val);
          if (!isNaN(n)) rec.duration_seconds = Math.round(n);
        } else if (field === "state") {
          rec.state = val.toUpperCase().slice(0, 2);
        } else if (field === "notes") {
          notes = val;
        } else if (field === "direction") {
          const v = validateDirection(val);
          if (!v.ok) errors.push(`Row ${r + 2}: ${v.error}`);
          rec.direction = v.value;
        } else if (field === "call_category") {
          const v = validateCategory(val);
          if (!v.ok) errors.push(`Row ${r + 2}: ${v.error}`);
          rec.call_category = v.value;
        } else if (field === "disposition") {
          const v = validateDisposition(val);
          if (!v.ok) {
            errors.push(`Row ${r + 2}: ${v.error}`);
            raw[`_invalid_disposition`] = val;
          } else if (v.value) {
            rec.disposition = v.value;
          }
        } else {
          rec[field] = val;
        }
      }
      if (!rec.source_system) rec.source_system = defaultSource || "manual";
      if (!rec.occurred_at) rec.occurred_at = new Date().toISOString();
      if (notes || Object.keys(raw).length > 0) {
        rec.raw_payload = { ...(notes ? { notes } : {}), ...(Object.keys(raw).length ? { extra: raw } : {}) };
      }
      rows.push(rec as MarketingCallEventInsert);
    }
    return { rows, errors };
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const { rows, errors } = buildRows();
      if (!rows.length) {
        setResult({ inserted: 0, errors });
        toast.warning("No valid rows to import");
        return;
      }
      const inserted = await bulkImportCallEvents(rows);
      setResult({ inserted, errors });
      toast.success(`Imported ${inserted} call${inserted === 1 ? "" : "s"}`);
      onImported?.(inserted);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Import failed";
      toast.error(msg);
      setResult({ inserted: 0, errors: [msg] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk import calls</DialogTitle>
          <DialogDescription>
            Load call rows into <code>marketing_call_events</code>. Paste CSV or upload a file.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Default source_system (fallback)</Label>
              <Input className="h-9" value={defaultSource} onChange={(e) => setDefaultSource(e.target.value)} placeholder="manual, ctm, jivetel..." />
            </div>
            <div>
              <Label className="text-xs">CSV file</Label>
              <Input type="file" accept=".csv,text/csv" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <Textarea
            className="font-mono text-xs h-32"
            placeholder="occurred_at,direction,caller_name,caller_phone,state,duration_seconds,call_category,disposition,notes"
            value={csvText}
            onChange={(e) => { setCsvText(e.target.value); setResult(null); }}
          />
          {headers.length > 0 && (
            <div className="rounded-lg border border-border/60 p-3">
              <div className="text-xs font-medium mb-2">Column mapping</div>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-auto">
                {headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs w-32 truncate text-muted-foreground">{h || `col ${i + 1}`}</span>
                    <Select
                      value={activeMapping[i]}
                      onValueChange={(v) => setMapping((m) => ({ ...m, [i]: v as ImportField | typeof IGNORE }))}
                    >
                      <SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={IGNORE}>- ignore (kept in raw_payload) -</SelectItem>
                        {IMPORT_FIELDS.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result && (
            <div className="rounded-lg border border-border/60 p-3 text-xs">
              <div>Inserted: <span className="font-medium text-emerald-600">{result.inserted}</span></div>
              {result.errors.length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-destructive">{result.errors.length} error{result.errors.length === 1 ? "" : "s"}</summary>
                  <ul className="mt-1 space-y-0.5 max-h-32 overflow-auto">
                    {result.errors.slice(0, 50).map((e, i) => (<li key={i}>- {e}</li>))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={importing}>Close</Button>
          <Button onClick={handleImport} disabled={importing || dataRows.length === 0}>
            {importing ? "Importing..." : `Import ${dataRows.length} row${dataRows.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}