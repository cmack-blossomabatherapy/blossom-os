import { FlaskConical, RotateCcw, X } from "lucide-react";
import {
  LAB_PATHWAY_KEYS, LAB_PATHWAY_LABEL, LAB_PRESETS, LAB_PRESET_LABEL,
  type LabPathwayKey, type LabPreset,
} from "@/lib/rbt/experienceLab";
import { useExperienceLab } from "./useExperienceLab";

/**
 * Superadmin-only Experience Lab control bar. Rendered inside the RBT shell.
 * Non-eligible users see nothing; ineligible sessions cannot open the lab
 * via URL/storage tampering because eligibility is derived from the
 * underlying auth roles every render.
 *
 * Palette: primary/indigo — intentionally NOT amber/yellow, so it does not
 * collide with the real "preview" and "warning" surfaces elsewhere in OS.
 */
export function RbtExperienceLabBar() {
  const lab = useExperienceLab();
  if (!lab.eligible) return null;

  if (!lab.active) {
    return (
      <div className="border-b border-primary/20 bg-primary/[0.04]">
        <div className="mx-auto w-full max-w-3xl md:max-w-5xl px-5 md:px-8 py-2 flex items-center justify-between gap-3 text-xs md:text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <FlaskConical className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="truncate text-muted-foreground">
              RBT Experience Lab is available. Preview any pathway without touching real progress.
            </span>
          </div>
          <button
            type="button"
            onClick={() => lab.enable()}
            className="shrink-0 rounded-full h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            Open Lab
          </button>
        </div>
      </div>
    );
  }

  const state = lab.state!;

  return (
    <div className="border-b border-primary/30 bg-primary/[0.06]" role="region" aria-label="RBT Experience Lab">
      <div className="mx-auto w-full max-w-3xl md:max-w-5xl px-5 md:px-8 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span className="font-medium">Experience Lab</span>
          <span className="text-muted-foreground truncate">· Read-only preview. Nothing is saved.</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1.5">
            <span className="sr-only">Pathway</span>
            <select
              value={state.pathway}
              onChange={(e) => lab.setPathway(e.target.value as LabPathwayKey)}
              className="rounded-full h-8 px-3 pr-7 bg-card border border-border/70 text-xs focus:ring-2 focus:ring-ring outline-none"
              aria-label="Lab pathway"
            >
              {LAB_PATHWAY_KEYS.map((k) => (
                <option key={k} value={k}>{LAB_PATHWAY_LABEL[k]}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <span className="sr-only">Journey stage</span>
            <select
              value={state.preset}
              onChange={(e) => lab.setPreset(e.target.value as LabPreset)}
              className="rounded-full h-8 px-3 pr-7 bg-card border border-border/70 text-xs focus:ring-2 focus:ring-ring outline-none"
              aria-label="Lab stage"
            >
              {LAB_PRESETS.map((p) => (
                <option key={p} value={p}>{LAB_PRESET_LABEL[p]}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={lab.reset}
            className="rounded-full h-8 px-3 text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition flex items-center gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
          </button>
          <button
            type="button"
            onClick={lab.exit}
            className="rounded-full h-8 px-3 text-xs font-medium bg-foreground text-background hover:opacity-90 transition flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" aria-hidden /> Exit
          </button>
        </div>
      </div>
    </div>
  );
}