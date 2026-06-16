import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3, Search, Star, ArrowUpRight, Download, BookOpen,
  Sparkles, Filter, LayoutGrid,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOSRole } from "@/contexts/OSRoleContext";
import { cn } from "@/lib/utils";
import {
  PHASE3_REPORTS, PHASE3_SECTIONS, reportsForRole, reportRoute,
  readMyReports, toggleMyReport,
  type Phase3Report, type Phase3Section, type Phase3Status,
} from "@/lib/os/phase3Reports";

const STATUS_LABEL: Record<Phase3Status, string> = {
  live: "Live",
  coming_soon: "Coming Soon",
  needs_data: "Needs Data",
};

const STATUS_TONE: Record<Phase3Status, string> = {
  live: "bg-emerald-50 text-emerald-700 border-emerald-200",
  coming_soon: "bg-amber-50 text-amber-800 border-amber-200",
  needs_data: "bg-sky-50 text-sky-700 border-sky-200",
};

export default function ReportsLanding() {
  const { role } = useOSRole();
  const isSuper = role === "super_admin";
  const all = useMemo(() => (isSuper ? PHASE3_REPORTS : reportsForRole(role)), [role, isSuper]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Phase3Status>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const [stars, setStars] = useState<string[]>(() => readMyReports());
  const onStar = (id: string) => setStars(toggleMyReport(id));

  const departments = useMemo(
    () => Array.from(new Set(all.map(r => r.department))).sort(),
    [all],
  );

  const filtered = useMemo(() => {
    return all.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (deptFilter !== "all" && r.department !== deptFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(r.name + " " + r.description + " " + r.department).toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [all, statusFilter, deptFilter, search]);

  const my = filtered.filter(r => stars.includes(r.id));

  return (
    <OSShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-8">
        {/* Hero */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <BarChart3 className="h-3.5 w-3.5" /> Reports
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
              Role-based visibility into training, resources, operations, growth, clinical work,
              and department performance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/reports/catalog">
                <LayoutGrid className="h-4 w-4 mr-1.5" /> Open report catalog
              </Link>
            </Button>
          </div>
        </header>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-xl border border-border/60 bg-card/50 backdrop-blur">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reports…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-transparent border-0 focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="coming_soon">Coming Soon</SelectItem>
                <SelectItem value="needs_data">Needs Data</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* My Reports */}
        <Section
          title="My Reports"
          description={my.length ? "Reports you've starred for quick access." : "Star any report to pin it here for quick access."}
        >
          {my.length === 0 ? (
            <EmptyState
              icon={<Star className="h-5 w-5 text-amber-500" />}
              title="No reports starred yet"
              body="Click the star on any report below to add it to My Reports."
            />
          ) : (
            <CardGrid>
              {my.map(r => (
                <ReportCard key={r.id} report={r} starred onStar={() => onStar(r.id)} />
              ))}
            </CardGrid>
          )}
        </Section>

        {/* All sections */}
        {PHASE3_SECTIONS.filter(s => s.id !== "my").map(section => {
          const items = filtered.filter(r => r.section === section.id);
          if (items.length === 0) return null;
          return (
            <Section key={section.id} title={section.title} description={section.description}>
              <CardGrid>
                {items.map(r => (
                  <ReportCard
                    key={r.id}
                    report={r}
                    starred={stars.includes(r.id)}
                    onStar={() => onStar(r.id)}
                  />
                ))}
              </CardGrid>
            </Section>
          );
        })}

        {filtered.length === 0 && (
          <EmptyState
            icon={<Sparkles className="h-5 w-5 text-primary" />}
            title="No reports match those filters"
            body="Try a different status, department, or search term."
          />
        )}
      </div>
    </OSShell>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{children}</div>;
}

function ReportCard({
  report, starred, onStar,
}: { report: Phase3Report; starred: boolean; onStar: () => void }) {
  const route = reportRoute(report);
  const isComing = report.status !== "live";
  return (
    <article className="group relative rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate">{report.name}</h3>
            <Badge variant="outline" className={cn("text-[10px] font-medium px-1.5 py-0 border", STATUS_TONE[report.status])}>
              {STATUS_LABEL[report.status]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.description}</p>
        </div>
        <button
          onClick={onStar}
          className={cn(
            "p-1 rounded-md transition-colors",
            starred ? "text-amber-500" : "text-muted-foreground hover:text-amber-500",
          )}
          aria-label={starred ? "Unstar" : "Star"}
        >
          <Star className={cn("h-4 w-4", starred && "fill-amber-400")} />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate">{report.department}</span>
        <span>{report.lastUpdated}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button asChild size="sm" variant={isComing ? "outline" : "default"} className="h-8">
          <Link to={route}>
            {isComing ? <BookOpen className="h-3.5 w-3.5 mr-1.5" /> : <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />}
            {isComing ? "View Roadmap" : "Open Report"}
          </Link>
        </Button>
        {report.canExport && !isComing && (
          <Button size="sm" variant="ghost" className="h-8">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export
          </Button>
        )}
      </div>
    </article>
  );
}

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-card/30 p-8 text-center">
      <div className="mx-auto mb-2 h-9 w-9 rounded-full bg-secondary/50 flex items-center justify-center">{icon}</div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">{body}</p>
    </div>
  );
}