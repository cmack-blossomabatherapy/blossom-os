import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock, PlayCircle, FileText,
  ListChecks, BookOpen, ShieldCheck, Sparkles, Library, ExternalLink,
  Link2, Wand2, Copy, Map,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { parseAcademyModuleId } from "@/lib/academy/journeyContent";
import { RBT_PATHS, type RBTModule, type RBTPath, type RBTPhase, type RBTPathId } from "@/lib/training/rbtAcademy";
import { getRbtModuleContent } from "@/lib/training/rbtModuleContent";
import { BCBA_MODULES, type BCBAModule } from "@/lib/training/bcbaAcademy";
import { getIntakeDay, type IntakeDayModule } from "@/lib/training/intakeAcademy";
import { getRecruitingDay, type RecruitingDayModule } from "@/lib/training/recruitingAcademy";
import { getAuthorizationsDay, type AuthorizationsDayModule } from "@/lib/training/authorizationsAcademy";
import { getSchedulingDay, type SchedulingDayModule } from "@/lib/training/schedulingAcademy";
import { getStaffingDay, type StaffingDayModule } from "@/lib/training/staffingAcademy";
import { getHrDay, type HrDayModule } from "@/lib/training/hrAcademy";
import { getCredentialingDay, type CredentialingDayModule } from "@/lib/training/credentialingAcademy";
import { getQaDay, type QaDayModule } from "@/lib/training/qaAcademy";
import { getCaseManagerDay, type CaseManagerDayModule } from "@/lib/training/caseManagerAcademy";
import { getBehavioralSupportDay, type BehavioralSupportDayModule } from "@/lib/training/behavioralSupportAcademy";
import { getAssistantStateDirectorDay, type AssistantStateDirectorDayModule } from "@/lib/training/assistantStateDirectorAcademy";
import { getStateDirectorDay, type StateDirectorDayModule } from "@/lib/training/stateDirectorAcademy";
import {
  useRuntimeRecord, startRuntime, tickRuntime, completeRuntime, persistRuntimeElapsed,
  type RuntimeContext,
} from "@/lib/academy/runtimeStore";
import { getAcademyResourcesForScope } from "@/lib/academy/resourceResolver";
import { getTrainingPath } from "@/lib/academy/trainingPaths";

