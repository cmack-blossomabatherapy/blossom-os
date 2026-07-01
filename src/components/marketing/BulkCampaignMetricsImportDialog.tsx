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
  type MarketingCampaignMetricInsert,
  useMarketingCampaignMetrics,
} from "@/hooks/useMarketingCampaignMetrics";
import { useMarketingCampaigns } from "@/hooks/useMarketingCampaigns";

const IMPORT_FIELDS = [
  "campaign_id",
  "metric_date",
  "impressions",
  "clicks",
  "spend_cents",
  "spend",
  "conversions",
  "leads",
  "source_system",
] as const;
type ImportField = (typeof IMPORT_FIELDS)[number];

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

function autoMap(header: string): ImportField | "__ignore__" {
  const h = header.trim().toLowerCase().replace(/\s+/g, "_");
  const m: Record<string, ImportField> = {
    campaign: "campaign_id", campaign_id: "campaign_id",
    date: "metric_date", metric_date: "metric_date", day: "metric_date",
    impressions: "impressions", impr: "impressions",
    clicks: "clicks",
    spend_cents: "spend_cents", spend: "spend", cost: "spend",
    conversions: "conversions", conv: "conversions",
    leads: "leads",
    source: "source_system", source_system: "source_system",
  };
  return m[h] ?? "__ignore__";
}

/** Bulk campaign metrics CSV importer -> marketing_campaign_metrics. */
export function BulkCampaignMetricsImportDialog({ open, onOpenChange, onImported }: Props) {
  const { campaigns } = useMarketingCampaigns();
  const { insertMetrics } = useMarketingCampaignMetrics();
  const [csvText, setCsvText] = useState("");
  const [defaultCampaignId, setDefaultCampaignId] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null);

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

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setCsvText(await file.text());
    setResult(null);
  };

  const buildRows = (): { rows: MarketingCampaignMetricInsert[]; errors: string[] } => {
    const rows: MarketingCampaignMetricInsert[] = [];
    const errors: string[] = [];
    for (let r = 0; r < dataRows.length; r++) {
      const row = dataRows[r];
      const rec: Record<string, unknown> = {};
      let spendDollars: number | null = null;
      for (let i = 0; i < headers.length; i++) {
        const field = activeMapping[i];
        if (field === "__ignore__") continue;
        const val = row[i]?.trim();
        if (!val) continue;
        if (field === "metric_date") {
          const d = new Date(val);
          if (isNaN(d.getTime())) { errors.push(`Row ${r + 2}: invalid date "${val}"`); continue; }
          rec.metric_date = d.toISOString().slice(0, 10);
        } else if (field === "spend") {
          const n = Number(val.replace(/[$,]/g, ""));
          if (!isNaN(n)) spendDollars = n;
        } else if (["impressions", "clicks", "spend_cents", "conversions", "leads"].includes(field)) {
          const n = Number(val.replace(/[$,]/g, ""));
          if (!isNaN(n)) rec[field] = Math.round(n);
        } else {
          rec[field] = val;
        }
      }
      if (spendDollars != null && rec.spend_cents == null) rec.spend_cents = Math.round(spendDollars * 100);
      if (!rec.campaign_id && defaultCampaignId) rec.campaign_id = defaultCampaignId;
      if (!rec.metric_date) rec.metric_date = new Date().toISOString().slice(0, 10);
      if (!rec.campaign_id) { errors.push(`Row ${r + 2}: missing campaign_id`); continue; }
      rows.push(rec as MarketingCampaignMetricInsert);
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
      const inserted = await insertMetrics(rows);
      setResult({ inserted, errors });
      toast.success(`Imported ${inserted} metric row${inserted === 1 ? "" : "s"}`);
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bulk import campaign metrics</DialogTitle>
          <DialogDescription>
            Load daily performance rows into <code>marketing_campaign_metrics</code>.
            Use <code>spend</code> for dollars or <code>spend_cents</code> for cents.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Default campaign (used if column missing)</Label>
              <Select value={defaultCampaignId} onValueChange={setDefaultCampaignId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Pick campaign..." /></SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">CSV file</Label>
              <Input type="file" accept=".csv,text/csv" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <Textarea
            className="font-mono text-xs h-32"
            placeholder="metric_date,impressions,clicks,spend,conversions,leads"
            value={csvText}
            onChange={(e) => { setCsvText(e.target.value); setResult(null); }}
          />
          {headers.length > 0 && (
            <div className="rounded-lg border border-border/60 p-3">
              <div className="text-xs font-medium mb-2">Column mapping</div>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
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