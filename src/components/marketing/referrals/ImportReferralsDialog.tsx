import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { parseReferralsCsv, type ParsedCsv } from "@/lib/os/referrals/csv";
import { importReferralRows, failedRowsToCsv, type ImportResult, type ImportProgress } from "@/lib/os/referrals/importer";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

type Step = "upload" | "preview" | "importing" | "done";

export function ImportReferralsDialog({ open, onOpenChange, onComplete }: { open: boolean; onOpenChange: (o: boolean) => void; onComplete?: () => void }) {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState<ImportProgress>({ current: 0, total: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("upload"); setParsed(null); setFileName(""); setProgress({ current: 0, total: 0 }); setResult(null);
  }

  async function handleFile(file: File) {
    try {
      setFileName(file.name);
      const p = await parseReferralsCsv(file);
      if (!p.rows.length) { toast({ title: "CSV is empty", variant: "destructive" }); return; }
      setParsed(p);
      setStep("preview");
    } catch (e) {
      toast({ title: "Failed to parse CSV", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  }

  async function runImport() {
    if (!parsed) return;
    setStep("importing");
    try {
      const res = await importReferralRows(fileName, parsed.rows, (p) => setProgress(p));
      setResult(res);
      setStep("done");
      onComplete?.();
    } catch (e) {
      toast({ title: "Import failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
      setStep("preview");
    }
  }

  function downloadFailed() {
    if (!result?.errors.length) return;
    const csv = failedRowsToCsv(result.errors);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `failed-rows-${result.batchId}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const previewRows = parsed?.rows.slice(0, 10) ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Import Referrals</DialogTitle></DialogHeader>

        {step === "upload" && (
          <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center space-y-3">
            <FileSpreadsheet className="size-10 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Upload a referral CSV or Excel file</p>
              <p className="text-xs text-muted-foreground mt-1">Columns are mapped automatically. New rows are added, existing contacts are updated.</p>
            </div>
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <Button onClick={() => inputRef.current?.click()}><Upload className="size-4 mr-2" />Choose file</Button>
          </div>
        )}

        {step === "preview" && parsed && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">{parsed.rows.length}</strong> rows detected from <strong className="text-foreground">{fileName}</strong>.
              Preview shows the first 10 mapped rows.
            </div>
            <div className="overflow-x-auto border rounded-lg max-h-[40vh]">
              <table className="w-full text-xs">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Company</th>
                    <th className="text-left px-3 py-2">Email</th>
                    <th className="text-left px-3 py-2">Phone</th>
                    <th className="text-left px-3 py-2">State</th>
                    <th className="text-left px-3 py-2">Referrals</th>
                    <th className="text-left px-3 py-2">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r) => (
                    <tr key={r.rowIndex} className="border-t">
                      <td className="px-3 py-2">{r.full_name ?? "—"}</td>
                      <td className="px-3 py-2">{r.company_name ?? "—"}</td>
                      <td className="px-3 py-2">{r.email ?? "—"}</td>
                      <td className="px-3 py-2">{r.phone ?? "—"}</td>
                      <td className="px-3 py-2">{r.state ?? "—"}</td>
                      <td className="px-3 py-2">{r.number_of_referrals_sent}</td>
                      <td className="px-3 py-2">{r.contact_owner ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={reset}>Choose another file</Button>
              <Button onClick={runImport}>Import {parsed.rows.length} rows</Button>
            </DialogFooter>
          </div>
        )}

        {step === "importing" && (
          <div className="py-10 space-y-4 text-center">
            <p className="text-sm">Importing {progress.current} of {progress.total}…</p>
            <Progress value={progress.total ? (progress.current / progress.total) * 100 : 0} />
          </div>
        )}

        {step === "done" && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="size-5" />
              <p className="font-semibold">Import complete</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Stat label="Contacts created" value={result.createdContacts} />
              <Stat label="Contacts updated" value={result.updatedContacts} />
              <Stat label="Companies created" value={result.createdCompanies} />
              <Stat label="Duplicates merged" value={result.duplicateContacts} />
              <Stat label="Failed rows" value={result.failedRows} tone={result.failedRows > 0 ? "warn" : "ok"} />
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex items-start gap-2">
                <AlertCircle className="size-4 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{result.errors.length} rows failed.</p>
                  <button onClick={downloadFailed} className="inline-flex items-center gap-1 text-xs underline mt-1">
                    <Download className="size-3" /> Download failed rows CSV
                  </button>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={reset}>Import another</Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "ok" | "warn" }) {
  const color = tone === "warn" ? "text-amber-700" : tone === "ok" ? "text-emerald-700" : "text-foreground";
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}