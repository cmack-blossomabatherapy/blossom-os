import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Sparkles, Plus, Star, History,
  ArrowUpRight, Clock, Eye, Search, ChevronRight, Trash2, X,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useOSRole } from "@/contexts/OSRoleContext";
import {
  visibleReportsForRole, visibleCategoriesForRole,
  readRecent, REPORT_CATEGORIES, type ReportDef,
} from "@/lib/os/reportsCatalog";
import { useReportFavorites } from "@/hooks/useReportFavorites";
import { OS_ROLES } from "@/lib/os/permissions";
import { RequestReportDialog } from "@/components/os/reports/RequestReportDialog";
import {
  readCancellationSavedReports, deleteCancellationSavedReport,
  loadCancellationSavedReports,
  type CancellationSavedReport,
} from "@/lib/os/cancellationSavedReports";
import {
  readSavedReportsV3, deleteSavedReportV3, type BcbaSavedReportV3,
  loadSavedReportsV3,
} from "@/lib/os/bcbaProductivityV3/store";
import { useAuthorizationReportMetrics } from "@/hooks/useAuthorizationReportMetrics";
import { useRbtReportSummaries } from "@/hooks/useRbtReportSummaries";
import { listRecentReports } from "@/hooks/useSharedSavedViews";
import { migrateLocalReportsIfNeeded } from "@/lib/os/reportPersistence";
import { toast } from "sonner";

