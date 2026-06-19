import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock, PlayCircle, FileText,
  ListChecks, BookOpen, ShieldCheck, Sparkles, Library, ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { parseAcademyModuleId } from "@/lib/academy/journeyContent";
import { RBT_PATHS, type RBTModule, type RBTPathId } from "@/lib/training/rbtAcademy";
import { BCBA_MODULES, type BCBAModule } from "@/lib/training/bcbaAcademy";
import {
  useRuntimeRecord, startRuntime, tickRuntime, completeRuntime,
} from "@/lib/academy/runtimeStore";
import { getAcademyResourcesForScope } from "@/lib/academy/resourceResolver";
import { getTrainingPath } from "@/lib/academy/trainingPaths";

/**
 * Unified academy module runtime for /academy/path/:slug/module/:moduleId.
 * Handles RBT and BCBA module ids (academyData modules continue to use
 * /training/:id, but if one lands here we redirect to that legacy runtime).
 *
 * Progress, timer, and completion are stored in localStorage via the
 * runtimeStore — a temporary client-side training progress bridge until
 * Supabase persistence is wired for these sources.
 */
export default function TrainingModuleRuntime() {
  const { slug = "", moduleId = "" } = useParams();
  const [params] = useSearchParams();
  const rbtTrackId = (params.get("track") as RBTPathId | null) ?? undefined;
  const trackSuffix = slug === "rbt" && rbtTrackId ? `?track=${rbtTrackId}` : "";
  const decodedId = decodeURIComponent(moduleId);
  const parsed = parseAcademyModuleId(decodedId);

  // academyData modules belong on the legacy runtime.
  if (parsed.kind === "academyData") {
    return <Navigate to={`/training/${parsed.sourceModuleId}`} replace />;
  }

  const path = getTrainingPath(slug);
  const ctx = useMemo(() => {
    if (parsed.kind === "rbt") return resolveRbt(parsed.sourceModuleId);
    if (parsed.kind === "bcba") return resolveBcba(parsed.sourceModuleId);
    return null;
  }, [parsed.kind, parsed.sourceModuleId]);

  const record = useRuntimeRecord(decodedId);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (record.status !== "in_progress") {
      if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }
    tickRef.current = window.setInterval(() => tickRuntime(decodedId, 1), 1000);
    return () => {
      if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
    };
  }, [record.status, decodedId]);

  if (!ctx || !path) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-sm text-muted-foreground">Module not found.</p>
        <Link to={`/academy/path/${slug}${trackSuffix}`} className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to journey
        </Link>
      </div>
    );
  }

  const resources = getAcademyResourcesForScope({
    journeySlug: slug,
    moduleId: decodedId,
    sourceModuleId: parsed.sourceModuleId,
    sourceKind: parsed.kind,
  });

  const rbtTrack = parsed.kind === "rbt"
    ? RBT_PATHS.find((p) => p.id === (rbtTrackId ?? "not_certified"))
    : undefined;

  const elapsedLabel = formatElapsed(record.elapsedSeconds);
  const status = record.status;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 md:px-10">
      <Link to={`/academy/path/${slug}${trackSuffix}`} className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {path.title}
      </Link>

      <header className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> {parsed.kind.toUpperCase()} module · {ctx.type}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">{ctx.title}</h1>
          <p className="mt-2 max-w-2xl text-[14px] text-muted-foreground">{ctx.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Clock className="h-3 w-3" />~{ctx.minutes} min</span>
            {ctx.required && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-700">Required</Badge>}
            {status === "completed" && <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-700">Completed</Badge>}
            {status === "in_progress" && <Badge variant="outline" className="border-sky-300 bg-sky-50 text-[10px] text-sky-700">In progress · {elapsedLabel}</Badge>}
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 md:items-end">
          {status === "not_started" && (
            <button onClick={() => startRuntime(decodedId)} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 h-11 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90">
              <PlayCircle className="h-4 w-4" /> Start module
            </button>
          )}
          {status === "in_progress" && (
            <button onClick={() => completeRuntime(decodedId)} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 h-11 text-sm font-medium text-white shadow-sm transition hover:opacity-90">
              <CheckCircle2 className="h-4 w-4" /> Mark complete
            </button>
          )}
          {status === "completed" && (
            <button onClick={() => startRuntime(decodedId)} className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 h-11 text-sm font-medium transition hover:bg-muted">
              <ArrowRight className="h-4 w-4" /> Review again
            </button>
          )}
          <p className="text-right text-[11px] text-muted-foreground">Elapsed: {elapsedLabel}</p>
        </div>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <section className="space-y-6">
          {ctx.objectives && ctx.objectives.length > 0 && (
            <Card title="What you'll learn" icon={BookOpen}>
              <ul className="space-y-1.5 text-[13px] text-foreground/90">
                {ctx.objectives.map((o, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" /> {o}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {ctx.lessons && ctx.lessons.length > 0 && (
            <Card title="Lessons" icon={PlayCircle}>
              <ol className="space-y-2 text-[13px]">
                {ctx.lessons.map((l, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-card px-3 py-2">
                    <div className="min-w-0">
                      <p className="font-medium">{l.title}</p>
                      <p className="text-[12px] text-muted-foreground">{l.summary}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end text-[11px] text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{l.kind}</Badge>
                      <span className="mt-1"><Clock className="mr-1 inline h-3 w-3" />{l.minutes}m</span>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {ctx.checklist && ctx.checklist.length > 0 && (
            <Card title="Checklist" icon={ListChecks}>
              <ul className="space-y-1.5 text-[13px] text-foreground/90">
                {ctx.checklist.map((c, i) => (
                  <li key={i} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-sky-600" /> {c}</li>
                ))}
              </ul>
            </Card>
          )}

          {ctx.shadowing && ctx.shadowing.length > 0 && (
            <Card title="Shadowing expectations" icon={ShieldCheck}>
              <ul className="space-y-1.5 text-[13px] text-foreground/90">
                {ctx.shadowing.map((s, i) => (<li key={i}>• {s}</li>))}
              </ul>
            </Card>
          )}

          {ctx.knowledgeCheck && (
            <Card title="Knowledge check" icon={FileText}>
              <p className="text-[13px] font-medium">{ctx.knowledgeCheck.q}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">Expected: {ctx.knowledgeCheck.a}</p>
            </Card>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex items-center gap-2">
              <Library className="h-4 w-4 text-sky-700" />
              <h3 className="text-[13px] font-semibold">Resources</h3>
            </div>
            {resources.length === 0 ? (
              <p className="mt-3 text-[12px] text-muted-foreground">No resources attached yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {resources.map((r) => (
                  <li key={r.id}>
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-2 rounded-xl border border-border/60 px-3 py-2 text-[12px] hover:border-primary/40 hover:bg-muted/40">
                        <span className="min-w-0 flex-1 truncate">
                          <span className="font-medium">{r.title}</span>
                          {r.required && <span className="ml-1 text-amber-700">·required</span>}
                          {r.instructions && <><br /><span className="text-[10.5px] text-muted-foreground">{r.instructions}</span></>}
                        </span>
                        <span className="flex shrink-0 items-center gap-1"><Badge variant="outline" className="text-[10px]">{r.type}</Badge><ExternalLink className="h-3 w-3 text-muted-foreground" /></span>
                      </a>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-[12px] text-muted-foreground">
                        <span className="font-medium">{r.title}</span> <span className="text-[10.5px]">(pending)</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {record.startedAt && (
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-[11.5px] text-muted-foreground">
              <p>Started {new Date(record.startedAt).toLocaleString()}</p>
              {record.completedAt && <p>Completed {new Date(record.completedAt).toLocaleString()}</p>}
              <Progress value={status === "completed" ? 100 : status === "in_progress" ? 50 : 0} className="mt-2 h-1.5" />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* --------------------------- helpers --------------------------- */

interface ModuleCtx {
  title: string;
  description: string;
  type: string;
  minutes: number;
  required: boolean;
  objectives?: string[];
  lessons?: { title: string; summary: string; kind: string; minutes: number }[];
  checklist?: string[];
  shadowing?: string[];
  knowledgeCheck?: { q: string; a: string };
}

function resolveRbt(sourceModuleId: string): ModuleCtx | null {
  for (const path of RBT_PATHS) {
    for (const phase of path.phases) {
      const m: RBTModule | undefined = phase.modules.find((mm) => mm.id === sourceModuleId);
      if (m) {
        return {
          title: m.title,
          description: m.summary,
          type: m.type,
          minutes: m.minutes,
          required: !!m.required,
          objectives: [`Complete: ${m.title}`, `Confirm with your ${path.id === "not_certified" ? "Lead RBT Trainer" : "trainer"} before moving on.`],
          checklist: m.branching
            ? m.branching.branches.map((b) => `${b.condition} → ${b.assigns.join(", ")}`)
            : undefined,
        };
      }
    }
  }
  return null;
}

function resolveBcba(sourceModuleId: string): ModuleCtx | null {
  const m: BCBAModule | undefined = BCBA_MODULES.find((mm) => mm.id === sourceModuleId);
  if (!m) return null;
  return {
    title: m.title,
    description: m.subtitle,
    type: m.phase,
    minutes: m.lessons.reduce((s, l) => s + l.minutes, 0),
    required: true,
    objectives: m.objectives,
    lessons: m.lessons.map((l) => ({ title: l.title, summary: l.summary, kind: l.kind, minutes: l.minutes })),
    checklist: m.checklist,
    shadowing: m.shadowing,
    knowledgeCheck: m.knowledgeCheck,
  };
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof BookOpen; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-[13px] font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}