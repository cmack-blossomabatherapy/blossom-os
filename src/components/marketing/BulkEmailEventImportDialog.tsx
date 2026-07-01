import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

/**
 * Bulk-import Mailchimp-style CSV rows into `marketing_email_events`.
 * Deliberately mirrors BulkSourceEventImportDialog but writes to the
 * correct email-events table.
 */
const IMPORT_FIELDS = [
  "campaign_id",
  "event_type",
  "occurred_at",
  "recipient_email",
  "subject",
  "list_name",
  "external_id",
  "state",
  "source_system",
  "raw_payload",
] as const;
type ImportField = (typeof IMPORT_FIELDS)[number];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCampaignId?: string | null;
  defaultSourceSystem?: string;
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

function autoMap(header: string): ImportField | "__ignore__" {
  const h = header.trim().toLowerCase().replace(/\s+/g, "_");
  const m: Record<string, ImportField> = {
    campaign: "campaign_id",
    campaign_id: "campaign_id",
    event: "event_type",
    event_type: "event_type",
    type: "event_type",
    date: "occurred_at",
    time: "occurred_at",
    occurred_at: "occurred_at",
    timestamp: "occurred_at",
    email: "recipient_email",
    recipient: "recipient_email",
    recipient_email: "recipient_email",
    subject: "subject",
    list: "list_name",
    list_name: "list_name",
    external_id: "external_id",
    id: "external_id",
    state: "state",
    source: "source_system",
    source_system: "source_system",
    payload: "raw_payload",
    raw_payload: "raw_payload",
  };
  return m[h] ?? "__ignore__";
}

export function BulkEmailEventImportDialog({
  open, onOpenChange, defaultCampaignId, defaultSourceSystem = "mailchimp", onImported,
}: Props) {
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number; errors: string[] } | null>(null);

  const parsed = useMemo(() => (csvText.trim() ? parseCsv(csvText) : []), [csvText]);
  const [headers, dataRows] = useMemo(
    () => (parsed.length ? [parsed[0], parsed.slice(1)] : [[] as string[], [] as string[][]]),
    [parsed],
  );
  const [mapping, setMapping] = useState<Record<number, ImportField | "__ignore__">>({});
  const activeMapping = useMemo(() => {
    const out: Record<number, ImportField | "__ignore__"> = {};
    headers.forEach((h, i) => { out[i] = mapping[i] ?? autoMap(h); });
    return out;
  }, [headers, mapping]);

  const preview = dataRows.slice(0, 5);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setCsvText(await file.text());
    setResult(null);
  };

  const buildRows = () => {
    const rows: Record<string, unknown>[] = [];
    const errors: string[] = [];
    for (let r = 0; r < dataRows.length; r++) {
      const row = dataRows[r];
      const rec: Record<string, unknown> = {};
      for (let i = 0; i < headers.length; i++) {
        const field = activeMapping[i];
        if (field === "__ignore__") continue;
        const val = row[i]?.trim();
        if (!val) continue;
        if (field === "raw_payload") {
          try { rec.raw_payload = JSON.parse(val); }
          catch { rec.raw_payload = { text: val }; }
        } else if (field === "occurred_at") {
          const d = new Date(val);
          if (isNaN(d.getTime())) { errors.push(`Row ${r + 2}: invalid date "${val}"`); continue; }
          rec.occurred_at = d.toISOString();
        } else {
          rec[field] = val;
        }
      }
      if (!rec.campaign_id && defaultCampaignId) rec.campaign_id = defaultCampaignId;
      if (!rec.source_system && defaultSourceSystem) rec.source_system = defaultSourceSystem;
      if (!rec.occurred_at) rec.occurred_at = new Date().toISOString();
      if (!rec.event_type) rec.event_type = "sent";
      if (!rec.recipient_email && !rec.subject) {
        errors.push(`Row ${r + 2}: needs recipient_email or subject`);
        continue;
      }
      rows.push(rec);
    }
    return { rows, errors };
  };

  const handleImport = async () => {
    setImporting(true);
    setResult(null);
    try {
      const { rows, errors } = buildRows();
      if (!rows.length) {
        setResult({ inserted: 0, skipped: dataRows.length, errors });
        toast.warning("No valid rows to import");
        return;
      }
      let inserted = 0;
      const CHUNK = 250;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const { data, error } = await supabase
          .from("marketing_email_events")
          .insert(slice as never)
          .select("id");
        if (error) throw error;
        inserted += (data ?? []).length;
      }
      setResult({ inserted, skipped: dataRows.length - inserted, errors });
      toast.success(`Imported ${inserted} email event${inserted === 1 ? "" : "s"}`);
      onImported?.(inserted);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Import failed";
      toast.error(msg);
      setResult({ inserted: 0, skipped: dataRows.length, errors: [msg] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bulk import email events</DialogTitle>
          <DialogDescription>
            Paste CSV or upload. Rows land in <code>marketing_email_events</code>. Defaults to
            source_system <code>{defaultSourceSystem}</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <Input type="file" accept=".csv,text/csv" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            <span className="text-xs text-muted-foreground">or paste below</span>
          </div>
          <Textarea
            className="font-mono text-xs h-32"
            placeholder="event_type,occurred_at,recipient_email,subject,list_name"
            value={csvText}
            onChange={(e) => { setCsvText(e.target.value); setResult(null); }}
          />

          {headers.length > 0 && (
            <div className="rounded-lg border border-border/60 p-3">
              <div className="text-xs font-medium mb-2">Column mapping</div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto">
                {headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs w-32 truncate text-muted-foreground">{h || `col ${i + 1}`}</span>
                    <Select
                      value={activeMapping[i]}
                      onValueChange={(v) => setMapping((m) => ({ ...m, [i]: v as ImportField | "__ignore__" }))}
                    >
                      <SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ignore__">- ignore -</SelectItem>
                        {IMPORT_FIELDS.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              {preview.length > 0 && (
                <div className="mt-3">
                  <Label className="text-xs">Preview ({dataRows.length} row{dataRows.length === 1 ? "" : "s"})</Label>
                  <div className="overflow-auto max-h-40 rounded border border-border/60 mt-1">
                    <table className="text-[11px] w-full">
                      <thead className="bg-muted/50"><tr>{headers.map((h, i) => (<th key={i} className="px-2 py-1 text-left font-medium">{h}</th>))}</tr></thead>
                      <tbody>
                        {preview.map((r, ri) => (
                          <tr key={ri} className="border-t border-border/40">
                            {r.map((c, ci) => (<td key={ci} className="px-2 py-1 truncate max-w-[160px]">{c}</td>))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="rounded-lg border border-border/60 p-3 text-xs">
              <div>Inserted: <span className="font-medium text-emerald-600">{result.inserted}</span></div>
              <div>Skipped: <span className="font-medium text-amber-600">{result.skipped}</span></div>
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