/**
 * Unified academy module runtime for /academy/path/:slug/module/:moduleId.
 * Handles RBT and BCBA module ids (academyData modules continue to use
 * /training/:id, but if one lands here we redirect to that legacy runtime).
 *
 * Progress, timer, and completion are persisted through the runtimeStore
 * which uses `public.academy_runtime_progress` in Supabase as the source
 * of truth (local cache is a UI fallback only).
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
    if (parsed.kind === "intake") return resolveIntake(parsed.sourceModuleId);
    if (parsed.kind === "recruiting") return resolveRecruiting(parsed.sourceModuleId);
    if (parsed.kind === "authorizations") return resolveAuthorizations(parsed.sourceModuleId);
    if (parsed.kind === "scheduling") return resolveScheduling(parsed.sourceModuleId);
    if (parsed.kind === "staffing") return resolveStaffing(parsed.sourceModuleId);
    if (parsed.kind === "hr") return resolveHr(parsed.sourceModuleId);
    if (parsed.kind === "credentialing") return resolveCredentialing(parsed.sourceModuleId);
    if (parsed.kind === "qa") return resolveQa(parsed.sourceModuleId);
    if (parsed.kind === "case-manager") return resolveCaseManager(parsed.sourceModuleId);
    if (parsed.kind === "behavioral-support") return resolveBehavioralSupport(parsed.sourceModuleId);
    if (parsed.kind === "assistant-state-director") return resolveAssistantStateDirector(parsed.sourceModuleId);
    if (parsed.kind === "state-director") return resolveStateDirector(parsed.sourceModuleId);
    return null;
  }, [parsed.kind, parsed.sourceModuleId]);

  const runtimeCtx: RuntimeContext = useMemo(() => ({
    journeySlug: slug,
    trackId: slug === "rbt" ? (rbtTrackId ?? "not_certified") : null,
    sourceModuleId: parsed.sourceModuleId,
    sourceKind: parsed.kind === "rbt" || parsed.kind === "bcba" ? parsed.kind : undefined,
  }), [slug, rbtTrackId, parsed.kind, parsed.sourceModuleId]);
  const record = useRuntimeRecord(decodedId, runtimeCtx);
  const tickRef = useRef<number | null>(null);
  const persistRef = useRef<number>(0);
  const autostart = params.get("autostart") === "1";
  const autostartedRef = useRef(false);

  // If the learner arrived via "Start day" (or any deep link with ?autostart=1)
  // and the module hasn't been completed, begin the runtime immediately so the
  // timer starts ticking without a second click. Guarded so we only fire once
  // per mount and never overwrite a completed module.
  useEffect(() => {
    if (!autostart || autostartedRef.current) return;
    autostartedRef.current = true;
    if (record.status === "not_started") {
      void startRuntime(decodedId, runtimeCtx);
    }
  }, [autostart, record.status, decodedId, runtimeCtx]);

  useEffect(() => {
    if (record.status !== "in_progress") {
      if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }
    tickRef.current = window.setInterval(() => {
      tickRuntime(decodedId, 1, runtimeCtx);
      persistRef.current += 1;
      // Persist elapsed to Supabase every 12s to avoid one write per tick.
      if (persistRef.current >= 12) {
        persistRef.current = 0;
        void persistRuntimeElapsed(decodedId, runtimeCtx);
      }
    }, 1000);
    return () => {
      if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
      // Persist any remaining elapsed time on unmount.
      void persistRuntimeElapsed(decodedId, runtimeCtx);
    };
  }, [record.status, decodedId, runtimeCtx]);

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
    rbtTrackId: slug === "rbt" ? (rbtTrackId ?? "not_certified") : undefined,
  });

  const rbtTrack: RBTPath | undefined = parsed.kind === "rbt"
    ? RBT_PATHS.find((p) => p.id === (rbtTrackId ?? "not_certified"))
    : undefined;
  const rbtPhase: RBTPhase | undefined = rbtTrack?.phases.find((ph) =>
    ph.modules.some((mm) => mm.id === parsed.sourceModuleId),
  );
  const rbtModuleRequired = !!rbtPhase?.modules.find((mm) => mm.id === parsed.sourceModuleId)?.required;

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
          {parsed.kind === "rbt" && rbtTrack && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">
                Track · {rbtTrack.label}
              </Badge>
              {rbtPhase && (
                <Badge variant="outline" className="text-[10px]">{rbtPhase.title}</Badge>
              )}
              {rbtModuleRequired && (
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-700">
                  Required for readiness
                </Badge>
              )}
            </div>
          )}
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
            <button onClick={() => { void startRuntime(decodedId, runtimeCtx); }} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 h-11 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90">
              <PlayCircle className="h-4 w-4" /> Start module
            </button>
          )}
          {status === "in_progress" && (
            <button onClick={() => { void completeRuntime(decodedId, runtimeCtx); }} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 h-11 text-sm font-medium text-white shadow-sm transition hover:opacity-90">
              <CheckCircle2 className="h-4 w-4" /> Mark complete
            </button>
          )}
          {status === "completed" && (
            <button onClick={() => { void startRuntime(decodedId, runtimeCtx); }} className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 h-11 text-sm font-medium transition hover:bg-muted">
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

          {ctx.trainerNotes && (
            <Card title="Trainer notes" icon={ShieldCheck}>
              <p className="text-[13px] text-foreground/90">{ctx.trainerNotes}</p>
            </Card>
          )}

          {ctx.reflectionPrompt && (
            <Card title="Reflection prompt" icon={BookOpen}>
              <p className="text-[13px] text-foreground/90">{ctx.reflectionPrompt}</p>
            </Card>
          )}

          {ctx.signoffRequired && (
            <Card title="Signoff required" icon={ShieldCheck}>
              <p className="text-[13px] text-foreground/90">{ctx.signoffRequired}</p>
            </Card>
          )}

          {ctx.sopLinks && ctx.sopLinks.length > 0 && (
            <Card title="SOPs and references" icon={Link2}>
              <ul className="space-y-2 text-[13px]">
                {ctx.sopLinks.map((s, i) => {
                  const external = /^https?:\/\//i.test(s.href);
                  const inner = (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-3 py-2 hover:border-primary/40 hover:bg-muted/40">
                      <span className="min-w-0 truncate font-medium">{s.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </div>
                  );
                  return (
                    <li key={i}>
                      {external ? (
                        <a href={s.href} target="_blank" rel="noreferrer">{inner}</a>
                      ) : (
                        <Link to={s.href}>{inner}</Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {ctx.tangos && ctx.tangos.length > 0 && (
            <Card title="Tango walkthroughs" icon={Map}>
              <ul className="space-y-2 text-[13px]">
                {ctx.tangos.map((t, i) => (
                  <li key={i} className="rounded-lg border border-border/60 bg-card px-3 py-2">
                    <p className="font-medium">{t.label}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{t.note}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {ctx.aiPrompts && ctx.aiPrompts.length > 0 && (
            <Card title="Ask Blossom AI prompts" icon={Wand2}>
              <ul className="space-y-2 text-[13px]">
                {ctx.aiPrompts.map((p, i) => (
                  <li key={i} className="group flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                    <code className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-[12px] text-foreground/90">{p}</code>
                    <button
                      type="button"
                      onClick={() => { try { navigator.clipboard?.writeText(p); } catch { /* ignore */ } }}
                      title="Copy prompt"
                      className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card px-2 py-1 text-[11px] text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-muted"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </li>
                ))}
              </ul>
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

          {rbtTrack && rbtTrack.signoffs.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                <h3 className="text-[13px] font-semibold">Readiness requirements</h3>
              </div>
              <p className="mt-1 text-[11.5px] text-muted-foreground">{rbtTrack.label}</p>
              <ul className="mt-3 space-y-1.5 text-[12px]">
                {rbtTrack.signoffs.map((s) => (
                  <li key={s.id} className="flex items-start gap-2">
                    <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 ${s.status === "signed" ? "text-emerald-600" : "text-muted-foreground"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{s.label}</span>
                      <br />
                      <span className="text-[10.5px] text-muted-foreground">{s.owner} · {s.required ? "required" : "optional"} · {s.status}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
  sopLinks?: { label: string; href: string }[];
  tangos?: { label: string; note: string }[];
  aiPrompts?: string[];
  trainerNotes?: string;
  reflectionPrompt?: string;
  signoffRequired?: string;
}

function resolveRbt(sourceModuleId: string): ModuleCtx | null {
  for (const path of RBT_PATHS) {
    for (const phase of path.phases) {
      const m: RBTModule | undefined = phase.modules.find((mm) => mm.id === sourceModuleId);
      if (m) {
        const content = getRbtModuleContent(sourceModuleId);
        const branchingChecklist = m.branching
          ? m.branching.branches.map((b) => `${b.condition} → ${b.assigns.join(", ")}`)
          : undefined;
        return {
          title: m.title,
          description: m.summary,
          type: m.type,
          minutes: m.minutes,
          required: !!m.required,
          objectives: content?.objectives ?? [
            `Complete: ${m.title}`,
            `Confirm with your ${path.id === "not_certified" ? "Lead RBT Trainer" : "trainer"} before moving on.`,
          ],
          lessons: content?.lessons,
          checklist: content?.checklist ?? branchingChecklist,
          shadowing: content?.shadowing,
          knowledgeCheck: content?.knowledgeCheck,
          trainerNotes: content?.trainerNotes,
          reflectionPrompt: content?.reflectionPrompt,
          signoffRequired: content?.signoffRequired,
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
    sopLinks: m.sopLinks,
    tangos: m.tangos,
    aiPrompts: m.aiPrompts,
  };
}

function resolveIntake(sourceModuleId: string): ModuleCtx | null {
  const d: IntakeDayModule | undefined = getIntakeDay(sourceModuleId);
  if (!d) return null;
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  const checklist = [
    ...d.checklist,
    ...d.livePractice.map((p) => `Live practice: ${p}`),
  ];
  return {
    title: d.title,
    description: d.description,
    type: `Week ${d.weekNumber} · Day ${d.dayNumber}`,
    minutes,
    required: true,
    objectives: d.objectives,
    lessons: d.lessons.map((l) => ({ title: l.title, summary: l.summary, kind: l.kind, minutes: l.minutes })),
    checklist,
    shadowing: d.shadowing,
    knowledgeCheck: d.knowledgeCheck,
    sopLinks: d.resources.map((r) => ({
      label: r.pending ? `${r.label} (pending upload)` : r.label,
      href: r.href,
    })),
    trainerNotes: d.trainerNotes,
    reflectionPrompt: d.reflectionPrompt,
    signoffRequired: d.signoffRequired,
  };
}

function resolveRecruiting(sourceModuleId: string): ModuleCtx | null {
  const d: RecruitingDayModule | undefined = getRecruitingDay(sourceModuleId);
  if (!d) return null;
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  const checklist = [
    ...d.checklist,
    ...d.livePractice.map((p) => `Live practice: ${p}`),
  ];
  return {
    title: d.title,
    description: d.description,
    type: `Week ${d.weekNumber} · Day ${d.dayNumber}`,
    minutes,
    required: true,
    objectives: d.objectives,
    lessons: d.lessons.map((l) => ({ title: l.title, summary: l.summary, kind: l.kind, minutes: l.minutes })),
    checklist,
    shadowing: d.shadowing,
    knowledgeCheck: d.knowledgeCheck,
    sopLinks: d.resources.map((r) => ({
      label: r.pending ? `${r.label} (pending upload)` : r.label,
      href: r.href,
    })),
    trainerNotes: d.trainerNotes,
    reflectionPrompt: d.reflectionPrompt,
    signoffRequired: d.signoffRequired,
  };
}

function resolveAuthorizations(sourceModuleId: string): ModuleCtx | null {
  const d: AuthorizationsDayModule | undefined = getAuthorizationsDay(sourceModuleId);
  if (!d) return null;
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  const checklist = [
    ...d.checklist,
    ...d.livePractice.map((p) => `Live practice: ${p}`),
  ];
  return {
    title: d.title,
    description: d.description,
    type: `Week ${d.weekNumber} · Day ${d.dayNumber}`,
    minutes,
    required: true,
    objectives: d.objectives,
    lessons: d.lessons.map((l) => ({ title: l.title, summary: l.summary, kind: l.kind, minutes: l.minutes })),
    checklist,
    shadowing: d.shadowing,
    knowledgeCheck: d.knowledgeCheck,
    sopLinks: d.resources.map((r) => ({
      label: r.pending ? `${r.label} (pending upload)` : r.label,
      href: r.href,
    })),
    trainerNotes: d.trainerNotes,
    reflectionPrompt: d.reflectionPrompt,
    signoffRequired: d.signoffRequired,
  };
}

function resolveScheduling(sourceModuleId: string): ModuleCtx | null {
  const d: SchedulingDayModule | undefined = getSchedulingDay(sourceModuleId);
  if (!d) return null;
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  const checklist = [
    ...d.checklist,
    ...d.livePractice.map((p) => `Live practice: ${p}`),
  ];
  return {
    title: d.title,
    description: d.description,
    type: `Week ${d.weekNumber} · Day ${d.dayNumber}`,
    minutes,
    required: true,
    objectives: d.objectives,
    lessons: d.lessons.map((l) => ({ title: l.title, summary: l.summary, kind: l.kind, minutes: l.minutes })),
    checklist,
    shadowing: d.shadowing,
    knowledgeCheck: d.knowledgeCheck,
    sopLinks: d.resources.map((r) => ({
      label: r.pending ? `${r.label} (pending upload)` : r.label,
      href: r.href,
    })),
    trainerNotes: d.trainerNotes,
    reflectionPrompt: d.reflectionPrompt,
    signoffRequired: d.signoffRequired,
  };
}

function resolveStaffing(sourceModuleId: string): ModuleCtx | null {
  const d: StaffingDayModule | undefined = getStaffingDay(sourceModuleId);
  if (!d) return null;
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  const checklist = [
    ...d.checklist,
    ...d.livePractice.map((p) => `Live practice: ${p}`),
  ];
  return {
    title: d.title,
    description: d.description,
    type: `Week ${d.weekNumber} · Day ${d.dayNumber}`,
    minutes,
    required: true,
    objectives: d.objectives,
    lessons: d.lessons.map((l) => ({ title: l.title, summary: l.summary, kind: l.kind, minutes: l.minutes })),
    checklist,
    shadowing: d.shadowing,
    knowledgeCheck: d.knowledgeCheck,
    sopLinks: d.resources.map((r) => ({
      label: r.pending ? `${r.label} (pending upload)` : r.label,
      href: r.href,
    })),
    trainerNotes: d.trainerNotes,
    reflectionPrompt: d.reflectionPrompt,
    signoffRequired: d.signoffRequired,
  };
}

function resolveHr(sourceModuleId: string): ModuleCtx | null {
  const d: HrDayModule | undefined = getHrDay(sourceModuleId);
  if (!d) return null;
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  const checklist = [
    ...d.checklist,
    ...d.livePractice.map((p) => `Live practice: ${p}`),
  ];
  return {
    title: d.title,
    description: d.description,
    type: `Week ${d.weekNumber} · Day ${d.dayNumber}`,
    minutes,
    required: true,
    objectives: d.objectives,
    lessons: d.lessons.map((l) => ({ title: l.title, summary: l.summary, kind: l.kind, minutes: l.minutes })),
    checklist,
    shadowing: d.shadowing,
    knowledgeCheck: d.knowledgeCheck,
    sopLinks: d.resources.map((r) => ({
      label: r.pending ? `${r.label} (pending upload)` : r.label,
      href: r.href,
    })),
    trainerNotes: d.trainerNotes,
    reflectionPrompt: d.reflectionPrompt,
    signoffRequired: d.signoffRequired,
  };
}

function resolveCredentialing(sourceModuleId: string): ModuleCtx | null {
  const d: CredentialingDayModule | undefined = getCredentialingDay(sourceModuleId);
  if (!d) return null;
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  const checklist = [
    ...d.checklist,
    ...d.livePractice.map((p) => `Live practice: ${p}`),
  ];
  return {
    title: d.title,
    description: d.description,
    type: `Week ${d.weekNumber} · Day ${d.dayNumber}`,
    minutes,
    required: true,
    objectives: d.objectives,
    lessons: d.lessons.map((l) => ({ title: l.title, summary: l.summary, kind: l.kind, minutes: l.minutes })),
    checklist,
    shadowing: d.shadowing,
    knowledgeCheck: d.knowledgeCheck,
    sopLinks: d.resources.map((r) => ({
      label: r.pending ? `${r.label} (pending upload)` : r.label,
      href: r.href,
    })),
    trainerNotes: d.trainerNotes,
    reflectionPrompt: d.reflectionPrompt,
    signoffRequired: d.signoffRequired,
  };
}

function resolveQa(sourceModuleId: string): ModuleCtx | null {
  const d: QaDayModule | undefined = getQaDay(sourceModuleId);
  if (!d) return null;
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  const checklist = [
    ...d.checklist,
    ...d.livePractice.map((p) => `Live practice: ${p}`),
  ];
  return {
    title: d.title,
    description: d.description,
    type: `Week ${d.weekNumber} · Day ${d.dayNumber}`,
    minutes,
    required: true,
    objectives: d.objectives,
    lessons: d.lessons.map((l) => ({ title: l.title, summary: l.summary, kind: l.kind, minutes: l.minutes })),
    checklist,
    shadowing: d.shadowing,
    knowledgeCheck: d.knowledgeCheck,
    sopLinks: d.resources.map((r) => ({
      label: r.pending ? `${r.label} (pending upload)` : r.label,
      href: r.href,
    })),
    trainerNotes: d.trainerNotes,
    reflectionPrompt: d.reflectionPrompt,
    signoffRequired: d.signoffRequired,
  };
}

function resolveCaseManager(sourceModuleId: string): ModuleCtx | null {
  const d: CaseManagerDayModule | undefined = getCaseManagerDay(sourceModuleId);
  if (!d) return null;
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  const checklist = [
    ...d.checklist,
    ...d.livePractice.map((p) => `Live practice: ${p}`),
  ];
  return {
    title: d.title,
    description: d.description,
    type: `Week ${d.weekNumber} · Day ${d.dayNumber}`,
    minutes,
    required: true,
    objectives: d.objectives,
    lessons: d.lessons.map((l) => ({ title: l.title, summary: l.summary, kind: l.kind, minutes: l.minutes })),
    checklist,
    shadowing: d.shadowing,
    knowledgeCheck: d.knowledgeCheck,
    sopLinks: d.resources.map((r) => ({
      label: r.pending ? `${r.label} (pending upload)` : r.label,
      href: r.href,
    })),
    trainerNotes: d.trainerNotes,
    reflectionPrompt: d.reflectionPrompt,
    signoffRequired: d.signoffRequired,
  };
}

function resolveBehavioralSupport(sourceModuleId: string): ModuleCtx | null {
  const d: BehavioralSupportDayModule | undefined = getBehavioralSupportDay(sourceModuleId);
  if (!d) return null;
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  const checklist = [
    ...d.checklist,
    ...d.livePractice.map((p) => `Live practice: ${p}`),
  ];
  return {
    title: d.title,
    description: d.description,
    type: `Week ${d.weekNumber} · Day ${d.dayNumber}`,
    minutes,
    required: true,
    objectives: d.objectives,
    lessons: d.lessons.map((l) => ({ title: l.title, summary: l.summary, kind: l.kind, minutes: l.minutes })),
    checklist,
    shadowing: d.shadowing,
    knowledgeCheck: d.knowledgeCheck,
    sopLinks: d.resources.map((r) => ({
      label: r.pending ? `${r.label} (pending upload)` : r.label,
      href: r.href,
    })),
    trainerNotes: d.trainerNotes,
    reflectionPrompt: d.reflectionPrompt,
    signoffRequired: d.signoffRequired,
  };
}

function resolveAssistantStateDirector(sourceModuleId: string): ModuleCtx | null {
  const d: AssistantStateDirectorDayModule | undefined = getAssistantStateDirectorDay(sourceModuleId);
  if (!d) return null;
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  const checklist = [
    ...d.checklist,
    ...d.livePractice.map((p) => `Live practice: ${p}`),
  ];
  return {
    title: d.title,
    description: d.description,
    type: `Week ${d.weekNumber} · Day ${d.dayNumber}`,
    minutes,
    required: true,
    objectives: d.objectives,
    lessons: d.lessons.map((l) => ({ title: l.title, summary: l.summary, kind: l.kind, minutes: l.minutes })),
    checklist,
    shadowing: d.shadowing,
    knowledgeCheck: d.knowledgeCheck,
    sopLinks: d.resources.map((r) => ({
      label: r.pending ? `${r.label} (pending upload)` : r.label,
      href: r.href,
    })),
    trainerNotes: d.trainerNotes,
    reflectionPrompt: d.reflectionPrompt,
    signoffRequired: d.signoffRequired,
  };
}

function resolveStateDirector(sourceModuleId: string): ModuleCtx | null {
  const d: StateDirectorDayModule | undefined = getStateDirectorDay(sourceModuleId);
  if (!d) return null;
  const minutes = d.lessons.reduce((s, l) => s + l.minutes, 0);
  const checklist = [
    ...d.checklist,
    ...d.livePractice.map((p) => `Live practice: ${p}`),
  ];
  return {
    title: d.title,
    description: d.description,
    type: `Week ${d.weekNumber} · Day ${d.dayNumber}`,
    minutes,
    required: true,
    objectives: d.objectives,
    lessons: d.lessons.map((l) => ({ title: l.title, summary: l.summary, kind: l.kind, minutes: l.minutes })),
    checklist,
    shadowing: d.shadowing,
    knowledgeCheck: d.knowledgeCheck,
    sopLinks: d.resources.map((r) => ({
      label: r.pending ? `${r.label} (pending upload)` : r.label,
      href: r.href,
    })),
    trainerNotes: d.trainerNotes,
    reflectionPrompt: d.reflectionPrompt,
    signoffRequired: d.signoffRequired,
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