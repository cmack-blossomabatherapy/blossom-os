import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bookmark, Download, Filter, Sparkles, Share2, Star, MessageSquare,
  TrendingUp, Eye, Clock, ArrowRight,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  REPORTS, REPORT_CATEGORIES, pushRecent, visibleReportsForRole,
} from "@/lib/os/reportsCatalog";
import { markReportOpened, useSharedSavedViews } from "@/hooks/useSharedSavedViews";
import { useReportFavorites } from "@/hooks/useReportFavorites";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useOSRole } from "@/contexts/OSRoleContext";
import { MetricCard } from "@/components/reports/MetricCard";
import { ReportFunnel } from "@/components/reports/ReportFunnel";
import { RiskAlertPanel } from "@/components/reports/RiskAlertPanel";
import { BreakdownTable } from "@/components/reports/BreakdownTable";
import { RevenuePipelinePanel } from "@/components/reports/RevenuePipelinePanel";
import { GrowthTrendChart } from "@/components/reports/GrowthTrendChart";
import { TeamPerformanceTable } from "@/components/reports/TeamPerformanceTable";
import {
  executiveKpis, leadFunnel, clientFunnel, intakeKpis, leadSourcePerformance, intakeByState,
  intakeCoordinatorPerf, authKpis, denialsByPayor, missingDocTrends, qaKpis, schedulingKpis,
  capacityByState, lifecycleKpis, riskAlerts,
} from "@/data/reports";
import { renderSdReport, SD_REPORT_IDS } from "@/components/reports/StateDirectorReportViews";
import { renderAuthReport, AUTH_REPORT_IDS } from "@/components/reports/AuthorizationReportViews";
import { SdFilterBar, loadLastFilters, summarizeFilters, type SdFilters } from "@/components/reports/SdFilterBar";
import { DEPARTMENT_DASHBOARD_IDS, getDepartmentDashboard } from "@/data/departmentDashboards";
import { DepartmentDashboardView } from "@/components/reports/DepartmentDashboardView";