export default function ReportsHome() {
  const { role } = useOSRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");
  const reports = useMemo(() => visibleReportsForRole(role), [role]);
  const activeCategoryDef = useMemo(
    () => (activeCategory ? REPORT_CATEGORIES.find(c => c.id === activeCategory) : null),
    [activeCategory],
  );
  function clearCategoryFilter() {
    const next = new URLSearchParams(searchParams);
    next.delete("category");
    setSearchParams(next, { replace: true });
  }
  const authReportMetrics = useAuthorizationReportMetrics();
  const rbtSummaries = useRbtReportSummaries();
  // Overlay live KPI previews so report cards never render the catalog's
  // bare "-" placeholders. Authorizations metrics + per-user RBT summaries
  // are merged in here — everything else falls back to the catalog values.
  const reportsWithLive = useMemo(() => {
    const authOverrides = authReportMetrics.byReportId;
    const rbtSummary = rbtSummaries.summaries;
    return reports.map((r) => {
      const authLive = authOverrides[r.id];
      if (authLive) return { ...r, kpiPreviews: authLive };
      const rbtLive = (rbtSummary as Record<string, { primary: string; secondary?: string } | undefined>)[r.id];
      if (rbtLive) {
        return {
          ...r,
          kpiPreviews: [
            { label: r.kpiPreviews?.[0]?.label ?? "Value", value: rbtLive.primary, trend: "neutral" as const },
            ...(rbtLive.secondary
              ? [{ label: r.kpiPreviews?.[1]?.label ?? "Detail", value: rbtLive.secondary, trend: "neutral" as const }]
              : []),
          ],
        };
      }
      return r;
    });
  }, [reports, authReportMetrics.byReportId, rbtSummaries.summaries]);
  const categories = useMemo(() => visibleCategoriesForRole(role), [role]);
  // When a ?category=xxx is set, prioritize that category to the top.
  const categoriesOrdered = useMemo(() => {
    if (!activeCategory) return categories;
    const idx = categories.findIndex((c) => c.id === activeCategory);
    if (idx < 0) return categories;
    const copy = [...categories];
    const [picked] = copy.splice(idx, 1);
    return [picked, ...copy];
  }, [categories, activeCategory]);
  const featured = useMemo(() => {
    const qaPriority = ["bcba-productivity-report", "qa-supervision-pt", "qa-auth-utilization", "qa-cancellation"];
    return reportsWithLive
      .filter(r => r.featured)
      .sort((a, b) => {
        if (role === "qa_team") {
          const aRank = qaPriority.indexOf(a.id);
          const bRank = qaPriority.indexOf(b.id);
          if (aRank !== bRank) return (aRank === -1 ? 999 : aRank) - (bRank === -1 ? 999 : bRank);
        }
        return b.popularity - a.popularity;
      });
  }, [reportsWithLive, role]);
  const roleLabel = OS_ROLES.find(r => r.id === role)?.label || role;

  const { favorites: favs, toggleFavorite: toggleFav } = useReportFavorites();
  const favReports = favs.map(id => reportsWithLive.find(r => r.id === id)).filter(Boolean) as ReportDef[];

  const [requestOpen, setRequestOpen] = useState(false);
  const [search, setSearch] = useState("");
  // When a category filter is active, search prioritizes matches inside the
  // active category first, then the rest — but never hides other matches.
  const filteredReports = useMemo(() => {
    if (!search) return reportsWithLive;
    const q = search.toLowerCase();
    const matches = reportsWithLive.filter(r =>
      (r.title + r.description + (r.tags || []).join(" ")).toLowerCase().includes(q),
    );
    if (!activeCategory) return matches;
    return [
      ...matches.filter(r => r.category === activeCategory),
      ...matches.filter(r => r.category !== activeCategory),
    ];
  }, [reportsWithLive, search, activeCategory]);

  function onFav(id: string) { void toggleFav(id); }

  const [cancelSaved, setCancelSaved] = useState<CancellationSavedReport[]>([]);
  const [savedV3, setSavedV3] = useState<BcbaSavedReportV3[]>([]);
  const [supabaseRecentIds, setSupabaseRecentIds] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    void listRecentReports(15).then((ids) => {
      if (!cancelled) setSupabaseRecentIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    setCancelSaved(readCancellationSavedReports());
    setSavedV3(readSavedReportsV3());
    const refresh = () => {
      setCancelSaved(readCancellationSavedReports());
      setSavedV3(readSavedReportsV3());
    };
    // Kick off Supabase-backed hydration so the lists follow the user
    // across devices. Local values render instantly; remote overwrites
    // once loaded. Also runs the one-time local -> Supabase migration.
    void (async () => {
      await migrateLocalReportsIfNeeded();
      const [cancelRemote, v3Remote] = await Promise.all([
        loadCancellationSavedReports(),
        loadSavedReportsV3(),
      ]);
      setCancelSaved(cancelRemote);
      setSavedV3(v3Remote);
    })();
    window.addEventListener("cancellation-saved-reports-changed", refresh);
    window.addEventListener("bcba-prod-v3-saved-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("cancellation-saved-reports-changed", refresh);
      window.removeEventListener("bcba-prod-v3-saved-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  async function handleDeleteCancelSaved(id: string) {
    const res = await deleteCancellationSavedReport(id);
    if (res.remoteSyncError) {
      toast.warning("Deleted locally — cloud sync failed. It may reappear after refresh.");
    }
    // Rehydrate from Supabase (falls back to local cache offline) so the
    // deletion is reflected across devices, not just the local list.
    setCancelSaved(await loadCancellationSavedReports());
  }
  async function handleDeleteV3(id: string) {
    const res = await deleteSavedReportV3(id);
    if (res.remoteSyncError) {
      toast.warning("Deleted locally — cloud sync failed. It may reappear after refresh.");
    }
    setSavedV3(await loadSavedReportsV3());
  }

  // Recently viewed = real recent IDs only (no padding with featured — keeps it honest).
  const recent = useMemo(() => {
    // Merge Supabase-persisted recents (per-user, cross-device) with the
    // legacy localStorage list. Supabase order wins, local fills gaps.
    const local = readRecent();
    const merged: string[] = [];
    const seenIds = new Set<string>();
    for (const id of [...supabaseRecentIds, ...local]) {
      if (!seenIds.has(id)) {
        merged.push(id);
        seenIds.add(id);
      }
    }
    const recentIds = merged;
    const ordered: ReportDef[] = [];
    const seen = new Set<string>();
    for (const id of recentIds) {
      const r = reports.find(x => x.id === id);
      if (r && !seen.has(r.id)) { ordered.push(r); seen.add(r.id); }
    }
    return ordered;
  }, [reports, supabaseRecentIds]);

  return (
    <OSShell>
      {/* ============== HERO ============== */}
      <section className="os-rise relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] via-[hsl(285_100%_98%)] to-[hsl(225_100%_98%)] p-7 shadow-[0_30px_70px_-40px_hsl(265_60%_50%/0.4)]">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[hsl(265_100%_90%)] opacity-50 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-[hsl(215_100%_90%)] opacity-40 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full bg-white/70 text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(265_70%_55%)]">
              Reports OS · {roleLabel}
            </Badge>
            {activeCategoryDef && (
              <button
                type="button"
                onClick={clearCategoryFilter}
                className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(265_70%_55%/0.35)] bg-white/80 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)] hover:bg-white"
                aria-label={`Clear ${activeCategoryDef.name} filter`}
              >
                {activeCategoryDef.name} focus
                <X className="h-3 w-3" />
              </button>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          </div>
          <h1 className="mt-3 text-[34px] font-semibold tracking-tight md:text-[40px]">
            {activeCategoryDef ? `${activeCategoryDef.name} Reports` : "Reports & Analytics"}
          </h1>
          <p className="mt-1 max-w-2xl text-[14px] text-muted-foreground">
            {activeCategoryDef ? (
              <>
                Focused on {activeCategoryDef.name.toLowerCase()} reports.{" "}
                <button
                  type="button"
                  onClick={clearCategoryFilter}
                  className="font-medium text-[hsl(265_70%_55%)] underline-offset-2 hover:underline"
                >
                  Clear filter to view all reports
                </button>
                .
              </>
            ) : (
              "Operational intelligence for every department. Browse dashboards across your role."
            )}
          </p>

          {/* Search */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute z-10 left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports…" className="h-10 border-white/80 bg-white/70 pl-9 backdrop-blur" />
            </div>
          </div>
        </div>
      </section>

      {/* ============== SAVED REPORTS ============== */}
      {(cancelSaved.length > 0 || savedV3.length > 0) && (
        <section className="mt-8">
          <SectionHeader
            title="Saved reports"
            subtitle="Pick up where you left off — your uploaded reports."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedV3.map(sr => (
              <article
                key={sr.id}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.35)] hover:shadow-[0_20px_40px_-25px_hsl(265_60%_50%/0.4)]"
              >
                <Link to={`/reports/bcba-productivity-report-v3?saved=${sr.id}`} className="block">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-[hsl(265_100%_97%)] text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]"
                  >
                    BCBA Productivity V3
                  </Badge>
                  <h3 className="mt-2 line-clamp-1 text-[14.5px] font-semibold tracking-tight">{sr.name}</h3>
                  <p className="mt-1 line-clamp-1 text-[11.5px] text-muted-foreground">
                    {sr.rowCount.toLocaleString()} billing rows · {sr.fileName}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(sr.savedAt).toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-[hsl(265_70%_55%)] transition group-hover:translate-x-0.5">
                      Open <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (window.confirm(`Delete "${sr.name}"?`)) void handleDeleteV3(sr.id); }}
                  className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground/60 opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete saved report"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </article>
            ))}
            {cancelSaved.map(sr => (
              <article
                key={sr.id}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition hover:-translate-y-0.5 hover:border-[hsl(345_70%_50%/0.35)] hover:shadow-[0_20px_40px_-25px_hsl(345_60%_50%/0.4)]"
              >
                <Link to={`/reports/cancellation-command-center?saved=${sr.id}`} className="block">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-[hsl(345_100%_97%)] text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(345_70%_50%)]"
                  >
                    Cancellation Command Center
                  </Badge>
                  <h3 className="mt-2 line-clamp-1 text-[14.5px] font-semibold tracking-tight">{sr.name}</h3>
                  <p className="mt-1 line-clamp-1 text-[11.5px] text-muted-foreground">
                    {sr.scheduleFileName || "Scheduling export"} · {sr.authFileNames.length} auth file{sr.authFileNames.length === 1 ? "" : "s"}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(sr.savedAt).toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-[hsl(345_70%_50%)] transition group-hover:translate-x-0.5">
                      Open <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (window.confirm(`Delete "${sr.name}"?`)) void handleDeleteCancelSaved(sr.id); }}
                  className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground/60 opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete saved report"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ============== FEATURED DASHBOARDS ============== */}
      {featured.length > 0 && (
        <section className="mt-8">
          <SectionHeader title="Featured dashboards" subtitle="Hand-picked for your role this week." />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {featured.map(r => <FeaturedCard key={r.id} report={r} favored={favs.includes(r.id)} onFav={onFav} />)}
          </div>
        </section>
      )}

      {/* ============== CATEGORIES ============== */}
      <section className="mt-10">
        <SectionHeader title="Browse by category" subtitle={`${categories.length} categories available for ${roleLabel}.${activeCategory ? ` Filtered to ${activeCategory}.` : ""}`} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categoriesOrdered.map(cat => <CategoryCard key={cat.id} cat={cat} />)}
        </div>
      </section>

      {/* ============== ALL REPORTS (grouped by category) ============== */}
      <section className="mt-10">
        <SectionHeader
          title={activeCategoryDef
            ? `${activeCategoryDef.name} reports · ${reports.filter(r => r.category === activeCategoryDef.id).length}`
            : `All reports · ${reports.length}`}
          subtitle={activeCategoryDef
            ? `Showing ${activeCategoryDef.name.toLowerCase()} reports first. Other categories are listed below.`
            : `Every report available for ${roleLabel}, grouped by category.`}
        />
        {(() => {
          const renderCat = (cat: (typeof categoriesOrdered)[number]) => {
            const inCat = reports
              .filter(r => r.category === cat.id)
              .sort((a, b) => b.popularity - a.popularity);
            if (inCat.length === 0) return null;
            const Icon = cat.icon;
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white shadow-sm"
                    style={{ color: cat.accent }}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <h3 className="text-[13.5px] font-semibold tracking-tight">{cat.name}</h3>
                  <Badge variant="secondary" className="rounded-full bg-secondary text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {inCat.length}
                  </Badge>
                </div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {inCat.map(r => (
                    <MiniReportCard key={r.id} report={r} favored={favs.includes(r.id)} onFav={onFav} />
                  ))}
                </div>
              </div>
            );
          };
          if (!activeCategoryDef) {
            return <div className="mt-4 space-y-6">{categoriesOrdered.map(renderCat)}</div>;
          }
          const active = categoriesOrdered.find(c => c.id === activeCategoryDef.id);
          const others = categoriesOrdered.filter(c => c.id !== activeCategoryDef.id);
          return (
            <div className="mt-4 space-y-8">
              {active && renderCat(active)}
              {others.length > 0 && (
                <div className="pt-4 border-t border-border/60">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-[13.5px] font-semibold tracking-tight text-muted-foreground">
                        Other available reports
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Not part of the current {activeCategoryDef.name.toLowerCase()} focus.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearCategoryFilter}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(265_70%_55%)] hover:underline"
                    >
                      <X className="h-3 w-3" /> Clear filter
                    </button>
                  </div>
                  <div className="space-y-6">{others.map(renderCat)}</div>
                </div>
              )}
            </div>
          );
        })()}
      </section>

      {/* ============== RECENT + FAVORITES ============== */}
      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <SidePanel title="Recently viewed" icon={History} empty="Open a report to start building your recent list.">
          {recent.slice(0, 6).map(r => <MiniReportRow key={r.id} report={r} />)}
        </SidePanel>

        <SidePanel title="Favorites" icon={Star} empty="Star a report to pin it here for quick access.">
          {favReports.slice(0, 6).map(r => <MiniReportRow key={r.id} report={r} />)}
        </SidePanel>
      </section>

      {/* ============== REQUEST A NEW REPORT ============== */}
      <section className="mt-10 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 bg-secondary/20 px-6 py-8 text-center">
        <p className="text-[13px] text-muted-foreground">Don't see what you need?</p>
        <Button size="sm" onClick={() => setRequestOpen(true)} className="bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]">
          <Plus className="mr-1 h-3.5 w-3.5" />Request a New Report
        </Button>
      </section>

      {/* ============== ALL REPORTS (filtered/search) ============== */}
      {search && (
        <section className="mt-10">
          <SectionHeader title={`Search results · ${filteredReports.length}`} subtitle={`Matching "${search}"`} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map(r => <MiniReportCard key={r.id} report={r} favored={favs.includes(r.id)} onFav={onFav} />)}
          </div>
        </section>
      )}

      <RequestReportDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </OSShell>
  );
}

