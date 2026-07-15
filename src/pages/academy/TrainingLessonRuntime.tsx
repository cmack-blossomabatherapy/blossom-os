import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, Download,
  ListChecks, PlayCircle, Sparkles, ShieldCheck, Lightbulb, AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getTrainingPath } from "@/lib/academy/trainingPaths";
import {
  resolveModuleCtxFromDecodedId,
  type ModuleCtx,
} from "./TrainingModuleRuntime";
import {
  useLessonRecord, useLessonStatuses, startLesson, completeLesson,
} from "@/lib/academy/lessonProgress";
import { getLessonContent, getLessonShell, type LessonContent } from "@/lib/academy/lessonContent";
import { exportLessonToPdf } from "@/lib/academy/lessonPdfExport";
import { completeRuntime, useRuntimeRecord, type RuntimeContext } from "@/lib/academy/runtimeStore";
import { parseAcademyModuleId } from "@/lib/academy/journeyContent";
import type { RBTPathId } from "@/lib/training/rbtAcademy";

/**
 * Per-lesson runtime — /academy/path/:slug/module/:moduleId/lesson/:lessonId.
 *
 * Renders full lesson content (objective, why it matters, sections,
 * examples, common mistakes, practice, knowledge check, reflection,
 * checklist), tracks per-lesson progress in localStorage, and auto-
 * completes the parent module once every lesson is done.
 */