export default function ReportDetail() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { role } = useOSRole();
  const report = useMemo(() => REPORTS.find(r => r.id === reportId), [reportId]);
  const cat = report ? REPORT_CATEGORIES.find(c => c.id === report.category)! : null;
  const visibleReportIds = useMemo(
    () => new Set(visibleReportsForRole(role).map(r => r.id)),
    [role],
  );
  const canViewReport = !!report && visibleReportIds.has(report.id);
  // If this report is meant to open a filtered detail view directly, redirect.
  useEffect(() => {
    if (canViewReport && report?.drilldownPath) {
      navigate(report.drilldownPath, { replace: true });
    }
  }, [canViewReport, report, navigate]);
  const { favorites: favs, toggleFavorite: toggleFav } = useReportFavorites();
  const favored = report ? favs.includes(report.id) : false;
  const { toast } = useToast();
  const { saveView } = useSharedSavedViews({
    scope: "report_view",
    scopeKey: report?.id ?? null,
    legacyKey: report ? `os.reportViews.${report.id}` : undefined,
  });
  async function handleSaveView() {
    if (!report) return;
    const name = window.prompt("Name this saved view", `${report.title} view`);
    if (!name?.trim()) return;
    try {
      const filters: Record<string, unknown> = {
        path: window.location.pathname + window.location.search,
        savedAt: new Date().toISOString(),
      };
      if (sdFilters) filters.sdFilters = sdFilters;
      await saveView(name.trim(), filters);
      window.dispatchEvent(new Event("os-saved-report-view-changed"));
      toast({ title: "View saved", description: "Available from your saved views." });
    } catch (e) {
      toast({ title: "Could not save view", description: "Please try again.", variant: "destructive" });
    }
  }
  async function handleShare() {
    if (!report) return;
    const url = `${window.location.origin}/reports/${report.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Share this report with your team." });
    } catch {
      toast({ title: "Copy failed", description: url });
    }
  }
  const isSd = !!report && SD_REPORT_IDS.has(report.id);
  const [sdFilters, setSdFilters] = useState<SdFilters | null>(null);
  useEffect(() => {
    if (isSd && report) setSdFilters(loadLastFilters(report.id));
  }, [isSd, report?.id]);
  const related = useMemo(() => {
    if (!report) return [];
    return visibleReportsForRole(role).filter(r => r.category === report.category && r.id !== report.id).slice(0, 3);
  }, [report, role]);

  useEffect(() => {
    if (canViewReport && report) {
      pushRecent(report.id);
      // Persist recent to Supabase for the signed-in user; no-op if signed out.
      void markReportOpened(report.id);
    }
  }, [canViewReport, report]);

  if (!report || !cat || !canViewReport) {
    return (
      <OSShell>
        <div className="os-card flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-[20px] font-semibold tracking-tight">Report not found</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">It may have been archived or isn't visible to your role.</p>
          <Button className="mt-5" size="sm" onClick={() => navigate("/reports")}>Back to Reports</Button>
        </div>
      </OSShell>
    );
  }

  return (
    <OSShell>
      {/* Breadcrumb / back */}
      <div className="mb-3">
        <Link to="/reports" className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> All reports
        </Link>
      </div>

      {/* HERO */}
      <section className={cn("os-rise relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br p-7 shadow-[0_30px_70px_-40px_hsl(265_60%_50%/0.4)]", cat.tone)}>
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/40 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full bg-white/80 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: cat.accent }}>
                {cat.name}
              </Badge>
              <Badge variant="outline" className="rounded-full border-white/60 bg-white/60 text-[10px] font-medium text-muted-foreground">
                {report.type} · {report.owner}
              </Badge>
            </div>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[32px]">{report.title}</h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">{report.description}</p>

            {report.aiInsight && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-white/70 bg-white/70 p-3 backdrop-blur">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white">
                  <Sparkles className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]">Blossom AI</p>
                  <p className="mt-0.5 text-[13px] font-medium leading-snug">{report.aiInsight}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" className="border-white/70 bg-white/70 backdrop-blur" onClick={() => void toggleFav(report.id)}>
                <Star className={cn("mr-1 h-3.5 w-3.5", favored && "fill-amber-400 text-amber-500")} />{favored ? "Favorited" : "Favorite"}
              </Button>
              <Button size="sm" variant="outline" className="border-white/70 bg-white/70 backdrop-blur" onClick={handleSaveView}><Bookmark className="mr-1 h-3.5 w-3.5" />Save view</Button>
              <Button size="sm" variant="outline" className="border-white/70 bg-white/70 backdrop-blur" onClick={handleShare}><Share2 className="mr-1 h-3.5 w-3.5" />Share</Button>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button size="sm" disabled className="bg-[hsl(265_70%_55%)] opacity-60"><Download className="mr-1 h-3.5 w-3.5" />Export</Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Export is available inside each detail report (e.g. BCBA Productivity, Cancellation Command Center).</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />Updated {report.lastUpdated}</span>
              <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{report.popularity}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      {isSd && sdFilters ? (
        <>
          <SdFilterBar reportId={report.id} filters={sdFilters} onChange={setSdFilters} />
          <p className="mt-1 px-1 text-[11px] text-muted-foreground">
            Active view · {summarizeFilters(sdFilters)} <span className="opacity-60">· drilldowns enabled</span>
          </p>
        </>
      ) : (
        <section className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Filters</span>
          {["This month", "All states", "All payors", "All BCBAs"].map(c => (
            <button key={c} className="rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-secondary/60">{c}</button>
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground">Live report shell · connect source data to populate</span>
        </section>
      )}

      {/* CONTENT */}
      <div className="mt-6">
        <ReportContent view={report.detailView} reportId={report.id} />
      </div>

      {/* ACTION CENTER + RELATED + NOTES */}
      <section className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[14px] font-semibold tracking-tight">Action center</h3>
          </div>
          <p className="mt-1 text-[11.5px] text-muted-foreground">Operational steps surfaced from this report.</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {[
              "Escalate United payor denial spike",
              "Schedule weekly QA bottleneck review",
              "Open Georgia capacity gap workflow",
              "Notify state director of trend reversal",
            ].map((a, i) => (
              <button key={i} className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 px-3 py-2.5 text-left transition hover:border-[hsl(265_70%_55%/0.3)] hover:bg-secondary/50">
                <span className="text-[12.5px] font-medium">{a}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
            <h3 className="text-[14px] font-semibold tracking-tight">Notes &amp; comments</h3>
          </div>
          <p className="mt-1 text-[11.5px] text-muted-foreground">Leave context for your team on this report.</p>
          <textarea
            placeholder="Add a note about what you're seeing this week…"
            rows={3}
            className="mt-3 w-full rounded-xl border border-border/60 bg-secondary/20 px-3 py-2 text-[12.5px] outline-none transition focus:border-[hsl(265_70%_55%)] focus:bg-card"
          />
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="outline">Post note</Button>
          </div>
        </article>
      </section>

      {related.length > 0 && (
        <section className="mt-8">
          <h3 className="text-[14px] font-semibold tracking-tight">Related reports</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {related.map(r => (
              <Link key={r.id} to={r.drilldownPath ?? `/reports/${r.id}`} className="group block rounded-2xl border border-border/60 bg-card p-3.5 transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.35)] hover:shadow-md">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{cat.name}</p>
                <p className="mt-1 text-[13.5px] font-semibold tracking-tight">{r.title}</p>
                <p className="mt-1 line-clamp-2 text-[11.5px] text-muted-foreground">{r.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </OSShell>
  );
}

/** Renders KPI + chart blocks for each detail view. Falls back to a clean empty preview. */
function ReportContent({ view, reportId }: { view?: string; reportId?: string }) {
  if (reportId && DEPARTMENT_DASHBOARD_IDS.has(reportId)) {
    const def = getDepartmentDashboard(reportId);
    if (def) return <DepartmentDashboardView dashboard={def} />;
  }
  if (reportId && SD_REPORT_IDS.has(reportId)) {
    return <>{renderSdReport(reportId)}</>;
  }
  if (reportId && AUTH_REPORT_IDS.has(reportId)) {
    return <>{renderAuthReport(reportId)}</>;
  }
  if (view === "executive") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {executiveKpis.map(m => <MetricCard key={m.id} metric={m} />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ReportFunnel title="Lead Funnel" subtitle="Drop-off and bottlenecks" stages={leadFunnel} />
          <ReportFunnel title="Client Funnel" subtitle="Pipeline stages with delay indicators" stages={clientFunnel} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2"><RevenuePipelinePanel /></div>
          <RiskAlertPanel alerts={riskAlerts} />
        </div>
      </div>
    );
  }
  if (view === "intake") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{intakeKpis.map(m => <MetricCard key={m.id} metric={m} />)}</div>
        <ReportFunnel title="Lead Funnel" subtitle="Conversion across intake stages" stages={leadFunnel} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <BreakdownTable title="By Lead Source" subtitle="Conversion rate by source" columns={[
            { key: "source", label: "Source" }, { key: "leads", label: "Leads", align: "right" },
            { key: "converted", label: "Conv.", align: "right" }, { key: "rate", label: "Rate %", isBar: true, barTone: "success", formatter: (v) => `${v}%` },
          ]} rows={leadSourcePerformance} />
          <BreakdownTable title="By State" columns={[{ key: "state", label: "State" }, { key: "leads", label: "Leads", align: "right" }, { key: "conversion", label: "Conv. %", isBar: true, formatter: (v) => `${v}%` }]} rows={intakeByState} />
          <BreakdownTable title="By Coordinator" columns={[{ key: "name", label: "Name" }, { key: "handled", label: "Handled", align: "right" }, { key: "avgContact", label: "Avg Contact", align: "right" }, { key: "conversion", label: "Conv. %", isBar: true, formatter: (v) => `${v}%` }]} rows={intakeCoordinatorPerf} />
        </div>
      </div>
    );
  }
  if (view === "auth") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{authKpis.map(m => <MetricCard key={m.id} metric={m} />)}</div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BreakdownTable title="Denials by Payor" subtitle="Which insurance is causing problems" columns={[{ key: "payor", label: "Payor" }, { key: "total", label: "Submitted", align: "right" }, { key: "denied", label: "Denied", align: "right" }, { key: "rate", label: "Denial %", isBar: true, barTone: "destructive", formatter: (v) => `${v}%` }]} rows={denialsByPayor} />
          <BreakdownTable title="Missing Documentation" subtitle="What's blocking submissions" columns={[{ key: "type", label: "Doc Type" }, { key: "blocking", label: "Blocking" }, { key: "count", label: "Count", isBar: true, barTone: "warning" }]} rows={missingDocTrends} />
        </div>
      </div>
    );
  }
  if (view === "qa") {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">{qaKpis.map(m => <MetricCard key={m.id} metric={m} />)}</div>
    );
  }
  if (view === "scheduling") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{schedulingKpis.map(m => <MetricCard key={m.id} metric={m} />)}</div>
        <BreakdownTable title="Capacity by State" subtitle="RBT hours available vs needed (weekly)" columns={[{ key: "state", label: "State" }, { key: "available", label: "Available hrs", align: "right" }, { key: "needed", label: "Needed hrs", align: "right" }, { key: "gap", label: "Gap", isBar: true, barTone: "destructive", barMax: Math.max(...capacityByState.map(c => Math.abs(c.gap))), formatter: (v) => Number(v) >= 0 ? `+${v}` : `${v}` }]} rows={capacityByState.map(c => ({ ...c, gap: Math.max(c.gap, 0) }))} />
      </div>
    );
  }
  if (view === "lifecycle") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{lifecycleKpis.map(m => <MetricCard key={m.id} metric={m} />)}</div>
        <ReportFunnel title="Client Funnel" subtitle="Where clients drop off across the lifecycle" stages={clientFunnel} />
      </div>
    );
  }
  if (view === "revenue") {
    return (
      <div className="space-y-4">
        <RevenuePipelinePanel />
        <ReportFunnel title="Pipeline Conversion" subtitle="Stages between VOB and Active" stages={clientFunnel} />
      </div>
    );
  }
  if (view === "team") return <TeamPerformanceTable />;
  if (view === "growth") {
    return (
      <div className="space-y-4">
        <GrowthTrendChart />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ReportFunnel title="Lead Funnel" stages={leadFunnel} />
          <ReportFunnel title="Client Funnel" stages={clientFunnel} />
        </div>
      </div>
    );
  }

  // Fallback — pretty empty/placeholder dashboard for reports without a detail view yet
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="os-skeleton h-3 w-1/2 rounded" />
          <div className="os-skeleton mt-2 h-2.5 w-3/4 rounded" />
          <div className="os-skeleton mt-5 h-24 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}