import { useCallback, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Upload, Sparkles, FileSpreadsheet, X, Wand2, Filter } from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  AiReport, newAiReportId, saveAiReport, previewCsvForPrompt,
} from "@/lib/os/aiReports";
import { toast } from "sonner";

const PROMPT_SUGGESTIONS = [
  "Summarize utilization by BCBA this month",
  "Show authorizations expiring in the next 30 days",
  "Top 10 clients by cancellation rate",
  "Weekly supervision % by state",
  "Session completion trend by week",
];

const FILTER_SUGGESTIONS = [
  "This month", "Last 30 days", "All states", "Georgia", "North Carolina",
  "By BCBA", "By Payor", "Active clients only",
];

export default function AiReportNew() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [filterInput, setFilterInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(async (f: File) => {
    setFile(f);
    const text = await f.text();
    setCsvText(text);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  function toggleFilter(f: string) {
    setFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  function addFilter() {
    const v = filterInput.trim();
    if (!v) return;
    if (!filters.includes(v)) setFilters([...filters, v]);
    setFilterInput("");
  }

  async function handleGenerate() {
    if (!csvText) { toast.error("Upload a CSV first"); return; }
    if (!prompt.trim()) { toast.error("Tell the AI what report to build"); return; }
    setSubmitting(true);

    const { preview, rowCount, headers } = previewCsvForPrompt(csvText, 150);
    const id = newAiReportId();
    const report: AiReport = {
      id,
      title: prompt.slice(0, 60) || "AI Report",
      prompt,
      filters,
      fileName: file?.name || "upload.csv",
      rowCount,
      createdAt: Date.now(),
      status: "generating",
    };
    saveAiReport(report);
    // Stash payload for the loading view to consume.
    sessionStorage.setItem(`ai_report_payload_${id}`, JSON.stringify({
      preview, rowCount, headers, prompt, filters, fileName: report.fileName,
    }));
    navigate(`/reports/ai/${id}`);
  }

  return (
    <OSShell>
      <div className="mb-3">
        <Link to="/reports" className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> All reports
        </Link>
      </div>

      <section className="os-rise relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] via-[hsl(285_100%_98%)] to-[hsl(225_100%_98%)] p-7 shadow-[0_30px_70px_-40px_hsl(265_60%_50%/0.4)]">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[hsl(265_100%_90%)] opacity-50 blur-3xl" />
        <div className="relative">
          <Badge variant="secondary" className="rounded-full bg-white/70 text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(265_70%_55%)]">
            <Sparkles className="mr-1 h-3 w-3" /> Blossom AI
          </Badge>
          <h1 className="mt-3 text-[30px] font-semibold tracking-tight md:text-[36px]">Create a report with AI</h1>
          <p className="mt-1 max-w-xl text-[13.5px] text-muted-foreground">
            Drop in a CentralReach export, tell Blossom what to look at, and we'll build the report.
          </p>
        </div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* LEFT: Upload + Prompt */}
        <div className="space-y-5">
          <article className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2">
              <Upload className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[14px] font-semibold tracking-tight">1 · Upload your data</h3>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">CSV export from CentralReach or any spreadsheet (.csv).</p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "mt-3 cursor-pointer rounded-2xl border-2 border-dashed bg-secondary/20 p-6 text-center transition",
                dragOver
                  ? "border-[hsl(265_70%_55%)] bg-[hsl(265_100%_98%)] scale-[1.01]"
                  : "border-border/60 hover:border-[hsl(265_70%_55%/0.5)] hover:bg-secondary/30",
              )}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(265_100%_97%)] text-[hsl(265_70%_55%)]">
                    <FileSpreadsheet className="h-5 w-5" />
                  </span>
                  <div className="text-left">
                    <p className="text-[13px] font-semibold">{file.name}</p>
                    <p className="text-[11px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · ready</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setCsvText(""); }}
                    className="ml-2 rounded-full p-1 text-muted-foreground hover:bg-secondary"
                    aria-label="Remove file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Upload className="h-5 w-5 text-[hsl(265_70%_55%)]" />
                  </div>
                  <p className="text-[13px] font-medium">Drop your CSV here</p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">or click to browse</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
              />
            </div>
          </article>

          <article className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2">
              <Wand2 className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[14px] font-semibold tracking-tight">2 · What do you want to see?</h3>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">Describe the report — KPIs, trends, breakdowns.</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="e.g. Show utilization by BCBA this month and flag anyone under 80%."
              className="mt-3 w-full rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5 text-[13px] outline-none transition focus:border-[hsl(265_70%_55%)] focus:bg-card"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PROMPT_SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPrompt(s)}
                  className="rounded-full border border-border/60 bg-secondary/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.4)] hover:bg-[hsl(265_100%_98%)] hover:text-[hsl(265_70%_55%)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[14px] font-semibold tracking-tight">3 · Filters (optional)</h3>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">Scope the data — pick suggestions or add your own.</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {FILTER_SUGGESTIONS.map(f => {
                const on = filters.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFilter(f)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition hover:-translate-y-0.5",
                      on
                        ? "border-[hsl(265_70%_55%)] bg-[hsl(265_100%_97%)] text-[hsl(265_70%_45%)]"
                        : "border-border/60 bg-secondary/30 text-muted-foreground hover:border-[hsl(265_70%_55%/0.4)] hover:text-[hsl(265_70%_55%)]",
                    )}
                  >
                    {f}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex gap-2">
              <Input
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFilter(); } }}
                placeholder="Add a custom filter…"
                className="h-9 text-[12.5px]"
              />
              <Button size="sm" variant="outline" onClick={addFilter}>Add</Button>
            </div>

            {filters.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {filters.map(f => (
                  <span key={f} className="inline-flex items-center gap-1 rounded-full bg-[hsl(265_100%_97%)] px-2.5 py-1 text-[11px] font-medium text-[hsl(265_70%_45%)]">
                    {f}
                    <button onClick={() => toggleFilter(f)} className="rounded-full p-0.5 hover:bg-white/60" aria-label={`Remove ${f}`}>
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </article>
        </div>

        {/* RIGHT: Summary + Generate */}
        <div>
          <article className="sticky top-4 rounded-2xl border border-white/70 bg-gradient-to-br from-white via-white to-[hsl(265_100%_99%)] p-5 shadow-[0_20px_50px_-30px_hsl(265_60%_50%/0.4)]">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]">Ready to build</p>
            <h3 className="mt-1 text-[18px] font-semibold tracking-tight">Review &amp; generate</h3>

            <div className="mt-4 space-y-3 text-[12.5px]">
              <SummaryRow label="Data" value={file ? `${file.name}` : "No file yet"} ok={!!file} />
              <SummaryRow label="Prompt" value={prompt ? `"${prompt.slice(0, 60)}${prompt.length > 60 ? "…" : ""}"` : "Not set"} ok={!!prompt.trim()} />
              <SummaryRow label="Filters" value={filters.length ? `${filters.length} applied` : "None"} ok />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!file || !prompt.trim() || submitting}
              className="mt-5 w-full bg-gradient-to-r from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white shadow-[0_10px_30px_-10px_hsl(265_70%_55%/0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-15px_hsl(265_70%_55%/0.7)]"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate report
            </Button>
            <p className="mt-2 text-center text-[10.5px] text-muted-foreground">
              Saved automatically to your AI reports.
            </p>
          </article>
        </div>
      </div>
    </OSShell>
  );
}

function SummaryRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <span className={cn("text-right text-[12.5px] font-medium", ok ? "text-foreground" : "text-muted-foreground/60")}>{value}</span>
    </div>
  );
}

// Avoid unused import warning when supabase isn't called here (it's used in the view page).
void supabase;