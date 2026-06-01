import { useCallback, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Upload, Sparkles, FileSpreadsheet, X, Wand2, Plus, BarChart3 } from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  parseAnyFile, SUPPORTED_EXTENSIONS,
  classifyDashboardType, PROMPT_SUGGESTIONS,
  buildDashboard,
} from "@/lib/os/dashboardEngine";
import { inspectFile } from "@/lib/os/reportEngine/inspector";
import type { CanonicalField, ColumnMapping, ParsedFile } from "@/lib/os/reportEngine/types";
import { saveAiDashboard, newAiDashboardId } from "@/lib/os/aiDashboards";
import { DASHBOARD_TYPE_LABELS } from "@/lib/os/dashboardEngine/types";

type LoadedFile = { name: string; size: number; parsed: ParsedFile; mapping: ColumnMapping };

export default function AiDashboardNew() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onFiles = useCallback(async (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    if (!list.length) return;
    try {
      const loaded: LoadedFile[] = [];
      for (const f of list) {
        if (f.size > 20 * 1024 * 1024) toast.warning(`${f.name} is large (${(f.size / 1024 / 1024).toFixed(1)} MB) — parsing may be slow.`);
        const parsedList = await parseAnyFile(f);
        for (const parsed of parsedList) {
          const insp = inspectFile(parsed);
          loaded.push({ name: parsed.fileName, size: f.size, parsed, mapping: insp.mapping });
        }
      }
      setFiles(prev => {
        const seen = new Set(prev.map(p => p.name));
        const merged = [...prev];
        for (const item of loaded) if (!seen.has(item.name)) { merged.push(item); seen.add(item.name); }
        return merged;
      });
    } catch (e: any) {
      toast.error(`Failed to parse: ${e?.message ?? e}`);
    }
  }, []);

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  function handleBuild() {
    if (!files.length) { toast.error("Upload at least one file"); return; }
    setSubmitting(true);
    try {
      const detected = new Set<CanonicalField>();
      for (const f of files) for (const v of Object.values(f.mapping)) if (v) detected.add(v as CanonicalField);
      const userPrompt = prompt.trim() || "Build an operational dashboard";
      const type = classifyDashboardType(userPrompt, detected);
      const spec = buildDashboard({
        files: files.map(f => f.parsed),
        mappings: files.map(f => f.mapping),
        type,
      });
      const id = newAiDashboardId();
      saveAiDashboard({
        id,
        title: DASHBOARD_TYPE_LABELS[type],
        prompt: userPrompt,
        dashboardType: type,
        fileNames: files.map(f => f.name),
        rowCount: spec.totalRows,
        createdAt: Date.now(),
        status: "ready",
        narrativeStatus: "pending",
        spec,
      });
      navigate(`/dashboards/ai/${id}`);
    } catch (e: any) {
      toast.error(`Build failed: ${e?.message ?? e}`);
    } finally { setSubmitting(false); }
  }

  return (
    <OSShell>
      <div className="mb-3">
        <Link to="/reports" className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to Reports
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] via-[hsl(285_100%_98%)] to-[hsl(225_100%_98%)] p-7 shadow-[0_30px_70px_-40px_hsl(265_60%_50%/0.4)]">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[hsl(265_100%_90%)] opacity-50 blur-3xl" />
        <div className="relative">
          <Badge variant="secondary" className="rounded-full bg-white/70 text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(265_70%_55%)]">
            <Sparkles className="mr-1 h-3 w-3" /> Blossom AI
          </Badge>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[34px]">Create AI Dashboard</h1>
          <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">
            Upload your data. Ask a question. Instantly build an interactive dashboard.
          </p>
        </div>
      </section>

      {/* UPLOAD */}
      <article className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2">
          <Upload className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
          <h3 className="text-[14px] font-semibold tracking-tight">1 · Upload your data</h3>
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          CSV or Excel. Drop one or many files — CentralReach, scheduling, authorizations, billing, recruiting, Monday exports.
        </p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) void onFiles(e.dataTransfer.files); }}
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
              <p className="text-[13px] font-medium">Drop CSV or Excel files here</p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">or click to browse</p>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl border border-border/60 bg-white px-3 py-2 text-left">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(265_100%_97%)] text-[hsl(265_70%_55%)]">
                    <FileSpreadsheet className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold">{f.name}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {f.parsed.rowCount.toLocaleString()} rows · {f.parsed.headers.length} cols
                      {f.parsed.dateRange ? ` · ${f.parsed.dateRange.min} → ${f.parsed.dateRange.max}` : ""}
                    </p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="mt-1 flex items-center justify-center text-[11px] text-[hsl(265_70%_55%)]">
                <Plus className="mr-1 h-3 w-3" /> Add more files
              </div>
            </div>
          )}
          <input ref={inputRef} type="file" accept={SUPPORTED_EXTENSIONS} multiple className="hidden"
            onChange={(e) => { const list = e.target.files; if (list?.length) void onFiles(list); e.currentTarget.value = ""; }} />
        </div>
      </article>

      {/* PROMPT */}
      <article className="mt-5 rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2">
          <Wand2 className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
          <h3 className="text-[14px] font-semibold tracking-tight">2 · What would you like to understand from your data?</h3>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. Show supervision percentages, or build a leadership dashboard…"
          className="mt-3 w-full rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5 text-[13px] outline-none transition focus:border-[hsl(265_70%_55%)] focus:bg-card"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PROMPT_SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setPrompt(s)} type="button"
              className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.4)] hover:text-[hsl(265_70%_55%)]">
              {s}
            </button>
          ))}
        </div>
      </article>

      <div className="mt-6 flex items-center justify-end">
        <Button onClick={handleBuild} disabled={!files.length || submitting}
          className="bg-gradient-to-r from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white shadow-[0_10px_30px_-10px_hsl(265_70%_55%/0.6)] transition hover:-translate-y-0.5">
          <BarChart3 className="mr-2 h-4 w-4" /> {submitting ? "Building…" : "Build dashboard"}
        </Button>
      </div>
    </OSShell>
  );
}