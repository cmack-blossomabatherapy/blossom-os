import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Clock, GraduationCap, ArrowRight, Library,
  Target, Trophy, CheckCircle2, PlayCircle, Sparkles, ListChecks, FolderOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  buildPathJourney, journeyProgressPct, firstIncompleteModule,
  type JourneyDay,
} from "@/lib/academy/journeyContent";
import { RBT_BUCKETS } from "@/lib/academy/trainingPaths";

/**
 * Real Journey Detail for /academy/path/:slug.
 *
 * Renders phase/week timeline → day cards → modules, with progress, resources,
 * Start/Continue. RBT keeps its experience-level buckets section. State Director
 * still routes to its live /training journey.
 */
export default function TrainingPathDetail() {
  const { slug = "" } = useParams();
  if (slug === "state-director") return <Navigate to="/training" replace />;

  const journey = useMemo(() => buildPathJourney(slug), [slug]);
  if (!journey) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-sm text-muted-foreground">Training path not found.</p>
        <Link to="/academy" className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Training Academy
        </Link>
      </div>
    );
  }

  const { path, weeks, totalModules, completedModules, inProgressModules,
    estimatedMinutes, nextModule, nextDay, currentWeek, runtimeRouteFor, hasContent } = journey;
  const isRbt = path.slug === "rbt";
  const pct = journeyProgressPct(journey);
  const totalDays = weeks.reduce((s, w) => s + w.days.length, 0);

  const continueHref = nextModule
    ? runtimeRouteFor(nextModule.id)
    : (nextDay ? `/academy/path/${slug}/day/${encodeURIComponent(nextDay.id)}` : "#");

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <Link to="/academy" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Training Academy
      </Link>

      {/* Hero */}
      <header className="mt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <GraduationCap className="h-3 w-3" /> {path.category} · {path.audience}
        </div>
        <div className="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{path.title}</h1>
            <p className="mt-2 max-w-2xl text-[14.5px] text-muted-foreground">{path.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Clock className="h-3 w-3" />~{path.estimatedHours}h</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><BookOpen className="h-3 w-3" />{totalModules || path.lessonCount} modules</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">{weeks.length} weeks · {totalDays} days</span>
            </div>
          </div>
          {hasContent && (
            <Link
              to={continueHref}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-primary px-5 h-11 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 md:self-end"
            >
              <PlayCircle className="h-4 w-4" />
              {completedModules === 0 ? "Start journey" : completedModules >= totalModules ? "Review journey" : "Continue journey"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Progress strip */}
        {hasContent && (
          <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
            <HeroStat accent="orchid" icon={Target} label="Today" value={nextModule?.title ?? "All caught up"} sub={currentWeek ? `Week ${currentWeek.weekNumber}${nextDay ? ` · Day ${nextDay.dayNumber}` : ""}` : ""} />
            <HeroStat accent="mint" icon={Trophy} label="Journey progress" value={`${pct}%`} sub={`${completedModules} of ${totalModules} modules complete`} meter={pct} />
            <HeroStat accent="citrus" icon={Sparkles} label="In progress" value={`${inProgressModules} active`} sub={`~${Math.round(estimatedMinutes/60)}h total runtime`} />
          </div>
        )}
      </header>

      {/* RBT experience buckets (preserved) */}
      {isRbt && (
        <section className="mt-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">RBT learning paths</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">By experience level</h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RBT_BUCKETS.map((b) => (
              <div key={b.slug} className="rounded-2xl border border-border/70 bg-card p-5 transition hover:border-border">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <b.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-[14.5px] font-semibold tracking-tight">{b.title}</h3>
                <p className="mt-1 text-[12.5px] text-muted-foreground">{b.description}</p>
              </div>
            ))}
          </div>
          <Link to="/rbt/training-academy" className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-primary">
            Open the full RBT academy <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}

      {/* Phase / week / day timeline */}
      <section className="mt-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Curriculum</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">Week-by-week journey</h2>

        {!hasContent ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border/70 bg-muted/30 p-8 text-center">
            <FolderOpen className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Curriculum coming online for {path.title}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              The {path.audience} journey is code-defined and being mapped into the new LMS shell.
              In the meantime, related SOPs and resources live in the Resource Library.
            </p>
            <Link to="/hr/resources" className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-primary">
              <Library className="h-3.5 w-3.5" /> Open Resource Library
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {weeks.map((w) => {
              const wkPct = w.moduleCount === 0 ? 0 : Math.round((w.completedCount / w.moduleCount) * 100);
              return (
                <div key={w.weekNumber}>
                  <div className="mb-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Week {w.weekNumber}</p>
                      <h3 className="mt-0.5 text-[15px] font-semibold tracking-tight">{w.days.length} days · {w.moduleCount} modules · ~{Math.round(w.estimatedMinutes/60) || 1}h</h3>
                    </div>
                    <div className="w-40">
                      <Progress value={wkPct} className="h-1.5" />
                      <p className="mt-1 text-right text-[10.5px] text-muted-foreground">{wkPct}% complete</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {w.days.map((d) => <DayCard key={d.id} slug={slug} day={d} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ============================ pieces ============================ */

const ACCENTS = {
  mint:    { bg: "bg-emerald-50",  fg: "text-emerald-700", ring: "ring-emerald-200" },
  sky:     { bg: "bg-sky-50",      fg: "text-sky-700",     ring: "ring-sky-200" },
  citrus:  { bg: "bg-amber-50",    fg: "text-amber-700",   ring: "ring-amber-200" },
  coral:   { bg: "bg-rose-50",     fg: "text-rose-700",    ring: "ring-rose-200" },
  orchid:  { bg: "bg-violet-50",   fg: "text-violet-700",  ring: "ring-violet-200" },
  teal:    { bg: "bg-teal-50",     fg: "text-teal-700",    ring: "ring-teal-200" },
} as const;
type Accent = keyof typeof ACCENTS;

function HeroStat({
  accent, icon: Icon, label, value, sub, meter,
}: { accent: Accent; icon: typeof Target; label: string; value: string; sub: string; meter?: number }) {
  const a = ACCENTS[accent];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${a.bg} opacity-60`} />
      <div className="relative flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${a.bg} ${a.fg} ring-1 ${a.ring}`}><Icon className="h-5 w-5" /></div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      </div>
      <p className="relative mt-3 line-clamp-2 text-[15px] font-semibold tracking-tight">{value}</p>
      <p className="relative mt-1 text-[12.5px] text-muted-foreground">{sub}</p>
      {typeof meter === "number" && <div className="relative mt-3"><Progress value={meter} className="h-1.5" /></div>}
    </div>
  );
}

function DayCard({ slug, day }: { slug: string; day: JourneyDay }) {
  const isComplete = day.completedCount === day.modules.length && day.modules.length > 0;
  const isActive = !isComplete && day.completedCount + day.inProgressCount > 0;
  const statusAccent: Accent = isComplete ? "mint" : isActive ? "citrus" : "orchid";
  const a = ACCENTS[statusAccent];
  const next = firstIncompleteModule(day);
  return (
    <Link
      to={`/academy/path/${slug}/day/${encodeURIComponent(day.id)}`}
      className="group flex flex-col rounded-2xl border border-border/70 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-border"
    >
      <div className="flex items-start justify-between">
        <div className={`grid h-9 w-9 place-items-center rounded-xl ${a.bg} ${a.fg} ring-1 ${a.ring}`}>
          <span className="text-[11px] font-semibold">D{day.dayInJourney}</span>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {isComplete ? "Completed" : isActive ? "In progress" : "Not started"}
        </Badge>
      </div>
      <h4 className="mt-3 text-[14px] font-semibold tracking-tight line-clamp-2">{day.title}</h4>
      <p className="mt-1 text-[12.5px] text-muted-foreground line-clamp-2">{day.objective}</p>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><ListChecks className="h-3 w-3" />{day.completedCount}/{day.modules.length}</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{Math.max(1, Math.round(day.estimatedMinutes/60))}h</span>
        {day.requiredCount > 0 && <span className="text-amber-700">{day.requiredCount} required</span>}
      </div>
      <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
        {isComplete ? <><CheckCircle2 className="h-3.5 w-3.5" /> Review day</> : next ? <><PlayCircle className="h-3.5 w-3.5" /> {day.completedCount > 0 ? "Continue day" : "Start day"}</> : <>Open day</>}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}