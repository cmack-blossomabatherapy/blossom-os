import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Trash2, Download, AlertTriangle, ListChecks, Brain, FileSpreadsheet } from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { getAiDashboard, deleteAiDashboard, touchAiDashboard, saveAiDashboard, type AiDashboard } from "@/lib/os/aiDashboards";
import { supabase } from "@/integrations/supabase/client";
import { KpiTile } from "@/components/dashboards/KpiTile";
import { ChartCard } from "@/components/dashboards/ChartCard";
import { RiskTable } from "@/components/dashboards/RiskTable";
import type { DrilldownSpec, KpiSpec } from "@/lib/os/dashboardEngine/types";
import { cn } from "@/lib/utils";

export default function AiDashboardView() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<AiDashboard | undefined>(() => getAiDashboard(id));
  const [drill, setDrill] = useState<DrilldownSpec | null>(null);

  useEffect(() => { if (id) touchAiDashboard(id); }, [id]);

  // Fetch AI narrative (executive insights + recommended actions) once per dashboard
  useEffect(() => {
    if (!dashboard || !dashboard.spec) return;
    if (dashboard.narrativeStatus !== "pending") return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("generate-ai-dashboard", {
          body: { prompt: dashboard.prompt, spec: dashboard.spec },
        });
        if (cancelled) return;
        if (error) throw error;
        const n = data?.narrative;
        if (!n) throw new Error("No narrative returned");
        const updated: AiDashboard = {
          ...dashboard,
          title: n.title || dashboard.title,
          narrativeStatus: "ready",
          spec: {
            ...dashboard.spec!,
            subtitle: n.subtitle || dashboard.spec!.subtitle,
            executiveInsights: Array.isArray(n.executiveInsights) && n.executiveInsights.length
              ? n.executiveInsights : dashboard.spec!.executiveInsights,
            recommendedActions: Array.isArray(n.recommendedActions) && n.recommendedActions.length
              ? n.recommendedActions : dashboard.spec!.recommendedActions,
          },
        };
        saveAiDashboard(updated);
        setDashboard(updated);
      } catch (e: any) {
        if (cancelled) return;
        const updated: AiDashboard = { ...dashboard, narrativeStatus: "error" };
        saveAiDashboard(updated);
        setDashboard(updated);
        toast.error(`AI narrative failed: ${e?.message ?? e}`);
      }
    })();
    return () => { cancelled = true; };
  }, [dashboard?.id, dashboard?.narrativeStatus]);

  if (!dashboard) {
    return (
      <OSShell>
        <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
          <h2 className="text-[20px] font-semibold tracking-tight">Dashboard not found</h2>
          <Button className="mt-4" size="sm" onClick={() => navigate("/reports")}>Back to Reports</Button>
        </div>
      </OSShell>
    );
  }

  const spec = dashboard.spec;

  function handleDelete() {
    deleteAiDashboard(id);
    toast.success("Dashboard deleted");
    navigate("/reports");
  }

  function exportCsv() {
    if (!spec) return;
    const lines: string[] = [];
    for (const [key, d] of Object.entries(spec.drilldowns)) {
      lines.push(`# ${d.title}`);
      lines.push(d.columns.join(","));
      for (const r of d.rows) lines.push(r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","));
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${dashboard.title.replace(/[^a-z0-9-_]+/gi, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <OSShell>
      <div className="mb-3 flex items-center justify-between">
        <Link to="/reports" className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> All reports
        </Link>
        <div className="flex items-center gap-1.5">
          {spec && <Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-1 h-3.5 w-3.5" /> Export CSV</Button>}
          <Button size="sm" variant="outline" onClick={handleDelete}><Trash2 className="mr-1 h-3.5 w-3.5" /> Delete</Button>
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] via-[hsl(285_100%_98%)] to-[hsl(225_100%_98%)] p-7 shadow-[0_30px_70px_-40px_hsl(265_60%_50%/0.4)]">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[hsl(265_100%_90%)] opacity-50 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full bg-white/70 text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_55%)]">
              <Sparkles className="mr-1 h-3 w-3" /> AI Dashboard
            </Badge>
            <Badge variant="outline" className="rounded-full border-white/60 bg-white/60 text-[10px] font-medium text-muted-foreground">
              <FileSpreadsheet className="mr-1 h-3 w-3" />
              {dashboard.fileNames.length} file{dashboard.fileNames.length === 1 ? "" : "s"} · {dashboard.rowCount.toLocaleString()} rows
            </Badge>
          </div>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[32px]">{dashboard.title}</h1>
          {spec?.subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{spec.subtitle}</p>}
          <p className="mt-2 max-w-2xl text-[12.5px] italic text-muted-foreground">"{dashboard.prompt}"</p>
        </div>
      </section>

      {!spec ? (
        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-10 text-center text-[13px] text-muted-foreground">
          Dashboard has no data. Try rebuilding from the upload page.
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {/* Notes */}
          {spec.notes.length > 0 && (
            <div className="rounded-2xl border border-amber-300/50 bg-amber-50/60 p-3">
              <ul className="space-y-1 text-[12px] text-amber-900">
                {spec.notes.map((n, i) => (
                  <li key={i} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{n}</li>
                ))}
              </ul>
            </div>
          )}

          {/* KPI ROW */}
          <div className={cn(
            "grid gap-3",
            spec.kpis.length <= 3 ? "grid-cols-1 sm:grid-cols-3" :
            spec.kpis.length === 4 ? "grid-cols-2 lg:grid-cols-4" :
            "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
          )}>
            {spec.kpis.map(k => <KpiTile key={k.id} kpi={k} onClick={(kpi) => kpi.drilldown && setDrill(kpi.drilldown)} />)}
          </div>

          {/* CHARTS */}
          {spec.charts.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {spec.charts.map(c => <ChartCard key={c.id} chart={c} />)}
            </div>
          )}

          {/* RISKS */}
          {spec.risks.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {spec.risks.map(r => (
                <RiskTable key={r.id} risk={r} onOpen={() => {
                  // open matching full drilldown if available
                  const fullKey = Object.keys(spec.drilldowns).find(k => k.startsWith(r.id.split("_")[0]));
                  setDrill(fullKey ? spec.drilldowns[fullKey] : { title: r.title, columns: r.columns, rows: r.rows });
                }} />
              ))}
            </div>
          )}

          {/* INSIGHTS + ACTIONS */}
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-[hsl(265_70%_55%/0.2)] bg-gradient-to-br from-[hsl(265_100%_98%)] to-white p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white shadow-sm">
                  <Brain className="h-3.5 w-3.5" />
                </span>
                <h3 className="text-[14px] font-semibold tracking-tight">Executive insights</h3>
              </div>
              {spec.executiveInsights.length ? (
                <ul className="mt-3 space-y-2">
                  {spec.executiveInsights.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug">
                      <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(265_70%_55%)]" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-3 text-[12px] text-muted-foreground">No insights generated.</p>}
            </article>

            <article className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-white p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
                  <ListChecks className="h-3.5 w-3.5" />
                </span>
                <h3 className="text-[14px] font-semibold tracking-tight">Recommended actions</h3>
              </div>
              <ul className="mt-3 space-y-2">
                {spec.recommendedActions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug">
                    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          {/* DATA QUALITY */}
          {spec.dataQuality.length > 0 && (
            <article className="rounded-2xl border border-border/60 bg-card p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Data quality</p>
              <ul className="mt-2 space-y-1 text-[12px]">
                {spec.dataQuality.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3 w-3 text-amber-500" />
                    <span><span className="font-medium">{d.label}:</span> {d.detail}{d.rowsAffected ? ` (${d.rowsAffected} rows)` : ""}</span>
                  </li>
                ))}
              </ul>
            </article>
          )}
        </div>
      )}

      {/* DRILLDOWN DRAWER */}
      <Sheet open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {drill && (
            <>
              <SheetHeader>
                <SheetTitle>{drill.title}</SheetTitle>
              </SheetHeader>
              {drill.rows.length === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-border/60 bg-secondary/30 px-3 py-6 text-center text-[12.5px] text-muted-foreground">
                  {drill.emptyMessage ?? "No rows to display."}
                </p>
              ) : (
                <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
                  <table className="w-full text-[12px]">
                    <thead className="sticky top-0 bg-secondary/60">
                      <tr>
                        {drill.columns.map(c => (
                          <th key={c} className="px-3 py-2 text-left font-medium text-muted-foreground">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {drill.rows.map((r, i) => (
                        <tr key={i} className="border-t border-border/30">
                          {r.map((c, j) => <td key={j} className="px-3 py-1.5 tabular-nums">{String(c)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-3 text-[10.5px] text-muted-foreground">{drill.rows.length.toLocaleString()} row(s)</p>
            </>
          )}
        </SheetContent>
      </Sheet>
    </OSShell>
  );
}