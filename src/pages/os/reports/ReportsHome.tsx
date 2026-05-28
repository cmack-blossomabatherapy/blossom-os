import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Plus, Bookmark, Star, History,
  ArrowUpRight, Clock, Eye, FileSpreadsheet, Search, Brain, ChevronRight, Pin, Wand2, Trash2,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useOSRole } from "@/contexts/OSRoleContext";
import {
  visibleReportsForRole, visibleCategoriesForRole, ROLE_AI_SUMMARY,
  readFavorites, toggleFavorite, readRecent, REPORT_CATEGORIES, type ReportDef,
} from "@/lib/os/reportsCatalog";
import { OS_ROLES } from "@/lib/os/permissions";
import { RequestReportDialog } from "@/components/os/reports/RequestReportDialog";
import { listAiReports, deleteAiReport, type AiReport } from "@/lib/os/aiReports";

export default function ReportsHome() {
  const { role } = useOSRole();
  const reports = useMemo(() => visibleReportsForRole(role), [role]);
  const categories = useMemo(() => visibleCategoriesForRole(role), [role]);
  const featured = useMemo(() => reports.filter(r => r.featured).slice(0, 4), [reports]);
  const aiSummary = ROLE_AI_SUMMARY[role];
  const roleLabel = OS_ROLES.find(r => r.id === role)?.label || role;

  const [favs, setFavs] = useState<string[]>(() => readFavorites());
  const recentIds = useMemo(() => readRecent(), []);
  const recent = recentIds.map(id => reports.find(r => r.id === id)).filter(Boolean) as ReportDef[];
  const favReports = favs.map(id => reports.find(r => r.id === id)).filter(Boolean) as ReportDef[];

  const [requestOpen, setRequestOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [aiReports, setAiReports] = useState<AiReport[]>(() => listAiReports());
  useEffect(() => {
    const refresh = () => setAiReports(listAiReports());
    window.addEventListener("blossom-ai-reports-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("blossom-ai-reports-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const filteredReports = search
    ? reports.filter(r => (r.title + r.description + (r.tags || []).join(" ")).toLowerCase().includes(search.toLowerCase()))
    : reports;

  function onFav(id: string) { setFavs(toggleFavorite(id)); }

  return (
    <OSShell>
      {/* ============== HERO ============== */}
      <section className="os-rise relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] via-[hsl(285_100%_98%)] to-[hsl(225_100%_98%)] p-7 shadow-[0_30px_70px_-40px_hsl(265_60%_50%/0.4)]">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[hsl(265_100%_90%)] opacity-50 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-[hsl(215_100%_90%)] opacity-40 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full bg-white/70 text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(265_70%_55%)]">
              Reports OS · {roleLabel}
            </Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          </div>
          <h1 className="mt-3 text-[34px] font-semibold tracking-tight md:text-[40px]">Reports &amp; Analytics</h1>
          <p className="mt-1 max-w-2xl text-[14px] text-muted-foreground">
            Operational intelligence for every department. Browse dashboards across your role.
          </p>

          {/* AI summary */}
          <div className="mt-5 grid gap-3 md:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]">Blossom AI · Today</p>
              </div>
              <p className="mt-2 text-[14px] font-medium leading-snug">{aiSummary.headline}</p>
              <div className="mt-3 grid gap-1.5">
                {aiSummary.insights.map((ins, i) => {
                  const Icon = ins.icon;
                  const tones: Record<string, string> = {
                    emerald: "text-emerald-600 bg-emerald-50",
                    violet: "text-[hsl(265_70%_55%)] bg-[hsl(265_100%_97%)]",
                    amber: "text-amber-600 bg-amber-50",
                    rose: "text-rose-600 bg-rose-50",
                    sky: "text-sky-600 bg-sky-50",
                  };
                  return (
                    <div key={i} className="flex items-start gap-2 text-[12.5px] leading-snug">
                      <span className={cn("mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md", tones[ins.tone])}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <span>{ins.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <StatTile label="Reports for you" value={String(reports.length)} icon={FileSpreadsheet} />
              <StatTile label="Recently viewed" value={String(recent.length)} icon={History} />
              <StatTile label="Favorites" value={String(favs.length)} icon={Star} />
              <StatTile label="Categories" value={String(categories.length)} icon={Brain} />
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute z-10 left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports…" className="h-9 border-white/80 bg-white/70 pl-9 backdrop-blur" />
            </div>
            <Link
              to="/reports/ai/new"
              className="group relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] px-4 text-[12.5px] font-semibold text-white shadow-[0_10px_30px_-10px_hsl(265_70%_55%/0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-15px_hsl(265_70%_55%/0.7)]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Wand2 className="h-3.5 w-3.5" />
              Create a report with AI
              <Sparkles className="h-3 w-3 opacity-80 transition group-hover:rotate-12" />
            </Link>
          </div>
        </div>
      </section>

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
        <SectionHeader title="Browse by category" subtitle={`${categories.length} categories available for ${roleLabel}.`} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map(cat => <CategoryCard key={cat.id} cat={cat} />)}
        </div>
      </section>

      {/* ============== SAVED + RECENT + FAVORITES ============== */}
      <section className="mt-10 grid gap-4 lg:grid-cols-3">
        <SidePanel title="Saved views" icon={Bookmark} empty="No saved views yet. Apply filters on a report and save the view.">
          {/* mock saved views */}
          {favReports.slice(0, 0).map(() => null)}
          {["April Supervision Review", "NC Auth Utilization", "Weekly QA Risks"].map(name => (
            <div key={name} className="group flex items-center justify-between rounded-xl border border-border/60 bg-card/70 px-3 py-2.5 transition hover:border-[hsl(265_70%_55%/0.4)] hover:shadow-sm">
              <div className="flex items-center gap-2 text-[12.5px]">
                <Pin className="h-3 w-3 text-[hsl(265_70%_55%)]" />
                <span className="font-medium">{name}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5" />
            </div>
          ))}
        </SidePanel>

        <SidePanel title="Recently viewed" icon={History} empty="Open a report to start building your recent list.">
          {recent.slice(0, 5).map(r => <MiniReportRow key={r.id} report={r} />)}
        </SidePanel>

        <SidePanel title="Favorites" icon={Star} empty="Star a report card to pin it here.">
          {favReports.slice(0, 5).map(r => <MiniReportRow key={r.id} report={r} />)}
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
    <Link to={`/os/reports/${report.id}`} className="group block">
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
      to={`/os/reports?category=${cat.id}`}
      onClick={(e) => { e.preventDefault(); /* scroll to category section in future */ }}
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
              <Link to={`/os/reports/${cat.mostViewed.id}`} className="ml-2 truncate text-[11px] font-medium text-foreground hover:text-[hsl(265_70%_55%)]">
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
    <Link to={`/os/reports/${report.id}`} className="group flex items-center justify-between rounded-xl border border-border/40 bg-card/70 px-3 py-2.5 transition hover:border-[hsl(265_70%_55%/0.4)] hover:shadow-sm">
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
    <Link to={`/os/reports/${report.id}`} className="group block rounded-2xl border border-border/60 bg-card p-3.5 transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.35)] hover:shadow-md">
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
