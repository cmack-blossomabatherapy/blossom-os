import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Download, RefreshCw, Trash2, FileSpreadsheet,
  TrendingUp, TrendingDown, Minus, Brain, Pencil, Check, X,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  AiReport, AiReportResult, deleteAiReport, getAiReport, saveAiReport,
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

export default function AiReportView() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<AiReport | undefined>(() => getAiReport(id));
  const [step, setStep] = useState(0);
  const ranRef = useRef(false);

  // Animated loading steps while generating.
  useEffect(() => {
    if (report?.status !== "generating") return;
    const t = setInterval(() => setStep(s => (s + 1) % LOADING_STEPS.length), 1100);
    return () => clearInterval(t);
  }, [report?.status]);

  // Kick off generation once if pending.
  useEffect(() => {
    if (!report || report.status !== "generating" || ranRef.current) return;
    ranRef.current = true;

    const payloadRaw = sessionStorage.getItem(`ai_report_payload_${id}`);
    if (!payloadRaw) {
      const errored: AiReport = { ...report, status: "error", error: "Payload missing — re-upload your file." };
      saveAiReport(errored); setReport(errored);
      return;
    }

    (async () => {
      try {
        const payload = JSON.parse(payloadRaw);
        const { data, error } = await supabase.functions.invoke("generate-ai-report", {
          body: {
            prompt: payload.prompt,
            filters: payload.filters,
            fileName: payload.fileName,
            csvPreview: payload.preview,
            rowCount: payload.rowCount,
            headers: payload.headers,
          },
        });
        if (error) throw error;
        if (!data?.result) throw new Error(data?.error || "No result");
        const result = data.result as AiReportResult;
        const next: AiReport = {
          ...report,
          status: "ready",
          title: result.title || report.title,
          result,
        };
        saveAiReport(next);
        setReport(next);
        sessionStorage.removeItem(`ai_report_payload_${id}`);
        toast.success("Report ready");
      } catch (e: any) {
        const msg = e?.message || "Generation failed";
        const next: AiReport = { ...report, status: "error", error: msg };
        saveAiReport(next); setReport(next);
        toast.error(msg);
      }
    })();
  }, [report, id]);

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
            <Badge variant="outline" className="rounded-full border-white/60 bg-white/60 text-[10px] font-medium text-muted-foreground">
              <FileSpreadsheet className="mr-1 h-3 w-3" /> {report.fileName} · {report.rowCount} rows
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
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[32px]">
            {report.status === "ready" ? report.title : "Building your report…"}
          </h1>
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
        {report.status === "ready" && report.result && <ReadyState result={report.result} />}
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

function ReadyState({ result }: { result: AiReportResult }) {
  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className={cn(
        "grid gap-3",
        result.kpis.length <= 3 ? "grid-cols-1 md:grid-cols-3" :
        result.kpis.length === 4 ? "grid-cols-2 md:grid-cols-4" :
        "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
      )}>
        {result.kpis.map((k, i) => <KpiCard key={i} kpi={k} />)}
      </div>

      {/* Chart + insights */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {result.chart ? <ChartCard chart={result.chart} /> : <div />}
        <InsightsCard insights={result.insights} />
      </div>

      {/* Table */}
      {result.table && result.table.rows.length > 0 && <TableCard table={result.table} />}
    </div>
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

function ChartCard({ chart }: { chart: NonNullable<AiReportResult["chart"]> }) {
  const all = chart.series.flatMap(s => s.data);
  const max = Math.max(1, ...all);
  const W = 560, H = 200, padL = 28, padB = 22, padT = 10, padR = 10;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const step = chart.labels.length > 1 ? innerW / (chart.labels.length - 1) : innerW;
  const colors = ["hsl(265 70% 55%)", "hsl(195 80% 50%)", "hsl(150 65% 45%)", "hsl(30 90% 55%)"];

  return (
    <article className="rounded-2xl border border-border/60 bg-card p-5">
      <h3 className="text-[14px] font-semibold tracking-tight">Primary visual</h3>
      <p className="mt-0.5 text-[11.5px] text-muted-foreground capitalize">{chart.type} chart</p>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full">
          {/* gridlines */}
          {[0.25, 0.5, 0.75, 1].map(t => (
            <line key={t} x1={padL} x2={W - padR} y1={padT + innerH * (1 - t)} y2={padT + innerH * (1 - t)}
              stroke="hsl(var(--border))" strokeDasharray="3 3" strokeWidth="0.5" />
          ))}
          {/* series */}
          {chart.type === "bar" ? (
            chart.series.map((s, si) => {
              const groupW = step * 0.7;
              const barW = groupW / chart.series.length;
              return s.data.map((v, i) => {
                const x = padL + (chart.labels.length > 1 ? i * step : innerW / 2) - groupW / 2 + si * barW;
                const h = (v / max) * innerH;
                return (
                  <rect
                    key={`${si}-${i}`}
                    x={x} y={padT + innerH - h} width={barW - 2} height={h}
                    rx="3" fill={colors[si % colors.length]} opacity="0.85"
                  >
                    <title>{`${s.name} · ${chart.labels[i]}: ${v}`}</title>
                  </rect>
                );
              });
            })
          ) : (
            chart.series.map((s, si) => {
              const pts = s.data.map((v, i) => {
                const x = padL + (chart.labels.length > 1 ? i * step : innerW / 2);
                const y = padT + innerH - (v / max) * innerH;
                return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(" ");
              return (
                <g key={si}>
                  <path d={pts} fill="none" stroke={colors[si % colors.length]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {s.data.map((v, i) => {
                    const x = padL + (chart.labels.length > 1 ? i * step : innerW / 2);
                    const y = padT + innerH - (v / max) * innerH;
                    return <circle key={i} cx={x} cy={y} r="2.5" fill={colors[si % colors.length]} />;
                  })}
                </g>
              );
            })
          )}
          {/* x labels */}
          {chart.labels.map((l, i) => {
            const x = padL + (chart.labels.length > 1 ? i * step : innerW / 2);
            return <text key={i} x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">{l}</text>;
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        {chart.series.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: colors[i % colors.length] }} />
            {s.name}
          </span>
        ))}
      </div>
    </article>
  );
}

function InsightsCard({ insights }: { insights: string[] }) {
  return (
    <article className="rounded-2xl border border-[hsl(265_70%_55%/0.2)] bg-gradient-to-br from-[hsl(265_100%_98%)] to-white p-5">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-[14px] font-semibold tracking-tight">AI insights</h3>
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

function TableCard({ table }: { table: NonNullable<AiReportResult["table"]> }) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card p-5">
      <h3 className="text-[14px] font-semibold tracking-tight">Breakdown</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              {table.columns.map((c, i) => (
                <th key={i} className="border-b border-border/60 px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri} className="transition hover:bg-secondary/30">
                {row.map((cell, ci) => (
                  <td key={ci} className="border-b border-border/30 px-3 py-2 tabular-nums">{String(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}