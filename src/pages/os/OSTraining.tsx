import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OSShell } from "./OSShell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Clock, ArrowRight, GraduationCap, BookOpen, Library,
  Sparkles, Play, FileText, Workflow, CheckCircle2, AlertCircle,
  ChevronRight, Send, BookMarked, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOSRole } from "@/contexts/OSRoleContext";
import {
  trainingDepartments, trainings, continueLearning, featuredTrainings,
  recentlyAdded, searchTrainings, preferredDepartmentsFor, trainingsByDepartment,
  getProgress, sopLibrary,
  type Training, type TrainingType,
} from "@/lib/training/academyData";

const TYPE_ICON: Record<TrainingType, typeof FileText> = {
  "SOP": FileText, "Workflow": Workflow, "Tango": Play, "Video": Play,
  "Checklist": CheckCircle2, "Quick Guide": BookOpen, "Operational Overview": BookMarked,
};

export default function OSTraining() {
  const navigate = useNavigate();
  const { role } = useOSRole();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "required" | "sop">("all");

  const cont = useMemo(continueLearning, []);
  const featured = useMemo(featuredTrainings, []);
  const recent = useMemo(() => recentlyAdded(6), []);
  const preferred = useMemo(() => preferredDepartmentsFor(role), [role]);
  const searchResults = useMemo(() => (query ? searchTrainings(query) : []), [query]);

  const overall = useMemo(() => {
    const all = trainings.map((t) => getProgress(t.id));
    const required = trainings.filter((t) => t.required);
    const requiredDone = required.filter((t) => getProgress(t.id).status === "completed").length;
    const avg = Math.round(all.reduce((s, p) => s + p.progressPercent, 0) / all.length);
    return {
      avg,
      requiredDone,
      requiredTotal: required.length,
      overdue: all.filter((p) => p.status === "overdue").length,
      inProgress: all.filter((p) => p.status === "in_progress").length,
    };
  }, []);

  const sortedDepartments = useMemo(() => {
    const pri = new Set(preferred);
    return [...trainingDepartments].sort((a, b) => (pri.has(a.id) ? -1 : 1) - (pri.has(b.id) ? -1 : 1));
  }, [preferred]);

  const visibleList: Training[] =
    tab === "required" ? trainings.filter((t) => t.required)
    : tab === "sop" ? sopLibrary()
    : trainings;

  return (
    <OSShell>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div>
          {/* Hero */}
          <header className="os-rise os-glass-panel rounded-3xl p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_55%)]">
              Blossom OS · Training Academy
            </p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-tight md:text-[34px]">
              Training Academy
            </h1>
            <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
              Learn workflows, systems, SOPs, and operational processes across Blossom.
            </p>

            <div className="relative mt-5 max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search trainings, SOPs, workflows, systems…"
                className="os-glass-input h-12 rounded-2xl pl-11 text-sm"
              />
              {query && searchResults.length > 0 && (
                <div className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-border/60 bg-card shadow-xl">
                  {searchResults.slice(0, 8).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => navigate(`/training/${t.id}`)}
                      className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-4 py-3 text-left last:border-b-0 hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{t.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{t.type} · {t.department}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" className="rounded-full" onClick={() => document.getElementById("continue")?.scrollIntoView({ behavior: "smooth" })}>
                <Play className="mr-1.5 h-3.5 w-3.5" /> Continue Learning
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => document.getElementById("departments")?.scrollIntoView({ behavior: "smooth" })}>
                Browse Departments
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setTab("sop")}>
                <Library className="mr-1.5 h-3.5 w-3.5" /> Open SOP Library
              </Button>
            </div>
          </header>

          {/* Continue Learning */}
          <section id="continue" className="mt-8 os-rise">
            <SectionHeader title="Continue Learning" subtitle="Pick up where you left off." />
            {cont.length === 0 ? (
              <EmptyState text="You're all caught up. Explore featured trainings below." />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {cont.map(({ training, progress }) => (
                  <Link
                    key={training.id}
                    to={`/training/${training.id}`}
                    className="os-card group flex flex-col rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        progress.status === "overdue" && "border-red-300 text-red-600 bg-red-50",
                      )}>
                        {progress.status === "overdue" ? "Overdue" : "In progress"}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.max(1, Math.round(training.estimatedMinutes * (1 - progress.progressPercent / 100)))} min left
                      </span>
                    </div>
                    <h3 className="mt-3 text-[15px] font-semibold">{training.title}</h3>
                    <p className="mt-1 text-[12.5px] text-muted-foreground capitalize">{training.department} · {training.type}</p>
                    <div className="mt-4 space-y-1.5">
                      <Progress value={progress.progressPercent} className="h-1.5" />
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{progress.progressPercent}% complete</span>
                        <span className="font-medium text-primary inline-flex items-center gap-1">
                          Continue <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Departments */}
          <section id="departments" className="mt-10 os-rise">
            <SectionHeader title="Departments" subtitle="Operational training by team." />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedDepartments.map((d) => {
                const list = trainingsByDepartment(d.id);
                const completed = list.filter((t) => getProgress(t.id).status === "completed").length;
                const pct = list.length ? Math.round((completed / list.length) * 100) : 0;
                const Icon = d.icon;
                return (
                  <Link
                    key={d.id}
                    to={`/training?dept=${d.id}`}
                    onClick={(e) => { e.preventDefault(); document.getElementById("all-trainings")?.scrollIntoView({ behavior: "smooth" }); setQuery(d.name.toLowerCase()); }}
                    className="os-card group flex flex-col rounded-2xl p-5"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("os-glass-icon rounded-xl p-2", `os-tone-${d.tone}`)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-semibold leading-tight">{d.name}</h3>
                        <p className="truncate text-[11.5px] text-muted-foreground">{list.length} trainings</p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-[12.5px] text-muted-foreground">{d.description}</p>
                    <div className="mt-4 space-y-1.5">
                      <Progress value={pct} className="h-1.5" />
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{pct}% complete</span>
                        <span className="font-medium text-primary inline-flex items-center gap-1">
                          Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Featured */}
          <section className="mt-10 os-rise">
            <SectionHeader title="Featured Trainings" subtitle="The workflows everyone should know." icon={<Star className="h-4 w-4 text-amber-500" />} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {featured.map((t) => <TrainingCard key={t.id} t={t} />)}
            </div>
          </section>

          {/* Recently Added */}
          <section className="mt-10 os-rise">
            <SectionHeader title="Recently Added" subtitle="Fresh from your operations leads." />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recent.map((t) => <TrainingCard key={t.id} t={t} />)}
            </div>
          </section>

          {/* All / Required / SOP Library */}
          <section id="all-trainings" className="mt-10 os-rise">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-semibold tracking-tight">Training Library</h2>
                <p className="text-[12.5px] text-muted-foreground">All trainings, SOPs, and operational guides in one place.</p>
              </div>
              <div className="flex rounded-full border border-border/60 bg-card p-1 text-xs">
                {(["all", "required", "sop"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={cn(
                      "rounded-full px-3 py-1.5 font-medium capitalize transition",
                      tab === k ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {k === "sop" ? "SOP Library" : k === "required" ? "My Required" : "All"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleList.map((t) => <TrainingCard key={t.id} t={t} />)}
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <aside className="xl:sticky xl:top-6 xl:self-start space-y-4">
          <div className="os-glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[13px] font-semibold">Your Progress</h3>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Overall</span>
                <span className="text-[22px] font-semibold tabular-nums">{overall.avg}%</span>
              </div>
              <Progress value={overall.avg} className="mt-2 h-1.5" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
              <StatTile label="Required done" value={`${overall.requiredDone}/${overall.requiredTotal}`} icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />} />
              <StatTile label="In progress" value={overall.inProgress} icon={<Clock className="h-3.5 w-3.5 text-primary" />} />
              <StatTile label="Overdue" value={overall.overdue} icon={<AlertCircle className="h-3.5 w-3.5 text-red-500" />} />
              <StatTile label="Library" value={trainings.length} icon={<BookOpen className="h-3.5 w-3.5 text-muted-foreground" />} />
            </div>
          </div>

          <div className="os-glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[13px] font-semibold">Ask Blossom AI</h3>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">Your training co-pilot.</p>
            <div className="mt-3 space-y-2">
              {[
                "Explain this SOP.",
                "Summarize this workflow.",
                "What's the next step?",
                "Show me related trainings.",
              ].map((p) => (
                <Link
                  key={p}
                  to={`/ai/assistant?q=${encodeURIComponent(p)}`}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2 text-[12px] hover:border-primary/40 hover:bg-muted/40"
                >
                  <span>{p}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
            <Link to="/ai/assistant" className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
              Open full workspace <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="os-glass-panel rounded-2xl p-5">
            <h3 className="text-[13px] font-semibold">Quick Access</h3>
            <div className="mt-3 grid grid-cols-1 gap-1.5 text-[12.5px]">
              {[
                { label: "SOP Library", onClick: () => { setTab("sop"); document.getElementById("all-trainings")?.scrollIntoView({ behavior: "smooth" }); } },
                { label: "My Required Trainings", onClick: () => { setTab("required"); document.getElementById("all-trainings")?.scrollIntoView({ behavior: "smooth" }); } },
                { label: "Department Trainings", onClick: () => document.getElementById("departments")?.scrollIntoView({ behavior: "smooth" }) },
                { label: "Operational Guides", onClick: () => { setQuery("operational"); } },
                { label: "System Tutorials", onClick: () => { setQuery("system"); } },
              ].map((q) => (
                <button
                  key={q.label}
                  onClick={q.onClick}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-foreground hover:bg-muted/50"
                >
                  {q.label}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </OSShell>
  );
}

/* ---------------- Small subcomponents ---------------- */

function SectionHeader({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-[18px] font-semibold tracking-tight">{title}</h2>
        </div>
        {subtitle && <p className="text-[12.5px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function StatTile({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide text-muted-foreground">{icon}{label}</div>
      <div className="mt-0.5 text-[14px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 px-6 py-8 text-center text-[13px] text-muted-foreground">
      {text}
    </div>
  );
}

export function TrainingCard({ t }: { t: Training }) {
  const progress = getProgress(t.id);
  const Icon = TYPE_ICON[t.type] ?? FileText;
  const cta = progress.status === "completed" ? "Review" : progress.status === "not_started" ? "Start" : "Continue";
  return (
    <Link to={`/training/${t.id}`} className="os-card group flex h-full flex-col rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="os-glass-icon rounded-xl p-2 text-[hsl(265_70%_55%)]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex flex-wrap items-center gap-1">
          {t.required && (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-700">Required</Badge>
          )}
          <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
        </div>
      </div>
      <h3 className="mt-3 text-[14.5px] font-semibold leading-snug">{t.title}</h3>
      <p className="mt-1 line-clamp-2 text-[12.5px] text-muted-foreground">{t.description}</p>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{t.estimatedMinutes} min</span>
        <span>·</span>
        <span>{t.difficulty}</span>
        <span>·</span>
        <span className="capitalize">{t.department}</span>
      </div>
      <div className="mt-4 space-y-1.5">
        <Progress value={progress.progressPercent} className="h-1.5" />
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Updated {t.lastUpdated}</span>
          <span className="font-medium text-primary inline-flex items-center gap-1">
            {cta} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}