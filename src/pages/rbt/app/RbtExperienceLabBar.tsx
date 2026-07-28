import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, Play, RotateCcw, X, Check } from "lucide-react";
import {
  LAB_PATHWAY_KEYS, LAB_PATHWAY_LABEL, LAB_STAGES, LAB_STAGE_META,
  projectProgram, stageRoute,
  type LabPathwayKey, type LabStage,
} from "@/lib/rbt/experienceLab";
import { useExperienceLab } from "./useExperienceLab";
import { useRbtWalkthrough } from "./useRbtWalkthrough";

/**
 * Superadmin-only Experience Lab control bar. Rendered inside the RBT shell
 * (and inside the walkthrough provider so it can drive the demo tour).
 *
 * Eligibility is derived from the underlying auth roles on every render, so
 * an RBT cannot open the Lab via URL/storage tampering. Nothing here writes
 * to Supabase — all state is synthetic and per-tab.
 */
const SELECT_CLASS =
  "h-9 rounded-full border border-border/70 bg-card px-3 pr-8 text-xs font-medium " +
  "text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring";

const BTN_BASE =
  "inline-flex items-center gap-1.5 rounded-full h-9 px-3.5 text-xs font-medium transition " +
  "outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export function RbtExperienceLabBar() {
  const lab = useExperienceLab();
  const navigate = useNavigate();
  const tour = useRbtWalkthrough();
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const flash = useCallback((msg: string) => {
    setConfirmation(msg);
    window.setTimeout(() => setConfirmation((c) => (c === msg ? null : c)), 4000);
  }, []);

  const onStage = useCallback((stage: LabStage) => {
    lab.setStage(stage);
    navigate(stageRoute(stage));
  }, [lab, navigate]);

  const onReset = useCallback(() => {
    lab.reset();
    tour.restartTour?.();
    navigate("/rbt/app/welcome");
    flash("Reset to a brand-new RBT. Nothing was saved.");
  }, [lab, tour, navigate, flash]);

  const onExit = useCallback(() => {
    lab.exit();
    flash("Left the Experience Lab. No real progress changed.");
  }, [lab, flash]);

  if (!lab.eligible) return null;

  if (!lab.active) {
    return (
      <div className="border-b border-primary/20 bg-primary/[0.04]">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 py-2 text-xs md:max-w-5xl md:px-8 md:text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <FlaskConical className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="truncate text-muted-foreground">
              RBT Experience Lab — demo any pathway or stage without touching real progress.
            </span>
          </div>
          <button
            type="button"
            onClick={() => { lab.enable(); navigate(stageRoute("brand_new")); }}
            className={BTN_BASE + " shrink-0 bg-primary text-primary-foreground hover:opacity-90"}
          >
            Open Lab
          </button>
        </div>
      </div>
    );
  }

  const state = lab.state!;
  const stage: LabStage = state.stage ?? "brand_new";
  const meta = LAB_STAGE_META[stage];
  const proj = projectProgram(state);
  const stageIndex = LAB_STAGES.indexOf(stage) + 1;

  return (
    <div className="border-b border-primary/30 bg-primary/[0.06]" role="region" aria-label="RBT Experience Lab">
      <div className="mx-auto w-full max-w-3xl px-5 py-3 md:max-w-5xl md:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex min-w-0 items-center gap-2 text-xs md:text-sm">
            <FlaskConical className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="font-semibold">Experience Lab</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
              Demo only — nothing saved
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5">
              <span className="sr-only">Training pathway</span>
              <select
                value={state.pathway}
                onChange={(e) => lab.setPathway(e.target.value as LabPathwayKey)}
                className={SELECT_CLASS}
                aria-label="Training pathway"
              >
                {LAB_PATHWAY_KEYS.map((k) => (
                  <option key={k} value={k}>{LAB_PATHWAY_LABEL[k]}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              <span className="sr-only">Lifecycle stage</span>
              <select
                value={stage}
                onChange={(e) => onStage(e.target.value as LabStage)}
                className={SELECT_CLASS}
                aria-label="Lifecycle stage"
              >
                {LAB_STAGES.map((s) => (
                  <option key={s} value={s}>{LAB_STAGE_META[s].label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => tour.openTour()}
              className={BTN_BASE + " bg-primary text-primary-foreground hover:opacity-90"}
            >
              <Play className="h-3.5 w-3.5" aria-hidden /> Play walkthrough
            </button>
            <button
              type="button"
              onClick={() => { tour.restartTour?.(); navigate("/rbt/app/home"); }}
              className={BTN_BASE + " border border-border/70 bg-card hover:bg-muted"}
            >
              Restart first-login tour
            </button>
            <button
              type="button"
              onClick={onReset}
              className={BTN_BASE + " bg-muted text-foreground hover:bg-muted/80"}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
            </button>
            <button
              type="button"
              onClick={onExit}
              className={BTN_BASE + " bg-foreground text-background hover:opacity-90"}
            >
              <X className="h-3.5 w-3.5" aria-hidden /> Exit
            </button>
          </div>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground md:text-xs">
          <span className="font-medium text-foreground">
            Stage {stageIndex} of {LAB_STAGES.length} · {meta.label}
          </span>{" "}
          — {meta.blurb} Showing {LAB_PATHWAY_LABEL[state.pathway]}: step{" "}
          {Math.min(proj.stats.complete + 1, proj.stats.total)} of {proj.stats.total} ({proj.stats.percent}% complete).
          Write actions are disabled while the Lab is on.
        </p>

        {confirmation && (
          <p role="status" aria-live="polite" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
            <Check className="h-3.5 w-3.5" aria-hidden /> {confirmation}
          </p>
        )}
      </div>
    </div>
  );
}