/* ====================== PRESENTATION COMPONENTS ====================== */

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[18px] font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatTile({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/70 p-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
      </div>
      <p className="mt-1 text-[22px] font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

function Sparkline({ points, color = "hsl(265 70% 55%)" }: { points: number[]; color?: string }) {
  if (!points.length) return null;
  const w = 160, h = 38, max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const path = points.map((p, i) => {
    const x = i * step;
    const y = h - ((p - min) / range) * h;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const area = path + ` L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeaturedCard({ report, favored, onFav }: { report: ReportDef; favored: boolean; onFav: (id: string) => void }) {
  const cat = REPORT_CATEGORIES.find(c => c.id === report.category)!;
  return (
    <Link to={report.drilldownPath ?? `/reports/${report.id}`} className="group block">
      <article className={cn(
        "relative overflow-hidden rounded-3xl border border-white/70 bg-card p-5 transition-all duration-300",
        "shadow-[0_20px_50px_-30px_hsl(265_60%_50%/0.35)] hover:-translate-y-0.5 hover:shadow-[0_30px_70px_-30px_hsl(265_60%_50%/0.5)]",
      )}>
        <div className={cn("absolute inset-x-0 top-0 h-24 bg-gradient-to-br opacity-70", cat.tone)} />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge variant="secondary" className="rounded-full bg-white/80 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: cat.accent }}>
                {cat.name}
              </Badge>
              <h3 className="mt-2 text-[17px] font-semibold tracking-tight">{report.title}</h3>
              <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">{report.description}</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onFav(report.id); }}
              className={cn(
                "rounded-full p-1.5 transition",
                favored ? "text-amber-500" : "text-muted-foreground/60 hover:bg-white/60 hover:text-amber-500",
              )}
              aria-label="Favorite"
            >
              <Star className={cn("h-4 w-4", favored && "fill-current")} />
            </button>
          </div>

          {report.kpiPreviews && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {report.kpiPreviews.map((k, i) => (
                <div key={i} className="rounded-xl border border-white/70 bg-white/70 p-2.5 backdrop-blur">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{k.label}</p>
                  <p className="mt-0.5 text-[16px] font-semibold tabular-nums tracking-tight">{k.value}</p>
                  {k.delta && (
                    <p className={cn("text-[10.5px] font-medium",
                      k.trend === "up" ? "text-emerald-600" : k.trend === "down" ? "text-rose-600" : "text-muted-foreground")}>
                      {k.delta}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-white/70 bg-white/50 p-2 backdrop-blur">
            <Sparkline points={report.sparkline || []} color={cat.accent} />
          </div>

          {report.aiInsight && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-[hsl(265_70%_55%/0.18)] bg-[hsl(265_100%_98%)] p-2.5">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[hsl(265_70%_55%)]" />
              <p className="text-[11.5px] leading-snug text-[hsl(265_30%_30%)]">{report.aiInsight}</p>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{report.lastUpdated}</span>
              <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{report.popularity}</span>
              <span>· {report.owner}</span>
            </div>
            <span className="inline-flex items-center gap-1 font-medium text-[hsl(265_70%_55%)] transition group-hover:translate-x-0.5">
              Open <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function CategoryCard({ cat }: { cat: ReturnType<typeof visibleCategoriesForRole>[number] }) {
  const Icon = cat.icon;
  return (
    <Link
      to={`/reports?category=${cat.id}`}
      className="group block"
    >
      <article className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.35)] hover:shadow-[0_20px_40px_-25px_hsl(265_60%_50%/0.4)]",
      )}>
        <div className={cn("absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-60 blur-2xl", cat.tone)} />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm"
              style={{ color: cat.accent }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <Badge variant="secondary" className="rounded-full bg-white/70 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {cat.count} {cat.count === 1 ? "report" : "reports"}
            </Badge>
          </div>
          <h3 className="mt-3 text-[14.5px] font-semibold tracking-tight">{cat.name}</h3>
          <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground line-clamp-2">{cat.description}</p>
          {cat.mostViewed && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-border/40 bg-secondary/30 px-2.5 py-1.5">
              <span className="truncate text-[11px] text-muted-foreground">Most viewed</span>
          <Link to={cat.mostViewed.drilldownPath ?? `/reports/${cat.mostViewed.id}`} className="ml-2 truncate text-[11px] font-medium text-foreground hover:text-[hsl(265_70%_55%)]">
                {cat.mostViewed.title}
              </Link>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

function SidePanel({ title, icon: Icon, empty, children }: { title: string; icon: React.ComponentType<{ className?: string }>; empty: string; children: React.ReactNode }) {
  const hasContent = Array.isArray(children) ? children.filter(Boolean).length > 0 : Boolean(children);
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
          <h3 className="text-[13.5px] font-semibold tracking-tight">{title}</h3>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {hasContent ? children : (
          <p className="rounded-xl border border-dashed border-border bg-secondary/30 px-3 py-4 text-center text-[11.5px] text-muted-foreground">{empty}</p>
        )}
      </div>
    </div>
  );
}

function MiniReportRow({ report }: { report: ReportDef }) {
  const cat = REPORT_CATEGORIES.find(c => c.id === report.category)!;
  return (
    <Link to={report.drilldownPath ?? `/reports/${report.id}`} className="group flex items-center justify-between rounded-xl border border-border/40 bg-card/70 px-3 py-2.5 transition hover:border-[hsl(265_70%_55%/0.4)] hover:shadow-sm">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.accent }} />
          <span className="truncate text-[12.5px] font-medium">{report.title}</span>
        </div>
        <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{cat.name} · {report.lastUpdated}</p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function MiniReportCard({ report, favored, onFav }: { report: ReportDef; favored: boolean; onFav: (id: string) => void }) {
  const cat = REPORT_CATEGORIES.find(c => c.id === report.category)!;
  return (
    <Link to={report.drilldownPath ?? `/reports/${report.id}`} className="group block rounded-2xl border border-border/60 bg-card p-3.5 transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.35)] hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="secondary" className="rounded-full bg-secondary text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: cat.accent }}>{cat.name}</Badge>
        <button onClick={(e) => { e.preventDefault(); onFav(report.id); }} className={cn("rounded-full p-1", favored ? "text-amber-500" : "text-muted-foreground/60 hover:text-amber-500")}>
          <Star className={cn("h-3.5 w-3.5", favored && "fill-current")} />
        </button>
      </div>
      <h3 className="mt-2 text-[13.5px] font-semibold tracking-tight">{report.title}</h3>
      <p className="mt-0.5 line-clamp-2 text-[11.5px] text-muted-foreground">{report.description}</p>
      <Sparkline points={report.sparkline || []} color={cat.accent} />
    </Link>
  );
}
