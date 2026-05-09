import { useMemo } from "react";
import { Check, Eye, Lock, ArrowRight, UserCheck, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { acknowledge, hasAcknowledged, unacknowledge } from "@/lib/onboarding/storage";

interface Stage {
  id: string;
  assignee: string;
  role: string;
  initials: string;
  days?: string;
  description?: string;
}

interface Props {
  /** Module key, used to namespace persisted goal/stage flags + notes. */
  moduleKey: string;
  /** Single-assignee fallback if `stages` isn't provided. */
  assignee?: string;
  stages?: Stage[];
  goals: string[];
  /** Notes map keyed by `${moduleKey}:${stageId}` (or `${moduleKey}` for single-stage). */
  notes: Record<string, string>;
  done: boolean;
  onNotesChange: (key: string, text: string) => void;
  onComplete: () => void;
  /** Force a UI refresh from the parent when ack toggles flip. */
  onChange?: () => void;
}

const goalKey = (m: string, i: number) => `${m}:goal:${i}`;
const stageKey = (m: string, sid: string) => `${m}:stage:${sid}`;

export function ShadowingCard({ moduleKey, assignee, stages, goals, notes, done, onNotesChange, onComplete, onChange }: Props) {
  // Derive checked goals + completed stages from acknowledgement storage so they persist + sync.
  const goalChecks = goals.map((_, i) => hasAcknowledged(goalKey(moduleKey, i)));
  const stageList: Stage[] = useMemo(
    () => stages && stages.length > 0
      ? stages
      : [{ id: "primary", assignee: assignee || "Assigned mentor", role: "Mentor", initials: (assignee || "M").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() }],
    [stages, assignee],
  );
  const stageChecks = stageList.map((s) => hasAcknowledged(stageKey(moduleKey, s.id)));

  const goalsDone = goalChecks.filter(Boolean).length;
  const stagesDone = stageChecks.filter(Boolean).length;
  const allGoals = goalsDone === goals.length && goals.length > 0;
  const allStages = stagesDone === stageList.length;
  const canComplete = allGoals && allStages;

  const totalSteps = goals.length + stageList.length;
  const completedSteps = goalsDone + stagesDone;
  const percent = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

  const toggleGoal = (i: number) => {
    const key = goalKey(moduleKey, i);
    if (hasAcknowledged(key)) unacknowledge(key);
    else acknowledge(key);
    onChange?.();
  };
  const toggleStage = (sid: string) => {
    const key = stageKey(moduleKey, sid);
    if (hasAcknowledged(key)) unacknowledge(key);
    else acknowledge(key);
    onChange?.();
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Shadowing</p>
          {done && <Badge variant="secondary" className="text-[10px]"><Check className="mr-0.5 h-3 w-3" /> Complete</Badge>}
        </div>
        <span className="text-[11px] tabular-nums text-muted-foreground">{percent}% · {completedSteps}/{totalSteps}</span>
      </div>
      <Progress value={percent} className="h-1.5" />

      {/* STAGES */}
      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Assigned mentors</p>
        {stageList.length > 1 && (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-3 text-[11px] text-muted-foreground">
            <strong className="text-foreground">Transition scenario:</strong> shadow each mentor in order. Complete a stage's notes and mark it done before moving to the next.
          </div>
        )}
        <ol className="space-y-2.5">
          {stageList.map((s, i) => {
            const isDone = stageChecks[i];
            const prevDone = i === 0 || stageChecks[i - 1];
            const locked = !prevDone;
            const noteId = stageList.length > 1 ? `${moduleKey}:${s.id}` : moduleKey;
            return (
              <li key={s.id} className={cn(
                "rounded-xl border bg-background p-3 transition-all sm:p-4",
                isDone ? "border-emerald-500/30 bg-emerald-500/5" : locked ? "border-border/50 opacity-60" : "border-border/70",
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    isDone ? "bg-emerald-500/20 text-emerald-600" : "bg-primary/10 text-primary",
                  )}>
                    {isDone ? <Check className="h-4 w-4" /> : s.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{s.assignee}</p>
                      <Badge variant="outline" className="text-[10px]"><UserCheck className="mr-0.5 h-3 w-3" /> {s.role}</Badge>
                      {s.days && <Badge variant="secondary" className="text-[10px]"><CalendarDays className="mr-0.5 h-3 w-3" /> {s.days}</Badge>}
                      {i === 0 && stageList.length > 1 && <Badge className="text-[10px]">Stage 1</Badge>}
                      {i === 1 && stageList.length > 1 && <Badge className="text-[10px]">Then →</Badge>}
                    </div>
                    {s.description && <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>}
                    <div className="mt-3">
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Observation notes</p>
                      <Textarea
                        value={notes[noteId] || ""}
                        onChange={(e) => onNotesChange(noteId, e.target.value)}
                        placeholder={`What did you see while shadowing ${s.assignee}?`}
                        rows={3}
                        disabled={locked}
                        className="resize-none text-sm"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {(notes[noteId] || "").trim().length > 0 ? `${(notes[noteId] || "").trim().split(/\s+/).length} words captured` : "Notes required"}
                      </span>
                      <Button
                        size="sm"
                        variant={isDone ? "secondary" : "default"}
                        disabled={locked || (!isDone && !(notes[noteId] || "").trim())}
                        onClick={() => toggleStage(s.id)}
                        className="gap-1.5"
                      >
                        {isDone ? <><Check className="h-3.5 w-3.5" /> Stage complete · uncheck</> : locked ? <><Lock className="h-3.5 w-3.5" /> Locked</> : <>Mark stage complete <ArrowRight className="h-3.5 w-3.5" /></>}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* GOALS CHECKLIST */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Shadowing goals ({goalsDone}/{goals.length})</p>
        <ul className="space-y-1.5">
          {goals.map((g, i) => {
            const checked = goalChecks[i];
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => toggleGoal(i)}
                  className={cn(
                    "group flex w-full items-start gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left text-xs transition-all",
                    checked ? "text-foreground" : "text-muted-foreground hover:border-border/60 hover:bg-muted/40",
                  )}
                >
                  <span className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    checked ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-600" : "border-border bg-background group-hover:border-primary/50",
                  )}>
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <span className={cn(checked && "line-through decoration-muted-foreground/50")}>{g}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* COMPLETE */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border/70 bg-background/60 p-3">
        <p className="text-[11px] text-muted-foreground">
          {done
            ? "Shadowing complete — your observations are saved."
            : canComplete
              ? "All stages and goals checked. You're ready to mark this complete."
              : `Finish all ${stageList.length} stage${stageList.length === 1 ? "" : "s"} and check every goal to unlock completion.`}
        </p>
        <Button
          size="sm"
          variant={done ? "secondary" : "default"}
          disabled={done || !canComplete}
          onClick={onComplete}
          className="gap-1.5"
        >
          {done ? <><Check className="h-3.5 w-3.5" /> Shadowing complete</> : !canComplete ? <><Lock className="h-3.5 w-3.5" /> Mark shadowing complete</> : "Mark shadowing complete"}
        </Button>
      </div>
    </div>
  );
}