export default function TrainingLessonRuntime() {
  const { slug = "", moduleId = "", lessonId = "" } = useParams();
  const [params] = useSearchParams();
  const rbtTrackId = (params.get("track") as RBTPathId | null) ?? undefined;
  const trackSuffix = slug === "rbt" && rbtTrackId ? `?track=${rbtTrackId}` : "";
  const decodedModuleId = decodeURIComponent(moduleId);
  const decodedLessonId = decodeURIComponent(lessonId);

  const { ctx, kind, sourceModuleId } = useMemo(
    () => resolveModuleCtxFromDecodedId(decodedModuleId),
    [decodedModuleId],
  );
  const path = getTrainingPath(slug);

  if (!ctx || !path) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-sm text-muted-foreground">Lesson not found.</p>
        <Link to={`/academy/path/${slug}${trackSuffix}`} className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to journey
        </Link>
      </div>
    );
  }

  const lessonIndex = (ctx.lessons ?? []).findIndex((l) => l.id === decodedLessonId);
  const lesson = lessonIndex >= 0 ? ctx.lessons![lessonIndex] : null;

  if (!lesson) {
    return (
      <Navigate to={`/academy/path/${slug}/module/${encodeURIComponent(decodedModuleId)}${trackSuffix}`} replace />
    );
  }

  const record = useLessonRecord(decodedModuleId, decodedLessonId);
  const { statuses, completedCount, total } = useLessonStatuses(
    decodedModuleId,
    (ctx.lessons ?? []).map((l) => l.id),
  );

  // Auto-start lesson on mount so the learner never has to click twice.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // Always record the visit (updates last-seen and resume pointer); the
    // store no-ops the status change if the lesson is already in progress
    // or completed.
    startLesson(decodedModuleId, decodedLessonId, {
      journeySlug: slug,
      trackId: slug === "rbt" ? (rbtTrackId ?? "not_certified") : null,
      moduleTitle: ctx.title,
      lessonTitle: lesson.title,
    });
  }, [record.status, decodedModuleId, decodedLessonId, slug, rbtTrackId, ctx.title, lesson.title]);

  // When all lessons are completed, mark the parent module runtime complete.
  const runtimeCtx: RuntimeContext = useMemo(() => ({
    journeySlug: slug,
    trackId: slug === "rbt" ? (rbtTrackId ?? "not_certified") : null,
    sourceModuleId: sourceModuleId ?? decodedModuleId,
    sourceKind: kind === "rbt" || kind === "bcba" ? (kind as "rbt" | "bcba") : undefined,
  }), [slug, rbtTrackId, sourceModuleId, decodedModuleId, kind]);
  const moduleRecord = useRuntimeRecord(decodedModuleId, runtimeCtx);
  useEffect(() => {
    if (total > 0 && completedCount === total && moduleRecord.status !== "completed") {
      void completeRuntime(decodedModuleId, runtimeCtx);
    }
  }, [completedCount, total, moduleRecord.status, decodedModuleId, runtimeCtx]);

  const content: LessonContent = getLessonContent(decodedModuleId, decodedLessonId)
    ?? getLessonShell(lesson, ctx.title);

  const nextLesson = (ctx.lessons ?? [])[lessonIndex + 1];
  const prevLesson = (ctx.lessons ?? [])[lessonIndex - 1];
  const moduleHref = `/academy/path/${slug}/module/${encodeURIComponent(decodedModuleId)}${trackSuffix}`;

  const onComplete = () => {
    completeLesson(decodedModuleId, decodedLessonId, undefined, {
      journeySlug: slug,
      trackId: slug === "rbt" ? (rbtTrackId ?? "not_certified") : null,
      moduleTitle: ctx.title,
      lessonTitle: lesson.title,
    });
  };

  const isCompleted = record.status === "completed";

  const onExportPdf = () => {
    exportLessonToPdf(path.title, ctx.title, lesson, content);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10 md:px-10">
      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
        <Link to={`/academy/path/${slug}${trackSuffix}`} className="hover:text-foreground">
          {path.title}
        </Link>
        <span>/</span>
        <Link to={moduleHref} className="hover:text-foreground">
          {ctx.title}
        </Link>
        <span>/</span>
        <span className="text-foreground">Lesson {lessonIndex + 1}</span>
      </nav>

      <header className="mt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <Sparkles className="h-3 w-3" /> Lesson {lessonIndex + 1} of {total} · {lesson.kind}
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-[28px]">{lesson.title}</h1>
        <p className="mt-2 max-w-2xl text-[14px] text-muted-foreground">{lesson.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <Clock className="h-3 w-3" />~{lesson.minutes} min
          </span>
          {isCompleted && (
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-700">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
            </Badge>
          )}
          {!isCompleted && record.status === "in_progress" && (
            <Badge variant="outline" className="border-sky-300 bg-sky-50 text-[10px] text-sky-700">In progress</Badge>
          )}
          <button
            type="button"
            onClick={onExportPdf}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 h-7 text-[11px] font-medium text-foreground transition hover:bg-muted"
            title="Download this lesson as a PDF for offline review"
          >
            <Download className="h-3 w-3" /> Export PDF
          </button>
        </div>
        <Progress value={total ? Math.round((completedCount / total) * 100) : 0} className="mt-4 h-1.5" />
        <p className="mt-1 text-[11px] text-muted-foreground">Module progress · {completedCount}/{total} lessons</p>
      </header>

      <div className="mt-8 space-y-6">
        <LessonCard title="Objective" icon={BookOpen}>
          <p className="text-[14px] text-foreground/90">{content.objective}</p>
        </LessonCard>

        <LessonCard title="Why this matters" icon={Lightbulb}>
          <p className="text-[14px] text-foreground/90 whitespace-pre-wrap">{content.whyItMatters}</p>
        </LessonCard>

        {content.sections.map((s, i) => (
          <LessonCard key={i} title={s.heading} icon={PlayCircle}>
            <p className="text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap">{s.body}</p>
          </LessonCard>
        ))}

        {content.examples && content.examples.length > 0 && (
          <LessonCard title="Examples" icon={Sparkles}>
            <div className="space-y-4">
              {content.examples.map((ex, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-muted/40 p-4">
                  <p className="text-[12.5px] font-semibold text-foreground">{ex.heading}</p>
                  <p className="mt-1 text-[13.5px] text-foreground/90 whitespace-pre-wrap">{ex.body}</p>
                </div>
              ))}
            </div>
          </LessonCard>
        )}

        {content.commonMistakes && content.commonMistakes.length > 0 && (
          <LessonCard title="Common mistakes to avoid" icon={AlertTriangle}>
            <ul className="space-y-1.5 text-[13.5px] text-foreground/90">
              {content.commonMistakes.map((m, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-amber-600" /> {m}
                </li>
              ))}
            </ul>
          </LessonCard>
        )}

        {content.practiceActivity && (
          <LessonCard title="Practice activity" icon={ListChecks}>
            <p className="text-[14px] font-medium text-foreground">{content.practiceActivity.prompt}</p>
            {content.practiceActivity.guidance && (
              <p className="mt-2 text-[13px] text-muted-foreground">{content.practiceActivity.guidance}</p>
            )}
          </LessonCard>
        )}

        {content.knowledgeCheck && content.knowledgeCheck.length > 0 && (
          <KnowledgeCheckCard questions={content.knowledgeCheck} />
        )}

        {content.reflectionPrompt && (
          <LessonCard title="Reflection" icon={BookOpen}>
            <p className="text-[14px] text-foreground/90">{content.reflectionPrompt}</p>
          </LessonCard>
        )}

        {content.checklist && content.checklist.length > 0 && (
          <LessonCard title="Checklist" icon={ShieldCheck}>
            <ul className="space-y-1.5 text-[13.5px] text-foreground/90">
              {content.checklist.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" /> {c}
                </li>
              ))}
            </ul>
          </LessonCard>
        )}
      </div>

      {/* Footer nav */}
      <div className="mt-10 flex flex-col-reverse items-stretch gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {prevLesson ? (
            <Link
              to={`/academy/path/${slug}/module/${encodeURIComponent(decodedModuleId)}/lesson/${encodeURIComponent(prevLesson.id)}${trackSuffix}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 h-10 text-[13px] font-medium transition hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </Link>
          ) : (
            <Link to={moduleHref} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 h-10 text-[13px] font-medium transition hover:bg-muted">
              <ArrowLeft className="h-4 w-4" /> Back to module
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isCompleted ? (
            <button
              onClick={onComplete}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 h-11 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            >
              <CheckCircle2 className="h-4 w-4" /> Mark lesson complete
            </button>
          ) : (
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Lesson complete
            </Badge>
          )}
          {nextLesson ? (
            <Link
              to={`/academy/path/${slug}/module/${encodeURIComponent(decodedModuleId)}/lesson/${encodeURIComponent(nextLesson.id)}${trackSuffix}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 h-11 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Next lesson <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              to={moduleHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 h-11 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Finish module <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function LessonCard({ title, icon: Icon, children }: { title: string; icon: typeof BookOpen; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 md:p-6">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-[14px] font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function KnowledgeCheckCard({ questions }: { questions: NonNullable<LessonContent["knowledgeCheck"]> }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState(false);
  const total = questions.length;
  const correct = questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0);
  return (
    <LessonCard title="Knowledge check" icon={ListChecks}>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <p className="text-[13.5px] font-medium text-foreground">{i + 1}. {q.q}</p>
            <div className="mt-2 space-y-1.5">
              {q.options.map((opt, oi) => {
                const selected = answers[i] === oi;
                const isCorrect = revealed && oi === q.answer;
                const isWrong = revealed && selected && oi !== q.answer;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-[13px] transition ${
                      isCorrect
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : isWrong
                        ? "border-rose-300 bg-rose-50 text-rose-800"
                        : selected
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setRevealed(true)}
            disabled={Object.keys(answers).length < total}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 h-9 text-[13px] font-medium text-background transition hover:opacity-90 disabled:opacity-40"
          >
            Check answers
          </button>
          {revealed && (
            <p className="text-[12.5px] text-muted-foreground">
              Score: <span className="font-semibold text-foreground">{correct}/{total}</span>
            </p>
          )}
        </div>
      </div>
    </LessonCard>
  );
}