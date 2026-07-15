import { useMemo } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Clock, CheckCircle2, PlayCircle, ListChecks,
  FileText, Library, BookOpen, Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  buildPathJourney, findDay, firstIncompleteModule, moduleStatus,
  parseAcademyModuleId,
} from "@/lib/academy/journeyContent";
import { useRuntimeVersion } from "@/lib/academy/runtimeStore";
import { getAcademyResourcesForScope } from "@/lib/academy/resourceResolver";
import type { RBTPathId } from "@/lib/training/rbtAcademy";

/**
 * Day Overview — what the learner will do for a single day inside a journey.
 * Lists modules in order with status, attached resources, and a Start/Continue
 * button that opens the first incomplete module's runtime.
 */
export default function TrainingPathDayDetail() {
  const { slug = "", dayId = "" } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rbtTrackId = (params.get("track") as RBTPathId | null) ?? undefined;
  const trackSuffix = slug === "rbt" && rbtTrackId ? `?track=${rbtTrackId}` : "";
  // Re-render on any runtime progress change so the day view reflects
  // completed modules immediately after returning from the runtime.
  const runtimeVersion = useRuntimeVersion();
  const journey = useMemo(
    () => buildPathJourney(slug, slug === "rbt" && rbtTrackId ? { rbtTrackId } : undefined),
    [slug, rbtTrackId, runtimeVersion],
  );
  const day = useMemo(() => (journey ? findDay(journey, decodeURIComponent(dayId)) : undefined), [journey, dayId]);

  if (!journey || !day) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-sm text-muted-foreground">Day not found.</p>
        <Link to={`/academy/path/${slug}${trackSuffix}`} className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to journey
        </Link>
      </div>
    );
  }

  const completedCount = day.completedCount;
  const isComplete = completedCount === day.modules.length;
  const dayPct = day.modules.length === 0 ? 0 : Math.round((completedCount / day.modules.length) * 100);
  const next = firstIncompleteModule(day);
  const runtimeHref = (id: string) => `${journey.runtimeRouteFor(id)}${trackSuffix}`;
  const startHref = next ? runtimeHref(next.id) : runtimeHref(day.modules[0]?.id ?? "");
  // "Continue day" as soon as any module is completed OR already in progress —
  // so returning to the day after clicking Start on a module never resets the
  // CTA back to "Start day".
  const hasStarted = completedCount > 0 || (day.inProgressCount ?? 0) > 0;

  // Aggregate resources for this day via the unified resolver
  // (module-hardcoded + RBT seeded + admin attachments).
  const dayResources = day.modules.flatMap((m) => {
    const parsed = parseAcademyModuleId(m.id);
    return getAcademyResourcesForScope({
      journeySlug: slug,
      dayId: day.id,
      moduleId: m.id,
      sourceModuleId: parsed.sourceModuleId,
      sourceKind: parsed.kind,
      rbtTrackId: slug === "rbt" ? (rbtTrackId ?? "not_certified") : undefined,
      moduleResources: m.resources,
    }).map((r) => ({ ...r, moduleId: m.id, moduleTitle: m.title }));
  });

  // Resolved per-module counts so cards reflect attachments + seeded resources.
  const moduleResourceCount = (m: typeof day.modules[number]): number => {
    const parsed = parseAcademyModuleId(m.id);
    return getAcademyResourcesForScope({
      journeySlug: slug,
      dayId: day.id,
      moduleId: m.id,
      sourceModuleId: parsed.sourceModuleId,
      sourceKind: parsed.kind,
      rbtTrackId: slug === "rbt" ? (rbtTrackId ?? "not_certified") : undefined,
      moduleResources: m.resources,
    }).length;
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 md:px-10">
      <Link to={`/academy/path/${slug}${trackSuffix}`} className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {journey.path.title}
      </Link>

      <header className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Target className="h-3 w-3" /> Week {day.weekNumber} · Day {day.dayNumber}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">{day.title}</h1>
          <p className="mt-2 max-w-2xl text-[14px] text-muted-foreground">{day.objective}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><ListChecks className="h-3 w-3" />{day.modules.length} modules</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Clock className="h-3 w-3" />~{Math.max(1, Math.round(day.estimatedMinutes/60))}h</span>
            {day.requiredCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{day.requiredCount} required</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 md:items-end">
          <button
            onClick={() => next && navigate(startHref)}
            disabled={!next}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 h-11 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            <PlayCircle className="h-4 w-4" />
            {isComplete ? "Day complete" : hasStarted ? "Continue day" : "Start day"}
            {!isComplete && <ArrowRight className="h-4 w-4" />}
          </button>
          <div className="w-56">
            <Progress value={dayPct} className="h-1.5" />
            <p className="mt-1 text-right text-[10.5px] text-muted-foreground">{dayPct}% complete · {completedCount}/{day.modules.length}</p>
          </div>
        </div>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        {/* Modules in order */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Modules in order</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">What you'll do today</h2>
          <ol className="mt-5 space-y-3">
            {day.modules.map((m, idx) => {
              const st = moduleStatus(m.id);
              const done = st === "completed";
              const active = st === "in_progress" || st === "overdue";
              const resCount = moduleResourceCount(m);
              return (
                <li key={m.id}>
                  <div
                    aria-disabled="true"
                    className="flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-5"
                  >
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[12px] font-semibold ${done ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : active ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" : "bg-muted text-muted-foreground"}`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[14.5px] font-semibold tracking-tight">{m.title}</h3>
                        <Badge variant="outline" className="text-[10px]">{m.type}</Badge>
                        {m.required && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-700">Required</Badge>}
                        {done && <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-700">Completed</Badge>}
                      </div>
                      <p className="mt-1 text-[12.5px] text-muted-foreground line-clamp-2">{m.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{m.estimatedMinutes} min</span>
                        {resCount > 0 && (
                          <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />{resCount} resource{resCount === 1 ? "" : "s"}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Completion expectations */}
          <div className="mt-8 rounded-2xl border border-border/70 bg-muted/30 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Completion expectations</p>
            <ul className="mt-2 space-y-1.5 text-[13px] text-foreground/90">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" /> Open every module in this day, in order.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" /> Mark each module complete once you've read the SOP and watched any walkthrough.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" /> Complete the checklist and any knowledge check inside each module.</li>
              {day.requiredCount > 0 && (
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-amber-600" /> {day.requiredCount} module{day.requiredCount === 1 ? "" : "s"} in this day are required to advance.</li>
              )}
            </ul>
          </div>
        </section>

        {/* Right rail: resources */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex items-center gap-2">
              <Library className="h-4 w-4 text-sky-700" />
              <h3 className="text-[13px] font-semibold">Day resources</h3>
            </div>
            {dayResources.length === 0 ? (
              <p className="mt-3 text-[12px] text-muted-foreground">Resources for this day live inside each module and the Resource Library.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {dayResources.map((r) => {
                  const pending = !r.url || r.url === "#";
                  return (
                    <li key={`${r.moduleId}-${r.id}`}>
                      {pending ? (
                        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-[12px] text-muted-foreground">
                          <p className="font-medium">{r.title}</p>
                          <p className="text-[10.5px]">Resource pending</p>
                        </div>
                      ) : (
                        <a href={r.url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-[12px] hover:border-primary/40 hover:bg-muted/40">
                          <span className="min-w-0 flex-1 truncate"><span className="font-medium">{r.title}</span><br /><span className="text-[10.5px] text-muted-foreground">{r.moduleTitle}</span></span>
                          <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <Link to="/hr/resources" className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
              <BookOpen className="h-3.5 w-3.5" /> Open Resource Library <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}