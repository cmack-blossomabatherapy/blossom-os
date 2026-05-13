import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Clock, PlayCircle, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { ONBOARDING_PHASES, modulesForPath, type JourneyPhase } from "@/lib/onboarding/journey";
import { usePhaseWithOverrides } from "@/hooks/useJourneyOverrides";
import { markModuleComplete, unmarkModule, setNote } from "@/lib/onboarding/storage";
import { LeaderCard } from "./LeaderCard";
import { SystemTrainingCard } from "./SystemTrainingCard";
import { ShadowingCard } from "./ShadowingCard";
import { CheckInTracker } from "./CheckInTracker";
import { OutcomeCard } from "./OutcomeCard";
import { ActionChecklist } from "./ActionChecklist";
import { VideoIntroCard } from "./VideoIntroCard";
import { trackJourneyEvent } from "@/lib/analytics/journey";

interface Props { phaseId: JourneyPhase["id"]; }

export function PhasePage({ phaseId }: Props) {
  const status = useOnboardingStatus();
  // Bump to force re-read of acknowledgement-backed shadowing & checklist state.
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const { phase } = usePhaseWithOverrides(phaseId);
  const location = useLocation();
  const didScrollRef = useRef(false);
  useEffect(() => {
    trackJourneyEvent({
      type: "phase_view",
      phaseId,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
  }, [phaseId]);
  const mods = modulesForPath(phase, status.path);
  const doneCount = mods.filter((m) => status.modulesComplete.includes(m.key)).length;
  const percent = mods.length === 0 ? 0 : Math.round((doneCount / mods.length) * 100);
  const Icon = phase.icon;

  const idx = ONBOARDING_PHASES.findIndex((p) => p.id === phase.id);
  const next = ONBOARDING_PHASES[idx + 1];
  const prev = ONBOARDING_PHASES[idx - 1];

  // First incomplete module in *this* phase — used to mark the resume point.
  const firstIncompleteKey = useMemo(
    () => mods.find((m) => !status.modulesComplete.includes(m.key))?.key ?? null,
    [mods, status.modulesComplete],
  );

  // Resume on deep-link: once status has loaded and we know the first incomplete
  // module, scroll to it (or to the explicit `#mod-<key>` hash if present).
  useEffect(() => {
    if (status.loading) return;
    if (didScrollRef.current) return;
    if (mods.length === 0) return;
    const hash = location.hash?.replace(/^#/, "") || "";
    const targetKey = hash.startsWith("mod-")
      ? decodeURIComponent(hash.slice(4))
      : firstIncompleteKey;
    if (!targetKey) return;
    didScrollRef.current = true;
    // Wait one frame so the module list is painted.
    requestAnimationFrame(() => {
      const el = document.getElementById(`mod-${targetKey}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [status.loading, mods.length, firstIncompleteKey, location.hash]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
          <Link to="/onboarding"><ArrowLeft className="h-3.5 w-3.5" /> Journey</Link>
        </Button>
      </div>

      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary)/0.14),hsl(var(--accent)/0.08))] p-6 sm:p-10">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> {phase.weekLabel}
          </span>
          <div className="flex items-start gap-3">
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{phase.title}</h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{phase.objective}</p>
            </div>
          </div>
          <div className="space-y-1.5 max-w-md pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Phase progress</span>
              <span className="font-semibold text-foreground tabular-nums">{percent}% · {doneCount}/{mods.length}</span>
            </div>
            <Progress value={percent} className="h-2" />
          </div>
        </div>
      </header>

      <ol className="space-y-3">
        {mods.map((m, i) => {
          const ModIcon = m.icon;
          const done = status.modulesComplete.includes(m.key);
          const isResume = !done && m.key === firstIncompleteKey;
          const onComplete = () => markModuleComplete(m.key);
          const onUncheck = () => { unmarkModule(m.key); refresh(); };

          return (
            <li
              key={m.key}
              id={`mod-${m.key}`}
              className={cn(
                "scroll-mt-24 rounded-2xl border bg-card p-4 shadow-sm transition-all sm:p-5",
                done && "border-emerald-500/30",
                !done && isResume && "border-primary/50 ring-2 ring-primary/20",
                !done && !isResume && "border-border/60",
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold tabular-nums",
                  done ? "bg-emerald-500/15 text-emerald-600" : "bg-primary/10 text-primary",
                )}>
                  {done ? <Check className="h-5 w-5" /> : i + 1}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ModIcon className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground sm:text-base">{m.title}</p>
                    {done && <Badge variant="secondary" className="text-[10px]">Complete</Badge>}
                    {isResume && (
                      <Badge className="gap-1 text-[10px]">
                        <PlayCircle className="h-3 w-3" /> Resume here
                      </Badge>
                    )}
                    {m.pathOnly && <Badge variant="outline" className="text-[10px]">{m.pathOnly === "new_state" ? "New state" : "Existing state"}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground sm:text-sm">{m.blurb}</p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> ~{m.estMinutes} min
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {m.kind === "video" && (
                  <VideoIntroCard
                    moduleKey={m.key}
                    title={m.title}
                    description={m.blurb}
                    videoSrc={m.video?.url}
                    posterSrc={m.video?.poster}
                    duration={m.video?.duration}
                    presenter={m.video?.presenter}
                    done={done}
                    onComplete={onComplete}
                  />
                )}
                {m.kind === "leader" && m.leader && (
                  <LeaderCard {...m.leader} done={done} onComplete={onComplete} />
                )}
                {m.kind === "system" && m.system && (
                  <SystemTrainingCard name={m.system.name} blurb={m.blurb} videoLabel={m.system.videoLabel} sopLabel={m.system.sopLabel} tangoLabel={m.system.tangoLabel} done={done} onComplete={onComplete} />
                )}
                {m.kind === "shadowing" && m.shadowing && (
                  <ShadowingCard
                    moduleKey={m.key}
                    assignee={m.shadowing.assignee}
                    stages={m.shadowing.stages}
                    goals={m.shadowing.goals}
                    notes={status.notes}
                    done={done}
                    onNotesChange={(key, t) => { setNote(key, t); }}
                    onComplete={onComplete}
                    onChange={refresh}
                  />
                )}
                {m.kind === "checkin" && (
                  <CheckInTracker
                    who={m.key.includes("chad") ? "chad" : "shira"}
                    label={m.title}
                    cadence={m.key.includes("chad") ? "weekly" : "daily"}
                    cells={m.key.includes("chad") ? 4 : 7}
                    done={(m.key.includes("chad") ? status.checkins.chad : status.checkins.shira)}
                  />
                )}
                {m.actions && m.actions.length > 0 && (
                  <ActionChecklist
                    moduleKey={m.key}
                    actions={m.actions}
                    refreshTick={tick}
                    onAllComplete={() => { if (!done) onComplete(); refresh(); }}
                  />
                )}
                {(m.kind === "content" || m.kind === "department" || m.kind === "outcome") && !done && (
                  <Button size="sm" onClick={onComplete} className="gap-1.5">Mark complete</Button>
                )}
                {m.kind === "checkin" && !done && (
                  <Button size="sm" variant="outline" onClick={onComplete} className="gap-1.5">Mark cadence complete</Button>
                )}
                {done && (
                  <div className="flex items-center justify-end pt-1">
                    <Button size="sm" variant="ghost" onClick={onUncheck} className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground">
                      <RotateCcw className="h-3 w-3" /> Uncheck this step
                    </Button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {phase.outcome && (
        <OutcomeCard
          title={phase.outcome.title}
          bullets={phase.outcome.bullets}
          nextLabel={next ? `Continue to ${next.weekLabel}` : undefined}
          nextPath={next?.path}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {prev ? (
          <Button asChild variant="ghost" className="gap-1.5">
            <Link to={prev.path}><ArrowLeft className="h-4 w-4" /> {prev.weekLabel}: {prev.title}</Link>
          </Button>
        ) : <span />}
        {next && (
          <Button asChild className="gap-1.5">
            <Link to={next.path}>{next.weekLabel}: {next.title} <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        )}
      </div>
    </div>
  );
}