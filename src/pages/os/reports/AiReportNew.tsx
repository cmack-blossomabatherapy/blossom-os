import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Upload, Sparkles, FileSpreadsheet, X, Wand2, Plus,
  CheckCircle2, AlertTriangle, Calendar, Layers, ChevronRight, ChevronLeft,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AiReport, AiReportResult, AiSection, AiChart, AiTable,
  newAiReportId, saveAiReport,
} from "@/lib/os/aiReports";
import {
  ALL_CANONICAL_FIELDS, CanonicalField, ColumnMapping, FIELD_LABELS,
  InspectionResult, ParsedFile, Preset, PRESETS,
  inspectFile, parseCSVFile, runReport, validateRequiredFields,
} from "@/lib/os/reportEngine";

type LoadedFile = { file: File; parsed: ParsedFile; inspection: InspectionResult };

const STEPS = ["Upload", "Report", "Review data", "Generate"] as const;

export default function AiReportNew() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [prompt, setPrompt] = useState(PRESETS[0].prompt);
  const [audience, setAudience] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const onFiles = useCallback(async (incoming: FileList | File[]) => {
    const list = Array.from(incoming).filter((f) => /\.csv$/i.test(f.name) || f.type === "text/csv");
    if (!list.length) { toast.error("Only .csv files are supported"); return; }
    try {
      const loaded: LoadedFile[] = [];
      for (const f of list) {
        if (f.size > 20 * 1024 * 1024) { toast.warning(`${f.name} is large (${(f.size / 1024 / 1024).toFixed(1)} MB) — parsing may be slow.`); }
        const parsed = await parseCSVFile(f);
        if (!parsed.headers.length) { toast.error(`${f.name}: could not detect any columns.`); continue; }
        loaded.push({ file: f, parsed, inspection: inspectFile(parsed) });
      }
      setFiles(prev => {
        const seen = new Set(prev.map(p => p.file.name + ":" + p.file.size));
        const merged = [...prev];
        for (const item of loaded) {
          const key = item.file.name + ":" + item.file.size;
          if (!seen.has(key)) { merged.push(item); seen.add(key); }
        }
        setMappings(merged.map(m => m.inspection.mapping));
        return merged;
      });
    } catch (e: any) {
      toast.error(`Failed to parse CSV: ${e?.message ?? e}`);
    }
  }, []);

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setMappings(prev => prev.filter((_, i) => i !== idx));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files?.length) void onFiles(e.dataTransfer.files);
  };

  function pickPreset(p: Preset) {
    setPreset(p);
    if (p.prompt) setPrompt(p.prompt);
  }

  // Aggregate fields present across all files (mapping)
  const presentFields = useMemo(() => {
    const s = new Set<CanonicalField>();
    for (const m of mappings) for (const v of Object.values(m)) if (v) s.add(v as CanonicalField);
    return s;
  }, [mappings]);

  const missingForPreset = useMemo(
    () => preset.required.filter(f => !presentFields.has(f)),
    [preset, presentFields],
  );

  const totalRows = files.reduce((s, f) => s + f.parsed.rowCount, 0);

  const canNext = () => {
    if (step === 0) return files.length > 0;
    if (step === 1) return !!prompt.trim();
    if (step === 2) return true; // user can override but missing fields just warn
    return true;
  };

  function handleGenerate() {
    if (!files.length) { toast.error("Upload at least one CSV"); return; }
    if (!prompt.trim()) { toast.error("Describe the report"); return; }
    setSubmitting(true);
    try {
      const computation = runReport({
        files: files.map(f => f.parsed),
        mappings,
        preset,
      });

      // Translate ComputedSection → AiSection for the existing viewer
      const aiSections: AiSection[] = computation.sections.map(s => ({
        id: s.id,
        title: s.title,
        narrative: s.unavailable ?? s.narrative,
        insights: s.insights,
        chart: s.chart as AiChart | undefined,
        table: s.table as AiTable | undefined,
      }));

      const result: AiReportResult = {
        title: preset.title,
        subtitle: timeframe || (computation.dateRange ? `${computation.dateRange.min} → ${computation.dateRange.max}` : undefined),
        summary: computation.notes.length
          ? `Computed from ${computation.totalRows} row(s) across ${computation.totalFiles} file(s). ${computation.notes.length} section(s) need additional columns.`
          : `Computed from ${computation.totalRows} row(s) across ${computation.totalFiles} file(s).`,
        audience: audience || undefined,
        timeframe: timeframe || undefined,
        kpis: computation.kpis.map(k => ({ label: k.label, value: k.value })),
        insights: [],
        sections: aiSections,
        dataQuality: computation.dataQuality,
        notes: computation.notes,
      };

      const id = newAiReportId();
      const combinedName = files.length === 1 ? files[0].file.name : `${files.length} files`;
      const report: AiReport = {
        id,
        title: preset.title,
        prompt,
        filters: [],
        audience: audience || undefined,
        timeframe: timeframe || undefined,
        fileName: combinedName,
        rowCount: totalRows,
        files: files.map(f => ({ name: f.file.name, rowCount: f.parsed.rowCount })),
        createdAt: Date.now(),
        status: "ready", // numbers are immediately ready
        narrativeStatus: "pending",
        presetKey: preset.key,
        result,
      };
      saveAiReport(report);

      // Stash a compact payload for the View to call the narrative edge function.
      sessionStorage.setItem(`ai_report_payload_${id}`, JSON.stringify({
        prompt,
        audience,
        timeframe,
        presetKey: preset.key,
        presetTitle: preset.title,
        computation: {
          ...computation,
          // Trim huge tables before stashing
          sections: computation.sections.map(s => ({
            ...s,
            table: s.table ? { columns: s.table.columns, rows: s.table.rows.slice(0, 50) } : undefined,
          })),
        },
      }));

      navigate(`/reports/ai/${id}`);
    } catch (e: any) {
      toast.error(`Generation failed: ${e?.message ?? e}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OSShell>
      <div className="mb-3">
        <Link to="/reports" className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> All reports
        </Link>
      </div>

      {/* HERO */}
      <section className="os-rise relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] via-[hsl(285_100%_98%)] to-[hsl(225_100%_98%)] p-7 shadow-[0_30px_70px_-40px_hsl(265_60%_50%/0.4)]">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[hsl(265_100%_90%)] opacity-50 blur-3xl" />
        <div className="relative">
          <Badge variant="secondary" className="rounded-full bg-white/70 text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(265_70%_55%)]">
            <Sparkles className="mr-1 h-3 w-3" /> Blossom AI
          </Badge>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[32px]">Create a report with AI</h1>
          <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">
            Upload one or more CSV exports. Blossom parses, maps, and calculates — the AI adds narrative on top.
          </p>
        </div>
      </section>

      {/* STEPPER */}
      <div className="mt-5 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition",
              i < step ? "bg-[hsl(265_70%_55%)] text-white" :
              i === step ? "bg-[hsl(265_70%_55%)] text-white shadow-[0_0_0_4px_hsl(265_70%_55%/0.18)]" :
              "bg-white text-muted-foreground border border-border/60",
            )}>
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn("text-[12px] font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border/60" />}
          </div>
        ))}
      </div>

      <div className="mt-5">
        {step === 0 && (
          <UploadStep
            files={files}
            dragOver={dragOver}
            setDragOver={setDragOver}
            onDrop={onDrop}
            onFiles={onFiles}
            removeFile={removeFile}
            inputRef={inputRef}
          />
        )}
        {step === 1 && (
          <PromptStep
            preset={preset}
            pickPreset={pickPreset}
            prompt={prompt}
            setPrompt={setPrompt}
            audience={audience}
            setAudience={setAudience}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
          />
        )}
        {step === 2 && (
          <ReviewStep
            files={files}
            mappings={mappings}
            setMappings={setMappings}
            missingForPreset={missingForPreset}
            preset={preset}
          />
        )}
        {step === 3 && (
          <GenerateStep
            files={files}
            totalRows={totalRows}
            preset={preset}
            prompt={prompt}
            audience={audience}
            timeframe={timeframe}
            missingForPreset={missingForPreset}
            mappings={mappings}
            onGenerate={handleGenerate}
            submitting={submitting}
          />
        )}
      </div>

      {/* NAV */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => step === 0 ? navigate("/reports") : setStep(step - 1)}>
          <ChevronLeft className="mr-1 h-4 w-4" /> {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button size="sm" disabled={!canNext()} onClick={() => setStep(step + 1)}
            className="bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]">
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" disabled={submitting} onClick={handleGenerate}
            className="bg-gradient-to-r from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)]">
            <Sparkles className="mr-1.5 h-4 w-4" /> Generate report
          </Button>
        )}
      </div>
    </OSShell>
  );
}

// ============================================================================
// Step 1 — Upload
// ============================================================================
function UploadStep({
  files, dragOver, setDragOver, onDrop, onFiles, removeFile, inputRef,
}: {
  files: LoadedFile[];
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onFiles: (f: FileList | File[]) => void;
  removeFile: (i: number) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2">
        <Upload className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
        <h3 className="text-[14px] font-semibold tracking-tight">Upload your CSV(s)</h3>
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">
        CentralReach, Monday.com, scheduling, billing, authorization, cancellation — any CSV. Multiple files allowed.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "mt-4 cursor-pointer rounded-2xl border-2 border-dashed bg-secondary/20 p-6 text-center transition",
          dragOver ? "border-[hsl(265_70%_55%)] bg-[hsl(265_100%_98%)]" : "border-border/60 hover:border-[hsl(265_70%_55%/0.5)] hover:bg-secondary/30",
        )}
      >
        {files.length === 0 ? (
          <>
            <div className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Upload className="h-5 w-5 text-[hsl(265_70%_55%)]" />
            </div>
            <p className="text-[13px] font-medium">Drop one or more CSVs here</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">or click to browse</p>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {files.map(({ file: f, parsed, inspection }, idx) => (
              <div key={`${f.name}-${idx}`} className="flex items-center gap-3 rounded-xl border border-border/60 bg-white px-3 py-2 text-left">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(265_100%_97%)] text-[hsl(265_70%_55%)]">
                  <FileSpreadsheet className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold">{f.name}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {parsed.rowCount.toLocaleString()} rows · {parsed.headers.length} cols
                    {inspection.dateRange ? ` · ${inspection.dateRange.min} → ${inspection.dateRange.max}` : ""}
                  </p>
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
            <div className="mt-1 flex items-center justify-center text-[11px] text-[hsl(265_70%_55%)]">
              <Plus className="mr-1 h-3 w-3" /> Add more files
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
  );
}

// ============================================================================
// Step 2 — Report type + prompt
// ============================================================================
function PromptStep({
  preset, pickPreset, prompt, setPrompt, audience, setAudience, timeframe, setTimeframe,
}: {
  preset: Preset;
  pickPreset: (p: Preset) => void;
  prompt: string;
  setPrompt: (s: string) => void;
  audience: string;
  setAudience: (s: string) => void;
  timeframe: string;
  setTimeframe: (s: string) => void;
}) {
  return (
    <div className="space-y-4">
      <article className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
          <h3 className="text-[14px] font-semibold tracking-tight">Choose a report type</h3>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PRESETS.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => pickPreset(p)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left transition",
                preset.key === p.key
                  ? "border-[hsl(265_70%_55%)] bg-[hsl(265_100%_98%)] shadow-sm"
                  : "border-border/60 bg-card hover:border-[hsl(265_70%_55%/0.4)] hover:bg-secondary/30",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold">{p.title}</p>
                {preset.key === p.key && <CheckCircle2 className="h-4 w-4 text-[hsl(265_70%_55%)]" />}
              </div>
              <p className="mt-1 text-[11.5px] text-muted-foreground">{p.description}</p>
            </button>
          ))}
        </div>
      </article>

      <article className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2">
          <Wand2 className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
          <h3 className="text-[14px] font-semibold tracking-tight">Prompt</h3>
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          The selected preset filled this in. Edit freely — the engine still computes numbers from your CSV.
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          placeholder="Describe what you want to see…"
          className="mt-3 w-full rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5 text-[13px] outline-none transition focus:border-[hsl(265_70%_55%)] focus:bg-card"
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Audience (optional)">
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. State Director, Operations Lead" />
          </Field>
          <Field label="Timeframe (optional)">
            <Input value={timeframe} onChange={(e) => setTimeframe(e.target.value)} placeholder="e.g. November 2026" />
          </Field>
        </div>
      </article>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

// ============================================================================
// Step 3 — Inspection + Column Mapping
// ============================================================================
function ReviewStep({
  files, mappings, setMappings, missingForPreset, preset,
}: {
  files: LoadedFile[];
  mappings: ColumnMapping[];
  setMappings: (m: ColumnMapping[]) => void;
  missingForPreset: CanonicalField[];
  preset: Preset;
}) {
  function updateMapping(fileIdx: number, header: string, value: CanonicalField | "") {
    const next = mappings.map(m => ({ ...m }));
    // ensure no two headers in the same file map to the same canonical field
    if (value) {
      for (const h of Object.keys(next[fileIdx])) {
        if (next[fileIdx][h] === value && h !== header) next[fileIdx][h] = "";
      }
    }
    next[fileIdx][header] = value;
    setMappings(next);
  }

  return (
    <div className="space-y-4">
      <article className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
          <h3 className="text-[14px] font-semibold tracking-tight">Data inspection</h3>
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Auto-detected columns mapped to canonical fields. Override any dropdown if a column was misidentified.
        </p>

        {missingForPreset.length > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-[12px]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">Missing fields for "{preset.title}"</p>
              <p className="text-amber-700">
                {missingForPreset.map(f => FIELD_LABELS[f]).join(", ")}. Sections that depend on these will be skipped with a clear message.
              </p>
            </div>
          </div>
        )}
      </article>

      {files.map((f, idx) => (
        <article key={f.file.name + idx} className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold">{f.file.name}</p>
              <p className="text-[11.5px] text-muted-foreground tabular-nums">
                {f.parsed.rowCount.toLocaleString()} rows · {f.parsed.headers.length} cols
                {f.inspection.dateRange ? ` · ${f.inspection.dateRange.min} → ${f.inspection.dateRange.max}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              {Object.entries(f.inspection.detected).slice(0, 6).map(([canon, header]) => (
                <span key={canon} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  {FIELD_LABELS[canon as CanonicalField]}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="border-b border-border/60 px-3 py-2 text-left">CSV column</th>
                  <th className="border-b border-border/60 px-3 py-2 text-left">Canonical field</th>
                  <th className="border-b border-border/60 px-3 py-2 text-left">Sample</th>
                </tr>
              </thead>
              <tbody>
                {f.parsed.headers.map(h => (
                  <tr key={h} className="border-b border-border/30">
                    <td className="px-3 py-2 font-medium">{h}</td>
                    <td className="px-3 py-2">
                      <select
                        value={mappings[idx]?.[h] ?? ""}
                        onChange={(e) => updateMapping(idx, h, e.target.value as CanonicalField | "")}
                        className="rounded-md border border-border/60 bg-card px-2 py-1 text-[12px] outline-none focus:border-[hsl(265_70%_55%)]"
                      >
                        <option value="">— ignore —</option>
                        {ALL_CANONICAL_FIELDS.map(field => (
                          <option key={field} value={field}>{FIELD_LABELS[field]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {(f.parsed.rows[0]?.[h] ?? "").toString().slice(0, 40) || <span className="italic">empty</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </div>
  );
}

// ============================================================================
// Step 4 — Review & Generate
// ============================================================================
function GenerateStep({
  files, totalRows, preset, prompt, audience, timeframe, missingForPreset, mappings, onGenerate, submitting,
}: {
  files: LoadedFile[];
  totalRows: number;
  preset: Preset;
  prompt: string;
  audience: string;
  timeframe: string;
  missingForPreset: CanonicalField[];
  mappings: ColumnMapping[];
  onGenerate: () => void;
  submitting: boolean;
}) {
  const dateRange = (() => {
    const ranges = files.map(f => f.inspection.dateRange).filter(Boolean) as { min: string; max: string }[];
    if (!ranges.length) return null;
    return { min: ranges.map(r => r.min).sort()[0], max: ranges.map(r => r.max).sort().slice(-1)[0] };
  })();
  const mappedFieldCount = (() => {
    const s = new Set<string>(); for (const m of mappings) for (const v of Object.values(m)) if (v) s.add(v);
    return s.size;
  })();
  const ready = files.length > 0 && prompt.trim().length > 0;

  return (
    <article className="rounded-2xl border border-white/70 bg-gradient-to-br from-white via-white to-[hsl(265_100%_99%)] p-5 shadow-[0_20px_50px_-30px_hsl(265_60%_50%/0.4)]">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]">Review &amp; generate</p>
      <h3 className="mt-1 text-[18px] font-semibold tracking-tight">{preset.title}</h3>

      <div className="mt-4 grid gap-2 text-[12.5px]">
        <Row label="Files" value={`${files.length} · ${totalRows.toLocaleString()} rows`} ok={files.length > 0} />
        <Row label="Date range" value={dateRange ? `${dateRange.min} → ${dateRange.max}` : "Not detected"} ok={!!dateRange} />
        <Row label="Audience" value={audience || "—"} ok />
        <Row label="Timeframe" value={timeframe || "—"} ok />
        <Row label="Mapped fields" value={`${mappedFieldCount} canonical fields`} ok={mappedFieldCount > 0} />
        <Row label="Missing for preset" value={missingForPreset.length ? missingForPreset.map(f => FIELD_LABELS[f]).join(", ") : "None"} ok={missingForPreset.length === 0} warn={missingForPreset.length > 0} />
      </div>

      {missingForPreset.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-800">
          <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
          We'll still generate the report — sections that need missing fields will show "Unable to calculate…" instead of fake numbers.
        </div>
      )}

      <Button
        onClick={onGenerate}
        disabled={!ready || submitting}
        className="mt-5 w-full bg-gradient-to-r from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white shadow-[0_10px_30px_-10px_hsl(265_70%_55%/0.6)] transition hover:-translate-y-0.5"
      >
        <Sparkles className="mr-2 h-4 w-4" /> {submitting ? "Generating…" : "Generate report"}
      </Button>
    </article>
  );
}

function Row({ label, value, ok, warn }: { label: string; value: string; ok?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/30 pb-1.5 last:border-0">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <span className={cn(
        "text-right text-[12.5px] font-medium",
        warn ? "text-amber-700" : ok ? "text-foreground" : "text-muted-foreground/60",
      )}>{value}</span>
    </div>
  );
}