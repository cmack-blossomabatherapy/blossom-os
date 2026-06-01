import { useCallback, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Upload, Sparkles, FileSpreadsheet, X, Wand2, Filter, Users, Calendar, Layers, Target, GitCompare, Plus } from "lucide-react";
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

const AUDIENCE_OPTIONS = [
  "Super Admin / Leadership",
  "Operations Lead",
  "State Director",
  "HR Team",
  "QA Team",
  "Recruiting",
  "Scheduling",
  "Finance / Billing",
  "BCBA Lead",
  "Intake",
];

const TIMEFRAME_OPTIONS = [
  "This week", "This month", "MTD", "Last 30 days", "QTD", "Last 90 days", "YTD", "Last 12 months", "All time",
];

const BREAKDOWN_OPTIONS = [
  "By State", "By Region", "By BCBA", "By RBT", "By Client", "By Payor", "By Service Code", "By Status", "By Week", "By Month",
];

const COMPARISON_OPTIONS = [
  "None",
  "vs previous period",
  "vs same period last year",
  "vs target / goal",
  "vs company average",
];

export default function AiReportNew() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<{ file: File; csvText: string }[]>([]);
  const [prompt, setPrompt] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [filterInput, setFilterInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [audience, setAudience] = useState<string>("Super Admin / Leadership");
  const [timeframe, setTimeframe] = useState<string>("This month");
  const [breakdown, setBreakdown] = useState<string>("By State");
  const [comparison, setComparison] = useState<string>("vs previous period");
  const [goal, setGoal] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = useCallback(async (incoming: FileList | File[]) => {
    const list = Array.from(incoming).filter((f) => /\.csv$/i.test(f.name) || f.type === "text/csv");
    if (!list.length) { toast.error("Only .csv files are supported"); return; }
    const loaded = await Promise.all(list.map(async (f) => ({ file: f, csvText: await f.text() })));
    setFiles((prev) => {
      const seen = new Set(prev.map((p) => p.file.name + ":" + p.file.size));
      const merged = [...prev];
      for (const item of loaded) {
        const key = item.file.name + ":" + item.file.size;
        if (!seen.has(key)) { merged.push(item); seen.add(key); }
      }
      return merged;
    });
  }, []);

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const list = e.dataTransfer.files;
    if (list?.length) void onFiles(list);
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
    if (!files.length) { toast.error("Upload at least one CSV first"); return; }
    if (!prompt.trim()) { toast.error("Tell the AI what report to build"); return; }
    setSubmitting(true);

    // With multiple files, keep each preview compact so the AI prompt + sessionStorage stay reasonable.
    const perFileMax = files.length <= 1 ? 150 : files.length <= 3 ? 80 : 50;
    const filePayloads = files.map(({ file, csvText }) => {
      const { preview, rowCount, headers } = previewCsvForPrompt(csvText, perFileMax);
      return { fileName: file.name, preview, rowCount, headers };
    });
    const totalRows = filePayloads.reduce((s, f) => s + f.rowCount, 0);
    const combinedName = files.length === 1
      ? files[0].file.name
      : `${files.length} files`;

    const id = newAiReportId();
    const report: AiReport = {
      id,
      title: prompt.slice(0, 60) || "AI Report",
      prompt,
      filters,
      audience,
      timeframe,
      breakdown,
      goal,
      comparison,
      fileName: combinedName,
      rowCount: totalRows,
      files: filePayloads.map((f) => ({ name: f.fileName, rowCount: f.rowCount })),
      createdAt: Date.now(),
      status: "generating",
    };
    saveAiReport(report);
    // Stash payload for the loading view to consume. Includes per-file previews
    // plus legacy single fields for backward compatibility.
    const first = filePayloads[0];
    sessionStorage.setItem(`ai_report_payload_${id}`, JSON.stringify({
      files: filePayloads,
      // Legacy/back-compat single-file fields (first file):
      preview: first.preview,
      rowCount: first.rowCount,
      headers: first.headers,
      fileName: report.fileName,
      prompt, filters,
      audience, timeframe, breakdown, goal, comparison,
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
            <p className="mt-1 text-[12px] text-muted-foreground">
              One or more CSV exports — Blossom will scan them together to build the report, dashboard, and drill-downs.
            </p>

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
              {files.length === 0 ? (
                <>
                  <div className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Upload className="h-5 w-5 text-[hsl(265_70%_55%)]" />
                  </div>
                  <p className="text-[13px] font-medium">Drop one or more CSVs here</p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">or click to browse — you can add more after</p>
                </>
              ) : (
                <div className="flex flex-col items-stretch gap-2">
                  {files.map(({ file: f }, idx) => (
                    <div key={`${f.name}-${idx}`} className="flex items-center gap-3 rounded-xl border border-border/60 bg-white px-3 py-2 text-left">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(265_100%_97%)] text-[hsl(265_70%_55%)]">
                        <FileSpreadsheet className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold">{f.name}</p>
                        <p className="text-[10.5px] text-muted-foreground">{(f.size / 1024).toFixed(1)} KB · ready</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
                        aria-label={`Remove ${f.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="mt-1 flex items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
                    <span>{files.length} file{files.length === 1 ? "" : "s"} · click anywhere to add more</span>
                    <span className="inline-flex items-center gap-1 text-[hsl(265_70%_55%)]"><Plus className="h-3 w-3" /> Add files</span>
                  </div>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                multiple
                className="hidden"
                onChange={(e) => { const list = e.target.files; if (list?.length) void onFiles(list); e.currentTarget.value = ""; }}
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
              <Target className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[14px] font-semibold tracking-tight">3 · Shape the report</h3>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              A few quick choices let Blossom tailor a real drill-down dashboard instead of a generic chart.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <PickerField label="Audience / role" icon={<Users className="h-3 w-3" />} options={AUDIENCE_OPTIONS} value={audience} onChange={setAudience} />
              <PickerField label="Timeframe" icon={<Calendar className="h-3 w-3" />} options={TIMEFRAME_OPTIONS} value={timeframe} onChange={setTimeframe} />
              <PickerField label="Primary breakdown" icon={<Layers className="h-3 w-3" />} options={BREAKDOWN_OPTIONS} value={breakdown} onChange={setBreakdown} />
              <PickerField label="Comparison" icon={<GitCompare className="h-3 w-3" />} options={COMPARISON_OPTIONS} value={comparison} onChange={setComparison} />
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Target className="h-3 w-3" /> Decision this report should drive
              </label>
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Which BCBAs need coaching this week?"
                className="mt-2 h-9 text-[12.5px]"
              />
            </div>
          </article>

          <article className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[14px] font-semibold tracking-tight">4 · Filters (optional)</h3>
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
              <SummaryRow
                label="Data"
                value={
                  files.length === 0
                    ? "No file yet"
                    : files.length === 1
                      ? files[0].file.name
                      : `${files.length} files (${files.map((f) => f.file.name).join(", ").slice(0, 60)}${files.map((f) => f.file.name).join(", ").length > 60 ? "…" : ""})`
                }
                ok={files.length > 0}
              />
              <SummaryRow label="Prompt" value={prompt ? `"${prompt.slice(0, 60)}${prompt.length > 60 ? "…" : ""}"` : "Not set"} ok={!!prompt.trim()} />
              <SummaryRow label="Audience" value={audience} ok />
              <SummaryRow label="Timeframe" value={timeframe} ok />
              <SummaryRow label="Breakdown" value={breakdown} ok />
              <SummaryRow label="Comparison" value={comparison} ok />
              <SummaryRow label="Goal" value={goal ? `"${goal.slice(0, 50)}${goal.length > 50 ? "…" : ""}"` : "—"} ok />
              <SummaryRow label="Filters" value={filters.length ? `${filters.length} applied` : "None"} ok />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={files.length === 0 || !prompt.trim() || submitting}
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

function PickerField({
  label, icon, options, value, onChange,
}: { label: string; icon: React.ReactNode; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {icon} {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-border/60 bg-secondary/20 px-3 py-2 text-[12.5px] font-medium outline-none transition focus:border-[hsl(265_70%_55%)] focus:bg-card"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// Avoid unused import warning when supabase isn't called here (it's used in the view page).
void supabase;