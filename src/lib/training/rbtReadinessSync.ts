/**
 * Bridge: academy runtime -> RBT readiness module_progress.
 *
 * When an RBT starts or completes an academy module for their own user,
 * we mirror the durable progress into the learner's `rbt_readiness_records`
 * row so the Readiness Board, Academy stats, and RBT reports all read the
 * same source of truth.
 *
 * We do NOT auto-sign readiness signoffs; those remain owner-driven. We
 * only maintain the `module_progress` jsonb and, when appropriate, advance
 * `current_module_id` / `current_phase_index` to the next required module.
 */
import { supabase } from "@/integrations/supabase/client";
import { RBT_PATHS, type RBTPathId, type RBTModule } from "./rbtAcademy";

export interface RuntimeProgressPatch {
  status: "not_started" | "in_progress" | "completed";
  elapsedSeconds?: number;
  startedAt?: string;
  completedAt?: string;
  lastActiveAt?: string;
}

function nextRequiredModule(pathId: RBTPathId, completedModuleId: string) {
  const path = RBT_PATHS.find((p) => p.id === pathId);
  if (!path) return null;
  const flat: { module: RBTModule; phaseIndex: number }[] = [];
  path.phases.forEach((ph, i) => ph.modules.forEach((m) => flat.push({ module: m, phaseIndex: i })));
  const idx = flat.findIndex((f) => f.module.id === completedModuleId);
  if (idx < 0) return null;
  for (let i = idx + 1; i < flat.length; i++) {
    if (flat[i].module.required) return flat[i];
  }
  return null;
}

/**
 * Sync one module's runtime progress into the current user's readiness row.
 * Safe no-op if no readiness row exists for the user.
 */
export async function syncReadinessModuleProgress(
  userId: string,
  sourceModuleId: string,
  patch: RuntimeProgressPatch,
  trackId?: string | null,
): Promise<void> {
  try {
    const { data: rows, error } = await supabase
      .from("rbt_readiness_records")
      .select("id, path_id, current_module_id, current_phase_index, module_progress")
      .eq("user_id", userId)
      .limit(1);
    if (error || !rows || rows.length === 0) return;
    const row = rows[0] as any;
    const mp = { ...((row.module_progress as Record<string, any>) ?? {}) };

    // Track-safe: write progress into a per-track bucket. The active track
    // is the caller-provided trackId, falling back to the row's path_id so
    // legacy call sites don't cross-contaminate other tracks.
    const activeTrack: string | null =
      (trackId ?? (row.path_id as string | undefined) ?? null);
    if (!activeTrack) return; // no safe bucket to write into

    const byTrack: Record<string, Record<string, any>> = {
      ...((mp.byTrack as Record<string, Record<string, any>> | undefined) ?? {}),
    };
    const trackBucket: Record<string, any> = { ...(byTrack[activeTrack] ?? {}) };
    const prev = trackBucket[sourceModuleId] ?? {};
    trackBucket[sourceModuleId] = {
      ...prev,
      status: patch.status,
      progress: patch.status === "completed" ? 100 : patch.status === "in_progress" ? 50 : 0,
      elapsedSeconds: patch.elapsedSeconds ?? prev.elapsedSeconds ?? 0,
      startedAt: patch.startedAt ?? prev.startedAt,
      completedAt: patch.completedAt ?? prev.completedAt,
      lastActiveAt: patch.lastActiveAt ?? prev.lastActiveAt,
    };
    byTrack[activeTrack] = trackBucket;
    mp.byTrack = byTrack;

    const update: Record<string, unknown> = { module_progress: mp };

    // Advance current_module_id to the next required module only when we
    // just completed the module the learner was currently on AND the active
    // track matches the row's assigned path. Never advance a different path.
    if (
      patch.status === "completed" &&
      row.current_module_id === sourceModuleId &&
      row.path_id &&
      activeTrack === row.path_id
    ) {
      const next = nextRequiredModule(row.path_id as RBTPathId, sourceModuleId);
      if (next) {
        update.current_module_id = next.module.id;
        update.current_phase_index = next.phaseIndex;
      }
    }

    await (supabase as any)
      .from("rbt_readiness_records")
      .update(update)
      .eq("id", row.id);
  } catch {
    /* readiness sync is best-effort; runtime write already succeeded */
  }
}