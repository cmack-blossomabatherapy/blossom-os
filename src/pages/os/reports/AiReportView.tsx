import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Download, RefreshCw, Trash2, FileSpreadsheet,
  TrendingUp, TrendingDown, Minus, Brain, Pencil, Check, X,
  AlertTriangle, ListChecks, Users, Calendar, Layers, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  AiReport, AiReportResult, AiSection, AiChart, AiTable, AiRisk,
  deleteAiReport, getAiReport, saveAiReport,
} from "@/lib/os/aiReports";
import { toast } from "sonner";

const LOADING_STEPS = [
  "Reading your data…",
  "Detecting columns & dimensions…",
  "Computing KPIs…",
  "Spotting operational trends…",
  "Drafting insights…",
  "Polishing the report…",
];

const NARRATIVE_STEPS = [
  "Reading the computed report…",
  "Drafting executive summary…",
  "Writing section narratives…",
  "Surfacing recommendations…",
];

export default function AiReportView() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<AiReport | undefined>(() => getAiReport(id));
  const [step, setStep] = useState(0);
  const [narrativeStep, setNarrativeStep] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const ranRef = useRef(false);
  const narrativeRanRef = useRef(false);

  // Animated loading steps while generating.
  useEffect(() => {
    if (report?.status !== "generating") return;
    const t = setInterval(() => setStep(s => (s + 1) % LOADING_STEPS.length), 1100);
    return () => clearInterval(t);
  }, [report?.status]);

  // Animate narrative-loading steps while AI narrative is pending.
  useEffect(() => {
    if (report?.narrativeStatus !== "pending") return;
    const t = setInterval(() => setNarrativeStep(s => (s + 1) % NARRATIVE_STEPS.length), 1100);
    return () => clearInterval(t);
  }, [report?.narrativeStatus]);

  // Fetch AI narrative once if numbers are ready but narrative is still pending.
  useEffect(() => {
    if (!report || report.status !== "ready" || report.narrativeStatus !== "pending") return;
    if (narrativeRanRef.current) return;
    narrativeRanRef.current = true;

    const payloadRaw = sessionStorage.getItem(`ai_report_payload_${id}`);
    if (!payloadRaw) {
      const next: AiReport = { ...report, narrativeStatus: "error" };
      saveAiReport(next); setReport(next);
      return;
    }

    (async () => {
      try {
        const payload = JSON.parse(payloadRaw);
        const { data, error } = await supabase.functions.invoke("generate-ai-report", {
          body: {
            prompt: payload.prompt,
            audience: payload.audience,
            timeframe: payload.timeframe,
            presetTitle: payload.presetTitle,
            computation: payload.computation,
          },
        });
        if (data?.error) throw new Error(data.error);
        if (error) {
          let detail = error.message || "Narrative failed";
          try {
            const ctx: any = (error as any).context;
            const bodyTxt = ctx?.body ? await new Response(ctx.body).text() : null;
            if (bodyTxt) {
              const parsed = JSON.parse(bodyTxt);
              if (parsed?.error) detail = parsed.error;
            }
          } catch { /* ignore */ }
          throw new Error(detail);
        }
        const n = data?.narrative;
        if (!n) throw new Error("No narrative returned");

        const existing = report.result;
        if (!existing) return;

        // Merge AI narrative into deterministic result.
        const sectionNarrativeMap = new Map<string, { narrative?: string; insights?: string[] }>();
        for (const sn of (n.sectionNarratives ?? [])) {
          if (sn?.id) sectionNarrativeMap.set(sn.id, { narrative: sn.narrative, insights: sn.insights });
        }
        const mergedSections = (existing.sections ?? []).map(s => {
          const sn = sectionNarrativeMap.get(s.id);
          if (!sn) return s;
          // Don't overwrite "unavailable" narratives written by the engine.
          const keepEngineNarrative = s.narrative && s.narrative.toLowerCase().startsWith("missing");
          return {
            ...s,
            narrative: keepEngineNarrative ? s.narrative : (sn.narrative || s.narrative),
            insights: sn.insights?.length ? sn.insights : s.insights,
          };
        });

        const mergedResult: AiReportResult = {
          ...existing,
          summary: n.summary || existing.summary,
          insights: Array.isArray(n.insights) && n.insights.length ? n.insights : existing.insights,
          recommendations: Array.isArray(n.recommendations) && n.recommendations.length ? n.recommendations : existing.recommendations,
          risks: Array.isArray(n.risks) && n.risks.length ? n.risks : existing.risks,
          sections: mergedSections,
        };

        const next: AiReport = { ...report, narrativeStatus: "ready", result: mergedResult };
        saveAiReport(next); setReport(next);
        sessionStorage.removeItem(`ai_report_payload_${id}`);
        toast.success("AI narrative added");
      } catch (e: any) {
        const next: AiReport = { ...report, narrativeStatus: "error" };
        saveAiReport(next); setReport(next);
        toast.error(`AI narrative unavailable: ${e?.message ?? "unknown error"}`);
      }
    })();
  }, [report, id]);

  // Legacy "generating" reports (created before the deterministic engine) cannot
  // be revived — they have no computation payload. Surface a clear error.
  useEffect(() => {
    if (!report || report.status !== "generating" || ranRef.current) return;
    ranRef.current = true;
    const errored: AiReport = {
      ...report,
      status: "error",
      error: "This report was created with an older flow. Click \"Try again\" to re-upload your CSV(s) and use the new deterministic report engine.",
    };
    saveAiReport(errored); setReport(errored);
  }, [report, id]);

  function startEditingTitle() {
    if (!report) return;
    setEditTitle(report.title);
    setIsEditingTitle(true);
  }

  function saveTitle() {
    if (!report || !editTitle.trim()) return;
    const next: AiReport = { ...report, title: editTitle.trim() };
    saveAiReport(next);
    setReport(next);
    setIsEditingTitle(false);
    toast.success("Report name updated");
  }

  function cancelEditTitle() {
    setIsEditingTitle(false);
    setEditTitle("");
  }

  if (!report) {
    return (
      <OSShell>
        <div className="os-card flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-[20px] font-semibold tracking-tight">Report not found</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">It may have been deleted from your saved AI reports.</p>
          <Button className="mt-5" size="sm" onClick={() => navigate("/reports")}>Back to Reports</Button>
        </div>
      </OSShell>
    );
  }

  function handleDelete() {
    deleteAiReport(id);
    toast.success("Report deleted");
    navigate("/reports");
  }

  function handleExport() {
    if (!report?.result) return;
    const blob = new Blob([JSON.stringify(report.result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/[^a-z0-9-_]+/gi, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <OSShell>
      <div className="mb-3 flex items-center justify-between">
        <Link to="/reports" className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> All reports
        </Link>
        <div className="flex items-center gap-1.5">
          {report.status === "ready" && (
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="mr-1 h-3.5 w-3.5" /> Export
            </Button>
          )}
          {report.status === "error" && (
            <Button size="sm" variant="outline" onClick={() => navigate("/reports/ai/new")}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Try again
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleDelete}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* HERO */}
      <section className="os-rise relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] via-[hsl(285_100%_98%)] to-[hsl(225_100%_98%)] p-7 shadow-[0_30px_70px_-40px_hsl(265_60%_50%/0.4)]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[hsl(265_100%_90%)] opacity-50 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full bg-white/70 text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_55%)]">
              <Sparkles className="mr-1 h-3 w-3" /> AI Report
            </Badge>
            <Badge variant="outline" className="rounded-full border-white/60 bg-white/60 text-[10px] font-medium text-muted-foreground" title={report.files?.map((f) => `${f.name} (${f.rowCount} rows)`).join(", ")}>
              <FileSpreadsheet className="mr-1 h-3 w-3" />
              {report.files && report.files.length > 1
                ? `${report.files.length} files · ${report.rowCount} rows`
                : `${report.fileName} · ${report.rowCount} rows`}
            </Badge>
            {report.status === "generating" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[10.5px] font-medium text-[hsl(265_70%_55%)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(265_70%_55%)] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(265_70%_55%)]" />
                </span>
                Generating
              </span>
            )}
          </div>

          {isEditingTitle ? (
            <div className="mt-3 flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); saveTitle(); }
                  if (e.key === "Escape") cancelEditTitle();
                }}
                autoFocus
                className="h-10 max-w-xl text-[22px] font-semibold tracking-tight md:text-[26px]"
              />
              <button
                onClick={saveTitle}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-600"
                aria-label="Save name"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={cancelEditTitle}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-sm transition hover:bg-muted-foreground/20"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <h1 className="text-[28px] font-semibold tracking-tight md:text-[32px]">
                {report.status === "ready" ? report.title : "Building your report…"}
              </h1>
              {report.status === "ready" && (
                <button
                  onClick={startEditingTitle}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-muted-foreground shadow-sm transition hover:bg-white hover:text-foreground"
                  aria-label="Edit report name"
                  title="Edit report name"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
            {report.status === "ready" ? report.result?.summary : `Prompt: "${report.prompt}"`}
          </p>
          {report.filters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {report.filters.map(f => (
                <span key={f} className="rounded-full bg-white/70 px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">{f}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BODY */}
      <div className="mt-6">
        {report.status === "generating" && <LoadingState step={step} />}
        {report.status === "error" && (
          <div className="os-card flex flex-col items-center justify-center py-12 text-center">
            <p className="text-[14px] font-semibold">Generation failed</p>
            <p className="mt-1 max-w-md text-[12.5px] text-muted-foreground">{report.error}</p>
            <Button size="sm" className="mt-4" onClick={() => navigate("/reports/ai/new")}>Try again</Button>
          </div>
        )}
        {report.status === "ready" && report.result && (
          <ReadyState
            result={report.result}
            narrativeStatus={report.narrativeStatus}
            narrativeStep={narrativeStep}
          />
        )}
      </div>
    </OSShell>
  );
}

function LoadingState({ step }: { step: number }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="os-skeleton h-2.5 w-1/2 rounded" />
            <div className="os-skeleton mt-3 h-6 w-2/3 rounded" />
            <div className="os-skeleton mt-2 h-2 w-1/3 rounded" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="os-skeleton h-3 w-1/3 rounded" />
          <div className="os-skeleton mt-4 h-48 w-full rounded-xl" />
        </div>

        <div className="rounded-2xl border border-[hsl(265_70%_55%/0.25)] bg-gradient-to-br from-[hsl(265_100%_98%)] to-white p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white shadow-sm">
              <Brain className="h-3.5 w-3.5" />
            </span>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]">Blossom AI</p>
          </div>
          <div className="mt-3 space-y-2">
            {LOADING_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 text-[12.5px]">
                <span
                  className={cn(
                    "inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold transition-all",
                    i < step && "bg-emerald-500 text-white",
                    i === step && "bg-[hsl(265_70%_55%)] text-white animate-pulse",
                    i > step && "bg-secondary text-muted-foreground/60",
                  )}
                >
                  {i < step ? "✓" : i + 1}
                </span>
                <span className={cn(
                  "transition-colors",
                  i === step ? "font-semibold text-foreground" : i < step ? "text-foreground/70" : "text-muted-foreground/60",
                )}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadyState({
  result, narrativeStatus, narrativeStep,
}: {
  result: AiReportResult;
  narrativeStatus?: "pending" | "ready" | "error";
  narrativeStep: number;
}) {
  const sections = result.sections ?? [];
  const hasSections = sections.length > 0;
  return (
    <div className="space-y-5">
      {narrativeStatus === "pending" && (
        <div className="rounded-2xl border border-[hsl(265_70%_55%/0.25)] bg-gradient-to-r from-[hsl(265_100%_98%)] to-white p-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white">
              <Brain className="h-3 w-3" />
            </span>
            <p className="text-[12px] font-medium text-[hsl(265_70%_55%)]">
              {NARRATIVE_STEPS[narrativeStep]} — numbers below are final.
            </p>
          </div>
        </div>
      )}
      {narrativeStatus === "error" && (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50 p-3">
          <p className="text-[12px] font-medium text-amber-800">
            AI narrative unavailable — deterministic numbers are still accurate below.
          </p>
        </div>
      )}
      {result.dataQuality && result.dataQuality.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Data quality</p>
          <ul className="mt-2 space-y-1 text-[12px]">
            {result.dataQuality.map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3 w-3 text-amber-500" />
                <span><span className="font-medium">{d.label}:</span> {d.detail}{d.rowsAffected ? ` (${d.rowsAffected} rows)` : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(result.audience || result.timeframe) && (
        <div className="flex flex-wrap gap-1.5">
          {result.audience && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground">
              <Users className="h-3 w-3" /> {result.audience}
            </span>
          )}
          {result.timeframe && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground">
              <Calendar className="h-3 w-3" /> {result.timeframe}
            </span>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className={cn(
        "grid gap-3",
        result.kpis.length <= 3 ? "grid-cols-1 md:grid-cols-3" :
        result.kpis.length === 4 ? "grid-cols-2 md:grid-cols-4" :
        "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
      )}>
        {result.kpis.map((k, i) => <KpiCard key={i} kpi={k} />)}
      </div>

      {/* Top-level insights + recommendations + risks */}
      <div className="grid gap-4 lg:grid-cols-3">
        <InsightsCard insights={result.insights} />
        {result.recommendations && result.recommendations.length > 0 && (
          <RecommendationsCard items={result.recommendations} />
        )}
        {result.risks && result.risks.length > 0 && (
          <RisksCard risks={result.risks} />
        )}
      </div>

      {/* Drill-down sections */}
      {hasSections ? (
        <div className="space-y-5">
          {/* Section quick-nav */}
          {sections.length > 1 && (
            <nav className="flex flex-wrap gap-1.5">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.4)] hover:text-[hsl(265_70%_55%)]">
                  <Layers className="h-3 w-3" /> {s.title}
                </a>
              ))}
            </nav>
          )}
          {sections.map((s, i) => <SectionCard key={s.id || i} section={s} index={i} />)}
        </div>
      ) : (
        <>
          {result.chart && (
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <ChartCard chart={result.chart} />
              <div />
            </div>
          )}
          {result.table && result.table.rows.length > 0 && <TableCard table={result.table} />}
        </>
      )}
    </div>
  );
}

function SectionCard({ section, index }: { section: AiSection; index: number }) {
  return (
    <section id={section.id} className="os-rise rounded-2xl border border-border/60 bg-card p-5 scroll-mt-20">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]">
            Section {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-1 text-[18px] font-semibold tracking-tight">{section.title}</h3>
        </div>
      </div>
      {section.narrative && (
        <p className="mt-2 max-w-3xl text-[12.5px] leading-relaxed text-muted-foreground">{section.narrative}</p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {section.chart ? <ChartCard chart={section.chart} compact /> : <div />}
        {section.insights && section.insights.length > 0 && (
          <InsightsCard insights={section.insights} subtle />
        )}
      </div>

      {section.table && section.table.rows.length > 0 && (
        <div className="mt-4">
          <TableCard table={section.table} searchable />
        </div>
      )}
    </section>
  );
}

function RecommendationsCard({ items }: { items: string[] }) {
  return (
    <article className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-white p-5">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
          <ListChecks className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-[14px] font-semibold tracking-tight">Recommended actions</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug">
            <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">{i + 1}</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function RisksCard({ risks }: { risks: AiRisk[] }) {
  const sevTone = (s: AiRisk["severity"]) =>
    s === "high" ? "bg-rose-500 text-white" :
    s === "med" ? "bg-amber-500 text-white" :
    "bg-muted text-foreground";
  return (
    <article className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-50 to-white p-5">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-sm">
          <AlertTriangle className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-[14px] font-semibold tracking-tight">Risk flags</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {risks.map((r, i) => (
          <li key={i} className="text-[12.5px] leading-snug">
            <div className="flex items-center gap-2">
              <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide", sevTone(r.severity))}>{r.severity}</span>
              <span className="font-medium">{r.label}</span>
            </div>
            {r.note && <p className="mt-0.5 pl-1 text-[11.5px] text-muted-foreground">{r.note}</p>}
          </li>
        ))}
      </ul>
    </article>
  );
}

function KpiCard({ kpi }: { kpi: AiReportResult["kpis"][number] }) {
  const TrendIcon = kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;
  const tone = kpi.trend === "up" ? "text-emerald-600" : kpi.trend === "down" ? "text-rose-600" : "text-muted-foreground";
  return (
    <div className="group rounded-2xl border border-border/60 bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.35)] hover:shadow-[0_20px_40px_-25px_hsl(265_60%_50%/0.4)]">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{kpi.label}</p>
      <p className="mt-1 text-[24px] font-semibold tabular-nums tracking-tight">{kpi.value}</p>
      {kpi.delta && (
        <p className={cn("mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium", tone)}>
          <TrendIcon className="h-3 w-3" /> {kpi.delta}
        </p>
      )}
    </div>
  );
}

const CHART_COLORS = [
  "hsl(265 70% 55%)", "hsl(195 80% 50%)", "hsl(150 65% 45%)",
  "hsl(30 90% 55%)", "hsl(340 75% 55%)", "hsl(220 70% 55%)",
];

function ChartCard({ chart, compact = false }: { chart: AiChart; compact?: boolean }) {
  const colors = CHART_COLORS;
  const W = 560, H = compact ? 220 : 240;
  const padL = 32, padB = 26, padT = 12, padR = 12;
  const innerW = W - padL - padR, innerH = H - padT - padB;

  // PIE
  if (chart.type === "pie") {
    const series = chart.series[0]?.data ?? [];
    const total = series.reduce((a, b) => a + b, 0) || 1;
    const cx = W / 2, cy = H / 2, r = Math.min(innerW, innerH) / 2 - 8, ir = r * 0.55;
    let angle = -Math.PI / 2;
    return (
      <ChartShell chart={chart} compact={compact}>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-60 w-full">
          {series.map((v, i) => {
            const slice = (v / total) * Math.PI * 2;
            const a0 = angle, a1 = angle + slice;
            angle = a1;
            const large = slice > Math.PI ? 1 : 0;
            const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
            const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
            const xi0 = cx + ir * Math.cos(a0), yi0 = cy + ir * Math.sin(a0);
            const xi1 = cx + ir * Math.cos(a1), yi1 = cy + ir * Math.sin(a1);
            const d = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${ir} ${ir} 0 ${large} 0 ${xi0} ${yi0} Z`;
            return (
              <path key={i} d={d} fill={colors[i % colors.length]} opacity="0.9">
                <title>{`${chart.labels[i]}: ${v} (${((v / total) * 100).toFixed(1)}%)`}</title>
              </path>
            );
          })}
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Total</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="14" fontWeight="600" fill="hsl(var(--foreground))">{total.toLocaleString()}</text>
        </svg>
        <PieLegend labels={chart.labels} data={series} colors={colors} total={total} />
      </ChartShell>
    );
  }

  const step = chart.labels.length > 1 ? innerW / (chart.labels.length - 1) : innerW;

  // STACKED BAR
  if (chart.type === "stacked-bar") {
    const stackTotals = chart.labels.map((_, i) =>
      chart.series.reduce((a, s) => a + (s.data[i] ?? 0), 0)
    );
    const max = Math.max(1, ...stackTotals);
    const groupW = step * 0.6;
    return (
      <ChartShell chart={chart} compact={compact}>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-60 w-full">
          <Gridlines padL={padL} padT={padT} padR={padR} W={W} innerH={innerH} max={max} />
          {chart.labels.map((_, i) => {
            const x = padL + (chart.labels.length > 1 ? i * step : innerW / 2) - groupW / 2;
            let yCursor = padT + innerH;
            return (
              <g key={i}>
                {chart.series.map((s, si) => {
                  const v = s.data[i] ?? 0;
                  const h = (v / max) * innerH;
                  yCursor -= h;
                  return (
                    <rect key={si} x={x} y={yCursor} width={groupW} height={h}
                      fill={colors[si % colors.length]} opacity="0.9">
                      <title>{`${s.name} · ${chart.labels[i]}: ${v}`}</title>
                    </rect>
                  );
                })}
              </g>
            );
          })}
          <XLabels labels={chart.labels} padL={padL} innerW={innerW} step={step} H={H} />
        </svg>
        <SeriesLegend series={chart.series} colors={colors} />
      </ChartShell>
    );
  }

  // BAR / LINE / AREA
  const all = chart.series.flatMap(s => s.data);
  const max = Math.max(1, ...all);
  return (
    <ChartShell chart={chart} compact={compact}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-60 w-full">
        <Gridlines padL={padL} padT={padT} padR={padR} W={W} innerH={innerH} max={max} />
        {chart.type === "bar" && chart.series.map((s, si) => {
          const groupW = step * 0.7;
          const barW = groupW / chart.series.length;
          return s.data.map((v, i) => {
            const x = padL + (chart.labels.length > 1 ? i * step : innerW / 2) - groupW / 2 + si * barW;
            const h = (v / max) * innerH;
            return (
              <rect key={`${si}-${i}`} x={x} y={padT + innerH - h} width={Math.max(2, barW - 2)} height={h}
                rx="3" fill={colors[si % colors.length]} opacity="0.9">
                <title>{`${s.name} · ${chart.labels[i]}: ${v}`}</title>
              </rect>
            );
          });
        })}
        {(chart.type === "line" || chart.type === "area") && chart.series.map((s, si) => {
          const pts = s.data.map((v, i) => {
            const x = padL + (chart.labels.length > 1 ? i * step : innerW / 2);
            const y = padT + innerH - (v / max) * innerH;
            return { x, y };
          });
          const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
          const area = chart.type === "area" && pts.length
            ? `${line} L ${pts[pts.length - 1].x.toFixed(1)},${(padT + innerH).toFixed(1)} L ${pts[0].x.toFixed(1)},${(padT + innerH).toFixed(1)} Z`
            : null;
          return (
            <g key={si}>
              {area && <path d={area} fill={colors[si % colors.length]} opacity="0.15" />}
              <path d={line} fill="none" stroke={colors[si % colors.length]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={colors[si % colors.length]} />)}
            </g>
          );
        })}
        <XLabels labels={chart.labels} padL={padL} innerW={innerW} step={step} H={H} />
      </svg>
      <SeriesLegend series={chart.series} colors={colors} />
    </ChartShell>
  );
}

function ChartShell({ chart, compact, children }: { chart: AiChart; compact?: boolean; children: React.ReactNode }) {
  return (
    <article className={cn("rounded-2xl border border-border/60 bg-card p-5", compact && "p-4")}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[13.5px] font-semibold tracking-tight">{chart.yLabel || "Primary visual"}</h3>
        <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground capitalize">{chart.type.replace("-", " ")}</span>
      </div>
      <div className="mt-3 overflow-x-auto">{children}</div>
    </article>
  );
}

function Gridlines({ padL, padT, padR, W, innerH, max }: { padL: number; padT: number; padR: number; W: number; innerH: number; max: number }) {
  return (
    <g>
      {[0.25, 0.5, 0.75, 1].map(t => {
        const y = padT + innerH * (1 - t);
        return (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="hsl(var(--border))" strokeDasharray="3 3" strokeWidth="0.5" />
            <text x={padL - 4} y={y + 3} textAnchor="end" fontSize="9" fill="hsl(var(--muted-foreground))">
              {Math.round(max * t).toLocaleString()}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function XLabels({ labels, padL, innerW, step, H }: { labels: string[]; padL: number; innerW: number; step: number; H: number }) {
  const stride = Math.max(1, Math.ceil(labels.length / 12));
  return (
    <g>
      {labels.map((l, i) => {
        if (i % stride !== 0 && i !== labels.length - 1) return null;
        const x = padL + (labels.length > 1 ? i * step : innerW / 2);
        return <text key={i} x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">{String(l).slice(0, 14)}</text>;
      })}
    </g>
  );
}

function SeriesLegend({ series, colors }: { series: AiChart["series"]; colors: string[] }) {
  if (series.length <= 1) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {series.map((s, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: colors[i % colors.length] }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

function PieLegend({ labels, data, colors, total }: { labels: string[]; data: number[]; colors: string[]; total: number }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
      {labels.map((l, i) => (
        <span key={i} className="inline-flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 truncate">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: colors[i % colors.length] }} />
            <span className="truncate">{l}</span>
          </span>
          <span className="tabular-nums text-foreground">{((data[i] / total) * 100).toFixed(0)}%</span>
        </span>
      ))}
    </div>
  );
}

function InsightsCard({ insights, subtle = false }: { insights: string[]; subtle?: boolean }) {
  return (
    <article className={cn(
      "rounded-2xl border p-5",
      subtle
        ? "border-border/60 bg-secondary/20"
        : "border-[hsl(265_70%_55%/0.2)] bg-gradient-to-br from-[hsl(265_100%_98%)] to-white",
    )}>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-[14px] font-semibold tracking-tight">{subtle ? "Section insights" : "AI insights"}</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {insights.map((ins, i) => (
          <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug">
            <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(265_70%_55%)]" />
            <span>{ins}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function TableCard({ table, searchable = false }: { table: AiTable; searchable?: boolean }) {
  const [query, setQuery] = useState("");
  const [sortIdx, setSortIdx] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let rows = table.rows;
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(r => r.some(c => String(c).toLowerCase().includes(q)));
    }
    if (sortIdx !== null) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortIdx], bv = b[sortIdx];
        const an = Number(av), bn = Number(bv);
        const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [table.rows, query, sortIdx, sortDir]);

  return (
    <article className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[14px] font-semibold tracking-tight">Drill-down</h3>
        {searchable && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter rows…"
              className="h-8 w-44 pl-7 text-[12px]"
            />
          </div>
        )}
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              {table.columns.map((c, i) => (
                <th key={i} className="border-b border-border/60 px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => {
                      if (sortIdx === i) setSortDir(sortDir === "asc" ? "desc" : "asc");
                      else { setSortIdx(i); setSortDir("asc"); }
                    }}
                    className="inline-flex items-center gap-1 transition hover:text-foreground"
                  >
                    {c}
                    {sortIdx === i && <span className="text-[9px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, ri) => (
              <tr key={ri} className="transition hover:bg-secondary/30">
                {row.map((cell, ci) => (
                  <td key={ci} className="border-b border-border/30 px-3 py-2 tabular-nums">{String(cell)}</td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={table.columns.length} className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                  No matching rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}